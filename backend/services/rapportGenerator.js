import fs from 'fs/promises';
import { Anthropic } from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are an expert academic writer specializing in Tunisian university final-year project reports (Rapport de Projet de Fin d'Études — PFE). You have read hundreds of real PFE rapports from ENIT, INSAT, FST, and other Tunisian institutions and you write exactly like them.

TARGET LENGTH: Each rapport is 100–110 pages. Your output must be dense and detailed enough to fill this length when rendered with Times New Roman 12pt, 2.5cm margins, 1.5 line spacing.

OUTPUT FORMAT: Respond with a single valid JSON object only. No markdown fences, no preamble, no explanation — ONLY the JSON.

════════════════════════════════════════════
WRITING RULES — apply to every word you write
════════════════════════════════════════════

1. ACADEMIC FRENCH — Mandatory register:
   - Formal, impersonal. Never "j'ai fait" → always "nous avons réalisé" or "il a été procédé à"
   - Every chapter opens with: "Ce chapitre est consacré à..."
   - Every chapter closes with: "Ce chapitre nous a permis de... Dans le chapitre suivant, nous..."
   - Every section intro: "Dans cette section, nous présentons / allons décrire / abordons..."
   - Transitions between subsections: "Suite à cette analyse, nous allons maintenant..."
   - Required stock phrases: "Afin de répondre aux besoins identifiés...", "Il convient de noter que...", "Dans ce contexte...", "C'est dans ce cadre que s'inscrit..."

2. USE CASE DESCRIPTION TABLES — Every UC must have a full textual description table with these exact fields:
   - Titre | Acteur(s) | Objectif | Pré-condition | Post-condition | Scénario nominal (numbered steps) | Scénario alternatif / Exception
   - Scenario nominal must have at least 5–7 numbered steps
   - Each step must be a complete sentence describing the interaction

3. DIAGRAM DESCRIPTIONS — Since actual diagrams cannot be embedded in JSON, describe them precisely:
   - For sequence diagrams: list every participant (columns), then every numbered message in order with arrow direction
   - For class diagrams: list every class with its exact attributes (type included) and methods (parameters + return type)
   - For use case diagrams: list every actor, every use case, every include/extend relationship
   - These descriptions will be used by the renderer to generate actual PlantUML/Mermaid diagrams

4. XYZ PLACEHOLDERS — Use [XYZ] for ultra-specific data only the real student knows:
   - Performance metrics measured during testing: "[XYZ] ms response time"
   - Exact internal system names: "le système [XYZ] de BIAT"
   - Precise test results: "[XYZ]% taux de couverture des tests"
   - Do NOT use [XYZ] for anything that can be realistically invented

5. IMAGE PLACEHOLDERS — For every figure, write:
   [PLACEHOLDER: FIGURE_N — Description précise de ce que montre cette figure]
   Example: [PLACEHOLDER: FIGURE_14 — Diagramme de séquence du cas d'utilisation "S'authentifier" montrant les échanges entre l'Utilisateur, l'IU Login, l'AuthController, le UserService et la base de données MongoDB avec gestion du token JWT]

6. LENGTH TARGETS — Minimum word counts (ENFORCED):
   - Each chapter introduction: 80–100 words
   - Section 1.1 (company presentation): 300–400 words across subsections
   - Étude de l'existant: 250–350 words including table description
   - Méthodologie section: 300–400 words
   - Sprint 0 chapter total: 600–800 words prose (excluding tables)
   - Each sprint chapter introduction: 60–80 words
   - Each UC textual description: 150–200 words (table content)
   - Each sequence diagram description: 100–150 words
   - Each class diagram description: 80–120 words
   - Réalisation interface descriptions: 40–60 words per interface
   - Conclusion générale: 400–500 words

7. TABLES — Describe all tables as structured data:
   - Backlog tables: include ALL user stories with ID, full user story text, priority (1/2/3), estimation (Élevée/Moyenne/Faible)
   - Comparative tables: minimum 5 criteria, realistic evaluations (Oui/Non/Partiel)
   - Sprint planning tables: exact date ranges, deliverable per sprint

8. CONSISTENCY — Names, dates, technologies must be 100% consistent throughout:
   - If BIAT was founded in 1976, never write 1977 ailleurs
   - Sprint 1 dates in the backlog must match Sprint 1 dates in the planning table
   - Class attributes in Sprint 2 must match attributes used in Sprint 3 sequences

9. REALISM — Technical content must be technically correct:
   - JWT authentication flow must be technically accurate
   - MongoDB collection names should follow camelCase convention
   - React component names PascalCase, hooks camelCase
   - REST endpoints should follow RESTful conventions (/api/employees, GET/POST/PUT/DELETE)
   - CNSS cotisation rate for Tunisia: 9.18% employee + 16.57% employer

10. BIBLIOGRAPHY — IEEE format, all references must be real and verifiable:
    - Framework official docs, real textbooks, real research papers
    - Never invent DOIs, never invent paper titles
    - Minimum 8 references
`;

function buildBaseContext(config) {
  return `
## RAPPORT IDENTITY (apply consistently across ALL sections)
Student: ${config.student.name}
University: ${config.student.university}
Department: ${config.student.department}
Degree: ${config.student.degree}
Academic year: ${config.student.academicYear}
Supervisor: ${config.student.supervisor}
Language: Français
Template: ${config.template.name} — ${config.template.description}

## COMPANY
Name: ${config.company.name}
Sector: ${config.company.sector}
Size: ${config.company.size}
Location: ${config.company.location}
Student role: ${config.company.studentRole}
Duration: ${config.company.duration}
Department: ${config.company.department}
Mentor: ${config.company.mentor}
Background: ${config.company.background}

## PROJECT
Title: ${config.project.title}
Problem: ${config.project.problem}
Objective: ${config.project.objective}
Tech stack: ${config.project.techStack.join(", ")}
Methodology: ${config.project.methodology}
Competing solutions studied: ${config.project.competingSolutions.join(", ")}
Actors: ${config.project.actors.map(a => a.name + " (" + a.role + ")").join(", ")}
Sprints: ${config.project.sprints.map((s,i) => `Sprint ${i+1}: ${s.name} (${s.dateRange})`).join(" | ")}
Perspectives: ${config.project.perspectives}
`;
}

function buildCallA_prompt(config) {
  return `
Generate ONLY the following sections. Return a JSON object with exactly these keys.

{
  "coverPage": {
    "republicLine": "REPUBLIQUE TUNISIENNE — MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE",
    "universityName": "${config.student.university}",
    "facultyName": "string",
    "reportType": "RAPPORT DE PROJET DE FIN D'ETUDES",
    "diplomaLine": "Présenté en vue de l'obtention du ${config.student.degree}",
    "subjectLabel": "Sujet :",
    "title": "${config.project.title}",
    "studentLabel": "Réalisé par :",
    "studentName": "${config.student.name}",
    "companyLabel": "Organisme d'accueil :",
    "companyName": "${config.company.name}",
    "supervisorLabel": "Encadré par :",
    "supervisorName": "${config.student.supervisor}",
    "juryLabel": "Soutenu le :       Devant le jury composé de :",
    "presidentLabel": "Président : [XYZ]",
    "rapporteurLabel": "Rapporteur : [XYZ]",
    "academicYear": "Année Universitaire ${config.student.academicYear}"
  },

  "dedicace": {
    "student1Name": "${config.student.name.split(' ')[0]}",
    "student1Text": "string (poetic dedication 5–6 lines, to family, in formal French)",
    "student2Name": "null",
    "student2Text": "null"
  },

  "remerciements": {
    "professionalSection": "string (100–120 words — thanks to company mentor ${config.company.mentor}, team members, company)",
    "academicSection": "string (80–100 words — thanks to supervisor ${config.student.supervisor}, jury members, university)"
  },

  "resume": {
    "french": {
      "title": "Résumé",
      "text": "string (130–150 words in formal French covering: context, company, project objective, tech stack, results)",
      "keywords": ["string x5"]
    },
    "english": {
      "title": "Abstract",
      "text": "string (130–150 words in English, same content as French résumé)",
      "keywords": ["string x5"]
    }
  },

  "abbreviations": [
    { "abbr": "string", "definition": "string" }
  ],

  "introductionGenerale": {
    "paragraph1_context": "string (context paragraph: digital transformation in ${config.company.sector} sector in Tunisia, 80–100 words)",
    "paragraph2_problem": "string (problem paragraph: specific issues at ${config.company.name}, why a new system is needed, 80–100 words)",
    "paragraph3_planRapport": "string (plan paragraph: 'Notre rapport est structuré comme suit... Le premier chapitre... Le deuxième chapitre...' etc., covering all chapters, 100–120 words)"
  },

  "chapter1": {
    "introduction": "string (80–100 words opening paragraph for chapter 1)",
    "section1_1": {
      "title": "Présentation de l'organisme d'accueil",
      "sub1_1_1": {
        "title": "Présentation de ${config.company.name}",
        "text": "string (200–250 words: founding year, mission, sector position, services/products, transformation numérique context)",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_1 — Logo de ${config.company.name}]"
      },
      "sub1_1_2": {
        "title": "Chiffres clés et implantation",
        "text": "string (100–130 words: employees count, offices/branches, market position, key clients if public)",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_2 — Organigramme général de ${config.company.name}]"
      },
      "sub1_1_3": {
        "title": "Cadre du stage",
        "text": "string (100–120 words: student role, duration ${config.company.duration}, department ${config.company.department}, mentor ${config.company.mentor}, missions confiées)"
      }
    },
    "section1_2": {
      "title": "Présentation générale du projet",
      "sub1_2_1": {
        "title": "Objectif du projet",
        "text": "string (120–150 words: precise description of what the platform does, who uses it, main modules)"
      }
    },
    "section1_3": {
      "title": "Étude de l'existant",
      "sub1_3_1": {
        "title": "Analyse des solutions existantes",
        "text": "string (100–120 words: introduce the ${config.project.competingSolutions.length} existing solutions studied)",
        "solutions": [
          { "name": "string", "url": "string", "description": "string (40–60 words)" }
        ]
      },
      "sub1_3_2": {
        "title": "Tableau comparatif des solutions existantes",
        "tableIntro": "string (40–60 words introducing the table)",
        "table": {
          "caption": "Tableau 1 : Étude comparative des solutions existantes",
          "headers": ["Fonctionnalité", "Solution A name", "Solution B name", "Solution C name"],
          "rows": [
            { "criteria": "string", "values": ["Oui/Non/Partiel", "Oui/Non/Partiel", "Oui/Non/Partiel"] }
          ]
        }
      },
      "sub1_3_3": {
        "title": "Critique de l'existant",
        "text": "string (120–150 words: specific limitations of existing solutions relative to ${config.company.name} needs)"
      },
      "sub1_3_4": {
        "title": "Solution proposée",
        "text": "string (120–150 words: why custom development was chosen, list of features to build, tech justification)",
        "featureList": ["string x6–8 bullet points"]
      }
    },
    "section1_4": {
      "title": "Méthodologie de travail",
      "sub1_4_1": {
        "title": "Méthode Agile",
        "text": "string (150–180 words: definition, 4 agile values, 12 principles summary, why chosen over waterfall for this project)"
      },
      "sub1_4_2": {
        "title": "Méthode Scrum",
        "text": "string (150–180 words: Scrum definition, application to this project)",
        "teamRoles": {
          "productOwner": "string (name + role at ${config.company.name})",
          "scrumMaster": "string (student name + role)",
          "devTeam": "string (description)"
        },
        "figurePlaceholder1": "[PLACEHOLDER: FIGURE_3 — Équipe Scrum du projet]",
        "sub1_4_3_title": "Concepts Scrum",
        "scrumConcepts": [
          { "concept": "Sprint", "definition": "string (40–50 words)" },
          { "concept": "Product Backlog", "definition": "string (40–50 words)" },
          { "concept": "Sprint Backlog", "definition": "string (40–50 words)" }
        ],
        "figurePlaceholder2": "[PLACEHOLDER: FIGURE_4 — Présentation générale du cycle Scrum]"
      }
    },
    "section1_5": {
      "title": "Langage de modélisation",
      "text": "string (150–180 words: UML definition, types of diagrams used)",
      "figurePlaceholder": "[PLACEHOLDER: FIGURE_5 — Logo UML]"
    },
    "conclusion": "string (60–80 words: résumé du chapitre, annonce chapitre 2)"
  },

  "chapter2": {
    "introduction": "string (80–100 words opening)",
    "section2_1": {
      "title": "Capture des besoins",
      "sub2_1_1": {
        "title": "Identification des acteurs",
        "intro": "string (40–60 words)",
        "actors": [
          {
            "name": "string",
            "description": "string (60–80 words)"
          }
        ]
      }
    },
    "section2_2": {
      "title": "Contexte général du projet",
      "text": "string (60–80 words introducing the context diagram)",
      "diagramDescription": {
        "type": "context_diagram",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_6 — Diagramme de modélisation de contexte]",
        "interactions": [
          { "actor": "string", "inputs": ["string"], "outputs": ["string"] }
        ]
      }
    },
    "section2_3": {
      "sub2_3_1": {
        "title": "Besoins Fonctionnels",
        "intro": "string (40–60 words)",
        "byActor": [
          {
            "actor": "string",
            "needs": ["string x4–6"]
          }
        ]
      },
      "sub2_3_2": {
        "title": "Besoins Non Fonctionnels",
        "intro": "string (40–60 words)",
        "needs": [
          {
            "name": "string",
            "description": "string (60–80 words)"
          }
        ]
      }
    },
    "section2_4": {
      "title": "Diagramme de cas d'utilisation global",
      "intro": "string (40–60 words)",
      "diagramDescription": {
        "type": "use_case_diagram",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_7 — Diagramme de cas d'utilisation global]",
        "actors": ["string"],
        "useCases": [
          { "name": "string", "actors": ["string"], "includes": ["string"], "extends": ["string"] }
        ]
      }
    },
    "section2_5": {
      "title": "Backlog Product",
      "intro": "string (60–80 words)",
      "table": {
        "caption": "Tableau 2 : Backlog Product",
        "sprints": [
          {
            "sprintName": "string",
            "features": [
              {
                "featureName": "string",
                "stories": [
                  {
                    "id": "string",
                    "userStory": "string",
                    "priority": "1",
                    "estimation": "Élevée | Moyenne | Faible"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    "section2_6": {
      "title": "Planification des Sprints",
      "intro": "string (40–60 words)",
      "table": {
        "caption": "Tableau 3 : Planification des sprints",
        "rows": [
          { "sprintName": "string", "startDate": "string", "endDate": "string" }
        ]
      }
    },
    "section2_7": {
      "title": "Diagramme de classe global",
      "intro": "string (60–80 words)",
      "diagramDescription": {
        "type": "class_diagram",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_8 — Diagramme de classe global]",
        "classes": [
          {
            "name": "string",
            "attributes": ["visibility name: type"],
            "methods": ["visibility name(params): returnType"],
            "relationships": [{ "type": "association", "with": "ClassName", "multiplicity": "1..*" }]
          }
        ]
      }
    },
    "section2_8": {
      "title": "Environnement de travail",
      "sub2_8_1": {
        "title": "Environnement matériel",
        "text": "string (60–80 words)"
      },
      "sub2_8_2": {
        "title": "Environnements logiciels",
        "sub_langages": {
          "title": "Langages et Technologies",
          "intro": "string",
          "table": {
            "caption": "Tableau 4 : Langages et technologies",
            "rows": [
              { "name": "string", "description": "string" }
            ]
          }
        },
        "sub_logiciels": {
          "title": "Logiciels",
          "intro": "string",
          "table": {
            "caption": "Tableau 5 : Logiciels",
            "rows": [
              { "name": "string", "description": "string" }
            ]
          }
        },
        "sub_sgbd": {
          "title": "SGBD",
          "intro": "string",
          "table": {
            "caption": "Tableau 6 : Serveur de BDD",
            "rows": [
              { "name": "string", "description": "string" }
            ]
          }
        }
      }
    },
    "section2_9": {
      "title": "Architecture du système",
      "text": "string (150–200 words)",
      "figurePlaceholder1": "[PLACEHOLDER: FIGURE_9 — Architecture globale]",
      "sub2_9_1": {
        "title": "Service web / API REST",
        "text": "string (100–130 words)",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_10 — Architecture API REST]"
      }
    },
    "conclusion": "string (60–80 words)"
  }
}
`;
}

function buildCallB_prompt(config) {
  const sprint1 = config.project.sprints[0];
  const sprint2 = config.project.sprints[1];
  return `
Generate ONLY Chapters 3 and 4. Return a JSON object with exactly keys "chapter3" and "chapter4".

{
  "chapter3": {
    "title": "Chapitre 3 : Sprint 1 « ${sprint1.name} »",
    "sprintDates": "${sprint1.dateRange}",
    "introduction": "string",
    "backlogSprint": {
      "caption": "Tableau 7 : Backlog Sprint 1",
      "intro": "string (40–60 words)",
      "rows": [
        {
          "featureName": "string",
          "id": "string",
          "userStory": "string (full 'En tant que...' story)",
          "actors": "string"
        }
      ]
    },
    "useCaseDiagramDetailed": {
      "intro": "string (40–60 words)",
      "figurePlaceholder": "[PLACEHOLDER: FIGURE_11 — Diagramme de cas d'utilisation détaillé du Sprint 1]",
      "description": {
        "actors": ["string"],
        "useCases": [
          { "name": "string", "actors": ["string"], "includes": ["string"], "extends": ["string"] }
        ]
      }
    },
    "useCaseSections": [
      {
        "sectionNumber": "3.2.1",
        "title": "string (e.g. 'Gérer les comptes')",
        "diagramRefinement": {
          "figurePlaceholder": "[PLACEHOLDER: FIGURE_12 — Raffinement du cas d'utilisation]",
          "description": "string (40–60 words)"
        },
        "descriptionsTables": [
          {
            "tableCaption": "string",
            "titre": "string",
            "acteur": "string",
            "objectif": "string",
            "preCondition": "string",
            "postCondition": "string",
            "scenarioNominal": [
              "string (step 1)", "string (step 2)", "string (step 3)"
            ],
            "scenarioAlternatif": "string"
          }
        ]
      }
    ],
    "sequenceDiagrams": [
      {
        "sectionNumber": "string",
        "title": "string",
        "intro": "string",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_14 — Diagramme de séquence]",
        "participants": ["string"],
        "messages": [
          { "step": "1", "from": "string", "to": "string", "label": "string", "type": "sync" }
        ]
      }
    ],
    "classDiagrams": [
      {
        "sectionNumber": "string",
        "title": "string",
        "intro": "string",
        "figurePlaceholder": "[PLACEHOLDER: FIGURE_17 — Diagramme de classe de conception]",
        "classes": [
          {
            "name": "string",
            "attributes": ["visibility name: type"],
            "methods": ["visibility name(params): returnType"]
          }
        ],
        "relationships": [
          { "from": "string", "to": "string", "type": "string", "label": "string" }
        ]
      }
    ],
    "conclusion": "string"
  },

  "chapter4": {
    "title": "Chapitre 4 : Sprint 2 « ${sprint2.name} »",
    "sprintDates": "${sprint2.dateRange}",
    "introduction": "string",
    "backlogSprint": { "caption": "Tableau: Backlog Sprint 2", "intro": "string", "rows": [] },
    "useCaseDiagramDetailed": { "intro": "string", "figurePlaceholder": "string", "description": {} },
    "useCaseSections": [],
    "sequenceDiagrams": [],
    "classDiagrams": [],
    "conclusion": "string"
  }
}
`;
}

function buildCallC_prompt(config) {
  const sprint3 = config.project.sprints[2];
  const sprint4 = config.project.sprints[3];
  return `
Generate ONLY Chapters 5, 6, 7, and the Conclusion. Return JSON with keys "chapter5", "chapter6", "chapter7", "conclusionGenerale", "bibliographie".

{
  "chapter5": {
    "title": "Chapitre 5 : Sprint 3 « ${sprint3.name} »",
    "introduction": "string"
  },
  "chapter6": {
    "title": "Chapitre 6 : Sprint 4 « ${sprint4.name} »",
    "introduction": "string"
  },
  "chapter7": {
    "title": "Chapitre 7 : Réalisation",
    "introduction": "string (60–80 words)",
    "webInterfaces": {
      "sectionTitle": "7.1 Présentation des Interfaces Web",
      "interfaces": [
        {
          "sectionNumber": "string",
          "title": "string",
          "description": "string",
          "figurePlaceholder": "[PLACEHOLDER: FIGURE_N — Interface]"
        }
      ]
    },
    "mobileInterfaces": {
      "sectionTitle": "7.2 Présentation des Interfaces Mobile",
      "intro": "string",
      "interfaces": []
    },
    "codeExtract": {
      "sectionTitle": "7.3 Extrait de code",
      "intro": "string",
      "extract": {
        "language": "string",
        "title": "string",
        "description": "string",
        "code": "string"
      }
    }
  },
  "conclusionGenerale": {
    "paragraph1_bilan": "string (120–150 words)",
    "paragraph2_apports": "string (80–100 words)",
    "paragraph3_limitations": "string (60–80 words)",
    "paragraph4_perspectives": "string (80–100 words)"
  },
  "bibliographie": {
    "format": "IEEE",
    "entries": [
      { "number": 1, "citation": "string (full IEEE citation)" }
    ]
  }
}
`;
}

function buildUserPrompt(config, callType) {
  const base = buildBaseContext(config);
  if (callType === "A") return base + buildCallA_prompt(config);
  if (callType === "B") return base + buildCallB_prompt(config);
  if (callType === "C") return base + buildCallC_prompt(config);
}

// ════════════════════════════════════════════════════════
// RAPPORT CONFIGS
// ════════════════════════════════════════════════════════
const RAPPORT_1_CONFIG = {
  template: { name: "Template A", description: "Style classique français/tunisien." },
  student: {
    name: "Mohamed Amine Trabelsi",
    university: "École Nationale d'Ingénieurs de Tunis (ENIT)",
    department: "Département Génie Informatique",
    degree: "DIPLÔME NATIONAL D'INGÉNIEUR EN INFORMATIQUE",
    academicYear: "2023–2024",
    supervisor: "Dr. Sonia Maâloul, Maître de Conférences, ENIT"
  },
  company: {
    name: "BIAT — Banque Internationale Arabe de Tunisie",
    sector: "Secteur bancaire et financier tunisien",
    size: "Plus de 2 400 employés, 170 agences",
    location: "Avenue Kheireddine Pacha, Tunis 1002",
    studentRole: "Stagiaire développeur full-stack",
    duration: "4 mois (Février 2024 – Mai 2024)",
    department: "Direction des Systèmes d'Information (DSI)",
    mentor: "M. Khaled Bousbia, Directeur des Systèmes d'Information",
    background: "La BIAT est une banque privée tunisienne fondée en 1976."
  },
  project: {
    title: "Développement d'une Plateforme Web de Gestion des Ressources Humaines",
    problem: "La BIAT dispose d'un système RH fragmenté basé sur des fichiers Excel.",
    objective: "Concevoir et développer une plateforme web interne permettant de digitaliser l'ensemble des processus RH.",
    techStack: ["React.js", "Node.js", "MongoDB", "JWT", "MUI"],
    methodology: "Méthode Agile avec framework Scrum",
    competingSolutions: ["SAP HCM", "Oracle HCM Cloud", "Odoo HR"],
    actors: [
      { name: "Administrateur", role: "Gère les comptes utilisateurs" },
      { name: "Employé", role: "Soumet des demandes de congés" }
    ],
    sprints: [
      { name: "Authentification & Gestion des comptes", dateRange: "15/02/2024 – 01/03/2024" },
      { name: "Gestion des employés & Demandes de congés", dateRange: "02/03/2024 – 20/03/2024" },
      { name: "Gestion de la paie & Tableau de bord", dateRange: "21/03/2024 – 10/04/2024" },
      { name: "Notifications & Gestion du profil personnel", dateRange: "11/04/2024 – 10/05/2024" }
    ],
    perspectives: "Développement d'une application mobile React Native companion."
  }
};

const RAPPORT_2_CONFIG = {
  template: { name: "Template B", description: "Style école d'ingénieurs moderne. Calibri 11pt, interligne 1.5, marges 2cm. Bande de couleur accent bleu (#1565C0) sur le bord gauche de chaque titre de chapitre. Numéros de chapitres en chiffres arabes précédés d'une barre de séparation colorée. Sous-titres avec numérotation hiérarchique." },
  student: { name: "Nour El Houda Mansouri", university: "Institut National des Sciences Appliquées et de Technologie (INSAT)", department: "Département Technologies de l'Information et de la Communication", degree: "DIPLÔME NATIONAL D'INGÉNIEUR EN TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION", academicYear: "2023–2024", supervisor: "Dr. Amine Khedher, Maître Assistant, INSAT" },
  company: { name: "Clinique Carthage", sector: "Secteur de la santé privée", size: "120 lits, plus de 200 employés (médecins, personnel paramédical et administratif)", location: "Avenue de la Bornette, La Marsa, Tunis 2078", studentRole: "Stagiaire développeur mobile au sein du département Système d'Information et Informatique", duration: "5 mois (Janvier 2024 – Mai 2024)", department: "Département Système d'Information et Informatique", mentor: "Dr. Rim Bouaziz, Responsable du Système d'Information", background: "La Clinique Carthage est un établissement de santé privé fondé en 1998, situé à La Marsa. Elle propose des soins médicaux et chirurgicaux dans plusieurs spécialités : cardiologie, orthopédie, pédiatrie, gynécologie-obstétrique et médecine générale. Avec 120 lits et plus de 200 professionnels de santé, elle est l'une des cliniques privées les plus réputées du Grand Tunis. Dans le cadre de sa stratégie de modernisation, la direction a lancé en 2023 un programme de transformation numérique visant à améliorer l'expérience patient." },
  project: { title: "Conception et Développement d'une Application Mobile de Suivi Médical Patient", problem: "La Clinique Carthage ne dispose d'aucun canal numérique pour ses patients. La prise de rendez-vous se fait exclusivement par téléphone, générant une surcharge pour le personnel d'accueil. Les ordonnances sont remises uniquement en version papier, sans possibilité de consultation ultérieure. Il n'existe aucun système de rappel de médication ni de suivi post-consultation, ce qui nuit à l'observance thérapeutique et à la satisfaction des patients.", objective: "Développer une application mobile cross-platform (Android et iOS) permettant aux patients de la Clinique Carthage de prendre rendez-vous en ligne selon les disponibilités des médecins, consulter leurs ordonnances numériques et historiques de consultations, recevoir des rappels personnalisés de médication via notifications push, et échanger avec leur médecin traitant via messagerie sécurisée.", techStack: ["Flutter 3.x / Dart", "Firebase Firestore", "Firebase Authentication", "Firebase Cloud Messaging (FCM)", "Firebase Storage", "Provider (state management)", "Dio (HTTP client)", "Flutter Local Notifications"], methodology: "Méthode Merise pour la modélisation des données (MCD, MLD, MPD), diagrammes UML pour les aspects comportementaux, développement itératif par fonctionnalité avec validation clinique à chaque étape", competingSolutions: ["Doctolib (doctolib.fr)", "MyClinic (myclinic.tn)", "Nabidoc (nabidoc.com)"], actors: [ { name: "Patient", role: "Prend des rendez-vous, consulte ordonnances, reçoit notifications, utilise messagerie" }, { name: "Médecin", role: "Gère son agenda, rédige ordonnances numériques, répond aux messages patients" }, { name: "Secrétaire médicale", role: "Gère les rendez-vous, met à jour disponibilités, envoie confirmations" }, { name: "Administrateur", role: "Gère les comptes, configure l'application, accède aux statistiques" } ], sprints: [ { name: "Authentification & Gestion des comptes", dateRange: "15/01/2024 – 31/01/2024" }, { name: "Prise de rendez-vous & Gestion de l'agenda", dateRange: "01/02/2024 – 20/02/2024" }, { name: "Ordonnances numériques & Historique médical", dateRange: "21/02/2024 – 15/03/2024" }, { name: "Notifications push & Messagerie sécurisée", dateRange: "16/03/2024 – 15/04/2024" } ], perspectives: "Intégration d'un module de téléconsultation vidéo via WebRTC, développement d'un tableau de bord médecin (application séparée), implémentation d'un assistant IA pour le triage des symptômes avant consultation, extension à d'autres établissements de santé partenaires" }
};

const RAPPORT_3_CONFIG = {
  template: { name: "Template C", description: "Style minimal international. Garamond 12pt, interligne 1.5, marges 3cm. Aucune couleur, noir et blanc uniquement. Chapitres introduits par un filet horizontal fin centré. Adapté aux mémoires de master et aux filières mixtes franco-anglaises. Style épuré académique." },
  student: { name: "Yassine Gharbi", university: "Faculté des Sciences de Tunis (FST) — Université Tunis El Manar", department: "Département Informatique", degree: "DIPLÔME DE MASTER EN DATA SCIENCE ET INTELLIGENCE ARTIFICIELLE", academicYear: "2023–2024", supervisor: "Prof. Hajer Baazaoui, Professeur Universitaire, FST" },
  company: { name: "Tunisie Telecom — Direction Innovation & Data", sector: "Télécommunications", size: "Plus de 6 millions de clients actifs, environ 8 000 employés", location: "13 Avenue Jugurtha, Mutuelleville, Tunis 1002", studentRole: "Stagiaire Data Scientist au sein de la Direction Innovation & Data, équipe Analytics & Intelligence Artificielle", duration: "6 mois (Novembre 2023 – Avril 2024)", department: "Direction Innovation & Data — Équipe Analytics & IA", mentor: "M. Raouf Slimani, Data Science Lead", background: "Tunisie Telecom (TT) est l'opérateur historique de télécommunications de Tunisie, fondé en 1995 suite à la restructuration de l'Office National des Télécommunications. Avec plus de 6 millions de clients sur les marchés mobile, fixe et internet, TT est le premier opérateur national. Face à une concurrence accrue d'Ooredoo et Orange Tunisie, la direction a engagé depuis 2021 une stratégie data-driven visant à exploiter les données clients pour améliorer la rétention et augmenter le revenu par utilisateur." },
  project: { title: "Conception et Implémentation d'un Système de Recommandation de Produits Télécom Basé sur l'Intelligence Artificielle", problem: "Tunisie Telecom gère plus de 6 millions de clients mais sa stratégie commerciale repose sur une approche générique non personnalisée. Les mêmes campagnes promotionnelles sont diffusées à l'ensemble de la base clients sans segmentation, générant des taux de conversion faibles estimés à [XYZ]%. Cette approche ignore le potentiel des données comportementales disponibles (historique d'appels, consommation data, historique de recharges) et représente un manque à gagner significatif en termes de revenus additionnels.", objective: "Concevoir, entraîner et déployer un système de recommandation hybride (filtrage collaboratif + filtrage basé sur le contenu) capable de suggérer à chaque client l'offre télécom ou le service additionnel le plus pertinent selon son profil comportemental. Le système doit être exposé via une API REST FastAPI intégrable directement dans le CRM de Tunisie Telecom pour exploitation par les équipes commerciales.", techStack: ["Python 3.11", "Scikit-learn", "Pandas / NumPy", "FastAPI", "PostgreSQL", "SQLAlchemy", "Matplotlib / Seaborn", "Jupyter Notebook", "Surprise (SVD library)", "Docker"], methodology: "Méthodologie CRISP-DM (Cross-Industry Standard Process for Data Mining) appliquée en 6 phases : Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment", competingSolutions: ["Adobe Experience Platform (adobe.com)", "Salesforce Einstein (salesforce.com)", "AWS Personalize (aws.amazon.com)"], actors: [ { name: "Data Scientist", role: "Entraîne et évalue les modèles, configure les paramètres du système" }, { name: "Commercial CRM", role: "Consulte les recommandations via l'interface CRM, les exploite pour les campagnes" }, { name: "Client Télécom", role: "Bénéficiaire final des recommandations personnalisées (acteur indirect)" }, { name: "Administrateur système", role: "Déploie et monitore l'API, gère les accès et la sécurité" } ], sprints: [ { name: "Exploration des données & Feature Engineering", dateRange: "01/11/2023 – 30/11/2023" }, { name: "Modèle de filtrage collaboratif (SVD + KNN)", dateRange: "01/12/2023 – 15/01/2024" }, { name: "Filtrage basé sur le contenu & Hybridation", dateRange: "16/01/2024 – 28/02/2024" }, { name: "Déploiement API FastAPI & Évaluation finale", dateRange: "01/03/2024 – 30/04/2024" } ], perspectives: "Intégration d'un modèle de deep learning (Neural Collaborative Filtering) pour améliorer la précision des recommandations, développement d'un module d'analyse de sentiment des avis clients (NLP), extension du système à la prédiction du churn, mise en place d'un pipeline MLOps complet avec re-entraînement automatique mensuel" }
};

// Generate all sections for one rapport:
async function generateRapportSection(config, callType) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("No Anthropic API key provided. Skipping generation for Call " + callType);
    return { mockResponse: "MOCK_JSON_WOULD_BE_HERE_BUT_NO_API_KEY", callType };
  }

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620", // Mapped from Claude Sonnet
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: buildUserPrompt(config, callType)
    }]
  });
  
  const raw = response.content.map(b => b.text || "").join("");
  const clean = raw.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(clean);
}

async function generateAllRapports() {
  const configs = [
    { config: RAPPORT_1_CONFIG, name: "rapport_1_biat" },
    { config: RAPPORT_2_CONFIG, name: "rapport_2_clinique" },
    { config: RAPPORT_3_CONFIG, name: "rapport_3_tt" },
  ];

  for (const { config, name } of configs) {
    console.log(`\nGenerating ${name}...`);
    try {
      const [partA, partB, partC] = await Promise.all([
        generateRapportSection(config, "A"),
        generateRapportSection(config, "B"),
        generateRapportSection(config, "C"),
      ]);
      const full = { ...partA, ...partB, ...partC };
      await fs.writeFile(
        `${name}.json`,
        JSON.stringify(full, null, 2),
        "utf-8"
      );
      console.log(`✓ ${name}.json saved successfully.`);
    } catch (err) {
      console.error(`✗ Failed ${name}:`, err.message);
    }
  }
  console.log("\nAll rapports generation pipeline finished.");
}

// Execute the generation script if called directly
generateAllRapports();
