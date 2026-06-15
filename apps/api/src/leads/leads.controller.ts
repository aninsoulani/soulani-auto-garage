import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  /**
   * Public: Create a new lead from the public inquiry form.
   * Rate limited: 5 requests per IP per hour.
   * Returns leadReferenceId + whatsappRedirectUrl.
   */
  @Public()
  @Throttle({ medium: { ttl: 3600000, limit: 10 } })
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // ── Protected CRM endpoints (Phase 5 will flesh these out fully) ───────

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: { page?: number; limit?: number; status?: string }) {
    return this.leadsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(+id);
  }
}
