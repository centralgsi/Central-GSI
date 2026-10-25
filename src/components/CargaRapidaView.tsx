import React, { useRef } from 'react';
import { Truck, Wrench, ClipboardCheck, UploadCloud, Cloud } from 'lucide-react';
import { FlotaData } from '../types';

interface CargaRapidaViewProps {
  onOpenNuevoVehiculo: () => void;
  onGoToMantenimiento: () => void;
  onGoToInspecciones: () => void;
  onGoToDrive?: () => void;
  onRestoreBackup: (data: FlotaData) => Promise<void>;
}

export const CargaRapidaView: React.FC<CargaRapidaViewProps> = ({
  onOpenNuevoVehiculo,
  onGoToMantenimiento,
  onGoToInspecciones,
  onGoToDrive,
  onRestoreBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('¿Restaurar este respaldo en el servidor central? Se actualizarán los datos para todas las PCs.')) {
          await onRestoreBackup(json);
          alert('Respaldo restaurado y sincronizado con éxito.');
        }
      } catch (err: any) {
        alert('Archivo de respaldo inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Panel de Carga y Actualización
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Accedé rápidamente a los módulos para ingresar vehículos, mantenimientos o inspecciones. Toda modificación se sincroniza inmediatamente con el servidor central y se propaga a las demás terminales.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agregar Móvil */}
        <button
          onClick={onOpenNuevoVehiculo}
          className="text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer border-t-4 border-t-blue-600"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <strong className="block text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              + Agregar Móvil
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Cargar nuevo vehículo a la flota con su patente, interno, código, marca, modelo y estado inicial.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            Abrir formulario de carga →
          </span>
        </button>

        {/* Registrar Mantenimiento */}
        <button
          onClick={onGoToMantenimiento}
          className="text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer border-t-4 border-t-blue-600"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5" />
            </div>
            <strong className="block text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Registrar Mantenimiento
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ingresar intervenciones mecánicas, services de aceite y filtros, repuestos, costos y próximas fechas.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            Ir a mantenimientos →
          </span>
        </button>

        {/* Registrar Inspección */}
        <button
          onClick={onGoToInspecciones}
          className="text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer border-t-4 border-t-blue-600"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <strong className="block text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Registrar Inspección
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Completar la lista de control de 11 puntos: niveles, frenos, neumáticos, luces y seguridad.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            Ir a inspecciones →
          </span>
        </button>

        {/* Google Drive */}
        <button
          onClick={onGoToDrive}
          className="text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer border-t-4 border-t-blue-600"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Cloud className="w-5 h-5" />
            </div>
            <strong className="block text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Google Drive
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Guardar y sincronizar respaldos automáticos, planillas Excel y documentación en tu nube de Google Drive.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            Gestionar Google Drive →
          </span>
        </button>
      </div>

      {/* Restaurar Respaldo JSON */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Restauración de Respaldo Central
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ¿Tenés un archivo .json de respaldo previo? Podés subirlo para restaurar todos los datos en el servidor.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Cargar archivo de respaldo JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
