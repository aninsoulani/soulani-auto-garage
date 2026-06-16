'use client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function InspectionTab({ register, vehicleId, errors }: { register: any, vehicleId: number | null, errors: any }) {


  const statusOptions = [
    { value: 'PASS', label: 'Pass' },
    { value: 'FAIL', label: 'Fail' },
    { value: 'NEEDS_ATTENTION', label: 'Needs Attention' },
  ];

  const inspectionFields = [
    { name: 'inspectionEngineStatus', label: 'Engine Status' },
    { name: 'inspectionTransmissionStatus', label: 'Transmission Status' },
    { name: 'inspectionSuspensionStatus', label: 'Suspension Status' },
    { name: 'inspectionElectricalStatus', label: 'Electrical Status' },
    { name: 'inspectionAcStatus', label: 'A/C Status' },
    { name: 'inspectionTiresStatus', label: 'Tires Status' },
    { name: 'inspectionInteriorStatus', label: 'Interior Status' },
    { name: 'inspectionExteriorStatus', label: 'Exterior Status' },
  ];

  return (
    <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Inspection Report</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date *</label>
          <input 
            type="date" 
            {...register('inspectionDate')} 
            className={`w-full border px-3 py-2 rounded text-black bg-white focus:outline-none focus:ring ${errors.inspectionDate ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} 
          />
          {errors.inspectionDate && <p className="text-red-500 text-sm mt-1">❌ {errors.inspectionDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name *</label>
          <input 
            type="text" 
            {...register('inspectorName')} 
            className={`w-full border px-3 py-2 rounded text-black bg-white focus:outline-none focus:ring ${errors.inspectorName ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} 
            placeholder="John Doe"
          />
          {errors.inspectorName && <p className="text-red-500 text-sm mt-1">❌ {errors.inspectorName.message}</p>}
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="font-semibold text-gray-700 mb-4">Component Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inspectionFields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              <select 
                {...register(field.name)} 
                className="w-full border border-gray-300 text-sm px-2 py-1.5 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
        <textarea 
          {...register('inspectionGeneralNotes')} 
          rows={3} 
          className="w-full border border-gray-300 px-3 py-2 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none"
          placeholder="Any additional notes or details about the inspection..."
        ></textarea>
      </div>
    </div>
  );
}
