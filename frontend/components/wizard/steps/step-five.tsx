'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, PenLine, Check, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { GrammarChecker } from '@/components/grammar-checker';
import { useTranslation } from '@/app/context/language-context';

interface StepFiveProps {
  formData: any;
  onUpdateField: (field: string, value: string) => void;
}

const MAX_CHARS = 3500;

interface IntroTemplate {
  id: string;
  author: string;
  preview: string;
  fullText: string;
  accentColor: string;
  accentBg: string;
  icon: string;
}

const getIntroductionTemplates = (language: string, isBinome: boolean, isInternship: boolean): IntroTemplate[] => {
  const isEn = language === 'en';

  if (isEn) {
    return [
      {
        id: 'erp-production-en',
        author: isInternship ? 'Style — Corporate & Technical' : 'Style — Professional & Technical',
        preview: 'In today\'s fast-paced business environment, companies are increasingly investing in software technology...',
        fullText: `General Introduction\n✦  ✦  ✦\n\n       In today's fast-paced business environment, companies are increasingly investing in software technology to enhance their services, strengthen their agility, and improve operational flexibility. The primary goal is to optimize costs, increase production, and effectively meet market challenges.\n\n       ${isInternship ? `The work presented in this report is the result of ${isBinome ? 'our' : 'my'} immersion within [Company Name], a leader in [Sector]. This experience allowed ${isBinome ? 'us' : 'me'} to apply ${isBinome ? 'our' : 'my'} academic knowledge to a concrete industrial problem.` : `The subject of this project stems from the growing importance of [Subject Area] in modern software development. It aims to explore [Theme] through a rigorous technical approach.`}\n\n       To address these challenges, integrated management solutions have become indispensable. It is within this context that ${isBinome ? 'our' : 'my'} graduation project, titled "[Project Title]", is situated. ${isBinome ? 'Our' : 'My'} objective is to design and implement [Primary Goal], specifically focusing on [Core Functionalities].\n\n       This report details the various phases of ${isBinome ? 'our' : 'my'} project development. The first chapter provides the project context and requirements. The second chapter focuses on the analysis and design. Subsequent chapters detail ${isBinome ? 'our' : 'my'} technical architecture and implementation. Finally, ${isBinome ? 'we' : 'I'} conclude with a summary of ${isBinome ? 'our' : 'my'} findings and future perspectives.`,
        accentColor: 'text-blue-500',
        accentBg: 'from-blue-500/10 via-indigo-500/5 to-transparent',
        icon: '💻',
      },
      {
        id: 'research-oriented-en',
        author: 'Style — Academic & Research',
        preview: 'The work presented in this report is part of the final degree project for the obtainment of...',
        fullText: `General Introduction\n✦  ✦  ✦\n\nThe work presented in this report is part of the graduation project for the obtainment of the [Degree Name] at [Institution Name]. It represents the culmination of ${isBinome ? 'our' : 'my'} academic journey and ${isBinome ? 'our' : 'my'} first major step into the professional world.\n\n${isInternship ? `This project was carried out as an internship at [Company Name]. This host organization is specialized in [Company Activity] and faces challenges such as [Problem].` : `This project focuses on the study of [Project Subject], a field of growing importance due to [Justification]. ${isBinome ? 'Our' : 'My'} research focuses specifically on [Specific Aspect].`}\n\nThe primary motivation for this work stems from the need to address [Problem/Need]. During this ${isInternship ? 'internship' : 'project'}, ${isBinome ? 'we' : 'I'} encountered several technical challenges, notably [Challenges]. The resolution of these issues led ${isBinome ? 'us' : 'me'} to explore innovative solutions such as [Solutions Explored].\n\nThis document is organized as follows:\nFirst, ${isBinome ? 'we' : 'I'} present the ${isInternship ? 'host organization and the' : ''} project context. Next, ${isBinome ? 'we' : 'I'} detail the technical study and architectural choices. The implementation phase is covered in the following section, before concluding with a comprehensive evaluation of the proposed solution.`,
        accentColor: 'text-emerald-500',
        accentBg: 'from-emerald-500/10 via-green-500/5 to-transparent',
        icon: '🔬',
      }
    ];
  }

  return [
    {
      id: 'erp-production-fr',
      author: isInternship ? 'Style — Corporatif & Technique' : 'Style — Professionnel & Technique',
      preview: 'Les entreprises sont prêtes à investir significativement dans l\'adoption de technologies logicielles pour améliorer leurs services...',
      fullText: `Introduction générale\n✦  ✦  ✦\n\n       Les entreprises sont prêtes à investir significativement dans l'adoption de technologies logicielles pour améliorer leurs services, renforcer leur agilité et leur flexibilité, réduire les coûts, augmenter la production et répondre aux défis du marché.\n\n       ${isInternship ? `Le travail présenté dans ce rapport est le fruit de ${isBinome ? 'notre' : 'mon'} immersion au sein de [Nom de l'entreprise], leader dans le secteur de [Secteur]. Cette expérience ${isBinome ? 'nous' : 'm\''}a permis d'appliquer ${isBinome ? 'nos' : 'mes'} connaissances académiques à une problématique industrielle concrète.` : `Le sujet de ce projet découle de l'importance croissante du domaine de [Domaine] dans le développement logiciel moderne. Il vise à explorer [Thématique] à travers une approche technique rigoureuse.`}\n\n       Avec l'évolution des outils technologiques et l'émergence de nouveaux besoins, il devient crucial pour les organisations de repenser leur système d'information. C'est dans ce contexte que s'inscrit ${isBinome ? 'notre' : 'mon'} projet de fin d'études, qui vise à [objectif principal du projet].\n\n       ${isBinome ? 'Notre' : 'Mon'} objectif est de concevoir [description détaillée de l'objectif], tels que [liste des fonctionnalités principales].\n\n       ${isBinome ? 'Notre' : 'Mon'} rapport présente les différentes phases à travers lesquelles ${isBinome ? 'nous sommes passés' : 'je suis passé'} pour réaliser ${isBinome ? 'notre' : 'mon'} projet. Le premier chapitre est consacré au contexte et à l'étude de l'existant. Le deuxième chapitre s'articule autour de l'analyse et de la conception. Enfin, les chapitres suivants mettent en œuvre l'implémentation et les tests de ${isBinome ? 'notre' : 'ma'} solution proposée.`,
      accentColor: 'text-indigo-500',
      accentBg: 'from-indigo-500/10 via-blue-500/5 to-transparent',
      icon: '💻',
    },
    {
      id: 'research-oriented-fr',
      author: 'Style — Académique',
      preview: 'Le travail présenté dans ce rapport s\'inscrit dans le cadre du projet de fin d\'études pour l\'obtention du diplôme de...',
      fullText: `Introduction Générale\n✦  ✦  ✦\n\nLe travail présenté dans ce rapport s'inscrit dans le cadre du projet de fin d'études pour l'obtention du diplôme de [Nom du Diplôme] à [Nom de l'Établissement]. Il constitue l'aboutissement de ${isBinome ? 'notre' : 'mon'} parcours universitaire et ${isBinome ? 'notre' : 'ma'} première véritable étape dans le monde professionnel.\n\n${isInternship ? `Ce projet a été réalisé sous forme de stage au sein de [Nom de l'Entreprise]. Cet organisme d'accueil est spécialisé dans [Activité de l'entreprise] et fait face à des problématiques telles que [Problématique].` : `Ce projet porte sur l'étude de [Sujet du Projet], un domaine qui suscite aujourd'hui un intérêt croissant dû à [Justification de l'intérêt]. ${isBinome ? 'Notre' : 'Mon'} étude se focalise plus particulièrement sur [Aspect Spécifique].`}\n\nLa motivation principale derrière ce choix réside dans le besoin de [Motivation]. Au cours de ce ${isInternship ? 'stage' : 'projet'}, ${isBinome ? 'nous avons été confrontés' : 'j\'ai été confronté'} à plusieurs défis techniques, notamment [Défis]. La résolution de ces problèmes ${isBinome ? 'nous a conduits' : 'm\'a conduit'} à explorer des solutions telles que [Solutions explorées].\n\nCe document est organisé comme suit :\nDans un premier temps, ${isBinome ? 'nous présenterons' : 'je présenterai'} ${isInternship ? 'l\'organisme d\'accueil et' : ''} le contexte du projet. Ensuite, ${isBinome ? 'nous passerons' : 'je passerai'} à l'étude technique et au choix de l'architecture. Le volet implémentation sera traité dans la partie suivante, avant de clore par une évaluation de la solution proposée.`,
      accentColor: 'text-emerald-500',
      accentBg: 'from-emerald-500/10 via-green-500/5 to-transparent',
      icon: '🔬',
    },
  ];
};

type ViewState = 'gallery' | 'editing';

export default function StepFive({ formData, onUpdateField }: StepFiveProps) {
  const { t, language } = useTranslation();
  const [viewState, setViewState] = useState<ViewState>(() => {
    return formData.introduction ? 'editing' : 'gallery';
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(formData._introTemplateId || null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isInternship = formData.isInternship ?? true;
  const TEMPLATES = getIntroductionTemplates(formData.language || language, formData.isBinome || false, isInternship);

  const handleSelectTemplate = (template: IntroTemplate) => {
    setSelectedTemplateId(template.id);
    onUpdateField('introduction', template.fullText);
    onUpdateField('_introTemplateId', template.id);
    setViewState('editing');
  };

  const handleWriteOwn = () => {
    setSelectedTemplateId(null);
    if (!formData.introduction) {
      onUpdateField('introduction', '');
    }
    onUpdateField('_introTemplateId', '');
    setViewState('editing');
  };

  const handleBackToGallery = () => {
    setViewState('gallery');
    setExpandedId(null);
  };

  // Gallery View
  if (viewState === 'gallery') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 text-sm font-medium text-foreground/60 mb-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            {t('step5.stepLabel')} — {isInternship ? 'Stage' : 'Académique'}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#250136]">
            {t('step5.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {isInternship 
              ? "Présentez l'organisme d'accueil, le contexte professionnel de votre stage et les enjeux du projet."
              : "Présentez la thématique de votre projet, les motivations académiques et le cadre de votre étude."}
          </p>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TEMPLATES.map((template, idx) => {
            const isExpanded = expandedId === template.id;
            return (
              <div
                key={template.id}
                className="group relative rounded-2xl border border-black/[0.06] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                {/* Accent gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${template.accentBg}`} />

                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#250136]">{template.author}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${template.accentColor} opacity-70`}>
                          Modèle {idx + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Text */}
                  <p className="text-sm text-foreground/50 leading-relaxed mb-4 italic">
                    &ldquo;{isExpanded ? template.fullText.substring(0, 600) + '...' : template.preview}&rdquo;
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? t('step2.reduce') : t('step2.viewMore')}
                    </button>
                    <div className="flex-1" />
                    <Button
                      onClick={() => handleSelectTemplate(template)}
                      size="sm"
                      className="rounded-full px-5 h-9 text-xs font-bold bg-[#250136] hover:bg-[#3a0a4f] text-white gap-1.5 shadow-lg shadow-[#250136]/20 transition-all hover:shadow-xl hover:shadow-[#250136]/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t('step2.use')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Write Your Own CTA */}
        <div
          onClick={handleWriteOwn}
          className="group relative rounded-2xl border-2 border-dashed border-black/10 hover:border-[#250136]/30 bg-gradient-to-br from-slate-50 to-white p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-all duration-500 hover:-translate-y-0.5"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#250136]/10 to-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <PenLine className="w-6 h-6 text-[#250136]/60 group-hover:text-[#250136] transition-colors" />
          </div>
          <h3 className="font-bold text-[#250136] mb-1">{t('step5.writeOwnTitle')}</h3>
          <p className="text-xs text-foreground/40 max-w-xs">
            {t('step5.writeOwnDesc')}
          </p>
        </div>

        {/* Resume editing if content exists */}
        {formData.introduction && (
          <div className="text-center">
            <button
              onClick={() => setViewState('editing')}
              className="inline-flex items-center gap-2 text-sm text-[#250136]/60 hover:text-[#250136] font-medium transition-colors underline underline-offset-4 decoration-dotted"
            >
              <PenLine className="w-3.5 h-3.5" />
              {t('step5.resumeEditing')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Editing View
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToGallery}
              className="w-9 h-9 rounded-xl border border-black/[0.06] bg-white shadow-sm flex items-center justify-center text-foreground/50 hover:text-foreground hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[#250136]">{t('wizard.step5')}</h2>
              <p className="text-muted-foreground text-sm">
                {selectedTemplateId
                  ? t('step2.basedOn', { author: TEMPLATES.find(t => t.id === selectedTemplateId)?.author || '' })
                  : t('step2.writeOwnHeader')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hint Banner */}
      {selectedTemplateId && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/50 text-indigo-800">
          <Sparkles className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">{t('step2.tip')}</span> {t('step5.tipContent')}
          </p>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <div className="absolute -top-3 left-4 px-3 py-0.5 bg-white text-[10px] font-bold uppercase tracking-widest text-foreground/30 rounded-md border border-black/[0.04] shadow-sm z-10">
          <FileText className="w-3 h-3 inline mr-1.5 -mt-0.5" />
          {t('wizard.step5')} — {isInternship ? 'Contexte Stage' : 'Thématique Projet'}
        </div>
        <Textarea
          placeholder={isInternship 
            ? "Introduction Générale\n✦  ✦  ✦\n\nCe stage a été effectué au sein de [Société]...\n\nL'organisme d'accueil est spécialisé dans...\n\nLe projet s'inscrit dans le cadre de..."
            : "Introduction Générale\n✦  ✦  ✦\n\nLe présent projet porte sur l'étude de [Thématique]...\n\nCe choix est motivé par l'intérêt croissant pour...\n\nL'objectif est d'analyser..."
          }
          value={formData.introduction || ''}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onUpdateField('introduction', e.target.value);
            }
          }}
          rows={18}
          spellCheck="false"
          lang={language}
          className={`pt-5 text-sm leading-relaxed rounded-xl border-black/[0.08] shadow-sm focus:shadow-lg focus:border-[#250136]/30 transition-all resize-y min-h-[350px] font-[system-ui] ${(formData.introduction?.length || 0) > MAX_CHARS * 0.9 ? 'border-amber-400 ring-amber-50' : ''}`}
        />
        {(formData.introduction?.length || 0) >= MAX_CHARS && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 animate-in fade-in zoom-in duration-300 z-20">
             <p className="text-[10px] font-black uppercase text-center tracking-widest">
               ⚠️ LIMITE DE PAGE ATTEINTE ! Veuillez continuer votre texte dans un nouveau chapitre ou section.
             </p>
          </div>
        )}
      </div>

      {/* Word count & actions */}
      <div className="flex items-center justify-between text-xs text-foreground/30">
        <span className={(formData.introduction?.length || 0) >= MAX_CHARS ? 'text-red-500 font-bold' : ''}>
          {t('step2.wordCount', { count: (formData.introduction || '').split(/\s+/).filter(Boolean).length })}
          {' · '}
          {t('step2.charCount', { count: (formData.introduction || '').length })} / {MAX_CHARS}
        </span>
        <button
          onClick={handleBackToGallery}
          className="inline-flex items-center gap-1.5 text-foreground/40 hover:text-foreground/70 transition-colors font-medium"
        >
          <Sparkles className="w-3 h-3" />
          {t('step2.seeOtherTemplates')}
        </button>
      </div>

      {/* Grammar Checker */}
      <GrammarChecker
        text={formData.introduction || ''}
        language={formData.language || language}
        onApply={(newText: string) => onUpdateField('introduction', newText)}
      />
    </div>
  );
}
