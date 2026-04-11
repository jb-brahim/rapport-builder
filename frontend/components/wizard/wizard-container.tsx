'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import StepOne from './steps/step-one';
import StepTwo from './steps/step-two';
import StepThree from './steps/step-three';
import StepFour from './steps/step-four';
import StepFive from './steps/step-five';
import StepSix from './steps/step-six';
import StepSeven from './steps/step-seven';
import DocumentPreview from './document-preview';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';

interface WizardContainerProps {
  rapportId: string;
  currentStep: number;
  formData: Record<string, any>;
  chaptersConfig: any[];
  onUpdateField: (field: string, value: any) => void;
  setChaptersConfig: (val: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  totalSteps: number;
  embeddedMode?: boolean;
  onlyPreview?: boolean;
}

export default function WizardContainer({
  rapportId,
  currentStep,
  formData,
  chaptersConfig,
  setChaptersConfig,
  onUpdateField,
  onNext,
  onPrevious,
  onSubmit,
  totalSteps,
  embeddedMode = false,
  onlyPreview = false
}: WizardContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPreview = () => {
    const element = document.getElementById('document-preview');
    if (element) {
      window.print();
    }
  };

  if (onlyPreview) {
    return (
      <div className="w-full h-full flex flex-col pt-1">
        <DocumentPreview formData={formData} currentStep={currentStep} />
      </div>
    );
  }

  const stepContent = (
    <div className="pb-20">
      {currentStep === 1 && <StepOne formData={formData} onUpdateField={onUpdateField} />}
      {currentStep === 2 && <StepTwo formData={formData} onUpdateField={onUpdateField} />}
      {currentStep === 3 && <StepThree formData={formData} onUpdateField={onUpdateField} />}
      {currentStep === 4 && <StepFour rapportId={rapportId} apiClient={apiClient} formData={formData} onUpdateField={onUpdateField} />}
      {currentStep === 5 && <StepFive formData={formData} onUpdateField={onUpdateField} />}
      {currentStep === 6 && <StepSix rapportId={rapportId} chaptersConfig={chaptersConfig} setChaptersConfig={setChaptersConfig} apiClient={apiClient} formData={formData} />}
      {currentStep === 7 && <StepSeven formData={formData} onUpdateField={onUpdateField} />}
    </div>
  );

  if (embeddedMode) {
    return stepContent;
  }

  // Fallback for non-embedded (legacy layout)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border border-border p-8">
          {stepContent}
          <div className="flex justify-between gap-4 mt-8 pt-8 border-t border-border">
            <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> {t('common.previous')}
            </Button>
            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-primary hover:bg-primary/90">
                {isSubmitting ? t('common.submitting') : t('common.submit')}
              </Button>
            ) : (
              <Button onClick={onNext} className="gap-2 bg-primary hover:bg-primary/90">
                {t('common.next')} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <DocumentPreview formData={formData} currentStep={currentStep} />
          <Button onClick={handleDownloadPreview} variant="outline" className="w-full mt-4 gap-2">
            <Download className="w-4 h-4" /> {t('common.downloadPdf')}
          </Button>
        </div>
      </div>
    </div>
  );
}
