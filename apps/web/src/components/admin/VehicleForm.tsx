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
import { AlertCircle } from 'lucide-react';
import InspectionTab from './InspectionTab';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const baseSchema = z.object({
  make: z.string().min(1, 'Merk is required.'),
  model: z.string().min(1, 'Vehicle model is required.'),
  year: z.number().min(1900, 'Year must be between 1900 and the current year.').max(new Date().getFullYear() + 1, 'Year must be between 1900 and the current year.'),
  color: z.string().min(1, 'Color is required.'),
  listingType: z.enum(['SALE', 'RENTAL', 'BOTH']),
  status: z.enum(['ACTIVE', 'SOLD', 'RENTED', 'MAINTENANCE']),
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
  images: z.array(z.any()).optional(),
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

  if (!data.inspectionDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspection date is required.', path: ['inspectionDate'] });
  }
  if (!data.inspectorName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inspector name is required.', path: ['inspectorName'] });
  }
  if (!isEditMode) {
    if (!data.images || data.images.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one image is required.', path: ['images'] });
    }
  }
});

type VehicleFormValues = z.infer<typeof baseSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VehicleForm({ initialData, vehicleId }: { initialData?: any, vehicleId?: string }) {
  const [activeTab, setActiveTab] = useState('core');
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localImagePreviews, setLocalImagePreviews] = useState<string[]>([]);

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newFiles = [...selectedFiles, ...filesArray];
      setSelectedFiles(newFiles);

      const previews = filesArray.map(file => URL.createObjectURL(file));
      setLocalImagePreviews(prev => [...prev, ...previews]);

      setValue('images', newFiles, { shouldValidate: true });
    }
  };

  const removeLocalImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setLocalImagePreviews(prev => prev.filter((_, i) => i !== index));

    setValue('images', newFiles, { shouldValidate: true });
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newFiles = [...selectedFiles];
    const [draggedItem] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedItem);
    setSelectedFiles(newFiles);

    const newPreviews = [...localImagePreviews];
    const [draggedPreview] = newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(targetIndex, 0, draggedPreview);
    setLocalImagePreviews(newPreviews);

    setDraggedIndex(null);
    setValue('images', newFiles, { shouldValidate: true });
  };

  const form = useForm<VehicleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(getVehicleSchema(!!vehicleId) as any),
    defaultValues: {
      make: initialData?.make || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      color: initialData?.color || '',
      listingType: initialData?.listingType || 'SALE',
      status: initialData?.status || 'ACTIVE',
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

  const { handleSubmit, watch, control, setValue, formState: { errors, isSubmitting } } = form;

  const currentListingType = watch('listingType');

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      if (vehicleId) {
        // Verify image count before allowing save
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingVehicle = await apiFetch(`/vehicles/${vehicleId}`) as any;
        if (existingVehicle && (!existingVehicle.images || existingVehicle.images.length === 0)) {
          // Fallback logic for edit mode if required
          setActiveTab('images');
          return;
        }
      }
      const {
        ...coreData
      } = data;

      const savedVehicleId = vehicleId;

      if (!savedVehicleId) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        // Construct the full payload for the wizard
        const wizardData = {
          ...coreData,
          salesPrice: data.salesPrice,
          salesPreviousOwners: data.salesPreviousOwners,
          rentalDailyRate: data.rentalDailyRate,
          rentalDepositAmount: data.rentalDepositAmount,
          rentalIsLongTermEligible: data.rentalIsLongTermEligible,
          inspectionDate: data.inspectionDate,
          inspectorName: data.inspectorName,
          inspectionEngineStatus: data.inspectionEngineStatus,
          inspectionTransmissionStatus: data.inspectionTransmissionStatus,
          inspectionSuspensionStatus: data.inspectionSuspensionStatus,
          inspectionElectricalStatus: data.inspectionElectricalStatus,
          inspectionAcStatus: data.inspectionAcStatus,
          inspectionTiresStatus: data.inspectionTiresStatus,
          inspectionInteriorStatus: data.inspectionInteriorStatus,
          inspectionExteriorStatus: data.inspectionExteriorStatus,
          inspectionGeneralNotes: data.inspectionGeneralNotes
        };
        formData.append('data', JSON.stringify(wizardData));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/vehicles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Creation failed');
        }
      } else {
        await apiFetch(`/vehicles/${savedVehicleId}`, {
          method: 'PATCH',
          body: JSON.stringify(coreData),
          token: accessToken || undefined
        });

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
  const imageErrorKeys = ['images'];

  const hasCoreErrors = coreErrorKeys.some(k => errors[k as keyof VehicleFormValues]);
  const hasPricingErrors = pricingErrorKeys.some(k => errors[k as keyof VehicleFormValues]);
  const hasInspectionErrors = inspectionErrorKeys.some(k => errors[k as keyof VehicleFormValues]);
  const hasImageErrors = imageErrorKeys.some(k => errors[k as keyof VehicleFormValues]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (formErrors: any) => {
    // Strict priority: Core -> Images -> Inspections -> Pricing
    const errorSequence = [
      { tab: 'core', keys: coreErrorKeys },
      { tab: 'images', keys: imageErrorKeys },
      { tab: 'inspections', keys: inspectionErrorKeys },
      { tab: 'pricing', keys: pricingErrorKeys }
    ];

    for (const step of errorSequence) {
      if (step.keys.some(k => formErrors[k])) {
        setActiveTab(step.tab);
        break; // Break immediately as per user instructions
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'core' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Core Details {hasCoreErrors && <span title="Contains errors"><AlertCircle className="text-red-500 w-4 h-4" /></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'images' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Images {hasImageErrors && <span title="Contains errors"><AlertCircle className="text-red-500 w-4 h-4" /></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inspections')}
            className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'inspections' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Inspections {hasInspectionErrors && <span title="Contains errors"><AlertCircle className="text-red-500 w-4 h-4" /></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-6 py-4 font-medium transition flex items-center gap-2 ${activeTab === 'pricing' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pricing Settings {hasPricingErrors && <span title="Contains errors"><AlertCircle className="text-red-500 w-4 h-4" /></span>}
          </button>
        </div>

        <div className="p-8">
          <div className={activeTab === 'core' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-2 gap-6">
              <FormField control={control} name="make" render={({ field }) => (
                <FormItem><FormLabel>Merk *</FormLabel><FormControl><Input placeholder="Toyota" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="model" render={({ field }) => (
                <FormItem><FormLabel>Model *</FormLabel><FormControl><Input placeholder="Fortuner GR Sport" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="year" render={({ field }) => (
                <FormItem><FormLabel>Year *</FormLabel><FormControl><Input type="number" placeholder="2023" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color *</FormLabel><FormControl><Input placeholder="White" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="listingType" render={({ field }) => (
                <FormItem><FormLabel>Listing Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="SALE">Sale</SelectItem><SelectItem value="RENTAL">Rental</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="SOLD">Sold</SelectItem><SelectItem value="RENTED">Rented</SelectItem><SelectItem value="MAINTENANCE">Maintenance</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="plateNumber" render={({ field }) => (
                <FormItem><FormLabel>Plate Number *</FormLabel><FormControl><Input placeholder="B 1234 XYZ" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="vin" render={({ field }) => (
                <FormItem><FormLabel>VIN</FormLabel><FormControl><Input placeholder="MHF123..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="mileage" render={({ field }) => (
                <FormItem><FormLabel>Mileage (km) *</FormLabel><FormControl><Input type="number" placeholder="45000" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="carType" render={({ field }) => (
                <FormItem><FormLabel>Car Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select car type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="SUV">SUV</SelectItem><SelectItem value="MPV">MPV</SelectItem><SelectItem value="HATCHBACK">Hatchback</SelectItem><SelectItem value="SEDAN">Sedan</SelectItem><SelectItem value="COUPE">Coupe</SelectItem><SelectItem value="CONVERTIBLE">Convertible</SelectItem><SelectItem value="WAGON">Wagon</SelectItem><SelectItem value="PICKUP">Pickup</SelectItem><SelectItem value="VAN">Van</SelectItem><SelectItem value="CROSSOVER">Crossover</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="transmission" render={({ field }) => (
                <FormItem><FormLabel>Transmission</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select transmission" /></SelectTrigger></FormControl><SelectContent><SelectItem value="AUTOMATIC">Automatic</SelectItem><SelectItem value="MANUAL">Manual</SelectItem><SelectItem value="CVT">CVT</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="fuelType" render={({ field }) => (
                <FormItem><FormLabel>Fuel Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select fuel type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="GASOLINE">Gasoline</SelectItem><SelectItem value="DIESEL">Diesel</SelectItem><SelectItem value="HYBRID">Hybrid</SelectItem><SelectItem value="ELECTRIC">Electric</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <FormField control={control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-semibold text-gray-900">Pilihan Terbaik (Featured)</FormLabel>
                    <p className="text-xs text-gray-500">Show this vehicle prominently on the homepage</p>
                  </div>
                </FormItem>
              )} />
              <FormField control={control} name="isNewArrival" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-semibold text-gray-900">Baru Masuk (New Arrival)</FormLabel>
                    <p className="text-xs text-gray-500">Tag this vehicle as newly arrived inventory</p>
                  </div>
                </FormItem>
              )} />
            </div>

            <div className="mt-6">
              <FormField control={control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Well maintained vehicle with complete service history" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className={activeTab === 'images' ? 'block' : 'hidden'}>
            {errors.images && typeof errors.images.message === 'string' && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                <p className="text-sm mt-1"> {errors.images.message}</p>
              </div>
            )}
            {vehicleId ? (
              <ImageUploaderTab vehicleId={vehicleId} initialImages={initialData?.images || []} />
            ) : (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col justify-center items-center gap-2">
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                    Select Images (Max 5MB)
                    <input type="file" multiple accept="image/png, image/jpeg, image/webp, image/jfif" className="hidden" onChange={handleLocalUpload} />
                  </label>
                  <span className="text-xs text-gray-500">JPG, PNG, WebP, and JFIF are supported. Min 1 required.</span>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {localImagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`border rounded relative group overflow-hidden bg-gray-100 flex flex-col cursor-move transition ${draggedIndex === index ? 'opacity-50 border-blue-500 border-2' : ''}`}
                    >
                      <div className="relative w-full h-32">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} className="object-cover w-full h-full pointer-events-none" alt="Preview" />
                        {index === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Primary</span>}
                      </div>
                      <div className="bg-white p-2 flex justify-end items-center border-t gap-2">
                        <button type="button" onClick={() => removeLocalImage(index)} className="text-red-600 font-medium text-xs hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={activeTab === 'inspections' ? 'block' : 'hidden'}>
            <InspectionTab control={control} />
          </div>

          <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
            <PricingTab listingType={currentListingType} control={control} />
          </div>

          <div className="flex justify-end gap-3 border-t mt-8 pt-6 border-gray-200">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/inventory')} className="px-8 py-6 rounded-lg font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-8 py-6 rounded-lg font-semibold">
              {isSubmitting ? 'Saving...' : 'Save Vehicle'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
