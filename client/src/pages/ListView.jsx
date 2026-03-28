import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckSquare, Square, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AddModal from '../components/AddModal';

const PRIO_LABEL = { 0: 'P0 · Do Now', 1: 'P1 · Today', 2: 'P2 · This Week', 3: 'P3 · Weekend', 4: 'P4 · TBD' };
const PRIO_CLS   = {
  0: 'bg-red-100    text-red-700    border-red-300',
  1: 'bg-orange-100 text-orange-700 border-orange-300',
  2: 'bg-amber-100  text-amber-700  border-amber-300',
  3: 'bg-blue-100   text-blue-700   border-blue-300',
  4: 'bg-slate-100  text-slate-600  border-slate-300',
};
const PRIO_HEADER = {
  0: 'text-red-700',
  1: 'text-orange-700',
  2: 'text-amber-700',
  3: 'text-blue-700',
  4: 'text-slate-600',
};

const FINANCIAL_LABELS = { very_high: 'Very High $$$', high: 'High $$', moderate: 'Moderate', low: 'Low', none: 'No Impact' };
const COMM_LABELS = { email: 'Email', in_person: 'In-Person', remote_meeting: 'Remote', chat: 'Chat', phone: 'Phone', none: 'None' };

export default function ListView() {
  const navigate = useNavigate();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showDone, setShowDone]   = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [ibsLeads, setIbsLeads]   = useState([]);
  const [customers, setCustomers] = useState([]);

  const fetchTasks = useCallback(async () => {
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
    Promise.all([api.get('/masters/ibs-leads'), api.get('/masters/customers')]).then(
      ([leads, custs]) => { setIbsLeads(leads.data); setCustomers(custs.data); }
    );
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

  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">List View</h1>
            <p className="text-xs text-slate-400">{totalCount} {showDone ? 'completed' : 'active'} tasks</p>
          </div>
          <button
            onClick={() => setShowDone(d => !d)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              showDone
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
          >
            {showDone ? <CheckSquare size={14} /> : <Square size={14} />}
            Done
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">
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
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${PRIO_CLS[p]}`}>
                      {PRIO_LABEL[p]}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{byPriority[p].length} item{byPriority[p].length !== 1 ? 's' : ''}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {byPriority[p].map(task => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 6 }}
                          className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${task.done ? 'opacity-55' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Done toggle */}
                            <button
                              onClick={() => toggleDone(task)}
                              className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shadow-sm
                                ${task.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400 bg-white'}`}
                            >
                              {task.done && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                                  <polyline points="2,6 5,9 10,3" />
                                </svg>
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-snug ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {task.title}
                              </p>

                              {/* Meta chips */}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                                  {task.function_type}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                  {task.ibs_lead_name}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 font-medium">
                                  {task.customer_name}
                                </span>
                                {task.financial_impact !== 'none' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium">
                                    {FINANCIAL_LABELS[task.financial_impact]}
                                  </span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  {COMM_LABELS[task.comm_mode]}
                                </span>
                              </div>
                            </div>

                            {/* Edit */}
                            <button
                              onClick={() => setEditTask(task)}
                              className="flex-shrink-0 text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                            >
                              <SlidersHorizontal size={14} />
                            </button>
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
