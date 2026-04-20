import Comment from '../models/Comment.js';
import Rapport from '../models/Rapport.js';

// @desc    Add a comment to a rapport
// @route   POST /api/comments
// @access  Private (Student, Supervisor, Admin)
const addComment = async (req, res) => {
  try {
    const { rapportId, sectionId, text, status } = req.body;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    // Check permissions
    const isOwner = rapport.userId.toString() === req.user._id.toString();
    const isSupervisor = rapport.supervisorId?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'faculty'].includes(req.user.role);

    if (!isOwner && !isSupervisor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to comment on this rapport' });
    }

    const comment = new Comment({
      rapportId,
      sectionId,
      authorId: req.user._id,
      authorName: req.user.name || req.user.profile?.name || req.user.email,
      text,
      status: status || 'open'
    });

    const createdComment = await comment.save();
    res.status(201).json(createdComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a rapport
// @route   GET /api/comments/:rapportId
// @access  Private
const getCommentsByRapport = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    // Check permissions
    const isOwner = rapport.userId.toString() === req.user._id.toString();
    const isSupervisor = rapport.supervisorId?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'faculty'].includes(req.user.role);

    if (!isOwner && !isSupervisor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const comments = await Comment.find({ rapportId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
const replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const threadItem = {
      authorId: req.user._id,
      authorName: req.user.name || req.user.profile?.name || req.user.email,
      text,
      createdAt: new Date()
    };

    comment.thread.push(threadItem);
    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { addComment, getCommentsByRapport, replyToComment };
