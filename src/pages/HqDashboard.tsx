import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // ✅ Added exact hook import from your project context

interface BranchMetric {
  branchId: number;
  branchName: string;
  totalRevenue: number;
  orderCount: number;
}

interface DashboardMetrics {
  totalRevenue: number;
  branchRevenue: BranchMetric[];
}

// ✅ Type interface for the read-only roster list matching backend keys
interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const HqDashboard: React.FC = () => {
  const { logout } = useAuth(); // ✅ Destructured your existing logout hook safely
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Component states to track selection details
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);

  useEffect(() => {
    api.get('/api/hq/reports/consolidated')
      .then(res => {
        setMetrics(res.data);
      })
      .catch(err => {
        console.error("HQ Sync Error: ", err);
        setError("Failed to synchronize global group metrics ledger.");
      });
  }, []);

  // ✅ Read-only fetching function tied to your existing branch endpoint
  const handleBranchClick = (branchId: number, branchName: string) => {
    setSelectedBranchId(branchId);
    setSelectedBranchName(branchName);
    setLoadingStaff(true);
    setStaffList([]);

    api.get(`/api/branches/${branchId}/employees`)
      .then(res => {
        setStaffList(res.data);
        setLoadingStaff(false);
      })
      .catch(err => {
        console.error("Failed to load staff list:", err);
        setLoadingStaff(false);
      });
  };

  const totalNetProfit = (metrics?.totalRevenue || 0) * 0.30;

  return (
    <div className="min-h-screen bg-[#131313] text-white p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* HEADER SECTION CONTAINER */}
      <header className="border-b border-white/5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide">HQ Executive Overview</h1>
          <p className="text-gray-400 text-xs mt-1">Consolidated multi-branch performance analytics ledger.</p>
        </div>
        
        {/* ✅ NEW: Clearly marked read-only context logout command trigger action */}
        <button
          onClick={logout}
          className="px-4 py-2 text-xs font-mono tracking-wider text-gray-400 hover:text-white border border-white/10 hover:border-red-500/40 rounded-xl bg-white/[0.02] hover:bg-red-950/20 transition-all duration-200 shadow-lg"
        >
          Logout
        </button>
      </header>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl text-xs text-red-400 font-mono">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 🔄 CHANGED: Text updated to Net Profit Margin and calculation integrated */}
        <div className="bg-[#181818]/80 border border-white/5 p-6 rounded-2xl shadow-xl">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">Total Aggregated Net Profit Margin (60%)</span>
          <div className="text-4xl font-serif text-[#d4af37] font-black mt-2">
            £{totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-[#181818]/80 border border-white/5 p-6 rounded-2xl shadow-xl">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">Active Monitored Locations</span>
          <div className="text-4xl font-serif text-white font-black mt-2">
            {metrics?.branchRevenue.length || 0} Sites
          </div>
        </div>
      </div>

      {/* Main layout split setup: Table on left, view-only staff list panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* NETWORK DIRECTORY TABLE CONTAINER */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-xl font-medium tracking-wide">Network Distribution Directory</h2>
          <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/5 text-gray-400 uppercase tracking-wider font-medium">
                  <th className="p-4">Branch Profile Node</th>
                  <th className="p-4 text-right">Throughput Operations</th>
                  {/* 🔄 CHANGED: Column heading updated to show Net Margin */}
                  <th className="p-4 text-right text-[#d4af37]">Net Profit Margin (60%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics?.branchRevenue.map(b => {
                  const isSelected = selectedBranchId === b.branchId;
                  // Calculate specific branch Net Profit Margin (60% of branch gross revenue)
                  const branchNetProfit = b.totalRevenue * 0.30;

                  return (
                    <tr 
                      key={b.branchId} 
                      // ✅ Added structural click handler, pointer cursor, and visual selections
                      onClick={() => handleBranchClick(b.branchId, b.branchName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-4 font-serif text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                        {b.branchName}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] inline-block animate-pulse" />}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-400">{b.orderCount} Closed Tickets</td>
                      {/* 🔄 CHANGED: Value cell calculated dynamically with the 60% remaining layout balance formula */}
                      <td className="p-4 text-right font-mono font-bold text-[#d4af37] text-sm">
                        £{branchNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-500 font-mono italic">💡 Click on any branch row above to safely audit its active personnel roster.</p>
        </div>

        {/* ✅ Purely view-only personnel information directory panel */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium tracking-wide text-gray-400">Roster Assignment Matrix</h2>
          
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 min-h-[260px] shadow-2xl flex flex-col justify-between">
            {!selectedBranchId ? (
              <div className="my-auto text-center p-4">
                <div className="text-gray-600 text-3xl mb-2">👥</div>
                <p className="text-gray-500 text-xs">No branch selected.</p>
                <p className="text-[10px] text-gray-600 mt-1">Select a branch node from the directory matrix to compile staff profiles.</p>
              </div>
            ) : (
              <div className="space-y-4 w-full h-full flex flex-col justify-start">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-gray-500 block">Auditing Roster Node</span>
                  <h3 className="font-serif text-base font-bold text-white">{selectedBranchName}</h3>
                </div>

                {loadingStaff ? (
                  <div className="my-auto text-center py-8 font-mono text-xs text-gray-500 animate-pulse">
                    Querying branch database records...
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="my-auto text-center py-8 text-gray-500 text-xs italic">
                    No active personnel found assigned to this location.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto pr-1 space-y-2 pt-1">
                    {staffList.map(member => (
                      <div key={member.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium text-white text-sm">{member.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{member.email}</p>
                        </div>
                        {/* Status Role Badge Pill Display */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-semibold uppercase border ${
                          member.role === 'BRANCH_MANAGER' 
                            ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' 
                            : member.role === 'CHEF'
                            ? 'bg-purple-950/20 text-purple-400 border-purple-900/40'
                            : 'bg-blue-950/20 text-blue-400 border-blue-900/40'
                        }`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-t border-white/5 pt-3 mt-auto flex items-center gap-1.5 text-gray-500 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Read-Only Informational Scope
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};