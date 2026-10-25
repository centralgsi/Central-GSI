import React, { useState } from 'react';
import { ClipboardCheck, Save, Trash2, Search, FileDown, PlusCircle } from 'lucide-react';
import { Inspeccion, Vehiculo, UserSession, CHECKLIST_ITEMS, getTodayDateString } from '../types';
import { formatVehicleName } from '../services/api';

interface InspeccionViewProps {
  vehiculos: Vehiculo[];
  inspecciones: Inspeccion[];
  user: UserSession;
  onSaveInspeccion: (i: Inspeccion) => Promise<void>;
  onDeleteInspeccion: (id: string) => Promise<void>;
  onExportCSV: () => void;
}

export const InspeccionView: React.FC<InspeccionViewProps> = ({
  vehiculos,
  inspecciones,
  user,
  onSaveInspeccion,
  onDeleteInspeccion,
  onExportCSV,
}) => {
  const isLogistica = user.rol === 'logistica';
  const hoy = getTodayDateString();

  const initialItemsState: Record<string, string> = {};
  CHECKLIST_ITEMS.forEach((c) => {
    initialItemsState[c] = 'Sin revisar';
  });

  const [formData, setFormData] = useState<Omit<Inspeccion, 'id'>>({
    vehiculo: vehiculos[0]?.id || '',
    fecha: hoy,
    km: '',
    inspector: '',
    items: initialItemsState,
    obs: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehiculo) {
      setError('Seleccione un vehículo');
      return;
    }
    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await onSaveInspeccion({
        id: `i${Date.now()}`,
        ...formData,
      });
      setSuccessMsg('Inspección registrada y sincronizada exitosamente.');
      setFormData({
        vehiculo: formData.vehiculo,
        fecha: hoy,
        km: '',
        inspector: formData.inspector,
        items: initialItemsState,
        obs: '',
      });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la inspección');
    } finally {
      setSaving(false);
    }
  };

  const getVName = (id: string) => {
    const v = vehiculos.find((veh) => veh.id === id);
    return formatVehicleName(v);
  };

  const filtered = inspecciones.filter((i) => {
    const term = search.toLowerCase();
    const vName = getVName(i.vehiculo).toLowerCase();
    return (
      vName.includes(term) ||
      i.inspector.toLowerCase().includes(term) ||
      i.obs.toLowerCase().includes(term) ||
      i.fecha.includes(term)
    );
  });

  const hasIssues = (items: Record<string, string>) => {
    return Object.values(items || {}).some(
      (v) => v === 'Observación' || v === 'Requiere reparación'
    );
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Inspección (Logística) */}
      {isLogistica && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#17469a] dark:text-blue-400 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Nueva Inspección General
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lista de control de 11 puntos mecánicos y de seguridad institucional
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Vehículo a inspeccionar *
                </label>
                <select
                  required
                  value={formData.vehiculo}
                  onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatVehicleName(v)} ({v.km ? `${Number(v.km).toLocaleString('es-AR')} km` : 'Km s/c'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kilometraje verificado
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  placeholder="Ej. 45200"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Inspector / Responsable
                </label>
                <input
                  type="text"
                  value={formData.inspector}
                  onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                  placeholder="Nombre y apellido del inspector"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                Lista de Control (11 Ítems)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {CHECKLIST_ITEMS.map((item) => {
                  const val = formData.items[item] || 'Sin revisar';
                  return (
                    <div
                      key={item}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between gap-1.5"
                    >
                      <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item}
                      </label>
                      <select
                        value={val}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            items: {
                              ...formData.items,
                              [item]: e.target.value,
                            },
                          })
                        }
                        className={`w-full px-2 py-1 text-xs rounded-md border focus:outline-none transition-colors ${
                          val === 'Correcto'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold'
                            : val === 'Observación'
                            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold'
                            : val === 'Requiere reparación'
                            ? 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="Sin revisar">Sin revisar</option>
                        <option value="Correcto">Correcto</option>
                        <option value="Observación">Observación</option>
                        <option value="Requiere reparación">Requiere reparación</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Observaciones / Novedades de la inspección
              </label>
              <textarea
                rows={2}
                value={formData.obs}
                onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                placeholder="Detalle de anomalías, estado de cubiertas, limpieza, faltantes de botiquín o matafuegos"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando en red...' : 'Guardar inspección'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de inspecciones registradas */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Inspecciones Registradas ({filtered.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controles preventivos e informes de novedades
            </p>
          </div>

          {isLogistica && (
            <button
              onClick={onExportCSV}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>

        {/* Buscador */}
        <div className="no-print relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vehículo, inspector, observaciones..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-3 font-bold">Fecha</th>
                <th className="p-3 font-semibold">Vehículo</th>
                <th className="p-3 font-semibold">Kilometraje</th>
                <th className="p-3 font-semibold">Resultado</th>
                <th className="p-3 font-semibold">Inspector</th>
                <th className="p-3 font-semibold">Novedades / Observaciones</th>
                {isLogistica && <th className="no-print p-3 font-semibold text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.length > 0 ? (
                filtered.map((i) => {
                  const bad = hasIssues(i.items);
                  return (
                    <tr
                      key={i.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-medium whitespace-nowrap">{i.fecha}</td>
                      <td className="p-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {getVName(i.vehiculo)}
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">
                        {i.km ? `${Number(i.km).toLocaleString('es-AR')} km` : '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            bad
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {bad ? 'Con observaciones' : 'Correcta'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{i.inspector || '—'}</td>
                      <td className="p-3">{i.obs || 'Sin novedades'}</td>
                      {isLogistica && (
                        <td className="no-print p-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este registro de inspección?')) {
                                onDeleteInspeccion(i.id);
                              }
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isLogistica ? 7 : 6}
                    className="p-8 text-center text-slate-500 dark:text-slate-400 italic"
                  >
                    No hay inspecciones registradas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
