/**
 * Shared personalization-answer contract used by every surface that edits
 * assistant/profile preferences: the chatbot's ChatProfilePanel, Mi GuíaTV's
 * assistant-preferences surface, and ChatbotService's save routing. Moved out
 * of the chat-profile-panel component folder so it can be a genuine shared
 * facade instead of a component-owned type imported sideways by services and
 * other feature areas.
 */
export type PreferencePersistenceTarget = 'profile' | 'memory';

export type PreferenceQuestionKey =
  | 'preferredPlatforms'
  | 'likedGenres'
  | 'preferredViewingContexts'
  | 'preferredDurations'
  | 'favoriteFranchisesOrTitles'
  | 'preferredAutonomousCommunity'
  | 'negativeSignals';

export interface PreferenceOption {
  value: string;
  label: string;
}

export interface PreferenceQuestion {
  key: PreferenceQuestionKey;
  title: string;
  description: string;
  kind: 'multi' | 'single' | 'text-list';
  target: PreferencePersistenceTarget;
  field?: string;
  options: PreferenceOption[];
  optional?: boolean;
}

export interface PreferenceAnswer {
  key: PreferenceQuestionKey;
  target: PreferencePersistenceTarget;
  field?: string;
  values: string[];
  community?: string | null;
}
