import { world } from './worldManager';
import { Player } from '../types';

export type PlayerDialogueMotive = 'MINUTES_DISCONTENT' | 'CONTRACT_EXPIRING' | 'TRANSFER_RUMOR' | 'DRESSING_ROOM_CONFLICT';

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

export function clearPlayerDialogue(playerId: string) {
  const player = world.getPlayer(playerId);
  if (player) {
    player.pendingDialogue = undefined;
  }
}
