import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Save, FileText } from 'lucide-react';
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

export default function AddModal({ open, onClose, onSaved, ibsLeads, customers, editTask, isCollaboratorTask = false }) {
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const debounceRef             = useRef(null);

  // On open: load draft from server (new task only) or load editTask values
  useEffect(() => {
    if (!open) return;
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
      setHasDraft(false);
    } else {
      api.get('/draft').then(({ data }) => {
        if (data && data.title) {
          setHasDraft(true);
          setForm(EMPTY);
        } else {
          setHasDraft(false);
          setForm(EMPTY);
        }
      }).catch(() => {
        setHasDraft(false);
        setForm(EMPTY);
      });
    }
  }, [open, editTask]);

  // Debounced auto-save to server (new tasks only, 800ms after last change)
  useEffect(() => {
    if (editTask || !open) return;
    const hasAnyData = form.title || form.priority !== null || form.function_type ||
                       form.ibs_lead_id || form.customer_id || form.financial_impact || form.comm_mode;
    if (!hasAnyData) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.put('/draft', form).catch(() => {}); // silent fail — draft is best-effort
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [form, editTask, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function resumeDraft() {

    api.get('/draft').then(({ data }) => {
      if (data) setForm(data);
      setHasDraft(false);
    }).catch(() => setHasDraft(false));
  }

  function dismissDraft() {
    api.delete('/draft').catch(() => {});
    setHasDraft(false);
    setForm(EMPTY);
  }

  const handleSpeechResult = useCallback(text => {
    setForm(f => ({ ...f, title: (f.title ? f.title + ' ' : '') + text }));
  }, []);

  const { 
    listening, 
    toggle: toggleMic, 
    supported: micSupported, 
    interimTranscript, 
    error: micError,
    isStarting 
  } = useSpeech(handleSpeechResult);

  // Show error toast immediately when it occurs
  useEffect(() => {
    if (micError) {
      toast.error(micError, { 
        duration: 6000, 
        icon: '🎤',
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    }
  }, [micError]);

  const isComplete = form.priority !== null &&
    form.function_type && form.ibs_lead_id && form.customer_id &&
    form.financial_impact && form.comm_mode && form.title.trim().length > 0;

  const canSaveDraft = form.title.trim().length > 0;

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

  // Show "Save as Draft" when: creating new task, OR editing an existing draft, OR editing but form is still incomplete
  const showDraftButton = !editTask || editTask?.is_draft || !isComplete;

  async function handleSave(asDraft = false) {
    if (asDraft) {
      if (!canSaveDraft) return;
    } else {
      if (!isComplete) return;
    }

    setSaving(true);
    try {
      // Always send is_draft: true when saving as draft, is_draft: false when saving fully
      const payload = { ...form, is_draft: asDraft };

      if (editTask) {
        const { data } = await api.patch(`/tasks/${editTask.id}`, payload);
        onSaved(data, 'edit');
        toast.success(asDraft ? 'Draft saved' : 'Task updated');
      } else {
        const { data } = await api.post('/tasks', payload);
        onSaved(data, 'add');
        toast.success(asDraft ? 'Draft saved' : 'Task added');
      }
      clearTimeout(debounceRef.current);
      api.delete('/draft').catch(() => {});
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
  bg-white w-full shadow-2xl
  rounded-t-2xl md:rounded-2xl
  md:max-w-lg
  flex flex-col border border-slate-200
  h-[85dvh] md:h-auto md:max-h-[88vh]
"
>

  
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editTask ? (isCollaboratorTask ? 'View Task' : 'Edit Task') : 'New Action Item'}
                  </h2>
                  {!isCollaboratorTask && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filledCount}/7 fields completed
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {/* Draft resume banner */}
              {hasDraft && (
                <div className="mx-5 mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-lg">📝</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-800">You have an unsaved draft</p>
                    <p className="text-xs text-amber-600">Resume where you left off?</p>
                  </div>
                  <button onClick={resumeDraft} className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
                    Resume
                  </button>
                  <button onClick={dismissDraft} className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex-shrink-0">
                    Discard
                  </button>
                </div>
              )}

              {/* Body */}
<div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-6">
                {/* Title + mic */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                    What needs to be done?
                  </label>
                  <div className="relative">
                    <textarea
                      className={`input-field pr-12 resize-none ${isCollaboratorTask ? 'bg-slate-50 cursor-default' : ''}`}
                      rows={2}
                      placeholder={isCollaboratorTask ? '' : 'Type your action item…'}
                      readOnly={isCollaboratorTask}
                      value={form.title}
                      onChange={e => set('title', e.target.value)}
                      autoFocus={!editTask && !isCollaboratorTask}
                    />
                    {micSupported && !isCollaboratorTask && (
                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all duration-150 ${
                          listening
                            ? 'bg-red-500 text-white animate-pulse'
                            : micError
                              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={listening ? 'Stop recording' : micError ? 'Error - click to retry' : 'Speak to type'}
                      >
                        {listening ? <MicOff size={16} /> : micError ? <Mic size={16} className="animate-bounce" /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  {listening && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                      <p className="text-xs text-red-500 flex items-center gap-1.5 font-semibold mb-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                        Listening… speak now
                      </p>
                      {interimTranscript ? (
                        <p className="text-sm text-slate-500 italic leading-snug">{interimTranscript}</p>
                      ) : (
                        <p className="text-xs text-slate-400">Words will appear here as you speak</p>
                      )}
                    </div>
                  )}
                </div>

                <BubbleSelector label="Priority"           options={PRIORITY_OPTS}  selected={form.priority}         onSelect={v => set('priority', v)}         disabled={isCollaboratorTask} />
                <BubbleSelector label="Function"           options={functionOpts}   selected={form.function_type}    onSelect={v => set('function_type', v)}    disabled={isCollaboratorTask} />
                <BubbleSelector label="IBS Lead"           options={ibsOpts}        selected={form.ibs_lead_id}      onSelect={v => set('ibs_lead_id', v)}      disabled={isCollaboratorTask} />
                <BubbleSelector label="Customer"           options={customerOpts}   selected={form.customer_id}      onSelect={v => set('customer_id', v)}      disabled={isCollaboratorTask} />
                <BubbleSelector label="Financial Impact"   options={FINANCIAL_OPTS} selected={form.financial_impact} onSelect={v => set('financial_impact', v)} disabled={isCollaboratorTask} />
                <BubbleSelector label="Communication Mode" options={COMM_OPTS}      selected={form.comm_mode}        onSelect={v => set('comm_mode', v)}        disabled={isCollaboratorTask} />
              </div>

              {/* Footer */}
              {!isCollaboratorTask && (
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl sticky bottom-0">                {/* Progress bar */}
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

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {/* Save as Draft — shown for new tasks, existing drafts, or incomplete edits */}
                    {showDraftButton && (
                      <button
                        onClick={() => handleSave(true)}
                        disabled={!canSaveDraft || saving}
                        className="btn-ghost flex-1 flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {saving ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : <FileText size={16} />}
                        <span>{saving ? 'Saving…' : 'Save as Draft'}</span>
                      </button>
                    )}

                    {/* Primary Save / Update Button */}
                    <button
                      onClick={() => handleSave(false)}
                      disabled={!isComplete || saving}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : <Save size={16} />}
                      {saving
                        ? 'Saving…'
                        : isComplete
                          ? (editTask ? 'Update & Save' : 'Save Task')
                          : `${7 - filledCount} field${7 - filledCount !== 1 ? 's' : ''} remaining`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
