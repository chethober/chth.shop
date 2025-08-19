const { Product, Artist, User } = require('../models');
const { Op } = require('sequelize');

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, artist } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [{
        model: Artist,
        as: 'artist',
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }],
        where: artist ? {
          '$artist.user.username$': artist
        } : undefined
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        products: products.rows,
        pagination: {
          total: products.count,
          page: parseInt(page),
          pages: Math.ceil(products.count / limit),
          hasNext: (page * limit) < products.count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [{
        model: Artist,
        as: 'artist',
        include: [{
          model: User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }]
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
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, type, price, imageUrl, customization } = req.body;
    const userId = req.userId;

    // Validate input
    if (!name || !type || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, type, and price'
      });
    }

    // Check if user is an artist
    const artist = await Artist.findOne({
      where: { userId }
    });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: 'Only artists can create products'
      });
    }

    // Create product
    const newProduct = await Product.create({
      name,
      type,
      price: parseFloat(price),
      imageUrl,
      artistId: artist.id,
      customization: customization || {}
    });

    // Fetch the created product with artist info
    const productWithArtist = await Product.findByPk(newProduct.id, {
      include: [{
        model: Artist,
        as: 'artist',
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: productWithArtist }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, price, imageUrl, customization, isActive } = req.body;
    const userId = req.userId;

    // Find product
    const product = await Product.findByPk(id, {
      include: [{
        model: Artist,
        as: 'artist'
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns this product
    if (product.artist.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }

    // Update product
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (customization !== undefined) updateData.customization = customization;
    if (isActive !== undefined) updateData.isActive = isActive;

    await product.update(updateData);

    // Fetch updated product with artist info
    const updatedProduct = await Product.findByPk(id, {
      include: [{
        model: Artist,
        as: 'artist',
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      }]
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
      message: 'Internal server error'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find product
    const product = await Product.findByPk(id, {
      include: [{
        model: Artist,
        as: 'artist'
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns this product
    if (product.artist.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }

    // Soft delete (set isActive to false)
    await product.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getUserProducts = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Find user's artist profile
    const artist = await Artist.findOne({
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
            pages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    // Get user's products
    const products = await Product.findAndCountAll({
      where: { artistId: artist.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        products: products.rows,
        pagination: {
          total: products.count,
          page: parseInt(page),
          pages: Math.ceil(products.count / limit),
          hasNext: (page * limit) < products.count,
          hasPrev: page > 1
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
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts
};
