import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, SlidersHorizontal, Clock, CheckCheck, Square, User } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import AddModal from '../components/AddModal';
import { useAuth } from '../context/AuthContext';

const PRIO_LABEL = { 0: 'P0 · Do Now', 1: 'P1 · Today', 2: 'P2 · This Week', 3: 'P3 · Weekend', 4: 'P4 · TBD' };
const PRIO_CLS = {
  0: 'bg-red-100    text-red-700    border-red-300',
  1: 'bg-orange-100 text-orange-700 border-orange-300',
  2: 'bg-amber-100  text-amber-700  border-amber-300',
  3: 'bg-blue-100   text-blue-700   border-blue-300',
  4: 'bg-slate-100  text-slate-600  border-slate-300',
};

const FINANCIAL_LABELS = { very_high: 'Very High $$$', high: 'High $$', moderate: 'Moderate', low: 'Low', none: 'No Impact' };
const COMM_LABELS = { email: 'Email', in_person: 'In-Person', remote_meeting: 'Remote', chat: 'Chat', phone: 'Phone', none: 'None' };

const PRIO_DOT = {
  0: 'bg-red-500',
  1: 'bg-orange-500',
  2: 'bg-amber-400',
  3: 'bg-blue-500',
  4: 'bg-slate-400',
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function groupByPeriod(tasks) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday - 86400000);
  const startOfWeek = new Date(startOfToday - 6 * 86400000);

  const groups = [
    { key: 'today', label: 'Today', tasks: [] },
    { key: 'yesterday', label: 'Yesterday', tasks: [] },
    { key: 'week', label: 'This Week', tasks: [] },
    { key: 'earlier', label: 'Earlier', tasks: [] },
  ];

  for (const t of tasks) {
    const d = t.done_at ? new Date(t.done_at) : new Date(0);
    if (d >= startOfToday) groups[0].tasks.push(t);
    else if (d >= startOfYesterday) groups[1].tasks.push(t);
    else if (d >= startOfWeek) groups[2].tasks.push(t);
    else groups[3].tasks.push(t);
  }

  return groups.filter(g => g.tasks.length > 0);
}

export default function ListView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [ibsLeads, setIbsLeads] = useState([]);
  const [customers, setCustomers] = useState([]);

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

  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverPrio, setDragOverPrio] = useState(null);

  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggedTask(null);
    setDragOverPrio(null);
  }

  async function handleDrop(e, newPriority) {
    e.preventDefault();
    setDragOverPrio(null);
    if (!draggedTask || draggedTask.priority === newPriority) {
      setDraggedTask(null);
      return;
    }
    try {
      const { data } = await api.patch(`/tasks/${draggedTask.id}`, { priority: newPriority });
      setTasks(ts => ts.map(t => t.id === data.id ? data : t));
      toast.success(`Moved to ${PRIO_LABEL[newPriority]}`);
    } catch (e) {
      toast.error(e.response.data.error || 'Failed to update priority');
    } finally {
      setDraggedTask(null);
    }
  }

  const byPriority = [0, 1, 2, 3, 4].reduce((acc, p) => {
    acc[p] = tasks.filter(t => t.priority === p);
    return acc;
  }, {});

  const doneGroups = showDone ? groupByPeriod(tasks) : [];

  return (
    <div className="min-h-screen bg-surface">
      {/* Shared Navbar */}
      <Navbar />

      {/* Page sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-base font-bold text-slate-900">
            {showDone ? 'Done Log' : 'Active Tasks'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {tasks.length} {showDone ? 'completed' : 'active'} tasks
          </p>
        </div>
        <button
          onClick={() => setShowDone(d => !d)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-semibold transition-all ${showDone
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
        >
          {showDone ? <CheckCheck size={14} /> : <Square size={14} />}
          {showDone ? 'Active' : 'Done'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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

        ) : showDone ? (
          /* ── Done Log View ── */
          <div className="space-y-8">
            {doneGroups.map(group => (
              <div key={group.key}>
                {/* Period header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-green-600" />
                    <span className="text-sm font-bold text-slate-700">{group.label}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{group.tasks.length} done</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {group.tasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {/* Done toggle */}
                          <button
                            onClick={() => toggleDone(task)}
                            className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center transition-all shadow-sm hover:bg-green-600"
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug line-through text-slate-400 break-words min-w-0">
                              {task.title}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {/* Priority dot + label */}
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIO_DOT[task.priority]}`} />
                                {PRIO_LABEL[task.priority]?.split(' · ')[0]}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                                {task.function_type}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-100 font-medium">
                                {task.customer_name}
                              </span>
                            </div>
                          </div>

                          {/* Relative time */}
                          <span className="flex-shrink-0 text-xs text-slate-400 font-medium whitespace-nowrap mt-0.5">
                            {relativeTime(task.done_at)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── Active Tasks — Priority Groups ── */
          <div className="space-y-6">
            {[0, 1, 2, 3, 4].map(p => {
              const isOver = dragOverPrio === p;
              return (
                <div
                  key={p}
                  onDragOver={e => { e.preventDefault(); setDragOverPrio(p); }}
                  onDragLeave={() => setDragOverPrio(null)}
                  onDrop={e => handleDrop(e, p)}
                  className={`rounded-2xl transition-all duration-150 ${isOver && draggedTask ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50' : ''}`}
                >
                  {/* Priority group header */}
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${PRIO_CLS[p]}`}>
                      {PRIO_LABEL[p]}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {byPriority[p].length} item{byPriority[p].length !== 1 ? 's' : ''}
                    </span>
                    {isOver && draggedTask && draggedTask.priority !== p && (
                      <span className="text-xs text-blue-600 font-semibold">Drop to move here</span>
                    )}
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {byPriority[p].map(task => {
                        const isCollaboratorTask = user && task.user_id !== user.id;
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            draggable
                            onDragStart={e => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${draggedTask?.id === task.id ? 'opacity-40 scale-95' : ''
                              } ${isCollaboratorTask ? 'border-slate-800 bg-slate-50/50 shadow-inner' : 'border-slate-200'}`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleDone(task)}
                                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-green-400 bg-white flex items-center justify-center transition-all shadow-sm"
                              />

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-snug text-slate-800 break-words min-w-0">
                                  {task.title}
                                </p>
                                {isCollaboratorTask && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <User size={10} className="text-slate-500" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                      Owner: {task.owner_name}
                                    </span>
                                  </div>
                                )}

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

                              <button
                                onClick={() => setEditTask(task)}
                                className="flex-shrink-0 text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                              >
                                <SlidersHorizontal size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Empty group placeholder — always visible so drag targets exist */}
                    {byPriority[p].length === 0 && (
                      <div className={`h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-150 ${isOver && draggedTask
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 bg-slate-50/50'
                        }`}>
                        <span className={`text-xs font-medium ${isOver && draggedTask ? 'text-blue-500' : 'text-slate-300'}`}>
                          {isOver && draggedTask ? 'Drop here' : 'Empty'}
                        </span>
                      </div>
                    )}
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
        isCollaboratorTask={user && editTask && editTask.user_id !== user.id}
      />
    </div>
  );
}
