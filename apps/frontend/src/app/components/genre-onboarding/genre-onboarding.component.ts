import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { UserService } from '../../services/user.service';

interface SelectableItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-genre-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col bg-[#0b0f14] px-4 pt-6 text-slate-100">
      <h2 class="mb-1 text-lg font-bold text-white">Personaliza tus recomendaciones</h2>
      <p class="mb-6 text-sm text-slate-400">
        Selecciona varios generos y las plataformas que tienes disponibles.
      </p>

      <div class="mb-8">
        <h3 class="mb-3 text-sm font-semibold text-white">Generos favoritos</h3>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let genre of genres"
            type="button"
            (click)="toggleGenre(genre.id)"
            class="rounded-full border px-4 py-2.5 text-sm font-medium transition-all"
            [ngClass]="selectedGenres.includes(genre.id)
              ? 'border-red-500 bg-red-600 text-white'
              : 'border-slate-700 bg-slate-800 text-slate-300'"
          >
            {{ genre.label }}
          </button>
        </div>
      </div>

      <div class="mb-8">
        <h3 class="mb-3 text-sm font-semibold text-white">Plataformas</h3>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let platform of platforms"
            type="button"
            (click)="togglePlatform(platform.id)"
            class="rounded-full border px-4 py-2.5 text-sm font-medium transition-all"
            [ngClass]="selectedPlatforms.includes(platform.id)
              ? 'border-red-500 bg-red-600 text-white'
              : 'border-slate-700 bg-slate-800 text-slate-300'"
          >
            {{ platform.label }}
          </button>
        </div>
      </div>

      <button
        type="button"
        (click)="saveAndContinue()"
        [disabled]="selectedGenres.length === 0 || saving"
        class="mt-auto min-h-[52px] w-full rounded-2xl bg-red-600 font-bold text-white disabled:opacity-40"
      >
        {{ saving ? 'Guardando...' : 'Empezar' }}
      </button>
    </div>
  `,
})
export class GenreOnboardingComponent {
  @Output() completed = new EventEmitter<void>();

  public readonly genres: SelectableItem[] = [
    { id: 'Cine', label: 'Cine y peliculas' },
    { id: 'Series', label: 'Series' },
    { id: 'Documental', label: 'Documentales' },
    { id: 'Deportes', label: 'Deportes' },
    { id: 'Infantil', label: 'Infantil' },
    { id: 'Entretenimiento', label: 'Entretenimiento' },
    { id: 'Informativos', label: 'Actualidad' },
    { id: 'Cultura', label: 'Cultura' },
    { id: 'Musica', label: 'Musica' },
    { id: 'Lifestyle', label: 'Lifestyle' },
    { id: 'Motor', label: 'Motor' },
  ];
  public readonly platforms: SelectableItem[] = [
    { id: 'Netflix', label: 'Netflix' },
    { id: 'Prime Video', label: 'Prime Video' },
    { id: 'Disney+', label: 'Disney+' },
    { id: 'Max', label: 'Max' },
    { id: 'Movistar+', label: 'Movistar+' },
    { id: 'SkyShowtime', label: 'SkyShowtime' },
    { id: 'Apple TV+', label: 'Apple TV+' },
    { id: 'Filmin', label: 'Filmin' },
    { id: 'RTVE Play', label: 'RTVE Play' },
    { id: 'ATRESplayer', label: 'ATRESplayer' },
    { id: 'Mitele', label: 'Mitele' },
  ];

  public selectedGenres: string[] = [];
  public selectedPlatforms: string[] = [];
  public saving = false;

  constructor(private readonly userService: UserService) {}

  toggleGenre(genre: string): void {
    this.selectedGenres = this.toggleValue(this.selectedGenres, genre);
  }

  togglePlatform(platform: string): void {
    this.selectedPlatforms = this.toggleValue(this.selectedPlatforms, platform);
  }

  saveAndContinue(): void {
    if (!this.selectedGenres.length || this.saving) {
      return;
    }

    this.saving = true;
    this.userService
      .saveGenrePreferences(this.selectedGenres, this.selectedPlatforms)
      .subscribe(() => {
        this.saving = false;
        this.completed.emit();
      });
  }

  private toggleValue(values: string[], nextValue: string): string[] {
    return values.includes(nextValue)
      ? values.filter((value) => value !== nextValue)
      : [...values, nextValue];
  }
}
