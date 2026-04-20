import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/auth-context'
import { LanguageProvider } from './context/language-context'
import { GoogleOAuthProvider } from '@react-oauth/google'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Rappori - AI-Powered Thesis & PFE Platform',
  description: 'Rappori helps you build your university thesis or final year report (PFE) step by step with AI assistance, auto-saving, and real-time preview.',
  generator: 'v0.app',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Montserrat:wght@400;900&family=Roboto:wght@400;900&family=Open+Sans:wght@400;700&family=Playfair+Display:wght@400;900&family=Merriweather:wght@400;900&family=Outfit:wght@400;900&family=Ubuntu+Mono&display=swap" />
      </head>
      <body className="font-sans antialiased text-[#250136] relative min-h-screen overflow-x-hidden selection:bg-primary/30" suppressHydrationWarning>
        {/* Dynamic Glowing Mesh Background */}
        <div className="fixed inset-0 z-[-1] bg-[#FFF8F2] pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-[#F59E51]/15 rounded-full blur-[140px] animate-pulse duration-[12s]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-[#804A8A]/12 rounded-full blur-[140px]" />
          <div className="absolute top-[25%] right-[5%] w-[50%] h-[50%] bg-[#F8D299]/10 rounded-full blur-[120px]" />
        </div>

        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
