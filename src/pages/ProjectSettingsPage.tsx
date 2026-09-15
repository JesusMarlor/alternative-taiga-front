import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { updateProject } from '../api/projects';
import { 
  Settings, 
  Save, 
  Check, 
  Lock, 
  Globe, 
  Kanban, 
  Columns3, 
  Target, 
  AlertCircle, 
  BookOpen, 
  Tag, 
  Users, 
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react';

export const ProjectSettingsPage: React.FC = () => {
  const { currentProject, setCurrentProject } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isKanban, setIsKanban] = useState(true);
  const [isBacklog, setIsBacklog] = useState(true);
  const [isEpics, setIsEpics] = useState(true);
  const [isIssues, setIsIssues] = useState(true);
  const [isWiki, setIsWiki] = useState(true);
  const [isLookingForPeople, setIsLookingForPeople] = useState(false);
  const [lookingForPeopleNote, setLookingForPeopleNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name || '');
      setDescription(currentProject.description || '');
      setIsPrivate(currentProject.is_private ?? true);
      setIsKanban(currentProject.is_kanban_activated ?? true);
      setIsBacklog(currentProject.is_backlog_activated ?? true);
      setIsEpics(currentProject.is_epics_activated ?? true);
      setIsIssues(currentProject.is_issues_activated ?? true);
      setIsWiki(currentProject.is_wiki_activated ?? true);
      setIsLookingForPeople((currentProject as any).is_looking_for_people ?? false);
      setLookingForPeopleNote((currentProject as any).looking_for_people_note || '');
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updated = await updateProject(currentProject.id, {
        name,
        description,
        is_private: isPrivate,
        is_kanban_activated: isKanban,
        is_backlog_activated: isBacklog,
        is_epics_activated: isEpics,
        is_issues_activated: isIssues,
        is_wiki_activated: isWiki,
        is_looking_for_people: isLookingForPeople,
        looking_for_people_note: lookingForPeopleNote,
      } as any);

      setCurrentProject(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar los cambios del proyecto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Configuración del Proyecto
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administración de perfil, módulos activos y permisos de {currentProject.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Configuración del proyecto guardada exitosamente en el servidor.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Project Profile Details */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Perfil del Proyecto
            </h2>
            <p className="text-xs text-slate-500">
              Detalles de identificación y visibilidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Identificador URL (Slug)
              </label>
              <input
                type="text"
                disabled
                value={currentProject.slug}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-sm font-mono text-slate-400 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                El slug URL no puede ser modificado una vez creado el proyecto.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los objetivos de este proyecto..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Privacy Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Visibilidad del Proyecto
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  isPrivate
                    ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Proyecto Privado
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Solo los miembros invitados tienen acceso al tablero e información.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !isPrivate
                    ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Proyecto Público
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cualquier usuario puede ver el tablero y las historias del proyecto.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Active Modules */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Módulos y Herramientas Habilitadas
            </h2>
            <p className="text-xs text-slate-500">
              Activa o desactiva las funcionalidades según la metodología de trabajo de tu equipo
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Kanban */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Kanban className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tablero Kanban</h4>
                  <p className="text-[11px] text-slate-500">Flujo continuo con columnas de estado</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isKanban}
                onChange={(e) => setIsKanban(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* Scrum / Backlog */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Columns3 className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Scrum & Sprints</h4>
                  <p className="text-[11px] text-slate-500">Gestión de backlog, estimación por roles y sprints</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isBacklog}
                onChange={(e) => setIsBacklog(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* Epics */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Target className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Épicas</h4>
                  <p className="text-[11px] text-slate-500">Iniciativas estratégicas de gran escala</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEpics}
                onChange={(e) => setIsEpics(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* Issues */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <AlertCircle className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Incidencias (Issues)</h4>
                  <p className="text-[11px] text-slate-500">Seguimiento de fallos, severidad y prioridades</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isIssues}
                onChange={(e) => setIsIssues(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* Wiki */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Wiki</h4>
                  <p className="text-[11px] text-slate-500">Documentación colaborativa del proyecto</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isWiki}
                onChange={(e) => setIsWiki(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Looking for people */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Búsqueda de Colaboradores
            </h2>
            <p className="text-xs text-slate-500">
              Permite que otros integrantes de la organización sepan si el equipo está buscando personas
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isLookingForPeople}
                onChange={(e) => setIsLookingForPeople(e.target.checked)}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Este proyecto está buscando nuevos miembros o talento
              </span>
            </label>

            {isLookingForPeople && (
              <div className="pt-2 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nota o perfiles requeridos
                </label>
                <textarea
                  rows={2}
                  value={lookingForPeopleNote}
                  onChange={(e) => setLookingForPeopleNote(e.target.value)}
                  placeholder="Ej. Buscamos desarrollador Frontend con experiencia en React y TypeScript..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
