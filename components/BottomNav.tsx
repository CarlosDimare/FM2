import React from 'react';
import { Home, Users, Clipboard, Play, MoreHorizontal, SkipForward, RefreshCw, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavStore } from '../stores/navStore';
import { useUserStore } from '../stores/userStore';
import { DEPARTMENTS, DEPT_NATIONAL, SCREEN_THEMES, getScreenTheme } from '../constants';

// ─── Sub-menus for fixed tabs ────────────────────────────────────────────────
const SUB_MENUS = {
  SENIOR_SQUAD: [
    { id: 'SENIOR_SQUAD', label: 'Primer Equipo', emoji: '👕' },
    { id: 'RESERVE_SQUAD', label: 'Reserva', emoji: '👕' },
    { id: 'U20_SQUAD', label: 'Sub-20', emoji: '🌱' },
  ],
  SENIOR_TACTICS: [
    { id: 'SENIOR_TACTICS', label: 'Formación Senior', emoji: '📋' },
    { id: 'RESERVE_TACTICS', label: 'Formación Reserva', emoji: '📋' },
    { id: 'U20_TACTICS', label: 'Formación Sub-20', emoji: '📋' },
  ],
  PRE_MATCH: [
    { id: 'PRE_MATCH', label: 'Pre-partido', emoji: '🧢' },
    { id: 'PRESS_CONFERENCE_PRE', label: 'Conferencia Pre', emoji: '🎤' },
    { id: 'MATCH', label: 'Partido en Vivo', emoji: '⚽' },
    { id: 'PRESS_CONFERENCE_POST', label: 'Conferencia Post', emoji: '🎤' },
  ],
};

// ─── Tabs fijos — Capa 1 del documento ───────────────────────────────────────
const FIXED_TABS = [
  { id: 'HOME', label: 'Inicio', icon: Home, hasSubMenu: false },
  { id: 'SENIOR_SQUAD', label: 'Plantel', icon: Users, hasSubMenu: true },
  { id: 'SENIOR_TACTICS', label: 'Táctica', icon: Clipboard, hasSubMenu: true },
  { id: 'PRE_MATCH', label: 'Partido', icon: Play, hasSubMenu: true },
  { id: '__MORE__', label: 'Más', icon: MoreHorizontal, hasSubMenu: false },
];

