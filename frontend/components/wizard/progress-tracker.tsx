import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/app/context/language-context';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  completedFields?: Record<string, boolean>;
  onNavigate: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

export default function ProgressTracker({ 
  currentStep, 
  totalSteps, 
  completedFields = {},
  onNavigate,
  onNext,
  onPrevious,
  onSubmit
}: ProgressTrackerProps) {
  const { t } = useTranslation();

  const stepTitles = [
    t('wizard.step1'),
    t('wizard.step2'),
    t('wizard.step3'),
    t('wizard.step4'),
    t('wizard.step5'),
    t('wizard.step6'),
    t('wizard.step7'),
  ];
  
  // Map step numbers to their completion status based on actual formData content
  const isStepCompleted = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1: return !!completedFields.cover;
      case 2: return !!completedFields.dedicace;
      case 3: return !!completedFields.remerciements;
      case 4: return !!completedFields.toc;
      case 5: return !!completedFields.introduction;
      case 6: return !!completedFields.chapters;
      case 7: return !!completedFields.conclusion;
      default: return false;
    }
  };

  return (
    <div className="flex items-center justify-center p-2 rounded-full bg-white/80 backdrop-blur-md shadow-xl mx-auto w-max max-w-full">
      
      {/* Back Handle */}
      <button
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="px-6 py-2 text-sm font-bold disabled:opacity-20 flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> {t('common.previous')}
      </button>

      {/* Steps Track */}
      <div className="flex items-center h-12 px-6 border-x border-slate-200/60 mx-2">
        {[1, 2, 3, 4, 5, 6, 7].map((stepNum, idx) => {
          const completed = isStepCompleted(stepNum);
          const isCurrent = stepNum === currentStep;
          const isPassed = stepNum < currentStep;

          return (
            <div key={stepNum} className="flex items-center">
              {/* Connector */}
              {idx > 0 && (
                <div className={`w-8 h-1 mx-1 rounded-full transition-colors duration-300 ${
                  completed || isPassed ? 'bg-primary' : 'bg-slate-200'
                }`} />
              )}
              
              {/* The Step Circle */}
              <div 
                onClick={() => stepNum < currentStep && onNavigate(stepNum)}
                title={stepTitles[idx]}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 cursor-pointer transition-all duration-300
                  ${isCurrent 
                    ? 'bg-primary border-primary text-white scale-110 shadow-lg' 
                    : completed
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                      : isPassed
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                  }
                `}
              >
                {completed && !isCurrent ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="font-bold text-sm">{stepNum}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Handle */}
      <button
        onClick={currentStep === totalSteps ? onSubmit : onNext}
        className="px-8 py-2 ml-2 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90"
      >
        {currentStep === totalSteps ? t('common.submit') : t('common.next')}
      </button>

    </div>
  );
}
