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
      message: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Delete user account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Use a transaction to ensure all or nothing deletion
    await prisma.$transaction(async (tx) => {
      // Find artist profile
      const artist = await tx.artist.findUnique({
        where: { userId },
      });

      if (artist) {
        // Delete all products by this artist
        await tx.product.deleteMany({
          where: { artistId: artist.id },
        });

        // Delete artist profile
        await tx.artist.delete({
          where: { id: artist.id },
        });
      }

      // Delete user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
