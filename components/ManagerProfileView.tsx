import React from 'react';
import { ManagerProfile, RelationshipState } from '../types';
import { world } from '../services/worldManager';
import { FMButton } from './FMUI';
import { User, Calendar, Flag, Briefcase, Trophy, Users, TrendingUp, TrendingDown, ArrowLeft, Star, Target } from 'lucide-react';

interface ManagerProfileViewProps {
  onBack: () => void;
}

const ORIGIN_LABELS: Record<string, string> = {
  EX_PLAYER: 'Exjugador',
  YOUTH_COACH: 'Categorías inferiores',
  JOURNALIST: 'Periodista / Analista',
};

const RELATIONSHIP_ICONS: Record<RelationshipState, { icon: string; color: string }> = {
  ANGRY: { icon: '😤', color: 'text-red-500' },
  WORRIED: { icon: '😟', color: 'text-orange-500' },
  CALM: { icon: '😌', color: 'text-blue-500' },
  HAPPY: { icon: '😄', color: 'text-green-500' },
};

const getWinRate = (p: ManagerProfile) => {
  if (p.totalGames === 0) return 0;
  return ((p.totalWins / p.totalGames) * 100).toFixed(1);
};

export const ManagerProfileView: React.FC<ManagerProfileViewProps> = ({ onBack }) => {
  const profile = world.managerProfile;
  if (!profile) return (
    <div className="flex flex-col h-full bg-[#d4dcd4] items-center justify-center" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <p className="text-slate-600">No hay perfil de entrenador disponible.</p>
      <FMButton onClick={onBack} className="mt-4">Volver</FMButton>
    </div>
  );

  const p = profile;
  const boardState = RELATIONSHIP_ICONS[p.boardRelationship];
  const pressState = RELATIONSHIP_ICONS[p.pressRelationship];
  const fansState = RELATIONSHIP_ICONS[p.fansRelationship];

  const yearsOld = Math.floor((Date.now() - p.birthDate.getTime()) / 31557600000);

  return (
    <div className="flex flex-col h-full bg-[#d4dcd4] overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <header className="bg-gradient-to-b from-[#e2e8f0] to-[#c8d2c8] p-4 border-b border-[#a0b0a0] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-[#3a4a3a] border-2 border-[#a0b0a0] flex items-center justify-center text-2xl">
            {p.origin === 'EX_PLAYER' ? '⚽' : p.origin === 'YOUTH_COACH' ? '📋' : '🎙️'}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider italic">{p.fullName}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">{ORIGIN_LABELS[p.origin]}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-700"><Flag size={12} className="inline mr-1" />{p.nationality}</span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-xs text-slate-700">{yearsOld} años</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-sm border border-[#a0b0a0] p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{p.totalGames}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Partidos</p>
          </div>
          <div className="bg-white rounded-sm border border-[#a0b0a0] p-3 text-center">
            <p className="text-2xl font-black text-green-600">{getWinRate(p)}%</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Victorias</p>
          </div>
          <div className="bg-white rounded-sm border border-[#a0b0a0] p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{p.youthDebuts}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Canteranos</p>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-[#a0b0a0] p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#3a4a3a] mb-3 flex items-center gap-2">
            <Briefcase size={14} /> Datos de carrera
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Club actual</span>
              <span className="font-bold text-slate-900">{p.currentClubName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Temporada en el club</span>
              <span className="font-bold text-slate-900">{p.seasonInClub}ª</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Balance</span>
              <span className="font-bold"><span className="text-green-600">{p.totalWins}</span> V · <span className="text-slate-600">{p.totalDraws}</span> E · <span className="text-red-600">{p.totalLosses}</span> D</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Goles</span>
              <span className="font-bold text-slate-900">{p.goalsFor} GF · {p.goalsAgainst} GC</span>
            </div>
            {p.mostUsedPlayer !== 'Ninguno' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Jugador clave</span>
                <span className="font-bold text-slate-900">{p.mostUsedPlayer}</span>
              </div>
            )}
            {p.biggestSale && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mayor venta</span>
                <span className="font-bold text-slate-900">{p.biggestSale.player} (${(p.biggestSale.amount / 1000000).toFixed(1)}M)</span>
              </div>
            )}
          </div>
        </div>

        {p.titles.length > 0 && (
          <div className="bg-white rounded-sm border border-[#a0b0a0] p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
              <Trophy size={14} /> Títulos ({p.titles.length})
            </h3>
            <div className="space-y-1">
              {p.titles.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <Star size={12} className="text-amber-500 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-sm border border-[#a0b0a0] p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Target size={14} /> Relaciones
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Directiva</span>
              <span className={`${boardState.color} font-bold`}>{boardState.icon} {p.boardRelationship === 'HAPPY' ? 'Confianza total' : p.boardRelationship === 'CALM' ? 'Tranquila' : p.boardRelationship === 'WORRIED' ? 'Preocupada' : 'Enfadada'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Prensa</span>
              <span className={`${pressState.color} font-bold`}>{pressState.icon} {p.pressRelationship === 'HAPPY' ? 'Favorable' : p.pressRelationship === 'CALM' ? 'Neutral' : p.pressRelationship === 'WORRIED' ? 'Crítica' : 'Hostil'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Afición</span>
              <span className={`${fansState.color} font-bold`}>{fansState.icon} {p.fansRelationship === 'HAPPY' ? 'Ídolo' : p.fansRelationship === 'CALM' ? 'Neutral' : p.fansRelationship === 'WORRIED' ? 'Descontenta' : 'Enfadada'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-[#a0b0a0] p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
            <Target size={14} /> Objetivo actual
          </h3>
          <p className="text-xs text-slate-800 font-bold">{p.currentObjective}</p>
        </div>

        {p.clubHistory.length > 0 && (
          <div className="bg-white rounded-sm border border-[#a0b0a0] p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Briefcase size={14} /> Historial de clubes
            </h3>
            <div className="space-y-2">
              {p.clubHistory.map((entry, i) => {
                const prevClub = world.getClub(entry.clubId);
                return (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[#e0e8e0] pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${prevClub?.primaryColor || 'bg-slate-500'} border border-[#a0b0a0]`}></div>
                      <span className="font-bold text-slate-900">{entry.clubName}</span>
                    </div>
                    <span className="text-slate-500">
                      {new Date(entry.startDate).getFullYear()}{entry.endDate ? ` - ${new Date(entry.endDate).getFullYear()}` : ' - Presente'}
                      <span className="ml-2 text-slate-400">({entry.seasons} temp.)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
