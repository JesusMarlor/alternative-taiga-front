import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { createMilestone, updateMilestone, deleteMilestone } from '../../api/milestones';
import { Milestone } from '../../types/taiga';
import { 
  X, 
  Loader2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  Clock
} from 'lucide-react';

interface SprintModalProps {
  isOpen: boolean;
  milestone?: Milestone | null;
  onClose: () => void;
  onSaved: (milestone: Milestone) => void;
  onDeleted?: (milestoneId: number) => void;
}

export const SprintModal: React.FC<SprintModalProps> = ({
  isOpen,
  milestone,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const { currentProject } = useProjectStore();
  const [name, setName] = useState('');
  const [estimatedStart, setEstimatedStart] = useState('');
  const [estimatedFinish, setEstimatedFinish] = useState('');
  const [closed, setClosed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEdit = !!milestone;

  // Format today / +14 days as default dates
  const getDefaultDates = () => {
    const today = new Date();
    const finish = new Date();
    finish.setDate(today.getDate() + 14);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { start: fmt(today), finish: fmt(finish) };
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setConfirmDelete(false);

      if (milestone) {
        setName(milestone.name || '');
        setEstimatedStart(milestone.estimated_start || '');
        setEstimatedFinish(milestone.estimated_finish || '');
        setClosed(!!milestone.closed);
      } else {
        const defaults = getDefaultDates();
        setName(`Sprint ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`);
        setEstimatedStart(defaults.start);
        setEstimatedFinish(defaults.finish);
        setClosed(false);
      }
    }
  }, [isOpen, milestone]);

  if (!isOpen || !currentProject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !estimatedStart || !estimatedFinish) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEdit && milestone) {
        const updated = await updateMilestone(milestone.id, {
          name: name.trim(),
          estimated_start: estimatedStart,
          estimated_finish: estimatedFinish,
          closed,
        });
        onSaved(updated);
      } else {
        const created = await createMilestone({
          project: currentProject.id,
          name: name.trim(),
          estimated_start: estimatedStart,
          estimated_finish: estimatedFinish,
          closed,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving sprint:', err);
      let msg = err?.data?._error_message || err?.data?.detail;
      if (!msg && err?.data && typeof err.data === 'object') {
        const entries = Object.entries(err.data);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          const errorText = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          msg = `${field}: ${errorText}`;
        }
      }
      setErrorMessage(msg || err.message || 'Error al guardar el sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!milestone) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteMilestone(milestone.id);
      if (onDeleted) {
        onDeleted(milestone.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting sprint:', err);
      const msg = err?.data?._error_message || err?.message || 'Error al eliminar el sprint';
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Editar Sprint' : 'Nuevo Sprint'}
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

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sprint Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del Sprint <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sprint 1, Septiembre 01..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha Inicio <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={estimatedStart}
                onChange={(e) => setEstimatedStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha Fin <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={estimatedFinish}
                onChange={(e) => setEstimatedFinish(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Closed / Active toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Estado del Sprint
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {closed ? 'Sprint marcado como cerrado / terminado' : 'Sprint activo en progreso'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={closed}
              onClick={() => setClosed(!closed)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                closed ? 'bg-slate-500' : 'bg-emerald-500'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  closed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Delete option in Edit mode */}
            {isEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-600 font-bold">¿Borrar?</span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Sprint</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Sprint'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
