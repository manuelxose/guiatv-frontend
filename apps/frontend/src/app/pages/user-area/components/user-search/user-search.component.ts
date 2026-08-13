import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="relative">
        <input
          type="text"
          (input)="onSearch($any($event.target).value)"
          placeholder="Buscar usuarios por nombre..."
          class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl pl-10 pr-4 text-sm text-[var(--portal-text)] placeholder:text-[var(--portal-text-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--portal-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5"></circle>
          <path stroke-linecap="round" d="M16 16l4.5 4.5"></path>
        </svg>
      </div>

      <div *ngIf="searching" class="text-center py-4">
        <div class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--portal-border-strong)] border-t-red-500"></div>
      </div>

      <div *ngIf="!searching && results.length === 0 && searched" class="text-center py-6 text-sm text-[var(--portal-text-muted)]">
        No se encontraron usuarios.
      </div>

      <div class="space-y-2">
        <div
          *ngFor="let user of results"
          class="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-3 hover:bg-[var(--portal-surface-strong)] transition-colors cursor-pointer"
          (click)="openProfile(user.id)"
          (keydown.enter)="openProfile(user.id)"
          (keydown.space)="$event.preventDefault(); openProfile(user.id)"
          role="button"
          tabindex="0"
        >
          <div class="h-10 w-10 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] overflow-hidden flex items-center justify-center text-xs text-[var(--portal-text-soft)] shrink-0">
            <img *ngIf="user.avatar" [src]="user.avatar" class="w-full h-full object-cover" alt="" />
            <span *ngIf="!user.avatar">{{ (user.name || 'U').slice(0, 1) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-[var(--portal-text)] font-medium truncate">{{ user.name }}</p>
          </div>
          <button
            type="button"
            (click)="onToggleFollow(user, $event)"
            class="min-h-[36px] px-4 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            [ngClass]="user.isFollowing
              ? 'border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)]'
              : 'bg-red-600 text-white hover:bg-red-500'"
          >
            {{ user.isFollowing ? 'Siguiendo' : 'Seguir' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class UserSearchComponent {
  @Output() followToggled = new EventEmitter<string>();

  results: any[] = [];
  searching = false;
  searched = false;

  private searchSubject = new Subject<string>();

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q || q.length < 2) {
            this.searching = false;
            this.searched = false;
            return of([]);
          }
          this.searching = true;
          return this.userService.searchUsers(q);
        })
      )
      .subscribe((results) => {
        this.results = results;
        this.searching = false;
        this.searched = true;
      });
  }

  onSearch(value: string): void {
    this.searchSubject.next(value.trim());
  }

  openProfile(userId: string): void {
    this.router.navigateByUrl(`/perfil/${userId}`);
  }

  onToggleFollow(user: any, event: Event): void {
    event.stopPropagation();
    this.userService.toggleFollow(user.id).subscribe(() => {
      user.isFollowing = !user.isFollowing;
      this.followToggled.emit(user.id);
    });
  }
}
