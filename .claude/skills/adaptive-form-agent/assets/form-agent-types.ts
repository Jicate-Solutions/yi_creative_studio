// types/form-agent.ts
// Complete TypeScript types for the Adaptive AI Form Agent

export type SuggestionType = 
  | 'auto-fill'      // Fill next field automatically
  | 'command'        // AI command like "make formal"
  | 'validation'     // Validation hint
  | 'smart-default'; // Suggested default value

export type TriggerMode = 
  | 'debounce'       // After typing stops (default 300ms)
  | 'blur'           // When field loses focus
  | 'manual'         // Ctrl+Space or button click
  | 'all';           // All triggers enabled

export type FormCategory = 
  | 'event'
  | 'product'
  | 'blog'
  | 'profile'
  | 'listing'
  | 'support'
  | 'feedback'
  | 'poster'
  | 'social'
  | 'email'
  | 'custom';

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'number' 
  | 'date' 
  | 'email' 
  | 'url'
  | 'color'
  | 'tags'
  | 'rich-text';

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: (value: any) => boolean | string;
}

export interface FieldSchema {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[] | { value: string; label: string }[];
  defaultValue?: any;
  dependsOn?: string[];           // Fields this depends on for AI context
  aiPrompt?: string;              // Custom prompt for this field
  aiEnabled?: boolean;            // Enable/disable AI for this field (default: true)
  validation?: FieldValidation;
  hidden?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  category: FormCategory;
  fields: FieldSchema[];
  contextPrompt?: string;         // Additional context for AI
  submitLabel?: string;
  version?: string;
}

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  targetField: string;
  content: string;
  confidence: number;             // 0-1 confidence score
  reasoning?: string;             // Why AI suggested this
  alternatives?: string[];        // Alternative suggestions
  command?: AICommand;            // If type is 'command'
  metadata?: Record<string, any>; // Additional data
  timestamp: number;
}

export type CommandAction = 'transform' | 'enhance' | 'translate' | 'generate' | 'validate';

export interface AICommand {
  name: string;
  description: string;
  action: CommandAction;
  icon?: string;
  shortcut?: string;
  params?: Record<string, any>;
}

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'gemini' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface FormAgentConfig {
  // AI Provider
  provider: AIProvider;
  
  // Behavior
  triggerMode: TriggerMode;
  debounceMs: number;
  maxSuggestions: number;
  autoApplyHighConfidence: boolean;
  highConfidenceThreshold: number;
  
  // Privacy & Security
  mode: 'client' | 'server';
  apiEndpoint?: string;           // For server mode
  
  // Features
  enableAutoFill: boolean;
  enableCommands: boolean;
  enableValidation: boolean;
  enableSmartDefaults: boolean;
  enableFieldRelations: boolean;
  
  // Customization
  customPrompt?: string;
  language?: string;
  tone?: 'formal' | 'casual' | 'professional' | 'friendly';
  
  // Callbacks
  onSuggestion?: (suggestion: AISuggestion) => void;
  onCommand?: (command: AICommand, field: string) => void;
  onError?: (error: Error) => void;
}

export interface FormAgentState {
  isProcessing: boolean;
  processingField: string | null;
  suggestions: AISuggestion[];
  appliedSuggestions: string[];   // IDs of applied suggestions
  dismissedSuggestions: string[]; // IDs of dismissed suggestions
  error: string | null;
  lastFieldUpdated: string | null;
  formValues: Record<string, any>;
  schema: FormSchema | null;
  isInitialized: boolean;
}

