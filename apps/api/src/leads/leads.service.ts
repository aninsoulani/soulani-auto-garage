import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadType, LeadSource, LeadStatus, Prisma } from '@prisma/client';
import { GetLeadsDto } from './dto/get-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { areIntervalsOverlapping } from 'date-fns';

/** Lead reference ID format: LD-{YEAR}-{5 alphanumeric chars} */
function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  const random = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LD-${year}-${random}`;
}

/** Map LeadType enum to a human-readable Bahasa Indonesia string for WA message */
const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  SALES_INQUIRY: 'Pertanyaan Pembelian',
  TEST_DRIVE_REQUEST: 'Permintaan Test Drive',
  MAKE_OFFER: 'Penawaran Harga',
  RENTAL_INQUIRY: 'Pertanyaan Sewa',
  LONG_TERM_QUOTE: 'Penawaran Sewa Jangka Panjang',
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── WhatsApp URL Builder ──────────────────────────────────────────────

  private buildWhatsAppUrl(params: {
    leadReferenceId: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    customerName: string;
    customerPhone: string;
    type: LeadType;
    message?: string | null;
  }): string {
    const waNumber = this.config.get<string>('WHATSAPP_NUMBER') || '6281210663530';

    const typeLabel = LEAD_TYPE_LABELS[params.type] ?? params.type;

    let text = `Halo Admin Soulani Auto Garage.\n`;
    text += `Nama saya: ${params.customerName}.\n`;
    text += `No. HP: ${params.customerPhone}.\n`;
    text += `Saya tertarik dengan: ${params.vehicleMake} ${params.vehicleModel} (${params.vehicleYear}).\n`;
    text += `Jenis Pertanyaan: ${typeLabel}.`;

    if (params.message) {
      text += `\nPesan: ${params.message}.`;
    }

    text += `\nRef ID: ${params.leadReferenceId}.`;

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  }

  // ─── Create Lead ───────────────────────────────────────────────────────

  async create(dto: CreateLeadDto) {
    // 1. Verify vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId, deletedAt: null },
      select: { id: true, make: true, model: true, year: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    // 2. Generate unique reference ID (retry on rare collision)
    let leadReferenceId = generateReferenceId();
    const existing = await this.prisma.lead.findUnique({ where: { leadReferenceId } });
    if (existing) leadReferenceId = generateReferenceId();

    // 3. Create the lead record
    const lead = await this.prisma.lead.create({
      data: {
        leadReferenceId,
        vehicleId: dto.vehicleId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail ?? null,
        type: dto.type,
        message: dto.message ?? null,
        source: dto.source ?? LeadSource.ORGANIC,
      },
    });

    // 4. Async: increment analytics counter (fire and forget — never blocks response)
    this.incrementAnalytics(dto.vehicleId, dto.type).catch(() => {
      // Silently ignore analytics errors — they must not affect lead creation
    });

    // 5. Build WhatsApp redirect URL
    const whatsappRedirectUrl = this.buildWhatsAppUrl({
      leadReferenceId,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      type: dto.type,
      message: dto.message,
    });

    return {
      leadReferenceId,
      whatsappRedirectUrl,
    };
  }

  // ─── Analytics Increment ───────────────────────────────────────────────

  private async incrementAnalytics(vehicleId: number, type: LeadType): Promise<void> {
    const isOffer = type === LeadType.MAKE_OFFER;
    const isRental = type === LeadType.RENTAL_INQUIRY || type === LeadType.LONG_TERM_QUOTE;

    await this.prisma.vehicleAnalytics.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        inquiryCount: isOffer || isRental ? 0 : 1,
        offerCount: isOffer ? 1 : 0,
        rentalRequestCount: isRental ? 1 : 0,
      },
      update: {
        ...(isOffer ? { offerCount: { increment: 1 } } : {}),
        ...(isRental ? { rentalRequestCount: { increment: 1 } } : {}),
        ...(!isOffer && !isRental ? { inquiryCount: { increment: 1 } } : {}),
      },
    });
  }

  // ─── Admin / CRM queries (used in Phase 5) ────────────────────────────

  async findAll(query: GetLeadsDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = { deletedAt: null };
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.type) {
      where.type = query.type as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { id: true, make: true, model: true, year: true, slug: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.lead.count({ where: { deletedAt: null } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id, deletedAt: null },
      include: {
        vehicle: { select: { id: true, make: true, model: true, year: true, slug: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        followups: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) throw new NotFoundException(`Lead with ID ${id} not found`);
    return lead;
  }

  async updateStatus(id: number, dto: UpdateLeadStatusDto, userId: number) {
    const lead = await this.prisma.lead.findUnique({ where: { id, deletedAt: null } });
    if (!lead) throw new NotFoundException(`Lead with ID ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      if (dto.status === LeadStatus.WON) {
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException('startDate and endDate are required to mark lead as WON');
        }
        
        if (!lead.vehicleId) {
          throw new BadRequestException('Lead must be associated with a vehicle to be marked as WON');
        }

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        console.log('[DEBUG updateStatus] Checking availability for vehicleId:', lead.vehicleId);
        console.log('[DEBUG updateStatus] dto.startDate:', dto.startDate, '-> parsed startDate:', startDate.toISOString());
        console.log('[DEBUG updateStatus] dto.endDate:', dto.endDate, '-> parsed endDate:', endDate.toISOString());

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new BadRequestException('Invalid date format');
        }

        const rentalListing = await tx.rentalListing.findUnique({
          where: { vehicleId: lead.vehicleId }
        });

        if (!rentalListing) {
          throw new BadRequestException('Vehicle is not available for rent');
        }

        const bookings = await tx.rentalBooking.findMany({
          where: {
            rentalListingId: rentalListing.id,
            status: { in: ['ACTIVE', 'CONFIRMED'] },
            deletedAt: null,
          }
        });

        const isOverlappingBooking = bookings.some((b) => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Handover Buffer
          return areIntervalsOverlapping(
            { start: bStart, end: bEnd },
            { start: startDate, end: endDate },
            { inclusive: false }
          );
        });

        if (isOverlappingBooking) {
          console.log('[DEBUG updateStatus] Precise overlap found with existing bookings');
          throw new BadRequestException('Vehicle is already booked for these dates');
        }

        const blackouts = await tx.blackoutDate.findMany({
          where: {
            vehicleId: lead.vehicleId,
            deletedAt: null,
          }
        });

        const isOverlappingBlackout = blackouts.some((b) => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          bEnd.setHours(bEnd.getHours() + 1); // 1 Hour Handover Buffer
          return areIntervalsOverlapping(
            { start: bStart, end: bEnd },
            { start: startDate, end: endDate },
            { inclusive: false }
          );
        });

        if (isOverlappingBlackout) {
          console.log('[DEBUG updateStatus] Precise overlap found with blackout dates');
          throw new BadRequestException('Vehicle is unavailable during these dates (blackout)');
        }


        const paymentMethod = await tx.paymentMethod.findFirst({
          where: { isActive: true }
        });

        if (!paymentMethod) {
          throw new BadRequestException('No active payment methods found');
        }

        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
        const dailyRate = Number(rentalListing.dailyRate);
        const totalPrice = dailyRate * days;

        const countToday = await tx.rentalBooking.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });
        const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const sequenceStr = String(countToday + 1).padStart(4, '0');
        const bookingCode = `INV-${todayStr}-${sequenceStr}`;

        await tx.rentalBooking.create({
          data: {
            bookingCode,
            rentalListingId: rentalListing.id,
            customerName: lead.customerName,
            customerPhone: lead.customerPhone,
            customerEmail: lead.customerEmail || 'no-email@example.com',
            startDate,
            endDate,
            paymentMethodId: paymentMethod.id,
            totalPrice,
            status: 'PENDING_PAYMENT',
            withDriver: false,
            whatsappOptIn: true
          }
        });
      }

      if (dto.status === LeadStatus.LOST) {
        if (!dto.notes) {
          throw new BadRequestException('Notes are required when marking a lead as LOST');
        }
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.notes || lead.adminNotes
        }
      });

      if (dto.notes) {
        await tx.leadFollowup.create({
          data: {
            leadId: id,
            userId,
            noteText: `Status changed to ${dto.status}. Notes: ${dto.notes}`
          }
        });
      }

      return updatedLead;
    });
  }
}
