---
name: adaptive-form-agent
description: Dynamic AI-powered form filling agent that recognizes context from user input and suggests next fields, auto-fills content, provides commands, and validates data. Uses OpenAI GPT-4o-mini for intelligent suggestions. Works with any form in any application - events, products, blogs, profiles, etc. Automatically triggers when user mentions 'AI form', 'smart form', 'auto-fill', 'form suggestions', 'intelligent form', 'form agent', or 'adaptive form'.
---

# Adaptive AI Form Agent

A universal, dynamic AI agent for intelligent form filling that adapts to ANY form structure in ANY application. It recognizes context from user input and provides smart suggestions, auto-fill capabilities, commands, and validation.

## Core Capabilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADAPTIVE AI FORM AGENT                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER INPUT ──┬──▶ Context Recognition ──▶ AI Processing ──┬──▶ OUTPUT  │
│               │                                             │            │
│               │    ┌─────────────────────────────────────┐ │            │
│               ├───▶│  1. Auto-Fill Suggestions           │─┤            │
│               │    │     "Event Name" → Description      │ │            │
│               │    └─────────────────────────────────────┘ │            │
│               │    ┌─────────────────────────────────────┐ │            │
│               ├───▶│  2. AI Commands                     │─┤            │
│               │    │     "Make formal", "Add emojis"     │ │            │
│               │    └─────────────────────────────────────┘ │            │
│               │    ┌─────────────────────────────────────┐ │            │
│               ├───▶│  3. Validation Hints                │─┤            │
│               │    │     "Missing required info"         │ │            │
│               │    └─────────────────────────────────────┘ │            │
│               │    ┌─────────────────────────────────────┐ │            │
│               └───▶│  4. Smart Defaults                  │─┘            │
│                    │     Category, tags, dates           │              │
│                    └─────────────────────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FORM AGENT SYSTEM                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────┐  │
│  │ Form Schema │───▶│ FormAgent    │───▶│  OpenAI GPT-4o-mini         │  │
│  │ (optional)  │    │ Context      │    │  (or configurable provider) │  │
│  └─────────────┘    └──────────────┘    └─────────────────────────────┘  │
│                            │                         │                    │
│                            ▼                         ▼                    │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────┐  │
│  │ Auto-detect │───▶│ useFormAgent │───▶│  Suggestion Components      │  │
│  │ Fields      │    │ Hook         │    │  (inline, popover, command) │  │
│  └─────────────┘    └──────────────┘    └─────────────────────────────┘  │
│                                                                           │
│  TRIGGERS: Debounce (300ms) | Field Blur | Manual (Ctrl+Space)           │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Implementation Workflow

### Phase 1: Install Dependencies

```bash
npm install openai zod
```

### Phase 2: Create Types

```typescript
// types/form-agent.ts

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

export interface FieldSchema {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'email' | 'url';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];           // For select fields
  dependsOn?: string[];         // Fields this depends on
  aiPrompt?: string;            // Custom prompt for this field
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean;
  };
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  category: FormCategory;
  fields: FieldSchema[];
  contextPrompt?: string;       // Additional context for AI
}

export type FormCategory = 
  | 'event'
  | 'product'
  | 'blog'
  | 'profile'
  | 'listing'
  | 'support'
  | 'feedback'
  | 'custom';

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  targetField: string;
  content: string;
  confidence: number;           // 0-1 confidence score
  reasoning?: string;           // Why AI suggested this
  alternatives?: string[];      // Alternative suggestions
  command?: AICommand;          // If type is 'command'
}

export interface AICommand {
  name: string;
  description: string;
  action: 'transform' | 'enhance' | 'translate' | 'generate';
  params?: Record<string, any>;
}

export interface FormAgentConfig {
  // AI Provider
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  apiKey?: string;              // Can be set via env
  
  // Behavior
  triggerMode: TriggerMode;
  debounceMs: number;
  maxSuggestions: number;
  
  // Privacy
  mode: 'client' | 'server';    // Where AI calls happen
  
  // Features
  enableAutoFill: boolean;
  enableCommands: boolean;
  enableValidation: boolean;
  enableSmartDefaults: boolean;
  
  // Customization
  customPrompt?: string;
  language?: string;
  tone?: 'formal' | 'casual' | 'professional';
}

export interface FormAgentState {
  isProcessing: boolean;
  suggestions: AISuggestion[];
  error: string | null;
  lastFieldUpdated: string | null;
  formValues: Record<string, any>;
  schema: FormSchema | null;
}

export interface FormAgentActions {
  // Core actions
  updateField: (field: string, value: any) => void;
  getSuggestions: (field: string) => Promise<void>;
  applySuggestion: (suggestion: AISuggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Command actions
  executeCommand: (command: AICommand, field: string) => Promise<string>;
  
  // Schema actions
  setSchema: (schema: FormSchema) => void;
  autoDetectSchema: () => Promise<FormSchema>;
  
  // Utility
  clearSuggestions: () => void;
  reset: () => void;
}
```

