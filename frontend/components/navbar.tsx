'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/context/language-context';

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="fixed top-0 w-full z-50 p-2 flex justify-center pointer-events-none">
      <nav className="w-[95%] max-w-[1600px] bg-white/70 backdrop-blur-xl border border-black/5 shadow-[0_8px_32px_rgba(37,1,54,0.05)] px-6 py-2.5 flex items-center justify-between pointer-events-auto rounded-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/logo.svg" alt="Rappori Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl text-[#250136] tracking-tighter">
            Rappori
          </span>
        </Link>

        <div className="flex items-center gap-6">

          {user ? (
            <>
              <div className="text-sm font-medium text-foreground/80 hidden md:block">
                {t('navbar.welcome', { name: user.name })}
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-destructive hover:text-red-500"
              >
                {t('navbar.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-foreground/80">
                  {t('navbar.signIn')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary border border-primary/20 dark:border-primary/50 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)] dark:shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)]">
                  {t('navbar.getStarted')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
