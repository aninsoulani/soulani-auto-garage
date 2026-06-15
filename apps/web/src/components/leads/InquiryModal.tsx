import { X } from 'lucide-react';
import InquiryForm from './InquiryForm';

interface InquiryModalProps {
  vehicleId: number;
  vehicleName: string;
  listingType?: 'SALE' | 'RENTAL' | 'BOTH';
  onClose: () => void;
}

export default function InquiryModal({ vehicleId, vehicleName, listingType, onClose }: InquiryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kirim Pertanyaan</h2>
            <p className="text-sm text-slate-500">{vehicleName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={16} className="text-slate-600" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <InquiryForm vehicleId={vehicleId} vehicleName={vehicleName} listingType={listingType} />
        </div>
      </div>
    </div>
  );
}
