import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserNotifications, UserPrivacy, UserProfile } from '../../../../interfaces/user.interface';
import { UserService } from '../../../../services/user.service';
import { AuthService, AuthSessionView } from '../../../../services/auth.service';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <div class="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-[var(--portal-text)]">Ajustes de cuenta</h2>
            <p class="text-sm text-[var(--portal-text-muted)]">
              Perfil, privacidad, plataformas y comportamiento por defecto del explorador.
            </p>
          </div>
          <button
            type="button"
            (click)="onEditProfile()"
            class="min-h-[44px] rounded-xl border border-[var(--portal-border)] px-5 py-2.5 text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
          >
            Editar perfil
          </button>
        </div>

        <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-8">
          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-[var(--portal-text-muted)]">Perfil</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <p class="text-xs uppercase tracking-wider text-[var(--portal-text-muted)]">Nombre</p>
                <p class="mt-2 text-sm text-[var(--portal-text-soft)]">{{ profile?.name || '-' }}</p>
              </div>
              <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <p class="text-xs uppercase tracking-wider text-[var(--portal-text-muted)]">Usuario</p>
                <p class="mt-2 text-sm text-[var(--portal-text-soft)]">{{ profile?.username || '-' }}</p>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-[var(--portal-text-muted)]">Privacidad</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Perfil público</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Permite que otros usuarios vean tu perfil.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="profilePublic" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Compartir actividad</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Publica lo que ves y valoras con tus amigos.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="shareActivity" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Mostrar en línea</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Tus amigos pueden saber cuándo estás conectado.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="showOnline" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-[var(--portal-text-muted)]">Notificaciones</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Recomendaciones</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Avisos sobre sugerencias sociales y personalizadas.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="recommendations" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Nuevos seguidores</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Cuando alguien te sigue o interactúa con tu perfil.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="followers" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
                <div>
                  <span class="block text-sm font-medium text-[var(--portal-text)]">Resumen semanal</span>
                  <span class="text-xs text-[var(--portal-text-muted)]">Actividad, recomendaciones y uso de la semana.</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="weeklySummary" class="peer sr-only" />
                  <div class="h-6 w-11 rounded-full bg-[var(--portal-surface-strong)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-[var(--portal-text-muted)]">Gustos y plataformas</h3>

            <div>
              <p class="mb-3 text-sm font-medium text-[var(--portal-text)]">Géneros favoritos</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let genre of genreOptions"
                  type="button"
                  (click)="toggleGenre(genre)"
                  class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                  [ngClass]="selectedGenres.includes(genre)
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-[var(--portal-border)] bg-[var(--portal-bg-deep)] text-[var(--portal-text-soft)]'"
                >
                  {{ genre }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-3 text-sm font-medium text-[var(--portal-text)]">Plataformas disponibles</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let platform of platformOptions"
                  type="button"
                  (click)="togglePlatform(platform)"
                  class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                  [ngClass]="selectedPlatforms.includes(platform)
                    ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                    : 'border-[var(--portal-border)] bg-[var(--portal-bg-deep)] text-[var(--portal-text-soft)]'"
                >
                  {{ platform }}
                </button>
              </div>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.3em] text-[var(--portal-text-muted)]">Exploración por defecto</h3>

            <div class="space-y-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4">
              <div>
                <p class="mb-3 text-sm font-medium text-[var(--portal-text)]">Tipos de contenido</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of typeOptions"
                    type="button"
                    (click)="toggleDefaultType(option.id)"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedTypes.includes(option.id)
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                      : 'border-[var(--portal-border)] bg-[var(--portal-bg-deep)] text-[var(--portal-text-soft)]'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-sm font-medium text-[var(--portal-text)]">Disponibilidad</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of availabilityOptions"
                    type="button"
                    (click)="toggleDefaultAvailability(option.id)"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedAvailability.includes(option.id)
                      ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                      : 'border-[var(--portal-border)] bg-[var(--portal-bg-deep)] text-[var(--portal-text-soft)]'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-sm font-medium text-[var(--portal-text)]">Orden inicial</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let option of sortOptions"
                    type="button"
                    (click)="selectedSort = option.id"
                    class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                    [ngClass]="selectedSort === option.id
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-[var(--portal-border)] bg-[var(--portal-bg-deep)] text-[var(--portal-text-soft)]'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div class="flex flex-wrap justify-end gap-3 border-t border-[var(--portal-border)] pt-6">
            <button
              type="button"
              (click)="onReset()"
              class="min-h-[44px] rounded-xl border border-[var(--portal-border)] px-6 py-2.5 text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
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

      <!-- Sessions section -->
      <div class="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-[var(--portal-text)]">Sesiones activas</h3>
            <p class="text-sm text-[var(--portal-text-muted)]">Dispositivos con sesión iniciada en tu cuenta.</p>
          </div>
          <button
            type="button"
            (click)="loadSessions()"
            class="min-h-[36px] rounded-xl border border-[var(--portal-border)] px-4 py-2 text-xs font-semibold text-[var(--portal-text-soft)]"
          >
            {{ sessionsLoaded ? 'Actualizar' : 'Ver sesiones' }}
          </button>
        </div>

        <div *ngIf="sessionsLoading" class="mt-4 text-sm text-[var(--portal-text-muted)]">Cargando sesiones…</div>

        <div *ngIf="sessionsLoaded && !sessionsLoading" class="mt-4 space-y-3">
          <div
            *ngFor="let session of sessions"
            class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-[var(--portal-text)]">
                {{ getDeviceLabel(session) }}
                <span *ngIf="session.current" class="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Actual
                </span>
              </p>
              <p class="mt-1 text-xs text-[var(--portal-text-muted)]">
                {{ session.ipAddress || 'IP desconocida' }}
                · Última actividad: {{ formatSessionDate(session.lastUsedAt || session.createdAt) }}
              </p>
            </div>
            <button
              *ngIf="!session.current"
              type="button"
              (click)="revokeSession(session.id)"
              class="ml-3 min-h-[34px] rounded-xl border border-[var(--portal-border)] px-3 text-xs font-semibold text-[var(--portal-text-soft)] hover:border-red-500/50 hover:text-red-300"
            >
              Cerrar
            </button>
          </div>

          <div *ngIf="!sessions.length" class="text-sm text-[var(--portal-text-muted)]">No se encontraron sesiones activas.</div>

          <button
            *ngIf="sessions.length > 1"
            type="button"
            (click)="logoutAllDevices()"
            class="mt-2 min-h-[36px] rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200"
          >
            Cerrar todas las sesiones excepto esta
          </button>
        </div>
      </div>

      <!-- Blocked users section -->
      <div class="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-[var(--portal-text)]">Usuarios bloqueados</h3>
            <p class="text-sm text-[var(--portal-text-muted)]">Usuarios a los que has bloqueado.</p>
          </div>
          <button
            type="button"
            (click)="loadBlockedUsers()"
            class="min-h-[36px] rounded-xl border border-[var(--portal-border)] px-4 py-2 text-xs font-semibold text-[var(--portal-text-soft)]"
          >
            {{ blockedLoaded ? 'Actualizar' : 'Ver bloqueados' }}
          </button>
        </div>

        <div *ngIf="blockedLoading" class="mt-4 text-sm text-[var(--portal-text-muted)]">Cargando…</div>

        <div *ngIf="blockedLoaded && !blockedLoading" class="mt-4 space-y-3">
          <div
            *ngFor="let user of blockedUsers"
            class="flex items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4"
          >
            <div class="flex items-center gap-3">
              <img
                [src]="user.avatar || '/assets/gpt-avatar.png'"
                [alt]="user.name"
                class="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p class="text-sm font-medium text-[var(--portal-text)]">{{ user.name }}</p>
                <p class="text-xs text-[var(--portal-text-muted)]">&#64;{{ user.username }}</p>
              </div>
            </div>
            <button
              type="button"
              (click)="unblockUser(user.id)"
              class="min-h-[34px] rounded-xl border border-[var(--portal-border)] px-3 text-xs font-semibold text-[var(--portal-text-soft)] hover:border-emerald-500/50 hover:text-emerald-300"
            >
              Desbloquear
            </button>
          </div>

          <div *ngIf="!blockedUsers.length" class="text-sm text-[var(--portal-text-muted)]">No tienes usuarios bloqueados.</div>
        </div>
      </div>

      <!-- Data export section -->
      <div class="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-[var(--portal-text)]">Exportar mis datos</h3>
            <p class="text-sm text-[var(--portal-text-muted)]">Descarga un archivo con todos tus datos de la plataforma (RGPD).</p>
          </div>
          <button
            type="button"
            (click)="exportData()"
            [disabled]="exporting"
            class="min-h-[44px] rounded-xl border border-[var(--portal-border)] px-5 py-2.5 text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)] disabled:opacity-50"
          >
            {{ exporting ? 'Exportando…' : 'Descargar mis datos' }}
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8">
        <h3 class="text-lg font-semibold text-red-200">Zona de peligro</h3>
        <p class="mt-1 text-sm text-[var(--portal-text-muted)]">
          Eliminar tu cuenta es permanente. Se borrarán todos tus datos: perfil, listas, favoritos, actividad, conversaciones y preferencias del asistente.
        </p>

        <div *ngIf="!showDeleteConfirm" class="mt-4">
          <button
            type="button"
            (click)="showDeleteConfirm = true"
            class="min-h-[44px] rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-2.5 font-semibold text-red-200 hover:bg-red-500/20"
          >
            Eliminar mi cuenta
          </button>
        </div>

        <div *ngIf="showDeleteConfirm" class="mt-4 space-y-3 rounded-2xl border border-red-500/30 bg-[var(--portal-bg-deep)] p-4">
          <p class="text-sm font-medium text-red-100">
            Escribe tu contraseña para confirmar la eliminación de tu cuenta.
          </p>
          <input
            type="password"
            [(ngModel)]="deletePassword"
            placeholder="Tu contraseña actual"
            class="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-4 py-2.5 text-sm text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-text-faint)] focus:border-red-500/50"
          />
          <p *ngIf="deleteError" class="text-xs text-red-400">{{ deleteError }}</p>
          <div class="flex gap-3">
            <button
              type="button"
              (click)="confirmDeleteAccount()"
              [disabled]="deleting || !deletePassword"
              class="min-h-[44px] rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {{ deleting ? 'Eliminando…' : 'Confirmar eliminación' }}
            </button>
            <button
              type="button"
              (click)="showDeleteConfirm = false; deletePassword = ''; deleteError = ''"
              class="min-h-[44px] rounded-xl border border-[var(--portal-border)] px-5 py-2.5 text-[var(--portal-text-soft)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <div class="text-center">
        <button
          type="button"
          (click)="onLogout()"
          class="min-h-[44px] rounded-xl border border-[var(--portal-border)] px-6 py-2.5 text-[var(--portal-text-muted)] hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
})
export class UserSettingsComponent implements OnChanges, OnInit {
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

