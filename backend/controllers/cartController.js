const prisma = require('../lib/prisma');

// Helper to format cart response
const formatCartResponse = (cart) => {
  if (!cart) {
    return {
      id: null,
      items: [],
      totalItems: 0,
      totalPrice: 0
    };
  }

  const items = (cart.items || []).map(item => ({
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      type: item.product.type,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      artist: item.product.artist ? {
        id: item.product.artist.id,
        storeName: item.product.artist.storeName,
        username: item.product.artist.user ? item.product.artist.user.username : ''
      } : null
    } : null
  }));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.product ? item.product.price : 0;
    return sum + (price * item.quantity);
  }, 0);

  return {
    id: cart.id,
    items,
    totalItems,
    totalPrice: parseFloat(totalPrice.toFixed(2))
  };
};

// GET /api/cart - Get user's cart
const getUserCart = async (req, res) => {
  try {
    const userId = req.userId;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
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
    }

    const formattedCart = formatCartResponse(cart);

    res.status(200).json({
      success: true,
      cart: formattedCart,
      data: { cart: formattedCart }
    });
  } catch (error) {
    console.error('Error getting user cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

// POST /api/cart or POST /api/cart/add - Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: String(productId) },
      include: {
        artist: {
          include: {
            user: {
              select: { username: true }
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

    // Get or create user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: String(productId)
        }
      }
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
        include: {
          product: {
            include: {
              artist: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          }
        }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: String(productId),
          quantity: qty
        },
        include: {
          product: {
            include: {
              artist: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cartItem: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          id: cartItem.product.id,
          name: cartItem.product.name,
          type: cartItem.product.type,
          price: cartItem.product.price,
          imageUrl: cartItem.product.imageUrl,
          artist: cartItem.product.artist ? {
            id: cartItem.product.artist.id,
            storeName: cartItem.product.artist.storeName,
            username: cartItem.product.artist.user?.username
          } : null
        }
      },
      data: { cartItem }
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// PUT /api/cart/items/:itemId - Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required (minimum 1)'
      });
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: String(itemId),
        cart: {
          userId
        }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: String(itemId) },
      data: { quantity: qty },
      include: {
        product: {
          include: {
            artist: {
              include: {
                user: {
                  select: { username: true }
                }
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      cartItem: {
        id: updatedItem.id,
        productId: updatedItem.productId,
        quantity: updatedItem.quantity,
        product: {
          id: updatedItem.product.id,
          name: updatedItem.product.name,
          type: updatedItem.product.type,
          price: updatedItem.product.price,
          imageUrl: updatedItem.product.imageUrl,
          artist: updatedItem.product.artist ? {
            id: updatedItem.product.artist.id,
            storeName: updatedItem.product.artist.storeName,
            username: updatedItem.product.artist.user?.username
          } : null
        }
      },
      data: { cartItem: updatedItem }
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// DELETE /api/cart/items/:itemId - Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: String(itemId),
        cart: {
          userId
        }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Remove item
    await prisma.cartItem.delete({
      where: { id: String(itemId) }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// DELETE /api/cart or DELETE /api/cart/clear - Clear all cart items
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};