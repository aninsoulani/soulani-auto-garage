'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconX, IconSend, IconCar, IconUser, IconPhone, IconMail, IconCalendarEvent, IconHistory } from '@tabler/icons-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Swal from 'sweetalert2';

interface LeadDetailsPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailsPanel({ lead, onClose, onUpdate }: LeadDetailsPanelProps) {
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState<LeadStatus>(lead.status);

  // Expanded lead data with followups
  const [fullLead, setFullLead] = useState<Lead | null>(null);
  const [fetching, setFetching] = useState(true);

  // If status is WON, we need startDate and endDate
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLeadDetails = useCallback(async () => {
    try {
      setFetching(true);
      const res = await apiFetch<Lead>(`/leads/${lead.id}`, { token: accessToken || undefined });
      setFullLead(res);
      setStatus(res.status);
    } catch (err) {
      console.error('Failed to fetch lead details', err);
    } finally {
      setFetching(false);
    }
  }, [lead.id, accessToken]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const submitFollowup = async () => {
    if (!noteText.trim()) {
      Swal.fire('Error', 'Please enter a note', 'error');
      return;
    }

    try {
      setLoading(true);
      // If they changed to WON, they must use the main status update with dates
      if (status === 'WON' && lead.status !== 'WON') {
        if (!startDate || !endDate) {
          Swal.fire('Error', 'Start and End dates are required to mark as WON', 'error');
          setLoading(false);
          return;
        }
        await apiFetch(`/leads/${lead.id}/status`, {
          method: 'PATCH',
          token: accessToken || undefined,
          body: { status, notes: noteText, startDate, endDate }
        });
      } else {
        await apiFetch(`/leads/${lead.id}/followups`, {
          method: 'POST',
          token: accessToken || undefined,
          body: { noteText, status: status !== lead.status ? status : undefined }
        });
      }
      
      setNoteText('');
      Swal.fire('Success', 'Follow-up saved successfully', 'success');
      fetchLeadDetails();
      onUpdate();
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', err.message || 'Failed to add follow-up', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeLead = fullLead || lead;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Lead Details
            <Badge variant="secondary" className="font-mono text-xs">{activeLead.leadReferenceId}</Badge>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Created {format(new Date(activeLead.createdAt), 'PPpp')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
          <IconX size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Customer Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Customer Profile</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <IconUser size={16} className="text-slate-400 mr-2" />
              <span className="font-medium text-slate-800">{activeLead.customerName}</span>
            </div>
            <div className="flex items-center text-sm">
              <IconPhone size={16} className="text-slate-400 mr-2" />
              <a href={`https://wa.me/${activeLead.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {activeLead.customerPhone}
              </a>
            </div>
            {activeLead.customerEmail && (
              <div className="flex items-center text-sm">
                <IconMail size={16} className="text-slate-400 mr-2" />
                <a href={`mailto:${activeLead.customerEmail}`} className="text-slate-600 hover:underline">{activeLead.customerEmail}</a>
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Details */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Inquiry Details</h3>
          <div className="space-y-4">
            <div>
              <span className="block text-xs text-slate-500 mb-1">Type</span>
              <Badge variant="outline" className="bg-white">{activeLead.type.replace(/_/g, ' ')}</Badge>
            </div>
            
            {activeLead.vehicle && (
              <div className="p-3 border border-slate-200 rounded-lg flex gap-3 items-center bg-white shadow-sm">
                <div className="bg-slate-100 p-2 rounded-md text-slate-500">
                  <IconCar size={20} />
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800">{activeLead.vehicle.year} {activeLead.vehicle.make} {activeLead.vehicle.model}</div>
                  <div className="text-xs text-slate-500">{activeLead.vehicle.plateNumber || 'No plate'} • {activeLead.vehicle.status}</div>
                </div>
              </div>
            )}

            {activeLead.message && (
              <div>
                <span className="block text-xs text-slate-500 mb-1">Message from Customer</span>
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 italic border border-slate-100">
                  &quot;{activeLead.message}&quot;
                </div>
              </div>
            )}
            
            {activeLead.type === 'MAKE_OFFER' && (
              <div>
                <span className="block text-xs text-slate-500 mb-1">Offered Price</span>
                <div className="font-semibold text-lg text-emerald-600">
                  Rp {Number(activeLead.offeredPrice || 0).toLocaleString('id-ID')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interaction History Timeline */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <IconHistory size={16} className="text-slate-400" />
            Interaction Timeline
          </h3>
          {fetching ? (
            <div className="text-sm text-slate-400 animate-pulse py-2">Loading timeline...</div>
          ) : !activeLead.followups || activeLead.followups.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No follow-up notes logged yet.</p>
          ) : (
            <div className="relative pl-5 border-l-2 border-slate-100 space-y-5">
              {activeLead.followups.map((followup) => (
                <div key={followup.id} className="relative text-xs">
                  {/* Dot icon indicator */}
                  <span className="absolute -left-[28px] top-1 bg-blue-500 border-[3px] border-white h-3.5 w-3.5 rounded-full shadow-sm" />
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-700">
                        {followup.user?.name || `Staff #${followup.userId}`}
                      </span>
                      <span>
                        {format(new Date(followup.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-sans">
                      {followup.noteText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Add Follow-up</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Change Status (Optional)</label>
              <Select value={status} onValueChange={(val) => setStatus(val as LeadStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                  <SelectItem value="TEST_DRIVE_SCHEDULED">Test Drive Scheduled</SelectItem>
                  <SelectItem value="WON">Won (Convert to Booking)</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === 'WON' && activeLead.status !== 'WON' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="col-span-2 text-xs text-green-800 font-medium flex items-center mb-1">
                  <IconCalendarEvent size={14} className="mr-1" />
                  Required for Booking
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-green-700 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full text-sm rounded border border-green-300 p-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-green-700 mb-1 uppercase">End Date</label>
                  <input type="date" className="w-full text-sm rounded border border-green-300 p-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
              <Textarea 
                placeholder="Write your interaction notes here..." 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="resize-none h-24"
              />
            </div>

            <Button onClick={submitFollowup} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? 'Saving...' : (
                <>
                  <IconSend size={16} className="mr-2" />
                  Save Follow-up
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
