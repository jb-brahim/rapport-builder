'use client';

import { Input } from '@/components/ui/input';
import { useTranslation } from '@/app/context/language-context';
import { GrammarChecker } from '@/components/grammar-checker';

interface StepOneProps {
  formData: any;
  onUpdateField: (field: string, value: any) => void;
}

export default function StepOne({ formData, onUpdateField }: StepOneProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('step1.title')}</h2>
          <p className="text-muted-foreground">{t('step1.description')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.university')}</label>
          <Input 
            placeholder={t('step1.universityPlaceholder')} 
            value={formData.university || ''} 
            onChange={(e) => onUpdateField('university', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.ministry')}</label>
          <Input 
            placeholder={t('step1.ministryPlaceholder')} 
            value={formData.ministry || ''} 
            onChange={(e) => onUpdateField('ministry', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.department')}</label>
          <Input 
            placeholder={t('step1.departmentPlaceholder')} 
            value={formData.department || ''} 
            onChange={(e) => onUpdateField('department', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.degree')}</label>
          <Input 
            placeholder={t('step1.degreePlaceholder')} 
            value={formData.degree || ''} 
            onChange={(e) => onUpdateField('degree', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">{t('step1.projectTitle')}</label>
          <Input 
            placeholder={t('step1.projectTitlePlaceholder')} 
            value={formData.projectTitle || ''} 
            onChange={(e) => onUpdateField('projectTitle', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        {formData.isBinome ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom Étudiant 1</label>
              <Input 
                placeholder="Ex: John Doe" 
                value={formData.studentName1 || ''} 
                onChange={(e) => onUpdateField('studentName1', e.target.value)} 
                spellCheck="false"
                lang={language}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom Étudiant 2</label>
              <Input 
                placeholder="Ex: Jane Doe" 
                value={formData.studentName2 || ''} 
                onChange={(e) => onUpdateField('studentName2', e.target.value)} 
                spellCheck="false"
                lang={language}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('step1.studentNames')}</label>
            <Input 
              placeholder={t('step1.studentNamesPlaceholder')} 
              value={formData.studentName1 || formData.studentNames || ''} 
              onChange={(e) => onUpdateField('studentName1', e.target.value)} 
              spellCheck="false"
              lang={language}
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.supervisor')}</label>
          <Input 
            placeholder={t('step1.supervisorPlaceholder')} 
            value={formData.supervisor || ''} 
            onChange={(e) => onUpdateField('supervisor', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.company')}</label>
          <Input 
            placeholder={t('step1.companyPlaceholder')} 
            value={formData.company || ''} 
            onChange={(e) => onUpdateField('company', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step1.academicYear')}</label>
          <Input 
            placeholder={t('step1.academicYearPlaceholder')} 
            value={formData.academicYear || ''} 
            onChange={(e) => onUpdateField('academicYear', e.target.value)} 
            spellCheck="false"
            lang={language}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-black/5">
        <GrammarChecker
          text={[formData.projectTitle, formData.university, formData.degree].filter(Boolean).join('\n\n')}
          language={formData.language || language}
          onApply={(newText: string) => {
            const parts = newText.split(/\n\n/);
            if (parts.length >= 1) onUpdateField('projectTitle', parts[0]);
            if (parts.length >= 2) onUpdateField('university', parts[1]);
            if (parts.length >= 3) onUpdateField('degree', parts[2]);
          }}
        />
      </div>
    </div>
  );
}
