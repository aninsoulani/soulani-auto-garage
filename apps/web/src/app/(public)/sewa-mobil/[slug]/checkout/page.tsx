import { redirect } from 'next/navigation';
import { getVehicleBySlug, getVehicleAvailability } from '@/lib/api';
import Breadcrumb from '@/components/shared/Breadcrumb';
import CheckoutClient from './CheckoutClient';
import { isBefore, startOfDay } from 'date-fns';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const startStr = resolvedSearchParams.start;
  const endStr = resolvedSearchParams.end;

  if (!startStr || !endStr) {
    redirect(`/sewa-mobil/${resolvedParams.slug}?error=missing_dates`);
  }

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const today = startOfDay(new Date());

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    redirect(`/sewa-mobil/${resolvedParams.slug}?error=invalid_dates`);
  }

  if (isBefore(startDate, today) || startDate > endDate) {
    redirect(`/sewa-mobil/${resolvedParams.slug}?error=invalid_dates`);
  }

  let vehicle;
  try {
    vehicle = await getVehicleBySlug(resolvedParams.slug);
  } catch {
    redirect('/sewa-mobil');
  }

  if (!vehicle) {
    redirect('/sewa-mobil');
  }

  let hasOverlap = false;
  try {
    const { unavailableIntervals } = await getVehicleAvailability(vehicle.id);
    hasOverlap = unavailableIntervals.some((interval) => {
      const intervalStart = new Date(interval.start);
      const intervalEnd = new Date(interval.end);
      // Overlap logic: A starts before B ends AND A ends after B starts
      return startDate < intervalEnd && endDate > intervalStart;
    });
  } catch (err) {
    console.error("Failed to check availability", err);
  }

  if (hasOverlap) {
    redirect(`/sewa-mobil/${resolvedParams.slug}?error=unavailable_dates`);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: 'Sewa Mobil', href: '/sewa-mobil' },
          { label: `${vehicle.make} ${vehicle.model}`, href: `/sewa-mobil/${resolvedParams.slug}` },
          { label: 'Checkout' }
        ]} />

        <div className="mt-6">
          <CheckoutClient vehicle={vehicle} startStr={startStr} endStr={endStr} />
        </div>
      </div>
    </div>
  );
}
