'use client';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { type Control } from 'react-hook-form';
import type { VehicleFormValues } from './VehicleForm';

export default function InspectionTab({ control }: { control: Control<VehicleFormValues> }) {

  const statusOptions = [
    { value: 'PASS', label: 'Pass' },
    { value: 'FAIL', label: 'Fail' },
    { value: 'NEEDS_ATTENTION', label: 'Needs Attention' },
  ];

  const inspectionFields: Array<{ name: keyof VehicleFormValues; label: string }> = [
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
        <FormField
          control={control}
          name="inspectionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="inspectorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspector Name *</FormLabel>
              <FormControl>
                <Input type="text" placeholder="John Doe" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="font-semibold text-gray-700 mb-4">Component Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inspectionFields.map((f) => (
            <FormField
              key={f.name}
              control={control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600">{f.label}</FormLabel>
                  <Select onValueChange={field.onChange} value={(field.value as string) || 'PASS'}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <FormField
          control={control}
          name="inspectionGeneralNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Notes</FormLabel>
              <FormControl>
                <Textarea 
                  rows={3} 
                  placeholder="Any additional notes or details about the inspection..."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
