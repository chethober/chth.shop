'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, AtSign, Calendar, Check, KeyRound, Mail, RotateCcw, X, type LucideIcon } from 'lucide-react'
import { toast } from '@heroui/react'
import { InlineConfirm } from '@/components/custom/inline-confirm'
import { CopyButton } from '@/components/shared/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'

const USERNAME_MIN_LENGTH = 5
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const PROVIDER_LABELS: Record<string, string> = { google: 'Google', x: 'X (Twitter)', telegram: 'Telegram' }

function validateUsername(value: string) {
  if (value.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters`
  if (!USERNAME_PATTERN.test(value)) return 'Only letters, numbers, and underscores'
  return ''
}

function DetailTile({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 flex min-w-0 items-center justify-between gap-2 text-sm font-medium text-foreground">
        {children}
      </dd>
    </div>
  )
}

export function ProfilePanel({ onDeleteAccount }: { onDeleteAccount: () => Promise<void> }) {
  const user = useAuthStore((state) => state.user)
  const updateUsername = useAuthStore((state) => state.updateUsername)
  const savedUsername = user?.username ?? ''

  const [username, setUsername] = useState(savedUsername)
  const [syncedUsername, setSyncedUsername] = useState(savedUsername)
  const [availability, setAvailability] = useState<Availability>('idle')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(username)

  // Follow the saved username when it changes (e.g. after a successful save).
  if (syncedUsername !== savedUsername) {
    setSyncedUsername(savedUsername)
    setUsername(savedUsername)
  }

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current)
  }, [])

  const isDirty = username !== savedUsername
  const canSave = isDirty && !saving && (availability === 'available' || availability === 'idle')

  const handleChange = (value: string) => {
    setUsername(value)
    latest.current = value
    setError('')
    if (debounce.current) clearTimeout(debounce.current)

    if (value === savedUsername) return setAvailability('idle')
    if (validateUsername(value)) return setAvailability('invalid')

    setAvailability('checking')
    debounce.current = setTimeout(async () => {
      try {
        const available = await api.users.isUsernameAvailable(value)
        if (latest.current === value) setAvailability(available ? 'available' : 'taken')
      } catch {
        if (latest.current === value) setAvailability('idle')
      }
    }, 450)
  }

  const reset = () => {
    if (debounce.current) clearTimeout(debounce.current)
    setUsername(savedUsername)
    setAvailability('idle')
    setError('')
  }

  const save = async () => {
    const validationError = validateUsername(username)
    if (validationError) return setError(validationError)

    setSaving(true)
    try {
      await updateUsername(username)
      setAvailability('idle')
      toast.success('Username updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setSaving(false)
    }
  }

  const provider = user?.authProvider ?? (user?.googleId ? 'google' : user?.telegramId ? 'telegram' : user?.twitterId ? 'x' : '')
  const invalid = availability === 'taken' || availability === 'invalid' || Boolean(error)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your identity across CHTH</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="account-username">Username</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="account-username"
                  autoComplete="off"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => handleChange(event.target.value.trim())}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && canSave) save()
                    if (event.key === 'Escape') reset()
                  }}
                  aria-invalid={invalid}
                  aria-describedby="username-help"
                  className={cn('pl-9 pr-10 font-medium', availability === 'available' && 'border-success/60')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {availability === 'checking' && <Spinner className="text-muted-foreground" />}
                  {availability === 'available' && <Check className="size-4 text-success" />}
                  {(availability === 'taken' || availability === 'invalid') && <X className="size-4 text-destructive" />}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {isDirty && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="flex gap-2"
                  >
                    <Button variant="outline" size="icon" onClick={reset} title="Revert (Esc)" aria-label="Revert">
                      <RotateCcw />
                    </Button>
                    <Button onClick={save} disabled={!canSave} className="flex-1 sm:flex-none">
                      {saving ? <Spinner /> : <Check />}
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p id="username-help" className="min-h-4 text-[11px]" aria-live="polite">
              {error ? (
                <span className="font-medium text-destructive">{error}</span>
              ) : availability === 'taken' ? (
                <span className="font-medium text-destructive">@{username} is already taken</span>
              ) : availability === 'invalid' ? (
                <span className="font-medium text-destructive">{validateUsername(username)}</span>
              ) : availability === 'available' ? (
                <span className="font-medium text-success">@{username} is available</span>
              ) : (
                <span className="text-muted-foreground">
                  Your store lives at <span className="font-medium text-foreground">chth.shop/{savedUsername}</span>. Min 5
                  characters; letters, numbers, underscores.
                </span>
              )}
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <DetailTile icon={Mail} label="Email">
              <span className="truncate">{user?.email || '—'}</span>
              {user?.email && <CopyButton value={user.email} label="Copy email" className="-my-1 shrink-0" />}
            </DetailTile>
            <DetailTile icon={KeyRound} label="Sign-in method">
              {PROVIDER_LABELS[provider] ?? '—'}
            </DetailTile>
            <DetailTile icon={Calendar} label="Member since">
              {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </DetailTile>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-destructive/25 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">Delete account</h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Permanently removes your account, store, and products. This can’t be undone.
              </p>
            </div>
          </div>
          <InlineConfirm corner={12} label="Delete Account" onConfirm={onDeleteAccount} />
        </div>
      </Card>
    </div>
  )
}
