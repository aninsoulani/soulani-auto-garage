import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
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

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
  }
}
