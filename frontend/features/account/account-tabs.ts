import { LayoutDashboard, Package, Palette, Store, User, type LucideIcon } from 'lucide-react'

export type AccountTab = 'overview' | 'store' | 'orders' | 'designs' | 'profile'

/** Sidebar order; number keys 1–5 follow the same order. */
export const ACCOUNT_TABS: { id: AccountTab; label: string; description: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', description: 'Your dashboard at a glance', icon: LayoutDashboard },
  { id: 'store', label: 'Store', description: 'Products & storefront', icon: Store },
  { id: 'orders', label: 'Orders', description: 'Purchases & tracking', icon: Package },
  { id: 'designs', label: 'Designs', description: '3D studio projects', icon: Palette },
  { id: 'profile', label: 'Profile', description: 'Account & security', icon: User },
]

export function isAccountTab(value: string | null): value is AccountTab {
  return ACCOUNT_TABS.some((tab) => tab.id === value)
}
