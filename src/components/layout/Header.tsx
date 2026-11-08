import React from 'react';
import { Menu, RefreshCw, Building2 } from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const tabTitles: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard General',
    subtitle: 'Métricas clave y estado del ecosistema Loki TV',
  },
  installations: {
    title: 'Gestión de Instalaciones',
    subtitle: 'Dispositivos registrados, control de estados y permisos',
  },
  channels: {
    title: 'Canales Generales',
    subtitle: 'Gestión y catálogo de señales de televisión en vivo',
  },
  adult_channels: {
    title: 'Canales Adultos',
    subtitle: 'Catálogo de contenido especial para adultos',
  },
  users: {
    title: 'Usuarios y Compañías',
    subtitle: 'Administración de cuentas y empresas',
  },
  settings: {
    title: 'Configuraciones del Sistema',
    subtitle: 'Parámetros globales de la aplicación móvil y TV',
  },
  map: {
    title: 'Mapa de Dispositivos',
    subtitle: 'Geolocalización de instalaciones activas',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user, role } = useAuth();
  const info = tabTitles[currentTab] || { title: 'Portal Loki TV', subtitle: '' };

  return (
    <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 z-20 shadow-xs">
      {/* Left: Mobile menu toggle + titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>{info.title}</span>
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Context Information */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
            <span className="hidden md:inline">Actualizar</span>
          </button>
        )}

        {/* Company & Role Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <Building2 className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-800 font-semibold">{user?.name || user?.code}</span>
          <span className="text-gray-300">•</span>
          <span
            className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md border ${
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
