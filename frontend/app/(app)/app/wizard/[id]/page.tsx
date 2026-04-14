'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/auth-context';
import { useTranslation } from '../../../../context/language-context';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '../../../../../lib/api';
import { Check } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import WizardHeader from '../../../../../components/wizard/wizard-header';
import WizardContainer from '../../../../../components/wizard/wizard-container';
import ProgressTracker from '../../../../../components/wizard/progress-tracker';

export default function WizardPage() {
  const { user, isLoading } = useAuth();
  const { t, setLanguage } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const rapportId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [chaptersConfig, setChaptersConfig] = useState<any[]>([]);
  
  const [isFetching, setIsFetching] = useState(true);
  const autoSaveRef = useRef<'idle' | 'saving' | 'saved'>('idle');
  const saveIndicatorRef = useRef<HTMLDivElement>(null);

  // According to backend logic
  const totalSteps = 7; 
  // 1: Cover, 2: Dédicace, 3: Remerciements, 4: TOC (read-only view later), 5: Intro, 6: Chapters, 7: Conclusion

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || !rapportId) return;

    const fetchState = async () => {
      try {
        const data = await apiClient(`/wizard/${rapportId}/state`);
        if (data.wizardAnswers) {
          setFormData(data.wizardAnswers);
          // Sync global language state with document language
          if (data.wizardAnswers.language) {
            setLanguage(data.wizardAnswers.language);
          }
        }
        if (data.chaptersConfig) setChaptersConfig(data.chaptersConfig);
        if (data.currentStep) setCurrentStep(data.currentStep);
      } catch (e) {
        console.error('Failed to load rapport state', e);
      } finally {
        setIsFetching(false);
      }
    };
    fetchState();
  }, [user, rapportId]);

  // Update save indicator without re-rendering the tree
  const updateSaveIndicator = useCallback((status: 'idle' | 'saving' | 'saved') => {
    autoSaveRef.current = status;
    const el = saveIndicatorRef.current;
    if (!el) return;
    if (status === 'saving') {
      el.setAttribute('data-status', 'saving');
    } else if (status === 'saved') {
      el.setAttribute('data-status', 'saved');
    } else {
      el.setAttribute('data-status', 'idle');
    }
  }, []);

  // Debounced auto-save — 3 second delay, updates DOM directly to avoid re-renders
  useEffect(() => {
    if (isFetching || Object.keys(formData).length === 0) return;

    const saveTimer = setTimeout(async () => {
      updateSaveIndicator('saving');
      try {
        await apiClient(`/rapports/${rapportId}/autosave`, {
          data: {
            currentStep,
            wizardAnswers: formData
          },
          method: 'PATCH'
        });
        updateSaveIndicator('saved');
        setTimeout(() => updateSaveIndicator('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        updateSaveIndicator('idle');
      }
    }, 3000);

    return () => clearTimeout(saveTimer);
  }, [formData, currentStep, isFetching, rapportId, updateSaveIndicator]);

  const saveExplicitStep = async (step: number) => {
    try {
      if (step === 1) await apiClient(`/wizard/${rapportId}/cover`, { data: formData });
      if (step === 2) await apiClient(`/wizard/${rapportId}/dedicace`, { data: formData });
      if (step === 3) await apiClient(`/wizard/${rapportId}/remerciements`, { data: formData });
      if (step === 5) await apiClient(`/wizard/${rapportId}/introduction`, { data: formData });
      if (step === 7) await apiClient(`/wizard/${rapportId}/conclusion`, { data: formData });
    } catch (e) {
      console.error('Explicit save failed for step', step, e);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      await saveExplicitStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
      await saveExplicitStep(currentStep); // Save final step
      router.push('/dashboard');
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  // Compute which sections have real content (must be before any early return — Rules of Hooks)
  const completedFields = useMemo(() => ({
    cover: !!(formData.university || formData.projectTitle || formData.studentName1),
    dedicace: !!((formData.dedicace1 || formData.dedicace2 || formData.dedicace)?.trim().length > 20),
    remerciements: !!(formData.remerciements && formData.remerciements.trim().length > 20),
    toc: currentStep > 4,
    introduction: !!(formData.introduction && formData.introduction.trim().length > 20),
    chapters: chaptersConfig.length > 0,
    conclusion: !!(formData.conclusion && formData.conclusion.trim().length > 20),
  }), [formData, currentStep, chaptersConfig]);

  const isWideMode = currentStep === 4 || currentStep === 6;

  if (isLoading || isFetching) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 glass-panel p-10">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          </div>
          <p className="text-foreground/70 font-medium tracking-wide">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  // Seamless light/dark glassmorphism layout
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10 pt-4">
      
      {/* Unified SaaS Header: Tracker + Status on the same line */}
      <div className="flex flex-col md:flex-row items-center gap-4 w-full mb-4 relative z-20">
        <div className="flex-1 order-2 md:order-1 w-full">
          <ProgressTracker 
            currentStep={currentStep} 
            totalSteps={totalSteps}
            completedFields={completedFields}
            onNavigate={setCurrentStep} 
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
          />
        </div>
        <div className="order-1 md:order-2 shrink-0">
          <WizardHeader indicatorRef={saveIndicatorRef} />
        </div>
      </div>

      {/* Main Content Grid - Reduced to just TWO beautiful cohesive panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Center Section - Active Step Form Area */}
        <div className={cn(
          "flex flex-col transition-all duration-700 ease-in-out",
          isWideMode ? "lg:col-span-12 xl:col-span-12 min-h-[800px]" : "lg:col-span-7 xl:col-span-8 h-[650px]"
        )}>
          <div className={cn(
            "glass-panel flex flex-col overflow-hidden shadow-md flex-1 bg-white/60 dark:bg-card/40 transition-all",
            isWideMode && "rounded-[1.5rem] bg-transparent shadow-none border-none"
          )}>
            <div className={cn(
              "flex-1 overflow-y-auto custom-scrollbar transition-all",
              !isWideMode ? "p-8" : "p-0"
            )}>
              <WizardContainer
                rapportId={rapportId}
                currentStep={currentStep}
                formData={formData}
                chaptersConfig={chaptersConfig}
                onUpdateField={handleUpdateField}
                setChaptersConfig={setChaptersConfig}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
                totalSteps={totalSteps}
                embeddedMode={true}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Live Document Only - Hidden in Wide Mode */}
        {!isWideMode && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[650px] animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="glass-panel p-6 flex flex-col gap-4 border-transparent shadow-md bg-white/40 dark:bg-card/30 flex-1">
              
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold tracking-tight text-lg text-foreground/90">{t('common.stepPreview', { defaultValue: 'Live Document' })}</h3>
                {/* Optional: we can indicate AI or Sync status quietly up here if needed, but it's already in the main header */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full">
                   <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Auto-Sync</span>
                </div>
              </div>
              
              {/* Embedded Document Preview */}
              <div className="flex-1 bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="flex-1 relative custom-scrollbar overflow-y-auto w-full p-1">
                  <WizardContainer
                    rapportId={rapportId}
                    currentStep={currentStep}
                    formData={formData}
                    chaptersConfig={chaptersConfig}
                    onUpdateField={handleUpdateField}
                    setChaptersConfig={setChaptersConfig}
                    onNext={() => {}}
                    onPrevious={() => {}}
                    onSubmit={() => {}}
                    totalSteps={totalSteps}
                    embeddedMode={false}
                    onlyPreview={true}
                  />
                </div>
              </div>
              
              {/* Detailed Document Outline */}
              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-2 mt-auto">
                <h4 className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold mb-3">Document Outline</h4>
                <div className="space-y-1.5 h-[280px] overflow-y-auto custom-scrollbar pr-1">
                  {[
                    { label: t('wizard.step1'), key: 'cover' },
                    { label: t('wizard.step2'), key: 'dedicace' },
                    { label: t('wizard.step3'), key: 'remerciements' },
                    { label: t('wizard.step4'), key: 'toc' },
                    { label: t('wizard.step5'), key: 'introduction' },
                    { label: t('wizard.step6'), key: 'chapters' },
                    { label: t('wizard.step7'), key: 'conclusion' },
                  ].map((item, idx) => {
                     const stepNum = idx + 1;
                     const isCurrent = currentStep === stepNum;
                     const hasContent = completedFields[item.key as keyof typeof completedFields];
                     
                     return (
                      <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300 ${
                        isCurrent ? 'bg-primary/10 border-primary/30 shadow-sm translate-x-1' : 
                        hasContent ? 'bg-emerald-50 border-emerald-200/60' : 
                        'bg-white/40 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          hasContent && !isCurrent ? 'bg-emerald-100 text-emerald-600' :
                          isCurrent ? 'bg-primary text-white scale-110' : 
                          'bg-slate-200/60 dark:bg-black/40 text-foreground/40'
                        }`}>
                          {hasContent && !isCurrent ? <Check className="w-3 h-3" strokeWidth={4} /> : stepNum}
                        </div>
                        <span className={`text-[11px] font-semibold tracking-wide flex-1 ${
                          isCurrent ? 'text-primary' : hasContent ? 'text-emerald-700' : 'text-foreground/40'
                        }`}>
                          {item.label}
                        </span>
                        {hasContent && !isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Ready</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
