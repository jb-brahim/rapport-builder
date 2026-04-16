'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { 
  FileBarChart, 
  Search, 
  FileText, 
  User,
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';


interface ReportData {
  _id: string;
  wizardAnswers?: { 
    projectTitle?: string; 
    documentName?: string;
  };
  status: string;
  currentStep: number;
  lastSavedAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profile?: { name?: string };
  };
}

export default function GlobalReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchReports();
    }
  }, [user, authLoading, router]);

  const fetchReports = async () => {
    try {
      const data = await apiClient('/admin/reports');
      setReports(data);
    } catch (e) {
      console.error('Failed to fetch reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const title = r.wizardAnswers?.projectTitle || r.wizardAnswers?.documentName || 'Untitled';
    const userName = r.userId?.profile?.name || r.userId?.name || 'Unknown';
    const search = searchTerm || '';
    return title.toLowerCase().includes(search.toLowerCase()) || 
           userName.toLowerCase().includes(search.toLowerCase());
  });


  if (authLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#250136] tracking-tight flex items-center gap-3">
            <FileBarChart className="w-8 h-8 text-blue-500" />
            Platform Reports
          </h1>
          <p className="text-[#250136]/50 font-bold">Comprehensive oversight of all user-generated reports</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#250136]/30" />
          <input 
            type="text" 
            placeholder="Search by title or author..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel overflow-hidden border-white/60 bg-white/30 shadow-2xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-white/50">
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">Rapport Title</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden md:table-cell">Author</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden lg:table-cell">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden xl:table-cell">Last Updated</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-bold">
              {filteredReports.map((r) => {
                const title = r.wizardAnswers?.projectTitle || r.wizardAnswers?.documentName || 'Untitled Workspace';
                const userName = r.userId?.profile?.name || r.userId?.name || 'Unknown User';
                const isFinal = r.status === 'final';

                return (
                  <tr key={r._id} className="group hover:bg-white/60 transition-all duration-300">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[#250136] group-hover:text-primary transition-colors line-clamp-1">{title}</p>
                          <p className="text-[9px] text-[#250136]/40 uppercase tracking-widest">ID: {r._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#250136]/30" />
                        <div>
                           <p className="text-xs text-[#250136]">{userName}</p>
                           <p className="text-[9px] text-[#250136]/40 italic font-medium">{r.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden lg:table-cell">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          isFinal ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                          {r.status}
                       </span>
                    </td>
                    <td className="px-8 py-5 hidden xl:table-cell">
                       <div className="flex items-center gap-2 text-[#250136]/40 text-[11px] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(r.lastSavedAt).toLocaleString()}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => router.push(`/app/wizard/${r._id}/editor`)}>
                          <ExternalLink className="w-4 h-4" />
                       </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="p-20 text-center">
               <p className="text-[#250136]/40 font-bold uppercase tracking-widest text-xs">No reports discovered in current search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
