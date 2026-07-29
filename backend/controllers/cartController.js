const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user's cart
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

    res.json({
      success: true,
      cart: {
        id: cart.id,
        items: cart.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            price: item.product.price,
            imageUrl: item.product.imageUrl,
            artist: {
              id: item.product.artist.id,
              storeName: item.product.artist.storeName,
              username: item.product.artist.user.username
            }
          }
        })),
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      }
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

// Add item to cart
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

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        artist: true
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
          productId: parseInt(productId)
        }
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
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
      });
    } else {
      // Add new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parseInt(productId),
          quantity
        },
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
      });
    }

    res.json({
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
          artist: {
            id: cartItem.product.artist.id,
            storeName: cartItem.product.artist.storeName,
            username: cartItem.product.artist.user.username
          }
        }
      }
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

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(itemId),
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
      where: { id: parseInt(itemId) },
      data: { quantity },
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
    });

    res.json({
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
          artist: {
            id: updatedItem.product.artist.id,
            storeName: updatedItem.product.artist.storeName,
            username: updatedItem.product.artist.user.username
          }
        }
      }
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

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(itemId),
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
      where: { id: parseInt(itemId) }
    });

    res.json({
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

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove all items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({
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