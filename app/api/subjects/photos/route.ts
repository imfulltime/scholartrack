import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Fetch photos for the subject that haven't expired
    const { data: photos, error } = await supabase
      .from('subject_photos')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('owner_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('display_order')

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const formData = await request.formData()
    
    const photo = formData.get('photo') as File
    const subjectId = formData.get('subjectId') as string
    const caption = formData.get('caption') as string || null
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 1

    if (!photo || !subjectId) {
      return NextResponse.json(
        { error: 'Photo and subject ID are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify the subject belongs to the user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('owner_id', user.id)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check current photo count (5 photo limit)
    const { count } = await supabase
      .from('subject_photos')
      .select('id', { count: 'exact' })
      .eq('subject_id', subjectId)
      .eq('owner_id', user.id)
      .gt('expires_at', new Date().toISOString())

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos allowed per subject' },
        { status: 400 }
      )
    }

    // Convert image to base64 (in production, upload to cloud storage)
    const arrayBuffer = await photo.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${photo.type};base64,${base64}`

    // Calculate expiry date (48 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    // Insert the new photo
    const { data: newPhoto, error: insertError } = await supabase
      .from('subject_photos')
      .insert({
        subject_id: subjectId,
        photo_url: dataUrl,
        photo_public_id: `subject_${subjectId}_${Date.now()}`,
        caption: caption,
        display_order: displayOrder,
        expires_at: expiresAt.toISOString(),
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Photo upload error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photo' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'subject_photo', newPhoto.id, {
      subject_name: subject.name,
      photo_size: photo.size,
      caption: caption,
      expires_at: expiresAt.toISOString(),
    })

    return NextResponse.json(newPhoto)
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
