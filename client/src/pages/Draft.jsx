import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AddModal from '../components/AddModal';

export default function DraftsPage() {
  const navigate = useNavigate();

  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [ibsLeads, setIbsLeads] = useState([]);
  const [customers, setCustomers] = useState([]);

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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
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

                      {/* Missing fields */}
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

                    {/* Edit */}
                    <button
                      onClick={() => setEditTask(task)}
                      className="flex-shrink-0 text-slate-400 hover:text-blue-600 
                                 transition-colors p-1 rounded-lg hover:bg-blue-50"
                    >
                      <SlidersHorizontal size={16} />
                    </button>

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
      />
    </div>
  );
}