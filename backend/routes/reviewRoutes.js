import express from 'express';
import { generateShareToken, getReviewRapport, addComment, replyToComment } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate/:rapportId', protect, generateShareToken);
router.get('/:token', getReviewRapport);
router.post('/:token/comments', addComment);
router.post('/:token/comments/:commentId/reply', replyToComment);

export default router;
