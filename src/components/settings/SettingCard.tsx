import React from 'react';
import { AppSetting } from '../../types';
import { parseValueArrayItem } from '../../services/settings.service';
import { Key, Tag, Edit2, Link as LinkIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SettingCardProps {
  setting: AppSetting;
  onEdit: (setting: AppSetting) => void;
}

export const SettingCard: React.FC<SettingCardProps> = ({ setting, onEdit }) => {
  const isBoolean =
    setting.value?.toLowerCase() === 'true' || setting.value?.toLowerCase() === 'false';
  const isTrue = setting.value?.toLowerCase() === 'true';
  const isUrl =
    setting.value?.startsWith('http://') || setting.value?.startsWith('https://');

  const arrayItems = Array.isArray(setting.value_array) ? setting.value_array : [];

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-3">
      {/* Header: Key + Edit Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-900 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 w-fit truncate">
            <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{setting.key}</span>
          </div>

          {setting.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed" title={setting.description}>
              {setting.description}
            </p>
          )}
        </div>

        {/* Solo botón de Edición (Sin botón de eliminar) */}
        <button
          type="button"
          onClick={() => onEdit(setting)}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer shrink-0"
          title="Editar Configuración"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Valor Actual (value) */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          Valor (value):
        </span>

        {isBoolean ? (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              isTrue
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {isTrue ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>{setting.value}</span>
          </span>
        ) : isUrl ? (
          <a
            href={setting.value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono text-xs break-all"
          >
            <LinkIcon className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[260px]">{setting.value}</span>
          </a>
        ) : (
          <span className="font-mono text-xs font-bold text-gray-900 break-all">
            {setting.value || <span className="text-gray-400 italic font-normal">vacío</span>}
          </span>
        )}
      </div>

      {/* value_array preview */}
      {arrayItems.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <Tag className="w-3 h-3 text-emerald-600" />
            <span>Elementos en Arreglo ({arrayItems.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {arrayItems.slice(0, 3).map((item, idx) => {
              const parsed = parseValueArrayItem(item);
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 font-mono text-[11px] truncate max-w-[200px]"
                >
                  {parsed.display}
                </span>
              );
            })}
            {arrayItems.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-mono text-[10px] font-bold">
                +{arrayItems.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Fecha de actualización */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Actualizado:</span>
        </span>
        <span className="font-medium text-gray-600">{formatDate(setting.updated_at)}</span>
      </div>
    </div>
  );
};

