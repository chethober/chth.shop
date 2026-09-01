const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me - Get user details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        artist: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    delete user.password;

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/users/me - Delete user account (with cascade)
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

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

      // Delete cart and items
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.delete({ where: { id: cart.id } });
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
      error: error.message
    });
  }
});

module.exports = router;
