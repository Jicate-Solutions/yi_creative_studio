// services/form-ai-service.ts
// AI Service Layer for Form Agent - Supports multiple providers

import OpenAI from 'openai';
import { 
  FormSchema, 
  AISuggestion, 
  FormAgentConfig,
  AICommand,
  FormCategory,
  FieldSchema,
  CATEGORY_PROMPTS,
  DEFAULT_COMMANDS,
} from '@/types/form-agent';

export class FormAIService {
  private openai: OpenAI | null = null;
  private config: FormAgentConfig;

  constructor(config: FormAgentConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider() {
    const { provider } = this.config;
    
    switch (provider.name) {
      case 'openai':
        this.openai = new OpenAI({
          apiKey: provider.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
          dangerouslyAllowBrowser: this.config.mode === 'client',
          baseURL: provider.baseUrl,
        });
        break;
      // Add other providers here
      case 'anthropic':
      case 'gemini':
      case 'custom':
        console.warn(`Provider ${provider.name} not yet implemented, falling back to OpenAI`);
        break;
    }
  }

  /**
   * Generate suggestions based on current form state
   */
  async generateSuggestions(
    schema: FormSchema,
    currentValues: Record<string, any>,
    focusedField: string
  ): Promise<AISuggestion[]> {
    if (!this.openai) {
      throw new Error('AI provider not initialized');
    }

    const focusedFieldSchema = schema.fields.find(f => f.name === focusedField);
    if (!focusedFieldSchema || focusedFieldSchema.aiEnabled === false) {
      return [];
    }

    // Build context from filled fields
    const filledFields = Object.entries(currentValues)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        const field = schema.fields.find(f => f.name === k);
        return `${field?.label || k}: ${v}`;
      })
      .join('\n');

    // Find fields that depend on the focused field
    const dependentFields = schema.fields.filter(
      f => f.dependsOn?.includes(focusedField) && !currentValues[f.name]
    );

    // Find unfilled required fields
    const unfilledRequired = schema.fields.filter(
      f => f.required && !currentValues[f.name]
    );

    const systemPrompt = this.buildSystemPrompt(schema, focusedFieldSchema, {
      filledFields,
      dependentFields,
      unfilledRequired,
    });

    const userPrompt = this.buildUserPrompt(focusedField, currentValues[focusedField], {
      dependentFields,
      unfilledRequired,
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.provider.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: this.config.provider.temperature || 0.7,
        max_tokens: this.config.provider.maxTokens || 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return (result.suggestions || []).map((s: any, i: number) => ({
        id: `suggestion-${Date.now()}-${i}`,
        timestamp: Date.now(),
        ...s,
      }));
    } catch (error) {
      console.error('AI suggestion error:', error);
      this.config.onError?.(error as Error);
      return [];
    }
  }

  private buildSystemPrompt(
    schema: FormSchema,
    focusedField: FieldSchema,
    context: {
      filledFields: string;
      dependentFields: FieldSchema[];
      unfilledRequired: FieldSchema[];
    }
  ): string {
    const categoryPrompt = CATEGORY_PROMPTS[schema.category] || CATEGORY_PROMPTS.custom;
    const tone = this.config.tone || 'professional';
    const language = this.config.language || 'English';

    return `${categoryPrompt}

FORM CONTEXT:
- Form: ${schema.name}
${schema.description ? `- Description: ${schema.description}` : ''}
${schema.contextPrompt ? `- Additional Context: ${schema.contextPrompt}` : ''}
${this.config.customPrompt ? `- Custom Instructions: ${this.config.customPrompt}` : ''}

CURRENT STATE:
${context.filledFields || '(No fields filled yet)'}

FOCUSED FIELD:
- Name: ${focusedField.name}
- Label: ${focusedField.label}
- Type: ${focusedField.type}
${focusedField.placeholder ? `- Placeholder: ${focusedField.placeholder}` : ''}
${focusedField.aiPrompt ? `- Field-specific instructions: ${focusedField.aiPrompt}` : ''}
${focusedField.validation ? `- Validation: ${JSON.stringify(focusedField.validation)}` : ''}

DEPENDENT FIELDS (need suggestions when this field is filled):
${context.dependentFields.map(f => `- ${f.label} (${f.name})`).join('\n') || 'None'}

UNFILLED REQUIRED FIELDS:
${context.unfilledRequired.map(f => `- ${f.label} (${f.name})`).join('\n') || 'All required fields filled'}

INSTRUCTIONS:
- Respond in ${language}
- Use a ${tone} tone
- Provide actionable, specific suggestions
- Consider field relationships and dependencies
- Confidence should reflect how certain you are (0.0-1.0)`;
  }

