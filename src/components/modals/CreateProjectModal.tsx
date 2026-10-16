import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjectTemplates, createProject } from '../../api/projects';
import { useProjectStore } from '../../stores/projectStore';
import { X, Loader2, AlertCircle, FolderPlus, Lock, Globe } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5';

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { fetchProjects } = useProjectStore();
  const [templates, setTemplates] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    getProjectTemplates()
      .then((data) => {
        setTemplates(data);
        setTemplateId((prev) => (prev === '' && data.length ? data[0].id : prev));
      })
      .catch((err) => setErrorMessage(err.message));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || templateId === '') return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim(),
        creation_template: templateId,
        is_private: isPrivate,
      });
      fetchProjects();
      onClose();
      navigate(`/project/${project.slug}`);
    } catch (err: any) {
      setErrorMessage(err?.data?._error_message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityButton = (value: boolean, Icon: typeof Lock, label: string) => (
    <button
      type="button"
      onClick={() => setIsPrivate(value)}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
        isPrivate === value
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Nuevo proyecto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Plantilla</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(Number(e.target.value))}
              required
              className={inputClass}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {templates.find((t) => t.id === templateId)?.description && (
              <p className="text-[11px] text-slate-500 mt-1">{templates.find((t) => t.id === templateId)?.description}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Nombre <span className="text-rose-500">*</span></label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Descripción <span className="text-rose-500">*</span></label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-2">
            {visibilityButton(true, Lock, 'Privado')}
            {visibilityButton(false, Globe, 'Público')}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !description.trim() || templateId === ''}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
