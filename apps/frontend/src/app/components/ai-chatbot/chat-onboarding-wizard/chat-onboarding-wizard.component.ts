import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AssistantMemorySnapshot } from '../../../interfaces/chatbot.interface';

export interface OnboardingWizardResult {
  preferredPlatforms: string[];
  likedGenres: string[];
  preferredViewingContexts: string[];
  preferredDurations: string[];
  preferredAutonomousCommunity: string | null;
}

interface SelectableChip {
  id: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-chat-onboarding-wizard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-4 mt-3 mb-2 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
      <!-- Header -->
      <div class="border-b border-slate-800/60 px-4 py-3">
        <h3 class="text-sm font-semibold text-white">Personaliza tu asistente</h3>
        <p class="mt-0.5 text-xs text-slate-400">Paso {{ currentStep + 1 }} de {{ steps.length }}</p>
      </div>

      <!-- Step dots -->
      <div class="flex items-center justify-center gap-2 px-4 pt-3 pb-1">
        <div
          *ngFor="let step of steps; let i = index"
          class="h-1.5 rounded-full transition-all duration-300"
          [ngClass]="{
            'w-6 bg-red-500': i === currentStep,
            'w-4 bg-red-500/40': i < currentStep,
            'w-4 bg-slate-700': i > currentStep
          }"
        ></div>
      </div>

      <!-- Step content -->
      <div class="px-4 pb-4 pt-3">
        <!-- Step 0: Platforms -->
        <ng-container *ngIf="currentStep === 0">
          <p class="mb-3 text-xs font-medium text-slate-300">¿Qué plataformas usas?</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let p of platformChips"
              type="button"
              (click)="toggle(selectedPlatforms, p.id)"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              [ngStyle]="isSelected(selectedPlatforms, p.id)
                ? { 'background-color': p.color + '22', 'color': p.color, 'border-color': p.color + '88' }
                : {}"
              [ngClass]="isSelected(selectedPlatforms, p.id)
                ? ''
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
            >
              {{ p.label }}
            </button>
          </div>
        </ng-container>

        <!-- Step 1: Genres -->
        <ng-container *ngIf="currentStep === 1">
          <p class="mb-3 text-xs font-medium text-slate-300">¿Qué géneros te interesan?</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let g of genreChips"
              type="button"
              (click)="toggle(selectedGenres, g.id)"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              [ngClass]="isSelected(selectedGenres, g.id)
                ? 'border-red-500/60 bg-red-600/20 text-red-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
            >
              {{ g.label }}
            </button>
          </div>
        </ng-container>

        <!-- Step 2: Context & Duration -->
        <ng-container *ngIf="currentStep === 2">
          <p class="mb-3 text-xs font-medium text-slate-300">¿Cómo sueles ver la tele?</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let c of contextChips"
              type="button"
              (click)="toggle(selectedContexts, c.id)"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              [ngClass]="isSelected(selectedContexts, c.id)
                ? 'border-red-500/60 bg-red-600/20 text-red-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
            >
              {{ c.label }}
            </button>
          </div>
          <p class="mb-2 mt-4 text-xs font-medium text-slate-300">¿Prefieres algo corto o largo?</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let d of durationChips"
              type="button"
              (click)="toggle(selectedDurations, d.id)"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              [ngClass]="isSelected(selectedDurations, d.id)
                ? 'border-red-500/60 bg-red-600/20 text-red-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
            >
              {{ d.label }}
            </button>
          </div>
        </ng-container>

        <!-- Step 3: Community -->
        <ng-container *ngIf="currentStep === 3">
          <p class="mb-3 text-xs font-medium text-slate-300">¿Quieres incluir canales autonómicos?</p>
          <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            <button
              *ngFor="let c of communityChips"
              type="button"
              (click)="selectCommunity(c.id)"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              [ngClass]="selectedCommunity === c.id
                ? 'border-sky-500/60 bg-sky-600/20 text-sky-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
            >
              {{ c.label }}
            </button>
          </div>
          <button
            type="button"
            (click)="skipCommunity()"
            class="mt-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            No tengo preferencia
          </button>
        </ng-container>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between border-t border-slate-800/60 px-4 py-3">
        <button
          *ngIf="currentStep > 0; else skipButton"
          type="button"
          (click)="prevStep()"
          class="text-xs font-medium text-slate-400 transition-colors hover:text-white"
        >
          ← Atrás
        </button>
        <ng-template #skipButton>
          <button
            type="button"
            (click)="skipAll()"
            class="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Saltar
          </button>
        </ng-template>

        <button
          type="button"
          (click)="nextStep()"
          class="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
          [disabled]="!canAdvance"
        >
          {{ isLastStep ? 'Empezar' : 'Siguiente →' }}
        </button>
      </div>
    </div>
  `,
})
export class ChatOnboardingWizardComponent {
  @Input() currentMemory: AssistantMemorySnapshot | null = null;
  @Output() completed = new EventEmitter<OnboardingWizardResult>();
  @Output() skipped = new EventEmitter<void>();

  readonly steps = ['platforms', 'genres', 'context', 'community'];
  currentStep = 0;

  selectedPlatforms: string[] = [];
  selectedGenres: string[] = [];
  selectedContexts: string[] = [];
  selectedDurations: string[] = [];
  selectedCommunity: string | null = null;

  readonly platformChips: SelectableChip[] = [
    { id: 'Netflix', label: 'Netflix', color: '#E50914' },
    { id: 'Prime Video', label: 'Prime Video', color: '#00A8E1' },
    { id: 'Disney+', label: 'Disney+', color: '#113CCF' },
    { id: 'Max', label: 'Max', color: '#002BE7' },
    { id: 'Movistar+', label: 'Movistar+', color: '#00A19A' },
    { id: 'SkyShowtime', label: 'SkyShowtime', color: '#6B3FA0' },
    { id: 'Apple TV+', label: 'Apple TV+', color: '#ffffff' },
    { id: 'Filmin', label: 'Filmin', color: '#D8231D' },
    { id: 'RTVE Play', label: 'RTVE Play', color: '#E84E1B' },
    { id: 'ATRESplayer', label: 'ATRESplayer', color: '#5BC53A' },
    { id: 'Mitele', label: 'Mitele', color: '#ED1C24' },
    { id: 'Pluto TV', label: 'Pluto TV', color: '#FFDF00' },
    { id: 'Rakuten TV', label: 'Rakuten TV', color: '#6E2E92' },
  ];

  readonly genreChips: SelectableChip[] = [
    { id: 'Cine', label: 'Cine y películas' },
    { id: 'Series', label: 'Series' },
    { id: 'Documental', label: 'Documentales' },
    { id: 'Deportes', label: 'Deportes' },
    { id: 'Infantil', label: 'Infantil' },
    { id: 'Entretenimiento', label: 'Entretenimiento' },
    { id: 'Informativos', label: 'Actualidad' },
    { id: 'Cultura', label: 'Cultura' },
    { id: 'Musica', label: 'Música' },
    { id: 'Lifestyle', label: 'Lifestyle' },
    { id: 'Motor', label: 'Motor' },
  ];

  readonly contextChips: SelectableChip[] = [
    { id: 'Solo', label: '🧑 Solo' },
    { id: 'En pareja', label: '💑 En pareja' },
    { id: 'En familia', label: '👨‍👩‍👧‍👦 En familia' },
    { id: 'Con amigos', label: '🎉 Con amigos' },
  ];

  readonly durationChips: SelectableChip[] = [
    { id: 'corto', label: '⏱ Corto (<60 min)' },
    { id: 'largo', label: '🎬 Largo (>60 min)' },
  ];

  readonly communityChips: SelectableChip[] = [
    { id: 'Andalucía', label: 'Andalucía' },
    { id: 'Aragón', label: 'Aragón' },
    { id: 'Asturias', label: 'Asturias' },
    { id: 'Baleares', label: 'Baleares' },
    { id: 'Canarias', label: 'Canarias' },
    { id: 'Cantabria', label: 'Cantabria' },
    { id: 'Castilla-La Mancha', label: 'Castilla-La Mancha' },
    { id: 'Castilla y León', label: 'Castilla y León' },
    { id: 'Cataluña', label: 'Cataluña' },
    { id: 'Comunidad Valenciana', label: 'C. Valenciana' },
    { id: 'Extremadura', label: 'Extremadura' },
    { id: 'Galicia', label: 'Galicia' },
    { id: 'La Rioja', label: 'La Rioja' },
    { id: 'Madrid', label: 'Madrid' },
    { id: 'Murcia', label: 'Murcia' },
    { id: 'Navarra', label: 'Navarra' },
    { id: 'País Vasco', label: 'País Vasco' },
  ];

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  get canAdvance(): boolean {
    switch (this.currentStep) {
      case 0: return this.selectedPlatforms.length > 0;
      case 1: return this.selectedGenres.length > 0;
      case 2: return true; // context/duration is optional
      case 3: return true; // community is optional
      default: return false;
    }
  }

  isSelected(list: string[], id: string): boolean {
    return list.includes(id);
  }

  toggle(list: string[], id: string): void {
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
  }

  selectCommunity(id: string): void {
    this.selectedCommunity = this.selectedCommunity === id ? null : id;
  }

  skipCommunity(): void {
    this.selectedCommunity = null;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  nextStep(): void {
    if (!this.canAdvance) return;
    if (this.isLastStep) {
      this.emitResult();
    } else {
      this.currentStep++;
    }
  }

  skipAll(): void {
    this.skipped.emit();
  }

  private emitResult(): void {
    this.completed.emit({
      preferredPlatforms: [...this.selectedPlatforms],
      likedGenres: [...this.selectedGenres],
      preferredViewingContexts: [...this.selectedContexts],
      preferredDurations: [...this.selectedDurations],
      preferredAutonomousCommunity: this.selectedCommunity,
    });
  }
}
