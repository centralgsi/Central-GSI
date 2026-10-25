import React from 'react';
import { AlertTriangle, AlertOctagon, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { Vehiculo, getServiceStatus, getTodayDateString } from '../types';
import { formatVehicleName } from '../services/api';

interface AlertasViewProps {
  vehiculos: Vehiculo[];
  onSelectVehiculo: (v: Vehiculo) => void;
}

export const AlertasView: React.FC<AlertasViewProps> = ({
  vehiculos,
  onSelectVehiculo,
}) => {
  const hoy = getTodayDateString();

  const alertas = vehiculos
    .map((v) => {
      const status = getServiceStatus(v, hoy);
      return { vehiculo: v, status };
    })
    .filter((a) => a.status !== 'Sin alerta')
    .sort((a, b) => (a.status === 'Vencido' ? -1 : 1));

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Alertas de Mantenimiento y Services ({alertas.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El sistema detecta automáticamente services vencidos y aquellos que vencen dentro de los próximos 30 días o 1.000 km
          </p>
        </div>
      </div>

      {alertas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {alertas.map(({ vehiculo, status }) => {
            const isVencido = status === 'Vencido';
            return (
              <div
                key={vehiculo.id}
                onClick={() => onSelectVehiculo(vehiculo)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                  isVencido
                    ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900 hover:border-red-400'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold ${
                        isVencido
                          ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isVencido ? (
                        <AlertOctagon className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>Service {status}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {vehiculo.patente}
                    </span>
                  </div>

                  <strong className="block text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {formatVehicleName(vehiculo)}
                  </strong>

                  <div className="mt-2.5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Próxima fecha programada:</span>
                      <strong className={isVencido && vehiculo.proxFecha && vehiculo.proxFecha < hoy ? 'text-red-600 dark:text-red-400' : ''}>
                        {vehiculo.proxFecha || 'Sin cargar'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Próximo kilometraje:</span>
                      <strong className="font-mono">
                        {vehiculo.proxKm ? `${Number(vehiculo.proxKm).toLocaleString('es-AR')} km` : 'Sin cargar'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Kilometraje actual verificado:</span>
                      <strong className="font-mono">
                        {vehiculo.km ? `${Number(vehiculo.km).toLocaleString('es-AR')} km` : 'Sin registrar'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver ficha del móvil</span>
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
            No hay alertas activas de mantenimiento
          </p>
          <p>
            Todos los móviles con service programado se encuentran al día. Recordá actualizar el kilometraje y próximas fechas periódicamente.
          </p>
        </div>
      )}
    </div>
  );
};
