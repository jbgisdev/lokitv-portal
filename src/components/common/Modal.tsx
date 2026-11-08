import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: Altura máxima 88vh, Header y Footer Estáticos, Contenido con Scroll interno */}
      <div
        className={`relative w-full ${maxWidth} max-h-[88vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-gray-800 my-auto`}
      >
        {/* Header Estático / Fijo */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/95 z-20">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll vertical interno (min-h-0 evita desbordamiento en Flexbox) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>

        {/* Footer Estático / Fijo */}
        {footer && (
          <div className="shrink-0 px-6 py-3.5 border-t border-gray-100 bg-gray-50/95 flex items-center justify-end gap-2.5 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
