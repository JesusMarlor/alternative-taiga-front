import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { 
  Columns3, 
  Kanban, 
  Target, 
  AlertCircle, 
  BookOpen, 
  Users, 
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { slug } = useParams<{ slug: string }>();
  const { currentProject } = useProjectStore();

  if (!currentProject) return null;

  const navItems = [
    {
      id: 'kanban',
      label: 'Kanban',
      path: `/project/${slug}/kanban`,
      icon: Kanban,
      enabled: currentProject.is_kanban_activated,
      badge: null,
    },
    {
      id: 'scrum',
      label: 'Scrum / Backlog',
      path: `/project/${slug}/scrum`,
      icon: Columns3,
      enabled: currentProject.is_backlog_activated,
      badge: currentProject.milestones?.length ? `${currentProject.milestones.length}` : null,
    },
    {
      id: 'epics',
      label: 'Épicas',
      path: `/project/${slug}/epics`,
      icon: Target,
      enabled: currentProject.is_epics_activated,
      badge: null,
    },
    {
      id: 'issues',
      label: 'Incidencias',
      path: `/project/${slug}/issues`,
      icon: AlertCircle,
      enabled: currentProject.is_issues_activated,
      badge: null,
    },
    {
      id: 'wiki',
      label: 'Wiki',
      path: `/project/${slug}/wiki`,
      icon: BookOpen,
      enabled: currentProject.is_wiki_activated,
      badge: null,
    },
    {
      id: 'team',
      label: 'Equipo',
      path: `/project/${slug}/team`,
      icon: Users,
      enabled: true,
      badge: Array.isArray(currentProject.members) ? `${currentProject.members.length}` : null,
    },
    {
      id: 'settings',
      label: 'Configuración',
      path: `/project/${slug}/settings`,
      icon: Settings,
      enabled: true,
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 transition-all">
      {/* Project Card Header */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          {currentProject.logo_small_url ? (
            <img 
              src={currentProject.logo_small_url} 
              alt={currentProject.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center border border-brand-500/20">
              {currentProject.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {currentProject.name}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentProject.description || 'Sin descripción'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Módulos de Trabajo
        </div>

        {navItems
          .filter((item) => item.enabled)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200/50 dark:border-brand-800/40 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive 
                          ? 'bg-brand-500/20 text-brand-700 dark:text-brand-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Modo Ágil Activo</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En línea
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-50 animate-fade-in shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
