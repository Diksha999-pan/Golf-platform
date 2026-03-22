'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, Users, Trophy, Heart, Award, BarChart2, LogOut, Settings, ShieldCheck } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draw Engine', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-white/5 bg-dark-800/60 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-xl font-semibold">
            Golf<span className="text-brand-400">Gives</span>
          </Link>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck size={12} className="text-gold-400" />
            <span className="text-xs text-gold-400 font-medium">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-dark-900/50">
        {children}
      </main>
    </div>
  )
}
