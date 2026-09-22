import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { 
  getSlackHooks, 
  createSlackHook, 
  updateSlackHook, 
  deleteSlackHook, 
  testSlackHook 
} from '../../api/slack';
import { SlackHook } from '../../types/taiga';
import { 
  Check, 
  AlertCircle, 
  Loader2, 
  Send, 
  Trash2, 
  Save, 
  ExternalLink, 
  HelpCircle,
  Hash,
  Link as LinkIcon,
  Layers,
  CheckSquare,
  Bug,
  BookOpen,
  Target,
  MessageSquare
} from 'lucide-react';

const DEFAULT_SLACK_HOOK: Omit<SlackHook, 'project'> = {
  url: '',
  channel: '',
  notify_epic_create: true,
  notify_epic_change: true,
  notify_epic_delete: true,
  notify_relateduserstory_create: true,
  notify_relateduserstory_delete: true,
  notify_userstory_create: true,
  notify_userstory_change: true,
  notify_userstory_delete: true,
  notify_task_create: true,
  notify_task_change: true,
  notify_task_delete: true,
  notify_issue_create: true,
  notify_issue_change: true,
  notify_issue_delete: true,
  notify_wikipage_create: true,
  notify_wikipage_change: true,
  notify_wikipage_delete: true,
};

