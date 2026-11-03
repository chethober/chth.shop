import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';
import { ADMIN_IDS } from './config.js';

// [command, description] — drives both /help and the Telegram command menu.
export const GUEST_COMMANDS = [
  ['start', 'Welcome and status'],
  ['login', 'Sign in to chth.shop'],
  ['register', 'Apply as an artist: /register <store name>'],
  ['help', 'All commands'],
];

export const ARTIST_COMMANDS = [
  ['login', 'Sign in to chth.shop'],
  ['items', 'Your items, stock and prices'],
  ['additem', 'Add an item'],
  ['sale', 'Record a sale: /sale <id> [qty] [price]'],
  ['price', 'Change price: /price <id> <price>'],
  ['stock', 'Set stock: /stock <id> <qty>'],
  ['restock', 'Add stock: /restock <id> <qty>'],
  ['threshold', 'Low-stock alert level: /threshold <id> <n>'],
  ['rename', 'Rename: /rename <id> <name>'],
  ['lowstock', 'Items running low'],
  ['sales', 'Sales report: /sales [days]'],
  ['settings', 'Notification settings'],
  ['help', 'All commands'],
  ['cancel', 'Cancel the current step'],
];

export const ADMIN_COMMANDS = [
  ['admin', 'Admin dashboard'],
  ['pending', 'Artist applications'],
  ['artists', 'All artists'],
  ['approve', 'Approve an artist: /approve <user id>'],
  ['ban', 'Ban a user: /ban <user id>'],
  ['unban', 'Unban a user: /unban <user id>'],
  ['allitems', 'Every item, or one artist\'s: /allitems [user id]'],
  ['stats', 'Shop-wide sales: /stats [days]'],
  ['recent', 'Latest sales across the shop'],
  ['broadcast', 'Message all artists: /broadcast <text>'],
  ['setup', 'Refresh the bot command menus'],
];

const toBotCommands = (list) => list.map(([command, description]) => ({ command, description }));

export async function setArtistMenu(userId) {
  await api.setMyCommands({
    commands: toBotCommands(ARTIST_COMMANDS),
    scope: { type: 'chat', chat_id: userId },
  });
}

export async function resetMenu(userId) {
  await api.deleteMyCommands({ scope: { type: 'chat', chat_id: userId } });
}

/** Default menu for everyone, artist menu per artist, full menu per admin. */
export async function setupMenus() {
  await api.setMyCommands({ commands: toBotCommands(GUEST_COMMANDS) });

  const artists = await db.select({ id: users.id }).from(users).where(eq(users.role, 'artist')).all();
  let artistMenus = 0;
  for (const { id } of artists) {
    if (ADMIN_IDS.includes(id)) continue;
    try {
      await setArtistMenu(id);
      artistMenus += 1;
    } catch (error) {
      console.warn('artist menu not set', { id, description: error.description });
    }
  }

  const adminMenu = toBotCommands([...ARTIST_COMMANDS, ...ADMIN_COMMANDS]);
  let adminMenus = 0;
  for (const id of ADMIN_IDS) {
    try {
      // Fails with "chat not found" until that admin has pressed /start.
      await api.setMyCommands({ commands: adminMenu, scope: { type: 'chat', chat_id: id } });
      adminMenus += 1;
    } catch (error) {
      console.warn('admin menu not set', { id, description: error.description });
    }
  }
  return { artistMenus, adminMenus };
}
