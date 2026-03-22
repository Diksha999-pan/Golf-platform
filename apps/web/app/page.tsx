'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Heart, TrendingUp, ChevronRight, Star, Users, DollarSign, Award } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const STATS = [
  { label: 'Active Members', value: '2,400+', icon: Users },
  { label: 'Donated to Charity', value: '£48,200', icon: Heart },
  { label: 'Total Prize Pool', value: '£12,600', icon: Trophy },
  { label: 'Draws Completed', value: '36', icon: Award },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Subscribe',
    description: 'Choose a monthly or yearly plan. Pick your favourite charity — a portion of every subscription goes directly to them.',
    color: 'from-brand-500/20 to-brand-600/10',
    accent: 'text-brand-400',
  },
  {
    step: '02',
    title: 'Enter your scores',
    description: 'Submit your last 5 Stableford scores after every round. Your rolling scorecard is your draw ticket.',
    color: 'from-gold-500/20 to-gold-600/10',
    accent: 'text-gold-400',
  },
  {
    step: '03',
    title: 'Win prizes',
    description: 'Every month, 5 numbers are drawn. Match 3, 4, or all 5 to win from the prize pool. Jackpot rolls over if unclaimed.',
    color: 'from-purple-500/20 to-purple-600/10',
    accent: 'text-purple-400',
  },
]

const CHARITIES = [
  { name: "Cancer Research UK", raised: "£8,400", members: 340 },
  { name: "The Golf Foundation", raised: "£6,200", members: 280 },
  { name: "Walking with the Wounded", raised: "£5,800", members: 260 },
  { name: "Macmillan Cancer Support", raised: "£4,900", members: 230 },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <main className="relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gold-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="font-display text-2xl font-semibold">
          Golf<span className="text-brand-400">Gives</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="nav-link">How it works</Link>
          <Link href="#charities" className="nav-link">Charities</Link>
          <Link href="#prizes" className="nav-link">Prizes</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary py-2 px-4 text-sm">Sign in</Link>
          <Link href="/auth/signup" className="btn-primary py-2 px-4 text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div initial="hidden" animate={mounted ? "visible" : "hidden"} variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/8 text-brand-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Next draw in 12 days
          </span>
        </motion.div>

        <motion.h1 initial="hidden" animate={mounted ? "visible" : "hidden"} variants={fadeUp} custom={1}
          className="font-display text-6xl md:text-8xl font-semibold leading-none tracking-tight mb-6">
          Play Golf.<br />
          <span className="gradient-text">Change Lives.</span>
        </motion.h1>

        <motion.p initial="hidden" animate={mounted ? "visible" : "hidden"} variants={fadeUp} custom={2}
          className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          The subscription platform where your Stableford scores enter you into monthly prize draws — and every round funds a charity you love.
        </motion.p>

        <motion.div initial="hidden" animate={mounted ? "visible" : "hidden"} variants={fadeUp} custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="btn-gold text-lg px-8 py-4">
            Start playing for good
            <ChevronRight size={20} />
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
            See how it works
          </Link>
        </motion.div>

        {/* Prize pool preview */}
        <motion.div initial="hidden" animate={mounted ? "visible" : "hidden"} variants={fadeUp} custom={4}
          className="mt-16 inline-block">
          <div className="card p-6 flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-gold-400">£4,800</div>
              <div className="text-xs text-white/40 mt-1">Current jackpot</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-brand-400">5 match</div>
              <div className="text-xs text-white/40 mt-1">to win jackpot</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-display font-semibold">Mar 31</div>
              <div className="text-xs text-white/40 mt-1">Draw date</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="stat-card text-center">
              <stat.icon size={20} className="text-brand-400 mx-auto mb-2" />
              <div className="font-display text-2xl font-semibold">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Simple as a birdie putt</h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">Three steps. That's all it takes to compete for prizes while funding the causes you care about.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="card-hover p-8 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className={`font-display text-5xl font-semibold ${step.accent} opacity-30 mb-4`}>{step.step}</div>
                <h3 className="font-display text-2xl font-medium mb-3">{step.title}</h3>
                <p className="text-white/50 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Prizes section */}
      <section id="prizes" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Three ways to <span className="gradient-text">win</span></h2>
          <p className="text-white/50 text-lg">Match 3, 4, or all 5 numbers. Jackpot rolls over monthly until claimed.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { match: '3 numbers', share: '25%', label: 'Bronze Tier', color: 'border-amber-600/30 bg-amber-600/5', badge: 'badge-gold' },
            { match: '4 numbers', share: '35%', label: 'Silver Tier', color: 'border-slate-400/30 bg-slate-400/5', badge: 'badge-gray' },
            { match: '5 numbers', share: '40%', label: 'Jackpot', color: 'border-gold-500/40 bg-gold-500/8', badge: 'badge-gold', featured: true },
          ].map((tier, i) => (
            <motion.div key={tier.match} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className={`card p-8 border ${tier.color} ${tier.featured ? 'scale-105 animate-pulse-glow' : ''} text-center`}>
              {tier.featured && (
                <div className="badge badge-gold mx-auto mb-4">
                  <Star size={10} className="mr-1" /> Jackpot rolls over
                </div>
              )}
              <div className="font-display text-4xl font-semibold mb-2">{tier.share}</div>
              <div className="text-white/40 text-sm mb-4">of monthly prize pool</div>
              <div className="font-medium text-lg mb-1">{tier.match}</div>
              <div className="text-white/40 text-sm">{tier.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charities */}
      <section id="charities" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Every round <span className="gradient-text">gives back</span></h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">At least 10% of every subscription goes to your chosen charity. You choose who benefits.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {CHARITIES.map((charity, i) => (
            <motion.div key={charity.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="card-hover p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <Heart size={16} className="text-brand-400" />
                </div>
                <div>
                  <div className="font-medium">{charity.name}</div>
                  <div className="text-sm text-white/40">{charity.members} members supporting</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl text-brand-400">{charity.raised}</div>
                <div className="text-xs text-white/30">raised</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/charities" className="btn-secondary">
            View all charities <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="card p-12 text-center relative overflow-hidden border-brand-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-gold-600/5" />
          <div className="relative">
            <h2 className="font-display text-5xl font-semibold mb-4">Ready to play for good?</h2>
            <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
              Join 2,400+ golfers competing monthly while funding charities that matter.
              From £9.99/month.
            </p>
            <Link href="/auth/signup" className="btn-gold text-lg px-10 py-4">
              Subscribe now — from £9.99/mo
              <ChevronRight size={20} />
            </Link>
            <p className="text-white/25 text-sm mt-4">Cancel anytime · Secure payments via Stripe</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-xl font-semibold">
            Golf<span className="text-brand-400">Gives</span>
          </div>
          <div className="text-white/30 text-sm">© 2026 GolfGives. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-white/30 hover:text-white/60 text-sm transition-colors">Terms</Link>
            <Link href="/privacy" className="text-white/30 hover:text-white/60 text-sm transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
