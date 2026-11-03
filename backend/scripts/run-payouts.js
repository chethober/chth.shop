// Monthly payout run (e.g. cron `0 9 1 * *`): `npm run payouts` creates payouts for everyone whose
// payable balance reaches PAYOUT_MIN_USD and sends the USDT-on-TON ones from the platform wallet.
// `npm run payouts -- --dry-run` only prints balances.
require('../src/config/env');
const prisma = require('../src/lib/prisma');
const payouts = require('../src/services/payouts');

async function main() {
  if (process.argv.includes('--dry-run')) {
    for (const b of await payouts.balances()) {
      const to = b.destination ? `${b.destination.network} ${b.destination.address}` : 'no address';
      console.log(`${b.username.padEnd(20)} available $${b.available.toFixed(2)}  on hold $${b.onHold.toFixed(2)}  -> ${to}`);
    }
    return;
  }
  const { payouts: results, skipped } = await payouts.runPayouts();
  for (const p of results) console.log(`${p.status.padEnd(8)} $${p.amount.toFixed(2)} ${p.network} ${p.address}${p.error ? `  (${p.error})` : ''}`);
  for (const s of skipped) console.log(`SKIPPED  $${s.amount.toFixed(2)} @${s.username}: ${s.reason}`);
  console.log(`${results.length} payout(s), ${skipped.length} skipped`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
