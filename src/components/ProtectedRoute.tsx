import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'HQ_MANAGER' | 'BRANCH_MANAGER' | 'CHEF' | 'WAITER'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { token, user, loading   } = useAuth();
  const location = useLocation();

// 1. If the context is still checking the token/user, wait here!
  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <p className="animate-pulse tracking-widest text-sm text-gray-400">VERIFYING CREDENTIALS...</p>
      </div>
    );
  }

  // 2. If loading is done and there is still no token, send to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If loading is done, token exists, but user data is still missing or bad role
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white p-6 font-sans">
        <div className="bg-black/40 border border-red-900/40 p-8 rounded-2xl max-w-md text-center backdrop-blur-xl shadow-2xl">
          <div className="text-red-500 mb-3"><span className="material-icons-outlined text-4xl">gpp_bad</span></div>
          <h2 className="font-serif text-2xl tracking-wide mb-2">Access Restricted</h2>
          <p className="text-gray-400 text-xs leading-relaxed">Your corporate profile credentials lack clearance levels to hook into this live environment stream.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};