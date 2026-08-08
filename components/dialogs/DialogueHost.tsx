import React from 'react';
import { useDialogueStore } from '../../stores/dialogueStore';
import { AssistantAdviceDialog } from './AssistantAdviceDialog';
import { FitnessCoachDialog } from './FitnessCoachDialog';
import { TransferFolderDialog } from './TransferFolderDialog';

interface DialogueHostProps {
  onStartMatch?: () => void;
}

export const DialogueHost: React.FC<DialogueHostProps> = ({ onStartMatch }) => {
  const kind = useDialogueStore(s => s.kind);

  if (kind === 'ASSISTANT') {
    return <AssistantAdviceDialog onStartMatch={onStartMatch} />;
  }
  if (kind === 'FITNESS') {
    return <FitnessCoachDialog />;
  }
  if (kind === 'TRANSFERS') {
    return <TransferFolderDialog />;
  }
  return null;
};
