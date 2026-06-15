import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@Soulani123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@soulani.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@soulani.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Seed complete. Admin user created: admin@soulani.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
