import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { createIssue } from '../../api/issues';
import { getMilestones } from '../../api/milestones';
import { Issue, Milestone } from '../../types/taiga';
import { 
  X, 
  Loader2, 
  User as UserIcon, 
  Tag as TagIcon, 
  Calendar, 
  AlertCircle, 
  FileText, 
  Bug,
  AlertTriangle,
  Flame,
  Activity,
  Lock
} from 'lucide-react';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (issue: Issue) => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { currentProject, memberships } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [severityId, setSeverityId] = useState<number | ''>('');
  const [priorityId, setPriorityId] = useState<number | ''>('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [milestoneId, setMilestoneId] = useState<number | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedNote, setBlockedNote] = useState('');

  // Status and error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load project milestones when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      getMilestones(currentProject.id)
        .then((data) => setMilestones(data))
        .catch((err) => console.warn('Could not load milestones:', err));
    }
  }, [isOpen, currentProject]);

  // Reset defaults when opened
  useEffect(() => {
    if (isOpen && currentProject) {
      setSubject('');
      setDescription('');
      setAssignedTo('');

      const defType = currentProject.default_issue_type || currentProject.issue_types?.[0]?.id || '';
      const defSeverity = currentProject.default_severity || currentProject.severities?.[0]?.id || '';
      const defPriority = currentProject.default_priority || currentProject.priorities?.[0]?.id || '';
      const defStatus = currentProject.default_issue_status || currentProject.issue_statuses?.[0]?.id || '';

      setTypeId(defType);
      setSeverityId(defSeverity);
      setPriorityId(defPriority);
      setStatusId(defStatus);
      setMilestoneId('');
      setTags([]);
      setTagInput('');
      setIsBlocked(false);
      setBlockedNote('');
      setErrorMessage(null);
    }
  }, [isOpen, currentProject]);

  if (!isOpen || !currentProject) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !currentProject) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const type = Number(typeId || currentProject.default_issue_type || currentProject.issue_types?.[0]?.id || 1);
      const severity = Number(severityId || currentProject.default_severity || currentProject.severities?.[0]?.id || 1);
      const priority = Number(priorityId || currentProject.default_priority || currentProject.priorities?.[0]?.id || 1);

      const payload: any = {
        project: currentProject.id,
        subject: subject.trim(),
        type,
        severity,
        priority,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      if (statusId !== '') {
        payload.status = Number(statusId);
      }

      if (assignedTo !== '') {
        payload.assigned_to = Number(assignedTo);
      } else {
        payload.assigned_to = null;
      }

      if (milestoneId !== '') {
        payload.milestone = Number(milestoneId);
      } else {
        payload.milestone = null;
      }

      if (tags.length > 0) {
        payload.tags = tags;
      }

      if (isBlocked) {
        payload.is_blocked = true;
        if (blockedNote.trim()) {
          payload.blocked_note = blockedNote.trim();
        }
      }

      const created = await createIssue(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Error creating issue:', err);
      let msg = err?.data?._error_message || err?.data?.detail;
      if (!msg && err?.data && typeof err.data === 'object') {
        const entries = Object.entries(err.data);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          const errorText = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          msg = `${field}: ${errorText}`;
        }
      }
      setErrorMessage(msg || err.message || 'Error al registrar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueTypes = currentProject.issue_types || [];
  const severities = currentProject.severities || [];
  const priorities = currentProject.priorities || [];
  const statuses = currentProject.issue_statuses || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Incidencia / Bug
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentProject.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Título o Asunto del Bug <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Error 500 al exportar reporte de ventas en PDF"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Grid: Assignee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assigned To */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Colaborador Asignado</span>
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

            {/* Status */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Estado de la Incidencia</span>
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.is_closed ? '(Cerrado)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Type, Severity & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Bug className="w-3.5 h-3.5 text-slate-400" />
                <span>Tipo <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={typeId}
                onChange={(e) => setTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {issueTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Severidad <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={severityId}
                onChange={(e) => setSeverityId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {severities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Prioridad <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint / Milestone (Optional) */}
          {milestones.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sprint / Milestone Asociado (Opcional)</span>
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Ninguno</option>
                {milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.name} {ms.closed ? '(Cerrado)' : '(Activo)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Descripción y Pasos para Reproducir</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pasos para reproducir:&#10;1. Navegar a /reportes&#10;2. Filtrar por rango de fechas&#10;3. Clic en 'Exportar PDF'&#10;&#10;Comportamiento esperado: Descarga de archivo PDF&#10;Comportamiento actual: Muestra pantalla en blanco y error 500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Etiquetas (Tags)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-700 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder={tags.length === 0 ? "Escribe una etiqueta y presiona Enter..." : "Agregar otra..."}
                className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-1"
              />
            </div>
          </div>

          {/* Blocked flag */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Marcar como Bloqueada
              </span>
            </label>

            {isBlocked && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={blockedNote}
                  onChange={(e) => setBlockedNote(e.target.value)}
                  placeholder="Motivo del bloqueo..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-900 dark:text-rose-200 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Guardando...' : 'Crear Incidencia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
