import React, { useState, useEffect } from 'react';
import { X, Save, Truck } from 'lucide-react';
import { Vehiculo } from '../types';

interface VehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculoToEdit: Vehiculo | null;
  onSave: (v: Vehiculo) => Promise<void>;
}

export const VehiculoModal: React.FC<VehiculoModalProps> = ({
  isOpen,
  onClose,
  vehiculoToEdit,
  onSave,
}) => {
  const [formData, setFormData] = useState<Vehiculo>({
    id: '',
    patente: '',
    interno: '',
    codigo: '',
    marca: '',
    modelo: '',
    anio: '',
    km: '',
    estado: 'Operativo',
    ultFecha: '',
    ultKm: '',
    proxFecha: '',
    proxKm: '',
    obs: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehiculoToEdit) {
      setFormData({ ...vehiculoToEdit });
    } else {
      setFormData({
        id: '',
        patente: '',
        interno: '',
        codigo: '',
        marca: '',
        modelo: '',
        anio: '',
        km: '',
        estado: 'Operativo',
        ultFecha: '',
        ultKm: '',
        proxFecha: '',
        proxKm: '',
        obs: '',
      });
    }
    setError('');
  }, [vehiculoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patente.trim()) {
      setError('La patente o dominio es obligatoria');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        patente: formData.patente.trim().toUpperCase(),
        interno: formData.interno.trim(),
        codigo: formData.codigo.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el vehículo en el servidor central');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#17469a] dark:text-blue-400 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {vehiculoToEdit ? 'Editar Datos del Móvil' : 'Cargar Nuevo Móvil'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información técnica, kilometraje y services programados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Patente / Dominio *
              </label>
              <input
                type="text"
                required
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                placeholder="Ej. AG475HF"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Número de móvil / Interno
              </label>
              <input
                type="text"
                value={formData.interno}
                onChange={(e) => setFormData({ ...formData, interno: e.target.value })}
                placeholder="Ej. 3380"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Código adicional
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej. 1531606"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ej. Ford / Toyota"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ej. Ranger / Hilux"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Año
              </label>
              <input
                type="number"
                min="1980"
                max="2035"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                placeholder="Ej. 2023"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Kilometraje actual
              </label>
              <input
                type="number"
                min="0"
                value={formData.km}
                onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                placeholder="Ej. 45000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Estado operativo
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Operativo">Operativo</option>
                <option value="En mantenimiento">En mantenimiento</option>
                <option value="Fuera de servicio">Fuera de servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Último service - Fecha
              </label>
              <input
                type="date"
                value={formData.ultFecha}
                onChange={(e) => setFormData({ ...formData, ultFecha: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Último service - Km
              </label>
              <input
                type="number"
                min="0"
                value={formData.ultKm}
                onChange={(e) => setFormData({ ...formData, ultKm: e.target.value })}
                placeholder="Ej. 40000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Próximo service - Fecha
              </label>
              <input
                type="date"
                value={formData.proxFecha}
                onChange={(e) => setFormData({ ...formData, proxFecha: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Próximo service - Km
              </label>
              <input
                type="number"
                min="0"
                value={formData.proxKm}
                onChange={(e) => setFormData({ ...formData, proxKm: e.target.value })}
                placeholder="Ej. 50000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Observaciones / Novedades
            </label>
            <textarea
              rows={3}
              value={formData.obs}
              onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
              placeholder="Detalles sobre el estado del móvil, arreglos pendientes, asignación, etc."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando en red...' : 'Guardar móvil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
