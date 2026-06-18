import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in the .env file!');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`✓ Admin user: ${adminEmail}`);

  // ─── Testimonials ─────────────────────────────────────────────────────────
  // Phase 3: Seeded with static defaults.
  // Phase 6: Admin UI will allow creating/editing testimonials via CMS.
  const testimonials = [
    {
      authorName: 'Budi Santoso',
      authorTitle: 'Pengusaha, Jakarta',
      rating: 5,
      quoteText:
        'Proses pembelian sangat mudah dan cepat. Laporan inspeksi yang lengkap memberikan saya kepercayaan penuh. Sangat direkomendasikan!',
      isPublished: true,
    },
    {
      authorName: 'Dewi Rahayu',
      authorTitle: 'Ibu Rumah Tangga, Bekasi',
      rating: 5,
      quoteText:
        'Pelayanannya sangat ramah dan membantu. Saya mendapatkan mobil yang sesuai dengan kebutuhan keluarga dengan harga yang fair.',
      isPublished: true,
    },
    {
      authorName: 'Ahmad Fauzi',
      authorTitle: 'Karyawan Swasta, Tangerang',
      rating: 5,
      quoteText:
        'Pertama kali beli mobil bekas dan sangat puas. Transparansi tentang kondisi kendaraan membuat saya yakin. Terima kasih Soulani!',
      isPublished: true,
    },
    {
      authorName: 'Siti Nurhaliza',
      authorTitle: 'Dokter, Depok',
      rating: 4,
      quoteText:
        'Mobilnya dalam kondisi sangat baik seperti yang dijanjikan. Tim Soulani juga responsif dan sabar menjawab semua pertanyaan saya.',
      isPublished: true,
    },
  ];

  for (const t of testimonials) {
    // upsert by authorName as a stable seed identifier
    const existing = await prisma.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }

  console.log(`✓ ${testimonials.length} testimonials seeded`);

  // ─── Homepage Content (CMS-ready) ─────────────────────────────────────────
  // These key-value pairs power the homepage content.
  // Phase 3: Seeded with static defaults.
  // Phase 6: Admin dashboard CMS UI will allow editing these values
  //          without code changes or redeployment.
  const homepageContent = [
    { key: 'hero_title', value: JSON.stringify('Temukan Mobil Impian Anda') },
    { key: 'hero_subtitle', value: JSON.stringify('Beli atau sewa mobil dengan jaminan inspeksi 150 titik. Harga transparan, proses cepat.') },
    { key: 'trust_inspection_points', value: JSON.stringify('150') },
    { key: 'trust_return_days', value: JSON.stringify('5') },
    { key: 'trust_warranty_months', value: JSON.stringify('12') },
    // Phase 6: This key replaces NEXT_PUBLIC_WHATSAPP_NUMBER env var
    { key: 'whatsapp_number', value: JSON.stringify('6281210663530') },
    // Phase 6: About Us page content
    { key: 'about_hero_title', value: JSON.stringify('Tentang Soulani Auto Garage') },
    { key: 'about_story', value: JSON.stringify('Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.') },
    // Phase 6: Contact page content
    { key: 'contact_address', value: JSON.stringify('Jakarta, Indonesia') },
    { key: 'contact_hours_weekday', value: JSON.stringify('Senin – Sabtu: 09.00 – 18.00') },
    { key: 'contact_hours_weekend', value: JSON.stringify('Minggu: 10.00 – 15.00') },
    { key: 'contact_email', value: JSON.stringify('info@soulanigarage.com') },
  ];

  for (const item of homepageContent) {
    await prisma.homepageContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    });
  }

  console.log(`✓ ${homepageContent.length} homepage content items seeded`);
  console.log('\nSeed complete ✓');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
