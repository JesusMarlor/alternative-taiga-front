import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { updateUserStory, deleteUserStory } from '../../api/userstories';
import { getMilestones } from '../../api/milestones';
import { getRoles } from '../../api/roles';
import { UserStory, Milestone, RoleItem } from '../../types/taiga';
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
  Trash2,
  CheckCircle2,
  ExternalLink
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
  const { currentProject, memberships } = useProjectStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectRoles, setProjectRoles] = useState<RoleItem[]>([]);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
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

  // Sync with selected story
  useEffect(() => {
    if (isOpen && story) {
      setSubject(story.subject || '');
      setDescription(story.description || '');
      setAssignedTo(story.assigned_to !== null && story.assigned_to !== undefined ? story.assigned_to : '');
      setStatusId(story.status || '');
      setMilestoneId(story.milestone !== null && story.milestone !== undefined ? story.milestone : '');
      setTags(story.tags || []);
      setTagInput('');
      setIsBlocked(!!story.is_blocked);
      setBlockedNote(story.blocked_note || '');
      setClientRequirement(!!story.client_requirement);
      setTeamRequirement(!!story.team_requirement);
      setConfirmDelete(false);
      setErrorMessage(null);

      // Determine points value
      if (story.points && typeof story.points === 'object') {
        const pointValues = Object.values(story.points);
        if (pointValues.length > 0 && pointValues[0] !== null) {
          setSelectedPointId(Number(pointValues[0]));
        } else {
          setSelectedPointId('');
        }
      } else {
        setSelectedPointId('');
      }
    }
  }, [isOpen, story]);

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

  const statuses = currentProject.us_statuses || [];
  const pointsList = currentProject.points || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  #{story.ref}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Historia de Usuario
                </h3>
              </div>
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

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
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

          {/* Grid: Sprint / Milestone & Points */}
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

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Descripción y Criterios de Aceptación</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla los requerimientos y criterios de aceptación..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono leading-relaxed"
            />
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

          {/* Checkboxes / Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientRequirement}
                  onChange={(e) => setClientRequirement(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Requerimiento de Cliente
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamRequirement}
                  onChange={(e) => setTeamRequirement(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Requerimiento de Equipo
                </span>
              </label>
            </div>

            {/* Blocked toggle */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBlocked}
                  onChange={(e) => setIsBlocked(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Marcar como bloqueada
                </span>
              </label>

              {isBlocked && (
                <input
                  type="text"
                  value={blockedNote}
                  onChange={(e) => setBlockedNote(e.target.value)}
                  placeholder="Motivo del bloqueo (ej. esperando respuesta de cliente)..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Delete button or confirmation */}
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-bold">¿Seguro?</span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sí, eliminar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !subject.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
