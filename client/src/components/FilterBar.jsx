import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const FUNCTIONS = [
  'HR','BAU','Solutions','Proposal','Admin',
  'Finance','Sales','Marketing','Training','Offerings','Misc'
];

const FINANCIAL = [
  { value: 'very_high', label: '$$$ Very High' },
  { value: 'high',      label: '$$ High' },
  { value: 'moderate',  label: '$ Moderate' },
  { value: 'low',       label: 'Low' },
  { value: 'none',      label: 'No Impact' },
];

const COMM_OPTS = [
  { value: 'email', label: '📧 Email' },
  { value: 'in_person', label: '🤝 In-Person' },
  { value: 'online', label: '💻 Online' },
  { value: 'chat', label: '💬 Chat' },
  { value: 'phone', label: '📞 Phone' },
  { value: 'none', label: 'None' },
];

// Reusable Dropdown
function Dropdown({ label, options, value, onChange, activeClass }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${open ? 'z-50' : 'z-10'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1
          ${(value !== null && value !== undefined)
            ? activeClass || "bg-blue-600 text-white border-blue-600"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
          }`}
      >
        {selected ? `${label}: ${selected.label}` : label}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute mt-2 bg-white border rounded-lg shadow-lg z-50 min-w-[200px] max-h-64 overflow-y-auto">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value === value ? null : opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100
                ${value === opt.value ? "bg-slate-100 font-semibold" : ""}
              `}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ active, onChange, ibsLeads, customers }) {

  const isAll =
    !active.priority &&
    !active.ibs_lead &&
    !active.customer &&
    !active.function_type &&
    !active.financial_impact &&
    !active.comm_mode;

  const update = (key, value) => {
    onChange({
      ...active,
      [key]: active[key] === value ? null : value
    });
  };

  const clearAll = () => {
    onChange({
      priority: null,
      ibs_lead: null,
      customer: null,
      function_type: null,
      financial_impact: null,
      comm_mode: null
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* All */}
      <button
        onClick={clearAll}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border
          ${isAll
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
          }`}
      >
        All
      </button>

      <div className="h-5 w-px bg-slate-300" />

      {/* Priority */}
      <Dropdown
        label="Priority"
        value={active.priority}
        onChange={(v) => update("priority", v)}
        activeClass="bg-red-600 text-white border-red-600"
        options={[
          { value: 0, label: "P0 · Now" },
          { value: 1, label: "P1 · Today" },
          { value: 2, label: "P2 · Week" },
          { value: 3, label: "P3 · Weekend" },
          { value: 4, label: "P4 · TBD" },
        ]}
      />

      {/* Function */}
      <Dropdown
        label="Function"
        value={active.function_type}
        onChange={(v) => update("function_type", v)}
        activeClass="bg-purple-600 text-white border-purple-600"
        options={FUNCTIONS.map(f => ({ value: f, label: f }))}
      />

      {/* IBS Lead */}
      <Dropdown
        label="IBS Lead"
        value={active.ibs_lead}
        onChange={(v) => update("ibs_lead", v)}
        activeClass="bg-indigo-600 text-white border-indigo-600"
        options={ibsLeads
          .filter(l => l.active)
          .map(l => ({
            value: l.id,
            label: `👤 ${l.name}`
          }))
        }
      />

      {/* Customer */}
      <Dropdown
        label="Customer"
        value={active.customer}
        onChange={(v) => update("customer", v)}
        activeClass="bg-teal-600 text-white border-teal-600"
        options={customers
          .filter(c => c.active)
          .map(c => ({
            value: c.id,
            label: `🏢 ${c.name}`
          }))
        }
      />

      {/* Financial */}
      <Dropdown
        label="Fin Impact"
        value={active.financial_impact}
        onChange={(v) => update("financial_impact", v)}
        activeClass="bg-orange-600 text-white border-orange-600"
        options={FINANCIAL}
      />

      {/* Communication */}
      <Dropdown
        label="Communication"
        value={active.comm_mode}
        onChange={(v) => update("comm_mode", v)}
        activeClass="bg-emerald-600 text-white border-emerald-600"
        options={COMM_OPTS}
      />

    </div>
  );
}