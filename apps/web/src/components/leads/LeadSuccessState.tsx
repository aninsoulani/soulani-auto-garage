'use client';
import { useEffect } from 'react';
import { IconCircleCheck } from '@tabler/icons-react';

interface LeadSuccessStateProps {
  refId: string;
  whatsappUrl: string;
  vehicleName: string;
}

export default function LeadSuccessState({ refId, whatsappUrl, vehicleName }: LeadSuccessStateProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 1500);
    return () => clearTimeout(timer);
  }, [whatsappUrl]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
      {/* Animated checkmark */}
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
        <IconCircleCheck size={36} className="text-emerald-500" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Pertanyaan Terkirim!</h3>
        <p className="text-sm text-slate-500 mt-1">
          Terima kasih telah menghubungi kami tentang{' '}
          <strong className="text-slate-700">{vehicleName}</strong>.
        </p>
      </div>

      {/* Reference ID */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 w-full">
        <p className="text-xs text-slate-500 mb-0.5">Nomor Referensi Anda</p>
        <p className="text-base font-bold text-blue-600 tracking-wider">{refId}</p>
        <p className="text-xs text-slate-400 mt-0.5">Simpan nomor ini untuk referensi percakapan</p>
      </div>

      <div className="text-sm text-slate-500">
        <p>Mengalihkan ke WhatsApp</p>
        <p className="text-xs mt-0.5">dalam beberapa detik...</p>
      </div>

      {/* Manual redirect fallback */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#25D366] hover:underline"
      >
        Klik di sini jika tidak diarahkan otomatis →
      </a>
    </div>
  );
}