### Phase 3: AI Service Layer

```typescript
// services/form-ai-service.ts

import OpenAI from 'openai';
import { 
  FormSchema, 
  AISuggestion, 
  FormAgentConfig,
  AICommand,
  FormCategory 
} from '@/types/form-agent';

// Category-specific prompts for better context
const CATEGORY_PROMPTS: Record<FormCategory, string> = {
  event: `You are helping fill out an event form. Consider:
    - Event names should be catchy and descriptive
    - Descriptions should include what, when, where, why
    - Suggest appropriate categories, tags, and target audience`,
  
  product: `You are helping fill out a product listing. Consider:
    - Product titles should be SEO-friendly and descriptive
    - Descriptions should highlight features and benefits
    - Suggest appropriate categories, pricing hints, and keywords`,
  
  blog: `You are helping write a blog post. Consider:
    - Titles should be engaging and SEO-optimized
    - Content should be structured with headers
    - Suggest tags, categories, and meta descriptions`,
  
  profile: `You are helping fill out a user profile. Consider:
    - Bio should be professional yet personable
    - Highlight skills and experience appropriately
    - Suggest relevant tags and categories`,
  
  listing: `You are helping create a listing. Consider:
    - Titles should be clear and searchable
    - Include all relevant details upfront
    - Suggest appropriate pricing and categories`,
  
  support: `You are helping submit a support request. Consider:
    - Summarize the issue clearly
    - Include relevant technical details
    - Suggest appropriate priority and category`,
  
  feedback: `You are helping submit feedback. Consider:
    - Be constructive and specific
    - Highlight both positives and areas for improvement
    - Suggest appropriate rating and category`,
  
  custom: `You are helping fill out a form. Analyze the context and provide relevant suggestions.`,
};

export class FormAIService {
  private openai: OpenAI;
  private config: FormAgentConfig;

  constructor(config: FormAgentConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: config.mode === 'client',
    });
  }

  /**
   * Generate suggestions based on current form state
   */
  async generateSuggestions(
    schema: FormSchema,
    currentValues: Record<string, any>,
    focusedField: string
  ): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    
    // Build context from filled fields
    const filledFields = Object.entries(currentValues)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const focusedFieldSchema = schema.fields.find(f => f.name === focusedField);
    if (!focusedFieldSchema) return suggestions;

    // Find fields that depend on the focused field
    const dependentFields = schema.fields.filter(
      f => f.dependsOn?.includes(focusedField)
    );

    const systemPrompt = `${CATEGORY_PROMPTS[schema.category]}

Form: ${schema.name}
${schema.description ? `Description: ${schema.description}` : ''}
${schema.contextPrompt ? `Context: ${schema.contextPrompt}` : ''}

Current form values:
${filledFields || '(empty)'}

User is currently editing: ${focusedField}
Field type: ${focusedFieldSchema.type}
${focusedFieldSchema.aiPrompt ? `Custom instructions: ${focusedFieldSchema.aiPrompt}` : ''}

Dependent fields that may need suggestions: ${dependentFields.map(f => f.name).join(', ') || 'none'}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Based on the current form state, provide suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "auto-fill" | "command" | "validation" | "smart-default",
      "targetField": "field_name",
      "content": "suggested content",
      "confidence": 0.0-1.0,
      "reasoning": "why this suggestion",
      "alternatives": ["alt1", "alt2"]
    }
  ]
}

