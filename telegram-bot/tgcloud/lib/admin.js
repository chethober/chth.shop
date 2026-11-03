// Admin-only commands; handlers/message.js checks isAdmin() before routing here.

import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { users, items } from '../schema.js';
import { ADMIN_IDS, isAdmin } from './config.js';
import { esc, money, parseCount, itemLine, displayName } from './format.js';
import { getUser, updateUser } from './users.js';
import { send } from './notify.js';
import { listItems, listLowStock, salesSummary, recentSales } from './inventory.js';
import { itemsView, registrationKeyboard } from './ui.js';
import { setupMenus, setArtistMenu, resetMenu } from './menu.js';
import { summaryText, parseDays } from './artist.js';

async function targetUser(ctx, usage) {
  const id = parseCount(ctx.args[0]);
  const target = id == null ? null : await getUser(id);
  if (!target) {
    await ctx.reply(id == null ? `Usage: <code>${esc(usage)}</code>` : `No user <code>${id}</code> has used the bot yet.`);
    return null;
  }
  return target;
}

export async function dashboard(ctx) {
  const counts = await db.get(sql`
    SELECT
      (SELECT count(*) FROM users WHERE role = 'artist')  AS artists,
      (SELECT count(*) FROM users WHERE role = 'pending') AS pending,
      (SELECT count(*) FROM items WHERE active = 1)       AS items,
      (SELECT coalesce(sum(stock), 0) FROM items WHERE active = 1) AS units`);
  const low = await listLowStock(null);
  const today = await salesSummary({ ownerId: null, days: 1 });
  const week = await salesSummary({ ownerId: null, days: 7 });

  await ctx.reply([
    '🛠 <b>Admin dashboard</b>',
    '',
    `🎨 Artists: <b>${counts.artists}</b> · Pending: <b>${counts.pending}</b>${counts.pending ? ' → /pending' : ''}`,
    `📦 Listed items: <b>${counts.items}</b> · Units in stock: <b>${counts.units}</b>`,
    `⚠️ Low / sold out: <b>${low.length}</b>`,
    '',
    `💰 24h: <b>${money(today.revenue)}</b> (${today.units} units)`,
    `💰 7d: <b>${money(week.revenue)}</b> (${week.units} units)`,
    '',
    '/artists · /allitems · /stats · /recent · /broadcast',
  ].join('\n'));
}

export async function pending(ctx) {
  const list = await db.select().from(users).where(eq(users.role, 'pending')).orderBy(users.createdAt).all();
  if (list.length === 0) return ctx.reply('No pending applications.');
  for (const user of list) {
    await ctx.reply(
      `🆕 ${esc(displayName(user))}\nUser id: <code>${user.id}</code>`,
      { reply_markup: registrationKeyboard(user.id) },
    );
  }
}

export async function artists(ctx) {
  const rows = await db.all(sql`
    SELECT u.id, u.username, u.first_name, u.store_name, u.role, u.reachable,
      (SELECT count(*) FROM items i WHERE i.owner_id = u.id) AS item_count,
      (SELECT coalesce(sum(s.total_cents), 0) FROM sales s
         WHERE s.owner_id = u.id AND s.created_at >= unixepoch() - 30 * 86400) AS revenue_30d
    FROM users u WHERE u.role IN ('artist', 'banned')
    ORDER BY u.role, revenue_30d DESC`);
  if (rows.length === 0) return ctx.reply('No artists yet.');

  const lines = rows.map((r) => {
    const name = displayName({ id: r.id, username: r.username, firstName: r.first_name, storeName: r.store_name });
    const flags = `${r.role === 'banned' ? ' 🚫 banned' : ''}${r.reachable ? '' : ' 🔇 blocked bot'}`;
    return `• ${esc(name)} <code>${r.id}</code>${flags}\n   ${r.item_count} items · ${money(r.revenue_30d)} / 30d`;
  });
  await ctx.reply(`🎨 <b>Artists</b>\n\n${lines.join('\n')}\n\n/allitems &lt;id&gt; to see an artist's items.`);
}

/** Shared by /approve and the Approve button. Returns a status line for the admin. */
export async function approveUser(target) {
  if (isAdmin(target.id)) return 'Admins can already sell.';
  if (target.role === 'artist') return `${esc(displayName(target))} is already an artist.`;
  await updateUser(target.id, { role: 'artist', storeName: target.storeName || target.firstName || `Store ${target.id}` });
  try { await setArtistMenu(target.id); } catch (error) { console.warn('menu', error.description); }
  await send(target.id, '🎉 <b>You\'re approved!</b>\nAdd your first item with /additem, then see /help for everything else.');
  return `✅ Approved ${esc(displayName(target))}.`;
}

