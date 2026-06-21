'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PaginatedResponse, User } from '@/types/api.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: number;
  userId: number | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  moduleName: string;
  recordId: number;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  timestamp: string;
}

export default function AuditLogsPage() {
  const { accessToken } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, moduleFilter, userFilter]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch<User[]>('/users', {
        token: accessToken || undefined
      });
      setUsers(res);
    } catch (error) {
      console.error('Failed to load users for filter mapping', error);
    }
  };

  const fetchLogs = async (currentPage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (moduleFilter !== 'ALL') params.set('moduleName', moduleFilter);
      if (userFilter !== 'ALL') params.set('userId', userFilter);

      const res = await apiFetch<PaginatedResponse<AuditLog>>(`/audit-logs?${params.toString()}`, {
        token: accessToken || undefined
      });
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Create</Badge>;
      case 'UPDATE': return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Update</Badge>;
      case 'DELETE': return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Delete</Badge>;
      case 'RESTORE': return <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">Restore</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track modifications across the system (Super Admin only).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 bg-slate-50">
          <div className="w-48">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Action</label>
            <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="RESTORE">Restore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Module</label>
            <Select value={moduleFilter} onValueChange={(val) => { setModuleFilter(val); setPage(1); }}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modules</SelectItem>
                <SelectItem value="LeadsModule">Leads</SelectItem>
                <SelectItem value="VehiclesModule">Vehicles</SelectItem>
                <SelectItem value="ListingsModule">Listings</SelectItem>
                <SelectItem value="AuthModule">Auth/Users</SelectItem>
                <SelectItem value="TestimonialsModule">Testimonials</SelectItem>
                <SelectItem value="CmsModule">CMS Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">User/Staff</label>
            <Select value={userFilter} onValueChange={(val) => { setUserFilter(val); setPage(1); }}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Staff</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead>Timestamp</TableHead>
                <TableHead>User/Staff</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 animate-pulse">Loading logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">No audit logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const staffUser = users.find(u => u.id === log.userId);
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow className={expandedRow === log.id ? "bg-slate-50" : ""}>
                        <TableCell className="text-sm text-slate-600 font-mono">
                          {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-slate-700 font-medium">
                          {log.userId ? (
                            staffUser ? `${staffUser.name} (#${log.userId})` : `Staff #${log.userId}`
                          ) : (
                            <span className="italic text-slate-400">System</span>
                          )}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="font-medium text-slate-700">{log.moduleName}</TableCell>
                        <TableCell className="font-mono text-slate-600">#{log.recordId}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            className="text-blue-600"
                          >
                            {expandedRow === log.id ? 'Hide' : 'View Payload'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow className="bg-slate-50 border-b border-slate-200">
                          <TableCell colSpan={6} className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              {log.previousValue && (
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Previous Value</span>
                                  <pre className="text-xs text-slate-700 overflow-x-auto">
                                    {JSON.stringify(log.previousValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue && (
                                <div className="bg-white p-3 rounded border border-slate-200 col-span-2">
                                  <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">New/Current Value</span>
                                  <pre className="text-xs text-slate-700 overflow-x-auto">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm font-medium text-slate-600">Total: {total} records</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={logs.length < 20}
                onClick={() => setPage(p => p + 1)}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