Provide up to ${this.config.maxSuggestions} most relevant suggestions.
Focus on:
${this.config.enableAutoFill ? '- Auto-fill suggestions for related fields' : ''}
${this.config.enableCommands ? '- Useful commands (make formal, add emojis, expand, shorten)' : ''}
${this.config.enableValidation ? '- Validation hints if content seems incomplete' : ''}
${this.config.enableSmartDefaults ? '- Smart defaults based on context' : ''}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return (result.suggestions || []).map((s: any, i: number) => ({
        id: `suggestion-${Date.now()}-${i}`,
        ...s,
      }));
    } catch (error) {
      console.error('AI suggestion error:', error);
      return [];
    }
  }

  /**
   * Execute an AI command on field content
   */
  async executeCommand(
    command: AICommand,
    currentValue: string,
    schema: FormSchema
  ): Promise<string> {
    const commandPrompts: Record<string, string> = {
      'make-formal': 'Rewrite this in a formal, professional tone:',
      'make-casual': 'Rewrite this in a casual, friendly tone:',
      'add-emojis': 'Add appropriate emojis to enhance this text:',
      'remove-emojis': 'Remove all emojis from this text:',
      'expand': 'Expand this text with more details:',
      'shorten': 'Shorten this text while keeping key information:',
      'fix-grammar': 'Fix any grammar or spelling errors:',
      'translate': `Translate to ${command.params?.language || 'English'}:`,
      'generate-tags': 'Generate relevant tags/keywords for:',
      'generate-description': 'Generate a compelling description based on:',
    };

    const prompt = commandPrompts[command.name] || command.description;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are helping with a ${schema.category} form. ${CATEGORY_PROMPTS[schema.category]}` 
          },
          { role: 'user', content: `${prompt}\n\n${currentValue}` }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content || currentValue;
    } catch (error) {
      console.error('Command execution error:', error);
      return currentValue;
    }
  }

  /**
   * Auto-detect form schema from DOM
   */
  async detectFormSchema(formElement: HTMLFormElement): Promise<FormSchema> {
    const fields: any[] = [];
    const inputs = formElement.querySelectorAll('input, textarea, select');

    inputs.forEach((input: any) => {
      const name = input.name || input.id;
      if (!name) return;

      fields.push({
        name,
        type: input.type || input.tagName.toLowerCase(),
        label: this.findLabel(input) || name,
        placeholder: input.placeholder,
        required: input.required,
        options: input.tagName === 'SELECT' 
          ? Array.from(input.options).map((o: any) => o.value)
          : undefined,
      });
    });

    // Use AI to detect category and add context
    const fieldNames = fields.map(f => f.name).join(', ');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Analyze these form fields and determine the form category and any field dependencies:
Fields: ${fieldNames}

Return JSON:
{
  "category": "event|product|blog|profile|listing|support|feedback|custom",
  "name": "Form name",
  "description": "What this form is for",
  "fieldRelationships": [
    { "field": "description", "dependsOn": ["title"] }
  ]
}`
          }
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Apply dependencies
      analysis.fieldRelationships?.forEach((rel: any) => {
        const field = fields.find(f => f.name === rel.field);
        if (field) {
          field.dependsOn = rel.dependsOn;
        }
      });

      return {
        id: `form-${Date.now()}`,
        name: analysis.name || 'Detected Form',
        description: analysis.description,
        category: analysis.category || 'custom',
        fields,
      };
    } catch {
      return {
        id: `form-${Date.now()}`,
        name: 'Detected Form',
        category: 'custom',
        fields,
      };
    }
  }

  private findLabel(input: HTMLElement): string | null {
    // Try aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try associated label
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || null;
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim() || null;

    return null;
  }
}

// Singleton for client-side usage
let serviceInstance: FormAIService | null = null;

export function getFormAIService(config: FormAgentConfig): FormAIService {
  if (!serviceInstance) {
    serviceInstance = new FormAIService(config);
  }
  return serviceInstance;
}
```

### Phase 4: Form Agent Hook

```typescript
// hooks/use-form-agent.ts

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FormAgentConfig, 
  FormAgentState, 
  FormAgentActions,
  FormSchema,
  AISuggestion,
  AICommand,
} from '@/types/form-agent';
import { FormAIService, getFormAIService } from '@/services/form-ai-service';

const DEFAULT_CONFIG: FormAgentConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  triggerMode: 'all',
  debounceMs: 300,
  maxSuggestions: 3,
  mode: 'client',
  enableAutoFill: true,
  enableCommands: true,
  enableValidation: true,
  enableSmartDefaults: true,
};

