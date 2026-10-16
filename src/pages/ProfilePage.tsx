import React, { useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { updateUser, changePassword, changeAvatar, removeAvatar } from '../api/users';
import { Navbar } from '../components/layout/Navbar';
import { ThemeDrawer } from '../components/theme/ThemeDrawer';
import { UserAvatar } from '../components/shared/UserAvatar';
import { CheckCircle2, AlertCircle, Loader2, Upload, Trash2, KeyRound, UserRound } from 'lucide-react';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5';
const cardClass = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4';
const buttonClass =
  'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold transition-colors';

type Feedback = { ok: boolean; text: string } | null;

const FeedbackLine: React.FC<{ feedback: Feedback }> = ({ feedback }) =>
  feedback ? (
    <p className={`flex items-center gap-1.5 text-xs font-semibold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'}`}>
      {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {feedback.text}
    </p>
  ) : null;

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      setUser(await updateUser(user.id, { full_name: fullName.trim(), bio }));
      setProfileFeedback({ ok: true, text: 'Perfil actualizado' });
    } catch (err: any) {
      setProfileFeedback({ ok: false, text: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatar = async (action: () => Promise<any>) => {
    setIsUploadingAvatar(true);
    setProfileFeedback(null);
    try {
      setUser(await action());
    } catch (err: any) {
      setProfileFeedback({ ok: false, text: err.message });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ ok: false, text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    setIsSavingPassword(true);
    setPasswordFeedback(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ ok: true, text: 'Contraseña actualizada' });
    } catch (err: any) {
      setPasswordFeedback({ ok: false, text: err.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onOpenThemeDrawer={() => setIsThemeDrawerOpen(true)} />

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Mi perfil</h1>

        {/* Profile */}
        <form onSubmit={handleSaveProfile} className={cardClass}>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <UserRound className="w-4 h-4 text-brand-500" /> Datos personales
          </h2>

          <div className="flex items-center gap-4">
            <UserAvatar name={user.full_name_display || user.username} photo={user.big_photo || user.photo} size="lg" />
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatar(() => changeAvatar(file));
                }}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Cambiar foto
              </button>
              {user.photo && (
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => handleAvatar(removeAvatar)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Usuario</label>
              <input value={user.username} disabled className={`${inputClass} opacity-60`} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={user.email || ''} disabled className={`${inputClass} opacity-60`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Biografía</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={210} className={inputClass} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <FeedbackLine feedback={profileFeedback} />
            <button type="submit" disabled={isSavingProfile || !fullName.trim()} className={`${buttonClass} ml-auto`}>
              {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>

        {/* Password */}
        <form onSubmit={handleChangePassword} className={cardClass}>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <KeyRound className="w-4 h-4 text-brand-500" /> Cambiar contraseña
          </h2>
          <div>
            <label className={labelClass}>Contraseña actual</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nueva contraseña</label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <FeedbackLine feedback={passwordFeedback} />
            <button type="submit" disabled={isSavingPassword} className={`${buttonClass} ml-auto`}>
              {isSavingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Actualizar contraseña
            </button>
          </div>
        </form>
      </div>

      <ThemeDrawer isOpen={isThemeDrawerOpen} onClose={() => setIsThemeDrawerOpen(false)} />
    </div>
  );
};
