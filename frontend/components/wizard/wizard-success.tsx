'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/app/context/language-context';
import { 
  CheckCircle2, 
  Download, 
  Layout, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface WizardSuccessProps {
  onExport: (type: 'pdf' | 'docx') => void;
  isExporting: 'pdf' | 'docx' | null;
  rapportId: string;
}

export default function WizardSuccess({ onExport, isExporting, rapportId }: WizardSuccessProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-2xl mx-auto">
      
      {/* Success Icon Animation */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 rotate-12 group hover:rotate-0 transition-all duration-700">
          <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in-50 duration-500 delay-300 fill-white/10" />
        </div>
        <div className="absolute -top-4 -right-4">
          <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">
          {t('wizard.success.title', { defaultValue: 'Mission Accomplished!' })}
        </h2>
        <p className="text-foreground/60 font-bold text-lg max-w-md mx-auto leading-relaxed">
          {t('wizard.success.description', { defaultValue: 'Your rapport has been compiled with precision. You are ready to share your findings with the world.' })}
        </p>
      </div>

      {/* Export Options Card */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onExport('pdf')}
          disabled={!!isExporting}
          className={cn(
            "group relative flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden",
            isExporting === 'pdf' ? "border-primary bg-primary/5 cursor-wait" : "bg-white dark:bg-black/20 border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          )}
        >
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
            {isExporting === 'pdf' ? <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-6 h-6" />}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-foreground tracking-tight">{t('common.downloadPdf')}</span>
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Professional PDF</span>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
            <Download className="w-4 h-4 text-primary" />
          </div>
        </button>

        <button
          onClick={() => onExport('docx')}
          disabled={!!isExporting}
          className={cn(
            "group relative flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden",
            isExporting === 'docx' ? "border-primary bg-primary/5 cursor-wait" : "bg-white dark:bg-black/20 border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          )}
        >
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            {isExporting === 'docx' ? <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Layout className="w-6 h-6" />}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-foreground tracking-tight">{t('editor.export')} (Word)</span>
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Editable DOCX</span>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
            <Download className="w-4 h-4 text-primary" />
          </div>
        </button>
      </div>

      <div className="pt-8 w-full space-y-4">
        <Button 
          onClick={() => router.push(`/app/wizard/${rapportId}/editor`)}
          variant="outline"
          className="w-full h-14 rounded-2xl border-2 border-primary/20 text-primary font-black flex items-center justify-center gap-3 hover:bg-primary/5 transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          {t('wizard.success.openEditor', { defaultValue: 'Fine-tune in Visual Editor' })}
        </Button>

        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-foreground/40 font-black text-xs uppercase tracking-widest hover:text-primary transition-colors py-2"
        >
          {t('wizard.success.backToDashboard', { defaultValue: 'Back to Dashboard' })}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
