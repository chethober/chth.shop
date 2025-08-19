const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.product.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const user1 = await prisma.user.create({
    data: {
      username: 'cosmic_artist',
      email: 'cosmic@example.com',
      password: await bcrypt.hash('password123', 12)
    }
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'street_designer',
      email: 'street@example.com',
      password: await bcrypt.hash('password123', 12)
    }
  });

  console.log('👥 Created users');

  // Create artist profiles
  const artist1 = await prisma.artist.create({
    data: {
      userId: user1.id,
      bio: 'Creating cosmic-inspired designs that transport you to other dimensions.',
      storeName: 'Cosmic Creations'
    }
  });

  const artist2 = await prisma.artist.create({
    data: {
      userId: user2.id,
      bio: 'Urban street art meets contemporary fashion. Bold designs for bold people.',
      storeName: 'Street Style Studio'
    }
  });

  console.log('🎨 Created artist profiles');

  // Create products
  const products = [
    {
      name: 'Galaxy Dreams Tee',
      type: 'tshirt',
      price: 29.99,
      imageUrl: 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Galaxy+Tee',
      artistId: user1.id
    },
    {
      name: 'Urban Vibes Hoodie',
      type: 'hoodie',
      price: 59.99,
      imageUrl: 'https://via.placeholder.com/400x400/10b981/ffffff?text=Urban+Hoodie',
      artistId: user2.id
    },
    {
      name: 'Comfort Zone Pants',
      type: 'pants',
      price: 45.99,
      imageUrl: 'https://via.placeholder.com/400x400/f59e0b/ffffff?text=Comfort+Pants',
      artistId: user1.id
    },
    {
      name: 'Neon Nights Tee',
      type: 'tshirt',
      price: 34.99,
      imageUrl: 'https://via.placeholder.com/400x400/ec4899/ffffff?text=Neon+Tee',
      artistId: user2.id
    },
    {
      name: 'Cozy Vibes Hoodie',
      type: 'hoodie',
      price: 64.99,
      imageUrl: 'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Cozy+Hoodie',
      artistId: user1.id
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

  console.log('🛍️  Created products');

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Seed Summary:');
  console.log(`   👥 Users: ${await prisma.user.count()}`);
  console.log(`   🎨 Artists: ${await prisma.artist.count()}`);
  console.log(`   🛍️  Products: ${await prisma.product.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 