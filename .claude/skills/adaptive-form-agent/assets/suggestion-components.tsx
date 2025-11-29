// components/form-agent/index.tsx
// Complete UI components for the Adaptive AI Form Agent

'use client';

import React, { forwardRef, useState, useCallback } from 'react';
import { AISuggestion, AICommand, FieldSchema, FormSchema } from '@/types/form-agent';
import { useFormAgent } from '@/hooks/use-form-agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sparkles, 
  Check, 
  X, 
  Wand2,
  AlertCircle,
  Lightbulb,
  Zap,
  Loader2,
  Type,
  Smile,
  Expand,
  Minimize2,
  Hash,
  FileText,
  Languages,
  List,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// SUGGESTION POPOVER
// ============================================================================

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'auto-fill': Zap,
  'command': Wand2,
  'validation': AlertCircle,
  'smart-default': Lightbulb,
};

const TYPE_COLORS: Record<string, string> = {
  'auto-fill': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'command': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'validation': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'smart-default': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

interface SuggestionPopoverProps {
  suggestions: AISuggestion[];
  isProcessing: boolean;
  onApply: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function SuggestionPopover({
  suggestions,
  isProcessing,
  onApply,
  onDismiss,
  children,
  align = 'start',
}: SuggestionPopoverProps) {
  const hasSuggestions = suggestions.length > 0;

  if (!hasSuggestions && !isProcessing) {
    return <>{children}</>;
  }

  return (
    <Popover open={hasSuggestions || isProcessing}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        side="bottom" 
        align={align}
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 p-4">
            <Sparkles className="w-4 h-4 animate-pulse text-primary" />
            <span className="text-sm text-muted-foreground">
              AI is thinking...
            </span>
          </div>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {suggestions.map((suggestion) => {
              const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;
              
              return (
                <div key={suggestion.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md shrink-0",
                      TYPE_COLORS[suggestion.type] || TYPE_COLORS['smart-default']
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {suggestion.targetField}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-sm line-clamp-3">
                        {suggestion.content}
                      </p>
                      
                      {suggestion.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.reasoning}
                        </p>
                      )}
                      
                      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {suggestion.alternatives.slice(0, 2).map((alt, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="text-[10px] cursor-pointer hover:bg-secondary/80 truncate max-w-[120px]"
                              onClick={() => onApply({
                                ...suggestion,
                                content: alt,
                              })}
                            >
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => onApply(suggestion)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Apply suggestion</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => onDismiss(suggestion.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dismiss</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

// ============================================================================
// COMMAND PALETTE
// ============================================================================

const COMMAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'make-formal': Type,
  'make-casual': Smile,
  'expand': Expand,
  'shorten': Minimize2,
  'fix-grammar': Check,
  'add-emojis': Sparkles,
  'remove-emojis': X,
  'generate-tags': Hash,
  'generate-description': FileText,
  'translate': Languages,
  'summarize': List,
  'bullet-points': List,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand: (command: AICommand) => void;
  commands: AICommand[];
  currentField: string;
  isProcessing?: boolean;
}

export function CommandPalette({
  open,
  onOpenChange,
  onSelectCommand,
  commands,
  currentField,
  isProcessing,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  const groupedCommands = commands.reduce((acc, cmd) => {
    const group = cmd.action;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cmd);
    return acc;
  }, {} as Record<string, AICommand[]>);

  const groupLabels: Record<string, string> = {
    transform: 'Transform',
    enhance: 'Enhance',
    generate: 'Generate',
    translate: 'Translate',
    validate: 'Validate',
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder={`AI commands for "${currentField}"...`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([group, cmds]) => (
          <CommandGroup key={group} heading={groupLabels[group] || group}>
            {cmds.map((cmd) => {
              const Icon = COMMAND_ICONS[cmd.name] || Wand2;
              
              return (
                <CommandItem
                  key={cmd.name}
                  onSelect={() => {
                    onSelectCommand(cmd);
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-3 py-3"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {cmd.name.replace(/-/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cmd.description}
                    </p>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// ============================================================================
// AI FORM FIELD
// ============================================================================

interface AIFormFieldProps {
  field: FieldSchema;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suggestions: AISuggestion[];
  isProcessing: boolean;
  processingField: string | null;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onExecuteCommand: (command: AICommand) => void;
  availableCommands: AICommand[];
  error?: string | null;
  className?: string;
}

export const AIFormField = forwardRef<HTMLInputElement, AIFormFieldProps>(({
  field,
  value,
  onChange,
  onBlur,
  suggestions,
  isProcessing,
  processingField,
  onApplySuggestion,
  onDismissSuggestion,
  onExecuteCommand,
  availableCommands,
  error,
  className,
}, ref) => {
  const [commandOpen, setCommandOpen] = useState(false);
  
  const fieldSuggestions = suggestions.filter(
    s => s.targetField === field.name
  );
  const isFieldProcessing = isProcessing && processingField === field.name;
  const hasSuggestions = fieldSuggestions.length > 0 || isFieldProcessing;

  const InputComponent = field.type === 'textarea' ? Textarea : Input;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name} className="flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
        
        <div className="flex items-center gap-1">
          {hasSuggestions && (
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          )}
          {availableCommands.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCommandOpen(true)}
                    disabled={!value}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Commands (Ctrl+Shift+K)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <SuggestionPopover
        suggestions={fieldSuggestions}
        isProcessing={isFieldProcessing}
        onApply={onApplySuggestion}
        onDismiss={onDismissSuggestion}
      >
        <div className="relative">
          <InputComponent
            ref={ref as any}
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            className={cn(
              hasSuggestions && "ring-2 ring-primary/20 border-primary/30",
              error && "ring-2 ring-destructive/20 border-destructive/30"
            )}
          />
          {isFieldProcessing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      </SuggestionPopover>

      {field.helpText && !error && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectCommand={onExecuteCommand}
        commands={availableCommands}
        currentField={field.label}
        isProcessing={isProcessing}
      />
    </div>
  );
});

AIFormField.displayName = 'AIFormField';

// ============================================================================
// COMPLETE AI FORM
// ============================================================================

interface AIFormProps {
  schema: FormSchema;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  className?: string;
  submitLabel?: string;
  showAIHint?: boolean;
}

export function AIForm({ 
  schema, 
  onSubmit,
  initialValues,
  className,
  submitLabel,
  showAIHint = true,
}: AIFormProps) {
  const {
    formValues,
    suggestions,
    isProcessing,
    processingField,
    error,
    updateField,
    getSuggestions,
    applySuggestion,
    dismissSuggestion,
    executeCommand,
    getAvailableCommands,
    validateForm,
  } = useFormAgent({ schema, initialValues });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const errors = await validateForm();
    setFieldErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      onSubmit(formValues);
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className={className}>
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
          {schema.fields
            .filter(f => !f.hidden)
            .map((field) => (
            <AIFormField
              key={field.name}
              field={field}
              value={formValues[field.name] || ''}
              onChange={(value) => updateField(field.name, value)}
              onBlur={() => getSuggestions(field.name)}
              suggestions={suggestions}
              isProcessing={isProcessing}
              processingField={processingField}
              onApplySuggestion={applySuggestion}
              onDismissSuggestion={dismissSuggestion}
              onExecuteCommand={(cmd) => executeCommand(cmd, field.name)}
              availableCommands={getAvailableCommands(field.name)}
              error={fieldErrors[field.name]}
            />
          ))}
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            {showAIHint && (
              <p className="text-xs text-muted-foreground">
                Press <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">Ctrl+Space</kbd> for AI suggestions
              </p>
            )}
            <Button 
              type="submit" 
              disabled={isProcessing || isSubmitting}
              className="ml-auto"
            >
              {(isProcessing || isSubmitting) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {submitLabel || schema.submitLabel || 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INLINE SUGGESTION BADGE
// ============================================================================

interface InlineSuggestionProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
}

export function InlineSuggestion({ suggestion, onApply, onDismiss }: InlineSuggestionProps) {
  const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;
  
  return (
    <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
      <Icon className="w-3 h-3" />
      <span className="max-w-[150px] truncate">{suggestion.content}</span>
      <button
        onClick={onApply}
        className="hover:bg-primary/20 rounded-full p-0.5"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        onClick={onDismiss}
        className="hover:bg-primary/20 rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  TYPE_ICONS,
  TYPE_COLORS,
  COMMAND_ICONS,
};
