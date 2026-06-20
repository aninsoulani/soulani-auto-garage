import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET ||
        'dev_super_secret_access_key_min_64_chars_xxxxxxxxxxxxxxxxxxxxxxx',
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
