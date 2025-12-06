import { createClient } from '@/lib/supabase/server'
import fs from 'fs/promises'
import path from 'path'

const KNOWLEDGE_BASE_PATH = 'lib/prompts/knowledge-base'

export interface KnowledgePatch {
  id: string
  target_file: string
  patch_type: 'addition' | 'modification' | 'removal'
  original_content?: string
  proposed_content: string
  reasoning: string
  status: 'pending' | 'approved' | 'rejected' | 'applied'
}

/**
 * Apply an approved patch to the knowledge base
 */
export async function applyPatch(
  patchId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the patch
  // Note: Using type assertion as knowledge_patches may not be in generated types yet
  const { data: patch, error } = await (supabase.from as Function)('knowledge_patches')
    .select('*')
    .eq('id', patchId)
    .single()

  if (error || !patch) {
    return { success: false, error: 'Patch not found' }
  }

  if (patch.status !== 'approved') {
    return { success: false, error: 'Patch must be approved before applying' }
  }

  try {
    const filePath = path.join(
      process.cwd(),
      KNOWLEDGE_BASE_PATH,
      patch.target_file
    )

    if (patch.patch_type === 'addition') {
      // Read existing file
      const existingContent = await fs.readFile(filePath, 'utf-8')

      // Append new content (smart insertion based on file structure)
      const updatedContent = insertPatchContent(
        existingContent,
        patch.proposed_content
      )

      await fs.writeFile(filePath, updatedContent, 'utf-8')
    } else if (patch.patch_type === 'modification') {
      const existingContent = await fs.readFile(filePath, 'utf-8')

      if (patch.original_content) {
        // Replace original with proposed
        const updatedContent = existingContent.replace(
          patch.original_content,
          patch.proposed_content
        )
        await fs.writeFile(filePath, updatedContent, 'utf-8')
      }
    } else if (patch.patch_type === 'removal') {
      const existingContent = await fs.readFile(filePath, 'utf-8')

      if (patch.original_content) {
        // Remove the specified content
        const updatedContent = existingContent.replace(
          patch.original_content,
          ''
        )
        await fs.writeFile(filePath, updatedContent, 'utf-8')
      }
    }

    // Update patch status
    // Note: Using type assertion as knowledge_patches may not be in generated types yet
    await (supabase.from as Function)('knowledge_patches')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .eq('id', patchId)

    return { success: true }
  } catch (applyError) {
    console.error('Failed to apply patch:', applyError)
    return { success: false, error: 'Failed to apply patch to file' }
  }
}

/**
 * Smart content insertion based on TypeScript file structure
 */
function insertPatchContent(
  existingContent: string,
  newContent: string
): string {
  // Find the best insertion point (before closing export or at end)
  const exportMatch = existingContent.match(/export\s*\{[^}]*\}\s*$/)

  if (exportMatch && exportMatch.index) {
    // Insert before final export
    return (
      existingContent.slice(0, exportMatch.index) +
      '\n' +
      newContent +
      '\n\n' +
      existingContent.slice(exportMatch.index)
    )
  }

  // Append to end
  return existingContent + '\n\n' + newContent
}

/**
 * Create a snapshot of current knowledge base state
 */
export async function createKnowledgeSnapshot(
  userId: string,
  patchIds: string[]
): Promise<string | undefined> {
  const supabase = await createClient()

  // Read all knowledge base files
  const basePath = path.join(process.cwd(), KNOWLEDGE_BASE_PATH)
  const snapshot: Record<string, string> = {}

  async function readDir(dirPath: string, prefix = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

        if (entry.isDirectory()) {
          await readDir(fullPath, relativePath)
        } else if (entry.name.endsWith('.ts')) {
          snapshot[relativePath] = await fs.readFile(fullPath, 'utf-8')
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error)
    }
  }

  await readDir(basePath)

  // Get current version number
  // Note: Using type assertion as knowledge_versions may not be in generated types yet
  const { data: lastVersion } = await (supabase.from as Function)('knowledge_versions')
    .select('version_number')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const newVersion = (lastVersion?.version_number || 0) + 1

  // Store snapshot
  // Note: Using type assertion as knowledge_versions may not be in generated types yet
  const { data: version } = await (supabase.from as Function)('knowledge_versions')
    .insert({
      version_number: newVersion,
      snapshot,
      patches_applied: patchIds,
      created_by: userId,
    })
    .select()
    .single()

  return version?.id
}

/**
 * Rollback to a specific knowledge base version
 */
export async function rollbackToVersion(
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the version snapshot
  // Note: Using type assertion as knowledge_versions may not be in generated types yet
  const { data: version, error } = await (supabase.from as Function)('knowledge_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error || !version) {
    return { success: false, error: 'Version not found' }
  }

  const snapshot = version.snapshot as Record<string, string>

  try {
    const basePath = path.join(process.cwd(), KNOWLEDGE_BASE_PATH)

    // Restore all files from snapshot
    for (const [relativePath, content] of Object.entries(snapshot)) {
      const filePath = path.join(basePath, relativePath)

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })

      // Write file
      await fs.writeFile(filePath, content, 'utf-8')
    }

    return { success: true }
  } catch (rollbackError) {
    console.error('Failed to rollback:', rollbackError)
    return { success: false, error: 'Failed to rollback to version' }
  }
}
