'use client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PricingTab({ vehicleType, register }: { vehicleType: string, register: any }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      {['SALE', 'BOTH'].includes(vehicleType) && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Sales Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Price (IDR)</label>
              <input type="number" {...register('salesPrice', { valueAsNumber: true })} className="w-full border border-gray-300 px-3 py-2 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Previous Owners</label>
              <input type="number" {...register('salesPreviousOwners', { valueAsNumber: true })} className="w-full border border-gray-300 px-3 py-2 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none" />
            </div>
          </div>
        </div>
      )}

      {['RENTAL', 'BOTH'].includes(vehicleType) && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Rental Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Daily Rate (IDR)</label>
              <input type="number" {...register('rentalDailyRate', { valueAsNumber: true })} className="w-full border border-gray-300 px-3 py-2 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Deposit Amount (IDR)</label>
              <input type="number" {...register('rentalDepositAmount', { valueAsNumber: true })} className="w-full border border-gray-300 px-3 py-2 rounded text-black bg-white focus:ring focus:ring-blue-200 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 pt-2 pb-1">
              <input type="checkbox" {...register('rentalIsLongTermEligible')} id="longTerm" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="longTerm" className="text-sm font-medium text-gray-700">Eligible for Long Term Rental (&gt; 7 Days)</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
