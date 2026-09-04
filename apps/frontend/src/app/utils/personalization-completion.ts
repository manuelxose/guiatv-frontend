import { UserProfile } from '../interfaces/user.interface';
import { AssistantMemorySnapshot } from '../services/chatbot.service';

export interface PersonalizationCompletionItem {
  key: string;
  label: string;
  done: boolean;
}

export interface PersonalizationCompletion {
  items: PersonalizationCompletionItem[];
  done: number;
  total: number;
}

/**
 * Single source of truth for "how much of my recommendation personalization
 * have I filled in" — the same seven fields the Asistente tab's transparency
 * card shows (see AssistantPreferencesComponent.knowledgeGroups). Used by
 * both that tab's own counter and the Overview onboarding meter so the two
 * can never disagree on the same profile+memory pair. Every field is
 * optional; this only measures completion, it never blocks anything.
 */
export function computePersonalizationCompletion(
  profile: Pick<UserProfile, 'preferredPlatforms' | 'favoriteGenres'> | null | undefined,
  memory: AssistantMemorySnapshot | null | undefined
): PersonalizationCompletion {
  const items: PersonalizationCompletionItem[] = [
    { key: 'preferredPlatforms', label: 'Plataformas', done: (profile?.preferredPlatforms?.length || 0) > 0 },
    { key: 'favoriteGenres', label: 'Géneros', done: (profile?.favoriteGenres?.length || 0) > 0 },
    { key: 'preferredViewingContexts', label: 'Suele ver contenido', done: (memory?.preferredViewingContexts?.length || 0) > 0 },
    { key: 'preferredDurations', label: 'Duración preferida', done: (memory?.preferredDurations?.length || 0) > 0 },
    { key: 'favoriteFranchisesOrTitles', label: 'Títulos de referencia', done: (memory?.favoriteFranchisesOrTitles?.length || 0) > 0 },
    { key: 'preferredAutonomousCommunity', label: 'TV autonómica', done: Boolean(memory?.preferredAutonomousCommunity) },
    { key: 'negativeSignals', label: 'Prefiere evitar', done: (memory?.negativeSignals?.length || 0) > 0 },
  ];

  return {
    items,
    done: items.filter((item) => item.done).length,
    total: items.length,
  };
}
