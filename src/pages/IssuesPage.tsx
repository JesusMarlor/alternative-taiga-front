import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { getIssues } from '../api/issues';
import { Issue } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { StatusBadge, PriorityBadge, SeverityBadge } from '../components/shared/Badges';
import { CreateIssueModal } from '../components/modals/CreateIssueModal';
import { EditIssueModal } from '../components/modals/EditIssueModal';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Loader2,
  Bug,
  Pencil,
  Lock
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit issue state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditModalOpen(true);
  };

  const handleIssueUpdated = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleIssueDeleted = (deletedId: number) => {
    setIssues((prev) => prev.filter((i) => i.id !== deletedId));
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
              {issues.length} Registradas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seguimiento de problemas, errores y solicitudes técnicas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por # o descripción..."
            className="w-full pl-10 pr-4 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
          />
        </div>
      </div>

      {/* Issues Table */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando incidencias...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Bug className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No se encontraron incidencias
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Intenta modificar los filtros de búsqueda' : 'No hay incidencias registradas en este proyecto.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-16">Ref</th>
                  <th className="py-3 px-4">Incidencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Asignado</th>
                  <th className="py-3 px-4 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => handleIssueClick(issue)}
                    className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${currentProject.slug}/issue/${issue.ref}`);
                        }}
                        className="font-mono font-bold text-rose-500 hover:underline cursor-pointer"
                        title="Abrir página completa"
                      >
                        #{issue.ref}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {issue.subject}
                        </span>
                        {issue.is_blocked && (
                          <span className="text-rose-500 flex-shrink-0" title={`Bloqueada: ${issue.blocked_note || ''}`}>
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
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
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                          setIsEditModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all"
                        title="Edición rápida"
                      >
                        <Pencil className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Issue Modal with full API fields */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(created) => {
          setIssues((prev) => [created, ...prev]);
        }}
      />

      {/* Edit Issue Modal */}
      <EditIssueModal
        isOpen={isEditModalOpen}
        issue={selectedIssue}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedIssue(null);
        }}
        onUpdated={handleIssueUpdated}
        onDeleted={handleIssueDeleted}
      />
    </div>
  );
};
