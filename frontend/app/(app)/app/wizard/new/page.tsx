'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, Plus, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/app/context/language-context';
import { apiClient } from '@/lib/api';

export default function NewWizardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationData, setCreationData] = useState({
    documentName: '',
    language: 'fr',
    isInternship: true,
    isBinome: false
  });

  const submitNewReport = async () => {
    if (!creationData.documentName.trim()) return;
    
    setIsCreating(true);
    try {
      const newRapport = await apiClient('/rapports', { 
        data: { 
          wizardAnswers: {
            documentName: creationData.documentName,
            language: creationData.language,
            isInternship: creationData.isInternship,
            isBinome: creationData.isBinome
          }
        } 
      });
      if (newRapport && newRapport._id) {
        router.push(`/app/wizard/${newRapport._id}`);
      }
    } catch (e) {
      console.error('Failed to create rapport:', e);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-180px)] items-center justify-center animate-in fade-in duration-1000">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        <div className="lg:col-span-5 flex flex-col justify-between py-12">
          <div className="space-y-10">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="font-black text-[#250136]/30 hover:text-[#250136] hover:bg-white/50 flex items-center gap-2 rounded-xl transition-all w-fit px-4 h-10 text-[10px] uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.cancel')}
            </Button>

            <div className="space-y-6">
               <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary to-orange-400 shadow-2xl shadow-primary/30 flex items-center justify-center mb-8">
                 <FileText className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-5xl font-black text-[#250136] leading-[1.1] tracking-tight">
                 {t('wizard.new.title').split(' ').map((word, i) => (
                   <span key={i}>{word}{i === 0 && <br/>} </span>
                 ))}
               </h3>
               <p className="text-base font-bold text-[#250136]/50 max-w-[280px] leading-relaxed">
                 {t('wizard.new.subtitle')}
               </p>
            </div>
          </div>

          <div className="space-y-8 pt-12 border-t border-[#250136]/10">
             <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-primary font-black text-sm shrink-0 border border-[#250136]/5">1</div>
                <div>
                   <p className="text-xs font-black text-[#250136] uppercase tracking-widest mb-0.5">{t('wizard.new.configTitle')}</p>
                   <p className="text-[11px] font-bold text-[#250136]/40 lowercase">{t('wizard.new.configDesc')}</p>
                </div>
             </div>
             <div className="flex items-center gap-5 opacity-30">
                <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-[#250136] font-black text-sm shrink-0 border border-transparent">2</div>
                <div>
                   <p className="text-xs font-black text-[#250136] uppercase tracking-widest mb-0.5">{t('wizard.new.persTitle')}</p>
                   <p className="text-[11px] font-bold text-[#250136]/40 lowercase">{t('wizard.new.persDesc')}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Execution */}
        <div className="lg:col-span-7">
          <div className="glass-panel bg-white/90 relative z-10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_30px_70px_-20px_rgba(37,1,54,0.12)] border border-white">
            <div className="space-y-8">
              {/* Document Name Input */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-[#250136]/30 uppercase tracking-[0.3em] pl-1">{t('dashboard.modal.projectName')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder={t('dashboard.modal.projectNamePlaceholder')}
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-3xl px-8 py-6 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-[#250136] font-black text-xl placeholder:text-slate-300 transition-all shadow-sm"
                    value={creationData.documentName}
                    onChange={(e) => setCreationData(prev => ({ ...prev, documentName: e.target.value }))}
                  />
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Language */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#250136]/30 uppercase tracking-[0.2em] pl-1">{t('dashboard.modal.language') || 'LANGUE'}</label>
                  <div className="relative flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-hidden">
                    <button 
                      onClick={() => setCreationData(prev => ({ ...prev, language: 'fr' }))}
                      className={`relative flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${creationData.language === 'fr' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Français
                    </button>
                    <button 
                      onClick={() => setCreationData(prev => ({ ...prev, language: 'en' }))}
                      className={`relative flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${creationData.language === 'en' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      English
                    </button>
                    <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md border border-slate-200/50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${creationData.language === 'en' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                {/* Context */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#250136]/30 uppercase tracking-[0.2em] pl-1">{t('dashboard.modal.projectContext') || 'CONTEXTE DU PROJET'}</label>
                  <div className="relative flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-hidden">
                    <button 
                      onClick={() => setCreationData(prev => ({ ...prev, isInternship: true }))}
                      className={`relative flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${creationData.isInternship ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t('dashboard.modal.internship') || 'Stage'}
                    </button>
                    <button 
                      onClick={() => setCreationData(prev => ({ ...prev, isInternship: false }))}
                      className={`relative flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${!creationData.isInternship ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t('dashboard.modal.academic') || 'Académique'}
                    </button>
                    <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md border border-slate-200/50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${!creationData.isInternship ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </div>

              {/* Team Size */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#250136]/30 uppercase tracking-[0.2em] pl-1">{t('dashboard.modal.teamDetails') || 'COMPOSITION DE L\'ÉQUIPE'}</label>
                <div className="relative flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-hidden">
                  <button 
                    onClick={() => setCreationData(prev => ({ ...prev, isBinome: false }))}
                    className={`relative flex-1 py-4 text-base font-bold rounded-xl transition-all z-10 ${!creationData.isBinome ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t('dashboard.modal.solo') || 'Projet Solo'}
                  </button>
                  <button 
                    onClick={() => setCreationData(prev => ({ ...prev, isBinome: true }))}
                    className={`relative flex-1 py-4 text-base font-bold rounded-xl transition-all z-10 ${creationData.isBinome ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t('dashboard.modal.binome') || 'Par Binôme'}
                  </button>
                  <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md border border-slate-200/50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${creationData.isBinome ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`}></div>
                </div>
              </div>

              {/* Final Action */}
              <div className="pt-8">
                <Button 
                  className="w-full rounded-[2.5rem] h-20 bg-[#250136] hover:bg-primary text-white shadow-2xl shadow-primary/30 text-xl font-black transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.01] flex items-center justify-center gap-4 group"
                  disabled={!creationData.documentName.trim() || isCreating}
                  onClick={submitNewReport}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('dashboard.modal.preparing')}
                    </span>
                  ) : (
                    <>
                      {t('wizard.new.launcher')}
                      <div className="h-8 w-[1px] bg-white/20 mx-2" />
                      <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] font-black text-[#250136]/20 mt-8 tracking-[0.2em] uppercase">
                  {t('wizard.new.footerNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
