import { create } from 'zustand';

export type DialogKind = 'ASSISTANT' | 'FITNESS' | 'TRANSFERS' | 'PLAYER_DIALOG';

export type DialoguePhase =
  | 'opening'
  | 'bubble'
  | 'options'
  | 'result'
  | 'closing';

export interface DialoguePayload {
  clubId: string;
  opponentId?: string;
  tacticId?: string;
  source?: 'PRE_MATCH' | 'TACTICS' | 'HOME' | 'TRAINING' | 'STAFF' | 'MARKET' | 'NEGOTIATIONS';
}

interface DialogueStore {
  kind: DialogKind | null;
  phase: DialoguePhase;
  selection: string | null;
  result: string | null;
  closingPhrase: string | null;
  data: DialoguePayload | null;

  open: (kind: DialogKind, data: DialoguePayload) => void;
  advance: () => void;
  select: (id: string) => void;
  setResult: (text: string) => void;
  setClosingPhrase: (phrase: string) => void;
  close: () => void;
}

export const useDialogueStore = create<DialogueStore>((set) => ({
  kind: null,
  phase: 'opening',
  selection: null,
  result: null,
  closingPhrase: null,
  data: null,

  open: (kind, data) => set({
    kind,
    data,
    phase: 'opening',
    selection: null,
    result: null,
    closingPhrase: null,
  }),
  advance: () => set((s) => {
    if (s.phase === 'opening') return { phase: 'bubble' };
    if (s.phase === 'bubble') return { phase: 'options' };
    if (s.phase === 'options') return { phase: 'result' };
    if (s.phase === 'result') return { phase: 'closing' };
    if (s.phase === 'closing') return { phase: 'opening' };
    return {};
  }),
  select: (id) => set({ selection: id }),
  setResult: (result) => set({ result, phase: 'result' }),
  setClosingPhrase: (closingPhrase) => set({ closingPhrase, phase: 'closing' }),
  close: () => set({ kind: null, phase: 'opening', selection: null, result: null, closingPhrase: null, data: null }),
}));
