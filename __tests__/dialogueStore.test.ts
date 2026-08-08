import { describe, it, expect, beforeEach } from 'vitest';
import { useDialogueStore } from '../stores/dialogueStore';

describe('dialogueStore', () => {
  beforeEach(() => {
    useDialogueStore.setState({
      kind: null,
      phase: 'opening',
      selection: null,
      result: null,
      closingPhrase: null,
      data: null,
      playerRelationship: 0,
    });
  });

  it('opens a dialogue and advances through phases', () => {
    const { open, advance, close } = useDialogueStore.getState();

    open('ASSISTANT', { clubId: 'club1' });
    expect(useDialogueStore.getState().kind).toBe('ASSISTANT');
    expect(useDialogueStore.getState().phase).toBe('opening');

    advance();
    expect(useDialogueStore.getState().phase).toBe('bubble');

    advance();
    expect(useDialogueStore.getState().phase).toBe('options');

    advance();
    expect(useDialogueStore.getState().phase).toBe('result');

    advance();
    expect(useDialogueStore.getState().phase).toBe('closing');

    close();
    expect(useDialogueStore.getState().kind).toBeNull();
  });

  it('stores selection and result', () => {
    const { open, select, setResult } = useDialogueStore.getState();

    open('PLAYER_DIALOG', { clubId: 'club1', playerId: 'player1', initiatedBy: 'PLAYER', context: 'MINUTES_DISCONTENT' });
    select('EMPATICO');
    expect(useDialogueStore.getState().selection).toBe('EMPATICO');

    setResult('Te escucha con atención.');
    expect(useDialogueStore.getState().result).toBe('Te escucha con atención.');
    expect(useDialogueStore.getState().phase).toBe('result');
  });

  it('tracks player relationship', () => {
    const { open, setPlayerRelationship } = useDialogueStore.getState();

    open('PLAYER_DIALOG', { clubId: 'club1', playerId: 'player1' });
    setPlayerRelationship(0.5);
    expect(useDialogueStore.getState().playerRelationship).toBe(0.5);
  });
});
