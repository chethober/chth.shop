import { db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';
import { isAdmin } from './config.js';

/** Creates or refreshes the user row from a Telegram `User`; returns the row. */
export async function touchUser(from) {
  const profile = {
    username: from.username ?? null,
    firstName: from.first_name ?? null,
    reachable: true,
    updatedAt: new Date(),
  };
  const [row] = await db.insert(users)
    .values({ id: from.id, ...profile })
    .onConflictDoUpdate({ target: users.id, set: profile })
    .returning();
  return row;
}

export async function getUser(id) {
  return db.select().from(users).where(eq(users.id, Number(id))).get();
}

export async function updateUser(id, fields) {
  const [row] = await db.update(users)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(users.id, Number(id)))
    .returning();
  return row ?? null;
}

/** Approved artists and admins may manage items. */
export function canSell(user) {
  return Boolean(user) && (user.role === 'artist' || isAdmin(user.id));
}

/** Admins may act on any item; artists only on their own. */
export function canManageItem(user, item) {
  return Boolean(item) && (isAdmin(user.id) || (user.role === 'artist' && item.ownerId === user.id));
}
