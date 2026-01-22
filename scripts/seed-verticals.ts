
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple env parser
const parseEnv = (content: string) => {
    const result: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
            }
            result[key] = value
        }
    })
    return result
}

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
let env: Record<string, string> = {}
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    env = parseEnv(content)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

const ITEMS_TO_SYNC = [
    // Stakeholders
    { name: 'Membership', type: 'stakeholder' },
    { name: 'Yuva', type: 'stakeholder' },
    { name: 'Thalir', type: 'stakeholder' },
    { name: 'Rural Initiatives', type: 'stakeholder' },
    // Verticals
    { name: 'Health', type: 'vertical' },
    { name: 'Innovation', type: 'vertical' },
    { name: 'Learning', type: 'vertical' },
    { name: 'Entrepreneurship', type: 'vertical' },
    { name: 'Masoom', type: 'vertical' },
    { name: 'Road Safety', type: 'vertical' },
    { name: 'Accessibility', type: 'vertical' },
    { name: 'Climate Change', type: 'vertical' }
]

async function seedVerticals() {
    if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
        console.error('❌ Missing environment variables')
        process.exit(1)
    }

    // Use Service Role Key if available (preferred for seeding), otherwise Anon Key
    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    const isServiceRole = !!SUPABASE_SERVICE_ROLE_KEY

    console.log(`🌱 Seeding Verticals at: ${SUPABASE_URL} (Using ${isServiceRole ? 'Service Role' : 'Anon'} Key)\n`)

    const supabase = createClient(SUPABASE_URL, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    for (const item of ITEMS_TO_SYNC) {
        const slug = item.name.toLowerCase().replace(/ /g, '-')
        // Default prompt template
        const promptTemplate = `Create a professional and impactful design for ${item.name} (${item.type}). The design should be modern, clean, and align with the Young Indians (Yi) brand identity. Focus on themes relevant to ${item.name}.`

        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('vertical_presets')
                .select('id')
                .eq('slug', slug)
                .single()

            if (existing) {
                console.log(`✅ Skipped (already exists): ${item.name}`)
            } else {
                const { error } = await supabase.from('vertical_presets').insert({
                    name: item.name,
                    slug: slug,
                    prompt_template: promptTemplate,
                    is_active: true,
                    icon: 'help-circle' // Default icon, can be updated later in UI or DB
                })

                if (error) {
                    console.error(`❌ Failed to insert ${item.name}:`, error.message)
                } else {
                    console.log(`✨ Inserted: ${item.name}`)
                }
            }
        } catch (err) {
            console.error(`❌ Error processing ${item.name}:`, err)
        }
    }
}

seedVerticals()
