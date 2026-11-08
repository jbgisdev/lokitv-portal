import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Tv,
  CheckCircle2,
  Flame,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService, DashboardMetrics } from '../../services/dashboard.service';
import { NavigationTab } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getMetrics(role, user?.code || null);
      setMetrics(data);
    } catch (err: any) {
      console.error('Error cargando métricas:', err);
      setError(err.message || 'Error al obtener métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user?.code]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Cargando métricas de Loki TV...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 max-w-xl mx-auto my-8 text-center shadow-xs">
        <p className="font-bold text-base mb-1">Error al cargar datos del Dashboard</p>
        <p className="text-xs text-rose-600 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Welcome Banner (Vibrant & Clean) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Loki TV Admin Panel</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido, {user?.name || user?.code}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              {role === 'admin' ? (
                <>
                  Acceso de <strong className="text-white font-semibold underline decoration-white/40">Administrador Global</strong>: monitoreo en vivo de todas las instalaciones, empresas y señales del sistema.
                </>
              ) : (
                <>
                  Métricas asignadas a tu empresa <strong className="text-white font-mono">{user?.code}</strong> bajo política de aislamiento multi-inquilino.
                </>
              )}
            </p>
          </div>

          <button
            onClick={() => onNavigate('installations')}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer group shrink-0"
          >
            <span>Gestionar Dispositivos</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-600" />
          </button>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Instalaciones */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Instalaciones
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {metrics.totalInstallations}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {role === 'multiuser' ? `en ${user?.code}` : 'registros'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Activas: <strong className="text-emerald-600 font-semibold">{metrics.activeInstallations}</strong></span>
            <span>Bloqueadas: <strong className="text-rose-600 font-semibold">{metrics.blockedInstallations}</strong></span>
          </div>
        </div>

        {/* Total Canales Generales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 hover:border-sky-500/40 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Canales
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {metrics.totalChannels}
            </span>
            <span className="text-xs text-gray-500 font-medium">señales</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Grilla en Vivo</span>
            <span className="text-sky-600 font-semibold">Loki Live</span>
          </div>
        </div>

        {/* Total Canales Adultos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Canales Adultos (+18)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {metrics.totalAdultChannels}
            </span>
            <span className="text-xs text-gray-500 font-medium">exclusivos</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Con permiso:</span>
            <span className="text-rose-600 font-semibold">{metrics.adultContentInstallations} dispositivos</span>
          </div>
        </div>

        {/* Estado Operativo */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Estado de Red
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
              99.9%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Operacional</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Supabase Cloud</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Section: Recent Installations & Top Models */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Installations (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Instalaciones Recientes</h3>
              </div>
              <button
                onClick={() => onNavigate('installations')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {metrics.recentInstallations.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No hay instalaciones registradas aún para este alcance.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {metrics.recentInstallations.map((device) => (
                  <div
                    key={device.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-gray-100 text-gray-700 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate text-xs sm:text-sm">
                          {device.alias || device.device_model || 'Dispositivo TV'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">
                          ID: {device.device_id.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {device.company && (
                        <span className="hidden sm:inline text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {device.company}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          device.is_blocked
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : device.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {device.is_blocked ? 'Bloqueado' : device.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Últimos registros en tiempo real</span>
            <span className="font-mono text-emerald-600 font-semibold">Supabase DB</span>
          </div>
        </div>

        {/* Top Device Models (1 col) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-gray-900">Top Modelos</h3>
            </div>

            {metrics.devicesByModel.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Sin datos de modelos de hardware.
              </div>
            ) : (
              <div className="space-y-3.5">
                {metrics.devicesByModel.map((item, idx) => {
                  const percentage = Math.round((item.count / (metrics.totalInstallations || 1)) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 font-medium truncate max-w-[170px]" title={item.model}>
                          {item.model}
                        </span>
                        <span className="text-gray-500 font-mono font-semibold">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            Información reportada por el cliente Android/TV
          </div>
        </div>
      </div>
    </div>
  );
};
