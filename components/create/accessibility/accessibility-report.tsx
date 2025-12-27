'use client'

/**
 * Accessibility Report Dialog
 * Comprehensive accessibility report with detailed checks and auto-fix options
 */

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AccessibilityBadge, AccessibilityScore } from '@/components/ui/accessibility-badge'
import { cn } from '@/lib/utils'
import type { AccessibilityReport, AccessibilityCheck } from '@/types/accessibility'

interface AccessibilityReportDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void
  /** Accessibility report to display */
  report: AccessibilityReport
  /** Callback when user requests auto-fix */
  onAutoFix?: () => void
  /** Whether auto-fix is in progress */
  autoFixing?: boolean
}

export function AccessibilityReportDialog({
  open,
  onOpenChange,
  report,
  onAutoFix,
  autoFixing = false,
}: AccessibilityReportDialogProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Group checks by status
  const failedChecks = report.checks.filter(c => c.status === 'fail')
  const warningChecks = report.checks.filter(c => c.status === 'warning')
  const passedChecks = report.checks.filter(c => c.status === 'pass')

  // Group failed checks by severity
  const criticalIssues = failedChecks.filter(c => c.impact === 'critical')
  const seriousIssues = failedChecks.filter(c => c.impact === 'serious')
  const moderateIssues = failedChecks.filter(c => c.impact === 'moderate')

  // Export report as JSON
  const exportReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accessibility-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accessibility Report</DialogTitle>
          <DialogDescription>
            WCAG 2.1 compliance analysis for your creative design
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Overall Score</h3>
              <AccessibilityBadge
                level={report.wcagLevel}
                score={report.overallScore}
                variant="compact"
              />
            </div>

            <AccessibilityScore score={report.overallScore} />

            {report.wcagLevel && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {report.wcagLevel === 'AAA' &&
                  'Excellent! Your design meets the highest WCAG AAA standards.'}
                {report.wcagLevel === 'AA' &&
                  'Good! Your design meets WCAG AA standards for accessibility.'}
                {report.wcagLevel === 'A' &&
                  'Your design meets basic WCAG A standards, but improvements are recommended.'}
              </p>
            )}

            {!report.wcagLevel && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Your design does not meet minimum WCAG standards. Critical issues must be resolved.
              </p>
            )}
          </div>

          {/* Issue Summary */}
          {(criticalIssues.length > 0 || seriousIssues.length > 0) && (
            <div className="space-y-2">
              <h3 className="font-semibold">Issues Found</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {criticalIssues.length > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-sm font-medium text-red-800 dark:text-red-400">
                        {criticalIssues.length} Critical
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-500">
                        Must be fixed
                      </div>
                    </div>
                  </div>
                )}

                {seriousIssues.length > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        {seriousIssues.length} Serious
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-500">
                        Should be fixed
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {onAutoFix && failedChecks.length > 0 && (
                <Button
                  onClick={onAutoFix}
                  disabled={autoFixing}
                  className="w-full"
                  variant="outline"
                >
                  {autoFixing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Applying fixes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Auto-fix accessibility issues
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Detailed Checks */}
          <div className="space-y-2">
            <h3 className="font-semibold">Detailed Checks</h3>

            <Accordion type="single" collapsible className="w-full">
              {/* Critical Issues */}
              {criticalIssues.length > 0 && (
                <AccordionItem value="critical" className="border-red-200">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Critical Issues ({criticalIssues.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {criticalIssues.map((check) => (
                        <CheckItem key={check.id} check={check} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Serious Issues */}
              {seriousIssues.length > 0 && (
                <AccordionItem value="serious" className="border-amber-200">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Serious Issues ({seriousIssues.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {seriousIssues.map((check) => (
                        <CheckItem key={check.id} check={check} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Moderate Issues */}
              {moderateIssues.length > 0 && (
                <AccordionItem value="moderate">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span>Moderate Issues ({moderateIssues.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {moderateIssues.map((check) => (
                        <CheckItem key={check.id} check={check} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Passed Checks */}
              {passedChecks.length > 0 && (
                <AccordionItem value="passed">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Passed Checks ({passedChecks.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {passedChecks.map((check) => (
                        <CheckItem key={check.id} check={check} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Individual check item component
 */
function CheckItem({ check }: { check: AccessibilityCheck }) {
  const getStatusColor = () => {
    if (check.status === 'pass') return 'border-green-200 bg-green-50 dark:bg-green-950/20'
    if (check.status === 'warning') return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
    if (check.impact === 'critical') return 'border-red-200 bg-red-50 dark:bg-red-950/20'
    if (check.impact === 'serious') return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
    return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
  }

  const getStatusIcon = () => {
    if (check.status === 'pass') return <Check className="h-4 w-4 text-green-600" />
    if (check.status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    if (check.impact === 'critical') return <X className="h-4 w-4 text-red-600" />
    return <AlertCircle className="h-4 w-4 text-amber-600" />
  }

  return (
    <div className={cn('rounded-md border p-3', getStatusColor())}>
      <div className="flex items-start gap-2">
        {getStatusIcon()}
        <div className="flex-1 space-y-1">
          <div className="text-sm font-medium">{check.message}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {check.wcagCriterion}
          </div>

          {check.currentValue && check.recommendedValue && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-white px-2 py-0.5 font-mono dark:bg-gray-800">
                Current: {check.currentValue}
              </span>
              <span>→</span>
              <span className="rounded bg-white px-2 py-0.5 font-mono dark:bg-gray-800">
                Recommended: {check.recommendedValue}
              </span>
            </div>
          )}

          {check.suggestion && check.status !== 'pass' && (
            <div className="mt-2 text-xs italic text-gray-700 dark:text-gray-300">
              Suggestion: {check.suggestion}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
