import React, { useState, useMemo } from 'react';
import { Player, Fixture, TacticSettings, POSITION_ORDER, Position } from '../types';
import { TACTIC_PRESETS, getFlagUrl } from '../data/static';
import { SLOT_CONFIG } from '../services/engine';
import { world } from '../services/worldManager';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';
import { PlayerFormDots, PlayerStatusIcons } from './PlayerBadges';
import { Users, Calendar, Star, Shield, UserPlus, UserMinus, Save, Lock, ClipboardList, X } from 'lucide-react';

export type NationalTeamSection = 'SQUAD' | 'TACTICS' | 'SCHEDULE' | 'STATS';

type SortField = 'NUM' | 'NAME' | 'POS' | 'AGE' | 'CLUB' | 'CAPS' | 'GOALS' | 'FORM' | 'FIT' | 'VAL';

const getPositionLabel = (pos: string): string => {
  const labels: Record<string, string> = {
    'P': 'GK', 'DFC': 'DF', 'LD': 'DF', 'LI': 'DF', 'LIB': 'DF',
    'MC': 'MC', 'MD': 'MC', 'MI': 'MC', 'MCD': 'MC', 'MPC': 'MC',
    'DC': 'DL', 'ED': 'DL', 'EI': 'DL', 'WD': 'DL', 'WI': 'DL',
  };
  return labels[pos] || pos;
};

const getPositionColor = (label: string): string => {
  if (label === 'GK') return 'bg-yellow-200 text-yellow-900';
  if (label === 'DF') return 'bg-blue-200 text-blue-900';
  if (label === 'MC') return 'bg-green-200 text-green-900';
  return 'bg-red-200 text-red-900';
};

// ── Pizarra táctica de selección (reutiliza la geometría de slots del modo club) ──
const NT_SLOT_COORDS: Record<number, { t: number; l: number }> = {
  0: { t: 90, l: 50 },
  31: { t: 82.5, l: 50 },
  1: { t: 75, l: 8 }, 2: { t: 75, l: 29 }, 3: { t: 75, l: 50 }, 4: { t: 75, l: 71 }, 5: { t: 75, l: 92 },
  9: { t: 62, l: 8 }, 6: { t: 62, l: 29 }, 8: { t: 62, l: 50 }, 7: { t: 62, l: 71 }, 10: { t: 62, l: 92 },
  11: { t: 45, l: 8 }, 12: { t: 45, l: 29 }, 13: { t: 45, l: 50 }, 14: { t: 45, l: 71 }, 15: { t: 45, l: 92 },
  16: { t: 28, l: 8 }, 19: { t: 28, l: 29 }, 17: { t: 28, l: 50 }, 20: { t: 28, l: 71 }, 18: { t: 28, l: 92 },
  27: { t: 12, l: 8 }, 29: { t: 12, l: 29 }, 26: { t: 12, l: 50 }, 30: { t: 12, l: 71 }, 28: { t: 12, l: 92 },
};

const getPlayerLine = (p: Player): string => {
  if (p.positions.includes(Position.GK)) return 'GK';
  if (p.positions.includes(Position.SW)) return 'SW';
  const pos = p.positions[0];
  if ([Position.DC, Position.DR, Position.DL].includes(pos)) return 'DEF';
  if ([Position.DM, Position.DMR, Position.DML].includes(pos)) return 'DM';
  if ([Position.MC, Position.MR, Position.ML].includes(pos)) return 'MID';
  if ([Position.AM, Position.AMR, Position.AML].includes(pos)) return 'AM';
  return 'ATT';
};

const NT_LINE_NEIGHBORS: Record<string, string[]> = {
  GK: ['DEF'], SW: ['DEF'], DEF: ['SW', 'DM'], DM: ['DEF', 'MID'], MID: ['DM', 'AM'], AM: ['MID', 'ATT'], ATT: ['AM'],
};

const lineFit = (p: Player, line: string): number => {
  const pLine = getPlayerLine(p);
  if (line === pLine) return 20;
  if (p.secondaryPositions && p.secondaryPositions.some(sp => getPlayerLine({ ...p, positions: [sp] } as Player) === line)) return 15;
  if ((NT_LINE_NEIGHBORS[line] || []).includes(pLine)) return 9;
  if ((NT_LINE_NEIGHBORS[pLine] || []).includes(line)) return 9;
  return 3;
};

const getAvgForm = (player: Player): number => {
  if (!player.formRatings || player.formRatings.length === 0) return 0;
  return player.formRatings.reduce((a, b) => a + b, 0) / player.formRatings.length;
};

const SECTION_LABELS: Record<NationalTeamSection, string> = {
  SQUAD: 'Plantel',
  TACTICS: 'Tácticas',
  SCHEDULE: 'Partidos',
  STATS: 'Estadísticas',
};

interface NationalTeamViewProps {
  teamId: string;
  section?: NationalTeamSection;
}

