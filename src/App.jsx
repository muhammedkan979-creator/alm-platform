import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import InvestorDashboard from './pages/InvestorDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RewardsCatalog from './pages/RewardsCatalog';

function RoleHome() {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">Loading…</div>
    );
  }
  if (!profile) return <Navigate to="/auth" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'advisor') return <Navigate to="/advisor" replace />;
  return <Navigate to="/investor" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<RoleHome />} />
          <Route
            path="/investor"
            element={
              <ProtectedRoute allowedRoles={['investor']}>
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advisor"
            element={
              <ProtectedRoute allowedRoles={['advisor']}>
                <AdvisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute allowedRoles={['investor']}>
                <RewardsCatalog />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
      }
