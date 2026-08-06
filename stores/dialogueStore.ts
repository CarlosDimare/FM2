import { create } from 'zustand';

export type DialogKind = 'ASSISTANT' | 'FITNESS' | 'TRANSFERS';
export type DialogState = 'cerrado' | 'abriendo' | 'paso1' | 'paso2' | 'confirmando' | 'resultado' | 'cerrando';

export interface DialoguePayload {
  clubId: string;
  opponentId?: string;
  tacticId?: string;
  source?: 'PRE_MATCH' | 'TACTICS' | 'HOME' | 'TRAINING' | 'STAFF' | 'MARKET' | 'NEGOTIATIONS';
}

interface DialogueStore {
  dialog: DialogKind | null;
  estado: DialogState;
  paso: number;
  seleccion: string | null;
  resultado: string | null;
  data: DialoguePayload | null;

  open: (kind: DialogKind, data: DialoguePayload) => void;
  setPaso: (paso: number) => void;
  seleccionar: (id: string) => void;
  setResultado: (texto: string) => void;
  cerrar: () => void;
}

export const useDialogueStore = create<DialogueStore>((set) => ({
  dialog: null,
  estado: 'cerrado',
  paso: 1,
  seleccion: null,
  resultado: null,
  data: null,

  open: (dialog, data) => set({
    dialog,
    data,
    estado: 'paso1',
    paso: 1,
    seleccion: null,
    resultado: null,
  }),
  setPaso: (paso) => set({ paso, estado: paso === 1 ? 'paso1' : 'paso2' }),
  seleccionar: (id) => set({ seleccion: id }),
  setResultado: (resultado) => set({ resultado, estado: 'resultado' }),
  cerrar: () => set({ dialog: null, estado: 'cerrado', paso: 1, seleccion: null, resultado: null, data: null }),
}));
