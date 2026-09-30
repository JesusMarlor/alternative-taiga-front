import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { getMilestones } from '../api/milestones';
import { getUserStories, updateUserStory, deleteUserStory } from '../api/userstories';
import { Milestone, UserStory, StatusItem } from '../types/taiga';
import { CreateUserStoryModal } from '../components/modals/CreateUserStoryModal';
import { EditUserStoryModal } from '../components/modals/EditUserStoryModal';
import { SprintModal } from '../components/modals/SprintModal';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Pencil, 
  Lock, 
  Search, 
  GripVertical, 
  MoreVertical, 
  Undo2, 
  Trash2, 
  Layers, 
  Check, 
  X,
  SlidersHorizontal
} from 'lucide-react';

export const ScrumPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [showTags, setShowTags] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Collapsed sprints state: map milestoneId -> boolean (false = open, true = collapsed)
  const [collapsedSprints, setCollapsedSprints] = useState<Record<number, boolean>>({});

  // Modals state
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [createStoryMilestoneId, setCreateStoryMilestoneId] = useState<number | null | undefined>(null);

  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);

  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);

  // Active story dropdown menu (for 3 dots)
  const [activeStoryMenuId, setActiveStoryMenuId] = useState<number | null>(null);
  // Active status selector menu
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<number | null>(null);

  // Drag and drop state
  const [draggedStoryId, setDraggedStoryId] = useState<number | null>(null);
  const [isDraggingOverBacklog, setIsDraggingOverBacklog] = useState(false);
  const [dragOverSprintId, setDragOverSprintId] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  // Close open popups when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setActiveStoryMenuId(null);
        setActiveStatusMenuId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch project sprints and stories
  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);

    Promise.all([
      getMilestones(currentProject.id),
      getUserStories(currentProject.id),
    ])
      .then(([msData, storiesData]) => {
        setMilestones(msData);
        setStories(storiesData);
      })
      .catch((err) => console.error('Error loading scrum data:', err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  if (!currentProject) return null;

  const statuses: StatusItem[] = currentProject.us_statuses || [];

  // Stories partitioned
  const backlogStories = stories.filter((s) => !s.milestone);

  // Filtered backlog stories based on search and status
  const filteredBacklogStories = backlogStories.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.ref).includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate project-wide points statistics
  const allDefinedPoints = stories.reduce(
    (acc, s) => acc + (s.total_points || 0),
    0
  );
  const allClosedPoints = stories
    .filter((s) => s.is_closed)
    .reduce((acc, s) => acc + (s.total_points || 0), 0);

  const overallCompletionPercentage =
    allDefinedPoints > 0
      ? Math.round((allClosedPoints / allDefinedPoints) * 100)
      : 0;

  const closedSprintsCount = milestones.filter((m) => m.closed).length;
  const pointsPerSprint =
    closedSprintsCount > 0
      ? Math.round(allClosedPoints / closedSprintsCount)
      : 0;

  // Toggle sprint accordion
  const toggleSprintCollapse = (milestoneId: number) => {
    setCollapsedSprints((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
  };

  // Move story out of sprint -> Backlog
  const handleMoveStoryOutOfSprint = async (story: UserStory) => {
    // Optimistic update
    const previousMilestone = story.milestone;
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id
          ? { ...s, milestone: null, milestone_name: null, milestone_slug: null }
          : s
      )
    );

    try {
      const updated = await updateUserStory(story.id, {
        milestone: null,
        version: story.version,
      });
      setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      console.error('Error removing story from sprint:', err);
      // Rollback
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id ? { ...s, milestone: previousMilestone } : s
        )
      );
      alert(`No se pudo mover la historia al backlog: ${err?.message || 'Error del servidor'}`);
    }
  };

  // Move story into a sprint
  const handleMoveStoryToSprint = async (story: UserStory, milestoneId: number) => {
    if (story.milestone === milestoneId) return;

    const previousMilestone = story.milestone;
    const targetMs = milestones.find((m) => m.id === milestoneId);

    // Optimistic update
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id
          ? {
              ...s,
              milestone: milestoneId,
              milestone_name: targetMs?.name || null,
              milestone_slug: targetMs?.slug || null,
            }
          : s
      )
    );

    try {
      const updated = await updateUserStory(story.id, {
        milestone: milestoneId,
        version: story.version,
      });
      setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      console.error('Error assigning story to sprint:', err);
      // Rollback
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id ? { ...s, milestone: previousMilestone } : s
        )
      );
      alert(`No se pudo asignar la historia al sprint: ${err?.message || 'Error del servidor'}`);
    }
  };

  // Update story status directly from row dropdown
  const handleUpdateStatus = async (story: UserStory, newStatusId: number) => {
    setActiveStatusMenuId(null);
    if (story.status === newStatusId) return;

    const targetStatus = statuses.find((st) => st.id === newStatusId);
    // Optimistic update
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id
          ? {
              ...s,
              status: newStatusId,
              is_closed: !!targetStatus?.is_closed,
              status_extra_info: targetStatus
                ? {
                    name: targetStatus.name,
                    color: targetStatus.color,
                    is_closed: targetStatus.is_closed,
                  }
                : s.status_extra_info,
            }
          : s
      )
    );

    try {
      const updated = await updateUserStory(story.id, {
        status: newStatusId,
        version: story.version,
      });
      setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  };

  // Delete story
  const handleDeleteStory = async (storyId: number) => {
    setActiveStoryMenuId(null);
    if (!window.confirm('¿Estás seguro de eliminar esta historia de usuario?')) return;

    try {
      await deleteUserStory(storyId);
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch (err: any) {
      alert(`Error al eliminar historia: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Milestone save/delete handler
  const handleMilestoneSaved = (saved: Milestone) => {
    setMilestones((prev) => {
      const exists = prev.some((m) => m.id === saved.id);
      const nextList = exists
        ? prev.map((m) => (m.id === saved.id ? saved : m))
        : [saved, ...prev];
      if (currentProject) {
        setCurrentProject({
          ...currentProject,
          milestones: nextList,
        });
      }
      return nextList;
    });
  };

  const handleMilestoneDeleted = (deletedId: number) => {
    setMilestones((prev) => {
      const nextList = prev.filter((m) => m.id !== deletedId);
      if (currentProject) {
        setCurrentProject({
          ...currentProject,
          milestones: nextList,
        });
      }
      return nextList;
    });
    // Any stories that were in this milestone go back to the backlog
    setStories((prev) =>
      prev.map((s) =>
        s.milestone === deletedId
          ? { ...s, milestone: null, milestone_name: null }
          : s
      )
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, story: UserStory) => {
    isDraggingRef.current = true;
    setDraggedStoryId(story.id);
    e.dataTransfer.setData('text/plain', String(story.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedStoryId(null);
    setIsDraggingOverBacklog(false);
    setDragOverSprintId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in text-slate-800 dark:text-slate-100">
      {/* 1. Header: Scrum Title & Statistics Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Scrum
          </h1>
        </div>

        {/* Top Progress bar & defined/closed points (matching Taiga original) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:px-5 flex flex-col md:flex-row md:items-center gap-4 shadow-xs">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#008db8] rounded-full transition-all duration-500"
                style={{ width: `${overallCompletionPercentage}%` }}
              />
            </div>
            <span className="text-sm font-black text-[#008db8] min-w-[42px]">
              {overallCompletionPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-300 font-medium divide-x divide-slate-200 dark:divide-slate-800">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {allDefinedPoints}
              </span>{' '}
              <span className="text-slate-500">defined points</span>
            </div>
            <div className="pl-4 sm:pl-6">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {allClosedPoints}
              </span>{' '}
              <span className="text-slate-500">closed points</span>
            </div>
            <div className="pl-4 sm:pl-6">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {pointsPerSprint}
              </span>{' '}
              <span className="text-slate-500">points / sprint</span>
            </div>
          </div>
        </div>

        {/* "CUSTOMIZE YOUR BACKLOG GRAPH" Banner (original Taiga style) */}
        {showBanner && (
          <div className="relative bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-start gap-4">
            <div className="flex items-end gap-1 text-[#008db8] flex-shrink-0 pt-1">
              <div className="w-1.5 h-3 bg-[#008db8] rounded-xs" />
              <div className="w-1.5 h-5 bg-[#008db8] rounded-xs" />
              <div className="w-1.5 h-7 bg-[#008db8] rounded-xs" />
            </div>

            <div className="flex-1 text-xs space-y-0.5">
              <h4 className="font-bold uppercase tracking-wider text-[#008db8]">
                CUSTOMIZE YOUR BACKLOG GRAPH
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                To have a nice graph that helps you follow the evolution of the project you have to set up the points and sprints through the{' '}
                <Link
                  to={`/project/${currentProject.slug}/settings`}
                  className="text-[#008db8] font-bold hover:underline"
                >
                  Admin
                </Link>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
              title="Cerrar banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#008db8]" />
          <p className="text-xs text-slate-500 font-medium">Cargando Sprints y Backlog...</p>
        </div>
      ) : (
        /* 2-Column Layout: Left = Backlog table, Right = Sprints sidebar */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ================= LEFT COLUMN: BACKLOG ================= */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Backlog Header Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Backlog
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {backlogStories.length} user stories
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* + USER STORY button */}
                <button
                  type="button"
                  onClick={() => {
                    setCreateStoryMilestoneId(null);
                    setIsCreateStoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#29b6a6] hover:bg-[#209285] text-white text-xs font-bold tracking-wide uppercase shadow-sm transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>USER STORY</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </span>

              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="subject or reference"
                  className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#008db8]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Status filter dropdown */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#008db8]"
              >
                <option value="all">Todos los estados</option>
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              {/* Tags toggle */}
              <button
                type="button"
                onClick={() => setShowTags(!showTags)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                  showTags
                    ? 'border-[#008db8] bg-[#008db8]/10 text-[#008db8] font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>Tags</span>
              </button>
            </div>

            {/* Backlog Stories Drop Zone & Table */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!isDraggingOverBacklog) setIsDraggingOverBacklog(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDraggingOverBacklog(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setIsDraggingOverBacklog(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverBacklog(false);
                const storyId = Number(e.dataTransfer.getData('text/plain') || draggedStoryId);
                const storyToMove = stories.find((s) => s.id === storyId);
                if (storyToMove && storyToMove.milestone) {
                  handleMoveStoryOutOfSprint(storyToMove);
                }
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs transition-all ${
                isDraggingOverBacklog
                  ? 'border-dashed border-2 border-[#008db8] bg-[#008db8]/5 ring-2 ring-[#008db8]/20'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Drop hint when dragging a story from a sprint */}
              {isDraggingOverBacklog && (
                <div className="p-3 text-center bg-[#008db8]/10 text-[#008db8] font-bold text-xs flex items-center justify-center gap-2 border-b border-[#008db8]/20 animate-pulse">
                  <Undo2 className="w-4 h-4" />
                  <span>Suelta aquí para sacar la tarea del Sprint y devolverla al Backlog</span>
                </div>
              )}

              {/* Table Header */}
              <div className="grid grid-cols-[36px_32px_1fr_140px_80px_40px] items-center px-3 py-2.5 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <div />
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-slate-300 dark:border-slate-700 text-[#008db8]"
                  />
                </div>
                <div>USER STORY</div>
                <div>STATUS</div>
                <div className="text-right pr-2">POINTS</div>
                <div />
              </div>

              {/* Story Rows */}
              {filteredBacklogStories.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p>
                    {searchQuery
                      ? 'No hay historias que coincidan con la búsqueda.'
                      : 'No hay historias en el Backlog. Crea una nueva o arrastra tareas fuera del sprint.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredBacklogStories.map((story) => {
                    const statusObj = statuses.find((st) => st.id === story.status);
                    const pointsDisplay =
                      story.total_points !== null && story.total_points !== undefined
                        ? story.total_points
                        : '?';

                    return (
                      <div
                        key={story.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, story)}
                        onDragEnd={handleDragEnd}
                        className={`grid grid-cols-[36px_32px_1fr_140px_80px_40px] items-center px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${
                          draggedStoryId === story.id
                            ? 'opacity-40 bg-slate-100 dark:bg-slate-800'
                            : ''
                        }`}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 dark:border-slate-700 text-[#008db8] focus:ring-[#008db8]"
                          />
                        </div>

                        {/* Story Ref & Subject */}
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            onClick={() =>
                              navigate(`/project/${currentProject.slug}/us/${story.ref}`)
                            }
                            className="text-xs font-mono font-bold text-[#008db8] hover:underline cursor-pointer flex-shrink-0"
                            title="Ver detalle completo"
                          >
                            #{story.ref}
                          </span>

                          <span
                            onClick={() => {
                              if (isDraggingRef.current) return;
                              setEditingStory(story);
                              setIsEditStoryModalOpen(true);
                            }}
                            className={`text-xs font-medium truncate cursor-pointer hover:text-[#008db8] transition-colors ${
                              story.is_closed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                            title={story.subject}
                          >
                            {story.subject}
                          </span>

                          {story.is_blocked && (
                            <span
                              className="text-rose-500 flex-shrink-0"
                              title={`Bloqueada: ${story.blocked_note || ''}`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {showTags && story.tags && story.tags.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                              {story.tags.slice(0, 2).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Status selector popup / badge */}
                        <div className="relative" data-dropdown-container>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStatusMenuId(
                                activeStatusMenuId === story.id ? null : story.id
                              );
                              setActiveStoryMenuId(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: statusObj?.color || '#a1a1aa' }}
                            />
                            <span className="truncate max-w-[90px] text-slate-700 dark:text-slate-300">
                              {statusObj?.name || 'Nuevo'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          {activeStatusMenuId === story.id && (
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 animate-in fade-in">
                              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Cambiar Estado
                              </div>
                              {statuses.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => handleUpdateStatus(story, st.id)}
                                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                    story.status === st.id ? 'font-bold text-[#008db8]' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: st.color }}
                                    />
                                    <span>{st.name}</span>
                                  </div>
                                  {story.status === st.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Points */}
                        <div className="text-right pr-2">
                          <span
                            onClick={() => {
                              setEditingStory(story);
                              setIsEditStoryModalOpen(true);
                            }}
                            className="inline-block text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            title="Editar estimación de puntos"
                          >
                            {pointsDisplay}
                          </span>
                        </div>

                        {/* 3-dots Menu */}
                        <div className="relative flex items-center justify-center" data-dropdown-container>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStoryMenuId(
                                activeStoryMenuId === story.id ? null : story.id
                              );
                              setActiveStatusMenuId(null);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeStoryMenuId === story.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveStoryMenuId(null);
                                  setEditingStory(story);
                                  setIsEditStoryModalOpen(true);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                <span>Editar historia</span>
                              </button>

                              {milestones.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Mover a Sprint
                                  </div>
                                  {milestones.map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveStoryMenuId(null);
                                        handleMoveStoryToSprint(story, m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                                    >
                                      <span className="truncate">{m.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar historia</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SPRINTS SIDEBAR ================= */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
            {/* Sprints Header: Title & "Add +" */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {milestones.length} SPRINTS
              </h3>

              {/* Add + Button to create new Sprint */}
              <button
                type="button"
                onClick={() => {
                  setEditingMilestone(null);
                  setIsSprintModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#008db8] hover:text-[#007498] hover:underline transition-colors"
                title="Crear un nuevo sprint"
              >
                <span>Add +</span>
              </button>
            </div>

            {/* List of Sprints */}
            {milestones.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No hay sprints activos
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Crea tu primer sprint para organizar tus historias
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMilestone(null);
                    setIsSprintModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#008db8] hover:bg-[#007498] text-white text-xs font-bold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Sprint</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((sprint) => {
                  const sprintStories = stories.filter((s) => s.milestone === sprint.id);
                  const isCollapsed = !!collapsedSprints[sprint.id];

                  // Sprint totals
                  const sprintTotalPoints = sprintStories.reduce(
                    (acc, s) => acc + (s.total_points || 0),
                    0
                  );
                  const sprintClosedPoints = sprintStories
                    .filter((s) => s.is_closed)
                    .reduce((acc, s) => acc + (s.total_points || 0), 0);

                  const sprintPct =
                    sprintTotalPoints > 0
                      ? Math.round((sprintClosedPoints / sprintTotalPoints) * 100)
                      : 0;

                  const isDragTarget = dragOverSprintId === sprint.id;

                  return (
                    <div
                      key={sprint.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverSprintId !== sprint.id) {
                          setDragOverSprintId(sprint.id);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOverSprintId(sprint.id);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverSprintId === sprint.id) {
                          setDragOverSprintId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSprintId(null);
                        const storyId = Number(
                          e.dataTransfer.getData('text/plain') || draggedStoryId
                        );
                        const storyToMove = stories.find((s) => s.id === storyId);
                        if (storyToMove) {
                          handleMoveStoryToSprint(storyToMove, sprint.id);
                        }
                      }}
                      className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs transition-all ${
                        isDragTarget
                          ? 'border-dashed border-2 border-[#008db8] ring-2 ring-[#008db8]/20 bg-[#008db8]/5'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Sprint Header */}
                      <div className="p-3.5 space-y-2 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleSprintCollapse(sprint.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                              title={isCollapsed ? 'Desplegar historias' : 'Plegar historias'}
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <h4
                              onClick={() => toggleSprintCollapse(sprint.id)}
                              className="text-sm font-bold text-[#008db8] hover:underline cursor-pointer truncate"
                            >
                              {sprint.name}
                            </h4>

                            {/* Edit sprint button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMilestone(sprint);
                                setIsSprintModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-[#008db8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Editar Sprint"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Closed / Total points */}
                          <div className="text-right flex-shrink-0 text-[11px] font-semibold text-slate-500">
                            <div>
                              <span className="text-slate-900 dark:text-white font-bold">
                                {sprintClosedPoints}
                              </span>{' '}
                              closed
                            </div>
                            <div>
                              <span className="text-slate-900 dark:text-white font-bold">
                                {sprintTotalPoints}
                              </span>{' '}
                              total
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="text-[11px] text-slate-400 pl-6">
                          {sprint.estimated_start} - {sprint.estimated_finish}
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#008db8] rounded-full transition-all duration-300"
                            style={{ width: `${sprintPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Sprint Stories List (Collapsible) */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/30 dark:bg-slate-900/40">
                          {sprintStories.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 m-2 rounded-lg">
                              Arrastra historias aquí o usa el menú de la historia para asignarla
                            </div>
                          ) : (
                            sprintStories.map((story) => (
                              <div
                                key={story.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, story)}
                                onDragEnd={handleDragEnd}
                                className={`px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors group cursor-grab active:cursor-grabbing text-xs ${
                                  draggedStoryId === story.id
                                    ? 'opacity-40 bg-slate-200 dark:bg-slate-700'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/project/${currentProject.slug}/us/${story.ref}`);
                                    }}
                                    className="font-mono font-bold text-[#008db8] hover:underline cursor-pointer flex-shrink-0"
                                    title="Ver detalle"
                                  >
                                    #{story.ref}
                                  </span>

                                  <span
                                    onClick={() => {
                                      if (isDraggingRef.current) return;
                                      setEditingStory(story);
                                      setIsEditStoryModalOpen(true);
                                    }}
                                    className={`truncate cursor-pointer hover:text-[#008db8] transition-colors ${
                                      story.is_closed
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-700 dark:text-slate-300 font-medium'
                                    }`}
                                    title={story.subject}
                                  >
                                    {story.subject}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {story.total_points !== null &&
                                    story.total_points !== undefined && (
                                      <span className="text-[11px] font-bold text-slate-500">
                                        {story.total_points}
                                      </span>
                                    )}

                                  {/* MOVE OUT OF SPRINT BUTTON (One-click button) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveStoryOutOfSprint(story);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 sm:transition-opacity p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    title="Mover fuera del sprint (devolver al Backlog)"
                                  >
                                    <Undo2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit Story Quick Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingStory(story);
                                      setIsEditStoryModalOpen(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 sm:transition-opacity p-1 rounded-md text-slate-400 hover:text-[#008db8] hover:bg-slate-200 dark:hover:bg-slate-700"
                                    title="Editar historia"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}

                          {/* SPRINT TASKBOARD BUTTON (Bottom of sprint card) */}
                          <div className="p-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/project/${currentProject.slug}/kanban?milestone=${sprint.id}`
                                )
                              }
                              className="w-full py-1.5 px-3 rounded-lg bg-[#008db8] hover:bg-[#007498] text-white text-[11px] font-bold uppercase tracking-wider text-center shadow-xs transition-colors"
                              title={`Ir al Taskboard de "${sprint.name}"`}
                            >
                              SPRINT TASKBOARD
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create User Story */}
      <CreateUserStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        initialMilestoneId={createStoryMilestoneId}
        onCreated={(created) => {
          setStories((prev) => [created, ...prev]);
        }}
      />

      {/* Modal: Edit User Story */}
      <EditUserStoryModal
        isOpen={isEditStoryModalOpen}
        story={editingStory}
        onClose={() => {
          setIsEditStoryModalOpen(false);
          setEditingStory(null);
        }}
        onUpdated={(updated) => {
          setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
        onDeleted={(deletedId) => {
          setStories((prev) => prev.filter((s) => s.id !== deletedId));
        }}
      />

      {/* Modal: Sprint (Create / Edit) */}
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
