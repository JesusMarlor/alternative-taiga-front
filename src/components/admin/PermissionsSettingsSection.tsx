import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { getRoles, updateRole, createRole, deleteRole } from '../../api/roles';
import { RoleItem } from '../../types/taiga';
import { 
  Shield, 
  Plus, 
  Check, 
  AlertCircle, 
  Loader2, 
  Layers, 
  CheckSquare, 
  Target, 
  Bug, 
  BookOpen, 
  Sliders,
  Trash2,
  X,
  Calendar
} from 'lucide-react';

interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
}

interface PermissionCategory {
  title: string;
  icon: any;
  permissions: PermissionDefinition[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    title: 'Historias de Usuario (User Stories)',
    icon: Layers,
    permissions: [
      { key: 'view_us', name: 'Ver historias' },
      { key: 'add_us', name: 'Crear historias' },
      { key: 'modify_us', name: 'Modificar historias' },
      { key: 'delete_us', name: 'Eliminar historias' },
      { key: 'comment_us', name: 'Comentar en historias' },
    ],
  },
  {
    title: 'Tareas (Tasks)',
    icon: CheckSquare,
    permissions: [
      { key: 'view_tasks', name: 'Ver tareas' },
      { key: 'add_task', name: 'Crear tareas' },
      { key: 'modify_task', name: 'Modificar tareas' },
      { key: 'delete_task', name: 'Eliminar tareas' },
      { key: 'comment_task', name: 'Comentar en tareas' },
    ],
  },
  {
    title: 'Épicas (Epics)',
    icon: Target,
    permissions: [
      { key: 'view_epics', name: 'Ver épicas' },
      { key: 'add_epic', name: 'Crear épicas' },
      { key: 'modify_epic', name: 'Modificar épicas' },
      { key: 'delete_epic', name: 'Eliminar épicas' },
      { key: 'comment_epic', name: 'Comentar en épicas' },
    ],
  },
  {
    title: 'Incidencias (Issues)',
    icon: Bug,
    permissions: [
      { key: 'view_issues', name: 'Ver incidencias' },
      { key: 'add_issue', name: 'Crear incidencias' },
      { key: 'modify_issue', name: 'Modificar incidencias' },
      { key: 'delete_issue', name: 'Eliminar incidencias' },
      { key: 'comment_issue', name: 'Comentar en incidencias' },
    ],
  },
  {
    title: 'Sprints (Milestones)',
    icon: Calendar,
    permissions: [
      { key: 'view_milestones', name: 'Ver sprints' },
      { key: 'add_milestone', name: 'Crear sprints' },
      { key: 'modify_milestone', name: 'Modificar sprints' },
      { key: 'delete_milestone', name: 'Eliminar sprints' },
    ],
  },
  {
    title: 'Wiki',
    icon: BookOpen,
    permissions: [
      { key: 'view_wiki_pages', name: 'Ver páginas wiki' },
      { key: 'add_wiki_page', name: 'Crear páginas wiki' },
      { key: 'modify_wiki_page', name: 'Modificar páginas wiki' },
      { key: 'comment_wiki_page', name: 'Comentar en páginas wiki' },
      { key: 'delete_wiki_page', name: 'Eliminar páginas wiki' },
    ],
  },
  {
    title: 'Administración del Proyecto',
    icon: Sliders,
    permissions: [
      { key: 'modify_project', name: 'Modificar proyecto' },
      { key: 'delete_project', name: 'Eliminar proyecto' },
      { key: 'add_member', name: 'Añadir miembros' },
      { key: 'remove_member', name: 'Eliminar miembros' },
      { key: 'admin_project_values', name: 'Administrar valores (estados, tipos, etc.)' },
      { key: 'admin_roles', name: 'Administrar roles y permisos' },
    ],
  },
];

export const PermissionsSettingsSection: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New role modal
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      getRoles(currentProject.id)
        .then((data) => setRoles(data))
        .catch((err) => {
          console.error('Error loading roles:', err);
          showFeedback('error', 'No se pudieron cargar los roles del proyecto');
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTogglePermission = async (role: RoleItem, permissionKey: string) => {
    const currentPerms = role.permissions || [];
    const hasPerm = currentPerms.includes(permissionKey);
    const nextPerms = hasPerm
      ? currentPerms.filter((p) => p !== permissionKey)
      : [...currentPerms, permissionKey];

    // Optimistic UI update
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: nextPerms } : r))
    );

    setSavingRoleId(role.id);
    try {
      await updateRole(role.id, { permissions: nextPerms });
      showFeedback('success', `Permisos de ${role.name} guardados.`);
    } catch (err: any) {
      console.error('Error updating role permissions:', err);
      // Revert
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, permissions: currentPerms } : r))
      );
      showFeedback('error', err?.message || 'Error al actualizar permiso');
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !currentProject) return;

    setIsCreatingRole(true);
    try {
      const created = await createRole({
        project: currentProject.id,
        name: newRoleName.trim(),
        permissions: [
          'view_us',
          'view_tasks',
          'view_epics',
          'view_issues',
          'view_wiki_pages',
          'add_us',
          'add_task',
          'add_issue',
        ],
      });

      setRoles((prev) => [...prev, created]);
      setNewRoleName('');
      setIsNewRoleModalOpen(false);
      showFeedback('success', `Rol "${created.name}" creado con éxito.`);
    } catch (err: any) {
      console.error('Error creating role:', err);
      showFeedback('error', err?.message || 'Error al crear nuevo rol');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) return;

    try {
      await deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      showFeedback('success', `Rol "${role.name}" eliminado.`);
    } catch (err: any) {
      console.error('Error deleting role:', err);
      showFeedback('error', err?.message || 'No se puede eliminar un rol asignado a miembros');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Permisos y Roles
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {roles.length} Roles
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configura la matriz de permisos de acceso por rol en {currentProject.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewRoleModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVO ROL</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-400 font-medium">Cargando matriz de permisos...</p>
        </div>
      ) : (
        /* Permissions Matrix Table */
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6 font-bold uppercase text-[10px] tracking-wider min-w-[220px]">
                    Permiso por Módulo
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="py-4 px-4 font-bold text-center min-w-[130px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-900 dark:text-white font-black">
                          {role.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {savingRoleId === role.id && (
                            <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                          )}
                          {!role.computable && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                              title={`Eliminar rol ${role.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {PERMISSION_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <React.Fragment key={category.title}>
                      {/* Section Header Row */}
                      <tr className="bg-slate-100/60 dark:bg-slate-800/40 border-y border-slate-200/60 dark:border-slate-800/60">
                        <td
                          colSpan={roles.length + 1}
                          className="py-2.5 px-6 font-bold text-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-brand-500" />
                            <span>{category.title}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Permission Rows */}
                      {category.permissions.map((perm) => (
                        <tr
                          key={perm.key}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/60 transition-colors"
                        >
                          <td className="py-3 px-6 text-slate-700 dark:text-slate-300 font-medium">
                            {perm.name}
                          </td>

                          {roles.map((role) => {
                            const isChecked = (role.permissions || []).includes(perm.key);
                            return (
                              <td key={role.id} className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(role, perm.key)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 bg-white dark:bg-slate-800 cursor-pointer"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Crear Nuevo Rol
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del Rol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ej. QA Lead, Diseñador UI..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole || !newRoleName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isCreatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreatingRole ? 'Creando...' : 'Crear Rol'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
