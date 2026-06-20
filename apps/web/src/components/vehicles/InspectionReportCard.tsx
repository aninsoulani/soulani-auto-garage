'use client';
import { useState } from 'react';
import type { VehicleInspection } from '@/types/api.types';
import { getInspectionStatusMeta, formatDate } from '@/lib/utils';
import { IconChevronDown, IconShieldCheck, IconCheck, IconX, IconAlertTriangle, IconHelp } from '@tabler/icons-react';

interface InspectionItem {
  label: string;
  key: keyof Pick<
    VehicleInspection,
    | 'engineStatus'
    | 'transmissionStatus'
    | 'suspensionStatus'
    | 'electricalStatus'
    | 'acStatus'
    | 'tiresStatus'
    | 'interiorStatus'
    | 'exteriorStatus'
  >;
}

const INSPECTION_ITEMS: InspectionItem[] = [
  { label: 'Mesin', key: 'engineStatus' },
  { label: 'Transmisi', key: 'transmissionStatus' },
  { label: 'Suspensi', key: 'suspensionStatus' },
  { label: 'Kelistrikan', key: 'electricalStatus' },
  { label: 'AC', key: 'acStatus' },
  { label: 'Ban & Velg', key: 'tiresStatus' },
  { label: 'Interior', key: 'interiorStatus' },
  { label: 'Eksterior', key: 'exteriorStatus' },
];

interface InspectionReportCardProps {
  inspection: VehicleInspection;
}

export default function InspectionReportCard({ inspection }: InspectionReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const passCount = INSPECTION_ITEMS.filter(
    (item) => inspection[item.key] === 'PASS',
  ).length;

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <IconShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Laporan Inspeksi</p>
            <p className="text-xs text-emerald-700 font-medium">
              {passCount}/{INSPECTION_ITEMS.length} komponen dalam kondisi baik
            </p>
          </div>
        </div>
        <IconChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INSPECTION_ITEMS.map(({ label, key }) => {
              const status = inspection[key];
              const meta = getInspectionStatusMeta(status);
              const IconComponent = meta.icon === 'check' ? IconCheck : meta.icon === 'x' ? IconX : meta.icon === 'alert-triangle' ? IconAlertTriangle : IconHelp;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${meta.bgColor}`}
                >
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`text-xs font-bold ${meta.color} flex items-center gap-1`}>
                    <IconComponent size={14} />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>

          {inspection.generalNotes && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-1">Catatan Inspektor</p>
              <p className="text-sm text-amber-700 leading-relaxed">{inspection.generalNotes}</p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-right">
            Diinspeksi pada {formatDate(inspection.inspectionDate)} oleh{' '}
            <strong className="text-slate-600">{inspection.inspectorName}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
