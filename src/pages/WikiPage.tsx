import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { getWikiPages, getWikiPageBySlug } from '../api/epics';
import { WikiPage } from '../types/taiga';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Loader2,
  ChevronRight
} from 'lucide-react';

export const WikiPageModule: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    getWikiPages(currentProject.id)
      .then((data) => {
        setPages(data);
        if (data.length > 0) {
          setSelectedPage(data[0]);
        }
      })
      .catch((err) => console.error('Error loading wiki pages:', err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  if (!currentProject) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Documentación Wiki
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
            {pages.length} Páginas
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Base de conocimiento colaborativa del proyecto
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 font-medium">Cargando wiki del proyecto...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No hay páginas creadas en la Wiki
          </h3>
          <p className="text-xs text-slate-500">
            La documentación creada en Taiga aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pages Sidebar */}
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <h3 className="text-[11px] uppercase font-bold text-slate-400 px-3 py-1.5">
              Páginas
            </h3>
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  selectedPage?.id === p.id
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span className="truncate">{p.slug}</span>
              </button>
            ))}
          </div>

          {/* Page Content */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-4">
            {selectedPage ? (
              <>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                    {selectedPage.slug.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Modificado: {new Date(selectedPage.modified_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedPage.content}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Selecciona una página para ver su contenido
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
