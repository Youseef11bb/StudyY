import { motion } from 'motion/react';
import { Pencil, CheckCircle2, Plus, ChevronDown, Save, Trash2, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export function ProfileView() {
  const { user, profile, updateProfile, signIn, logout, t } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editBio, setEditBio] = useState(profile.bio);

  useEffect(() => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditBio(profile.bio);
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      name: editName,
      email: editEmail,
      bio: editBio,
    });
    setIsEditing(false);
  };

  const themes = [
    { id: 'light', name: 'Light Mode', colors: 'from-[#f8fafc] to-[#e2e8f0]', text: 'text-slate-800' },
    { id: 'dark', name: 'Dark Mode', colors: 'from-[#0f172a] to-[#1e293b]', text: 'text-white' },
    { id: 'emerald', name: 'Emerald Oasis', colors: 'from-[#006859] to-[#68fadd]', text: 'text-white' },
    { id: 'sunset', name: 'Sunset Amber', colors: 'from-[#9b3f00] to-[#ff955e]', text: 'text-white' },
    { id: 'crimson', name: 'Crimson Focus', colors: 'from-[#b41340] to-[#f74b6d]', text: 'text-white' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-8 space-y-12"
    >
      {/* Profile Hero */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
        <div className="relative group">
          <div className="w-28 h-28 md:w-48 md:h-48 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden ambient-shadow bg-surface-container-lowest flex items-center justify-center text-5xl md:text-6xl font-bold text-primary bg-primary-container">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary text-on-primary p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-lg active:scale-90 transition-transform"
          >
            <Pencil size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
        
        <div className="flex-1 space-y-4 w-full">
          <div className="space-y-1">
            <span className="text-primary font-bold tracking-widest text-[0.7rem] md:text-[0.75rem] uppercase">
              {t('member')} • {t('level')} {Math.floor(profile.focusHours / 10) + 1}
            </span>
            {isEditing ? (
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-3xl md:text-5xl font-headline font-bold text-on-surface bg-surface-container-low border-none rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-primary outline-none text-center md:text-left"
              />
            ) : (
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">{profile.name}</h2>
            )}
            {isEditing ? (
              <textarea 
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="text-on-surface-variant text-base md:text-lg bg-surface-container-low border-none rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-primary outline-none resize-none h-24 text-center md:text-left"
              />
            ) : (
              <p className="text-on-surface-variant text-base md:text-lg">
                {profile.bio}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2 md:pt-4">
            <div className="bg-surface-container-low px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex-1 md:flex-none min-w-[100px]">
              <span className="block text-on-surface-variant text-[10px] md:text-xs mb-0.5 md:mb-1">{t('totalFocus')}</span>
              <span className="text-lg md:text-xl font-headline font-bold text-primary">{profile.focusHours.toFixed(1)}h</span>
            </div>
            <div className="bg-surface-container-low px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex-1 md:flex-none min-w-[100px]">
              <span className="block text-on-surface-variant text-[10px] md:text-xs mb-0.5 md:mb-1">{t('tasks')}</span>
              <span className="text-lg md:text-xl font-headline font-bold text-primary">{profile.tasksDone}</span>
            </div>
            <div className="bg-surface-container-low px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex-1 md:flex-none min-w-[100px]">
              <span className="block text-on-surface-variant text-[10px] md:text-xs mb-0.5 md:mb-1">{t('streak')}</span>
              <span className="text-lg md:text-xl font-headline font-bold text-secondary">{profile.streak} {t('days')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Theme Center */}
        <div className="md:col-span-8 bg-surface-container-low rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl md:text-2xl font-headline font-bold">{t('themeCenter')}</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {themes.map((theme) => (
              <div 
                key={theme.id}
                onClick={() => updateProfile({ theme: theme.id as any })}
                className={`group relative aspect-video rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-transform bg-gradient-to-br ${theme.colors} ${profile.theme === theme.id ? 'ring-2 md:ring-4 ring-primary ring-offset-2 md:ring-offset-4 ring-offset-surface-container-low' : 'hover:scale-[1.02]'}`}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <span className={`${theme.text} font-bold text-[10px] md:text-sm tracking-wide text-center uppercase px-2`}>{theme.name}</span>
                </div>
                {profile.theme === theme.id && (
                  <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white rounded-full p-0.5 shadow-md text-primary">
                    <CheckCircle2 size={16} className="md:w-5 md:h-5" fill="currentColor" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 ambient-shadow flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-headline font-bold">{t('account')}</h3>
            <div className="space-y-4 md:space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('emailAddress')}</label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  />
                ) : (
                  <div className="bg-surface-container-low p-3 md:p-3.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium truncate mr-2">{profile.email}</span>
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2 md:space-y-3 pt-1 md:pt-2">
                {!user ? (
                  <>
                    <button 
                      onClick={signIn}
                      className="w-full flex items-center justify-center gap-3 py-2.5 md:py-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-medium text-xs md:text-sm"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 md:w-5 md:h-5" />
                      {t('signInGoogle')}
                    </button>
                    <button className="w-full flex items-center justify-center gap-3 py-2.5 md:py-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-medium text-xs md:text-sm">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-primary rounded flex items-center justify-center text-on-primary">
                        <span className="text-[8px] md:text-[10px]">#</span>
                      </div>
                      {t('signInPhone')}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 py-2.5 md:py-3 rounded-xl border border-error/20 text-error hover:bg-error/5 transition-colors font-medium text-xs md:text-sm"
                  >
                    <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                    {t('signOut')}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('timezone')}</label>
                <div className="bg-surface-container-low p-3 md:p-3.5 rounded-xl text-xs md:text-sm font-medium flex justify-between items-center cursor-pointer">
                  <span className="truncate mr-2">{profile.timezone}</span>
                  <ChevronDown size={16} className="flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
          {isEditing && (
            <button 
              onClick={handleSave}
              className="mt-6 md:mt-8 w-full bg-primary text-on-primary py-3.5 md:py-4 rounded-full font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <Save size={18} />
              {t('saveChanges')}
            </button>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <div className="flex justify-between items-center px-4 pt-4">
        <button 
          onClick={() => {
            // In a real app, use a custom modal instead of window.confirm
            localStorage.clear();
            window.location.reload();
          }}
          className="text-error font-bold flex items-center gap-2 hover:bg-error/5 px-4 py-2 rounded-xl transition-colors"
        >
          <Trash2 size={20} />
          {t('resetAllData')}
        </button>
        <p className="text-sm text-on-surface-variant">{t('version')} 1.0.0</p>
      </div>
    </motion.div>
  );
}
