import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-200',
    warning: 'border-amber-500/30 bg-amber-950/40 text-amber-200',
    info: 'border-sky-500/30 bg-sky-950/40 text-sky-200',
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-slide-in ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm">
        {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
        <div className="text-gray-300 leading-snug">{toast.message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

