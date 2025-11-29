# Pre-built Form Schemas

Ready-to-use form schemas for common use cases. Copy and customize for your application.

## Event Form

```typescript
const eventSchema: FormSchema = {
  id: 'event-form',
  name: 'Create Event',
  description: 'Create a new event with AI-powered suggestions',
  category: 'event',
  fields: [
    { 
      name: 'title', 
      type: 'text', 
      label: 'Event Name', 
      required: true,
      placeholder: 'e.g., Annual Tech Conference 2025',
      aiPrompt: 'Suggest catchy, memorable event names',
    },
    { 
      name: 'description', 
      type: 'textarea', 
      label: 'Description',
      dependsOn: ['title'],
      placeholder: 'Describe your event...',
      aiPrompt: 'Generate engaging description with what, when, where, why. Include highlights and call-to-action.',
    },
    { 
      name: 'date', 
      type: 'date', 
      label: 'Event Date', 
      required: true,
    },
    { 
      name: 'location', 
      type: 'text', 
      label: 'Location',
      placeholder: 'Venue or Online',
    },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      options: ['Conference', 'Workshop', 'Meetup', 'Webinar', 'Concert', 'Exhibition', 'Sports', 'Other'],
      dependsOn: ['title', 'description'],
    },
    { 
      name: 'targetAudience', 
      type: 'text', 
      label: 'Target Audience',
      dependsOn: ['title', 'description', 'category'],
      aiPrompt: 'Suggest appropriate target audience based on event type',
    },
    { 
      name: 'tags', 
      type: 'tags', 
      label: 'Tags',
      dependsOn: ['title', 'description', 'category'],
      aiPrompt: 'Generate 5-8 relevant, searchable tags',
    },
  ],
};
```

## Product Listing

```typescript
const productSchema: FormSchema = {
  id: 'product-form',
  name: 'Add Product',
  description: 'Create a product listing with AI optimization',
  category: 'product',
  fields: [
    { 
      name: 'name', 
      type: 'text', 
      label: 'Product Name', 
      required: true,
      placeholder: 'e.g., Wireless Bluetooth Headphones Pro',
      aiPrompt: 'Suggest SEO-friendly product titles with key features',
    },
    { 
      name: 'description', 
      type: 'textarea', 
      label: 'Description',
      required: true,
      dependsOn: ['name'],
      aiPrompt: 'Generate compelling product description highlighting features, benefits, and unique selling points. Use bullet points for features.',
    },
    { 
      name: 'shortDescription', 
      type: 'text', 
      label: 'Short Description',
      dependsOn: ['name', 'description'],
      aiPrompt: 'Create a 1-2 sentence summary for product cards',
    },
    { 
      name: 'price', 
      type: 'number', 
      label: 'Price', 
      required: true,
      validation: { min: 0 },
    },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      required: true,
      options: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Beauty', 'Books', 'Toys', 'Food', 'Other'],
      dependsOn: ['name'],
    },
    { 
      name: 'sku', 
      type: 'text', 
      label: 'SKU',
      placeholder: 'e.g., PROD-001',
    },
    { 
      name: 'keywords', 
      type: 'tags', 
      label: 'SEO Keywords',
      dependsOn: ['name', 'description', 'category'],
      aiPrompt: 'Generate search-optimized keywords for e-commerce',
    },
    { 
      name: 'metaDescription', 
      type: 'textarea', 
      label: 'Meta Description',
      dependsOn: ['name', 'description'],
      aiPrompt: 'Create SEO meta description, 150-160 characters',
      validation: { maxLength: 160 },
    },
  ],
};
```

## Blog Post

