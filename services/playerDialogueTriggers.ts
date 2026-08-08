import { world } from './worldManager';
import { Player } from '../types';

export type PlayerDialogueMotive = 'MINUTES_DISCONTENT' | 'CONTRACT_EXPIRING' | 'TRANSFER_RUMOR' | 'DRESSING_ROOM_CONFLICT' | 'PRE_MATCH_CHAT' | 'POST_MATCH_PRAISE' | 'POST_MATCH_WARNING' | 'CONTRACT_RENEWAL';

export function detectPlayerDialogueTriggers(clubId: string): Player[] {
  const players = world.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR' && !p.injury);
  const triggered: Player[] = [];

  for (const player of players) {
    if (player.pendingDialogue) {
      triggered.push(player);
      continue;
    }

    const personality = player.personality || 'PROFESSIONAL';

    if (personality === 'LAZY') continue;

    if (!player.isStarter && player.formRatings.length >= 3) {
      player.pendingDialogue = 'MINUTES_DISCONTENT';
      triggered.push(player);
      continue;
    }

    const monthsUntilExpiry = (player.contractExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsUntilExpiry < 6) {
      player.pendingDialogue = 'CONTRACT_EXPIRING';
      triggered.push(player);
      continue;
    }

    if (player.transferRequestReason) {
      player.pendingDialogue = 'TRANSFER_RUMOR';
      triggered.push(player);
      continue;
    }

    if (player.playerTensions) {
      const highTensions = Object.entries(player.playerTensions).filter(([_, tension]) => tension > 60);
      if (highTensions.length > 0) {
        player.pendingDialogue = 'DRESSING_ROOM_CONFLICT';
        triggered.push(player);
        continue;
      }
    }
  }

  return triggered;
}

export function detectManagerInitiatedTriggers(clubId: string, context: 'PRE_MATCH' | 'POST_MATCH' | 'TRAINING'): Player[] {
  const players = world.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
  const triggered: Player[] = [];

  for (const player of players) {
    if (player.pendingDialogue) continue;

    if (context === 'PRE_MATCH') {
      if (player.isStarter && player.fitness >= 80) {
        player.pendingDialogue = 'PRE_MATCH_CHAT';
        triggered.push(player);
      }
    } else if (context === 'POST_MATCH') {
      const lastRating = player.formRatings[player.formRatings.length - 1];
      if (lastRating && lastRating < 4) {
        player.pendingDialogue = 'POST_MATCH_WARNING';
        triggered.push(player);
      } else if (player.careerStats?.totalGoals && player.careerStats.totalGoals % 50 === 0 && player.careerStats.totalGoals > 0) {
        player.pendingDialogue = 'POST_MATCH_PRAISE';
        triggered.push(player);
      }
    } else if (context === 'TRAINING') {
      const monthsUntilExpiry = (player.contractExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsUntilExpiry < 12 && monthsUntilExpiry >= 6) {
        player.pendingDialogue = 'CONTRACT_RENEWAL';
        triggered.push(player);
      }
    }
  }

  return triggered;
}

export function clearPlayerDialogue(playerId: string) {
  const player = world.getPlayer(playerId);
  if (player) {
    player.pendingDialogue = undefined;
  }
}
