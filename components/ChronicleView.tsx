import React, { useState } from 'react';
import { Chronicle, ChronicleType } from '../types';
import { world } from '../services/worldManager';
import { FMButton } from './FMUI';
import { BookOpen, ArrowLeft, Filter, Calendar, Trophy, Star, Clock, FileText } from 'lucide-react';

interface ChronicleViewProps {
  onBack: () => void;
  clubId?: string;
}

const TYPE_ICONS: Record<ChronicleType, React.ReactNode> = {
  MATCH: <FileText size={14} className="text-blue-400" />,
  MONTHLY: <Calendar size={14} className="text-green-600" />,
  CAREER: <Trophy size={14} className="text-amber-600" />,
};

const TYPE_LABELS: Record<ChronicleType, string> = {
  MATCH: 'Partido',
  MONTHLY: 'Mensual',
  CAREER: 'Carrera',
};

export const ChronicleView: React.FC<ChronicleViewProps> = ({ onBack, clubId }) => {
  const [filter, setFilter] = useState<ChronicleType | 'ALL'>('ALL');
  const [selectedChronicle, setSelectedChronicle] = useState<Chronicle | null>(null);

  const userClub = clubId ? world.getClub(clubId) : undefined;
  const normalizeCountry = (country: string) => country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const controlledNationalTeamId = world.nationalTeamManager?.controlledTeamId;
  const clubNationalTeamId = userClub
    ? world.nationalTeamManager?.nationalTeams?.find((team: any) => normalizeCountry(team.country) === normalizeCountry(userClub.country))?.id
    : undefined;
  const visibleNationalTeamIds = new Set([controlledNationalTeamId, clubNationalTeamId].filter(Boolean));
  const allChronicles = world.chronicles.filter(c =>
    c.clubId === clubId || (c.nationalTeamId && visibleNationalTeamIds.has(c.nationalTeamId))
  );
  const filtered = filter === 'ALL' ? allChronicles : allChronicles.filter(c => c.type === filter);

  const getNationalTeamName = (teamId?: string) =>
    teamId
      ? world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === teamId)?.name || teamId
      : undefined;

  const sortedChronicles = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <header className="bg-gradient-to-b from-[#e2e8f0] to-[#c8d2c8] p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/25 rounded-sm p-1.5">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white/90 uppercase tracking-wider italic">Crónicas</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-[0.3em]">Historia de tu carrera</p>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'MATCH', 'MONTHLY', 'CAREER'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setFilter(type); setSelectedChronicle(null); }}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === type
                  ? 'bg-white/25 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-[#a0b0a0]'
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
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Volver a la lista
            </button>

            <div className="bg-white/10 rounded-sm border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                {TYPE_ICONS[selectedChronicle.type]}
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {TYPE_LABELS[selectedChronicle.type]}
                </span>
                {selectedChronicle.nationalTeamId && (
                  <span className="text-[9px] font-black uppercase text-purple-600 border border-purple-200 bg-purple-50 px-1.5 py-0.5 rounded-sm">
                    Selección · {getNationalTeamName(selectedChronicle.nationalTeamId)}
                  </span>
                )}
                <span className="text-[10px] text-white/40 ml-auto">
                  {selectedChronicle.date.toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-lg font-black uppercase tracking-wider text-white/90 mb-4 italic">
                {selectedChronicle.title}
              </h2>

              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {selectedChronicle.body}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {sortedChronicles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-sm">Aún no hay crónicas disponibles.</p>
                <p className="text-white/50 text-[10px] mt-2">Juega partidos para generar crónicas automáticas.</p>
              </div>
            ) : (
              sortedChronicles.map(chronicle => (
                <button
                  key={chronicle.id}
                  onClick={() => setSelectedChronicle(chronicle)}
                  className="w-full text-left bg-white/10 hover:bg-white/5 border border-white/10 hover:border-[#3a4a3a] rounded-sm p-4 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {TYPE_ICONS[chronicle.type]}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                      {TYPE_LABELS[chronicle.type]}
                    </span>
                    {chronicle.nationalTeamId && (
                      <span className="text-[8px] font-black uppercase text-purple-600 border border-purple-200 bg-purple-50 px-1.5 py-0.5 rounded-sm">
                        Selección · {getNationalTeamName(chronicle.nationalTeamId)}
                      </span>
                    )}
                    <span className="text-[9px] text-white/40 ml-auto">
                      {chronicle.date.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/90 group-hover:text-[#3a4a3a] transition-colors italic truncate">
                    {chronicle.title}
                  </h3>
                  <p className="text-[10px] text-white/60 mt-1 line-clamp-2">
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