export const PluginsSettingsSection: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [activePlugin, setActivePlugin] = useState<'slack'>('slack');
  const [slackHook, setSlackHook] = useState<SlackHook | null>(null);
  const [formData, setFormData] = useState<Omit<SlackHook, 'project'>>(DEFAULT_SLACK_HOOK);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      getSlackHooks(currentProject.id)
        .then((hooks) => {
          if (hooks && hooks.length > 0) {
            setSlackHook(hooks[0]);
            setFormData({
              id: hooks[0].id,
              url: hooks[0].url || '',
              channel: hooks[0].channel || '',
              notify_epic_create: hooks[0].notify_epic_create ?? true,
              notify_epic_change: hooks[0].notify_epic_change ?? true,
              notify_epic_delete: hooks[0].notify_epic_delete ?? true,
              notify_relateduserstory_create: hooks[0].notify_relateduserstory_create ?? true,
              notify_relateduserstory_delete: hooks[0].notify_relateduserstory_delete ?? true,
              notify_userstory_create: hooks[0].notify_userstory_create ?? true,
              notify_userstory_change: hooks[0].notify_userstory_change ?? true,
              notify_userstory_delete: hooks[0].notify_userstory_delete ?? true,
              notify_task_create: hooks[0].notify_task_create ?? true,
              notify_task_change: hooks[0].notify_task_change ?? true,
              notify_task_delete: hooks[0].notify_task_delete ?? true,
              notify_issue_create: hooks[0].notify_issue_create ?? true,
              notify_issue_change: hooks[0].notify_issue_change ?? true,
              notify_issue_delete: hooks[0].notify_issue_delete ?? true,
              notify_wikipage_create: hooks[0].notify_wikipage_create ?? true,
              notify_wikipage_change: hooks[0].notify_wikipage_change ?? true,
              notify_wikipage_delete: hooks[0].notify_wikipage_delete ?? true,
            });
          } else {
            setSlackHook(null);
            setFormData(DEFAULT_SLACK_HOOK);
          }
        })
        .catch((err) => {
          console.error('Error fetching slack hooks:', err);
          showFeedback('error', 'No se pudo cargar la configuración de Slack');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggle = (key: keyof Omit<SlackHook, 'id' | 'project' | 'url' | 'channel'>) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) {
      showFeedback('error', 'Debes ingresar una URL válida de webhook de Slack');
      return;
    }

    setIsSaving(true);
    try {
      if (slackHook?.id) {
        const updated = await updateSlackHook(slackHook.id, {
          ...formData,
          project: currentProject.id,
        });
        setSlackHook(updated);
        showFeedback('success', 'Configuración de Slack guardada con éxito.');
      } else {
        const created = await createSlackHook({
          ...formData,
          project: currentProject.id,
        });
        setSlackHook(created);
        setFormData((prev) => ({ ...prev, id: created.id }));
        showFeedback('success', 'Integración con Slack creada y configurada con éxito.');
      }
    } catch (err: any) {
      console.error('Error saving slack hook:', err);
      showFeedback('error', err?.message || 'Error al guardar la integración de Slack');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!slackHook?.id) {
      showFeedback('error', 'Guarda primero la configuración para poder enviar una prueba');
      return;
    }

    setIsTesting(true);
    try {
      await testSlackHook(slackHook.id);
      showFeedback('success', 'Mensaje de prueba enviado exitosamente al canal de Slack.');
    } catch (err: any) {
      console.error('Error testing slack hook:', err);
      showFeedback('error', err?.message || 'Error al enviar el mensaje de prueba a Slack');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!slackHook?.id) return;
    if (!window.confirm('¿Estás seguro de eliminar la integración de Slack para este proyecto?')) return;

    setIsDeleting(true);
    try {
      await deleteSlackHook(slackHook.id);
      setSlackHook(null);
      setFormData(DEFAULT_SLACK_HOOK);
      showFeedback('success', 'Integración de Slack eliminada.');
    } catch (err: any) {
      console.error('Error deleting slack hook:', err);
      showFeedback('error', err?.message || 'Error al eliminar la integración de Slack');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Two-column layout: Plugins Sub-navigation + Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Submenu (Plugins List) */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900/90 rounded-3xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-2 block">
            Plugins Disponibles
          </span>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActivePlugin('slack')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                activePlugin === 'slack'
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span className="tracking-wide uppercase">SLACK</span>
              </div>
              {slackHook?.id && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Activo" />
              )}
            </button>
          </nav>
        </div>

        {/* Right Content Pane (Selected Plugin Config) */}
        <div className="md:col-span-3 min-w-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-xs text-slate-400 font-medium">Cargando plugin de Slack...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-7">
              {/* Plugin Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#008db8] dark:text-[#29b6f6] tracking-tight">
                    Slack
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Notificaciones en tiempo real para actividades del proyecto en tus canales de Slack
                  </p>
                </div>
                {slackHook?.id && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors self-start sm:self-auto"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Desconectar Slack</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Field 1: Slack Webhook URL + TEST Button */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Slack webhook url
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        required
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    {slackHook?.id && (
                      <button
                        type="button"
                        onClick={handleTest}
                        disabled={isTesting}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white text-xs font-bold tracking-wider uppercase shadow-sm transition-all disabled:opacity-50"
                        title="Enviar mensaje de prueba a Slack"
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>TEST</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    URL generada al crear un Incoming Webhook en tu espacio de trabajo de Slack.
                  </span>
                </div>

                {/* Field 2: Slack Webhook Channel */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Slack webhook channel
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.channel || ''}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                      placeholder="#general o canal-personalizado"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Opcional: nombre del canal de Slack al que se dirigirán las notificaciones (ej: #desarrollo).
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-5">
                  {/* Category 1: Notify Epics */}
                  <NotificationSection
                    title="Notify Epics"
                    icon={Target}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_epic_create,
                        onChange: () => handleToggle('notify_epic_create'),
                      },
                      {
                        label: 'Change',
                        checked: formData.notify_epic_change,
                        onChange: () => handleToggle('notify_epic_change'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_epic_delete,
                        onChange: () => handleToggle('notify_epic_delete'),
                      },
                    ]}
                  />

                  {/* Category 2: Notify Epics related user stories */}
                  <NotificationSection
                    title="Notify Epics related user stories"
                    icon={Layers}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_relateduserstory_create,
                        onChange: () => handleToggle('notify_relateduserstory_create'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_relateduserstory_delete,
                        onChange: () => handleToggle('notify_relateduserstory_delete'),
                      },
                    ]}
                  />

                  {/* Category 3: Notify User Stories */}
                  <NotificationSection
                    title="Notify User Stories"
                    icon={Layers}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_userstory_create,
                        onChange: () => handleToggle('notify_userstory_create'),
                      },
                      {
                        label: 'Change',
                        checked: formData.notify_userstory_change,
                        onChange: () => handleToggle('notify_userstory_change'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_userstory_delete,
                        onChange: () => handleToggle('notify_userstory_delete'),
                      },
                    ]}
                  />

                  {/* Category 4: Notify Tasks */}
                  <NotificationSection
                    title="Notify Tasks"
                    icon={CheckSquare}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_task_create,
                        onChange: () => handleToggle('notify_task_create'),
                      },
                      {
                        label: 'Change',
                        checked: formData.notify_task_change,
                        onChange: () => handleToggle('notify_task_change'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_task_delete,
                        onChange: () => handleToggle('notify_task_delete'),
                      },
                    ]}
                  />

                  {/* Category 5: Notify Issues */}
                  <NotificationSection
                    title="Notify Issues"
                    icon={Bug}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_issue_create,
                        onChange: () => handleToggle('notify_issue_create'),
                      },
                      {
                        label: 'Change',
                        checked: formData.notify_issue_change,
                        onChange: () => handleToggle('notify_issue_change'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_issue_delete,
                        onChange: () => handleToggle('notify_issue_delete'),
                      },
                    ]}
                  />

                  {/* Category 6: Notify Wiki */}
                  <NotificationSection
                    title="Notify Wiki"
                    icon={BookOpen}
                    items={[
                      {
                        label: 'Create',
                        checked: formData.notify_wikipage_create,
                        onChange: () => handleToggle('notify_wikipage_create'),
                      },
                      {
                        label: 'Change',
                        checked: formData.notify_wikipage_change,
                        onChange: () => handleToggle('notify_wikipage_change'),
                      },
                      {
                        label: 'Delete',
                        checked: formData.notify_wikipage_delete,
                        onChange: () => handleToggle('notify_wikipage_delete'),
                      },
                    ]}
                  />
                </div>

                {/* Save Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="https://docs.taiga.io/integrations-slack.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>¿Necesitas ayuda? Consulta la guía oficial de Slack en Taiga</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ToggleItem {
  label: string;
  checked: boolean;
  onChange: () => void;
}

interface NotificationSectionProps {
  title: string;
  icon: any;
  items: ToggleItem[];
}

const NotificationSection: React.FC<NotificationSectionProps> = ({ title, icon: Icon, items }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
        <Icon className="w-4 h-4 text-brand-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>

      <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60">
        {items.map((item) => (
          <div
            key={item.label}
            className="py-2 px-1 flex items-center justify-between text-xs cursor-pointer select-none"
            onClick={item.onChange}
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {item.label}
            </span>

            {/* Custom Toggle Switch matching Taiga's cyan/teal style */}
            <button
              type="button"
              role="switch"
              aria-checked={item.checked}
              onClick={(e) => {
                e.stopPropagation();
                item.onChange();
              }}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                item.checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  item.checked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
