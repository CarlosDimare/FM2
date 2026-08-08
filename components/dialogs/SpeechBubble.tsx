import React from 'react';

interface SpeechBubbleProps {
  texto: string;
  subtitulo?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  texto, subtitulo,
}) => (
  <div className="relative bg-white border border-[#a0b0a0] rounded-sm px-4 py-3 shadow-sm max-w-[85%] animate-fade-up">
    <div className="absolute -left-[7px] top-4 w-3 h-3 bg-white border-l border-b border-[#a0b0a0] rotate-45" />
    <p className="text-[13px] leading-relaxed font-bold text-slate-900">{texto}</p>
    {subtitulo && (
      <p className="mt-2 text-[10px] font-bold text-slate-500 italic leading-snug">{subtitulo}</p>
    )}
  </div>
);
