'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Link2Off, Loader2, PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface CanvaIntegrationCardProps {
  organizationId: string
  /** Whether brand_config already has a canva_access_token set */
  isConnected: boolean
  connectedAt?: string | null
}

export function CanvaIntegrationCard({
  organizationId,
  isConnected: initialIsConnected,
  connectedAt,
}: CanvaIntegrationCardProps) {
  const [isConnected, setIsConnected] = useState(initialIsConnected)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Handle OAuth result from URL param (?canva=success|error)
  const searchParams = useSearchParams()
  useEffect(() => {
    const canvaParam = searchParams.get('canva')
    if (canvaParam === 'success') {
      toast.success('Canva connected successfully!')
      setIsConnected(true)
    } else if (canvaParam === 'error') {
      toast.error('Canva connection failed. Please try again.')
    }
  }, [searchParams])

  const handleConnect = () => {
    window.location.href = `/api/canva/authorize?organization_id=${organizationId}`
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const supabase = createClient()
      // Clear Canva tokens from brand_config
      const { data: org } = await supabase
        .from('organizations')
        .select('brand_config')
        .eq('id', organizationId)
        .single()

      const existing = (org?.brand_config as Record<string, unknown>) ?? {}
      const cleaned = { ...existing }
      delete cleaned.canva_access_token
      delete cleaned.canva_refresh_token
      delete cleaned.canva_token_expires_at
      delete cleaned.canva_connected_by
      delete cleaned.canva_connected_at

      await supabase
        .from('organizations')
        .update({ brand_config: cleaned as Json })
        .eq('id', organizationId)

      setIsConnected(false)
      setShowDisconnect(false)
      toast.success('Canva disconnected.')
    } catch {
      toast.error('Failed to disconnect. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <PenLine className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Canva</CardTitle>
              <CardDescription>
                Connect your chapter&apos;s Canva account to sync generated creatives to your Brand Library
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} className="w-full sm:w-auto">
            <PenLine className="mr-2 h-4 w-4" />
            Connect Canva
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <PenLine className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Canva
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {connectedAt
                    ? `Connected ${new Date(connectedAt).toLocaleDateString()}`
                    : 'Brand Library sync is active'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            After saving an edited creative, use the &ldquo;Sync to Canva&rdquo; option to push it to your Brand Library.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDisconnect(true)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Link2Off className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Canva?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the Canva connection for your organization. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
