import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserActivity, UserFriend, UserRecommendation, Visibility } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-social-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid gap-6" [ngClass]="showSidebar ? 'lg:grid-cols-[2fr_1fr]' : ''">
      <section class="space-y-6">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg font-semibold text-white">Pulso de comunidad</h2>
              <p class="text-sm text-slate-400">Actualiza qué ves, recomienda o crea una lista compartida.</p>
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

          <div class="mb-4 flex flex-wrap gap-2">
            <button
              *ngFor="let mode of composerModes"
              type="button"
              (click)="composerMode = mode.id"
              class="min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="composerMode === mode.id ? 'bg-red-600 text-white' : 'border border-slate-700 bg-slate-950/60 text-slate-300'"
            >
              {{ mode.label }}
            </button>
          </div>

          <form [formGroup]="statusForm" (ngSubmit)="onSubmitStatus()" class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="social-title" class="text-xs text-slate-400 uppercase tracking-wider">{{ titleLabel }}</label>
                <input
                  id="social-title"
                  type="text"
                  formControlName="title"
                  [placeholder]="titlePlaceholder"
                  class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                />
              </div>
              <div class="space-y-2">
                <label for="social-mood" class="text-xs text-slate-400 uppercase tracking-wider">{{ secondaryLabel }}</label>
                <input
                  id="social-mood"
                  type="text"
                  formControlName="mood"
                  [placeholder]="secondaryPlaceholder"
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
                {{ submitLabel }}
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
                    (click)="onLike(activity.id)"
                    class="min-h-[44px] px-4 rounded-lg border text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                    [ngClass]="activity.liked
                      ? 'border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'border-slate-700 text-slate-200 hover:text-white hover:border-slate-500'"
                  >
                    {{ activity.liked ? '❤️' : '🤍' }} Me gusta{{ activity.likes ? ' · ' + activity.likes : '' }}
                  </button>
                  <button
                    type="button"
                    (click)="onToggleComments(activity.id)"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    💬 Comentar{{ activity.comments ? ' · ' + activity.comments : '' }}
                  </button>
                </div>

                <div *ngIf="expandedComments.has(activity.id)" class="mt-3 space-y-3">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [value]="commentTexts[activity.id] || ''"
                      (input)="commentTexts[activity.id] = $any($event.target).value"
                      (keydown.enter)="onComment(activity.id)"
                      placeholder="Escribe un comentario..."
                      class="flex-1 min-h-[40px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    />
                    <button
                      type="button"
                      (click)="onComment(activity.id)"
                      class="min-h-[40px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside *ngIf="showSidebar" class="space-y-6">
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
                  (click)="messageFriend.emit(friend.id)"
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
  @Input() showSidebar = true;
  @Output() updateStatus = new EventEmitter<{ title: string; mood: string; visibility: Visibility }>();
  @Output() toggleFollow = new EventEmitter<string>();
  @Output() createList = new EventEmitter<{ title: string; description: string; visibility: Visibility }>();
  @Output() recommendContent = new EventEmitter<{ title: string; note: string; visibility: Visibility }>();
  @Output() messageFriend = new EventEmitter<string>();
  @Output() likeActivity = new EventEmitter<string>();
  @Output() commentActivity = new EventEmitter<{ activityId: string; text: string }>();

  expandedComments = new Set<string>();
  commentTexts: Record<string, string> = {};

  composerMode: 'status' | 'recommendation' | 'list' | 'alert' = 'status';
  readonly composerModes = [
    { id: 'status' as const, label: 'Estoy viendo esto' },
    { id: 'recommendation' as const, label: 'Recomendar' },
    { id: 'list' as const, label: 'Crear lista' },
    { id: 'alert' as const, label: 'Avisar a amigos' },
  ];

  statusForm = this.fb.group({
    title: ['', Validators.required],
    mood: [''],
    visibility: ['friends'],
  });

  constructor(private fb: FormBuilder) {}

  onSubmitStatus() {
    if (this.statusForm.valid) {
      const visibility = (this.statusForm.value.visibility || 'friends') as Visibility;
      const title = this.statusForm.value.title!;
      const mood = this.statusForm.value.mood || '';

      if (this.composerMode === 'recommendation') {
        this.recommendContent.emit({
          title,
          note: mood,
          visibility,
        });
      } else if (this.composerMode === 'list') {
        this.createList.emit({
          title,
          description: mood,
          visibility,
        });
      } else {
        this.updateStatus.emit({
          title,
          mood:
            this.composerMode === 'alert'
              ? mood || 'He empezado esto ahora mismo'
              : mood,
          visibility,
        });
      }
      this.statusForm.reset({ visibility: 'friends' });
      this.composerMode = 'status';
    }
  }

  onToggleFollow(id: string) {
    this.toggleFollow.emit(id);
  }

  onLike(activityId: string) {
    this.likeActivity.emit(activityId);
  }

  onToggleComments(activityId: string) {
    if (this.expandedComments.has(activityId)) {
      this.expandedComments.delete(activityId);
    } else {
      this.expandedComments.add(activityId);
    }
  }

  onComment(activityId: string) {
    const text = (this.commentTexts[activityId] || '').trim();
    if (!text) return;
    this.commentActivity.emit({ activityId, text });
    this.commentTexts[activityId] = '';
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

  get titleLabel(): string {
    if (this.composerMode === 'recommendation') return 'Qué recomiendas';
    if (this.composerMode === 'list') return 'Nombre de la lista';
    if (this.composerMode === 'alert') return 'Qué acabas de empezar';
    return 'Qué estás viendo';
  }

  get secondaryLabel(): string {
    if (this.composerMode === 'recommendation') return 'Nota breve';
    if (this.composerMode === 'list') return 'Descripción';
    if (this.composerMode === 'alert') return 'Mensaje';
    return 'Cómo te sientes';
  }

  get titlePlaceholder(): string {
    if (this.composerMode === 'recommendation') return 'Ej. The Bear T3';
    if (this.composerMode === 'list') return 'Ej. Series cortas para el finde';
    if (this.composerMode === 'alert') return 'Ej. Severance';
    return 'Ej. The Bear T3';
  }

  get secondaryPlaceholder(): string {
    if (this.composerMode === 'recommendation') return 'Por qué merece la pena';
    if (this.composerMode === 'list') return 'Qué reúne esta lista';
    if (this.composerMode === 'alert') return 'Mensaje para tus amigos';
    return 'Ej. Enganchado';
  }

  get submitLabel(): string {
    if (this.composerMode === 'recommendation') return 'Enviar recomendación';
    if (this.composerMode === 'list') return 'Crear lista y anunciarla';
    if (this.composerMode === 'alert') return 'Avisar a amigos';
    return 'Publicar estado';
  }
}
