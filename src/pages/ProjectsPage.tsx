import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Navbar } from '../components/layout/Navbar';
import { ThemeDrawer } from '../components/theme/ThemeDrawer';
import { 
  FolderKanban, 
  Search, 
  ArrowRight, 
  Lock, 
  Globe, 
  TrendingUp, 
  Layers, 
  Loader2,
  Calendar
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const [search, setSearch] = useState('');
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onOpenThemeDrawer={() => setIsThemeDrawerOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Bienvenido, {user?.full_name_display || user?.username || 'Usuario'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selecciona un proyecto para abrir tu espacio de trabajo ágil
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-xs text-slate-500 font-medium">Cargando tus proyectos desde el servidor...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No se encontraron proyectos
            </p>
            <p className="text-xs text-slate-500">
              Intenta con otro término de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.slug}/kanban`)}
                className="group relative bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {project.logo_small_url ? (
                        <img
                          src={project.logo_small_url}
                          alt={project.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black text-base flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                          {project.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          /{project.slug}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {project.is_private ? (
                        <>
                          <Lock className="w-3 h-3" /> Privado
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" /> Público
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {project.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                {/* Modules & Stats */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {project.total_activity || 0}
                    </span>
                    <span>actividades</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                    <span>Abrir Tablero</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ThemeDrawer
        isOpen={isThemeDrawerOpen}
        onClose={() => setIsThemeDrawerOpen(false)}
      />
    </div>
  );
};
