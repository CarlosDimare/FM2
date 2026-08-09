import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DialogueSystem } from '../services/dialogueSystem';
import { DialogueType, DialogueTone } from '../types';

describe('DialogueSystem', () => {
  it('returns options for every dialogue type and tone', () => {
    const types: DialogueType[] = [
      'PRAISE_FORM', 'CRITICIZE_FORM', 'PRAISE_TRAINING', 'WARN_CONDUCT',
      'DEMAND_MORE', 'SET_CAPTAIN', 'CHANGE_POSITION', 'INDIVIDUAL_TRAINING_FOCUS',
      'THREATEN_TRANSFER', 'GRANT_CAPTANCY', 'ASSIGN_TRAINING', 'DELEGATE_MATCH',
      'REPRIMAND', 'PROMISE_RESOURCES', 'SCOUTING_FOCUS', 'PRESS_STATEMENT',
    ];

    for (const type of types) {
      const options = DialogueSystem.getTopicOptions(type);
      expect(options, `missing options for ${type}`).toBeDefined();
      for (const tone of ['MILD', 'MODERATE', 'AGGRESSIVE'] as DialogueTone[]) {
        const text = options[tone];
        expect(text, `missing ${tone} for ${type}`).toBeDefined();
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  it('does not return empty or whitespace-only options', () => {
    const types: DialogueType[] = [
      'PRAISE_FORM', 'CRITICIZE_FORM', 'PRAISE_TRAINING', 'WARN_CONDUCT',
      'DEMAND_MORE', 'SET_CAPTAIN', 'CHANGE_POSITION', 'INDIVIDUAL_TRAINING_FOCUS',
      'THREATEN_TRANSFER', 'GRANT_CAPTANCY', 'ASSIGN_TRAINING', 'DELEGATE_MATCH',
      'REPRIMAND', 'PROMISE_RESOURCES', 'SCOUTING_FOCUS', 'PRESS_STATEMENT',
    ];

    for (const type of types) {
      const options = DialogueSystem.getTopicOptions(type);
      for (const tone of ['MILD', 'MODERATE', 'AGGRESSIVE'] as DialogueTone[]) {
        const text = options[tone] || '';
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
