import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

// POST /api/v1/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    const user = data.user
    
    // Create or update user in database
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || undefined,
        updated_at: new Date().toISOString()
      })
    
    if (dbError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || undefined,
      provider: user.app_metadata?.provider as 'email' | 'google' | undefined,
      access_token: data.session?.access_token,
      expires_at: data.session?.expires_at
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}