export async function rejectUser(target) {
  if (target.role !== 'pending') return `${esc(displayName(target))} has no pending application.`;
  await updateUser(target.id, { role: 'guest' });
  await send(target.id, 'Your artist application wasn\'t approved this time. Reach out to the CHTH team for details.');
  return `❌ Rejected ${esc(displayName(target))}.`;
}

export async function approve(ctx) {
  const target = await targetUser(ctx, '/approve <user id>');
  if (target) await ctx.reply(await approveUser(target));
}

export async function ban(ctx) {
  const target = await targetUser(ctx, '/ban <user id>');
  if (!target) return;
  if (isAdmin(target.id)) return ctx.reply('Admins can\'t be banned here — remove them from ADMIN_IDS instead.');
  await updateUser(target.id, { role: 'banned' });
  // Hide their items so they disappear from listings and low-stock reports.
  await db.update(items).set({ active: false, updatedAt: new Date() }).where(eq(items.ownerId, target.id));
  try { await resetMenu(target.id); } catch (error) { console.warn('menu', error.description); }
  await ctx.reply(`🚫 Banned ${esc(displayName(target))}; their items are hidden.`);
}

export async function unban(ctx) {
  const target = await targetUser(ctx, '/unban <user id>');
  if (!target) return;
  if (target.role !== 'banned') return ctx.reply(`${esc(displayName(target))} isn't banned.`);
  await ctx.reply(await approveUser({ ...target, role: 'guest' }));
  await ctx.reply('Their items stay hidden until they re-list them from /items.');
}

export async function allitems(ctx) {
  const ownerId = ctx.args[0] == null ? null : parseCount(ctx.args[0]);
  if (ctx.args[0] != null && ownerId == null) return ctx.reply('Usage: <code>/allitems [user id]</code>');

  const list = await listItems(ownerId);
  const owner = ownerId == null ? null : await getUser(ownerId);
  const title = owner ? `📦 <b>${esc(displayName(owner))}</b>` : '📦 <b>All items</b>';
  const view = itemsView(list, { title });
  await ctx.reply(view.text, { reply_markup: view.reply_markup });
}

export async function stats(ctx) {
  const days = parseDays(ctx.args[0], 30);
  if (!days) return ctx.reply('Usage: <code>/stats [days]</code>');
  const summary = await salesSummary({ ownerId: null, days });

  const byArtist = await db.all(sql`
    SELECT s.owner_id, max(u.store_name) AS store, sum(s.total_cents) AS revenue, sum(s.qty) AS units
    FROM sales s LEFT JOIN users u ON u.id = s.owner_id
    WHERE s.created_at >= unixepoch() - ${days * 86400}
    GROUP BY s.owner_id ORDER BY revenue DESC LIMIT 10`);

  let text = summaryText(summary, days);
  if (byArtist.length) {
    text += '\n\n<b>Top artists</b>\n' + byArtist
      .map((r, i) => `${i + 1}. ${esc(r.store || r.owner_id)} — ${money(r.revenue)} · ${r.units} units`)
      .join('\n');
  }
  const low = await listLowStock(null);
  if (low.length) {
    text += `\n\n<b>Low stock (${low.length})</b>\n` + low.slice(0, 10).map(itemLine).join('\n');
  }
  await ctx.reply(text);
}

export async function recent(ctx) {
  const list = await recentSales({ ownerId: null, limit: 15 });
  if (list.length === 0) return ctx.reply('No sales yet.');
  const lines = list.map((s) => {
    const when = s.createdAt.toISOString().slice(0, 16).replace('T', ' ');
    return `${when} · ${s.qty} × ${esc(s.itemName)} · <b>${money(s.totalCents)}</b> · <code>${s.ownerId}</code>`;
  });
  await ctx.reply(`🧾 <b>Latest sales</b> (UTC)\n\n${lines.join('\n')}`);
}

export async function broadcast(ctx) {
  const body = ctx.args.join(' ').trim();
  if (!body) return ctx.reply('Usage: <code>/broadcast &lt;message&gt;</code> — sent to every approved artist.');

  const targets = await db.select({ id: users.id }).from(users)
    .where(sql`${users.role} = 'artist' AND ${users.reachable} = 1`).all();
  let delivered = 0;
  for (const { id } of targets) {
    if (await send(id, `📢 <b>CHTH</b>\n\n${esc(body)}`)) delivered += 1;
  }
  await ctx.reply(`📢 Delivered to ${delivered}/${targets.length} artists.`);
}

export async function setup(ctx) {
  const result = await setupMenus();
  await ctx.reply(
    `✅ Command menus installed: default, ${result.artistMenus} artist(s), ${result.adminMenus}/${ADMIN_IDS.length} admin(s).`
    + '\nReopen the chat if the menu doesn\'t refresh.',
  );
}

