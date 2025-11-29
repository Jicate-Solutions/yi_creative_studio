# Adaptive AI Form Agent

A universal, dynamic AI agent for intelligent form filling that works with **any form** in **any application**.

## Features

- **Context Recognition**: Understands field relationships (title → description)
- **Auto-Fill Suggestions**: AI generates content for related fields
- **AI Commands**: Transform, enhance, translate content with commands
- **Validation Hints**: Identifies incomplete or problematic content
- **Smart Defaults**: Suggests appropriate default values
- **Multiple Triggers**: Debounce, blur, manual (Ctrl+Space)
- **Provider Agnostic**: OpenAI (default), Anthropic, Gemini, custom
- **Privacy Options**: Client-side or server-side API calls

## Quick Start

```typescript
import { AIForm } from '@/components/form-agent';
import { FormSchema } from '@/types/form-agent';

const eventSchema: FormSchema = {
  id: 'event-form',
  name: 'Create Event',
  category: 'event',
  fields: [
    { name: 'title', type: 'text', label: 'Event Name', required: true },
    { 
      name: 'description', 
      type: 'textarea', 
      label: 'Description',
      dependsOn: ['title'],  // AI will suggest based on title
    },
    { name: 'date', type: 'date', label: 'Date', required: true },
  ],
};

export default function CreateEvent() {
  return (
    <AIForm 
      schema={eventSchema}
      onSubmit={(values) => console.log(values)}
    />
  );
}
```

## How It Works

```
User types "Annual Tech Conference 2025" in title field
                    ↓
AI recognizes context and analyzes field relationships
                    ↓
Suggestions appear for dependent fields:
  - Description: "Join us for the Annual Tech Conference..."
  - Category: "Conference" (auto-selected)
  - Tags: "tech, conference, networking, 2025"
                    ↓
User can Apply, Dismiss, or Edit suggestions
```

## Categories Supported

- `event` - Events, conferences, meetups
- `product` - E-commerce product listings
- `blog` - Blog posts and articles
- `profile` - User profiles and bios
- `listing` - Marketplace listings
- `support` - Support tickets
- `feedback` - Feedback forms
- `poster` - Poster/creative content
- `social` - Social media posts
- `email` - Email campaigns
- `custom` - Any other form

## AI Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| make-formal | Professional tone | Alt+F |
| make-casual | Friendly tone | Alt+C |
| expand | Add more detail | Alt+E |
| shorten | Condense content | Alt+S |
| fix-grammar | Fix errors | Alt+G |
| generate-tags | Create tags | Alt+T |
| generate-description | Generate from title | Alt+D |
| translate | Translate text | - |
| add-emojis | Enhance with emojis | - |
| summarize | Brief summary | - |

## Configuration

```typescript
const config = {
  provider: {
    name: 'openai',
    model: 'gpt-4o-mini',  // Cost-effective
    temperature: 0.7,
  },
  triggerMode: 'all',      // 'debounce' | 'blur' | 'manual' | 'all'
  debounceMs: 300,
  maxSuggestions: 3,
  mode: 'client',          // 'client' | 'server'
  enableAutoFill: true,
  enableCommands: true,
  enableValidation: true,
  enableSmartDefaults: true,
  tone: 'professional',    // 'formal' | 'casual' | 'professional' | 'friendly'
};
```

## Files

```
adaptive-form-agent/
├── SKILL.md                        # Main documentation
├── README.md                       # Quick start guide
├── assets/
│   ├── form-agent-types.ts         # TypeScript types
│   ├── form-ai-service.ts          # AI service layer
│   ├── use-form-agent.ts           # React hook
│   └── suggestion-components.tsx   # UI components
└── references/
    ├── form-schemas.md             # Pre-built schemas
    ├── commands-list.md            # All AI commands
    └── integration-guide.md        # Integration examples
```

## Use Cases

1. **Event Management**: Auto-generate event descriptions, tags, categories
2. **E-commerce**: Product titles, SEO descriptions, keywords
3. **Content Creation**: Blog posts, social media, email campaigns
4. **Support Systems**: Help structure issue reports
5. **User Onboarding**: Profile completion assistance
6. **Creative Tools**: Poster headlines, ad copy

## Requirements

- Next.js 13+ (App Router)
- React 18+
- OpenAI API key
- shadcn/ui components (optional)