interface BottomNavProps {
  advanceTime: () => void;
  simulateToNextMatch: () => void;
  isSimulating: boolean;
  isPreMatchView: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ advanceTime, simulateToNextMatch, isSimulating, isPreMatchView }) => {
  const { currentView, setView } = useNavStore();
  const { userClub, selectedNationalTeamId } = useUserStore();
  const [showMore, setShowMore] = React.useState(false);
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);

  if (!userClub && !selectedNationalTeamId) return null;

  const isNationalOnly = !userClub && Boolean(selectedNationalTeamId);

  // ── Active detection ─────────────────────────────────────────────────────
  const isActive = (tabId: string) => {
    if (tabId === currentView) return true;
    if (tabId === 'SENIOR_SQUAD' && currentView.endsWith('_SQUAD')) return true;
    if (tabId === 'SENIOR_TACTICS' && currentView.endsWith('_TACTICS')) return true;
    if (tabId === 'PRE_MATCH' && (currentView === 'MATCH' || currentView === 'PRE_MATCH' || currentView.startsWith('PRESS_CONFERENCE'))) return true;
    return false;
  };

  // ── Handle tab tap ───────────────────────────────────────────────────────
  const handleTab = (id: string, hasSubMenu: boolean) => {
    if (id === '__MORE__') {
      setShowMore(prev => !prev);
      setOpenSubMenu(null);
      return;
    }
    if (hasSubMenu) {
      // Toggle sub-menu
      setOpenSubMenu(prev => prev === id ? null : id);
      return;
    }
    setShowMore(false);
    setOpenSubMenu(null);
    setView(id);
  };

  // ── Handle sub-menu item tap ─────────────────────────────────────────────
  const handleSubMenuItem = (viewId: string) => {
    setOpenSubMenu(null);
    setShowMore(false);
    setView(viewId);
  };

  // ── Handle department tap ────────────────────────────────────────────────
  const handleDepartment = (deptId: string) => {
    setShowMore(false);
    const dept = departments.find(d => d.id === deptId);
    if (dept && dept.items.length > 0) {
      const firstItem = dept.items[0];
      if (firstItem.id.startsWith('NT_') && selectedNationalTeamId) {
        setView(`NT_${selectedNationalTeamId}_SQUAD`);
      } else {
        setView(firstItem.id);
      }
    }
  };

  // ── Get current screen theme for active indicator ────────────────────────
  const currentTheme = getScreenTheme(currentView);

  // ── Departments list ────────────────────────────────────────────────────
  const departments = React.useMemo(() => {
    const depts = [...DEPARTMENTS];
    if (selectedNationalTeamId) {
      depts.splice(2, 0, DEPT_NATIONAL);
    }
    return depts;
  }, [selectedNationalTeamId]);

  return (
    <>
      {/* ─── Fixed bottom navigation bar ──────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[200] bg-[#1a2332]/95 backdrop-blur-md border-t border-white/5 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Action bar: advance time / simulate */}
        <div className="flex items-center justify-around h-11 border-b border-white/5">
          {!isPreMatchView && (
            <button
              onClick={simulateToNextMatch}
              className="flex items-center justify-center gap-1.5 flex-1 h-full text-white/40 hover:text-white active:bg-white/5 transition-colors"
            >
              <SkipForward size={16} />
              <span className="text-[9px] font-black uppercase tracking-wider">Próximo Partido</span>
            </button>
          )}
          <button
            onClick={advanceTime}
            className={`flex items-center justify-center gap-1.5 flex-1 h-full text-white active:bg-white/5 transition-colors ${isPreMatchView ? 'animate-pulse' : ''}`}
          >
            {isPreMatchView ? <Zap size={16} fill="currentColor" /> : <RefreshCw size={16} />}
            <span className="text-[9px] font-black uppercase tracking-wider">
              {isPreMatchView ? 'Jugar Partido' : 'Continuar'}
            </span>
          </button>
        </div>

        {/* 5 fixed slots */}
        <div className="flex items-center justify-around h-14 px-1">
          {FIXED_TABS.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.id);
            const hasOpenSub = openSubMenu === tab.id;
            const theme = getScreenTheme(tab.id === '__MORE__' ? currentView : tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id, tab.hasSubMenu)}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 rounded-lg mx-0.5 ${
                  active ? 'text-white' : 'text-white/50 hover:text-slate-300'
                }`}
              >
                {/* Active indicator — colored dot or glow */}
                {active && tab.id !== '__MORE__' && (
                  <div
                    className="absolute -top-0.5 w-8 h-1 rounded-full"
                    style={{ background: theme.hex }}
                  />
                )}
                <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-white/10' : ''}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider leading-none">{tab.label}</span>
                {/* Sub-menu indicator */}
                {tab.hasSubMenu && (
                  <span className="absolute top-1 right-1">
                    {hasOpenSub ? <ChevronDown size={8} className="text-white/50" /> : <ChevronUp size={8} className="text-white/30" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── Sub-menus for Plantel/Táctica/Partido ────────────────────── */}
      {openSubMenu && SUB_MENUS[openSubMenu as keyof typeof SUB_MENUS] && (
        <>
          <div
            className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpenSubMenu(null)}
          />
          <div
            className="fixed bottom-[120px] left-0 right-0 z-[200] lg:hidden animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-2 bg-[#1a2332]/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40">
                  {openSubMenu === 'SENIOR_SQUAD' && '👕 Plantel'}
                  {openSubMenu === 'SENIOR_TACTICS' && '📋 Táctica'}
                  {openSubMenu === 'PRE_MATCH' && '⚽ Partido'}
                </h3>
                <button onClick={() => setOpenSubMenu(null)} className="text-white/50 hover:text-white text-xs">✕</button>
              </div>
              <div className="p-2">
                {SUB_MENUS[openSubMenu as keyof typeof SUB_MENUS].map(item => {
                  const isActiveItem = currentView === item.id;
                  const theme = getScreenTheme(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSubMenuItem(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActiveItem
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-sm font-bold">{item.label}</span>
                      {isActiveItem && (
                        <div className="ml-auto w-2 h-2 rounded-full" style={{ background: theme.hex }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── "Más" sheet — Departmentos en grid 2 columnas ────────────── */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMore(false)}
          />
          <div
            className="fixed bottom-[120px] left-0 right-0 z-[200] lg:hidden animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-2 bg-[#1a2332]/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Departamentos</h3>
                <button onClick={() => setShowMore(false)} className="text-white/50 hover:text-white text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {departments.map(dept => {
                  const theme = SCREEN_THEMES[dept.id.replace('DEPT_', '')] || {
                    hex: dept.hex,
                    gradient: `linear-gradient(135deg, ${dept.hex}22 0%, ${dept.hex}44 100%)`,
                  };
                  return (
                    <button
                      key={dept.id}
                      onClick={() => handleDepartment(dept.id)}
                      className="relative group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 active:scale-95 overflow-hidden"
                      style={{
                        background: theme.gradient || `linear-gradient(135deg, ${dept.hex}22 0%, ${dept.hex}44 100%)`,
                        border: `1px solid ${dept.hex}33`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `radial-gradient(circle at center, ${dept.hex}33 0%, transparent 70%)` }}
                      />
                      <span className="text-2xl relative z-10">{dept.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/90 relative z-10">
                        {dept.label}
                      </span>
                      <span
                        className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${dept.hex}44`, color: dept.hex }}
                      >
                        {dept.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => { setShowMore(false); setView('SAVE'); }}
                  className="flex-1 text-[9px] font-bold uppercase tracking-wider text-white/50 hover:text-white py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={() => { setShowMore(false); setView('SETTINGS'); }}
                  className="flex-1 text-[9px] font-bold uppercase tracking-wider text-white/50 hover:text-white py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  ⚙️ Config
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
