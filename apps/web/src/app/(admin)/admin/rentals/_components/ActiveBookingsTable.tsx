'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getAdminRentalBookings, updateRentalBookingStatus, updateBookingPaperwork } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IconFileText, IconEye, IconDownload, IconSearch, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { RentalBooking } from '@/types/api.types';

const handleDownload = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Download failed', error);
  }
};

interface PaperworkFormProps {
  booking: RentalBooking;
  accessToken: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

function ImagePreviewDialog({ imageUrl, alt }: { imageUrl: string, alt: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className="text-xs text-blue-600 hover:underline mt-1 block" />}>
        View Full Size
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <DialogDescription className="sr-only">Full size preview of the document</DialogDescription>
        <img src={imageUrl} alt={alt} className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
      </DialogContent>
    </Dialog>
  );
}

function PaperworkForm({ booking, accessToken, onSuccess, onCancel }: PaperworkFormProps) {
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [transferPreview, setTransferPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paperworkSchema = z.object({
    identityNumber: z.string().min(1, "Identity number is required"),
    licenseFile: z.any().optional(),
    transferFile: z.any().optional()
  }).superRefine((data, ctx) => {
    if (!booking.licenseImageUrl && !licenseFile) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "KTP/SIM photo is required", path: ["licenseFile"] });
    }
    if (!booking.proofOfTransferUrl && !transferFile) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Proof of transfer is required", path: ["transferFile"] });
    }
  });

  type PaperworkFormValues = z.infer<typeof paperworkSchema>;

  const form = useForm<PaperworkFormValues>({
    resolver: zodResolver(paperworkSchema),
    defaultValues: {
      identityNumber: booking.identityNumber || '',
    }
  });

  useEffect(() => {
    if (licenseFile) {
      const url = URL.createObjectURL(licenseFile);
      setLicensePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLicensePreview(null);
    }
  }, [licenseFile]);

  useEffect(() => {
    if (transferFile) {
      const url = URL.createObjectURL(transferFile);
      setTransferPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setTransferPreview(null);
    }
  }, [transferFile]);

  const onSubmit = async (values: PaperworkFormValues) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('identityNumber', values.identityNumber);
      if (licenseFile) {
        formData.append('license', licenseFile);
      }
      if (transferFile) {
        formData.append('proofOfTransfer', transferFile);
      }

      await updateBookingPaperwork(booking.id, formData, accessToken);
      Swal.fire({
        title: 'Documents Updated',
        text: 'Paperwork has been successfully uploaded.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      onSuccess();
    } catch (err: unknown) {
      Swal.fire('Failed', (err as Error).message || 'Failed to update paperwork', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200" noValidate>
        <FormField
          control={form.control}
          name="identityNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-600 mb-1">Identity Number (Nomor KTP/SIM) <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter 16-digit KTP or SIM number"
                  className="bg-white text-sm h-10"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-600 mb-1">Foto KTP/SIM <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setLicenseFile(e.target.files?.[0] || null);
                    field.onChange(e.target.files?.[0] || null);
                  }}
                  className="bg-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
              {licensePreview && (
                <div className="mt-2">
                  <img src={licensePreview} alt="KTP Preview" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                  <ImagePreviewDialog imageUrl={licensePreview} alt="KTP Full Size Preview" />
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transferFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-600 mb-1">Bukti Transfer <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setTransferFile(e.target.files?.[0] || null);
                    field.onChange(e.target.files?.[0] || null);
                  }}
                  className="bg-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
              {transferPreview && (
                <div className="mt-2">
                  <img src={transferPreview} alt="Transfer Preview" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                  <ImagePreviewDialog imageUrl={transferPreview} alt="Transfer Full Size Preview" />
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" className="flex-1 text-xs h-9" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" className="flex-1 text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
            {submitting ? 'Uploading...' : 'Save Documents'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface BookingDetailsSheetContentProps {
  booking: RentalBooking;
  accessToken: string;
  fetchBookings: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  handleStatusChange: (id: number, status: string) => void;
}

function BookingDetailsSheetContent({
  booking,
  accessToken,
  fetchBookings,
  getStatusBadge,
  handleStatusChange,
}: BookingDetailsSheetContentProps) {
  const isPaperworkMissing = !booking.identityNumber || !booking.licenseImageUrl || !booking.proofOfTransferUrl;
  const [isEditing, setIsEditing] = useState(isPaperworkMissing);

  return (
    <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
      <SheetHeader className="mb-6">
        <SheetTitle>Booking Details {booking.bookingCode || `#${booking.id}`}</SheetTitle>
        <SheetDescription>Full rental information and customer documents.</SheetDescription>
      </SheetHeader>
      
      <div className="space-y-6">
        {/* Status */}
        <div>
          <p className="text-sm text-slate-500 mb-1">Current Status</p>
          {getStatusBadge(booking.status)}
        </div>
        
        {/* Customer Info */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <IconFileText size={16} className="text-slate-500" /> Customer Data
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Full Name</p>
              <p className="font-medium text-slate-900">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-slate-500">WhatsApp Number</p>
              <p className="font-medium text-slate-900">{booking.customerPhone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{booking.customerEmail}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Identity Number (KTP/SIM)</p>
              <p className="font-medium text-slate-900">{booking.identityNumber || '-'}</p>
            </div>
          </div>
        </div>

        {/* Rental Info */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <IconFileText size={16} className="text-slate-500" /> Rental Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-slate-500">Vehicle</p>
              <p className="font-medium text-slate-900">
                {booking.rentalListing?.vehicle ? `${booking.rentalListing.vehicle.make} ${booking.rentalListing.vehicle.model} (${booking.rentalListing.vehicle.year})` : 'Vehicle Deleted'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Pickup Date</p>
              <p className="font-medium text-slate-900">{format(new Date(booking.startDate), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div>
              <p className="text-slate-500">Return Date</p>
              <p className="font-medium text-slate-900">{format(new Date(booking.endDate), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Total Price</p>
              <p className="font-bold text-slate-900 text-lg">{formatIDR(Number(booking.totalPrice))}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-slate-900">Customer Documents</h4>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7" 
                onClick={() => setIsEditing(true)}
              >
                Edit Documents
              </Button>
            )}
          </div>

          {isEditing ? (
            <PaperworkForm 
              booking={booking} 
              accessToken={accessToken} 
              onCancel={!isPaperworkMissing ? () => setIsEditing(false) : undefined}
              onSuccess={() => {
                setIsEditing(false);
                fetchBookings();
              }} 
            />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-2">KTP/SIM Photo</p>
                {booking.licenseImageUrl ? (
                  <div>
                    <img src={booking.licenseImageUrl} alt="KTP/SIM" className="w-full rounded-lg border border-slate-200 object-cover" />
                    <div className="mt-2 flex">
                      <Button size="sm" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handleDownload(booking.licenseImageUrl!, 'ktp-sim.png')}>
                        <IconDownload size={16} /> Download File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded border border-dashed text-center">Not uploaded yet</div>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Proof of Transfer</p>
                {booking.proofOfTransferUrl ? (
                  <div>
                    <img src={booking.proofOfTransferUrl} alt="Proof of Transfer" className="w-full rounded-lg border border-slate-200 object-cover" />
                    <div className="mt-2 flex">
                      <Button size="sm" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handleDownload(booking.proofOfTransferUrl!, 'bukti-transfer.png')}>
                        <IconDownload size={16} /> Download File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded border border-dashed text-center">Not uploaded yet</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-200 hover:bg-blue-50 px-4 py-2 h-auto"
              onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
            >
              Confirm Payment
            </Button>
            <Button 
              variant="outline" 
              className="text-green-600 border-green-200 hover:bg-green-50 px-4 py-2 h-auto"
              onClick={() => handleStatusChange(booking.id, 'ACTIVE')}
            >
              Mark as Active/Rented
            </Button>
            <Button 
              variant="outline" 
              className="text-slate-600 px-4 py-2 h-auto"
              onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
            >
              Completed
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 px-4 py-2 h-auto"
              onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
            >
              Cancel Booking
            </Button>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Custom Status Update:</p>
            <Select
              defaultValue={booking.status}
              onValueChange={(val) => handleStatusChange(booking.id, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="ACTIVE">Active (Rented)</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
    </SheetContent>
  );
}

export default function ActiveBookingsTable() {
  const { accessToken } = useAuthStore();
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchBookings = useCallback(async (overrideSearch?: string, overrideStatus?: string) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
      const currentStatus = overrideStatus !== undefined ? overrideStatus : status;
      if (currentSearch) params.search = currentSearch;
      if (currentStatus) params.status = currentStatus;
      const res = await getAdminRentalBookings(params, accessToken);
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, status]);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleClear = () => {
    setSearch('');
    setStatus('');
    setCurrentPage(1);
    fetchBookings('', '');
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (!accessToken) return;
    try {
      await updateRentalBookingStatus(id, newStatus, accessToken);
      Swal.fire({ title: 'Status Updated', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      fetchBookings();
    } catch (err: unknown) {
      Swal.fire('Failed', (err as Error).message || 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-slate-500 animate-pulse">Loading booking data...</div>;
  }

  const totalPages = Math.ceil(bookings.length / pageSize);
  const paginatedBookings = bookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending Payment</Badge>;
      case 'CONFIRMED': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Confirmed</Badge>;
      case 'ACTIVE': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active (Rented)</Badge>;
      case 'COMPLETED': return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Cancelled</Badge>;
      case 'OVERDUE': return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Search Booking</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white pl-9"
            />
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <button type="submit" className="hidden">Submit</button>
          </div>
        </form>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setCurrentPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-none">
          <Button type="button" variant="outline" onClick={handleClear} className="w-full md:w-auto">
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-800">Booking Code</TableHead>
              <TableHead className="font-semibold text-slate-800">Customer</TableHead>
              <TableHead className="font-semibold text-slate-800">Vehicle</TableHead>
              <TableHead className="font-semibold text-slate-800">Rental Period</TableHead>
              <TableHead className="font-semibold text-slate-800">Total Price</TableHead>
              <TableHead className="font-semibold text-slate-800">Status</TableHead>
              <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500 bg-white font-medium">
                  No rental bookings at this time.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium text-slate-900">
                    {booking.bookingCode || `#${booking.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">{booking.customerName}</div>
                    <div className="text-xs text-slate-500">{booking.customerPhone}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                     {booking.rentalListing?.vehicle ? `${booking.rentalListing.vehicle.make} ${booking.rentalListing.vehicle.model}` : 'Vehicle Deleted'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div className="whitespace-nowrap">{format(new Date(booking.startDate), 'dd MMM yyyy')}</div>
                    <div className="text-xs text-slate-400">to {format(new Date(booking.endDate), 'dd MMM yyyy')}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatIDR(Number(booking.totalPrice))}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2 text-xs h-8" />}>
                        <IconEye size={14} /> Details
                      </SheetTrigger>
                      <BookingDetailsSheetContent
                        booking={booking}
                        accessToken={accessToken || ''}
                        fetchBookings={fetchBookings}
                        getStatusBadge={getStatusBadge}
                        handleStatusChange={handleStatusChange}
                      />
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, bookings.length)}</span> of <span className="font-medium">{bookings.length}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <IconChevronLeft size={16} />
            </Button>
            <div className="flex items-center justify-center px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              <IconChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
