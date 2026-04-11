import express from 'express';
import { getTemplates, getTemplateById, submitTemplate } from '../controllers/templateController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getTemplates)
  .post(protect, restrictTo('admin', 'faculty'), submitTemplate);

router.route('/:id').get(getTemplateById);

export default router;
