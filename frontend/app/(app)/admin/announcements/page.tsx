'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { 
  Megaphone, 
  Trash2, 
  Plus, 
  AlertCircle,
  Bell,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';


interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  isActive: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'info' | 'warning' | 'success' | 'danger'>('info');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchAnnouncements();
    }
  }, [user, authLoading, router]);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient('/admin/announcements');
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiClient('/admin/announcements', {
        method: 'POST',
        data: {
          title: newTitle,
          content: newContent,
          type: newType
        }
      });

      setAnnouncements([created, ...announcements]);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
    } catch (e) {
      alert('Failed to create announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this announcement?')) {
      try {
        await apiClient(`/admin/announcements/${id}`, { method: 'DELETE' });
        setAnnouncements(announcements.filter(a => a._id !== id));
      } catch (e) {
        alert('Failed to delete');
      }
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await apiClient(`/admin/announcements/${id}/toggle`, { method: 'PATCH' });
      setAnnouncements(announcements.map(a => a._id === id ? updated : a));
    } catch (e) {
      alert('Failed to toggle status');
    }
  };

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
            <Megaphone className="w-8 h-8 text-emerald-500" />
            System Announcements
          </h1>
          <p className="text-[#250136]/50 font-bold">Manage broadcast messages for all platform users</p>
        </div>

        <Button 
          onClick={() => setIsCreating(true)}
          className="rounded-2xl h-12 px-8 bg-[#250136] text-white hover:bg-emerald-500 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Create Form Modal Style Inside Page */}
        {isCreating && (
          <div className="lg:col-span-1 glass-panel p-8 border-primary/20 bg-primary/5 animate-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[#250136]">New Broadcast</h3>
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="h-8 w-8 p-0 rounded-full text-[#250136]/40">×</Button>
             </div>
             <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#250136]/60 ml-1">Type</label>
                  <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full h-11 px-4 rounded-xl border border-black/5 bg-white font-bold text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="info">Information (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="danger">Urgent (Red)</option>
                    <option value="success">Success (Emerald)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#250136]/60 ml-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="Brief headline..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl border border-black/5 bg-white font-bold text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#250136]/60 ml-1">Content</label>
                  <textarea 
                    placeholder="Detailed message..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full h-32 p-4 rounded-xl border border-black/5 bg-white font-bold text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                  Publish Message
                </Button>
             </form>
          </div>
        )}

        {/* Announcements List */}
        <div className={isCreating ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
          {announcements.map((a) => (
            <div key={a._id} className={`glass-panel p-6 border-white/60 bg-white/40 transition-all hover:shadow-lg relative group ${!a.isActive ? 'opacity-60 grayscale' : ''}`}>
               <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm ${
                      a.type === 'danger' ? 'bg-red-50 text-red-500' : 
                      a.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                      a.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-[#250136] text-lg">{a.title}</h4>
                        {!a.isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-black/5 text-[8px] font-black uppercase text-black/40 border border-black/5">Draft / Hidden</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#250136]/60 leading-relaxed text-pretty whitespace-pre-wrap">{a.content}</p>
                      <div className="flex items-center gap-3 text-[10px] font-black text-[#250136]/30 uppercase tracking-widest pt-2">
                        <Clock className="w-3 h-3" />
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggle(a._id)}
                        className={`h-9 w-9 rounded-xl ${a.isActive ? 'text-[#250136]/40 hover:text-amber-500 hover:bg-amber-50' : 'text-[#250136]/40 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {a.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(a._id)}
                        className="h-9 w-9 rounded-xl text-[#250136]/40 hover:text-red-500 hover:bg-red-50"
                      >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="p-20 text-center glass-panel border-dashed border-black/5">
               <AlertCircle className="w-12 h-12 text-[#250136]/10 mx-auto mb-4" />
               <p className="text-[#250136]/40 font-black uppercase tracking-widest text-xs">No active or past announcements found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
