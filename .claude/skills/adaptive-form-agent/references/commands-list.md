# AI Commands Reference

Complete list of available AI commands for transforming and enhancing form content.

## Transform Commands

### make-formal
**Description:** Rewrites text in a formal, professional tone
**Best for:** Business communications, official documents, professional profiles
**Shortcut:** `Alt+F`

```
Input:  "hey! our new product is super cool and you should totally check it out!"
Output: "We are pleased to introduce our latest product. We invite you to explore its features and discover how it can benefit you."
```

### make-casual
**Description:** Rewrites text in a casual, friendly tone
**Best for:** Social media, community posts, informal communications
**Shortcut:** `Alt+C`

```
Input:  "We are pleased to announce the commencement of our annual conference."
Output: "Exciting news! Our annual conference is starting soon!"
```

### shorten
**Description:** Condenses text while preserving key information
**Best for:** Headlines, social media, meta descriptions
**Shortcut:** `Alt+S`

```
Input:  "Our company has been providing high-quality software development services to enterprises across the globe for over fifteen years, helping them transform their digital presence."
Output: "15+ years of enterprise software development, transforming businesses worldwide."
```

### fix-grammar
**Description:** Corrects grammar, spelling, and punctuation errors
**Best for:** Any text content before publishing
**Shortcut:** `Alt+G`

```
Input:  "Their going to the store becuase they need supplys for there project"
Output: "They're going to the store because they need supplies for their project."
```

### summarize
**Description:** Creates a brief summary of longer content
**Best for:** Excerpts, previews, TL;DR sections

```
Input:  [Long article about climate change...]
Output: "This article discusses the impact of climate change on coastal cities, highlighting rising sea levels and proposed mitigation strategies."
```

### bullet-points
**Description:** Converts paragraph text into bullet point format
**Best for:** Feature lists, instructions, key points

```
Input:  "Our product offers fast performance, easy setup, 24/7 support, and affordable pricing."
Output: "• Fast performance
• Easy setup
• 24/7 support
• Affordable pricing"
```

## Enhance Commands

### expand
**Description:** Adds more detail and context to text
**Best for:** Product descriptions, blog content, explanations
**Shortcut:** `Alt+E`

```
Input:  "Great coffee maker"
Output: "This exceptional coffee maker delivers barista-quality brews right in your kitchen. Featuring programmable settings, a thermal carafe that keeps coffee hot for hours, and easy-clean components, it's perfect for coffee enthusiasts who demand convenience without compromising on taste."
```

### add-emojis
**Description:** Enhances text with appropriate emojis
**Best for:** Social media, casual communications, engaging content

```
Input:  "Join us for our summer sale! Great discounts on all items."
Output: "Join us for our summer sale! ☀️ Great discounts on all items. 🛍️💰"
```

### remove-emojis
**Description:** Strips all emojis from text
**Best for:** Professional documents, formal communications

```
Input:  "Thanks for your order! 🎉 We'll ship it soon! 📦"
Output: "Thanks for your order! We'll ship it soon!"
```

## Generate Commands

### generate-description
**Description:** Creates a full description from a title or name
**Best for:** Product listings, event descriptions, profile bios
**Shortcut:** `Alt+D`

```
Input:  "Wireless Noise-Canceling Headphones"
Output: "Experience immersive audio with our premium wireless noise-canceling headphones. Advanced ANC technology blocks out ambient noise, while 40mm drivers deliver rich, detailed sound. Enjoy up to 30 hours of battery life, comfortable memory foam ear cushions, and seamless Bluetooth 5.0 connectivity. Perfect for commuting, working, or relaxing."
```

### generate-tags
**Description:** Produces relevant keywords and tags for content
**Best for:** SEO, content categorization, searchability
**Shortcut:** `Alt+T`

```
Input:  "A blog post about beginner-friendly yoga poses for stress relief"
Output: "yoga, beginner yoga, stress relief, wellness, mindfulness, yoga poses, relaxation, mental health, self-care, home workout"
```

## Translate Commands

### translate
**Description:** Translates text to a specified language
**Best for:** Internationalization, multilingual content
**Parameters:** `language` - target language

```typescript
// Usage
executeCommand({
  name: 'translate',
  action: 'translate',
  params: { language: 'Spanish' }
}, 'fieldName');
```

```
Input:  "Welcome to our website!"
Output: "¡Bienvenido a nuestro sitio web!"
```

Supported languages:
- Spanish, French, German, Italian, Portuguese
- Chinese (Simplified/Traditional), Japanese, Korean
- Arabic, Hindi, Russian
- Dutch, Swedish, Norwegian, Danish
- And many more...

## Command Usage

### In Components

```typescript
import { CommandPalette } from '@/components/form-agent';

<CommandPalette
  open={isOpen}
  onOpenChange={setIsOpen}
  onSelectCommand={(cmd) => executeCommand(cmd, fieldName)}
  commands={availableCommands}
  currentField="Description"
/>
```

### With Hook

```typescript
const { executeCommand, getAvailableCommands } = useFormAgent({ schema });

// Get commands for a field
const commands = getAvailableCommands('description');

// Execute a command
const result = await executeCommand({
  name: 'make-formal',
  action: 'transform',
  description: 'Make text formal'
}, 'description');
```

### Keyboard Shortcuts

| Command | Shortcut |
|---------|----------|
| Open Command Palette | `Ctrl+Shift+K` |
| Make Formal | `Alt+F` |
| Make Casual | `Alt+C` |
| Expand | `Alt+E` |
| Shorten | `Alt+S` |
| Fix Grammar | `Alt+G` |
| Generate Tags | `Alt+T` |
| Generate Description | `Alt+D` |

### Custom Commands

```typescript
const customCommands: AICommand[] = [
  {
    name: 'brand-voice',
    description: 'Rewrite in our brand voice',
    action: 'transform',
    icon: 'palette',
  },
  {
    name: 'add-cta',
    description: 'Add call-to-action',
    action: 'enhance',
    icon: 'megaphone',
  },
];

// Use in hook
const { executeCommand } = useFormAgent({
  schema,
  config: {
    // Custom commands are merged with defaults
  }
});
```

## Command Behavior by Field Type

| Field Type | Available Commands |
|------------|-------------------|
| `text` | make-formal, make-casual, shorten, fix-grammar, translate, generate-description |
| `textarea` | All commands |
| `rich-text` | All commands |
| `tags` | generate-tags |
| `select` | None (AI suggests options instead) |
| `number` | None |
| `date` | None |

## Best Practices

1. **Context Matters:** Commands work best when there's sufficient context in the form
2. **Review Output:** Always review AI-generated content before submitting
3. **Iterative Use:** Chain commands (e.g., expand → make-formal → fix-grammar)
4. **Field Appropriateness:** Use commands suited to the field type
5. **Keep Originals:** The original value can be restored if needed
