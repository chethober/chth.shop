import Link from 'next/link'
import { ArrowRight, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GARMENTS } from '@/features/design/constants'
import { getPlaceholderImage } from '@/lib/products'

export function DesignsPanel() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Designs</CardTitle>
          <CardDescription>Your 3D studio projects</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/design">
            <Palette />
            Open studio
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 sm:p-8">
          <div className="mx-auto max-w-sm text-center">
            <h3 className="text-base font-semibold text-foreground">Start your first design</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a base garment, add colors and artwork in 3D, then publish it to your store.
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
            {GARMENTS.map((garment) => (
              <Link
                key={garment.id}
                href="/design"
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPlaceholderImage(garment.id)}
                    alt={garment.name}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-xs font-semibold text-foreground">{garment.name}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
