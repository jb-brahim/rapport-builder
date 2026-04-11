import KnowledgeBase from '../models/KnowledgeBase.js';

// @desc    Get Knowledge Base blocks based on filters
// @route   GET /api/kb
// @access  Private (Student)
const getKbBlocks = async (req, res) => {
  try {
    const { type, tags, domain, sector } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (tags) query.tags = { $in: tags.split(',') };
    if (domain) query.domain = { $in: domain.split(',') };
    if (sector) query.sector = { $in: sector.split(',') };

    const blocks = await KnowledgeBase.find(query).limit(50);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a Knowledge Base block
// @route   POST /api/kb
// @access  Private (Admin/Faculty)
const createKbBlock = async (req, res) => {
  try {
    const { type, sector, domain, tags, content } = req.body;
    
    // Simple mock hash for future plagiarism check (edit distance)
    const originalHash = Buffer.from(content.FR || content.EN || 'empty').toString('base64');

    const block = new KnowledgeBase({
      type,
      sector,
      domain,
      tags,
      content,
      originalHash
    });

    const createdBlock = await block.save();
    res.status(201).json(createdBlock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getKbBlocks, createKbBlock };
