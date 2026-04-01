import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, ChevronDown, Zap, DollarSign, User, Building2, MessageSquare, Layers } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const FINANCIAL_LABELS = {
  very_high: 'Very High $$$',
  high: 'High $$',
  moderate: 'Moderate',
  low: 'Low',
  none: 'No Impact',
};

const FINANCIAL_STYLES = {
  very_high: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300/50',
  high:      'bg-orange-50 text-orange-700 border-orange-200',
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

const COMM_STYLES = {
  email:          'bg-sky-50 text-sky-700 border-sky-200',
  in_person:      'bg-violet-50 text-violet-700 border-violet-200',
  remote_meeting: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  chat:           'bg-teal-50 text-teal-700 border-teal-200',
  phone:          'bg-lime-50 text-lime-700 border-lime-200',
  none:           'bg-slate-50 text-slate-500 border-slate-200',
};

// Priority accent: left border + subtle glow strip
const PRIO_CONFIG = {
  0: { border: 'border-l-red-500',   glow: 'from-red-500/10',   dot: 'bg-red-500'   },
  1: { border: 'border-l-orange-400', glow: 'from-orange-400/10', dot: 'bg-orange-400' },
  2: { border: 'border-l-amber-400',  glow: 'from-amber-400/8',  dot: 'bg-amber-400'  },
  3: { border: 'border-l-blue-500',   glow: 'from-blue-500/8',   dot: 'bg-blue-500'   },
  4: { border: 'border-l-slate-300',  glow: 'from-slate-300/5',  dot: 'bg-slate-300'  },
};

export default function TaskCard({ task, onUpdated, onDeleted, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling]  = useState(false);
  const [deleting, setDeleting]  = useState(false);

  const prio = PRIO_CONFIG[task.priority] ?? PRIO_CONFIG[4];

  async function toggleDone() {
    setToggling(true);
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { done: !task.done });
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative group overflow-hidden
        bg-white border border-slate-200/80 rounded-xl border-l-[3px] ${prio.border}
        shadow-sm hover:shadow-md hover:-translate-y-[1px]
        transition-all duration-200
        ${task.done ? 'opacity-55' : ''}
      `}
    >
      {/* Subtle priority glow strip */}
      <div className={`absolute inset-y-0 left-0 w-12 bg-gradient-to-r ${prio.glow} to-transparent pointer-events-none`} />

      {/* ── Main Row ── */}
      <div className="relative px-3 pt-3 pb-2.5">
        <div className="flex items-start gap-2.5">

          {/* Checkbox */}
          <button
            onClick={toggleDone}
            disabled={toggling}
            className={`
              flex-shrink-0 mt-[1px] w-[18px] h-[18px] rounded-full border-2
              flex items-center justify-center transition-all duration-150
              ${task.done
                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                : 'border-slate-300 hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] bg-white'
              }
            `}
          >
            {task.done && <Check size={9} strokeWidth={3.5} className="text-white" />}
          </button>

          {/* Title */}
          <p className={`
            flex-1 text-[13px] leading-[1.4] tracking-[-0.01em]
            ${task.done ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'}
          `}>
            {task.title}
          </p>

          {/* Expand chevron */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5 p-0.5 rounded hover:bg-slate-100"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} strokeWidth={2.5} />
            </motion.div>
          </button>
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap gap-1.5 mt-2 ml-[26px]">
          {/* IBS Lead */}
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium leading-none">
            <User size={9} strokeWidth={2.5} className="opacity-60" />
            {task.ibs_lead_name}
          </span>

          {/* Customer */}
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium leading-none">
            <Building2 size={9} strokeWidth={2.5} className="opacity-60" />
            {task.customer_name}
          </span>

          {/* Financial impact — only if not none */}
          {task.financial_impact !== 'none' && (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold leading-none ${FINANCIAL_STYLES[task.financial_impact]}`}>
              <DollarSign size={9} strokeWidth={2.5} />
              {FINANCIAL_LABELS[task.financial_impact]}
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded Section ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="relative px-3 pb-2.5 pt-2 border-t border-slate-100">
              {/* Secondary badges */}
              <div className="flex flex-wrap gap-1.5 ml-[26px] mb-2.5">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium leading-none">
                  <Layers size={9} strokeWidth={2.5} />
                  {task.function_type}
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium leading-none ${COMM_STYLES[task.comm_mode] ?? COMM_STYLES.none}`}>
                  <MessageSquare size={9} strokeWidth={2.5} />
                  {COMM_LABELS[task.comm_mode]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 ml-[22px]">
                <button
                  onClick={() => onEdit(task)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-all duration-150"
                >
                  <Pencil size={10} strokeWidth={2.5} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 py-1 px-2.5 rounded-lg hover:bg-red-50 transition-all duration-150 disabled:opacity-50"
                >
                  <Trash2 size={10} strokeWidth={2.5} />
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}