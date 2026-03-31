import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import DraftsPage from './pages/Draft';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route path='/drafts'
        element={<ProtectedRoute><DraftsPage /></ProtectedRoute>}
      />
      <Route
        path="/list"
        element={<ProtectedRoute><ListView /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>

      {/* General toasts — top-center */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* ⏰ Task reminder notifications — bottom-right (separate Toaster instance) */}
      <Toaster
        id="notification-toaster"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            maxWidth: '320px',
          },
        }}
      />
    </AuthProvider>
  );
}