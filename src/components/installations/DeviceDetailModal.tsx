import React from 'react';
import { Modal } from '../common/Modal';
import { AppInstallation } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Flame,
  Clock,
  Calendar,
  Building,
  MapPin,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface DeviceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: AppInstallation | null;
  onToggleActive: (device: AppInstallation) => void;
  onToggleBlocked: (device: AppInstallation) => void;
  onToggleAdultContent: (id: string, current: boolean | null) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  isOpen,
  onClose,
  device,
  onToggleActive,
  onToggleBlocked,
  onToggleAdultContent,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!device) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(device.device_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No registrado';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isBlocked = !!device.is_blocked;
  const isActive = device.is_active;
  const adultEnabled = !!device.adult_content;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Dispositivo"
      maxWidth="max-w-lg"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      }
    >
      <div className="space-y-4">
        {/* Header Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 text-base truncate">
                {device.alias || device.device_model || 'Dispositivo TV'}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                Modelo: <span className="font-medium text-gray-700">{device.device_model || 'Genérico'}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isBlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                Bloqueado
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                <XCircle className="w-3.5 h-3.5" />
                Inactivo
              </span>
            )}
          </div>
        </div>

        {/* Device ID Box */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Device ID Único
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-emerald-700 font-semibold select-all break-all">
              {device.device_id}
            </code>
            <button
              onClick={handleCopyId}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-200/70 border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors shrink-0"
              title="Copiar ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              <span className="uppercase font-bold text-[10px]">Empresa / Compañía</span>
            </div>
            <div className="font-mono text-gray-900 font-semibold pl-5">
              {device.company || 'Sin Asignar'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="uppercase font-bold text-[10px]">Versión Software</span>
            </div>
            <div className="text-gray-900 font-medium pl-5">
              App v{device.app_version || '1.0.0'} • SO: {device.os_version || 'N/A'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="uppercase font-bold text-[10px]">Última Conexión</span>
            </div>
            <div className="text-gray-900 font-medium pl-5">
              {formatDate(device.last_seen_at)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="uppercase font-bold text-[10px]">Fecha Registro</span>
            </div>
            <div className="text-gray-900 font-medium pl-5">
              {formatDate(device.created_at)}
            </div>
          </div>

          <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="uppercase font-bold text-[10px]">Coordenadas (x, y)</span>
            </div>
            <div className="text-gray-900 font-medium font-mono pl-5">
              {device.x !== null && device.y !== null ? `(${device.x}, ${device.y})` : 'No especificadas'}
            </div>
          </div>
        </div>

        {/* Quick actions inside modal */}
        <div className="pt-3 border-t border-gray-100">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            Acciones Rápidas
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onToggleActive(device)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isActive ? 'Activo' : 'Activar'}</span>
            </button>

            <button
              onClick={() => onToggleBlocked(device)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isBlocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isBlocked ? 'Bloqueado' : 'Bloquear'}</span>
            </button>

            <button
              onClick={() => onToggleAdultContent(device.id, device.adult_content)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adultEnabled
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{adultEnabled ? '+18 ON' : '+18 OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
