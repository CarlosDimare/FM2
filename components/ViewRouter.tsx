import React from 'react';
import { Club, Player, Fixture, SquadType, PlayerMatchStats } from '../types';
import { world } from '../services/worldManager';
import { LifecycleManager } from '../services/lifecycleManager';
import { MatchSimulator } from '../services/engine';
import { generateMatchChronicle } from '../services/chronicleService';
import { getMatchSquad } from '../services/simulationService';
import { sendMatchNotification } from '../services/notifications';
import { useGameStore } from '../stores/gameStore';
import { useNavStore } from '../stores/navStore';

// Views
import { HomeView } from './views/HomeView';
import { LeagueRankingView } from './views/LeagueRankingView';
import { ExternalClubView } from './views/ExternalClubView';
import { NationalHomeView } from './views/NationalHomeView';
import { ScheduleView } from './views/ScheduleView';
import { InboxView } from './InboxView';
import { MediaView } from './MediaView';
import { ChronicleView } from './ChronicleView';
import { ManagerProfileView } from './ManagerProfileView';
import { LeagueTable } from './LeagueTable';
import { MarketView } from './MarketView';
import { SearchView } from './SearchView';
import { EconomyView } from './EconomyView';
import { NegotiationsView } from './NegotiationsView';
import { StaffView } from './StaffView';
import { TrainingView } from './TrainingView';
import { ScoutingView } from './ScoutingView';
import { BoardView } from './BoardView';
import { ClubReport } from './ClubReport';
import { PeopleHub } from './PeopleHub';
import { SquadView } from './SquadView';
import { TacticsView } from './TacticsView';
import { NationalTeamView } from './NationalTeamView';
import { TournamentHub } from './TournamentHub';
import { PressConferenceView } from './PressConferenceView';
import { PreMatchView } from './PreMatchView';
import { MatchView } from './MatchView';
import { HallOfFameView } from './HallOfFameView';
import { ClubsListView } from './ClubsListView';

