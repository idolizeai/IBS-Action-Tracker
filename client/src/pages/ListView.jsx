import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckSquare, Square, SlidersHorizontal,
  Bell, User, RefreshCw, Settings, LogOut, X, List, LayoutGrid, Grid2X2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AddModal from '../components/AddModal';
import { useAuth } from '../context/AuthContext';
import idolizeLogo from '../assets/idolize-logo.png';

/* ── Idolize brand constants ── */
const BRAND = '#B91C1C';

const PRIO_LABEL = {
  0: 'P0 · Do Now',
  1: 'P1 · Today',
  2: 'P2 · This Week',
  3: 'P3 · Weekend',
  4: 'P4 · TBD',
};

const PRIO_BADGE = {
  0: { bg: '#B91C1C', text: '#fff' },
  1: { bg: '#EA580C', text: '#fff' },
  2: { bg: '#D97706', text: '#fff' },
  3: { bg: '#2563EB', text: '#fff' },
  4: { bg: '#A8A29E', text: '#fff' },
};

const PRIO_STRIPE = {
  0: '#B91C1C',
  1: '#EA580C',
  2: '#D97706',
  3: '#2563EB',
  4: '#A8A29E',
};

/* Section header pill colours */
const PRIO_PILL = {
  0: 'bg-red-50 text-red-800 border-red-200',
  1: 'bg-orange-50 text-orange-800 border-orange-200',
  2: 'bg-amber-50 text-amber-800 border-amber-200',
  3: 'bg-blue-50 text-blue-800 border-blue-200',
  4: 'bg-stone-100 text-stone-600 border-stone-200',
};

const FINANCIAL_LABELS = {
  very_high: 'Very High $$$',
  high:      'High $$',
  moderate:  'Moderate',
  low:       'Low',
  none:      'No Impact',
};

const FIN_CHIP = {
  very_high: 'bg-red-50 text-red-700 border-red-200 font-bold',
  high:      'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
  moderate:  'bg-amber-50 text-amber-700 border-amber-200',
  low:       'bg-green-50 text-green-700 border-green-200',
  none:      '',
};

const COMM_LABELS = {
  email:          'Email',
  in_person:      'In-Person',
  remote_meeting: 'Remote',
  chat:           'Chat',
  phone:          'Phone',
  none:           'None',
};

