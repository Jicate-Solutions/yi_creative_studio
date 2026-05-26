'use client'

import { useCreativeStore } from '@/stores/creative-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const THEMES = [
  { id: 'ai', label: 'AI Auto', description: 'Contextual analysis' },
  { id: 'modern', label: 'Modern', description: 'Clean & contemporary' },
  { id: 'corporate', label: 'Corporate', description: 'Professional' },
  { id: 'bold', label: 'Bold', description: 'Impactful' },
  { id: 'elegant', label: 'Elegant', description: 'Sophisticated' },
  { id: 'playful', label: 'Playful', description: 'Energetic' },
]

export function ThemeDropdown() {
  const { formData, updateTheme } = useCreativeStore()
  const currentTheme = formData.designData?.theme || 'ai'

  const handleChange = (value: string) => {
    updateTheme(value)
  }

  return (
    <Select value={currentTheme} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
