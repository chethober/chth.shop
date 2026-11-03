'use client'

import { useCallback, useEffect, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { toast } from '@heroui/react'
import { Stars } from '@/components/shared/product-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Review } from '@/types'

/** Verified-buyer reviews; buyers can write or edit theirs. */
export function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const apply = useCallback((data: { reviews: Review[]; canReview: boolean }) => {
    setReviews(data.reviews)
    setCanReview(data.canReview)
    const mine = data.reviews.find((review) => review.isMine)
    if (mine) {
      setRating(mine.rating)
      setBody(mine.body ?? '')
    }
  }, [])
  const load = useCallback(() => api.products.reviews(productId).then(apply), [productId, apply])

  useEffect(() => {
    api.products
      .reviews(productId)
      .then(apply)
      .catch(() => setReviews([]))
  }, [productId, apply])

  const save = async () => {
    setSaving(true)
    try {
      await api.products.review(productId, rating, body)
      toast.success('Thanks for your review!')
      await load()
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not save your review')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    await api.products.deleteReview(productId)
    setRating(0)
    setBody('')
    await load()
  }

  const average = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  const mine = reviews?.find((review) => review.isMine)

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>From verified buyers</CardDescription>
        </div>
        {reviews && reviews.length > 0 && <Stars value={average} count={reviews.length} />}
      </CardHeader>
      <CardContent className="space-y-5">
        {canReview && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-foreground">{mine ? 'Your review' : 'You bought this. How is it?'}</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => setRating(n)}
                  className="cursor-pointer"
                >
                  <Star className={cn('size-5', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50')} />
                </button>
              ))}
            </div>
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Fit, print quality, how it washes…" />
            <div className="flex justify-end gap-2">
              {mine && (
                <Button variant="ghost" size="sm" onClick={remove}>
                  <Trash2 />
                  Delete
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!rating || saving}>
                {saving && <Spinner />}
                {mine ? 'Update review' : 'Post review'}
              </Button>
            </div>
          </div>
        )}

        {!reviews ? (
          <Spinner className="mx-auto" />
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((review) => (
              <li key={review.id} className="space-y-1 py-3">
                <div className="flex items-center gap-2">
                  <Stars value={review.rating} />
                  <span className="text-xs font-semibold text-foreground">@{review.username}</span>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(review.createdAt)}</span>
                </div>
                {review.body && <p className="whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
