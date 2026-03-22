/**
 * Draw Engine — Golf Charity Platform
 * Supports random generation and weighted algorithm modes.
 */

export type DrawLogicType = 'random' | 'weighted'

export interface DrawResult {
  winningNumbers: number[]
  generatedAt: string
  logicType: DrawLogicType
}

export interface ScoreMatch {
  userId: string
  scores: number[]
  matchCount: number
  matchedNumbers: number[]
  tier: 'five' | 'four' | 'three' | null
}

/**
 * Generate 5 winning numbers using random lottery logic.
 * Numbers are unique integers in the Stableford range 1–45.
 */
export function generateRandom(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const result: number[] = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

/**
 * Generate 5 winning numbers using weighted algorithm.
 * Biases toward scores that appear most or least frequently
 * across all active subscribers (configurable).
 */
export function generateWeighted(
  allScores: number[],
  bias: 'most_frequent' | 'least_frequent' = 'most_frequent'
): number[] {
  // Count frequency of each score
  const freq: Record<number, number> = {}
  for (let n = 1; n <= 45; n++) freq[n] = 0
  allScores.forEach((s) => {
    if (s >= 1 && s <= 45) freq[s]++
  })

  // Build weighted pool
  const pool: number[] = []
  for (let n = 1; n <= 45; n++) {
    const weight = bias === 'most_frequent'
      ? (freq[n] + 1)        // higher freq = higher chance
      : (1 / (freq[n] + 1)) // lower freq = higher chance (rarer numbers)
    const slots = Math.max(1, Math.round(weight * 10))
    for (let i = 0; i < slots; i++) pool.push(n)
  }

  // Pick 5 unique numbers from weighted pool
  const result: number[] = []
  const used = new Set<number>()
  let attempts = 0
  while (result.length < 5 && attempts < 1000) {
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (!used.has(pick)) {
      used.add(pick)
      result.push(pick)
    }
    attempts++
  }

  // Fallback: fill remaining with random if needed
  while (result.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!used.has(n)) {
      used.add(n)
      result.push(n)
    }
  }

  return result.sort((a, b) => a - b)
}

/**
 * Match a user's score set against winning numbers.
 * Returns match count and which numbers matched.
 */
export function matchScores(
  userScores: number[],
  winningNumbers: number[]
): { matchCount: number; matchedNumbers: number[] } {
  const winSet = new Set(winningNumbers)
  const matchedNumbers = userScores.filter((s) => winSet.has(s))
  return { matchCount: matchedNumbers.length, matchedNumbers }
}

/**
 * Determine tier from match count.
 */
export function getTier(matchCount: number): 'five' | 'four' | 'three' | null {
  if (matchCount >= 5) return 'five'
  if (matchCount === 4) return 'four'
  if (matchCount === 3) return 'three'
  return null
}

/**
 * Calculate prize distribution from pool total.
 * Jackpot rolls over if no 5-match winner.
 */
export interface PrizePool {
  total: number
  jackpot: number      // 40%
  fourMatch: number    // 35%
  threeMatch: number   // 25%
  rollover: number     // carries from previous month
}

export function calculatePrizePool(
  totalPool: number,
  rollover: number = 0
): PrizePool {
  const adjustedTotal = totalPool + rollover
  return {
    total: adjustedTotal,
    jackpot: Math.floor(adjustedTotal * 0.40 * 100) / 100,
    fourMatch: Math.floor(adjustedTotal * 0.35 * 100) / 100,
    threeMatch: Math.floor(adjustedTotal * 0.25 * 100) / 100,
    rollover,
  }
}

/**
 * Calculate per-winner prize when multiple winners share a tier.
 */
export function splitPrize(tierTotal: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor((tierTotal / winnerCount) * 100) / 100
}

/**
 * Full draw execution: generate numbers, match all users, assign prizes.
 */
export interface UserEntry {
  userId: string
  scores: number[]
}

export interface DrawOutput {
  winningNumbers: number[]
  logicType: DrawLogicType
  winners: {
    userId: string
    matchCount: number
    matchedNumbers: number[]
    tier: 'five' | 'four' | 'three' | null
    prizeAmount: number
  }[]
  pool: PrizePool
  hasJackpotWinner: boolean
}

export function runDraw(
  entries: UserEntry[],
  poolTotal: number,
  rollover: number = 0,
  logicType: DrawLogicType = 'random',
  allScores?: number[]
): DrawOutput {
  const winningNumbers =
    logicType === 'weighted' && allScores
      ? generateWeighted(allScores)
      : generateRandom()

  const pool = calculatePrizePool(poolTotal, rollover)

  // Match all entries
  const matched = entries.map((entry) => {
    const { matchCount, matchedNumbers } = matchScores(entry.scores, winningNumbers)
    return {
      userId: entry.userId,
      matchCount,
      matchedNumbers,
      tier: getTier(matchCount),
    }
  })

  // Group by tier
  const fiveWinners = matched.filter((m) => m.tier === 'five')
  const fourWinners = matched.filter((m) => m.tier === 'four')
  const threeWinners = matched.filter((m) => m.tier === 'three')

  // Prize per winner per tier
  const fivePrize = splitPrize(pool.jackpot, fiveWinners.length)
  const fourPrize = splitPrize(pool.fourMatch, fourWinners.length)
  const threePrize = splitPrize(pool.threeMatch, threeWinners.length)

  const winners = matched.map((m) => ({
    ...m,
    prizeAmount:
      m.tier === 'five' ? fivePrize
      : m.tier === 'four' ? fourPrize
      : m.tier === 'three' ? threePrize
      : 0,
  }))

  return {
    winningNumbers,
    logicType,
    winners,
    pool,
    hasJackpotWinner: fiveWinners.length > 0,
  }
}
