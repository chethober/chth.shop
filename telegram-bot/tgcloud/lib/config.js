// The runtime has no environment variables, so configuration lives here.

/** Telegram user ids with admin rights. Compare as numbers: `from.id` is a number. */
export const ADMIN_IDS = [6330862227];

export const SHOP_URL = 'https://chth.shop';

/**
 * Where the /login button sends people; Telegram appends their signed user data.
 * Its domain must be the one linked to the bot in @BotFather (Bot Settings → Domain),
 * otherwise Telegram shows "Bot domain invalid".
 */
export const LOGIN_CALLBACK_URL = `${SHOP_URL}/api/auth/telegram/bot/callback`;

export const CURRENCY_SYMBOL = '$';

/** Low-stock threshold for new items. */
export const DEFAULT_LOW_STOCK = 3;

export const MAX_PRICE_CENTS = 10_000_000; // $100,000
export const MAX_STOCK = 1_000_000;

export function isAdmin(userId) {
  return ADMIN_IDS.includes(Number(userId));
}
