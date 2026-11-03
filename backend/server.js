const env = require('./src/config/env');
const prisma = require('./src/lib/prisma');
const app = require('./src/app');
const { startTonPoller } = require('./src/services/payments');

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.port, () => {
      console.log(`🚀 API running at http://localhost:${env.port}/api`);
    });
    if (startTonPoller()) console.log(`💎 Watching TON payments to ${env.ton.receiverAddress} (${env.ton.network})`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
