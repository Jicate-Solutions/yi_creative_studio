'use client'

import {
  ShieldCheck,
  Car,
  Leaf,
  Users,
  Baby,
  HeartPulse,
  Lightbulb,
  Building,
  type LucideIcon,
  HelpCircle,
} from 'lucide-react'

// Map icon names from database to Lucide components
const iconMap: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  'car': Car,
  'leaf': Leaf,
  'users': Users,
  'baby': Baby,
  'heart-pulse': HeartPulse,
  'lightbulb': Lightbulb,
  'building': Building,
}

interface VerticalIconProps {
  icon: string
  className?: string
}

export function VerticalIcon({ icon, className = 'h-6 w-6' }: VerticalIconProps) {
  const IconComponent = iconMap[icon.toLowerCase()] || HelpCircle
  return <IconComponent className={className} />
}

export { iconMap }
