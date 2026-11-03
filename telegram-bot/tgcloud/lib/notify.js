import { api, BotApiError } from 'sdk';
import { ADMIN_IDS } from './config.js';
import { esc, money, displayName } from './format.js';
import { getUser, updateUser } from './users.js';

/**
 * Sends an HTML message, swallowing delivery failures so one unreachable user
 * never breaks the action that triggered the notification. A bot can only
 * message users who have pressed /start; a 403 means they blocked it.
 */
export async function send(chatId, text, extra = {}) {
  try {
    return await api.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...extra,
    });
  } catch (error) {
    if (!(error instanceof BotApiError)) throw error;
    if (error.code === 403) await updateUser(chatId, { reachable: false });
    console.warn('notification not delivered', { chatId, code: error.code, description: error.description });
    return null;
  }
}

export async function notifyAdmins(text, extra = {}, { except } = {}) {
  for (const adminId of ADMIN_IDS) {
    if (adminId !== except) await send(adminId, text, extra);
  }
}

async function notifyOwner(ownerId, kind, text) {
  const owner = await getUser(ownerId);
  if (!owner || !owner.reachable) return;
  if (kind === 'sale' && !owner.notifySales) return;
  if (kind === 'stock' && !owner.notifyStock) return;
  await send(ownerId, text);
}

/** Tells the owner (and admins) about a recorded sale. */
export async function notifySale({ item, sale, recordedBy }) {
  const text = [
    '💰 <b>New sale</b>',
    `${sale.qty} × ${esc(item.name)} <code>#${item.id}</code> @ ${money(sale.unitCents)}`,
    `Total: <b>${money(sale.totalCents)}</b> · ${item.stock} left`,
  ].join('\n');

  if (recordedBy !== item.ownerId) await notifyOwner(item.ownerId, 'sale', text);

  const owner = await getUser(item.ownerId);
  await notifyAdmins(`${text}\n🎨 ${esc(displayName(owner))}`, {}, { except: recordedBy });
}

/**
 * Fires when stock crosses a threshold: sold out, dropped into the low zone,
 * or came back from zero. Changes within the same zone stay quiet.
 */
export async function notifyStockChange(item, previousStock) {
  const now = item.stock;
  let text = null;

  if (now === 0 && previousStock > 0) {
    text = `🚫 <b>Sold out</b>: ${esc(item.name)} <code>#${item.id}</code>\nRestock with /restock ${item.id} &lt;qty&gt;`;
  } else if (now > 0 && now <= item.lowStock && previousStock > item.lowStock) {
    text = `⚠️ <b>Low stock</b>: ${esc(item.name)} <code>#${item.id}</code> — ${now} left`;
  } else if (now > 0 && previousStock === 0) {
    text = `✅ <b>Back in stock</b>: ${esc(item.name)} <code>#${item.id}</code> — ${now} available`;
  }

  if (text) await notifyOwner(item.ownerId, 'stock', text);
}
