'use client';

import { useMemo } from 'react';
import { Eye, Maximize2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface DocumentPreviewProps {
  formData: Record<string, any>;
  currentStep: number;
}

export default function DocumentPreview({ formData, currentStep }: DocumentPreviewProps) {
  const params = useParams();
  const router = useRouter();
  const rapportId = params.id as string;

  const hasContent = useMemo(() => {
    return Object.values(formData).some(value => value?.trim());
  }, [formData]);

  const stepTitle = [
    'Cover Page', 
    'Dédicace', 
    'Acknowledgements', 
    'Table of Contents', 
    'Introduction', 
    'Chapters', 
    'Conclusion'
  ][currentStep - 1] || 'Draft';

  const goToEditor = () => {
    router.push(`/app/wizard/${rapportId}/editor`);
  };

  return (
    <div id="document-preview" className="bg-card rounded-lg border border-border overflow-hidden sticky top-8 print:sticky-none h-full flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <h3 className="font-semibold">Step Preview</h3>
          </div>
          <button 
            onClick={goToEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            <Maximize2 className="w-3 h-3" />
            Open Editor
          </button>
        </div>
        <p className="text-xs opacity-90 font-bold uppercase tracking-wider">{stepTitle}</p>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto text-sm">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-xs">
              Start filling the form to see a preview of your rapport
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-foreground prose prose-sm dark:prose-invert max-w-none font-rapport">
            {/* Step 1: Title Page */}
            {currentStep === 1 && (
              <div className="border-b border-border pb-6">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold">PFE Rapport</h1>
                  {formData.projectTitle && (
                    <h2 className="text-xl font-semibold text-primary">{formData.projectTitle}</h2>
                  )}
                  {formData.isBinome === true || formData.isBinome === 'true' ? (
                    <div className="space-y-1">
                      <p className="text-sm italic opacity-60">Presented by:</p>
                      <p className="text-sm font-bold">{formData.studentName1 || 'Student 1'}</p>
                      <p className="text-sm font-bold">&</p>
                      <p className="text-sm font-bold">{formData.studentName2 || 'Student 2'}</p>
                    </div>
                  ) : (
                    formData.studentName1 && <p className="text-sm"><strong>Student:</strong> {formData.studentName1}</p>
                  )}
                  {formData.supervisor && (
                    <p className="text-sm"><strong>Supervisor:</strong> {formData.supervisor}</p>
                  )}
                  {formData.university && (
                    <p className="text-sm"><strong>University:</strong> {formData.university}</p>
                  )}
                  {formData.company && (
                    <p className="text-sm"><strong>Company/Organization:</strong> {formData.company}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Dédicace */}
            {currentStep === 2 && (formData.dedicace1 || formData.dedicace2 || formData.dedicace) && (
              <div className="animate-in fade-in duration-500 space-y-8">
                {(formData.isBinome === true || formData.isBinome === 'true') ? (
                  <>
                    {formData.dedicace1 && (
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-3">Dédicace — {formData.studentName1 || 'Partner 1'}</h3>
                        <p className="text-sm leading-relaxed italic whitespace-pre-wrap px-4 border-l-4 border-primary/30">
                          {formData.dedicace1}
                        </p>
                      </div>
                    )}
                    {formData.dedicace2 && (
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-3">Dédicace — {formData.studentName2 || 'Partner 2'}</h3>
                        <p className="text-sm leading-relaxed italic whitespace-pre-wrap px-4 border-l-4 border-primary/30 text-right border-l-0 border-r-4">
                          {formData.dedicace2}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h3 className="font-bold text-base mb-4 border-b border-primary/20 pb-2">Dédicace</h3>
                    <p className="text-sm leading-relaxed italic whitespace-pre-wrap px-4 border-l-4 border-primary/30">
                      {formData.dedicace1 || formData.dedicace}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Acknowledgements */}
            {currentStep === 3 && formData.remerciements && (
              <div className="animate-in fade-in duration-500">
                <h3 className="font-bold text-base mb-4 border-b border-primary/20 pb-2 text-center text-primary">REMERCIEMENTS</h3>
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-justify">
                  {formData.remerciements}
                </p>
              </div>
            )}

            {/* Step 4: Table of Contents Preview */}
            {currentStep === 4 && (
              <div className="animate-in fade-in duration-500 space-y-3">
                 <h3 className="font-bold text-base border-b border-primary/20 pb-2">Table of Contents</h3>
                 <div className="space-y-2 opacity-60">
                    <div className="flex justify-between border-b border-dotted"><span className="text-xs uppercase">Dedication</span><span>i</span></div>
                    <div className="flex justify-between border-b border-dotted"><span className="text-xs uppercase">Remerciements</span><span>ii</span></div>
                    <div className="flex justify-between border-b border-dotted font-bold"><span className="text-xs">INTRODUCTION</span><span>1</span></div>
                    <div className="flex justify-between border-b border-dotted"><span className="text-xs">Chapter 1 ...</span><span>5</span></div>
                    <div className="flex justify-between border-b border-dotted font-bold"><span className="text-xs">CONCLUSION</span><span>90</span></div>
                 </div>
              </div>
            )}

            {/* Step 5: Intro Block */}
            {currentStep === 5 && (formData.introduction || formData.introContext || formData.introProblem || formData.introObjective) && (
              <div className="animate-in fade-in duration-500">
                <h3 className="font-bold text-base mb-4 border-b border-primary/20 pb-2 text-center text-primary">INTRODUCTION GÉNÉRALE</h3>
                <div className="space-y-4">
                   {formData.introduction ? (
                     <p className="text-xs leading-relaxed text-justify whitespace-pre-wrap">{formData.introduction}</p>
                   ) : (
                     <>
                        {formData.introContext && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="text-[10px] uppercase font-bold text-primary block mb-1">Context</span>
                            <p className="text-xs leading-relaxed">{formData.introContext}</p>
                          </div>
                        )}
                        {formData.introProblem && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="text-[10px] uppercase font-bold text-primary block mb-1">Problem Statement</span>
                            <p className="text-xs leading-relaxed">{formData.introProblem}</p>
                          </div>
                        )}
                        {formData.introObjective && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="text-[10px] uppercase font-bold text-primary block mb-1">Objectives</span>
                            <p className="text-xs leading-relaxed">{formData.introObjective}</p>
                          </div>
                        )}
                     </>
                   )}
                </div>
              </div>
            )}

            {/* Step 6: Chapters (Placeholder in preview) */}
            {currentStep === 6 && (
              <div className="animate-in fade-in duration-500 text-center py-10 opacity-50 space-y-4">
                 <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">C</span>
                 </div>
                 <p className="text-xs">Chapters are currently being generated and structured by AI.</p>
              </div>
            )}

            {/* Step 7: Conclusion */}
            {currentStep === 7 && formData.conclusion && (
              <div className="animate-in fade-in duration-500">
                <h3 className="font-bold text-base mb-2">Final Conclusion</h3>
                <p className="text-xs leading-relaxed whitespace-pre-wrap italic">
                  {formData.conclusion}
                </p>
              </div>
            )}
          </div>
        )
}
      </div>
    </div>
  );
}
