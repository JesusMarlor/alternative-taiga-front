import React from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { UserAvatar } from '../components/shared/UserAvatar';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Calendar,
  Sparkles,
  Settings
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { currentProject, memberships } = useProjectStore();

  if (!currentProject) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Equipo del Proyecto
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {memberships.length} Integrantes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Miembros y roles asignados en {currentProject.name}
          </p>
        </div>

        <Link
          to={`/project/${currentProject.slug}/settings?tab=members`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Settings className="w-4 h-4" />
          <span>Gestionar Miembros (Admin)</span>
        </Link>
      </div>


      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberships.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-500/50 transition-all"
          >
            <div className="flex items-start gap-3.5">
              <UserAvatar
                name={member.full_name || member.username}
                photo={member.photo}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {member.full_name || member.username}
                  </h3>
                  {member.is_admin && (
                    <span title="Administrador">
                      <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {member.email || member.user_email}
                </p>

                <div className="mt-2">
                  <span
                    style={{
                      backgroundColor: `${member.color || '#7c3aed'}15`,
                      color: member.color || '#7c3aed',
                      borderColor: `${member.color || '#7c3aed'}30`,
                    }}
                    className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border"
                  >
                    {member.role_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{member.is_admin ? 'Admin' : 'Colaborador'}</span>
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Activo
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
