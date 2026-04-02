import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Check, Building, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

function MasterSection({ title, icon: Icon, items, onAdd, onEdit, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInternal, setNewInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        name: newName.trim(),
        ...(title === 'IBS Leads' ? { email: newEmail.trim() } : {}),
        ...(title === 'Customers' ? { is_internal: newInternal } : {})
      });
      setNewName('');
      setNewEmail('');
      setNewInternal(false);
      setAdding(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally {
      setSaving(false);
    }
  }
  console.log("Ibs items", items)
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-500" />
          <h3 className="font-bold text-slate-800">{title}</h3>
          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <button onClick={() => setAdding(a => !a)} className="btn-ghost flex items-center gap-1 text-sm font-semibold">
          <Plus size={14} /> Add
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2 items-end p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Enter name…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />

                {title === 'IBS Leads' && (
                  <input
                    type="email"
                    className="input-field text-sm"
                    placeholder="Enter email…"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                )}
              </div>
              {title === 'Customers' && (
                <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer whitespace-nowrap pb-3 font-medium">
                  <input type="checkbox" checked={newInternal} onChange={e => setNewInternal(e.target.checked)} className="rounded" />
                  Internal
                </label>
              )}
              <button onClick={handleAdd} disabled={saving} className="btn-primary px-3 py-2.5">
                {saving ? '…' : <Check size={14} />}
              </button>
              <button onClick={() => setAdding(false)} className="btn-ghost px-3 py-2.5">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {items.map(item => (
          <MasterItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} showInternal={title === 'Customers'} />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No entries yet</p>
        )}
      </div>
    </div>
  );
}

function MasterItem({ item, onEdit, onDelete, showInternal }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [isInternal, setIsInternal] = useState(item.is_internal);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState(item.email || '');
  async function save() {
    setSaving(true);
    try {
      await onEdit(item.id, {
        name: name.trim(),
        ...(item.email !== undefined ? { email: email.trim() } : {}),
        ...(showInternal ? { is_internal: isInternal } : {})
      });
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 group border border-transparent hover:border-slate-200 transition-all">
      {editing ? (
        <>
          <div className="flex-1 space-y-1">

            <input
              className="flex-1 bg-white text-sm text-slate-800 outline-none border-b-2 border-blue-500 pb-0.5"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
            />

            {item.email !== undefined && (
              <input
                className="w-full bg-white text-xs text-slate-600 outline-none border-b border-slate-300 pb-0.5"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
              />
            )}
          </div>
          {showInternal && (
            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer font-medium">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
              Int.
            </label>
          )}
          <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 p-1">
            <Check size={13} />
          </button>
          <button onClick={() => { setEditing(false); setName(item.name); }} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <div className={`text-sm font-medium ${item.active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
              {item.name}
            </div>

            {item.email && (
              <div className="text-xs text-slate-400">
                {item.email}
              </div>
            )}
          </div>
          {showInternal && item.is_internal && (
            <span className="text-xs text-teal-700 border border-teal-300 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">
              Internal
            </span>
          )}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-blue-600 p-1 transition-colors rounded">
              <Pencil size={12} />
            </button>
            <button
              onClick={() => { if (window.confirm('Delete this entry?')) onDelete(item.id); }}
              className="text-slate-400 hover:text-red-600 p-1 transition-colors rounded"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function MasterManager({ ibsLeads, customers, onUpdate }) {
  async function addLead({ name, email }) {
    const { data } = await api.post('/masters/ibs-leads', { name, email });
    onUpdate('leads', [...ibsLeads, data]);
    toast.success('Lead added');
  }
  async function editLead(id, patch) {
    const { data } = await api.patch(`/masters/ibs-leads/${id}`, patch);
    onUpdate('leads', ibsLeads.map(l => l.id === id ? data : l));
    toast.success('Updated');
  }
  async function deleteLead(id) {
    await api.delete(`/masters/ibs-leads/${id}`);
    onUpdate('leads', ibsLeads.map(l => l.id === id ? { ...l, active: false } : l));
    toast.success('Ibs Lead In-Active Successfully');
  }
  async function addCustomer({ name, is_internal }) {
    const { data } = await api.post('/masters/customers', { name, is_internal });
    onUpdate('customers', [...customers, data]);
    toast.success('Customer added');
  }
  async function editCustomer(id, patch) {
    const { data } = await api.patch(`/masters/customers/${id}`, patch);
    onUpdate('customers', customers.map(c => c.id === id ? data : c));
    toast.success('Updated');
  }
  async function deleteCustomer(id) {
    await api.delete(`/masters/customers/${id}`);
    onUpdate('customers', customers.filter(c => c.id !== id));
    toast.success('Deleted');
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MasterSection title="IBS Leads" icon={Users} items={ibsLeads} onAdd={addLead} onEdit={editLead} onDelete={deleteLead} />
      <MasterSection title="Customers" icon={Building} items={customers} onAdd={addCustomer} onEdit={editCustomer} onDelete={deleteCustomer} />
    </div>
  );
}