```typescript
const blogSchema: FormSchema = {
  id: 'blog-form',
  name: 'Create Blog Post',
  description: 'Write a blog post with AI assistance',
  category: 'blog',
  fields: [
    { 
      name: 'title', 
      type: 'text', 
      label: 'Title', 
      required: true,
      placeholder: 'e.g., 10 Tips for Better Productivity',
      aiPrompt: 'Suggest engaging, SEO-optimized blog titles',
    },
    { 
      name: 'slug', 
      type: 'text', 
      label: 'URL Slug',
      dependsOn: ['title'],
      aiPrompt: 'Generate URL-friendly slug from title',
    },
    { 
      name: 'excerpt', 
      type: 'textarea', 
      label: 'Excerpt',
      dependsOn: ['title'],
      aiPrompt: 'Write compelling 2-3 sentence excerpt for previews',
      validation: { maxLength: 300 },
    },
    { 
      name: 'content', 
      type: 'rich-text', 
      label: 'Content',
      required: true,
      dependsOn: ['title', 'excerpt'],
      aiPrompt: 'Expand into full blog post with headers, paragraphs, and conclusion',
    },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      options: ['Technology', 'Business', 'Lifestyle', 'Health', 'Travel', 'Food', 'Finance', 'Other'],
      dependsOn: ['title', 'content'],
    },
    { 
      name: 'tags', 
      type: 'tags', 
      label: 'Tags',
      dependsOn: ['title', 'content', 'category'],
      aiPrompt: 'Generate relevant blog tags for discovery',
    },
    { 
      name: 'metaTitle', 
      type: 'text', 
      label: 'Meta Title',
      dependsOn: ['title'],
      aiPrompt: 'Create SEO meta title, 50-60 characters',
      validation: { maxLength: 60 },
    },
    { 
      name: 'metaDescription', 
      type: 'textarea', 
      label: 'Meta Description',
      dependsOn: ['title', 'excerpt'],
      aiPrompt: 'Create SEO meta description, 150-160 characters',
      validation: { maxLength: 160 },
    },
  ],
};
```

## User Profile

```typescript
const profileSchema: FormSchema = {
  id: 'profile-form',
  name: 'Edit Profile',
  description: 'Update your profile with AI suggestions',
  category: 'profile',
  fields: [
    { 
      name: 'displayName', 
      type: 'text', 
      label: 'Display Name', 
      required: true,
    },
    { 
      name: 'headline', 
      type: 'text', 
      label: 'Professional Headline',
      placeholder: 'e.g., Senior Software Engineer at TechCorp',
      aiPrompt: 'Suggest professional headlines based on role and experience',
    },
    { 
      name: 'bio', 
      type: 'textarea', 
      label: 'Bio',
      dependsOn: ['displayName', 'headline'],
      aiPrompt: 'Write professional yet personable bio highlighting expertise',
      validation: { maxLength: 500 },
    },
    { 
      name: 'location', 
      type: 'text', 
      label: 'Location',
    },
    { 
      name: 'website', 
      type: 'url', 
      label: 'Website',
    },
    { 
      name: 'skills', 
      type: 'tags', 
      label: 'Skills',
      dependsOn: ['headline', 'bio'],
      aiPrompt: 'Suggest relevant professional skills',
    },
  ],
};
```

## Poster/Creative

```typescript
const posterSchema: FormSchema = {
  id: 'poster-form',
  name: 'Create Poster',
  description: 'Design a poster with AI content suggestions',
  category: 'poster',
  fields: [
    { 
      name: 'headline', 
      type: 'text', 
      label: 'Headline', 
      required: true,
      placeholder: 'e.g., SUMMER SALE',
      aiPrompt: 'Suggest attention-grabbing, readable headlines',
    },
    { 
      name: 'subheadline', 
      type: 'text', 
      label: 'Subheadline',
      dependsOn: ['headline'],
      aiPrompt: 'Create supporting subheadline that adds context',
    },
    { 
      name: 'bodyText', 
      type: 'textarea', 
      label: 'Body Text',
      dependsOn: ['headline', 'subheadline'],
      aiPrompt: 'Write concise body copy. Keep it short for visual impact.',
      validation: { maxLength: 200 },
    },
    { 
      name: 'callToAction', 
      type: 'text', 
      label: 'Call to Action',
      placeholder: 'e.g., Shop Now, Learn More',
      dependsOn: ['headline'],
      aiPrompt: 'Suggest compelling CTA phrases',
    },
    { 
      name: 'theme', 
      type: 'select', 
      label: 'Theme',
      options: ['Modern', 'Minimalist', 'Bold', 'Elegant', 'Playful', 'Professional', 'Vintage'],
      dependsOn: ['headline'],
    },
    { 
      name: 'colorScheme', 
      type: 'select', 
      label: 'Color Scheme',
      options: ['Vibrant', 'Pastel', 'Dark', 'Light', 'Monochrome', 'Warm', 'Cool'],
      dependsOn: ['theme'],
    },
  ],
};
```

## Support Ticket

