import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  Tv,
  Flame,
  Users,
  Settings,
  MapPin,
  LogOut,
  X,
  Building2,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  isActivePhase: boolean;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, role, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      isActivePhase: true,
    },
    {
      id: 'installations',
      label: 'Instalaciones',
      icon: <Smartphone className="w-5 h-5" />,
      isActivePhase: true,
    },
    {
      id: 'channels',
      label: 'Canales Generales',
      icon: <Tv className="w-5 h-5" />,
      isActivePhase: true,
    },
    {
      id: 'adult_channels',
      label: 'Canales Adultos',
      icon: <Flame className="w-5 h-5" />,
      isActivePhase: true,
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
      isActivePhase: true,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="w-5 h-5" />,
      isActivePhase: false,
      badge: 'Fase 3',
    },
    {
      id: 'map',
      label: 'Mapa',
      icon: <MapPin className="w-5 h-5" />,
      isActivePhase: false,
      badge: 'Fase 3',
    },
  ];

  const handleNavClick = (item: NavItem) => {
    onSelectTab(item.id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] border-r border-gray-800 text-gray-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 font-black tracking-wider">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">LOKI TV</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Panel Administrativo
            </div>
          </div>
        </div>

        {/* Close button on mobile */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
          Menú de Navegación
        </div>

        {navItems.map((item) => {
          const isSelected = currentTab === item.id;
          const isEnabled = item.isActivePhase;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : isEnabled
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/70 border border-transparent'
                  : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800/40 border border-transparent opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isSelected ? 'text-emerald-400' : isEnabled ? 'text-gray-400' : 'text-gray-600'}>
                  {item.icon}
                </span>
                <span className={isSelected ? 'font-semibold text-white' : ''}>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/60">
                  {item.badge}
                </span>
              )}
              {isEnabled && isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* User / Session Footer */}
      <div className="p-3 border-t border-gray-800/90 bg-[#0E1420]">
        <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-white truncate max-w-[120px]" title={user?.name || user?.code}>
                {user?.name || user?.code}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                role === 'admin'
                  ? 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {role || 'usuario'}
            </span>
          </div>

          <div className="text-[11px] text-gray-400 mb-3 flex items-center justify-between">
            <span>Código:</span>
            <code className="text-gray-300 font-mono bg-gray-950 px-1.5 py-0.5 rounded">
              {user?.code}
            </code>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-gray-800/80 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40 text-gray-300 border border-gray-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
