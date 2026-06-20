import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVehicleBySlug, getVehicles } from '@/lib/api';
import { vehicleDisplayName, formatIDR } from '@/lib/utils';
import { buildVehicleWhatsAppUrl } from '@/lib/whatsapp';
import VehicleGallery from '@/components/vehicles/VehicleGallery';
import VehicleSpecGrid from '@/components/vehicles/VehicleSpecGrid';
import InspectionReportCard from '@/components/vehicles/InspectionReportCard';
import VehicleBadge from '@/components/vehicles/VehicleBadge';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ViewTracker from './_components/ViewTracker';
import VehicleCTA from './_components/VehicleCTA';
import { IconShieldCheck } from '@tabler/icons-react';

export const revalidate = 1800;

// ─── Static Params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const result = await getVehicles({ listingType: 'SALE', limit: 200 });
    return result.data.map((v) => ({ slug: v.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic Metadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const vehicle = await getVehicleBySlug(slug);
    const name = vehicleDisplayName(vehicle);
    const primaryImage = vehicle.images?.find((i) => i.isPrimary) ?? vehicle.images?.[0];

    return {
      title: `${name} — Soulani Auto Garage`,
      description:
        vehicle.metaDescription ||
        `Beli ${name}${vehicle.salesListing ? ` dengan harga ${formatIDR(vehicle.salesListing.price)}` : ''}. Diinspeksi 150 titik, kondisi terjamin.`,
      openGraph: {
        title: `${name} — Soulani Auto Garage`,
        description: vehicle.metaDescription || `${name} dijual di Soulani Auto Garage.`,
        images: primaryImage ? [primaryImage.imageUrl || primaryImage.fileUrl] : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Kendaraan Tidak Ditemukan — Soulani Auto Garage' };
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let vehicle;
  try {
    vehicle = await getVehicleBySlug(slug);
  } catch {
    notFound();
  }

  const name = vehicleDisplayName(vehicle);
  const latestInspection = vehicle.inspections?.[0];
  const whatsappUrl = buildVehicleWhatsAppUrl(vehicle);
  const price = vehicle.salesListing?.price;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: vehicle.description || `${name} tersedia di Soulani Auto Garage.`,
    image: vehicle.images?.map((img) => img.imageUrl || img.fileUrl) ?? [],
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price: price.toString(),
            priceCurrency: 'IDR',
            availability: vehicle.status === 'ACTIVE'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
    brand: { '@type': 'Brand', name: vehicle.make },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* View tracker (client, fires on mount) */}
      <ViewTracker vehicleId={vehicle.id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: 'Mobil Dijual', href: '/sales' },
            { label: `${vehicle.make} ${vehicle.model}` },
          ]}
        />

        {vehicle.status === 'SOLD' && (
          <div className="mt-5 w-full bg-gray-900 text-white text-center py-3 font-semibold tracking-wide text-sm rounded-md mb-6">
            Pemberitahuan: Unit ini telah terjual. Silakan lihat katalog kami untuk unit serupa yang masih tersedia.
          </div>
        )}
        {vehicle.status === 'MAINTENANCE' && (
          <div className="mt-5 w-full bg-amber-50 border border-amber-200 text-amber-800 text-center py-3 font-semibold tracking-wide text-sm rounded-md mb-6">
            Pemberitahuan: Unit ini sedang dalam proses perawatan rutin dan inspeksi Berkala. Hubungi kami untuk informasi ketersediaan.
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Gallery + Details (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Gallery */}
            <VehicleGallery images={vehicle.images ?? []} vehicleName={name} />

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {vehicle.isFeatured && <VehicleBadge type="featured" />}
              {vehicle.isNewArrival && <VehicleBadge type="new-arrival" />}
              {latestInspection && <VehicleBadge type="inspected" />}
            </div>

            {/* Title (mobile) */}
            <div className="lg:hidden">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              {price && (
                <p className="text-2xl font-extrabold text-blue-600 mt-1">{formatIDR(price)}</p>
              )}
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3">Spesifikasi</h2>
              <VehicleSpecGrid vehicle={vehicle} />
            </div>

            {/* Description */}
            {vehicle.description && (
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-2">Deskripsi</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Inspection */}
            {latestInspection && (
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <IconShieldCheck size={18} className="text-emerald-500" />
                  Laporan Inspeksi
                </h2>
                <InspectionReportCard inspection={latestInspection} />
              </div>
            )}
          </div>

          {/* Right: CTA (2/5) */}
          <div className="lg:col-span-2">
            {/* Desktop title */}
            <div className="hidden lg:block mb-4">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              {vehicle.color && (
                <p className="text-sm text-slate-500 mt-0.5">Warna: {vehicle.color}</p>
              )}
            </div>
            {vehicle.status === 'ACTIVE' ? (
              <VehicleCTA
                vehicleId={vehicle.id}
                vehicleName={name}
                listingType={vehicle.listingType}
                price={price ?? null}
                whatsappUrl={whatsappUrl}
              />
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Pendaftaran Ditutup</h3>
                <p className="text-sm text-gray-500">Unit kendaraan ini sudah tidak tersedia untuk penawaran harga atau sesi tanya jawab.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar spacer */}
      <div className="lg:hidden h-20" />
    </>
  );
}
