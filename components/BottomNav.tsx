import React from 'react';
import { Home, Users, Clipboard, Play, MoreHorizontal, Trophy, ShoppingBag, Wallet, Briefcase, Dumbbell, Binoculars } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

const tabs = [
  { id: 'HOME', label: 'Inicio', icon: Home },
  { id: 'SENIOR_SQUAD', label: 'Plantilla', icon: Users },
  { id: 'SENIOR_TACTICS', label: 'Táctica', icon: Clipboard },
  { id: 'PRE_MATCH', label: 'Partido', icon: Play },
  { id: '__MORE__', label: 'Más', icon: MoreHorizontal },
];

const moreItems = [
  { id: 'TABLE', label: 'Clasificación', icon: Trophy },
  { id: 'MARKET', label: 'Mercado', icon: ShoppingBag },
  { id: 'ECONOMY', label: 'Economía', icon: Wallet },
  { id: 'STAFF', label: 'Staff', icon: Briefcase },
  { id: 'TRAINING', label: 'Entreno', icon: Dumbbell },
  { id: 'SCOUTING', label: 'Scouting', icon: Binoculars },
];

export const BottomNav: React.FC = () => {
  const { currentView, setView, userClub } = useUIStore();

  const [showMore, setShowMore] = React.useState(false);

  if (!userClub) return null;

  const isActive = (tabId: string) => {
    if (tabId === currentView) return true;
    if (tabId === 'SENIOR_SQUAD' && currentView.endsWith('_SQUAD')) return true;
    if (tabId === 'SENIOR_TACTICS' && currentView.endsWith('_TACTICS')) return true;
    if (tabId === 'PRE_MATCH' && (currentView === 'MATCH' || currentView === 'PRE_MATCH')) return true;
    return false;
  };

  const handleTab = (id: string) => {
    if (id === '__MORE__') {
      setShowMore(prev => !prev);
      return;
    }
    setShowMore(false);
    setView(id);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-slate-900 border-t border-slate-700 lg:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-14">
          {tabs.map(tab => {
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
           <div className="fixed bottom-14 left-0 right-0 z-[200] bg-slate-800 border-t border-slate-700 rounded-t-xl p-4 lg:hidden animate-slide-up"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map(item => {
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
