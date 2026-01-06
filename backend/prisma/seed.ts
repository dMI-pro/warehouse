import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Очистка существующих данных (опционально, для тестов)
  // console.log('🧹 Cleaning existing data...');
  // await prisma.auditLog.deleteMany();
  // await prisma.sale.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Создание супер-админа
  console.log('👤 Creating super admin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@warehouse.com',
      username: 'admin',
      password: hashedPassword,
      fullName: 'Super Administrator',
      role: 'ADMIN',
      isSuperAdmin: true,
    },
  });
  console.log('✅ Super admin created:', superAdmin.email);

  // 2. Создание категорий
  console.log('📁 Creating categories...');
  const category1 = await prisma.category.create({
    data: {
      name: 'Электроника',
      description: 'Электронные устройства и компоненты',
    },
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Офисные принадлежности',
      description: 'Канцелярские товары и офисное оборудование',
    },
  });

  console.log('✅ Categories created:', category1.name, category2.name);

  // 3. Создание типов транзакций
  console.log('🔁 Creating transaction types...');
  const existingTypes = await prisma.transactionType.findMany();
  if (existingTypes.length === 0) {
    const buyout = await prisma.transactionType.create({
      data: { name: 'Выкуп' },
    });
    const commission20 = await prisma.transactionType.create({
      data: { name: 'Комиссия 20%' },
    });
    console.log('✅ Transaction types created:', buyout.name, commission20.name);
  } else {
    console.log('ℹ️ Transaction types already exist, skipping creation');
  }

  // 4. Создание тестовых товаров
  console.log('📦 Creating products...');
  const products = [
    {
      name: 'Ноутбук Dell XPS 15',
      sku: 'LAP-DELL-XPS15-001',
      description: '15-дюймовый ноутбук с процессором Intel i7, 16GB RAM, 512GB SSD',
      purchasePrice: 85000,
      salePrice: 120000,
      quantity: 5,
      minStockLevel: 2,
      categoryId: category1.id,
      images: [
        'https://example.com/images/laptop-dell-xps15-1.jpg',
        'https://example.com/images/laptop-dell-xps15-2.jpg',
      ],
    },
    {
      name: 'Мышь Logitech MX Master 3',
      sku: 'MOU-LOG-MX3-001',
      description: 'Беспроводная мышь для продуктивной работы',
      purchasePrice: 3500,
      salePrice: 5500,
      quantity: 25,
      minStockLevel: 10,
      categoryId: category1.id,
      images: ['https://example.com/images/mouse-logitech-mx3.jpg'],
    },
    {
      name: 'Клавиатура механическая Keychron K2',
      sku: 'KEY-KEY-K2-001',
      description: 'Механическая клавиатура с подсветкой, Bluetooth',
      purchasePrice: 6500,
      salePrice: 9500,
      quantity: 15,
      minStockLevel: 5,
      categoryId: category1.id,
      images: ['https://example.com/images/keyboard-keychron-k2.jpg'],
    },
    {
      name: 'Бумага офисная А4',
      sku: 'PAP-A4-500-001',
      description: 'Офисная бумага А4, 500 листов, плотность 80г/м²',
      purchasePrice: 250,
      salePrice: 450,
      quantity: 100,
      minStockLevel: 30,
      categoryId: category2.id,
      images: ['https://example.com/images/paper-a4.jpg'],
    },
    {
      name: 'Ручка шариковая синяя',
      sku: 'PEN-BLUE-001',
      description: 'Шариковая ручка синего цвета, упаковка 12 штук',
      purchasePrice: 120,
      salePrice: 250,
      quantity: 200,
      minStockLevel: 50,
      categoryId: category2.id,
      images: ['https://example.com/images/pen-blue.jpg'],
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });
    console.log(`✅ Product created: ${product.name} (SKU: ${product.sku})`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

