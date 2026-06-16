const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Step 1...');
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles MODIFY status ENUM('DRAFT', 'AVAILABLE', 'ACTIVE', 'SOLD', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'DRAFT';`);
  
  console.log('Step 2...');
  await prisma.$executeRawUnsafe(`UPDATE vehicles SET status = 'ACTIVE' WHERE status = 'AVAILABLE';`);
  
  console.log('Step 3...');
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles MODIFY status ENUM('DRAFT', 'ACTIVE', 'SOLD', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'DRAFT';`);
  
  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
