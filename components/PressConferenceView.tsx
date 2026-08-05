
import React, { useState, useMemo } from 'react';
import { Club, Player } from '../types';
import { world } from '../services/worldManager';
import { notifyPlayers, notifyClubs } from '../stores/worldStore';
import { FMButton, FMBox } from './FMUI';
import { Mic, Newspaper, ThumbsUp, ThumbsDown, Minus, Star, AlertTriangle, Target } from 'lucide-react';

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
    question: '¿Qué objetivos tiene el club esta temporada?',
    options: [
      { text: "Vamos a pelear por el título. Para eso estamos aquí.", moraleEffect: 5, confidenceEffect: 5, reaction: 'POSITIVE' },
      { text: "Partido a partido. Sin obsesionarnos con el objetivo final.", moraleEffect: 1, confidenceEffect: 2, reaction: 'NEUTRAL' },
      { text: "La permanencia es lo prioritario. Iremos paso a paso.", moraleEffect: -2, confidenceEffect: -3, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'q4',
    question: '¿Cómo valoras la preparación física del equipo?',
    options: [
      { text: "Estamos en óptimas condiciones. El trabajo en preseason fue excelente.", moraleEffect: 4, confidenceEffect: 3, reaction: 'POSITIVE' },
      { text: "Hay algo de fatiga acumulada, pero estamos listos.", moraleEffect: 1, confidenceEffect: 1, reaction: 'NEUTRAL' },
      { text: "Algunos jugadores llegan con cargas. Será un factor.", moraleEffect: -2, confidenceEffect: -3, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'q5',
    question: 'El rival ha fichado refuerzos importantes. ¿Te preocupa?',
    options: [
      { text: "No me preocupan los fichajes ajenos. Confío en mi plantilla.", moraleEffect: 3, confidenceEffect: 2, reaction: 'POSITIVE' },
      { text: "Son equipos más potentes, pero el fútbol se juega en el campo.", moraleEffect: 1, confidenceEffect: 1, reaction: 'NEUTRAL' },
      { text: "La diferencia de presupuesto se nota. Será complicado.", moraleEffect: -4, confidenceEffect: -4, reaction: 'NEGATIVE' },
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
  {
    id: 'pq3',
    question: '¿Qué pasó con la defensa hoy?',
    options: [
      { text: "La defensa estuvo sólida. Los goles fueron por errores puntuales.", moraleEffect: 2, confidenceEffect: 2, reaction: 'POSITIVE' },
      { text: "Hay que trabajar más en la colocación. Los goles fueron evitables.", moraleEffect: -1, confidenceEffect: -1, reaction: 'NEUTRAL' },
      { text: "Fue un desastre defensivo. Necesitamos cambios urgentes.", moraleEffect: -6, confidenceEffect: -5, reaction: 'NEGATIVE' },
    ],
  },
  {
    id: 'pq4',
    question: '¿Cómo afecta este resultado a los objetivos de la temporada?',
    options: [
      { text: "Es un golpe, pero tenemos tiempo para reaccionar.", moraleEffect: 2, confidenceEffect: 1, reaction: 'POSITIVE' },
      { text: "No cambia nada. Seguimos con nuestro plan.", moraleEffect: 1, confidenceEffect: 0, reaction: 'NEUTRAL' },
      { text: "Es un revés severo. Tendremos que replantearnos metas.", moraleEffect: -4, confidenceEffect: -6, reaction: 'NEGATIVE' },
    ],
  },
];

const DERBY_QUESTIONS: PressQuestion[] = [
  {
    id: 'd1',
    question: '¿Cómo está el ambiente para el clásico?',
    options: [
      { text: "La afición está encendida. Vamos a darles la alegría.", moraleEffect: 6, confidenceEffect: 4, reaction: 'POSITIVE' },
      { text: "Es otro partido. No nos dejamos llevar por la euforia.", moraleEffect: 2, confidenceEffect: 2, reaction: 'NEUTRAL' },
      { text: "La presión es enorme. Espero que no nos pese.", moraleEffect: -3, confidenceEffect: -3, reaction: 'NEGATIVE' },
    ],
  },
];

export const PressConferenceView: React.FC<PressConferenceViewProps> = ({ club, opponent, context, homeScore, awayScore, onFinish }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  // Check if it's a derby
  const isDerby = useMemo(() => {
    return club.country === opponent.country;
  }, [club, opponent]);

  // Get star player question if available
  const starPlayerQuestion = useMemo(() => {
    if (context === 'POST_MATCH') return null;
    const topScorer = world.players
      .filter(p => p.clubId === club.id && p.seasonStats.goals > 0)
      .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];
    
    if (topScorer && topScorer.seasonStats.goals >= 5) {
      return {
        id: 'star1',
        question: `${topScorer.name} lleva ${topScorer.seasonStats.goals} goles esta temporada. ¿Es el jugador clave del equipo?`,
        options: [
          { text: `Sin duda. ${topScorer.name} es fundamental para nuestro juego.`, moraleEffect: 4, confidenceEffect: 2, reaction: 'POSITIVE' as const },
          { text: "Todos los jugadores son importantes. No dependemos de uno solo.", moraleEffect: 1, confidenceEffect: 1, reaction: 'NEUTRAL' as const },
          { text: "El equipo está por encima de cualquier individualidad.", moraleEffect: 0, confidenceEffect: 0, reaction: 'NEUTRAL' as const },
        ],
      };
    }
    return null;
  }, [club, context]);

  // Build question pool based on context
  const questions = useMemo(() => {
    let pool = context === 'PRE_MATCH' ? [...PRE_MATCH_QUESTIONS] : [...POST_MATCH_QUESTIONS];
    
    // Add derby question if applicable
    if (isDerby && context === 'PRE_MATCH') {
      pool = [...DERBY_QUESTIONS, ...pool];
    }
    
    // Add star player question if available
    if (starPlayerQuestion) {
      pool.splice(1, 0, starPlayerQuestion);
    }
    
    return pool;
  }, [context, isDerby, starPlayerQuestion]);

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
    <div className="flex flex-col h-full bg-[#d4dcd4] overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <header className="bg-gradient-to-b from-[#e2e8f0] to-[#c8d2c8] p-4 border-b border-[#a0b0a0] shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#3a4a3a] rounded-sm p-1.5">
            <Newspaper size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
              {context === 'PRE_MATCH' ? 'Conferencia de Prensa' : 'Rueda de Prensa Post-Partido'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold">
              {context === 'PRE_MATCH' ? `Previa vs ${opponent.name}` : `${club.shortName} ${homeScore ?? '?'} - ${awayScore ?? '?'} ${opponent.shortName}`}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {club.pressDelegatedTo && !finished && (() => {
          const delegate = world.getStaffByClub(club.id).find(s => s.id === club.pressDelegatedTo);
          return (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-400 rounded-sm flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-green-900 flex items-center gap-2">
                  <Mic size={12} /> Delegada a: {delegate?.name || 'Staff'}
                </p>
                <p className="text-[9px] text-green-800 mt-0.5">Este empleado se encarga de la conferencia de prensa. Puedes dejar que responda en tu lugar.</p>
              </div>
              <button onClick={() => {
                const neutral = questions.map(q => Math.max(0, q.options.findIndex(o => o.reaction === 'NEUTRAL')));
                applyEffects(neutral);
                setFinished(true);
              }} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-sm text-[9px] font-black uppercase tracking-widest transition-colors">
                Que la maneje
              </button>
            </div>
          );
        })()}
        {!finished ? (
          <div>
            <div className="flex items-center gap-2 mb-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Mic size={14} /> Pregunta {currentQ + 1} de {questions.length}
            </div>
            <div className="bg-white border border-[#a0b0a0] rounded-sm p-4 mb-6">
              <p className="text-sm font-bold italic text-[#3a4a3a]">"{questions[currentQ].question}"</p>
            </div>
            <div className="space-y-2">
              {questions[currentQ].options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  className="w-full text-left p-3 bg-white hover:bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm transition-all active:scale-[0.99] text-sm flex items-start gap-3">
                  {opt.reaction === 'POSITIVE' ? <ThumbsUp size={16} className="text-green-600 mt-0.5 shrink-0" /> :
                   opt.reaction === 'NEGATIVE' ? <ThumbsDown size={16} className="text-red-600 mt-0.5 shrink-0" /> :
                   <Minus size={16} className="text-slate-400 mt-0.5 shrink-0" />}
                  <span className="text-slate-700">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-[#3a4a3a] rounded-sm p-3 mb-4">
              <Newspaper size={36} className="text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">Conferencia Finalizada</h3>
            <p className="text-sm text-slate-600 mb-2">Los periodistas se retiran.</p>
            <p className="text-[10px] text-slate-500 font-bold mb-6">
              La moral del equipo y la confianza del board se han visto afectadas por tus respuestas.
            </p>
            <FMButton onClick={onFinish} className="px-8 py-3">
              {context === 'PRE_MATCH' ? '¡Al Partido!' : 'Continuar'}
            </FMButton>
          </div>
        )}
      </div>

      <footer className="bg-[#bcc8bc] border-t border-[#a0b0a0] p-3 text-center text-[8px] text-slate-600 font-bold uppercase shrink-0">
        Tus respuestas afectan la moral del equipo y la confianza de la directiva.
      </footer>
    </div>
  );
};
