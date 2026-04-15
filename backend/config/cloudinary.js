import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  console.log('☁️  Cloudinary configuration detected. Initializing remote storage...');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'rapport_builder',
      allowedFormats: ['jpeg', 'png', 'jpg'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
  });
} else {
  console.warn('⚠️  CLOUDINARY_CLOUD_NAME missing. Falling back to LOCAL storage (non-persistent on Render).');
  // Local storage fallback
  const uploadDir = 'uploads/';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
}

const upload = multer({ storage });

export { upload, cloudinary };
