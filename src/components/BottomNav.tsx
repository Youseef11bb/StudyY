import { Timer, ListTodo, BarChart2, User, Menu } from 'lucide-react';
import React from 'react';
import { useAppContext } from '../context/AppContext';

export type Tab = 'focus' | 'tasks' | 'stats' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  onMenuOpen: () => void;
  onNotificationsOpen?: () => void;
}

export function BottomNav({ activeTab, onChange, onMenuOpen }: BottomNavProps) {
  const { t } = useAppContext();

  const navItems: { id: Tab | 'menu'; label: string; icon: React.ElementType; action?: () => void }[] = [
    { id: 'focus', label: t('focus'), icon: Timer },
    { id: 'tasks', label: t('tasks'), icon: ListTodo },
    { id: 'stats', label: t('stats'), icon: BarChart2 },
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'menu', label: t('menu'), icon: Menu, action: onMenuOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 md:px-4 pb-4 md:pb-6 pt-2 bg-surface/80 backdrop-blur-xl shadow-[0_-12px_32px_-4px_rgba(44,42,81,0.08)] rounded-t-2xl">
      {navItems.map(({ id, label, icon: Icon, action }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => {
              if (action) {
                action();
              } else {
                onChange(id as Tab);
              }
            }}
            className={`flex flex-col items-center justify-center px-2 md:px-4 py-2 rounded-2xl transition-all duration-200 active:scale-90 relative ${
              isActive
                ? 'bg-surface-container-low text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Icon size={20} className="md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] md:text-[0.75rem] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
