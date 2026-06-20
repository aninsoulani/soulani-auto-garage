import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVehicleBySlug, getVehicles } from '@/lib/api';
import { vehicleDisplayName, formatIDR } from '@/lib/utils';
import VehicleGallery from '@/components/vehicles/VehicleGallery';
import VehicleSpecGrid from '@/components/vehicles/VehicleSpecGrid';
import InspectionReportCard from '@/components/vehicles/InspectionReportCard';
import VehicleBadge from '@/components/vehicles/VehicleBadge';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ViewTracker from '../../sales/[slug]/_components/ViewTracker';
import { IconShieldCheck, IconUserCircle, IconKey, IconInfoCircle } from '@tabler/icons-react';
import RentalBookingWidget from './_components/RentalBookingWidget';
import ErrorToast from './_components/ErrorToast';

export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const result = await getVehicles({ listingType: 'RENTAL', limit: 200 });
    return result.data.map((v) => ({ slug: v.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const vehicle = await getVehicleBySlug(slug);
    const name = vehicleDisplayName(vehicle);
    const primaryImage = vehicle.images?.find((i) => i.isPrimary) ?? vehicle.images?.[0];

    return {
      title: `Sewa ${name} — Soulani Auto Garage`,
      description: vehicle.metaDescription || `Sewa ${name} harian atau bulanan. Kondisi prima, siap pakai.`,
      openGraph: {
        title: `Sewa ${name} — Soulani Auto Garage`,
        description: vehicle.metaDescription || `Sewa ${name} di Soulani Auto Garage.`,
        images: primaryImage ? [primaryImage.imageUrl || primaryImage.fileUrl] : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Kendaraan Tidak Ditemukan — Soulani Auto Garage' };
  }
}

export default async function RentalDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  let vehicle;
  try {
    vehicle = await getVehicleBySlug(slug);
  } catch {
    notFound();
  }

  const name = vehicleDisplayName(vehicle);
  const latestInspection = vehicle.inspections?.[0];
  const price = vehicle.rentalListing?.dailyRate;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: vehicle.description || `Sewa ${name} di Soulani Auto Garage.`,
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
      {error && <ErrorToast error={error} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker vehicleId={vehicle.id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Sewa Mobil', href: '/sewa-mobil' }, { label: `${vehicle.make} ${vehicle.model}` }]} />

        {vehicle.status === 'SOLD' && (
          <div className="mt-5 w-full bg-gray-900 text-white text-center py-3 font-semibold tracking-wide text-sm rounded-md mb-6">
            Pemberitahuan: Unit ini tidak lagi tersedia.
          </div>
        )}
        {vehicle.status === 'MAINTENANCE' && (
          <div className="mt-5 w-full bg-amber-50 border border-amber-200 text-amber-800 text-center py-3 font-semibold tracking-wide text-sm rounded-md mb-6">
            Pemberitahuan: Unit ini sedang dalam proses perawatan rutin dan inspeksi Berkala. Hubungi kami untuk informasi ketersediaan.
          </div>
        )}
        {vehicle.status === 'RENTED' && (
          <div className="mt-5 w-full bg-blue-50 border border-blue-200 text-blue-800 text-center py-3 font-semibold tracking-wide text-sm rounded-md mb-6">
            Pemberitahuan: Unit ini sedang disewa. Anda dapat melihat kalender ketersediaan di bawah ini.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Gallery + Details (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <VehicleGallery images={vehicle.images ?? []} vehicleName={name} />
            <div className="flex flex-wrap gap-2">
              {vehicle.isFeatured && <VehicleBadge type="featured" />}
              {vehicle.isNewArrival && <VehicleBadge type="new-arrival" />}
              {vehicle.rentalListing?.isLongTermEligible && <VehicleBadge type="long-term" />}
              {vehicle.rentalListing && <VehicleBadge type="lepas-kunci" />}
              {vehicle.rentalListing?.isDriverAvailable && <VehicleBadge type="with-driver" />}
              {latestInspection && <VehicleBadge type="inspected" />}
            </div>

            <div className="lg:hidden">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
            </div>

            {/* Pricing & Driver Specs Section */}
            {vehicle.rentalListing && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Harga Sewa</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{formatIDR(vehicle.rentalListing.dailyRate)}</span>
                      <span className="text-slate-500 font-medium">/ hari</span>
                    </div>
                  </div>
                  
                  {Number(vehicle.rentalListing.depositAmount) > 0 && (
                    <div className="sm:text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
                        <IconInfoCircle size={14} /> Deposit Keamanan
                      </h3>
                      <span className="text-lg font-bold text-slate-800">{formatIDR(vehicle.rentalListing.depositAmount)}</span>
                      <p className="text-xs text-slate-500 mt-0.5">Dikembalikan setelah sewa selesai</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-lg border border-emerald-100">
                    <div className="bg-emerald-100 p-2 rounded-md">
                      <IconKey size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Lepas Kunci</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Self-Drive tersedia</p>
                    </div>
                  </div>

                  {vehicle.rentalListing.isDriverAvailable ? (
                    <div className="flex items-center gap-3 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border border-blue-100">
                      <div className="bg-blue-100 p-2 rounded-md">
                        <IconUserCircle size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Layanan Supir</p>
                        <p className="text-xs text-blue-600 mt-0.5">+{formatIDR(vehicle.rentalListing.driverFeePerDay || 0)} / hari</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 text-slate-600 px-4 py-3 rounded-lg border border-slate-200">
                      <div className="bg-slate-200 p-2 rounded-md">
                        <IconUserCircle size={20} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Tanpa Supir</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tidak tersedia supir</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3">Spesifikasi</h2>
              <VehicleSpecGrid vehicle={vehicle} hidePreviousOwners={true} />
            </div>

            {vehicle.description && (
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-2">Deskripsi</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{vehicle.description}</p>
              </div>
            )}

            {latestInspection && (
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <IconShieldCheck size={18} className="text-emerald-500" /> Laporan Inspeksi
                </h2>
                <InspectionReportCard inspection={latestInspection} />
              </div>
            )}
          </div>

          {/* Right: CTA (2/5) */}
          <div className="lg:col-span-2">
            <div className="hidden lg:block mb-4">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              {vehicle.color && <p className="text-sm text-slate-500 mt-0.5">Warna: {vehicle.color}</p>}
            </div>
            
            {(vehicle.status === 'ACTIVE' || vehicle.status === 'RENTED') ? (
              <RentalBookingWidget vehicle={vehicle} />
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Penyewaan Ditutup</h3>
                <p className="text-sm text-gray-500">Unit kendaraan ini tidak tersedia untuk disewa saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="lg:hidden h-20" />
    </>
  );
}
