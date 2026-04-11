import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { playSound, SOUNDS } from '../lib/sounds';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'emerald' | 'sunset' | 'crimson';
export type Language = 'en' | 'ar' | 'de' | 'fr' | 'it' | 'zh' | 'ja' | 'hi' | 'es' | 'ru';

export interface TimerState {
  mode: 'focus' | 'break';
  isPlaying: boolean;
  timeLeft: number;
  lastUpdate: number;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  duration: string;
  priority: 'high' | 'normal' | 'low';
  completed: boolean;
  date: string;
  order: number;
}

export interface UserProfile {
  name: string;
  email: string;
  timezone: string;
  focusHours: number;
  tasksDone: number;
  streak: number;
  lastStudyDate?: string;
  theme: Theme;
  language: Language;
  focusDuration: number;
  breakDuration: number;
  bio: string;
  permissions: {
    backgroundTimer: boolean;
  };
}

interface AppContextType {
  user: null;
  isAuthReady: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (newTasks: Task[]) => void;
  addFocusTime: (minutes: number) => void;
  signIn: () => void;
  logout: () => void;
  timerState: TimerState;
  setTimerState: (state: Partial<TimerState>) => void;
  sessionSeconds: number;
  t: (key: string) => string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const KEYS = {
  tasks:   'studyy_tasks',
  profile: 'studyy_profile',
  timer:   'studyy_timer',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(KEYS.tasks);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const getInitialLanguage = (): Language => {
  const lang = navigator.language.split('-')[0];
  const supported: Language[] = ['en', 'ar', 'de', 'fr', 'it', 'zh', 'ja', 'hi', 'es', 'ru'];
  return supported.includes(lang as Language) ? (lang as Language) : 'en';
};

const defaultProfile: UserProfile = {
  name: 'Study Master',
  email: '',
  timezone: 'UTC',
  focusHours: 0,
  tasksDone: 0,
  streak: 0,
  theme: 'light',
  language: getInitialLanguage(),
  focusDuration: 25,
  breakDuration: 5,
  bio: 'Deep focus enthusiast.',
  permissions: { backgroundTimer: true },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Profile — loaded from localStorage on first render
  const [profile, setProfile] = useState<UserProfile>(() =>
    load<UserProfile>(KEYS.profile, defaultProfile)
  );

  // Tasks — loaded from localStorage on first render
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);

  // Timer — restore elapsed time if it was running
  const [timerState, setTimerStateInternal] = useState<TimerState>(() => {
    try {
      const raw = localStorage.getItem(KEYS.timer);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.isPlaying && parsed.lastUpdate) {
          const elapsed = Math.floor((Date.now() - parsed.lastUpdate) / 1000);
          return { ...parsed, timeLeft: Math.max(0, parsed.timeLeft - elapsed), lastUpdate: Date.now() };
        }
        return parsed;
      }
    } catch { /* ignore */ }
    return { mode: 'focus', isPlaying: false, timeLeft: 25 * 60, lastUpdate: Date.now() };
  });

  // ── Persist profile whenever it changes ───────────────────────────────────
  useEffect(() => {
    save(KEYS.profile, profile);
  }, [profile]);

  // ── Persist tasks whenever they change ────────────────────────────────────
  useEffect(() => {
    save(KEYS.tasks, tasks);
  }, [tasks]);

  // ── Apply theme & language to document ───────────────────────────────────
  useEffect(() => {
    document.documentElement.className = profile.theme === 'light' ? '' : `theme-${profile.theme}`;
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = profile.language;
  }, [profile.theme, profile.language]);

  // ── Timer state helper ────────────────────────────────────────────────────
  const setTimerState = (updates: Partial<TimerState>) => {
    setTimerStateInternal(prev => {
      const next = { ...prev, ...updates, lastUpdate: Date.now() };
      save(KEYS.timer, next);
      return next;
    });
  };

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isPlaying && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerStateInternal(prev => {
          const next = { ...prev, timeLeft: prev.timeLeft - 1, lastUpdate: Date.now() };
          save(KEYS.timer, next);
          return next;
        });

        if (timerState.mode === 'focus') {
          sessionSecondsRef.current += 1;
          setSessionSeconds(sessionSecondsRef.current);
          if (sessionSecondsRef.current >= 60) {
            addFocusTime(1);
            sessionSecondsRef.current = 0;
            setSessionSeconds(0);
          }
        }
      }, 1000);

    } else if (timerState.timeLeft === 0 && timerState.isPlaying) {
      setTimerState({ isPlaying: false });
      playSound(SOUNDS.TIMER_END);

      if (timerState.mode === 'focus') {
        if (sessionSecondsRef.current > 0) {
          addFocusTime(sessionSecondsRef.current / 60);
          sessionSecondsRef.current = 0;
          setSessionSeconds(0);
        }
        setTimerState({ mode: 'break', timeLeft: profile.breakDuration * 60 });
      } else {
        setTimerState({ mode: 'focus', timeLeft: profile.focusDuration * 60 });
      }
    }

    return () => clearInterval(interval);
  }, [timerState.isPlaying, timerState.timeLeft, timerState.mode, profile.focusDuration, profile.breakDuration]);

  // ── CRUD: Tasks ───────────────────────────────────────────────────────────
  const addTask = (task: Omit<Task, 'id' | 'completed' | 'order'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      order: tasks.length,
      time: task.time || `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`,
    };
    setTasks(prev => {
      const updated = [...prev, newTask];
      save(KEYS.tasks, updated);
      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      save(KEYS.tasks, updated);
      return updated;
    });

    // تحديث عداد المهام المنجزة في الـ profile
    if (updates.completed === true) {
      playSound(SOUNDS.TASK_COMPLETE);
      setProfile(prev => {
        const next = { ...prev, tasksDone: prev.tasksDone + 1 };
        save(KEYS.profile, next);
        return next;
      });
    } else if (updates.completed === false) {
      setProfile(prev => {
        const next = { ...prev, tasksDone: Math.max(0, prev.tasksDone - 1) };
        save(KEYS.profile, next);
        return next;
      });
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      save(KEYS.tasks, updated);
      return updated;
    });
  };

  const reorderTasks = (newTasks: Task[]) => {
    const reordered = newTasks.map((t, i) => ({ ...t, order: i }));
    setTasks(reordered);
    save(KEYS.tasks, reordered);
  };

  // ── Profile ───────────────────────────────────────────────────────────────
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = {
        ...prev,
        ...updates,
        permissions: { ...prev.permissions, ...(updates.permissions || {}) },
      };
      save(KEYS.profile, next);
      return next;
    });
  };

  // ── Focus time ────────────────────────────────────────────────────────────
  const addFocusTime = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    setProfile(prev => {
      let newStreak = prev.streak;
      if (prev.lastStudyDate === yesterday) newStreak += 1;
      else if (prev.lastStudyDate !== today) newStreak = 1;

      const next = {
        ...prev,
        focusHours: Math.round((prev.focusHours + minutes / 60) * 100) / 100,
        streak: newStreak,
        lastStudyDate: today,
      };
      save(KEYS.profile, next);
      return next;
    });
  };

  // ── Auth stubs (مش محتاجينها دلوقتي) ─────────────────────────────────────
  const signIn = () => {};
  const logout = () => {
    setProfile(defaultProfile);
    save(KEYS.profile, defaultProfile);
  };

  // ── Translations ──────────────────────────────────────────────────────────
  const translations: Record<Language, Record<string, string>> = {
    en: {
      appName: 'Study+', focus: 'Focus', break: 'Break', tasks: 'Tasks', stats: 'Stats',
      profile: 'Profile', settings: 'Settings', account: 'Account', contact: 'Contact Us',
      privacy: 'Privacy Policy', help: 'Help & FAQ', signOut: 'Sign Out',
      signInGoogle: 'Sign in with Google', signInPhone: 'Sign in with Phone',
      streak: 'Streak', totalFocus: 'Total Focus', deepWork: 'Deep Work',
      restRecover: 'Rest & Recover', focusingSession: 'Focusing Session', breakTime: 'Break Time',
      focusingSessionDesc: 'Minimize distractions and engage in cognitive flow.',
      breakTimeDesc: 'Take a moment to rest, stretch, and recharge.',
      focusMin: 'Focus (min)', breakMin: 'Break (min)', language: 'Language',
      permissions: 'Permissions', bgTimer: 'Background Timer',
      focusComplete: 'Focus Session Complete!', focusCompleteBody: 'Time for a well-deserved break.',
      breakComplete: 'Break Over!', breakCompleteBody: 'Ready to get back to work?',
      myTasks: 'My Tasks', addTask: 'Add Task', taskPlaceholder: 'What are you working on?',
      noTasks: 'No tasks yet. Add one to get started!',
      high: 'High', normal: 'Normal', low: 'Low', completed: 'Completed', active: 'Active',
      weeklyProgress: 'Weekly Progress', studyHours: 'Study Hours', tasksCompleted: 'Tasks Completed',
      focusDistribution: 'Focus Distribution', themeCenter: 'Theme Center',
      emailAddress: 'Email Address', timezone: 'Timezone', saveChanges: 'Save Changes',
      resetAllData: 'Reset All Data', version: 'Version', level: 'Level', member: 'Focus Member',
      days: 'Days', menu: 'Menu', emailUs: 'Email Us', callUs: 'Call Us',
      contactDesc: "We'd love to hear from you.",
      privacyTitle: 'Your privacy is important to us.',
      dataCollection: 'Data Collection', dataCollectionDesc: 'Data is stored locally on your device.',
      usage: 'Usage', usageDesc: 'Your data is never shared with anyone.',
      cookies: 'Storage', cookiesDesc: 'We use local storage to save your data.',
      helpQ1: 'How does the streak work?', helpA1: 'Your streak increases every day you complete at least one focus session.',
      helpQ2: 'Can I use it offline?', helpA2: 'Yes! Everything is saved locally on your device.',
      helpQ3: 'How to customize the timer?', helpA3: 'Go to the Focus tab and use the inputs at the bottom.',
      mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
      todayProgress: "Today's Progress", momentumDesc: "Keep the momentum going!",
      h: 'h', m: 'm', tasksDone: 'Tasks Done', weeklyPlanner: 'Weekly Planner',
      completedTasks: 'Completed Tasks', showCompleted: 'Show Completed', hideCompleted: 'Hide Completed',
      list: 'List', cancel: 'Cancel',
    },
    ar: {
      appName: 'Study+', focus: 'التركيز', break: 'استراحة', tasks: 'المهام',
      stats: 'الإحصائيات', profile: 'الملف الشخصي', settings: 'الإعدادات', account: 'الحساب',
      contact: 'اتصل بنا', privacy: 'سياسة الخصوصية', help: 'المساعدة', signOut: 'تسجيل الخروج',
      signInGoogle: 'تسجيل الدخول بجوجل', signInPhone: 'تسجيل الدخول بالهاتف',
      streak: 'السلسلة', totalFocus: 'إجمالي التركيز', deepWork: 'عمل عميق',
      restRecover: 'راحة واستشفاء', focusingSession: 'جلسة تركيز', breakTime: 'وقت الاستراحة',
      focusingSessionDesc: 'قلل المشتتات وانغمس في تدفق ذهني عميق.',
      breakTimeDesc: 'خذ لحظة للراحة والتجديد.',
      focusMin: 'التركيز (دقيقة)', breakMin: 'الاستراحة (دقيقة)', language: 'اللغة',
      permissions: 'الأذونات', bgTimer: 'المؤقت في الخلفية',
      focusComplete: 'اكتملت جلسة التركيز!', focusCompleteBody: 'حان وقت استراحة مستحقة.',
      breakComplete: 'انتهت الاستراحة!', breakCompleteBody: 'هل أنت مستعد للعودة؟',
      myTasks: 'مهامي', addTask: 'إضافة مهمة', taskPlaceholder: 'ما الذي تعمل عليه؟',
      noTasks: 'لا توجد مهام بعد. أضف واحدة للبدء!',
      high: 'عالية', normal: 'عادية', low: 'منخفضة', completed: 'مكتملة', active: 'نشطة',
      weeklyProgress: 'التقدم الأسبوعي', studyHours: 'ساعات المذاكرة', tasksCompleted: 'المهام المكتملة',
      focusDistribution: 'توزيع التركيز', themeCenter: 'مركز السمات',
      emailAddress: 'البريد الإلكتروني', timezone: 'المنطقة الزمنية', saveChanges: 'حفظ التغييرات',
      resetAllData: 'إعادة تعيين البيانات', version: 'الإصدار', level: 'المستوى',
      member: 'عضو التركيز', days: 'أيام', menu: 'القائمة', emailUs: 'راسلنا', callUs: 'اتصل بنا',
      contactDesc: 'يسعدنا سماع رأيك.',
      privacyTitle: 'خصوصيتك تهمنا.',
      dataCollection: 'البيانات', dataCollectionDesc: 'بياناتك محفوظة على جهازك فقط.',
      usage: 'الاستخدام', usageDesc: 'بياناتك لا تُشارك مع أحد.',
      cookies: 'التخزين', cookiesDesc: 'نستخدم التخزين المحلي لحفظ بياناتك.',
      helpQ1: 'كيف تعمل السلسلة؟', helpA1: 'تزداد كل يوم تكمل فيه جلسة تركيز.',
      helpQ2: 'هل يعمل بدون إنترنت؟', helpA2: 'نعم! كل شيء محفوظ على جهازك.',
      helpQ3: 'كيف أخصص المؤقت؟', helpA3: 'اذهب لتبويب التركيز واضبط المدد.',
      mon: 'إثنين', tue: 'ثلاثاء', wed: 'أربعاء', thu: 'خميس', fri: 'جمعة', sat: 'سبت', sun: 'أحد',
      todayProgress: 'تقدم اليوم', momentumDesc: 'حافظ على الزخم!',
      h: 'س', m: 'د', tasksDone: 'المهام المنجزة', weeklyPlanner: 'التخطيط الأسبوعي',
      completedTasks: 'المهام المكتملة', showCompleted: 'عرض المكتملة', hideCompleted: 'إخفاء المكتملة',
      list: 'قائمة', cancel: 'إلغاء',
    },
    de: { focus: 'Fokus', break: 'Pause', tasks: 'Aufgaben', stats: 'Statistiken', profile: 'Profil', settings: 'Einstellungen', account: 'Konto', contact: 'Kontakt', privacy: 'Datenschutz', help: 'Hilfe', signOut: 'Abmelden', language: 'Sprache', permissions: 'Berechtigungen', appName: 'Study+', myTasks: 'Meine Aufgaben', addTask: 'Aufgabe hinzufügen', streak: 'Serie', days: 'Tage', weeklyPlanner: 'Wochenplaner', completedTasks: 'Abgeschlossene', showCompleted: 'Zeigen', hideCompleted: 'Ausblenden', active: 'Aktiv', list: 'Liste', cancel: 'Abbrechen', saveChanges: 'Speichern', taskPlaceholder: 'Woran arbeitest du?', noTasks: 'Keine Aufgaben.', high: 'Hoch', normal: 'Normal', low: 'Niedrig', completed: 'Fertig', totalFocus: 'Fokuszeit', menu: 'Menü', h: 'h', m: 'm', tasksDone: 'Erledigt' },
    fr: { focus: 'Focus', break: 'Pause', tasks: 'Tâches', stats: 'Stats', profile: 'Profil', settings: 'Paramètres', account: 'Compte', contact: 'Contact', privacy: 'Confidentialité', help: 'Aide', signOut: 'Déconnexion', language: 'Langue', permissions: 'Autorisations', appName: 'Study+', myTasks: 'Mes Tâches', addTask: 'Ajouter', streak: 'Série', days: 'Jours', weeklyPlanner: 'Planificateur', completedTasks: 'Terminées', showCompleted: 'Afficher', hideCompleted: 'Masquer', active: 'Actif', list: 'Liste', cancel: 'Annuler', saveChanges: 'Enregistrer', taskPlaceholder: 'Sur quoi travaillez-vous?', noTasks: 'Aucune tâche.', high: 'Haute', normal: 'Normal', low: 'Basse', completed: 'Terminé', totalFocus: 'Focus total', menu: 'Menu', h: 'h', m: 'm', tasksDone: 'Faites' },
    it: { focus: 'Focus', break: 'Pausa', tasks: 'Compiti', stats: 'Statistiche', profile: 'Profilo', settings: 'Impostazioni', account: 'Account', contact: 'Contatti', privacy: 'Privacy', help: 'Aiuto', signOut: 'Esci', language: 'Lingua', permissions: 'Permessi', appName: 'Study+', myTasks: 'I Miei Compiti', addTask: 'Aggiungi', streak: 'Serie', days: 'Giorni', weeklyPlanner: 'Pianificatore', completedTasks: 'Completati', showCompleted: 'Mostra', hideCompleted: 'Nascondi', active: 'Attivo', list: 'Lista', cancel: 'Annulla', saveChanges: 'Salva', taskPlaceholder: 'Su cosa stai lavorando?', noTasks: 'Nessun compito.', high: 'Alta', normal: 'Normale', low: 'Bassa', completed: 'Completato', totalFocus: 'Focus totale', menu: 'Menu', h: 'h', m: 'm', tasksDone: 'Fatti' },
    zh: { focus: '专注', break: '休息', tasks: '任务', stats: '统计', profile: '个人资料', settings: '设置', account: '账户', contact: '联系', privacy: '隐私', help: '帮助', signOut: '退出', language: '语言', permissions: '权限', appName: 'Study+', myTasks: '我的任务', addTask: '添加任务', streak: '连续', days: '天', weeklyPlanner: '周计划', completedTasks: '已完成', showCompleted: '显示', hideCompleted: '隐藏', active: '进行中', list: '列表', cancel: '取消', saveChanges: '保存', taskPlaceholder: '你在做什么?', noTasks: '没有任务。', high: '高', normal: '普通', low: '低', completed: '完成', totalFocus: '总专注', menu: '菜单', h: '时', m: '分', tasksDone: '已完成' },
    ja: { focus: '集中', break: '休憩', tasks: 'タスク', stats: '統計', profile: 'プロフィール', settings: '設定', account: 'アカウント', contact: 'お問い合わせ', privacy: 'プライバシー', help: 'ヘルプ', signOut: 'ログアウト', language: '言語', permissions: '権限', appName: 'Study+', myTasks: 'マイタスク', addTask: '追加', streak: 'ストリーク', days: '日', weeklyPlanner: '週間', completedTasks: '完了', showCompleted: '表示', hideCompleted: '非表示', active: 'アクティブ', list: 'リスト', cancel: 'キャンセル', saveChanges: '保存', taskPlaceholder: '何をしていますか?', noTasks: 'タスクなし。', high: '高', normal: '普通', low: '低', completed: '完了', totalFocus: '合計', menu: 'メニュー', h: '時', m: '分', tasksDone: '完了' },
    hi: { focus: 'फोकस', break: 'ब्रेक', tasks: 'कार्य', stats: 'आंकड़े', profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', account: 'खाता', contact: 'संपर्क', privacy: 'गोपनीयता', help: 'सहायता', signOut: 'साइन आउट', language: 'भाषा', permissions: 'अनुमतियां', appName: 'Study+', myTasks: 'मेरे कार्य', addTask: 'जोड़ें', streak: 'क्रम', days: 'दिन', weeklyPlanner: 'साप्ताहिक', completedTasks: 'पूरे', showCompleted: 'दिखाएं', hideCompleted: 'छिपाएं', active: 'सक्रिय', list: 'सूची', cancel: 'रद्द', saveChanges: 'सहेजें', taskPlaceholder: 'क्या काम है?', noTasks: 'कोई कार्य नहीं।', high: 'उच्च', normal: 'सामान्य', low: 'कम', completed: 'पूरा', totalFocus: 'कुल फोकस', menu: 'मेनू', h: 'घ', m: 'मि', tasksDone: 'पूरे' },
    es: { focus: 'Enfoque', break: 'Descanso', tasks: 'Tareas', stats: 'Estadísticas', profile: 'Perfil', settings: 'Ajustes', account: 'Cuenta', contact: 'Contacto', privacy: 'Privacidad', help: 'Ayuda', signOut: 'Cerrar sesión', language: 'Idioma', permissions: 'Permisos', appName: 'Study+', myTasks: 'Mis Tareas', addTask: 'Añadir', streak: 'Racha', days: 'Días', weeklyPlanner: 'Planificador', completedTasks: 'Completadas', showCompleted: 'Mostrar', hideCompleted: 'Ocultar', active: 'Activo', list: 'Lista', cancel: 'Cancelar', saveChanges: 'Guardar', taskPlaceholder: '¿En qué trabajas?', noTasks: 'Sin tareas.', high: 'Alta', normal: 'Normal', low: 'Baja', completed: 'Completado', totalFocus: 'Foco total', menu: 'Menú', h: 'h', m: 'm', tasksDone: 'Hechas' },
    ru: { focus: 'Фокус', break: 'Перерыв', tasks: 'Задачи', stats: 'Статистика', profile: 'Профиль', settings: 'Настройки', account: 'Аккаунт', contact: 'Контакт', privacy: 'Конфиденциальность', help: 'Помощь', signOut: 'Выйти', language: 'Язык', permissions: 'Разрешения', appName: 'Study+', myTasks: 'Мои Задачи', addTask: 'Добавить', streak: 'Серия', days: 'Дней', weeklyPlanner: 'Еженедельник', completedTasks: 'Завершённые', showCompleted: 'Показать', hideCompleted: 'Скрыть', active: 'Активно', list: 'Список', cancel: 'Отмена', saveChanges: 'Сохранить', taskPlaceholder: 'Над чем работаешь?', noTasks: 'Нет задач.', high: 'Высокий', normal: 'Обычный', low: 'Низкий', completed: 'Завершено', totalFocus: 'Всего фокуса', menu: 'Меню', h: 'ч', m: 'м', tasksDone: 'Сделано' },
  };

  const t = (key: string) =>
    translations[profile.language]?.[key] ?? translations['en']?.[key] ?? key;

  return (
    <AppContext.Provider value={{
      user: null,
      isAuthReady: true,
      profile, setProfile, updateProfile,
      tasks, setTasks, addTask, updateTask, deleteTask, reorderTasks,
      addFocusTime, signIn, logout,
      timerState, setTimerState, sessionSeconds,
      t,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}