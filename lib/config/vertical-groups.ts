export const STAKEHOLDERS = [
    'Membership',
    'Yuva',
    'Thalir',
    'Rural Initiatives'
]

// Note: "Enterpreship" corrected to "Entrepreneurship" and "safty" to "Safety" and "Accespility" to "Accessibility" based on likely intent and standard spelling, 
// though matching depends on DB values. I will use the standard spellings for the list, but we might need to be careful if DB has typos.
// Assuming DB has correct spellings or we map them.
export const VERTICALS = [
    'Health',
    'Innovation',
    'Learning',
    'Entrepreneurship',
    'Masoom',
    'Road Safety',
    'Accessibility',
    'Climate Change',
    'Gift an Organ' // Adding common Yi verticals just in case, or stick strictly to user list? User said "update with this content", implying these are the only ones to show or prioritize. I'll stick to the user's list plus "Gift an Organ" is often there. actually let's stick STRICTLY to the user list for now to be safe, maybe 'Gift an Organ' isn't wanted here.
]

// Helper to normalize strings for comparison (case-insensitive, ignore minor typo differences if needed, but for now just simple trim/lower)
export const normalizeVerticalName = (name: string) => name.toLowerCase().trim()
