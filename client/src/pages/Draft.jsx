import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, AlertTriangle, PencilIcon, MoreVertical, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AddModal from '../components/AddModal';
import { useAuth } from '../context/AuthContext';

const PRIORITY_LABELS = {
  0: 'P0 · Do Now',
  1: 'P1 · Do Today',
  2: 'P2 · This Week',
  3: 'P3 · Weekend',
  4: 'P4 · TBD',
};

const PRIORITY_COLORS = {
  0: 'bg-red-100 text-red-700 border-red-200',
  1: 'bg-orange-100 text-orange-700 border-orange-200',
  2: 'bg-amber-100 text-amber-700 border-amber-200',
  3: 'bg-blue-100 text-blue-700 border-blue-200',
  4: 'bg-slate-100 text-slate-600 border-slate-200',
};

const FINANCIAL_LABELS = {
  very_high: 'Very High $$$',
  high: 'High $$',
  moderate: 'Moderate $',
  low: 'Low $',
  none: 'No Impact',
};

const FINANCIAL_COLORS = {
  very_high: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
  none: 'bg-slate-100 text-slate-600 border-slate-200',
};

const COMM_LABELS = {
  email: 'Email',
  in_person: 'In-Person',
  remote_meeting: 'Remote',
  chat: 'Chat',
  phone: 'Phone',
  none: 'None',
};

const COMM_COLORS = 'bg-teal-100 text-teal-700 border-teal-200';

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [ibsLeads, setIbsLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [discardTask, setDiscardTask] = useState(null);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks', {
        params: { is_draft: true }
      });
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

  function onSaved(data) {
    setEditTask(null);
    // Refetch drafts to ensure list is in sync with server
    fetchDrafts();
  }

  async function handleDiscard() {
    if (!discardTask) return;
    setIsDiscarding(true);
    try {
      await api.delete(`/tasks/${discardTask.id}`);
      toast.success('Draft discarded');
      setDiscardTask(null);
      fetchDrafts();
    } catch {
      toast.error('Failed to discard draft');
    } finally {
      setIsDiscarding(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">Drafts</h1>
            <p className="text-xs text-slate-400">
              {tasks.length} draft{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500 font-medium">No drafts found</p>
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
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {task.title}
                      </p>

                      {/* Badges - Fields that are filled */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.priority !== null && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        )}
                        {task.function_type && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium whitespace-nowrap">
                            {task.function_type}
                          </span>
                        )}
                        {task.ibs_lead_name && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium truncate max-w-[100px] sm:max-w-none">
                            {task.ibs_lead_name}
                          </span>
                        )}
                        {task.customer_name && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium truncate max-w-[100px] sm:max-w-none">
                            {task.customer_name}
                          </span>
                        )}
                        {task.financial_impact && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${FINANCIAL_COLORS[task.financial_impact]}`}>
                            {FINANCIAL_LABELS[task.financial_impact]}
                          </span>
                        )}
                        {task.comm_mode && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${COMM_COLORS}`}>
                            {COMM_LABELS[task.comm_mode]}
                          </span>
                        )}
                      </div>

                      {/* Missing fields - shown in red */}
                      {task.missing?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.missing.map((m, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full 
                                         bg-red-50 text-red-600 border border-red-200 font-medium"
                            >
                              <AlertTriangle size={10} />
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Three Dots Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === task.id ? null : task.id);
                        }}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 
                                   transition-colors p-1 rounded-lg hover:bg-slate-50"
                      >
                        <MoreVertical size={18} />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === task.id && (
                          <>
                            {/* Backdrop to close menu */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActiveMenuId(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 
                                         rounded-xl shadow-xl z-50 overflow-hidden"
                            >
                              <button
                                onClick={() => {
                                  setEditTask(task);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 
                                           hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <PencilIcon size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDiscardTask(task);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 
                                           hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                                Discard
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <AddModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSaved={onSaved}
        ibsLeads={ibsLeads}
        customers={customers}
        editTask={editTask}
        isCollaboratorTask={user && editTask && editTask.user_id !== user.id}
      />

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {discardTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDiscardTask(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                  Discard Draft?
                </h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  Are you sure you want to discard this draft? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDiscardTask(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold 
                               text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDiscard}
                    disabled={isDiscarding}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold 
                               hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {isDiscarding ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Discard'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}