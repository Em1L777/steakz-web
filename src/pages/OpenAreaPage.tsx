import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../api/axios';

interface Branch { id: number; name: string; }
interface FoodItem {
  imageUrl: any;
  id: number; itemName: string; price: number; desc: string; emoji: string; category: string; quantity: number;
}

export const OpenAreaPage: React.FC = () => {
  const navigate = useNavigate(); 
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]); 
  const [cart, setCart] = useState<Record<number, { item: FoodItem; qty: number }>>({});
  const [tableNum, setTableNum] = useState('');
  const [activeTab, setActiveTab] = useState('Steaks');
  const [statusBanner, setStatusBanner] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    api.get('/api/branches').then(res => {
      setBranches(res.data);
      if (res.data.length > 0) setSelectedBranch(res.data[0].id);
    });
  }, []);

  const refreshMenu = () => {
    if (!selectedBranch) return;
    setLoadingMenu(true);
    api.get(`/api/branches/${selectedBranch}/inventory`)
      .then(res => {
        setMenuItems(res.data);
      })
      .catch(err => {
        console.error("OpenAreaPage failed to poll branch inventory.", err);
      })
      .finally(() => setLoadingMenu(false));
  };

  useEffect(() => {
    setCart({});
    refreshMenu();
  }, [selectedBranch]);

  const changeQty = (item: FoodItem, delta: number) => {
    setCart(prev => {
      const copy = { ...prev };
      const current = copy[item.id];
      
      if (!current && delta > 0) {
        // Enforce inventory ceiling limits on immediate item additions
        if (item.quantity <= 0) return prev;
        copy[item.id] = { item, qty: 1 };
      } else if (current) {
        const structuralNextQty = current.qty + delta;
        if (structuralNextQty <= 0) {
          delete copy[item.id];
        } else {
          // Enforce inventory constraints inside selection increments
          if (delta > 0 && structuralNextQty > item.quantity) {
            alert(`Cannot order more than ${item.quantity} units of this item.`);
            return prev;
          }
          copy[item.id] = { ...current, qty: structuralNextQty };
        }
      }
      return copy;
    });
  };

  const computePricing = () => {
    const itemsValue = Object.values(cart).reduce((acc, row) => acc + (row.item.price * row.qty), 0);
    const serviceFee = itemsValue * 0.085; // 8.5% service charge
    return { subtotal: itemsValue, fee: serviceFee, final: itemsValue + serviceFee };
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedBranch || !tableNum || Object.keys(cart).length === 0) return;
    setStatusBanner('');
    try {
      const linesText = Object.values(cart)
        .map(c => `${c.qty}x ${c.item.itemName}`)
        .join(', ');
        
      const formattedTotalPrice = parseFloat(computePricing().final.toFixed(2));

      // 1. Post order ticket (Triggers backend transaction verification rules)
      const orderRes = await api.post(`/api/branches/${selectedBranch}/orders`, {
        tableNumber: parseInt(tableNum, 10),
        details: linesText,
        totalPrice: formattedTotalPrice
      });
      
      // 2. Forward to instant authorization pay capture step
      await api.post(`/api/branches/${selectedBranch}/orders/${orderRes.data.id}/pay`);
      
      setStatusBanner('Your premium sequence is processing. The grill station has received the ticket.');
      setCart({});
      setTableNum('');
      refreshMenu(); // Sync up local interface values to accurately reflect the items ordered
    } catch (err: any) {
      const backendError = err.response?.data?.error || 'Network transaction validation fault.';
      alert(`Transaction Rejected: ${backendError}`);
      refreshMenu(); // Force state sync to clear blocked local menu items
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white p-6 font-sans grid grid-cols-1 lg:grid-cols-3 gap-8 relative pb-32 lg:pb-12">
      
      {/* Menu Area Column */}
      <div className="lg:col-span-2 space-y-6">
        <header className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h1 className="font-serif text-3xl tracking-wide">Steakz Grill Ecosystem</h1>
            <p className="text-gray-400 text-xs mt-1">Select location branch and map premium cuts selection.</p>
          </div>
          <select value={selectedBranch || ''} onChange={e => setSelectedBranch(Number(e.target.value))} className="bg-[#181818] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#d4af37] focus:outline-none font-medium">
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </header>

        {statusBanner && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs">{statusBanner}</div>}

        <div className="flex gap-2">
          {['Starters', 'Steaks', 'Sides'].map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${activeTab === cat ? 'bg-[#d4af37] text-black' : 'bg-[#181818] text-gray-400'}`}>{cat}</button>
          ))}
        </div>

        {loadingMenu ? (
          <div className="text-gray-500 text-xs italic animate-pulse">Fetching localized luxury reserve menu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{menuItems.filter(f => f.category === activeTab).map(item => {
  const isOutOfStock = item.quantity <= 0;
  
  const backendBaseHost = import.meta.env.VITE_API_URL || 'http://localhost:3001'; 
  const assetImageSource = item.imageUrl ? `${backendBaseHost}${item.imageUrl}` : null;

  return (
    <div key={item.id} className={`bg-[#181818]/80 border p-5 rounded-2xl flex flex-col justify-between transition-all shadow-lg ${isOutOfStock ? 'border-red-500/20 opacity-50' : 'border-white/5 hover:border-white/10'}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          
          {/* Dynamic Image Handler Frame with Elegant Fallback Layers */}
          {assetImageSource ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative group shadow-inner">
              <img 
                src={assetImageSource} 
                alt={item.itemName} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  // Fallback safely if image loading encounters broken pipeline links
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallbackLabel = (e.target as HTMLImageElement).nextSibling as HTMLSpanElement;
                  if (fallbackLabel) fallbackLabel.style.display = 'block';
                }}
              />
              <span className="text-3xl absolute inset-0 flex items-center justify-center hidden">{item.emoji || '🥩'}</span>
            </div>
          ) : (
            <span className="text-3xl block p-1 bg-white/5 rounded-xl">{item.emoji || '🥩'}</span>
          )}

          {isOutOfStock && (
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded animate-pulse">
              Out of Stock
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-lg text-white tracking-wide">{item.itemName}</h3>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-2">{item.desc || "Exquisite selection cooked to perfection."}</p>
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
        <span className="font-mono text-[#d4af37] text-sm font-semibold">£{Number(item.price).toFixed(2)}</span>
        <button 
          onClick={() => changeQty(item, 1)} 
          disabled={isOutOfStock}
          className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm transition-all font-medium ${isOutOfStock ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white/5 hover:bg-[#d4af37] hover:text-black'}`}
        >
          +
        </button>
      </div>
    </div>
  );
})}
            {menuItems.filter(f => f.category === activeTab).length === 0 && (
              <p className="text-gray-600 text-xs italic p-2 col-span-2">No active entries inside this menu tier for this venue.</p>
            )}
          </div>
        )}
      </div>

      {/* Basket Drawer Component */}
      <div className="bg-[#181818]/60 border border-white/5 rounded-2xl p-6 h-fit space-y-5 backdrop-blur-xl shadow-2xl sticky top-6">
        <h2 className="font-serif text-xl border-b border-white/5 pb-3 tracking-wide">Basket Selection</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {Object.keys(cart).length === 0 && <p className="text-gray-500 text-xs italic text-center py-4">No menu items queued.</p>}
          {Object.values(cart).map(line => (
            <div key={line.item.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-3 rounded-xl text-xs">
              <div>
                <div className="font-medium text-white">{line.item.itemName}</div>
                <div className="text-[#d4af37] text-[10px] mt-0.5">£{(line.item.price * line.qty).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => changeQty(line.item, -1)} className="text-gray-400 hover:text-white font-bold text-sm px-1">-</button>
                <span className="w-4 text-center font-medium font-mono">{line.qty}</span>
                <button onClick={() => changeQty(line.item, 1)} className="text-gray-400 hover:text-white font-bold text-sm px-1">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-4">
          <div className="flex justify-between"><span>Subtotal</span><span className="text-white">£{computePricing().subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Service Charge (8.5%)</span><span className="text-white">£{computePricing().fee.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm font-bold text-white border-t border-white/5 pt-2">
            <span>Total</span><span className="text-[#d4af37] font-mono">£{computePricing().final.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400">Assign Table ID</label>
          <input type="number" value={tableNum} onChange={e => setTableNum(e.target.value)} placeholder="e.g. 5" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 text-center text-sm focus:outline-none focus:border-[#d4af37]" />
        </div>

        <button onClick={handleCheckoutSubmit} disabled={Object.keys(cart).length === 0 || !tableNum} className="w-full bg-[#d4af37] hover:bg-[#c5a232] disabled:bg-gray-800 disabled:text-gray-600 text-black font-semibold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg">
          Transmit Food Ticket
        </button>
      </div>

      {/* Floating Action Utility Overlay Container */}
      <div className="fixed bottom-6 left-6 flex items-center gap-3 z-50">
        <button 
          onClick={() => navigate('/book', { state: { branchId: selectedBranch } })}
          className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c5a232] text-black font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all active:scale-95 shadow-2xl"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book a Table
        </button>

        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 bg-transparent hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Staff Portal
        </button>
      </div>

    </div>
  );
};