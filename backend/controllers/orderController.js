const prisma = require('../lib/prisma');

// Helper to format order output
const formatOrder = (order) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  total: order.total,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: (order.items || []).map(item => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      type: item.product.type,
      imageUrl: item.product.imageUrl,
      artist: item.product.artist ? {
        id: item.product.artist.id,
        storeName: item.product.artist.storeName,
        username: item.product.artist.user ? item.product.artist.user.username : ''
      } : null
    } : null
  }))
});

// POST /api/orders or POST /api/orders/checkout - Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { shippingAddress, items: directItems } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // If direct items provided in body, use them; otherwise fetch from user's cart
    let orderItemsToCreate = [];
    let cartToClear = null;

    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      // Validate direct items
      for (const item of directItems) {
        const prod = await prisma.product.findUnique({ where: { id: String(item.productId) } });
        if (!prod) {
          return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        }
        orderItemsToCreate.push({
          productId: prod.id,
          quantity: parseInt(item.quantity || 1, 10),
          price: prod.price
        });
      }
    } else {
      // Get user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      orderItemsToCreate = cart.items.map(ci => ({
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.product ? ci.product.price : 0
      }));
      cartToClear = cart.id;
    }

    const total = parseFloat(
      orderItemsToCreate.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
    );

    // Create order and order items in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          total,
          shippingAddress,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: {
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
          }
        }
      });

      // Clear cart items if checkout from cart
      if (cartToClear) {
        await tx.cartItem.deleteMany({
          where: { cartId: cartToClear }
        });
      }

      return createdOrder;
    });

    const formatted = formatOrder(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: formatted,
      data: { order: formatted }
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

// GET /api/orders - Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedOrders = orders.map(formatOrder);

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      data: { orders: formattedOrders }
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

// GET /api/orders/:orderId - Get single order details
const getOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: String(orderId),
        userId
      },
      include: {
        items: {
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
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const formatted = formatOrder(order);

    res.status(200).json({
      success: true,
      order: formatted,
      data: { order: formatted }
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

// PUT /api/orders/:orderId/cancel - Cancel pending order
const cancelOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: String(orderId),
        userId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status.toLowerCase()}`
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: { status: 'CANCELLED' },
      include: {
        items: {
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
        }
      }
    });

    const formatted = formatOrder(updatedOrder);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: formatted,
      data: { order: formatted }
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

// PUT /api/orders/:orderId/status - Update order status (for admin/fulfillment)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, shippingAddress } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(shippingAddress !== undefined ? { shippingAddress } : {})
      },
      include: {
        items: {
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
        }
      }
    });

    const formatted = formatOrder(updatedOrder);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: formatted,
      data: { order: formatted }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// DELETE /api/orders/:orderId - Delete order
const deleteOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: String(orderId),
        userId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await prisma.order.delete({
      where: { id: String(orderId) }
    });

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  deleteOrder
};