interface ViewRouterProps {
  currentView: string;
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  nextFixture: Fixture | null;
  fixtures: Fixture[];
  currentDate: Date;
  viewLeagueId: string | null;
  viewSquadType: SquadType;
  viewExternalClub: Club | null;
  isInVacation: boolean;
  setView: (view: string) => void;
  setSelectedPlayer: (player: Player | null) => void;
  setViewExternalClub: (club: Club | null) => void;
  handlePlayerContextMenu: (e: React.MouseEvent, player: Player) => void;
  notify: () => void;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  currentView,
  userClub,
  selectedNationalTeamId,
  nextFixture,
  fixtures,
  currentDate,
  viewLeagueId,
  viewSquadType,
  viewExternalClub,
  isInVacation,
  setView,
  setSelectedPlayer,
  setViewExternalClub,
  handlePlayerContextMenu,
  notify,
}) => {
  if (!userClub && !selectedNationalTeamId) return null;

  // ─── National team views ─────────────────────────────────────────────
  if (currentView.startsWith('NT_')) {
    const body = currentView.replace(/^NT_/, '');
    const sectionMatch = body.match(/^(.*?)_(SQUAD|TACTICS|SCHEDULE|STATS)$/);
    const teamId = sectionMatch ? sectionMatch[1] : body;
    const section = (sectionMatch ? sectionMatch[2] : 'SQUAD') as 'SQUAD' | 'TACTICS' | 'SCHEDULE' | 'STATS';
    return <NationalTeamView teamId={teamId} section={section} />;
  }

  // ─── National-only (no club) ─────────────────────────────────────────
  if (!userClub && selectedNationalTeamId) {
    if (currentView === 'CHRONICLES') return <ChronicleView onBack={() => setView('HOME')} clubId={undefined} />;
    if (currentView === 'MANAGER_PROFILE') return <ManagerProfileView onBack={() => setView('HOME')} />;
    if (currentView === 'INBOX') return <InboxView setView={setView} />;
    if (currentView === 'MEDIA') return <MediaView onBack={() => setView('HOME')} />;
    return <NationalHomeView selectedNationalTeamId={selectedNationalTeamId} nextFixture={nextFixture} setView={setView} />;
  }

  // ─── Club views switch ───────────────────────────────────────────────
  switch (currentView) {
    case 'HOME':
      return <HomeView userClub={userClub} currentDate={currentDate} nextFixture={nextFixture} fixtures={fixtures} setView={setView} />;

    case 'INBOX':
      return <InboxView setView={setView} />;
    case 'MEDIA':
      return <MediaView onBack={() => setView('HOME')} />;
    case 'CHRONICLES':
      return <ChronicleView onBack={() => setView('HOME')} clubId={userClub.id} />;
    case 'MANAGER_PROFILE':
      return <ManagerProfileView onBack={() => setView('HOME')} />;

    case 'TABLE':
      return (
        <div className="p-2 h-full flex flex-col">
          <LeagueTable
            entries={world.getLeagueTable(viewLeagueId || userClub.leagueId, fixtures, viewSquadType)}
            userClubId={userClub.id}
            allLeagues={world.getLeagues()}
            currentLeagueId={viewLeagueId || userClub.leagueId}
            onLeagueChange={(id) => useNavStore.getState().setViewLeagueId(id)}
            currentSquadType={viewSquadType}
            onSquadTypeChange={(type) => useNavStore.getState().setViewSquadType(type)}
          />
        </div>
      );

    case 'MARKET':
      return <MarketView userClubId={userClub.id} onSelectPlayer={setSelectedPlayer} currentDate={currentDate} />;
    case 'SEARCH':
      return <SearchView onSelectPlayer={setSelectedPlayer} />;
    case 'NEGOTIATIONS':
      return <NegotiationsView userClubId={userClub.id} currentDate={currentDate} />;
    case 'ECONOMY':
      return <EconomyView club={userClub} />;
    case 'STAFF':
      return <StaffView staff={world.getStaffByClub(userClub.id)} club={userClub} />;
    case 'TRAINING':
      return <TrainingView club={userClub} players={world.getPlayersByClub(userClub.id)} staff={world.getStaffByClub(userClub.id)} />;
    case 'SCOUTING':
      return <ScoutingView clubId={userClub.id} onSelectPlayer={setSelectedPlayer} />;
    case 'BOARD':
      return <BoardView userClub={userClub} />;
    case 'HALL_OF_FAME':
      return <HallOfFameView onBack={() => setView('HOME')} />;
    case 'LEAGUE_RANKING':
      return <LeagueRankingView />;
    case 'CLUB_REPORT':
      return <ClubReport club={userClub} />;
    case 'PEOPLE_HUB':
      return <PeopleHub userClub={userClub || undefined} currentDate={currentDate} />;
    case 'CLUBS_LIST':
      return <ClubsListView onSelectClub={(c) => { setViewExternalClub(c); setView('EXTERNAL_CLUB'); }} />;

    case 'EXTERNAL_CLUB':
      if (viewExternalClub) {
        return <ExternalClubView viewExternalClub={viewExternalClub} currentDate={currentDate} onSelectPlayer={setSelectedPlayer} onBack={() => setView('CLUBS_LIST')} />;
      }
      return null;

    case 'PRESS_CONFERENCE_PRE': {
      if (isInVacation) {
        return <div className="p-8 text-center text-white/50 font-black uppercase">En vacaciones</div>;
      }
      const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
      const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
      if (nextFixture && homeClub && awayClub) {
        const opponent = homeClub.id === userClub.id ? awayClub : homeClub;
        return <PressConferenceView club={userClub} opponent={opponent} context="PRE_MATCH" onFinish={() => setView('MATCH')} />;
      }
      return <div className="p-8 text-center text-white/50 font-black uppercase">Error</div>;
    }

    case 'PRESS_CONFERENCE_POST': {
      if (isInVacation) {
        return <div className="p-8 text-center text-white/50 font-black uppercase">En vacaciones</div>;
      }
      const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
      const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
      if (nextFixture && homeClub && awayClub) {
        const opponent = homeClub.id === userClub.id ? awayClub : homeClub;
        return <PressConferenceView club={userClub} opponent={opponent} context="POST_MATCH" homeScore={nextFixture.homeScore} awayScore={nextFixture.awayScore} onFinish={() => { setView('HOME'); useGameStore.getState().updateNextFixture(fixtures, currentDate, userClub.id); }} />;
      }
      return <div className="p-8 text-center text-white/50 font-black uppercase">Error: Datos no disponibles</div>;
    }

    case 'PRE_MATCH': {
      const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
      const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
      if (nextFixture && homeClub && awayClub) {
        return <PreMatchView club={userClub} opponent={homeClub.id === userClub.id ? awayClub : homeClub} starters={world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR')} onStart={() => setView('PRESS_CONFERENCE_PRE')} onGoToTactics={() => setView('SENIOR_TACTICS')} />;
      }
      return <div className="p-8 text-center text-white/50 font-black uppercase">Error: Datos de partido no disponibles</div>;
    }

    case 'MATCH': {
      const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
      const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
      if (nextFixture && homeClub && awayClub) {
        return <MatchView
          userClubId={userClub.id}
          currentDate={currentDate}
          homeTeam={homeClub}
          awayTeam={awayClub}
          homePlayers={getMatchSquad(nextFixture.homeTeamId)}
          awayPlayers={getMatchSquad(nextFixture.awayTeamId)}
          onFinish={(h, a, stats: Record<string, PlayerMatchStats>, events) => {
            nextFixture.played = true;
            nextFixture.homeScore = h;
            nextFixture.awayScore = a;
            MatchSimulator.finalizeSeasonStats(
              world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.squad === 'SENIOR'),
              world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.squad === 'SENIOR'),
              stats, h, a, nextFixture.competitionId
            );
            LifecycleManager.processPostMatchSuspensions(
              nextFixture.homeTeamId,
              nextFixture.awayTeamId,
              Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === nextFixture.homeTeamId).length,
              Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === nextFixture.awayTeamId).length
            );
            MatchSimulator.processMatchInjuries(stats);
            world.processMatchDayIncome(nextFixture.homeTeamId, nextFixture.competitionId, currentDate);
            world.trackU21Minutes(nextFixture.homeTeamId, world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.squad === 'SENIOR'), stats, currentDate);
            world.trackU21Minutes(nextFixture.awayTeamId, world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.squad === 'SENIOR'), stats, currentDate);
            const userScore = homeClub.id === userClub.id ? h : a;
            const oppScore = homeClub.id === userClub.id ? a : h;
            useGameStore.getState().trackMatchResult(userScore, oppScore);
            world.updateManagerProfileMatch(userScore, oppScore);
            world.updateTacticalFamiliarity(userClub.id);
            world.updateClubRecords(nextFixture.homeTeamId, nextFixture.awayTeamId, h, a, currentDate, nextFixture.competitionId);
            generateMatchChronicle(nextFixture, h, a, stats, userClub.id, events);
            setView('PRESS_CONFERENCE_POST');
            notify();
          }}
        />;
      }
      return <div className="p-8 text-center text-white/50 font-black uppercase">Error: Datos de partido no disponibles</div>;
    }

    default:
      if (currentView.endsWith('_SQUAD')) {
        const type = currentView.split('_')[0] as SquadType;
        return <SquadView players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onSelectPlayer={setSelectedPlayer} onContextMenu={handlePlayerContextMenu} currentDate={currentDate} club={userClub} />;
      }
      if (currentView.endsWith('_TACTICS')) {
        const type = currentView.split('_')[0] as SquadType;
        return <TacticsView club={userClub} players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onContextMenu={handlePlayerContextMenu} />;
      }
      if (currentView.endsWith('_SCHEDULE')) {
        const type = currentView.split('_')[0] as SquadType;
        return <ScheduleView userClub={userClub} squadType={type} fixtures={fixtures} />;
      }
      if (currentView.startsWith('COMP_')) {
        const competition = world.competitions.find(c => c.id === currentView.replace('COMP_', ''));
        return competition ? <TournamentHub competition={competition} fixtures={fixtures} userClubId={userClub.id} /> : null;
      }
      return null;
  }
};
