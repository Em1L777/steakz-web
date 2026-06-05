import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface PlatformUser { id: number; name: string; email: string; role: string; branchId?: number | null; }
interface Branch { id: number; name: string; location: string; }

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [userRecords, setUserRecords] = useState<PlatformUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [bName, setBName] = useState('');
  const [bLoc, setBLoc] = useState('');

  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState<'ADMIN' | 'HQ_MANAGER' | 'BRANCH_MANAGER'>('HQ_MANAGER');
  const [uBranchId, setUBranchId] = useState<string>('');

  const syncDashboardData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/branches')
      ]);
      setUserRecords(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error("System Matrix data synchronization fault:", err);
    }
  };

  useEffect(() => { 
    syncDashboardData(); 
  }, []);

  const provisionManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', { 
        name: uName, 
        email: uEmail, 
        password: uPassword, 
        role: uRole,
        branchId: uRole === 'BRANCH_MANAGER' && uBranchId ? parseInt(uBranchId, 10) : null 
      });
      alert('Management profile provisioned successfully.');
      setUName(''); setUEmail(''); setUPassword(''); setUBranchId('');
      syncDashboardData();
    } catch {
      alert('Error provisioning system account.');
    }
  };

  const configureNewBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/branches', { name: bName, location: bLoc });
      alert('Branch provision complete.');
      setBName(''); setBLoc('');
      syncDashboardData();
    } catch {
      alert('Error initializing infrastructure.');
    }
  };

  const overrideRole = async (id: number, targetRole: string) => {
    await api.patch(`/api/admin/users/${id}/roles`, { role: targetRole });
    syncDashboardData();
  };

  const handleAssignBranch = async (userId: number, branchStrId: string) => {
    try {
      const parsedBranchId = branchStrId === 'unassigned' ? null : parseInt(branchStrId, 10);
      await api.patch(`/api/admin/users/${userId}/branch`, { branchId: parsedBranchId });
      syncDashboardData();
    } catch {
      alert('Failed to rebind regional cluster node authority boundary.');
    }
  };

  // 🛑 NEW: Soft-deactivates user from network
  const handleSoftDeleteUser = async (user: PlatformUser) => {
    const confirmation = window.confirm(`Security Protocol: Are you certain you want to revoke access clearance for "${user.name}"?`);
    if (!confirmation) return;

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      alert('Account clearance deactivated.');
      syncDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to execute profile deactivation.');
    }
  };

  // 🛑 NEW: Soft-decommissions a branch 
  const handleSoftDeleteBranch = async (branch: Branch) => {
    const typedConfirmation = window.prompt(`DECOMMISSION PROTOCOL: Type "${branch.name}" to safely archive this restaurant branch location and preserve historical bookkeeping records:`);
    if (typedConfirmation !== branch.name) {
      if (typedConfirmation !== null) alert('Verification mismatch. Action aborted.');
      return;
    }

    try {
      await api.delete(`/api/admin/branches/${branch.id}`);
      alert('Regional infrastructure node archived.');
      syncDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive location node.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
      <div className="lg:col-span-2 space-y-6">

        {/* HEADER ROW */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-wide">Technical Control Matrix</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Root Administrator Node</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-xs font-medium px-4 py-2 rounded-xl transition-all active:scale-95 group"
          >
            <span className="material-icons-outlined text-sm">logout</span>
          </button>
        </div>

        {/* Global User Clearance Map */}
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="font-serif text-lg text-[#d4af37]">Global User Clearance Map</h2>
          <div className="space-y-2.5">
            {userRecords
              .filter(u => u.role === 'ADMIN' || u.role === 'HQ_MANAGER' || u.role === 'BRANCH_MANAGER' || u.role === 'WAITER' || u.role === 'CHEF')
              .map(u => (
                <div key={u.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between sm:items-center text-xs">
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {u.name}
                    </div>
                    <div className="text-gray-500 font-light mt-0.5">{u.email}</div>
                    <div className="text-[10px] font-mono mt-1 text-[#d4af37]">
                      Scope: {u.role === 'BRANCH_MANAGER' && u.branchId 
                        ? `Locked to Branch ID: ${u.branchId}` 
                        : u.role === 'BRANCH_MANAGER' ? '⚠️ Missing Assigned Scope' : 'Global Governance'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select 
                      value={u.role} 
                      onChange={e => overrideRole(u.id, e.target.value)} 
                      className="bg-[#1e1e1e] border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none font-mono"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="HQ_MANAGER">HQ_MANAGER</option>
                      <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                    </select>

                    {u.role === 'BRANCH_MANAGER' && (
                      <select
                        value={u.branchId || 'unassigned'}
                        onChange={e => handleAssignBranch(u.id, e.target.value)}
                        className="bg-[#1e1e1e] border border-[#d4af37]/30 text-[#d4af37] rounded-lg p-2 text-xs focus:outline-none font-mono"
                      >
                        <option value="unassigned">-- Select Assigned Branch --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                        ))}
                      </select>
                    )}

                    {/* Trash Can Action Button for User Deactivation */}
                    <button
                      onClick={() => handleSoftDeleteUser(u)}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 rounded-lg transition-colors"
                      title="Deactivate Security Access Clearances"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 🏢 NEW LAYOUT ELEMENT: Infrastructure Node Operational Registry Grid */}
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="font-serif text-lg text-[#d4af37]">Active Infrastructure Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map(b => (
              <div key={b.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-white text-sm">{b.name}</div>
                  <div className="text-gray-400 font-light mt-0.5">📍 {b.location}</div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1">ID Ref: {b.id}</div>
                </div>
                <button
                  onClick={() => handleSoftDeleteBranch(b)}
                  className="p-2 text-red-400 hover:text-red-300 bg-red-950/10 hover:bg-red-950/30 border border-red-900/20 rounded-xl transition-all"
                  title="Archive and Decommission Location"
                >
                  Decommission Venue
                </button>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-zinc-500 text-xs italic">No active corporate venue nodes online.</p>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT SIDE PANEL STACK */}
      <div className="space-y-6">
        {/* Initialize Store Node Form */}
        <div className="bg-[#181818] border border-white/5 p-6 rounded-2xl h-fit space-y-4 shadow-xl">
          <h2 className="font-serif text-lg text-[#d4af37]">Initialize Store Node</h2>
          <form onSubmit={configureNewBranch} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">Store Name</label>
              <input type="text" required placeholder="Mayfair Executive Room" value={bName} onChange={e => setBName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-white" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">Regional Location Meta</label>
              <input type="text" required placeholder="London Core" value={bLoc} onChange={e => setBLoc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-white" />
            </div>
            <button type="submit" className="w-full bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg hover:bg-[#c5a232] transition-colors">Provision Cluster Node</button>
          </form>
        </div>

        {/* Provision Management Node Form */}
        <div className="bg-[#181818] border border-white/5 p-6 rounded-2xl h-fit space-y-4 shadow-xl">
          <h2 className="font-serif text-lg text-[#d4af37]">Provision Management Node</h2>
          <form onSubmit={provisionManager} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">Full Name</label>
              <input type="text" required placeholder="Sarah Jenkins" value={uName} onChange={e => setUName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-white" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">Corporate Email</label>
              <input type="email" required placeholder="s.jenkins@steakz.com" value={uEmail} onChange={e => setUEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-white" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">Access Password</label>
              <input type="password" required placeholder="••••••••" value={uPassword} onChange={e => setUPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-white" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-medium tracking-wider text-gray-400 mb-1">System Authority Level</label>
              <select value={uRole} onChange={e => setURole(e.target.value as 'ADMIN' | 'HQ_MANAGER' | 'BRANCH_MANAGER' )} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:outline-none text-gray-300">
                <option value="HQ_MANAGER">HQ_MANAGER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
              </select>
            </div>

            {uRole === 'BRANCH_MANAGER' && (
              <div className="animate-fadeIn">
                <label className="block text-[10px] uppercase font-medium tracking-wider text-[#d4af37] mb-1">Assign Boundary Target Node</label>
                <select 
                  required
                  value={uBranchId} 
                  onChange={e => setUBranchId(e.target.value)} 
                  className="w-full bg-black/40 border border-[#d4af37]/30 rounded-lg p-3 text-xs focus:outline-none text-white font-medium"
                >
                  <option value="">-- Choose Venue Subsystem --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#181818]">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg hover:bg-[#c5a232] transition-colors">Create Corporate Account</button>
          </form>
        </div>
      </div>
    </div>
  );
};
