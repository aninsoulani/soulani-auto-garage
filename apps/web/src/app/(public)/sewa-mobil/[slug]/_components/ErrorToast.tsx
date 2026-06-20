'use client';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ErrorToast({ error }: { error: string }) {
  useEffect(() => {
    if (error === 'unavailable_dates') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Tanggal yang Anda pilih tidak tersedia atau sudah dipesan.',
        showConfirmButton: false,
        timer: 4000
      });
    } else if (error === 'invalid_dates' || error === 'missing_dates' || error === 'past_dates') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Tanggal yang Anda pilih tidak valid.',
        showConfirmButton: false,
        timer: 4000
      });
    }
  }, [error]);

  return null;
}
