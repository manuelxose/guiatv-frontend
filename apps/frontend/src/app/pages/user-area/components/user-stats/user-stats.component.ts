import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  UserActivity,
  UserList,
  UserListItem,
  UserProfile,
} from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-8">
      <div *ngIf="error" class="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {{ error }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_22rem]">
        <div class="space-y-6">
          <section class="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_rgba(15,23,42,0.94)_55%)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Mi cuenta</p>
                <h2 class="text-3xl font-black tracking-tight text-white">
                  Tu resumen personal, sin ruido social.
                </h2>
                <p class="max-w-2xl text-sm leading-6 text-slate-300">
                  Desde aquí gestionas tu historial, tus listas y lo que tienes guardado. La actividad
                  pública y el chat viven en Comunidad para que cada espacio tenga una única función.
                </p>
              </div>

              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-4 text-sm">
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Viendo ahora</p>
                <p class="mt-2 font-semibold text-white">
                  {{ profile?.watchingNow?.title || 'Sin sesión activa' }}
                </p>
                <p class="mt-1 text-slate-400">
                  {{ profile?.watchingNow?.mood || 'Marca contenido como viendo desde una ficha o desde Comunidad.' }}
                </p>
              </div>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'history' }"
                class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-4 transition-colors hover:border-slate-600"
              >
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Historial</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.ratings || 0 }}</p>
                <p class="mt-1 text-sm text-slate-400">Valora y revisa lo que ya has visto.</p>
              </a>
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'lists' }"
                class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-4 transition-colors hover:border-slate-600"
              >
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Listas</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ lists.length }}</p>
                <p class="mt-1 text-sm text-slate-400">Tus colecciones listas para compartir o seguir editando.</p>
              </a>
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'favorites' }"
                class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-4 transition-colors hover:border-slate-600"
              >
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Guardados</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.watchlist || reminders.length }}</p>
                <p class="mt-1 text-sm text-slate-400">Accede rápido a lo pendiente y a tus favoritos.</p>
              </a>
              <a
                routerLink="/comunidad"
                [queryParams]="{ tab: 'social' }"
                class="rounded-[1.5rem] border border-red-500/30 bg-red-500/10 p-4 transition-colors hover:border-red-400/40"
              >
                <p class="text-[11px] uppercase tracking-[0.28em] text-red-200">Comunidad</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.followers || 0 }}</p>
                <p class="mt-1 text-sm text-red-100/80">Publica, recomienda y chatea desde el hub social.</p>
              </a>
            </div>
          </section>

          <section class="rounded-[2rem] border border-slate-800/80 bg-slate-900/60 p-6">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Recordatorios</p>
                <h3 class="mt-1 text-2xl font-semibold text-white">Lo siguiente que querías ver</h3>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Tus pendientes personales viven aquí, sin mezclarse con recomendaciones de amigos.
                </p>
              </div>
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'lists' }"
                class="min-h-[44px] rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Gestionar listas
              </a>
            </div>

            <div *ngIf="loading" class="mt-5 space-y-3">
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
            </div>

            <div *ngIf="!loading && reminders.length === 0" class="mt-5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm text-slate-400">
              No tienes recordatorios pendientes ahora mismo.
            </div>

            <div class="mt-5 space-y-3" *ngIf="!loading && reminders.length > 0">
              <article
                *ngFor="let reminder of reminders"
                class="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4"
              >
                <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-300">
                  <img *ngIf="reminder.poster" [src]="reminder.poster" class="h-full w-full object-cover" alt="" />
                  <span *ngIf="!reminder.poster">{{ reminder.type === 'movie' ? 'MOV' : reminder.type === 'series' ? 'SER' : 'TV' }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="truncate text-sm font-medium text-white">{{ reminder.title }}</h4>
                  <p class="text-xs text-slate-400">
                    {{ reminder.type === 'movie' ? 'Película' : reminder.type === 'series' ? 'Serie' : 'Programa' }}
                    · {{ reminder.state === 'pending' ? 'Pendiente' : reminder.state === 'watching' ? 'Viendo' : 'Finalizado' }}
                  </p>
                </div>
                <a
                  *ngIf="reminder.contentId"
                  [routerLink]="['/contenido', reminder.contentId]"
                  class="min-h-[40px] rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
                >
                  Ver ficha
                </a>
              </article>
            </div>
          </section>

          <section class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Actividad propia</p>
                <h3 class="mt-1 text-2xl font-semibold text-white">Tu rastro reciente</h3>
              </div>
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'history' }"
                class="min-h-[44px] rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Abrir historial
              </a>
            </div>

            <div *ngIf="myActivities.length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 text-sm text-slate-400">
              Aún no tienes actividad reciente.
            </div>

            <article
              *ngFor="let activity of myActivities.slice(0, 5)"
              class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
            >
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300">
                  {{ activity.type.slice(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <h4 class="text-sm font-medium text-white">{{ activity.title }}</h4>
                    <span class="text-xs text-slate-500 whitespace-nowrap">{{ activity.createdAt }}</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-300">{{ activity.description }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-2" *ngIf="activity.badge">
                    <span class="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                      {{ activity.badge }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="rounded-[2rem] border border-slate-800/80 bg-slate-900/60 p-6">
            <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Tu cuenta</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Seguidores</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.followers || 0 }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Siguiendo</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.following || 0 }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Listas</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.listsCreated || lists.length }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Valoraciones</p>
                <p class="mt-2 text-2xl font-bold text-white">{{ profile?.stats?.ratings || 0 }}</p>
              </div>
            </div>
          </section>

          <section class="rounded-[2rem] border border-slate-800/80 bg-slate-900/60 p-6">
            <h3 class="text-lg font-semibold text-white">Preferencias rápidas</h3>
            <div class="mt-4 space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Géneros favoritos</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    *ngFor="let genre of (profile?.favoriteGenres || []).slice(0, 6)"
                    class="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    {{ genre }}
                  </span>
                  <span
                    *ngIf="!(profile?.favoriteGenres || []).length"
                    class="text-sm text-slate-400"
                  >
                    Configúralos desde Ajustes para afinar explorar y el asistente.
                  </span>
                </div>
              </div>

              <div>
                <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Plataformas</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    *ngFor="let platform of (profile?.preferredPlatforms || []).slice(0, 6)"
                    class="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100"
                  >
                    {{ platform }}
                  </span>
                  <span
                    *ngIf="!(profile?.preferredPlatforms || []).length"
                    class="text-sm text-slate-400"
                  >
                    Añade tus plataformas en Ajustes para priorizar el catálogo correcto.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-[2rem] border border-slate-800/80 bg-slate-900/60 p-6">
            <h3 class="text-lg font-semibold text-white">Accesos directos</h3>
            <div class="mt-4 space-y-3">
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'history' }"
                class="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
              >
                <span>Editar historial</span>
                <span class="text-slate-500">/mi-cuenta</span>
              </a>
              <a
                routerLink="/mi-cuenta"
                [queryParams]="{ tab: 'settings' }"
                class="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
              >
                <span>Ajustar gustos y plataformas</span>
                <span class="text-slate-500">Ajustes</span>
              </a>
              <a
                routerLink="/comunidad"
                [queryParams]="{ tab: 'social' }"
                class="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition-colors hover:border-red-400/40"
              >
                <span>Ir a Comunidad</span>
                <span class="text-red-200/70">Actividad + chat</span>
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
})
export class UserStatsComponent {
  @Input() profile!: UserProfile | null;
  @Input() myActivities: UserActivity[] = [];
  @Input() lists: UserList[] = [];
  @Input() reminders: UserListItem[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
}
