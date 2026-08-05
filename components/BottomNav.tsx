import React from 'react';
import { Home, Users, Clipboard, Play, MoreHorizontal, Trophy, ShoppingBag, Wallet, Briefcase, Dumbbell, Binoculars, Award, RefreshCw, Zap, SkipForward, BookMarked } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

const tabs = [
  { id: 'HOME', label: 'Inicio', icon: Home },
  { id: 'SENIOR_SQUAD', label: 'Plantilla', icon: Users },
  { id: 'SENIOR_TACTICS', label: 'Táctica', icon: Clipboard },
  { id: '__ADVANCE__', label: 'Continuar', icon: RefreshCw, isAction: true },
  { id: '__MORE__', label: 'Más', icon: MoreHorizontal },
];

const moreItems = [
  { id: 'TABLE', label: 'Clasificación', icon: Trophy },
  { id: 'MARKET', label: 'Mercado', icon: ShoppingBag },
  { id: 'ECONOMY', label: 'Economía', icon: Wallet },
  { id: 'STAFF', label: 'Staff', icon: Briefcase },
  { id: 'TRAINING', label: 'Entreno', icon: Dumbbell },
  { id: 'SEASON_HISTORY', label: 'Libro Temp.', icon: BookMarked },
  { id: 'SCOUTING', label: 'Scouting', icon: Binoculars },
  { id: 'BOARD', label: 'Directiva', icon: Award },
];

interface BottomNavProps {
  advanceTime: () => void;
  simulateToNextMatch: () => void;
  isSimulating: boolean;
  isPreMatchView: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ advanceTime, simulateToNextMatch, isSimulating, isPreMatchView }) => {
  const { currentView, setView, userClub, selectedNationalTeamId } = useUIStore();

  const [showMore, setShowMore] = React.useState(false);

  if (!userClub && !selectedNationalTeamId) return null;

  const isNationalOnly = !userClub && Boolean(selectedNationalTeamId);
  const isActive = (tabId: string) => {
    if (tabId === '__ADVANCE__') return false;
    if (tabId === currentView) return true;
    if (!isNationalOnly && tabId === 'SENIOR_SQUAD' && currentView.endsWith('_SQUAD')) return true;
    if (!isNationalOnly && tabId === 'SENIOR_TACTICS' && currentView.endsWith('_TACTICS')) return true;
    if (tabId === 'PRE_MATCH' && (currentView === 'MATCH' || currentView === 'PRE_MATCH')) return true;
    return false;
  };

  const handleTab = (id: string) => {
    if (id === '__MORE__') {
      setShowMore(prev => !prev);
      return;
    }
    if (id === '__ADVANCE__') {
      setShowMore(false);
      advanceTime();
      return;
    }
    setShowMore(false);
    setView(id);
  };

const nationalTabs = [
  { id: `NT_${selectedNationalTeamId}`, label: 'Selección', icon: Users },
  { id: 'CHRONICLES', label: 'Crónicas', icon: Trophy },
  { id: '__ADVANCE__', label: 'Continuar', icon: RefreshCw, isAction: true },
  { id: '__MORE__', label: 'Más', icon: MoreHorizontal },
];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-[#3a4a3a] border-t border-[#2a3a2a] lg:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-14">
          {(isNationalOnly ? nationalTabs : tabs).map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? 'text-white' : 'text-slate-500'
                }`}
              >
                <Icon size={20} className={active ? 'fill-white/20' : ''} />
                <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showMore && (
        <>
          <div className="fixed inset-0 z-[199] bg-black/50 lg:hidden" onClick={() => setShowMore(false)} />
           <div className="fixed bottom-26 left-0 right-0 z-[200] bg-[#3a4a3a] border-t border-[#2a3a2a] rounded-t-xl p-4 lg:hidden animate-slide-up"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="grid grid-cols-3 gap-3">
              {(isNationalOnly ? [
                { id: `NT_${selectedNationalTeamId}`, label: 'Gestionar selección', icon: Users },
                { id: 'CHRONICLES', label: 'Crónicas', icon: Trophy },
                { id: 'MANAGER_PROFILE', label: 'Mi carrera', icon: Briefcase },
                { id: 'SEASON_HISTORY', label: 'Libro Temp.', icon: BookMarked },
              ] : moreItems).map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id); setShowMore(false); }}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-700/50 active:bg-slate-600 transition-colors"
                  >
                    <Icon size={22} className="text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};
