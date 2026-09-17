import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvitationByToken, InvitationDetails } from '../api/invitations';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserPlus, 
  LogIn, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  FolderGit2, 
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { mode, setMode } = useThemeStore();
  const { 
    user: currentUser, 
    isAuthenticated, 
    loginWithInvitation, 
    registerWithInvitation,
    logout 
  } = useAuthStore();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active tab: 'register' for new users, 'login' for existing users
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError('El enlace de invitación no contiene un token válido.');
      setIsLoading(false);
      return;
    }

    getInvitationByToken(token)
      .then((data) => {
        setInvitation(data);
        if (data.email) {
          setRegEmail(data.email);
          // Suggest a default username from email prefix
          const suggestedUsername = data.email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
          setRegUsername(suggestedUsername);
        }
      })
      .catch((err) => {
        console.error('Error loading invitation:', err);
        const msg = err?.data?._error_message || err?.message || 'No se pudo encontrar la invitación o ya ha expirado.';
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  // Handle register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      await registerWithInvitation({
        token,
        fullName: fullName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      setSuccessMessage(`¡Bienvenido! Te has unido exitosamente a ${invitation.project_name}.`);
      setTimeout(() => {
        navigate(`/project/${invitation.project_slug}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error during invitation registration:', err);
      const msg =
        err?.data?._error_message ||
        err?.data?.username?.[0] ||
        err?.data?.email?.[0] ||
        err?.data?.password?.[0] ||
        err?.data?.detail ||
        (Array.isArray(err?.data?.non_field_errors) ? err.data.non_field_errors[0] : null) ||
        err?.message ||
        'Error al registrar la cuenta con la invitación.';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      await loginWithInvitation(loginUsername.trim(), loginPassword, token);
      setSuccessMessage(`¡Bienvenido! Te has unido exitosamente a ${invitation.project_name}.`);
      setTimeout(() => {
        navigate(`/project/${invitation.project_slug}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error during invitation login:', err);
      const msg =
        err?.data?._error_message ||
        err?.data?.detail ||
        err?.message ||
        'Error al iniciar sesión y aceptar la invitación. Verifica tus credenciales.';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Cargando invitación...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Invitación no válida
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {loadError || 'El enlace de invitación no es válido o ha expirado.'}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all"
          >
            <span>Ir al Inicio de Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top bar with logo and theme switch */}
      <div className="flex items-center justify-between max-w-xl w-full mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/30">
            T
          </div>
          <span>Taiga Planning</span>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          title="Cambiar tema"
        >
          {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main card */}
      <div className="max-w-xl w-full mx-auto my-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
              {invitation.invited_by?.full_name_display?.[0]?.toUpperCase() || 'T'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {invitation.invited_by?.full_name_display || invitation.invited_by?.username || 'Un administrador'} te ha invitado a:
              </p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <FolderGit2 className="w-5 h-5 text-brand-500" />
                <span>{invitation.project_name}</span>
              </h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Rol: {invitation.role_name}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {invitation.email}
            </span>
          </div>
        </div>

        {/* Action notices */}
        {actionError && (
          <div className="mx-6 sm:mx-8 mt-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 sm:mx-8 mt-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage} Redirigiendo...</span>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Tab selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setActionError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setActionError(null);
                if (currentUser && !loginUsername) {
                  setLoginUsername(currentUser.username);
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ya tengo cuenta</span>
            </button>
          </div>

          {/* Form: Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre de Usuario <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-bold text-sm absolute left-3.5 top-2.5">@</span>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                    placeholder="juanperez"
                    pattern="^[a-zA-Z0-9_.-]+$"
                    title="Solo letras, números, puntos, guiones y guiones bajos."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Identificador único para menciones y asignaciones.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMessage}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando cuenta y uniéndote...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear Cuenta y Unirme a {invitation.project_name}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Form: Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {isAuthenticated && currentUser && (
                <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Sesión activa: {currentUser.full_name_display || currentUser.username}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      @{currentUser.username} ({currentUser.email || 'sin email'})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-[11px] font-bold text-rose-500 hover:underline"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Usuario o Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="usuario o correo@ejemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMessage}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Iniciando sesión y aceptando invitación...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión y Unirme a {invitation.project_name}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-2">
        <span>Taiga Project Management &copy; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};
