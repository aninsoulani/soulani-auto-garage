'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface MarkLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

export function MarkLostDialog({ open, onOpenChange, onConfirm, onCancel }: MarkLostDialogProps) {
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) onCancel();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Lead as Lost</DialogTitle>
          <DialogDescription>Please provide a reason why this lead was lost. This is required for analytics.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason / Notes</Label>
            <Textarea 
              placeholder="Customer found a better price, unresponsive, etc." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            variant="destructive" 
            disabled={!notes.trim()} 
            onClick={() => onConfirm(notes)}
          >
            Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
