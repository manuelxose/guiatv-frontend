import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-[var(--portal-bg)] via-[var(--portal-bg-deep)] to-[var(--portal-bg-deep)] py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <div *ngIf="loading" class="text-center py-20">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--portal-border-strong)] border-t-red-500"></div>
        </div>

        <div *ngIf="error" class="text-center py-20">
          <p class="text-[var(--portal-text-muted)] text-lg">{{ error }}</p>
          <button (click)="goBack()" class="mt-4 px-6 py-2 rounded-xl bg-[var(--portal-surface-strong)] text-[var(--portal-text)] text-sm hover:bg-[var(--portal-surface-strong)]">Volver</button>
        </div>

        <div *ngIf="profile && !loading">
          <div *ngIf="profile.blocked" class="text-center py-20">
            <p class="text-[var(--portal-text-muted)] text-lg">Este perfil no está disponible.</p>
            <button (click)="goBack()" class="mt-4 px-6 py-2 rounded-xl bg-[var(--portal-surface-strong)] text-[var(--portal-text)] text-sm hover:bg-[var(--portal-surface-strong)]">Volver</button>
          </div>

          <div *ngIf="!profile.blocked" class="space-y-6">
            <div class="bg-[var(--portal-surface-soft)] border border-[var(--portal-border)] rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
              <div class="flex items-start gap-5">
                <div class="h-20 w-20 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] overflow-hidden flex items-center justify-center text-2xl text-[var(--portal-text-soft)] shrink-0">
                  <img *ngIf="profile.avatar" [src]="profile.avatar" class="w-full h-full object-cover" alt="" />
                  <span *ngIf="!profile.avatar">{{ (profile.name || 'U').slice(0, 1) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h1 class="text-2xl font-bold text-[var(--portal-text)]">{{ profile.name }}</h1>
                  <p *ngIf="profile.bio" class="text-sm text-[var(--portal-text-muted)] mt-1">{{ profile.bio }}</p>
                  <p *ngIf="profile.location" class="text-xs text-[var(--portal-text-muted)] mt-1">📍 {{ profile.location }}</p>

                  <div class="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      (click)="onToggleFollow()"
                      class="min-h-[40px] px-5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      [ngClass]="profile.isFollowing
                        ? 'border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)]'
                        : 'bg-red-600 text-white hover:bg-red-500'"
                    >
                      {{ profile.isFollowing ? 'Siguiendo' : 'Seguir' }}
                    </button>
                    <span *ngIf="profile.isFollower" class="text-xs text-[var(--portal-text-muted)] border border-[var(--portal-border)] px-2 py-1 rounded-full">Te sigue</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="profile.stats" class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div *ngFor="let stat of statItems" class="bg-[var(--portal-surface-soft)] border border-[var(--portal-border)] rounded-xl p-4 text-center">
                <p class="text-lg font-bold text-[var(--portal-text)]">{{ stat.value }}</p>
                <p class="text-[10px] text-[var(--portal-text-muted)] uppercase tracking-wider mt-1">{{ stat.label }}</p>
              </div>
            </div>

            <div *ngIf="profile.favoriteGenres?.length" class="bg-[var(--portal-surface-soft)] border border-[var(--portal-border)] rounded-2xl p-6">
              <h3 class="text-sm font-semibold text-[var(--portal-text)] mb-3">Géneros favoritos</h3>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let genre of profile.favoriteGenres" class="text-xs px-3 py-1.5 rounded-full border border-[var(--portal-border)] text-[var(--portal-text-soft)] bg-[var(--portal-surface-strong)]">
                  {{ genre }}
                </span>
              </div>
            </div>

            <div *ngIf="profile.preferredPlatforms?.length" class="bg-[var(--portal-surface-soft)] border border-[var(--portal-border)] rounded-2xl p-6">
              <h3 class="text-sm font-semibold text-[var(--portal-text)] mb-3">Plataformas</h3>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let platform of profile.preferredPlatforms" class="text-xs px-3 py-1.5 rounded-full border border-[var(--portal-border)] text-[var(--portal-text-soft)] bg-[var(--portal-surface-strong)]">
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
