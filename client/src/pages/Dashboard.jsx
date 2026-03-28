import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, LogOut, Settings, X, RefreshCw, LayoutGrid, Grid2X2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Matrix from '../components/Matrix';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import FilterBar from '../components/FilterBar';
import AddModal from '../components/AddModal';
import MasterManager from '../components/MasterManager';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks]           = useState([]);
  const [ibsLeads, setIbsLeads]     = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [addOpen, setAddOpen]       = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [masterOpen, setMasterOpen] = useState(false);
  const [viewMode, setViewMode]     = useState('kanban'); // 'kanban' | 'eisenhower'
  const [filters, setFilters]       = useState({ priority: null, ibs_lead: null, customer: null, function_type: null, financial_impact: null });

  useEffect(() => {
    Promise.all([api.get('/masters/ibs-leads'), api.get('/masters/customers')]).then(
      ([leads, custs]) => { setIbsLeads(leads.data); setCustomers(custs.data); }
    ).catch(() => toast.error('Failed to load masters'));
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { done: false };
      if (filters.priority !== null)    params.priority         = filters.priority;
      if (filters.ibs_lead)             params.ibs_lead_id      = filters.ibs_lead;
      if (filters.customer)             params.customer_id      = filters.customer;
      if (filters.function_type)        params.function_type    = filters.function_type;
      if (filters.financial_impact)     params.financial_impact = filters.financial_impact;
      const { data } = await api.get('/tasks', { params });
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function handleTaskSaved(data, mode) {
    if (mode === 'add')        setTasks(ts => [data, ...ts]);
    else if (mode === 'edit')  setTasks(ts => ts.map(t => t.id === data.id ? data : t));
    setEditTask(null);
  }

  function handleTaskUpdated(data) {
    if (data.done) setTasks(ts => ts.filter(t => t.id !== data.id));
    else           setTasks(ts => ts.map(t => t.id === data.id ? data : t));
  }

  function handleTaskDeleted(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
  }

  function handleEdit(task) {
    setEditTask(task);
    setAddOpen(true);
  }

  function handleMasterUpdate(type, newList) {
    if (type === 'leads')     setIbsLeads(newList);
    if (type === 'customers') setCustomers(newList);
  }

  const p0Count = tasks.filter(t => t.priority === 0).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 hidden sm:block text-sm">IBS Actions</span>
          </div>

          {/* P0 alert */}
          {p0Count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full shadow-sm"
            >
              {p0Count} urgent
            </motion.span>
          )}

          <div className="flex-1" />

          {/* User name */}
          <span className="text-sm text-slate-500 font-medium hidden sm:block">{user?.name}</span>

          {/* List view */}
          <button onClick={() => navigate('/list')} className="btn-ghost p-2" title="List View">
            <List size={17} />
          </button>

          {/* Refresh */}
          <button onClick={fetchTasks} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          {/* Masters (admin only) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setMasterOpen(o => !o)}
              className={`btn-ghost p-2 ${masterOpen ? 'text-blue-600 bg-blue-50' : ''}`}
              title="Manage Masters"
            >
              <Settings size={17} />
            </button>
          )}

          {/* Logout */}
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-ghost p-2 hover:text-red-600 hover:bg-red-50" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 pb-2">
          <FilterBar active={filters} onChange={setFilters} ibsLeads={ibsLeads} customers={customers} />
        </div>

        {/* ── View toggle — below filter chips, easy to tap ── */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
              viewMode === 'kanban'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <LayoutGrid size={13} />
            Priority View
          </button>

          <button
            onClick={() => setViewMode('eisenhower')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
              viewMode === 'eisenhower'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <Grid2X2 size={13} />
            Eisenhower Matrix
          </button>

          {viewMode === 'eisenhower' && (
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium ml-1">
              P0 Do Now · P1 Today · P2 Schedule · P3 Delegate
            </span>
          )}
        </div>
      </header>

      {/* ── Masters panel ── */}
      <AnimatePresence>
        {masterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-slate-200 bg-slate-50"
          >
            <div className="p-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Master Data Management</h2>
                <button onClick={() => setMasterOpen(false)} className="btn-ghost p-1">
                  <X size={15} />
                </button>
              </div>
              <MasterManager ibsLeads={ibsLeads} customers={customers} onUpdate={handleMasterUpdate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active filter indicator ── */}
      {(filters.priority !== null || filters.ibs_lead || filters.customer || filters.function_type || filters.financial_impact) && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-700">Filtered view</span>
          <span className="text-xs text-blue-500">— showing {tasks.length} tasks</span>
          <button
            onClick={() => setFilters({ priority: null, ibs_lead: null, customer: null, function_type: null, financial_impact: null })}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <X size={11} /> Clear
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24">
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
                <Matrix
                  tasks={tasks}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                  onEdit={handleEdit}
                />
              ) : (
                <EisenhowerMatrix
                  tasks={tasks}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                  onEdit={handleEdit}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── FAB ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => { setEditTask(null); setAddOpen(true); }}
        className="fixed bottom-6 right-6 z-20
                   w-14 h-14 rounded-full
                   bg-blue-600 hover:bg-blue-700
                   shadow-xl shadow-blue-600/30
                   flex items-center justify-center text-white"
        title="Add task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {/* ── Add / Edit Modal ── */}
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
