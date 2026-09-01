const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Get all products with optional filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, artist, search, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (type) {
      where.type = type;
    }
    if (artist) {
      where.artist = {
        user: {
          username: artist
        }
      };
    }
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.product.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
          hasNext: skip + products.length < total,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/products/artist/:username - Get products by artist username
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/products/user/me - Get current user's products (authenticated)
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const artist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!artist) {
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: {
        artist: {
          include: {
            user: {
              select: {
                username: true,
                email: true
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/products - Create new product (authenticated artist)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, price, imageUrl } = req.body;
    const userId = req.userId;

    if (!name || !type || price === undefined) {
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
        imageUrl: imageUrl || null,
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update product (authenticated owner)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, price, imageUrl } = req.body;
    const userId = req.userId;

    const artist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can manage products'
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: String(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (existingProduct.artistId !== artist.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {})
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

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product (authenticated owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const artist = await prisma.artist.findUnique({
      where: { userId }
    });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can manage products'
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: String(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (existingProduct.artistId !== artist.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this product'
      });
    }

    await prisma.product.delete({
      where: { id: String(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
