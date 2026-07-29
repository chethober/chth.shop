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

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        artist: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get products by artist username
router.get('/artist/:username', async (req, res) => {
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
    console.error('Get artist products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new product (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, price, imageUrl } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!name || !type || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and price are required'
      });
    }

    // Check if user is an artist
    const artist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can create products'
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        imageUrl,
        artistId: artist.id
      },
      include: {
        artist: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user's products (authenticated)
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find artist profile first to get the artist.id
    const artist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!artist) {
      // If they are not an artist, return empty products array
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          pagination: {
            total: 0,
            page: 1,
            pages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    const products = await prisma.product.findMany({
      where: { artistId: artist.id },
      include: {
        artist: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total: products.length,
          page: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });

  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        artist: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