  private buildUserPrompt(
    focusedField: string,
    currentValue: any,
    context: {
      dependentFields: FieldSchema[];
      unfilledRequired: FieldSchema[];
    }
  ): string {
    const features = [];
    if (this.config.enableAutoFill) features.push('auto-fill suggestions for related/dependent fields');
    if (this.config.enableCommands) features.push('useful AI commands (make formal, expand, shorten, etc.)');
    if (this.config.enableValidation) features.push('validation hints if content seems incomplete or has issues');
    if (this.config.enableSmartDefaults) features.push('smart default values based on context');

    return `The user is editing the "${focusedField}" field.
Current value: ${currentValue || '(empty)'}

Based on this, provide suggestions in this exact JSON format:
{
  "suggestions": [
    {
      "type": "auto-fill" | "command" | "validation" | "smart-default",
      "targetField": "field_name",
      "content": "suggested content or message",
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation why this suggestion is helpful",
      "alternatives": ["alternative1", "alternative2"] // optional, max 2
    }
  ]
}

PROVIDE UP TO ${this.config.maxSuggestions} MOST RELEVANT SUGGESTIONS.

FOCUS ON:
${features.map(f => `- ${f}`).join('\n')}

${context.dependentFields.length > 0 ? `
PRIORITY: Generate auto-fill suggestions for these dependent fields:
${context.dependentFields.map(f => `- ${f.label} (${f.name}): ${f.aiPrompt || 'Generate appropriate content'}`).join('\n')}
` : ''}

${context.unfilledRequired.length > 0 ? `
NOTE: These required fields still need values:
${context.unfilledRequired.map(f => f.label).join(', ')}
` : ''}

Remember: Only suggest what's genuinely helpful. Quality over quantity.`;
  }

  /**
   * Execute an AI command on field content
   */
  async executeCommand(
    command: AICommand,
    currentValue: string,
    schema: FormSchema,
    fieldSchema?: FieldSchema
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('AI provider not initialized');
    }

    if (!currentValue?.trim()) {
      return currentValue;
    }

    const commandPrompts: Record<string, string> = {
      'make-formal': 'Rewrite this text in a formal, professional tone. Keep the meaning intact:',
      'make-casual': 'Rewrite this text in a casual, friendly tone. Keep the meaning intact:',
      'add-emojis': 'Add appropriate, tasteful emojis to enhance this text. Do not overdo it:',
      'remove-emojis': 'Remove all emojis from this text while keeping the message clear:',
      'expand': 'Expand this text with more relevant details and context. Make it more comprehensive:',
      'shorten': 'Shorten this text while preserving the key information. Be concise:',
      'fix-grammar': 'Fix any grammar, spelling, or punctuation errors in this text:',
      'summarize': 'Summarize this text in 1-2 sentences:',
      'bullet-points': 'Convert this text into clear bullet points:',
      'generate-tags': 'Generate 5-8 relevant tags/keywords (comma-separated) based on:',
      'generate-description': 'Generate a compelling description based on this title/name:',
    };

    let prompt = commandPrompts[command.name];
    
    if (!prompt) {
      prompt = command.description || `Process this text with the "${command.name}" command:`;
    }

    // Handle translation specially
    if (command.name === 'translate') {
      const targetLang = command.params?.language || 'English';
      prompt = `Translate this text to ${targetLang}. Preserve the tone and meaning:`;
    }

