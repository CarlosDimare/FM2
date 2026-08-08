import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CharacterDialogProps {
  nombre: string;
  cargo: string;
  iniciales: string;
  clubColor: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  quickReplies?: { texto: string; onClick: () => void }[];
}

export const CharacterDialog: React.FC<CharacterDialogProps> = ({
  nombre, cargo, iniciales, clubColor, onClose, children, footer, maxWidth = 'max-w-3xl', quickReplies,
}) => {
  const closeRef = useRef<() => void>(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Diálogo con ${nombre}, ${cargo}`}
      className="fixed inset-x-0 bottom-0 top-auto z-[950] bg-black/70 backdrop-blur-sm flex items-end justify-center p-0 sm:p-3 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className={`bg-[#e8ece8] border-2 border-[#a0b0a0] rounded-t-xl shadow-2xl w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden animate-slide-up`}
        style={{ fontFamily: 'Verdana, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#a0b0a0]/60 rounded-full" />
        </div>

        <header
          className="px-4 sm:px-6 py-3 border-b border-[#a0b0a0] flex items-center gap-3 sm:gap-4 shrink-0"
          style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}
        >
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-black text-base sm:text-lg uppercase italic shadow-lg border-2 border-white shrink-0 ${clubColor}`}>
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase italic tracking-tight truncate">{nombre}</h3>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{cargo}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="bg-black/10 hover:bg-black/25 rounded-sm p-2 transition-colors shrink-0"
          >
            <X size={16} className="text-slate-800" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll bg-[#dce4dc]/60">
          {quickReplies && quickReplies.length > 0 && (
            <div className="px-4 sm:px-6 pt-4 flex flex-wrap gap-2">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={qr.onClick}
                  className="text-[9px] font-black uppercase tracking-widest bg-white border border-[#a0b0a0] rounded-sm px-3 py-1.5 text-slate-700 hover:bg-[#3a4a3a] hover:text-white transition-colors animate-fade-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  {qr.texto}
                </button>
              ))}
            </div>
          )}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>

        {footer && (
          <footer className="px-4 sm:px-6 py-3 border-t border-[#a0b0a0] bg-[#d3dcd3] flex flex-col-reverse sm:flex-row gap-2 sm:justify-end shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
