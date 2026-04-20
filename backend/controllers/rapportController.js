import Rapport from '../models/Rapport.js';
import User from '../models/User.js';

// @desc    Create new rapport
// @route   POST /api/rapports
// @access  Private (Student)
const createRapport = async (req, res) => {
  try {
    const { templateId, wizardAnswers } = req.body;
    
    const rapport = new Rapport({
      userId: req.user._id,
      templateId,
      wizardAnswers: wizardAnswers || {},
      currentStep: 1,
      status: 'draft'
    });

    const createdRapport = await rapport.save();
    res.status(201).json(createdRapport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user rapports
// @route   GET /api/rapports
// @access  Private (Student)
const getRapports = async (req, res) => {
  try {
    let query = { userId: req.user._id };
    
    if (req.user.role === 'supervisor') {
      query = { supervisorId: req.user._id };
    } else if (req.user.role === 'admin' || req.user.role === 'faculty') {
      query = {}; // Admins can see all
    }

    const rapports = await Rapport.find(query).populate('templateId', 'name').populate('userId', 'profile.name email');
    res.json(rapports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rapport by ID
// @route   GET /api/rapports/:id
// @access  Private
const getRapportById = async (req, res) => {
  try {
    const rapport = await Rapport.findById(req.params.id).populate('templateId', 'name schema');

    if (rapport) {
      const isOwner = rapport.userId.toString() === req.user._id.toString();
      const isSupervisor = rapport.supervisorId?.toString() === req.user._id.toString();
      const isAdmin = ['admin', 'faculty'].includes(req.user.role);

      if (!isOwner && !isSupervisor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this rapport' });
      }
      res.json(rapport);
    } else {
      res.status(404).json({ message: 'Rapport not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auto-save rapport
// @route   PATCH /api/rapports/:id/autosave
// @access  Private (Student)
const autoSaveRapport = async (req, res) => {
  try {
    const { currentStep, wizardAnswers, stepCompletion, visualLayout } = req.body;
    
    const rapport = await Rapport.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { currentStep, wizardAnswers, stepCompletion, visualLayout } },
      { new: true, runValidators: true }
    );

    if (rapport) {
      // --- Update Writing Streak ---
      const user = await User.findById(req.user._id);
      if (user) {
        const now = new Date();
        const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
        
        if (!lastActive) {
          user.writingStreak = 1;
        } else {
          // Calculate difference in calendar days
          const diffTime = now.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            user.writingStreak += 1;
          } else if (diffDays > 1) {
            user.writingStreak = 1;
          }
          // if diffDays === 0, keep current streak
        }
        
        user.lastActiveAt = new Date();
        if (user.writingStreak > user.longestStreak) {
          user.longestStreak = user.writingStreak;
        }
        await user.save();
      }

      res.json({ message: 'Auto-saved successfully', lastSavedAt: rapport.lastSavedAt });
    } else {
      res.status(404).json({ message: 'Rapport not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete rapport
// @route   DELETE /api/rapports/:id
// @access  Private (Student)
const deleteRapport = async (req, res) => {
  try {
    const rapport = await Rapport.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (rapport) {
      res.json({ message: 'Rapport deleted successfully' });
    } else {
      res.status(404).json({ message: 'Rapport not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update rapport heartbeat (presence)
// @route   POST /api/rapports/:id/heartbeat
// @access  Private
const updateHeartbeat = async (req, res) => {
  try {
    const rapport = await Rapport.findById(req.params.id);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    // Clean up old viewers (> 3 min)
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
    rapport.activeViewers = (rapport.activeViewers || []).filter(v => v.lastActive && v.lastActive > threeMinAgo);

    // Update or Add current user
    const viewerIdx = rapport.activeViewers.findIndex(v => v.userId.toString() === req.user._id.toString());
    if (viewerIdx > -1) {
      rapport.activeViewers[viewerIdx].lastActive = new Date();
    } else {
      rapport.activeViewers.push({ userId: req.user._id, lastActive: new Date() });
    }

    await rapport.save();
    
    // Return other active viewers (populated)
    const populated = await Rapport.findById(req.params.id).populate('activeViewers.userId', 'profile.name profile.photoUrl');
    const others = (populated.activeViewers || []).filter(v => v.userId && v.userId._id.toString() !== req.user._id.toString());
    
    res.json(others);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createRapport, getRapports, getRapportById, autoSaveRapport, deleteRapport, updateHeartbeat };
