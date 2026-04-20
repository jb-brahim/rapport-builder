import express from 'express';
import { addComment, getCommentsByRapport, replyToComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', addComment);
router.get('/:rapportId', getCommentsByRapport);
router.post('/:commentId/reply', replyToComment);

export default router;
