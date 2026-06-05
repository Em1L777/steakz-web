import React, { useState, useEffect } from 'react';
import api from '../api/axios';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface OrderRecord {
  id: number;
  tableNumber: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';
  isPaid: boolean;
  details: string; // JSON or plaintext string holding ordered items array info
  totalPrice: number;
  waiterId: number | null;
  createdAt: string;
}

export const WaiterDashboard: React.FC = () => {
  const [activeTickets, setActiveTickets] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Invoice/Ticket Modal State Management
  const [selectedInvoice, setSelectedInvoice] = useState<OrderRecord | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchActiveBranchManifest = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders');
      setActiveTickets(res.data);
    } catch (err) {
      console.error('Error synchronizing active branch orders directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBranchManifest();
  }, []);

  const claimTicket = async (id: number) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status: 'IN_PROGRESS' });
      fetchActiveBranchManifest();
    } catch {
      alert('Failed to claim target service ticket.');
    }
  };

  // Step 1: Mark order as delivered (Status goes to COMPLETED, but isPaid remains false)
  const deliverTicketItems = async (id: number) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status: 'COMPLETED' });
      fetchActiveBranchManifest();
    } catch {
      alert('Failed to record delivery validation.');
    }
  };

  // Step 2: Finalize Payment confirmation inside invoice modal
  const handleFinalizePayment = async () => {
    if (!selectedInvoice) return;
    setProcessingPayment(true);
    try {
      await api.patch(`/api/orders/${selectedInvoice.id}/pay`);
      setSelectedInvoice(null);
      fetchActiveBranchManifest();
    } catch {
      alert('Transaction settlement engine rejected verification request.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Safe helper to parse text itemizations out of existing plaintext detail rows
  const renderItemizedLines = (detailsStr: string) => {
    try {
      if (detailsStr.startsWith('[') || detailsStr.startsWith('{')) {
        const parsed = JSON.parse(detailsStr);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 text-zinc-300">
              <span>{item.name || item.itemName} <span className="text-gray-500 font-mono">x{item.quantity}</span></span>
              <span className="font-mono text-zinc-400">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
            </div>
          ));
        }
      }
    } catch {}
    return <p className="text-zinc-400 whitespace-pre-wrap italic text-[11px] leading-relaxed">{detailsStr}</p>;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white p-8 font-sans max-w-6xl mx-auto space-y-6">
      <div className="border-b border-white/5 pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl tracking-wide font-bold">Floor Service Center</h1>
          <p className="text-[10px] text-[#d4af37] font-medium uppercase tracking-widest mt-1">Live Order Flow Management</p>
        </div>
        <button onClick={fetchActiveBranchManifest} className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs px-4 py-2 rounded-xl transition-colors font-medium">
          Refresh Layout
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-xs italic animate-pulse">Syncing floor layout maps...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTickets.map((ord) => (
            <div key={ord.id} className="bg-[#161616] border border-white/5 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-white">Table {ord.tableNumber}</span>
                  <span className={`text-[9px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded ${
                    ord.status === 'READY' ? 'bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse' : 
                    ord.status === 'COMPLETED' && !ord.isPaid ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    ord.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ord.status === 'COMPLETED' && !ord.isPaid ? 'AWAITING PAYMENT' : ord.status}
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
                  {renderItemizedLines(ord.details)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                <span className="text-sm font-mono font-bold text-[#d4af37]">${ord.totalPrice.toFixed(2)}</span>
                
                {ord.status === 'PENDING' && (
                  <button onClick={() => claimTicket(ord.id)} className="bg-white text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    Assign Me
                  </button>
                )}
                
                {ord.status === 'READY' && (
                  <button onClick={() => deliverTicketItems(ord.id)} className="bg-green-500 text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">
                    Mark Delivered
                  </button>
                )}

                {/* NEW INTERACTIVE FLOW TRIGGER: Appears smoothly only after confirmation of physical table delivery */}
                {ord.status === 'COMPLETED' && !ord.isPaid && (
                  <button onClick={() => setSelectedInvoice(ord)} className="bg-[#d4af37] text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[#c5a232] transition-colors shadow-lg shadow-[#d4af37]/10">
                    Get Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 CRISP TICKET INVOICE DETAIL MODAL OVERLAY */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-[#161616] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl tracking-wide text-white">Guest Settlement Receipt</h3>
              <p className="text-[9px] text-[#d4af37] font-mono uppercase tracking-widest">Table {selectedInvoice.tableNumber} • Transaction #{selectedInvoice.id}</p>
            </div>

            {/* Bill Core Details */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="border-b border-white/10 pb-2 mb-2 uppercase text-[9px] text-zinc-500 font-bold tracking-widest">Itemized Breakdown</div>
              <div className="max-h-40 overflow-y-auto pr-1">
                {renderItemizedLines(selectedInvoice.details)}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-white/20 text-sm font-bold text-white">
                <span>TOTAL PAYABLE</span>
                <span className="text-[#d4af37]">${selectedInvoice.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions Stack */}
            <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-wider font-bold">
              <button 
                onClick={() => setSelectedInvoice(null)} 
                disabled={processingPayment}
                className="w-full bg-transparent text-zinc-400 hover:text-white border border-white/10 p-3.5 rounded-xl transition-colors text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handleFinalizePayment}
                disabled={processingPayment}
                className="w-full bg-green-500 text-black p-3.5 rounded-xl transition-all hover:bg-green-400 shadow-xl shadow-green-500/10 text-center flex items-center justify-center"
              >
                {processingPayment ? 'Settling...' : 'Confirm Paid'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};