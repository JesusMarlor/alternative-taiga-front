import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { createUserStory } from '../../api/userstories';
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
  Lock
} from 'lucide-react';

interface CreateUserStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (story: UserStory) => void;
  initialStatusId?: number;
  initialMilestoneId?: number | null;
}

export const CreateUserStoryModal: React.FC<CreateUserStoryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialStatusId,
  initialMilestoneId,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load project milestones and roles when modal opens
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

  // Reset defaults when opened
  useEffect(() => {
    if (isOpen && currentProject) {
      setSubject('');
      setDescription('');
      setAssignedTo('');
      
      const defaultStatus = initialStatusId || currentProject.default_us_status || currentProject.us_statuses?.[0]?.id || '';
      setStatusId(defaultStatus);

      if (initialMilestoneId !== undefined && initialMilestoneId !== null) {
        setMilestoneId(initialMilestoneId);
      } else {
        setMilestoneId('');
      }

      setSelectedPointId(currentProject.default_points || '');
      setTags([]);
      setTagInput('');
      setIsBlocked(false);
      setBlockedNote('');
      setClientRequirement(false);
      setTeamRequirement(false);
      setErrorMessage(null);
    }
  }, [isOpen, currentProject, initialStatusId, initialMilestoneId]);

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
      const payload: any = {
        project: currentProject.id,
        subject: subject.trim(),
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

      if (clientRequirement) {
        payload.client_requirement = true;
      }

      if (teamRequirement) {
        payload.team_requirement = true;
      }

      // In Taiga, only computable roles can have points.
      // If selectedPointId matches default or is empty, omit points so Taiga handles default assignment natively.
      if (selectedPointId !== '' && selectedPointId !== currentProject.default_points) {
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

      const created = await createUserStory(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Error creating user story:', err);
      let msg = err?.data?._error_message || err?.data?.detail;
      if (!msg && err?.data && typeof err.data === 'object') {
        const entries = Object.entries(err.data);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          const errorText = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          msg = `${field}: ${errorText}`;
        }
      }
      setErrorMessage(msg || err.message || 'Error al crear la historia de usuario');
    } finally {
      setIsSubmitting(false);
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Historia de Usuario
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
              Título de la Historia <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Implementar pasarela de pagos con Stripe"
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
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span>Estado del Flujo</span>
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
                    {ms.name} {ms.closed ? '(Cerrado)' : '(Activo)'}
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
                <option value="">Por defecto / Sin estimar</option>
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
              placeholder="Como [rol], quiero [funcionalidad] para [beneficio]...&#10;&#10;Criterios de aceptación:&#10;- [ ] Debe validar campos obligatorios&#10;- [ ] Enviar confirmación al usuario"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 ml-0.5"
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

          {/* Extra flags */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={clientRequirement}
                  onChange={(e) => setClientRequirement(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Petición de Cliente</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={teamRequirement}
                  onChange={(e) => setTeamRequirement(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Requerimiento Técnico</span>
              </label>

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
            </div>

            {isBlocked && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={blockedNote}
                  onChange={(e) => setBlockedNote(e.target.value)}
                  placeholder="Motivo del bloqueo (ej. Esperando API externa de pagos)..."
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Guardando historia...' : 'Crear Historia de Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
