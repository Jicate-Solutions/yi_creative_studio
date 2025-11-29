# Integration Guide

How to integrate the Adaptive AI Form Agent with various form libraries and frameworks.

## Basic Setup

### 1. Install Dependencies

```bash
npm install openai zod
```

### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # For client-side (not recommended for production)
OPENAI_API_KEY=sk-...               # For server-side
```

### 3. Copy Files

Copy these files from the skill assets to your project:

```
types/form-agent.ts          <- assets/form-agent-types.ts
services/form-ai-service.ts  <- assets/form-ai-service.ts
hooks/use-form-agent.ts      <- assets/use-form-agent.ts
components/form-agent/       <- assets/suggestion-components.tsx
```

## Integration with React Hook Form

```typescript
// components/RHFAIForm.tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormAgent } from '@/hooks/use-form-agent';
import { AIFormField } from '@/components/form-agent';
import { FormSchema } from '@/types/form-agent';

// Convert FormSchema to Zod schema
function schemaToZod(schema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  schema.fields.forEach(field => {
    let validator: z.ZodTypeAny;
    
    switch (field.type) {
      case 'email':
        validator = z.string().email();
        break;
      case 'url':
        validator = z.string().url();
        break;
      case 'number':
        validator = z.number();
        break;
      default:
        validator = z.string();
    }
    
    if (!field.required) {
      validator = validator.optional();
    }
    
    shape[field.name] = validator;
  });
  
  return z.object(shape);
}

interface RHFAIFormProps {
  schema: FormSchema;
  onSubmit: (values: any) => void;
}

