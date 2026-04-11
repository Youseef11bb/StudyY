import { motion } from 'motion/react';
import { Flame, Play, Pause, SkipForward, RotateCcw, Activity, Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { LocalNotifications } from '@capacitor/local-notifications'; // استيراد المكتبة

// تجهيز ملف الصوت
const alarmSound = new Audio('/alarm.mp3');

export function FocusView() {
  const { addFocusTime, profile, updateProfile, timerState, setTimerState, t, sessionSeconds } = useAppContext();
  const { timeLeft, isPlaying, mode } = timerState;

  const hasAlerted = useRef(false);

  // طلب الإذن عند فتح الصفحة لأول مرة
  useEffect(() => {
    LocalNotifications.requestPermissions();
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && isPlaying && !hasAlerted.current) {
      // إرسال إشعار فوري بصوت المنبه عند انتهاء الوقت
      LocalNotifications.schedule({
        notifications: [
          {
            title: mode === 'focus' ? "انتهى وقت التركيز!" : "انتهى البريك!",
            body: mode === 'focus' ? "عاش يا بطل، خد بريك دلوقتي." : "يلا نرجع نركز تاني!",
            id: 2,
            schedule: { at: new Date(Date.now()) }, // يظهر الآن
            sound: 'alarm.mp3',
            actionTypeId: "",
            extra: null
          }
        ]
      });

      // اهتزاز الموبايل
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
      }

      hasAlerted.current = true;
      setTimerState({ isPlaying: false });
    }

    if (timeLeft > 0) {
      hasAlerted.current = false;
    }
  }, [timeLeft, isPlaying, mode, setTimerState, t]);

  const toggleTimer = async () => {
    const newIsPlaying = !isPlaying;
    setTimerState({ isPlaying: newIsPlaying });

    if (newIsPlaying) {
      // جدولة إشعار مستقبلي لضمان العمل في الخلفية (حتى لو التطبيق اتقفل)
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "STUDYY",
            body: mode === 'focus' ? "وقت المذاكرة خلص!" : "البريك خلص!",
            id: 1,
            schedule: { at: new Date(Date.now() + timeLeft * 1000) },
            sound: 'alarm.mp3',
          }
        ]
      });
    } else {
      // إلغاء الإشعار المجدول لو المستخدم وقف التايمر يدوي
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    }
  };
  
  const resetTimer = async () => {
    hasAlerted.current = false;
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    setTimerState({ 
      isPlaying: false, 
      timeLeft: (mode === 'focus' ? profile.focusDuration : profile.breakDuration) * 60 
    });
  };

  const skipTimer = async () => {
    hasAlerted.current = false;
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    if (mode === 'focus') {
      addFocusTime(profile.focusDuration - Math.floor(timeLeft / 60)); 
      setTimerState({ 
        isPlaying: false, 
        mode: 'break', 
        timeLeft: profile.breakDuration * 60 
      });
    } else {
      setTimerState({ 
        isPlaying: false, 
        mode: 'focus', 
        timeLeft: profile.focusDuration * 60 
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((profile.focusDuration * 60 - timeLeft) / (profile.focusDuration * 60)) * 100 
    : ((profile.breakDuration * 60 - timeLeft) / (profile.breakDuration * 60)) * 100;
    
  const liveFocusHours = profile.focusHours + (sessionSeconds / 3600);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-4 md:py-8"
    >
      <section className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-24 mb-12 md:mb-16">
        {/* Hero Timer Visual */}
        <div className="relative group w-full max-w-[300px] md:max-w-[420px] aspect-square">
          <div className="w-full h-full rounded-full border-[8px] md:border-[12px] border-surface-container-low flex items-center justify-center relative timer-glow bg-surface-container-lowest">
            {/* Progress SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                fill="transparent"
                r="47%"
                stroke="url(#timerGradient)"
                strokeDasharray="1320"
                strokeDashoffset={1320 - (1320 * progress) / 100}
                strokeLinecap="round"
                strokeWidth="8"
                className="md:stroke-[12]"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor={mode === 'focus' ? "var(--color-primary)" : "var(--color-secondary)"} />
                  <stop offset="100%" stopColor={mode === 'focus' ? "var(--color-primary-container)" : "var(--color-secondary-container)"} />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Timer Text */}
            <div className="text-center flex flex-col items-center scale-90 md:scale-100">
              <span className={`font-headline font-bold text-[4.5rem] md:text-[8rem] leading-none tracking-tight block ${mode === 'focus' ? 'text-primary' : 'text-secondary'}`}>
                {formatTime(timeLeft)}
              </span>
              <div className={`mt-4 inline-flex items-center px-4 py-1.5 rounded-full ${mode === 'focus' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                {mode === 'focus' ? <Flame size={16} className="mr-2" /> : <Activity size={16} className="mr-2" />}
                <span className="font-label font-bold text-sm tracking-wider uppercase">
                  {mode === 'focus' ? t('deepWork') : t('restRecover')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Context */}
        <div className="flex flex-col items-center lg:items-start space-y-8 md:space-y-10 max-w-xs w-full">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
              {mode === 'focus' ? t('focusingSession') : t('breakTime')}
            </h2>
            <p className="text-on-surface-variant font-body">
              {mode === 'focus' 
                ? t('focusingSessionDesc') || 'Minimize distractions and engage in cognitive flow.' 
                : t('breakTimeDesc') || 'Take a moment to rest, stretch, and recharge.'}
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={resetTimer} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-surface-container-highest text-primary hover:bg-primary-container/20 transition-all active:scale-90">
              <RotateCcw size={24} className="md:w-7 md:h-7" />
            </button>
            <button 
              onClick={toggleTimer}
              className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all active:scale-95 ${mode === 'focus' ? 'bg-primary text-on-primary shadow-primary/20' : 'bg-secondary text-on-secondary shadow-secondary/20'}`}
            >
              {isPlaying ? <Pause size={32} className="md:w-10 md:h-10" fill="currentColor" /> : <Play size={32} className="md:w-10 md:h-10 ml-1 md:ml-2" fill="currentColor" />}
            </button>
            <button onClick={skipTimer} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-surface-container-highest text-primary hover:bg-primary-container/20 transition-all active:scale-90">
              <SkipForward size={24} className="md:w-7 md:h-7" />
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
            <button 
              onClick={() => { setTimerState({ mode: 'focus', timeLeft: profile.focusDuration * 60, isPlaying: false }); }}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm transition-colors ${mode === 'focus' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            >
              {t('focus')}
            </button>
            <button 
              onClick={() => { setTimerState({ mode: 'break', timeLeft: profile.breakDuration * 60, isPlaying: false }); }}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm transition-colors ${mode === 'break' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            >
              {t('break')}
            </button>
          </div>

          {/* Customization */}
          <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('focusMin')}</label>
              <input 
                type="number" 
                min="1"
                max="120"
                value={profile.focusDuration}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  updateProfile({ focusDuration: val });
                  if (!isPlaying && mode === 'focus') setTimerState({ timeLeft: val * 60 });
                }}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('breakMin')}</label>
              <select 
                value={profile.breakDuration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateProfile({ breakDuration: val });
                  if (!isPlaying && mode === 'break') setTimerState({ timeLeft: val * 60 });
                }}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                {[5, 10, 15, 20, 30, 45, 60].map(m => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Stats */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-label font-semibold text-on-surface-variant tracking-widest uppercase text-xs">
                {t('todayProgress')}
              </p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">{t('streak')}: {profile.streak} {t('days')}</h3>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-2 rounded-full bg-primary"></div>
              <div className="w-12 h-2 rounded-full bg-primary"></div>
              <div className="w-12 h-2 rounded-full bg-primary"></div>
              <div className="w-12 h-2 rounded-full bg-outline-variant/30"></div>
            </div>
            <p className="text-on-surface-variant text-sm">
              {t('momentumDesc')}
            </p>
          </div>
          <div className="w-32 h-32 flex items-center justify-center">
            <Activity size={80} className="text-primary/20" strokeWidth={1.5} />
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-[2rem] p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-primary-container/30 p-3 rounded-2xl text-primary">
              <Timer size={24} />
            </div>
            <span className="text-secondary font-bold text-sm">{t('active')}</span>
          </div>
          <div className="mt-8 space-y-1">
            <p className="font-label font-semibold text-on-surface-variant tracking-widest uppercase text-xs">
              {t('totalFocus')}
            </p>
            <h3 className="font-headline text-4xl font-bold text-on-surface">
              {Math.floor(liveFocusHours)}<span className="text-xl ml-1 text-on-surface-variant font-sans">{t('h')}</span> {Math.round((liveFocusHours % 1) * 60)}<span className="text-xl ml-1 text-on-surface-variant font-sans">{t('m')}</span>
            </h3>
          </div>
        </div>
      </section>
    </motion.div>
  );
}