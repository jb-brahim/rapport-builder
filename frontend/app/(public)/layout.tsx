import React from 'react';
import { Navbar } from '@/components/navbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pt-20">
      {/* Navbar for public pages (Landing, Login, Signup) */}
      <Navbar />
      
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
