import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  saveCoverPage,
  getDedicaceTemplates,
  saveDedicace,
  getRemerciementsTemplates,
  saveRemerciements,
  getTableOfContents,
  saveIntroduction,
  saveChapter,
  deleteChapter,
  reorderChapters,
  saveConclusion,
  getWizardState
} from '../controllers/wizardController.js';

const router = express.Router();

// All wizard routes require authentication
router.use(protect);

// GET full wizard state
router.get('/:id/state', getWizardState);

// Step 1 — Cover Page
router.post('/:id/cover', saveCoverPage);

// Step 2 — Dédicace
router.get('/:id/dedicace/templates', getDedicaceTemplates);
router.post('/:id/dedicace', saveDedicace);

// Step 3 — Remerciements
router.get('/:id/remerciements/templates', getRemerciementsTemplates);
router.post('/:id/remerciements', saveRemerciements);

// Step 4 — Table of Contents (auto-generated)
router.get('/:id/toc', getTableOfContents);

// Step 5 — Introduction Générale
router.post('/:id/introduction', saveIntroduction);

// Step 6+ — Chapters
router.post('/:id/chapter', saveChapter);
router.delete('/:id/chapter/:chapterIndex', deleteChapter);
router.post('/:id/chapters/reorder', reorderChapters);

// Final Step — Conclusion + Bibliographie
router.post('/:id/conclusion', saveConclusion);

export default router;
