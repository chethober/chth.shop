import { db } from 'sdk';
import { eq, and, desc, gte, sql } from 'sdk/db';
import { items, sales, priceChanges } from '../schema.js';
import { DEFAULT_LOW_STOCK, MAX_STOCK } from './config.js';
import { notifySale, notifyStockChange } from './notify.js';

export async function getItem(id) {
  if (!Number.isInteger(Number(id))) return null;
  return db.select().from(items).where(eq(items.id, Number(id))).get();
}

export async function listItems(ownerId) {
  const query = db.select().from(items);
  return ownerId == null
    ? query.orderBy(items.ownerId, items.id).all()
    : query.where(eq(items.ownerId, ownerId)).orderBy(items.id).all();
}

export async function listLowStock(ownerId) {
  const lowCondition = sql`${items.stock} <= ${items.lowStock}`;
  const where = ownerId == null ? and(eq(items.active, true), lowCondition)
    : and(eq(items.ownerId, ownerId), eq(items.active, true), lowCondition);
  return db.select().from(items).where(where).orderBy(items.stock, items.id).all();
}

export async function createItem({ ownerId, name, priceCents, stock, lowStock = DEFAULT_LOW_STOCK }) {
  const [item] = await db.insert(items)
    .values({ ownerId, name, priceCents, stock: Math.min(stock, MAX_STOCK), lowStock })
    .returning();
  return item;
}

async function patchItem(id, fields) {
  const [item] = await db.update(items)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();
  return item ?? null;
}

export async function setPrice(item, priceCents, changedBy) {
  if (priceCents === item.priceCents) return item;
  await db.insert(priceChanges).values({
    itemId: item.id, oldCents: item.priceCents, newCents: priceCents, changedBy,
  });
  return patchItem(item.id, { priceCents });
}

export async function renameItem(item, name) {
  return patchItem(item.id, { name });
}

export async function setLowStock(item, lowStock) {
  return patchItem(item.id, { lowStock });
}

export async function setActive(item, active) {
  return patchItem(item.id, { active });
}

/** Sets stock to an absolute value and sends any threshold alert. */
export async function setStock(item, stock) {
  const updated = await patchItem(item.id, { stock: Math.min(stock, MAX_STOCK) });
  await notifyStockChange(updated, item.stock);
  return updated;
}

/**
 * Adds `delta` (may be negative) to stock in one statement so concurrent
 * updates can't lose writes. Returns null when it would go below zero.
 */
export async function adjustStock(itemId, delta) {
  const result = await db.run(sql`
    UPDATE items SET stock = MIN(stock + ${delta}, ${MAX_STOCK}), updated_at = unixepoch()
    WHERE id = ${itemId} AND stock + ${delta} >= 0`);
  if (result.rowsAffected === 0) return null;

  const updated = await getItem(itemId);
  await notifyStockChange(updated, updated.stock - delta);
  return updated;
}

/**
 * Records a sale: decrements stock atomically (refusing to oversell), logs it,
 * and notifies the owner and admins. Returns { item, sale } or { error }.
 */
export async function recordSale({ itemId, qty, unitCents, recordedBy }) {
  const result = await db.run(sql`
    UPDATE items SET stock = stock - ${qty}, updated_at = unixepoch()
    WHERE id = ${itemId} AND stock >= ${qty}`);
  if (result.rowsAffected === 0) {
    const item = await getItem(itemId);
    return { error: item ? `Only ${item.stock} in stock.` : 'Item not found.' };
  }

  const item = await getItem(itemId);
  const unit = unitCents ?? item.priceCents;
  const [sale] = await db.insert(sales).values({
    itemId: item.id,
    ownerId: item.ownerId,
    itemName: item.name,
    qty,
    unitCents: unit,
    totalCents: unit * qty,
    recordedBy,
  }).returning();

  await notifySale({ item, sale, recordedBy });
  await notifyStockChange(item, item.stock + qty);
  return { item, sale };
}

/** Deletes an item and its price history; sales are kept (they hold a name snapshot). */
export async function deleteItem(item) {
  await db.delete(priceChanges).where(eq(priceChanges.itemId, item.id));
  await db.delete(items).where(eq(items.id, item.id));
}

/** Units, revenue and top items since `days` ago, for one owner or everyone. */
export async function salesSummary({ ownerId, days }) {
  // Compared as unix seconds: Date values aren't converted inside where clauses.
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const scope = ownerId == null ? gte(sales.createdAt, since)
    : and(eq(sales.ownerId, ownerId), gte(sales.createdAt, since));

  const totals = await db.select({
    orders: sql`count(*)`,
    units: sql`coalesce(sum(${sales.qty}), 0)`,
    revenue: sql`coalesce(sum(${sales.totalCents}), 0)`,
  }).from(sales).where(scope).get();

  const top = await db.select({
    itemId: sales.itemId,
    name: sql`max(${sales.itemName})`,
    units: sql`sum(${sales.qty})`,
    revenue: sql`sum(${sales.totalCents})`,
  }).from(sales).where(scope).groupBy(sales.itemId)
    .orderBy(sql`sum(${sales.totalCents}) desc`).limit(5).all();

  return {
    orders: Number(totals?.orders ?? 0),
    units: Number(totals?.units ?? 0),
    revenue: Number(totals?.revenue ?? 0),
    top,
  };
}

export async function recentSales({ ownerId, limit = 10 }) {
  const query = db.select().from(sales);
  const scoped = ownerId == null ? query : query.where(eq(sales.ownerId, ownerId));
  return scoped.orderBy(desc(sales.id)).limit(limit).all();
}
