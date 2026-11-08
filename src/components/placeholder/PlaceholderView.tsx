import React from 'react';
import { Tv, Flame, Users, Settings, MapPin, Construction, ArrowLeft } from 'lucide-react';
import { NavigationTab } from '../../types';

interface PlaceholderProps {
  tab: NavigationTab;
  onGoToDashboard: () => void;
}

const placeholderDetails: Record<
  string,
  { title: string; phase: string; icon: React.ReactNode; description: string; highlights: string[] }
> = {
  channels: {
    title: 'Canales Generales',
    phase: 'Fase 2',
    icon: <Tv className="w-10 h-10 text-sky-600" />,
    description:
      'Módulo para administrar la grilla general de canales, numeración, categorías, logos y enlaces de transmisión (HLS/TS).',
    highlights: [
      'Gestión de numeración y ordenación de canales',
      'Activar/desactivar señales y modo mantenimiento',
      'Carga de URLs de streaming y logos oficiales',
    ],
  },
  adult_channels: {
    title: 'Canales Adultos',
    phase: 'Fase 2',
    icon: <Flame className="w-10 h-10 text-rose-600" />,
    description:
      'Control y catálogo de canales con restricción para adultos (+18) con validación de PIN y control parental.',
    highlights: [
      'Separación estricta de contenidos para adultos',
      'Supervisión de dispositivos con permiso de reproducción',
      'Monitoreo de señales protegidas',
    ],
  },
  users: {
    title: 'Gestión de Usuarios y Empresas',
    phase: 'Fase 3',
    icon: <Users className="w-10 h-10 text-amber-600" />,
    description:
      'Administración centralizada de cuentas de empresas, límites de dispositivos y roles de acceso al sistema.',
    highlights: [
      'Creación y edición de compañías',
      'Asignación de roles admin / multiuser / user',
      'Límites de instalaciones simultáneas',
    ],
  },
  settings: {
    title: 'Configuraciones Generales',
    phase: 'Fase 3',
    icon: <Settings className="w-10 h-10 text-purple-600" />,
    description:
      'Ajustes globales de la plataforma Loki TV almacenados en la tabla app_settings.',
    highlights: [
      'Versiones mínimas de la app móvil y TV',
      'Mensajes de mantenimiento globales',
      'Parámetros de caché y timeout de streaming',
    ],
  },
  map: {
    title: 'Mapa de Dispositivos',
    phase: 'Fase 3',
    icon: <MapPin className="w-10 h-10 text-emerald-600" />,
    description:
      'Visualización geográfica interactiva de instalaciones activas en tiempo real basadas en coordenadas (x, y).',
    highlights: [
      'Mapa georreferenciado con pines por dispositivo',
      'Agrupación por ciudad o región',
      'Filtro de estados directamente sobre el mapa',
    ],
  },
};

export const PlaceholderView: React.FC<PlaceholderProps> = ({ tab, onGoToDashboard }) => {
  const info = placeholderDetails[tab] || {
    title: 'Módulo en Construcción',
    phase: 'Próxima Fase',
    icon: <Construction className="w-10 h-10 text-amber-600" />,
    description: 'Este módulo se habilitará en las siguientes iteraciones del proyecto.',
    highlights: [],
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200/90 shadow-sm relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 shadow-2xs">
          {info.icon}
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          {info.phase} • Próximamente
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          {info.title}
        </h2>

        <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          {info.description}
        </p>

        {info.highlights.length > 0 && (
          <div className="max-w-md mx-auto text-left bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Funcionalidades planificadas:
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
              {info.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-medium">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </button>
      </div>
    </div>
  );
};
