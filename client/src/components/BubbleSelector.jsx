import { motion } from 'framer-motion';

export default function BubbleSelector({ label, options, selected, onSelect, disabled = false }) {
  return (
    <div className={disabled ? 'pointer-events-none' : ''}>
      <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.value)}
              whileTap={disabled ? {} : { scale: 0.93 }}
              className={`
                tap-target px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none
                ${isSelected
                  ? opt.selectedClass || 'bg-blue-800 border-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : disabled
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
