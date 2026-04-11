import express from 'express';
import { generateCompanyText, suggestStructure, expandText, generateFullRapportContent } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-company', protect, generateCompanyText);
router.post('/suggest-structure', protect, suggestStructure);
router.post('/expand-text', protect, expandText);
router.post('/generate-full/:rapportId', protect, generateFullRapportContent);

export default router;
