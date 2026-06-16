import { Test, TestingModule } from '@nestjs/testing';
import { RentalBookingsService } from './rental-bookings.service';

describe('RentalBookingsService', () => {
  let service: RentalBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RentalBookingsService],
    }).compile();

    service = module.get<RentalBookingsService>(RentalBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
