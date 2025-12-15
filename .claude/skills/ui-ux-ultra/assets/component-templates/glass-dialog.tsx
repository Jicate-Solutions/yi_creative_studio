/**
 * Glass Dialog Component Template
 *
 * A premium glassmorphism dialog/modal with backdrop blur,
 * smooth animations, and full accessibility support.
 *
 * Usage:
 * <GlassDialog open={open} onOpenChange={setOpen}>
 *   <GlassDialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </GlassDialogTrigger>
 *   <GlassDialogContent glass="premium">
 *     <GlassDialogHeader>
 *       <GlassDialogTitle>Title</GlassDialogTitle>
 *       <GlassDialogDescription>Description</GlassDialogDescription>
 *     </GlassDialogHeader>
 *     Content here
 *     <GlassDialogFooter>
 *       <Button>Action</Button>
 *     </GlassDialogFooter>
 *   </GlassDialogContent>
 * </GlassDialog>
 */

'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================
// DIALOG VARIANTS
// ============================================================

const glassDialogVariants = cva(
  // Base styles
  [
    'fixed left-[50%] top-[50%] z-50',
    'grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
    'gap-4 p-6 rounded-xl',
    'shadow-lg',
    'duration-200',
    'data-[state=open]:animate-in',
    'data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0',
    'data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95',
    'data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2',
    'data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2',
    'data-[state=open]:slide-in-from-top-[48%]',
  ],
  {
    variants: {
      glass: {
        none: 'bg-background border',
        subtle: [
          'bg-white/80 dark:bg-slate-900/90',
          'backdrop-blur-xl',
          'border border-white/20 dark:border-white/10',
        ],
        medium: [
          'bg-white/85 dark:bg-slate-900/92',
          'backdrop-blur-2xl',
          'border border-white/30 dark:border-white/15',
        ],
        strong: [
          'bg-white/90 dark:bg-slate-900/95',
          'backdrop-blur-3xl',
          'border border-white/40 dark:border-white/20',
        ],
        premium: [
          'bg-white/92 dark:bg-slate-900/95',
          'backdrop-blur-3xl',
          'border border-white/50 dark:border-white/25',
          'shadow-[0_25px_50px_-12px_rgba(0,91,150,0.25)]',
        ],
      },
    },
    defaultVariants: {
      glass: 'medium',
    },
  }
)

// ============================================================
// DIALOG ROOT
// ============================================================

const GlassDialog = DialogPrimitive.Root

// ============================================================
// DIALOG TRIGGER
// ============================================================

const GlassDialogTrigger = DialogPrimitive.Trigger

// ============================================================
// DIALOG PORTAL
// ============================================================

const GlassDialogPortal = DialogPrimitive.Portal

// ============================================================
// DIALOG CLOSE
// ============================================================

const GlassDialogClose = DialogPrimitive.Close

// ============================================================
// DIALOG OVERLAY
// ============================================================

const GlassDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/40 backdrop-blur-sm',
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
GlassDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// ============================================================
// DIALOG CONTENT
// ============================================================

export interface GlassDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof glassDialogVariants> {
  /** Show close button */
  showClose?: boolean
}

const GlassDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  GlassDialogContentProps
>(({ className, glass, showClose = true, children, ...props }, ref) => (
  <GlassDialogPortal>
    <GlassDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(glassDialogVariants({ glass }), className)}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4',
            'rounded-sm opacity-70',
            'ring-offset-background',
            'transition-opacity',
            'hover:opacity-100',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-ring',
            'focus:ring-offset-2',
            'disabled:pointer-events-none',
            'data-[state=open]:bg-accent',
            'data-[state=open]:text-muted-foreground'
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </GlassDialogPortal>
))
GlassDialogContent.displayName = DialogPrimitive.Content.displayName

// ============================================================
// DIALOG HEADER
// ============================================================

const GlassDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
)
GlassDialogHeader.displayName = 'GlassDialogHeader'

// ============================================================
// DIALOG FOOTER
// ============================================================

const GlassDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
)
GlassDialogFooter.displayName = 'GlassDialogFooter'

// ============================================================
// DIALOG TITLE
// ============================================================

const GlassDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      'text-slate-900 dark:text-white',
      className
    )}
    {...props}
  />
))
GlassDialogTitle.displayName = DialogPrimitive.Title.displayName

// ============================================================
// DIALOG DESCRIPTION
// ============================================================

const GlassDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
GlassDialogDescription.displayName = DialogPrimitive.Description.displayName

// ============================================================
// EXPORTS
// ============================================================

export {
  GlassDialog,
  GlassDialogPortal,
  GlassDialogOverlay,
  GlassDialogClose,
  GlassDialogTrigger,
  GlassDialogContent,
  GlassDialogHeader,
  GlassDialogFooter,
  GlassDialogTitle,
  GlassDialogDescription,
  glassDialogVariants,
}
