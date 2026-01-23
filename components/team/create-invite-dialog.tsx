'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Loader2, Link as LinkIcon, Shield, Edit, Eye, Copy, Check } from 'lucide-react'
import type { UserRole } from '@/lib/config/constants'

interface CreateInviteDialogProps {
  onInviteCreated?: () => void
  trigger?: React.ReactNode
}

const ROLE_OPTIONS = [
  {
    value: 'viewer',
    label: 'Viewer',
    icon: Eye,
    description: 'Can view creatives',
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: Edit,
    description: 'Can create and edit creatives',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: Shield,
    description: 'Full access including team management',
  },
]

const EXPIRY_OPTIONS = [
  { value: '0', label: 'Never expires' },
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
]

const MAX_USES_OPTIONS = [
  { value: '1', label: 'Single use' },
  { value: '5', label: '5 uses' },
  { value: '10', label: '10 uses' },
  { value: '0', label: 'Unlimited' },
]

export function CreateInviteDialog({ onInviteCreated, trigger }: CreateInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<{
    url: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [role, setRole] = useState<UserRole>('viewer')
  const [email, setEmail] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [expiresIn, setExpiresIn] = useState('0')

  const resetForm = () => {
    setRole('viewer')
    setEmail('')
    setMaxUses('1')
    setExpiresIn('0')
    setCreatedInvite(null)
    setCopied(false)
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleCreate = async () => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/team/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          email: email || null,
          maxUses: parseInt(maxUses),
          expiresIn: expiresIn === '0' ? null : parseInt(expiresIn),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create invite')
        setIsCreating(false)
        return
      }

      setCreatedInvite({
        url: data.invite.url,
        role: data.invite.role,
      })
      toast.success('Invite link created!')
      onInviteCreated?.()
    } catch (err) {
      console.error('Create invite error:', err)
      toast.error('Failed to create invite')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!createdInvite) return

    try {
      await navigator.clipboard.writeText(createdInvite.url)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <LinkIcon className="h-4 w-4 mr-2" />
            Create Invite Link
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdInvite ? 'Invite Link Created!' : 'Create Invite Link'}
          </DialogTitle>
          <DialogDescription>
            {createdInvite
              ? 'Share this link to invite someone to your organization.'
              : 'Create a link to invite someone with a specific role.'
            }
          </DialogDescription>
        </DialogHeader>

        {createdInvite ? (
          // Success state - show created link
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">
                This person will join as <strong className="text-foreground capitalize">{createdInvite.role}</strong>
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdInvite.url}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={resetForm}>
                Create Another
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Form state
          <div className="space-y-6 py-4">
            {/* Role selection */}
            <div className="space-y-3">
              <Label>Role *</Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
                className="space-y-2"
              >
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <div
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        role === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setRole(option.value as UserRole)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="cursor-pointer font-medium">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Email restriction (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Restrict to Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to allow anyone with the link to join
              </p>
            </div>

            {/* Max uses */}
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_USES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>Expires After</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Invite'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
