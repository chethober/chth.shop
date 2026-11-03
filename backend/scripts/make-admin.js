// Grants (or with --revoke, removes) platform admin rights: `npm run make-admin -- <username> [--revoke]`.
require('../src/config/env');
const prisma = require('../src/lib/prisma');

async function main() {
  const [username, flag] = process.argv.slice(2);
  if (!username) {
    console.error('Usage: npm run make-admin -- <username> [--revoke]');
    process.exit(1);
  }

  const role = flag === '--revoke' ? 'CUSTOMER' : 'ADMIN';
  const user = await prisma.user.update({ where: { username }, data: { role } }).catch(() => null);
  if (!user) {
    console.error(`No user named "${username}"`);
    process.exit(1);
  }
  console.log(`${user.username} is now ${role}`);
}

main().finally(() => prisma.$disconnect());
