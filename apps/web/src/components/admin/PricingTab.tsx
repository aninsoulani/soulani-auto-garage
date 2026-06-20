'use client';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconInfoCircle } from '@tabler/icons-react';

import { type Control } from 'react-hook-form';
import type { VehicleFormValues } from './VehicleForm';

export default function PricingTab({ listingType, control }: { listingType: string, control: Control<VehicleFormValues> }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      {['SALE', 'BOTH'].includes(listingType) && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Sales Configuration</h3>
          <div className="space-y-4">
            <FormField
              control={control}
              name="salesPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Price (IDR) *</FormLabel>
                  <FormControl>
                    <Input placeholder="450000000" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="salesPreviousOwners"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Owners</FormLabel>
                  <FormControl>
                    <Input placeholder="1" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {['RENTAL', 'BOTH'].includes(listingType) && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Rental Configuration</h3>
          <div className="space-y-4">
            <FormField
              control={control}
              name="rentalDailyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rate (IDR) *</FormLabel>
                  <FormControl>
                    <Input placeholder="750000" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="rentalDepositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount (IDR)</FormLabel>
                  <FormControl>
                    <Input placeholder="1000000" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="rentalIsLongTermEligible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2 pb-1">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Eligible for Long Term Rental (&gt; 7 Days)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" className="cursor-help">
                          <IconInfoCircle className="w-4 h-4 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] text-sm font-normal">
                          <p>Mengaktifkan opsi ini akan menampilkan tombol &quot;Penawaran Sewa Jangka Panjang&quot; di halaman detail mobil, memungkinkan pelanggan meminta harga khusus via WhatsApp.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="pt-2 mt-2 border-t border-slate-100">
              <FormField
                control={control}
                name="rentalIsDriverAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2 pb-3">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Sediakan Opsi Supir (Dengan Driver)
                    </FormLabel>
                  </FormItem>
                )}
              />

              {control._formValues.rentalIsDriverAvailable && (
                <FormField
                  control={control}
                  name="rentalDriverFeePerDay"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                      <FormLabel>Tarif Supir Harian (IDR)</FormLabel>
                      <FormControl>
                        <Input placeholder="200000" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
