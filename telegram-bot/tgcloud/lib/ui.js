import { api, BotApiError } from 'sdk';
import { itemCard, itemLine, esc } from './format.js';
import { getUser } from './users.js';

const MAX_LIST_BUTTONS = 40;
const MAX_LIST_CHARS = 3600; // Telegram rejects messages over 4096 characters

export function itemKeyboard(item) {
  const id = item.id;
  return {
    inline_keyboard: [
      [
        { text: '−1', callback_data: `it:${id}:inc:-1` },
        { text: '+1', callback_data: `it:${id}:inc:1` },
        { text: '+10', callback_data: `it:${id}:inc:10` },
        { text: '📦 Set', callback_data: `it:${id}:stock` },
      ],
      [
        { text: '💰 Sell 1', callback_data: `it:${id}:sell` },
        { text: '💵 Price', callback_data: `it:${id}:price` },
      ],
      [
        { text: item.active ? '🙈 Hide' : '👁 List', callback_data: `it:${id}:toggle` },
        { text: '🗑 Delete', callback_data: `it:${id}:del` },
      ],
      [{ text: '« All items', callback_data: 'list' }],
    ],
  };
}

export function confirmKeyboard(item, action, label) {
  return {
    inline_keyboard: [[
      { text: label, callback_data: `it:${item.id}:${action}` },
      { text: 'Cancel', callback_data: `it:${item.id}:view` },
    ]],
  };
}

export async function itemView(item, viewer) {
  // Admins looking at someone else's item also see whose it is.
  const owner = item.ownerId !== viewer.id ? await getUser(item.ownerId) : null;
  return { text: itemCard(item, owner), reply_markup: itemKeyboard(item) };
}

export function itemsView(list, { title = '📦 <b>Your items</b>' } = {}) {
  if (list.length === 0) {
    return { text: `${title}\n\nNo items yet. Add one with /additem.`, reply_markup: undefined };
  }

  const buttons = list.slice(0, MAX_LIST_BUTTONS).map((item) => ({
    text: `#${item.id} ${item.name}`.slice(0, 40),
    callback_data: `it:${item.id}:view`,
  }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));

  const lines = [];
  let length = 0;
  for (const item of list) {
    const line = itemLine(item);
    if (length + line.length > MAX_LIST_CHARS) break;
    lines.push(line);
    length += line.length + 1;
  }
  const more = list.length > lines.length ? `\n…and ${list.length - lines.length} more` : '';
  return {
    text: `${title}\n\n${lines.join('\n')}${more}\n\nTap an item to manage it.`,
    reply_markup: { inline_keyboard: rows },
  };
}

/** Replaces a message's text and keyboard, ignoring "message is not modified". */
export async function editView(message, view) {
  try {
    await api.editMessageText({
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: view.text,
      parse_mode: 'HTML',
      reply_markup: view.reply_markup,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    if (!(error instanceof BotApiError) || !/not modified/i.test(error.description)) throw error;
  }
}

export function settingsView(user) {
  const mark = (on) => (on ? '🔔 on' : '🔕 off');
  return {
    text: [
      '⚙️ <b>Notifications</b>',
      '',
      `Sales: ${mark(user.notifySales)}`,
      `Stock alerts: ${mark(user.notifyStock)}`,
      '',
      `Store: <b>${esc(user.storeName || '—')}</b>`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[
        { text: `Sales ${user.notifySales ? '🔔' : '🔕'}`, callback_data: 'set:sales' },
        { text: `Stock ${user.notifyStock ? '🔔' : '🔕'}`, callback_data: 'set:stock' },
      ]],
    },
  };
}

export function registrationKeyboard(userId) {
  return {
    inline_keyboard: [[
      { text: '✅ Approve', callback_data: `reg:${userId}:ok` },
      { text: '❌ Reject', callback_data: `reg:${userId}:no` },
    ]],
  };
}
