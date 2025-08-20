import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const confirmResetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = confirmResetSchema.parse(body)

    const supabase = createClient()

    // Get the current session to verify reset token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('Password confirmation error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
