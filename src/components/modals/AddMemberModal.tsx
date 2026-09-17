import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { createMembership } from '../../api/memberships';
import { getRoles } from '../../api/roles';
import { ProjectMember, RoleItem } from '../../types/taiga';
import { 
  X, 
  Loader2, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Briefcase, 
  AlertCircle 
} from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: (member: ProjectMember) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
}) => {
  const { currentProject } = useProjectStore();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentProject) {
      setEmail('');
      setIsAdmin(false);
      setErrorMessage(null);

      // Fetch latest roles for this project
      getRoles(currentProject.id)
        .then((data) => {
          setRoles(data);
          if (data.length > 0) {
            setRoleId(data[0].id);
          }
        })
        .catch((err) => {
          console.warn('Could not load roles, fallback to project.roles', err);
          if (currentProject.roles && currentProject.roles.length > 0) {
            setRoles(currentProject.roles);
            setRoleId(currentProject.roles[0].id);
          }
        });
    }
  }, [isOpen, currentProject]);

  if (!isOpen || !currentProject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !roleId || !currentProject) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const userIdentifier = email.trim();
      const created = await createMembership({
        project: currentProject.id,
        username: userIdentifier,
        email: userIdentifier,
        role: Number(roleId),
        is_admin: isAdmin,
      });

      onMemberAdded(created);
      onClose();
    } catch (err: any) {
      console.error('Error adding member:', err);
      const msg =
        err?.data?._error_message ||
        err?.data?.username?.[0] ||
        err?.data?.email?.[0] ||
        err?.data?.detail ||
        (Array.isArray(err?.data?.non_field_errors) ? err.data.non_field_errors[0] : null) ||
        err?.message ||
        'Error al invitar al miembro';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nuevo Miembro
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invitar colaborador a {currentProject.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Correo electrónico o Usuario <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej. usuario o correo@empresa.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Rol Asignado <span className="text-rose-500">*</span></span>
            </label>
            <select
              required
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Admin toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Permisos de Administrador
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acceso a configuración y administración del proyecto
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAdmin}
              onClick={() => setIsAdmin(!isAdmin)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                isAdmin ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAdmin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !roleId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Invitando...' : 'Invitar Miembro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
