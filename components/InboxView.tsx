
import React, { useState, useMemo, useEffect } from 'react';
import { world } from '../services/worldManager';
import { InboxMessage, MessageCategory, NotificationPriority } from '../types';
import { notifyInbox } from '../stores/worldStore';
import { useUIStore } from '../stores/uiStore';
import { Mail, ShoppingBag, Users, MessageSquare, Wallet, Trash2, ChevronRight, Inbox, Trophy, ChevronLeft, Binoculars, Briefcase, Bell, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { FMButton } from './FMUI';

interface InboxViewProps {
  setView: (view: string) => void;
}

const PRIORITY_META: Record<NotificationPriority, { label: string; chipClass: string; chipIcon: React.ReactNode }> = {
  CRITICAL: { label: 'Crítica', chipClass: 'bg-red-600 text-white', chipIcon: <AlertOctagon size={14} className="text-white" /> },
  IMPORTANT: { label: 'Importante', chipClass: 'bg-amber-500 text-white', chipIcon: <AlertTriangle size={14} className="text-white" /> },
  INFO: { label: 'Info', chipClass: 'bg-slate-400 text-white', chipIcon: <Info size={14} className="text-white" /> },
};

export const InboxView: React.FC<InboxViewProps> = ({ setView }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | MessageCategory>('ALL');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL' | 'IMPORTANT' | 'ACTION'>('ALL');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const userClub = useUIStore(s => s.userClub);

  const filteredMessages = useMemo(() => {
    let list = world.inbox;
    if (viewFilter === 'UNREAD') list = list.filter(m => !m.isRead);
    else if (viewFilter === 'CRITICAL') list = list.filter(m => (m.priority || 'INFO') === 'CRITICAL');
    else if (viewFilter === 'IMPORTANT') list = list.filter(m => (m.priority || 'INFO') === 'IMPORTANT');
    else if (viewFilter === 'ACTION') list = list.filter(m => !!m.actionRequired);
    if (filter !== 'ALL') list = list.filter(m => m.category === filter);
    // Orden: prioridad desc → fecha desc
    const weight: Record<NotificationPriority, number> = { CRITICAL: 3, IMPORTANT: 2, INFO: 1 };
    return [...list].sort((a, b) =>
      ((weight[b.priority || 'INFO'] || 1) - (weight[a.priority || 'INFO'] || 1)) ||
      (b.date.getTime() - a.date.getTime())
    );
  }, [viewFilter, filter, world.inbox.length]);

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
      case 'SQUAD': return <Users size={14} className="text-green-700" />;
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
        useUIStore.getState().setViewExternalClub(club);
        setView('EXTERNAL_CLUB');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#d4dcd4] overflow-hidden">
      {/* Sidebar List - Hidden on mobile if detail is shown */}
      <div className={`w-full lg:w-[400px] border-r border-[#a0b0a0] flex flex-col bg-[#e8ece8] shadow-sm shrink-0 ${showDetailOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        <header className="p-3 border-b border-[#a0b0a0] shrink-0" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-slate-800" />
            <h2 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter" style={{ fontFamily: 'Verdana, sans-serif' }}>Notificaciones</h2>
          </div>
          {userClub && (
            <div className="flex items-center gap-3 mb-2 text-[9px] font-black uppercase tracking-wider">
              <span className="text-slate-600">Directiva:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-slate-300 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${userClub.boardConfidence || 50}%`, background: (userClub.boardConfidence || 50) > 60 ? '#22c55e' : (userClub.boardConfidence || 50) > 30 ? '#eab308' : '#ef4444' }}>
                  </div>
                </div>
                <span className="text-slate-500">{userClub.boardConfidence || 50}%</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                Objetivo: {userClub.seasonObjective === 'WIN_LEAGUE' ? 'Campeón' :
                  userClub.seasonObjective === 'TOP_4' ? 'Top 4' :
                  userClub.seasonObjective === 'TOP_HALF' ? 'Mitad Superior' :
                  userClub.seasonObjective === 'AVOID_RELEGATION' ? 'Permanencia' :
                  userClub.seasonObjective === 'WIN_CUP' ? 'Ganar Copa' :
                  userClub.seasonObjective === 'CUP_SEMIS' ? 'Semis Copa' : 'N/A'}
              </span>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-1">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'UNREAD', label: 'No leídas' },
              { id: 'CRITICAL', label: 'Críticas' },
              { id: 'IMPORTANT', label: 'Importantes' },
              { id: 'ACTION', label: 'Requieren acción' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setViewFilter(f.id as any)}
                className={`px-2.5 py-1 text-[8px] md:text-[9px] font-black uppercase rounded-[1px] border transition-all whitespace-nowrap shadow-sm ${viewFilter === f.id ? 'bg-[#3a4a3a] border-[#0a1a0a] text-white' : 'bg-white border-[#a0b0a0] text-slate-600 hover:bg-[#ccd9cc]'}`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                className={`px-2.5 py-1 text-[8px] md:text-[9px] font-black uppercase rounded-[1px] border transition-all whitespace-nowrap shadow-sm ${filter === f.id ? 'bg-[#3a4a3a] border-[#0a1a0a] text-white' : 'bg-white border-[#a0b0a0] text-slate-600 hover:bg-[#ccd9cc]'}`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-[#a0b0a0]/30 bg-[#f0f4f0]">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
               <Mail size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-[10px] uppercase font-black tracking-widest">Sin notificaciones</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMessage(m.id)}
                className={`p-3 md:p-4 cursor-pointer transition-all hover:bg-[#ccd9cc] relative group border-l-[3px] ${selectedMessageId === m.id ? 'bg-white border-l-[#3a4a3a] shadow-inner' : 'border-l-transparent'} ${!m.isRead ? 'bg-[#e0e8e0]' : ''}`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                   <div className="flex items-center gap-1.5">
                      {getCategoryIcon(m.category)}
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{m.date.toLocaleDateString()}</span>
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded-sm ${(PRIORITY_META[m.priority || 'INFO'] || PRIORITY_META.INFO).chipClass}`}>{(PRIORITY_META[m.priority || 'INFO'] || PRIORITY_META.INFO).label}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      {m.actionRequired && <span className="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 bg-blue-100 text-blue-800 rounded-sm">Acción</span>}
                      {!m.isRead && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-sm"></div>}
                      <button 
                        onClick={(e) => deleteMessage(m.id, e)}
                        className="p-1 text-slate-400 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                   </div>
                </div>
                <h4 className={`text-[11px] md:text-xs truncate uppercase tracking-tight leading-tight ${!m.isRead ? 'text-slate-900 font-black italic' : 'text-slate-700 font-bold'}`} style={{ fontFamily: 'Verdana, sans-serif' }}>{m.subject}</h4>
                <p className="text-[9px] md:text-[10px] text-slate-600 line-clamp-1 font-medium italic mt-0.5">{m.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content Area */}
      <div className={`flex-1 flex flex-col bg-[#ccd5cc] overflow-hidden ${!showDetailOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        {selectedMessage ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Detail Header / Mobile Back Nav */}
            <header className="p-3 border-b border-[#a0b0a0] flex items-center justify-between bg-[#e8ece8] lg:hidden shrink-0">
               <button onClick={() => setShowDetailOnMobile(false)} className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-700 hover:text-black">
                  <ChevronLeft size={16} /> Volver al Buzón
               </button>
               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{selectedMessage.date.toLocaleDateString()}</div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 lg:p-8">
               <div className="max-w-3xl mx-auto bg-white border border-[#a0b0a0] shadow-xl rounded-sm overflow-hidden flex flex-col min-h-full animate-fade-up">
                <div className="p-4 md:p-6 border-b border-[#a0b0a0] bg-[#f8faf8] flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#3a4a3a]/10 border border-[#3a4a3a]/20 rounded-[1px]">
                           {getCategoryIcon(selectedMessage.category)}
                           <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#3a4a3a]">
                              {selectedMessage.category}
                           </span>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-[1px] text-[8px] md:text-[9px] font-black uppercase tracking-widest ${(PRIORITY_META[selectedMessage.priority || 'INFO'] || PRIORITY_META.INFO).chipClass}`}>
                           {(PRIORITY_META[selectedMessage.priority || 'INFO'] || PRIORITY_META.INFO).chipIcon}
                           {(PRIORITY_META[selectedMessage.priority || 'INFO'] || PRIORITY_META.INFO).label}
                        </span>
                     </div>
                     <span className="text-[10px] text-slate-500 font-mono font-bold">{selectedMessage.date.toLocaleDateString()} • {selectedMessage.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {selectedMessage.subject}
                  </h3>
                </div>

                <div className="flex-1 p-6 md:p-8 bg-white">
                  <p className="text-[#1a1a1a] leading-relaxed text-sm md:text-base font-bold italic whitespace-pre-wrap" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedMessage.body}
                  </p>
                  
                  {(selectedMessage.actionRequired || selectedMessage.category === 'MARKET' || selectedMessage.category === 'SQUAD' || selectedMessage.category === 'COMPETITION' || (selectedMessage.category === 'STATEMENTS' && selectedMessage.relatedId)) && (
                    <button 
                      onClick={handleActionRequired}
                      className="mt-10 w-full p-4 md:p-6 bg-[#f0f4f0] border border-[#a0b0a0] rounded-sm flex items-center justify-between shadow-inner hover:bg-[#ccd9cc] transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3a4a3a] rounded-sm flex items-center justify-center text-white shadow-md">
                             {selectedMessage.category === 'MARKET' ? <ShoppingBag size={20}/> : 
                              selectedMessage.category === 'COMPETITION' ? <Trophy size={20}/> : 
                              selectedMessage.category === 'STATEMENTS' ? <Briefcase size={20}/> : <Users size={20}/>}
                          </div>
                          <div className="text-left">
                             <p className="text-[9px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Acción Requerida</p>
                             <p className="text-sm md:text-base text-slate-900 font-black italic">
                                {selectedMessage.category === 'MARKET' ? 'Ir al Centro de Fichajes' : 
                                 selectedMessage.category === 'COMPETITION' ? 'Ver Competición' : 
                                 selectedMessage.category === 'STATEMENTS' ? 'Ver Club' : 'Gestionar Plantel'}
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-950 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
                
                <div className="p-4 bg-[#f8faf8] border-t border-[#a0b0a0] flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                   <span>Football Manager Browser Edition</span>
                   <span>Mensaje ID: {selectedMessage.id.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600/40 p-8 text-center">
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
