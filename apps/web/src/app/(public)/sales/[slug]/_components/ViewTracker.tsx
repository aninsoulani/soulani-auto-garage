'use client';
import { useEffect } from 'react';
import { trackVehicleView } from '@/lib/api';

export default function ViewTracker({ vehicleId }: { vehicleId: number }) {
  useEffect(() => {
    trackVehicleView(vehicleId);
  }, [vehicleId]);
  return null;
}
