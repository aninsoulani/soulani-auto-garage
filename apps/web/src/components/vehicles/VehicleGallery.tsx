'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { VehicleImage } from '@/types/api.types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface VehicleGalleryProps {
  images: VehicleImage[];
  vehicleName: string;
}

export default function VehicleGallery({ images, vehicleName }: VehicleGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-slate-100 rounded-2xl flex items-center justify-center">
        <span className="text-slate-400 text-sm">Tidak ada foto</span>
      </div>
    );
  }

  const active = images[activeIdx];
  const activeUrl = active.imageUrl || active.fileUrl;

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <>
      {/* Main Image */}
      <div className="relative group">
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 block"
          aria-label="Perbesar gambar"
        >
          <Image
            src={activeUrl}
            alt={`${vehicleName} - foto ${activeIdx + 1}`}
            fill
            className="object-cover"
            priority={activeIdx === 0}
            sizes="(max-width: 768px) 100vw, 60vw"
          />
          {/* Counter */}
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {activeIdx + 1} / {images.length}
          </span>
        </button>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={18} className="text-slate-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={18} className="text-slate-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                i === activeIdx ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Tampilkan foto ${i + 1}`}
            >
              <Image
                src={img.imageUrl || img.fileUrl}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
          <div
            className="relative w-full max-w-4xl mx-4 aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeUrl}
              alt={`${vehicleName} - foto ${activeIdx + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 80vw"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
