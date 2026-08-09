import { world } from './worldManager';
import { getAssistantStaff, getFitnessCoach, getSportingDirector } from './staffAdviceService';

export type TriggerContext = {
  currentView: string;
  currentDate: Date;
  userClubId?: string;
  nextFixture?: import('../types').Fixture;
};

export function checkAssistantTrigger(ctx: TriggerContext): boolean {
  if (ctx.currentView !== 'SENIOR_TACTICS' && ctx.currentView !== 'PRE_MATCH') return false;
  const club = ctx.userClubId ? world.getClub(ctx.userClubId) : null;
  if (!club) return false;
  const assistant = getAssistantStaff(ctx.userClubId);
  if (!assistant) return false;
  const nextFixture = ctx.nextFixture;
  if (!nextFixture) return false;
  if (ctx.currentView === 'PRE_MATCH') return true;
  const daysUntil = (nextFixture.date.getTime() - ctx.currentDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil <= 3 && daysUntil >= 0;
}

export function checkFitnessTrigger(ctx: TriggerContext): boolean {
  if (ctx.currentView !== 'TRAINING' && ctx.currentView !== 'STAFF') return false;
  const club = ctx.userClubId ? world.getClub(ctx.userClubId) : null;
  if (!club) return false;
  const coach = getFitnessCoach(ctx.userClubId);
  if (!coach) return false;
  const players = world.getPlayersByClub(ctx.userClubId).filter(p => p.squad === 'SENIOR');
  if (players.length === 0) return false;
  const avgFitness = players.reduce((s, p) => s + p.fitness, 0) / players.length;
  const isPreSeason = ctx.currentDate.getMonth() >= 6 && ctx.currentDate.getMonth() <= 7;
  return isPreSeason || avgFitness < 75;
}

export function checkSportingDirectorTrigger(ctx: TriggerContext): boolean {
  if (ctx.currentView !== 'MARKET' && ctx.currentView !== 'NEGOTIATIONS') return false;
  const club = ctx.userClubId ? world.getClub(ctx.userClubId) : null;
  if (!club) return false;
  const director = getSportingDirector(ctx.userClubId);
  if (!director) return false;
  const now = ctx.currentDate;
  const month = now.getMonth();
  const day = now.getDate();
  const isTransferWindow = (month === 0 || month === 6) || (month === 7 && day <= 15);
  return isTransferWindow;
}
