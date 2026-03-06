import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserNotifications, UserPrivacy, UserProfile } from '../../../../interfaces/user.interface';

const GENRE_OPTIONS = [
  'Cine',
  'Series',
  'Acción',
  'Drama',
  'Comedia',
  'Terror',
  'Ciencia ficción',
  'Documental',
  'Deportes',
  'Infantil',
  'Suspense',
  'Romance',
];

const PLATFORM_OPTIONS = [
  'Netflix',
  'Prime Video',
  'Disney+',
  'Max',
  'Movistar+',
  'SkyShowtime',
  'Apple TV+',
  'Filmin',
  'RTVE Play',
  'ATRESplayer',
  'Mitele',
  'Pluto TV',
  'Rakuten TV',
];

const TYPE_OPTIONS = [
  { id: 'program', label: 'TV' },
  { id: 'movie', label: 'Películas' },
  { id: 'series', label: 'Series' },
] as const;

const AVAILABILITY_OPTIONS = [
  { id: 'live', label: 'Directo' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'free', label: 'Gratis' },
  { id: 'flatrate', label: 'Suscripción' },
  { id: 'rent', label: 'Alquiler' },
  { id: 'buy', label: 'Compra' },
] as const;

const SORT_OPTIONS = [
  { id: 'personalized', label: 'Para ti' },
  { id: 'popular', label: 'Popular' },
  { id: 'rating', label: 'Mejor valorado' },
  { id: 'airtime', label: 'Horario' },
  { id: 'recent', label: 'Reciente' },
] as const;

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <div class="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-white">Ajustes de cuenta</h2>
            <p class="text-sm text-slate-400">
              Perfil, privacidad, plataformas y comportamiento por defecto del explorador.
            </p>
          </div>
          <button
            type="button"
            (click)="onEditProfile()"
            class="min-h-[44px] rounded-xl border border-slate-700 px-5 py-2.5 text-slate-200 hover:border-slate-500 hover:text-white"
          >
            Editar perfil
          </button>
        </div>

        <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-8">
          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Perfil</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs uppercase tracking-wider text-slate-500">Nombre</p>
                <p class="mt-2 text-sm text-slate-200">{{ profile?.name || '-' }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs uppercase tracking-wider text-slate-500">Usuario</p>
                <p class="mt-2 text-sm text-slate-200">{{ profile?.username || '-' }}</p>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Privacidad</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Perfil público</span>
                  <span class="text-xs text-slate-500">Permite que otros usuarios vean tu perfil.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="profilePublic" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Compartir actividad</span>
                  <span class="text-xs text-slate-500">Publica lo que ves y valoras con tus amigos.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="shareActivity" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Mostrar en línea</span>
                  <span class="text-xs text-slate-500">Tus amigos pueden saber cuándo estás conectado.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="showOnline" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Notificaciones</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Recomendaciones</span>
                  <span class="text-xs text-slate-500">Avisos sobre sugerencias sociales y personalizadas.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="recommendations" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Nuevos seguidores</span>
                  <span class="text-xs text-slate-500">Cuando alguien te sigue o interactúa con tu perfil.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="followers" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span class="block text-sm font-medium text-white">Resumen semanal</span>
                  <span class="text-xs text-slate-500">Actividad, recomendaciones y uso de la semana.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="weeklySummary" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Gustos y plataformas</h3>

            <div>
              <p class="mb-3 text-sm font-medium text-white">Géneros favoritos</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let genre of genreOptions"
                  type="button"
                  (click)="toggleGenre(genre)"
                  class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                  [ngClass]="selectedGenres.includes(genre)
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300'"
                >
                  {{ genre }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-3 text-sm font-medium text-white">Plataformas disponibles</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let platform of platformOptions"
                  type="button"
                  (click)="togglePlatform(platform)"
                  class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                  [ngClass]="selectedPlatforms.includes(platform)
                    ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300'"
                >
                  {{ platform }}
                </button>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Exploración por defecto</h3>

            <div class="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div>
                <p class="mb-3 text-sm font-medium text-white">Tipos de contenido</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of typeOptions"
                    type="button"
                    (click)="toggleDefaultType(option.id)"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedTypes.includes(option.id)
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                      : 'border-slate-700 bg-slate-950/60 text-slate-300'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-sm font-medium text-white">Disponibilidad</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of availabilityOptions"
                    type="button"
                    (click)="toggleDefaultAvailability(option.id)"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedAvailability.includes(option.id)
                      ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                      : 'border-slate-700 bg-slate-950/60 text-slate-300'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-sm font-medium text-white">Orden inicial</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of sortOptions"
                    type="button"
                    (click)="selectedSort = option.id"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedSort === option.id
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-slate-700 bg-slate-950/60 text-slate-300'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div class="flex flex-wrap justify-end gap-3 border-t border-slate-800/80 pt-6">
            <button
              type="button"
              (click)="onReset()"
              class="min-h-[44px] rounded-xl border border-slate-700 px-6 py-2.5 text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="min-h-[44px] rounded-xl bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-500"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      <div class="text-center">
        <button
          type="button"
          (click)="onLogout()"
          class="min-h-[44px] rounded-xl border border-slate-800 px-6 py-2.5 text-slate-400 hover:border-slate-500 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
})
export class UserSettingsComponent implements OnChanges {
  @Input() profile: UserProfile | null = null;
  @Input() privacy!: UserPrivacy;
  @Input() notifications!: UserNotifications;
  @Output() saveSettings = new EventEmitter<{
    privacy: UserPrivacy;
    notifications: UserNotifications;
    favoriteGenres: string[];
    preferredPlatforms: string[];
    discoveryDefaults: NonNullable<UserProfile['discoveryDefaults']>;
  }>();
  @Output() editProfile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  public readonly genreOptions = GENRE_OPTIONS;
  public readonly platformOptions = PLATFORM_OPTIONS;
  public readonly typeOptions = TYPE_OPTIONS;
  public readonly availabilityOptions = AVAILABILITY_OPTIONS;
  public readonly sortOptions = SORT_OPTIONS;

