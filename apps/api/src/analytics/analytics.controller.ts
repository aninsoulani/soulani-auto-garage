import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';

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

  @Post('vehicles/:id/track-view')
  trackView(@Param('id') id: string) {
    return this.analyticsService.trackView(+id);
  }

  /**
   * Protected: Get global dashboard metrics (admin use).
   */

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }

  /**
   * Protected: Get analytics for a specific vehicle.
   * Used by admin dashboard (Phase 6).
   */

  @UseGuards(JwtAuthGuard)
  @Get('vehicles/:id')
  getVehicleAnalytics(@Param('id') id: string) {
    return this.analyticsService.getVehicleAnalytics(+id);
  }
}
