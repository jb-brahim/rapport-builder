'use client';

import { useAuth } from '@/app/context/auth-context';
import { useTranslation } from '@/app/context/language-context';
import { Search, Bell, Settings, User } from 'lucide-react';
import { md5 } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

export function TopHeader() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const userPhoto = user?.profile?.photoUrl || (user?.email ? `https://www.gravatar.com/avatar/${md5(user.email.toLowerCase().trim())}?d=mp&s=100` : null);

  return (
    <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-md border-b border-white/60 dark:border-white/10 px-8 py-4 flex items-center justify-between transition-all duration-500">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 font-black group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={t('topHeader.searchPlaceholder')}
            className="w-full bg-background/40 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:bg-background focus:border-primary/40 transition-all shadow-sm placeholder:text-foreground/30 text-foreground"
          />
        </div>
      </div>

      {/* Profile/Actions Section */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="flex items-center gap-3 pr-6 border-r border-black/5 dark:border-white/5 font-sans ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-foreground leading-none mb-1">{user?.profile?.name || user?.name || 'Researcher'}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{t('topHeader.universityStudent')}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-black/20 border border-white/60 dark:border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all shadow-sm group">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 transition-all">
              {userPhoto ? (
                <img src={userPhoto} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-foreground/40">
          <button className="w-10 h-10 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 hover:text-primary transition-all flex items-center justify-center relative border border-transparent hover:border-white/60 dark:hover:border-white/10">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background shadow-sm" />
          </button>
          
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl self-center ml-2 border border-white/60 dark:border-white/10 shadow-inner">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                language === 'fr' ? 'bg-background dark:bg-white/20 shadow-md text-primary' : 'text-foreground/30 hover:text-foreground'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                language === 'en' ? 'bg-background dark:bg-white/20 shadow-md text-primary' : 'text-foreground/30 hover:text-foreground'
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
