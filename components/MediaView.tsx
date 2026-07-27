import React, { useState } from 'react';
import { MediaNews } from '../types';
import { world } from '../services/worldManager';
import { FMButton } from './FMUI';
import { Newspaper, ArrowLeft, Filter, Clock, Globe, Trophy, AlertTriangle, Star, Info } from 'lucide-react';

interface MediaViewProps {
  onBack: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HEADLINE: <Star size={14} className="text-yellow-400" />,
  FEATURE: <Info size={14} className="text-blue-400" />,
  RUMOR: <Clock size={14} className="text-purple-400" />,
  CRITICISM: <AlertTriangle size={14} className="text-red-400" />,
  PRAISE: <Trophy size={14} className="text-green-400" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  MATCH: 'Partido',
  TRANSFER: 'Traspaso',
  INJURY: 'Lesión',
  BOARD: 'Directiva',
  GENERAL: 'General',
};

const TYPE_LABELS: Record<string, string> = {
  HEADLINE: 'Titular',
  FEATURE: 'Reportaje',
  RUMOR: 'Rumor',
  CRITICISM: 'Crítica',
  PRASE: 'Elogio',
};

export const MediaView: React.FC<MediaViewProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedNews, setSelectedNews] = useState<MediaNews | null>(null);

  const allNews = world.getAllNews();
  const filtered = filter === 'ALL' ? allNews : allNews.filter(n => n.category === filter);
  const userNews = world.getUserClubNews();

  const categories = ['ALL', 'MATCH', 'TRANSFER', 'INJURY', 'BOARD', 'GENERAL'];

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white overflow-hidden">
      <header className="bg-gradient-to-b from-slate-900 to-slate-800 p-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Newspaper size={24} className="text-red-500" />
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter">Prensa y Medios</h2>
            <p className="text-[10px] text-slate-400 font-bold">Portadas, titulares y noticias del mundo del fútbol</p>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all ${
                filter === cat
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
              }`}>
              {cat === 'ALL' ? 'Todas' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {selectedNews ? (
          <div className="p-4 animate-fade-up">
            <button onClick={() => setSelectedNews(null)} className="text-slate-400 hover:text-white text-xs mb-4 flex items-center gap-1">
              <ArrowLeft size={14} /> Volver a la portada
            </button>
            <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-900 to-slate-900 p-4 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  {TYPE_ICONS[selectedNews.type]}
                  <span className="text-[10px] font-bold uppercase text-red-400">{TYPE_LABELS[selectedNews.type]}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-500">|</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{CATEGORY_LABELS[selectedNews.category]}</span>
                </div>
                <h3 className="text-xl font-black uppercase leading-tight">{selectedNews.headline}</h3>
                <p className="text-sm text-slate-300 mt-1 italic">{selectedNews.subheadline}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{selectedNews.body}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                  <Clock size={12} /> {selectedNews.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {selectedNews.clubId && <span className="ml-2">Club: {world.getClub(selectedNews.clubId)?.name}</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {filtered.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Newspaper size={40} className="mx-auto mb-3 text-slate-600" />
                <p className="text-sm font-bold">No hay noticias aún</p>
                <p className="text-xs text-slate-600 mt-1">Juega partidos y ocurren eventos para generar titulares</p>
              </div>
            )}
            {filtered.map(news => (
              <button key={news.id} onClick={() => setSelectedNews(news)}
                className={`w-full text-left p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-sm transition-all animate-fade-up ${
                  news.isUserClubNews ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-600'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{TYPE_ICONS[news.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase text-slate-500">{CATEGORY_LABELS[news.category]}</span>
                      {news.isUserClubNews && <span className="text-[9px] font-bold uppercase text-red-400">Tu club</span>}
                    </div>
                    <h4 className="text-sm font-bold uppercase leading-tight text-slate-200">{news.headline}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{news.subheadline}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-slate-900 border-t border-slate-700 p-3 text-center text-[8px] text-slate-600 font-bold uppercase shrink-0">
        Portada de medios — Titulares de tu club y del mundo del fútbol
      </footer>
    </div>
  );
};