import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { getEpics, createEpic } from '../api/epics';
import { Epic } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { StatusBadge } from '../components/shared/Badges';
import { 
  Target, 
  Plus, 
  Search, 
  X, 
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const EpicsPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newColor, setNewColor] = useState('#7c3aed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    getEpics(currentProject.id)
      .then((data) => setEpics(data))
      .catch((err) => console.error('Error loading epics:', err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  if (!currentProject) return null;

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !currentProject) return;

    setIsSubmitting(true);
    try {
      const created = await createEpic({
        project: currentProject.id,
        subject: newSubject.trim(),
        color: newColor,
      });

      setEpics((prev) => [created, ...prev]);
      setNewSubject('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating epic:', err);
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
              Épicas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {epics.length} Épicas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Objetivos estratégicos e iniciativas de alto nivel
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Épica</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando épicas...</p>
        </div>
      ) : epics.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Target className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No hay épicas creadas en este proyecto
          </h3>
          <p className="text-xs text-slate-500">
            Las épicas te ayudan a organizar grandes metas y múltiples historias de usuario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {epics.map((epic) => (
            <div
              key={epic.id}
              className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: epic.color }}
                  />
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{epic.ref}
                  </span>
                </div>
                {epic.status_extra_info && (
                  <StatusBadge
                    name={epic.status_extra_info.name}
                    color={epic.status_extra_info.color}
                  />
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {epic.subject}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {epic.description || 'Sin descripción'}
              </p>

              {epic.assigned_to_extra_info && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                  <UserAvatar
                    name={epic.assigned_to_extra_info.full_name_display}
                    photo={epic.assigned_to_extra_info.photo}
                    size="xs"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {epic.assigned_to_extra_info.full_name_display}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Epic Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Épica
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEpic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Nombre de la Épica
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ej. Rediseño del Módulo de Pagos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Color distintivo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-500">{newColor}</span>
                </div>
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
                  {isSubmitting ? 'Guardando...' : 'Crear Épica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
