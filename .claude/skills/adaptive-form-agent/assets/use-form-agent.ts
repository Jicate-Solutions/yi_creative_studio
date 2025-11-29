// hooks/use-form-agent.ts
// Main React hook for the Adaptive AI Form Agent

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  FormAgentConfig, 
  FormAgentState, 
  FormAgentHook,
  FormSchema,
  AISuggestion,
  AICommand,
  FieldSchema,
  DEFAULT_CONFIG,
} from '@/types/form-agent';
import { FormAIService, getFormAIService } from '@/services/form-ai-service';

interface UseFormAgentOptions {
  config?: Partial<FormAgentConfig>;
  schema?: FormSchema;
  initialValues?: Record<string, any>;
  onSuggestionApplied?: (suggestion: AISuggestion, field: string) => void;
  onCommandExecuted?: (command: AICommand, field: string, result: string) => void;
  onValuesChange?: (values: Record<string, any>) => void;
}

export function useFormAgent(options: UseFormAgentOptions = {}): FormAgentHook {
  const {
    config: configOverrides,
    schema: initialSchema,
    initialValues = {},
    onSuggestionApplied,
    onCommandExecuted,
    onValuesChange,
  } = options;

  // Merge config with defaults
  const config = useMemo<FormAgentConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...configOverrides,
    provider: {
      ...DEFAULT_CONFIG.provider,
      ...configOverrides?.provider,
    },
  }), [configOverrides]);

  // Service reference
  const serviceRef = useRef<FormAIService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  // State
  const [state, setState] = useState<FormAgentState>({
    isProcessing: false,
    processingField: null,
    suggestions: [],
    appliedSuggestions: [],
    dismissedSuggestions: [],
    error: null,
    lastFieldUpdated: null,
    formValues: initialValues,
    schema: initialSchema || null,
    isInitialized: false,
  });

  // Initialize service
  useEffect(() => {
    serviceRef.current = getFormAIService(config);
    setState(prev => ({ ...prev, isInitialized: true }));
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [config]);

  // Notify on values change
  useEffect(() => {
    onValuesChange?.(state.formValues);
  }, [state.formValues, onValuesChange]);

  // Internal suggestion fetcher
  const fetchSuggestions = useCallback(async (field: string): Promise<AISuggestion[]> => {
    if (!serviceRef.current || !state.schema) {
      return [];
    }

    // Prevent duplicate fetches
    const fetchKey = `${field}-${JSON.stringify(state.formValues)}`;
    if (lastFetchRef.current === fetchKey) {
      return state.suggestions.filter(s => s.targetField === field);
    }
    lastFetchRef.current = fetchKey;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      processingField: field,
      error: null,
    }));

    try {
      const suggestions = await serviceRef.current.generateSuggestions(
        state.schema,
        state.formValues,
        field
      );

      // Filter out dismissed suggestions
      const filteredSuggestions = suggestions.filter(
        s => !state.dismissedSuggestions.includes(s.id)
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingField: null,
        suggestions: [
          ...prev.suggestions.filter(s => s.targetField !== field),
          ...filteredSuggestions,
        ],
      }));

      // Auto-apply high confidence suggestions if enabled
      if (config.autoApplyHighConfidence) {
        filteredSuggestions
          .filter(s => s.confidence >= config.highConfidenceThreshold && s.type === 'auto-fill')
          .forEach(s => applySuggestion(s));
      }

      // Notify callback
      filteredSuggestions.forEach(s => config.onSuggestion?.(s));

      return filteredSuggestions;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingField: null,
        error: error.message || 'Failed to get suggestions',
      }));
      config.onError?.(error);
      return [];
    }
  }, [state.schema, state.formValues, state.dismissedSuggestions, config]);

  // Update single field
  const updateField = useCallback((field: string, value: any) => {
    setState(prev => ({
      ...prev,
      formValues: { ...prev.formValues, [field]: value },
      lastFieldUpdated: field,
    }));

    // Trigger suggestions based on mode
    if (config.triggerMode === 'debounce' || config.triggerMode === 'all') {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(field);
      }, config.debounceMs);
    }
  }, [config.triggerMode, config.debounceMs, fetchSuggestions]);

  // Update multiple fields
  const updateFields = useCallback((values: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      formValues: { ...prev.formValues, ...values },
      lastFieldUpdated: Object.keys(values)[0] || null,
    }));
  }, []);

  // Get suggestions for a specific field
  const getSuggestions = useCallback(async (field: string): Promise<AISuggestion[]> => {
    return fetchSuggestions(field);
  }, [fetchSuggestions]);

  // Get suggestions for all empty fields
  const getSuggestionsForAll = useCallback(async () => {
    if (!state.schema) return;

    const emptyFields = state.schema.fields.filter(
      f => !state.formValues[f.name] && f.aiEnabled !== false
    );

    for (const field of emptyFields.slice(0, 3)) { // Limit to first 3
      await fetchSuggestions(field.name);
    }
  }, [state.schema, state.formValues, fetchSuggestions]);

  // Apply a suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    setState(prev => ({
      ...prev,
      formValues: {
        ...prev.formValues,
        [suggestion.targetField]: suggestion.content,
      },
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id),
      appliedSuggestions: [...prev.appliedSuggestions, suggestion.id],
    }));

    onSuggestionApplied?.(suggestion, suggestion.targetField);
  }, [onSuggestionApplied]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      dismissedSuggestions: [...prev.dismissedSuggestions, suggestionId],
    }));
  }, []);

  // Execute AI command
  const executeCommand = useCallback(async (
    command: AICommand, 
    field: string
  ): Promise<string> => {
    if (!serviceRef.current || !state.schema) {
      return state.formValues[field] || '';
    }

    const fieldSchema = state.schema.fields.find(f => f.name === field);
    
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      processingField: field,
    }));

    try {
      const result = await serviceRef.current.executeCommand(
        command,
        state.formValues[field] || '',
        state.schema,
        fieldSchema
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingField: null,
        formValues: { ...prev.formValues, [field]: result },
      }));

      onCommandExecuted?.(command, field, result);
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        processingField: null,
        error: error.message,
      }));
      return state.formValues[field] || '';
    }
  }, [state.schema, state.formValues, onCommandExecuted]);

  // Get available commands for a field
  const getAvailableCommands = useCallback((field: string): AICommand[] => {
    if (!serviceRef.current || !state.schema) return [];
    
    const fieldSchema = state.schema.fields.find(f => f.name === field);
    if (!fieldSchema) return [];

    return serviceRef.current.getAvailableCommands(fieldSchema);
  }, [state.schema]);

  // Set schema
  const setSchema = useCallback((schema: FormSchema) => {
    setState(prev => ({ 
      ...prev, 
      schema,
      suggestions: [], // Clear suggestions when schema changes
    }));
  }, []);

  // Auto-detect schema from DOM
  const autoDetectSchema = useCallback(async (
    formElement?: HTMLFormElement
  ): Promise<FormSchema> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    const form = formElement || document.querySelector('form');
    if (!form) {
      throw new Error('No form found in document');
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const schema = await serviceRef.current.detectFormSchema(form as HTMLFormElement);
      setState(prev => ({ 
        ...prev, 
        schema, 
        isProcessing: false,
      }));
      return schema;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  // Validate schema
  const validateSchema = useCallback((): boolean => {
    if (!state.schema) return false;
    return state.schema.fields.length > 0 && !!state.schema.category;
  }, [state.schema]);

  // Validate single field
  const validateField = useCallback(async (field: string): Promise<string | null> => {
    if (!serviceRef.current || !state.schema) return null;

    const fieldSchema = state.schema.fields.find(f => f.name === field);
    if (!fieldSchema) return null;

    return serviceRef.current.validateField(
      fieldSchema,
      state.formValues[field],
      state.schema
    );
  }, [state.schema, state.formValues]);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<Record<string, string>> => {
    if (!state.schema) return {};

    const errors: Record<string, string> = {};

    for (const field of state.schema.fields) {
      const error = await validateField(field.name);
      if (error) {
        errors[field.name] = error;
      }
    }

    return errors;
  }, [state.schema, validateField]);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  // Clear suggestions for specific field
  const clearFieldSuggestions = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.targetField !== field),
    }));
  }, []);

  // Reset everything
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      processingField: null,
      suggestions: [],
      appliedSuggestions: [],
      dismissedSuggestions: [],
      error: null,
      lastFieldUpdated: null,
      formValues: initialValues,
      schema: initialSchema || null,
      isInitialized: true,
    });
    lastFetchRef.current = null;
  }, [initialValues, initialSchema]);

  // Get field value
  const getFieldValue = useCallback((field: string): any => {
    return state.formValues[field];
  }, [state.formValues]);

  // Set field value (alias for updateField)
  const setFieldValue = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  // Handle blur trigger
  useEffect(() => {
    if (config.triggerMode !== 'blur' && config.triggerMode !== 'all') return;

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target?.matches('input, textarea, select')) {
        const name = (target as HTMLInputElement).name || target.id;
        if (name && state.formValues[name]) {
          fetchSuggestions(name);
        }
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, [config.triggerMode, state.formValues, fetchSuggestions]);

  // Handle manual trigger (Ctrl+Space)
  useEffect(() => {
    if (config.triggerMode !== 'manual' && config.triggerMode !== 'all') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        const activeElement = document.activeElement as HTMLInputElement;
        const name = activeElement?.name || activeElement?.id;
        if (name) {
          fetchSuggestions(name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.triggerMode, fetchSuggestions]);

  return {
    // State
    ...state,
    
    // Actions
    updateField,
    updateFields,
    getSuggestions,
    getSuggestionsForAll,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    getAvailableCommands,
    setSchema,
    autoDetectSchema,
    validateSchema,
    validateField,
    validateForm,
    clearSuggestions,
    clearFieldSuggestions,
    reset,
    getFieldValue,
    setFieldValue,
  };
}

// Re-export types for convenience
export type { FormAgentHook, FormAgentConfig, FormSchema, AISuggestion, AICommand };
