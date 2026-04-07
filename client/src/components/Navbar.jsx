import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { path: '/list', label: 'List View', Icon: List },
];

export default function Navbar({ actions, onSettings, settingsActive }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
      <div className="px-4 h-14 flex items-center gap-2">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2 mr-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm hidden sm:block">IBS Actions</span>
        </div>

        {/* ── Nav links ── */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}

        {onSettings && user?.role === 'admin' && (
          <button
            onClick={onSettings}
            className={`btn-ghost p-2 rounded-lg transition-colors ${settingsActive ? 'text-blue-600 bg-blue-50' : ''}`}
            title="Manage Masters"
          >
            <Settings size={16} />
          </button>
        )}

        {/* ── User menu ── */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-1.5 btn-ghost px-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-blue-600" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
              {user?.name}
            </span>
            <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={13} className="text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                      Admin
                    </span>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </nav>
  );
}