export function useFormAgent(
  initialConfig?: Partial<FormAgentConfig>,
  initialSchema?: FormSchema
): FormAgentState & FormAgentActions {
  const config = { ...DEFAULT_CONFIG, ...initialConfig };
  const serviceRef = useRef<FormAIService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<FormAgentState>({
    isProcessing: false,
    suggestions: [],
    error: null,
    lastFieldUpdated: null,
    formValues: {},
    schema: initialSchema || null,
  });

  // Initialize service
  useEffect(() => {
    serviceRef.current = getFormAIService(config);
  }, []);

  // Update field value
  const updateField = useCallback((field: string, value: any) => {
    setState(prev => ({
      ...prev,
      formValues: { ...prev.formValues, [field]: value },
      lastFieldUpdated: field,
    }));

    // Trigger suggestions based on mode
    if (config.triggerMode === 'debounce' || config.triggerMode === 'all') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        getSuggestionsInternal(field);
      }, config.debounceMs);
    }
  }, [config.triggerMode, config.debounceMs]);

  // Get suggestions for a field
  const getSuggestionsInternal = useCallback(async (field: string) => {
    if (!serviceRef.current || !state.schema) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const suggestions = await serviceRef.current.generateSuggestions(
        state.schema,
        state.formValues,
        field
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        suggestions,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
      }));
    }
  }, [state.schema, state.formValues]);

  const getSuggestions = useCallback(async (field: string) => {
    await getSuggestionsInternal(field);
  }, [getSuggestionsInternal]);

  // Apply a suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    setState(prev => ({
      ...prev,
      formValues: {
        ...prev.formValues,
        [suggestion.targetField]: suggestion.content,
      },
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id),
    }));
  }, []);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
    }));
  }, []);

  // Execute AI command
  const executeCommand = useCallback(async (
    command: AICommand, 
    field: string
  ): Promise<string> => {
    if (!serviceRef.current || !state.schema) return state.formValues[field];

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await serviceRef.current.executeCommand(
        command,
        state.formValues[field] || '',
        state.schema
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        formValues: { ...prev.formValues, [field]: result },
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      return state.formValues[field];
    }
  }, [state.schema, state.formValues]);

  // Set schema
  const setSchema = useCallback((schema: FormSchema) => {
    setState(prev => ({ ...prev, schema }));
  }, []);

  // Auto-detect schema from form element
  const autoDetectSchema = useCallback(async (): Promise<FormSchema> => {
    if (!serviceRef.current) throw new Error('Service not initialized');

    const form = document.querySelector('form');
    if (!form) throw new Error('No form found');

    const schema = await serviceRef.current.detectFormSchema(form as HTMLFormElement);
    setState(prev => ({ ...prev, schema }));
    return schema;
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  // Reset everything
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      suggestions: [],
      error: null,
      lastFieldUpdated: null,
      formValues: {},
      schema: initialSchema || null,
    });
  }, [initialSchema]);

  // Handle blur trigger
  const handleBlur = useCallback((field: string) => {
    if (config.triggerMode === 'blur' || config.triggerMode === 'all') {
      getSuggestionsInternal(field);
    }
  }, [config.triggerMode, getSuggestionsInternal]);

  // Handle manual trigger (Ctrl+Space)
  useEffect(() => {
    if (config.triggerMode !== 'manual' && config.triggerMode !== 'all') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        const activeElement = document.activeElement as HTMLInputElement;
        if (activeElement?.name || activeElement?.id) {
          getSuggestionsInternal(activeElement.name || activeElement.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.triggerMode, getSuggestionsInternal]);

  return {
    ...state,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    setSchema,
    autoDetectSchema,
    clearSuggestions,
    reset,
  };
}
```

### Phase 5: Suggestion Components

```typescript
// components/form-agent/SuggestionPopover.tsx

'use client';

import { AISuggestion, AICommand } from '@/types/form-agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Sparkles, 
  Check, 
  X, 
  Wand2,
  AlertCircle,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionPopoverProps {
  suggestions: AISuggestion[];
  isProcessing: boolean;
  onApply: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
  children: React.ReactNode;
}

const TYPE_ICONS = {
  'auto-fill': Zap,
  'command': Wand2,
  'validation': AlertCircle,
  'smart-default': Lightbulb,
};

const TYPE_COLORS = {
  'auto-fill': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'command': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'validation': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'smart-default': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function SuggestionPopover({
  suggestions,
  isProcessing,
  onApply,
  onDismiss,
  children,
}: SuggestionPopoverProps) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <Popover open={hasSuggestions || isProcessing}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        side="bottom" 
        align="start"
        sideOffset={4}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 p-4">
            <Sparkles className="w-4 h-4 animate-pulse text-primary" />
            <span className="text-sm text-muted-foreground">
              AI is thinking...
            </span>
          </div>
        ) : (
          <div className="divide-y">
            {suggestions.map((suggestion) => {
              const Icon = TYPE_ICONS[suggestion.type];
              
              return (
                <div key={suggestion.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      TYPE_COLORS[suggestion.type]
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.targetField}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <p className="text-sm line-clamp-2">
                        {suggestion.content}
                      </p>
                      
                      {suggestion.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.reasoning}
                        </p>
                      )}
                      
                      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {suggestion.alternatives.slice(0, 2).map((alt, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="text-[10px] cursor-pointer hover:bg-secondary/80"
                              onClick={() => onApply({
                                ...suggestion,
                                content: alt,
                              })}
                            >
                              {alt.slice(0, 20)}...
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onApply(suggestion)}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onDismiss(suggestion.id)}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

```typescript
// components/form-agent/CommandPalette.tsx

'use client';

import { useState } from 'react';
import { AICommand } from '@/types/form-agent';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Wand2, 
  Languages, 
  Expand, 
  Minimize2,
  Sparkles,
  Hash,
  FileText,
  Smile,
  Type,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand: (command: AICommand) => void;
  currentField: string;
}

const AVAILABLE_COMMANDS: (AICommand & { icon: any })[] = [
  {
    name: 'make-formal',
    description: 'Rewrite in formal, professional tone',
    action: 'transform',
    icon: Type,
  },
  {
    name: 'make-casual',
    description: 'Rewrite in casual, friendly tone',
    action: 'transform',
    icon: Smile,
  },
  {
    name: 'expand',
    description: 'Expand with more details',
    action: 'enhance',
    icon: Expand,
  },
  {
    name: 'shorten',
    description: 'Shorten while keeping key info',
    action: 'transform',
    icon: Minimize2,
  },
  {
    name: 'fix-grammar',
    description: 'Fix grammar and spelling errors',
    action: 'transform',
    icon: Wand2,
  },
  {
    name: 'add-emojis',
    description: 'Add appropriate emojis',
    action: 'enhance',
    icon: Sparkles,
  },
  {
    name: 'generate-tags',
    description: 'Generate relevant tags/keywords',
    action: 'generate',
    icon: Hash,
  },
  {
    name: 'generate-description',
    description: 'Generate description from title',
    action: 'generate',
    icon: FileText,
  },
  {
    name: 'translate',
    description: 'Translate to another language',
    action: 'translate',
    icon: Languages,
  },
];

export function CommandPalette({
  open,
  onOpenChange,
  onSelectCommand,
  currentField,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder={`AI commands for "${currentField}"...`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Transform">
          {AVAILABLE_COMMANDS.filter(c => c.action === 'transform').map((cmd) => (
            <CommandItem
              key={cmd.name}
              onSelect={() => {
                onSelectCommand(cmd);
                onOpenChange(false);
              }}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <div>
                <p className="font-medium">{cmd.name.replace(/-/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {cmd.description}
                </p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Generate">
          {AVAILABLE_COMMANDS.filter(c => c.action === 'generate' || c.action === 'enhance').map((cmd) => (
            <CommandItem
              key={cmd.name}
              onSelect={() => {
                onSelectCommand(cmd);
                onOpenChange(false);
              }}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <div>
                <p className="font-medium">{cmd.name.replace(/-/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {cmd.description}
                </p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

```typescript
// components/form-agent/AIFormField.tsx

'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SuggestionPopover } from './SuggestionPopover';
import { CommandPalette } from './CommandPalette';
import { AISuggestion, AICommand, FieldSchema } from '@/types/form-agent';
import { Wand2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFormFieldProps {
  field: FieldSchema;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suggestions: AISuggestion[];
  isProcessing: boolean;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onExecuteCommand: (command: AICommand) => void;
  className?: string;
}

export const AIFormField = forwardRef<HTMLInputElement, AIFormFieldProps>(({
  field,
  value,
  onChange,
  onBlur,
  suggestions,
  isProcessing,
  onApplySuggestion,
  onDismissSuggestion,
  onExecuteCommand,
  className,
}, ref) => {
  const [commandOpen, setCommandOpen] = useState(false);
  
  const fieldSuggestions = suggestions.filter(
    s => s.targetField === field.name
  );
  const hasSuggestions = fieldSuggestions.length > 0 || isProcessing;

  const InputComponent = field.type === 'textarea' ? Textarea : Input;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        <div className="flex items-center gap-1">
          {hasSuggestions && (
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCommandOpen(true)}
          >
            <Wand2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <SuggestionPopover
        suggestions={fieldSuggestions}
        isProcessing={isProcessing}
        onApply={onApplySuggestion}
        onDismiss={onDismissSuggestion}
      >
        <div className="relative">
          <InputComponent
            ref={ref as any}
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            required={field.required}
            className={cn(
              hasSuggestions && "ring-2 ring-primary/20"
            )}
          />
        </div>
      </SuggestionPopover>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectCommand={onExecuteCommand}
        currentField={field.label}
      />
    </div>
  );
});

AIFormField.displayName = 'AIFormField';
```

### Phase 6: Complete Form Example

```typescript
// components/form-agent/AIForm.tsx

'use client';

import { useFormAgent } from '@/hooks/use-form-agent';
import { AIFormField } from './AIFormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSchema } from '@/types/form-agent';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIFormProps {
  schema: FormSchema;
  onSubmit: (values: Record<string, any>) => void;
}

export function AIForm({ schema, onSubmit }: AIFormProps) {
  const {
    formValues,
    suggestions,
    isProcessing,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
  } = useFormAgent({}, schema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {schema.name}
        </CardTitle>
        {schema.description && (
          <p className="text-sm text-muted-foreground">
            {schema.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field) => (
            <AIFormField
              key={field.name}
              field={field}
              value={formValues[field.name] || ''}
              onChange={(value) => updateField(field.name, value)}
              onBlur={() => getSuggestions(field.name)}
              suggestions={suggestions}
              isProcessing={isProcessing}
              onApplySuggestion={applySuggestion}
              onDismissSuggestion={dismissSuggestion}
              onExecuteCommand={(cmd) => executeCommand(cmd, field.name)}
            />
          ))}
          
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Space for AI suggestions
            </p>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Usage Examples

### Event Form

```typescript
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
      dependsOn: ['title'],
      aiPrompt: 'Generate engaging description with date, location, and highlights'
    },
    { name: 'date', type: 'date', label: 'Event Date', required: true },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      options: ['Conference', 'Workshop', 'Meetup', 'Webinar'],
      dependsOn: ['title', 'description']
    },
    { 
      name: 'tags', 
      type: 'text', 
      label: 'Tags',
      dependsOn: ['title', 'description', 'category']
    },
  ],
};

// Usage
<AIForm schema={eventSchema} onSubmit={handleSubmit} />
```

### Product Form

```typescript
const productSchema: FormSchema = {
  id: 'product-form',
  name: 'Add Product',
  category: 'product',
  fields: [
    { name: 'name', type: 'text', label: 'Product Name', required: true },
    { 
      name: 'description', 
      type: 'textarea', 
      label: 'Description',
      dependsOn: ['name'],
    },
    { name: 'price', type: 'number', label: 'Price', required: true },
    { 
      name: 'category', 
      type: 'select', 
      label: 'Category',
      options: ['Electronics', 'Clothing', 'Home', 'Sports'],
    },
    { 
      name: 'keywords', 
      type: 'text', 
      label: 'SEO Keywords',
      dependsOn: ['name', 'description'],
    },
  ],
};
```

## Server-Side API Route (Optional)

```typescript
// app/api/form-agent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { schema, values, field, action } = await req.json();
    
    // Process based on action type
    // ... similar to client-side logic
    
    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
```

## Best Practices

1. **API Key Security**: Never expose API key in client code for production
2. **Rate Limiting**: Implement rate limiting to control AI API costs
3. **Caching**: Cache common suggestions to reduce API calls
4. **Fallbacks**: Always provide manual input as fallback
5. **Privacy**: Consider GDPR/privacy when sending form data to AI
6. **Loading States**: Show clear loading indicators during AI processing
7. **Error Handling**: Gracefully handle AI failures

## Files Reference

- `references/form-schemas.md` - Pre-built schemas for common forms
- `references/commands-list.md` - All available AI commands
- `references/integration-guide.md` - Integration with various form libraries
- `assets/form-agent-types.ts` - Complete TypeScript types
- `assets/form-ai-service.ts` - AI service implementation
- `assets/use-form-agent.ts` - React hook
- `assets/suggestion-components.tsx` - UI components
