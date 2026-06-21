'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { User } from '@/types/api.types';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  IconUserPlus,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconEdit,
  IconTrash,
  IconEye as IconEyeDetails
} from '@tabler/icons-react';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'SALES_STAFF', 'RENTAL_STAFF']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword']
});

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'SALES_STAFF', 'RENTAL_STAFF']),

  isActive: z.boolean(),
}).refine(data => {
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ['confirmPassword']
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

export default function StaffManagementPage() {
  const { accessToken, user } = useAuthStore();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<User | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // React Hook Form for Create Staff
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'SALES_STAFF' }
  });

  // React Hook Form for Edit Staff
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'SALES_STAFF', isActive: true }
  });

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<User[]>('/users', { token: accessToken || undefined });
      setStaff(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (data: CreateFormValues) => {
    try {
      await apiFetch('/users', {
        method: 'POST',
        token: accessToken || undefined,
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role
        },
      });
      Swal.fire({ title: 'Success', text: 'Staff account created successfully', icon: 'success', confirmButtonColor: '#3b82f6' });
      setShowCreateModal(false);
      createForm.reset();
      fetchStaff();
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire({ title: 'Error', text: err.message || 'Failed to create staff', icon: 'error', confirmButtonColor: '#ef4444' });
    }
  };

  const handleEditClick = (member: User) => {
    setEditingStaffId(member.id);
    editForm.reset({
      name: member.name,
      email: member.email,
      password: '',
      confirmPassword: '',
      role: member.role as 'SUPER_ADMIN' | 'SALES_STAFF' | 'RENTAL_STAFF',
      isActive: member.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (data: EditFormValues) => {
    if (!editingStaffId) return;
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive
      };
      if (data.password) {
        payload.password = data.password;
      }

      await apiFetch(`/users/${editingStaffId}`, {
        method: 'PATCH',
        token: accessToken || undefined,
        body: payload
      });

      Swal.fire({ title: 'Success', text: 'Staff details updated successfully', icon: 'success', confirmButtonColor: '#3b82f6' });
      setShowEditModal(false);
      setEditingStaffId(null);
      fetchStaff();
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire({ title: 'Error', text: err.message || 'Failed to update staff', icon: 'error', confirmButtonColor: '#ef4444' });
    }
  };

  const handleDeleteStaff = async (member: User) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to soft delete the account of ${member.name}? They will no longer be able to log in.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiFetch(`/users/${member.id}`, {
            method: 'DELETE',
            token: accessToken || undefined
          });
          Swal.fire('Deleted!', 'Staff account has been deleted.', 'success');
          fetchStaff();
        } catch (error: unknown) {
          const err = error as Error;
          Swal.fire('Failed!', err.message || 'Failed to delete staff', 'error');
        }
      }
    });
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff credentials, access roles, and status configuration.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <IconUserPlus size={18} className="mr-2" /> Add Staff Account
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Comprehensive directory of all system accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500 animate-pulse">Loading directory...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                      <TableCell className="text-slate-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.role === 'SALES_STAFF' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'
                        }>
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <div className="flex items-center text-emerald-600 text-sm font-medium">
                            <IconCheck size={16} className="mr-1" /> Active
                          </div>
                        ) : (
                          <div className="flex items-center text-slate-400 text-sm font-medium">
                            <IconX size={16} className="mr-1" /> Inactive
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-blue-600"
                            title="View Details"
                            onClick={() => setSelectedStaffDetails(u)}
                          >
                            <IconEyeDetails size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-amber-600"
                            title="Edit Details"
                            onClick={() => handleEditClick(u)}
                          >
                            <IconEdit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-red-600"
                            title="Delete Staff"
                            onClick={() => handleDeleteStaff(u)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500">No staff accounts provisioned.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Sheet */}
      {selectedStaffDetails && (
        <Sheet open={true} onOpenChange={() => setSelectedStaffDetails(null)}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader className="mb-6">
              <SheetTitle>Staff Member Details</SheetTitle>
              <SheetDescription>Detailed records of system credentials and configuration.</SheetDescription>
            </SheetHeader>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Account ID</span>
                  <span className="font-mono text-slate-800">#{selectedStaffDetails.id}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Full Name</span>
                  <span className="font-medium text-slate-900">{selectedStaffDetails.name}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Email Address</span>
                  <span className="text-slate-700">{selectedStaffDetails.email}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">System Access Role</span>
                  <Badge variant="secondary" className="mt-1 font-mono text-xs">
                    {selectedStaffDetails.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Status</span>
                  <Badge variant={selectedStaffDetails.isActive ? 'default' : 'outline'} className={
                    selectedStaffDetails.isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white mt-1' : 'mt-1'
                  }>
                    {selectedStaffDetails.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Add New Staff</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600">
                <IconX size={18} />
              </Button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateStaff)}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <Input placeholder="Full Name" {...createForm.register('name')} />
                  {createForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <Input type="email" placeholder="Email Address" {...createForm.register('email')} />
                  {createForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Password" className="pr-10" {...createForm.register('password')} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  {createForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" className="pr-10" {...createForm.register('confirmPassword')} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  {createForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Access Role</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    {...createForm.register('role')}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="SALES_STAFF">Sales Staff</option>
                    <option value="RENTAL_STAFF">Rental Staff</option>
                  </select>
                  {createForm.formState.errors.role && (
                    <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.role.message}</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Edit Staff Account</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600">
                <IconX size={18} />
              </Button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleUpdateStaff)}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <Input placeholder="Full Name" {...editForm.register('name')} />
                  {editForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <Input type="email" {...editForm.register('email')} />
                  {editForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">New Password (Optional)</label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Leave blank to keep current" className="pr-10" {...editForm.register('password')} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  {editForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Leave blank to keep current" className="pr-10" {...editForm.register('confirmPassword')} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  {editForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Access Role</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    {...editForm.register('role')}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="SALES_STAFF">Sales Staff</option>
                    <option value="RENTAL_STAFF">Rental Staff</option>
                  </select>
                  {editForm.formState.errors.role && (
                    <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.role.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    {...editForm.register('isActive')}
                  />
                  <label htmlFor="isActiveCheckbox" className="text-sm font-semibold text-slate-700 select-none">Active Account Status</label>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
