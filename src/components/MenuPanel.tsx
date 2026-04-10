import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, User, Mail, Shield, HelpCircle, LogOut, MessageCircle, ChevronRight, Globe, Smartphone } from 'lucide-react';
import { useAppContext, Language } from '../context/AppContext';

interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'focus' | 'tasks' | 'stats' | 'profile') => void;
}

type SubView = 'main' | 'settings' | 'contact' | 'privacy' | 'help';

export function MenuPanel({ isOpen, onClose, onNavigate }: MenuPanelProps) {
  const { user, profile, updateProfile, logout, t } = useAppContext();
  const [subView, setSubView] = useState<SubView>('main');

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' },
    { code: 'ru', name: 'Русский' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-85 bg-surface z-[70] shadow-2xl p-6 flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {subView !== 'main' && (
                  <button onClick={() => setSubView('main')} className="p-2 hover:bg-surface-container-low rounded-full">
                    <X size={20} className="rotate-90" />
                  </button>
                )}
                <h2 className="font-headline text-2xl font-bold text-primary">
                  {subView === 'main' ? t('menu') || 'Menu' : t(subView)}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1">
              {subView === 'main' && (
                <nav className="space-y-2">
                  <MenuButton icon={<Settings size={20} />} label={t('settings')} onClick={() => setSubView('settings')} />
                  <MenuButton icon={<User size={20} />} label={t('account')} onClick={() => { onNavigate('profile'); onClose(); }} />
                  <MenuButton icon={<Mail size={20} />} label={t('contact')} onClick={() => setSubView('contact')} />
                  <div className="h-px bg-outline-variant/30 my-4" />
                  <MenuButton icon={<Shield size={20} />} label={t('privacy')} onClick={() => setSubView('privacy')} />
                  <MenuButton icon={<HelpCircle size={20} />} label={t('help')} onClick={() => setSubView('help')} />
                </nav>
              )}

              {subView === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      <Globe size={14} /> {t('language')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => updateProfile({ language: lang.code })}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${profile.language === lang.code ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      <Shield size={14} /> {t('permissions')}
                    </label>
                    <div className="space-y-2">
                      <PermissionToggle 
                        icon={<Smartphone size={18} />} 
                        label={t('bgTimer')} 
                        active={profile.permissions.backgroundTimer}
                        onToggle={() => updateProfile({ permissions: { ...profile.permissions, backgroundTimer: !profile.permissions.backgroundTimer } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {subView === 'contact' && (
                <div className="space-y-4">
                  <p className="text-on-surface-variant text-sm mb-6">{t('contactDesc')}</p>
                  <a href="mailto:studypluse11@gmail.com" className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="font-bold">{t('emailUs')}</p>
                      <p className="text-xs text-on-surface-variant">studypluse11@gmail.com</p>
                    </div>
                  </a>
                  <a href="tel:+201148796654" className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <p className="font-bold">{t('callUs')}</p>
                      <p className="text-xs text-on-surface-variant">+20 114 879 6654</p>
                    </div>
                  </a>
                </div>
              )}

              {subView === 'privacy' && (
                <div className="prose prose-sm text-on-surface-variant space-y-4">
                  <p>{t('privacyTitle')}</p>
                  <h4 className="font-bold text-on-surface">{t('dataCollection')}</h4>
                  <p>{t('dataCollectionDesc')}</p>
                  <h4 className="font-bold text-on-surface">{t('usage')}</h4>
                  <p>{t('usageDesc')}</p>
                  <h4 className="font-bold text-on-surface">{t('cookies')}</h4>
                  <p>{t('cookiesDesc')}</p>
                </div>
              )}

              {subView === 'help' && (
                <div className="space-y-4">
                  <HelpItem 
                    q={t('helpQ1')} 
                    a={t('helpA1')} 
                  />
                  <HelpItem 
                    q={t('helpQ2')} 
                    a={t('helpA2')} 
                  />
                  <HelpItem 
                    q={t('helpQ3')} 
                    a={t('helpA3')} 
                  />
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-outline-variant/30 space-y-4">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{profile.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{profile.email}</p>
                </div>
              </div>
              {user && (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/5 rounded-xl transition-colors font-medium"
                >
                  <LogOut size={20} />
                  {t('signOut')}
                </button>
              )}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <a 
                href="https://wa.me/201148796654" 
                target="_blank" 
                rel="noreferrer"
                className="p-3 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
              >
                <MessageCircle size={24} fill="currentColor" />
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-surface-container-low transition-colors text-on-surface font-medium group"
    >
      <div className="flex items-center gap-4">
        <span className="text-on-surface-variant group-hover:text-primary transition-colors">
          {icon}
        </span>
        {label}
      </div>
      <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all" />
    </button>
  );
}

function PermissionToggle({ icon, label, active, onToggle }: { icon: React.ReactNode; label: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low">
      <div className="flex items-center gap-3">
        <span className="text-on-surface-variant">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-primary' : 'bg-outline-variant'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  );
}

function HelpItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-outline-variant/30 pb-3">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left py-2 font-bold text-sm">
        {q}
        <ChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.p 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-xs text-on-surface-variant overflow-hidden"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
