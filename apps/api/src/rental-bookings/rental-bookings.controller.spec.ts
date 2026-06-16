import { Test, TestingModule } from '@nestjs/testing';
import { RentalBookingsController } from './rental-bookings.controller';

describe('RentalBookingsController', () => {
  let controller: RentalBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalBookingsController],
    }).compile();

    controller = module.get<RentalBookingsController>(RentalBookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
