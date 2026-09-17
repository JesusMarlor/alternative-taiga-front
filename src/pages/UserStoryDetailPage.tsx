import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import {
  getUserStoryByRef,
  getUserStoryAttachments,
  uploadUserStoryAttachment,
  deleteUserStoryAttachment,
  updateUserStory,
  deleteUserStory,
} from '../api/userstories';
import { getTasksByStory, createTask, updateTask, deleteTask } from '../api/tasks';
import { UserStory, Task, Attachment, StatusItem } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  Circle,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Check,
  X,
  Pencil,
  Save,
} from 'lucide-react';

export const UserStoryDetailPage: React.FC = () => {
  const { slug, ref } = useParams<{ slug: string; ref: string }>();
  const navigate = useNavigate();
  const { currentProject, memberships } = useProjectStore();

  const [story, setStory] = useState<UserStory | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Tag draft
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // New task draft
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | undefined>(undefined);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Blocked modal/note
  const [blockedNoteInput, setBlockedNoteInput] = useState('');
  const [isEditingBlockedNote, setIsEditingBlockedNote] = useState(false);

  // Textarea ref for inserting formatting
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const loadData = useCallback(async () => {
    if (!currentProject || !ref) return;
    setIsLoading(true);
    setError(null);
    try {
      const storyData = await getUserStoryByRef(currentProject.id, ref);
      setStory(storyData);
      setSubjectDraft(storyData.subject);
      setDescriptionDraft(storyData.description || '');
      setBlockedNoteInput(storyData.blocked_note || '');

      // Load tasks and attachments in parallel
      const [attachmentsData, tasksData] = await Promise.all([
        getUserStoryAttachments(currentProject.id, storyData.id).catch((err) => {
          console.warn('Could not load attachments:', err);
          return [] as Attachment[];
        }),
        getTasksByStory(currentProject.id, storyData.id).catch((err) => {
          console.warn('Could not load tasks:', err);
          return [] as Task[];
        }),
      ]);

      setAttachments(attachmentsData);
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Error loading user story detail:', err);
      setError(err?.message || 'Error al cargar la historia de usuario');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, ref]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <span className="text-sm font-medium text-slate-500">Cargando información completa...</span>
      </div>
    );
  }

  if (error || !story || !currentProject) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No se pudo encontrar la historia #{ref}
        </h2>
        <p className="text-xs text-slate-500">{error || 'Verifica el enlace o tus permisos en este proyecto.'}</p>
        <button
          onClick={() => navigate(`/project/${slug}/kanban`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al Kanban
        </button>
      </div>
    );
  }

  // Formatting helpers for rich markdown editor
  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDescriptionDraft(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  // Handlers
  const handleSaveSubject = async () => {
    if (!subjectDraft.trim() || subjectDraft === story.subject) {
      setIsEditingSubject(false);
      return;
    }
    try {
      const updated = await updateUserStory(story.id, {
        subject: subjectDraft.trim(),
        version: story.version,
      });
      setStory(updated);
      setIsEditingSubject(false);
    } catch (err: any) {
      alert(`Error al actualizar asunto: ${err.message}`);
    }
  };

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      const updated = await updateUserStory(story.id, {
        description: descriptionDraft,
        version: story.version,
      });
      setStory(updated);
      setIsEditingDescription(false);
    } catch (err: any) {
      alert(`Error al guardar descripción: ${err.message}`);
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleStatusChange = async (statusId: number) => {
    try {
      const updated = await updateUserStory(story.id, {
        status: statusId,
        version: story.version,
      });
      setStory(updated);
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const handleAssigneeChange = async (userId: number | null) => {
    try {
      const updated = await updateUserStory(story.id, {
        assigned_to: userId,
        version: story.version,
      });
      setStory(updated);
    } catch (err: any) {
      alert(`Error al asignar colaborador: ${err.message}`);
    }
  };

  const handleMilestoneChange = async (milestoneId: number | null) => {
    try {
      const updated = await updateUserStory(story.id, {
        milestone: milestoneId,
        version: story.version,
      });
      setStory(updated);
    } catch (err: any) {
      alert(`Error al cambiar sprint: ${err.message}`);
    }
  };

  const handleToggleBlocked = async () => {
    const nextBlocked = !story.is_blocked;
    try {
      const updated = await updateUserStory(story.id, {
        is_blocked: nextBlocked,
        blocked_note: nextBlocked ? blockedNoteInput : '',
        version: story.version,
      });
      setStory(updated);
      if (!nextBlocked) {
        setIsEditingBlockedNote(false);
      }
    } catch (err: any) {
      alert(`Error al alternar bloqueo: ${err.message}`);
    }
  };

  const handleSaveBlockedNote = async () => {
    try {
      const updated = await updateUserStory(story.id, {
        blocked_note: blockedNoteInput,
        version: story.version,
      });
      setStory(updated);
      setIsEditingBlockedNote(false);
    } catch (err: any) {
      alert(`Error al guardar nota de bloqueo: ${err.message}`);
    }
  };

  const handlePointChange = async (roleId: string, pointId: number) => {
    const newPoints = { ...(story.points || {}), [roleId]: pointId };
    try {
      const updated = await updateUserStory(story.id, {
        points: newPoints,
        version: story.version,
      });
      setStory(updated);
    } catch (err: any) {
      alert(`Error al actualizar puntos: ${err.message}`);
    }
  };

  const handleAddTag = async () => {
    const tag = newTagInput.trim();
    if (!tag) {
      setIsAddingTag(false);
      return;
    }
    const currentTags = story.tags || [];
    if (currentTags.includes(tag)) {
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }
    const nextTags = [...currentTags, tag];
    try {
      const updated = await updateUserStory(story.id, {
        tags: nextTags,
        version: story.version,
      });
      setStory(updated);
      setNewTagInput('');
      setIsAddingTag(false);
    } catch (err: any) {
      alert(`Error al agregar etiqueta: ${err.message}`);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = (story.tags || []).filter((t) => t !== tagToRemove);
    try {
      const updated = await updateUserStory(story.id, {
        tags: nextTags,
        version: story.version,
      });
      setStory(updated);
    } catch (err: any) {
      alert(`Error al remover etiqueta: ${err.message}`);
    }
  };

  // Task handlers
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
        assigned_to: newTaskAssignee,
        status: defaultStatus,
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskSubject('');
      setNewTaskAssignee(undefined);
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
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(`Error al eliminar tarea: ${err.message}`);
    }
  };

  // Attachment handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const uploaded = await uploadUserStoryAttachment(currentProject.id, story.id, file);
      setAttachments((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      alert(`Error al subir archivo: ${err.message}`);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('¿Eliminar este archivo adjunto?')) return;
    try {
      await deleteUserStoryAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(`Error al eliminar adjunto: ${err.message}`);
    }
  };

  const handleDeleteStory = async () => {
    if (!window.confirm(`¿Seguro que deseas eliminar la historia #${story.ref} "${story.subject}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteUserStory(story.id);
      navigate(`/project/${slug}/kanban`);
    } catch (err: any) {
      alert(`Error al eliminar historia: ${err.message}`);
    }
  };

  // Format date helper
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <FileImage className="w-5 h-5 text-indigo-500" />;
    }
    if (['csv', 'xls', 'xlsx'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const statuses: StatusItem[] = currentProject.us_statuses || [];
  const currentStatus = statuses.find((s) => s.id === story.status);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link to={`/project/${slug}/kanban`} className="hover:text-brand-600 transition-colors">
              {currentProject.name}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">Historia #{story.ref}</span>
          </div>
        </div>

        {/* Quick Neighbors navigation if present */}
        <div className="flex items-center gap-1">
          {story.neighbors?.previous && (
            <Link
              to={`/project/${slug}/us/${story.neighbors.previous.ref}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Anterior: #${story.neighbors.previous.ref} ${story.neighbors.previous.subject}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          {story.neighbors?.next && (
            <Link
              to={`/project/${slug}/us/${story.neighbors.next.ref}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Siguiente: #${story.neighbors.next.ref} ${story.neighbors.next.subject}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column (Story details, formatted description, tasks, attachments) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Box */}
            <div className="space-y-3">
              {/* Ref + Subject Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl font-black text-[#008db8] font-mono">
                      #{story.ref}
                    </span>
                    {isEditingSubject ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={subjectDraft}
                          onChange={(e) => setSubjectDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSubject()}
                          autoFocus
                          className="flex-1 text-xl lg:text-2xl font-bold bg-white dark:bg-slate-800 border border-brand-500 rounded-lg px-2.5 py-1 focus:outline-none"
                        />
                        <button
                          onClick={handleSaveSubject}
                          className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSubjectDraft(story.subject);
                            setIsEditingSubject(false);
                          }}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h1
                        onClick={() => setIsEditingSubject(true)}
                        className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors cursor-pointer group flex items-center gap-2"
                        title="Haz clic para editar asunto"
                      >
                        <span>{story.subject}</span>
                        <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                      </h1>
                    )}
                  </div>

                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block mt-1">
                    USER STORY
                  </span>
                </div>
              </div>

              {/* Sub-header: Epics, Tags and Created info (matching user's screenshot) */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Epic link badge */}
                  {story.epics && story.epics.length > 0 ? (
                    story.epics.map((epic) => (
                      <span
                        key={epic.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md text-white shadow-xs"
                        style={{ backgroundColor: epic.color || '#7c3aed' }}
                      >
                        ▲ #{epic.ref} {epic.subject}
                      </span>
                    ))
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008db8] hover:text-[#007094] transition-colors"
                    >
                      ▲ Link to epic
                    </button>
                  )}

                  {/* Tags */}
                  {(story.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}

                  {/* Add tag button / input */}
                  {isAddingTag ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Nueva etiqueta..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        autoFocus
                        className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 w-28"
                      />
                      <button
                        onClick={handleAddTag}
                        className="text-xs p-1 text-brand-600 hover:text-brand-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsAddingTag(false)}
                        className="text-xs p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="inline-flex items-center gap-1 text-xs text-[#008db8] hover:underline font-medium"
                    >
                      Add tag +
                    </button>
                  )}
                </div>

                {/* Right side: Created by & Avatar */}
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="text-right">
                    <span className="block text-[11px]">
                      Created by{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {story.owner_extra_info?.full_name_display || 'Usuario'}
                      </span>
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {formatDate(story.created_date)}
                    </span>
                  </div>
                  <UserAvatar
                    name={story.owner_extra_info?.full_name_display}
                    photo={story.owner_extra_info?.photo}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Formatted Description & Rich Toolbar (Replicating user's screenshot) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* WYSIWYG Toolbar */}
              <div className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 px-3 py-2 flex flex-wrap items-center justify-between gap-1 text-slate-600 dark:text-slate-300">
                <div className="flex flex-wrap items-center gap-0.5">
                  <select
                    disabled={!isEditingDescription}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'h1') insertFormatting('# ');
                      if (val === 'h2') insertFormatting('## ');
                      if (val === 'h3') insertFormatting('### ');
                      if (val === 'p') insertFormatting('');
                    }}
                    className="text-xs bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-1 mr-1 text-slate-700 dark:text-slate-200 disabled:opacity-60 cursor-pointer"
                  >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                  </select>

                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Negrita (**bold**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Cursiva (*italic*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('~~', '~~')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Tachado"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('[', '](https://)')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Insertar enlace"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('- ')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Lista con viñetas"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('1. ')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Lista numerada"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('> ')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Cita"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('`', '`')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Código en línea"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('\n---\n')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Separador horizontal"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit / Save controls */}
                <div className="flex items-center gap-2">
                  {isEditingDescription ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDescription}
                        disabled={isSavingDescription}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                      >
                        {isSavingDescription ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDescriptionDraft(story.description || '');
                          setIsEditingDescription(false);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-brand-500 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar descripción
                    </button>
                  )}
                </div>
              </div>

              {/* Description Content */}
              <div className="p-6">
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      rows={14}
                      className="w-full text-sm font-sans p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                      placeholder="Escribe la descripción de la historia (soporta Markdown)..."
                    />
                    <p className="text-[11px] text-slate-400">
                      Soporta sintaxis Markdown completa: títulos (#), negritas (**), listas (-), código (`), etc.
                    </p>
                  </div>
                ) : (
                  <div
                    className="taiga-wysiwyg-content select-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        story.description_html ||
                        story.description ||
                        '<p class="text-slate-400 italic">Sin descripción proporcionada.</p>',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Tasks Section (GET /api/v1/tasks?order_by=us_order&project=1&user_story=9) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tareas asociadas
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    {tasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              {tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No hay tareas registradas para esta historia.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskClosed(task)}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          {task.is_closed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-brand-500" />
                          )}
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{task.ref}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-medium truncate ${
                            task.is_closed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {task.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {task.assigned_to_extra_info && (
                          <div className="flex items-center gap-1.5" title={task.assigned_to_extra_info.full_name_display}>
                            <UserAvatar
                              name={task.assigned_to_extra_info.full_name_display}
                              photo={task.assigned_to_extra_info.photo}
                              size="xs"
                            />
                            <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[100px]">
                              {task.assigned_to_extra_info.full_name_display}
                            </span>
                          </div>
                        )}

                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{
                            backgroundColor: task.status_extra_info?.color || '#64748b',
                          }}
                        >
                          {task.status_extra_info?.name || 'Estado'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Task Form */}
              <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Escribe una nueva tarea para esta historia..."
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="flex-1 min-w-[200px] text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <select
                  value={newTaskAssignee || ''}
                  onChange={(e) =>
                    setNewTaskAssignee(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.user}>
                      {m.full_name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isCreatingTask || !newTaskSubject.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-xs disabled:opacity-50 transition-all"
                >
                  {isCreatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Añadir tarea
                </button>
              </form>
            </div>

            {/* Attachments Section (GET /api/v1/userstories/attachments?object_id=9&project=1) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Archivos adjuntos
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    {attachments.length}
                  </span>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {isUploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Subir archivo
                  </button>
                </div>
              </div>

              {/* Attachments list */}
              {attachments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No hay archivos adjuntos en esta historia de usuario.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(att.name || att.attached_file || '')}
                        <div className="min-w-0">
                          <a
                            href={att.url || att.attached_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                            title={att.name}
                          >
                            {att.name}
                          </a>
                          <span className="text-[10px] text-slate-400 block">
                            {formatFileSize(att.size)} • {formatDate(att.created_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={att.url || att.attached_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Descargar / Ver"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar adjunto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Metadata Panel */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estado & Asignación
              </h3>

              {/* Status Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estado actual
                </label>
                <div className="relative">
                  <select
                    value={story.status}
                    onChange={(e) => handleStatusChange(Number(e.target.value))}
                    className="w-full text-xs font-semibold py-2 px-3 pl-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500"
                  >
                    {statuses.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.is_closed ? '(Cerrado)' : ''}
                      </option>
                    ))}
                  </select>
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentStatus?.color || '#64748b' }}
                  />
                </div>
              </div>

              {/* Assignee Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Responsable
                </label>
                <select
                  value={story.assigned_to || ''}
                  onChange={(e) =>
                    handleAssigneeChange(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sin asignar</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.user}>
                      {m.full_name} ({m.role_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint / Milestone Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sprint / Milestone
                </label>
                <select
                  value={story.milestone || ''}
                  onChange={(e) =>
                    handleMilestoneChange(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sin asignar (Backlog)</option>
                  {(currentProject.milestones || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.closed ? '(Cerrado)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blocked state */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {story.is_blocked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Bloqueada
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleBlocked}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      story.is_blocked
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {story.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>

                {story.is_blocked && (
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase text-rose-500 block">
                      Motivo del bloqueo:
                    </span>
                    {isEditingBlockedNote ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={blockedNoteInput}
                          onChange={(e) => setBlockedNoteInput(e.target.value)}
                          rows={3}
                          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-900 border border-rose-300 focus:outline-none"
                          placeholder="Describe la razón..."
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={handleSaveBlockedNote}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px]"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setIsEditingBlockedNote(false)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingBlockedNote(true)}
                        className="cursor-pointer hover:text-rose-700"
                        title="Haz clic para editar"
                      >
                        {story.blocked_note || <span className="italic text-rose-400">Sin nota especificada</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Points by Role Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estimación de puntos
                </h3>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  Total: {story.total_points ?? 0} pts
                </span>
              </div>

              <div className="space-y-2">
                {(currentProject.roles || [])
                  .filter((r) => r.computable)
                  .map((role) => {
                    const pointVal = story.points?.[role.id.toString()];
                    return (
                      <div
                        key={role.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/80"
                      >
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {role.name}
                        </span>
                        <select
                          value={pointVal || ''}
                          onChange={(e) =>
                            handlePointChange(role.id.toString(), Number(e.target.value))
                          }
                          className="text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          {(currentProject.points || []).map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name} ({pt.value ?? '?'})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Requirements & Danger Zone */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Opciones avanzadas
              </h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!story.team_requirement}
                    onChange={async (e) => {
                      const updated = await updateUserStory(story.id, {
                        team_requirement: e.target.checked,
                        version: story.version,
                      });
                      setStory(updated);
                    }}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Requisito del equipo
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!story.client_requirement}
                    onChange={async (e) => {
                      const updated = await updateUserStory(story.id, {
                        client_requirement: e.target.checked,
                        version: story.version,
                      });
                      setStory(updated);
                    }}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Requisito del cliente
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Historia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
