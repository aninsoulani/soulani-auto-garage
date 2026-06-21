import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomepageDto } from './dto/update-homepage.dto';

const HOMEPAGE_KEY = 'homepage_settings';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomepage() {
    const config = await this.prisma.homepageContent.findUnique({
      where: { key: HOMEPAGE_KEY },
    });

    if (!config) {
      // Return defaults if not found
      return {
        whatsappNumber: '',
        heroHeadline: 'Premium Cars for Sale & Rent',
        heroSubheadline: 'Your trusted auto garage partner',
        contactEmail: 'contact@soulani.com',
      };
    }

    return config.value;
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
