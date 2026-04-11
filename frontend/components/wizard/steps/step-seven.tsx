'use client';

import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/app/context/language-context';
import { GrammarChecker } from '@/components/grammar-checker';

interface StepSevenProps {
  formData: any;
  onUpdateField: (field: string, value: string) => void;
}

export default function StepSeven({ formData, onUpdateField }: StepSevenProps) {
  const { t, language } = useTranslation();

  // Combine all fields for grammar check
  const combinedText = [formData.conclusion, formData.perspectives, formData.bibliography]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('step7.title')}</h2>
        <p className="text-muted-foreground">{t('step7.description')}</p>
      </div>

      <div className="space-y-4">
        {/* General Conclusion */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step7.conclusion')}</label>
          <Textarea
            placeholder={t('step7.conclusionPlaceholder')}
            value={formData.conclusion || ''}
            onChange={(e) => onUpdateField('conclusion', e.target.value)}
            rows={6}
            spellCheck="false"
            lang={language}
          />
        </div>

        {/* Perspectives */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step7.perspectives')}</label>
          <Textarea
            placeholder={t('step7.perspectivesPlaceholder')}
            value={formData.perspectives || ''}
            onChange={(e) => onUpdateField('perspectives', e.target.value)}
            rows={4}
            spellCheck="false"
            lang={language}
          />
        </div>

        {/* Bibliography */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('step7.bibliography')}</label>
          <Textarea
            placeholder={t('step7.bibliographyPlaceholder')}
            value={formData.bibliography || ''}
            onChange={(e) => onUpdateField('bibliography', e.target.value)}
            rows={6}
            spellCheck="false"
            lang={language}
          />
        </div>
      </div>

      {/* Grammar Checker — checks conclusion + perspectives */}
      <div className="flex items-center justify-between text-xs text-foreground/30 pt-2 border-t border-black/5">
        <span>
          {(combinedText).split(/\s+/).filter(Boolean).length} {(formData.language || language) === 'fr' ? 'mots' : 'words'}
          {' · '}
          {combinedText.length} {(formData.language || language) === 'fr' ? 'caractères' : 'characters'}
        </span>
        <GrammarChecker
          text={combinedText}
          language={formData.language || language}
          onApply={(newText: string) => {
            const parts = newText.split(/\n\n/);
            if (parts.length >= 1) onUpdateField('conclusion', parts[0]);
            if (parts.length >= 2) onUpdateField('perspectives', parts.slice(1, -1).join('\n\n'));
            if (parts.length >= 3) onUpdateField('bibliography', parts[parts.length - 1]);
          }}
        />
      </div>
    </div>
  );
}
