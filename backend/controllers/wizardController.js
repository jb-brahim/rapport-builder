import Rapport from '../models/Rapport.js';

// Helper: save wizardAnswers fields and advance step if needed
const saveStep = async (rapportId, userId, patch, stepNum) => {
  const update = {
    $set: {
      ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [`wizardAnswers.${k}`, v])),
      lastSavedAt: new Date()
    }
  };
  if (stepNum !== undefined) {
    update.$max = { currentStep: stepNum + 1 };
    // Mark step complete
    update.$set[`stepCompletion.${stepNum - 1}`] = 1;
  }
  return Rapport.findOneAndUpdate({ _id: rapportId, userId }, update, { new: true });
};

// ──────────────────────────────────────────────
// STEP 1 — Cover Page
// ──────────────────────────────────────────────
const saveCoverPage = async (req, res) => {
  try {
    const {
      university, ministry, department, degree,
      projectTitle, studentNames, supervisor,
      academicYear, company, logoUrl,
      isBinome, language, studentName1, studentName2
    } = req.body;

    const rapport = await saveStep(req.params.id, req.user._id, {
      university, ministry, department, degree,
      projectTitle, studentNames, supervisor,
      academicYear, company, logoUrl,
      isBinome, language, studentName1, studentName2
    }, 1);

    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({ message: 'Cover page saved', rapport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP 2 — Dédicace
// ──────────────────────────────────────────────
const DEDICACE_TEMPLATES = [
  `À mes chers parents,\nPour tout l'amour, le soutien et les sacrifices que vous avez consentis tout au long de mon parcours.\nCe travail est le fruit de votre dévouement. Puisse Dieu vous accorder longue vie et bonne santé.\n\nÀ mes frères et sœurs,\nPour votre encouragement constant et votre présence à chaque étape de ma vie.\n\nÀ tous ceux qui me sont chers.`,

  `Je dédie ce travail…\n\nÀ ma famille, source inépuisable d'amour et de soutien.\nÀ mes amis, compagnons fidèles de toutes mes années d'études.\nÀ tous mes enseignants qui ont contribué à ma formation.\n\n« Le succès c'est d'aller d'échec en échec sans perdre son enthousiasme. » — Winston Churchill`
];

const getDedicaceTemplates = async (req, res) => {
  res.json({ templates: DEDICACE_TEMPLATES });
};

const saveDedicace = async (req, res) => {
  try {
    const { dedicace, dedicace1, dedicace2 } = req.body;
    const rapport = await saveStep(req.params.id, req.user._id, { dedicace, dedicace1, dedicace2 }, 2);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({ message: 'Dédicace saved', rapport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP 3 — Remerciements
// ──────────────────────────────────────────────
const REMERCIEMENTS_TEMPLATES = [
  `Au terme de ce travail, je tiens à exprimer ma profonde gratitude à toutes les personnes qui ont contribué, de près ou de loin, à sa réalisation.\n\nJe remercie tout d'abord mon encadrant universitaire, ${'{supervisor}'}, pour ses précieux conseils, sa disponibilité et son soutien tout au long de ce projet.\n\nJe remercie également l'ensemble de l'équipe de ${'{company}'} pour m'avoir accueilli et fourni un environnement de travail stimulant.\n\nEnfin, je remercie mes parents et amis pour leur soutien moral indéfectible.`,

  `Je voudrais tout d'abord adresser toute ma gratitude à mon encadrant, ${'{supervisor}'}, qui m'a guidé avec bienveillance et expertise.\n\nMes remerciements vont également à ${'{company}'} pour m'avoir offert cette opportunité d'apprentissage enrichissante.\n\nJe tiens aussi à remercier le corps professoral de ${'{university}'} pour la qualité de la formation dispensée.\n\nUn grand merci à mes collègues de promotion pour l'entraide et la bonne humeur partagées.`
];

const getRemerciementsTemplates = async (req, res) => {
  // Interpolate known values for personalisation hints
  try {
    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    const w = rapport?.wizardAnswers || {};
    const templates = REMERCIEMENTS_TEMPLATES.map(t =>
      t.replace(/\$\{\'supervisor\'\}/g, w.supervisor || 'mon encadrant')
       .replace(/\$\{\'company\'\}/g, w.company || "l'organisme d'accueil")
       .replace(/\$\{\'university\'\}/g, w.university || "l'université")
    );
    res.json({ templates });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const saveRemerciements = async (req, res) => {
  try {
    const { remerciements } = req.body;
    const rapport = await saveStep(req.params.id, req.user._id, { remerciements }, 3);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({ message: 'Remerciements saved', rapport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP 4 — Table des matières (auto-generate)
// ──────────────────────────────────────────────
const getTableOfContents = async (req, res) => {
  try {
    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    const w = rapport.wizardAnswers || {};
    const chapters = rapport.chaptersConfig || [];

    const toc = [
      { title: 'Dédicace', page: 'i', type: 'front' },
      { title: 'Remerciements', page: 'ii', type: 'front' },
      { title: 'Résumé', page: 'iii', type: 'front' },
      { title: 'Sommaire', page: 'iv', type: 'front' },
      { title: 'Table des figures', page: 'v', type: 'front' },
      { title: 'Table des tableaux', page: 'vi', type: 'front' },
      { title: 'Introduction Générale', page: '1', type: 'section' },
      ...chapters.map((ch, i) => ({
        title: `Chapitre ${i + 1} : ${ch.title || 'Sans titre'}`,
        page: String(i * 15 + 5),
        type: 'chapter',
        sections: (ch.sections || []).map((s, si) => ({
          title: s.title || `Section ${si + 1}`,
          page: String(i * 15 + 5 + si * 2),
          hasImage: (s.images && s.images.length > 0) || (s.tables && s.tables.length > 0)
        }))
      })),
      { title: 'Conclusion Générale', page: String(chapters.length * 15 + 5), type: 'section' },
      { title: 'Bibliographie', page: String(chapters.length * 15 + 10), type: 'section' }
    ];

    res.json({ toc });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP 5 — Introduction Générale
// ──────────────────────────────────────────────
const saveIntroduction = async (req, res) => {
  try {
    const { context, problem, objective, approach, introduction } = req.body;
    // `introduction` is the final (possibly AI-expanded) text; the guided parts are cached too
    const rapport = await saveStep(req.params.id, req.user._id, {
      introContext: context,
      introProblem: problem,
      introObjective: objective,
      introApproach: approach,
      introduction: introduction || [context, problem, objective, approach].filter(Boolean).join('\n\n')
    }, 5);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({ message: 'Introduction saved', rapport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP 6+ — Chapters (dynamic)
// ──────────────────────────────────────────────
const saveChapter = async (req, res) => {
  try {
    const { index, title, introduction, sections, conclusion, images, tables } = req.body;
    const chapterIdx = parseInt(index, 10);

    if (isNaN(chapterIdx) || chapterIdx < 0) {
      return res.status(400).json({ message: 'Invalid chapter index' });
    }

    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    // Ensure array is big enough
    const chapters = rapport.chaptersConfig || [];
    while (chapters.length <= chapterIdx) chapters.push({});

    chapters[chapterIdx] = { 
      title, 
      introduction, 
      sections: sections || [], 
      conclusion, 
      images: images || [],
      tables: tables || []
    };
    rapport.chaptersConfig = chapters;
    rapport.lastSavedAt = new Date();

    // Mark step 6 complete and advance
    if (!rapport.stepCompletion) rapport.stepCompletion = [0,0,0,0,0,0,0,0,0,0,0,0];
    rapport.stepCompletion[5] = 1;

    await rapport.save();
    res.json({ message: `Chapter ${chapterIdx + 1} saved`, chapters: rapport.chaptersConfig });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteChapter = async (req, res) => {
  try {
    const chapterIdx = parseInt(req.params.chapterIndex, 10);
    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    const chapters = rapport.chaptersConfig || [];
    chapters.splice(chapterIdx, 1);
    rapport.chaptersConfig = chapters;
    rapport.lastSavedAt = new Date();
    await rapport.save();
    res.json({ message: 'Chapter deleted', chapters: rapport.chaptersConfig });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const reorderChapters = async (req, res) => {
  try {
    const { order } = req.body; // array of current indices in new order
    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    const old = rapport.chaptersConfig || [];
    rapport.chaptersConfig = order.map(i => old[i]);
    rapport.lastSavedAt = new Date();
    await rapport.save();
    res.json({ message: 'Chapters reordered', chapters: rapport.chaptersConfig });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// STEP N — Conclusion + Bibliographie
// ──────────────────────────────────────────────
const saveConclusion = async (req, res) => {
  try {
    const { conclusion, bibliographie, perspectives } = req.body;
    const rapport = await saveStep(req.params.id, req.user._id, {
      conclusion, bibliographie, perspectives
    }, 9);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({ message: 'Conclusion saved', rapport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────
// GET full rapport wizard state
// ──────────────────────────────────────────────
const getWizardState = async (req, res) => {
  try {
    const rapport = await Rapport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });
    res.json({
      wizardAnswers: rapport.wizardAnswers,
      chaptersConfig: rapport.chaptersConfig,
      currentStep: rapport.currentStep,
      stepCompletion: rapport.stepCompletion
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export {
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
};
