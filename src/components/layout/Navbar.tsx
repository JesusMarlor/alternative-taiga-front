import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useThemeStore } from '../../stores/themeStore';
import { UserAvatar } from '../shared/UserAvatar';
import { useLiveConnectionStatus } from '../../api/events';
import { 
  Palette, 
  LogOut, 
  ChevronDown, 
  Menu, 
  Search, 
  FolderKanban, 
  Plus,
  Sparkles,
  Layers,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  onOpenThemeDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenThemeDrawer,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentProject, projects } = useProjectStore();
  const { companyName, companyLogo, appTitle } = useThemeStore();
  const isWsConnected = useLiveConnectionStatus();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between transition-colors">
      {/* Left side: Logo & Project Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName} 
              className="h-8 max-w-[120px] object-contain" 
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white hidden sm:inline-block">
            {appTitle || companyName}
          </span>
        </Link>

        {/* Project Selector Dropdown */}
        {currentProject && (
          <div className="relative ml-2 sm:ml-4">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5 text-brand-500" />
              <span className="max-w-[140px] truncate">{currentProject.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isProjectDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-40 animate-fade-in"
                onMouseLeave={() => setIsProjectDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Proyectos Disponibles
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        navigate(`/project/${p.slug}/kanban`);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                        p.id === currentProject.id
                          ? 'text-brand-600 dark:text-brand-400 font-semibold bg-brand-50/50 dark:bg-brand-950/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                      <span className="truncate flex-1">{p.name}</span>
                      {p.id === currentProject.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 font-medium">
                          Activo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <Link
                    to="/"
                    onClick={() => setIsProjectDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ver todos los proyectos</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Quick actions & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live WebSocket Status Badge */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
            isWsConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
          title={isWsConnected ? 'WebSocket conectado en tiempo real' : 'Conectando a WebSocket...'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="hidden md:inline font-semibold">
            {isWsConnected ? 'En vivo' : 'Conectando'}
          </span>
        </div>

        {/* Theme Drawer trigger */}
        <button
          onClick={onOpenThemeDrawer}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          title="Personalizar tema y marca"
        >
          <Palette className="w-4 h-4 text-brand-500" />
          <span className="hidden md:inline">Tema & Marca</span>
        </button>

        {/* User profile dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <UserAvatar 
                name={user.full_name_display || user.username} 
                photo={user.photo} 
                size="sm" 
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[120px] truncate">
                {user.full_name_display || user.username}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:inline" />
            </button>

            {isUserDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-40 animate-fade-in"
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.full_name_display || user.username}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email || `@${user.username}`}
                  </p>
                  {user.roles && user.roles.length > 0 && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
                      {user.roles.join(', ')}
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenThemeDrawer();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    Personalizar Colores
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
