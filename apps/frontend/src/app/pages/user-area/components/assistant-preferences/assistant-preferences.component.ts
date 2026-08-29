import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UserProfile } from '../../../../interfaces/user.interface';
import { PreferenceAnswer } from '../../../../interfaces/chat-profile.types';
import { AssistantMemorySnapshot, ChatbotService } from '../../../../services/chatbot.service';
import { ChatProfilePanelComponent } from '../../../../components/ai-chatbot/chat-profile-panel/chat-profile-panel.component';
import { computePersonalizationCompletion } from '../../../../utils/personalization-completion';

/**
 * "AI Assistant" half of Mi GuíaTV's personalization center (see
 * PersonalizationPreferencesComponent for the TV/Sports half).
 *
 * This is the transparency + edit surface the product spec calls
 * "What the assistant knows about me": it reads the SAME
 * ChatbotService.memory$ stream and writes through the SAME
 * ChatbotService.applyPreferenceAnswer(...) used by the chatbot's own
 * ChatProfilePanel, so a change made here is visible in the chatbot on next
 * open and vice versa — there is exactly one persistence path per field,
 * this component does not maintain a second copy of the answer-routing
 * logic.
 */
@Component({
  selector: 'app-assistant-preferences',
  standalone: true,
  imports: [CommonModule, ChatProfilePanelComponent],
  template: `
    <section class="mx-auto max-w-4xl space-y-5" aria-labelledby="assistant-preferences-heading">
      <header>
        <h2 id="assistant-preferences-heading" class="text-2xl font-semibold text-[var(--portal-text)]">
          Personalización del asistente
        </h2>
        <p class="mt-1 text-sm text-[var(--portal-text-muted)]">
          Esto es lo que el asistente de GuíaTV usa para adaptar sus respuestas. Puedes editarlo o
          quitar cualquier dato en cualquier momento.
        </p>
      </header>

      <ng-container *ngIf="!editing; else editor">
        <div class="knowledge-panel overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-5 space-y-4" data-vertical="editorial">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]">
              Qué sabe el asistente de mí
            </p>
            <span class="rounded-full bg-[var(--portal-surface-strong)] px-2.5 py-1 text-xs text-[var(--portal-text-muted)]">
              {{ completedCount }}/{{ totalFields }} completadas
            </span>
          </div>

          <div *ngFor="let group of knowledgeGroups" class="border-b border-[var(--portal-border)] pb-4 last:border-0 last:pb-0">
            <h3 class="text-sm font-semibold text-[var(--portal-text)]">{{ group.title }}</h3>
            <div *ngIf="group.items.length; else emptyGroup" class="mt-2 flex flex-wrap gap-2">
              <span
                *ngFor="let item of group.items"
                class="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] px-3 text-xs text-[var(--portal-text-soft)]"
              >
                <span class="max-w-48 truncate">{{ item }}</span>
                <button
                  type="button"
                  (click)="removeValue(group.key, item)"
                  [disabled]="saving"
                  [attr.aria-label]="'Quitar ' + item"
                  class="text-[var(--portal-text-muted)] hover:text-[var(--portal-text)]"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            </div>
            <ng-template #emptyGroup>
              <p class="mt-2 text-sm text-[var(--portal-text-muted)]">Sin definir todavía.</p>
            </ng-template>
          </div>

          <p *ngIf="actionError" class="text-xs text-[var(--status-live)]" role="alert">{{ actionError }}</p>

          <div class="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              (click)="openEditor()"
              class="inline-flex min-h-11 items-center rounded-xl bg-[var(--accent-live-strong)] px-4 text-sm font-semibold text-white"
            >
              Editar preferencias
            </button>
            <button
              type="button"
              (click)="confirmReset()"
              [disabled]="saving"
              class="inline-flex min-h-11 items-center rounded-xl border border-[var(--portal-border)] px-4 text-sm font-semibold text-[var(--portal-text-soft)] hover:text-[var(--portal-text)]"
            >
              Restablecer preferencias del asistente
            </button>
          </div>
        </div>

        <aside class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-5 text-sm text-[var(--portal-text-soft)]">
          <p>
            El asistente usa únicamente los gustos, plataformas y referencias que ves aquí arriba. No
            muestra instrucciones internas, puntuaciones ni datos privados de tu actividad.
          </p>
          <p class="mt-2">
            Esto es distinto de tus <strong>conversaciones</strong> con el asistente: esta pantalla
            controla sus preferencias de recomendación, no el historial de chat. Gestiona tus
            conversaciones (renombrar, archivar, eliminar) desde el propio asistente.
          </p>
        </aside>
      </ng-container>

      <ng-template #editor>
        <div class="relative min-h-[32rem] overflow-hidden rounded-2xl border border-[var(--portal-border)]">
          <app-chat-profile-panel
            [memory]="memory"
            [profilePlatforms]="profile?.preferredPlatforms || []"
            [profileGenres]="profile?.favoriteGenres || []"
            [saving]="saving"
            [saveError]="actionError"
            backLabel="Cerrar edición"
            (answerSaved)="onAnswerSaved($event)"
            (closed)="closeEditor()"
          ></app-chat-profile-panel>
        </div>
      </ng-template>
    </section>
  `,
  styles: [
    `
      // Same shared wayfinding mixin as PersonalizationPreferencesComponent
      // and CatalogCardComponent (see styles/_card-accent.scss) — restyle
      // only, no changes to headings/labels/roles asserted by
      // assistant-preferences.spec.ts.
      @use '../../../../../styles/card-accent' as cards;

      .knowledge-panel {
        @include cards.card-vertical-accent();
      }
    `,
  ],
})
export class AssistantPreferencesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() profile: UserProfile | null = null;

  memory: AssistantMemorySnapshot | null = null;
  editing = false;
  saving = false;
  actionError = '';

  private readonly destroy$ = new Subject<void>();
  private memoryRequested = false;

  constructor(private readonly chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.chatbotService.memory$.pipe(takeUntil(this.destroy$)).subscribe((memory) => {
      this.memory = memory;
    });
    this.ensureMemoryLoaded();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile']) {
      this.ensureMemoryLoaded();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get knowledgeGroups(): Array<{ key: string; title: string; items: string[] }> {
    const memory = this.memory;
    return [
      { key: 'preferredPlatforms', title: 'Plataformas', items: this.profile?.preferredPlatforms || [] },
      { key: 'favoriteGenres', title: 'Géneros', items: this.profile?.favoriteGenres || [] },
      { key: 'preferredViewingContexts', title: 'Suele ver contenido', items: memory?.preferredViewingContexts || [] },
      { key: 'preferredDurations', title: 'Duración preferida', items: this.durationLabels(memory?.preferredDurations || []) },
      { key: 'favoriteFranchisesOrTitles', title: 'Títulos de referencia', items: memory?.favoriteFranchisesOrTitles || [] },
      { key: 'preferredAutonomousCommunity', title: 'TV autonómica', items: memory?.preferredAutonomousCommunity ? [memory.preferredAutonomousCommunity] : [] },
      { key: 'negativeSignals', title: 'Prefiere evitar', items: memory?.negativeSignals || [] },
    ];
  }

  /**
   * Same computation as Overview's completion meter (see
   * utils/personalization-completion.ts) so the two surfaces never disagree
   * on how "complete" a given profile+memory pair is.
   */
  get totalFields(): number {
    return computePersonalizationCompletion(this.profile, this.memory).total;
  }

  get completedCount(): number {
    return computePersonalizationCompletion(this.profile, this.memory).done;
  }

  openEditor(): void {
    this.actionError = '';
    this.editing = true;
  }

  closeEditor(): void {
    this.editing = false;
  }

  onAnswerSaved(answer: PreferenceAnswer): void {
    if (this.saving) return;
    this.saving = true;
    this.actionError = '';

    this.chatbotService
      .applyPreferenceAnswer(answer, this.profile?.preferredPlatforms || [], this.profile?.favoriteGenres || [])
      .subscribe({
        next: (saved) => {
          this.saving = false;
          if (!saved) {
            this.actionError = 'No se pudo guardar. Inténtalo de nuevo.';
            return;
          }
          this.actionError = '';
        },
        error: () => {
          this.saving = false;
          this.actionError = 'No se pudo guardar. Inténtalo de nuevo.';
        },
      });
  }

  removeValue(key: string, value: string): void {
    if (this.saving) return;
    this.saving = true;
    this.actionError = '';

    if (key === 'preferredPlatforms' || key === 'favoriteGenres') {
      const platforms = key === 'preferredPlatforms'
        ? (this.profile?.preferredPlatforms || []).filter((v) => v !== value)
        : this.profile?.preferredPlatforms || [];
      const genres = key === 'favoriteGenres'
        ? (this.profile?.favoriteGenres || []).filter((v) => v !== value)
        : this.profile?.favoriteGenres || [];

      this.chatbotService.applyPreferenceAnswer(
        { key: key === 'preferredPlatforms' ? 'preferredPlatforms' : 'likedGenres', target: 'profile', values: key === 'preferredPlatforms' ? platforms : genres },
        platforms,
        genres
      ).subscribe({ next: () => (this.saving = false), error: () => this.failRemove() });
      return;
    }

    if (key === 'preferredAutonomousCommunity') {
      this.chatbotService.applyPreferenceAnswer(
        { key: 'preferredAutonomousCommunity', target: 'memory', values: [], community: null },
        this.profile?.preferredPlatforms || [],
        this.profile?.favoriteGenres || []
      ).subscribe({ next: () => (this.saving = false), error: () => this.failRemove() });
      return;
    }

    const field = key as 'preferredViewingContexts' | 'preferredDurations' | 'favoriteFranchisesOrTitles' | 'negativeSignals';
    const current = (this.memory?.[field] || []).filter((v) => v !== value);
    this.chatbotService.applyPreferenceAnswer(
      { key: field, target: 'memory', field, values: current },
      this.profile?.preferredPlatforms || [],
      this.profile?.favoriteGenres || []
    ).subscribe({ next: () => (this.saving = false), error: () => this.failRemove() });
  }

  confirmReset(): void {
    if (this.saving) return;
    if (typeof window !== 'undefined' && !window.confirm(
      'Esto borrará lo que ves con quién sueles ver contenido, duración, títulos de referencia, TV autonómica y lo que prefieres evitar. Tus plataformas y géneros no se ven afectados. ¿Continuar?'
    )) {
      return;
    }

    this.saving = true;
    this.actionError = '';
    this.chatbotService.resetAssistantMemory().subscribe({
      next: (memory) => {
        this.saving = false;
        if (!memory) this.actionError = 'No se pudo restablecer. Inténtalo de nuevo.';
      },
      error: () => {
        this.saving = false;
        this.actionError = 'No se pudo restablecer. Inténtalo de nuevo.';
      },
    });
  }

  private failRemove(): void {
    this.saving = false;
    this.actionError = 'No se pudo actualizar. Inténtalo de nuevo.';
  }

  private durationLabels(values: string[]): string[] {
    const labels: Record<string, string> = {
      corto: 'Menos de 60 min',
      episodio: 'Episodios de 30–45 min',
      largo: 'Más de 60 min',
    };
    return values.map((value) => labels[value] || value);
  }

  private ensureMemoryLoaded(): void {
    if (this.memoryRequested) return;
    this.memoryRequested = true;
    this.chatbotService.fetchAssistantMemory().subscribe();
  }
}
