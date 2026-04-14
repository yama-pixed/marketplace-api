import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: userPassword,
      name: 'Alice Smith',
      role: 'USER',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: userPassword,
      name: 'Bob Jones',
      role: 'USER',
    },
  });

  // Create items (alice sells items 1-3, bob sells item 4)
  const laptop = await prisma.item.create({
    data: {
      title: 'Laptop',
      description: 'A powerful laptop for developers',
      price: 1200.0,
      quantity: 5,
      sellerId: alice.id,
    },
  });

  const headphones = await prisma.item.create({
    data: {
      title: 'Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones',
      price: 250.0,
      quantity: 10,
      sellerId: alice.id,
    },
  });

  const keyboard = await prisma.item.create({
    data: {
      title: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard, Cherry MX switches',
      price: 150.0,
      quantity: 8,
      sellerId: alice.id,
    },
  });

  const monitor = await prisma.item.create({
    data: {
      title: '4K Monitor',
      description: '27-inch 4K IPS display',
      price: 600.0,
      quantity: 3,
      sellerId: bob.id,
    },
  });

  // Create an order (bob buys from alice)
  const order = await prisma.order.create({
    data: {
      buyerId: bob.id,
      status: 'CONFIRMED',
      total: 1450.0,
      orderItems: {
        create: [
          { itemId: laptop.id, quantity: 1, price: 1200.0 },
          { itemId: headphones.id, quantity: 1, price: 250.0 },
        ],
      },
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin  → email: admin@example.com  | password: Admin123!');
  console.log('  Alice  → email: alice@example.com  | password: Password123!');
  console.log('  Bob    → email: bob@example.com    | password: Password123!');
  console.log('\n📦 Sample Data:');
  console.log(`  Users: ${[admin, alice, bob].map(u => `${u.name} (id: ${u.id})`).join(', ')}`);
  console.log(`  Items: Laptop (id: ${laptop.id}), Headphones (id: ${headphones.id}), Keyboard (id: ${keyboard.id}), Monitor (id: ${monitor.id})`);
  console.log(`  Orders: Order id: ${order.id} (Bob bought Laptop + Headphones from Alice)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
