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
