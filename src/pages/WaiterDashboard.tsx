import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Order { id: number; tableNumber: number; details: string; totalPrice: number; status: string; isPaid: boolean; }
interface Reservation { id: number; customerName: string; customerContact: string; tableNumber: number; reservedFor: string; status: string; notes?: string;}

export const WaiterDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]); 

  // Modal State for Invoice Popup
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const synchFloorQueue = async () => {
    if (!user?.branchId) return;
    try {
      const resOrders = await api.get(`/api/branches/${user.branchId}/orders`);
      setOrders(resOrders.data);
      
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
  try {
    await api.patch(`/api/branches/${user?.branchId}/orders/${id}/status`, { status: 'IN_PROGRESS' });
    synchFloorQueue();
  } catch {
    alert('Failed to claim target service ticket.');
  }
}

// 2. Mark Delivered moves order to COMPLETED (stays on screen because isPaid is false)
const deliverTicketItems = async (id: number) => {
  try {
    await api.patch(`/api/branches/${user?.branchId}/orders/${id}/status`, { status: 'COMPLETED' });
    synchFloorQueue();
  } catch {
    alert('Failed to record delivery validation.');
  }
};
  // 2. Final settlement from the interactive ticket pop-up modal
  const handleFinalizePayment = async () => {
    if (!selectedInvoice || !user?.branchId) return;
    setProcessingPayment(true);
    try {
      await api.patch(`/api/branches/${user.branchId}/orders/${selectedInvoice.id}/pay`);
      setSelectedInvoice(null);
      synchFloorQueue();
    } catch {
      alert('Transaction settlement engine rejected verification request.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const markAsArrived = async (reservationId: number) => {
    try {
      await api.patch(`/api/branches/${user?.branchId}/reservations/${reservationId}/arrive`);
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
            <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-[#d4af37]">
                {user?.branchId === 1 ? 'London Branch' : 
                 user?.branchId === 7 ? 'Birmingham Branch' : 
                 user?.branchId === 8 ? 'Manchester Branch' : 
                 user?.branchId === 9 ? 'Liverpool Branch' : 
                 user?.branchId === 10 ? 'Glasgow Branch' : `Station Branch #${user?.branchId}`}
              </span>
              <p className="text-[9px] text-gray-500 font-mono">Branch Station ID: {user?.branchId}</p>
            </div>
          </div>
        </div>
        <button onClick={logout} className="w-full bg-white/5 hover:bg-red-950/30 border border-white/10 hover:border-red-900/30 text-gray-400 hover:text-red-400 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all">
          Log Out
        </button>
      </aside>

      <main className="xl:col-span-3 p-8 space-y-8 overflow-y-auto max-h-screen">
        
        {/* ==================== RESERVATION SECTION ==================== */}
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
              
              {/* 📆 Updated to show both short Calendar Date and clear Clock Time */}
              <div className="text-right text-[11px] font-mono leading-tight">
                <div className="text-white">
                  {new Date(res.reservedFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-gray-500 text-[10px] mt-0.5">
                  {new Date(res.reservedFor).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
            
            <h3 className="text-xs font-bold text-white mb-0.5">{res.customerName}</h3>
            <p className="text-[10px] text-gray-400 font-mono mb-4">{res.customerContact}</p>
            {res.notes && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs">
                <strong>Note:</strong> {res.notes}
              </div>
            )}
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

        {/* ==================== ACTIVE TABLES SECTION ==================== */}
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
                      ord.status === 'READY' ? 'bg-green-500 text-black animate-pulse' : 
                      ord.status === 'COMPLETED' && !ord.isPaid ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'
                        }`}>
                    {ord.status === 'COMPLETED' && !ord.isPaid ? 'DELIVERED (UNPAID)' : ord.status}
                    </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono bg-black/30 p-2.5 rounded border border-white/5 whitespace-pre-wrap mb-4">{ord.details}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
  <span className="text-xs font-bold text-[#d4af37]">${ord.totalPrice.toFixed(2)}</span>
  
  {ord.status === 'PENDING' && (
    <button onClick={() => claimTicket(ord.id)} className="bg-white text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-gray-200 transition-colors">Assign Me</button>
  )}
  
  {ord.status === 'READY' && (
    <button onClick={() => deliverTicketItems(ord.id)} className="bg-green-500 text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-green-400 transition-colors">Mark Delivered</button>
  )}
  
  {ord.status === 'COMPLETED' && !ord.isPaid && (
    <button onClick={() => setSelectedInvoice(ord)} className="bg-[#d4af37] text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-[#c5a232] transition-colors shadow-lg">Get Payment</button>
  )}
</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* 🧾 TICKET INVOICE MODAL POPUP */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#1c1c1c] border border-white/10 w-full max-w-sm rounded-xl p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#d4af37]">Guest Bill Receipt</h3>
              <p className="text-[10px] text-gray-500 font-mono">Table #{selectedInvoice.tableNumber} • Order Ref: {selectedInvoice.id}</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-lg font-mono text-xs space-y-2">
              <div className="text-[10px] text-gray-500 font-bold border-b border-white/5 pb-1 uppercase">Order Items</div>
              <p className="text-gray-300 whitespace-pre-wrap text-[11px] leading-relaxed">{selectedInvoice.details}</p>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-white/10 text-xs font-bold text-white">
                <span>TOTAL AMOUNT</span>
                <span className="text-[#d4af37]">${selectedInvoice.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-wider font-bold">
              <button onClick={() => setSelectedInvoice(null)} disabled={processingPayment} className="w-full bg-white/5 text-gray-400 hover:text-white border border-white/10 py-2.5 rounded transition-colors text-center">
                Cancel
              </button>
              <button onClick={handleFinalizePayment} disabled={processingPayment} className="w-full bg-green-500 text-black py-2.5 rounded transition-all hover:bg-green-400 text-center">
                {processingPayment ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};