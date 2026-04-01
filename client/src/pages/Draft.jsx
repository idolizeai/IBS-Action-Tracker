import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, AlertTriangle, RefreshCw, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AddModal from '../components/AddModal';
import { useAuth } from '../context/AuthContext';
import idolizeLogo from '../assets/idolize-logo.png';

/* ── Idolize brand ── */
const BRAND = '#B91C1C';

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editTask,     setEditTask]     = useState(null);
  const [ibsLeads,     setIbsLeads]     = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params: { is_draft: true } });
      setTasks(data);
    } catch {
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  useEffect(() => {
    Promise.all([
      api.get('/masters/ibs-leads'),
      api.get('/masters/customers')
    ]).then(([leads, custs]) => {
      setIbsLeads(leads.data);
      setCustomers(custs.data);
    });
  }, []);

  function onSaved() {
    setEditTask(null);
    fetchDrafts();
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex flex-col">

      {/* ════════════════════════════════════════
          HEADER — matches List View style
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={17} />
          </button>

          {/* Logo mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ background: BRAND }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>

          {/* Brand + title */}
          <div className="hidden sm:flex items-center gap-1.5">
            <img src={idolizeLogo} alt="Idolize" className="h-5 w-auto opacity-50" />
            <span
              className="font-semibold text-stone-900 text-sm"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              IBS Actions
            </span>
          </div>

          {/* Draft count badge */}
          {tasks.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-0.5 text-xs font-bold text-white rounded-full"
              style={{ background: BRAND }}
            >
              {tasks.length} draft{tasks.length !== 1 ? 's' : ''}
            </motion.span>
          )}

          <div className="flex-1" />

          {/* Page label — right side */}
          <span className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-stone-700">Drafts</span>
            <span className="text-[10px] text-stone-400">
              {tasks.length} draft{tasks.length !== 1 ? 's' : ''}
            </span>
          </span>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-stone-200" />

          {/* Refresh */}
          <button
            onClick={fetchDrafts}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
              style={{ color: loading ? BRAND : undefined }}
            />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-full border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <User size={17} strokeWidth={2} className="text-stone-500" />
              <span className="hidden sm:block text-sm font-medium text-stone-600">{user?.name}</span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-stone-100">
                    <div className="text-sm font-semibold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                      {user?.name}
                    </div>
                    <div className="text-xs text-stone-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
                    style={{ color: BRAND }}
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Crimson accent line */}
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${BRAND} 0%, #DC2626 40%, transparent 100%)` }}
        />
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: BRAND }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-stone-500 font-medium">No drafts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{task.title}</p>
                      {task.missing?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.missing.map((m, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium"
                            >
                              <AlertTriangle size={10} />
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditTask(task)}
                      className="flex-shrink-0 text-stone-400 hover:text-red-700 transition-colors p-1 rounded-lg hover:bg-red-50"
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AddModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSaved={onSaved}
        ibsLeads={ibsLeads}
        customers={customers}
        editTask={editTask}
      />
    </div>
  );
}