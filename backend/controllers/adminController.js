import User from '../models/User.js';
import Rapport from '../models/Rapport.js';
import Announcement from '../models/Announcement.js';
import asyncHandler from 'express-async-handler';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalReports = await Rapport.countDocuments();
  const reportsByStatus = await Rapport.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  res.json({
    totalUsers,
    totalReports,
    reportsByStatus,
    userGrowth
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot delete an admin user');
    }
    
    // Also delete their reports
    await Rapport.deleteMany({ userId: user._id });
    await user.deleteOne();
    
    res.json({ message: 'User and their reports removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all reports across platform
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Rapport.find({})
    .populate('userId', 'name email profile.name')
    .sort({ updatedAt: -1 });
  res.json(reports);
});

// @desc    Create system announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, expiresAt } = req.body;

  const announcement = await Announcement.create({
    title,
    content,
    type,
    expiresAt,
    createdBy: req.user._id
  });

  res.status(201).json(announcement);
});

// @desc    Get all announcements (for management)
// @route   GET /api/admin/announcements
// @access  Private/Admin
export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({}).sort({ createdAt: -1 });
  res.json(announcements);
});

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (announcement) {
    await announcement.deleteOne();
    res.json({ message: 'Announcement removed' });
  } else {
    res.status(404);
    throw new Error('Announcement not found');
  }
});

// @desc    Toggle announcement status
// @route   PATCH /api/admin/announcements/:id/toggle
// @access  Private/Admin
export const toggleAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (announcement) {
    announcement.isActive = !announcement.isActive;
    await announcement.save();
    res.json(announcement);
  } else {
    res.status(404);
    throw new Error('Announcement not found');
  }
});

// @desc    Get active announcements for users
// @route   GET /api/announcements/active
// @access  Private
export const getActiveAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ 
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
  
  res.json(announcements);
});

