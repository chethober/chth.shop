const { Artist, User, Product } = require('../models');
const { Op } = require('sequelize');

const getArtistByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const artist = await Artist.findOne({
      include: [{
        model: User,
        as: 'user',
        where: { username: username.toLowerCase() },
        attributes: ['username', 'email']
      }, {
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false
      }]
    });

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { artist }
    });

  } catch (error) {
    console.error('Get artist by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createArtistProfile = async (req, res) => {
  try {
    const { bio, storeName } = req.body;
    const userId = req.userId;

    // Validate input
    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }

    // Check if user already has an artist profile
    const existingArtist = await Artist.findOne({
      where: { userId }
    });

    if (existingArtist) {
      return res.status(409).json({
        success: false,
        message: 'Artist profile already exists'
      });
    }

    // Create artist profile
    const newArtist = await Artist.create({
      userId,
      bio: bio || '',
      storeName
    });

    // Update user to mark as artist
    await User.update(
      { isArtist: true },
      { where: { id: userId } }
    );

    // Fetch the created artist with user info
    const artistWithUser = await Artist.findByPk(newArtist.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully',
      data: { artist: artistWithUser }
    });

  } catch (error) {
    console.error('Create artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateArtistProfile = async (req, res) => {
  try {
    const { bio, storeName } = req.body;
    const userId = req.userId;

    // Find artist profile
    const artist = await Artist.findOne({
      where: { userId }
    });

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    // Update artist profile
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (storeName !== undefined) updateData.storeName = storeName;

    await artist.update(updateData);

    // Fetch updated artist with user info
    const updatedArtist = await Artist.findByPk(artist.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Artist profile updated successfully',
      data: { artist: updatedArtist }
    });

  } catch (error) {
    console.error('Update artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const acceptContract = async (req, res) => {
  try {
    const userId = req.userId;

    // Find or create artist profile
    let artist = await Artist.findOne({
      where: { userId }
    });

    if (!artist) {
      // Create basic artist profile if doesn't exist
      const user = await User.findByPk(userId);
      artist = await Artist.create({
        userId,
        bio: '',
        storeName: `${user.username}'s Store`,
        contractAccepted: true,
        contractAcceptedAt: new Date()
      });

      // Update user to mark as artist
      await User.update(
        { isArtist: true },
        { where: { id: userId } }
      );
    } else {
      // Update existing artist profile
      await artist.update({
        contractAccepted: true,
        contractAcceptedAt: new Date()
      });
    }

    // Fetch updated artist with user info
    const updatedArtist = await Artist.findByPk(artist.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Contract accepted successfully',
      data: { artist: updatedArtist }
    });

  } catch (error) {
    console.error('Accept contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getAllArtists = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const artists = await Artist.findAndCountAll({
      where: { contractAccepted: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['username']
      }, {
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false,
        limit: 3 // Just show a few products as preview
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        artists: artists.rows,
        pagination: {
          total: artists.count,
          page: parseInt(page),
          pages: Math.ceil(artists.count / limit),
          hasNext: (page * limit) < artists.count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getArtistByUsername,
  createArtistProfile,
  updateArtistProfile,
  acceptContract,
  getAllArtists
};
