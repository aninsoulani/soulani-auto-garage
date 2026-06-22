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
    const existing = await prisma.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }

  console.log(`✓ ${testimonials.length} testimonials seeded`);

  const defaultSettings = {
    whatsappNumber: '6281210663530',
    heroHeadline: 'Temukan Mobil Impian Anda',
    heroSubheadline: 'Beli atau sewa mobil dengan jaminan inspeksi 150 titik. Harga transparan, proses cepat.',
    contactEmail: 'info@soulanigarage.com',
    contactAddress: 'Jakarta, Indonesia',
    contactPhone: '+62 800-000-0000',
    contactHoursWeekday: 'Senin – Sabtu: 09.00 – 18.00',
    contactHoursWeekend: 'Minggu: 10.00 – 15.00',
    contactMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2090581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f4264b7bec93%3A0xdffa24a3d6d7b038!2sJakarta%2C%20Indonesia!5e0!3m2!1sen!2s!4v1718000000000!5m2!1sen!2s',
    trustInspectionPoints: '150',
    trustReturnDays: '5',
    trustWarrantyMonths: '12',
    aboutHeroTitle: 'Tentang Soulani Auto Garage',
    aboutStory: 'Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.'
  };

  await prisma.homepageContent.upsert({
    where: { key: 'homepage_settings' },
    update: { value: defaultSettings },
    create: { key: 'homepage_settings', value: defaultSettings }
  });

  console.log(`✓ Homepage settings seeded`);
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
