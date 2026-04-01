import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, LogOut, Settings, X, RefreshCw, LayoutGrid, Grid2X2, User, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Matrix from '../components/Matrix';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import FilterBar from '../components/FilterBar';
import AddModal from '../components/AddModal';
import MasterManager from '../components/MasterManager';
import { useNotification } from '../hooks/useNotification.jsx';
import idolizeLogo from '../assets/idolize-logo.png';

/* ── Idolize brand ── */
const BRAND = '#B91C1C';

const PRIORITY_LABELS = {
  0: 'P0 · Do Now',
  1: 'P1 · Today',
  2: 'P2 · This Week',
  3: 'P3 · Weekend',
};

const PRIORITY_COLORS = {
  0: 'bg-red-50 text-red-800 border-red-200',
  1: 'bg-orange-50 text-orange-800 border-orange-200',
  2: 'bg-amber-50 text-amber-800 border-amber-200',
  3: 'bg-blue-50 text-blue-800 border-blue-200',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks,        setTasks]        = useState([]);
  const [ibsLeads,     setIbsLeads]     = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editTask,     setEditTask]     = useState(null);
  const [masterOpen,   setMasterOpen]   = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [viewMode,     setViewMode]     = useState('kanban');
  const [filters,      setFilters]      = useState({
    priority: null, ibs_lead: null, customer: null,
    function_type: null, financial_impact: null,
  });
  const [overdueTasks, setOverdueTasks] = useState([]);

  useNotification(tasks, setOverdueTasks);

  useEffect(() => {
    Promise.all([api.get('/masters/ibs-leads'), api.get('/masters/customers')])
      .then(([leads, custs]) => { setIbsLeads(leads.data); setCustomers(custs.data); })
      .catch(() => toast.error('Failed to load masters'));
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { done: false };
      if (filters.priority !== null)  params.priority         = filters.priority;
      if (filters.ibs_lead)           params.ibs_lead_id      = filters.ibs_lead;
      if (filters.customer)           params.customer_id      = filters.customer;
      if (filters.function_type)      params.function_type    = filters.function_type;
      if (filters.financial_impact)   params.financial_impact = filters.financial_impact;
      const { data } = await api.get('/tasks', { params });
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function handleTaskSaved()          { setEditTask(null); fetchTasks(); }
  function handleTaskUpdated(data)    {
    if (data.done) setTasks(ts => ts.filter(t => t.id !== data.id));
    else           setTasks(ts => ts.map(t => t.id === data.id ? data : t));
  }
  function handleTaskDeleted(id)      { setTasks(ts => ts.filter(t => t.id !== id)); }
  function handleEdit(task)           { setEditTask(task); setAddOpen(true); }
  function handleMasterUpdate(type, newList) {
    if (type === 'leads')     setIbsLeads(newList);
    if (type === 'customers') setCustomers(newList);
  }
  function openDrawer() { setBellOpen(false); setDrawerOpen(true); }

  const p0Count = tasks.filter(t => t.priority === 0).length;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault(); setEditTask(null); setAddOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex flex-col">

      {/* ════════════════════════════════════════
          IDOLIZE NAVBAR
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Logo mark — Idolize crimson */}
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

          {/* Draft */}
          <button
            onClick={() => navigate('/drafts')}
            className="px-3 py-1.5 text-xs font-semibold rounded-full text-white shadow-sm transition-all active:scale-95 hover:opacity-90"
            style={{ background: BRAND }}
          >
            Draft
          </button>

          {/* List view */}
          <button
            onClick={() => navigate('/list')}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
            title="List View"
          >
            <List size={17} />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTasks}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
              style={{ color: loading ? BRAND : undefined }}
            />
          </button>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => { setBellOpen(o => !o); setUserMenuOpen(false); }}
              className={`relative p-2 rounded-lg transition-colors ${
                bellOpen ? 'bg-orange-50 text-orange-500' : 'hover:bg-stone-100 text-stone-400'
              }`}
              title="Overdue Tasks"
            >
              <Bell size={17} className={overdueTasks.length > 0 ? 'text-orange-500' : ''} />
              {overdueTasks.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {overdueTasks.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-orange-500" />
                      <span className="text-sm font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                        Overdue Tasks
                      </span>
                      {overdueTasks.length > 0 && (
                        <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                          {overdueTasks.length}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setBellOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {overdueTasks.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-stone-400 font-medium mt-2">All caught up!</p>
                        <p className="text-xs text-stone-300 mt-1">No tasks pending over 1 hour</p>
                      </div>
                    ) : (
                      overdueTasks.map(task => {
                        const hrs = Math.floor(
                          (new Date() - new Date(task.created_at?.replace?.('Z', '') ?? task.created_at)) / (1000 * 60 * 60)
                        );
                        return (
                          <div
                            key={task.id}
                            className="px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer"
                            onClick={() => { handleEdit(task); setBellOpen(false); }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-stone-800 flex-1 leading-snug break-words min-w-0">
                                {task.title}
                              </span>
                              <span className="text-[10px] text-stone-400 whitespace-nowrap mt-0.5 font-medium flex-shrink-0">
                                {hrs}h ago
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                                {PRIORITY_LABELS[task.priority] ?? `P${task.priority}`}
                              </span>
                              {task.customer_name && (
                                <span className="text-[10px] text-stone-400 font-medium truncate max-w-[120px]">
                                  {task.customer_name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {overdueTasks.length > 0 && (
                    <div className="border-t border-stone-100">
                      <button
                        onClick={openDrawer}
                        className="w-full px-4 py-2.5 text-xs font-semibold transition-colors text-center hover:bg-red-50"
                        style={{ color: BRAND }}
                      >
                        View All Notifications ({overdueTasks.length}) →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Masters (admin) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setMasterOpen(o => !o)}
              className={`p-2 rounded-lg transition-colors ${
                masterOpen ? 'bg-red-50 text-red-700' : 'hover:bg-stone-100 text-stone-400'
              }`}
              style={{ color: masterOpen ? BRAND : undefined }}
              title="Manage Masters"
            >
              <Settings size={17} />
            </button>
          )}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(o => !o); setBellOpen(false); }}
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

        {/* Filter bar */}
        <div className="px-4 pb-2">
          <FilterBar active={filters} onChange={setFilters} ibsLeads={ibsLeads} customers={customers} />
        </div>

        {/* View toggle */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {[
            { mode: 'kanban',      Icon: LayoutGrid, label: 'Priority View'      },
            { mode: 'eisenhower',  Icon: Grid2X2,    label: 'Eisenhower Matrix'  },
          ].map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
                viewMode === mode
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-red-300 hover:text-red-700'
              }`}
              style={viewMode === mode ? { background: BRAND, borderColor: BRAND } : {}}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          {viewMode === 'eisenhower' && (
            <span className="hidden sm:block text-[10px] text-stone-400 font-medium ml-1">
              P0 Do Now · P1 Today · P2 Schedule · P3 Delegate
            </span>
          )}
        </div>

        {/* Crimson accent line */}
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${BRAND} 0%, #DC2626 40%, transparent 100%)` }}
        />
      </header>

      {/* ── Full Slide Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" />
                  <span className="text-sm font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
                    All Overdue Tasks
                  </span>
                  {overdueTasks.length > 0 && (
                    <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {overdueTasks.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {overdueTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full pb-16">
                    <p className="text-sm font-semibold text-stone-500">All caught up!</p>
                    <p className="text-xs text-stone-400 mt-1">No tasks pending over 1 hour</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {overdueTasks.map((task, i) => {
                      const hrs = Math.floor(
                        (new Date() - new Date(task.created_at?.replace?.('Z', '') ?? task.created_at)) / (1000 * 60 * 60)
                      );
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-5 py-4 hover:bg-stone-50 transition-colors cursor-pointer"
                          onClick={() => { handleEdit(task); setDrawerOpen(false); }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold text-stone-800 flex-1 leading-snug break-words min-w-0">
                              {task.title}
                            </span>
                            <span
                              className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                              style={{ background: '#F97316' }}
                            >
                              {hrs}h ago
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                              {PRIORITY_LABELS[task.priority] ?? `P${task.priority}`}
                            </span>
                            {task.customer_name && (
                              <span className="text-[10px] text-stone-400 font-medium">
                                {task.customer_name}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-[3px] h-[10px] rounded-sm" style={{ background: BRAND }} />
                  <p className="text-[10px] text-stone-400 font-medium tracking-widest uppercase">
                    Click a task to open and edit
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Masters panel */}
      <AnimatePresence>
        {masterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-stone-200 bg-stone-50"
          >
            <div className="p-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-bold text-stone-700 uppercase tracking-wider"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Master Data Management
                </h2>
                <button onClick={() => setMasterOpen(false)} className="p-1 rounded hover:bg-stone-200 text-stone-400">
                  <X size={15} />
                </button>
              </div>
              <MasterManager ibsLeads={ibsLeads} customers={customers} onUpdate={handleMasterUpdate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter indicator */}
      {(filters.priority !== null || filters.ibs_lead || filters.customer || filters.function_type || filters.financial_impact) && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: BRAND }}>Filtered view</span>
          <span className="text-xs text-red-400">— showing {tasks.length} tasks</span>
          <button
            onClick={() => setFilters({ priority: null, ibs_lead: null, customer: null, function_type: null, financial_impact: null })}
            className="ml-auto text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: BRAND }}
          >
            <X size={11} /> Clear
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: BRAND }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-screen-xl mx-auto"
            >
              {viewMode === 'kanban' ? (
                <Matrix tasks={tasks} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onEdit={handleEdit} />
              ) : (
                <EisenhowerMatrix tasks={tasks} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} onEdit={handleEdit} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* FAB — crimson */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => { setEditTask(null); setAddOpen(true); }}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white"
        style={{ background: BRAND, boxShadow: `0 8px 24px rgba(185,28,28,0.35)` }}
        title="Add task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      <AddModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditTask(null); }}
        onSaved={handleTaskSaved}
        ibsLeads={ibsLeads}
        customers={customers}
        editTask={editTask}
      />
    </div>
  );
}