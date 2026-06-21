'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActiveBookingsTable from './_components/ActiveBookingsTable';
import BlackoutDatesManager from './_components/BlackoutDatesManager';

export default function RentalsDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rental Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage active bookings and vehicle availability/blackout dates.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
          <TabsTrigger value="blackout">Blackout Dates Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-0 outline-none">
           <ActiveBookingsTable />
        </TabsContent>

        <TabsContent value="blackout" className="mt-0 outline-none">
           <BlackoutDatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
