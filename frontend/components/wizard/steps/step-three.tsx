'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, PenLine, Check, ChevronDown, ChevronUp, ArrowLeft, Handshake } from 'lucide-react';
import { GrammarChecker } from '@/components/grammar-checker';
import { useTranslation } from '@/app/context/language-context';

interface StepThreeProps {
  formData: Record<string, any>;
  onUpdateField: (field: string, value: any) => void;
}

interface RemerciementTemplate {
  id: string;
  author: string;
  preview: string;
  fullText: string;
  accentColor: string;
  accentBg: string;
  icon: string;
}

const getRemerciementsTemplates = (language: string, isBinome: boolean, isInternship: boolean, formData: Record<string, any>): RemerciementTemplate[] => {
  const supervisorName = formData.supervisor || '[Supervisor\'s Name]';
  const universityName = formData.university || '[Institution Name]';
  const companyName = formData.company || '[Company Name]';
  const student1 = formData.studentName1 || '[Your Name]';
  const student2 = formData.studentName2 || '[Partner Name]';

  const isEn = language === 'en';

  if (isEn) {
    return [
      {
        id: 'formal-elaborate-en',
        author: 'Style — Formal & Elaborate',
        preview: isBinome ? 'At the end of this work, it is a great pleasure for us to express our gratitude...' : 'At the end of this work, it is a great pleasure for me to express my gratitude...',
        fullText: `Acknowledgments\n✦  ✦  ✦\n\nAt the end of this work, it is a great pleasure for ${isBinome ? 'us' : 'me'} to express ${isBinome ? 'our' : 'my'} gratitude and deep appreciation to all the people who contributed, directly or indirectly, to the realization of this graduation project.\n\n${isBinome ? 'We' : 'I'} extend ${isBinome ? 'our' : 'my'} most sincere thanks to ${isBinome ? 'our' : 'my'} university supervisor, ${supervisorName}, professor at ${universityName}, for ${isBinome ? 'their' : 'their'} remarkable availability, constant benevolence, and the quality of ${isBinome ? 'their' : 'their'} supervision. ${isBinome ? 'Their' : 'Their'} valuable guidance and scientific rigor have been decisive assets throughout this work.\n\n${isInternship ? `${isBinome ? 'Our' : 'My'} thanks also go to [Title] [External Supervisor's Name], supervisor at ${companyName}, for welcoming ${isBinome ? 'us' : 'me'} generously, sharing ${isBinome ? 'their' : 'their'} professional expertise, and trusting ${isBinome ? 'our' : 'my'} potential from the very first day of ${isBinome ? 'our' : 'my'} internship.\n\n` : ''}${isBinome ? 'We' : 'I'} would like to express ${isBinome ? 'our' : 'my'} profound gratitude to the entire teaching staff of ${universityName}, in particular [Teacher 1] and [Teacher 2], for their flawless pedagogical involvement and the quality of the teaching provided.\n\n${isBinome ? 'We' : 'I'} warmly thank the jury members for the honor they do ${isBinome ? 'us' : 'me'} by accepting to evaluate this work. Their constructive remarks and suggestions will be a precious help in ${isBinome ? 'our' : 'my'} professional and personal development.\n\nFinally, ${isBinome ? 'we' : 'I'} would like to thank ${isBinome ? 'our' : 'my'} respective families for their patience, their unfailing moral support, and the sacrifices made throughout ${isBinome ? 'our' : 'my'} university curriculum.\n\n${isBinome ? `${student1} & ${student2}` : student1}`,
        accentColor: 'text-blue-500',
        accentBg: 'from-blue-500/10 via-indigo-500/5 to-transparent',
        icon: '🏛️',
      },
      {
        id: 'formal-concise-en',
        author: 'Style — Concise',
        preview: isBinome ? 'We express our sincere thanks to everyone who facilitated this journey...' : 'I express my sincere thanks to everyone who facilitated this journey...',
        fullText: `Acknowledgments\n✦  ✦  ✦\n\n${isBinome ? 'We' : 'I'} express ${isBinome ? 'our' : 'my'} sincere thanks to everyone who facilitated ${isInternship ? 'this internship' : 'this project'}.\n\n${isInternship ? `${isBinome ? 'We' : 'I'} would particularly like to thank [Title] [External Supervisor's Name], ${isBinome ? 'our' : 'my'} external supervisor at ${companyName}, for their warm welcome, support, and total trust in ${isBinome ? 'us' : 'me'}.\n\n` : ''}${isBinome ? 'We' : 'I'} would also like to express ${isBinome ? 'our' : 'my'} deep gratitude to ${supervisorName}, ${isBinome ? 'our' : 'my'} supervisor at ${universityName}, for their supervision, support, and precious advice that guided ${isBinome ? 'us' : 'me'} throughout this work.\n\n${isBinome ? 'We' : 'I'} wish to express ${isBinome ? 'our' : 'my'} profound gratitude to all those who contributed to ${isBinome ? 'our' : 'my'} training, notably the teachers at ${universityName}, who played an essential role in ${isBinome ? 'our' : 'my'} academic journey.\n\nFurthermore, ${isBinome ? 'we' : 'I'} would like to express ${isBinome ? 'our' : 'my'} sincere gratitude to the jury members who devoted their time and expertise to evaluating ${isBinome ? 'our' : 'my'} work.\n\n${isBinome ? `${student1} & ${student2}` : student1}`,
        accentColor: 'text-teal-500',
        accentBg: 'from-teal-500/10 via-cyan-500/5 to-transparent',
        icon: '📋',
      }
    ];
  }

  return [
    {
      id: 'formal-elaborate-fr',
      author: 'Style Formel — Élaboré',
      preview: isBinome ? 'Au terme de ce travail, il nous est particulièrement agréable d\'exprimer notre gratitude...' : 'Au terme de ce travail, il m\'est particulièrement agréable d\'exprimer ma gratitude...',
      fullText: `Remerciements\n✦  ✦  ✦\n\nAu terme de ce travail, il ${isBinome ? 'nous' : 'm\''} est particulièrement agréable d'exprimer ${isBinome ? 'notre' : 'ma'} gratitude et ${isBinome ? 'nos' : 'mes'} vifs remerciements à toutes les personnes qui ont contribué, de près ou de loin, à la réalisation de ce projet de fin d'études.\n\n${isBinome ? 'Nous adressons nos' : 'J\'adresse mes'} plus sincères remerciements à ${isBinome ? 'notre' : 'mon'} encadrant(e) universitaire, ${supervisorName}, professeur(e) à ${universityName}, pour sa disponibilité remarquable, sa bienveillance constante et la qualité de son encadrement.\n\n${isInternship ? `${isBinome ? 'Nos' : 'Mes'} remerciements s'adressent également à [Titre] [Nom de l'encadrant externe], encadrant(e) au sein de la société ${companyName}, pour ${isBinome ? 'nous' : 'm\''} avoir accueilli${isBinome ? 's' : ''} avec générosité, partagé son expertise professionnelle et fait confiance à ${isBinome ? 'notre' : 'mon'} potentiel dès le premier jour de ${isBinome ? 'notre' : 'mon'} stage.\n\n` : ''}${isBinome ? 'Nous tenons' : 'Je tiens'} à exprimer ${isBinome ? 'notre' : 'ma'} profonde reconnaissance envers l'ensemble du corps enseignant de ${universityName}, pour leur implication pédagogique sans faille.\n\n${isBinome ? 'Nous remercions' : 'Je remercie'} chaleureusement les membres du jury pour l'honneur qu'ils ${isBinome ? 'nous' : 'me'} font en acceptant d'évaluer ce travail.\n\nEnfin, ${isBinome ? 'nous souhaitons' : 'je souhaite'} remercier ${isBinome ? 'nos familles respectives' : 'ma famille'} pour leur patience, leur soutien moral indéfectible et les sacrifices consentis.\n\n${isBinome ? `${student1} & ${student2}` : student1}`,
      accentColor: 'text-blue-500',
      accentBg: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      icon: '🏛️',
    },
    {
      id: 'formal-concise-fr',
      author: 'Style Formel — Concis',
      preview: isBinome ? 'Nous exprimons nos sincères remerciements à tous ceux qui ont facilité notre travail...' : 'J\'exprime mes sincères remerciements à tous ceux qui ont facilité mon travail...',
      fullText: `Remerciements\n✦  ✦  ✦\n\n${isBinome ? 'Nous exprimons nos' : 'J\'exprime mes'} sincères remerciements à tous ceux qui ont facilité ${isBinome ? 'notre' : 'mon'} ${isInternship ? 'stage' : 'projet'}.\n\n${isInternship ? `${isBinome ? 'Nous souhaitons' : 'Je souhaite'} tout particulièrement remercier [Titre] [Nom de l'encadrant externe], ${isBinome ? 'notre' : 'mon'} encadrant(e) externe de la société ${companyName}, pour son accueil chaleureux, son soutien et sa confiance totale envers ${isBinome ? 'nous' : 'moi'}.\n\n` : ''}${isBinome ? 'Nous tenons' : 'Je tiens'} également à exprimer ${isBinome ? 'notre' : 'ma'} profonde gratitude envers ${supervisorName}, ${isBinome ? 'notre' : 'mon'} encadrant(e) au sein de ${universityName}, pour son encadrement, son soutien et ses précieux conseils qui ${isBinome ? 'nous' : 'm\''} ont guidé${isBinome ? 's' : ''} tout au long de ${isBinome ? 'notre' : 'mon'} travail.\n\n${isBinome ? 'Nous souhaitons' : 'Je souhaite'} exprimer ${isBinome ? 'notre' : 'ma'} profonde gratitude envers tous ceux qui ont contribué à ${isBinome ? 'notre' : 'ma'} formation.\n\nDe plus, ${isBinome ? 'nous tenons' : 'je tiens'} à exprimer ${isBinome ? 'notre' : 'ma'} sincère reconnaissance envers les membres du jury qui ont consacré leur temps et leur expertise à évaluer ${isBinome ? 'notre' : 'mon'} travail.\n\n${isBinome ? `${student1} & ${student2}` : student1}`,
      accentColor: 'text-teal-500',
      accentBg: 'from-teal-500/10 via-cyan-500/5 to-transparent',
      icon: '📋',
    }
  ];
};

type ViewState = 'gallery' | 'editing';

export default function StepThree({ formData, onUpdateField }: StepThreeProps) {
  const { t, language } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(formData._remerciementsTemplateId || null);
  const [viewState, setViewState] = useState<ViewState>(formData.remerciements ? 'editing' : 'gallery');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TEMPLATES = useMemo(() => 
    getRemerciementsTemplates(formData.language || language, formData.isBinome || false, formData.isInternship ?? true, formData), 
  [formData.language, language, formData.isBinome, formData.isInternship, formData.supervisor, formData.university, formData.company, formData.studentName1, formData.studentName2]);

  useEffect(() => {
    if (selectedTemplateId && !TEMPLATES.find(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(null);
    }
  }, [TEMPLATES, selectedTemplateId]);

  const handleSelectTemplate = (template: RemerciementTemplate) => {
    setSelectedTemplateId(template.id);
    onUpdateField('remerciements', template.fullText);
    onUpdateField('_remerciementsTemplateId', template.id);
    setViewState('editing');
  };

  const handleWriteOwn = () => {
    setSelectedTemplateId(null);
    if (!formData.remerciements) {
      onUpdateField('remerciements', '');
    }
    onUpdateField('_remerciementsTemplateId', '');
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 text-sm font-medium text-foreground/60 mb-2">
            <Handshake className="w-3.5 h-3.5 text-blue-400" />
            {t('step3.stepLabel')}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#250136]">
            {t('step3.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {t('step3.description')}
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#250136]/10 to-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <PenLine className="w-6 h-6 text-[#250136]/60 group-hover:text-[#250136] transition-colors" />
          </div>
          <h3 className="font-bold text-[#250136] mb-1">{t('step3.writeOwnTitle')}</h3>
          <p className="text-xs text-foreground/40 max-w-xs">
            {t('step3.writeOwnDesc')}
          </p>
        </div>

        {/* Resume editing if content exists */}
        {formData.remerciements && (
          <div className="text-center">
            <button
              onClick={() => setViewState('editing')}
              className="inline-flex items-center gap-2 text-sm text-[#250136]/60 hover:text-[#250136] font-medium transition-colors underline underline-offset-4 decoration-dotted"
            >
              <PenLine className="w-3.5 h-3.5" />
              {t('step3.resumeEditing')}
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
              <h2 className="text-2xl font-bold text-[#250136]">{t('step3.yourAcknowledgements')}</h2>
              <p className="text-muted-foreground text-sm">
                {selectedTemplateId
                  ? t('step2.basedOn', { author: TEMPLATES.find(t => t.id === selectedTemplateId)?.author.replace('Style Formel — ', '') || '' })
                  : t('step2.writeOwnHeader')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hint Banner */}
      {selectedTemplateId && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-800">
          <Sparkles className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">{t('step2.tip')}</span> {t('step3.tipContent')}
          </p>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <div className="absolute -top-3 left-4 px-3 py-0.5 bg-white text-[10px] font-bold uppercase tracking-widest text-foreground/30 rounded-md border border-black/[0.04] shadow-sm z-10">
          <Handshake className="w-3 h-3 inline mr-1.5 -mt-0.5" />
          {t('wizard.step3')}
        </div>
        <Textarea
          placeholder={"Remerciements\n✦  ✦  ✦\n\nNous exprimons nos sincères remerciements...\n\nNous souhaitons tout particulièrement remercier...\n\n[Votre Nom]"}
          value={formData.remerciements || ''}
          onChange={(e) => onUpdateField('remerciements', e.target.value)}
          rows={18}
          spellCheck="false"
          lang={language}
          className="pt-5 text-sm leading-relaxed rounded-xl border-black/[0.08] shadow-sm focus:shadow-lg focus:border-[#250136]/30 transition-all resize-y min-h-[350px] font-[system-ui]"
        />
      </div>

      {/* Word count & actions */}
      <div className="flex items-center justify-between text-xs text-foreground/30">
        <span>
          {t('step2.wordCount', { count: (formData.remerciements || '').split(/\s+/).filter(Boolean).length })}
          {' · '}
          {t('step2.charCount', { count: (formData.remerciements || '').length })}
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
        text={formData.remerciements || ''}
        language={formData.language || language}
        onApply={(newText) => onUpdateField('remerciements', newText)}
      />
    </div>
  );
}
