const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

const router = express.Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.emails && profile.emails[0] ? profile.emails[0].value : undefined },
          { googleId: profile.id }
        ].filter(Boolean)
      },
      include: {
        artist: true
      }
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
          include: { artist: true }
        });
      }
      return done(null, user);
    }

    // Create new user
    const baseName = (profile.displayName || 'user').replace(/\s+/g, '').toLowerCase();
    const username = `${baseName}${Math.random().toString(36).slice(2, 7)}`;

    user = await prisma.user.create({
      data: {
        username,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@google.local`,
        googleId: profile.id,
        password: '', // No password for Google users
        isGoogleUser: true
      },
      include: {
        artist: true
      }
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { artist: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Minimal user payload
      const userPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        isGoogleUser: !!user.isGoogleUser,
      };

      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userPayload))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        artist: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is a Google user (no password)
    if (user.isGoogleUser) {
      return res.status(401).json({
        success: false,
        message: 'This account was created with Google. Please use Google Sign-In.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        artist: true,
        products: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        artist: true,
        products: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Test endpoint to verify basic functionality
router.get('/test', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Auth route is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed'
    });
  }
});

// Database test endpoint
router.get('/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to database
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Update username
router.put('/username', async (req, res) => {
  try {
    console.log('Username update request received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { newUsername } = req.body;
    console.log('New username:', newUsername);
    console.log('User ID from token:', decoded.userId);

    // Validate new username
    if (!newUsername || typeof newUsername !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'New username is required'
      });
    }

    // Check username length (minimum 5 characters)
    if (newUsername.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 5 characters long'
      });
    }

    // Check if username contains only valid characters (letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Check if username is already taken
    console.log('Checking if username is taken...');
    const existingUser = await prisma.user.findUnique({
      where: { username: newUsername }
    });
    console.log('Existing user check result:', existingUser);

    if (existingUser && existingUser.id !== decoded.userId) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    console.log('About to update user with ID:', decoded.userId);

    // Update username - simplified version
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { username: newUsername }
    });

    console.log('User updated successfully:', updatedUser);

    // Format user data to match frontend expectations
    const formattedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isGoogleUser: updatedUser.isGoogleUser,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    // Generate new JWT token with updated username
    const newToken = jwt.sign(
      { userId: updatedUser.id, username: updatedUser.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    console.log('Response being sent:', {
      success: true,
      message: 'Username updated successfully',
      data: {
        user: formattedUser,
        token: newToken
      }
    });

    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      data: {
        user: formattedUser,
        token: newToken
      }
    });

  } catch (error) {
    console.error('Update username error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
