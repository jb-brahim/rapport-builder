import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file) {
    let url = req.file.path;
    // If local storage was used, path might be 'uploads/filename' or 'uploads\\filename'
    if (!url.startsWith('http')) {
      url = `/${url.replace(/\\/g, '/')}`;
    }
    
    res.json({
      url,
      message: 'Image uploaded successfully'
    });
  } else {
    res.status(400).json({ message: 'No image uploaded' });
  }
});

export default router;
