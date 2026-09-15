import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { getIssues, createIssue, updateIssue } from '../api/issues';
import { Issue } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { StatusBadge, PriorityBadge, SeverityBadge } from '../components/shared/Badges';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Loader2,
  Bug
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const { currentProject, memberships } = useProjectStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    getIssues(currentProject.id)
      .then((data) => setIssues(data))
      .catch((err) => console.error('Error loading issues:', err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  if (!currentProject) return null;

  const filteredIssues = issues.filter(
    (issue) =>
      issue.subject.toLowerCase().includes(search.toLowerCase()) ||
      issue.ref.toString().includes(search)
  );

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !currentProject) return;

    setIsSubmitting(true);
    try {
      const priority = currentProject.default_priority || 2;
      const severity = currentProject.default_severity || 3;
      const type = currentProject.default_issue_type || 1;

      const created = await createIssue({
        project: currentProject.id,
        subject: newSubject.trim(),
        priority,
        severity,
        type,
      });

      setIssues((prev) => [created, ...prev]);
      setNewSubject('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating issue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Incidencias & Bugs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {issues.length} Incidencias
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro y seguimiento de bugs y tareas operativas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar incidencia..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando incidencias...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Bug className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No hay incidencias registradas
          </h3>
          <p className="text-xs text-slate-500">
            Crea una nueva incidencia con el botón superior.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Asunto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Asignado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      #{issue.ref}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {issue.subject}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        name={issue.status_extra_info?.name || 'Nuevo'}
                        color={issue.status_extra_info?.color}
                        isClosed={issue.is_closed}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge
                        name={issue.priority_extra_info?.name || 'Normal'}
                        color={issue.priority_extra_info?.color}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge
                        name={issue.severity_extra_info?.name || 'Normal'}
                        color={issue.severity_extra_info?.color}
                      />
                    </td>
                    <td className="py-3 px-4">
                      {issue.assigned_to_extra_info ? (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            name={issue.assigned_to_extra_info.full_name_display}
                            photo={issue.assigned_to_extra_info.photo}
                            size="xs"
                          />
                          <span className="truncate max-w-[100px]">
                            {issue.assigned_to_extra_info.full_name_display}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Incidencia
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Descripción o Título del Bug
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej. Error 500 al exportar reporte de ventas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubject.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Incidencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
