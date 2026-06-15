'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import ImageUploaderTab from './ImageUploaderTab';
import PricingTab from './PricingTab';
import InspectionTab from './InspectionTab';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  type: z.enum(['SALE', 'RENTAL', 'BOTH']),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE']),
  vin: z.string().optional().nullable(),
  plateNumber: z.string().min(1, 'Plate Number is required'),
  chassisNumber: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  mileage: z.number().optional().nullable(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT']).optional().nullable(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC']).optional().nullable(),
  description: z.string().optional().nullable(),

  salesPrice: z.number().optional().nullable(),
  salesPreviousOwners: z.number().optional().nullable(),
  rentalDailyRate: z.number().optional().nullable(),
  rentalDepositAmount: z.number().optional().nullable(),
  rentalIsLongTermEligible: z.boolean().optional().nullable(),

  inspectionDate: z.string().optional().nullable(),
  inspectorName: z.string().optional().nullable(),
  inspectionEngineStatus: z.string().optional().nullable(),
  inspectionTransmissionStatus: z.string().optional().nullable(),
  inspectionSuspensionStatus: z.string().optional().nullable(),
  inspectionElectricalStatus: z.string().optional().nullable(),
  inspectionAcStatus: z.string().optional().nullable(),
  inspectionTiresStatus: z.string().optional().nullable(),
  inspectionInteriorStatus: z.string().optional().nullable(),
  inspectionExteriorStatus: z.string().optional().nullable(),
  inspectionGeneralNotes: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.inspectionDate && !data.inspectorName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Inspector Name is required when Inspection Date is provided',
      path: ['inspectorName'],
    });
  }
  if (!data.inspectionDate && data.inspectorName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Inspection Date is required when Inspector Name is provided',
      path: ['inspectionDate'],
    });
  }
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VehicleForm({ initialData, vehicleId }: { initialData?: any, vehicleId?: string }) {
  const [activeTab, setActiveTab] = useState('core');
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: initialData?.make || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      color: initialData?.color || '',
      type: initialData?.type || 'SALE',
      status: initialData?.status || 'AVAILABLE',
      vin: initialData?.vin || '',
      plateNumber: initialData?.plateNumber || '',
      chassisNumber: initialData?.chassisNumber || '',
      engineNumber: initialData?.engineNumber || '',
      mileage: initialData?.mileage || 0,
      transmission: initialData?.transmission || 'AUTOMATIC',
      fuelType: initialData?.fuelType || 'GASOLINE',
      description: initialData?.description || '',

      salesPrice: initialData?.salesListing?.price || 0,
      salesPreviousOwners: initialData?.salesListing?.previousOwners || 0,
      rentalDailyRate: initialData?.rentalListing?.dailyRate || 0,
      rentalDepositAmount: initialData?.rentalListing?.depositAmount || 0,
      rentalIsLongTermEligible: initialData?.rentalListing?.isLongTermEligible || false,

      inspectionDate: initialData?.inspections?.[0]?.inspectionDate ? new Date(initialData.inspections[0].inspectionDate).toISOString().split('T')[0] : '',
      inspectorName: initialData?.inspections?.[0]?.inspectorName || '',
      inspectionEngineStatus: initialData?.inspections?.[0]?.engineStatus || 'PASS',
      inspectionTransmissionStatus: initialData?.inspections?.[0]?.transmissionStatus || 'PASS',
      inspectionSuspensionStatus: initialData?.inspections?.[0]?.suspensionStatus || 'PASS',
      inspectionElectricalStatus: initialData?.inspections?.[0]?.electricalStatus || 'PASS',
      inspectionAcStatus: initialData?.inspections?.[0]?.acStatus || 'PASS',
      inspectionTiresStatus: initialData?.inspections?.[0]?.tiresStatus || 'PASS',
      inspectionInteriorStatus: initialData?.inspections?.[0]?.interiorStatus || 'PASS',
      inspectionExteriorStatus: initialData?.inspections?.[0]?.exteriorStatus || 'PASS',
      inspectionGeneralNotes: initialData?.inspections?.[0]?.generalNotes || '',
    }
  });

  const currentType = watch('type');

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        salesPrice, salesPreviousOwners,
        rentalDailyRate, rentalDepositAmount, rentalIsLongTermEligible,
        inspectionDate, inspectorName, inspectionEngineStatus, inspectionTransmissionStatus,
        inspectionSuspensionStatus, inspectionElectricalStatus, inspectionAcStatus,
        inspectionTiresStatus, inspectionInteriorStatus, inspectionExteriorStatus,
        inspectionGeneralNotes,
        ...coreData
      } = data;

      let savedVehicleId = vehicleId;

      if (savedVehicleId) {
        await apiFetch(`/vehicles/${savedVehicleId}`, {
          method: 'PATCH',
          body: JSON.stringify(coreData),
          token: accessToken || undefined
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await apiFetch<any>('/vehicles', {
          method: 'POST',
          body: JSON.stringify(coreData),
          token: accessToken || undefined
        });
        savedVehicleId = res.data.id;
      }

      // Automatically save pricing config based on type
      if (['SALE', 'BOTH'].includes(data.type)) {
        await apiFetch(`/vehicles/${savedVehicleId}/sales-listing`, {
          method: 'PUT',
          body: JSON.stringify({ price: data.salesPrice || 0, previousOwners: data.salesPreviousOwners || 0 }),
          token: accessToken || undefined
        });
      }

      if (['RENTAL', 'BOTH'].includes(data.type)) {
        await apiFetch(`/vehicles/${savedVehicleId}/rental-listing`, {
          method: 'PUT',
          body: JSON.stringify({ dailyRate: data.rentalDailyRate || 0, depositAmount: data.rentalDepositAmount || 0, isLongTermEligible: data.rentalIsLongTermEligible || false }),
          token: accessToken || undefined
        });
      }

      if (data.inspectionDate && data.inspectorName) {
        const inspectionPayload = {
          inspectionDate: new Date(data.inspectionDate).toISOString(),
          inspectorName: data.inspectorName,
          engineStatus: data.inspectionEngineStatus,
          transmissionStatus: data.inspectionTransmissionStatus,
          suspensionStatus: data.inspectionSuspensionStatus,
          electricalStatus: data.inspectionElectricalStatus,
          acStatus: data.inspectionAcStatus,
          tiresStatus: data.inspectionTiresStatus,
          interiorStatus: data.inspectionInteriorStatus,
          exteriorStatus: data.inspectionExteriorStatus,
          generalNotes: data.inspectionGeneralNotes
        };

        if (initialData?.inspections?.[0]?.id) {
          await apiFetch(`/vehicles/${savedVehicleId}/inspections/${initialData.inspections[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify(inspectionPayload),
            token: accessToken || undefined
          });
        } else {
          await apiFetch(`/vehicles/${savedVehicleId}/inspections`, {
            method: 'POST',
            body: JSON.stringify(inspectionPayload),
            token: accessToken || undefined
          });
        }
      }

      Swal.fire({
        title: 'Success!',
        text: 'Vehicle saved successfully!',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        router.push('/admin/inventory');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Error saving vehicle',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (errors: any) => {
    console.log('Validation errors:', errors);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessages = Object.values(errors).map((e: any) => e?.message).filter(Boolean);
    Swal.fire({
      title: 'Validation Error',
      text: errorMessages.length > 0 ? errorMessages.join(', ') : 'Please check all tabs for invalid fields.',
      icon: 'error',
      confirmButtonColor: '#2563eb'
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab('core')}
          className={`px-6 py-4 font-medium transition ${activeTab === 'core' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Core Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`px-6 py-4 font-medium transition ${activeTab === 'images' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Images
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspections')}
          className={`px-6 py-4 font-medium transition ${activeTab === 'inspections' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inspections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-6 py-4 font-medium transition ${activeTab === 'pricing' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pricing Settings
        </button>
      </div>

      <div className="p-8">
        <div className={activeTab === 'core' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
              <input {...register('make')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
              {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input {...register('model')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input type="number" {...register('year', { valueAsNumber: true })} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
              <input {...register('color')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
              {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select {...register('type')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200">
                <option value="SALE">Sale</option>
                <option value="RENTAL">Rental</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select {...register('status')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200">
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
              <input {...register('plateNumber')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
              {errors.plateNumber && <p className="text-red-500 text-xs mt-1">{errors.plateNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
              <input {...register('vin')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
              <select {...register('transmission')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200">
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
                <option value="CVT">CVT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select {...register('fuelType')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200">
                <option value="GASOLINE">Gasoline</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={5} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200"></textarea>
          </div>
        </div>

        <div className={activeTab === 'images' ? 'block' : 'hidden'}>
          {vehicleId ? (
            <ImageUploaderTab vehicleId={vehicleId} initialImages={initialData?.images || []} />
          ) : (
            <div className="text-gray-500 py-8 text-center italic bg-gray-50 border rounded-lg">Please save the vehicle core details first before uploading images.</div>
          )}
        </div>

        <div className={activeTab === 'inspections' ? 'block' : 'hidden'}>
          <InspectionTab register={register} vehicleId={vehicleId ? parseInt(vehicleId) : null} />
        </div>

        <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
          <PricingTab vehicleType={currentType} register={register} />
        </div>

        <div className="flex justify-end gap-3 border-t mt-8 pt-6 border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/admin/inventory')}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold shadow-sm transition"
          >
            Cancel
          </button>
          <button disabled={isSubmitting} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Vehicle'}
          </button>
        </div>
      </div>
    </form>
  );
}
