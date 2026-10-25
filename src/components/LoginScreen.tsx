import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Wifi } from 'lucide-react';
import { loginUser } from '../services/api';
import { UserSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState<'logistica' | 'operador'>('logistica');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(usuario, clave);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Usuario o clave de acceso incorrectos.');
      }
    } catch {
      setError('No se pudo contactar al servidor central. Verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#102b59] via-[#143b7d] to-[#17469a]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-100/20">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center justify-center">
            <img
              src="/gsi-logo.png"
              alt="Logo GSI"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                // Fallback si la imagen aún no cargó
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-[#102b59] tracking-tight">
            Control de Flota Vehicular
          </h1>
          <p className="text-xs uppercase font-semibold tracking-wider text-slate-500 mt-1">
            Guardia de Seguridad Institucional
          </p>
        </div>

        {/* Notificación de servidor central */}
        <div className="mb-6 p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <Wifi className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Sincronización en vivo:</strong> Las actualizaciones realizadas desde cualquier PC se reflejan instantáneamente en toda la red.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="usuario"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Usuario
            </label>
            <div className="relative">
              <select
                id="usuario"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value as 'logistica' | 'operador');
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              >
                <option value="logistica">Logística (Acceso Total)</option>
                <option value="operador">Operador (Modo Consulta)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="clave"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Clave de acceso
            </label>
            <div className="relative">
              <input
                id="clave"
                type={showPassword ? 'text' : 'password'}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ingrese su clave de acceso"
                autoComplete="current-password"
                required
                className="w-full pl-3.5 pr-11 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña escrita'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Ingresar al sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Acceso seguro GSI
          </span>
          <span className="text-slate-600 font-medium">Versión centralizada</span>
        </div>
      </div>
    </div>
  );
};
