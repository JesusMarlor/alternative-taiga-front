import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { getMilestones } from '../api/milestones';
import { getUserStories } from '../api/userstories';
import { Milestone, UserStory } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { StatusBadge } from '../components/shared/Badges';
import { CreateUserStoryModal } from '../components/modals/CreateUserStoryModal';
import { EditUserStoryModal } from '../components/modals/EditUserStoryModal';
import { SprintModal } from '../components/modals/SprintModal';
import { 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Layers, 
  Plus, 
  CheckCheck,
  TrendingDown,
  Loader2,
  FolderOpen,
  Pencil,
  Lock,
  Tag as TagIcon
} from 'lucide-react';

export const ScrumPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetMilestoneId, setTargetMilestoneId] = useState<number | null | undefined>(undefined);

  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);

  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);

    Promise.all([
      getMilestones(currentProject.id),
      getUserStories(currentProject.id),
    ])
      .then(([msData, storiesData]) => {
        setMilestones(msData);
        if (msData.length > 0) {
          setSelectedMilestone(msData[0]);
        }
        setStories(storiesData);
      })
      .catch((err) => console.error('Error loading scrum data:', err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  if (!currentProject) return null;

  // Stories in selected sprint vs backlog
  const sprintStories = selectedMilestone
    ? stories.filter((s) => s.milestone === selectedMilestone.id)
    : [];

  const backlogStories = stories.filter((s) => !s.milestone);

  // Compute sprint totals
  const totalSprintPoints = sprintStories.reduce(
    (acc, s) => acc + (s.total_points || 0),
    0
  );
  const closedSprintPoints = sprintStories
    .filter((s) => s.is_closed)
    .reduce((acc, s) => acc + (s.total_points || 0), 0);

  const completionPercentage =
    totalSprintPoints > 0
      ? Math.round((closedSprintPoints / totalSprintPoints) * 100)
      : 0;

  // Story click handler - opens modal form populated via by_ref
  const handleStoryClick = (story: UserStory) => {
    setEditingStory(story);
    setIsEditStoryModalOpen(true);
  };

  const handleStoryUpdated = (updated: UserStory) => {
    setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleStoryDeleted = (deletedId: number) => {
    setStories((prev) => prev.filter((s) => s.id !== deletedId));
  };

  // Milestone save/delete handler
  const handleMilestoneSaved = (saved: Milestone) => {
    setMilestones((prev) => {
      const exists = prev.some((m) => m.id === saved.id);
      if (exists) {
        return prev.map((m) => (m.id === saved.id ? saved : m));
      } else {
        return [saved, ...prev];
      }
    });
    setSelectedMilestone(saved);
  };

  const handleMilestoneDeleted = (deletedId: number) => {
    setMilestones((prev) => prev.filter((m) => m.id !== deletedId));
    if (selectedMilestone?.id === deletedId) {
      const remaining = milestones.filter((m) => m.id !== deletedId);
      setSelectedMilestone(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Scrum & Sprints
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {milestones.length} Sprints
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión de iteraciones, backlog y estimaciones de puntos
          </p>
        </div>

        {/* Milestone selector and Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {milestones.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Sprint:</label>
              <select
                value={selectedMilestone?.id || ''}
                onChange={(e) => {
                  const found = milestones.find((m) => m.id === Number(e.target.value));
                  if (found) setSelectedMilestone(found);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.closed ? 'Cerrado' : 'Activo'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Sprint button */}
          <button
            type="button"
            onClick={() => {
              setEditingMilestone(null);
              setIsSprintModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Sprint</span>
          </button>

          {/* New Story button */}
          <button
            type="button"
            onClick={() => {
              setTargetMilestoneId(selectedMilestone ? selectedMilestone.id : null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Historia</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando Sprints y Backlog...</p>
        </div>
      ) : (
        <>
          {/* Sprint Overview Card */}
          {selectedMilestone ? (
            <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedMilestone.closed ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedMilestone.name}
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedMilestone.closed ? 'Cerrado' : 'En Progreso'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMilestone(selectedMilestone);
                        setIsSprintModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors ml-1"
                      title="Editar Sprint"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {selectedMilestone.estimated_start} al {selectedMilestone.estimated_finish}
                    </span>
                  </div>
                </div>

                {/* Points Progress */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {closedSprintPoints} / {totalSprintPoints} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {completionPercentage}% completado
                    </div>
                  </div>

                  <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sprint Stories List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Historias en este Sprint ({sprintStories.length}) - Haz clic para editar
                </h3>

                {sprintStories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No hay historias asignadas a este sprint aún.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60">
                    {sprintStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => handleStoryClick(story)}
                        className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/project/${currentProject.slug}/us/${story.ref}`);
                            }}
                            className="text-xs font-mono font-bold text-[#008db8] hover:underline cursor-pointer"
                            title="Abrir página completa"
                          >
                            #{story.ref}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {story.subject}
                          </span>
                          {story.is_blocked && (
                            <span className="p-0.5 rounded text-rose-500" title={`Bloqueada: ${story.blocked_note || ''}`}>
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {story.total_points !== null && story.total_points !== undefined && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              {story.total_points} pts
                            </span>
                          )}

                          <StatusBadge
                            name={story.status_extra_info?.name || 'Nuevo'}
                            color={story.status_extra_info?.color}
                            isClosed={story.is_closed}
                          />

                          {story.assigned_to_extra_info && (
                            <UserAvatar
                              name={story.assigned_to_extra_info.full_name_display}
                              photo={story.assigned_to_extra_info.photo}
                              size="xs"
                            />
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStory(story);
                              setIsEditStoryModalOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-500 transition-opacity"
                            title="Edición rápida"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No hay sprints creados en este proyecto</p>
                <p className="text-xs text-slate-500 mt-1">Crea tu primer sprint para empezar a planificar iteraciones</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMilestone(null);
                  setIsSprintModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Sprint</span>
              </button>
            </div>
          )}

          {/* Backlog Section */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Product Backlog ({backlogStories.length} pendientes)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetMilestoneId(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar al Backlog</span>
              </button>
            </div>

            {backlogStories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                ¡Excelente! Todas las historias han sido planificadas en un Sprint.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60">
                {backlogStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleStoryClick(story)}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${currentProject.slug}/us/${story.ref}`);
                        }}
                        className="text-xs font-mono font-bold text-[#008db8] hover:underline cursor-pointer"
                        title="Abrir página completa"
                      >
                        #{story.ref}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {story.subject}
                      </span>
                      {story.is_blocked && (
                        <span className="p-0.5 rounded text-rose-500" title={`Bloqueada: ${story.blocked_note || ''}`}>
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {story.total_points !== null && story.total_points !== undefined && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {story.total_points} pts
                        </span>
                      )}
                      <StatusBadge
                        name={story.status_extra_info?.name || 'Nuevo'}
                        color={story.status_extra_info?.color}
                      />
                      {story.assigned_to_extra_info && (
                        <UserAvatar
                          name={story.assigned_to_extra_info.full_name_display}
                          photo={story.assigned_to_extra_info.photo}
                          size="xs"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStory(story);
                          setIsEditStoryModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-500 transition-opacity"
                        title="Edición rápida"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create User Story Modal */}
      <CreateUserStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialMilestoneId={targetMilestoneId}
        onCreated={(created) => {
          setStories((prev) => [created, ...prev]);
        }}
      />

      {/* Edit User Story Modal */}
      <EditUserStoryModal
        isOpen={isEditStoryModalOpen}
        story={editingStory}
        onClose={() => {
          setIsEditStoryModalOpen(false);
          setEditingStory(null);
        }}
        onUpdated={handleStoryUpdated}
        onDeleted={handleStoryDeleted}
      />

      {/* Sprint Modal (Create / Edit) */}
      <SprintModal
        isOpen={isSprintModalOpen}
        milestone={editingMilestone}
        onClose={() => {
          setIsSprintModalOpen(false);
          setEditingMilestone(null);
        }}
        onSaved={handleMilestoneSaved}
        onDeleted={handleMilestoneDeleted}
      />
    </div>
  );
};
