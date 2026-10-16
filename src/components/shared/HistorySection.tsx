import React, { useEffect, useState } from 'react';
import { getHistory, deleteComment, HistoryContentType } from '../../api/history';
import { HistoryEntry } from '../../types/taiga';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, History, Loader2, Send, Trash2 } from 'lucide-react';

interface HistorySectionProps {
  contentType: HistoryContentType;
  objectId: number;
  // Changes whenever the object is saved, so the activity list reloads
  version?: number;
  // The parent owns the object's version, so it sends the PATCH { comment, version }
  onAddComment: (text: string) => Promise<void>;
}

const FIELD_LABELS: Record<string, string> = {
  subject: 'Asunto',
  description_diff: 'Descripción',
  status: 'Estado',
  assigned_to: 'Asignado',
  assigned_users: 'Asignados',
  milestone: 'Sprint',
  points: 'Puntos',
  tags: 'Etiquetas',
  is_blocked: 'Bloqueada',
  blocked_note: 'Nota de bloqueo',
  attachments: 'Adjuntos',
  priority: 'Prioridad',
  severity: 'Severidad',
  type: 'Tipo',
  user_story: 'Historia',
  client_requirement: 'Requisito de cliente',
  team_requirement: 'Requisito de equipo',
  due_date: 'Fecha límite',
  is_iocaine: 'Iocaína',
};

// Fields whose raw value is noise in the activity feed (description is covered by description_diff)
const HIDDEN_FIELDS = new Set(['description', 'content', 'content_diff']);

const formatValue = (v: any): string => {
  if (v === null || v === undefined || v === '') return 'ninguno';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (Array.isArray(v)) return v.length ? v.map(formatValue).join(', ') : 'ninguno';
  if (typeof v === 'object') return Object.values(v).map(formatValue).join(', ');
  return String(v);
};

const describeChange = (field: string, diff: any): string => {
  if (field === 'description_diff') return 'actualizó la descripción';
  if (field === 'attachments') {
    const added = diff?.new?.length || 0;
    const removed = diff?.deleted?.length || 0;
    const parts = [];
    if (added) parts.push(`añadió ${added}`);
    if (removed) parts.push(`eliminó ${removed}`);
    return parts.length ? `${parts.join(' y ')} adjunto(s)` : 'modificó adjuntos';
  }
  if (field === 'points' && diff && !Array.isArray(diff)) {
    return Object.entries(diff)
      .map(([role, [from, to]]: [string, any]) => `${role}: ${formatValue(from)} → ${formatValue(to)}`)
      .join('; ');
  }
  if (Array.isArray(diff) && diff.length === 2) {
    return `${formatValue(diff[0])} → ${formatValue(diff[1])}`;
  }
  return 'modificado';
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const HistorySection: React.FC<HistorySectionProps> = ({ contentType, objectId, version, onAddComment }) => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'comment' | 'activity'>('comment');
  const [comments, setComments] = useState<HistoryEntry[]>([]);
  const [activity, setActivity] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getHistory(contentType, objectId, 'comment'),
      getHistory(contentType, objectId, 'activity'),
    ])
      .then(([c, a]) => {
        if (cancelled) return;
        setComments(c);
        setActivity(a.filter((e) => Object.keys(e.values_diff || {}).some((k) => !HIDDEN_FIELDS.has(k))));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [contentType, objectId, version]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setIsPosting(true);
    setError(null);
    try {
      await onAddComment(draft.trim());
      setDraft('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (entry: HistoryEntry) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await deleteComment(contentType, objectId, entry.id);
      setComments((prev) =>
        prev.map((c) => (c.id === entry.id ? { ...c, delete_comment_date: new Date().toISOString() } : c))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const visibleComments = comments.filter((c) => !c.delete_comment_date);

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
      active
        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setTab('comment')} className={tabClass(tab === 'comment')}>
          <MessageSquare className="w-4 h-4" />
          Comentarios
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{visibleComments.length}</span>
        </button>
        <button type="button" onClick={() => setTab('activity')} className={tabClass(tab === 'activity')}>
          <History className="w-4 h-4" />
          Actividad
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{activity.length}</span>
        </button>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          Cargando historial...
        </div>
      ) : tab === 'comment' ? (
        <div className="space-y-4">
          <form onSubmit={handlePost} className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Escribe un comentario (soporta Markdown)..."
              className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPosting || !draft.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Comentar
              </button>
            </div>
          </form>

          {visibleComments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aún no hay comentarios.</p>
          ) : (
            <ul className="space-y-4">
              {visibleComments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <UserAvatar name={c.user.name || c.user.username} photo={c.user.photo} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{c.user.name || c.user.username}</span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(c.created_at)}</span>
                      {c.edit_comment_date && <span className="text-[10px] text-slate-400 italic">(editado)</span>}
                      {user?.id === c.user.pk && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="ml-auto p-1 rounded text-slate-400 hover:text-rose-500"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* comment_html is sanitized server-side by Taiga */}
                    <div
                      className="taiga-wysiwyg-content select-text mt-1"
                      dangerouslySetInnerHTML={{ __html: c.comment_html }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : activity.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Sin actividad registrada.</p>
      ) : (
        <ul className="space-y-3">
          {activity.map((a) => (
            <li key={a.id} className="flex gap-3">
              <UserAvatar name={a.user.name || a.user.username} photo={a.user.photo} size="xs" />
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{a.user.name || a.user.username}</span>
                  <span className="text-[11px] text-slate-400">{formatDateTime(a.created_at)}</span>
                </div>
                <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                  {Object.entries(a.values_diff)
                    .filter(([field]) => !HIDDEN_FIELDS.has(field))
                    .map(([field, diff]) => (
                      <li key={field}>
                        <span className="font-semibold">{FIELD_LABELS[field] || field}:</span>{' '}
                        {describeChange(field, diff)}
                      </li>
                    ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
