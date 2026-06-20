import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { Public } from '../common/decorators/public.decorator';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Public()
  @Get()
  findAll() {
    return this.paymentMethodsService.findAllActive();
  }

  @Get('admin')
  findAllAdmin() {
    return this.paymentMethodsService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreatePaymentMethodDto, @Request() req) {
    return this.paymentMethodsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(+id);
  }
}
