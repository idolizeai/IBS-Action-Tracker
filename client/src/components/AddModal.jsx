import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import BubbleSelector from './BubbleSelector';
import { useSpeech } from '../hooks/useSpeech';

const FUNCTIONS = ['HR', 'Admin', 'Lead', 'Sales', 'Solution', 'Proposal', 'Finance', 'Operations', 'Marketing', 'Technical'];

const PRIORITY_OPTS = [
  { value: 0, label: 'P0 · Now',       selectedClass: 'bg-red-600    border-red-600    text-white shadow-sm shadow-red-500/30' },
  { value: 1, label: 'P1 · Today',     selectedClass: 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30' },
  { value: 2, label: 'P2 · This week', selectedClass: 'bg-amber-400  border-amber-400  text-white shadow-sm shadow-amber-400/30' },
  { value: 3, label: 'P3 · Weekend',   selectedClass: 'bg-blue-600   border-blue-600   text-white shadow-sm shadow-blue-500/30' },
  { value: 4, label: 'P4 · TBD',       selectedClass: 'bg-slate-500  border-slate-500  text-white shadow-sm' },
];

const FINANCIAL_OPTS = [
  { value: 'very_high', label: 'Very High', selectedClass: 'bg-red-600    border-red-600    text-white shadow-sm' },
  { value: 'high',      label: 'High',      selectedClass: 'bg-orange-500 border-orange-500 text-white shadow-sm' },
  { value: 'moderate',  label: 'Moderate',  selectedClass: 'bg-amber-400  border-amber-400  text-white shadow-sm' },
  { value: 'low',       label: 'Low',       selectedClass: 'bg-green-600  border-green-600  text-white shadow-sm' },
  { value: 'none',      label: 'None',      selectedClass: 'bg-slate-400  border-slate-400  text-white shadow-sm' },
];

const COMM_OPTS = [
  { value: 'email',          label: 'Email' },
  { value: 'in_person',      label: 'In-Person' },
  { value: 'remote_meeting', label: 'Remote Meeting' },
  { value: 'chat',           label: 'Chat' },
  { value: 'phone',          label: 'Phone' },
  { value: 'none',           label: 'None' },
];

const EMPTY = {
  title: '',
  priority: null,
  function_type: null,
  ibs_lead_id: null,
  customer_id: null,
  financial_impact: null,
  comm_mode: null,
};

export default function AddModal({ open, onClose, onSaved, ibsLeads, customers, editTask }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTask) {
      setForm({
        title:            editTask.title,
        priority:         editTask.priority,
        function_type:    editTask.function_type,
        ibs_lead_id:      editTask.ibs_lead_id,
        customer_id:      editTask.customer_id,
        financial_impact: editTask.financial_impact,
        comm_mode:        editTask.comm_mode,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editTask, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSpeechResult = useCallback(text => {
    setForm(f => ({ ...f, title: (f.title ? f.title + ' ' : '') + text }));
  }, []);
  const { listening, toggle: toggleMic, supported: micSupported } = useSpeech(handleSpeechResult);

  const isComplete = form.priority !== null &&
    form.function_type && form.ibs_lead_id && form.customer_id &&
    form.financial_impact && form.comm_mode && form.title.trim().length > 0;

  const filled = [
    form.title.trim().length > 0,
    form.priority !== null,
    !!form.function_type,
    !!form.ibs_lead_id,
    !!form.customer_id,
    !!form.financial_impact,
    !!form.comm_mode,
  ];
  const filledCount = filled.filter(Boolean).length;

  async function handleSave() {
    if (!isComplete) return;
    setSaving(true);
    try {
      if (editTask) {
        const { data } = await api.patch(`/tasks/${editTask.id}`, form);
        onSaved(data, 'edit');
        toast.success('Task updated');
      } else {
        const { data } = await api.post('/tasks', form);
        onSaved(data, 'add');
        toast.success('Task added');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const functionOpts  = FUNCTIONS.map(f => ({ value: f, label: f }));
  const ibsOpts       = ibsLeads.filter(l => l.active).map(l => ({ value: l.id, label: l.name }));
  const customerOpts  = customers.filter(c => c.active).map(c => ({
    value: c.id,
    label: c.is_internal ? `${c.name} (Internal)` : c.name,
  }));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh]
                       md:inset-0 md:flex md:items-center md:justify-center md:p-4"
          >
            <div className="
              bg-white w-full overflow-y-auto shadow-2xl
              rounded-t-2xl md:rounded-2xl
              md:max-w-lg md:max-h-[88vh]
              flex flex-col border border-slate-200
            ">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editTask ? 'Edit Task' : 'New Action Item'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filledCount}/7 fields completed
                  </p>
                </div>
                <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Title + mic */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                    What needs to be done?
                  </label>
                  <div className="relative">
                    <textarea
                      className="input-field pr-12 resize-none"
                      rows={2}
                      placeholder="Type your action item…"
                      value={form.title}
                      onChange={e => set('title', e.target.value)}
                      autoFocus={!editTask}
                    />
                    {micSupported && (
                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all duration-150 ${
                          listening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={listening ? 'Stop recording' : 'Speak to type'}
                      >
                        {listening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  {listening && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                      Listening…
                    </p>
                  )}
                </div>

                <BubbleSelector label="Priority"           options={PRIORITY_OPTS}  selected={form.priority}         onSelect={v => set('priority', v)} />
                <BubbleSelector label="Function"           options={functionOpts}   selected={form.function_type}    onSelect={v => set('function_type', v)} />
                <BubbleSelector label="IBS Lead"           options={ibsOpts}        selected={form.ibs_lead_id}      onSelect={v => set('ibs_lead_id', v)} />
                <BubbleSelector label="Customer"           options={customerOpts}   selected={form.customer_id}      onSelect={v => set('customer_id', v)} />
                <BubbleSelector label="Financial Impact"   options={FINANCIAL_OPTS} selected={form.financial_impact} onSelect={v => set('financial_impact', v)} />
                <BubbleSelector label="Communication Mode" options={COMM_OPTS}      selected={form.comm_mode}        onSelect={v => set('comm_mode', v)} />
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
                {/* Progress bar */}
                <div className="flex gap-1 mb-3">
                  {filled.map((done, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        done ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSave}
                  disabled={!isComplete || saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : <Save size={16} />}
                  {saving ? 'Saving…' : isComplete ? (editTask ? 'Update Task' : 'Save Task') : `${7 - filledCount} field${7 - filledCount !== 1 ? 's' : ''} remaining`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
