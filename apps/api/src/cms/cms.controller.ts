import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { UpdateHomepageDto } from './dto/update-homepage.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AuditAction } from '@prisma/client';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { AuditLog } from '../common/decorators/audit-log.decorator';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('homepage')
  getHomepage() {
    return this.cmsService.getHomepage();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.UPDATE, 'CmsModule')
  @Put('homepage')
  updateHomepage(@Body() dto: UpdateHomepageDto, @Req() req: any) {
    return this.cmsService.updateHomepage(dto, req.user.id);
  }
}
