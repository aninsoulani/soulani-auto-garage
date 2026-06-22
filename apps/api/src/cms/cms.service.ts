import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomepageDto } from './dto/update-homepage.dto';

const HOMEPAGE_KEY = 'homepage_settings';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomepage() {
    const defaults = {
      whatsappNumber: '',
      heroHeadline: 'Premium Cars for Sale & Rent',
      heroSubheadline: 'Your trusted auto garage partner',
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
      aboutStory: 'Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.',
    };

    const config = await this.prisma.homepageContent.findUnique({
      where: { key: HOMEPAGE_KEY },
    });

    if (!config) {
      return defaults;
    }

    const value = typeof config.value === 'object' && config.value !== null ? config.value : {};
    return {
      ...defaults,
      ...value,
    };
  }

  async updateHomepage(dto: UpdateHomepageDto, userId: number) {
    const config = await this.prisma.homepageContent.upsert({
      where: { key: HOMEPAGE_KEY },
      create: {
        key: HOMEPAGE_KEY,
        value: dto.data,
        createdById: userId,
      },
      update: {
        value: dto.data,
        createdById: userId,
      },
    });

    return config.value;
  }
}
