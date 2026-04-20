import express from 'express';
import { createRapport, getRapports, getRapportById, autoSaveRapport, deleteRapport } from '../controllers/rapportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getRapports)
  .post(protect, restrictTo('student', 'admin', 'faculty'), createRapport);

router.route('/:id')
  .get(protect, getRapportById)
  .delete(protect, restrictTo('student', 'admin'), deleteRapport);

router.route('/:id/autosave').patch(protect, restrictTo('student', 'admin'), autoSaveRapport);
router.route('/:id/heartbeat').post(protect, updateHeartbeat);

export default router;
