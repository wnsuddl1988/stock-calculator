import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isSupabaseConfigured() {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('여기에')
  )
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase 미설정' }, { status: 503 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase 미설정' }, { status: 503 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

  const body = await request.json()
  const { before_price, after_price } = body

  const diff = after_price - before_price

  const { data, error } = await supabase
    .from('calculations')
    .insert([
      {
        before_price,
        after_price,
        retracement_382: Math.round((after_price - diff * 0.382) * 100) / 100,
        retracement_500: Math.round((after_price - diff * 0.5) * 100) / 100,
        retracement_618: Math.round((after_price - diff * 0.618) * 100) / 100,
      },
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0])
}
