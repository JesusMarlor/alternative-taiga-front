import React, { useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { getUserStories, updateUserStory } from '../api/userstories';
import { useTaigaLiveEvents } from '../api/events';
import { UserStory, StatusItem } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { StatusBadge } from '../components/shared/Badges';
import { CreateUserStoryModal } from '../components/modals/CreateUserStoryModal';
import { EditUserStoryModal } from '../components/modals/EditUserStoryModal';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  MoveRight, 
  User as UserIcon,
  X,
  Loader2,
  Calendar,
  Pencil
} from 'lucide-react';

export const KanbanPage: React.FC = () => {
  const { currentProject, memberships } = useProjectStore();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<number | 'all'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<number | 'all'>('all');
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatusId, setCreateStatusId] = useState<number | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadStories = useCallback(async (showLoading = true) => {
    if (!currentProject) return;
    if (showLoading) setIsLoading(true);
    try {
      const data = await getUserStories(currentProject.id);
      setStories(data);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadStories(true);
  }, [loadStories]);

  // Subscribe to live WSS updates for this project
  useTaigaLiveEvents(currentProject?.id, (event) => {
    console.log('[Kanban Live Event Triggered]', event);
    loadStories(false);
  });

  if (!currentProject) return null;

  const statuses: StatusItem[] = currentProject.us_statuses || [];

  // Filter stories
  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.subject.toLowerCase().includes(search.toLowerCase()) ||
      story.ref.toString().includes(search);
    const matchesAssignee =
      selectedAssignee === 'all' || story.assigned_to === selectedAssignee;
    const matchesMilestone =
      selectedMilestone === 'all' || story.milestone === selectedMilestone;
    return matchesSearch && matchesAssignee && matchesMilestone;
  });

  const handleStatusChange = async (storyId: number, nextStatusId: number) => {
    const targetStatus = statuses.find((s) => s.id === nextStatusId);
    // Optimistic update
    setStories((prev) =>
      prev.map((st) =>
        st.id === storyId
          ? {
              ...st,
              status: nextStatusId,
              status_extra_info: targetStatus
                ? {
                    name: targetStatus.name,
                    color: targetStatus.color,
                    is_closed: targetStatus.is_closed,
                  }
                : st.status_extra_info,
              is_closed: targetStatus ? targetStatus.is_closed : st.is_closed,
            }
          : st
      )
    );

    if (targetStatus?.is_closed) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    try {
      await updateUserStory(storyId, { status: nextStatusId });
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert on error
      if (currentProject) {
        const refreshed = await getUserStories(currentProject.id);
        setStories(refreshed);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Tablero Kanban
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {stories.length} Historias
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Flujo ágil de trabajo para {currentProject.name}
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por # o texto..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) =>
              setSelectedAssignee(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los asignados</option>
            {memberships.map((m) => (
              <option key={m.id} value={m.user}>
                {m.full_name || m.username} ({m.role_name})
              </option>
            ))}
          </select>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Historia</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando historias del tablero...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const columnStories = filteredStories.filter((s) => s.status === status.id);

            return (
              <div
                key={status.id}
                className="flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 p-3 min-w-[280px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 dark:border-slate-800/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {status.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStatusId(status.id);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title={`Nueva historia en ${status.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
                      {columnStories.length}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-2.5 min-h-[300px]">
                  {columnStories.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      Sin historias aquí
                    </div>
                  ) : (
                    columnStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => setSelectedStory(story)}
                        className="group bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 relative"
                      >
                        {/* Top: Ref & Points */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                            #{story.ref}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {story.total_points !== null && story.total_points !== undefined && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                                {story.total_points} pts
                              </span>
                            )}
                            {story.milestone_name && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 truncate max-w-[90px]">
                                {story.milestone_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subject */}
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors leading-snug">
                          {story.subject}
                        </h4>

                        {/* Footer: Assignee & Quick Status Shift */}
                        <div className="flex items-center justify-between pt-1 text-slate-400">
                          {story.assigned_to_extra_info ? (
                            <div className="flex items-center gap-1.5">
                              <UserAvatar
                                name={story.assigned_to_extra_info.full_name_display}
                                photo={story.assigned_to_extra_info.photo}
                                size="xs"
                              />
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                                {story.assigned_to_extra_info.full_name_display}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Sin asignar
                            </span>
                          )}

                          {/* Quick change status dropdown */}
                          <select
                            value={story.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleStatusChange(story.id, Number(e.target.value))
                            }
                            className="text-[10px] font-medium py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                          >
                            {statuses.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-brand-500">
                  HISTORIA #{selectedStory.ref}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedStory.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Estado
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStory.status_extra_info?.name || 'Nuevo'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Puntos
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStory.total_points ? `${selectedStory.total_points} pts` : 'Sin estimar'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Sprint / Milestone
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStory.milestone_name || 'En Backlog'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Descripción
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 min-h-[80px]">
                {selectedStory.description || 'Sin descripción detallada disponible.'}
              </div>
            </div>

            {/* Assignee */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {selectedStory.assigned_to_extra_info ? (
                  <>
                    <UserAvatar
                      name={selectedStory.assigned_to_extra_info.full_name_display}
                      photo={selectedStory.assigned_to_extra_info.photo}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedStory.assigned_to_extra_info.full_name_display}
                      </p>
                      <p className="text-[10px] text-slate-400">Responsable</p>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">No asignado</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Story Modal with full API fields */}
      <CreateUserStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateStatusId(undefined);
        }}
        initialStatusId={createStatusId}
        onCreated={(created) => {
          setStories((prev) => [created, ...prev]);
        }}
      />

      {/* Edit Story Modal */}
      <EditUserStoryModal
        isOpen={isEditModalOpen}
        story={selectedStory}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => {
          setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSelectedStory(updated);
        }}
        onDeleted={(deletedId) => {
          setStories((prev) => prev.filter((s) => s.id !== deletedId));
          setSelectedStory(null);
        }}
      />
    </div>
  );
};
