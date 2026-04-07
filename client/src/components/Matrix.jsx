import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import TaskCard from './TaskCard';
const COLUMNS = [
  {
    prios: [0],
    label: 'P0 · Do Now',
    sub: 'Immediate action',
    headerClass: 'text-red-700',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-50 border-red-200',
    countClass: 'bg-red-100 text-red-700',
  },
  {
    prios: [1],
    label: 'P1 · Today',
    sub: 'Today / Tomorrow',
    headerClass: 'text-orange-700',
    dotClass: 'bg-orange-500',
    bgClass: 'bg-orange-50 border-orange-200',
    countClass: 'bg-orange-100 text-orange-700',
  },
  {
    prios: [2],
    label: 'P2 · This Week',
    sub: 'Within 7 days',
    headerClass: 'text-amber-700',
    dotClass: 'bg-amber-400',
    bgClass: 'bg-amber-50 border-amber-200',
    countClass: 'bg-amber-100 text-amber-700',
  },
  {
    prios: [3, 4],
    label: 'P3/P4 · Later',
    sub: 'Weekend · TBD',
    headerClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-50 border-blue-200',
    countClass: 'bg-blue-100 text-blue-700',
    mixed: true,
  },
];
const PRIO_MINI = {
  3: { label: 'P3', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  4: { label: 'P4', cls: 'bg-slate-100 text-slate-600 border border-slate-300' },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function Matrix({ tasks, onUpdated, onDeleted, onEdit }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
  };
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCol(null);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (colIndex) => {
    setDragOverCol(colIndex);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = useCallback(async (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);

    if (!draggedTask) return;

    const destCol = COLUMNS[colIndex];
    const newPriority = destCol.prios[0];

    if (draggedTask.priority === newPriority) {
      setDraggedTask(null);
      return;
    }
    try {
      const { data } = await api.patch(`/tasks/${draggedTask.id}`, { priority: newPriority });
      onUpdated(data);
      toast.success(`Priority updated to ${destCol.label}`);
    } catch (e) {
      toast.error('Failed to update priority');
      console.error(e);
    } finally {
      setDraggedTask(null);
    }
  }, [draggedTask, onUpdated]);
  return (
    <>
      {/* Desktop: 4-column grid — fixed height so columns never expand the page */}
      <div
        className="hidden md:grid md:grid-cols-4 gap-4"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        {COLUMNS.map((col, colIndex) => {
          const colTasks = tasks.filter(t => col.prios.includes(t.priority));
          const isOverColumn = dragOverCol === colIndex;
          return (
            <div
              key={col.label}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(colIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, colIndex)}
              className={`rounded-2xl border ${col.bgClass} flex flex-col h-full min-h-0 transition-all duration-200 ${isOverColumn && draggedTask
                  ? 'bg-opacity-75 shadow-lg ring-2 ring-offset-2 ring-blue-400 scale-105'
                  : ''
                }`}
            >
              {/* Header — never shrinks */}
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-black/5 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dotClass} shadow-sm`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${col.headerClass} truncate`}>{col.label}</p>
                  <p className="text-xs text-slate-500 truncate">{col.sub}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${col.countClass}`}>
                  {colTasks.length}
                </span>
              </div>
              {/* Scrollable task list — min-h-0 is the key fix */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2"
              >
                <AnimatePresence>
                  {colTasks.length === 0 && !dragOverCol ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2">
                        <span className="text-sm">✓</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Clear</p>
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab active:cursor-grabbing transform transition-all duration-150 ${draggedTask?.id === t.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                          }`}
                      >
                        {col.mixed && (
                          <div className="flex justify-end mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRIO_MINI[t.priority].cls}`}>
                              {PRIO_MINI[t.priority].label}
                            </span>
                          </div>
                        )}
                        <TaskCard
                          task={t}
                          onUpdated={onUpdated}
                          onDeleted={onDeleted}
                          onEdit={onEdit}
                        />
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked columns */}
      <div className="md:hidden space-y-4 pb-24">
        {COLUMNS.map((col, colIndex) => {
          const colTasks = tasks.filter(t => col.prios.includes(t.priority));
          const isOverColumn = dragOverCol === colIndex;

          return (
            <div
              key={col.label}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(colIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, colIndex)}
              className={`rounded-2xl border ${col.bgClass} transition-all duration-200 ${isOverColumn && draggedTask
                  ? 'bg-opacity-75 shadow-lg ring-2 ring-offset-2 ring-blue-400 scale-[1.02]'
                  : ''
                }`}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
                <div className="flex-1">
                  <p className={`text-sm font-bold ${col.headerClass}`}>{col.label}</p>
                  <p className="text-xs text-slate-500">{col.sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOverColumn && draggedTask && draggedTask.priority !== col.prios[0] && (
                    <span className="text-[10px] font-bold text-blue-600 animate-pulse">DROP HERE</span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countClass}`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {colTasks.length > 0 ? (
                <div className="p-3 space-y-2">
                  <AnimatePresence>
                    {colTasks.map(t => (
                      <motion.div
                        key={t.id}
                        variants={item}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab active:cursor-grabbing transform transition-all duration-150 ${draggedTask?.id === t.id ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
                          }`}
                      >
                        {col.mixed && (
                          <div className="flex justify-end mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRIO_MINI[t.priority].cls}`}>
                              {PRIO_MINI[t.priority].label}
                            </span>
                          </div>
                        )}
                        <TaskCard task={t} onUpdated={onUpdated} onDeleted={onDeleted} onEdit={onEdit} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    {isOverColumn && draggedTask ? 'Drop task here' : 'All clear'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}