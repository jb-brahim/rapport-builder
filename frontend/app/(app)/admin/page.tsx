'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';


interface AdminStats {
  totalUsers: number;
  totalReports: number;
  reportsByStatus: { _id: string; count: number }[];
  userGrowth: { _id: string; count: number }[];
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    try {
      const data = await apiClient('/admin/stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-[#250136] tracking-tight">Admin Overview</h1>
          </div>
          <p className="text-[#250136]/50 font-bold ml-1">Platform-wide statistics and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Users', 
            value: stats?.totalUsers || 0, 
            icon: Users, 
            color: 'text-primary', 
            bg: 'bg-primary/10',
            trend: '+12%',
            trendUp: true 
          },
          { 
            label: 'Total Reports', 
            value: stats?.totalReports || 0, 
            icon: FileText, 
            color: 'text-blue-500', 
            bg: 'bg-blue-500/10',
            trend: '+5%',
            trendUp: true 
          },
          { 
            label: 'Active Sessions', 
            value: Math.floor((stats?.totalUsers || 0) * 0.4), 
            icon: Activity, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-500/10',
            trend: '-2%',
            trendUp: false 
          },
          { 
            label: 'Conversion Rate', 
            value: '64%', 
            icon: TrendingUp, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10',
            trend: '+8%',
            trendUp: true 
          }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 border-white/60 bg-white/50 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl border border-white/40 ${stat.bg} flex justify-center items-center group-hover:scale-110 transition-transform shadow-sm`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-[#250136] tracking-tighter leading-none">{stat.value}</p>
              <p className="text-[10px] font-black text-[#250136]/50 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports Status Chart (Simplified UI Representation) */}
        <div className="glass-panel p-8 border-white/60 bg-white/50 space-y-6">
          <h3 className="text-xl font-black text-[#250136]">Reports by Status</h3>
          <div className="space-y-4">
            {stats?.reportsByStatus.map((status, i) => {
              const total = stats.totalReports || 1;
              const percentage = Math.round((status.count / total) * 100);
              const colors: Record<string, string> = {
                'draft': 'bg-primary',
                'in_review': 'bg-blue-500',
                'final': 'bg-emerald-500'
              };
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#250136]/60">
                    <span>{status._id}</span>
                    <span>{status.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[status._id] || 'bg-gray-400'} rounded-full transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-8 border-white/60 bg-white/50 space-y-6">
          <h3 className="text-xl font-black text-[#250136]">Quick Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => router.push('/admin/users')} className="h-16 rounded-2xl bg-white border border-black/5 text-[#250136] hover:bg-primary hover:text-white transition-all font-black text-xs uppercase tracking-widest flex flex-col gap-1 items-center justify-center shadow-sm">
               <Users className="w-4 h-4" />
               Users
            </Button>
            <Button onClick={() => router.push('/admin/reports')} className="h-16 rounded-2xl bg-white border border-black/5 text-[#250136] hover:bg-blue-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex flex-col gap-1 items-center justify-center shadow-sm">
               <FileText className="w-4 h-4" />
               Reports
            </Button>
            <Button onClick={() => router.push('/admin/announcements')} className="h-16 rounded-2xl bg-white border border-black/5 text-[#250136] hover:bg-emerald-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex flex-col gap-1 items-center justify-center shadow-sm">
               <Megaphone className="w-4 h-4" />
               Annonce
            </Button>
            <Button className="h-16 rounded-2xl bg-white border border-black/5 text-[#250136] hover:bg-purple-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex flex-col gap-1 items-center justify-center shadow-sm">
               <ShieldCheck className="w-4 h-4" />
               Security
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

