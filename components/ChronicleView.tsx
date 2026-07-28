import React, { useState } from 'react';
import { Chronicle, ChronicleType } from '../types';
import { world } from '../services/worldManager';
import { FMButton } from './FMUI';
import { BookOpen, ArrowLeft, Filter, Calendar, Trophy, Star, Clock, FileText } from 'lucide-react';

interface ChronicleViewProps {
  onBack: () => void;
  clubId: string;
}

const TYPE_ICONS: Record<ChronicleType, React.ReactNode> = {
  MATCH: <FileText size={14} className="text-blue-400" />,
  MONTHLY: <Calendar size={14} className="text-green-400" />,
  CAREER: <Trophy size={14} className="text-yellow-400" />,
};

const TYPE_LABELS: Record<ChronicleType, string> = {
  MATCH: 'Partido',
  MONTHLY: 'Mensual',
  CAREER: 'Carrera',
};

export const ChronicleView: React.FC<ChronicleViewProps> = ({ onBack, clubId }) => {
  const [filter, setFilter] = useState<ChronicleType | 'ALL'>('ALL');
  const [selectedChronicle, setSelectedChronicle] = useState<Chronicle | null>(null);

  const allChronicles = world.chronicles.filter(c => c.clubId === clubId);
  const filtered = filter === 'ALL' ? allChronicles : allChronicles.filter(c => c.type === filter);

  const sortedChronicles = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white overflow-hidden">
      <header className="bg-gradient-to-b from-slate-900 to-slate-800 p-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen size={24} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider italic">Crónicas</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">Historia de tu carrera</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'MATCH', 'MONTHLY', 'CAREER'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setFilter(type); setSelectedChronicle(null); }}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === type
                  ? 'bg-white text-slate-950'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {type === 'ALL' ? 'Todas' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedChronicle ? (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedChronicle(null)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Volver a la lista
            </button>

            <div className="bg-slate-800/50 rounded-sm border border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                {TYPE_ICONS[selectedChronicle.type]}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {TYPE_LABELS[selectedChronicle.type]}
                </span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {selectedChronicle.date.toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-lg font-black uppercase tracking-wider text-white mb-4 italic">
                {selectedChronicle.title}
              </h2>

              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedChronicle.body}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {sortedChronicles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Aún no hay crónicas disponibles.</p>
                <p className="text-slate-500 text-[10px] mt-2">Juega partidos para generar crónicas automáticas.</p>
              </div>
            ) : (
              sortedChronicles.map(chronicle => (
                <button
                  key={chronicle.id}
                  onClick={() => setSelectedChronicle(chronicle)}
                  className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-sm p-4 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {TYPE_ICONS[chronicle.type]}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {TYPE_LABELS[chronicle.type]}
                    </span>
                    <span className="text-[9px] text-slate-500 ml-auto">
                      {chronicle.date.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors italic truncate">
                    {chronicle.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {chronicle.body}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