  public selectedGenres: string[] = [];
  public selectedPlatforms: string[] = [];
  public selectedTypes: Array<'movie' | 'series' | 'program'> = ['program', 'movie', 'series'];
  public selectedAvailability: Array<'live' | 'streaming' | 'free' | 'flatrate' | 'rent' | 'buy'> = [];
  public selectedSort: 'personalized' | 'popular' | 'rating' | 'airtime' | 'recent' = 'popular';

  public readonly settingsForm = this.fb.group({
    profilePublic: [true],
    shareActivity: [true],
    shareWatchlist: [true],
    showOnline: [true],
    recommendations: [true],
    followers: [true],
    weeklySummary: [false],
  });

  constructor(private readonly fb: FormBuilder) {}

  ngOnChanges(): void {
    this.resetForm();
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  onSubmit(): void {
    if (!this.settingsForm.valid) {
      return;
    }

    const value = this.settingsForm.value;
    this.saveSettings.emit({
      privacy: {
        profilePublic: !!value.profilePublic,
        shareActivity: !!value.shareActivity,
        shareWatchlist: !!value.shareWatchlist,
        showOnline: !!value.showOnline,
        allowMessages: this.profile?.privacy?.allowMessages || 'all',
        publicLists: this.profile?.privacy?.publicLists ?? true,
      },
      notifications: {
        recommendations: !!value.recommendations,
        followers: !!value.followers,
        weeklySummary: !!value.weeklySummary,
        chatMessages: this.profile?.notifications?.chatMessages ?? true,
        groupActivity: this.profile?.notifications?.groupActivity ?? true,
      },
      favoriteGenres: [...this.selectedGenres],
      preferredPlatforms: [...this.selectedPlatforms],
      discoveryDefaults: {
        types: [...this.selectedTypes],
        availability: [...this.selectedAvailability],
        platforms: [...this.selectedPlatforms],
        sort: this.selectedSort,
      },
    });
  }

  onReset(): void {
    this.resetForm();
  }

  toggleGenre(genre: string): void {
    this.selectedGenres = this.toggleValue(this.selectedGenres, genre);
  }

  togglePlatform(platform: string): void {
    this.selectedPlatforms = this.toggleValue(this.selectedPlatforms, platform);
  }

  toggleDefaultType(type: 'movie' | 'series' | 'program'): void {
    const next = this.toggleValue(this.selectedTypes, type);
    this.selectedTypes = next.length ? next : [type];
  }

  toggleDefaultAvailability(
    availability: 'live' | 'streaming' | 'free' | 'flatrate' | 'rent' | 'buy'
  ): void {
    this.selectedAvailability = this.toggleValue(this.selectedAvailability, availability);
  }

  private resetForm(): void {
    if (!this.privacy || !this.notifications) {
      return;
    }

    this.settingsForm.patchValue({
      profilePublic: this.privacy.profilePublic,
      shareActivity: this.privacy.shareActivity,
      shareWatchlist: this.privacy.shareWatchlist,
      showOnline: this.privacy.showOnline,
      recommendations: this.notifications.recommendations,
      followers: this.notifications.followers,
      weeklySummary: this.notifications.weeklySummary,
    });

    this.selectedGenres = [...(this.profile?.favoriteGenres || [])];
    this.selectedPlatforms = [...(this.profile?.preferredPlatforms || [])];
    this.selectedTypes = this.profile?.discoveryDefaults?.types?.length
      ? [...this.profile.discoveryDefaults.types]
      : ['program', 'movie', 'series'];
    this.selectedAvailability = this.profile?.discoveryDefaults?.availability?.length
      ? [...this.profile.discoveryDefaults.availability]
      : [];
    this.selectedSort = this.profile?.discoveryDefaults?.sort || 'popular';
  }

  private toggleValue<T>(values: T[], value: T): T[] {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }
}
