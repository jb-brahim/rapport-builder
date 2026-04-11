import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import rapportRoutes from './routes/rapportRoutes.js';
import kbRoutes from './routes/kbRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import wizardRoutes from './routes/wizardRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust the proxy (Render's load balancer) so secure cookies can be set over "HTTP"
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL, 
      'http://localhost:3000', 
      'https://rapport-builder.vercel.app'
    ].filter(Boolean),
    credentials: true,
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/wizard', wizardRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('PFE Rapport Builder API is running...');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
