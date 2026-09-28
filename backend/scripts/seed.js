// Resets the database to a small set of demo artists and products.
require('../src/config/env');
const prisma = require('../src/lib/prisma');

const ARTISTS = [
  {
    user: { username: 'cosmic_artist', email: 'cosmic@example.com' },
    profile: {
      storeName: 'Cosmic Creations',
      bio: 'Creating cosmic-inspired designs that transport you to other dimensions.',
    },
    products: [
      { name: 'Galaxy Dreams Tee', type: 'tshirt', price: 29.99, imageUrl: '/tshirt.jpg' },
      { name: 'Comfort Zone Pants', type: 'pants', price: 45.99, imageUrl: '/pants.png' },
      { name: 'Cozy Vibes Hoodie', type: 'hoodie', price: 64.99, imageUrl: '/hoodie.jpg' },
    ],
  },
  {
    user: { username: 'street_designer', email: 'street@example.com' },
    profile: {
      storeName: 'Street Style Studio',
      bio: 'Urban street art meets contemporary fashion. Bold designs for bold people.',
    },
    products: [
      { name: 'Urban Vibes Hoodie', type: 'hoodie', price: 59.99, imageUrl: '/hoodie.jpg' },
      { name: 'Neon Nights Tee', type: 'tshirt', price: 34.99, imageUrl: '/tshirt.jpg' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Orders reference products without cascading, so they go first.
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  for (const { user, profile, products } of ARTISTS) {
    await prisma.user.create({
      data: {
        ...user,
        isArtist: true,
        artist: { create: { ...profile, products: { create: products } } },
      },
    });
  }

  console.log('✅ Seeded:', {
    users: await prisma.user.count(),
    artists: await prisma.artist.count(),
    products: await prisma.product.count(),
  });
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