export interface FormAgentActions {
  // Core actions
  updateField: (field: string, value: any) => void;
  updateFields: (values: Record<string, any>) => void;
  getSuggestions: (field: string) => Promise<AISuggestion[]>;
  getSuggestionsForAll: () => Promise<void>;
  applySuggestion: (suggestion: AISuggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Command actions
  executeCommand: (command: AICommand, field: string) => Promise<string>;
  getAvailableCommands: (field: string) => AICommand[];
  
  // Schema actions
  setSchema: (schema: FormSchema) => void;
  autoDetectSchema: (formElement?: HTMLFormElement) => Promise<FormSchema>;
  validateSchema: () => boolean;
  
  // Validation
  validateField: (field: string) => Promise<string | null>;
  validateForm: () => Promise<Record<string, string>>;
  
  // Utility
  clearSuggestions: () => void;
  clearFieldSuggestions: (field: string) => void;
  reset: () => void;
  getFieldValue: (field: string) => any;
  setFieldValue: (field: string, value: any) => void;
}

export type FormAgentHook = FormAgentState & FormAgentActions;

// Pre-built command definitions
export const DEFAULT_COMMANDS: AICommand[] = [
  {
    name: 'make-formal',
    description: 'Rewrite in formal, professional tone',
    action: 'transform',
    icon: 'type',
    shortcut: 'Alt+F',
  },
  {
    name: 'make-casual',
    description: 'Rewrite in casual, friendly tone',
    action: 'transform',
    icon: 'smile',
    shortcut: 'Alt+C',
  },
  {
    name: 'expand',
    description: 'Expand with more details and context',
    action: 'enhance',
    icon: 'expand',
    shortcut: 'Alt+E',
  },
  {
    name: 'shorten',
    description: 'Shorten while keeping key information',
    action: 'transform',
    icon: 'minimize',
    shortcut: 'Alt+S',
  },
  {
    name: 'fix-grammar',
    description: 'Fix grammar and spelling errors',
    action: 'transform',
    icon: 'check',
    shortcut: 'Alt+G',
  },
  {
    name: 'add-emojis',
    description: 'Add appropriate emojis to enhance text',
    action: 'enhance',
    icon: 'sparkles',
  },
  {
    name: 'remove-emojis',
    description: 'Remove all emojis from text',
    action: 'transform',
    icon: 'x',
  },
  {
    name: 'generate-tags',
    description: 'Generate relevant tags/keywords',
    action: 'generate',
    icon: 'hash',
    shortcut: 'Alt+T',
  },
  {
    name: 'generate-description',
    description: 'Generate description from title/name',
    action: 'generate',
    icon: 'file-text',
    shortcut: 'Alt+D',
  },
  {
    name: 'translate',
    description: 'Translate to another language',
    action: 'translate',
    icon: 'languages',
  },
  {
    name: 'summarize',
    description: 'Summarize the content briefly',
    action: 'transform',
    icon: 'list',
  },
  {
    name: 'bullet-points',
    description: 'Convert to bullet point format',
    action: 'transform',
    icon: 'list',
  },
];

// Default configuration
export const DEFAULT_CONFIG: FormAgentConfig = {
  provider: {
    name: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
  },
  triggerMode: 'all',
  debounceMs: 300,
  maxSuggestions: 3,
  autoApplyHighConfidence: false,
  highConfidenceThreshold: 0.9,
  mode: 'client',
  enableAutoFill: true,
  enableCommands: true,
  enableValidation: true,
  enableSmartDefaults: true,
  enableFieldRelations: true,
  tone: 'professional',
};

// Category-specific system prompts
export const CATEGORY_PROMPTS: Record<FormCategory, string> = {
  event: `You are an expert event planner assistant. Help create compelling event content.
Consider: Event names should be catchy and memorable. Descriptions should include what, when, where, and why someone should attend.
Suggest appropriate categories, tags, target audience, and promotional angles.`,

  product: `You are an expert e-commerce copywriter. Help create compelling product listings.
Consider: Product titles should be SEO-friendly and descriptive. Descriptions should highlight features, benefits, and unique selling points.
Suggest appropriate categories, pricing insights, and keywords for search optimization.`,

  blog: `You are an expert content writer and SEO specialist. Help create engaging blog content.
Consider: Titles should be engaging, SEO-optimized, and clickable. Content should be well-structured with clear headers.
Suggest relevant tags, categories, meta descriptions, and internal linking opportunities.`,

  profile: `You are an expert personal branding consultant. Help create compelling profiles.
Consider: Bios should be professional yet personable. Highlight unique skills and experiences.
Suggest relevant tags, categories, and ways to stand out.`,

  listing: `You are an expert marketplace listing specialist. Help create effective listings.
Consider: Titles should be clear, searchable, and include key details. Descriptions should be comprehensive and address buyer concerns.
Suggest appropriate pricing strategies, categories, and keywords.`,

  support: `You are an expert customer support specialist. Help craft clear support requests.
Consider: Issues should be clearly described with reproducible steps. Include relevant technical details.
Suggest appropriate priority levels and categories.`,

  feedback: `You are an expert feedback analyst. Help provide constructive and actionable feedback.
Consider: Feedback should be specific, balanced, and actionable. Include both positives and areas for improvement.
Suggest appropriate ratings and categories.`,

  poster: `You are an expert graphic design consultant. Help create compelling poster content.
Consider: Headlines should be attention-grabbing and readable. Descriptions should be concise yet informative.
Suggest appropriate visual themes, color schemes, and call-to-action text.`,

  social: `You are an expert social media strategist. Help create engaging social content.
Consider: Posts should be platform-appropriate, engaging, and shareable. Include relevant hashtags and calls-to-action.
Suggest optimal posting times and engagement strategies.`,

  email: `You are an expert email marketing specialist. Help craft effective emails.
Consider: Subject lines should be compelling and avoid spam triggers. Body should be scannable with clear CTAs.
Suggest appropriate personalization and segmentation strategies.`,

  custom: `You are a helpful AI assistant. Analyze the form context and provide relevant suggestions.
Adapt your tone and suggestions based on the apparent purpose of the form.`,
};
