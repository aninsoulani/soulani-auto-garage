import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadType, LeadSource } from '@prisma/client';

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
    offeredPrice?: number | null;
    message?: string | null;
  }): string {
    const waNumber = this.config.get<string>('WHATSAPP_NUMBER') || '6281210663530';

    const typeLabel = LEAD_TYPE_LABELS[params.type] ?? params.type;

    let text = `Halo Admin Soulani Auto Garage.\n`;
    text += `Nama saya: ${params.customerName}.\n`;
    text += `No. HP: ${params.customerPhone}.\n`;
    text += `Saya tertarik dengan: ${params.vehicleMake} ${params.vehicleModel} (${params.vehicleYear}).\n`;
    text += `Jenis Pertanyaan: ${typeLabel}.`;

    if (params.type === LeadType.MAKE_OFFER && params.offeredPrice) {
      const formatted = new Intl.NumberFormat('id-ID').format(params.offeredPrice);
      text += `\nPenawaran saya: Rp ${formatted}.`;
    }

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
        offeredPrice: dto.offeredPrice ?? null,
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
      offeredPrice: dto.offeredPrice ? Number(dto.offeredPrice) : null,
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

  async findAll(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where: { deletedAt: null },
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
}
