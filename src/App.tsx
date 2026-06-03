import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { OpenAreaPage } from './pages/OpenAreaPage';
import { ReservationPage } from './pages/ReservationPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ChefDashboard } from './pages/ChefDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { HqDashboard } from './pages/HqDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Kiosk Open Areas Routes */}
          <Route path="/" element={<Navigate to="/kiosk" replace />} />
          <Route path="/kiosk" element={<OpenAreaPage />} />
          <Route path="/book" element={<ReservationPage />} />

          {/* Core System Authentication Entryway */}
          <Route path="/login" element={<LoginPage />} />

          {/* Secure Partitioned Multi-Tenant Operational Streams */}
          <Route path="/waiter" element={
            <ProtectedRoute allowedRoles={['WAITER']}><WaiterDashboard /></ProtectedRoute>
          } />
          <Route path="/kds" element={
            <ProtectedRoute allowedRoles={['CHEF']}><ChefDashboard /></ProtectedRoute>
          } />
          <Route path="/management" element={
            <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}><ManagerDashboard /></ProtectedRoute>
          } />
          <Route path="/hq" element={
            <ProtectedRoute allowedRoles={['HQ_MANAGER']}><HqDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />

          {/* Absolute Structural Catch-All Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}