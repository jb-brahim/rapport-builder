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
    <div className="flex h-full min-h-[calc(100vh-180px)] items-center justify-center animate-in fade-in duration-700">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Left Side: Information & Context */}
        <div className="lg:col-span-4 flex flex-col justify-between py-6">
          <div className="space-y-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="font-bold text-[#250136]/40 hover:text-[#250136] hover:bg-white/50 flex items-center gap-2 rounded-xl transition-all w-fit px-4 h-9 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('dashboard.modal.cancel') || 'Retour Dashboard'}
            </Button>

            <div className="space-y-4">
               <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-primary to-orange-400 shadow-xl shadow-primary/20 flex items-center justify-center mb-6">
                 <FileText className="w-8 h-8 text-white" />
               </div>
               <h3 className="text-4xl font-extrabold text-[#250136] leading-tight tracking-tight">
                 Nouvel <br/> Espace.
               </h3>
               <p className="text-sm font-medium text-[#250136]/50 max-w-[200px] leading-relaxed">
                 Configurez les bases de votre document pour débloquer l'assistant intelligent.
               </p>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-[#250136]/5">
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary font-black text-xs shrink-0 border border-[#250136]/5">1</div>
                <div>
                   <p className="text-xs font-bold text-[#250136] uppercase tracking-wider mb-0.5">Configuration</p>
                   <p className="text-[10px] font-medium text-[#250136]/40">Langue and structure initiale</p>
                </div>
             </div>
             <div className="flex items-start gap-4 opacity-40">
                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-[#250136] font-black text-xs shrink-0 border border-transparent">2</div>
                <div>
                   <p className="text-xs font-bold text-[#250136] uppercase tracking-wider mb-0.5">Personnalisation</p>
                   <p className="text-[10px] font-medium text-[#250136]/40">Choix du template & styles</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Execution */}
        <div className="lg:col-span-8">
          <div className="glass-panel bg-white/90 relative z-10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_30px_70px_-20px_rgba(37,1,54,0.12)] border border-white">
            <div className="space-y-8">
              {/* Document Name Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#250136]/30 uppercase tracking-[0.2em] pl-1">Identité du Projet</label>
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder={t('dashboard.modal.projectNamePlaceholder') || 'ex: Mémoire de Fin d\'Études'}
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-[#250136] font-bold text-lg placeholder:text-slate-300 transition-all shadow-sm"
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
              <div className="pt-6">
                <Button 
                  className="w-full rounded-2xl h-16 bg-[#250136] hover:bg-primary text-white shadow-2xl shadow-primary/20 text-lg font-bold transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.01]"
                  disabled={!creationData.documentName.trim() || isCreating}
                  onClick={submitNewReport}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('dashboard.modal.preparing') || 'Initialisation...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      Lancer l' Assistant <Plus className="w-6 h-6 border-l pl-3 border-white/20 ml-2" />
                    </span>
                  )}
                </Button>
                <p className="text-center text-[10px] font-medium text-[#250136]/30 mt-6 tracking-wide uppercase">
                  Vous pourrez modifier ces informations plus tard dans les paramètres
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
