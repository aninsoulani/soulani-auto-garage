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

const baseSchema = z.object({
  make: z.string().min(1, 'Merk is required.'),
  model: z.string().min(1, 'Vehicle model is required.'),
  year: z.number().min(1900, 'Year must be between 1900 and the current year.').max(new Date().getFullYear() + 1, 'Year must be between 1900 and the current year.'),
  color: z.string().min(1, 'Color is required.'),
  listingType: z.enum(['SALE', 'RENTAL', 'BOTH']),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE']),
  vin: z.string().optional().nullable(),
  plateNumber: z.string().min(1, 'Plate number is required.'),
  chassisNumber: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  mileage: z.number().min(1, 'Mileage must be greater than 0.'),
  carType: z.enum(['SUV', 'MPV', 'HATCHBACK', 'SEDAN', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'CROSSOVER']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT']).optional().nullable(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC']).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  description: z.string().min(1, 'Description is required.'),

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
});

const getVehicleSchema = (isEditMode: boolean) => baseSchema.superRefine((data, ctx) => {
  if (['SALE', 'BOTH'].includes(data.listingType)) {
    if (!data.salesPrice || data.salesPrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sales price is required for vehicles listed for sale.', path: ['salesPrice'] });
    }
  }
  if (['RENTAL', 'BOTH'].includes(data.listingType)) {
    if (!data.rentalDailyRate || data.rentalDailyRate <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rental price is required for rental vehicles.', path: ['rentalDailyRate'] });
    }
  }

  if (isEditMode) {
    if (!data.inspectionDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspection date is required.', path: ['inspectionDate'] });
    }
    if (!data.inspectorName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspector name is required.', path: ['inspectorName'] });
    }
  } else {
    if (data.inspectionDate && !data.inspectorName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspector name is required.', path: ['inspectorName'] });
    }
    if (!data.inspectionDate && data.inspectorName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspection date is required.', path: ['inspectionDate'] });
    }
  }
});

