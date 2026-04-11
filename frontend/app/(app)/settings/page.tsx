'use client';

import { useAuth } from '../../context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useTranslation } from '../../context/language-context';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Globe, 
  Trash2, 
  CheckCircle2,
  Lock,
  Mail,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', nameKey: 'settings.tabs.profile', icon: User },
    { id: 'academic', nameKey: 'settings.tabs.academic', icon: GraduationCap },
    { id: 'account', nameKey: 'settings.tabs.account', icon: ShieldCheck },
    { id: 'preferences', nameKey: 'settings.tabs.preferences', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-[#250136] tracking-tight">{t('settings.title')}</h1>
        <p className="text-[#250136]/50 font-bold">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Settings Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-black text-sm text-left ${
                activeTab === tab.id 
                  ? 'bg-white shadow-[0_15px_30px_-5px_rgba(245,158,81,0.25)] text-primary' 
                  : 'text-[#250136]/40 hover:bg-white/50 hover:text-[#250136]'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-[#250136]/20'}`} />
              {t(tab.nameKey)}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Profile Section */}
          {activeTab === 'profile' && (
            <div className="glass-panel p-6 border-white/60 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              <div className="flex items-center gap-4 pb-6 border-b border-black/5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#250136] mb-0.5 leading-tight">{user?.name || 'Researcher'}</h3>
                  <p className="text-[10px] font-black text-[#250136]/40 uppercase tracking-widest">{user?.email}</p>
                </div>
              </div>

              <div className="bg-white/50 border border-white/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center px-6 py-4 border-b border-black/5 gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-[#250136]">{t('settings.profile.fullName')}</label>
                    <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">First & Last</p>
                  </div>
                  <input 
                    type="text" 
                    defaultValue={user?.name || ''}
                    className="w-full md:w-2/3 bg-white/80 border border-black/5 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary/40 transition-all shadow-sm"
                  />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center px-6 py-4 border-b border-black/5 gap-4 bg-white/30">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-[#250136]">{t('settings.profile.emailAddress')}</label>
                    <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">{t('settings.profile.emailManaged')}</p>
                  </div>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ''}
                    className="w-full md:w-2/3 bg-black/5 border border-transparent rounded-xl px-4 py-2 text-sm font-bold outline-none opacity-60 cursor-not-allowed text-[#250136]"
                    disabled
                  />
                </div>

                <div className="flex flex-col md:flex-row px-6 py-4 gap-4">
                  <div className="w-1/3 pt-2">
                    <label className="text-xs font-black text-[#250136]">{t('settings.profile.researchBio')}</label>
                    <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">Short Description</p>
                  </div>
                  <textarea 
                    placeholder={t('settings.profile.researchBioPlaceholder')}
                    className="w-full md:w-2/3 bg-white/80 border border-black/5 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all shadow-sm min-h-[80px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button className="h-10 px-6 rounded-xl bg-[#250136] text-white font-black hover:bg-primary transition-all text-[10px] shadow-xl shadow-black/10 uppercase tracking-widest">
                  {t('settings.profile.updateProfile')}
                </Button>
              </div>
            </div>
          )}

          {/* Academic Section */}
          {activeTab === 'academic' && (
            <div className="glass-panel p-6 border-white/60 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-white/60 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                   <GraduationCap className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <h3 className="text-base font-black text-[#250136] leading-tight">{t('settings.academic.statusTitle')}</h3>
                   <p className="text-xs font-bold text-[#250136]/60">{t('settings.academic.statusDesc')}</p>
                 </div>
               </div>

               <div className="bg-white/50 border border-white/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center px-6 py-4 border-b border-black/5 gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-[#250136]">{t('settings.academic.levelOfStudy')}</label>
                    <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">Current Year</p>
                  </div>
                  <select className="w-full md:w-2/3 bg-white/80 border border-black/5 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary/40 transition-all shadow-sm">
                      <option>Master 2</option>
                      <option>Master 1</option>
                      <option>Licence 3</option>
                      <option>Doctorate</option>
                   </select>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center px-6 py-4 gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-black text-[#250136]">{t('settings.academic.specialization')}</label>
                    <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">Domain</p>
                  </div>
                  <input 
                    type="text" 
                    placeholder={t('settings.academic.specializationPlaceholder')}
                    className="w-full md:w-2/3 bg-white/80 border border-black/5 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary/40 transition-all shadow-sm"
                  />
                </div>
              </div>

               <div className="pt-2 flex justify-end">
                <Button className="h-10 px-6 rounded-xl bg-primary text-white font-black hover:bg-[#250136] transition-all text-[10px] shadow-xl shadow-primary/20 uppercase tracking-widest">
                  {t('settings.academic.saveChanges')}
                </Button>
              </div>
            </div>
          )}

          {/* Account & Security Section */}
          {activeTab === 'account' && (
            <div className="glass-panel p-6 border-white/60 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               
               <div className="space-y-3">
                 <h4 className="text-sm font-black text-[#250136] uppercase tracking-widest px-1">{t('settings.account.securityPreferences')}</h4>
                 <div className="bg-white/50 border border-white/60 rounded-2xl overflow-hidden shadow-sm divide-y divide-black/5">
                   {[
                     { labelKey: 'settings.account.twoFactor', descKey: 'settings.account.twoFactorDesc', icon: Lock },
                     { labelKey: 'settings.account.aiPrivacy', descKey: 'settings.account.aiPrivacyDesc', icon: Sparkles }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center shrink-0">
                             <item.icon className="w-5 h-5 text-primary" />
                           </div>
                           <div>
                             <p className="font-black text-xs text-[#250136]">{t(item.labelKey)}</p>
                             <p className="text-[10px] font-bold text-[#250136]/50">{t(item.descKey)}</p>
                           </div>
                        </div>
                        <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1 cursor-pointer shrink-0">
                           <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-black/5">
                  <h4 className="text-sm font-black text-red-600 uppercase tracking-widest px-1">{t('settings.account.dangerZone')}</h4>
                  <div className="bg-red-50/80 p-6 rounded-2xl border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-xs text-red-700 mb-0.5">{t('settings.account.deleteTitle')}</p>
                      <p className="text-[10px] font-bold text-red-500/80 max-w-sm">{t('settings.account.deleteDesc')}</p>
                    </div>
                    <Button variant="ghost" className="h-10 px-6 rounded-xl bg-red-500 text-white font-black hover:bg-red-600 transition-all text-[10px] flex items-center gap-2 shadow-lg shadow-red-500/20 uppercase tracking-widest shrink-0">
                      <Trash2 className="w-4 h-4" />
                      {t('settings.account.deleteButton')}
                    </Button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
