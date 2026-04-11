import express from 'express';
import { exportToPdf, exportToDocx } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id/pdf', protect, exportToPdf);
router.get('/:id/docx', protect, exportToDocx);

export default router;
