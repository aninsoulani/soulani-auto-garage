'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getAdminPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/lib/api';
import type { PaymentMethod } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPlus, IconEdit, IconCheck, IconX, IconTrash, IconSearch, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1, 'Type required'),
  instructions: z.string().min(1, 'Instructions required'),
  isActive: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

export default function PaymentMethodsAdminPage() {
  const { accessToken } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleClear = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: '', instructions: '', isActive: true }
  });

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await getAdminPaymentMethods(accessToken);
      setMethods(data);
    } catch (err: unknown) {
      console.error(err);
      Swal.fire('Error', 'Failed to load payment methods', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingId(null);
    form.reset({ name: '', type: '', instructions: '', isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (pm: PaymentMethod) => {
    setEditingId(pm.id);
    form.reset({ name: pm.name, type: pm.type, instructions: pm.instructions, isActive: pm.isActive });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!accessToken) return;
    try {
      if (editingId) {
        await updatePaymentMethod(editingId, values, accessToken);
        Swal.fire('Success', 'Payment method updated', 'success');
      } else {
        await createPaymentMethod(values, accessToken);
        Swal.fire('Success', 'Payment method created', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      console.error(err);
      Swal.fire('Error', 'Failed to save payment method', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this payment method!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deletePaymentMethod(id, accessToken);
        Swal.fire('Deleted!', 'Payment method has been deleted.', 'success');
        loadData();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to delete payment method', 'error');
      }
    }
  };

  const filteredMethods = methods.filter((pm) => {
    const matchesSearch =
      pm.name.toLowerCase().includes(search.toLowerCase()) ||
      pm.type.toLowerCase().includes(search.toLowerCase()) ||
      pm.instructions.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && pm.isActive) ||
      (statusFilter === 'INACTIVE' && !pm.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMethods.length / pageSize);
  const paginatedMethods = filteredMethods.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
          <p className="text-sm text-slate-500 mt-1">Manage bank accounts and payment options</p>
        </div>
        <Button onClick={openAddModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <IconPlus size={18} /> Add Method
        </Button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Search Method</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name, type, instructions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white pl-9"
            />
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-none">
          <Button type="button" variant="outline" onClick={handleClear} className="w-full md:w-auto">
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-800">Name</TableHead>
                <TableHead className="font-semibold text-slate-800">Type</TableHead>
                <TableHead className="font-semibold text-slate-800">Instructions / Details</TableHead>
                <TableHead className="font-semibold text-slate-800">Status</TableHead>
                <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-white font-medium animate-pulse">Loading...</TableCell>
                </TableRow>
              ) : paginatedMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-white font-medium">
                    No payment methods found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMethods.map(pm => (
                  <TableRow key={pm.id}>
                    <TableCell className="font-medium text-slate-900">{pm.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">{pm.type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-slate-500" title={pm.instructions}>{pm.instructions}</TableCell>
                    <TableCell>
                      {pm.isActive ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50"><IconCheck size={14} className="mr-1 shrink-0" /> Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50"><IconX size={14} className="mr-1 shrink-0" /> Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(pm)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                        <IconEdit size={16} className="mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(pm.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                        <IconTrash size={16} className="mr-1" /> Delete
                      </Button>
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
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, filteredMethods.length)}</span> of <span className="font-medium">{filteredMethods.length}</span> results
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

      <Dialog open={modalOpen} onOpenChange={(open) => {
        if (!open) return;
        setModalOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (e.g. Bank BCA)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type (e.g. BANK_TRANSFER)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions / Account Details</FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="Format: A/N Soulani Auto Garage\nNo Rek: 123456789" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-xs text-slate-500">Method will be visible to customers at checkout.</p>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
