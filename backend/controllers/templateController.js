import Template from '../models/Template.js';

// @desc    Get all approved templates
// @route   GET /api/templates
// @access  Public
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ status: 'approved' });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Public
const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ message: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a new template
// @route   POST /api/templates
// @access  Private (Faculty/Admin)
const submitTemplate = async (req, res) => {
  try {
    const { name, university, country, language, schema } = req.body;

    const template = new Template({
      name,
      university,
      country,
      language,
      schema,
      submittedBy: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    const createdTemplate = await template.save();
    res.status(201).json(createdTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getTemplates, getTemplateById, submitTemplate };
