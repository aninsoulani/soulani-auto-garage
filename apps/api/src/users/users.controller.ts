import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AuditAction } from '@prisma/client';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { AuditLog } from '../common/decorators/audit-log.decorator';

@Controller('users')
@Roles(UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.CREATE, 'AuthModule')
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.UPDATE, 'AuthModule')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(+id, body);
  }

  @Delete(':id')
  @UseInterceptors(AuditInterceptor)
  @AuditLog(AuditAction.DELETE, 'AuthModule')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
