'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Lead, LeadStatus, LeadType } from '@/types/api.types';
import { Badge } from '@/components/ui/badge';
import { IconCar, IconClock, IconMessageCircle, IconLoader2 } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { getAdminLeads } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface KanbanBoardProps {
  types: LeadType[];
  onLeadDrop: (lead: Lead, newStatus: LeadStatus, revert: () => void, commit: () => void) => void;
  onLeadClick: (lead: Lead) => void;
  refreshTrigger?: number;
}

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'NEW', title: 'New', color: 'bg-blue-50 border-blue-200' },
  { id: 'CONTACTED', title: 'Contacted', color: 'bg-amber-50 border-amber-200' },
  { id: 'NEGOTIATING', title: 'Negotiating', color: 'bg-purple-50 border-purple-200' },
  { id: 'TEST_DRIVE_SCHEDULED', title: 'Test Drive', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'WON', title: 'Won', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'LOST', title: 'Lost', color: 'bg-red-50 border-red-200' },
];

export function KanbanBoard({ types, onLeadDrop, onLeadClick, refreshTrigger }: KanbanBoardProps) {
  const { accessToken } = useAuthStore();
  const [columnsData, setColumnsData] = useState<Record<LeadStatus, Lead[]>>({
    NEW: [], CONTACTED: [], NEGOTIATING: [], TEST_DRIVE_SCHEDULED: [], WON: [], LOST: []
  });
  const [pages, setPages] = useState<Record<LeadStatus, number>>({
    NEW: 1, CONTACTED: 1, NEGOTIATING: 1, TEST_DRIVE_SCHEDULED: 1, WON: 1, LOST: 1
  });
  const [hasMore, setHasMore] = useState<Record<LeadStatus, boolean>>({
    NEW: true, CONTACTED: true, NEGOTIATING: true, TEST_DRIVE_SCHEDULED: true, WON: true, LOST: true
  });
  const [loading, setLoading] = useState<Record<LeadStatus, boolean>>({
    NEW: false, CONTACTED: false, NEGOTIATING: false, TEST_DRIVE_SCHEDULED: false, WON: false, LOST: false
  });
  const loadingRef = useRef<Record<LeadStatus, boolean>>({
    NEW: false, CONTACTED: false, NEGOTIATING: false, TEST_DRIVE_SCHEDULED: false, WON: false, LOST: false
  });
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [sourceStatus, setSourceStatus] = useState<LeadStatus | null>(null);

  const fetchColumn = useCallback(async (status: LeadStatus, page: number, isRefresh = false) => {
    if (!accessToken) return;
    if (loadingRef.current[status]) return;
    
    loadingRef.current[status] = true;
    setLoading(prev => ({ ...prev, [status]: true }));
    try {
      // Backend expects 'type' as a comma-separated string if multiple
      const res = await getAdminLeads({ 
        status, 
        type: types.join(','), 
        page, 
        limit: 15,
        // Ensure backend order is desc
        sort: 'newest' 
      }, accessToken);
      
      setColumnsData(prev => {
        const existing = isRefresh ? [] : prev[status];
        const leadMap = new Map(existing.map(lead => [lead.id, lead]));
        res.data.forEach((lead: Lead) => leadMap.set(lead.id, lead));
        return {
          ...prev,
          [status]: Array.from(leadMap.values())
        };
      });
      setHasMore(prev => ({ ...prev, [status]: res.meta.page < res.meta.totalPages }));
      setPages(prev => ({ ...prev, [status]: res.meta.page }));
    } catch (error) {
      console.error(`Failed to fetch leads for ${status}`, error);
    } finally {
      loadingRef.current[status] = false;
      setLoading(prev => ({ ...prev, [status]: false }));
    }
  }, [accessToken, types]);

  // Initial fetch and refresh
  useEffect(() => {
    // Reset columns, pages, hasMore, and loadingRef before starting new stream of fetches
    setColumnsData({
      NEW: [], CONTACTED: [], NEGOTIATING: [], TEST_DRIVE_SCHEDULED: [], WON: [], LOST: []
    });
    setPages({
      NEW: 1, CONTACTED: 1, NEGOTIATING: 1, TEST_DRIVE_SCHEDULED: 1, WON: 1, LOST: 1
    });
    setHasMore({
      NEW: true, CONTACTED: true, NEGOTIATING: true, TEST_DRIVE_SCHEDULED: true, WON: true, LOST: true
    });
    loadingRef.current = {
      NEW: false, CONTACTED: false, NEGOTIATING: false, TEST_DRIVE_SCHEDULED: false, WON: false, LOST: false
    };

    COLUMNS.forEach(col => {
      fetchColumn(col.id, 1, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, refreshTrigger]);

  const handleLoadMore = (status: LeadStatus) => {
    if (!loading[status] && hasMore[status]) {
      fetchColumn(status, pages[status] + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead, status: LeadStatus) => {
    setDraggedLead(lead);
    setSourceStatus(status);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    if (!draggedLead || !sourceStatus || sourceStatus === targetStatus) {
      setDraggedLead(null);
      setSourceStatus(null);
      return;
    }

    const leadToMove = draggedLead;
    const originStatus = sourceStatus;

    // Optimistic UI Update
    setColumnsData(prev => {
      const originClean = (prev[originStatus] || []).filter(l => l.id !== leadToMove.id);
      const targetClean = (prev[targetStatus] || []).filter(l => l.id !== leadToMove.id);
      const targetMerged = [{ ...leadToMove, status: targetStatus }, ...targetClean];
      return {
        ...prev,
        [originStatus]: originClean,
        [targetStatus]: targetMerged
      };
    });

    const revert = () => {
      setColumnsData(prev => {
        const targetClean = (prev[targetStatus] || []).filter(l => l.id !== leadToMove.id);
        const originClean = (prev[originStatus] || []).filter(l => l.id !== leadToMove.id);
        const originMerged = [{ ...leadToMove, status: originStatus }, ...originClean];
        return {
          ...prev,
          [targetStatus]: targetClean,
          [originStatus]: originMerged
        };
      });
    };

    const commit = () => {
      // Nothing to do internally, optimistic update stays
    };

    onLeadDrop(leadToMove, targetStatus, revert, commit);
    setDraggedLead(null);
    setSourceStatus(null);
  };

  const getLeadTypeBadge = (type: string) => {
    switch (type) {
      case 'SALES_INQUIRY': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-white">Sales</Badge>;
      case 'TEST_DRIVE_REQUEST': return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-white">Test Drive</Badge>;
      case 'MAKE_OFFER': return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-white">Offer</Badge>;
      case 'RENTAL_INQUIRY': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-white">Rental</Badge>;
      case 'LONG_TERM_QUOTE': return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-white">Long Term</Badge>;
      default: return <Badge variant="outline">{type.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)]">
      {COLUMNS.map((col) => {
        const columnLeads = columnsData[col.id];
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-80 rounded-xl border p-3 flex flex-col gap-3 ${col.color} h-[calc(100vh-220px)] overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex justify-between items-center px-1 shrink-0">
              <h3 className="font-semibold text-slate-700">{col.title}</h3>
              <Badge variant="secondary" className="bg-white/60">{columnLeads.length}</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2 custom-scrollbar pr-1">
              {columnLeads.map((lead) => (
                <div
                  key={`${col.id}-${lead.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead, col.id)}
                  onClick={() => onLeadClick(lead)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group shrink-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-400">{lead.leadReferenceId}</span>
                    {getLeadTypeBadge(lead.type)}
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-medium text-slate-800 line-clamp-1">{lead.customerName}</h4>
                    {lead.vehicle && (
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <IconCar size={12} className="mr-1 inline" />
                        <span className="line-clamp-1">{lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-2 border-t border-slate-50">
                    <div className="flex items-center">
                      <IconClock size={12} className="mr-1" />
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </div>
                    {lead.message && <IconMessageCircle size={14} className="text-slate-300 group-hover:text-blue-400" />}
                  </div>
                </div>
              ))}
              
              {loading[col.id] && (
                <div className="flex justify-center py-4">
                  <IconLoader2 className="animate-spin text-slate-400" size={20} />
                </div>
              )}
              
              {!loading[col.id] && hasMore[col.id] && columnLeads.length > 0 && (
                <button
                  onClick={() => handleLoadMore(col.id)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white/50 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors mt-2"
                >
                  Load More
                </button>
              )}
              
              {columnLeads.length === 0 && !loading[col.id] && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm py-6 bg-white/50 h-32">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
