import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Ticket { id: number; tableNumber: number; details: string; status: string; }

export const ChefDashboard: React.FC = () => {
  const { user, logout } = useAuth(); // ✅ Extracting logout method from active AuthContext instance
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchKitchenLine = async () => {
    if (!user?.branchId) return;
    try {
      const res = await api.get(`/api/branches/${user.branchId}/orders`);
      setTickets(res.data.filter((t: Ticket) => t.status !== 'COMPLETED' && t.status !== 'READY'));
    } catch {
      console.error('KDS pipeline connection dropped.');
    }
  };

  useEffect(() => {
    fetchKitchenLine();
    const poll = setInterval(fetchKitchenLine, 4000);
    return () => clearInterval(poll);
  }, [user]);

  const fireStatusTransition = async (id: number, nextStatus: 'IN_PROGRESS' | 'READY') => {
    await api.patch(`/api/branches/${user?.branchId}/orders/${id}/status`, { status: nextStatus });
    fetchKitchenLine();
  };

  // Safe formatting fallback interpreter to guard against broken string arrays
  const renderOrderDetails = (rawDetails: string) => {
    if (!rawDetails) return "No item specs logged.";
    
    // Check if the string text contains literal 'undefined' flags
    if (rawDetails.toUpperCase().includes("UNDEFINED")) {
      return "⚠️ Structural Naming Mismatch: Check item.itemName parameters in checkout form.";
    }

    try {
      // If your backend stores it as a structural JSON string array instead of text
      const parsed = JSON.parse(rawDetails);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => `${item.quantity}x ${item.itemName || item.name}`).join('\n');
      }
    } catch {
      // If it's a standard text string, display it safely
    }
    
    return rawDetails;
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans flex flex-col">
      <header className="bg-[#141414] border-b border-white/5 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
          <h1 className="font-serif text-lg tracking-widest uppercase font-bold text-white">STEAKz KDS SYSTEM</h1>
        </div>
        
        {/* ✅ Right Side Flex Wrapper Containing Station Marker and integrated Log Out Button Action */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-[#d4af37] font-mono tracking-wider font-bold">GRILL & EXPEDITE STATION</div>
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 bg-transparent hover:bg-white/5 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-red-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-x-auto flex gap-4 items-start select-none">
        {tickets.length === 0 && (
          <div className="m-auto text-center font-serif text-gray-600 italic text-xl tracking-wide">
            No protein items currently on active fire line.
          </div>
        )}
        {tickets.map(ticket => (
          <div key={ticket.id} className={`w-80 shrink-0 bg-[#141414] border rounded-xl overflow-hidden flex flex-col justify-between shadow-2xl ${ticket.status === 'PENDING' ? 'border-orange-500/30 bg-gradient-to-b from-orange-950/10 to-transparent' : 'border-yellow-500/30'}`}>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-2xl font-serif font-black text-white">TBL {ticket.tableNumber}</span>
                <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">#ID-{ticket.id}</span>
              </div>
              {/* FIXED: Uses renderOrderDetails parser tracker wrapper below */}
              <div className="text-sm font-semibold tracking-wide bg-black/40 p-4 rounded-xl text-white min-h-[100px] leading-relaxed whitespace-pre-wrap font-mono uppercase border border-white/[0.02]">
                {renderOrderDetails(ticket.details)}
              </div>
            </div>

            <div className="p-2 bg-black/40 border-t border-white/5">
              {ticket.status === 'PENDING' ? (
                <button onClick={() => fireStatusTransition(ticket.id, 'IN_PROGRESS')} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-xs tracking-wider uppercase transition-colors">
                  Accept & Start Cooking
                </button>
              ) : (
                <button onClick={() => fireStatusTransition(ticket.id, 'READY')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-colors">
                  Pass to Pass / Ready
                </button>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};