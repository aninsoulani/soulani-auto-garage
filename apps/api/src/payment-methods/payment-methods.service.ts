import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.paymentMethod.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        instructions: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.paymentMethod.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async create(data: CreatePaymentMethodDto, userId?: number) {
    return this.prisma.paymentMethod.create({
      data: {
        ...data,
        createdById: userId,
      },
    });
  }

  async update(id: number, data: UpdatePaymentMethodDto) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
