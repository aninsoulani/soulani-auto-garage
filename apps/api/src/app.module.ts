import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { VehicleImagesModule } from './vehicle-images/vehicle-images.module';
import { VehicleInspectionsModule } from './vehicle-inspections/vehicle-inspections.module';
import { ListingsModule } from './listings/listings.module';
import { LeadsModule } from './leads/leads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RentalBookingsModule } from './rental-bookings/rental-bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    /**
     * Rate limiting via @nestjs/throttler.
     * Two named tiers are configured:
     *   short  — 10 requests / IP / 60s   (view tracking)
     *   medium — 5 requests / IP / 3600s  (lead/booking submission)
     * Individual endpoints override these values via @Throttle() decorator.
     */
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 10 },
      { name: 'medium', ttl: 3600000, limit: 5 },
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    VehicleImagesModule,
    VehicleInspectionsModule,
    ListingsModule,
    LeadsModule,
    AnalyticsModule,
    RentalBookingsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Apply ThrottlerGuard after AuthGuard so req.user is populated.
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
