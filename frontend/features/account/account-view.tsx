'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Plus, Sparkles } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRequireAuth } from '@/hooks/use-require-auth'
import api, { ApiError } from '@/lib/api'
import useAuthStore from '@/store/auth-store'
import { STORE_KIND_LABELS } from '@/lib/products'
import type { Order, Product, Store } from '@/types'
import { AccountNav } from './account-nav'
import { AccountSkeleton } from './account-skeleton'
import { ACCOUNT_TABS, isAccountTab, type AccountTab } from './account-tabs'
import { CollectiblesPanel } from './collectibles-panel'
import { DesignsPanel } from './designs-panel'
import { InvitePanel } from './invite-panel'
import { SavedPanel } from './saved-panel'
import { OrdersPanel } from './orders-panel'
import { OverviewPanel } from './overview-panel'
import { ProductEditDialog, type ProductChanges } from './product-edit-dialog'
import { ProfilePanel } from './profile-panel'
import { StorePanel } from './store-panel'
import { isStoreFormDirty, storeFormFromStore, storeFormToPayload, type StoreForm } from './store-form'
import { UnsavedChangesBar } from './unsaved-changes-bar'

function showError(error: unknown, fallback: string) {
  toast.danger(error instanceof Error ? error.message : fallback)
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function initialTab(): AccountTab {
  if (typeof window === 'undefined') return 'overview'
  const tab = new URLSearchParams(window.location.search).get('tab')
  return isAccountTab(tab) ? tab : 'overview'
}

export function AccountView() {
  const router = useRouter()
  const isSignedIn = useRequireAuth('/account')
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const username = user?.username ?? ''

  // The first render is always the skeleton, so reading the URL here can't cause a hydration mismatch.
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab)
  const [isLoading, setIsLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [form, setForm] = useState<StoreForm>(() => storeFormFromStore(null))
  const [savingStore, setSavingStore] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)

  /* ---------- Navigation ---------- */

  const changeTab = useCallback((tab: AccountTab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'overview') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Number keys 1–8 switch sections (ignored while typing or in dialogs).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      const tab = ACCOUNT_TABS[Number(event.key) - 1]
      if (tab) {
        event.preventDefault()
        changeTab(tab.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [changeTab])

  /* ---------- Data ---------- */

  const applyStore = (next: Store | null) => {
    setStore(next)
    setForm(storeFormFromStore(next))
  }

  const refreshOrders = useCallback(async () => {
    setIsLoadingOrders(true)
    try {
      setOrders(await api.orders.list())
    } catch (error) {
      showError(error, 'Failed to load orders')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false

    const loadStore = api.stores
      .me()
      .then((next) => !cancelled && applyStore(next))
      .catch((error) => {
        // 404 just means the store hasn't been created yet.
        if (!cancelled && !(error instanceof ApiError && error.status === 404)) showError(error, 'Failed to load your store')
      })

    const loadProducts = api.products
      .mine()
      .then((items) => !cancelled && setProducts(items))
      .catch(() => {})

    Promise.all([loadStore, loadProducts]).finally(() => !cancelled && setIsLoading(false))

    api.orders
      .list()
      .then((items) => !cancelled && setOrders(items))
      .catch((error) => !cancelled && showError(error, 'Failed to load orders'))
      .finally(() => !cancelled && setIsLoadingOrders(false))

    return () => {
      cancelled = true
    }
  }, [isSignedIn, user?.id])

  /* ---------- Store settings ---------- */

  const savedForm = useMemo(() => storeFormFromStore(store), [store])
  const isStoreDirty = Boolean(store) && isStoreFormDirty(savedForm, form)

  useEffect(() => {
    if (!isStoreDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isStoreDirty])

  const updateForm = useCallback((changes: Partial<StoreForm>) => setForm((current) => ({ ...current, ...changes })), [])

  const saveStore = async () => {
    if (!form.storeName.trim()) {
      toast.warning('Your store needs a name')
      return
    }
    setSavingStore(true)
    try {
      const payload = storeFormToPayload(form)
      if (store) {
        applyStore(await api.stores.update(payload))
        toast.success('Store settings saved')
      } else {
        applyStore(await api.stores.create(payload))
        toast.success('Your store is live!')
      }
    } catch (error) {
      showError(error, 'Failed to save store settings')
    } finally {
      setSavingStore(false)
    }
  }

  const deleteStore = async () => {
    try {
      await api.stores.remove()
      applyStore(null)
      setProducts([])
      toast.success('Store deleted')
    } catch (error) {
      showError(error, 'Failed to delete store')
    }
  }

  /* ---------- Products ---------- */

  const saveProduct = async (changes: ProductChanges) => {
    if (!editingProduct) return
    setSavingProduct(true)
    try {
      const updated = await api.products.update(editingProduct.id, changes)
      setProducts((current) => current.map((product) => (product.id === updated.id ? { ...product, ...updated } : product)))
      setEditingProduct(null)
      toast.success('Product updated')
    } catch (error) {
      showError(error, 'Failed to update product')
    } finally {
      setSavingProduct(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      await api.products.remove(productId)
      setProducts((current) => current.filter((product) => product.id !== productId))
      toast.success('Product deleted')
    } catch (error) {
      showError(error, 'Failed to delete product')
    }
  }

  /* ---------- Orders & account ---------- */

  const cancelOrder = async (orderId: string) => {
    try {
      const updated = await api.orders.cancel(orderId)
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)))
      toast.success('Order cancelled')
    } catch (error) {
      showError(error, 'Failed to cancel order')
    }
  }

  const deleteAccount = async () => {
    try {
      await api.users.deleteAccount()
      signOut()
      toast.success('Account deleted')
      router.push('/')
    } catch (error) {
      showError(error, 'Failed to delete account')
    }
  }

  const handleSignOut = () => {
    signOut()
    toast.info('Signed out')
    router.push('/')
  }

  /* ---------- Render ---------- */

  if (!isSignedIn || isLoading) return <AccountSkeleton />

  const openOrderCount = orders.filter((order) => order.status !== 'CANCELLED' && order.status !== 'DELIVERED').length

  return (
    <div className="w-full space-y-6 pb-20">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex size-14 select-none items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-brand/25 via-muted to-muted text-lg font-bold text-foreground sm:size-16 sm:text-xl">
              {username.slice(0, 2).toUpperCase() || 'U'}
            </div>
            {store && (
              <span title={STORE_KIND_LABELS[store.kind]} className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-brand">
                <Sparkles className="size-2.5 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{greeting()},</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{username}</h1>
              <Badge variant={store ? 'brand' : 'secondary'}>{store ? STORE_KIND_LABELS[store.kind] : 'Member'}</Badge>
              {user?.role === 'ADMIN' && <Badge variant="secondary">Admin</Badge>}
            </div>
            {store?.storeName && (
              <p className="truncate text-xs text-muted-foreground">
                Running <span className="font-semibold text-foreground">{store.storeName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Fulfillment</Link>
            </Button>
          )}
          {store ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${username}`} target="_blank">
                View store
                <ExternalLink />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => changeTab('store')}>
              <Sparkles className="text-brand" />
              Open a store
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/design">
              <Plus />
              Create design
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
        <AccountNav
          activeTab={activeTab}
          onChange={changeTab}
          counts={{ store: products.length, orders: openOrderCount }}
          onSignOut={handleSignOut}
        />

        <main className="w-full min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'overview' && (
                <OverviewPanel
                  username={username}
                  store={store}
                  products={products}
                  orders={orders}
                  isLoadingOrders={isLoadingOrders}
                  onNavigate={changeTab}
                />
              )}
              {activeTab === 'store' && (
                <StorePanel
                  username={username}
                  isStoreActive={Boolean(store)}
                  products={products}
                  form={form}
                  onFormChange={updateForm}
                  saving={savingStore}
                  onActivate={saveStore}
                  onDeleteStore={deleteStore}
                  onEditProduct={setEditingProduct}
                  onDeleteProduct={deleteProduct}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersPanel orders={orders} isLoading={isLoadingOrders} onRefresh={refreshOrders} onCancel={cancelOrder} />
              )}
              {activeTab === 'collectibles' && <CollectiblesPanel />}
              {activeTab === 'saved' && <SavedPanel />}
              {activeTab === 'invite' && <InvitePanel />}
              {activeTab === 'designs' && <DesignsPanel />}
              {activeTab === 'profile' && <ProfilePanel onDeleteAccount={deleteAccount} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <UnsavedChangesBar
        visible={isStoreDirty}
        saving={savingStore}
        canSave={Boolean(form.storeName.trim())}
        onSave={saveStore}
        onDiscard={() => setForm(savedForm)}
        onReview={activeTab === 'store' ? undefined : () => changeTab('store')}
      />

      <ProductEditDialog product={editingProduct} saving={savingProduct} onClose={() => setEditingProduct(null)} onSave={saveProduct} />
    </div>
  )
}
