import React, { useState } from 'react';
import { MediaNews } from '../types';
import { world } from '../services/worldManager';
import { Newspaper, ArrowLeft, Clock, Globe, Trophy, AlertTriangle, Star, Info } from 'lucide-react';

interface MediaViewProps {
  onBack: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HEADLINE: <Star size={14} className="text-amber-600" />,
  FEATURE: <Info size={14} className="text-blue-600" />,
  RUMOR: <Clock size={14} className="text-purple-600" />,
  CRITICISM: <AlertTriangle size={14} className="text-red-600" />,
  PRAISE: <Trophy size={14} className="text-green-600" />,
};

const TYPE_LABELS: Record<string, string> = {
  HEADLINE: 'Titular',
  FEATURE: 'Reportaje',
  RUMOR: 'Rumor',
  CRITICISM: 'Crítica',
  PRAISE: 'Elogio',
};

const SECTION_LABELS: Record<string, string> = {
  MERCADO: 'Mercado',
  CLASIFICACION: 'Clasificación',
  DESPIDOS: 'Despidos',
  RESULTADOS: 'Resultados',
  LESIONES: 'Lesiones',
  INTERNACIONAL: 'Internacional',
  TU_CLUB: 'Tu club',
};

const TABS: { id: string; label: string }[] = [
  { id: 'PORTADA', label: 'Portada' },
  { id: 'TU_CLUB', label: 'Tu club' },
  { id: 'MERCADO', label: 'Mercado' },
  { id: 'CLASIFICACION', label: 'Clasificación' },
  { id: 'DESPIDOS', label: 'Despidos' },
  { id: 'RESULTADOS', label: 'Resultados' },
  { id: 'LESIONES', label: 'Lesiones' },
  { id: 'INTERNACIONAL', label: 'Internacional' },
];

export const MediaView: React.FC<MediaViewProps> = ({ onBack }) => {
  const [tab, setTab] = useState<string>('PORTADA');
  const [selectedNews, setSelectedNews] = useState<MediaNews | null>(null);
  const [, setTick] = useState(0);

  const allNews = world.getAllNews();

  const visible = (() => {
    if (tab === 'PORTADA') {
      // Portada: destacadas primero, luego por fecha
      return [...allNews]
        .sort((a, b) => ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) || (b.date.getTime() - a.date.getTime()))
        .slice(0, 15);
    }
    if (tab === 'TU_CLUB') return allNews.filter(n => n.section === 'TU_CLUB' || n.isUserClubNews).slice(0, 20);
    return allNews.filter(n => n.section === tab).slice(0, 20);
  })();

  const openNews = (news: MediaNews) => {
    if (!news.read) news.read = true;
    setSelectedNews(news);
  };

  const markAllRead = () => {
    world.mediaNews.forEach(n => { if (!n.read) n.read = true; });
    setTick(t => t + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#d4dcd4] overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <header className="bg-gradient-to-b from-[#e2e8f0] to-[#c8d2c8] p-4 border-b border-[#a0b0a0] shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-[#3a4a3a] rounded-sm p-1.5">
            <Newspaper size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Diario Deportivo</h2>
            <p className="text-[10px] text-slate-500 font-bold">Portadas, titulares y noticias del mundo del fútbol</p>
          </div>
          <button onClick={markAllRead}
            className="px-2 py-1 text-[9px] font-bold uppercase rounded-sm border border-[#a0b0a0] bg-white/70 text-slate-600 hover:bg-white transition-all">
            Marcar leído
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all ${
                tab === t.id
                  ? 'bg-[#3a4a3a] border-[#3a4a3a] text-white'
                  : 'bg-[#bcc8bc] border-[#a0b0a0] text-slate-700 hover:bg-[#a0b0a0]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {selectedNews ? (
          <div className="p-4">
            <button onClick={() => setSelectedNews(null)} className="text-slate-600 hover:text-slate-900 text-xs mb-4 flex items-center gap-1">
              <ArrowLeft size={14} /> Volver a la portada
            </button>
            <div className="bg-white border border-[#a0b0a0] rounded-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#e2e8f0] to-[#d0d8d0] p-4 border-b border-[#a0b0a0]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {TYPE_ICONS[selectedNews.type]}
                  <span className="text-[10px] font-bold uppercase text-[#3a4a3a]">{TYPE_LABELS[selectedNews.type]}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">|</span>
                  <span className="text-[10px] font-bold uppercase text-slate-600">{SECTION_LABELS[selectedNews.section]}</span>
                  {selectedNews.featured && <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded-sm">Destacada</span>}
                  {selectedNews.isUserClubNews && <span className="text-[9px] font-bold uppercase text-[#3a4a3a] bg-[#3a4a3a]/10 px-1.5 py-0.5 rounded-sm">Tu club</span>}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{selectedNews.headline}</h3>
                <p className="text-sm text-slate-600 mt-1 italic">{selectedNews.subheadline}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{selectedNews.body}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                  <Clock size={12} /> {selectedNews.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {selectedNews.clubId && <span className="ml-2">Club: {world.getClub(selectedNews.clubId)?.name}</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {visible.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Newspaper size={40} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-bold">Sin noticias en esta sección</p>
                <p className="text-xs text-slate-500 mt-1">Avanzá días para que el diario publique nuevas notas</p>
              </div>
            )}
            {visible.map(news => (
              <button key={news.id} onClick={() => openNews(news)}
                className={`w-full text-left p-3 bg-white hover:bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm transition-all ${
                  news.isUserClubNews || news.section === 'TU_CLUB' ? 'border-l-4 border-l-[#3a4a3a]' : 'border-l-4 border-l-[#bcc8bc]'
                } ${news.featured ? 'ring-1 ring-amber-400/60 bg-[#fffdf5]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{TYPE_ICONS[news.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold uppercase text-slate-500">{SECTION_LABELS[news.section]}</span>
                      {news.featured && <span className="text-[8px] font-black uppercase bg-amber-400 text-black px-1 py-0.5 rounded-sm">Destacada</span>}
                      {(news.isUserClubNews || news.section === 'TU_CLUB') && <span className="text-[9px] font-bold uppercase text-[#3a4a3a]">Tu club</span>}
                      {!news.read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                      <span className="ml-auto text-[9px] text-slate-400 font-mono">{news.date.toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold uppercase leading-tight text-slate-900">{news.headline}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{news.subheadline}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-[#bcc8bc] border-t border-[#a0b0a0] p-3 text-center text-[8px] text-slate-600 font-bold uppercase shrink-0">
        Diario Deportivo — Titulares de tu club y del mundo del fútbol
      </footer>
    </div>
  );
};
