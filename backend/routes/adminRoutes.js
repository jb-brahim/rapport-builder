import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllReports,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  toggleAnnouncement
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getAdminStats);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.get('/reports', getAllReports);

router.route('/announcements')
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route('/announcements/:id')
  .delete(deleteAnnouncement);

router.patch('/announcements/:id/toggle', toggleAnnouncement);

export default router;
