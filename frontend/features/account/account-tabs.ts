import { Gem, Gift, Heart, LayoutDashboard, Package, Palette, Store, User, type LucideIcon } from 'lucide-react'

export type AccountTab = 'overview' | 'store' | 'orders' | 'collectibles' | 'saved' | 'invite' | 'designs' | 'profile'

/** Sidebar order; number keys 1–8 follow the same order. */
export const ACCOUNT_TABS: { id: AccountTab; label: string; description: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', description: 'Your dashboard at a glance', icon: LayoutDashboard },
  { id: 'store', label: 'Store', description: 'Products & storefront', icon: Store },
  { id: 'orders', label: 'Orders', description: 'Purchases & tracking', icon: Package },
  { id: 'collectibles', label: 'Collectibles', description: 'NFT certificates', icon: Gem },
  { id: 'saved', label: 'Saved', description: 'Wishlist & following', icon: Heart },
  { id: 'invite', label: 'Invite', description: 'Referral rewards', icon: Gift },
  { id: 'designs', label: 'Designs', description: '3D studio projects', icon: Palette },
  { id: 'profile', label: 'Profile', description: 'Account & security', icon: User },
]

export function isAccountTab(value: string | null): value is AccountTab {
  return ACCOUNT_TABS.some((tab) => tab.id === value)
}
