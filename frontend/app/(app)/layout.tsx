'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopHeader } from '@/components/top-header';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWizardPage = pathname.includes('/wizard/');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Persistent Sidebar with conditional collapse */}
      <Sidebar isCollapsed={isWizardPage} />
      
      {/* Main Content Area next to sidebar */}
      <div 
        className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-0 transition-all duration-500 ease-in-out"
        style={{ paddingLeft: isWizardPage ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      >
        <TopHeader />
        <main className="p-10 max-w-[1600px] mx-auto w-full min-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