```typescript
const supportSchema: FormSchema = {
  id: 'support-form',
  name: 'Submit Support Request',
  description: 'Get help with AI-assisted issue description',
  category: 'support',
  fields: [
    { 
      name: 'subject', 
      type: 'text', 
      label: 'Subject', 
      required: true,
      placeholder: 'Brief summary of the issue',
      aiPrompt: 'Help write clear, descriptive subject lines',
    },
    { 
      name: 'description', 
      type: 'textarea', 
      label: 'Description',
      required: true,
      dependsOn: ['subject'],
      aiPrompt: 'Help structure the issue description with: What happened, Steps to reproduce, Expected behavior',
    },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      required: true,
      options: ['Bug Report', 'Feature Request', 'Question', 'Account Issue', 'Billing', 'Other'],
      dependsOn: ['subject', 'description'],
    },
    { 
      name: 'priority', 
      type: 'select', 
      label: 'Priority',
      options: ['Low', 'Medium', 'High', 'Critical'],
      dependsOn: ['subject', 'description', 'category'],
      aiPrompt: 'Suggest appropriate priority based on issue description',
    },
    { 
      name: 'environment', 
      type: 'text', 
      label: 'Environment',
      placeholder: 'e.g., Chrome 120, Windows 11',
    },
  ],
};
```

## Social Media Post

```typescript
const socialSchema: FormSchema = {
  id: 'social-form',
  name: 'Create Social Post',
  description: 'Craft social media content with AI',
  category: 'social',
  fields: [
    { 
      name: 'platform', 
      type: 'select', 
      label: 'Platform',
      required: true,
      options: ['Twitter/X', 'LinkedIn', 'Facebook', 'Instagram', 'TikTok'],
    },
    { 
      name: 'content', 
      type: 'textarea', 
      label: 'Content',
      required: true,
      dependsOn: ['platform'],
      aiPrompt: 'Write platform-appropriate content. Twitter: concise. LinkedIn: professional. Instagram: visual-focused.',
    },
    { 
      name: 'hashtags', 
      type: 'tags', 
      label: 'Hashtags',
      dependsOn: ['platform', 'content'],
      aiPrompt: 'Generate trending, relevant hashtags for the platform',
    },
    { 
      name: 'callToAction', 
      type: 'text', 
      label: 'Call to Action',
      dependsOn: ['content'],
      aiPrompt: 'Suggest engaging CTAs for social engagement',
    },
    { 
      name: 'scheduledTime', 
      type: 'date', 
      label: 'Schedule For',
    },
  ],
};
```

## Email Template

```typescript
const emailSchema: FormSchema = {
  id: 'email-form',
  name: 'Compose Email',
  description: 'Write effective emails with AI assistance',
  category: 'email',
  fields: [
    { 
      name: 'type', 
      type: 'select', 
      label: 'Email Type',
      required: true,
      options: ['Newsletter', 'Promotional', 'Transactional', 'Welcome', 'Follow-up', 'Announcement'],
    },
    { 
      name: 'subject', 
      type: 'text', 
      label: 'Subject Line', 
      required: true,
      dependsOn: ['type'],
      aiPrompt: 'Suggest compelling subject lines that avoid spam triggers. Keep under 50 characters.',
      validation: { maxLength: 50 },
    },
    { 
      name: 'preheader', 
      type: 'text', 
      label: 'Preheader Text',
      dependsOn: ['subject'],
      aiPrompt: 'Write preview text that complements the subject line',
      validation: { maxLength: 100 },
    },
    { 
      name: 'body', 
      type: 'rich-text', 
      label: 'Email Body',
      required: true,
      dependsOn: ['type', 'subject'],
      aiPrompt: 'Write scannable email content with clear sections and CTA',
    },
    { 
      name: 'ctaButton', 
      type: 'text', 
      label: 'CTA Button Text',
      dependsOn: ['body'],
      aiPrompt: 'Suggest action-oriented button text',
    },
  ],
};
```

## Using Schemas

```typescript
// Import the schema
import { eventSchema } from '@/schemas/event';

// Use with AIForm component
<AIForm 
  schema={eventSchema}
  onSubmit={(values) => {
    console.log('Form submitted:', values);
  }}
/>

// Or with useFormAgent hook
const form = useFormAgent({ schema: eventSchema });
```

## Customizing Schemas

```typescript
// Extend an existing schema
const customEventSchema: FormSchema = {
  ...eventSchema,
  fields: [
    ...eventSchema.fields,
    {
      name: 'ticketPrice',
      type: 'number',
      label: 'Ticket Price',
      validation: { min: 0 },
    },
  ],
};

// Add custom AI prompts
const enhancedSchema: FormSchema = {
  ...productSchema,
  contextPrompt: 'This is for a luxury brand. Use premium, sophisticated language.',
  fields: productSchema.fields.map(field => ({
    ...field,
    aiPrompt: field.aiPrompt 
      ? `${field.aiPrompt} Use luxury brand voice.`
      : undefined,
  })),
};
```
