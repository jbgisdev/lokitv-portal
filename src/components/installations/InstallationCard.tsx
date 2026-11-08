import React from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Flame,
  Edit2,
  Clock,
  Copy,
  Check,
  Eye,
} from 'lucide-react';
import { AppInstallation } from '../../types';

interface InstallationCardProps {
  device: AppInstallation;
  onToggleActive: (device: AppInstallation) => void;
  onToggleBlocked: (device: AppInstallation) => void;
  onToggleAdultContent: (id: string, current: boolean | null) => void;
  onEditAlias: (device: AppInstallation) => void;
  onViewDetails?: (device: AppInstallation) => void;
  isActionLoading: (id: string, action: string) => boolean;
}

export const InstallationCard: React.FC<InstallationCardProps> = ({
  device,
  onToggleActive,
  onToggleBlocked,
  onToggleAdultContent,
  onEditAlias,
  onViewDetails,
  isActionLoading,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(device.device_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isBlocked = !!device.is_blocked;
  const isActive = device.is_active;
  const adultEnabled = !!device.adult_content;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5">
      {/* 1. Device ID Box at top with quick copy */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className="text-gray-400 font-bold uppercase text-[10px]">ID:</span>
          <span className="font-mono text-gray-800 font-medium truncate select-all">
            {device.device_id}
          </span>
        </div>
        <button
          onClick={handleCopyId}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors shrink-0"
          title="Copiar Device ID"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Model & Alias */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm truncate" title={device.alias || device.device_model || 'Dispositivo'}>
                {device.alias || device.device_model || 'Dispositivo Android TV'}
              </span>
              <button
                onClick={() => onEditAlias(device)}
                className="text-gray-400 hover:text-emerald-600 p-0.5 rounded transition-colors"
                title="Editar alias"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              Modelo: <span className="font-medium text-gray-700">{device.device_model || 'Genérico'}</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {isBlocked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3 h-3" />
              Bloqueado
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
              <XCircle className="w-3 h-3" />
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* 3. Versions and Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Versión Software</span>
          <span className="text-gray-800 font-medium">
            App v{device.app_version || '1.0'} • SO: {device.os_version || 'Android'}
          </span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Empresa</span>
          <span className="font-mono text-gray-800 font-medium">{device.company || 'Sin Asignar'}</span>
        </div>
        <div className="col-span-2 flex items-center justify-between text-gray-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            Última conexión: <strong className="text-gray-600 font-medium">{formatDate(device.last_seen_at)}</strong>
          </span>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(device)}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>Detalles</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Toggle Buttons */}
      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* Toggle Active (triggers confirmation) */}
        <button
          onClick={() => onToggleActive(device)}
          disabled={isActionLoading(device.id, 'active')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            isActive
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
          }`}
          title={isActive ? 'Desactivar dispositivo' : 'Activar dispositivo'}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isActive ? 'Activo' : 'Activar'}</span>
        </button>

        {/* Toggle Blocked (triggers confirmation) */}
        <button
          onClick={() => onToggleBlocked(device)}
          disabled={isActionLoading(device.id, 'blocked')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            isBlocked
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
          }`}
          title={isBlocked ? 'Desbloquear dispositivo' : 'Bloquear dispositivo'}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isBlocked ? 'Bloqueado' : 'Bloquear'}</span>
        </button>

        {/* Toggle Adult Content */}
        <button
          onClick={() => onToggleAdultContent(device.id, device.adult_content)}
          disabled={isActionLoading(device.id, 'adult')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            adultEnabled
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
          }`}
          title={adultEnabled ? 'Desactivar contenido adulto' : 'Habilitar contenido adulto'}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>+18 {adultEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>
    </div>
  );
};
