'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { Plus, Clock, FileText, CheckCircle2, Filter, Megaphone, X, Flame, Activity, Award, Sparkles, ArrowRight, Zap, Target } from 'lucide-react';


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

  const recentRapports = useMemo(() => {
    return [...rapports].sort((a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()).slice(0, 3);
  }, [rapports]);

  const academicTips = [
    "Utilisez des verbes d'action pour renforcer vos objectifs de recherche.",
    "La structure en sablier est idéale pour une introduction percutante.",
    "N'oubliez pas de citer vos sources au fur et à mesure pour éviter le plagiat.",
    "Une bonne conclusion ouvre toujours sur des perspectives d'avenir."
  ];

  const currentTip = useMemo(() => academicTips[Math.floor(Math.random() * academicTips.length)], []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      
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

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-6">
        
        {/* Welcome & Action Bento (2x1) */}
        <div className="md:col-span-2 glass-panel p-8 bg-gradient-to-br from-[#250136] via-[#3a0a4f] to-[#250136] border-none shadow-2xl relative overflow-hidden group flex flex-col justify-between min-h-[240px] hover:scale-[1.01] transition-all duration-500 cursor-default">
           <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-1000 animate-pulse" />
           
           <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary-foreground/90">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <Zap className="w-3 h-3 text-primary" />
                {t('dashboard.hubStatus', { count: rapports.length })}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] group-hover:translate-x-1 transition-transform duration-700">
                {user?.role === 'supervisor' ? `Bonjour, Dr. ${user?.name || 'Academic'}` : t('dashboard.welcomeBack', { name: user?.name || '' })}
              </h1>
           </div>

           <div className="relative z-10 flex items-center justify-between gap-6 mt-6">
              <Button 
                onClick={() => router.push('/app/wizard/new')} 
                className="rounded-2xl h-14 px-10 bg-primary text-white hover:bg-white hover:text-[#250136] transition-all text-xs font-black shadow-2xl shadow-primary/30 uppercase tracking-widest flex items-center gap-3 border-none group/btn active:scale-95"
              >
                <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-700" />
                {t('dashboard.initWorkspace')}
              </Button>
              <div className="hidden lg:flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
                Security Layer Active
              </div>
           </div>
        </div>

        {/* Stats Bento (1x1) */}
        <div className="glass-panel p-8 bg-white/90 border-white/80 shadow-2xl flex flex-col justify-between hover:scale-[1.02] transition-all duration-500 group/stats overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/stats:opacity-100 transition-opacity" />
           <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-[10px] font-black text-[#250136]/30 uppercase tracking-[0.2em]">Live Insights</span>
              <Activity className="w-4 h-4 text-primary/30 group-hover/stats:text-primary transition-colors duration-500" />
           </div>
           
           <div className="space-y-5 relative z-10">
              {[
                { label: t('dashboard.activeProjects'), value: total, color: 'text-primary', bg: 'bg-primary/5' },
                { label: t('dashboard.inProgress'), value: inProgress, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                { label: t('dashboard.completed'), value: completed, color: 'text-emerald-500', bg: 'bg-emerald-500/5' }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between group/item p-2 rounded-xl hover:bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-4 rounded-full ${s.color.replace('text-', 'bg-')} opacity-30`} />
                    <span className="text-[11px] font-black text-[#250136]/60 group-hover/item:text-[#250136] transition-colors">{s.label}</span>
                  </div>
                  <span className={`text-2xl font-black ${s.color} transition-all duration-500 tabular-nums`}>{s.value}</span>
                </div>
              ))}
           </div>
           
           <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between relative z-10">
              <span className="text-[9px] font-black text-[#250136]/20 uppercase tracking-[0.3em]">{t('dashboard.activity')}</span>
              <div className="flex -space-x-1.5">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm" />)}
              </div>
           </div>
        </div>

        {/* Streak Bento (1x1) */}
        <div className="glass-panel p-8 bg-gradient-to-br from-[#ff5f00] via-[#ff2d00] to-[#d9004c] border-none shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10 blur-3xl translate-y-1/2" />
           <Flame className="absolute -right-6 -bottom-6 w-40 h-40 text-black/10 rotate-12 group-hover:scale-125 group-hover:rotate-0 transition-all duration-1000" />
           <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <Flame className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div className="flex items-baseline gap-2">
                 <p className="text-6xl font-black text-white tracking-tighter mb-1 drop-shadow-2xl">{user?.writingStreak || 0}</p>
                 <Sparkles className="w-4 h-4 text-orange-200 animate-pulse" />
              </div>
              <p className="text-[11px] font-black text-white/80 uppercase tracking-[0.3em]">Day Streak</p>
           </div>
           <Button variant="ghost" className="relative z-10 w-full h-12 bg-white/10 hover:bg-white/20 text-white border-white/20 text-[10px] font-black uppercase tracking-widest mt-6 backdrop-blur-md transition-all active:scale-95">
              Explorer les Badges
           </Button>
        </div>

        {/* Recent Activity Bento (2x1) */}
        <div className="md:col-span-2 glass-panel p-8 bg-white shadow-xl flex flex-col border-white/60">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <Clock className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-[#250136] tracking-tight">Activité Récente</h4>
                    <p className="text-[10px] text-[#250136]/40 font-bold uppercase tracking-widest mt-0.5">Vos derniers documents édités</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4 flex-1">
              {recentRapports.length > 0 ? recentRapports.map(r => (
                <Link key={r._id} href={`/app/wizard/${r._id}`} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center">
                         <FileText className="w-4 h-4 text-primary/40" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#250136] leading-tight group-hover:text-primary transition-colors">{r.wizardAnswers?.projectTitle || t('dashboard.untitled')}</p>
                        <p className="text-[9px] font-bold text-[#250136]/30 uppercase tracking-widest mt-1">Modifié le {new Date(r.lastSavedAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <ArrowRight className="w-4 h-4 text-[#250136]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-4">
                   <p className="text-xs font-bold text-[#250136]/30 uppercase tracking-widest">Aucune activité récente</p>
                </div>
              )}
           </div>
        </div>

        {/* AI Tip Bento (1x1) */}
        <div className="glass-panel p-8 bg-gradient-to-br from-indigo-600 to-violet-700 border-none shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
           <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/20 transition-all duration-1000" />
           <div className="relative z-10">
              <div className="flex items-center gap-3 text-white/60 mb-8">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Academic Tip</span>
              </div>
              <p className="text-base font-bold text-white leading-relaxed italic group-hover:translate-x-1 transition-transform duration-700">"{currentTip}"</p>
           </div>
           
           <div className="relative z-10 mt-8 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Intelligence</span>
                 <span className="text-[8px] font-bold text-amber-300/60 uppercase tracking-widest">Rappori Engine v2.0</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-all">
                 <Zap className="w-4 h-4 text-amber-300" />
              </div>
           </div>
        </div>

        {/* Health Bento (1x1) */}
        <div className="glass-panel p-8 bg-white border-white/60 shadow-xl flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#250136]/40 uppercase tracking-widest">Santé Globale</span>
              <Award className="w-4 h-4 text-emerald-500" />
           </div>

           {(() => {
                const totalPages = rapports.reduce((acc, r) => acc + (r.currentStep || 0), 0);
                const targetPages = (rapports.length || 1) * 9;
                const health = Math.round((totalPages / targetPages) * 100);
                
                return (
                  <>
                    <div className="relative w-24 h-24 mx-auto my-4 flex items-center justify-center">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/5" />
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - health / 100)} strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-2xl font-black text-[#250136] tracking-tighter">{health}%</span>
                    </div>
                    <p className="text-[10px] font-black text-center text-emerald-500 uppercase tracking-[0.2em] bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">Optimal Performance</p>
                  </>
                );
           })()}
        </div>

        {/* Next Milestone Bento (4x1 or 2x1 as needed, using overflow) */}
        <div className="md:col-span-4 glass-panel p-8 bg-gradient-to-r from-[#f8f9ff] to-white border-white/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
           
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                 <Target className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Prochaine Étape Majeure</h4>
                 <p className="text-2xl font-black text-[#250136] tracking-tight leading-none italic">"Finaliser la Revue de Littérature"</p>
                 <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#250136]/50">
                       <Zap className="w-3 h-3 text-amber-500" />
                       +250 XP Achievement
                    </span>
                    <span className="w-1 h-1 rounded-full bg-black/10" />
                    <span className="text-[11px] font-bold text-[#250136]/50 uppercase">7 Jours Restants</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none h-12 px-8 rounded-2xl border-black/5 bg-white font-black text-[10px] uppercase tracking-widest hover:bg-black/5 transition-all">
                 Voir la Roadmap
              </Button>
              <Button className="flex-1 md:flex-none h-12 px-8 rounded-2xl bg-[#250136] text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary shadow-xl shadow-primary/20 transition-all">
                 Lancer l'Assistant
              </Button>
           </div>
        </div>
      </div>

      <div className="pt-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-3xl font-black text-[#250136] tracking-tight">
               {t('dashboard.activeProjectsHub')}
             </h2>
             <p className="text-[11px] font-bold text-[#250136]/40 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Vérification du statut des documents en temps réel
             </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#250136] text-white shadow-lg' 
                      : 'text-[#250136]/60 hover:text-[#250136]'
                  }`}
                >
                  {t('dashboard.listView')}
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#250136] text-white shadow-lg' 
                      : 'text-[#250136]/60 hover:text-[#250136]'
                  }`}
                >
                  {t('dashboard.gridView')}
                </button>
              </div>
              <Button variant="ghost" className="rounded-2xl border border-black/5 bg-white/80 h-12 px-6 text-xs font-black text-[#250136] hover:bg-white hover:text-primary transition-all group shadow-sm">
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
                           <Button className="w-full h-11 rounded-xl bg-[#250136] text-white hover:bg-primary transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/10">
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
