import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

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
    if (name && !compiledProfile.name) compiledProfile.name = name; // ensure name is in profile

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
        language: user.language
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
    expires: new Date(0)
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
      language: user.language
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export { registerUser, loginUser, logoutUser, getUserProfile };
