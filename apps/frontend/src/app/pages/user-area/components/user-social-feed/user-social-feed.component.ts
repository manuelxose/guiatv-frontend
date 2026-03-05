import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserActivity, UserFriend, UserRecommendation, Visibility } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-social-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid lg:grid-cols-[2fr_1fr] gap-6">
      <section class="space-y-6">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg font-semibold text-white">Publicar estado</h2>
              <p class="text-sm text-slate-400">Comparte lo que ves con tu comunidad.</p>
            </div>
            <span class="text-xs text-slate-300 border border-slate-700 px-2 py-1 rounded-full">
              Visibilidad:
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
                <label for="social-title" class="text-xs text-slate-400 uppercase tracking-wider">Que estas viendo</label>
                <input
                  id="social-title"
                  type="text"
                  formControlName="title"
                  placeholder="Ej. The Bear T3"
                  class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                />
              </div>
              <div class="space-y-2">
                <label for="social-mood" class="text-xs text-slate-400 uppercase tracking-wider">Como te sientes</label>
                <input
                  id="social-mood"
                  type="text"
                  formControlName="mood"
                  placeholder="Ej. Enganchado"
                  class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                />
              </div>
            </div>
            <div class="grid md:grid-cols-[1fr_auto] gap-4 items-end">
              <div class="space-y-2">
                <label for="social-visibility" class="text-xs text-slate-400 uppercase tracking-wider">Visibilidad</label>
                <select
                  id="social-visibility"
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
                Publicar en feed
              </button>
            </div>
          </form>
        </div>

        <div class="space-y-4">
          <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Actividad de amigos</h3>

          <div *ngIf="activities.length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 text-sm text-slate-400">
            No hay actividad reciente.
          </div>

          <article
            *ngFor="let activity of activities"
            class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
          >
            <div class="flex items-start gap-4">
              <div class="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden flex items-center justify-center text-xs text-slate-300">
                <img *ngIf="activity.user?.avatar" [src]="activity.user?.avatar" class="w-full h-full object-cover" alt="" />
                <span *ngIf="!activity.user?.avatar">{{ (activity.user?.name || 'U').slice(0, 1) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-white font-medium">{{ activity.user?.name || 'Usuario' }}</span>
                    <span class="text-slate-500">{{ getActivityVerb(activity.type) }}</span>
                  </div>
                  <span class="text-xs text-slate-500 whitespace-nowrap">{{ activity.createdAt }}</span>
                </div>

                <h4 class="text-sm text-white font-medium mt-2">{{ activity.title }}</h4>
                <p class="text-sm text-slate-300 mt-1">{{ activity.description }}</p>

                <div *ngIf="activity.image" class="mt-4 rounded-xl overflow-hidden border border-slate-800/80">
                  <img [src]="activity.image" class="w-full h-48 object-cover" alt="" />
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-2" *ngIf="activity.badge">
                  <span class="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                    {{ activity.badge }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    Me gusta
                  </button>
                  <button
                    type="button"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    Comentar
                  </button>
                  <button
                    type="button"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside class="space-y-6">
        <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">Amigos activos</h3>
            <button
              type="button"
              class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Buscar
            </button>
          </div>

          <div class="space-y-4">
            <div *ngFor="let friend of friends" class="flex items-center gap-3">
              <div class="relative">
                <div class="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden flex items-center justify-center text-xs text-slate-300">
                  <img *ngIf="friend.avatar" [src]="friend.avatar" class="w-full h-full object-cover" alt="" />
                  <span *ngIf="!friend.avatar">{{ friend.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div
                  class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-slate-900"
                  [ngClass]="friend.isOnline ? 'bg-red-500' : 'bg-slate-500'"
                ></div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm text-white font-medium truncate">{{ friend.name }}</p>
                <p class="text-xs text-slate-500 truncate">
                  {{ friend.lastActivity }} | {{ friend.isOnline ? 'Online' : 'Offline' }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="onToggleFollow(friend.id)"
                  class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {{ friend.following ? 'Siguiendo' : 'Seguir' }}
                </button>
                <button
                  type="button"
                  class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Enviar mensaje"
                >
                  Mensaje
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Tendencias de la red</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-400">Lo mas recomendado</span>
              <span class="text-white font-medium">Dune 2</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-400">Lista mas seguida</span>
              <span class="text-white font-medium">Sci-Fi epico</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-400">Mas comentado</span>
              <span class="text-white font-medium">The Bear T3</span>
            </div>
          </div>
        </section>

        <section
          class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6"
          *ngIf="recommendations.length > 0"
        >
          <h3 class="text-lg font-semibold text-white mb-4">Recomendaciones de amigos</h3>
          <div class="space-y-3">
            <div
              *ngFor="let rec of recommendations.slice(0, 3)"
              class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4"
            >
              <p class="text-xs text-slate-500 mb-1">{{ rec.user?.name || 'Amigo' }} recomienda</p>
              <p class="text-sm text-white font-medium truncate">{{ rec.title }}</p>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2">"{{ rec.note }}"</p>
              <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{{ rec.createdAt }}</span>
                <span class="text-slate-300">{{ rec.rating || '-' }}</span>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  `,
  styles: [],
})
export class UserSocialFeedComponent {
  @Input() activities: UserActivity[] = [];
  @Input() friends: UserFriend[] = [];
  @Input() recommendations: UserRecommendation[] = [];
  @Output() updateStatus = new EventEmitter<{ title: string; mood: string; visibility: Visibility }>();
  @Output() toggleFollow = new EventEmitter<string>();

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

  onToggleFollow(id: string) {
    this.toggleFollow.emit(id);
  }

  getActivityVerb(type: string): string {
    switch (type) {
      case 'status':
        return 'esta viendo';
      case 'recommendation':
        return 'recomendo';
      case 'list':
        return 'creo una lista';
      case 'follow':
        return 'ahora sigue a';
      case 'comment':
        return 'comento';
      case 'like':
        return 'dio me gusta';
      default:
        return 'actividad';
    }
  }
}