    const systemContext = `You are helping with a ${schema.category} form.
${CATEGORY_PROMPTS[schema.category]}
${fieldSchema?.aiPrompt ? `\nField-specific context: ${fieldSchema.aiPrompt}` : ''}

IMPORTANT: Return ONLY the processed text. No explanations, no quotes, no prefixes.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.provider.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: `${prompt}\n\n${currentValue}` },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const result = response.choices[0].message.content?.trim() || currentValue;
      
      // Notify callback
      this.config.onCommand?.(command, currentValue);
      
      return result;
    } catch (error) {
      console.error('Command execution error:', error);
      this.config.onError?.(error as Error);
      return currentValue;
    }
  }

  /**
   * Validate field content using AI
   */
  async validateField(
    fieldSchema: FieldSchema,
    value: any,
    formSchema: FormSchema
  ): Promise<string | null> {
    if (!this.openai || !this.config.enableValidation) {
      return null;
    }

    if (!value && !fieldSchema.required) {
      return null;
    }

    if (!value && fieldSchema.required) {
      return `${fieldSchema.label} is required`;
    }

    // Basic validations first
    if (fieldSchema.validation) {
      const { minLength, maxLength, min, max, pattern, patternMessage } = fieldSchema.validation;
      
      if (typeof value === 'string') {
        if (minLength && value.length < minLength) {
          return `${fieldSchema.label} must be at least ${minLength} characters`;
        }
        if (maxLength && value.length > maxLength) {
          return `${fieldSchema.label} must be no more than ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return patternMessage || `${fieldSchema.label} format is invalid`;
        }
      }
      
      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return `${fieldSchema.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          return `${fieldSchema.label} must be no more than ${max}`;
        }
      }
    }

    // AI-powered content validation for text fields
    if (fieldSchema.type === 'text' || fieldSchema.type === 'textarea') {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a content validator for a ${formSchema.category} form.
Analyze the field value and determine if it's appropriate and complete.
Only return an issue if there's a real problem. Be lenient for creative content.`,
            },
            {
              role: 'user',
              content: `Field: ${fieldSchema.label}
Type: ${fieldSchema.type}
Value: "${value}"
${fieldSchema.aiPrompt ? `Context: ${fieldSchema.aiPrompt}` : ''}

Is this content appropriate and complete for this field?
Return JSON: { "valid": true } or { "valid": false, "issue": "brief description" }`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 100,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.valid ? null : result.issue || null;
      } catch {
        return null; // Fail silently for validation
      }
    }

    return null;
  }

  /**
   * Auto-detect form schema from DOM
   */
  async detectFormSchema(formElement: HTMLFormElement): Promise<FormSchema> {
    const fields: FieldSchema[] = [];
    const inputs = formElement.querySelectorAll('input, textarea, select');

    inputs.forEach((input: Element) => {
      const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const name = el.name || el.id;
      if (!name) return;

      const type = this.mapInputType(el);
      const label = this.findLabel(el) || this.humanize(name);

      fields.push({
        name,
        type,
        label,
        placeholder: (el as HTMLInputElement).placeholder,
        required: el.required,
        options: el.tagName === 'SELECT' 
          ? Array.from((el as HTMLSelectElement).options).map(o => o.value).filter(Boolean)
          : undefined,
        aiEnabled: true,
      });
    });

    // Use AI to detect category and relationships
    if (!this.openai || fields.length === 0) {
      return {
        id: `form-${Date.now()}`,
        name: 'Detected Form',
        category: 'custom',
        fields,
      };
    }

    const fieldInfo = fields.map(f => `${f.name} (${f.type}): ${f.label}`).join('\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Analyze these form fields and determine the form purpose:

FIELDS:
${fieldInfo}

Return JSON:
{
  "category": "event|product|blog|profile|listing|support|feedback|poster|social|email|custom",
  "name": "Descriptive form name",
  "description": "What this form is for",
  "fieldRelationships": [
    { "field": "field_name", "dependsOn": ["other_field"] }
  ],
  "fieldPrompts": [
    { "field": "field_name", "aiPrompt": "specific instructions for this field" }
  ]
}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Apply relationships and prompts
      analysis.fieldRelationships?.forEach((rel: any) => {
        const field = fields.find(f => f.name === rel.field);
        if (field) field.dependsOn = rel.dependsOn;
      });

      analysis.fieldPrompts?.forEach((fp: any) => {
        const field = fields.find(f => f.name === fp.field);
        if (field) field.aiPrompt = fp.aiPrompt;
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

  /**
   * Get available commands for a field type
   */
  getAvailableCommands(fieldSchema: FieldSchema): AICommand[] {
    const textCommands = DEFAULT_COMMANDS.filter(c => 
      ['make-formal', 'make-casual', 'expand', 'shorten', 'fix-grammar', 'translate'].includes(c.name)
    );

    const enhanceCommands = DEFAULT_COMMANDS.filter(c =>
      ['add-emojis', 'remove-emojis', 'summarize', 'bullet-points'].includes(c.name)
    );

    const generateCommands = DEFAULT_COMMANDS.filter(c =>
      ['generate-tags', 'generate-description'].includes(c.name)
    );

    switch (fieldSchema.type) {
      case 'text':
        return [...textCommands, ...generateCommands.filter(c => c.name === 'generate-description')];
      case 'textarea':
      case 'rich-text':
        return [...textCommands, ...enhanceCommands, ...generateCommands];
      case 'tags':
        return generateCommands.filter(c => c.name === 'generate-tags');
      default:
        return [];
    }
  }

  private mapInputType(el: HTMLElement): FieldSchema['type'] {
    const tagName = el.tagName.toLowerCase();
    
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';
    
    const type = (el as HTMLInputElement).type?.toLowerCase();
    
    switch (type) {
      case 'email': return 'email';
      case 'url': return 'url';
      case 'number': return 'number';
      case 'date':
      case 'datetime':
      case 'datetime-local': return 'date';
      case 'color': return 'color';
      default: return 'text';
    }
  }

  private findLabel(input: HTMLElement): string | null {
    // Try aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try aria-labelledby
    const labelledBy = input.getAttribute('aria-labelledby');
    if (labelledBy) {
      const label = document.getElementById(labelledBy);
      if (label) return label.textContent?.trim() || null;
    }

    // Try associated label via for attribute
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || null;
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      // Get text content excluding the input itself
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('input, textarea, select').forEach(el => el.remove());
      return clone.textContent?.trim() || null;
    }

    // Try preceding sibling
    const prev = input.previousElementSibling;
    if (prev?.tagName === 'LABEL') {
      return prev.textContent?.trim() || null;
    }

    return null;
  }

  private humanize(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }
}

// Singleton management
let serviceInstance: FormAIService | null = null;

export function getFormAIService(config: FormAgentConfig): FormAIService {
  if (!serviceInstance || config !== serviceInstance['config']) {
    serviceInstance = new FormAIService(config);
  }
  return serviceInstance;
}

export function resetFormAIService(): void {
  serviceInstance = null;
}
