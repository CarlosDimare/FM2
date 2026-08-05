import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'fm_arg_onboarded_v1';

export interface OnboardingStep {
  id: string;
  targetId?: string;
  viewRequired?: string;
  title: string;
  body: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a FM Argentina',
    body: 'Te convertiras en el director tecnico de un club argentino. Esta guia rapida te mostrara las funciones clave.',
    position: 'center'
  },
  {
    id: 'next_match',
    targetId: 'home-next-match',
    viewRequired: 'HOME',
    title: 'Proximo Encuentro',
    body: 'Aqui ves tu proximo partido. Inicia el encuentro con la barra espaciadora o clic en Jugar.',
    position: 'bottom'
  },
  {
    id: 'sidebar',
    targetId: 'main-sidebar',
    title: 'Menu Principal',
    body: 'El menu lateral da acceso a Plantel, Tacticas, Mercado, Calendario, Economia y Directiva.',
    position: 'right'
  },
  {
    id: 'header_actions',
    targetId: 'header-actions',
    title: 'Avanzar y guardar',
    body: 'Usa la barra espaciadora para avanzar al siguiente dia. Tambien puedes guardar y abrir el buzon aqui.',
    position: 'bottom'
  },
  {
    id: 'inbox',
    targetId: 'header-inbox',
    title: 'Buzon de noticias',
    body: 'Fichajes, lesiones, sanciones y ofertas de trabajo llegan a tu buzon.',
    position: 'bottom'
  },
  {
    id: 'chronicles',
    targetId: 'CHRONICLES',
    viewRequired: 'CHRONICLES',
    title: 'Crónicas',
    body: 'Aquí encontrarás crónicas de partidos, resumenes mensuales y la historia de tu carrera.',
    position: 'right'
  },
  {
    id: 'manager_profile',
    targetId: 'MANAGER_PROFILE',
    viewRequired: 'MANAGER_PROFILE',
    title: 'Mi Carrera',
    body: 'Consulta tu perfil personal, estadísticas de carrera y relaciones con la directiva, prensa y afición.',
    position: 'right'
  },
  {
    id: 'finish',
    title: 'Listo para empezar',
    body: 'Pulsa la barra espaciadora para avanzar al primer partido. Mucha suerte en tu carrera.',
    position: 'center'
  }
];

interface OnboardingTourProps {
  active: boolean;
  currentView: string;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ active, currentView, onComplete }) => {
  const steps = DEFAULT_STEPS;
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (active) setStepIdx(0);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const step = steps[stepIdx];
    if (!step) return;
    if (step.viewRequired && step.viewRequired !== currentView) return;
    if (!step.targetId) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(step.targetId);
    if (el) setTargetRect(el.getBoundingClientRect());
    else setTargetRect(null);
  }, [stepIdx, active, currentView, steps]);

  if (!active) return null;
  const step = steps[stepIdx];
  if (!step) return null;
  const total = steps.length;

  const handleNext = () => {
    if (stepIdx < total - 1) setStepIdx(stepIdx + 1);
    else finish();
  };
  const handlePrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };
  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { void e; }
    onComplete();
  };

  const isCenter = step.position === 'center' || !step.targetId;
  const tooltipStyle: React.CSSProperties = isCenter || !targetRect
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    : computeTooltipStyle(targetRect, step.position || 'bottom');

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
      {targetRect && (
        <div
          className="absolute border-4 border-yellow-300 rounded-md pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
          }}
        />
      )}
      <div
        className="absolute bg-slate-100 border-2 border-slate-700 rounded-md shadow-2xl p-4 w-[320px] pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Tutorial {stepIdx + 1}/{total}
           </span>
         </div>
          <button onClick={finish} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">
            <X size={16} />
         </button>
       </div>
        <h3 className="font-black text-slate-900 text-sm uppercase italic mb-2">{step.title}</h3>
        <p className="text-[11px] text-slate-700 leading-snug mb-3">{step.body}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={stepIdx === 0}
            className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
          >
            <ChevronLeft size={12} /> Atras
         </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={'w-1.5 h-1.5 rounded-full ' + (i === stepIdx ? 'bg-slate-700' : 'bg-slate-300')} />
            ))}
         </div>
          <button
            onClick={handleNext}
            className="text-[10px] font-bold uppercase flex items-center gap-1 bg-[#3a4a3a] text-white px-3 py-1 rounded-sm hover:bg-[#4a5a4a]"
          >
            {stepIdx === total - 1 ? 'Finalizar' : 'Siguiente'}
            <ChevronRight size={12} />
         </button>
       </div>
     </div>
   </div>
  );
};

function computeTooltipStyle(rect: DOMRect, pos: 'top' | 'bottom' | 'left' | 'right' | 'center'): React.CSSProperties {
  const TOOLTIP_W = 320;
  const TOOLTIP_H = 180;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  switch (pos) {
    case 'bottom':
      return {
        left: Math.max(8, Math.min(vw - TOOLTIP_W - 8, centerX - TOOLTIP_W / 2)),
        top: rect.bottom + margin
      };
    case 'top':
      return {
        left: Math.max(8, Math.min(vw - TOOLTIP_W - 8, centerX - TOOLTIP_W / 2)),
        top: Math.max(8, rect.top - TOOLTIP_H - margin)
      };
    case 'right':
      return {
        left: Math.min(vw - TOOLTIP_W - 8, rect.right + margin),
        top: Math.max(8, Math.min(vh - TOOLTIP_H - 8, centerY - TOOLTIP_H / 2))
      };
    case 'left':
      return {
        left: Math.max(8, rect.left - TOOLTIP_W - margin),
        top: Math.max(8, Math.min(vh - TOOLTIP_H - 8, centerY - TOOLTIP_H / 2))
      };
    default:
      return { left: centerX - TOOLTIP_W / 2, top: rect.bottom + margin };
  }
}

export function isOnboarded(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { void e; return false; }
}

export function resetOnboarding() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { void e; }
}