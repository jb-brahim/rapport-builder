'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { Plus, Clock, FileText, CheckCircle2, Filter, Megaphone, X, Flame, Activity, Award } from 'lucide-react';


interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}


interface Rapport {
  _id: string;
  wizardAnswers?: { 
    projectTitle?: string; 
    documentName?: string;
    language?: string;
    isInternship?: boolean;
    isBinome?: boolean;
  };
  status: 'draft' | 'in_review' | 'final';
  currentStep: number;
  lastSavedAt: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchRapports();
      fetchAnnouncements();
    }

  }, [user, authLoading, router]);

  const fetchRapports = async () => {
    try {
      const data = await apiClient('/rapports');
      setRapports(data);
    } catch (e) {
      console.error('Failed to fetch rapports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient('/announcements/active');
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    }
  };


  // Project creation moved natively to /app/wizard/new

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-8 glass-panel p-16 border-none shadow-2xl rounded-[3rem]">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-inner">
               <img src="/logo.svg" alt="Rappori" className="w-full h-full object-cover animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">Rappori</h3>
            <p className="text-foreground/50 font-medium tracking-widest uppercase text-[10px]">{t('common.syncing')}</p>
          </div>
        </div>
      </div>
    );
  }

  const total = rapports.length;
  const inProgress = rapports.filter(r => r.status === 'draft').length;
  const completed = rapports.filter(r => r.status === 'final').length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Announcements Section */}
      {announcements.filter(a => !dismissedAnnouncements.includes(a._id)).length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
          {announcements
            .filter(a => !dismissedAnnouncements.includes(a._id))
            .map((ann) => (
              <div 
                key={ann._id} 
                className={`group relative glass-panel p-4 border-l-4 shadow-lg flex items-start gap-4 transition-all hover:translate-x-1 ${
                  ann.type === 'danger' ? 'border-red-500 bg-red-50/50' : 
                  ann.type === 'warning' ? 'border-amber-500 bg-amber-50/50' :
                  ann.type === 'success' ? 'border-emerald-500 bg-emerald-50/50' : 'border-blue-500 bg-blue-50/50'
                }`}
              >
                <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ann.type === 'danger' ? 'text-red-600 bg-red-100' : 
                  ann.type === 'warning' ? 'text-amber-600 bg-amber-100' :
                  ann.type === 'success' ? 'text-emerald-600 bg-emerald-100' : 'text-blue-600 bg-blue-100'
                }`}>
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1 pr-10">
                  <h4 className="text-sm font-black text-[#250136] tracking-tight">{ann.title}</h4>
                  <p className="text-xs font-bold text-[#250136]/60 leading-relaxed mt-0.5">{ann.content}</p>
                </div>
                <button 
                  onClick={() => setDismissedAnnouncements([...dismissedAnnouncements, ann._id])}
                  className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-black/5 text-[#250136]/30 hover:text-[#250136] transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Header Area with Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#250136] tracking-tight">
            {user?.role === 'supervisor' ? `Bonjour, Dr. ${user?.name || 'Academic'}` : t('dashboard.welcomeBack', { name: user?.name || 'Researcher' })}
          </h1>
          <div className="flex items-center gap-2 text-[#250136]/50 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
            <span>{user?.role === 'supervisor' ? `Vous encadrez ${rapports.length} projets actifs` : t('dashboard.hubStatus', { count: rapports.length })}</span>
          </div>
        </div>

        <Button 
          onClick={() => router.push('/app/wizard/new')} 
          className="rounded-xl h-12 px-6 bg-[#250136] text-white hover:bg-primary transition-all text-xs font-black shadow-xl shadow-primary/10 uppercase tracking-widest flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.initWorkspace')}
        </Button>
      </div>

      {/* High-Density Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 glass-panel p-4 md:p-6 border-white/60 bg-white/50 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-black/5 items-center relative overflow-hidden">
          {[
            { labelKey: user?.role === 'supervisor' ? 'Étudiants Actifs' : 'dashboard.activeProjects', value: total, icon: FileText, color: 'text-primary', statusKey: 'dashboard.thisWeek', bg: 'bg-primary/10' },
            { labelKey: user?.role === 'supervisor' ? 'En Révision' : 'dashboard.inProgress', value: inProgress, icon: Clock, color: 'text-amber-500', statusKey: 'dashboard.updatingLive', bg: 'bg-amber-500/10' },
            { labelKey: user?.role === 'supervisor' ? 'Validés' : 'dashboard.completed', value: completed, icon: CheckCircle2, color: 'text-emerald-500', statusKey: 'dashboard.finalized', bg: 'bg-emerald-500/10' }
          ].map((stat, i) => (
            <div key={i} className="px-4 py-4 md:py-0 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border border-white/40 ${stat.bg} flex justify-center items-center group-hover:scale-105 transition-transform shadow-sm`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#250136] tracking-tighter leading-none">{stat.value}</p>
                  <p className="text-[10px] font-black text-[#250136]/50 uppercase tracking-widest mt-1">{stat.labelKey.startsWith('dashboard.') ? t(stat.labelKey) : stat.labelKey}</p>
                </div>
              </div>
              <div className={`hidden lg:flex items-center gap-2 text-[9px] font-black ${stat.color} px-2.5 py-1 rounded-lg bg-white shadow-sm border border-black/5`}>
                <div className={`w-1 h-1 rounded-full ${stat.color.replace('text-', 'bg-')} animate-pulse`} />
                {t(stat.statusKey)}
              </div>
            </div>
          ))}
        </div>

        {/* Writing Streak Widget */}
        <div className="glass-panel p-6 bg-gradient-to-br from-[#250136] to-[#3a0a4f] border-none shadow-xl flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <Flame className="w-32 h-32 text-orange-400 rotate-12" />
           </div>
           
           <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Writing Streak</span>
           </div>

           <div className="mt-8 relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">{user?.writingStreak || 0}</span>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest">Days</span>
              </div>
              <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-wider">Keep the momentum going!</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Health / Readiness Card */}
        <div className="lg:col-span-1 glass-panel p-6 border-white/60 bg-white shadow-sm flex flex-col gap-6 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#250136] uppercase tracking-widest">Document Health</h4>
                <p className="text-[10px] text-[#250136]/50 font-bold uppercase tracking-widest mt-0.5">Overall Progress</p>
              </div>
            </div>
            <Award className="w-5 h-5 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-4">
             {(() => {
                const totalPages = rapports.reduce((acc, r) => acc + (r.currentStep || 0), 0);
                const targetPages = rapports.length * 9;
                const health = targetPages > 0 ? Math.round((totalPages / targetPages) * 100) : 0;
                
                return (
                  <>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-black text-[#250136] tracking-tighter">{health}%</span>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">System OK</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden border border-black/5 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-primary transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </>
                );
             })()}
          </div>
        </div>

        {/* Existing Status Indicator (Moved or adjusted) */}
        <div className="lg:col-span-2 glass-panel p-6 border-white/60 bg-white/30 backdrop-blur-xl flex items-center justify-between overflow-hidden relative">
           <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
           <div className="space-y-2 relative z-10">
              <h4 className="text-sm font-black text-[#250136] uppercase tracking-widest">Next Milestone</h4>
              <p className="text-xl font-black text-[#250136] leading-tight">Complete your Literature Review <br /><span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">+250 XP</span></p>
           </div>
           <button className="h-12 px-6 rounded-xl bg-white text-[#250136] border border-black/5 font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 relative z-10">
              View Roadmap
           </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#250136] flex items-center gap-3">
            {t('dashboard.activeProjectsHub')}
            <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 tracking-widest uppercase">
              {rapports.length} {t('dashboard.total')}
            </span>
          </h2>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-black/5 shadow-sm">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                   viewMode === 'list' 
                     ? 'bg-[#250136] text-white shadow-lg' 
                     : 'text-[#250136]/40 hover:text-[#250136]'
                 }`}
               >
                 {t('dashboard.listView')}
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                   viewMode === 'grid' 
                     ? 'bg-[#250136] text-white shadow-lg' 
                     : 'text-[#250136]/40 hover:text-[#250136]'
                 }`}
               >
                 {t('dashboard.gridView')}
               </button>
             </div>
             <Button variant="ghost" className="rounded-2xl border border-black/5 bg-white/50 h-11 px-6 text-xs font-black text-[#250136]/60 hover:bg-white hover:text-primary transition-all group">
               <span className="flex items-center gap-2">
                 <Filter className="w-3.5 h-3.5" />
                 {t('dashboard.filterSort')}
               </span>
             </Button>
          </div>
        </div>
        
        {rapports.length === 0 ? (
          <div className="glass-panel p-24 text-center border-dashed border-[#250136]/10">
            <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-8 border-2 border-primary/10">
              <Plus className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-black text-[#250136] mb-3">{t('dashboard.noProjects')}</h3>
            <p className="text-[#250136]/50 max-w-sm mx-auto mb-10 font-bold leading-relaxed text-lg text-pretty">
              {t('dashboard.noProjectsDesc')}
            </p>
            <Button 
              onClick={() => router.push('/app/wizard/new')} 
              className="rounded-2xl h-14 px-10 bg-[#250136] hover:bg-primary text-white font-black transition-all shadow-xl shadow-primary/20"
            >
              {t('dashboard.createProject')}
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-panel bg-white/30 border-white/60 overflow-hidden shadow-2xl shadow-black/5 animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">{t('dashboard.documentName')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden md:table-cell">{t('dashboard.status')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden lg:table-cell">{t('dashboard.lastEdited')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">{t('dashboard.progress')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] text-right text-transparent">{t('dashboard.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rapports.map((rapport) => {
                    const title = rapport.wizardAnswers?.projectTitle || rapport.wizardAnswers?.documentName || t('dashboard.untitled');
                    const progress = Math.min(Math.round((rapport.currentStep / 9) * 100), 100);
                    const isFinal = rapport.status === 'final';
                    
                    return (
                      <tr key={rapport._id} className="group hover:bg-white/60 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                              <FileText className="w-5 h-5 text-primary/40" />
                            </div>
                            <div>
                              <p className="font-black text-[#250136] leading-tight group-hover:text-primary transition-colors">{title}</p>
                              <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">ID: {rapport._id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/60 shadow-sm ${
                            isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isFinal ? 'bg-emerald-500' : 'bg-primary'} animate-pulse`} />
                            {isFinal ? t('dashboard.statusFinal') : t('dashboard.statusDraft')}
                          </span>
                        </td>
                        <td className="px-8 py-6 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-[#250136]/40 font-black text-[11px] uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(rapport.lastSavedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2 min-w-[120px]">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-[#250136]">{progress}%</span>
                              <span className="text-[10px] font-black text-[#250136]/30 uppercase tracking-widest">{t('dashboard.step')} {rapport.currentStep}/9</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ease-out rounded-full ${isFinal ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(245,158,81,0.4)]'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link href={`/app/wizard/${rapport._id}`}>
                            <Button variant="ghost" className="h-10 px-6 rounded-xl bg-primary text-white hover:bg-[#250136] hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                              {t('dashboard.resume')}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
             {rapports.map(rapport => {
                const title = rapport.wizardAnswers?.projectTitle || rapport.wizardAnswers?.documentName || t('dashboard.untitled');
                const progress = Math.min(Math.round((rapport.currentStep / 9) * 100), 100);
                const isFinal = rapport.status === 'final';
                return (
                   <div key={rapport._id} className="glass-panel p-6 border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                           <FileText className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/60 shadow-sm ${
                           isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${isFinal ? 'bg-emerald-500' : 'bg-primary'} animate-pulse`} />
                           {isFinal ? t('dashboard.statusFinal') : t('dashboard.statusDraft')}
                        </span>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-black text-[#250136] text-lg leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                        <div className="flex items-center gap-2 text-[#250136]/40 font-black text-[10px] uppercase tracking-widest">
                           <Clock className="w-3 h-3" />
                           <span>{new Date(rapport.lastSavedAt).toLocaleDateString()}</span>
                           <span>•</span>
                           <span>ID: {rapport._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-end">
                              <span className="text-xs font-black text-[#250136]">{progress}%</span>
                              <span className="text-[10px] font-black text-[#250136]/30 uppercase tracking-widest">{t('dashboard.step')} {rapport.currentStep}/9</span>
                           </div>
                           <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ease-out rounded-full ${isFinal ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(245,158,81,0.4)]'}`}
                                style={{ width: `${progress}%` }}
                              />
                           </div>
                        </div>

                        <Link href={`/app/wizard/${rapport._id}`} className="block">
                           <Button className="w-full h-10 rounded-xl bg-[#250136]/5 text-[#250136] hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:shadow-lg hover:shadow-primary/20">
                              {t('dashboard.resume')}
                           </Button>
                        </Link>
                      </div>
                   </div>
                )
             })}
          </div>
        )}
      </div>

      {/* Creation Modal migrated to /app/wizard/new */}

    </div>
  );
}
