/**
 * Field-to-Icon Mapping Registry
 *
 * Maps field IDs to Lucide icons for icon-only display in Summary Card.
 * Used by the value-centric Summary Card redesign where icons replace text labels.
 */

import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Globe,
  Hash,
  FileText,
  Mic2,
  Building2,
  PenTool,
  ExternalLink,
  AtSign,
  MessageSquare,
  Users,
  Award,
  Briefcase,
  Video,
  Link,
  Type,
  AlignLeft,
  Tag,
  Target,
  Info,
  Palette,
  Layers,
  Image,
  type LucideIcon,
} from 'lucide-react'

/**
 * Field-to-Icon mapping
 * Returns the appropriate icon for each field type
 */
export const FIELD_ICONS: Record<string, LucideIcon> = {
  // Core event fields
  eventName: FileText,
  eventTitle: FileText,
  eventTagline: Tag,
  eventDate: Calendar,
  eventTime: Clock,
  eventEndTime: Clock,
  venue: MapPin,
  eventVenue: MapPin,
  location: MapPin,
  eventDescription: AlignLeft,
  description: AlignLeft,

  // Speaker fields
  speakerName: User,
  speakerDesignation: Briefcase,
  speakerTitle: Mic2,
  resourcePerson: User,

  // Contact fields
  contactNumber: Phone,
  contactPhone: Phone,
  phone: Phone,
  contactEmail: Mail,
  email: Mail,
  websiteUrl: Globe,
  website: Globe,
  registrationInfo: ExternalLink,
  registrationUrl: ExternalLink,
  registrationLink: Link,

  // Social fields
  hashtags: Hash,
  socialMediaHandle: AtSign,
  instagramHandle: AtSign,
  twitterHandle: AtSign,
  facebookHandle: AtSign,
  linkedinHandle: AtSign,

  // Branding fields
  organizationName: Building2,
  organization: Building2,
  chapterName: Building2,
  chapterAddress: MapPin,

  // Certificate/Signatory fields
  recipientName: Award,
  certificateTitle: Award,
  signatoryName: PenTool,
  signatoryDesignation: PenTool,
  signatoryName2: PenTool,
  signatoryDesignation2: PenTool,

  // Content fields
  message: MessageSquare,
  additionalDetails: Info,
  additionalInfo: Info,
  targetAudience: Target,
  audience: Users,

  // Media fields
  videoUrl: Video,
  channelName: Video,
  thumbnailText: Type,

  // Design fields (for design card)
  theme: Palette,
  style: Layers,
  resolution: Image,

  // Default fallback
  _default: FileText,
}

/**
 * Get icon for a field ID
 * Returns the mapped icon or the default icon if not found
 */
export function getFieldIcon(fieldId: string): LucideIcon {
  return FIELD_ICONS[fieldId] || FIELD_ICONS._default
}

/**
 * Field groupings for card-per-group layout
 * Each group becomes a separate mini-card in the summary
 */
export const FIELD_GROUPS = {
  timing: {
    icon: Calendar,
    fields: ['eventDate', 'eventTime', 'eventEndTime'],
    label: 'Timing', // For accessibility
  },
  location: {
    icon: MapPin,
    fields: ['venue', 'eventVenue', 'location'],
    label: 'Location',
  },
  contact: {
    icon: Phone,
    fields: ['contactNumber', 'contactPhone', 'phone', 'contactEmail', 'email', 'websiteUrl', 'website', 'registrationInfo', 'registrationUrl'],
    label: 'Contact',
  },
  speaker: {
    icon: User,
    fields: ['speakerName', 'speakerDesignation', 'resourcePerson'],
    label: 'Speaker',
  },
  branding: {
    icon: Building2,
    fields: ['organizationName', 'organization', 'chapterName', 'chapterAddress'],
    label: 'Branding',
  },
  content: {
    icon: FileText,
    fields: ['eventName', 'eventTitle', 'eventTagline', 'eventDescription', 'description', 'message', 'additionalDetails'],
    label: 'Content',
  },
  social: {
    icon: Hash,
    fields: ['hashtags', 'socialMediaHandle', 'instagramHandle', 'twitterHandle'],
    label: 'Social',
  },
  signatory: {
    icon: PenTool,
    fields: ['signatoryName', 'signatoryDesignation', 'signatoryName2', 'signatoryDesignation2', 'recipientName'],
    label: 'Signatory',
  },
  design: {
    icon: Palette,
    fields: ['theme', 'style', 'resolution'],
    label: 'Design',
  },
} as const

export type FieldGroupKey = keyof typeof FIELD_GROUPS

/**
 * Get the group a field belongs to
 */
export function getFieldGroup(fieldId: string): FieldGroupKey | null {
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    if ((group.fields as readonly string[]).includes(fieldId)) {
      return groupKey as FieldGroupKey
    }
  }
  return null
}

/**
 * Group fields by their category for card-per-group layout
 */
export function groupFieldsByCategory(
  fields: Array<{ id: string; value: unknown }>
): Record<FieldGroupKey, Array<{ id: string; value: unknown }>> {
  const grouped = {} as Record<FieldGroupKey, Array<{ id: string; value: unknown }>>

  // Initialize empty arrays for each group
  for (const key of Object.keys(FIELD_GROUPS) as FieldGroupKey[]) {
    grouped[key] = []
  }

  // Assign fields to their groups
  for (const field of fields) {
    const group = getFieldGroup(field.id)
    if (group && grouped[group]) {
      grouped[group].push(field)
    }
  }

  return grouped
}
