import React from 'react';
import {
  Menu,
  RefreshCw,
  Building2,
  Tv,
  Smartphone,
  Flame,
  Users,
  Settings,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  recordCount?: number;
}

const tabMeta: Record<
  NavigationTab,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  dashboard: {
    title: 'Dashboard General',
    subtitle: 'Métricas clave y estado del ecosistema Loki TV',
    icon: <LayoutDashboard className="w-5 h-5 text-white" />,
  },
  installations: {
    title: 'Instalaciones',
    subtitle: 'Dispositivos registrados, control de estados y permisos',
    icon: <Smartphone className="w-5 h-5 text-white" />,
  },
  channels: {
    title: 'Canales Generales',
    subtitle: 'Gestión y catálogo de señales de televisión en vivo',
    icon: <Tv className="w-5 h-5 text-white" />,
  },
  adult_channels: {
    title: 'Canales Adultos',
    subtitle: 'Catálogo de contenido especial para adultos (+18)',
    icon: <Flame className="w-5 h-5 text-white" />,
  },
  users: {
    title: 'Usuarios y Cuentas',
    subtitle: 'Administración de cuentas y empresas en Supabase',
    icon: <Users className="w-5 h-5 text-white" />,
  },
  settings: {
    title: 'Configuraciones del Sistema',
    subtitle: 'Parámetros globales de la plataforma app_settings',
    icon: <Settings className="w-5 h-5 text-white" />,
  },
  map: {
    title: 'Mapa de Dispositivos',
    subtitle: 'Geolocalización interactiva de instalaciones activas',
    icon: <MapPin className="w-5 h-5 text-white" />,
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing = false,
  recordCount,
}) => {
  const { user, role } = useAuth();
  const info = tabMeta[currentTab] || {
    title: 'Portal Loki TV',
    subtitle: '',
    icon: <Tv className="w-5 h-5 text-white" />,
  };

  return (
    <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20 shadow-xs">
      {/* Left: Mobile menu toggle + Brand Logo & Module Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors shrink-0"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Icon / Logo con Paleta Loki TV (Gradiente Emerald + Sombra) */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-emerald-950/20 shrink-0">
          {info.icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight truncate">
              {info.title}
            </h1>

            {/* Métrica de Registros Integrada Directamente en el Título */}
            {recordCount !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                ({recordCount} {recordCount === 1 ? 'registro' : 'registros'})
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 hidden sm:block truncate mt-0.5">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Context Information (Actualizar + Usuario + Rol) */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar datos desde Supabase"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'
              }`}
            />
            <span className="hidden md:inline">Actualizar</span>
          </button>
        )}

        {/* Company & Role Pill con Paleta Oficial */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-gray-200 text-xs">
          <Building2 className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-800 font-bold">{user?.name || user?.code}</span>
          <span className="text-gray-300">•</span>
          <span
            className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md border ${
              role === 'admin'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {role}
          </span>
        </div>
      </div>
    </header>
  );
};
