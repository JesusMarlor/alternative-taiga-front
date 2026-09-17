import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import {
  getUserStoryByRef,
  getUserStoryAttachments,
  uploadUserStoryAttachment,
  deleteUserStoryAttachment,
  updateUserStory,
  deleteUserStory,
} from '../../api/userstories';
import { getTasksByStory, createTask, updateTask, deleteTask } from '../../api/tasks';
import { getMilestones } from '../../api/milestones';
import { getRoles } from '../../api/roles';
import { UserStory, Milestone, RoleItem, Task, Attachment } from '../../types/taiga';
import { UserAvatar } from '../shared/UserAvatar';
import {
  X,
  Loader2,
  User as UserIcon,
  Tag as TagIcon,
  Calendar,
  AlertCircle,
  FileText,
  Flame,
  Layers,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Paperclip,
  Upload,
  Download,
  Plus,
  Eye,
  Edit3,
} from 'lucide-react';

interface EditUserStoryModalProps {
  isOpen: boolean;
  story: UserStory | null;
  onClose: () => void;
  onUpdated: (updatedStory: UserStory) => void;
  onDeleted?: (deletedStoryId: number) => void;
}

export const EditUserStoryModal: React.FC<EditUserStoryModalProps> = ({
  isOpen,
  story,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const navigate = useNavigate();
  const { currentProject, memberships } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectRoles, setProjectRoles] = useState<RoleItem[]>([]);

  // Detailed story object from server
  const [detailedStory, setDetailedStory] = useState<UserStory | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [milestoneId, setMilestoneId] = useState<number | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<number | ''>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedNote, setBlockedNote] = useState('');
  const [clientRequirement, setClientRequirement] = useState(false);
  const [teamRequirement, setTeamRequirement] = useState(false);

  // Description tab (edit vs preview)
  const [descriptionTab, setDescriptionTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Tasks & Attachments
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeSection, setActiveSection] = useState<'details' | 'tasks' | 'attachments'>('details');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status and error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load project milestones & roles when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      getMilestones(currentProject.id)
        .then((data) => setMilestones(data))
        .catch((err) => console.warn('Could not load milestones:', err));

      if (currentProject.roles && currentProject.roles.length > 0) {
        setProjectRoles(currentProject.roles);
      }
      getRoles(currentProject.id)
        .then((roles) => setProjectRoles(roles))
        .catch((err) => console.warn('Could not load roles:', err));
    }
  }, [isOpen, currentProject]);

  // Fetch full details via /api/v1/userstories/by_ref?order_by=backlog_order&project=...&ref=...
  useEffect(() => {
    if (!isOpen || !story || !currentProject) {
      setDetailedStory(null);
      return;
    }

    // Initialize with whatever we already have
    setSubject(story.subject || '');
    setDescription(story.description || '');
    setDescriptionHtml(story.description_html || '');
    setAssignedTo(story.assigned_to !== null && story.assigned_to !== undefined ? story.assigned_to : '');
    setStatusId(story.status || '');
    setMilestoneId(story.milestone !== null && story.milestone !== undefined ? story.milestone : '');
    setTags(story.tags || []);
    setIsBlocked(!!story.is_blocked);
    setBlockedNote(story.blocked_note || '');
    setClientRequirement(!!story.client_requirement);
    setTeamRequirement(!!story.team_requirement);
    setConfirmDelete(false);
    setErrorMessage(null);
    setDescriptionTab('edit');
    setActiveSection('details');

    // Query full story details from server
    setIsLoadingDetails(true);

    Promise.all([
      getUserStoryByRef(currentProject.id, story.ref, { order_by: 'backlog_order' }),
      getUserStoryAttachments(currentProject.id, story.id).catch(() => [] as Attachment[]),
      getTasksByStory(currentProject.id, story.id).catch(() => [] as Task[]),
    ])
      .then(([fullStory, attachmentsData, tasksData]) => {
        setDetailedStory(fullStory);
        setSubject(fullStory.subject || '');
        setDescription(fullStory.description || '');
        setDescriptionHtml(fullStory.description_html || '');
        setAssignedTo(fullStory.assigned_to !== null && fullStory.assigned_to !== undefined ? fullStory.assigned_to : '');
        setStatusId(fullStory.status || '');
        setMilestoneId(fullStory.milestone !== null && fullStory.milestone !== undefined ? fullStory.milestone : '');
        setTags(fullStory.tags || []);
        setIsBlocked(!!fullStory.is_blocked);
        setBlockedNote(fullStory.blocked_note || '');
        setClientRequirement(!!fullStory.client_requirement);
        setTeamRequirement(!!fullStory.team_requirement);
        setAttachments(attachmentsData);
        setTasks(tasksData);

        // Determine points value
        if (fullStory.points && typeof fullStory.points === 'object') {
          const pointValues = Object.values(fullStory.points);
          if (pointValues.length > 0 && pointValues[0] !== null) {
            setSelectedPointId(Number(pointValues[0]));
          }
        }
      })
      .catch((err) => {
        console.error('Error querying detailed story by_ref:', err);
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  }, [isOpen, story, currentProject]);

  if (!isOpen || !story || !currentProject) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Helper to insert markdown formatting in textarea
  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !story) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        subject: subject.trim(),
        description: description.trim(),
        status: statusId !== '' ? Number(statusId) : story.status,
        assigned_to: assignedTo !== '' ? Number(assignedTo) : null,
        milestone: milestoneId !== '' ? Number(milestoneId) : null,
        tags: tags,
        is_blocked: isBlocked,
        blocked_note: isBlocked ? blockedNote.trim() : '',
        client_requirement: clientRequirement,
        team_requirement: teamRequirement,
        version: detailedStory ? detailedStory.version : story.version,
      };

      // Only computable roles can have points in Taiga
      if (selectedPointId !== '') {
        const availableRoles = projectRoles.length > 0 ? projectRoles : (currentProject.roles || []);
        const computableRoles = availableRoles.filter((r) => r.computable === true);
        if (computableRoles.length > 0) {
          const pointsMap: Record<string, number> = {};
          computableRoles.forEach((r) => {
            pointsMap[r.id.toString()] = Number(selectedPointId);
          });
          payload.points = pointsMap;
        }
      }

      const updated = await updateUserStory(story.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Error updating user story:', err);
      let msg = err?.data?._error_message || err?.data?.detail;
      if (!msg && err?.data && typeof err.data === 'object') {
        const entries = Object.entries(err.data);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          const errorText = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          msg = `${field}: ${errorText}`;
        }
      }
      setErrorMessage(msg || err.message || 'Error al actualizar la historia de usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteUserStory(story.id);
      if (onDeleted) {
        onDeleted(story.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting user story:', err);
      const msg = err?.data?._error_message || err?.message || 'Error al eliminar la historia';
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  // Task inline actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSubject.trim()) return;
    setIsCreatingTask(true);
    try {
      const defaultStatus = currentProject.default_task_status || currentProject.task_statuses?.[0]?.id || 1;
      const created = await createTask({
        project: currentProject.id,
        user_story: story.id,
        subject: newTaskSubject.trim(),
        status: defaultStatus,
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskSubject('');
    } catch (err: any) {
      alert(`Error al crear tarea: ${err.message}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTaskClosed = async (task: Task) => {
    const nextClosed = !task.is_closed;
    const closedStatus = currentProject.task_statuses?.find((s) => s.is_closed)?.id;
    const openStatus = currentProject.task_statuses?.find((s) => !s.is_closed)?.id;
    const nextStatus = nextClosed ? (closedStatus || task.status) : (openStatus || task.status);

    try {
      const updated = await updateTask(task.id, {
        is_closed: nextClosed,
        status: nextStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
    } catch (err: any) {
      alert(`Error al actualizar tarea: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(`Error al eliminar tarea: ${err.message}`);
    }
  };

  // Attachment upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAttachment(true);
    try {
      const uploaded = await uploadUserStoryAttachment(currentProject.id, story.id, file);
      setAttachments((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      alert(`Error al subir archivo: ${err.message}`);
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteUserStoryAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(`Error al eliminar adjunto: ${err.message}`);
    }
  };

  const statuses = currentProject.us_statuses || [];
  const pointsList = currentProject.points || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#008db8]/10 text-[#008db8]">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black text-[#008db8]">
                  #{story.ref}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {subject || story.subject}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{currentProject.name}</span>
                {detailedStory?.owner_extra_info && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Creado por {detailedStory.owner_extra_info.full_name_display}
                    </span>
                  </>
                )}
                {isLoadingDetails && (
                  <span className="flex items-center gap-1 text-brand-600 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando datos completos...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/project/${currentProject.slug}/us/${story.ref}`);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
              title="Abrir página completa"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Página completa</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('details')}
            className={`px-3.5 py-2 border-b-2 transition-colors ${
              activeSection === 'details'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Detalles & Formulario
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tasks')}
            className={`px-3.5 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'tasks'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Tareas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px]">
              {tasks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('attachments')}
            className={`px-3.5 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'attachments'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Adjuntos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px]">
              {attachments.length}
            </span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Details & Form */}
        {activeSection === 'details' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Título de la Historia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Como usuario quiero poder filtrar tareas por estado..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              />
            </div>

            {/* Grid: Status & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Estado</span>
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_closed ? '(Cerrado)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned to */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Asignar a</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sin asignar</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.user}>
                      {m.full_name || m.username} ({m.role_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid: Sprint & Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sprint */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sprint / Iteración</span>
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Product Backlog (Sin Sprint)</option>
                  {milestones.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.name} ({ms.closed ? 'Cerrado' : 'Activo'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Estimación (Puntos)</span>
                </label>
                <select
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sin estimar</option>
                  {pointsList.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.value !== null ? `${pt.value} pts` : '?'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description with formatting toolbar & Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Descripción y Criterios de Aceptación</span>
                </label>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDescriptionTab('edit')}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                      descriptionTab === 'edit'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescriptionTab('preview')}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                      descriptionTab === 'preview'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Vista previa
                  </button>
                </div>
              </div>

              {descriptionTab === 'edit' ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  {/* Markdown Quick Toolbar */}
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Negrita"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Cursiva"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- ')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Lista con viñetas"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('1. ')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Lista numerada"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('### ')}
                      className="px-1.5 py-0.5 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Encabezado"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Cita"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('`', '`')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Código"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={7}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalla los requerimientos y criterios de aceptación (soporta formato Markdown)..."
                    className="w-full px-3.5 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-relaxed font-sans"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 min-h-[160px] max-h-[300px] overflow-y-auto">
                  <div
                    className="taiga-wysiwyg-content select-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        descriptionHtml ||
                        description ||
                        '<p class="text-slate-400 italic">Sin descripción proporcionada.</p>',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Etiquetas</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  placeholder="Escribe una etiqueta y presiona Enter..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Agregar
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements & Blocked */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamRequirement}
                    onChange={(e) => setTeamRequirement(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Requisito del equipo
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientRequirement}
                    onChange={(e) => setClientRequirement(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Requisito del cliente
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {isBlocked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Bloqueada
                  </span>
                </label>
              </div>

              {isBlocked && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5 animate-fade-in">
                  <label className="block text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    value={blockedNote}
                    onChange={(e) => setBlockedNote(e.target.value)}
                    placeholder="Ej. Esperando respuesta de cliente sobre credenciales..."
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-semibold">¿Seguro?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sí, eliminar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Associated Tasks */}
        {activeSection === 'tasks' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tareas de la Historia ({tasks.length})
              </h4>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No hay tareas asociadas aún.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskClosed(t)}
                        className="text-slate-400 hover:text-brand-600"
                      >
                        {t.is_closed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{t.ref}
                      </span>
                      <span
                        className={`text-xs truncate ${
                          t.is_closed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {t.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: t.status_extra_info?.color || '#64748b' }}
                      >
                        {t.status_extra_info?.name || 'Estado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Form */}
            <form onSubmit={handleCreateTask} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                placeholder="Nueva tarea para esta historia..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={isCreatingTask || !newTaskSubject.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isCreatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Agregar
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Attachments */}
        {activeSection === 'attachments' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Archivos Adjuntos ({attachments.length})
              </h4>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingAttachment}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Subir archivo
                </button>
              </div>
            </div>

            {attachments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No hay archivos adjuntos en esta historia.
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <div className="min-w-0">
                        <a
                          href={att.url || att.attached_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 truncate block"
                        >
                          {att.name}
                        </a>
                        <span className="text-[10px] text-slate-400 block">
                          {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={att.url || att.attached_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
