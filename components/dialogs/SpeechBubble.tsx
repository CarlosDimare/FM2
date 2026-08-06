import React from 'react';

interface SpeechBubbleProps {
  texto: string;
  subtitulo?: string;
  iniciales?: string;
  clubColor?: string;
}

/**
 * Burbuja de diálogo del personaje con "colita" apuntando al avatar (spec §5.2).
 */
export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  texto, subtitulo, iniciales, clubColor = 'bg-[#3a4a3a]',
}) => (
  <div className="flex items-start gap-3 animate-fade-up">
    {iniciales && (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[10px] uppercase italic shrink-0 shadow-md border-2 border-white ${clubColor}`}>
        {iniciales}
      </div>
    )}
    <div className="relative bg-white border border-[#a0b0a0] rounded-sm px-4 py-3 shadow-sm max-w-[85%]">
      {/* Colita */}
      <div className="absolute -left-[7px] top-4 w-3 h-3 bg-white border-l border-b border-[#a0b0a0] rotate-45" />
      <p className="text-[13px] leading-relaxed font-bold text-slate-900">{texto}</p>
      {subtitulo && (
        <p className="mt-2 text-[10px] font-bold text-slate-500 italic leading-snug">{subtitulo}</p>
      )}
    </div>
  </div>
);
