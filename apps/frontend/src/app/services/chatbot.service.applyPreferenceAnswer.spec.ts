import { of } from 'rxjs';
import { ChatbotService } from './chatbot.service';
import { UserService } from './user.service';
import { PreferenceAnswer } from '../interfaces/chat-profile.types';

/**
 * applyPreferenceAnswer is the single save-routing rule shared by the
 * chatbot's ChatProfilePanel and Mi GuíaTV's assistant-preferences surface
 * (see both call sites). These tests pin down the two rules that used to
 * live duplicated inline in AIChatbotComponent.onPreferenceAnswer:
 *  - a profile-target answer always goes through UserService, merging with
 *    whatever assistant memory already knows for every field except the one
 *    just answered;
 *  - a community answer is never silently skipped, even when it clears the
 *    preference (falsy value) — the previous inline version treated "no
 *    community selected" as "nothing to save" and never called the backend.
 */
describe('ChatbotService.applyPreferenceAnswer', () => {
  function buildService(userService: Partial<UserService>) {
    const httpStub = {} as any;
    const ngZoneStub = { run: (fn: () => void) => fn() } as any;
    const fullUserService = {
      authState$: of('unauthenticated'),
      getProfileSnapshot: () => ({ preferredPlatforms: [], favoriteGenres: [] } as any),
      ...userService,
    } as UserService;
    return new ChatbotService(httpStub, fullUserService, ngZoneStub);
  }

  it('routes a profile-target answer through UserService.saveGenrePreferences', () => {
    const calls: unknown[] = [];
    const service = buildService({
      saveGenrePreferences: (genres: string[], platforms: string[]) => {
        calls.push({ genres, platforms });
        return of(true);
      },
    });

    const answer: PreferenceAnswer = {
      key: 'preferredPlatforms',
      target: 'profile',
      field: 'preferredPlatforms',
      values: ['Max', 'Movistar+'],
    };

    let saved: boolean | undefined;
    service.applyPreferenceAnswer(answer, ['Netflix'], ['Series']).subscribe((value) => (saved = value));

    expect(saved).toBe(true);
    expect(calls).toEqual([{ genres: ['Series'], platforms: ['Max', 'Movistar+'] }]);
  });

  it('merges the profile genres/platforms not being answered with whatever assistant memory already has', () => {
    const calls: unknown[] = [];
    const service = buildService({
      saveGenrePreferences: (genres: string[], platforms: string[]) => {
        calls.push({ genres, platforms });
        return of(true);
      },
    });

    spyOn(service, 'fetchAssistantMemory').and.callThrough();
    (service as any).memorySubject.next({
      likedGenres: ['Documentales'],
      preferredPlatforms: ['Prime Video'],
    });

    const answer: PreferenceAnswer = {
      key: 'likedGenres',
      target: 'profile',
      field: 'likedGenres',
      values: ['Series', 'Cine'],
    };

    service.applyPreferenceAnswer(answer, ['Netflix'], ['Series']).subscribe();

    // Answering genres keeps profilePlatforms merged with memory's copy,
    // since the platforms question was not the one being answered here.
    expect(calls).toEqual([{ genres: ['Series', 'Cine'], platforms: ['Netflix', 'Prime Video'] }]);
  });

  it('never silently drops a community answer, even when it clears the preference', () => {
    const calls: unknown[] = [];
    const service = buildService({});
    spyOn(service, 'updateAssistantMemory').and.callFake((updates: Record<string, string[]>, community?: string | null) => {
      calls.push({ updates, community });
      return of({ preferredAutonomousCommunity: undefined } as any);
    });

    const answer: PreferenceAnswer = {
      key: 'preferredAutonomousCommunity',
      target: 'memory',
      values: [],
      community: null,
    };

    let saved: boolean | undefined;
    service.applyPreferenceAnswer(answer, [], []).subscribe((value) => (saved = value));

    expect(saved).toBe(true);
    expect(calls).toEqual([{ updates: {}, community: '' }]);
  });

  it('routes a memory-target array answer through updateAssistantMemory with the field as the update key', () => {
    const calls: unknown[] = [];
    const service = buildService({});
    spyOn(service, 'updateAssistantMemory').and.callFake((updates: Record<string, string[]>) => {
      calls.push(updates);
      return of({ negativeSignals: ['Terror'] } as any);
    });

    const answer: PreferenceAnswer = {
      key: 'negativeSignals',
      target: 'memory',
      field: 'negativeSignals',
      values: ['Terror'],
    };

    service.applyPreferenceAnswer(answer, [], []).subscribe();

    expect(calls).toEqual([{ negativeSignals: ['Terror'] }]);
  });
});
