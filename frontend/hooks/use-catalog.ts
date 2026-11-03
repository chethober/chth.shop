'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { CatalogItem, ProductType } from '@/types'

let cached: CatalogItem[] | null = null
let pending: Promise<CatalogItem[]> | null = null

function loadCatalog() {
  pending ??= api.catalog().then((catalog) => (cached = catalog)).finally(() => (pending = null))
  return pending
}

/** The platform's base products (sizes, colors, prices). Fetched once per page load. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(cached)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    loadCatalog()
      .then((loaded) => !cancelled && setCatalog(loaded))
      .catch(() => !cancelled && setCatalog([]))
    return () => {
      cancelled = true
    }
  }, [])

  const get = (type: ProductType | string) => catalog?.find((item) => item.type === type) ?? null
  return { catalog, get }
}
