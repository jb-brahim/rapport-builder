import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rapport_builder',
    allowedFormats: ['jpeg', 'png', 'jpg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }] // Auto-resize as per spec
  }
});

const upload = multer({ storage });

export { upload, cloudinary };
