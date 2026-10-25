import React, { useState } from 'react';
import { Wrench, Save, Trash2, Search, FileDown, PlusCircle } from 'lucide-react';
import { Mantenimiento, Vehiculo, UserSession, getTodayDateString } from '../types';
import { formatVehicleName } from '../services/api';

interface MantenimientoViewProps {
  vehiculos: Vehiculo[];
  mantenimientos: Mantenimiento[];
  user: UserSession;
  onSaveMantenimiento: (m: Mantenimiento) => Promise<void>;
  onDeleteMantenimiento: (id: string) => Promise<void>;
  onExportCSV: () => void;
}

export const MantenimientoView: React.FC<MantenimientoViewProps> = ({
  vehiculos,
  mantenimientos,
  user,
  onSaveMantenimiento,
  onDeleteMantenimiento,
  onExportCSV,
}) => {
  const isLogistica = user.rol === 'logistica';
  const hoy = getTodayDateString();

  const [formData, setFormData] = useState<Omit<Mantenimiento, 'id'>>({
    vehiculo: vehiculos[0]?.id || '',
    fecha: hoy,
    km: '',
    categoria: 'Service preventivo',
    trabajo: '',
    resultado: 'Finalizado',
    taller: '',
    costo: '',
    proxFecha: '',
    proxKm: '',
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
    if (formData.km === '') {
      setError('El kilometraje es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await onSaveMantenimiento({
        id: `m${Date.now()}`,
        ...formData,
      });
      setSuccessMsg('Mantenimiento registrado y sincronizado exitosamente.');
      setFormData({
        vehiculo: formData.vehiculo,
        fecha: hoy,
        km: '',
        categoria: 'Service preventivo',
        trabajo: '',
        resultado: 'Finalizado',
        taller: '',
        costo: '',
        proxFecha: '',
        proxKm: '',
        obs: '',
      });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el mantenimiento');
    } finally {
      setSaving(false);
    }
  };

  const getVName = (id: string) => {
    const v = vehiculos.find((veh) => veh.id === id);
    return formatVehicleName(v);
  };

  const filtered = mantenimientos.filter((m) => {
    const term = search.toLowerCase();
    const vName = getVName(m.vehiculo).toLowerCase();
    return (
      vName.includes(term) ||
      m.categoria.toLowerCase().includes(term) ||
      m.trabajo.toLowerCase().includes(term) ||
      m.taller.toLowerCase().includes(term) ||
      m.fecha.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Formulario de registro (Logística) */}
      {isLogistica && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#17469a] dark:text-blue-400 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Nuevo Mantenimiento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Al guardar, se actualiza el kilometraje y próximo service del móvil en todas las terminales
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
                  Vehículo *
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
                  Fecha del trabajo *
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
                  Kilometraje al momento *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  placeholder="Ej. 45000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Service preventivo">Service preventivo</option>
                  <option value="Motor">Motor</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Neumáticos">Neumáticos</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Trabajo realizado
                </label>
                <input
                  type="text"
                  value={formData.trabajo}
                  onChange={(e) => setFormData({ ...formData, trabajo: e.target.value })}
                  placeholder="Ej. Cambio de aceite 10W40 y filtros"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Resultado
                </label>
                <select
                  value={formData.resultado}
                  onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Finalizado">Finalizado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Requiere seguimiento">Requiere seguimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Taller / Responsable
                </label>
                <input
                  type="text"
                  value={formData.taller}
                  onChange={(e) => setFormData({ ...formData, taller: e.target.value })}
                  placeholder="Ej. Taller Central GSI"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Costo ($ ARS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  placeholder="Ej. 120000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Próxima fecha de service
                </label>
                <input
                  type="date"
                  value={formData.proxFecha}
                  onChange={(e) => setFormData({ ...formData, proxFecha: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Próximo service en km
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.proxKm}
                  onChange={(e) => setFormData({ ...formData, proxKm: e.target.value })}
                  placeholder="Ej. 55000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Observaciones / Repuestos utilizados
                </label>
                <textarea
                  rows={2}
                  value={formData.obs}
                  onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                  placeholder="Detalle de piezas cambiadas, facturas, comprobantes o advertencias mecánicas"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando en red...' : 'Guardar mantenimiento'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial general de mantenimientos */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Historial de Mantenimientos ({filtered.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro histórico de intervenciones mecánicas y preventivas
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

        {/* Buscador de historial */}
        <div className="no-print relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vehículo, fecha, trabajo o taller..."
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
                <th className="p-3 font-semibold">Categoría</th>
                <th className="p-3 font-semibold">Trabajo realizado</th>
                <th className="p-3 font-semibold">Resultado</th>
                <th className="p-3 font-semibold">Taller</th>
                <th className="p-3 font-semibold">Costo</th>
                {isLogistica && <th className="no-print p-3 font-semibold text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium whitespace-nowrap">{m.fecha}</td>
                    <td className="p-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {getVName(m.vehiculo)}
                    </td>
                    <td className="p-3 font-mono whitespace-nowrap">
                      {Number(m.km).toLocaleString('es-AR')} km
                    </td>
                    <td className="p-3 whitespace-nowrap">{m.categoria}</td>
                    <td className="p-3">{m.trabajo || '—'}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {m.resultado}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{m.taller || '—'}</td>
                    <td className="p-3 font-mono whitespace-nowrap">
                      {m.costo ? `$ ${Number(m.costo).toLocaleString('es-AR')}` : '—'}
                    </td>
                    {isLogistica && (
                      <td className="no-print p-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este registro de mantenimiento?')) {
                              onDeleteMantenimiento(m.id);
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isLogistica ? 9 : 8}
                    className="p-8 text-center text-slate-500 dark:text-slate-400 italic"
                  >
                    No hay registros de mantenimiento para mostrar.
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
