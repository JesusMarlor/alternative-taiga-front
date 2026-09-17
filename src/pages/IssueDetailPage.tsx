import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import {
  getIssueByRef,
  getIssueAttachments,
  uploadIssueAttachment,
  deleteIssueAttachment,
  updateIssue,
  deleteIssue,
} from '../api/issues';
import { Issue, Attachment, StatusItem } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import {
  ChevronLeft,
  Trash2,
  Paperclip,
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
  Bug,
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { slug, ref } = useParams<{ slug: string; ref: string }>();
  const navigate = useNavigate();
  const { currentProject, memberships } = useProjectStore();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit drafts
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

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
      const issueData = await getIssueByRef(currentProject.id, ref);
      setIssue(issueData);
      setSubjectDraft(issueData.subject);
      setDescriptionDraft(issueData.description || '');
      setBlockedNoteInput(issueData.blocked_note || '');

      const attachmentsData = await getIssueAttachments(currentProject.id, issueData.id).catch((err) => {
        console.warn('Could not load issue attachments:', err);
        return [] as Attachment[];
      });

      setAttachments(attachmentsData);
    } catch (err: any) {
      console.error('Error loading issue detail:', err);
      setError(err?.message || 'Error al cargar la incidencia');
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
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <span className="text-sm font-medium text-slate-500">Cargando incidencia...</span>
      </div>
    );
  }

  if (error || !issue || !currentProject) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No se pudo encontrar la incidencia #{ref}
        </h2>
        <p className="text-xs text-slate-500">{error || 'Verifica el enlace o tus permisos en este proyecto.'}</p>
        <button
          onClick={() => navigate(`/project/${slug}/issues`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Incidencias
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
    if (!subjectDraft.trim() || subjectDraft === issue.subject) {
      setIsEditingSubject(false);
      return;
    }
    try {
      const updated = await updateIssue(issue.id, {
        subject: subjectDraft.trim(),
        version: issue.version,
      });
      setIssue(updated);
      setIsEditingSubject(false);
    } catch (err: any) {
      alert(`Error al actualizar asunto: ${err.message}`);
    }
  };

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      const updated = await updateIssue(issue.id, {
        description: descriptionDraft,
        version: issue.version,
      });
      setIssue(updated);
      setIsEditingDescription(false);
    } catch (err: any) {
      alert(`Error al guardar descripción: ${err.message}`);
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleFieldChange = async (fields: Partial<Issue>) => {
    try {
      const updated = await updateIssue(issue.id, {
        ...fields,
        version: issue.version,
      });
      setIssue(updated);
    } catch (err: any) {
      alert(`Error al actualizar incidencia: ${err.message}`);
    }
  };

  const handleToggleBlocked = async () => {
    const nextBlocked = !issue.is_blocked;
    try {
      const updated = await updateIssue(issue.id, {
        is_blocked: nextBlocked,
        blocked_note: nextBlocked ? blockedNoteInput : '',
        version: issue.version,
      });
      setIssue(updated);
      if (!nextBlocked) {
        setIsEditingBlockedNote(false);
      }
    } catch (err: any) {
      alert(`Error al alternar bloqueo: ${err.message}`);
    }
  };

  const handleSaveBlockedNote = async () => {
    try {
      const updated = await updateIssue(issue.id, {
        blocked_note: blockedNoteInput,
        version: issue.version,
      });
      setIssue(updated);
      setIsEditingBlockedNote(false);
    } catch (err: any) {
      alert(`Error al guardar nota de bloqueo: ${err.message}`);
    }
  };

  // Attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const uploaded = await uploadIssueAttachment(currentProject.id, issue.id, file);
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
      await deleteIssueAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      alert(`Error al eliminar adjunto: ${err.message}`);
    }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm(`¿Seguro que deseas eliminar la incidencia #${issue.ref} "${issue.subject}"?`)) {
      return;
    }
    try {
      await deleteIssue(issue.id);
      navigate(`/project/${slug}/issues`);
    } catch (err: any) {
      alert(`Error al eliminar incidencia: ${err.message}`);
    }
  };

  // Format helpers
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

  const statuses: StatusItem[] = currentProject.issue_statuses || [];
  const currentStatus = statuses.find((s) => s.id === issue.status);

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
            <Link to={`/project/${slug}/issues`} className="hover:text-rose-600 transition-colors">
              Incidencias
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">Incidencia #{issue.ref}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Box */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl font-black text-rose-500 font-mono">
                      #{issue.ref}
                    </span>
                    {isEditingSubject ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={subjectDraft}
                          onChange={(e) => setSubjectDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSubject()}
                          autoFocus
                          className="flex-1 text-xl lg:text-2xl font-bold bg-white dark:bg-slate-800 border border-rose-500 rounded-lg px-2.5 py-1 focus:outline-none"
                        />
                        <button
                          onClick={handleSaveSubject}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSubjectDraft(issue.subject);
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
                        className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors cursor-pointer group flex items-center gap-2"
                        title="Haz clic para editar asunto"
                      >
                        <span>{issue.subject}</span>
                        <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                      </h1>
                    )}
                  </div>

                  <span className="text-[11px] font-bold tracking-wider uppercase text-rose-500 flex items-center gap-1 mt-1">
                    <Bug className="w-3.5 h-3.5" />
                    ISSUE
                  </span>
                </div>
              </div>

              {/* Sub-header info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {issue.type_extra_info && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md text-white shadow-xs"
                      style={{ backgroundColor: issue.type_extra_info.color || '#64748b' }}
                    >
                      {issue.type_extra_info.name}
                    </span>
                  )}
                  {issue.severity_extra_info && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md text-white shadow-xs"
                      style={{ backgroundColor: issue.severity_extra_info.color || '#64748b' }}
                    >
                      {issue.severity_extra_info.name}
                    </span>
                  )}
                  {issue.priority_extra_info && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md text-white shadow-xs"
                      style={{ backgroundColor: issue.priority_extra_info.color || '#64748b' }}
                    >
                      {issue.priority_extra_info.name}
                    </span>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Creado: {formatDate(issue.created_date)}</span>
                </div>
              </div>
            </div>

            {/* Description & Rich Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
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
                    title="Negrita"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingDescription}
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    title="Cursiva"
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
                          setDescriptionDraft(issue.description || '');
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-rose-500 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar descripción
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      rows={14}
                      className="w-full text-sm font-sans p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
                      placeholder="Escribe la descripción de la incidencia (soporta Markdown)..."
                    />
                  </div>
                ) : (
                  <div
                    className="taiga-wysiwyg-content select-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        issue.description ||
                        '<p class="text-slate-400 italic">Sin descripción proporcionada.</p>',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Attachments Section */}
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Subir archivo
                  </button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No hay archivos adjuntos en esta incidencia.
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
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-rose-600 truncate block"
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detalles de Incidencia
              </h3>

              {/* Status Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={issue.status}
                    onChange={(e) => handleFieldChange({ status: Number(e.target.value) })}
                    className="w-full text-xs font-semibold py-2 px-3 pl-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
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

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipo
                </label>
                <select
                  value={issue.type}
                  onChange={(e) => handleFieldChange({ type: Number(e.target.value) })}
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  {(currentProject.issue_types || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Severidad
                </label>
                <select
                  value={issue.severity}
                  onChange={(e) => handleFieldChange({ severity: Number(e.target.value) })}
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  {(currentProject.severities || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prioridad
                </label>
                <select
                  value={issue.priority}
                  onChange={(e) => handleFieldChange({ priority: Number(e.target.value) })}
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  {(currentProject.priorities || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Responsable
                </label>
                <select
                  value={issue.assigned_to || ''}
                  onChange={(e) =>
                    handleFieldChange({
                      assigned_to: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Sin asignar</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.user}>
                      {m.full_name} ({m.role_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sprint / Milestone
                </label>
                <select
                  value={issue.milestone || ''}
                  onChange={(e) =>
                    handleFieldChange({
                      milestone: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Sin asignar</option>
                  {(currentProject.milestones || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blocked state */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {issue.is_blocked ? (
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
                      issue.is_blocked
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {issue.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>

                {issue.is_blocked && (
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
                        {issue.blocked_note || <span className="italic text-rose-400">Sin nota especificada</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteIssue}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Incidencia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