  // Sessions
  public sessions: AuthSessionView[] = [];
  public sessionsLoading = false;
  public sessionsLoaded = false;

  // Blocked users
  public blockedUsers: Array<{ id: string; name: string; username: string; avatar: string }> = [];
  public blockedLoading = false;
  public blockedLoaded = false;

  // Export
  public exporting = false;

  // Account deletion
  public showDeleteConfirm = false;
  public deletePassword = '';
  public deleting = false;
  public deleteError = '';

  public readonly settingsForm = this.fb.group({
    profilePublic: [true],
    shareActivity: [true],
    shareWatchlist: [true],
    showOnline: [true],
    recommendations: [true],
    followers: [true],
    weeklySummary: [false],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

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

  // --- Sessions ---
  loadSessions(): void {
    this.sessionsLoading = true;
    this.authService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.sessionsLoaded = true;
        this.sessionsLoading = false;
      },
      error: () => {
        this.sessionsLoading = false;
      },
    });
  }

  revokeSession(sessionId: string): void {
    this.authService.revokeSession(sessionId).subscribe({
      next: () => {
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
      },
    });
  }

  logoutAllDevices(): void {
    this.authService.logoutAllDevices().subscribe({
      next: () => {
        this.sessions = this.sessions.filter((s) => s.current);
      },
    });
  }

  getDeviceLabel(session: AuthSessionView): string {
    if (session.deviceName) return session.deviceName;
    if (session.userAgent) {
      const ua = session.userAgent;
      if (ua.includes('Mobile')) return 'Dispositivo móvil';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      return 'Navegador';
    }
    return 'Dispositivo desconocido';
  }

  formatSessionDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // --- Blocked users ---
  loadBlockedUsers(): void {
    this.blockedLoading = true;
    this.userService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedUsers = users;
        this.blockedLoaded = true;
        this.blockedLoading = false;
      },
      error: () => {
        this.blockedLoading = false;
      },
    });
  }

  unblockUser(userId: string): void {
    this.userService.unblockUser(userId).subscribe({
      next: () => {
        this.blockedUsers = this.blockedUsers.filter((u) => u.id !== userId);
      },
    });
  }

  // --- Data export ---
  exportData(): void {
    this.exporting = true;
    this.userService.exportUserData().subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guiatv-datos-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
      },
    });
  }

  // --- Account deletion ---
  confirmDeleteAccount(): void {
    if (!this.deletePassword) return;
    this.deleting = true;
    this.deleteError = '';
    this.userService.deleteAccount(this.deletePassword).subscribe({
      next: () => {
        this.deleting = false;
        this.logout.emit();
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err?.error?.message || 'Error al eliminar la cuenta. Comprueba la contraseña.';
      },
    });
  }
}
