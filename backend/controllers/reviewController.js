import jwt from 'jsonwebtoken';
import ShareToken from '../models/ShareToken.js';
import Rapport from '../models/Rapport.js';
import Comment from '../models/Comment.js';

// @desc    Generate a share token for a rapport
// @route   POST /api/reviews/generate/:rapportId
// @access  Private (Student owner)
const generateShareToken = async (req, res) => {
  try {
    const rapport = await Rapport.findOne({ _id: req.params.rapportId, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    const tokenStr = jwt.sign({ rapportId: rapport._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const shareToken = new ShareToken({
      token: tokenStr,
      rapportId: rapport._id,
      expiresAt
    });

    const createdToken = await shareToken.save();
    
    res.status(201).json({ 
      shareUrl: `/review/${tokenStr}`,
      expiresAt: createdToken.expiresAt 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rapport details via share token
// @route   GET /api/reviews/:token
// @access  Public (Guest Reviewer)
const getReviewRapport = async (req, res) => {
  try {
    const { token } = req.params;
    
    const shareToken = await ShareToken.findOne({ token, revokedAt: null });
    if (!shareToken) return res.status(404).json({ message: 'Invalid or revoked link' });
    if (new Date() > shareToken.expiresAt) return res.status(401).json({ message: 'Link expired' });

    jwt.verify(token, process.env.JWT_SECRET);

    const rapport = await Rapport.findById(shareToken.rapportId).populate('templateId', 'name schema');
    if (!rapport) return res.status(404).json({ message: 'Rapport no longer exists' });

    const comments = await Comment.find({ rapportId: rapport._id });

    res.json({ rapport, comments });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// @desc    Add a comment to a rapport section
// @route   POST /api/reviews/:token/comments
// @access  Public (Guest Reviewer)
const addComment = async (req, res) => {
  try {
    const { token } = req.params;
    const { sectionId, authorName, text, status } = req.body;

    const shareToken = await ShareToken.findOne({ token, revokedAt: null });
    if (!shareToken) return res.status(404).json({ message: 'Invalid or revoked link' });
    if (new Date() > shareToken.expiresAt) return res.status(401).json({ message: 'Link expired' });

    const comment = new Comment({
      rapportId: shareToken.rapportId,
      sectionId,
      authorName,
      text,
      status: status || 'open'
    });

    const createdComment = await comment.save();
    res.status(201).json(createdComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to an existing comment thread
// @route   POST /api/reviews/:token/comments/:commentId/reply
// @access  Public
const replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { authorName, text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.thread.push({ authorName, text });
    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { generateShareToken, getReviewRapport, addComment, replyToComment };
