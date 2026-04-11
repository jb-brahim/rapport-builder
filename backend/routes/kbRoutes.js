import express from 'express';
import { getKbBlocks, createKbBlock } from '../controllers/kbController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getKbBlocks)
  .post(protect, restrictTo('admin', 'faculty'), createKbBlock);

export default router;
