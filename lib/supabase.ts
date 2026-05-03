import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CalculationRecord = {
  id?: number
  before_price: number
  after_price: number
  retracement_382: number
  retracement_500: number
  retracement_618: number
  created_at?: string
}
