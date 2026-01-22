
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

async function checkVerticals() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Missing environment variables')
        console.log('Available keys from .env.local:', Object.keys(env))
        process.exit(1)
    }

    console.log(`🔍 Checking Verticals at: ${SUPABASE_URL}\n`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    try {
        const { data: verticals, error } = await supabase
            .from('vertical_presets')
            .select('name, is_active')
            .order('name')

        if (error) {
            console.error('❌ Error querying database:', error.message)
            process.exit(1)
        }

        if (!verticals || verticals.length === 0) {
            console.log('❌ No verticals found')
        } else {
            console.log('✅ Verticals found:')
            verticals.forEach(v => {
                console.log(`  - "${v.name}" (Active: ${v.is_active})`)
            })
        }
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

checkVerticals()
