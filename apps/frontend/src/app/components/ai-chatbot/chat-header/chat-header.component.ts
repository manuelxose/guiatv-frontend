import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="chat-header">
      <div class="chat-header__row">
        <h2 class="chat-header__brand">
          <span class="chat-header__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M7 8.5h10A2.5 2.5 0 0 1 19.5 11v6A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17v-6A2.5 2.5 0 0 1 7 8.5Z" stroke="currentColor" stroke-width="1.8"/><path d="m9 4 3 4.5L15 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
          </span>
          <span class="chat-header__brand-full">Asistente GuíaTV</span>
          <span class="chat-header__brand-short">GuíaTV</span>
        </h2>
        <div class="chat-header__actions">
          <button type="button" class="chat-header__icon" (click)="openSocial.emit()" aria-label="Abrir chat con personas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </button>
          <button *ngIf="isAuthenticated" type="button" class="chat-header__icon chat-header__primary-action" (click)="toggleSidebar.emit()" aria-label="Conversaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          </button>
          <button *ngIf="isAuthenticated" type="button" class="chat-header__icon chat-header__primary-action" (click)="openProfile.emit()" [attr.aria-label]="profileIncomplete ? 'Completar Perfil IA' : 'Abrir Perfil IA'">
            <span *ngIf="profileIncomplete" class="chat-header__dot" aria-hidden="true"></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.573-1.066z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path></svg>
          </button>
          <button *ngIf="isAuthenticated" type="button" class="chat-header__icon chat-header__primary-action" (click)="newConversation.emit()" aria-label="Nueva conversación">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
          </button>

          <div class="chat-header__more-wrap">
            <button #moreButton type="button" class="chat-header__icon chat-header__mobile-action" (click)="toggleMore()" aria-label="Más opciones del asistente" aria-haspopup="menu" [attr.aria-expanded]="moreOpen">
              <span *ngIf="profileIncomplete" class="chat-header__dot" aria-hidden="true"></span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"></circle><circle cx="12" cy="12" r="1.7"></circle><circle cx="19" cy="12" r="1.7"></circle></svg>
            </button>
            <div *ngIf="moreOpen" #moreMenu class="chat-header__menu" role="menu" aria-label="Opciones del asistente" tabindex="-1" (keydown.escape)="closeMenuFromEvent($event)">
              <button *ngIf="isAuthenticated" type="button" role="menuitem" (click)="choose('conversations')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"></path></svg><span>Conversaciones</span></button>
              <button *ngIf="isAuthenticated" type="button" role="menuitem" (click)="choose('profile')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.5 21a7.5 7.5 0 0 1 15 0"></path></svg><span>{{ profileIncomplete ? 'Completar Perfil IA' : 'Perfil IA' }}</span><span *ngIf="profileIncomplete" class="chat-header__pending">Pendiente</span></button>
              <button *ngIf="isAuthenticated" type="button" role="menuitem" (click)="choose('new')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg><span>Nueva conversación</span></button>
              <button type="button" role="menuitem" (click)="choose('minimize')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m5 9 7 7 7-7"></path></svg><span>Minimizar asistente</span></button>
            </div>
          </div>

          <button type="button" class="chat-header__icon chat-header__mobile-minimize" (click)="closePanel.emit()" aria-label="Minimizar asistente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m5 9 7 7 7-7"></path></svg>
          </button>

          <button type="button" class="chat-header__icon chat-header__desktop-action" (click)="closePanel.emit()" aria-label="Cerrar asistente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; position: relative; z-index: 20; flex: 0 0 auto; }
    .chat-header { border-bottom: 1px solid var(--portal-border); background: var(--portal-surface-strong); padding: max(.5rem, var(--safe-top)) 1rem .5rem; }
    .chat-header__row { display: grid; min-height: 44px; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .5rem; }
    h2 { min-width: 0; margin: 0; overflow: hidden; color: var(--portal-text); font-size: var(--text-base); font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
    .chat-header__brand { display: flex; align-items: center; gap: .5rem; }
    .chat-header__brand-mark { display: inline-flex; width: 2rem; height: 2rem; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: .72rem; background: var(--guide-accent); color: white; box-shadow: 0 4px 12px color-mix(in srgb, var(--guide-accent) 22%, transparent); }
    .chat-header__brand-mark svg { width: 1.35rem; height: 1.35rem; }
    .chat-header__brand-short { display: none; }
    .chat-header__actions { display: flex; flex: 0 0 auto; align-items: center; gap: .25rem; }
    .chat-header__icon { position: relative; display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; border-radius: .85rem; background: transparent; color: var(--portal-text-muted); cursor: pointer; touch-action: manipulation; transition: color 150ms ease, background-color 150ms ease; }
    .chat-header__icon:hover, .chat-header__icon:active { background: var(--portal-bg-elevated); color: var(--portal-text); }
    .chat-header__icon svg { width: 1.15rem; height: 1.15rem; }
    .chat-header__dot { position: absolute; top: .42rem; right: .42rem; width: .48rem; height: .48rem; border: 2px solid var(--portal-surface-strong); border-radius: 999px; background: var(--guide-accent); }
    .chat-header__more-wrap { position: relative; display: none; }
    .chat-header__mobile-action { display: none; }
    .chat-header__mobile-minimize { display: none; }
    .chat-header__menu { position: absolute; top: calc(100% + .45rem); right: 0; width: min(17rem, calc(100vw - 1.5rem)); overflow: hidden; border: 1px solid var(--portal-border); border-radius: 1rem; background: var(--portal-bg-elevated); box-shadow: var(--shadow-lg); padding: .4rem; }
    .chat-header__menu button { display: grid; width: 100%; min-height: 48px; grid-template-columns: 1.25rem minmax(0, 1fr) auto; align-items: center; gap: .7rem; border: 0; border-radius: .75rem; background: transparent; color: var(--portal-text); padding: .55rem .7rem; text-align: left; cursor: pointer; touch-action: manipulation; }
    .chat-header__menu button:hover, .chat-header__menu button:active { background: var(--portal-surface-strong); }
    .chat-header__menu svg { width: 1.15rem; height: 1.15rem; stroke-width: 1.8; color: var(--portal-text-soft); }
    .chat-header__menu span { min-width: 0; font-size: var(--text-sm); font-weight: 700; }
    .chat-header__pending { border-radius: 999px; background: var(--assistant-chip-selected-bg); color: var(--assistant-chip-selected-text); padding: .2rem .45rem; font-size: var(--text-2xs) !important; }
    button:focus-visible { outline: 3px solid color-mix(in srgb, var(--guide-accent) 45%, transparent); outline-offset: 2px; }
    @media (max-width: 767px) {
      .chat-header { padding: .25rem .5rem; }
      .chat-header__brand-full, .chat-header__desktop-action, .chat-header__more-wrap, .chat-header__mobile-action { display: none; }
      .chat-header__brand-short, .chat-header__mobile-minimize { display: inline-flex; }
      .chat-header__actions { gap: 0; }
    }
    @media (max-width: 359px) {
      .chat-header__brand-short { display: none; }
      .chat-header__brand { gap: 0; }
      .chat-header__icon { width: 42px; }
    }
    @media (prefers-reduced-motion: reduce) { .chat-header__icon { transition: none; } }
  `],
})
export class ChatHeaderComponent {
  @Input() isAuthenticated = false;
  @Input() profileIncomplete = false;
  @Output() newConversation = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openSocial = new EventEmitter<void>();

  @ViewChild('moreButton') private moreButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('moreMenu') private moreMenu?: ElementRef<HTMLElement>;
  moreOpen = false;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  toggleMore(): void {
    this.moreOpen = !this.moreOpen;
    if (this.moreOpen) setTimeout(() => this.moreMenu?.nativeElement.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
  }

  choose(action: 'conversations' | 'profile' | 'new' | 'minimize'): void {
    this.moreOpen = false;
    if (action === 'conversations') this.toggleSidebar.emit();
    if (action === 'profile') this.openProfile.emit();
    if (action === 'new') this.newConversation.emit();
    if (action === 'minimize') this.closePanel.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.moreOpen && !this.host.nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  closeMenuFromEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeMenu();
  }

  private closeMenu(): void {
    if (!this.moreOpen) return;
    this.moreOpen = false;
    setTimeout(() => this.moreButton?.nativeElement.focus());
  }
}
