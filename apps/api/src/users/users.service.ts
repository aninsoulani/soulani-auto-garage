import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ) {
    if (data.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id }, deletedAt: null },
      });
      if (exists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
