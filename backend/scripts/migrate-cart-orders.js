const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCartAndOrders() {
  try {
    console.log('Starting migration for cart and orders...');

    // Check if tables already exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('carts', 'cart_items', 'orders', 'order_items')
    `;

    console.log('Existing tables:', existingTables);

    if (existingTables.length === 0) {
      console.log('No existing cart/order tables found. Running Prisma migration...');
      
      // Run Prisma migration
      const { execSync } = require('child_process');
      execSync('npx prisma migrate dev --name add_cart_orders', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('Migration completed successfully!');
    } else {
      console.log('Cart and order tables already exist. Skipping migration.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateCartAndOrders();
}

module.exports = { migrateCartAndOrders }; 