import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { getMilestone, getMilestoneStats } from '../api/milestones';
import { getTasks, createTask, updateTask } from '../api/tasks';
import { useTaigaLiveEvents } from '../api/events';
import { Milestone, MilestoneStats, Task, StatusItem } from '../types/taiga';
import { UserAvatar } from '../components/shared/UserAvatar';
import { ArrowLeft, Calendar, Loader2, Lock, Plus } from 'lucide-react';

// Taiga returns points either as a number or broken down per role
const sumPoints = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') return Object.values(v as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0);
  return 0;
};

const Burndown: React.FC<{ days: MilestoneStats['days'] }> = ({ days }) => {
  const [hover, setHover] = useState<number | null>(null);
  if (days.length < 2) return null;

  const W = 600;
  const H = 180;
  const PAD = { top: 12, right: 12, bottom: 24, left: 32 };
  const max = Math.max(1, ...days.map((d) => Math.max(d.open_points, d.optimal_points)));
  const x = (i: number) => PAD.left + (i / (days.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
  const path = (key: 'open_points' | 'optimal_points') =>
    days.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[key])}`).join(' ');

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (days.length - 1));
    setHover(Math.min(days.length - 1, Math.max(0, i)));
  };

  const fmtDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-brand-500 rounded" /> Puntos pendientes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-slate-400" /> Ideal
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Gráfico burndown del sprint"
        >
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(max * t)} y2={y(max * t)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(max * t) + 3} textAnchor="end" className="fill-slate-400 text-[10px]">
                {Math.round(max * t)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} className="fill-slate-400 text-[10px]">{fmtDay(days[0].day)}</text>
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-slate-400 text-[10px]">{fmtDay(days[days.length - 1].day)}</text>
          <path d={path('optimal_points')} fill="none" className="stroke-slate-400" strokeWidth={2} strokeDasharray="6 4" />
          <path d={path('open_points')} fill="none" className="stroke-brand-500" strokeWidth={2} strokeLinejoin="round" />
          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(days[hover].open_points)} r={4} className="fill-brand-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
            </>
          )}
        </svg>
        {hover !== null && (
          <div
            className="absolute top-0 pointer-events-none px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-[11px] text-slate-700 dark:text-slate-200 whitespace-nowrap"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > days.length / 2 ? 'translateX(-105%)' : 'translateX(5%)' }}
          >
            <div className="font-bold">{fmtDay(days[hover].day)}</div>
            <div>Pendientes: {days[hover].open_points}</div>
            <div className="text-slate-500 dark:text-slate-400">Ideal: {Math.round(days[hover].optimal_points * 10) / 10}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TaskboardPage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const { currentProject } = useProjectStore();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState<number | 'none' | null>(null);
  const [newTaskSubject, setNewTaskSubject] = useState('');

  const loadData = useCallback(
    (showLoading = true) => {
      if (!currentProject || !milestoneId) return;
      const id = Number(milestoneId);
      if (showLoading) setIsLoading(true);
      Promise.all([
        getMilestone(id),
        getTasks(currentProject.id, id),
        getMilestoneStats(id).catch(() => null),
      ])
        .then(([ms, tsks, st]) => {
          setMilestone(ms);
          setTasks(tsks);
          setStats(st);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => showLoading && setIsLoading(false));
    },
    [currentProject, milestoneId]
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useTaigaLiveEvents(currentProject?.id, () => loadData(false));

  if (!currentProject) return null;

  const statuses: StatusItem[] = [...(currentProject.task_statuses || [])].sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
  );
  const stories = milestone?.user_stories || [];
  const rows: { id: number | 'none'; ref?: number; subject: string; points?: number; isClosed?: boolean }[] = [
    ...stories.map((s) => ({ id: s.id, ref: s.ref, subject: s.subject, points: (s as any).total_points, isClosed: s.is_closed })),
    { id: 'none' as const, subject: 'Tareas sin historia' },
  ];

  const tasksIn = (rowId: number | 'none', statusId: number) =>
    tasks
      .filter((t) => (rowId === 'none' ? !t.user_story : t.user_story === rowId) && t.status === statusId)
      .sort((a, b) => (a.taskboard_order ?? a.ref) - (b.taskboard_order ?? b.ref));

  const handleDrop = async (rowId: number | 'none', statusId: number) => {
    setDragOverCell(null);
    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task) return;
    const userStory = rowId === 'none' ? null : rowId;
    if (task.status === statusId && task.user_story === userStory) return;

    const previous = tasks;
    const status = statuses.find((s) => s.id === statusId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: statusId, user_story: userStory, is_closed: status?.is_closed ?? t.is_closed }
          : t
      )
    );
    try {
      const updated = await updateTask(task.id, { status: statusId, user_story: userStory, version: task.version });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
      getMilestoneStats(Number(milestoneId)).then(setStats).catch(() => {});
    } catch (err: any) {
      setTasks(previous);
      alert(`Error al mover la tarea: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent, rowId: number | 'none') => {
    e.preventDefault();
    if (!newTaskSubject.trim() || !milestone) return;
    try {
      const created = await createTask({
        project: currentProject.id,
        milestone: milestone.id,
        user_story: rowId === 'none' ? undefined : rowId,
        subject: newTaskSubject.trim(),
        status: currentProject.default_task_status || statuses[0]?.id,
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskSubject('');
      setAddingRow(null);
    } catch (err: any) {
      alert(`Error al crear tarea: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
        No se pudo cargar el sprint: {error}
      </div>
    );
  }

  const totalPoints = sumPoints(stats?.total_points);
  const completedPoints = sumPoints(stats?.completed_points);
  const doneTasks = tasks.filter((t) => t.is_closed).length;
  const progress = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const gridCols = { gridTemplateColumns: `220px repeat(${statuses.length}, minmax(180px, 1fr))` };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to={`/project/${currentProject.slug}/scrum`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Backlog
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{milestone.name}</h1>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {milestone.estimated_start} → {milestone.estimated_finish}
            {milestone.closed && <span className="ml-2 font-bold text-emerald-600">Cerrado</span>}
          </p>
        </div>
        <div className="flex gap-6 text-xs">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{progress}%</div>
            <div className="text-slate-500">{completedPoints} / {totalPoints} puntos</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{doneTasks} / {tasks.length}</div>
            <div className="text-slate-500">tareas cerradas</div>
          </div>
        </div>
      </div>

      {stats && stats.days?.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Burndown</h3>
          <Burndown days={stats.days} />
        </div>
      )}

      {/* Board */}
      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="min-w-max">
          <div className="grid border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={gridCols}>
            <div className="px-3 py-2.5">Historia</div>
            {statuses.map((s) => (
              <div key={s.id} className="px-3 py-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div key={row.id} className="grid border-b border-slate-100 dark:border-slate-800 last:border-b-0" style={gridCols}>
              <div className="px-3 py-3 space-y-2">
                {row.id === 'none' ? (
                  <span className="text-xs font-semibold text-slate-400 italic">{row.subject}</span>
                ) : (
                  <Link
                    to={`/project/${currentProject.slug}/us/${row.ref}`}
                    className={`block text-xs font-semibold hover:text-brand-600 ${row.isClosed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}
                  >
                    <span className="text-slate-400 mr-1">#{row.ref}</span>
                    {row.subject}
                  </Link>
                )}
                {row.points !== undefined && row.points !== null && (
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                    {row.points} pts
                  </span>
                )}
                {addingRow === row.id ? (
                  <form onSubmit={(e) => handleCreateTask(e, row.id)} className="space-y-1">
                    <input
                      autoFocus
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setAddingRow(null)}
                      placeholder="Nueva tarea..."
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingRow(row.id);
                      setNewTaskSubject('');
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-brand-600"
                  >
                    <Plus className="w-3 h-3" /> Tarea
                  </button>
                )}
              </div>

              {statuses.map((s) => {
                const cellKey = `${row.id}-${s.id}`;
                return (
                  <div
                    key={s.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCell(cellKey);
                    }}
                    onDragLeave={() => setDragOverCell((c) => (c === cellKey ? null : c))}
                    onDrop={() => handleDrop(row.id, s.id)}
                    className={`p-2 space-y-2 min-h-[64px] transition-colors ${
                      dragOverCell === cellKey ? 'bg-brand-50 dark:bg-brand-950/30' : 'bg-slate-50/50 dark:bg-slate-900'
                    }`}
                  >
                    {tasksIn(row.id, s.id).map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(t.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs cursor-grab active:cursor-grabbing text-xs space-y-1.5 ${
                          draggedTaskId === t.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className={`font-semibold ${t.is_closed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          <span className="text-slate-400 mr-1">#{t.ref}</span>
                          {t.subject}
                        </div>
                        <div className="flex items-center justify-between">
                          {t.is_blocked ? <Lock className="w-3 h-3 text-rose-500" /> : <span />}
                          {t.assigned_to_extra_info && (
                            <UserAvatar
                              name={t.assigned_to_extra_info.full_name_display}
                              photo={t.assigned_to_extra_info.photo}
                              size="xs"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
