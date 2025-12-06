import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      creativeId,
      rating,
      comment,
      issueCategories,
      creativeType,
      vertical,
      promptUsed,
      formData,
    } = body

    // Validate required fields
    if (!creativeId || !rating || !creativeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    // Insert feedback
    // Note: Using type assertion as creative_feedback may not be in generated types yet
    const { data: feedback, error } = await (supabase.from as Function)('creative_feedback')
      .insert({
        creative_id: creativeId,
        user_id: user.id,
        organization_id: member?.organization_id,
        rating,
        comment,
        issue_categories: issueCategories || [],
        creative_type: creativeType,
        vertical,
        prompt_used: promptUsed,
        form_data: formData,
      })
      .select()
      .single()

    if (error) {
      console.error('Feedback insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, feedback })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
