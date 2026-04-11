'use client';

import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, PenLine, Check, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { GrammarChecker } from '@/components/grammar-checker';
import { useTranslation } from '@/app/context/language-context';

interface StepTwoProps {
  formData: any;
  onUpdateField: (field: string, value: string) => void;
}

type ActiveStudent = '1' | '2';

interface DedicaceTemplate {
  id: string;
  author: string;
  preview: string;
  fullText: string;
  accentColor: string;
  accentBg: string;
  icon: string;
}

const getDedicaceTemplates = (language: string, isBinome: boolean): DedicaceTemplate[] => {
  const isEn = language === 'en';
  
  if (isEn) {
    return [
      {
        id: 'formal-en',
        author: 'Style — Formal',
        preview: isBinome ? 'We dedicate this work to our parents, whose silent support has been our anchor...' : 'I dedicate this work to my parents, whose silent support has been my anchor...',
        fullText: `Dedications\n✦  ✦  ✦\n\n${isBinome ? 'We dedicate' : 'I dedicate'} this work to ${isBinome ? 'our' : 'my'} parents, whose silent support has been ${isBinome ? 'our' : 'my'} anchor. ${isBinome ? 'You' : 'You'} may not have delivered grand speeches, but every look of pride was enough to give ${isBinome ? 'us' : 'me'} the strength to keep going. This achievement is as much yours as it is ${isBinome ? 'ours' : 'mine'}.\n\nTo ${isBinome ? 'our' : 'my'} siblings, for every shared laugh after a long night of studying, and for always believing in ${isBinome ? 'us' : 'me'}.\n\nTo ${isBinome ? 'our' : 'my'} long-time friends, faithful companions who knew how to be present even from a distance. Your friendship is a rare gift that ${isBinome ? 'we' : 'I'} cherish deeply.\n\n${isBinome ? `To my dear partner [Name], with whom I experienced the highs and lows of this project. Our complementarity and shared perseverance were the key to our success.\n\n` : ''}Finally, to all those who crossed ${isBinome ? 'our' : 'my'} path and left a mark, however fleeting — you have all contributed, in your own way, to shaping the ${isBinome ? 'people we are' : 'person I am'} today.\n\n${isBinome ? '[Your Name] & [Partner Name]' : '[Your Name]'}`,
        accentColor: 'text-rose-500',
        accentBg: 'from-rose-500/10 via-pink-500/5 to-transparent',
        icon: '🌹',
      },
      {
        id: 'religious-en',
        author: 'Style — Spiritual',
        preview: isBinome ? 'We humbly dedicate this work to God, the Almighty, who granted us the health...' : 'I humbly dedicate this work to God, the Almighty, who granted me the health...',
        fullText: `Dedications\n✦  ✦  ✦\n\n${isBinome ? 'We humbly dedicate' : 'I humbly dedicate'} this work to God, the Almighty, who granted ${isBinome ? 'us' : 'me'} the health, will, and wisdom necessary to bring this project to completion. Every conquered obstacle testifies to His infinite grace.\n\nTo ${isBinome ? 'our' : 'my'} mothers, an inexhaustible source of tenderness and devotion, whose prayers accompanied ${isBinome ? 'us' : 'me'} day and night. No words can express the extent of ${isBinome ? 'our' : 'my'} gratitude.\n\nTo ${isBinome ? 'our' : 'my'} fathers, a model of rigor and integrity, who taught ${isBinome ? 'us' : 'me'} the value of hard work. You passed on perseverance as a legacy, and it is the most precious gift.\n\nTo ${isBinome ? 'our' : 'my'} teachers, whose passion for transmitting knowledge inspired and guided ${isBinome ? 'us' : 'me'} throughout this university journey.\n\n${isBinome ? '[Your Name] & [Partner Name]' : '[Your Name]'}`,
        accentColor: 'text-emerald-500',
        accentBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        icon: '🕌',
      }
    ];
  }

  // Default to French
  return [
    {
      id: 'lina',
      author: 'Style — Lina Mrad',
      preview: isBinome ? 'À nos parents, nos piliers silencieux — vous n\'avez peut-être jamais prononcé les grands discours...' : 'À mon père, mon pilier silencieux — tu n\'as peut-être jamais prononcé les grands discours...',
      fullText: `Dédicaces\n✦  ✦  ✦\n\nÀ ${isBinome ? 'nos' : 'mon'} père${isBinome ? 's' : ''}, ${isBinome ? 'nos' : 'mon'} pilier${isBinome ? 's' : ''} silencieux — ${isBinome ? 'vous n\'avez' : 'tu n\'as'} peut-être jamais prononcé les grands discours, mais chaque regard de fierté que ${isBinome ? 'vous nous avez' : 'tu m\'as'} offert a suffi à ${isBinome ? 'nous' : 'me'} donner la force d'avancer. Cette réussite est autant la vôtre que la ${isBinome ? 'nôtre' : 'mienne'}.\n\nÀ ${isBinome ? 'nos' : 'ma'} mère${isBinome ? 's' : ''}, dont les mains n'ont jamais cessé de travailler pour que les ${isBinome ? 'nôtres' : 'miennes'} puissent tenir un stylo — ${isBinome ? 'vous êtes les lumières qui éclairent' : 'tu es la lumière qui éclaire'} ${isBinome ? 'nos' : 'mes'} pas même dans l'obscurité du doute.\n\nÀ ${isBinome ? 'nos frères et sœurs' : 'mon frère [Nom]'}, pour chaque fou rire partagé après une longue nuit d'étude, et pour avoir toujours cru en ${isBinome ? 'nous' : 'moi'}.\n\nÀ ${isBinome ? 'nos' : 'mes'} amis de longue date, fidèles compagnons de route qui ont su être présents même à distance. Votre amitié est un cadeau rare que ${isBinome ? 'nous chérissons' : 'je chéris'} profondément.\n\n${isBinome ? `À mon binôme et ami(e), avec qui j'ai vécu les hauts et les bas de ce projet. Notre complémentarité et notre persévérance commune ont été la clé de notre succès.\n\n` : ''}Enfin, à tous ceux qui ont croisé ${isBinome ? 'notre' : 'mon'} chemin et laissé une trace, même fugace — vous avez tous contribué, à votre façon, à façonner ${isBinome ? 'les personnes que nous sommes' : 'la personne que je suis'} aujourd'hui.\n\n${isBinome ? '[Votre Nom] & [Nom du Binôme]' : '[Votre Nom]'}`,
      accentColor: 'text-rose-500',
      accentBg: 'from-rose-500/10 via-pink-500/5 to-transparent',
      icon: '🌹',
    },
    {
      id: 'amine',
      author: 'Style — Amine Sfar',
      preview: isBinome ? 'Nous dédions humblement ce travail à Allah, le Tout-Puissant, qui nous a accordé la santé...' : 'Je dédie humblement ce travail à Allah, le Tout-Puissant, qui m\'a accordé la santé...',
      fullText: `Dédicaces\n✦  ✦  ✦\n\n${isBinome ? 'Nous dédions' : 'Je dédie'} humblement ce travail à Allah, le Tout-Puissant, qui ${isBinome ? 'nous' : 'm\''} a accordé la santé, la volonté et la sagesse nécessaires pour mener ce projet à terme. Chaque obstacle surmonté témoigne de Sa grâce infinie.\n\nÀ ${isBinome ? 'nos' : 'ma'} mère${isBinome ? 's' : ''}, source inépuisable de tendresse et de dévouement. Aucun mot ne saurait exprimer l'étendue de ${isBinome ? 'notre' : 'ma'} gratitude envers vous.\n\nÀ ${isBinome ? 'nos' : 'mon'} père${isBinome ? 's' : ''}, modèle de rigueur et d'intégrité, qui ${isBinome ? 'nous' : 'm\''} a appris la valeur du travail bien fait. Vous ${isBinome ? 'nous' : 'm\''} avez transmis la persévérance comme héritage, et c'est le plus précieux cadeau.\n\nÀ ${isBinome ? 'nos' : 'mes'} enseignants, dont la passion pour la transmission du savoir ${isBinome ? 'nous' : 'm\''} a inspiré et guidé tout au long de ce parcours universitaire.\n\n${isBinome ? '[Votre Nom] & [Nom du Binôme]' : '[Votre Nom]'}`,
      accentColor: 'text-emerald-500',
      accentBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      icon: '🕌',
    }
  ];
};

type ViewState = 'gallery' | 'editing';

export default function StepTwo({ formData, onUpdateField }: StepTwoProps) {
  const { t, language } = useTranslation();
  const [activeStudent, setActiveStudent] = useState<ActiveStudent>('1');
  const [selectedTemplateId1, setSelectedTemplateId1] = useState<string | null>(formData._dedicaceTemplateId1 || null);
  const [selectedTemplateId2, setSelectedTemplateId2] = useState<string | null>(formData._dedicaceTemplateId2 || null);
  const [viewState1, setViewState1] = useState<ViewState>(formData.dedicace1 ? 'editing' : 'gallery');
  const [viewState2, setViewState2] = useState<ViewState>(formData.dedicace2 ? 'editing' : 'gallery');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isBinome = formData.isBinome;
  const currentViewState = activeStudent === '1' ? viewState1 : viewState2;
  const selectedTemplateId = activeStudent === '1' ? selectedTemplateId1 : selectedTemplateId2;
  const currentContent = activeStudent === '1' ? (formData.dedicace1 || '') : (formData.dedicace2 || '');

  const TEMPLATES = useMemo(() => 
    getDedicaceTemplates(formData.language || language, formData.isBinome || false), 
  [formData.language, language, formData.isBinome]);

  // If selected template is not in the list (e.g. language changed), reset it
  useEffect(() => {
    if (selectedTemplateId1 && !TEMPLATES.find(t => t.id === selectedTemplateId1)) {
      setSelectedTemplateId1(null);
    }
    if (selectedTemplateId2 && !TEMPLATES.find(t => t.id === selectedTemplateId2)) {
      setSelectedTemplateId2(null);
    }
  }, [TEMPLATES, selectedTemplateId1, selectedTemplateId2]);

  const handleSelectTemplate = (template: DedicaceTemplate) => {
    if (activeStudent === '1') {
      setSelectedTemplateId1(template.id);
      onUpdateField('dedicace1', template.fullText);
      onUpdateField('_dedicaceTemplateId1', template.id);
      setViewState1('editing');
    } else {
      setSelectedTemplateId2(template.id);
      onUpdateField('dedicace2', template.fullText);
      onUpdateField('_dedicaceTemplateId2', template.id);
      setViewState2('editing');
    }
  };

  const handleWriteOwn = () => {
    if (activeStudent === '1') {
      setSelectedTemplateId1(null);
      if (!formData.dedicace1) onUpdateField('dedicace1', '');
      onUpdateField('_dedicaceTemplateId1', '');
      setViewState1('editing');
    } else {
      setSelectedTemplateId2(null);
      if (!formData.dedicace2) onUpdateField('dedicace2', '');
      onUpdateField('_dedicaceTemplateId2', '');
      setViewState2('editing');
    }
  };

  const handleBackToGallery = () => {
    if (activeStudent === '1') setViewState1('gallery');
    else setViewState2('gallery');
    setExpandedId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Student Selector for Binomes */}
      {isBinome && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-black/5 shadow-inner">
            <button
              onClick={() => setActiveStudent('1')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                activeStudent === '1' 
                ? 'bg-white text-[#250136] shadow-sm' 
                : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              DÉDICACE ÉTUDIANT 1 ({formData.studentName1 || '...'})
            </button>
            <button
              onClick={() => setActiveStudent('2')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                activeStudent === '2' 
                ? 'bg-white text-[#250136] shadow-sm' 
                : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              DÉDICACE ÉTUDIANT 2 ({formData.studentName2 || '...'})
            </button>
          </div>
        </div>
      )}

      {/* Gallery View */}
      {currentViewState === 'gallery' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/10 to-violet-500/10 text-sm font-medium text-foreground/60 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              {t('step2.stepLabel')} {isBinome ? `— Étudiant ${activeStudent}` : ''}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#250136]">
              {t('step2.title')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              {t('step2.description')}
            </p>
          </div>


        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TEMPLATES.map((template, idx) => {
            const isExpanded = expandedId === template.id;
            return (
              <div
                key={template.id}
                className="group relative rounded-2xl border border-black/[0.06] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Accent gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${template.accentBg}`} />

                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#250136]">{template.author.replace('Style — ', '')}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${template.accentColor} opacity-70`}>
                          Modèle {idx + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Text */}
                  <p className="text-sm text-foreground/50 leading-relaxed mb-4 italic">
                    "{isExpanded ? template.fullText.substring(0, 600) + '...' : template.preview}"
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#250136]/10 to-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <PenLine className="w-6 h-6 text-[#250136]/60 group-hover:text-[#250136] transition-colors" />
          </div>
          <h3 className="font-bold text-[#250136] mb-1">{t('step2.writeOwnTitle')}</h3>
          <p className="text-xs text-foreground/40 max-w-xs">
            {t('step2.writeOwnDesc')}
          </p>
        </div>

        {/* Already have content? Resume editing */}
        {currentContent && (
          <div className="text-center">
            <button
              onClick={() => activeStudent === '1' ? setViewState1('editing') : setViewState2('editing')}
              className="inline-flex items-center gap-2 text-sm text-[#250136]/60 hover:text-[#250136] font-medium transition-colors underline underline-offset-4 decoration-dotted"
            >
              <PenLine className="w-3.5 h-3.5" />
              {t('step2.resumeEditing')}
            </button>
          </div>
        )}
      </div>
    )}

    {/* Editing View */}
    {currentViewState === 'editing' && (
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
                <h2 className="text-2xl font-bold text-[#250136]">{t('step2.yourDedication')}</h2>
                <p className="text-muted-foreground text-sm">
                  {selectedTemplateId
                    ? t('step2.basedOn', { author: TEMPLATES.find(t => t.id === selectedTemplateId)?.author.replace('Style — ', '') || '' })
                    : t('step2.writeOwnHeader')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hint Banner */}
        {selectedTemplateId && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 text-amber-800">
            <Sparkles className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">{t('step2.tip')}</span> {t('step2.tipContent')}
            </p>
          </div>
        )}

        {/* Editor */}
        <div className="relative">
          <div className="absolute -top-3 left-4 px-3 py-0.5 bg-white text-[10px] font-bold uppercase tracking-widest text-foreground/30 rounded-md border border-black/[0.04] shadow-sm z-10">
            <Heart className="w-3 h-3 inline mr-1.5 -mt-0.5" />
            {t('wizard.step2')} {isBinome ? `— Étudiant ${activeStudent}` : ''}
          </div>
          <Textarea
            placeholder="Dédicaces\n✦  ✦  ✦\n\nÀ mes chers parents...\n\nÀ mon/ma binôme...\n\nÀ mes enseignants...\n\n[Votre Nom]"
            value={currentContent}
            onChange={(e) => onUpdateField(activeStudent === '1' ? 'dedicace1' : 'dedicace2', e.target.value)}
            rows={18}
            spellCheck="false"
            lang={language}
            className="pt-5 text-sm leading-relaxed rounded-xl border-black/[0.08] shadow-sm focus:shadow-lg focus:border-[#250136]/30 transition-all resize-y min-h-[350px] font-[system-ui]"
          />
        </div>

        {/* Word count & actions */}
        <div className="flex items-center justify-between text-xs text-foreground/30">
          <span>
            {t('step2.wordCount', { count: (currentContent || '').split(/\s+/).filter(Boolean).length })}
            {' · '}
            {t('step2.charCount', { count: (currentContent || '').length })}
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
          text={currentContent}
          language={formData.language || language}
          onApply={(newText) => onUpdateField(activeStudent === '1' ? 'dedicace1' : 'dedicace2', newText)}
        />
      </div>
    )}
    </div>
  );
}
