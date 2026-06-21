'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconX, IconSend, IconCar, IconUser, IconPhone, IconMail, IconHistory, IconMessageCircle, IconFileText } from '@tabler/icons-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Swal from 'sweetalert2';

interface RentalQuoteDetailsPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
  onRequestStatusChange: (leadId: number, newStatus: LeadStatus) => void;
}

const parseLeadMessage = (message: string | null) => {
  if (!message) return null;
  const match = message.match(/from (.*?) to (.*?) \((.*?) day/) || message.match(/dari (.*?) sampai (.*?) \((.*?) hari/);
  if (match) {
    return {
      startDate: match[1],
      endDate: match[2],
      days: parseInt(match[3], 10) || 0
    };
  }
  return null;
};

export function RentalQuoteDetailsPanel({ lead, onClose, onUpdate, onRequestStatusChange }: RentalQuoteDetailsPanelProps) {
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const [fullLead, setFullLead] = useState<Lead | null>(null);
  const [fetching, setFetching] = useState(true);

  const fetchLeadDetails = useCallback(async () => {
    try {
      setFetching(true);
      const res = await apiFetch<Lead>(`/leads/${lead.id}`, { token: accessToken || undefined });
      setFullLead(res);
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
      await apiFetch(`/leads/${lead.id}/followups`, {
        method: 'POST',
        token: accessToken || undefined,
        body: { noteText }
      });
      
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
  const parsed = parseLeadMessage(activeLead.message);

  const getWhatsAppLink = () => {
    const phone = activeLead.customerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const vehicleName = activeLead.vehicle ? `${activeLead.vehicle.make} ${activeLead.vehicle.model}` : 'kendaraan';
    
    let parsedMessage = '';
    const match = activeLead.message?.match(/dari (.*?) sampai (.*?) \((.*?) hari\)/) || activeLead.message?.match(/from (.*?) to (.*?) \((.*?) days\)/);
    if (match) {
      const startDateFormatted = match[1];
      const endDateFormatted = match[2];
      const totalDays = match[3];
      parsedMessage = ` for ${totalDays} days (from ${startDateFormatted} to ${endDateFormatted})`;
    } else {
      parsedMessage = activeLead.message ? ` (${activeLead.message})` : '';
    }

    const message = `Hello ${activeLead.customerName}, regarding your rental inquiry for the ${vehicleName}${parsedMessage}, here is more information from Soulani Auto Garage...`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">New</Badge>;
      case 'CONTACTED': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Contacted</Badge>;
      case 'NEGOTIATING': return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Negotiating</Badge>;
      case 'WON': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Won</Badge>;
      case 'LOST': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-[500px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Rental Quote Details
            <Badge variant="secondary" className="font-mono text-xs">{activeLead.leadReferenceId}</Badge>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Created {format(new Date(activeLead.createdAt), 'PPpp')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
          <IconX size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Current Status</p>
          {getStatusBadge(activeLead.status)}
        </div>

        {/* Customer Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <IconUser size={16} className="text-slate-400" />
            Customer Profile
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Full Name</p>
              <p className="font-medium text-slate-900">{activeLead.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><IconPhone size={14}/> Phone</p>
              <p className="font-medium text-slate-900">{activeLead.customerPhone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><IconMail size={14}/> Email Address</p>
              <p className="font-medium text-slate-900">{activeLead.customerEmail || '-'}</p>
            </div>
          </div>
        </div>

        {/* Proposed Rental Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <IconFileText size={16} className="text-slate-400" />
            Rental Proposal
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><IconCar size={14}/> Vehicle Interested</p>
              <p className="font-medium text-slate-900">
                {activeLead.vehicle ? `${activeLead.vehicle.year} ${activeLead.vehicle.make} ${activeLead.vehicle.model}` : '-'}
              </p>
            </div>
            {parsed ? (
              <>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pickup Date</p>
                  <p className="font-medium text-slate-900">{parsed.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Return Date</p>
                  <p className="font-medium text-slate-900">{parsed.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="font-medium text-slate-900">{parsed.days} Days</p>
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Proposed Period</p>
                <p className="text-slate-500 italic">No exact period specified.</p>
              </div>
            )}
            {activeLead.message && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Message</p>
                <div className="bg-white p-3 rounded border border-slate-200 text-slate-700 italic text-sm">
                  {activeLead.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Pipeline Actions</h4>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white py-2.5 px-4 rounded-lg font-medium transition mb-4"
          >
            <IconMessageCircle size={18} />
            Follow Up via WhatsApp
          </a>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs flex-1"
              onClick={() => onRequestStatusChange(activeLead.id, 'CONTACTED')}
            >
              Contacted
            </Button>
            <Button
              variant="outline"
              className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs flex-1"
              onClick={() => onRequestStatusChange(activeLead.id, 'NEGOTIATING')}
            >
              Negotiating
            </Button>
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs flex-1"
              onClick={() => onRequestStatusChange(activeLead.id, 'WON')}
            >
              Mark Won
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex-1"
              onClick={() => onRequestStatusChange(activeLead.id, 'LOST')}
            >
              Mark Lost
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Internal Notes</label>
            <Textarea 
              placeholder="Record your interaction..." 
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="resize-none h-20 mb-3"
            />
            <Button onClick={submitFollowup} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? 'Saving...' : (
                <>
                  <IconSend size={16} className="mr-2" />
                  Save Internal Note
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Interaction History Timeline */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <IconHistory size={16} className="text-slate-400" />
            History
          </h3>
          {fetching ? (
            <div className="text-sm text-slate-400 animate-pulse py-2">Loading...</div>
          ) : !activeLead.followups || activeLead.followups.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No notes logged.</p>
          ) : (
            <div className="relative pl-5 border-l-2 border-slate-100 space-y-5">
              {activeLead.followups.map((followup) => (
                <div key={followup.id} className="relative text-xs">
                  <span className="absolute -left-[28px] top-1 bg-slate-500 border-[3px] border-white h-3.5 w-3.5 rounded-full shadow-sm" />
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

      </div>
    </div>
  );
}
