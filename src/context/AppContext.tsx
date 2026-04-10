import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, db, onAuthStateChanged, signInWithPopup, googleProvider, signOut, User,
  doc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, orderBy, writeBatch,
  OperationType, handleFirestoreError
} from '../lib/firebase';
import { playSound, SOUNDS } from '../lib/sounds';

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
  user: User | null;
  isAuthReady: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (newTasks: Task[]) => void;
  addFocusTime: (minutes: number) => void;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  timerState: TimerState;
  setTimerState: (state: Partial<TimerState>) => void;
  sessionSeconds: number;
  t: (key: string) => string;
}

const getInitialLanguage = (): Language => {
  const lang = navigator.language.split('-')[0];
  const supported: Language[] = ['en', 'ar', 'de', 'fr', 'it', 'zh', 'ja', 'hi', 'es', 'ru'];
  return supported.includes(lang as Language) ? (lang as Language) : 'en';
};

const defaultProfile: UserProfile = {
  name: 'Study Master',
  email: 'master@cognitive.io',
  timezone: 'UTC -05:00 (EST)',
  focusHours: 0,
  tasksDone: 0,
  streak: 0,
  theme: 'light',
  language: getInitialLanguage(),
  focusDuration: 25,
  breakDuration: 5,
  bio: 'Deep focus enthusiast & Digital Architect. Optimizing cognitive workflows.',
  permissions: {
    backgroundTimer: true,
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('studyplus_guest_profile');
    if (saved) return { ...defaultProfile, ...JSON.parse(saved) };
    return defaultProfile;
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);

  useEffect(() => {
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = profile.language;
  }, [profile.language]);

  const [timerState, setTimerStateInternal] = useState<TimerState>(() => {
    const saved = localStorage.getItem('studyplus_timer');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isPlaying && parsed.lastUpdate) {
        const elapsed = Math.floor((Date.now() - parsed.lastUpdate) / 1000);
        return {
          ...parsed,
          timeLeft: Math.max(0, parsed.timeLeft - elapsed),
          lastUpdate: Date.now()
        };
      }
      return parsed;
    }
    return { mode: 'focus', isPlaying: false, timeLeft: 25 * 60, lastUpdate: Date.now() };
  });

  const setTimerState = (updates: Partial<TimerState>) => {
    setTimerStateInternal(prev => {
      const newState = { ...prev, ...updates, lastUpdate: Date.now() };
      localStorage.setItem('studyplus_timer', JSON.stringify(newState));
      return newState;
    });
  };

  // Translations
  const translations: Record<Language, Record<string, string>> = {
    en: {
      appName: 'Study+',
      focus: 'Focus',
      break: 'Break',
      tasks: 'Tasks',
      stats: 'Stats',
      profile: 'Profile',
      settings: 'Settings',
      account: 'Account',
      contact: 'Contact Us',
      privacy: 'Privacy Policy',
      help: 'Help & FAQ',
      signOut: 'Sign Out',
      signInGoogle: 'Sign in with Google',
      signInPhone: 'Sign in with Phone',
      streak: 'Streak',
      totalFocus: 'Total Focus',
      deepWork: 'Deep Work',
      restRecover: 'Rest & Recover',
      focusingSession: 'Focusing Session',
      breakTime: 'Break Time',
      focusingSessionDesc: 'Minimize distractions and engage in cognitive flow.',
      breakTimeDesc: 'Take a moment to rest, stretch, and recharge.',
      focusMin: 'Focus (min)',
      breakMin: 'Break (min)',
      language: 'Language',
      permissions: 'Permissions',
      bgTimer: 'Background Timer',
      focusComplete: 'Focus Session Complete!',
      focusCompleteBody: 'Time for a well-deserved break.',
      breakComplete: 'Break Over!',
      breakCompleteBody: 'Ready to get back to work?',
      myTasks: 'My Tasks',
      addTask: 'Add Task',
      taskPlaceholder: 'What are you working on?',
      noTasks: 'No tasks for today. Add one to get started!',
      high: 'High',
      normal: 'Normal',
      low: 'Low',
      completed: 'Completed',
      active: 'Active',
      weeklyProgress: 'Weekly Progress',
      studyHours: 'Study Hours',
      tasksCompleted: 'Tasks Completed',
      focusDistribution: 'Focus Distribution',
      themeCenter: 'Theme Center',
      emailAddress: 'Email Address',
      timezone: 'Timezone',
      saveChanges: 'Save Changes',
      resetAllData: 'Reset All Data',
      version: 'Version',
      level: 'Level',
      member: 'Focus Member',
      days: 'Days',
      menu: 'Menu',
      emailUs: 'Email Us',
      callUs: 'Call Us',
      contactDesc: "We'd love to hear from you. Choose your preferred method of contact:",
      privacyTitle: 'Your privacy is important to us. Study+ is designed to help you focus while keeping your data secure.',
      dataCollection: 'Data Collection',
      dataCollectionDesc: 'We collect minimal data required for synchronization, including your profile info and tasks. This data is stored securely using Firebase.',
      usage: 'Usage',
      usageDesc: 'Your data is never shared with third parties. We use it only to provide the core features of the app, such as streak tracking and cloud sync.',
      cookies: 'Cookies',
      cookiesDesc: 'We use local storage and essential cookies to maintain your session and preferences.',
      helpQ1: 'How does the streak work?',
      helpA1: 'Your streak increases every day you complete at least one focus session. If you miss a day, it resets.',
      helpQ2: 'Can I use it offline?',
      helpA2: "Yes! Your data is saved locally and will sync to the cloud once you're back online.",
      helpQ3: 'How to customize the timer?',
      helpA3: 'Go to the Focus tab and use the inputs at the bottom to set your preferred durations.',
      mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
      todayProgress: "Today's Progress",
      momentumDesc: "Keep the momentum going! You're doing great.",
      h: 'h',
      m: 'm',
      tasksDone: 'Tasks Done',
      weeklyPlanner: 'Weekly Planner',
      completedTasks: 'Completed Tasks',
      showCompleted: 'Show Completed',
      hideCompleted: 'Hide Completed'
    },
    ar: {
      appName: 'Study+',
      focus: 'التركيز',
      break: 'استراحة',
      tasks: 'المهام',
      stats: 'الإحصائيات',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      account: 'الحساب',
      contact: 'اتصل بنا',
      privacy: 'سياسة الخصوصية',
      help: 'المساعدة والأسئلة الشائعة',
      signOut: 'تسجيل الخروج',
      signInGoogle: 'تسجيل الدخول بجوجل',
      signInPhone: 'تسجيل الدخول بالهاتف',
      streak: 'السلسلة',
      totalFocus: 'إجمالي التركيز',
      deepWork: 'عمل عميق',
      restRecover: 'راحة واستشفاء',
      focusingSession: 'جلسة تركيز',
      breakTime: 'وقت الاستراحة',
      focusingSessionDesc: 'قلل المشتتات وانغمس في تدفق ذهني عميق.',
      breakTimeDesc: 'خذ لحظة للراحة، التمدد، وتجديد طاقتك.',
      focusMin: 'التركيز (دقيقة)',
      breakMin: 'الاستراحة (دقيقة)',
      language: 'اللغة',
      permissions: 'الأذونات',
      bgTimer: 'المؤقت في الخلفية',
      focusComplete: 'اكتملت جلسة التركيز!',
      focusCompleteBody: 'حان وقت استراحة مستحقة.',
      breakComplete: 'انتهت الاستراحة!',
      breakCompleteBody: 'هل أنت مستعد للعودة للعمل؟',
      myTasks: 'مهامي',
      addTask: 'إضافة مهمة',
      taskPlaceholder: 'ما الذي تعمل عليه؟',
      noTasks: 'لا توجد مهام اليوم. أضف واحدة للبدء!',
      high: 'عالية',
      normal: 'عادية',
      low: 'منخفضة',
      completed: 'مكتملة',
      active: 'نشطة',
      weeklyProgress: 'التقدم الأسبوعي',
      studyHours: 'ساعات المذاكرة',
      tasksCompleted: 'المهام المكتملة',
      focusDistribution: 'توزيع التركيز',
      themeCenter: 'مركز السمات',
      emailAddress: 'البريد الإلكتروني',
      timezone: 'المنطقة الزمنية',
      saveChanges: 'حفظ التغييرات',
      resetAllData: 'إعادة تعيين كافة البيانات',
      version: 'الإصدار',
      level: 'المستوى',
      member: 'عضو التركيز',
      days: 'أيام',
      menu: 'القائمة',
      emailUs: 'راسلنا عبر البريد',
      callUs: 'اتصل بنا',
      contactDesc: 'يسعدنا سماع رأيك. اختر وسيلة التواصل المفضلة لديك:',
      privacyTitle: 'خصوصيتك تهمنا. تم تصميم Study+ لمساعدتك على التركيز مع الحفاظ على أمان بياناتك.',
      dataCollection: 'جمع البيانات',
      dataCollectionDesc: 'نجمع الحد الأدنى من البيانات المطلوبة للمزامنة، بما في ذلك معلومات ملفك الشخصي ومهامك. يتم تخزين هذه البيانات بشكل آمن باستخدام Firebase.',
      usage: 'الاستخدام',
      usageDesc: 'لا يتم مشاركة بياناتك أبداً مع أطراف ثالثة. نستخدمها فقط لتوفير الميزات الأساسية للتطبيق، مثل تتبع السلسلة والمزامنة السحابية.',
      cookies: 'ملفات تعريف الارتباط',
      cookiesDesc: 'نستخدم التخزين المحلي وملفات تعريف الارتباط الأساسية للحفاظ على جلستك وتفضيلاتك.',
      helpQ1: 'كيف تعمل السلسلة؟',
      helpA1: 'تزداد سلسلتك كل يوم تكمل فيه جلسة تركيز واحدة على الأقل. إذا فاتك يوم، فسيتم إعادة تعيينها.',
      helpQ2: 'هل يمكنني استخدامه بدون إنترنت؟',
      helpA2: 'نعم! يتم حفظ بياناتك محلياً وستتم مزامنتها مع السحابة بمجرد عودتك للاتصال بالإنترنت.',
      helpQ3: 'كيف يمكنني تخصيص المؤقت؟',
      helpA3: 'انتقل إلى علامة تبويب التركيز واستخدم المدخلات في الأسفل لتعيين المدد المفضلة لديك.',
      mon: 'إثنين', tue: 'ثلاثاء', wed: 'أربعاء', thu: 'خميس', fri: 'جمعة', sat: 'سبت', sun: 'أحد',
      todayProgress: 'تقدم اليوم',
      momentumDesc: 'حافظ على الزخم! أنت تبلي بلاءً حسناً.',
      h: 'س',
      m: 'د',
      tasksDone: 'المهام المنجزة',
      weeklyPlanner: 'التخطيط الأسبوعي',
      completedTasks: 'المهام المكتملة',
      showCompleted: 'عرض المكتملة',
      hideCompleted: 'إخفاء المكتملة'
    },
    de: { focus: 'Fokus', break: 'Pause', tasks: 'Aufgaben', stats: 'Statistiken', profile: 'Profil', settings: 'Einstellungen', account: 'Konto', contact: 'Kontakt', privacy: 'Datenschutz', help: 'Hilfe', signOut: 'Abmelden', language: 'Sprache', permissions: 'Berechtigungen', appName: 'Study+', myTasks: 'Meine Aufgaben', addTask: 'Aufgabe hinzufügen', streak: 'Serie', days: 'Tage', weeklyPlanner: 'Wochenplaner', completedTasks: 'Abgeschlossene Aufgaben', showCompleted: 'Abgeschlossene anzeigen', hideCompleted: 'Abgeschlossene ausblenden', active: 'Aktiv' },
    fr: { focus: 'Focus', break: 'Pause', tasks: 'Tâches', stats: 'Stats', profile: 'Profil', settings: 'Paramètres', account: 'Compte', contact: 'Contact', privacy: 'Confidentialité', help: 'Aide', signOut: 'Déconnexion', language: 'Langue', permissions: 'Autorisations', appName: 'Study+', myTasks: 'Mes Tâches', addTask: 'Ajouter une tâche', streak: 'Série', days: 'Jours', weeklyPlanner: 'Planificateur hebdomadaire', completedTasks: 'Tâches terminées', showCompleted: 'Afficher les terminées', hideCompleted: 'Masquer les terminées', active: 'Actif' },
    it: { focus: 'Focus', break: 'Pausa', tasks: 'Compiti', stats: 'Statistiche', profile: 'Profilo', settings: 'Impostazioni', account: 'Account', contact: 'Contatti', privacy: 'Privacy', help: 'Aiuto', signOut: 'Esci', language: 'Lingua', permissions: 'Permessi', appName: 'Study+', myTasks: 'I Miei Compiti', addTask: 'Aggiungi Compito', streak: 'Serie', days: 'Giorni', weeklyPlanner: 'Pianificatore settimanale', completedTasks: 'Compiti completati', showCompleted: 'Mostra completati', hideCompleted: 'Nascondi completati', active: 'Attivo' },
    zh: { focus: '专注', break: '休息', tasks: '任务', stats: '统计', profile: '个人资料', settings: '设置', account: '账户', contact: '联系我们', privacy: '隐私政策', help: '帮助', signOut: '退出', language: '语言', permissions: '权限', appName: 'Study+', myTasks: '我的任务', addTask: '添加任务', streak: '连续', days: '天', weeklyPlanner: '周计划', completedTasks: '已完成任务', showCompleted: '显示已完成', hideCompleted: '隐藏已完成', active: '进行中' },
    ja: { focus: '集中', break: '休憩', tasks: 'タスク', stats: '統計', profile: 'プロフィール', settings: '設定', account: 'アカウント', contact: 'お問い合わせ', privacy: 'プライバシー', help: 'ヘルプ', signOut: 'ログアウト', language: '言語', permissions: '権限', appName: 'Study+', myTasks: 'マイタスク', addTask: 'タスクを追加', streak: 'ストリーク', days: '日', weeklyPlanner: '週間プランナー', completedTasks: '完了したタスク', showCompleted: '完了を表示', hideCompleted: '完了を非表示', active: 'アクティブ' },
    hi: { focus: 'फोकस', break: 'ब्रेक', tasks: 'कार्य', stats: 'आंकड़े', profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', account: 'खाता', contact: 'संपर्क करें', privacy: 'गोपनीयता', help: 'सहायता', signOut: 'साइन आउट', language: 'भाषा', permissions: 'अनुमतियां', appName: 'Study+', myTasks: 'मेरे कार्य', addTask: 'कार्य जोड़ें', streak: 'क्रम', days: 'दिन', weeklyPlanner: 'साप्ताहिक योजनाकार', completedTasks: 'पूरे किए गए कार्य', showCompleted: 'पूरे किए गए दिखाएं', hideCompleted: 'पूरे किए गए छिपाएं', active: 'सक्रिय' },
    es: { focus: 'Enfoque', break: 'Descanso', tasks: 'Tareas', stats: 'Estadísticas', profile: 'Perfil', settings: 'Ajustes', account: 'Cuenta', contact: 'Contacto', privacy: 'Privacidad', help: 'Ayuda', signOut: 'Cerrar sesión', language: 'Idioma', permissions: 'Permisos', appName: 'Study+', myTasks: 'Mis Tareas', addTask: 'Añadir Tarea', streak: 'Racha', days: 'Días', weeklyPlanner: 'Planificador semanal', completedTasks: 'Tareas completadas', showCompleted: 'Mostrar completadas', hideCompleted: 'Ocultار completadas', active: 'Activo' },
    ru: { focus: 'Фокус', break: 'Перерыв', tasks: 'Задачи', stats: 'Статистика', profile: 'Профиль', settings: 'Настройки', account: 'Аккаунт', contact: 'Контакт', privacy: 'Конфиденциальность', help: 'Помощь', signOut: 'Выйти', language: 'Язык', permissions: 'Разрешения', appName: 'Study+', myTasks: 'Мои Задачи', addTask: 'Добавить Задачу', streak: 'Серия', days: 'Дней', weeklyPlanner: 'Еженедельник', completedTasks: 'Завершенные задачи', showCompleted: 'Показать завершенные', hideCompleted: 'Скрыть завершенные', active: 'Активно' },
  };

  const t = (key: string) => {
    return translations[profile.language][key] || translations['en'][key] || key;
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Profile Sync
  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      return;
    }

    const profileRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          ...defaultProfile,
          ...data,
          permissions: {
            ...defaultProfile.permissions,
            ...(data.permissions || {})
          }
        } as UserProfile);
      } else {
        // Initialize profile for new user
        const newProfile: UserProfile = {
          ...defaultProfile,
          name: user.displayName || 'User',
          email: user.email || '',
        };
        setDoc(profileRef, newProfile).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Tasks Sync
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('userId', '==', user.uid), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    return () => unsubscribe();
  }, [user]);

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.isPlaying && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerStateInternal(prev => {
          const newState = { ...prev, timeLeft: prev.timeLeft - 1, lastUpdate: Date.now() };
          localStorage.setItem('studyplus_timer', JSON.stringify(newState));
          return newState;
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
    return () => {
      clearInterval(interval);
      if (!timerState.isPlaying && timerState.mode === 'focus' && sessionSecondsRef.current > 0) {
        addFocusTime(sessionSecondsRef.current / 60);
        sessionSecondsRef.current = 0;
        setSessionSeconds(0);
      }
    };
  }, [timerState.isPlaying, timerState.timeLeft, timerState.mode, profile.focusDuration, profile.breakDuration]);

  useEffect(() => {
    document.documentElement.className = profile.theme === 'light' ? '' : `theme-${profile.theme}`;
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = profile.language;
  }, [profile.theme, profile.language]);

  useEffect(() => {
    if (!user && isAuthReady) {
      localStorage.setItem('studyplus_guest_profile', JSON.stringify(profile));
    }
  }, [profile, user, isAuthReady]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates,
      permissions: {
        ...prev.permissions,
        ...(updates.permissions || {})
      }
    }));

    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(profileRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'completed'>) => {
    if (!user) return;
    const tasksRef = collection(db, 'tasks');
    const taskId = Math.random().toString(36).substr(2, 9);
    const newTask = {
      ...task,
      userId: user.uid,
      completed: false,
      order: tasks.length,
      time: task.time || `${new Date().getHours()}:00`,
    };
    try {
      await setDoc(doc(tasksRef, taskId), newTask);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const taskRef = doc(db, 'tasks', id);
    try {
      await updateDoc(taskRef, updates);
      if (updates.completed === true) {
        playSound(SOUNDS.TASK_COMPLETE);
        await updateDoc(doc(db, 'users', user.uid), { tasksDone: profile.tasksDone + 1 });
      } else if (updates.completed === false) {
        await updateDoc(doc(db, 'users', user.uid), { tasksDone: Math.max(0, profile.tasksDone - 1) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const reorderTasks = async (newTasks: Task[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    newTasks.forEach((task, index) => {
      const taskRef = doc(db, 'tasks', task.id);
      batch.update(taskRef, { order: index });
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks/reorder');
    }
  };

  const addFocusTime = async (minutes: number) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = profile.streak;
    if (profile.lastStudyDate === yesterday) {
      newStreak += 1;
    } else if (profile.lastStudyDate !== today) {
      newStreak = 1;
    }
    
    const updates = {
      focusHours: Math.round((profile.focusHours + minutes / 60) * 100) / 100,
      streak: newStreak,
      lastStudyDate: today
    };

    setProfile(prev => ({ ...prev, ...updates }));

    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, isAuthReady,
      profile, setProfile, updateProfile, 
      tasks, setTasks, addTask, updateTask, deleteTask, reorderTasks,
      addFocusTime, signIn, logout,
      timerState, setTimerState, sessionSeconds,
      t 
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
