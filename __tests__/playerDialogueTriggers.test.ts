import { describe, it, expect, vi } from 'vitest';

const mockPlayer = (overrides: any = {}) => ({
  id: 'p1',
  name: 'Test Player',
  squad: 'SENIOR' as const,
  injury: false,
  isStarter: true,
  formRatings: [5, 6, 7],
  contractExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  transferRequestReason: undefined,
  playerTensions: undefined,
  pendingDialogue: undefined as string | undefined,
  personality: 'PROFESSIONAL' as any,
  ...overrides,
});

const mockWorld = {
  getPlayersByClub: vi.fn(() => []),
  getClub: vi.fn(() => ({ id: 'club1', name: 'Test Club' })),
  getAssistantStaff: vi.fn(() => ({ id: 'staff1', name: 'Assistant', role: 'ASSISTANT_MANAGER' })),
  getFitnessCoach: vi.fn(() => ({ id: 'staff2', name: 'Coach', role: 'FITNESS_COACH' })),
  getSportingDirector: vi.fn(() => ({ id: 'staff3', name: 'Director', role: 'SPORTING_DIRECTOR' })),
};

vi.mock('../services/worldManager', () => ({
  world: mockWorld,
}));

describe('playerDialogueTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects minutes discontent for non-starters with form history', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p1', isStarter: false, formRatings: [5, 6, 7] })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('MINUTES_DISCONTENT');
  });

  it('does not trigger minutes discontent for starters', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p1', isStarter: true, formRatings: [5, 6, 7] })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(0);
  });

  it('detects contract expiring within 6 months', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    const soonExpiry = new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000);
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p2', contractExpiry: soonExpiry })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('CONTRACT_EXPIRING');
  });

  it('does not trigger for contracts expiring after 6 months', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    const farExpiry = new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000);
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p2', contractExpiry: farExpiry })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(0);
  });

  it('detects transfer rumors', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    const farExpiry = new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000);
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p3', transferRequestReason: 'Wants to leave', contractExpiry: farExpiry })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('TRANSFER_RUMOR');
  });

  it('detects dressing room conflicts', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p4', playerTensions: { 'p5': 80 } })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('DRESSING_ROOM_CONFLICT');
  });

  it('does not trigger for low tensions', async () => {
    const { detectPlayerDialogueTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p4', playerTensions: { 'p5': 30 } })]);
    const triggered = detectPlayerDialogueTriggers('club1');
    expect(triggered).toHaveLength(0);
  });

  it('detects pre-match chat for starters with good fitness', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p5', isStarter: true, fitness: 85 })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'PRE_MATCH');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('PRE_MATCH_CHAT');
  });

  it('does not trigger pre-match chat for bench players', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p5', isStarter: false, fitness: 85 })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'PRE_MATCH');
    expect(triggered).toHaveLength(0);
  });

  it('detects post-match warning for low ratings', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p6', formRatings: [3, 3, 3] })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'POST_MATCH');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('POST_MATCH_WARNING');
  });

  it('detects post-match praise for goal milestones', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p6', formRatings: [8, 8, 8], careerStats: { totalGoals: 50 } })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'POST_MATCH');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('POST_MATCH_PRAISE');
  });

  it('detects contract renewal for mid-term expiries', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    const midExpiry = new Date(Date.now() + 9 * 30 * 24 * 60 * 60 * 1000);
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p7', contractExpiry: midExpiry })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'TRAINING');
    expect(triggered).toHaveLength(1);
    expect(triggered[0].pendingDialogue).toBe('CONTRACT_RENEWAL');
  });

  it('does not trigger contract renewal for far expiries', async () => {
    const { detectManagerInitiatedTriggers } = await import('../services/playerDialogueTriggers');
    const farExpiry = new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000);
    mockWorld.getPlayersByClub.mockReturnValue([mockPlayer({ id: 'p7', contractExpiry: farExpiry })]);
    const triggered = detectManagerInitiatedTriggers('club1', 'TRAINING');
    expect(triggered).toHaveLength(0);
  });

  it('clears pending dialogue for a player via world', async () => {
    const { clearPlayerDialogue } = await import('../services/playerDialogueTriggers');
    const player = mockPlayer({ id: 'p7', pendingDialogue: 'MINUTES_DISCONTENT' });
    mockWorld.getPlayer = vi.fn(() => player);
    clearPlayerDialogue('p7');
    expect(player.pendingDialogue).toBeUndefined();
  });

  it('does not crash when clearing non-existent player', async () => {
    const { clearPlayerDialogue } = await import('../services/playerDialogueTriggers');
    mockWorld.getPlayer = vi.fn(() => null);
    expect(() => clearPlayerDialogue('nonexistent')).not.toThrow();
  });
});
