import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const FINANCIAL_LABELS = {
  very_high: 'Very High $$$',
  high: 'High $$',
  moderate: 'Moderate',
  low: 'Low',
  none: 'No Impact',
};

const COMM_LABELS = {
  email: 'Email',
  in_person: 'In-Person',
  remote_meeting: 'Remote',
  chat: 'Chat',
  phone: 'Phone',
  none: 'None',
};

const PRIO_BORDER = {
  0: 'border-l-red-500',
  1: 'border-l-orange-400',
  2: 'border-l-amber-400',
  3: 'border-l-blue-500',
  4: 'border-l-slate-400',
};

export default function TaskCard({ task, onUpdated, onDeleted, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleDone() {
    setToggling(true);
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, {
        done: !task.done,
      });
      onUpdated(data);
      toast.success(data.done ? 'Done ✓' : 'Reopened');
    } catch {
      toast.error('Failed to update');
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white border border-slate-200 rounded-xl border-l-4 ${PRIO_BORDER[task.priority]}
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${task.done ? 'opacity-50' : ''}
      `}
    >
      {/* Main row */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Checkbox */}
          <button
            onClick={toggleDone}
            disabled={toggling}
            className={`
              flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
              transition-all duration-150 shadow-sm
              ${
                task.done
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-300 hover:border-green-400 bg-white'
              }
            `}
          >
            {task.done && (
              <Check size={10} strokeWidth={3} className="text-white" />
            )}
          </button>

          {/* Title */}
          <p
            className={`flex-1 text-sm leading-snug ${
              task.done
                ? 'line-through text-slate-400'
                : 'text-slate-800 font-medium'
            }`}
          >
            {task.title}
          </p>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} />
            </motion.div>
          </button>
        </div>

        {/* Quick badges */}
        <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            {task.ibs_lead_name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            {task.customer_name}
          </span>
          {task.financial_impact !== 'none' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium">
              {FINANCIAL_LABELS[task.financial_impact]}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
            className="px-3 pb-3 border-t border-slate-100 pt-2.5"
          >
            <div className="flex flex-wrap gap-1.5 ml-7 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                {task.function_type}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 font-medium">
                {COMM_LABELS[task.comm_mode]}
              </span>
            </div>

            <div className="flex items-center gap-1 ml-7">
              <button
                onClick={() => onEdit(task)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50 font-medium"
              >
                <Pencil size={11} /> Edit
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50 font-medium"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}