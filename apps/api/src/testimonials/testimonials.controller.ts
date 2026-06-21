import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AuditAction } from '@prisma/client';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { AuditLog } from '../common/decorators/audit-log.decorator';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
  @Get('public')
  findAllPublished() {
    return this.testimonialsService.findAll(true);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.testimonialsService.findAll(false);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testimonialsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.CREATE, 'TestimonialsModule')
  @Post()
  create(@Body() dto: CreateTestimonialDto, @Req() req: any) {
    return this.testimonialsService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.UPDATE, 'TestimonialsModule')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(+id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.DELETE, 'TestimonialsModule')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(+id);
  }
}