export function RHFAIForm({ schema, onSubmit }: RHFAIFormProps) {
  const zodSchema = schemaToZod(schema);
  
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  const {
    suggestions,
    isProcessing,
    processingField,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    getAvailableCommands,
  } = useFormAgent({ schema });

  // Sync RHF values with form agent
  const handleFieldChange = (name: string, value: any) => {
    form.setValue(name, value);
    updateField(name, value);
  };

  // Apply suggestion to both systems
  const handleApplySuggestion = (suggestion: any) => {
    form.setValue(suggestion.targetField, suggestion.content);
    applySuggestion(suggestion);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {schema.fields.map(field => (
        <Controller
          key={field.name}
          name={field.name}
          control={form.control}
          render={({ field: rhfField, fieldState }) => (
            <AIFormField
              field={field}
              value={rhfField.value || ''}
              onChange={(value) => handleFieldChange(field.name, value)}
              onBlur={() => {
                rhfField.onBlur();
                getSuggestions(field.name);
              }}
              suggestions={suggestions}
              isProcessing={isProcessing}
              processingField={processingField}
              onApplySuggestion={handleApplySuggestion}
              onDismissSuggestion={dismissSuggestion}
              onExecuteCommand={(cmd) => executeCommand(cmd, field.name)}
              availableCommands={getAvailableCommands(field.name)}
              error={fieldState.error?.message}
            />
          )}
        />
      ))}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Integration with Formik

```typescript
// components/FormikAIForm.tsx
'use client';

import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { useFormAgent } from '@/hooks/use-form-agent';
import { AIFormField } from '@/components/form-agent';
import { FormSchema } from '@/types/form-agent';

// Convert FormSchema to Yup schema
function schemaToYup(schema: FormSchema) {
  const shape: Record<string, any> = {};
  
  schema.fields.forEach(field => {
    let validator = Yup.string();
    
    if (field.type === 'email') {
      validator = validator.email('Invalid email');
    }
    if (field.type === 'url') {
      validator = validator.url('Invalid URL');
    }
    if (field.required) {
      validator = validator.required(`${field.label} is required`);
    }
    
    shape[field.name] = validator;
  });
  
  return Yup.object().shape(shape);
}

// Inner component to access Formik context
function FormikAIFields({ schema }: { schema: FormSchema }) {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  
  const {
    suggestions,
    isProcessing,
    processingField,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    getAvailableCommands,
  } = useFormAgent({ 
    schema,
    initialValues: values,
  });

  const handleFieldChange = (name: string, value: any) => {
    setFieldValue(name, value);
    updateField(name, value);
  };

  const handleApplySuggestion = (suggestion: any) => {
    setFieldValue(suggestion.targetField, suggestion.content);
    applySuggestion(suggestion);
  };

  return (
    <>
      {schema.fields.map(field => (
        <AIFormField
          key={field.name}
          field={field}
          value={values[field.name] || ''}
          onChange={(value) => handleFieldChange(field.name, value)}
          onBlur={() => getSuggestions(field.name)}
          suggestions={suggestions}
          isProcessing={isProcessing}
          processingField={processingField}
          onApplySuggestion={handleApplySuggestion}
          onDismissSuggestion={dismissSuggestion}
          onExecuteCommand={(cmd) => executeCommand(cmd, field.name)}
          availableCommands={getAvailableCommands(field.name)}
          error={touched[field.name] ? errors[field.name] as string : undefined}
        />
      ))}
    </>
  );
}

interface FormikAIFormProps {
  schema: FormSchema;
  onSubmit: (values: any) => void;
  initialValues?: Record<string, any>;
}

export function FormikAIForm({ schema, onSubmit, initialValues = {} }: FormikAIFormProps) {
  const validationSchema = schemaToYup(schema);
  
  const defaultInitialValues = schema.fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue || '';
    return acc;
  }, {} as Record<string, any>);

  return (
    <Formik
      initialValues={{ ...defaultInitialValues, ...initialValues }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <Form>
        <FormikAIFields schema={schema} />
        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
}
```

## Integration with Shadcn/ui Form

```typescript
// components/ShadcnAIForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFormAgent } from '@/hooks/use-form-agent';
import { SuggestionPopover, CommandPalette } from '@/components/form-agent';
import { FormSchema } from '@/types/form-agent';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ShadcnAIFormProps {
  schema: FormSchema;
  zodSchema: z.ZodObject<any>;
  onSubmit: (values: any) => void;
}

export function ShadcnAIForm({ schema, zodSchema, onSubmit }: ShadcnAIFormProps) {
  const [commandField, setCommandField] = useState<string | null>(null);
  
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  const {
    suggestions,
    isProcessing,
    processingField,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    getAvailableCommands,
  } = useFormAgent({ schema });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {schema.fields.map(field => {
          const fieldSuggestions = suggestions.filter(s => s.targetField === field.name);
          const isFieldProcessing = isProcessing && processingField === field.name;
          const commands = getAvailableCommands(field.name);
          
          return (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <div className="flex items-center gap-1">
                      {(fieldSuggestions.length > 0 || isFieldProcessing) && (
                        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      )}
                      {commands.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setCommandField(field.name)}
                          disabled={!formField.value}
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <SuggestionPopover
                    suggestions={fieldSuggestions}
                    isProcessing={isFieldProcessing}
                    onApply={(s) => {
                      form.setValue(s.targetField, s.content);
                      applySuggestion(s);
                    }}
                    onDismiss={dismissSuggestion}
                  >
                    <FormControl>
                      {field.type === 'textarea' ? (
                        <Textarea
                          {...formField}
                          placeholder={field.placeholder}
                          onChange={(e) => {
                            formField.onChange(e);
                            updateField(field.name, e.target.value);
                          }}
                          onBlur={() => {
                            formField.onBlur();
                            getSuggestions(field.name);
                          }}
                        />
                      ) : (
                        <Input
                          {...formField}
                          placeholder={field.placeholder}
                          onChange={(e) => {
                            formField.onChange(e);
                            updateField(field.name, e.target.value);
                          }}
                          onBlur={() => {
                            formField.onBlur();
                            getSuggestions(field.name);
                          }}
                        />
                      )}
                    </FormControl>
                  </SuggestionPopover>
                  
                  {field.helpText && <FormDescription>{field.helpText}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

        <Button type="submit" disabled={isProcessing}>
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit
        </Button>
      </form>

      <CommandPalette
        open={!!commandField}
        onOpenChange={(open) => !open && setCommandField(null)}
        onSelectCommand={async (cmd) => {
          if (commandField) {
            const result = await executeCommand(cmd, commandField);
            form.setValue(commandField, result);
          }
        }}
        commands={commandField ? getAvailableCommands(commandField) : []}
        currentField={commandField || ''}
        isProcessing={isProcessing}
      />
    </Form>
  );
}
```

## Server-Side Mode

For production, use server-side API calls to protect your API key:

### API Route

```typescript
// app/api/form-agent/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FormSchema } from '@/types/form-agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { schema, values, field } = await req.json() as {
      schema: FormSchema;
      values: Record<string, any>;
      field: string;
    };

    // Rate limiting check here...

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        // System and user prompts...
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return NextResponse.json({ suggestions: result.suggestions || [] });
  } catch (error) {
    console.error('Form agent error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
```

### Client Configuration

```typescript
const { ... } = useFormAgent({
  schema,
  config: {
    mode: 'server',
    apiEndpoint: '/api/form-agent/suggestions',
  },
});
```

## Auto-Detect Existing Forms

For forms you don't control, use auto-detection:

```typescript
'use client';

import { useEffect } from 'react';
import { useFormAgent } from '@/hooks/use-form-agent';

export function AIFormEnhancer() {
  const { autoDetectSchema, schema } = useFormAgent({});

  useEffect(() => {
    // Wait for form to render
    const timer = setTimeout(async () => {
      const form = document.querySelector('form');
      if (form) {
        await autoDetectSchema(form as HTMLFormElement);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Render suggestion UI overlay...
}
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Testing

```typescript
// __tests__/form-agent.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useFormAgent } from '@/hooks/use-form-agent';

describe('useFormAgent', () => {
  const mockSchema = {
    id: 'test',
    name: 'Test Form',
    category: 'custom' as const,
    fields: [
      { name: 'title', type: 'text' as const, label: 'Title', required: true },
    ],
  };

  it('initializes with schema', () => {
    const { result } = renderHook(() => useFormAgent({ schema: mockSchema }));
    expect(result.current.schema).toEqual(mockSchema);
  });

  it('updates field values', () => {
    const { result } = renderHook(() => useFormAgent({ schema: mockSchema }));
    
    act(() => {
      result.current.updateField('title', 'Test Title');
    });
    
    expect(result.current.formValues.title).toBe('Test Title');
  });
});
```
