import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  applyPatch,
  createKnowledgeSnapshot,
} from '@/lib/services/knowledge-patch'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { patchId } = await request.json()

    if (!patchId) {
      return NextResponse.json(
        { error: 'Patch ID is required' },
        { status: 400 }
      )
    }

    // Create snapshot before applying
    await createKnowledgeSnapshot(user.id, [patchId])

    // Apply the patch
    const result = await applyPatch(patchId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Apply patch error:', error)
    return NextResponse.json(
      { error: 'Failed to apply patch' },
      { status: 500 }
    )
  }
}