type VehicleFormValues = z.infer<typeof baseSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VehicleForm({ initialData, vehicleId }: { initialData?: any, vehicleId?: string }) {
  const [activeTab, setActiveTab] = useState('core');
  const [imageError, setImageError] = useState(false);
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(getVehicleSchema(!!vehicleId)),
    defaultValues: {
      make: initialData?.make || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      color: initialData?.color || '',
      listingType: initialData?.listingType || 'SALE',
      status: initialData?.status || 'AVAILABLE',
      vin: initialData?.vin || '',
      plateNumber: initialData?.plateNumber || '',
      chassisNumber: initialData?.chassisNumber || '',
      engineNumber: initialData?.engineNumber || '',
      mileage: initialData?.mileage || 0,
      carType: initialData?.carType || 'SUV',
      transmission: initialData?.transmission || 'AUTOMATIC',
      fuelType: initialData?.fuelType || 'GASOLINE',
      isFeatured: initialData?.isFeatured || false,
      isNewArrival: initialData?.isNewArrival ?? true,
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

  const currentListingType = watch('listingType');

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      if (vehicleId) {
        // Verify image count before allowing save
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingVehicle = await apiFetch(`/vehicles/${vehicleId}`) as any;
        if (existingVehicle && (!existingVehicle.images || existingVehicle.images.length === 0)) {
          setImageError(true);
          setActiveTab('images');
          return;
        }
      }
      setImageError(false);

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
        savedVehicleId = res.id;
      }

      // Automatically save pricing config based on type
      if (['SALE', 'BOTH'].includes(data.listingType)) {
        await apiFetch(`/vehicles/${savedVehicleId}/sales-listing`, {
          method: 'PUT',
          body: JSON.stringify({ price: data.salesPrice || 0, previousOwners: data.salesPreviousOwners || 0 }),
          token: accessToken || undefined
        });
      }

      if (['RENTAL', 'BOTH'].includes(data.listingType)) {
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

  const coreErrorKeys = ['make', 'model', 'year', 'color', 'listingType', 'status', 'plateNumber', 'vin', 'chassisNumber', 'engineNumber', 'mileage', 'transmission', 'fuelType', 'description'];
  const pricingErrorKeys = ['salesPrice', 'rentalDailyRate', 'rentalDepositAmount'];
  const inspectionErrorKeys = ['inspectionDate', 'inspectorName', 'inspectionEngineStatus', 'inspectionTransmissionStatus', 'inspectionSuspensionStatus', 'inspectionElectricalStatus', 'inspectionAcStatus', 'inspectionTiresStatus', 'inspectionInteriorStatus', 'inspectionExteriorStatus', 'inspectionGeneralNotes'];

  const hasCoreErrors = coreErrorKeys.some(k => errors[k as keyof VehicleFormValues]);
  const hasPricingErrors = pricingErrorKeys.some(k => errors[k as keyof VehicleFormValues]);
  const hasInspectionErrors = inspectionErrorKeys.some(k => errors[k as keyof VehicleFormValues]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (formErrors: any) => {
    // Auto-navigate to the first tab with an error so React Hook Form can focus the first invalid field
    if (coreErrorKeys.some(k => formErrors[k])) {
      setActiveTab('core');
    } else if (pricingErrorKeys.some(k => formErrors[k])) {
      setActiveTab('pricing');
    } else if (inspectionErrorKeys.some(k => formErrors[k])) {
      setActiveTab('inspections');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab('core')}
          className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'core' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Core Details {hasCoreErrors && <span title="Contains errors" className="text-red-500 text-xs">⚠️</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'images' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Images {imageError && <span title="Contains errors" className="text-red-500 text-xs">⚠️</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspections')}
          className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'inspections' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inspections {hasInspectionErrors && <span title="Contains errors" className="text-red-500 text-xs">⚠️</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'pricing' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pricing Settings {hasPricingErrors && <span title="Contains errors" className="text-red-500 text-xs">⚠️</span>}
        </button>
      </div>

      <div className="p-8">
        <div className={activeTab === 'core' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merk *</label>
              <input placeholder="Toyota" {...register('make')} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.make ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.make && <p className="text-red-500 text-sm mt-1">❌ {errors.make.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input placeholder="Fortuner GR Sport" {...register('model')} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.model ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.model && <p className="text-red-500 text-sm mt-1">❌ {errors.model.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input placeholder="2023" type="number" {...register('year', { valueAsNumber: true })} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.year ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.year && <p className="text-red-500 text-sm mt-1">❌ {errors.year.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
              <input placeholder="White" {...register('color')} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.color ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.color && <p className="text-red-500 text-sm mt-1">❌ {errors.color.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
              <select {...register('listingType')} className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring focus:ring-blue-200">
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
              <input placeholder="B 1234 XYZ" {...register('plateNumber')} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.plateNumber ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.plateNumber && <p className="text-red-500 text-sm mt-1">❌ {errors.plateNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
              <input placeholder="MHF123..." {...register('vin')} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring border-gray-300 focus:ring-blue-200`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km) *</label>
              <input placeholder="45000" type="number" {...register('mileage', { valueAsNumber: true })} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.mileage ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
              {errors.mileage && <p className="text-red-500 text-sm mt-1">❌ {errors.mileage.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Car Type *</label>
              <select {...register('carType')} className={`w-full border px-3 py-2 rounded text-black bg-white focus:outline-none focus:ring ${errors.carType ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}>
                <option value="SUV">SUV</option>
                <option value="MPV">MPV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="SEDAN">Sedan</option>
                <option value="COUPE">Coupe</option>
                <option value="CONVERTIBLE">Convertible</option>
                <option value="WAGON">Wagon</option>
                <option value="PICKUP">Pickup</option>
                <option value="VAN">Van</option>
                <option value="CROSSOVER">Crossover</option>
              </select>
              {errors.carType && <p className="text-red-500 text-sm mt-1">❌ {errors.carType.message}</p>}
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

          <div className="mt-6 grid grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-gray-900">Pilihan Terbaik (Featured)</span>
                  <span className="block text-xs text-gray-500">Show this vehicle prominently on the homepage</span>
                </div>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('isNewArrival')} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-gray-900">Baru Masuk (New Arrival)</span>
                  <span className="block text-xs text-gray-500">Tag this vehicle as newly arrived inventory</span>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea placeholder="Well maintained vehicle with complete service history" {...register('description')} rows={5} className={`w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring ${errors.description ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}></textarea>
            {errors.description && <p className="text-red-500 text-sm mt-1">❌ {errors.description.message}</p>}
          </div>
        </div>

        <div className={activeTab === 'images' ? 'block' : 'hidden'}>
          {imageError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              <p className="font-semibold">❌ Validation Error</p>
              <p className="text-sm mt-1">At least one vehicle image is required.</p>
            </div>
          )}
          {vehicleId ? (
            <ImageUploaderTab vehicleId={vehicleId} initialImages={initialData?.images || []} />
          ) : (
            <div className="text-gray-500 py-8 text-center italic bg-gray-50 border rounded-lg">Please save the vehicle core details first before uploading images.</div>
          )}
        </div>

        <div className={activeTab === 'inspections' ? 'block' : 'hidden'}>
          <InspectionTab register={register} vehicleId={vehicleId ? parseInt(vehicleId) : null} errors={errors} />
        </div>

        <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
          <PricingTab listingType={currentListingType} register={register} errors={errors} />
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
