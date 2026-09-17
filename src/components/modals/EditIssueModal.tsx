import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import {
  getIssueByRef,
  getIssueAttachments,
  uploadIssueAttachment,
  deleteIssueAttachment,
  updateIssue,
  deleteIssue,
} from '../../api/issues';
import { getMilestones } from '../../api/milestones';
import { Issue, Milestone, Attachment } from '../../types/taiga';
import {
  X,
  Loader2,
  User as UserIcon,
  Tag as TagIcon,
  Calendar,
  AlertCircle,
  FileText,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
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
  Eye,
  Edit3,
} from 'lucide-react';

interface EditIssueModalProps {
  isOpen: boolean;
  issue: Issue | null;
  onClose: () => void;
  onUpdated: (updatedIssue: Issue) => void;
  onDeleted?: (deletedIssueId: number) => void;
}

export const EditIssueModal: React.FC<EditIssueModalProps> = ({
  isOpen,
  issue,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const navigate = useNavigate();
  const { currentProject, memberships } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Detailed issue from server
  const [detailedIssue, setDetailedIssue] = useState<Issue | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [severityId, setSeverityId] = useState<number | ''>('');
  const [priorityId, setPriorityId] = useState<number | ''>('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [milestoneId, setMilestoneId] = useState<number | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedNote, setBlockedNote] = useState('');

  // Description tab & attachments
  const [descriptionTab, setDescriptionTab] = useState<'edit' | 'preview'>('edit');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeSection, setActiveSection] = useState<'details' | 'attachments'>('details');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Status and error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load project milestones when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      getMilestones(currentProject.id)
        .then((data) => setMilestones(data))
        .catch((err) => console.warn('Could not load milestones:', err));
    }
  }, [isOpen, currentProject]);

  // Query full issue details via by_ref
  useEffect(() => {
    if (!isOpen || !issue || !currentProject) {
      setDetailedIssue(null);
      return;
    }

    setSubject(issue.subject || '');
    setDescription(issue.description || '');
    setTypeId(issue.type || '');
    setSeverityId(issue.severity || '');
    setPriorityId(issue.priority || '');
    setStatusId(issue.status || '');
    setAssignedTo(issue.assigned_to !== null && issue.assigned_to !== undefined ? issue.assigned_to : '');
    setMilestoneId(issue.milestone !== null && issue.milestone !== undefined ? issue.milestone : '');
    setTags(issue.tags || []);
    setIsBlocked(!!issue.is_blocked);
    setBlockedNote(issue.blocked_note || '');
    setConfirmDelete(false);
    setErrorMessage(null);
    setDescriptionTab('edit');
    setActiveSection('details');

    setIsLoadingDetails(true);

    Promise.all([
      getIssueByRef(currentProject.id, issue.ref),
      getIssueAttachments(currentProject.id, issue.id).catch(() => [] as Attachment[]),
    ])
      .then(([fullIssue, attachmentsData]) => {
        setDetailedIssue(fullIssue);
        setSubject(fullIssue.subject || '');
        setDescription(fullIssue.description || '');
        setTypeId(fullIssue.type || '');
        setSeverityId(fullIssue.severity || '');
        setPriorityId(fullIssue.priority || '');
        setStatusId(fullIssue.status || '');
        setAssignedTo(fullIssue.assigned_to !== null && fullIssue.assigned_to !== undefined ? fullIssue.assigned_to : '');
        setMilestoneId(fullIssue.milestone !== null && fullIssue.milestone !== undefined ? fullIssue.milestone : '');
        setTags(fullIssue.tags || []);
        setIsBlocked(!!fullIssue.is_blocked);
        setBlockedNote(fullIssue.blocked_note || '');
        setAttachments(attachmentsData);
      })
      .catch((err) => {
        console.error('Error querying detailed issue by_ref:', err);
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  }, [isOpen, issue, currentProject]);

  if (!isOpen || !issue || !currentProject) return null;

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
    if (!subject.trim() || !issue) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        subject: subject.trim(),
        description: description.trim(),
        type: typeId !== '' ? Number(typeId) : issue.type,
        severity: severityId !== '' ? Number(severityId) : issue.severity,
        priority: priorityId !== '' ? Number(priorityId) : issue.priority,
        status: statusId !== '' ? Number(statusId) : issue.status,
        assigned_to: assignedTo !== '' ? Number(assignedTo) : null,
        milestone: milestoneId !== '' ? Number(milestoneId) : null,
        tags: tags,
        is_blocked: isBlocked,
        blocked_note: isBlocked ? blockedNote.trim() : '',
        version: detailedIssue ? detailedIssue.version : issue.version,
      };

      const updated = await updateIssue(issue.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Error updating issue:', err);
      let msg = err?.data?._error_message || err?.data?.detail;
      if (!msg && err?.data && typeof err.data === 'object') {
        const entries = Object.entries(err.data);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          const errorText = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          msg = `${field}: ${errorText}`;
        }
      }
      setErrorMessage(msg || err.message || 'Error al actualizar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteIssue(issue.id);
      if (onDeleted) {
        onDeleted(issue.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting issue:', err);
      const msg = err?.data?._error_message || err?.message || 'Error al eliminar la incidencia';
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAttachment(true);
    try {
      const uploaded = await uploadIssueAttachment(currentProject.id, issue.id, file);
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
      await deleteIssueAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(`Error al eliminar adjunto: ${err.message}`);
    }
  };

  const types = currentProject.issue_types || [];
  const severities = currentProject.severities || [];
  const priorities = currentProject.priorities || [];
  const statuses = currentProject.issue_statuses || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-500">
                  #{issue.ref}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {subject || issue.subject}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{currentProject.name}</span>
                {isLoadingDetails && (
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
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
                navigate(`/project/${currentProject.slug}/issue/${issue.ref}`);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('details')}
            className={`px-3.5 py-2 border-b-2 transition-colors ${
              activeSection === 'details'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Detalles & Formulario
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('attachments')}
            className={`px-3.5 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'attachments'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
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

        {/* Form Body */}
        {activeSection === 'details' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Asunto de la Incidencia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Error al procesar pago en pasarela..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              />
            </div>

            {/* Grid 1: Type & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo
                </label>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Severidad
                </label>
                <select
                  value={severityId}
                  onChange={(e) => setSeverityId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {severities.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 2: Priority & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Prioridad
                </label>
                <select
                  value={priorityId}
                  onChange={(e) => setPriorityId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Estado
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_closed ? '(Cerrada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 3: Assignee & Sprint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Asignar a</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Sin asignar</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.user}>
                      {m.full_name || m.username} ({m.role_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sprint / Milestone</span>
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Sin Sprint</option>
                  {milestones.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.name} ({ms.closed ? 'Cerrado' : 'Activo'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Descripción detallada</span>
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
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe los pasos para reproducir el fallo, comportamiento esperado y actual..."
                    className="w-full px-3.5 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 min-h-[140px] max-h-[260px] overflow-y-auto">
                  <div
                    className="taiga-wysiwyg-content select-text"
                    dangerouslySetInnerHTML={{
                      __html:
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
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
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

            {/* Blocked state */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
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

              {isBlocked && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    value={blockedNote}
                    onChange={(e) => setBlockedNote(e.target.value)}
                    placeholder="Ej. Falta de logs de servidor..."
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Attachments */}
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
                No hay archivos adjuntos en esta incidencia.
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
                          className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-rose-600 truncate block"
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
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
