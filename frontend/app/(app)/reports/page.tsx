'use client';

import { useAuth } from '../../context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { apiClient } from '../../../lib/api';
import { 
  Plus, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Search, 
  Filter,
  ArrowUpDown,
  MoreVertical,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface Rapport {
  _id: string;
  wizardAnswers?: { 
    projectTitle?: string; 
    documentName?: string;
  };
  status: 'draft' | 'in_review' | 'final';
  currentStep: number;
  lastSavedAt: string;
}

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchRapports();
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

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      await apiClient(`/rapports/${reportToDelete}`, { method: 'DELETE' });
      setRapports(rapports.filter(r => r._id !== reportToDelete));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    } finally {
      setReportToDelete(null);
    }
  };

  const filteredRapports = rapports.filter(r => {
    const title = r.wizardAnswers?.projectTitle || r.wizardAnswers?.documentName || 'Untitled';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: rapports.length,
    completed: rapports.filter(r => r.status === 'final').length,
    drafts: rapports.filter(r => r.status === 'draft').length
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header Area with Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#250136] tracking-tight">My Reports Explorer</h1>
          <p className="text-[#250136]/50 font-bold">Manage and analyze all your academic documentations</p>
        </div>
        
        <Link href="/app/wizard/new">
          <Button className="h-12 px-6 rounded-xl bg-[#250136] text-white font-black hover:bg-primary transition-all text-xs shadow-xl shadow-primary/10 uppercase tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* High-Density Toolbar */}
      <div className="glass-panel p-3 border-white/60 bg-white/50 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between relative overflow-hidden">
        
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#250136]/30 font-black group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search reports by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/60 border border-white/80 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold outline-none focus:bg-white focus:border-primary/40 transition-all shadow-sm placeholder:text-[#250136]/30 text-[#250136]"
          />
        </div>

        {/* Filters & Stats */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button variant="ghost" className="h-10 px-4 rounded-xl border border-white/60 bg-white/40 text-xs font-black text-[#250136]/60 hover:bg-white transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="ghost" className="h-10 px-4 rounded-xl border border-white/60 bg-white/40 text-xs font-black text-[#250136]/60 hover:bg-white transition-all flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" /> Sort
          </Button>
          
          <div className="h-6 w-px bg-black/5 mx-1 hidden sm:block"></div>

          <div className="flex bg-white/60 rounded-xl px-1 py-1 border border-white/80 shadow-inner text-[10px] font-black uppercase tracking-widest">
            <div className="px-3 py-1.5 flex items-center gap-2 border-r border-black/5">
              <span className="text-[#250136]/40">Total</span>
              <span className="text-[#250136]">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 flex items-center gap-2 border-r border-black/5">
              <span className="text-emerald-500/50">Final</span>
              <span className="text-emerald-500">{stats.completed}</span>
            </div>
            <div className="px-3 py-1.5 flex items-center gap-2">
              <span className="text-primary/50">Draft</span>
              <span className="text-primary">{stats.drafts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Project Table */}
      <div className="glass-panel bg-white/30 border-white/60 overflow-hidden shadow-2xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">Document Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden md:table-cell">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden lg:table-cell">Last Edited</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">Progress</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] text-right text-transparent">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredRapports.map((report) => {
                const title = report.wizardAnswers?.projectTitle || report.wizardAnswers?.documentName || 'Untitled Report';
                const progress = Math.min(Math.round((report.currentStep / 9) * 100), 100);
                const isFinal = report.status === 'final';
                
                return (
                  <tr key={report._id} className="group hover:bg-white/60 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 transition-transform group-hover:scale-110">
                          <FileText className="w-5 h-5 text-primary/40 group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-[#250136] leading-tight group-hover:text-primary transition-colors">{title}</p>
                          <p className="text-[9px] font-black text-[#250136]/40 uppercase tracking-widest mt-1">ID: {report._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/60 shadow-sm ${
                        isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFinal ? 'bg-emerald-500' : 'bg-primary'} animate-pulse`} />
                        {isFinal ? 'Finalized' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-[#250136]/40 font-black text-[11px] uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(report.lastSavedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-[#250136]">{progress}%</span>
                          <span className="text-[10px] font-black text-[#250136]/30 uppercase tracking-widest">Step {report.currentStep}/9</span>
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
                      <div className="flex justify-end items-center gap-3">
                        <Button 
                          variant="ghost" 
                          onClick={(e) => {
                            e.preventDefault();
                            setReportToDelete(report._id);
                          }}
                          className="h-10 w-10 p-0 rounded-xl text-red-500 hover:text-white hover:bg-red-500 border border-red-100 transition-all shadow-sm"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Link href={`/app/wizard/${report._id}`}>
                          <Button variant="ghost" className="h-10 px-6 rounded-xl bg-[#250136] text-white hover:bg-primary hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10">
                            Open Report
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#250136] font-black text-xl">Delete Report?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              This action cannot be undone. This will permanently delete your academic report 
              and remove all of its unsaved and saved progress from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-black/10 font-bold hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-black border-0 shadow-lg shadow-red-500/20"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
