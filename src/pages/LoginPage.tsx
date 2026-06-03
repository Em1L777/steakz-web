import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);

      const { role } = res.data.user;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'HQ_MANAGER') navigate('/hq');
      else if (role === 'BRANCH_MANAGER') navigate('/management');
      else if (role === 'CHEF') navigate('/kds');
      else if (role === 'WAITER') navigate('/waiter');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication server rejected connection parameters.');
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col justify-between items-center py-10 px-4 text-white font-sans">
      <div />
      <div className="w-full max-w-md text-center z-10">
        <h1 className="font-serif text-5xl tracking-widest text-white uppercase mb-1">Steakz.</h1>
        <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] font-medium mb-8">Executive Interface</p>

        <div className="bg-[#181818]/60 border border-white/5 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl text-left">
          {error && <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">Corporate Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@steakz.co.uk" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-[#d4af37] focus:outline-none transition-colors placeholder:text-gray-600" />
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">System Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-[#d4af37] focus:outline-none transition-colors placeholder:text-gray-600" />
            </div>

            <button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c5a232] text-black font-semibold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-xl shadow-[#d4af37]/5 mt-2">
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
      <div className="text-[11px] text-gray-600 tracking-wide font-light">SECURE AES-256 INTERNAL ACCESS MATRIX</div>
    </div>
  );
};