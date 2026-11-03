import { CURRENCY_SYMBOL, MAX_PRICE_CENTS } from './config.js';

/** Escapes text for `parse_mode: 'HTML'`. Run every user-supplied string through this. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Formatted by hand: the isolate may ship without full ICU data for Intl.
export function money(cents) {
  const value = Number(cents) || 0;
  const [whole, fraction] = (Math.abs(value) / 100).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${value < 0 ? '-' : ''}${CURRENCY_SYMBOL}${grouped}.${fraction}`;
}

/** "25", "25.50", "$25,5" → cents; null when it isn't a valid price. */
export function parsePrice(input) {
  const cleaned = String(input ?? '').replace(/[$\s]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return cents > 0 && cents <= MAX_PRICE_CENTS ? cents : null;
}

/** Non-negative integer, or null. */
export function parseCount(input) {
  const cleaned = String(input ?? '').trim();
  if (!/^\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function displayName(user) {
  if (!user) return 'unknown';
  const name = user.storeName || user.firstName || `id ${user.id}`;
  return user.username ? `${name} (@${user.username})` : name;
}

export function stockBadge(item) {
  if (item.stock === 0) return '🚫';
  if (item.stock <= item.lowStock) return '⚠️';
  return '✅';
}

export function itemLine(item) {
  const hidden = item.active ? '' : ' · <i>hidden</i>';
  return `${stockBadge(item)} <b>#${item.id}</b> ${esc(item.name)} — ${money(item.priceCents)} · ${item.stock} left${hidden}`;
}

export function itemCard(item, owner) {
  const lines = [
    `${stockBadge(item)} <b>${esc(item.name)}</b>  <code>#${item.id}</code>`,
    '',
    `💵 Price: <b>${money(item.priceCents)}</b>`,
    `📦 Stock: <b>${item.stock}</b> (alert at ≤ ${item.lowStock})`,
    `👁 Status: ${item.active ? 'listed' : 'hidden'}`,
  ];
  if (owner) lines.push(`🎨 Artist: ${esc(displayName(owner))}`);
  return lines.join('\n');
}
