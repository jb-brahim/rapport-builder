'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useTranslation } from '@/app/context/language-context';

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t, language } = useTranslation();

  const navGroups = [
    {
      groupLabel: language === 'fr' ? 'Espace de Travail' : 'Workspace',
      items: [
        { nameKey: 'sidebar.dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { nameKey: 'sidebar.myReports', icon: FileText, href: '/reports' },
      ]
    },
    {
      groupLabel: language === 'fr' ? 'Système' : 'System',
      items: [
        { nameKey: 'sidebar.settings', icon: Settings, href: '/settings' },
      ]
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-[var(--sidebar-width)] bg-white/40 backdrop-blur-3xl border-r border-white/60 flex flex-col z-[60] transition-all duration-300">
      {/* Branding - Higher Placement */}
      <div className="p-6 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 invert brightness-0" />
        </div>
        <span className="text-xl font-black text-[#250136] tracking-tight uppercase">GradOs</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <p className="px-5 mb-3 text-[10px] font-black text-[#250136]/30 uppercase tracking-widest">{group.groupLabel}</p>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${
                    isActive 
                      ? 'bg-white shadow-[0_10px_25px_-5px_rgba(245,158,81,0.3)] text-primary' 
                      : 'text-[#250136]/50 hover:bg-white/50 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-[#250136]/30 group-hover:text-primary'}`} />
                    <span className="font-bold text-sm tracking-tight">{t(item.nameKey)}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-primary/40" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        {/* Upgrade Banner */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-5 rounded-3xl border border-white/60 group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 relative z-10">{t('sidebar.premiumTitle')}</p>
          <p className="text-[10px] text-[#250136]/70 mb-3 relative z-10 leading-relaxed font-bold">{t('sidebar.premiumDesc')}</p>
          <button className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10">
            {t('sidebar.learnMore')}
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-4 text-[#250136]/40 hover:text-red-500 transition-colors border-t border-black/5 mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm tracking-tight text-left">{t('sidebar.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
