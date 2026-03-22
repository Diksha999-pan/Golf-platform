'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, TrendingUp, Heart, Trophy, CreditCard, LogOut, User } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scores', label: 'My Scores', icon: TrendingUp },
  { href: '/dashboard/draws', label: 'Draws', icon: Trophy },
  { href: '/dashboard/charity', label: 'Charity', icon: Heart },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-dark-800/50 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-xl font-semibold">
            Golf<span className="text-brand-400">Gives</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <User size={16} />
            Profile
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
