import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cron from 'node-cron'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

app.use(helmet())
app.use(cors({ origin: process.env.NEXTAUTH_URL || 'http://localhost:3000' }))
app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Cron: Run pending draws on their scheduled date ───────────────────────
// Runs every day at 10:00 AM UTC
cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Checking for draws to execute...')
  const today = new Date().toISOString().split('T')[0]

  const { data: pendingDraws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'pending')
    .lte('draw_date', today)

  if (!pendingDraws?.length) {
    console.log('[Cron] No draws due today.')
    return
  }

  for (const draw of pendingDraws) {
    console.log(`[Cron] Executing draw ${draw.id}...`)
    try {
      // Import draw engine dynamically
      const { runDraw } = await import('../../apps/web/lib/draw-engine')

      // Get all active subscriber scores
      const { data: scores } = await supabase
        .from('scores')
        .select('user_id, score')

      const userScores: Record<string, number[]> = {}
      scores?.forEach((s: any) => {
        if (!userScores[s.user_id]) userScores[s.user_id] = []
        userScores[s.user_id].push(s.score)
      })

      const entries = Object.entries(userScores).map(([userId, sc]) => ({ userId, scores: sc }))
      const allScores = scores?.map((s: any) => s.score) || []

      // Get rollover from previous pool
      const { data: prevPool } = await supabase
        .from('prize_pools')
        .select('rollover_amount')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const rollover = prevPool?.rollover_amount || 0

      const result = runDraw(entries, 100, rollover, draw.logic_type, allScores)

      await supabase.from('draws').update({
        status: 'published',
        winning_numbers: result.winningNumbers,
        published_at: new Date().toISOString(),
      }).eq('id', draw.id)

      await supabase.from('prize_pools').insert({
        draw_id: draw.id,
        total_amount: result.pool.total,
        jackpot_percentage: 40,
        four_match_percentage: 35,
        three_match_percentage: 25,
        rollover_amount: result.hasJackpotWinner ? 0 : result.pool.jackpot,
      })

      const winnerInserts = result.winners
        .filter(w => w.tier !== null)
        .map(w => ({
          draw_id: draw.id,
          user_id: w.userId,
          match_count: w.matchCount,
          matched_numbers: w.matchedNumbers,
          prize_amount: w.prizeAmount,
          payment_status: 'pending',
        }))

      if (winnerInserts.length > 0) {
        await supabase.from('winners').insert(winnerInserts)
      }

      console.log(`[Cron] Draw ${draw.id} complete — ${winnerInserts.length} winner(s)`)
    } catch (err) {
      console.error(`[Cron] Draw ${draw.id} failed:`, err)
    }
  }
})

app.listen(PORT, () => {
  console.log(`Golf platform server running on port ${PORT}`)
})
