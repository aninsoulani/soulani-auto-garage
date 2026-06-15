const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allActive = await prisma.vehicle.findMany({ 
    where: { deletedAt: null, type: 'SALE' },
    include: { salesListing: true }
  });
  console.log(JSON.stringify(allActive, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
