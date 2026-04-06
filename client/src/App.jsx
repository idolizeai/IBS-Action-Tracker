import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import DraftsPage from './pages/Draft';

function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="min-h-screen flex items-center justify-center"><svg className="animate-spin w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
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
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/dashboard"
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
    </AuthProvider>
  );
}
