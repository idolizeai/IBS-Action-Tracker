import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PRIO_ACTIVE = {
  0: 'bg-red-600    text-white border-red-600',
  1: 'bg-orange-500 text-white border-orange-500',
  2: 'bg-amber-400  text-white border-amber-400',
  3: 'bg-blue-600   text-white border-blue-600',
  4: 'bg-slate-500  text-white border-slate-500',
};

const FUNCTIONS = ['HR','Admin','Lead','Sales','Solution','Proposal','Finance','Operations','Marketing','Technical'];

const FINANCIAL = [
  { value: 'very_high', label: '$$$ Very High' },
  { value: 'high',      label: '$$ High' },
  { value: 'moderate',  label: '$ Moderate' },
  { value: 'low',       label: 'Low' },
  { value: 'none',      label: 'No Impact' },
];

// Visual separator between filter groups
function Sep() {
  return <div className="flex-shrink-0 w-px h-5 bg-slate-300 mx-1 self-center" />;
}

export default function FilterBar({ active, onChange, ibsLeads, customers }) {
  const scrollRef = useRef(null);
  const scroll = dir => scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  function isActive(type, value) {
    if (type === 'all')             return !active.priority && !active.ibs_lead && !active.customer && !active.function_type && !active.financial_impact;
    if (type === 'priority')        return active.priority === value;
    if (type === 'ibs_lead')        return active.ibs_lead === value;
    if (type === 'customer')        return active.customer === value;
    if (type === 'function_type')   return active.function_type === value;
    if (type === 'financial_impact')return active.financial_impact === value;
    return false;
  }

  function handleClick(type, value) {
    const base = { priority: null, ibs_lead: null, customer: null, function_type: null, financial_impact: null };
    if (type === 'all') { onChange(base); return; }
    const current = active[type];
    onChange({ ...base, [type]: current === value ? null : value });
  }

  function chip(key, type, value, label, activeClass) {
    const on = isActive(type, value);
    return (
      <button
        key={key}
        onClick={() => handleClick(type, value)}
        className={`
          flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border
          transition-all duration-150 select-none tap-target whitespace-nowrap
          ${on
            ? activeClass || 'bg-blue-600 text-white border-blue-600'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 shadow-sm'
          }
        `}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-1">
      <button onClick={() => scroll(-1)} className="hidden md:flex flex-shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors">
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All */}
        {chip('all', 'all', null, 'All', 'bg-slate-800 text-white border-slate-800')}

        <Sep />

        {/* Priority */}
        {[0,1,2,3,4].map(p => chip(`prio_${p}`, 'priority', p,
          ['P0·Now','P1·Today','P2·Week','P3·Wknd','P4·TBD'][p],
          PRIO_ACTIVE[p]
        ))}

        <Sep />

        {/* Function */}
        {FUNCTIONS.map(f => chip(`fn_${f}`, 'function_type', f, f, 'bg-purple-600 text-white border-purple-600'))}

        <Sep />

        {/* IBS Lead */}
        {ibsLeads.filter(l => l.active).map(l =>
          chip(`lead_${l.id}`, 'ibs_lead', l.id, `👤 ${l.name}`, 'bg-indigo-600 text-white border-indigo-600')
        )}

        <Sep />

        {/* Customer */}
        {customers.filter(c => c.active).map(c =>
          chip(`cust_${c.id}`, 'customer', c.id, `🏢 ${c.name}`, 'bg-teal-600 text-white border-teal-600')
        )}

        <Sep />

        {/* Financial Impact */}
        {FINANCIAL.map(f => chip(`fi_${f.value}`, 'financial_impact', f.value, f.label, 'bg-orange-600 text-white border-orange-600'))}
      </div>

      <button onClick={() => scroll(1)} className="hidden md:flex flex-shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
