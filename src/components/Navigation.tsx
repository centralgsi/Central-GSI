import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Truck,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Cloud,
} from 'lucide-react';
import { UserSession } from '../types';

export type TabType = 'inicio' | 'carga' | 'flota' | 'mantenimiento' | 'inspecciones' | 'alertas' | 'drive' | 'ficha';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: UserSession;
  onExportExcel: () => void;
  onExportBackup: () => void;
  alertCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  user,
  onExportExcel,
  onExportBackup,
  alertCount,
}) => {
  const isLogistica = user.rol === 'logistica';

  return (
    <nav className="no-print mb-6 flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onTabChange('inicio')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'inicio'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </button>

        {isLogistica && (
          <button
            onClick={() => onTabChange('carga')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'carga'
                ? 'bg-[#17469a] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Carga de datos</span>
          </button>
        )}

        <button
          onClick={() => onTabChange('flota')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'flota'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Flota</span>
        </button>

        <button
          onClick={() => onTabChange('mantenimiento')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'mantenimiento'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Mantenimiento</span>
        </button>

        <button
          onClick={() => onTabChange('inspecciones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'inspecciones'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Inspecciones</span>
        </button>

        <button
          onClick={() => onTabChange('alertas')}
          className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'alertas'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Alertas</span>
          {alertCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
              {alertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('drive')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'drive'
              ? 'bg-[#17469a] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-blue-500" />
          <span>Google Drive</span>
        </button>
      </div>

      {/* Acciones de exportación y respaldo */}
      {isLogistica && (
        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Exportar archivo de Excel con hojas de Flota, Mantenimientos e Inspecciones"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar todo a Excel</span>
          </button>
          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all cursor-pointer"
            title="Descargar copia de seguridad completa en formato JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Respaldo JSON</span>
          </button>
        </div>
      )}
    </nav>
  );
};
