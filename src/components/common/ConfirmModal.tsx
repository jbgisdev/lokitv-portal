import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  deviceId?: string;
  deviceModel?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  deviceId,
  deviceModel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <ShieldAlert className="w-6 h-6 text-rose-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    primary: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const bgIcons = {
    danger: 'bg-rose-50 text-rose-600 border-rose-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    primary: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  const btnColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${btnColors[variant]}`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${bgIcons[variant]}`}>
            {icons[variant]}
          </div>
          <div className="flex-1 text-sm text-gray-600 leading-relaxed">
            <p>{message}</p>
          </div>
        </div>

        {(deviceId || deviceModel) && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            {deviceModel && (
              <div className="text-gray-700 font-semibold truncate">
                Dispositivo: <span className="font-normal text-gray-900">{deviceModel}</span>
              </div>
            )}
            {deviceId && (
              <div className="text-gray-500 font-mono truncate">
                ID: <span className="text-gray-800 font-medium">{deviceId}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
