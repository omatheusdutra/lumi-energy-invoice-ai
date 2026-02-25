import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.tariffPlan.upsert({
    where: { name: 'Convencional' },
    update: {
      provider: 'seed',
      isActive: true,
    },
    create: {
      name: 'Convencional',
      provider: 'seed',
      metadata: { multiplier: 1 },
    },
  });

  await prisma.tariffPlan.upsert({
    where: { name: 'Branca Simulada' },
    update: {
      provider: 'seed',
      isActive: true,
    },
    create: {
      name: 'Branca Simulada',
      provider: 'seed',
      metadata: { multiplier: 0.92 },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
