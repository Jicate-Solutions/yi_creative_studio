'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface PastDateWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
  date: string
}

/**
 * Past Date Warning Dialog
 * PRD Edge Case E07: "Date is in past → Show warning but allow"
 * Message: "Selected date is in the past. Continue anyway?"
 */
export function PastDateWarningDialog({
  open,
  onOpenChange,
  onContinue,
  date,
}: PastDateWarningDialogProps) {
  const handleContinue = () => {
    onContinue()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Past Date Selected
          </DialogTitle>
          <DialogDescription className="pt-2">
            The selected date <strong className="text-foreground">&quot;{date}&quot;</strong> appears
            to be in the past. Are you sure you want to create a poster for a past event?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Change Date
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
          >
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
