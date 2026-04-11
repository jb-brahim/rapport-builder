import OpenAI from 'openai';
import Rapport from '../models/Rapport.js';
import { generateFullRapport } from '../services/rapportGenerator.js';

// Default config will pick up process.env.OPENAI_API_KEY automatically
const openai = new OpenAI(); 

// @desc    Generate company presentation based on wizard answers
// @route   POST /api/ai/generate-company
// @access  Private
const generateCompanyText = async (req, res) => {
  try {
    const { answers, language } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ text: `[MOCK AI] Company presentation generated for ${answers.companyName} based on your answers.` });
    }

    const prompt = `Write a professional 3-paragraph company presentation in ${language} for a company named ${answers.companyName} in the ${answers.sector} sector. The student role is ${answers.role}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suggest chapter structure based on project description
// @route   POST /api/ai/suggest-structure
// @access  Private
const suggestStructure = async (req, res) => {
  try {
    const { answers, language } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ text: `[MOCK AI] Suggested structure for project: ${answers.projectTitle}` });
    }

    const prompt = `Based on a project titled "${answers.projectTitle}" (objective: ${answers.objective}, tech: ${answers.technologies}), suggest a detailed chapter structure for a final university report in ${language}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Expand short text into a professional paragraph
// @route   POST /api/ai/expand-text
// @access  Private
const expandText = async (req, res) => {
  try {
    const { shortText, context, language } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ text: `[MOCK AI EXPANSION] Expanded professional version of: "${shortText}"` });
    }

    const prompt = `Rewrite and expand the following short note into a fully professional, well-structured academic paragraph in ${language || 'FR'} suitable for a final internship report (PFE). Context: ${context || 'General internship experience'}. Short note: "${shortText}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate the full 100-page JSON rapport from wizard answers
// @route   POST /api/ai/generate-full/:rapportId
// @access  Private
const generateFullRapportContent = async (req, res) => {
  try {
    const rapport = await Rapport.findOne({ _id: req.params.rapportId, user: req.user._id });

    if (!rapport) {
      return res.status(404).json({ message: 'Rapport not found or access denied' });
    }

    const w = rapport.wizardAnswers || {};

    // Map the chaotic wizard answers into the precise config object expected by the prompt builder
    const config = {
      template: {
        name: w.templateName || "Template Standard",
        description: w.templateDescription || "Style académique standard. Times New Roman 12pt."
      },
      student: {
        name: req.user.name || w.studentName || "Étudiant",
        university: w.university || "Université de Tunis",
        department: w.department || "Département Informatique",
        degree: w.degree || "Diplôme d'ingénieur",
        academicYear: w.academicYear || "2023-2024",
        supervisor: w.supervisor || "Dr. Encadrant"
      },
      company: {
        name: w.companyName || "Entreprise X",
        sector: w.sector || "Technologie / Informatique",
        size: w.companySize || "PME",
        location: w.companyLocation || "Tunis",
        studentRole: w.role || "Stagiaire Développeur",
        duration: w.internshipDuration || "6 mois",
        department: w.companyDepartment || "DSI",
        mentor: w.mentor || "Responsable Technique",
        background: w.companyPresentation || "Entreprise spécialisée dans le développement de solutions numériques."
      },
      project: {
        title: w.projectTitle || "Projet de Fin d'Études",
        problem: w.problem || "Problématique métier non définie.",
        objective: w.objective || "Développer une solution répondant aux besoins.",
        techStack: w.technologies ? (Array.isArray(w.technologies) ? w.technologies : w.technologies.split(',')) : ["MERN Stack"],
        methodology: w.methodology || "Méthode Agile Scrum",
        competingSolutions: w.competingSolutions ? (Array.isArray(w.competingSolutions) ? w.competingSolutions : w.competingSolutions.split(',')) : ["Solution A", "Solution B"],
        actors: w.actors || [{ name: "Utilisateur", role: "Rôle standard" }],
        sprints: w.sprints || [
          { name: "Sprint 1", dateRange: "01/01 - 15/01" },
          { name: "Sprint 2", dateRange: "16/01 - 31/01" },
          { name: "Sprint 3", dateRange: "01/02 - 15/02" },
          { name: "Sprint 4", dateRange: "16/02 - 28/02" }
        ],
        perspectives: w.perspectives || "Évolutions futures du système."
      }
    };

    // Call the Anthropic logic
    const generatedJson = await generateFullRapport(config);

    // Save back to DB
    rapport.content = generatedJson;
    rapport.lastSavedAt = new Date();
    await rapport.save();

    res.json({ 
      message: 'Full rapport generated and saved successfully', 
      rapportId: rapport._id,
      content: generatedJson 
    });

  } catch (error) {
    console.error("Generate Full Rapport Error:", error);
    res.status(500).json({ message: "Échec de la génération: " + error.message });
  }
};

export { generateCompanyText, suggestStructure, expandText, generateFullRapportContent };