export default function ListView() {
  const navigate      = useNavigate();
  const { user, logout } = useAuth();

  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showDone,  setShowDone]  = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [ibsLeads,  setIbsLeads]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params: { done: showDone } });
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [showDone]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    Promise.all([api.get('/masters/ibs-leads'), api.get('/masters/customers')])
      .then(([leads, custs]) => {
        setIbsLeads(leads.data);
        setCustomers(custs.data);
      });
  }, []);

  async function toggleDone(task) {
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { done: !task.done });
      if (!showDone && data.done) setTasks(ts => ts.filter(t => t.id !== data.id));
      else setTasks(ts => ts.map(t => t.id === task.id ? data : t));
    } catch {
      toast.error('Failed to update');
    }
  }

  async function handleDelete(task) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks(ts => ts.filter(t => t.id !== task.id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  function onSaved(data, mode) {
    if (mode === 'edit') setTasks(ts => ts.map(t => t.id === data.id ? data : t));
    setEditTask(null);
  }

  const byPriority = [0, 1, 2, 3, 4].reduce((acc, p) => {
    acc[p] = tasks.filter(t => t.priority === p);
    return acc;
  }, {});

  const p0Count = tasks.filter(t => t.priority === 0).length;

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex flex-col">

      {/* ════════════════════════════════════════
          IDOLIZE NAVBAR  — matches Dashboard
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Back + Logo block */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>

          {/* Idolize logo mark (crimson) */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ background: BRAND }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <img src={idolizeLogo} alt="Idolize" className="h-5 w-auto opacity-50" />
            <span
              className="font-semibold text-stone-900 text-sm"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              IBS Actions
            </span>
          </div>

          {/* P0 alert badge */}
          {p0Count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-0.5 text-xs font-bold text-white rounded-full"
              style={{ background: BRAND }}
            >
              {p0Count} urgent
            </motion.span>
          )}

          <div className="flex-1" />

          {/* Page title + count */}
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span
              className="text-sm font-semibold text-stone-800"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              List View
            </span>
            <span className="text-[10px] text-stone-400 font-medium">
              {tasks.length} {showDone ? 'completed' : 'active'} tasks
            </span>
          </div>

          {/* View switcher */}
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-700 transition-all"
          >
            <LayoutGrid size={12} />
            Board
          </button>

          {/* Done toggle */}
          <button
            onClick={() => setShowDone(d => !d)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              showDone
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
            }`}
          >
            {showDone
              ? <CheckSquare size={13} strokeWidth={2.5} />
              : <Square size={13} strokeWidth={2.5} />
            }
            Done
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTasks}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: loading ? BRAND : undefined }} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-full border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <User size={16} strokeWidth={2} className="text-stone-500" />
              <span className="hidden sm:block text-xs font-medium text-stone-600">{user?.name}</span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-stone-100">
                    <div
                      className="text-sm font-semibold text-stone-800"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {user?.name}
                    </div>
                    <div className="text-xs text-stone-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
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

        {/* Crimson accent line at very bottom of header */}
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${BRAND} 0%, #DC2626 40%, transparent 100%)` }}
        />
      </header>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto w-full px-4 py-6">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: BRAND }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>

        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare size={22} className="text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              {showDone ? 'No completed tasks yet.' : 'No active tasks. Tap + to add one.'}
            </p>
          </div>

        ) : (
          <div className="space-y-8">
            {[0, 1, 2, 3, 4].map(p => {
              if (!byPriority[p].length) return null;
              return (
                <div key={p}>
                  {/* Priority group header */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Crimson dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PRIO_STRIPE[p] }}
                    />
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${PRIO_PILL[p]}`}
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {PRIO_LABEL[p]}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {byPriority[p].length} item{byPriority[p].length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 h-px bg-stone-200" />
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {byPriority[p].map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className={`group relative overflow-hidden bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-[1px] ${task.done ? 'opacity-50' : ''}`}
                          style={{ borderLeftWidth: 3, borderLeftColor: PRIO_STRIPE[p] }}
                        >
                          {/* Crimson sweep on hover */}
                          <div
                            className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                            style={{ background: `linear-gradient(90deg, ${BRAND}, #DC2626 55%, #F97316)` }}
                          />

                          <div className="p-3.5 pl-4">
                            <div className="flex items-start gap-3">

                              {/* Checkbox */}
                              <motion.button
                                whileTap={{ scale: 0.82 }}
                                onClick={() => toggleDone(task)}
                                className="flex-shrink-0 mt-[2px]"
                                style={{ outline: 'none' }}
                              >
                                <div style={{
                                  width: 18, height: 18,
                                  borderRadius: '50%',
                                  border: task.done ? `2px solid ${BRAND}` : '2px solid #D6D3D1',
                                  background: task.done ? BRAND : '#fff',
                                  boxShadow: task.done ? `0 0 0 3px rgba(185,28,28,0.13)` : undefined,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.18s ease',
                                }}>
                                  {task.done && (
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                                      <polyline points="2,6 5,9 10,3" />
                                    </svg>
                                  )}
                                </div>
                              </motion.button>

                              {/* Content — KEY FIX: min-w-0 + overflow-hidden prevents overflow */}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p
                                  className={`text-[13px] leading-[1.45] tracking-[-0.01em] break-words ${
                                    task.done
                                      ? 'line-through text-stone-400'
                                      : 'text-stone-900 font-semibold'
                                  }`}
                                  style={{ fontFamily: 'Georgia, serif' }}
                                >
                                  {task.title}
                                </p>

                                {/* Meta chips */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {/* Function type */}
                                  <Chip cls="bg-violet-50 text-violet-700 border-violet-200">
                                    {task.function_type}
                                  </Chip>
                                  {/* IBS Lead */}
                                  <Chip cls="bg-stone-100 text-stone-600 border-stone-200">
                                    {task.ibs_lead_name}
                                  </Chip>
                                  {/* Customer */}
                                  <Chip cls="bg-stone-100 text-stone-600 border-stone-200">
                                    {task.customer_name}
                                  </Chip>
                                  {/* Financial */}
                                  {task.financial_impact !== 'none' && (
                                    <Chip cls={FIN_CHIP[task.financial_impact]}>
                                      {FINANCIAL_LABELS[task.financial_impact]}
                                    </Chip>
                                  )}
                                  {/* Comm mode */}
                                  <Chip cls="bg-stone-50 text-stone-500 border-stone-200">
                                    {COMM_LABELS[task.comm_mode]}
                                  </Chip>
                                </div>
                              </div>

                              {/* Priority badge */}
                              <span
                                className="flex-shrink-0 text-[9px] font-black tracking-widest px-[6px] py-[3px] rounded-sm leading-none self-start mt-[2px]"
                                style={{
                                  background: PRIO_BADGE[p]?.bg,
                                  color: PRIO_BADGE[p]?.text,
                                  letterSpacing: '0.1em',
                                }}
                              >
                                P{p}
                              </span>

                              {/* Edit button */}
                              <button
                                onClick={() => setEditTask(task)}
                                className="flex-shrink-0 self-start mt-[1px] p-1.5 rounded-lg text-stone-300 transition-all duration-150 hover:bg-red-50"
                                style={{ '--hover-color': BRAND }}
                                onMouseEnter={e => e.currentTarget.style.color = BRAND}
                                onMouseLeave={e => e.currentTarget.style.color = '#D6D3D1'}
                              >
                                <SlidersHorizontal size={13} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand footer */}
      <div className="max-w-3xl mx-auto w-full px-4 pb-8 pt-2 flex items-center gap-2">
        <div className="w-[3px] h-[13px] rounded-sm flex-shrink-0" style={{ background: BRAND }} />
        <span className="text-[10px] text-stone-400 font-medium tracking-widest uppercase">
          Idolize · Customer · Innovation · Values
        </span>
      </div>

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

function Chip({ cls, children }) {
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-[3px] rounded-full border font-medium leading-none ${cls}`}>
      {children}
    </span>
  );
}