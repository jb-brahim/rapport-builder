import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file) {
    let url = req.file.path;
    
    // If it's a local path (not a Cloudinary URL), prepend the backend host
    if (!url.startsWith('http')) {
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.get('host');
      const cleanPath = url.replace(/\\/g, '/');
      url = `${protocol}://${host}/${cleanPath}`;
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