export const NationalTeamView: React.FC<NationalTeamViewProps> = ({ teamId, section = 'SQUAD' }) => {
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [rosterVersion, setRosterVersion] = useState(0);
  const [tacticDraft, setTacticDraft] = useState<TacticSettings | null>(null);
  const [offerNotice, setOfferNotice] = useState<string | null>(null);
  const [formationDraft, setFormationDraft] = useState<string>('4-4-2');
  const [lineupDraft, setLineupDraft] = useState<(string | null)[]>([]);
  const [captainDraft, setCaptainDraft] = useState<string | null>(null);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('POS');
  const [sortDesc, setSortDesc] = useState(false);
  const { setView, setSelectedPlayer, setSelectedNationalTeamId, setCareerMode, userClub } = useUIStore();
  const { fixtures, currentDate: gameCurrentDate, updateNextFixture } = useGameStore();

  const nationalManager = world.nationalTeamManager;
  const team = nationalManager?.nationalTeams?.find((t: any) => t.id === teamId);
  // Sincronizar la formación inicial por defecto con la definida para la selección.
  React.useEffect(() => {
    if (team?.formation && !nationalManager?.getControlledFormation(teamId)) {
      setFormationDraft(team.formation);
    }
  }, [teamId, team?.formation]);
  const teamName = team?.name || teamId;
  const flagUrl = getFlagUrl(team?.country || teamId);
  const isControlled = Boolean(nationalManager?.isControlled(teamId));
  const controlledIds = isControlled ? nationalManager.getControlledSquadIds(teamId) : [];
  const selectedIds = new Set(controlledIds);

  // Pool de la selección: la convocatoria guardada si está bajo control, si no la lista automática.
  const squadPlayers = useMemo(() => {
    if (!nationalManager || !team) return [];
    const ids = isControlled && controlledIds.length > 0 ? controlledIds : team.playerIds;
    return ids
      .map((pid: string) => world.players.find(p => p.id === pid))
      .filter((player): player is Player => Boolean(player))
      .sort((a: Player, b: Player) => {
        const aOverall = (a.stats.visible.fisico + a.stats.visible.mental + a.stats.visible.tecnica) / 3;
        const bOverall = (b.stats.visible.fisico + b.stats.visible.mental + b.stats.visible.tecnica) / 3;
        return bOverall - aOverall;
      });
  }, [teamId, world.players.length, rosterVersion, isControlled, controlledIds.join(',')]);

  const eligiblePlayers = useMemo(() => {
    if (!nationalManager) return [];
    return nationalManager.getEligiblePlayers(teamId, world.players, world.clubs);
  }, [teamId, world.players.length, rosterVersion]);

  const defaultTactic = useMemo(() => {
    const preset = TACTIC_PRESETS.find(p => p.id === team?.formation) || TACTIC_PRESETS[0];
    return { ...preset.settings };
  }, [team?.formation]);

  React.useEffect(() => {
    if (isControlled) {
      setTacticDraft({ ...(nationalManager?.getControlledTactic(teamId) || defaultTactic) });
    } else {
      setTacticDraft(null);
    }
  }, [teamId, isControlled, rosterVersion, team?.formation]);

  // ── Pizarra: sincronizar alineación + capitán desde el manager ──
  React.useEffect(() => {
    if (!isControlled) { setLineupDraft([]); setCaptainDraft(null); return; }
    const savedFormation = nationalManager?.getControlledFormation(teamId);
    const savedLineup = nationalManager?.getControlledLineup(teamId);
    const formation = savedFormation && TACTIC_PRESETS.some(t => t.id === savedFormation)
      ? savedFormation
      : (team?.formation || '4-4-2');
    setFormationDraft(formation);
    if (savedLineup && savedLineup.length === 11 && savedLineup.every(id => selectedIds.has(id))) {
      setLineupDraft(savedLineup);
    } else {
      setLineupDraft(autoAssignLineup(formation, squadPlayers));
    }
    setCaptainDraft(nationalManager?.getControlledCaptain(teamId) || null);
  }, [teamId, isControlled, rosterVersion]);

  const autoAssignLineup = (formationId: string, pool: Player[]): (string | null)[] => {
    const preset = TACTIC_PRESETS.find(t => t.id === formationId) || TACTIC_PRESETS[0];
    const slots = [...preset.positions];
    const result: (string | null)[] = new Array(slots.length).fill(null);
    const unassigned = [...pool];
    const pickBest = (slot: number, candidates: Player[]) => {
      const line = SLOT_CONFIG[slot]?.line || 'MID';
      let bestIdx = -1, bestScore = -Infinity;
      candidates.forEach((p, idx) => {
        const score = lineFit(p, line) + p.currentAbility / 20;
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      });
      return bestIdx;
    };
    // GK primero
    const gkIdx = slots.findIndex(s => SLOT_CONFIG[s]?.line === 'GK');
    if (gkIdx !== -1) {
      const gk = unassigned.findIndex(p => p.positions.includes(Position.GK));
      if (gk !== -1) { result[gkIdx] = unassigned[gk].id; unassigned.splice(gk, 1); }
    }
    slots.forEach((slot, i) => {
      if (result[i]) return;
      const idx = pickBest(slot, unassigned);
      if (idx !== -1) { result[i] = unassigned[idx].id; unassigned.splice(idx, 1); }
    });
    return result;
  };

  const handleFormationChange = (id: string) => {
    setFormationDraft(id);
    const preset = TACTIC_PRESETS.find(t => t.id === id) || TACTIC_PRESETS[0];
    const kept = (lineupDraft.filter(Boolean) as string[]);
    const pool = squadPlayers.filter(p => kept.includes(p.id));
    const rest = squadPlayers.filter(p => !kept.includes(p.id));
    const slots = [...preset.positions];
    const result: (string | null)[] = new Array(slots.length).fill(null);
    const unassigned = [...pool];
    const gkIdx = slots.findIndex(s => SLOT_CONFIG[s]?.line === 'GK');
    if (gkIdx !== -1) {
      const gk = unassigned.findIndex(p => p.positions.includes(Position.GK));
      if (gk !== -1) { result[gkIdx] = unassigned[gk].id; unassigned.splice(gk, 1); }
    }
    const filler = [...unassigned, ...rest];
    slots.forEach((slot, i) => {
      if (result[i]) return;
      const line = SLOT_CONFIG[slot]?.line || 'MID';
      let bestIdx = -1, bestScore = -Infinity;
      filler.forEach((p, idx) => {
        const score = lineFit(p, line) + p.currentAbility / 20;
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      });
      if (bestIdx !== -1) { result[i] = filler[bestIdx].id; filler.splice(bestIdx, 1); }
    });
    setLineupDraft(result);
  };

  const handleAssignPlayer = (slotIdx: number, playerId: string) => {
    setLineupDraft(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) if (next[i] === playerId) next[i] = null;
      next[slotIdx] = playerId;
      return next;
    });
  };

  const saveLineup = () => {
    if (!nationalManager || !isControlled) return;
    const ids = lineupDraft.filter(Boolean) as string[];
    if (ids.length !== 11) {
      setOfferNotice('Completa el once titular (11 jugadores) antes de guardar.');
      return;
    }
    const ok = nationalManager.setControlledLineup(teamId, ids, formationDraft);
    nationalManager.setControlledCaptain(teamId, captainDraft);
    if (ok) {
      setOfferNotice('Alineación guardada: el once elegido jugará los próximos partidos.');
      setRosterVersion(v => v + 1);
    }
  };

  const assumeControl = () => {
    if (!nationalManager || !team) return;
    const eligibleIds = new Set(eligiblePlayers.map(player => player.id));
    const savedIds = team.playerIds.filter(id => eligibleIds.has(id));
    const fallbackIds = eligiblePlayers
      .map(player => player.id)
      .filter(id => !savedIds.includes(id));
    const initialIds = [...savedIds, ...fallbackIds].slice(0, 23);
    const accepted = nationalManager.assumeControl(teamId, initialIds, tacticDraft || defaultTactic, eligiblePlayers.map(player => player.id));
    if (!accepted) return;
    // Mantener el estado de la carrera coherente con la selección realmente controlada.
    setSelectedNationalTeamId(teamId);
    setCareerMode(userClub ? 'BOTH' : 'NATIONAL');
    updateNextFixture(fixtures, gameCurrentDate, teamId);
    setTacticDraft({ ...(tacticDraft || defaultTactic) });
    setRosterVersion(version => version + 1);
  };

  const toggleConvocation = (playerId: string) => {
    if (!nationalManager || !isControlled) return;
    if (!selectedIds.has(playerId) && controlledIds.length >= 23) return;
    const nextIds = selectedIds.has(playerId)
      ? controlledIds.filter(id => id !== playerId)
      : [...controlledIds, playerId].slice(0, 23);
    if (nationalManager.setControlledSquad(teamId, nextIds, eligiblePlayers.map(player => player.id))) {
      setRosterVersion(version => version + 1);
    }
  };

  const saveTactic = () => {
    if (!nationalManager || !isControlled || !tacticDraft) return;
    nationalManager.setControlledTactic(teamId, tacticDraft);
    setRosterVersion(version => version + 1);
  };

  const changeNationalTeam = (nextTeamId: string) => {
    if (!nationalManager || nextTeamId === teamId) return;
    if (!nationalManager.requestNationalTeamOffer(nextTeamId)) return;
    const requestedTeam = nationalManager.nationalTeams?.find((candidate: any) => candidate.id === nextTeamId);
    world.addInboxMessage('STATEMENTS', 'Solicitud de nuevo cargo internacional', `Has solicitado dirigir a ${requestedTeam?.name || nextTeamId}. La federación evaluará tu candidatura.`, gameCurrentDate, nextTeamId);
    setOfferNotice('Solicitud enviada. La federación debe aceptar el nuevo cargo.');
  };

  const resolveTeamOffer = (accepted: boolean) => {
    if (!nationalManager) return;
    const offer = nationalManager.getPendingNationalTeamOffer();
    if (!offer) return;
    const nextTeamId = offer.teamId;
    if (!accepted) {
      nationalManager.resolveNationalTeamOffer(nextTeamId, false);
      world.addInboxMessage('STATEMENTS', 'Oferta internacional rechazada', 'Has rechazado la propuesta de cambio de selección.', gameCurrentDate, nextTeamId);
      setOfferNotice('Has rechazado la oferta de la federación.');
      return;
    }
    const nextTeam = nationalManager.nationalTeams?.find((candidate: any) => candidate.id === nextTeamId);
    if (!nextTeam) return;
    const nextEligible = nationalManager.getEligiblePlayers(nextTeamId, world.players, world.clubs);
    const eligibleIds = new Set(nextEligible.map(player => player.id));
    const savedIds = (nextTeam.playerIds || []).filter((id: string) => eligibleIds.has(id));
    const fallbackIds = nextEligible.map(player => player.id).filter(id => !savedIds.includes(id));
    const preset = TACTIC_PRESETS.find(tactic => tactic.id === nextTeam.formation) || TACTIC_PRESETS[0];
    const tookControl = nationalManager.assumeControl(nextTeamId, [...savedIds, ...fallbackIds].slice(0, 23), { ...preset.settings }, nextEligible.map(player => player.id));
    if (!tookControl) {
      setOfferNotice('La federación no pudo completar el cambio: faltan jugadores elegibles.');
      return;
    }
    nationalManager.resolveNationalTeamOffer(nextTeamId, true);
    setSelectedNationalTeamId(nextTeamId);
    world.addInboxMessage('STATEMENTS', 'Nuevo cargo internacional', `La federación confirma tu nombramiento al frente de ${nextTeam.name}.`, gameCurrentDate, nextTeamId);
    updateNextFixture(fixtures, gameCurrentDate, nextTeamId);
    setRosterVersion(version => version + 1);
    setOfferNotice(`Ahora diriges a ${nextTeam.name}.`);
    setView(`NT_${nextTeamId}_SQUAD`);
  };

  const getTeamName = (id: string) => nationalManager?.nationalTeams?.find((t: any) => t.id === id)?.name || id;

  // Fixtures de la selección
  const teamFixtures = useMemo(() => {
    return fixtures
      .filter(f => f.homeTeamId === teamId || f.awayTeamId === teamId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [fixtures, teamId]);

  // Filtro por posición
  const filteredPlayers = useMemo(() => {
    if (selectedPosition === 'ALL') return squadPlayers;
    const posMap: Record<string, string[]> = {
      'GK': ['P'],
      'DEF': ['DFC', 'LD', 'LI', 'LIB'],
      'MID': ['MC', 'MD', 'MI', 'MCD', 'MPC'],
      'ATT': ['DC', 'ED', 'EI', 'WD', 'WI'],
    };
    const positions = posMap[selectedPosition] || [];
    return squadPlayers.filter(p => positions.includes(p.primaryPosition || p.positions[0]));
  }, [squadPlayers, selectedPosition]);

  const getStatsByPosition = (pos: string) => {
    if (pos === 'ALL') return squadPlayers.length;
    const posMap: Record<string, string[]> = {
      'GK': ['P'],
      'DEF': ['DFC', 'LD', 'LI', 'LIB'],
      'MID': ['MC', 'MD', 'MI', 'MCD', 'MPC'],
      'ATT': ['DC', 'ED', 'EI', 'WD', 'WI'],
    };
    const positions = posMap[pos] || [];
    return squadPlayers.filter(p => positions.includes(p.primaryPosition || p.positions[0])).length;
  };

  const squadNumber = (playerId: string): number => {
    const cIdx = controlledIds.indexOf(playerId);
    if (cIdx >= 0) return cIdx + 1;
    const autoIdx = team?.playerIds?.indexOf(playerId) ?? -1;
    return (autoIdx >= 0 ? autoIdx : 0) + 1;
  };

  // Ordenamiento de la lista (mismo comportamiento que la plantilla de club)
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else {
      setSortField(field);
      setSortDesc(field === 'NUM' || field === 'NAME' || field === 'POS' ? false : true);
    }
  };

  const handleHeaderClick = (index: number) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const mobileFields: SortField[] = ['NUM', 'NAME', 'AGE', 'FIT', 'VAL'];
      if (mobileFields[index]) handleSort(mobileFields[index]);
    } else {
      const desktopFields: SortField[] = ['NUM', 'NAME', 'POS', 'AGE', 'CLUB', 'CAPS', 'GOALS', 'FORM', 'FIT', 'VAL'];
      if (desktopFields[index]) handleSort(desktopFields[index]);
    }
  };

  const sortedPlayers = useMemo(() => [...filteredPlayers].sort((a, b) => {
    let res = 0;
    switch (sortField) {
      case 'NUM': res = squadNumber(a.id) - squadNumber(b.id); break;
      case 'NAME': res = a.name.localeCompare(b.name); break;
      case 'POS': res = (POSITION_ORDER[a.primaryPosition || a.positions[0]] ?? 99) - (POSITION_ORDER[b.primaryPosition || b.positions[0]] ?? 99); break;
      case 'AGE': res = a.age - b.age; break;
      case 'CLUB': res = (world.getClub(a.clubId)?.shortName || '').localeCompare(world.getClub(b.clubId)?.shortName || ''); break;
      case 'CAPS': res = a.seasonStats.appearances - b.seasonStats.appearances; break;
      case 'GOALS': res = a.seasonStats.goals - b.seasonStats.goals; break;
      case 'FORM': res = getAvgForm(a) - getAvgForm(b); break;
      case 'FIT': res = a.fitness - b.fitness; break;
      case 'VAL': res = a.value - b.value; break;
    }
    return sortDesc ? -res : res;
  }), [filteredPlayers, sortField, sortDesc, controlledIds.join(',')]);

  const navigateTo = (nextSection: NationalTeamSection) => {
    setView(`NT_${teamId}_${nextSection}`);
  };

  const desktopHeaders = ['#', 'Nombre', 'Pos', 'Edad', 'Club', 'PJ', 'Gol', 'Forma', 'Fis', 'Valor'];
  const desktopWidths = ['30px', 'auto', '42px', '36px', '70px', '36px', '36px', '60px', '40px', '80px'];
  const mobileHeaders = ['#', 'Nombre', 'Edad', 'Fis', 'Valor'];
  const mobileWidths = ['26px', 'auto', '34px', '40px', '78px'];

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 bg-[#d4dcd4] overflow-hidden">
      {/* Header compartido: bandera, nombre, selector de sección y cambio de selección */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shrink-0 bg-[#e8ece8] border border-[#a0b0a0] p-3 rounded-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white border border-[#a0b0a0] rounded-sm flex items-center justify-center shadow-inner overflow-hidden">
            <img src={flagUrl} alt={teamName} className="w-10 h-7 object-cover" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>{teamName}</h2>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Selección Nacional · {SECTION_LABELS[section]}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full lg:w-auto">
          {/* Navegación por secciones — mismas vistas separadas que el modo club */}
          <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] w-full md:w-auto shadow-sm">
            {(['SQUAD', 'TACTICS', 'SCHEDULE', 'STATS'] as NationalTeamSection[]).map(s => (
              <button
                key={s}
                onClick={() => navigateTo(s)}
                className={`flex-1 md:px-4 py-1.5 rounded-[1px] transition-all flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-tight ${section === s ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-[#1a2a1a] hover:bg-[#ccd9cc]'}`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {s === 'SQUAD' ? <Users size={13} /> : s === 'TACTICS' ? <ClipboardList size={13} /> : s === 'SCHEDULE' ? <Calendar size={13} /> : <Star size={13} />}
                <span className="hidden sm:inline">{SECTION_LABELS[s]}</span>
              </button>
            ))}
          </div>

          {isControlled && (
            <select
              value={teamId}
              onChange={event => changeNationalTeam(event.target.value)}
              aria-label="Cambiar selección dirigida"
              className="bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[9px] font-black uppercase text-slate-700 outline-none focus:border-[#3a4a3a]"
            >
              {nationalManager?.nationalTeams?.map((teamOption: any) => (
                <option key={teamOption.id} value={teamOption.id}>{teamOption.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {offerNotice && (
        <div className="shrink-0 flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-sm px-3 py-2 text-[10px] font-bold text-amber-900">
          <span>{offerNotice}</span>
          {nationalManager?.getPendingNationalTeamOffer() && <div className="flex gap-2"><button onClick={() => resolveTeamOffer(true)} className="px-2 py-1 bg-emerald-700 text-white rounded-sm uppercase text-[9px]">Aceptar</button><button onClick={() => resolveTeamOffer(false)} className="px-2 py-1 bg-slate-300 text-slate-800 rounded-sm uppercase text-[9px]">Rechazar</button></div>}
        </div>
      )}

      {/* ─── SECCIÓN: PLANTEL ─────────────────────────────────────────────── */}
      {section === 'SQUAD' && (
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col gap-2">
          <section className="shrink-0 bg-[#eef3ee] border border-[#a0b0a0] rounded-sm p-3 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={15} className={isControlled ? 'text-emerald-700' : 'text-slate-500'} />
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                    {isControlled ? 'Cargo de seleccionador activo' : 'Dirección nacional'}
                  </h3>
                  {isControlled && <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-sm">Bajo tu mando</span>}
                </div>
                <p className="text-[9px] text-slate-600 mt-1">
                  {isControlled ? `${controlledIds.length}/23 convocados · tus decisiones se aplican al simular partidos` : 'Asume el cargo para decidir convocatorias y planteamiento táctico.'}
                </p>
              </div>
              {!isControlled && (
                <FMButton onClick={assumeControl} className="flex items-center justify-center gap-2 text-[10px] uppercase">
                  <UserPlus size={13} /> Asumir selección
                </FMButton>
              )}
            </div>

            {isControlled && (
              <div className="mt-3 bg-white border border-[#c0ccc0] rounded-sm p-2">
                <div className="flex items-center justify-between border-b border-[#d4ddd4] pb-2 mb-2">
                  <span className="text-[9px] font-black uppercase text-slate-700">Convocatoria</span>
                  <span className={`text-[9px] font-black ${controlledIds.length >= 11 ? 'text-emerald-700' : 'text-red-700'}`}>{controlledIds.length}/23</span>
                </div>
                <div className="max-h-32 overflow-y-auto custom-scroll space-y-1">
                  {eligiblePlayers.map(player => {
                    const selected = selectedIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleConvocation(player.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-left rounded-sm border text-[9px] transition-colors ${selected ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <span className="truncate"><strong>{player.name}</strong> <span className="text-slate-500">· {getPositionLabel(player.primaryPosition || player.positions[0])}</span></span>
                        {selected ? <UserMinus size={12} /> : <UserPlus size={12} />}
                      </button>
                    );
                  })}
                </div>
                {controlledIds.length < 11 && <p className="text-[8px] text-red-700 font-bold mt-2">Convoca al menos 11 jugadores para que el motor use tus decisiones.</p>}
              </div>
            )}
          </section>

          {!isControlled && <div className="shrink-0 bg-slate-100 border border-slate-300 rounded-sm px-3 py-2 text-[9px] text-slate-600 flex items-center gap-2"><Lock size={12} /> La lista mostrada es automática. Asume la selección para gestionar convocatorias.</div>}

          {/* Filtro por posición */}
          <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] overflow-x-auto scrollbar-hide shrink-0 shadow-sm">
            {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-4 py-1.5 rounded-[1px] text-[9px] font-bold uppercase whitespace-nowrap transition-colors ${selectedPosition === pos ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {pos === 'ALL' ? 'Todos' : pos} ({pos === 'ALL' ? squadPlayers.length : getStatsByPosition(pos)})
              </button>
            ))}
          </div>

          {/* Lista de convocados — mismo FMBox/FMTable que la Plantilla de club */}
          <div className="flex-1 min-h-0">
            <FMBox title={`Convocatoria (${filteredPlayers.length})`} className="h-full" noPadding>
              <div className="hidden md:block h-full overflow-hidden">
                <FMTable headers={desktopHeaders} colWidths={desktopWidths} onHeaderClick={handleHeaderClick}>
                  {sortedPlayers.map((player, idx) => {
                    const club = world.getClub(player.clubId);
                    const posLabel = getPositionLabel(player.primaryPosition || player.positions[0]);
                    return (
                      <tr
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className={`cursor-pointer transition-colors border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] ${selectedIds.has(player.id) ? 'font-bold' : ''}`}
                      >
                        <FMTableCell className="text-center text-slate-400 font-bold">{squadNumber(player.id)}</FMTableCell>
                        <FMTableCell className="text-slate-900">
                          <div className="flex items-center min-w-0">
                            <img src={getFlagUrl(player.nationality)} alt={player.nationality} className="w-4 h-3 object-cover shadow-sm rounded-[1px] mr-2 shrink-0 border border-slate-300" />
                            <span className="truncate">{player.name}</span>
                            <PlayerStatusIcons player={player} />
                          </div>
                        </FMTableCell>
                        <FMTableCell className="text-center">
                          <span className={`px-2 py-0.5 rounded-[1px] text-[8px] font-bold uppercase ${getPositionColor(posLabel)}`}>{posLabel}</span>
                        </FMTableCell>
                        <FMTableCell className="text-center font-bold" isNumber>{player.age}</FMTableCell>
                        <FMTableCell className="text-center"><span className="text-[9px] text-slate-600 font-bold">{club?.shortName || '-'}</span></FMTableCell>
                        <FMTableCell className="text-center font-bold text-slate-700" isNumber>{player.seasonStats.appearances}</FMTableCell>
                        <FMTableCell className="text-center font-bold" isNumber>
                          <span className={player.seasonStats.goals > 0 ? 'text-green-700' : 'text-slate-400'}>{player.seasonStats.goals}</span>
                        </FMTableCell>
                        <FMTableCell className="text-center"><PlayerFormDots ratings={player.formRatings} /></FMTableCell>
                        <FMTableCell className="text-center font-bold" isNumber>
                          <span className={player.fitness < 70 ? 'text-red-600' : 'text-green-700'}>{Math.round(player.fitness)}%</span>
                        </FMTableCell>
                        <FMTableCell className="text-right font-black" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                      </tr>
                    );
                  })}
                  {sortedPlayers.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-slate-400 italic text-[10px] uppercase font-bold">No hay jugadores en esta posición</td></tr>
                  )}
                </FMTable>
              </div>

              <div className="md:hidden h-full overflow-hidden">
                <FMTable headers={mobileHeaders} colWidths={mobileWidths} onHeaderClick={handleHeaderClick}>
                  {sortedPlayers.map((player, idx) => (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`cursor-pointer transition-colors border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] ${selectedIds.has(player.id) ? 'font-bold shadow-[inset_4px_0_0_0_rgba(58,74,58,1)]' : ''}`}
                    >
                      <FMTableCell className="text-center text-slate-400 font-bold text-[9px] px-1">{squadNumber(player.id)}</FMTableCell>
                      <FMTableCell className="text-slate-900 px-2">
                        <div className="flex items-center min-w-0">
                          <img src={getFlagUrl(player.nationality)} alt={player.nationality} className="w-3 h-2 object-cover shadow-sm rounded-[1px] mr-1.5 shrink-0 border border-slate-300" />
                          <span className="truncate max-w-[100px] text-[10px]">{player.name}</span>
                          <PlayerStatusIcons player={player} />
                        </div>
                      </FMTableCell>
                      <FMTableCell className="text-center font-bold text-[10px]" isNumber>{player.age}</FMTableCell>
                      <FMTableCell className="text-center font-bold text-[10px]" isNumber>
                        <span className={player.fitness < 70 ? 'text-red-600' : 'text-green-700'}>{Math.round(player.fitness)}%</span>
                      </FMTableCell>
                      <FMTableCell className="text-right font-black text-[10px]" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                    </tr>
                  ))}
                  {sortedPlayers.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic text-[10px] uppercase font-bold">No hay jugadores en esta posición</td></tr>
                  )}
                </FMTable>
              </div>
            </FMBox>
          </div>
        </div>
      )}

      {/* ─── SECCIÓN: TÁCTICAS ────────────────────────────────────────────── */}
      {section === 'TACTICS' && (
        <div className="flex-1 overflow-y-auto custom-scroll">
          <div className="max-w-4xl mx-auto space-y-3">
            <FMBox title={`Planteamiento · ${TACTIC_PRESETS.find(t => t.id === formationDraft)?.name || formationDraft}`}>
              {!isControlled ? (
                <div className="p-6 text-center">
                  <Lock size={16} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Asume la selección desde la pestaña Plantel para definir el once y el planteamiento táctico.</p>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {/* Selector de formación */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-600 mb-1.5 block">Formación</span>
                    <div className="flex flex-wrap gap-1.5">
                      {TACTIC_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleFormationChange(preset.id)}
                          className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all border ${formationDraft === preset.id ? 'bg-[#3a4a3a] text-white border-[#3a4a3a] shadow-sm' : 'bg-white text-slate-700 border-[#a0b0a0] hover:bg-[#e8f0e8]'}`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pizarra editable */}
                  <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-h-[460px] rounded-sm overflow-hidden border-2 border-[#3a4a3a] shadow-inner" style={{ background: 'linear-gradient(160deg, #1c3d24 0%, #2c5e33 45%, #1f4a28 100%)' }}>
                    {/* Líneas de cancha */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/15" />
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/15" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/15" />
                    <div className="absolute bottom-0 inset-x-0 h-12 border border-white/15 border-b-0" />
                    <div className="absolute top-0 inset-x-0 h-12 border border-white/15 border-t-0" />

                    {/* Slots de la formación */}
                    {(() => {
                      const preset = TACTIC_PRESETS.find(t => t.id === formationDraft) || TACTIC_PRESETS[0];
                      return preset.positions.map((slot, i) => {
                        const coords = NT_SLOT_COORDS[slot] || { t: 50, l: 50 };
                        const playerId = lineupDraft[i] || null;
                        const player = playerId ? world.players.find(p => p.id === playerId) : undefined;
                        const isCaptain = playerId === captainDraft;
                        const isSelected = pickSlot === i;
                        return (
                          <div
                            key={`${slot}-${i}`}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer select-none ${isSelected ? 'ring-2 ring-amber-300 rounded-full' : ''}`}
                            style={{ top: `${coords.t}%`, left: `${coords.l}%` }}
                            onClick={() => setPickSlot(i)}
                          >
                            {player ? (
                              <>
                                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center font-black text-[9px] sm:text-[11px] shadow-lg transition-transform hover:scale-110 ${player.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-emerald-600 text-white border-emerald-300'}`}>
                                  {SLOT_CONFIG[slot]?.abbr || 'JUG'}
                                  {isCaptain && <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-300 border border-amber-600 flex items-center justify-center text-[8px] text-amber-900">C</span>}
                                </div>
                                <span className="px-1 py-px bg-black/70 text-white text-[6px] sm:text-[7px] font-black uppercase rounded-sm leading-none truncate max-w-[72px] shadow-sm">{player.name}</span>
                              </>
                            ) : (
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed flex items-center justify-center font-black text-[8px] sm:text-[9px] uppercase text-white/70 transition-all hover:scale-110 ${isSelected ? 'ring-2 ring-amber-300' : ''}`}>
                                {SLOT_CONFIG[slot]?.abbr || 'JUG'}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <p className="text-[8px] text-slate-500 italic uppercase font-bold">Toca un casillero para elegir al jugador de la convocatoria. La C marca al capitán.</p>

                  {/* Instrucciones tácticas (sliders) */}
                  {tacticDraft && (
                    <div className="border-t border-[#a0b0a0]/40 pt-3 space-y-3">
                      <span className="text-[9px] font-black uppercase text-slate-600 block">Instrucciones de equipo</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="block">
                          <span className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-600 mb-1">Mentalidad <b className="w-5 text-right text-slate-900">{tacticDraft.mentality}</b></span>
                          <input type="range" min="1" max="20" value={tacticDraft.mentality} onChange={e => setTacticDraft({ ...tacticDraft, mentality: Number(e.target.value) })} className="w-full accent-emerald-700" />
                        </label>
                        <label className="block">
                          <span className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-600 mb-1">Presión <b className="w-5 text-right text-slate-900">{tacticDraft.closingDown}</b></span>
                          <input type="range" min="1" max="20" value={tacticDraft.closingDown} onChange={e => setTacticDraft({ ...tacticDraft, closingDown: Number(e.target.value) })} className="w-full accent-emerald-700" />
                        </label>
                        <label className="block">
                          <span className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-600 mb-1">Pase <b className="w-5 text-right text-slate-900">{tacticDraft.passingStyle}</b></span>
                          <input type="range" min="1" max="20" value={tacticDraft.passingStyle} onChange={e => setTacticDraft({ ...tacticDraft, passingStyle: Number(e.target.value) })} className="w-full accent-emerald-700" />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select value={tacticDraft.focusPassing} onChange={e => setTacticDraft({ ...tacticDraft, focusPassing: e.target.value as TacticSettings['focusPassing'] })} className="bg-slate-50 border border-slate-300 rounded-sm px-1.5 py-1 text-[9px] font-bold uppercase">
                          <option value="MIXED">Pase mixto</option><option value="LEFT">Banda izquierda</option><option value="CENTER">Por dentro</option><option value="RIGHT">Banda derecha</option>
                        </select>
                        <select value={tacticDraft.counterAttack ? 'YES' : 'NO'} onChange={e => setTacticDraft({ ...tacticDraft, counterAttack: e.target.value === 'YES' })} className="bg-slate-50 border border-slate-300 rounded-sm px-1.5 py-1 text-[9px] font-bold uppercase">
                          <option value="NO">Sin contraataque</option><option value="YES">Contraataque</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <FMButton onClick={saveLineup} className="w-full"><Save size={13} /> Guardar once y formación</FMButton>
                    {tacticDraft && <FMButton onClick={saveTactic} variant="secondary" className="w-full"><Save size={13} /> Guardar instrucciones</FMButton>}
                  </div>
                </div>
              )}
            </FMBox>

            {/* Once actual (si controlada muestra el editable; si no, el probable automático) */}
            {!isControlled && (
              <FMBox title="Once probable (automático)" noPadding>
                <FMTable headers={['Pos', 'Nombre', 'Club', 'CA']} colWidths={['45px', 'auto', '80px', '40px']}>
                  {[...squadPlayers]
                    .sort((a, b) => b.currentAbility - a.currentAbility)
                    .slice(0, 11)
                    .map((p, i) => (
                      <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                        <FMTableCell className="text-center"><span className={`px-2 py-0.5 rounded-[1px] text-[8px] font-bold uppercase ${getPositionColor(getPositionLabel(p.primaryPosition || p.positions[0]))}`}>{getPositionLabel(p.primaryPosition || p.positions[0])}</span></FMTableCell>
                        <FMTableCell className="text-slate-900">{p.name}</FMTableCell>
                        <FMTableCell className="text-center"><span className="text-[9px] text-slate-600 font-bold">{world.getClub(p.clubId)?.shortName || '-'}</span></FMTableCell>
                        <FMTableCell className="text-center font-black text-slate-700" isNumber>{p.currentAbility}</FMTableCell>
                      </tr>
                    ))}
                </FMTable>
              </FMBox>
            )}
            {isControlled && (
              <FMBox title={`Once titular · ${lineupDraft.filter(Boolean).length}/11`} noPadding>
                <FMTable headers={['Pos', 'Nombre', 'Club', 'CA']} colWidths={['45px', 'auto', '80px', '40px']}>
                  {lineupDraft.map((pid, i) => {
                    if (!pid) return null;
                    const p = world.players.find(pl => pl.id === pid);
                    if (!p) return null;
                    const isCaptain = pid === captainDraft;
                    return (
                      <tr key={`${pid}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                        <FMTableCell className="text-center">
                          <span className={`px-2 py-0.5 rounded-[1px] text-[8px] font-bold uppercase ${getPositionColor(getPositionLabel(p.primaryPosition || p.positions[0]))}`}>{getPositionLabel(p.primaryPosition || p.positions[0])}</span>
                        </FMTableCell>
                        <FMTableCell className="text-slate-900">
                          <span className="flex items-center gap-1.5">
                            {isCaptain && <span className="w-3.5 h-3.5 rounded-full bg-amber-300 border border-amber-600 flex items-center justify-center text-[8px] text-amber-900 font-black">C</span>}
                            <span className="truncate">{p.name}</span>
                          </span>
                        </FMTableCell>
                        <FMTableCell className="text-center"><span className="text-[9px] text-slate-600 font-bold">{world.getClub(p.clubId)?.shortName || '-'}</span></FMTableCell>
                        <FMTableCell className="text-center font-black text-slate-700" isNumber>{p.currentAbility}</FMTableCell>
                      </tr>
                    );
                  })}
                </FMTable>
              </FMBox>
            )}
          </div>
        </div>
      )}

      {/* Modal de selección de jugador para la pizarra */}
      {isControlled && pickSlot !== null && (
        <div className="fixed inset-0 z-[900] bg-black/70 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm" onClick={() => setPickSlot(null)}>
          <div className="bg-[#e8ece8] border-2 border-[#a0b0a0] rounded-sm shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ fontFamily: 'Verdana, sans-serif' }}>
            <header className="px-4 py-3 border-b border-[#a0b0a0] flex justify-between items-center shrink-0" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider italic">Puesto: {(() => {
                  const preset = TACTIC_PRESETS.find(t => t.id === formationDraft) || TACTIC_PRESETS[0];
                  return SLOT_CONFIG[preset.positions[pickSlot]]?.abbr || 'JUG';
                })()}</h3>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Elige jugador de la convocatoria · toca la estrella para nombrar capitán</p>
              </div>
              <button onClick={() => setPickSlot(null)} className="bg-black/10 hover:bg-black/20 rounded-sm p-2 transition-colors">
                <X size={16} className="text-slate-800" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
              {(() => {
                const preset = TACTIC_PRESETS.find(t => t.id === formationDraft) || TACTIC_PRESETS[0];
                const slot = preset.positions[pickSlot];
                const line = SLOT_CONFIG[slot]?.line || 'MID';
                const currentId = lineupDraft[pickSlot];
                const ranked = [...squadPlayers]
                  .sort((a, b) => (lineFit(b, line) + b.currentAbility / 20) - (lineFit(a, line) + a.currentAbility / 20));
                return ranked.map(p => {
                  const usedElsewhere = lineupDraft.includes(p.id) && lineupDraft.indexOf(p.id) !== pickSlot;
                  const isCurrent = p.id === currentId;
                  const isCaptain = p.id === captainDraft;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAssignPlayer(pickSlot, p.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') { handleAssignPlayer(pickSlot, p.id); } }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-sm border cursor-pointer text-left transition-colors ${isCurrent ? 'bg-emerald-100 border-emerald-400' : usedElsewhere ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-white border-[#a0b0a0] hover:bg-[#f2f7f2]'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 border ${p.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-slate-200 border-slate-400 text-slate-700'}`}>
                        {lineFit(p, line) >= 20 ? '★' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-900 truncate">{p.name}</span>
                          {isCaptain && <span className="w-3.5 h-3.5 rounded-full bg-amber-300 border border-amber-600 flex items-center justify-center text-[8px] text-amber-900 font-black shrink-0">C</span>}
                        </div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">{getPositionLabel(p.primaryPosition || p.positions[0])} · {world.getClub(p.clubId)?.shortName || '-'} · CA {p.currentAbility}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setCaptainDraft(isCaptain ? null : p.id); }}
                        className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all shrink-0 ${isCaptain ? 'bg-amber-300 border-amber-500 text-amber-900' : 'bg-white border-slate-300 text-slate-300 hover:text-amber-500 hover:border-amber-400'}`}
                        title={isCaptain ? 'Quitar capitanía' : 'Nombrar capitán'}
                        aria-label={isCaptain ? `Quitar capitanía a ${p.name}` : `Nombrar capitán a ${p.name}`}
                      >
                        <Star size={12} className={isCaptain ? 'fill-amber-900' : ''} />
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECCIÓN: PARTIDOS ────────────────────────────────────────────── */}
      {section === 'SCHEDULE' && (
        <FMBox title="Calendario de Partidos" className="flex-1" noPadding>
          <div className="h-full overflow-y-auto custom-scroll bg-white">
            {teamFixtures.length === 0 ? (
              <div className="p-20 text-slate-400 text-center italic text-[10px] uppercase font-bold tracking-widest">No hay partidos programados</div>
            ) : (
              <table className="w-full border-collapse">
                <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  {teamFixtures.map((f, idx) => {
                    const homeName = getTeamName(f.homeTeamId);
                    const awayName = getTeamName(f.awayTeamId);
                    const isHome = f.homeTeamId === teamId;
                    const compName = world.competitions.find(c => c.id === f.competitionId)?.name || f.competitionId;

                    return (
                      <tr key={f.id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                        <td className="px-3 py-3 text-slate-500 font-mono text-[10px] w-24">
                          <div className="flex flex-col">
                            <span>{f.date.toLocaleDateString()}</span>
                            <span className="text-[8px] text-slate-400 uppercase">{compName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={`font-bold ${isHome ? 'text-blue-800' : ''}`}>{homeName}</span>
                        </td>
                        <td className="px-3 py-3 text-center w-16">
                          <div className="bg-[#bcc8bc] border border-[#a0b0a0] rounded-sm py-1 font-black text-[10px] shadow-inner text-[#1a1a1a]">
                            {f.played ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-left">
                          <span className={`font-bold ${!isHome ? 'text-blue-800' : ''}`}>{awayName}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </FMBox>
      )}

      {/* ─── SECCIÓN: ESTADÍSTICAS ────────────────────────────────────────── */}
      {section === 'STATS' && (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3 custom-scroll">
          <FMBox title="Más Goles" noPadding>
            <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['30px', 'auto', '40px']}>
              {squadPlayers
                .filter(p => p.seasonStats.goals > 0)
                .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)
                .slice(0, 10)
                .map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                    <FMTableCell className="text-center font-bold text-slate-400">{i + 1}</FMTableCell>
                    <FMTableCell>
                      <div className="flex flex-col">
                        <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                      </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-black text-green-700" isNumber>{p.seasonStats.goals}</FMTableCell>
                  </tr>
                ))}
              {squadPlayers.filter(p => p.seasonStats.goals > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
            </FMTable>
          </FMBox>

          <FMBox title="Más Asistencias" noPadding>
            <FMTable headers={['#', 'Nombre', 'Asist']} colWidths={['30px', 'auto', '40px']}>
              {squadPlayers
                .filter(p => p.seasonStats.assists > 0)
                .sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)
                .slice(0, 10)
                .map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                    <FMTableCell className="text-center font-bold text-slate-400">{i + 1}</FMTableCell>
                    <FMTableCell>
                      <div className="flex flex-col">
                        <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                      </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-black text-blue-700" isNumber>{p.seasonStats.assists}</FMTableCell>
                  </tr>
                ))}
              {squadPlayers.filter(p => p.seasonStats.assists > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
            </FMTable>
          </FMBox>

          <FMBox title="Mejor Valoración" noPadding headerRight={
            <span className="text-[8px] font-black uppercase text-slate-500 italic">media real por partido</span>
          }>
            <FMTable headers={['#', 'Nombre', 'Media']} colWidths={['30px', 'auto', '40px']}>
              {squadPlayers
                .filter(p => p.seasonStats.appearances > 0)
                .sort((a, b) => (b.seasonStats.totalRating / b.seasonStats.appearances) - (a.seasonStats.totalRating / a.seasonStats.appearances))
                .slice(0, 10)
                .map((p, i) => {
                  const avg = (p.seasonStats.totalRating / p.seasonStats.appearances).toFixed(2);
                  return (
                    <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                      <FMTableCell className="text-center font-bold text-slate-400">{i + 1}</FMTableCell>
                      <FMTableCell>
                        <div className="flex flex-col">
                          <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                        </div>
                      </FMTableCell>
                      <FMTableCell className="text-center font-black text-amber-700" isNumber>{avg}</FMTableCell>
                    </tr>
                  );
                })}
              {squadPlayers.filter(p => p.seasonStats.appearances > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
            </FMTable>
          </FMBox>
        </div>
      )}
    </div>
  );
};
