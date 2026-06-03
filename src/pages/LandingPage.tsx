import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 selection:bg-[#d4af37]/30">
      
      {/* Brand Identity / Header Text */}
      <div className="text-center mb-12 space-y-2">
        <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-white">
          BRANCH OPERATIONS
        </h1>
        <p className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-[0.3em]">
          Multi-Tenant Guest & Workspace Portal
        </p>
      </div>

      {/* Main 3-Button Portal Matrix Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        
        {/* Option 1: Direct Dining / Open Area Ordering */}
        <button 
          onClick={() => navigate('/open-area' )}
          className="group text-left p-8 rounded-2xl bg-[#181818] border border-white/5 hover:border-[#d4af37]/40 shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <span className="text-3xl block filter drop-shadow-[0_4px_12px_rgba(212,175,55,0.1)] group-hover:scale-110 transition-transform origin-left duration-300">
              🍔
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold group-hover:text-[#d4af37] transition-colors">
                Order Directly
              </h2>
              <p className="text-xs text-gray-400 font-light leading-relaxed mt-2">
                Skip the reservation line. Dive right into our menu ledger ecosystem and place immediate digital orders directly to our kitchen.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
            Open Menu Matrix <span>→</span>
          </div>
        </button>

        {/* Option 2: Table Booking / Reservations */}
        <button 
          onClick={() => navigate('/book-table')}
          className="group text-left p-8 rounded-2xl bg-[#181818] border border-white/5 hover:border-[#d4af37]/40 shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <span className="text-3xl block group-hover:scale-110 transition-transform origin-left duration-300">
              📅
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold group-hover:text-[#d4af37] transition-colors">
                Book a Table
              </h2>
              <p className="text-xs text-gray-400 font-light leading-relaxed mt-2">
                Secure your dining workspace profile in advance. Fast-track allocation of your designated cover table layout records.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
            Secure Allocation <span>→</span>
          </div>
        </button>

        {/* Option 3: Staff & Management Portal Login */}
        <button 
          onClick={() => navigate('/login')}
          className="group text-left p-8 rounded-2xl bg-[#111111] border border-dashed border-white/10 hover:border-white/20 shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <span className="text-3xl block group-hover:scale-110 transition-transform origin-left duration-300">
              🔑
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-300 group-hover:text-white transition-colors">
                Personnel Portal
              </h2>
              <p className="text-xs text-gray-500 font-light leading-relaxed mt-2">
                Authorized entry gateway for regional administrators, floor chefs, waitstaff, and general branch managers.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-4 group-hover:text-[#d4af37] transition-colors">
            Staff Authentication <span>→</span>
          </div>
        </button>

      </div>

      {/* Aesthetic Footer */}
      <div className="mt-16 text-[9px] font-mono text-gray-600 tracking-widest uppercase">
        Secure Handshake Protocol Enabled
      </div>
    </div>
  );
}