import { db } from 'sdk';
import { eq } from 'sdk/db';
import { sessions } from '../schema.js';

const TTL_SECONDS = 15 * 60;

export async function getSession(userId) {
  const row = await db.select().from(sessions).where(eq(sessions.userId, userId)).get();
  if (!row) return null;
  if (Date.now() / 1000 - row.updatedAt.getTime() / 1000 > TTL_SECONDS) {
    await clearSession(userId);
    return null;
  }
  return row;
}

export async function setSession(userId, state, data = {}) {
  const fields = { state, data, updatedAt: new Date() };
  await db.insert(sessions)
    .values({ userId, ...fields })
    .onConflictDoUpdate({ target: sessions.userId, set: fields });
}

export async function clearSession(userId) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
