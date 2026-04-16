import express from 'express';
import { getActiveAnnouncements } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// General users can only see active announcements
router.get('/active', protect, getActiveAnnouncements);

export default router;
