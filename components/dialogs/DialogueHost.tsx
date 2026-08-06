import React from 'react';
import { useDialogueStore } from '../../stores/dialogueStore';
import { AssistantAdviceDialog } from './AssistantAdviceDialog';
import { FitnessCoachDialog } from './FitnessCoachDialog';
import { TransferFolderDialog } from './TransferFolderDialog';

interface DialogueHostProps {
  onStartMatch?: () => void;
}

/**
 * Host global de diálogos de personajes. Se monta una sola vez en App.tsx
 * y decide qué diálogo renderizar según el estado del store (spec §6.1).
 */
export const DialogueHost: React.FC<DialogueHostProps> = ({ onStartMatch }) => {
  const dialog = useDialogueStore(s => s.dialog);

  if (dialog === 'ASSISTANT') {
    return <AssistantAdviceDialog onStartMatch={onStartMatch} />;
  }
  if (dialog === 'FITNESS') {
    return <FitnessCoachDialog />;
  }
  if (dialog === 'TRANSFERS') {
    return <TransferFolderDialog />;
  }
  return null;
};
