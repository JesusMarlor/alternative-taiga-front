import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ThemeDrawer } from '../theme/ThemeDrawer';
import { Loader2, AlertCircle } from 'lucide-react';

export const ProjectLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentProject, selectProjectBySlug, isLoading, error } = useProjectStore();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      selectProjectBySlug(slug).catch((err) => {
        console.error('Error loading project:', err);
      });
    }
  }, [slug, selectProjectBySlug]);

  if (isLoading && !currentProject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Cargando proyecto y módulos...
          </p>
        </div>
      </div>
    );
  }

  if (error && !currentProject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19] p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No se pudo cargar el proyecto
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Volver a la lista de proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenThemeDrawer={() => setIsThemeDrawerOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ThemeDrawer
        isOpen={isThemeDrawerOpen}
        onClose={() => setIsThemeDrawerOpen(false)}
      />
    </div>
  );
};
