const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create order from cart (checkout)
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Create order and order items in a transaction
    const order = await prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          total,
          shippingAddress,
          status: 'PENDING'
        }
      });

      // Create order items
      const orderItems = await Promise.all(
        cart.items.map(item =>
          prisma.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price
            }
          })
        )
      );

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return { order: newOrder, orderItems };
    });

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.order.id,
        total: order.order.total,
        status: order.order.status,
        shippingAddress: order.order.shippingAddress,
        createdAt: order.order.createdAt,
        items: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            imageUrl: item.product.imageUrl,
            artist: {
              id: item.product.artist.id,
              storeName: item.product.artist.storeName,
              username: item.product.artist.user.username
            }
          }
        }))
      }))
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

// Get specific order
const getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId
      },
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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            imageUrl: item.product.imageUrl,
            artist: {
              id: item.product.artist.id,
              storeName: item.product.artist.storeName,
              username: item.product.artist.user.username
            }
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId,
        status: 'PENDING' // Only pending orders can be cancelled
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder
}; 