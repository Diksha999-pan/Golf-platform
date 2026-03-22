import type { Metadata } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'GolfGives — Play Golf. Win Prizes. Change Lives.',
  description: 'A subscription golf platform where your game funds charity. Enter monthly prize draws using your Stableford scores.',
  openGraph: {
    title: 'GolfGives',
    description: 'Play Golf. Win Prizes. Change Lives.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-dark-900 text-white min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0a0a0f' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' },
            },
          }}
        />
      </body>
    </html>
  )
}
