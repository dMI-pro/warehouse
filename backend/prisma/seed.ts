import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  console.log('🚦 Creating user statuses...');
  await prisma.userStatus.upsert({
    where: { code: 'active' },
    update: {},
    create: {
      code: 'active',
      name: 'Активный',
      description: 'Пользователь имеет доступ к системе',
    },
  });
  await prisma.userStatus.upsert({
    where: { code: 'blocked' },
    update: {},
    create: {
      code: 'blocked',
      name: 'Заблокированный',
      description: 'Доступ к системе ограничен',
    },
  });
  console.log('✅ User statuses created/verified');

  console.log('👤 Creating super admin...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@company.com',
      username: 'nachalnik',
      password: await bcrypt.hash('Csi026060iks$', 10),
      role: 'ADMIN',
      fullName: 'Super Admin',
      isSuperAdmin: true,
      status: {
        connect: { code: 'active' },
      },
    },
  });
  console.log('✅ Super admin created:', superAdmin.email);

  console.log('🏷️ Creating categories...');
  const porcelain = await prisma.category.create({
    data: { name: 'Фарфор' },
  });
  const officeSupplies = await prisma.category.create({
    data: { name: 'Серебро' },
  });
  console.log('✅ Categories created:', porcelain.name, officeSupplies.name);

  console.log('💳 Creating transaction types...');
  const saleType = await prisma.transactionType.create({
    data: { name: 'Выкуп' },
  });
  const returnType = await prisma.transactionType.create({
    data: { name: 'Комиссия' },
  });
  console.log('✅ Transaction types created:', saleType.name, returnType.name);

  console.log('📦 Creating products...');
  const products = [
    {
      name: 'Конь фарфор',
      sku: 'kon-farfor',
      description: 'Конь фарфор, высота 15 см',
      purchasePrice: new Prisma.Decimal(5000),
      salePrice: new Prisma.Decimal(10000),
      quantity: 1,
      categoryId: porcelain.id,
      transactionTypeId: saleType.id,
    },
    // {
    //   name: 'Мышь беспроводная',
    //   sku: 'SKU-WIRELESS-MOUSE',
    //   description: 'Беспроводная мышь с высокой чувствительностью',
    //   purchasePrice: new Prisma.Decimal(2000),
    //   salePrice: new Prisma.Decimal(2500),
    //   quantity: 50,
    //   categoryId: porcelain.id,
    //   transactionTypeId: saleType.id,
    //   images: ['wireless-mouse.jpg'],
    // },
    // {
    //   name: 'Клавиатура механическая',
    //   sku: 'SKU-MECH-KEYBOARD',
    //   description: 'Механическая клавиатура с RGB подсветкой',
    //   purchasePrice: new Prisma.Decimal(8000),
    //   salePrice: new Prisma.Decimal(9500),
    //   quantity: 30,
    //   categoryId: porcelain.id,
    //   transactionTypeId: saleType.id,
    //   images: ['mechanical-keyboard.jpg'],
    // },
    // {
    //   name: 'Бумага A4',
    //   sku: 'SKU-A4-PAPER-80G',
    //   description: 'Бумага формата A4, 80 г/м²',
    //   purchasePrice: new Prisma.Decimal(120),
    //   salePrice: new Prisma.Decimal(150),
    //   quantity: 200,
    //   categoryId: officeSupplies.id,
    //   transactionTypeId: returnType.id,
    //   images: ['a4-paper.jpg'],
    // },
    // {
    //   name: 'Ручка шариковая',
    //   sku: 'SKU-BALL-PEN-BLUE',
    //   description: 'Шариковая ручка с синей пастой',
    //   purchasePrice: new Prisma.Decimal(35),
    //   salePrice: new Prisma.Decimal(50),
    //   quantity: 100,
    //   categoryId: officeSupplies.id,
    //   transactionTypeId: returnType.id,
    //   images: ['pen.jpg'],
    // },
  ];

  const createdProducts: { id: number; name: string }[] = [];
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });
    createdProducts.push(product);
    console.log(`✅ Product created: ${product.name} (SKU: ${product.id})`);
  }

  console.log('📦 Creating warehouses...');
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Интер',
      description: 'Основной склад для хранения товаров',
      address: 'ул. Примерная, д. 1',
    },
  });
  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Ленина',
      description: 'Резервный склад для хранения товаров',
      address: 'ул. Резервная, д. 2',
    },
  });
  console.log('✅ Warehouses created:', warehouse1.name, warehouse2.name);

  console.log('🤝 Creating committees...');
  const committee1 = await prisma.committee.create({
    data: {
      name: 'Про Людмила',
      description: 'Поставщик электроники',
      contactInfo: 'contact@technoservice.ru, +7 (495) 123-45-67',
    },
  });
  const committee2 = await prisma.committee.create({
    data: {
      name: 'А Агент',
      description: 'Поставщик канцелярских товаров',
      contactInfo: 'info@kantorg.ru, +7 (495) 987-65-43',
    },
  });
  console.log('✅ Committees created:', committee1.name, committee2.name);

  // console.log('💰 Creating sales...');
  // const sale1 = await prisma.sale.create({
  //   data: {
  //     productId: createdProducts[0].id,
  //     quantity: 2,
  //     salePrice: new Prisma.Decimal(120000),
  //     soldBy: superAdmin.id,
  //   },
  // });
  // const sale2 = await prisma.sale.create({
  //   data: {
  //     productId: createdProducts[2].id,
  //     quantity: 1,
  //     salePrice: new Prisma.Decimal(9500),
  //     soldBy: superAdmin.id,
  //   },
  // });
  // console.log('✅ Sales created:', sale1.productId, sale2.productId);

  // console.log('🔄 Creating returns...');
  // const return1 = await prisma.return.create({
  //   data: {
  //     productId: createdProducts[1].id,
  //     quantity: 1,
  //     reason: 'Бракованный товар',
  //     returnedBy: superAdmin.id,
  //   },
  // });
  // const return2 = await prisma.return.create({
  //   data: {
  //     productId: createdProducts[3].id,
  //     quantity: 10,
  //     reason: 'Изменение заказа',
  //     returnedBy: superAdmin.id,
  //   },
  // });
  // console.log('✅ Returns created:', return1.productId, return2.productId);

  // console.log('📝 Creating audit logs...');
  // await prisma.auditLog.create({
  //   data: {
  //     userId: superAdmin.id,
  //     action: 'login',
  //     entityType: 'Auth',
  //     success: true,
  //     ipAddress: '127.0.0.1',
  //     userAgent: 'seed-script',
  //   },
  // });
  // await prisma.auditLog.create({
  //   data: {
  //     userId: superAdmin.id,
  //     action: 'product.create',
  //     entityType: 'Product',
  //     entityId: createdProducts[0].id,
  //     newValues: { name: createdProducts[0].name },
  //     success: true,
  //   },
  // });
  // await prisma.auditLog.create({
  //   data: {
  //     userId: superAdmin.id,
  //     action: 'sale.create',
  //     entityType: 'Sale',
  //     entityId: sale1.id,
  //     newValues: { productId: sale1.productId, quantity: sale1.quantity },
  //     success: true,
  //   },
  // });
  // await prisma.auditLog.create({
  //   data: {
  //     userId: superAdmin.id,
  //     action: 'return.create',
  //     entityType: 'Return',
  //     entityId: return1.id,
  //     newValues: { productId: return1.productId, quantity: return1.quantity },
  //     success: true,
  //   },
  // });

  // console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
