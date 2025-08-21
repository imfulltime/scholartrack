import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

// This is a simplified photo upload endpoint
// In production, you'd integrate with a service like Cloudinary, AWS S3, or Supabase Storage

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const formData = await request.formData()
    
    const photo = formData.get('photo') as File
    const subjectId = formData.get('subjectId') as string

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

    // For this example, we'll convert the image to a data URL
    // In production, upload to your preferred storage service
    const arrayBuffer = await photo.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${photo.type};base64,${base64}`

    // Update the subject with the photo URL
    const { data: updatedSubject, error: updateError } = await supabase
      .from('subjects')
      .update({
        photo_url: dataUrl,
        photo_public_id: `subject_${subjectId}_${Date.now()}`,
        photo_uploaded_at: new Date().toISOString(),
      })
      .eq('id', subjectId)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Photo upload error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save photo' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'subject', subjectId, {
      action: 'photo_upload',
      subject_name: subject.name,
      photo_size: photo.size,
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { subjectId } = await request.json()

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
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

    // Remove the photo from the subject
    const { error: updateError } = await supabase
      .from('subjects')
      .update({
        photo_url: null,
        photo_public_id: null,
        photo_uploaded_at: null,
      })
      .eq('id', subjectId)
      .eq('owner_id', user.id)

    if (updateError) {
      console.error('Photo delete error:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'subject', subjectId, {
      action: 'photo_delete',
      subject_name: subject.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
