'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopHeader } from '@/components/top-header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar />
      
      {/* Main Content Area next to sidebar */}
      <div className="flex-1 flex flex-col min-w-0 pl-[var(--sidebar-width)] overflow-y-auto relative z-0">
        <TopHeader />
        <main className="p-10 max-w-[1600px] mx-auto w-full min-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
