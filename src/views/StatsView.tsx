import { motion } from 'motion/react';
import { Clock, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function StatsView() {
  const { profile, tasks, timerState, t, sessionSeconds } = useAppContext();
  const { timeLeft, mode } = timerState;

  // Calculate stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const liveFocusHours = profile.focusHours + (sessionSeconds / 3600);

  // Calculate stroke dashoffset for the circular progress (circumference = 2 * pi * r = 2 * 3.14159 * 80 ≈ 502.4)
  const circumference = 502.4;
  const strokeDashoffset = circumference - (circumference * completionRate) / 100;

  // Mock weekly data based on current day (in a real app, this would be tracked historically)
  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1; // Make Monday 0, Sunday 6
  
  const weeklyData = [
    { day: t('mon'), h: '20%' },
    { day: t('tue'), h: '30%' },
    { day: t('wed'), h: '40%' },
    { day: t('thu'), h: '50%' },
    { day: t('fri'), h: '60%' },
    { day: t('sat'), h: '70%' },
    { day: t('sun'), h: '80%' },
  ].map((d, i) => ({
    ...d,
    // Make the current day active and set its height based on focus hours (max 10 hours for 100%)
    active: i === adjustedDayIndex,
    h: i === adjustedDayIndex ? `${Math.min((liveFocusHours / 10) * 100, 100)}%` : d.h
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-8"
    >
      <section className="mb-10">
        <h2 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tight">
          {t('stats')}
        </h2>
        <p className="text-on-surface-variant font-medium">
          {t('weeklyProgress')}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Weekly Study Hours */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6 md:mb-10">
            <div>
              <h3 className="font-headline text-lg md:text-xl font-bold text-on-surface">{t('studyHours')}</h3>
              <p className="text-on-surface-variant text-xs md:text-sm">{t('focusingSessionDesc')}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 md:px-4 py-1 md:py-1.5 bg-surface-container-low rounded-full text-[10px] md:text-xs font-bold text-primary">Week</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between flex-1 min-h-[160px] md:min-h-[200px] gap-1.5 md:gap-4 px-1 md:px-2">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2 md:gap-3 w-full h-full justify-end">
                <div 
                  className={`w-full rounded-t-lg md:rounded-t-xl transition-all duration-1000 ${d.active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low hover:bg-primary-container'}`}
                  style={{ height: d.h }}
                ></div>
                <span className={`font-label text-[10px] md:text-xs ${d.active ? 'text-on-surface font-extrabold' : 'text-on-surface-variant font-bold'}`}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Goal */}
        <div className="md:col-span-4 bg-surface-container-low rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <h3 className="font-headline text-lg md:text-xl font-bold text-on-surface mb-6 md:mb-8">{t('tasksCompleted')}</h3>
          <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle className="text-surface-container-highest" cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" strokeWidth="10"></circle>
              <circle 
                className="text-primary transition-all duration-1000 ease-out" 
                cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" 
                strokeDasharray="251" 
                strokeDashoffset={251 - (251 * completionRate) / 100} 
                strokeLinecap="round" strokeWidth="10"
              ></circle>
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-headline text-4xl md:text-5xl font-bold text-primary">{completionRate}%</span>
              <span className="font-label text-on-surface-variant font-bold mt-1 text-xs md:text-sm">{t('completed')}</span>
            </div>
          </div>
          <div className="mt-6 md:mt-8">
            <p className="font-body text-sm md:text-base text-on-surface font-semibold">{completedTasks} of {totalTasks} {t('tasks')}</p>
            <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">
              {completionRate === 100 && totalTasks > 0 ? "Perfect! You've completed all tasks." : 
               completionRate > 50 ? "Great job, you're over halfway there!" : 
               "Keep going, you can do this!"}
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl md:rounded-[2rem] p-5 md:p-6 ambient-shadow flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Clock size={24} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-label text-on-surface-variant font-bold uppercase tracking-wider text-[9px] md:text-[10px]">{t('totalFocus')}</p>
            <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface truncate">
              {liveFocusHours.toFixed(1)}<span className="text-xs md:text-sm font-body text-on-surface-variant ml-1 font-medium">{t('h')}</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl md:rounded-[2rem] p-5 md:p-6 ambient-shadow flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
            <CheckCircle2 size={24} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-label text-on-surface-variant font-bold uppercase tracking-wider text-[9px] md:text-[10px]">{t('tasksDone') || t('tasksCompleted')}</p>
            <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface truncate">{profile.tasksDone}</p>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl md:rounded-[2rem] p-5 md:p-6 ambient-shadow flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary flex-shrink-0">
            <TrendingUp size={24} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-label text-on-surface-variant font-bold uppercase tracking-wider text-[9px] md:text-[10px]">{t('streak')}</p>
            <div className="flex items-center gap-2">
              <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface truncate">{profile.streak}</p>
              <span className="text-[9px] md:text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">{t('days')}</span>
            </div>
          </div>
        </div>

        {/* Insight Card */}
        <div className="md:col-span-12 mt-2 md:mt-4">
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-10 text-on-primary relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h3 className="font-headline text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                {profile.streak > 0 ? "You're on a roll!" : "Ready to start your streak?"}
              </h3>
              <p className="font-body text-base md:text-lg text-on-primary/90 mb-6 md:mb-8 leading-relaxed">
                {profile.streak > 0 
                  ? `You've maintained a focus streak for ${profile.streak} days. Keep up the great work and consistency to build lasting habits.`
                  : "Start a focus session today to begin building your streak. Consistency is key to achieving your goals."}
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
              <Zap size={240} className="md:w-80 md:h-80" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
