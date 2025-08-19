const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get artist profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        artist: {
          include: {
            products: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      select: {
        id: true,
        username: true,
        artist: {
          include: {
            products: true
          }
        }
      }
    });

    if (!user || !user.artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        artist: user.artist,
        products: user.artist.products
      }
    });

  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create artist profile (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bio, storeName } = req.body;
    const userId = req.user.userId;

    // Check if user already has an artist profile
    const existingArtist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (existingArtist) {
      return res.status(400).json({
        success: false,
        message: 'Artist profile already exists'
      });
    }

    // Validate input
    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }

    // Create artist profile
    const artist = await prisma.artist.create({
      data: {
        userId,
        bio,
        storeName
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully',
      data: { artist }
    });

  } catch (error) {
    console.error('Create artist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update artist profile (authenticated)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { bio, storeName } = req.body;
    const userId = req.user.userId;

    // Find existing artist profile
    const existingArtist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!existingArtist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    // Update artist profile
    const artist = await prisma.artist.update({
      where: { userId },
      data: {
        bio,
        storeName
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Artist profile updated successfully',
      data: { artist }
    });

  } catch (error) {
    console.error('Update artist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all artists
router.get('/', async (req, res) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        },
        products: {
          take: 3,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: { artists }
    });

  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
