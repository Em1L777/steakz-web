import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Order { id: number; tableNumber: number; details: string; totalPrice: number; status: string; }
// New Type Layout definitions added cleanly
interface Reservation { id: number; customerName: string; customerContact: string; tableNumber: number; reservedFor: string; status: string; }

export const WaiterDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]); // New State

  const synchFloorQueue = async () => {
    if (!user?.branchId) return;
    try {
      const resOrders = await api.get(`/api/branches/${user.branchId}/orders`);
      setOrders(resOrders.data);
      
      // Fetch oncoming reservation bookings for floor syncing
      const resReservations = await api.get(`/api/branches/${user.branchId}/reservations`);
      setReservations(resReservations.data);
    } catch {
      console.error('Failed to sync live floor queue.');
    }
  };

  useEffect(() => {
    synchFloorQueue();
    const interval = setInterval(synchFloorQueue, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const claimTicket = async (id: number) => {
    await api.post(`/api/branches/${user?.branchId}/orders/${id}/assign`);
    synchFloorQueue();
  };

  const deliverAndResetTable = async (id: number) => {
    await api.post(`/api/branches/${user?.branchId}/orders/${id}/complete`);
    synchFloorQueue();
  };

  // ✅ New Lifecycle State Change Handler for Floor Waiters
  const markAsArrived = async (reservationId: number) => {
    try {
      await api.patch(`/api/branches/${user?.branchId}/reservations/${reservationId}/arrive`);
      // Update state instantly so it disappears immediately from view
      setReservations(prev => prev.filter(res => res.id !== reservationId));
    } catch (err) {
      console.error('Failed to update arrival tracking state.');
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white font-sans grid grid-cols-1 xl:grid-cols-4">
      <aside className="bg-[#1a1a1a] p-6 border-r border-white/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🥩</span>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-[#d4af37]">Steakz Floor</h1>
              <p className="text-[10px] text-gray-500 font-medium">Waiter Workspace Engine</p>
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 border border-white/5 mb-6">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Active Operator</p>
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-gray-500">Branch Station ID: {user?.branchId}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full bg-white/5 hover:bg-red-950/30 border border-white/10 hover:border-red-900/30 text-gray-400 hover:text-red-400 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all">
          Exit Station Session
        </button>
      </aside>

      <main className="xl:col-span-3 p-8 space-y-8 overflow-y-auto max-h-screen">
        
        {/* ==================== ✅ NEW RESERVATION LIFE WORKFLOW SECTION ==================== */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 flex items-center gap-2">
            <span>📅</span> Oncoming Shift Bookings (Active Only)
          </h2>
          {reservations.length === 0 ? (
            <p className="text-xs text-gray-600 bg-black/20 p-4 rounded-lg border border-dashed border-white/5 text-center">
              No oncoming table reservations booked for this shift.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map((res) => (
                <div key={res.id} className="bg-[#1c1c1c] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-[#d4af37]/30 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                        Table #{res.tableNumber}
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        {new Date(res.reservedFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white mb-0.5">{res.customerName}</h3>
                    <p className="text-[10px] text-gray-400 font-mono mb-4">{res.customerContact}</p>
                  </div>
                  
                  <button
                    onClick={() => markAsArrived(res.id)}
                    className="w-full bg-[#d4af37] hover:bg-[#c5a232] text-black font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  >
                    Mark as Arrived
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Order Workflow Panel section stays perfectly untouched */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 flex items-center gap-2">
            <span>🍽️</span> Active Tables & Order Pipeline
          </h2>
          {orders.length === 0 ? (
            <p className="text-xs text-gray-600 bg-black/20 p-4 rounded-lg border border-dashed border-white/5 text-center">
              No active floor tickets processing at this time.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-[#1c1c1c] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                      <span className="font-bold text-xs text-white">Table {ord.tableNumber}</span>
                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                        ord.status === 'READY' ? 'bg-green-500 text-black animate-pulse' : 'bg-gray-800 text-gray-400'
                      }`}>{ord.status}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono bg-black/30 p-2.5 rounded border border-white/5 whitespace-pre-wrap mb-4">{ord.details}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs font-bold text-[#d4af37]">${ord.totalPrice.toFixed(2)}</span>
                    {ord.status === 'PENDING' && (
                      <button onClick={() => claimTicket(ord.id)} className="bg-white text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-gray-200 transition-colors">Assign Me</button>
                    )}
                    {ord.status === 'READY' && (
                      <button onClick={() => deliverAndResetTable(ord.id)} className="bg-green-500 text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-green-400 transition-colors">Mark Delivered</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};