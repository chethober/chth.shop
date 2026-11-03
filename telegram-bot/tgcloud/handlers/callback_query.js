// Inline-button presses. Every path answers the callback so the button stops spinning.

import { api } from 'sdk';
import { isAdmin } from '../lib/config.js';
import { esc, money } from '../lib/format.js';
import { touchUser, getUser, updateUser, canSell, canManageItem } from '../lib/users.js';
import { setSession } from '../lib/session.js';
import { getItem, listItems, adjustStock, setActive, recordSale, deleteItem } from '../lib/inventory.js';
import { itemView, itemsView, editView, confirmKeyboard, settingsView } from '../lib/ui.js';
import { approveUser, rejectUser } from '../lib/admin.js';

async function handleItem(query, user, [, rawId, action, arg]) {
  const item = await getItem(rawId);
  if (!canManageItem(user, item)) return 'Item not found.';
  const { message } = query;

  switch (action) {
    case 'view':
      await editView(message, await itemView(item, user));
      return null;

    case 'inc': {
      const updated = await adjustStock(item.id, Number(arg));
      if (!updated) return 'Stock can\'t go below zero.';
      await editView(message, await itemView(updated, user));
      return `Stock: ${updated.stock}`;
    }

    case 'sell':
      if (item.stock < 1) return 'Out of stock.';
      await editView(message, {
        text: `${(await itemView(item, user)).text}\n\nRecord a sale of <b>1 × ${money(item.priceCents)}</b>?`,
        reply_markup: confirmKeyboard(item, 'sellok', '✅ Confirm sale'),
      });
      return null;

    case 'sellok': {
      const result = await recordSale({ itemId: item.id, qty: 1, unitCents: null, recordedBy: user.id });
      if (result.error) return result.error;
      await editView(message, await itemView(result.item, user));
      return `Sale recorded: ${money(result.sale.totalCents)}`;
    }

    case 'price':
    case 'stock':
      await setSession(user.id, action === 'price' ? 'set_price' : 'set_stock', { itemId: item.id });
      await api.sendMessage({
        chat_id: message.chat.id,
        parse_mode: 'HTML',
        text: action === 'price'
          ? `Send the new price for <b>${esc(item.name)}</b> (now ${money(item.priceCents)}), or /cancel.`
          : `Send the new stock count for <b>${esc(item.name)}</b> (now ${item.stock}), or /cancel.`,
        reply_markup: { force_reply: true, input_field_placeholder: action === 'price' ? '29.99' : '20' },
      });
      return null;

    case 'toggle': {
      const updated = await setActive(item, !item.active);
      await editView(message, await itemView(updated, user));
      return updated.active ? 'Listed' : 'Hidden';
    }

    case 'del':
      await editView(message, {
        text: `🗑 Delete <b>${esc(item.name)}</b>? Sales history is kept.`,
        reply_markup: confirmKeyboard(item, 'delok', '🗑 Yes, delete'),
      });
      return null;

    case 'delok': {
      await deleteItem(item);
      const ownList = await listItems(isAdmin(user.id) && item.ownerId !== user.id ? item.ownerId : user.id);
      await editView(message, itemsView(ownList));
      return 'Deleted';
    }

    default:
      return null;
  }
}

async function handleRegistration(user, [, rawId, decision]) {
  if (!isAdmin(user.id)) return { toast: 'Admins only.' };
  const target = await getUser(rawId);
  if (!target) return { toast: 'User not found.' };
  const status = decision === 'ok' ? await approveUser(target) : await rejectUser(target);
  return { status };
}

export default async function (query) {
  let toast = null;
  try {
    const user = await touchUser(query.from);
    const parts = (query.data || '').split(':');
    const { message } = query;

    if (user.role === 'banned') {
      toast = 'Your account is suspended.';
    } else if (parts[0] === 'reg') {
      const { toast: t, status } = await handleRegistration(user, parts);
      toast = t ?? null;
      if (status && message) {
        await editView(message, { text: `${esc(message.text)}\n\n${status}`, reply_markup: undefined });
      }
    } else if (!canSell(user)) {
      toast = 'Only approved artists can do that.';
    } else if (parts[0] === 'it' && message) {
      toast = await handleItem(query, user, parts);
    } else if (parts[0] === 'list' && message) {
      await editView(message, itemsView(await listItems(user.id)));
    } else if (parts[0] === 'set' && message) {
      const field = parts[1] === 'sales' ? 'notifySales' : 'notifyStock';
      const updated = await updateUser(user.id, { [field]: !user[field] });
      await editView(message, settingsView(updated));
    }
  } finally {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: toast ?? undefined });
  }
}
