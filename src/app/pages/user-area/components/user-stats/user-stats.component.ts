import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  UserActivity,
  UserList,
  UserListItem,
  UserProfile,
  UserRecommendation,
  Visibility,
} from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <div *ngIf="error" class="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {{ error }}
      </div>
      <div class="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div class="space-y-6">
          <!-- Status Composer -->
          <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h2 class="text-lg font-semibold text-white">Estado actual</h2>
                <p class="text-sm text-slate-400">Comparte lo que ves y como te sientes.</p>
              </div>
              <span class="text-xs text-slate-300 border border-slate-700 px-2 py-1 rounded-full">
                Visible:
                {{
                  statusForm.value.visibility === 'public'
                    ? 'Publico'
                    : statusForm.value.visibility === 'private'
                      ? 'Privado'
                      : 'Amigos'
                }}
              </span>
            </div>

            <form [formGroup]="statusForm" (ngSubmit)="onSubmitStatus()" class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label for="watching-title" class="text-xs text-slate-400 uppercase tracking-wider">Que estas viendo</label>
                  <input
                    id="watching-title"
                    type="text"
                    formControlName="title"
                    placeholder="Ej. The Bear T3"
                    class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </div>
                <div class="space-y-2">
                  <label for="watching-mood" class="text-xs text-slate-400 uppercase tracking-wider">Como te sientes</label>
                  <input
                    id="watching-mood"
                    type="text"
                    formControlName="mood"
                    placeholder="Ej. Enganchado"
                    class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </div>
              </div>

              <div class="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                <div class="space-y-2">
                  <label for="watching-visibility" class="text-xs text-slate-400 uppercase tracking-wider">Visibilidad</label>
                  <select
                    id="watching-visibility"
                    formControlName="visibility"
                    class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <option value="public">Publico</option>
                    <option value="friends">Amigos</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
                <button
                  type="submit"
                  [disabled]="statusForm.invalid"
                  class="min-h-[44px] px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Publicar estado
                </button>
              </div>

              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Vista previa</p>
                <p class="text-sm text-slate-200">
                  {{ statusForm.value.title || 'Sin titulo definido' }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ statusForm.value.mood || 'Sin estado' }}
                </p>
              </div>
            </form>
          </section>

          <!-- Upcoming Reminders -->
          <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Proximos recordatorios</h3>
              <button
                type="button"
                class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Nuevo
              </button>
            </div>

            <div *ngIf="loading" class="space-y-3">
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
              <div class="h-16 rounded-xl border border-slate-800/80 bg-slate-900/60"></div>
            </div>

            <div *ngIf="!loading && reminders.length === 0" class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm text-slate-400">
              No tienes recordatorios pendientes.
            </div>

            <div class="space-y-3" *ngIf="!loading && reminders.length > 0">
              <div
                *ngFor="let reminder of reminders"
                class="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4"
              >
                <div class="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden flex items-center justify-center text-xs text-slate-300">
                  <img *ngIf="reminder.poster" [src]="reminder.poster" class="w-full h-full object-cover" alt="" />
                  <span *ngIf="!reminder.poster">Sin poster</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm text-white font-medium truncate">{{ reminder.title }}</h4>
                  <p class="text-xs text-slate-400">
                    {{ reminder.type === 'movie' ? 'Pelicula' : 'Serie' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Ver
                </button>
              </div>
            </div>
          </section>

          <!-- Recent Activity -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Actividad reciente</h3>
              <button
                type="button"
                class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Ver todo
              </button>
            </div>

            <div *ngIf="myActivities.length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 text-sm text-slate-400">
              Aun no tienes actividad reciente.
            </div>

            <article
              *ngFor="let activity of myActivities"
              class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
            >
              <div class="flex items-start gap-4">
                <div class="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800/80 flex items-center justify-center text-xs text-slate-300 font-semibold">
                  {{ activity.type.slice(0, 2).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-3">
                    <h4 class="text-sm text-white font-medium">{{ activity.title }}</h4>
                    <span class="text-xs text-slate-500 whitespace-nowrap">{{ activity.createdAt }}</span>
                  </div>
                  <p class="text-sm text-slate-300 mt-2">{{ activity.description }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-2" *ngIf="activity.badge">
                    <span class="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                      {{ activity.badge }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Ahora mismo</h3>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-slate-400">Viendo</span>
                <span class="text-slate-200 text-right">
                  {{ profile?.watchingNow?.title || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-slate-400">Mood</span>
                <span class="text-slate-200 text-right">
                  {{ profile?.watchingNow?.mood || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-slate-400">Visibilidad</span>
                <span class="text-slate-200 text-right">
                  {{
                    profile?.watchingNow?.visibility === 'public'
                      ? 'Publico'
                      : profile?.watchingNow?.visibility === 'private'
                        ? 'Privado'
                        : profile?.watchingNow?.visibility === 'friends'
                          ? 'Amigos'
                          : '-'
                  }}
                </span>
              </div>
            </div>
          </section>

          <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Recomendaciones relevantes</h3>
              <button
                type="button"
                class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Ver todas
              </button>
            </div>

            <div *ngIf="recommendations.length === 0" class="text-sm text-slate-400">
              No hay recomendaciones todavia.
            </div>

            <div class="space-y-3" *ngIf="recommendations.length > 0">
              <div
                *ngFor="let rec of recommendations.slice(0, 3)"
                class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm text-white font-medium truncate">{{ rec.title }}</p>
                    <p class="text-xs text-slate-500">{{ rec.type }} | {{ rec.createdAt }}</p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                    {{ rec.visibility === 'public' ? 'Publico' : 'Amigos' }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-2 line-clamp-2">"{{ rec.note }}"</p>
              </div>
            </div>
          </section>

          <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Listas recientes</h3>
              <button
                type="button"
                class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Ver todas
              </button>
            </div>

            <div *ngIf="lists.length === 0" class="text-sm text-slate-400">
              Aun no has creado listas.
            </div>

            <div class="space-y-3" *ngIf="lists.length > 0">
              <div
                *ngFor="let list of lists.slice(0, 3)"
                class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm text-white font-medium truncate">{{ list.title }}</p>
                    <p class="text-xs text-slate-500">{{ list.itemsCount }} items</p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                    {{ list.visibility === 'public' ? 'Publico' : list.visibility === 'friends' ? 'Amigos' : 'Privado' }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: [],
})
export class UserStatsComponent {
  @Input() profile!: UserProfile | null;
  @Input() myActivities: UserActivity[] = [];
  @Input() lists: UserList[] = [];
  @Input() recommendations: UserRecommendation[] = [];
  @Input() reminders: UserListItem[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() updateStatus = new EventEmitter<{ title: string; mood: string; visibility: Visibility }>();

  statusForm = this.fb.group({
    title: ['', Validators.required],
    mood: [''],
    visibility: ['friends'],
  });

  constructor(private fb: FormBuilder) {}

  onSubmitStatus() {
    if (this.statusForm.valid) {
      this.updateStatus.emit({
        title: this.statusForm.value.title!,
        mood: this.statusForm.value.mood || '',
        visibility: (this.statusForm.value.visibility || 'friends') as Visibility,
      });
      this.statusForm.reset({ visibility: 'friends' });
    }
  }
}
