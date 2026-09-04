import { SimpleChange, SimpleChanges } from '@angular/core';
import { ChatProfilePanelComponent } from './chat-profile-panel.component';
import { PreferenceAnswer } from '../../../interfaces/chat-profile.types';

describe('ChatProfilePanelComponent', () => {
  it('merges profile and memory values before emitting an internal profile answer', () => {
    const component = new ChatProfilePanelComponent();
    component.profilePlatforms = ['Netflix'];
    component.memory = {
      likedGenres: [],
      dislikedGenres: [],
      preferredPlatforms: ['Prime Video', 'Netflix'],
      avoidedPlatforms: [],
      preferredDurations: [],
      preferredViewingContexts: [],
      favoriteFranchisesOrTitles: [],
      recentTopics: [],
      negativeSignals: [],
    };
    component.ngOnChanges(changeFor('memory', component.memory));
    component.openQuestion(0);

    let answer: PreferenceAnswer | undefined;
    component.answerSaved.subscribe((value) => answer = value);
    component.saveCurrentAnswer();

    expect(answer).toEqual(jasmine.objectContaining({
      key: 'preferredPlatforms',
      target: 'profile',
      values: ['Netflix', 'Prime Video'],
    }));
  });

  it('keeps a failed draft on the active question and advances only after confirmation', () => {
    const component = new ChatProfilePanelComponent();
    component.ngOnChanges(changeFor('profilePlatforms', component.profilePlatforms));
    component.toggleOption('Netflix');
    component.saveCurrentAnswer();

    expect(component.currentIndex).toBe(0);
    expect(component.currentValues).toEqual(['Netflix']);

    component.onSaveComplete();
    expect(component.currentIndex).toBe(1);
  });

  it('emits optional memory answers without producing conversational text', () => {
    const component = new ChatProfilePanelComponent();
    component.profilePlatforms = ['Netflix'];
    component.profileGenres = ['Series'];
    component.ngOnChanges(changeFor('profilePlatforms', component.profilePlatforms));
    component.openQuestion(2);
    component.toggleOption('En pareja');

    let answer: PreferenceAnswer | undefined;
    component.answerSaved.subscribe((value) => answer = value);
    component.saveCurrentAnswer();

    expect(answer).toEqual({
      key: 'preferredViewingContexts',
      target: 'memory',
      field: 'preferredViewingContexts',
      values: ['En pareja'],
      community: undefined,
    });
  });
});

function changeFor(key: string, value: unknown): SimpleChanges {
  return { [key]: new SimpleChange(undefined, value, true) };
}
