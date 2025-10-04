import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'
// Handle Google OAuth callback
export const dynamic = 'force-dynamic'

// POST /api/v1/auth/google
export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
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
    
    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || undefined,
        access_token: token
      }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}