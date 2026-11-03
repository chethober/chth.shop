import { table, integer, text, boolean, index, sql } from 'sdk/db';

// The bot's own store of record: artists, their items, stock and sales.
// No foreign keys on this platform, so `*_id` columns are logical links kept
// consistent in lib/ (e.g. deleting an item also deletes its stock moves).

/** Everyone who has talked to the bot. `id` is the Telegram user id (also the DM chat id). */
export const users = table('users', {
  id:          integer('id').primaryKey(),
  username:    text('username'),
  firstName:   text('first_name'),
  storeName:   text('store_name'),
  // 'guest' (never registered) | 'pending' | 'artist' | 'banned'
  role:        text('role').notNull().default('guest'),
  notifySales: boolean('notify_sales').notNull().default(true),
  notifyStock: boolean('notify_stock').notNull().default(true),
  // false once the user blocks the bot, so notifications skip them
  reachable:   boolean('reachable').notNull().default(true),
  createdAt:   integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt:   integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  roleIdx: index('idx_users_role').on(t.role),
}));

/** Prices are integer cents to keep sums exact. */
export const items = table('items', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  ownerId:    integer('owner_id').notNull(),
  name:       text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  stock:      integer('stock').notNull().default(0),
  lowStock:   integer('low_stock').notNull().default(3),
  active:     boolean('active').notNull().default(true),
  createdAt:  integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt:  integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  ownerIdx: index('idx_items_owner').on(t.ownerId),
}));

export const sales = table('sales', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  itemId:     integer('item_id').notNull(),
  ownerId:    integer('owner_id').notNull(),
  // Snapshot of the name so history survives renames and deletes.
  itemName:   text('item_name').notNull(),
  qty:        integer('qty').notNull(),
  unitCents:  integer('unit_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  recordedBy: integer('recorded_by').notNull(),
  createdAt:  integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  ownerCreatedIdx: index('idx_sales_owner_created').on(t.ownerId, t.createdAt),
  createdIdx:      index('idx_sales_created').on(t.createdAt),
}));

/** Audit trail for price changes. */
export const priceChanges = table('price_changes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  itemId:    integer('item_id').notNull(),
  oldCents:  integer('old_cents').notNull(),
  newCents:  integer('new_cents').notNull(),
  changedBy: integer('changed_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  itemIdx: index('idx_price_changes_item').on(t.itemId),
}));

/** One pending multi-step input per user, e.g. "waiting for the new price of item 4". */
export const sessions = table('sessions', {
  userId:    integer('user_id').primaryKey(),
  state:     text('state').notNull(),
  data:      text('data', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
