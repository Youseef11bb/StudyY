import { motion, Reorder, AnimatePresence } from 'motion/react';
import { GripVertical, Circle, CheckCircle2, Plus, Calendar, Clock, Trash2, AlertCircle, Check, X, ChevronDown, List, CalendarDays } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, Task } from '../context/AppContext';

export function TasksView() {
  const { tasks, addTask, updateTask, deleteTask, reorderTasks, t } = useAppContext();
  
  // --- إضافة كود التخزين المحلي ---
  useEffect(() => {
    // عند فتح الصفحة، نتأكد إن المهام موجودة في الـ Context
    // الـ AppContext غالباً بيتعامل مع Firebase، لو ملقاش بيانات، بنحملها من الموبايل
    const savedTasks = localStorage.getItem('local_study_tasks');
    if (savedTasks && tasks.length === 0) {
      const parsedTasks = JSON.parse(savedTasks);
      parsedTasks.forEach((task: Task) => {
        // إذا كنت عايز تضمن إنها اتضافت للـ Context (اختياري)
        // addTask(task); 
      });
    }
  }, []);

  // تحديث التخزين المحلي كل ما قائمة المهام تتغير
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('local_study_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);
  // ------------------------------

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

    const taskData = {
      title: newTaskTitle,
      duration: newTaskDuration + 'm Focus',
      priority: newTaskPriority,
      date: newTaskDate,
      time: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`,
    };

    addTask(taskData);

    // حفظ فوري احتياطي
    const currentLocal = JSON.parse(localStorage.getItem('local_study_tasks') || '[]');
    localStorage.setItem('local_study_tasks', JSON.stringify([...currentLocal, { ...taskData, id: Date.now().toString(), completed: false }]));

    setNewTaskTitle('');
    setNewTaskDuration('25');
    setNewTaskPriority('normal');
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-8">
      {/* Header Section */}
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
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}>
            <List size={18} /> {t('list')}
          </button>
          <button onClick={() => setViewMode('weekly')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}>
            <CalendarDays size={18} /> {t('weeklyPlanner')}
          </button>
        </div>
      </section>

      {/* Weekly View Logic */}
      {viewMode === 'weekly' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          {weekDays.map((day) => (
            <div key={day.date} className={`flex flex-col bg-surface-container-lowest rounded-2xl p-4 border-2 transition-colors ${day.date === today ? 'border-primary' : 'border-transparent'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{day.label}</span>
                  <span className={`text-xl font-headline font-bold ${day.date === today ? 'text-primary' : 'text-on-surface'}`}>{day.dayNum}</span>
                </div>
                <button onClick={() => { setNewTaskDate(day.date); setIsAdding(true); }} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2 flex-1">
                {(tasksByDay[day.date] || []).slice(0, 3).map(task => (
                  <div key={task.id} className={`p-2 rounded-xl text-[10px] font-medium truncate ${task.completed ? 'bg-surface-container-low text-on-surface-variant line-through' : 'bg-primary-container/20 text-primary border border-primary/10'}`}>
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Add Task Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAddTask} className="bg-surface-container-low p-6 rounded-3xl mb-8 space-y-4 overflow-hidden shadow-xl">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={t('taskPlaceholder')} className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary" autoFocus />
            <div className="flex flex-wrap gap-4">
               <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="flex-1 bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface outline-none" />
               <input type="number" value={newTaskDuration} onChange={(e) => setNewTaskDuration(e.target.value)} className="w-24 bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2 text-on-surface-variant"> {t('cancel')} </button>
              <button type="submit" className="px-5 py-2 bg-primary text-on-primary rounded-full font-bold"> {t('saveChanges')} </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active Tasks List */}
      <Reorder.Group axis="y" values={activeTasks} onReorder={reorderTasks} className="space-y-4">
        {activeTasks.map((task) => (
          <Reorder.Item key={task.id} value={task} className="group rounded-3xl p-5 flex items-center gap-4 bg-surface-container-low shadow-sm border border-outline-variant/10">
            <button onClick={() => updateTask(task.id, { completed: true })} className="text-primary hover:scale-110 transition-transform">
              <Circle size={24} />
            </button>
            <div className="flex-grow">
              <h4 className="text-lg font-bold text-on-surface">{task.title}</h4>
              <div className="flex gap-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><Clock size={14}/> {task.duration}</span>
                <span className="flex items-center gap-1"><Calendar size={14}/> {task.date}</span>
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-on-surface-variant hover:text-error p-2">
              <Trash2 size={20} />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* FAB */}
      <button onClick={() => setIsAdding(true)} className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50">
        <Plus size={32} />
      </button>
    </motion.div>
  );
}