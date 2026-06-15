const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runInvestigation() {
  console.log('--- DB Investigation ---');
  
  // 1. Total vehicle count
  const total = await prisma.vehicle.count();
  console.log(`1. Total vehicles: ${total}`);

  // 2. Count grouped by vehicle type
  const byType = await prisma.vehicle.groupBy({
    by: ['type'],
    _count: { _all: true },
    where: { deletedAt: null }
  });
  console.log('2. Active Vehicles by Type:');
  byType.forEach(t => console.log(`   - ${t.type}: ${t._count._all}`));

  // 3. Count grouped by vehicle status
  const byStatus = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: { deletedAt: null }
  });
  console.log('3. Active Vehicles by Status:');
  byStatus.forEach(s => console.log(`   - ${s.status}: ${s._count._all}`));

  // 4. Count of vehicles that satisfy the public listing query
  // Public listing expects deletedAt: null, status: AVAILABLE. 
  // And the frontend strictly filters by type=SALE or type=RENTAL.
  const publicSale = await prisma.vehicle.count({
    where: { deletedAt: null, status: 'AVAILABLE', type: 'SALE' }
  });
  const publicBoth = await prisma.vehicle.count({
    where: { deletedAt: null, status: 'AVAILABLE', type: 'BOTH' }
  });
  console.log('4. Count satisfying public queries:');
  console.log(`   - Exact 'SALE' matches (Would appear on public Sales page if not throttled): ${publicSale}`);
  console.log(`   - 'BOTH' matches (Missing from public Sales page due to strict filtering): ${publicBoth}`);

  // 5. Example record that appears in admin but not public
  const missingVehicle = await prisma.vehicle.findFirst({
    where: { deletedAt: null, status: 'AVAILABLE', type: 'BOTH' },
    include: { salesListing: true }
  });
  console.log('5. Example Record (Appears in Admin, but MISSING from public ?type=SALE query):');
  if (missingVehicle) {
    console.log(`   ID: ${missingVehicle.id}`);
    console.log(`   Make/Model: ${missingVehicle.make} ${missingVehicle.model}`);
    console.log(`   Type: ${missingVehicle.type}`);
    console.log(`   Status: ${missingVehicle.status}`);
    console.log(`   Sales Listing Price: ${missingVehicle.salesListing?.price || 'Missing'}`);
  }
}

runInvestigation().catch(console.error).finally(() => prisma.$disconnect());
