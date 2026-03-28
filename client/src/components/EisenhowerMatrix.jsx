import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

// Priority → Eisenhower Quadrant mapping
// Q1: Urgent + Important   → P0 (Critical Now), P1 (Today)
// Q2: Not Urgent+Important → P2 (This Week)
// Q3: Urgent+Not Important → P3 (Weekend/Delegate)
// Q4: Not Urgent+Not Imp.  → P4 (TBD/Eliminate)

const QUADRANTS = [
  {
    id: 'q1',
    num: 'P0',
    label: 'Do Now',
    sublabel: 'Urgent · Important',
    action: 'ACT NOW',
    prios: [0],
    headerGrad: 'from-red-600 to-rose-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    numCls: 'bg-red-600 text-white',
    countCls: 'bg-red-100 text-red-700 border border-red-200',
    emptyIcon: '🎯',
    emptyText: 'text-red-400',
  },
  {
    id: 'q2',
    num: 'P1',
    label: 'Do Today',
    sublabel: 'Important · Less Urgent',
    action: 'TODAY',
    prios: [1],
    headerGrad: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    numCls: 'bg-orange-500 text-white',
    countCls: 'bg-orange-100 text-orange-700 border border-orange-200',
    emptyIcon: '📌',
    emptyText: 'text-orange-400',
  },
  {
    id: 'q3',
    num: 'P2',
    label: 'Schedule',
    sublabel: 'Important · Not Urgent',
    action: 'PLAN IT',
    prios: [2],
    headerGrad: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    numCls: 'bg-blue-600 text-white',
    countCls: 'bg-blue-100 text-blue-700 border border-blue-200',
    emptyIcon: '📅',
    emptyText: 'text-blue-400',
  },
  {
    id: 'q4',
    num: 'P3',
    label: 'Delegate',
    sublabel: 'Urgent · Not Important',
    action: 'HAND OFF',
    prios: [3],
    headerGrad: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    numCls: 'bg-amber-500 text-white',
    countCls: 'bg-amber-100 text-amber-700 border border-amber-200',
    emptyIcon: '👤',
    emptyText: 'text-amber-400',
  },
];

const PRIO_BADGE = {
  0: { label: 'P0 · Now',    cls: 'bg-red-600    text-white' },
  1: { label: 'P1 · Today',  cls: 'bg-orange-500 text-white' },
  2: { label: 'P2 · Week',   cls: 'bg-blue-600   text-white' },
  3: { label: 'P3 · Wknd',  cls: 'bg-amber-500  text-white' },
  4: { label: 'P4 · TBD',   cls: 'bg-slate-500  text-white' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

function QuadrantCell({ q, tasks, onUpdated, onDeleted, onEdit }) {
  const showPrioBadge = q.prios.length > 1;

  return (
    <div className={`flex flex-col rounded-2xl border-2 ${q.border} ${q.bg} overflow-hidden`}
         style={{ minHeight: 260 }}>

      {/* Header */}
      <div className={`bg-gradient-to-br ${q.headerGrad} px-4 py-3 flex-shrink-0`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black text-white/30 leading-none select-none">
              {q.num}
            </span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{q.label}</p>
              <p className="text-white/70 text-[11px] font-medium mt-0.5">{q.sublabel}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white`}>
              {q.action}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/25 text-white`}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-2xl mb-2 opacity-40">{q.emptyIcon}</span>
              <p className={`text-xs font-semibold ${q.emptyText}`}>All clear</p>
            </div>
          ) : (
            tasks.map(task => (
              <motion.div key={task.id} variants={cardVariants} initial="hidden" animate="show">
                {showPrioBadge && (
                  <div className="flex justify-end mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIO_BADGE[task.priority].cls}`}>
                      {PRIO_BADGE[task.priority].label}
                    </span>
                  </div>
                )}
                <TaskCard task={task} onUpdated={onUpdated} onDeleted={onDeleted} onEdit={onEdit} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function EisenhowerMatrix({ tasks, onUpdated, onDeleted, onEdit }) {
  const getTasksForQuadrant = (prios) => tasks.filter(t => prios.includes(t.priority));

  return (
    <>
      {/* ── Desktop 2×2 grid with axis labels ── */}
      <div className="hidden md:block">

        {/* Top axis */}
        <div className="flex items-center mb-3 pl-14">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-300" />
              <span className="flex items-center gap-1.5 text-xs font-black tracking-widest uppercase text-red-500 px-3 py-1 rounded-full bg-red-50 border border-red-200 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                More Urgent
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-300" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-300" />
              <span className="flex items-center gap-1.5 text-xs font-black tracking-widest uppercase text-slate-500 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Less Urgent
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-300" />
            </div>
          </div>
        </div>

        {/* Main grid with left axis */}
        <div className="flex gap-0">
          <div className="flex flex-col w-14 flex-shrink-0 gap-4">
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 260 }}>
              <div className="flex items-center gap-1.5 -rotate-90 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs font-black tracking-widest uppercase text-red-500">High Priority</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 260 }}>
              <div className="flex items-center gap-1.5 -rotate-90 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                <span className="text-xs font-black tracking-widest uppercase text-slate-500">Lower Priority</span>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
            {QUADRANTS.map(q => (
              <QuadrantCell
                key={q.id}
                q={q}
                tasks={getTasksForQuadrant(q.prios)}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>

        {/* Bottom legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pl-14">
          {QUADRANTS.map(q => (
            <div key={q.id} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.numCls}`}>{q.num}</span>
              <span className="text-xs text-slate-500 font-medium">{q.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: stacked sections ── */}
      <div className="md:hidden space-y-4 pb-24">
        {/* Urgency/Importance header */}
        <div className="flex gap-2 text-[10px] font-black tracking-widest">
          <span className="px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-200 uppercase">Urgent axis →</span>
          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-500 border border-blue-200 uppercase">Importance axis ↓</span>
        </div>

        {QUADRANTS.map(q => {
          const qtasks = getTasksForQuadrant(q.prios);
          return (
            <div key={q.id} className={`rounded-2xl border-2 ${q.border} ${q.bg} overflow-hidden`}>
              <div className={`bg-gradient-to-br ${q.headerGrad} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black text-white/30">{q.num}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{q.label}</p>
                    <p className="text-white/70 text-[11px]">{q.sublabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {q.action}
                  </span>
                  <span className="text-xs font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">
                    {qtasks.length}
                  </span>
                </div>
              </div>
              {qtasks.length > 0 ? (
                <div className="p-3 space-y-2">
                  {qtasks.map(task => (
                    <div key={task.id}>
                      {q.prios.length > 1 && (
                        <div className="flex justify-end mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIO_BADGE[task.priority].cls}`}>
                            {PRIO_BADGE[task.priority].label}
                          </span>
                        </div>
                      )}
                      <TaskCard task={task} onUpdated={onUpdated} onDeleted={onDeleted} onEdit={onEdit} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <span className="text-2xl opacity-30 mb-1">{q.emptyIcon}</span>
                  <p className={`text-xs font-semibold ${q.emptyText}`}>All clear</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
