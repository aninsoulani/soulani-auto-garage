import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Public: Track a vehicle page view.
   * Rate limited: 10 requests per IP per minute to prevent artificial inflation.
   */
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 10 }, medium: { ttl: 3600000, limit: 10000 } })
  @Post('vehicles/:id/track-view')
  trackView(@Param('id') id: string) {
    return this.analyticsService.trackView(+id);
  }

  /**
   * Protected: Get global dashboard metrics (admin use).
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }

  /**
   * Protected: Get analytics for a specific vehicle.
   * Used by admin dashboard (Phase 6).
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('vehicles/:id')
  getVehicleAnalytics(@Param('id') id: string) {
    return this.analyticsService.getVehicleAnalytics(+id);
  }
}
