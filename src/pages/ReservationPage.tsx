import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const ReservationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safe extraction of forwarded router parameter states
  const passedBranchId = location.state?.branchId ? String(location.state.branchId) : '';

  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [branchId, setBranchId] = useState(passedBranchId);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Form elements aligned to the graphic layout map in "Снимок экрана 2026-06-01 222234.png"
  const [guestCount, setGuestCount] = useState(2);
  const [selectedDate, setSelectedDate] = useState('2026-11-15'); // Baseline default setting matching the layout context
  const [selectedTime, setSelectedTime] = useState('19:00');
  
  const [errorText, setErrorText] = useState('');
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/branches').then(res => {
      setBranches(res.data);
      if (res.data.length > 0 && !branchId) {
        setBranchId(res.data[0].id.toString());
      }
    });
  }, [branchId]);

  const availableSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setCompleted(false);
    setSubmitting(true);

    try {
      // Reconstruct target datetime sequence mapping
      const localCombinedString = `${selectedDate}T${selectedTime}:00`;
      
      await api.post(`/api/branches/${branchId}/reservations`, {
        customerName,
        customerContact,
        tableNumber: Math.floor(Math.random() * 12) + 1, // Auto-assign a table layout slot naturally
        reservedFor: new Date(localCombinedString).toISOString(),
        notes: specialRequests // Passes structural request notes string fields forward safely
      });
      
      setCompleted(true);
      setCustomerName(''); 
      setCustomerContact(''); 
      setSpecialRequests('');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorText('Tables are filling up quickly for the selected date. Please consider alternative times.');
      } else {
        setErrorText('Reservation system structural pipeline validation error.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting calculation utilities
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Not Selected';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white p-6 md:p-12 font-sans selection:bg-[#d4af37]/30">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="font-serif text-4xl font-bold tracking-wide text-white">Book a Table</h1>
        <p className="text-gray-400 text-sm mt-1">Secure your reservation at our premier locations.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Dynamic Warning Banner matching the image context */}
        {errorText && (
          <div className="bg-[#8a0f0f] border border-red-700 text-white p-4 rounded-lg text-xs font-medium flex items-start gap-3 mb-6 transition-all animate-fadeIn">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px]">High Demand Alert</div>
              <p className="text-gray-200 mt-0.5">{errorText}</p>
            </div>
          </div>
        )}

        {completed && (
          <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-xs font-medium flex items-center gap-3 mb-6">
            <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Table locked. Your premium luxury reservation configuration is completely processed.</span>
          </div>
        )}

        {/* Two-Column Grid Setup */}
        <form onSubmit={submitForm} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT INTERFACE: Details & Parameters Configuration (Spans 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Box 1: Details Selector Card (Branch & Guest Counters) */}
            <div className="bg-[#181818] border border-white/5 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 shadow-xl">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2.5">
                  📁 Details — Branch Location
                </label>
                <select 
                  value={branchId} 
                  onChange={e => setBranchId(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:outline-none focus:border-[#d4af37] transition-all cursor-pointer font-medium"
                >
                  {branches.map(b => <option key={b.id} value={b.id} className="bg-[#181818]">{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2.5">
                  Guests Count
                </label>
                <div className="flex items-center justify-between w-full bg-black/40 border border-white/10 rounded-lg p-1.5 h-[42px]">
                  <button 
                    type="button" 
                    onClick={() => setGuestCount(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-md bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-sm transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-white tracking-wider">{guestCount} Guests</span>
                  <button 
                    type="button" 
                    onClick={() => setGuestCount(prev => Math.min(20, prev + 1))}
                    className="w-8 h-8 rounded-md bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-sm transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2 & 3 Side-by-Side: Calendar Picker and Dinner Time slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Date Card */}
              <div className="bg-[#181818] border border-white/5 rounded-xl p-6 shadow-xl">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-4">
                  📅 Date Configuration
                </label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:outline-none focus:border-[#d4af37] tracking-wider text-center"
                />
                <div className="mt-4 p-4 border border-white/5 bg-black/20 rounded-lg text-center">
                  <span className="text-[11px] text-gray-400 block uppercase tracking-widest font-semibold mb-1">Target Horizon</span>
                  <p className="text-xs font-serif text-[#d4af37] font-semibold">{formatDisplayDate(selectedDate)}</p>
                </div>
              </div>

              {/* Time slots Select Card */}
              <div className="bg-[#181818] border border-white/5 rounded-xl p-6 shadow-xl">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2">
                  🕒 Time — Dinner Settings
                </label>
                <div className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mb-4 pb-1 border-b border-white/5">Dinner Sessions</div>
                <div className="grid grid-cols-2 gap-3">
                  {availableSlots.map(slot => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-4 text-xs font-mono rounded-lg transition-all border text-center font-semibold tracking-wider ${
                          isSelected 
                            ? 'bg-transparent border-[#d4af37] text-[#d4af37] shadow-lg' 
                            : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT INTERFACE: Guest Identity Profiles & Confirmation Sidebar Summary */}
          <div className="bg-[#181818] border border-white/5 rounded-xl p-6 shadow-2xl space-y-5 sticky top-6">
            <h2 className="font-serif text-xl tracking-wide font-medium border-b border-white/5 pb-3">Guest Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="John Doe" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:outline-none focus:border-[#d4af37]" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="+44 20 7123 4567" 
                  value={customerContact} 
                  onChange={e => setCustomerContact(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:outline-none focus:border-[#d4af37]" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">Special Requests</label>
                <textarea 
                  rows={3}
                  placeholder="Dietary requirements, occasions..." 
                  value={specialRequests} 
                  onChange={e => setSpecialRequests(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed" 
                />
              </div>
            </div>

            {/* Summary Tracker Box directly echoing the lower block of layout graphic design mapping */}
            <div className="border-t border-white/5 pt-4 mt-2 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span>Date</span>
                <span className="text-white font-medium">{formatDisplayDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Time</span>
                <span className="text-white font-mono">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Guests</span>
                <span className="text-white font-medium">{guestCount} People</span>
              </div>
            </div>

            {/* Action Buttons Container */}
            <div className="space-y-2 pt-2">
              <button 
                type="submit" 
                disabled={submitting || !branchId}
                className="w-full bg-[#d4af37] hover:bg-[#c5a232] disabled:bg-gray-800 disabled:text-gray-500 text-black font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.99]"
              >
                {submitting ? 'Processing Lock...' : 'Confirm Booking'}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate('/kiosk')}
                className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-semibold py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              >
                Return to Ecosystem Menu
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};