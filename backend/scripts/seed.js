// Resets the database to a small set of demo artists, merchants and products.
require('../src/config/env');
const prisma = require('../src/lib/prisma');

const STORES = [
  {
    user: { username: 'cosmic_artist', email: 'cosmic@example.com' },
    store: {
      kind: 'ARTIST',
      storeName: 'Cosmic Creations',
      bio: 'Creating cosmic-inspired designs that transport you to other dimensions.',
    },
    products: [
      { name: 'Galaxy Dreams Tee', type: 'tshirt', price: 29.99, imageUrl: '/tshirt.jpg', customizable: true },
      { name: 'Comfort Zone Pants', type: 'pants', price: 45.99, imageUrl: '/pants.png' },
      { name: 'Cozy Vibes Hoodie', type: 'hoodie', price: 64.99, imageUrl: '/hoodie.jpg' },
      { name: 'Nebula Morning Mug', type: 'mug', price: 19.99, imageUrl: '/mug.svg', customizable: true },
      {
        name: 'Genesis Hoodie (1 of 50)',
        description: 'Limited run of 50. Each one ships with a numbered NFT certificate on TON.',
        type: 'hoodie',
        price: 89,
        imageUrl: '/hoodie.jpg',
        nftBacked: true,
        editionSize: 50,
      },
      {
        name: 'Eclipse Poster',
        description: 'Timed drop: 7 days only.',
        type: 'poster',
        price: 30,
        imageUrl: '/products/poster.svg',
        dropStartsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dropEndsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    user: { username: 'street_designer', email: 'street@example.com' },
    store: {
      kind: 'ARTIST',
      storeName: 'Street Style Studio',
      bio: 'Urban street art meets contemporary fashion. Bold designs for bold people.',
    },
    products: [
      { name: 'Urban Vibes Hoodie', type: 'hoodie', price: 59.99, imageUrl: '/hoodie.jpg' },
      { name: 'Neon Nights Tee', type: 'tshirt', price: 34.99, imageUrl: '/tshirt.jpg' },
      { name: 'Tag Cap', type: 'hat', price: 27.99, imageUrl: '/hat.svg', customizable: true },
      { name: 'Wildstyle Sticker', type: 'sticker', price: 4.5, imageUrl: '/products/sticker.svg' },
      { name: 'Street Case', type: 'phonecase', price: 26, imageUrl: '/products/phonecase.svg', customizable: true },
    ],
  },
  {
    user: { username: 'block_coffee', email: 'merch@blockcoffee.example' },
    store: {
      kind: 'MERCHANT',
      storeName: 'Block Coffee Co.',
      bio: 'Specialty coffee roasters. Official merch, paid on-chain.',
    },
    products: [
      { name: 'Block Coffee Mug', type: 'mug', price: 16, imageUrl: '/mug.svg', sizes: ['11oz', '15oz'] },
      { name: 'Barista Cap', type: 'hat', price: 24, imageUrl: '/hat.svg' },
      { name: 'Beans Tote', type: 'tote', price: 21, imageUrl: '/tote.svg' },
      { name: 'Staff Tee', type: 'tshirt', price: 28, imageUrl: '/tshirt.jpg', colors: ['#121212', '#FFFFFF'] },
      { name: 'To-Go Cups (50-pack)', type: 'cup', price: 32, imageUrl: '/products/cup.svg', sizes: ['12oz', '16oz'] },
      { name: 'Block Bottle', type: 'bottle', price: 29, imageUrl: '/products/bottle.svg' },
      { name: 'Roaster Beanie', type: 'beanie', price: 22, imageUrl: '/products/beanie.svg' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  for (const { user, store, products } of STORES) {
    await prisma.user.create({
      data: {
        ...user,
        isSeller: true,
        store: { create: { ...store, products: { create: products } } },
      },
    });
  }

  console.log('✅ Seeded:', {
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    products: await prisma.product.count(),
  });
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
