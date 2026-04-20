import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, profile, language } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const compiledProfile = profile || { name };
    if (name && !compiledProfile.name) compiledProfile.name = name; 

    // Generate Gravatar URL if no photo setup
    if (!compiledProfile.photoUrl) {
      const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      compiledProfile.photoUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
    }

    const user = await User.create({
      email,
      passwordHash: password, // Pre-save hook hashes it
      role: role || 'student',
      profile: compiledProfile,
      language: language || 'FR'
    });

    if (user) {
      generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        language: user.language
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        language: user.language,
        writingStreak: user.writingStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastActiveAt: user.lastActiveAt
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: true,
    sameSite: 'none'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      language: user.language,
      writingStreak: user.writingStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActiveAt: user.lastActiveAt
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.profile.name = req.body.name || user.profile.name;
      user.profile.photoUrl = req.body.photoUrl || user.profile.photoUrl;

      // Fallback if photo was cleared or is missing
      if (!user.profile.photoUrl) {
        const hash = crypto.createHash('md5').update(user.email.toLowerCase().trim()).digest('hex');
        user.profile.photoUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
      }

      user.profile.bio = req.body.bio !== undefined ? req.body.bio : user.profile.bio;
      user.profile.university = req.body.university || user.profile.university;
      user.profile.dept = req.body.dept || user.profile.dept;
      user.profile.year = req.body.year || user.profile.year;
      user.language = req.body.language || user.language;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
        language: updatedUser.language
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.passwordHash = newPassword; // Pre-save hook hashes it
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with supervisor/faculty role
// @route   GET /api/auth/supervisors
// @access  Private
const getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: { $in: ['faculty', 'supervisor', 'admin'] } }).select('profile.name email role');
    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update googleId if not present (link existing account)
      if (!user.googleId) user.googleId = googleId;
      // Update photo if missing
      if (!user.profile.photoUrl) user.profile.photoUrl = picture;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        googleId,
        role: 'student',
        profile: {
          name,
          photoUrl: picture || `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')}?d=identicon&s=200`
        }
      });
    }

    generateToken(res, user._id);

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      language: user.language,
      writingStreak: user.writingStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActiveAt: user.lastActiveAt
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

export { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, updateUserPassword, getSupervisors, googleLogin };
