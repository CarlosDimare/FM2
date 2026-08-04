
import React, { useState, useMemo, useEffect } from 'react';
import { world } from '../services/worldManager';
import { InboxMessage, MessageCategory } from '../types';
import { notifyInbox } from '../stores/worldStore';
import { useNavStore } from '../stores/navStore';
import { useUserStore } from '../stores/userStore';
import { Mail, ShoppingBag, Users, MessageSquare, Wallet, Trash2, Clock, ChevronRight, Inbox, Trophy, ArrowLeft, ChevronLeft, Binoculars, Briefcase } from 'lucide-react';
import { FMButton } from './FMUI';

interface InboxViewProps {
  setView: (view: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ setView }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | MessageCategory>('ALL');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const userClub = useUserStore(s => s.userClub);

  const filteredMessages = useMemo(() => {
    return world.inbox.filter(m => filter === 'ALL' || m.category === filter);
  }, [filter, world.inbox.length]);

  const selectedMessage = useMemo(() => {
    return world.inbox.find(m => m.id === selectedMessageId);
  }, [selectedMessageId]);

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    const msg = world.inbox.find(m => m.id === id);
    if (msg && !msg.isRead) {
      msg.isRead = true;
      notifyInbox();
    }
    setShowDetailOnMobile(true);
  };

  const getCategoryIcon = (cat: MessageCategory) => {
    switch (cat) {
      case 'MARKET': return <ShoppingBag size={14} className="text-blue-700" />;
      case 'SQUAD': return <Users size={14} className="text-green-400" />;
      case 'STATEMENTS': return <MessageSquare size={14} className="text-amber-700" />;
      case 'FINANCE': return <Wallet size={14} className="text-emerald-700" />;
      case 'COMPETITION': return <Trophy size={14} className="text-amber-600" />;
      case 'SCOUTING': return <Binoculars size={14} className="text-purple-700" />;
    }
  };

  const deleteMessage = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     world.inbox = world.inbox.filter(m => m.id !== id);
      if (selectedMessageId === id) {
          setSelectedMessageId(null);
          setShowDetailOnMobile(false);
       }
       notifyInbox();
  };

  const handleActionRequired = () => {
    if (!selectedMessage) return;
    if (selectedMessage.category === 'MARKET') setView('NEGOTIATIONS');
    else if (selectedMessage.category === 'SQUAD') setView('SENIOR_SQUAD');
    else if (selectedMessage.category === 'COMPETITION') setView('TABLE');
    else if (selectedMessage.category === 'STATEMENTS' && selectedMessage.relatedId) {
      const club = world.getClub(selectedMessage.relatedId);
      if (club) {
        useNavStore.getState().setViewExternalClub(club);
        setView('EXTERNAL_CLUB');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar List - Hidden on mobile if detail is shown */}
      <div className={`w-full lg:w-[400px] border-r border-white/10 flex flex-col bg-white/10/10 shadow-sm shrink-0 ${showDetailOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        <header className="p-3 border-b border-white/10 shrink-0" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Inbox size={18} className="text-white/80" />
            <h2 className="text-lg font-black text-white/90 uppercase italic tracking-tighter" style={{ fontFamily: 'Verdana, sans-serif' }}>CORREO</h2>
          </div>
          {userClub && (
            <div className="flex items-center gap-3 mb-2 text-[9px] font-black uppercase tracking-wider">
              <span className="text-white/60">Directiva:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-white/10/15 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${userClub.boardConfidence || 50}%`, background: (userClub.boardConfidence || 50) > 60 ? '#22c55e' : (userClub.boardConfidence || 50) > 30 ? '#eab308' : '#ef4444' }}>
                  </div>
                </div>
                <span className="text-white/50">{userClub.boardConfidence || 50}%</span>
              </div>
              <span className="text-white/40">|</span>
              <span className="text-white/60">
                Objetivo: {userClub.seasonObjective === 'WIN_LEAGUE' ? 'Campeón' :
                  userClub.seasonObjective === 'TOP_4' ? 'Top 4' :
                  userClub.seasonObjective === 'TOP_HALF' ? 'Mitad Superior' :
                  userClub.seasonObjective === 'AVOID_RELEGATION' ? 'Permanencia' :
                  userClub.seasonObjective === 'WIN_CUP' ? 'Ganar Copa' :
                  userClub.seasonObjective === 'CUP_SEMIS' ? 'Semis Copa' : 'N/A'}
              </span>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'ALL', label: 'TODOS' },
              { id: 'MARKET', label: 'MERCADO' },
              { id: 'SQUAD', label: 'PLANTEL' },
              { id: 'STATEMENTS', label: 'PRENSA' },
              { id: 'COMPETITION', label: 'TORNEO' },
              { id: 'SCOUTING', label: 'SCOUTING' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-2.5 py-1 text-[8px] md:text-[9px] font-black uppercase rounded-[1px] border transition-all whitespace-nowrap shadow-sm ${filter === f.id ? 'bg-white/25 border-[#0a1a0a] text-white' : 'bg-white border-white/10 text-white/60 hover:bg-white/10'}`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-white/10 bg-white/10/5">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-white/40 italic">
               <Mail size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-[10px] uppercase font-black tracking-widest">Buzón Vacío</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMessage(m.id)}
                className={`p-3 md:p-4 cursor-pointer transition-all hover:bg-white/10 relative group border-l-[3px] ${selectedMessageId === m.id ? 'bg-white border-l-[#3a4a3a] shadow-inner' : 'border-l-transparent'} ${!m.isRead ? 'bg-white/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                   <div className="flex items-center gap-2">
                      {getCategoryIcon(m.category)}
                      <span className="text-[8px] md:text-[9px] font-bold text-white/50 uppercase tracking-widest font-mono">{m.date.toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      {!m.isRead && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-sm"></div>}
                      <button 
                        onClick={(e) => deleteMessage(m.id, e)}
                        className="p-1 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                   </div>
                </div>
                <h4 className={`text-[11px] md:text-xs truncate uppercase tracking-tight leading-tight ${!m.isRead ? 'text-white/90 font-black italic' : 'text-white/70 font-bold'}`} style={{ fontFamily: 'Verdana, sans-serif' }}>{m.subject}</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 line-clamp-1 font-medium italic mt-0.5">{m.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content Area */}
      <div className={`flex-1 flex flex-col bg-white/10/5 overflow-hidden ${!showDetailOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        {selectedMessage ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Detail Header / Mobile Back Nav */}
            <header className="p-3 border-b border-white/10 flex items-center justify-between bg-white/10/10 lg:hidden shrink-0">
               <button onClick={() => setShowDetailOnMobile(false)} className="flex items-center gap-1 text-[10px] font-black uppercase text-white/70 hover:text-black">
                  <ChevronLeft size={16} /> Volver al Buzón
               </button>
               <div className="text-[8px] font-black text-white/50 uppercase tracking-widest">{selectedMessage.date.toLocaleDateString()}</div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 lg:p-8">
               <div className="max-w-3xl mx-auto bg-white/10 border border-white/10 shadow-xl rounded-sm overflow-hidden flex flex-col min-h-full animate-fade-up">
                <div className="p-4 md:p-6 border-b border-white/10 bg-[#f8faf8] flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div className="flex items-center gap-2 px-2 py-1 bg-white/25/10 border border-[#3a4a3a]/20 rounded-[1px]">
                        {getCategoryIcon(selectedMessage.category)}
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#3a4a3a]">
                           {selectedMessage.category}
                        </span>
                     </div>
                     <span className="text-[10px] text-white/50 font-mono font-bold">{selectedMessage.date.toLocaleDateString()} • {selectedMessage.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white/90 italic tracking-tighter uppercase leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {selectedMessage.subject}
                  </h3>
                </div>

                <div className="flex-1 p-6 md:p-8 bg-white/10">
                  <p className="text-[#1a1a1a] leading-relaxed text-sm md:text-base font-bold italic whitespace-pre-wrap" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedMessage.body}
                  </p>
                  
                  {(selectedMessage.category === 'MARKET' || selectedMessage.category === 'SQUAD' || selectedMessage.category === 'COMPETITION' || (selectedMessage.category === 'STATEMENTS' && selectedMessage.relatedId)) && (
                    <button 
                      onClick={handleActionRequired}
                      className="mt-10 w-full p-4 md:p-6 bg-white/10/5 border border-white/10 rounded-sm flex items-center justify-between shadow-inner hover:bg-white/10 transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-sm flex items-center justify-center text-white shadow-md">
                             {selectedMessage.category === 'MARKET' ? <ShoppingBag size={20}/> : 
                              selectedMessage.category === 'COMPETITION' ? <Trophy size={20}/> : 
                              selectedMessage.category === 'STATEMENTS' ? <Briefcase size={20}/> : <Users size={20}/>}
                          </div>
                          <div className="text-left">
                             <p className="text-[9px] md:text-xs font-black text-white/50 uppercase tracking-[0.2em]">Acción Requerida</p>
                             <p className="text-sm md:text-base text-white/90 font-black italic">
                                {selectedMessage.category === 'MARKET' ? 'Ir al Centro de Fichajes' : 
                                 selectedMessage.category === 'COMPETITION' ? 'Ver Competición' : 
                                 selectedMessage.category === 'STATEMENTS' ? 'Ver Club' : 'Gestionar Plantel'}
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
                
                <div className="p-4 bg-[#f8faf8] border-t border-white/10 flex justify-between items-center text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">
                   <span>Football Manager Browser Edition</span>
                   <span>Mensaje ID: {selectedMessage.id.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/60/40 p-8 text-center">
             <div className="p-8 border-2 border-dashed border-slate-600/20 rounded-full mb-4">
                <Inbox size={80} />
             </div>
             <p className="text-xl font-black uppercase italic tracking-widest" style={{ fontFamily: 'Verdana, sans-serif' }}>SELECCIONE UN MENSAJE</p>
             <p className="text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[200px]">Pulse en un elemento del buzón para ver su contenido completo.</p>
          </div>
        )}
      </div>
    </div>
  );
};
