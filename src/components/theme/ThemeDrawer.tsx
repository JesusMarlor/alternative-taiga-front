import React, { useState } from 'react';
import { useThemeStore, PRESET_PALETTES } from '../../stores/themeStore';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  X, 
  Check, 
  Sparkles, 
  Building2, 
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    mode, 
    setMode, 
    primaryColor, 
    activePreset, 
    setPrimaryColor, 
    companyName, 
    companyLogo, 
    appTitle,
    setWhiteLabel 
  } = useThemeStore();

  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [tempAppTitle, setTempAppTitle] = useState(appTitle);
  const [tempLogo, setTempLogo] = useState(companyLogo || '');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  if (!isOpen) return null;

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setWhiteLabel({
      companyName: tempCompanyName,
      appTitle: tempAppTitle,
      companyLogo: tempLogo.trim() ? tempLogo.trim() : null,
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleResetBrand = () => {
    setTempCompanyName('');
    setTempAppTitle('planning');
    setTempLogo('');
    setWhiteLabel({
      companyName: '',
      appTitle: 'planning',
      companyLogo: null,
    });
    setPrimaryColor('#059669', 'emerald');
    setMode('light');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personalización & Marca</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ajusta colores, logotipos y modo visual</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Modo de Pantalla
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  mode === 'light'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Claro</span>
              </button>

              <button
                onClick={() => setMode('dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  mode === 'dark'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Oscuro</span>
              </button>

              <button
                onClick={() => setMode('system')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  mode === 'system'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span>Sistema</span>
              </button>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Paletas de Color
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_PALETTES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPrimaryColor(preset.primary, preset.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    activePreset === preset.id
                      ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-sm ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span 
                    className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center text-white"
                    style={{ backgroundColor: preset.primary }}
                  >
                    {activePreset === preset.id && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Hex Picker */}
            <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value, 'custom')}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                id="custom-color-picker"
              />
              <div className="flex-1">
                <label htmlFor="custom-color-picker" className="text-xs font-medium text-slate-700 dark:text-slate-300 block cursor-pointer">
                  Color Personalizado
                </label>
                <span className="text-[11px] font-mono text-slate-500">{primaryColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* White-label Settings */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-brand-500" />
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Identidad Corporativa (White-Label)
              </label>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  placeholder="Ej. Filup, Mi Empresa"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Aplicación
                </label>
                <input
                  type="text"
                  value={tempAppTitle}
                  onChange={(e) => setTempAppTitle(e.target.value)}
                  placeholder="Ej. Filup Planning"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL del Logo Corporativo (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tempLogo}
                    onChange={(e) => setTempLogo(e.target.value)}
                    placeholder="https://empresa.com/logo.png"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {tempLogo && (
                    <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1">
                      <img src={tempLogo} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Deja vacío para usar el isotipo predeterminado de Filup.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetBrand}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Guardar Marca
                </button>
              </div>

              {isSavedAlert && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center animate-fade-in">
                  ✓ Configuración de marca actualizada
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
