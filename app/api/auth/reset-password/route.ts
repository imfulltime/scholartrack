import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)

    const supabase = createClient()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password-confirm`,
    })

    if (error) {
      console.error('Password reset error:', error)
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
