import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetLeadsDto } from './dto/get-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { getThrottlerConfig } from '../config/throttler.config';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  /**
   * Public: Create a new lead from the public inquiry form.
   * Rate limited: 5 requests per IP per hour.
   * Returns leadReferenceId + whatsappRedirectUrl.
   */
  @Public()
  @Throttle({ default: getThrottlerConfig().mutate })
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // ── Protected CRM endpoints (Phase 5 will flesh these out fully) ───────

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: GetLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: any
  ) {
    return this.leadsService.updateStatus(+id, dto, req.user.id);
  }
}
