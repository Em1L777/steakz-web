import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col items-center justify-center font-sans p-4">
      <h1 className="font-serif text-7xl font-bold text-[#d4af37]">404</h1>
      <p className="text-gray-400 text-sm mt-2 mb-6 tracking-wide">Requested operations stream link not found.</p>
      <Link to="/" className="bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">Return to Safety</Link>
    </div>
  );
};