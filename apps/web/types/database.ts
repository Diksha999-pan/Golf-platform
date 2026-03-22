export type UserRole = 'subscriber' | 'admin'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type DrawStatus = 'pending' | 'simulation' | 'published'
export type DrawLogicType = 'random' | 'weighted'
export type PaymentStatus = 'pending' | 'paid' | 'rejected'
export type AdminStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_subscription_id: string
  stripe_customer_id: string
  charity_percentage: number
  current_period_start: string
  current_period_end: string
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  played_on: string
  created_at: string
}

export interface Draw {
  id: string
  status: DrawStatus
  logic_type: DrawLogicType
  winning_numbers: number[] | null
  draw_date: string
  published_at: string | null
  created_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  score_snapshot: number[]
  created_at: string
}

export interface PrizePool {
  id: string
  draw_id: string
  total_amount: number
  jackpot_percentage: number
  four_match_percentage: number
  three_match_percentage: number
  rollover_amount: number
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  prize_pool_id: string
  match_count: number
  matched_numbers: number[]
  prize_amount: number
  payment_status: PaymentStatus
  created_at: string
  user?: User
}

export interface WinnerProof {
  id: string
  winner_id: string
  file_url: string
  admin_status: AdminStatus
  admin_notes?: string
  reviewed_at?: string
  created_at: string
}

export interface Charity {
  id: string
  name: string
  description: string
  image_url?: string
  website_url?: string
  is_featured: boolean
  is_active: boolean
  total_donated?: number
  created_at: string
}

export interface CharitySelection {
  id: string
  user_id: string
  charity_id: string
  selected_at: string
  charity?: Charity
}

export interface CharityDonation {
  id: string
  charity_id: string
  subscription_id: string
  amount: number
  donated_at: string
}

// Supabase database type map
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'id' | 'created_at'>; Update: Partial<User> }
      subscriptions: { Row: Subscription; Insert: Omit<Subscription, 'id' | 'created_at'>; Update: Partial<Subscription> }
      scores: { Row: Score; Insert: Omit<Score, 'id' | 'created_at'>; Update: Partial<Score> }
      draws: { Row: Draw; Insert: Omit<Draw, 'id' | 'created_at'>; Update: Partial<Draw> }
      draw_entries: { Row: DrawEntry; Insert: Omit<DrawEntry, 'id' | 'created_at'>; Update: Partial<DrawEntry> }
      prize_pools: { Row: PrizePool; Insert: Omit<PrizePool, 'id' | 'created_at'>; Update: Partial<PrizePool> }
      winners: { Row: Winner; Insert: Omit<Winner, 'id' | 'created_at'>; Update: Partial<Winner> }
      winner_proofs: { Row: WinnerProof; Insert: Omit<WinnerProof, 'id' | 'created_at'>; Update: Partial<WinnerProof> }
      charities: { Row: Charity; Insert: Omit<Charity, 'id' | 'created_at'>; Update: Partial<Charity> }
      charity_selections: { Row: CharitySelection; Insert: Omit<CharitySelection, 'id' | 'selected_at'>; Update: Partial<CharitySelection> }
      charity_donations: { Row: CharityDonation; Insert: Omit<CharityDonation, 'id' | 'donated_at'>; Update: Partial<CharityDonation> }
    }
  }
}
