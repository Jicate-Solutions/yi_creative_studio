'use client'

import { SpotlightTour, type TourStep } from './SpotlightTour'

const CREATE_PAGE_TOUR_STEPS: TourStep[] = [
  {
    target: 'format-selector',
    title: 'Choose Your Creative Type',
    content: 'Select what you want to create - Event Poster, Certificate, Social Media Post, YouTube Thumbnail, and more!',
    placement: 'bottom',
  },
  {
    target: 'creation-mode',
    title: 'Select Creation Method',
    content: 'Choose "Template" to start from a pre-designed template, or "AI Create" for unique AI-generated designs from scratch.',
    placement: 'bottom',
  },
  {
    target: 'vertical-selector',
    title: 'Pick Your Yi Vertical',
    content: 'Select your Yi chapter or initiative (Yi Main, Yuva, Masoom, Arth) to auto-load the correct brand logos.',
    placement: 'bottom',
  },
  {
    target: 'details-panel',
    title: 'Enter Event Details',
    content: 'Fill in your event information here - title, date, venue, description. You can also paste text and let AI extract the details automatically!',
    placement: 'right',
  },
  {
    target: 'logo-strip',
    title: 'Configure Logo Strip',
    content: 'Enable the logo strip to add brand logos to your creative. Click "Edit Logo Strip & Footer" to customize header logos and footer bar.',
    placement: 'left',
  },
  {
    target: 'theme-selector',
    title: 'Select Theme & Style',
    content: 'Choose a theme (Modern, Corporate, Bold, etc.) and color palette. "AI Auto" lets the AI pick the best options based on your event.',
    placement: 'left',
  },
  {
    target: 'model-selector',
    title: 'Choose AI Model',
    content: 'Select which AI model to use for generation. Different models have different strengths and credit costs.',
    placement: 'bottom',
  },
  {
    target: 'resolution-selector',
    title: 'Set Output Quality',
    content: 'Choose your output resolution - 1K for quick previews, 2K for standard quality, or 4K for high-quality prints.',
    placement: 'bottom',
  },
  {
    target: 'generate-btn',
    title: 'Generate Your Creative!',
    content: 'Once everything is set, click Generate to create your AI-powered design. You can then download, save, or share it!',
    placement: 'bottom',
  },
]

interface CreatePageTourProps {
  forceShow?: boolean
  onComplete?: () => void
}

export function CreatePageTour({ forceShow = false, onComplete }: CreatePageTourProps) {
  return (
    <SpotlightTour
      steps={CREATE_PAGE_TOUR_STEPS}
      forceShow={forceShow}
      onComplete={onComplete}
    />
  )
}

// Re-export reset hook for convenience
export { useResetTour } from './SpotlightTour'
