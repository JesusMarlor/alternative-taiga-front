import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { getWebhooks, createWebhook, deleteWebhook, testWebhook } from '../../api/webhooks';
import { Webhook } from '../../types/taiga';
import { 
  Webhook as WebhookIcon, 
  Plus, 
  Trash2, 
  Send, 
  Check, 
  AlertCircle, 
  Loader2, 
  X, 
  Globe, 
  Key, 
  GitBranch, 
  GitPullRequest, 
  MessageSquare,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';


export const IntegrationsSettingsSection: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Webhook modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      getWebhooks(currentProject.id)
        .then((data) => setWebhooks(data))
        .catch((err) => {
          console.error('Error loading webhooks:', err);
          showFeedback('error', 'No se pudieron cargar los webhooks del proyecto');
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTestWebhook = async (wh: Webhook) => {
    setTestingId(wh.id);
    try {
      await testWebhook(wh.id);
      showFeedback('success', `Prueba de webhook enviada exitosamente a ${wh.url}`);
    } catch (err: any) {
      console.error('Error testing webhook:', err);
      showFeedback('error', err?.message || 'Error al enviar prueba del webhook');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este webhook?')) return;

    setDeletingId(id);
    try {
      await deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      showFeedback('success', 'Webhook eliminado exitosamente.');
    } catch (err: any) {
      console.error('Error deleting webhook:', err);
      showFeedback('error', err?.message || 'Error al eliminar webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !currentProject) return;

    setIsSubmitting(true);
    try {
      const created = await createWebhook({
        project: currentProject.id,
        name: name.trim(),
        url: url.trim(),
        key: key.trim() || undefined,
      });

      setWebhooks((prev) => [created, ...prev]);
      setName('');
      setUrl('');
      setKey('');
      setIsModalOpen(false);
      showFeedback('success', `Webhook "${created.name}" configurado exitosamente.`);
    } catch (err: any) {
      console.error('Error creating webhook:', err);
      showFeedback('error', err?.message || 'Error al crear webhook');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Integraciones & Webhooks
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {webhooks.length} Webhooks
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conecta eventos de {currentProject.name} con servicios externos en tiempo real
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVO WEBHOOK</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
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

      {/* Active Webhooks List */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <WebhookIcon className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Webhooks Personalizados ({webhooks.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-xs text-slate-400">Cargando webhooks...</span>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <WebhookIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sin webhooks configurados
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Los webhooks permiten notificar a tus servidores cada vez que una historia, tarea o incidencia sea creada o actualizada.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {wh.name}
                    </span>
                    {wh.key && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        <Key className="w-3 h-3" /> Firmado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{wh.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={testingId === wh.id}
                    onClick={() => handleTestWebhook(wh)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    title="Enviar petición de prueba"
                  >
                    {testingId === wh.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-brand-500" />
                    )}
                    <span>Probar</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === wh.id}
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Eliminar webhook"
                  >
                    {deletingId === wh.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Third Party Services Showcase */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Servicios Externos Populares
          </h3>
          <p className="text-xs text-slate-500">
            Conecta repositorios de código y canales de comunicación con Taiga
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GitHub Card */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">GitHub</h4>
                <span className="text-[10px] text-emerald-500 font-semibold">Compatible</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cierra o actualiza tareas y problemas automáticamente mencionando <code>TG-#ref</code> en tus commits de GitHub.
            </p>
          </div>

          {/* GitLab Card */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">GitLab</h4>
                <span className="text-[10px] text-emerald-500 font-semibold">Compatible</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Vincula merge requests y commits de GitLab directamente con el backlog y sprint de Taiga.
            </p>
          </div>


          {/* Slack Card */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Slack / Discord</h4>
                <span className="text-[10px] text-emerald-500 font-semibold">Vía Webhook</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Recibe notificaciones en canales de tu equipo cuando cambien estados de historias o bugs.
            </p>
          </div>
        </div>
      </div>

      {/* Add Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <WebhookIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Nuevo Webhook
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre descriptivo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Servidor de Notificaciones Slack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  URL de Destino (Endpoint) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.tuempresa.com/taiga-webhook"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Clave Secreta (Secret Key - Opcional)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Secrethash..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Se enviará en el encabezado de la petición para validar autenticidad.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !url.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Webhook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
