import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserProfile } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-profile-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
      *ngIf="profile"
    >
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <div class="relative">
            <div
              class="h-24 w-24 lg:h-28 lg:w-28 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center overflow-hidden text-2xl font-semibold text-white"
            >
              <img
                *ngIf="profile.avatar && profile.avatar !== '/assets/gpt-avatar.png'"
                [src]="profile.avatar"
                alt="Avatar"
                class="h-full w-full object-cover"
              />
              <span *ngIf="!profile.avatar || profile.avatar === '/assets/gpt-avatar.png'">
                {{ profile.name.slice(0, 2).toUpperCase() }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                {{ profile.name }}
              </h1>
              <span class="px-2 py-1 rounded-full border border-red-500/40 text-red-200 text-[11px] font-semibold uppercase tracking-wider">
                Pro
              </span>
              <span
                *ngIf="profile.privacy.showOnline"
                class="px-2 py-1 rounded-full border border-slate-700 text-slate-200 text-[11px] font-semibold uppercase tracking-wider"
              >
                Online
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>{{ '@' + profile.username }}</span>
              <span aria-hidden="true">|</span>
              <span>{{ profile.location }}</span>
            </div>
            <p class="text-sm text-slate-300 max-w-xl">
              {{ profile.bio }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            *ngIf="isOwnProfile"
            type="button"
            (click)="onEditProfile()"
            class="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Editar perfil
          </button>

          <ng-container *ngIf="!isOwnProfile">
            <button
              type="button"
              class="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Seguir
            </button>
            <button
              type="button"
              class="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-semibold hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Enviar mensaje"
            >
              Mensaje
            </button>
          </ng-container>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Seguidores</p>
          <p class="text-xl font-semibold text-white">{{ profile.stats.followers | number }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Siguiendo</p>
          <p class="text-xl font-semibold text-white">{{ profile.stats.following | number }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Listas</p>
          <p class="text-xl font-semibold text-white">{{ profile.stats.listsCreated | number }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Recomendaciones</p>
          <p class="text-xl font-semibold text-white">{{ profile.stats.recommendations | number }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Valoraciones</p>
          <p class="text-xl font-semibold text-white">{{ profile.stats.ratings | number }}</p>
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class UserProfileHeaderComponent {
  @Input() profile!: UserProfile;
  @Input() isOwnProfile: boolean = true;
  @Output() editProfile = new EventEmitter<void>();

  onEditProfile() {
    this.editProfile.emit();
  }
}
