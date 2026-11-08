import React from 'react';
import { Channel } from '../../types';
import { ChannelLogo } from './ChannelLogo';
import { formatChannelNumber } from '../../services/channels.service';
import {
  CheckCircle2,
  XCircle,
  Wrench,
  Edit2,
  Trash2,
  Tag,
  Copy,
  Check,
  Tv,
} from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  onEdit: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
  onToggleActive: (channel: Channel) => void;
  onToggleMaintenance: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleMaintenance,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyStream = () => {
    navigator.clipboard.writeText(channel.stream_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = !!channel.is_active;
  const isMaintenance = !!channel.en_mantenimiento;
  const isAdult = channel.category?.toUpperCase() === 'ADULTOS';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5">
      {/* Top Header: Logo + Channel Name & Channel Number */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ChannelLogo url={channel.logo_url} name={channel.name} size="md" />
          <div className="min-w-0">
            {/* Línea 1: Nombre */}
            <div className="font-extrabold text-gray-900 text-sm sm:text-base truncate uppercase">
              {channel.name}
            </div>
            {/* Línea 2: CH XXX con icono de TV retro con antena */}
            <div
              className={`flex items-center gap-1.5 font-mono text-xs font-black tracking-tight mt-0.5 ${
                isAdult ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              <Tv className={`w-3.5 h-3.5 shrink-0 ${isAdult ? 'text-rose-600' : 'text-emerald-600'}`} />
              <span>{formatChannelNumber(channel.channel_number)}</span>
            </div>
            {/* Línea 3: Categoría */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase mt-0.5">
              <Tag className="w-3 h-3 text-gray-400" />
              <span>{channel.category || 'GENERAL'}</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {isMaintenance ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Wrench className="w-3 h-3" />
              Mantenimiento
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              En Vivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
              <XCircle className="w-3 h-3" />
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* Stream URL Box */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
        <div className="font-mono text-gray-500 truncate text-[11px]">
          <span className="text-gray-400 mr-1 uppercase font-bold text-[9px]">Stream:</span>
          {channel.stream_url}
        </div>
        <button
          onClick={handleCopyStream}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-slate-200 transition-colors shrink-0"
          title="Copiar URL de stream"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Action Toggles & Edit/Delete buttons */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          {/* Toggle Active */}
          <button
            onClick={() => onToggleActive(channel)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
            title={isActive ? 'Desactivar señal' : 'Activar señal'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isActive ? 'Activo' : 'Activar'}</span>
          </button>

          {/* Toggle Maintenance */}
          <button
            onClick={() => onToggleMaintenance(channel)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
              isMaintenance
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
            title={isMaintenance ? 'Quitar modo mantenimiento' : 'Poner en mantenimiento'}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isMaintenance ? 'Mantenimiento' : 'Normal'}</span>
          </button>
        </div>

        {/* Edit and Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(channel)}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
            title="Editar canal"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(channel)}
            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            title="Eliminar canal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
