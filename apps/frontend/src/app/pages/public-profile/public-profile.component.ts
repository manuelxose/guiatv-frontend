import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <div *ngIf="loading" class="text-center py-20">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-red-500"></div>
        </div>

        <div *ngIf="error" class="text-center py-20">
          <p class="text-slate-400 text-lg">{{ error }}</p>
          <button (click)="goBack()" class="mt-4 px-6 py-2 rounded-xl bg-slate-800 text-white text-sm hover:bg-slate-700">Volver</button>
        </div>

        <div *ngIf="profile && !loading">
          <div *ngIf="profile.blocked" class="text-center py-20">
            <p class="text-slate-400 text-lg">Este perfil no está disponible.</p>
            <button (click)="goBack()" class="mt-4 px-6 py-2 rounded-xl bg-slate-800 text-white text-sm hover:bg-slate-700">Volver</button>
          </div>

          <div *ngIf="!profile.blocked" class="space-y-6">
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
              <div class="flex items-start gap-5">
                <div class="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-800/80 overflow-hidden flex items-center justify-center text-2xl text-slate-300 shrink-0">
                  <img *ngIf="profile.avatar" [src]="profile.avatar" class="w-full h-full object-cover" alt="" />
                  <span *ngIf="!profile.avatar">{{ (profile.name || 'U').slice(0, 1) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h1 class="text-2xl font-bold text-white">{{ profile.name }}</h1>
                  <p *ngIf="profile.bio" class="text-sm text-slate-400 mt-1">{{ profile.bio }}</p>
                  <p *ngIf="profile.location" class="text-xs text-slate-500 mt-1">📍 {{ profile.location }}</p>

                  <div class="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      (click)="onToggleFollow()"
                      class="min-h-[40px] px-5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      [ngClass]="profile.isFollowing
                        ? 'border border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500'
                        : 'bg-red-600 text-white hover:bg-red-500'"
                    >
                      {{ profile.isFollowing ? 'Siguiendo' : 'Seguir' }}
                    </button>
                    <span *ngIf="profile.isFollower" class="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-full">Te sigue</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="profile.stats" class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div *ngFor="let stat of statItems" class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-center">
                <p class="text-lg font-bold text-white">{{ stat.value }}</p>
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{{ stat.label }}</p>
              </div>
            </div>

            <div *ngIf="profile.favoriteGenres?.length" class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 class="text-sm font-semibold text-white mb-3">Géneros favoritos</h3>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let genre of profile.favoriteGenres" class="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 bg-slate-800/40">
                  {{ genre }}
                </span>
              </div>
            </div>

            <div *ngIf="profile.preferredPlatforms?.length" class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 class="text-sm font-semibold text-white mb-3">Plataformas</h3>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let platform of profile.preferredPlatforms" class="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 bg-slate-800/40">
                  {{ platform }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PublicProfileComponent implements OnInit {
  profile: any = null;
  loading = true;
  error = '';

  get statItems(): { label: string; value: number }[] {
    if (!this.profile?.stats) return [];
    const s = this.profile.stats;
    return [
      { label: 'Seguidores', value: s.followers || 0 },
      { label: 'Siguiendo', value: s.following || 0 },
      { label: 'Valoraciones', value: s.ratings || 0 },
      { label: 'Listas', value: s.lists || 0 },
      { label: 'Recomendaciones', value: s.recommendations || 0 },
    ];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.error = 'Usuario no encontrado';
      this.loading = false;
      return;
    }

    this.userService.getPublicProfile(userId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        if (!profile) this.error = 'Usuario no encontrado';
      },
      error: () => {
        this.error = 'Error al cargar el perfil';
        this.loading = false;
      },
    });
  }

  onToggleFollow(): void {
    if (!this.profile) return;
    this.userService.toggleFollow(this.profile.id).subscribe(() => {
      this.profile = { ...this.profile, isFollowing: !this.profile.isFollowing };
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/comunidad');
  }
}
