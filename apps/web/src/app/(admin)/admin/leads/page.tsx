'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Lead, LeadStatus, LeadType } from '@/types/api.types';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { LeadDetailsPanel } from '@/components/admin/LeadDetailsPanel';
import { RentalQuoteDetailsPanel } from '@/components/admin/RentalQuoteDetailsPanel';
import { MarkWonDialog } from '@/components/admin/MarkWonDialog';
import { MarkLostDialog } from '@/components/admin/MarkLostDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Swal from 'sweetalert2';

export default function LeadsCRMPage() {
  const { accessToken, user } = useAuthStore();
  const hasSalesAccess = user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_STAFF';
  const hasRentalAccess = user?.role === 'SUPER_ADMIN' || user?.role === 'RENTAL_STAFF';

  const [activeTab, setActiveTab] = useState<'SALES' | 'RENTALS'>('SALES');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sync tab selection with user access when user role loads
  useEffect(() => {
    if (user) {
      if (hasSalesAccess) {
        setActiveTab('SALES');
      } else if (hasRentalAccess) {
        setActiveTab('RENTALS');
      }
    }
  }, [user, hasSalesAccess, hasRentalAccess]);

  // Drag and drop interception state
  const [pendingDrop, setPendingDrop] = useState<{
    lead: Lead;
    newStatus: LeadStatus;
    revert: () => void;
    commit: () => void;
  } | null>(null);

  // Dialog visibility state
  const [wonDialogOpen, setWonDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);

  // To trigger refreshing the board independently
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const currentTypes: LeadType[] = activeTab === 'SALES'
    ? ['SALES_INQUIRY', 'TEST_DRIVE_REQUEST', 'MAKE_OFFER']
    : ['LONG_TERM_QUOTE', 'RENTAL_INQUIRY'];

  const executeStatusChange = async (leadId: number, newStatus: LeadStatus, payload: Record<string, unknown> = {}) => {
    try {
      await apiFetch(`/leads/${leadId}/status`, {
        method: 'PATCH',
        token: accessToken || undefined,
        body: { status: newStatus, ...payload }
      });
      Swal.fire({ title: 'Status Updated', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', err.message || 'Failed to update status', 'error');
      return false;
    }
  };

  const handleLeadDrop = (lead: Lead, newStatus: LeadStatus, revert: () => void, commit: () => void) => {
    if (newStatus === 'WON') {
      setPendingDrop({ lead, newStatus, revert, commit });
      setWonDialogOpen(true);
    } else if (newStatus === 'LOST') {
      setPendingDrop({ lead, newStatus, revert, commit });
      setLostDialogOpen(true);
    } else {
      // Direct update for other statuses
      executeStatusChange(lead.id, newStatus).then(success => {
        if (!success) revert();
        else commit();
      });
    }
  };

  const handleWonConfirm = async (payload: { startDate: string; endDate: string; notes: string }) => {
    if (!pendingDrop) return;
    setWonDialogOpen(false);
    const success = await executeStatusChange(pendingDrop.lead.id, 'WON', payload);
    if (success) pendingDrop.commit();
    else pendingDrop.revert();
    setPendingDrop(null);
  };

  const handleLostConfirm = async (notes: string) => {
    if (!pendingDrop) return;
    setLostDialogOpen(false);
    const success = await executeStatusChange(pendingDrop.lead.id, 'LOST', { notes });
    if (success) pendingDrop.commit();
    else pendingDrop.revert();
    setPendingDrop(null);
  };

  const cancelDrop = () => {
    if (pendingDrop) {
      pendingDrop.revert();
      setPendingDrop(null);
    }
    setWonDialogOpen(false);
    setLostDialogOpen(false);
  };

  const isRentalType = (type: LeadType) => type === 'LONG_TERM_QUOTE' || type === 'RENTAL_INQUIRY';

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads CRM Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Manage inquiries, quotes, and negotiate deals via the Kanban board.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val as 'SALES' | 'RENTALS');
        setSelectedLead(null);
      }} className="flex-1 flex flex-col">
        <TabsList className="mb-6 self-start">
          {hasSalesAccess && <TabsTrigger value="SALES" className="w-32">Sales Leads</TabsTrigger>}
          {hasRentalAccess && <TabsTrigger value="RENTALS" className="w-32">Rental Quotes</TabsTrigger>}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            key={activeTab}
            types={currentTypes}
            onLeadDrop={handleLeadDrop}
            onLeadClick={setSelectedLead}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </Tabs>

      {/* Detail Panels Overlay */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedLead(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            {isRentalType(selectedLead.type) ? (
              <RentalQuoteDetailsPanel
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                onUpdate={() => setRefreshTrigger(prev => prev + 1)}
                onRequestStatusChange={(id, newStatus) => {
                  setSelectedLead(null);
                  if (newStatus === 'WON') {
                    setPendingDrop({ lead: selectedLead, newStatus, revert: () => setRefreshTrigger(prev => prev + 1), commit: () => setRefreshTrigger(prev => prev + 1) });
                    setWonDialogOpen(true);
                  } else if (newStatus === 'LOST') {
                    setPendingDrop({ lead: selectedLead, newStatus, revert: () => setRefreshTrigger(prev => prev + 1), commit: () => setRefreshTrigger(prev => prev + 1) });
                    setLostDialogOpen(true);
                  } else {
                    executeStatusChange(id, newStatus).then(() => setRefreshTrigger(prev => prev + 1));
                  }
                }}
              />
            ) : (
              <LeadDetailsPanel
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                onUpdate={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <MarkWonDialog
        open={wonDialogOpen}
        onOpenChange={setWonDialogOpen}
        lead={pendingDrop?.lead || null}
        onConfirm={handleWonConfirm}
        onCancel={cancelDrop}
      />

      <MarkLostDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        onConfirm={handleLostConfirm}
        onCancel={cancelDrop}
      />
    </div>
  );
}
