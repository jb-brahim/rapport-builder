import Rapport from '../models/Rapport.js';

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
    const rapports = await Rapport.find({ userId: req.user._id }).populate('templateId', 'name');
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
      if (rapport.userId.toString() !== req.user._id.toString() && req.user.role === 'student') {
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

export { createRapport, getRapports, getRapportById, autoSaveRapport, deleteRapport };
