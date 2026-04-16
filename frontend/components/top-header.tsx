'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useTranslation } from '@/app/context/language-context';
import { Search, Bell, Settings, User, Megaphone, X, Clock } from 'lucide-react';
import { md5 } from '@/lib/utils';
import { apiClient } from '@/lib/api';


interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  createdAt: string;
}

export function TopHeader() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient('/announcements/active');
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      fetchAnnouncements();
    }
    setShowNotifications(!showNotifications);
  };

  const userPhoto = user?.profile?.photoUrl || (user?.email ? `https://www.gravatar.com/avatar/${md5(user.email.toLowerCase().trim())}?d=mp&s=100` : null);

  return (
    <header className="sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/60 px-8 py-4 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#250136]/30 font-black group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={t('topHeader.searchPlaceholder')}
            className="w-full bg-white/40 border border-white/60 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-primary/40 transition-all shadow-sm placeholder:text-[#250136]/30 text-[#250136]"
          />
        </div>
      </div>

      {/* Profile/Actions Section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-black/5 font-sans">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-[#250136] leading-none mb-1">{user?.profile?.name || user?.name || 'Researcher'}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{t('topHeader.universityStudent')}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white border border-white/60 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all shadow-sm group">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 transition-all">
              {userPhoto ? (
                <img src={userPhoto} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-[#250136]/40 relative" ref={dropdownRef}>
          <button 
            onClick={handleToggleNotifications}
            className={`w-10 h-10 rounded-2xl transition-all flex items-center justify-center relative border ${
              showNotifications ? 'bg-primary/5 text-primary border-primary/20' : 'hover:bg-white/60 hover:text-primary border-transparent hover:border-white/60'
            }`}
          >
            <Bell className="w-5 h-5" />
            {announcements.length > 0 && (
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white shadow-sm" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h4 className="text-xs font-black text-[#250136] uppercase tracking-[0.2em]">Announcements</h4>
                 <button onClick={() => setShowNotifications(false)} className="text-[#250136]/30 hover:text-[#250136]">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               
               <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                 {announcements.length > 0 ? announcements.map((ann) => (
                   <div key={ann._id} className="p-3 rounded-2xl bg-white border border-black/5 hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          ann.type === 'danger' ? 'bg-red-500' : 
                          ann.type === 'warning' ? 'bg-amber-500' :
                          ann.type === 'success' ? 'bg-emerald-500' : 'bg-primary'
                        }`} />
                        <span className="text-[10px] font-black text-[#250136] truncate">{ann.title}</span>
                      </div>
                      <p className="text-[10px] font-bold text-[#250136]/50 line-clamp-2 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center gap-1 mt-2 text-[9px] font-black text-[#250136]/20 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </div>
                   </div>
                 )) : (
                   <div className="py-10 text-center">
                     <Megaphone className="w-8 h-8 text-[#250136]/10 mx-auto mb-2" />
                     <p className="text-[10px] font-black text-[#250136]/30 uppercase tracking-widest">No active messages</p>
                   </div>
                 )}
               </div>
            </div>
          )}
          
          <div className="flex bg-black/5 p-1 rounded-2xl self-center ml-2 border border-white/60 shadow-inner">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                language === 'fr' ? 'bg-white shadow-md text-primary' : 'text-[#250136]/30 hover:text-[#250136]'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                language === 'en' ? 'bg-white shadow-md text-primary' : 'text-[#250136]/30 hover:text-[#250136]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
