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
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { UploadsModule } from './uploads/uploads.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';
import { AuditModule } from './audit/audit.module';

import { TestimonialsModule } from './testimonials/testimonials.module';
import { CmsModule } from './cms/cms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    /**
     * Rate limiting via @nestjs/throttler using centralized config.
     */
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const { getThrottlerConfig } = require('./config/throttler.config');
        const config = getThrottlerConfig();
        return [
          {
            name: 'default',
            ttl: config.global.ttl,
            limit: config.global.limit,
          },
        ];
      },
    }),

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
    PaymentMethodsModule,
    UploadsModule,
    ScheduleModule.forRoot(),
    CronModule,
    AuditModule,
    TestimonialsModule,
    CmsModule,
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
