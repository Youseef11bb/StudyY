import { motion, Reorder, AnimatePresence } from 'motion/react';
import { GripVertical, Circle, CheckCircle2, MoreVertical, Plus, Calendar, Clock, Trash2, AlertCircle, Check, X, ChevronDown, ChevronUp, LayoutGrid, List, CalendarDays } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useAppContext, Task } from '../context/AppContext';

export function TasksView() {
  const { tasks, addTask, updateTask, deleteTask, reorderTasks, t } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('25');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle,
      duration: newTaskDuration + 'm Focus',
      priority: newTaskPriority,
      date: newTaskDate,
      time: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`,
    });

    setNewTaskTitle('');
    setNewTaskDuration('25');
    setNewTaskPriority('normal');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      updateTask(id, { title: editTitle });
    }
    setEditingId(null);
  };

  const priorityColors = {
    low: 'bg-surface-container text-on-surface-variant',
    normal: 'bg-secondary-container text-on-secondary-container',
    high: 'bg-error-container text-on-error-container',
  };

  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  const today = new Date().toISOString().split('T')[0];
  
  const weekDays = useMemo(() => {
    const days = [];
    const curr = new Date();
    // Start from Monday
    const first = curr.getDate() - curr.getDay() + 1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return days;
  }, []);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-8"
    >
      <section className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl md:text-[2.5rem] leading-tight text-primary font-bold mb-2 tracking-tight">
            {t('myTasks')}
          </h2>
          <p className="font-body text-on-surface-variant text-base md:text-lg">
            {viewMode === 'list' ? t('focusingSessionDesc') : t('weeklyPlanner')}
          </p>
        </div>
        
        <div className="flex bg-surface-container-low p-1 rounded-2xl self-start">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <List size={18} />
            {t('list') || 'List'}
          </button>
          <button 
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <CalendarDays size={18} />
            {t('weeklyPlanner')}
          </button>
        </div>
      </section>

      {viewMode === 'weekly' ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          {weekDays.map((day) => (
            <div key={day.date} className={`flex flex-col bg-surface-container-lowest rounded-2xl p-4 border-2 transition-colors ${day.date === today ? 'border-primary' : 'border-transparent'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{day.label}</span>
                  <span className={`text-xl font-headline font-bold ${day.date === today ? 'text-primary' : 'text-on-surface'}`}>{day.dayNum}</span>
                </div>
                <button 
                  onClick={() => {
                    setNewTaskDate(day.date);
                    setIsAdding(true);
                  }}
                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="space-y-2 flex-1">
                {(tasksByDay[day.date] || []).slice(0, 3).map(task => (
                  <div key={task.id} className={`p-2 rounded-xl text-[10px] font-medium truncate ${task.completed ? 'bg-surface-container-low text-on-surface-variant line-through' : 'bg-primary-container/20 text-primary border border-primary/10'}`}>
                    {task.title}
                  </div>
                ))}
                {(tasksByDay[day.date] || []).length > 3 && (
                  <div className="text-[10px] text-center text-on-surface-variant font-bold">
                    +{(tasksByDay[day.date] || []).length - 3} more
                  </div>
                )}
                {(tasksByDay[day.date] || []).length === 0 && (
                  <div className="h-12 flex items-center justify-center border border-dashed border-outline-variant/30 rounded-xl">
                    <span className="text-[10px] text-on-surface-variant/30 font-medium italic">Empty</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Task List Container */}
      <section className="space-y-6">
        {viewMode === 'list' && (
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">{t('active')}</h3>
            <div className="flex gap-2">
              <span className="bg-secondary-container text-on-secondary-container px-3 md:px-4 py-1 md:py-1.5 rounded-full font-label text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                {activeTasks.length} {t('active')}
              </span>
            </div>
          </div>
        )}

        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTask}
            className="bg-surface-container-low p-6 rounded-3xl mb-8 space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('tasks')}</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('taskPlaceholder')}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary outline-none"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs md:text-sm font-medium text-on-surface-variant mb-1">{t('date') || 'Date'}</label>
                <input 
                  type="date" 
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-2.5 md:py-3 text-on-surface focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs md:text-sm font-medium text-on-surface-variant mb-1">{t('focusMin')}</label>
                <input 
                  type="number" 
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-2.5 md:py-3 text-on-surface focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs md:text-sm font-medium text-on-surface-variant mb-1">{t('priority') || 'Priority'}</label>
                <div className="flex gap-1.5 md:gap-2">
                  {(['low', 'normal', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`flex-1 py-2.5 md:py-3 rounded-xl font-medium text-xs md:text-sm capitalize transition-colors ${
                        newTaskPriority === p 
                          ? priorityColors[p] 
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {t(p)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-full font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-5 py-2.5 rounded-full font-medium bg-primary text-on-primary disabled:opacity-50 transition-colors"
              >
                {t('saveChanges')}
              </button>
            </div>
          </motion.form>
        )}

        {activeTasks.length === 0 && !isAdding ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <AlertCircle size={48} className="mx-auto text-on-surface-variant/50 mb-4" />
            <h3 className="text-lg font-medium text-on-surface">{t('noTasks')}</h3>
          </div>
        ) : (
          <Reorder.Group axis="y" values={activeTasks} onReorder={reorderTasks} className="space-y-4">
            {activeTasks.map((task) => (
              <Reorder.Item 
                key={task.id}
                value={task}
                className="group relative rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all flex items-center gap-3 md:gap-4 bg-surface-container-low ambient-shadow cursor-grab active:cursor-grabbing"
              >
                {task.priority === 'high' && (
                  <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r-full"></div>
                )}
                
                <div className="opacity-0 group-hover:opacity-40 transition-opacity ml-2">
                  <GripVertical size={16} />
                </div>
                
                <button 
                  onClick={() => updateTask(task.id, { completed: true })}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 border-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Circle size={16} />
                </button>
                
                <div className="flex-grow min-w-0">
                  {editingId === task.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-grow bg-surface-container-highest border-none rounded-lg px-3 py-1 text-on-surface focus:ring-2 focus:ring-primary outline-none font-body text-lg md:text-xl font-bold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(task.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button onClick={() => handleSaveEdit(task.id)} className="p-1 text-primary hover:bg-primary/10 rounded-full">
                        <Check size={20} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-on-surface-variant hover:bg-surface-container rounded-full">
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <h4 
                      onClick={() => handleStartEdit(task)}
                      className="font-body text-lg md:text-xl font-bold mb-1 truncate cursor-text text-on-surface hover:text-primary transition-colors"
                    >
                      {task.title}
                    </h4>
                  )}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-sm text-on-surface-variant">
                    {task.priority !== 'low' && (
                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg font-label text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.normal}`}>
                        {t(task.priority)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="md:w-3.5 md:h-3.5" /> {task.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="md:w-3.5 md:h-3.5" /> {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-3 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {/* Completed Tasks Section */}
        <div className="mt-12">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-3 text-on-surface-variant hover:text-primary transition-colors font-bold group"
          >
            <div className={`p-1 rounded-lg bg-surface-container-low group-hover:bg-primary/10 transition-colors ${showCompleted ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} />
            </div>
            <span>{showCompleted ? t('hideCompleted') : t('showCompleted')} ({completedTasks.length})</span>
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-6 space-y-4"
              >
                {completedTasks.length === 0 ? (
                  <p className="text-center py-8 text-on-surface-variant italic text-sm">{t('noTasks')}</p>
                ) : (
                  completedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="group relative rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all flex items-center gap-3 md:gap-4 bg-surface-container-lowest opacity-60"
                    >
                      <button 
                        onClick={() => updateTask(task.id, { completed: false })}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 bg-secondary text-on-secondary"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      
                      <div className="flex-grow min-w-0">
                        <h4 className="font-body text-lg md:text-xl font-bold mb-1 truncate line-through text-on-surface-variant">
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="md:w-3.5 md:h-3.5" /> {task.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="md:w-3.5 md:h-3.5" /> {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-3 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAB */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-24 md:bottom-28 right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-on-primary shadow-[0_12px_32px_-4px_rgba(36,68,235,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={28} className="md:w-8 md:h-8" />
      </button>
    </motion.div>
  );
}
