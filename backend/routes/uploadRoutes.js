import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({
      url: req.file.path,
      message: 'Image uploaded successfully'
    });
  } else {
    res.status(400).json({ message: 'No image uploaded' });
  }
});

export default router;
