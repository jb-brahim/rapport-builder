import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, updateUserPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/password', protect, updateUserPassword);
router.get('/supervisors', protect, getSupervisors);

export default router;
