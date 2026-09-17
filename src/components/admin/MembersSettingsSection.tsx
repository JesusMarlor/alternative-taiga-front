import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { updateMembership, deleteMembership, getProjectMemberships } from '../../api/memberships';
import { getRoles } from '../../api/roles';
import { ProjectMember, RoleItem } from '../../types/taiga';
import { UserAvatar } from '../shared/UserAvatar';
import { AddMemberModal } from '../modals/AddMemberModal';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Search, 
  Loader2, 
  AlertCircle, 
  Check,
  Crown
} from 'lucide-react';

export const MembersSettingsSection: React.FC = () => {
  const { 
    currentProject, 
    memberships, 
    setMemberships, 
    updateMembershipInStore, 
    removeMembershipFromStore, 
    addMembershipToStore 
  } = useProjectStore();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [deletingMember, setDeletingMember] = useState<ProjectMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentProject) {
      getRoles(currentProject.id)
        .then((data) => setRoles(data))
        .catch((err) => console.warn('Could not load roles:', err));

      getProjectMemberships(currentProject.id)
        .then((data) => setMemberships(data))
        .catch((err) => console.warn('Could not refresh memberships:', err));
    }
  }, [currentProject, setMemberships]);

  if (!currentProject) return null;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleAdminToggle = async (member: ProjectMember) => {
    // Cannot remove admin from project owner if applicable
    if (currentProject.owner && currentProject.owner.id === member.user && member.is_admin) {
      showFeedback('error', 'El propietario del proyecto no puede perder permisos de administrador.');
      return;
    }

    setUpdatingMemberId(member.id);
    try {
      const updated = await updateMembership(member.id, {
        is_admin: !member.is_admin,
      });
      updateMembershipInStore(updated);
      showFeedback('success', `Permisos de administrador actualizados para ${member.full_name || member.username}`);
    } catch (err: any) {
      console.error('Error toggling admin:', err);
      showFeedback('error', err?.message || 'Error al actualizar permisos de administrador');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRoleChange = async (member: ProjectMember, newRoleId: number) => {
    if (member.role === newRoleId) return;

    setUpdatingMemberId(member.id);
    try {
      const updated = await updateMembership(member.id, {
        role: newRoleId,
      });
      updateMembershipInStore(updated);
      const roleName = roles.find((r) => r.id === newRoleId)?.name || 'Rol actualizado';
      showFeedback('success', `${member.full_name || member.username} ahora tiene el rol: ${roleName}`);
    } catch (err: any) {
      console.error('Error changing role:', err);
      showFeedback('error', err?.message || 'Error al cambiar rol del miembro');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;

    setIsDeleting(true);
    try {
      await deleteMembership(deletingMember.id);
      removeMembershipFromStore(deletingMember.id);
      showFeedback('success', `Se eliminó a ${deletingMember.full_name || deletingMember.username} del proyecto.`);
      setDeletingMember(null);
    } catch (err: any) {
      console.error('Error removing member:', err);
      showFeedback('error', err?.message || 'Error al remover miembro');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = memberships.filter((m) => {
    const term = search.toLowerCase();
    return (
      (m.full_name && m.full_name.toLowerCase().includes(term)) ||
      (m.username && m.username.toLowerCase().includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.user_email && m.user_email.toLowerCase().includes(term)) ||
      (m.role_name && m.role_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Gestionar Miembros
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {memberships.length} Miembros
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administra roles, accesos de administración y colaboradores de {currentProject.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar miembro o email..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* New Member button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ NUEVO MIEMBRO</span>
          </button>
        </div>
      </div>

      {/* Feedback message banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Miembro</th>
                <th className="py-3.5 px-6 text-center">Admin</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No se encontraron miembros coincidentes con "{search}"
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isOwner = currentProject.owner && currentProject.owner.id === member.user;
                  const isUpdating = updatingMemberId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Member profile info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={member.full_name || member.username}
                            photo={member.photo}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {member.full_name || member.username}
                              </span>
                              {isOwner && (
                                <span title="Propietario del Proyecto">
                                  <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {member.email || member.user_email || 'Sin correo público'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Admin Toggle */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center">
                          {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={member.is_admin}
                              disabled={isOwner}
                              onClick={() => handleAdminToggle(member)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                                isOwner ? 'opacity-60 cursor-not-allowed' : ''
                              } ${
                                member.is_admin
                                  ? 'bg-brand-600'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                              title={
                                isOwner
                                  ? 'El propietario siempre es Administrador'
                                  : member.is_admin
                                  ? 'Desactivar permisos de administrador'
                                  : 'Activar permisos de administrador'
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  member.is_admin ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-4 px-6">
                        <select
                          value={member.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(member, Number(e.target.value))}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[140px]"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      {/* Actions (Delete) */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          disabled={isOwner || isUpdating}
                          onClick={() => setDeletingMember(member)}
                          className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${
                            isOwner ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title={isOwner ? 'No puedes expulsar al propietario' : 'Eliminar miembro del proyecto'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={(newMember) => {
          addMembershipToStore(newMember);
          showFeedback('success', `Se invitó exitosamente a ${newMember.full_name || newMember.email || newMember.username}`);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Eliminar miembro del proyecto?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se revocarán los permisos de acceso de{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {deletingMember.full_name || deletingMember.username}
                </strong>{' '}
                en {currentProject.name}.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
