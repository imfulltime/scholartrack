import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const importStudentsSchema = z.object({
  students: z.array(z.object({
    full_name: z.string().min(1),
    year_level: z.string().transform(val => parseInt(val, 10)),
    external_id: z.string().optional(),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const { students } = importStudentsSchema.parse(body)
    const supabase = createClient()

    // Validate year levels
    const validStudents = students.filter(student => 
      student.year_level >= 1 && student.year_level <= 12
    )

    if (validStudents.length === 0) {
      return NextResponse.json(
        { error: 'No valid students to import' },
        { status: 400 }
      )
    }

    // Check for duplicate external_ids within the import and against existing students
    const externalIds = validStudents
      .filter(s => s.external_id)
      .map(s => s.external_id!)

    if (externalIds.length > 0) {
      // Check for duplicates within the import
      const uniqueExternalIds = new Set(externalIds)
      if (uniqueExternalIds.size !== externalIds.length) {
        return NextResponse.json(
          { error: 'Duplicate student IDs found in import data' },
          { status: 400 }
        )
      }

      // Check against existing students
      const { data: existingStudents } = await supabase
        .from('students')
        .select('external_id')
        .eq('owner_id', user.id)
        .in('external_id', externalIds)

      if (existingStudents && existingStudents.length > 0) {
        const duplicateIds = existingStudents.map(s => s.external_id).join(', ')
        return NextResponse.json(
          { error: `Student IDs already exist: ${duplicateIds}` },
          { status: 400 }
        )
      }
    }

    // Transform full_name into structured fields and insert students in batch
    const studentsToInsert = validStudents.map(student => {
      const parts = student.full_name.trim().split(/\s+/)
      const family_name = parts.length >= 2 ? parts[parts.length - 1] : parts[0]
      const first_name = parts[0]
      const middle_name = parts.length > 2 ? parts.slice(1, parts.length - 1).join(' ') : null
      const display_name = `${family_name}, ${first_name}${middle_name ? ' ' + middle_name : ''}`
      const full_name_bc = `${first_name}${middle_name ? ' ' + middle_name : ''} ${family_name}`

      return withOwnership(
        {
          family_name,
          first_name,
          middle_name,
          // display_name column exists server-side
          display_name,
          full_name: full_name_bc,
          year_level: student.year_level,
          external_id: student.external_id ?? null,
        },
        user.id
      )
    })

    const { data: insertedStudents, error } = await supabase
      .from('students')
      .insert(studentsToInsert)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to import students' },
        { status: 500 }
      )
    }

    // Log the bulk import action
    await logAudit(user.id, 'BULK_CREATE', 'student', 'batch', {
      count: insertedStudents.length,
      students: insertedStudents.map(s => ({
        name: s.full_name,
        year_level: s.year_level,
        external_id: s.external_id,
      })),
    })

    return NextResponse.json({
      imported: insertedStudents.length,
      students: insertedStudents,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
