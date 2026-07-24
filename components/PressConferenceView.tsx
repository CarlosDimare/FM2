
import React, { useState } from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { notifyPlayers, notifyClubs } from '../stores/worldStore';
import { FMButton, FMBox } from './FMUI';
import { Mic, Newspaper, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface PressConferenceViewProps {
  club: Club;
  opponent: Club;
  context: 'PRE_MATCH' | 'POST_MATCH';
  homeScore?: number;
  awayScore?: number;
  onFinish: () => void;
}

interface PressQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    moraleEffect: number;
    confidenceEffect: number;
    reaction: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  }[];
}

const PRE_MATCH_QUESTIONS: PressQuestion[] = [
  {
    id: 'q1',
    question: '¿Cómo ves a tu equipo para este partido?',
    options: [
      { text: "Confío plenamente en mis jugadores. Vamos a por la victoria.", moraleEffect: 5, confidenceEffect: 3, reaction: 'POSITIVE' },
      { text: "Será un partido difícil, pero daremos lo mejor.", moraleEffect: 2, confidenceEffect: 1, reaction: 'NEUTRAL' },
      { text: "El rival es muy superior. Intentaremos aguantar.", moraleEffect: -3, confidenceEffect: -5, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'q2',
    question: 'Se rumorea que podrías hacer cambios en el once titular...',
    options: [
      { text: "Mantengo el bloque. Confío en los que vienen rindiendo.", moraleEffect: 3, confidenceEffect: 2, reaction: 'POSITIVE' },
      { text: "Evaluaré durante el calentamiento. Todo puede pasar.", moraleEffect: 0, confidenceEffect: 0, reaction: 'NEUTRAL' },
      { text: "Hay jugadores que no están al nivel. Haré cambios.", moraleEffect: -5, confidenceEffect: -2, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'q3',
    question: `${'¿Qué objetivos tiene el club esta temporada?'}`,
    options: [
      { text: "Vamos a pelear por el título. Para eso estamos aquí.", moraleEffect: 5, confidenceEffect: 5, reaction: 'POSITIVE' },
      { text: "Partido a partido. Sin obsesionarnos con el objetivo final.", moraleEffect: 1, confidenceEffect: 2, reaction: 'NEUTRAL' },
      { text: "La permanencia es lo prioritario. Iremos paso a paso.", moraleEffect: -2, confidenceEffect: -3, reaction: 'NEGATIVE' },
    ],
  },
];

const POST_MATCH_QUESTIONS: PressQuestion[] = [
  {
    id: 'pq1',
    question: 'Valoración del partido...',
    options: [
      { text: "Estoy orgulloso del equipo. Hicimos un gran partido.", moraleEffect: 5, confidenceEffect: 5, reaction: 'POSITIVE' },
      { text: "Tuvimos altibajos. Hay cosas que mejorar.", moraleEffect: 0, confidenceEffect: 0, reaction: 'NEUTRAL' },
      { text: "Fue inaceptable. No podemos repetir esto.", moraleEffect: -5, confidenceEffect: -8, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'pq2',
    question: '¿Algún mensaje para la afición?',
    options: [
      { text: "Gracias por el apoyo. Vamos a darles muchas alegrías.", moraleEffect: 3, confidenceEffect: 3, reaction: 'POSITIVE' },
      { text: "Seguimos trabajando. El equipo necesita su apoyo.", moraleEffect: 1, confidenceEffect: 1, reaction: 'NEUTRAL' },
      { text: "Entiendo su frustración. Nosotros también estamos dolidos.", moraleEffect: -2, confidenceEffect: -2, reaction: 'NEGATIVE' },
    ],
  },
];

export const PressConferenceView: React.FC<PressConferenceViewProps> = ({ club, opponent, context, homeScore, awayScore, onFinish }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const questions = context === 'PRE_MATCH' ? PRE_MATCH_QUESTIONS : POST_MATCH_QUESTIONS;

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      applyEffects(newAnswers);
      setFinished(true);
    }
  };

  const applyEffects = (selected: number[]) => {
    let totalMorale = 0;
    let totalConfidence = 0;

    questions.forEach((q, i) => {
      const opt = q.options[selected[i]];
      if (opt) {
        totalMorale += opt.moraleEffect;
        totalConfidence += opt.confidenceEffect;
      }
    });

    const squad = world.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
    squad.forEach(p => {
      p.morale = Math.max(1, Math.min(100, p.morale + totalMorale));
    });

    club.boardConfidence = Math.max(1, Math.min(100, club.boardConfidence + totalConfidence));
    notifyPlayers(); notifyClubs();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] text-white overflow-hidden">
      <header className="bg-gradient-to-b from-slate-800 to-slate-900 p-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <Newspaper size={24} className="text-yellow-400" />
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {context === 'PRE_MATCH' ? 'Conferencia de Prensa' : 'Rueda de Prensa Post-Partido'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold">
              {context === 'PRE_MATCH' ? `Previa vs ${opponent.name}` : `${club.shortName} ${homeScore ?? '?'} - ${awayScore ?? '?'} ${opponent.shortName}`}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!finished ? (
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 mb-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Mic size={14} /> Pregunta {currentQ + 1} de {questions.length}
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded-sm p-4 mb-6 shadow-lg">
              <p className="text-sm font-bold italic text-yellow-300">"{questions[currentQ].question}"</p>
            </div>
            <div className="space-y-2">
              {questions[currentQ].options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-sm transition-all active:scale-[0.99] text-sm flex items-start gap-3">
                  {opt.reaction === 'POSITIVE' ? <ThumbsUp size={16} className="text-green-400 mt-0.5 shrink-0" /> :
                   opt.reaction === 'NEGATIVE' ? <ThumbsDown size={16} className="text-red-400 mt-0.5 shrink-0" /> :
                   <Minus size={16} className="text-slate-400 mt-0.5 shrink-0" />}
                  <span className="text-slate-200">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-up">
            <Newspaper size={48} className="text-yellow-400 mb-4" />
            <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Conferencia Finalizada</h3>
            <p className="text-sm text-slate-400 mb-2">Los periodistas se retiran.</p>
            <p className="text-[10px] text-slate-500 font-bold mb-6">
              La moral del equipo y la confianza del board se han visto afectadas por tus respuestas.
            </p>
            <FMButton onClick={onFinish} className="px-8 py-3">
              {context === 'PRE_MATCH' ? '¡Al Partido!' : 'Continuar'}
            </FMButton>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 border-t border-slate-700 p-3 text-center text-[8px] text-slate-600 font-bold uppercase shrink-0">
        Tus respuestas afectan la moral del equipo y la confianza de la directiva.
      </footer>
    </div>
  );
};
