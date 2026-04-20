import express from 'express';
import { addCitation, getCitationsByRapport, deleteCitation } from '../controllers/citationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', addCitation);
router.get('/:rapportId', getCitationsByRapport);
router.delete('/:id', deleteCitation);

export default router;
