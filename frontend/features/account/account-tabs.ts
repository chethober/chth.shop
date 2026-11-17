import { Heart, House, Package, Store, User, type LucideIcon } from 'lucide-react'

export type AccountTab = 'overview' | 'store' | 'orders' | 'saved' | 'profile'

/** The account's five sections, in tab-bar order; number keys 1–5 follow the same order. */
export const ACCOUNT_TABS: { id: AccountTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Home', icon: House },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'saved', label: 'Saved', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
]

/** Sections that used to have tabs of their own, and the tab that holds them now (old links keep working). */
const MOVED: Record<string, AccountTab> = { collectibles: 'orders', designs: 'saved', invite: 'profile' }

/** The tab a `?tab=` value opens, or null when it names none. */
export function accountTabFrom(value: string | null): AccountTab | null {
  if (!value) return null
  if (ACCOUNT_TABS.some((tab) => tab.id === value)) return value as AccountTab
  return MOVED[value] ?? null
}
