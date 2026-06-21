import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyPublished = false) {
    return this.prisma.testimonial.findMany({
      where: {
        deletedAt: null,
        ...(onlyPublished ? { isPublished: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const t = await this.prisma.testimonial.findFirst({
      where: { id, deletedAt: null },
    });
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }

  async create(dto: CreateTestimonialDto, userId: number) {
    return this.prisma.testimonial.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async update(id: number, dto: UpdateTestimonialDto) {
    await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
