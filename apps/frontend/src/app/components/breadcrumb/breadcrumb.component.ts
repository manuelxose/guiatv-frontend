import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { generateBreadcrumbSchema } from '../../utils/utils';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav
      aria-label="Breadcrumb"
      class="breadcrumb"
      [class.breadcrumb--embedded]="embedded"
    >
      <ol>
        <li *ngFor="let item of items; let first = first; let last = last">
          <a
            *ngIf="!last"
            [routerLink]="item.url"
          >
            <svg *ngIf="first" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="m3.75 10.5 8.25-7 8.25 7v9a.75.75 0 0 1-.75.75h-4.75v-6.5h-5.5v6.5H4.5a.75.75 0 0 1-.75-.75v-9Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"></path>
            </svg>
            {{ item.name }}
          </a>
          <span *ngIf="last" class="breadcrumb__current">{{ item.name }}</span>
          <svg *ngIf="!last" class="breadcrumb__separator" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="m7.5 4.5 5 5.5-5 5.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"></path>
          </svg>
        </li>
      </ol>
    </nav>
    <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .breadcrumb {
      margin: 0 0 1rem;
      color: var(--portal-text-muted);
      font-size: var(--text-xs);
    }
    .breadcrumb--embedded { margin: 0; }
    .breadcrumb ol {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .2rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .breadcrumb li { display: inline-flex; align-items: center; min-width: 0; }
    .breadcrumb a,
    .breadcrumb__current {
      display: inline-flex;
      min-height: 2rem;
      align-items: center;
      gap: .38rem;
      border-radius: .65rem;
      padding: .25rem .42rem;
      color: var(--portal-text-soft);
      font-weight: 650;
      line-height: 1.2;
      text-decoration: none;
    }
    .breadcrumb a { transition: background-color 160ms ease, color 160ms ease; }
    .breadcrumb a:hover {
      background: var(--portal-surface-strong);
      color: var(--portal-text);
    }
    .breadcrumb a:focus-visible {
      outline: 2px solid var(--guide-accent);
      outline-offset: 1px;
    }
    .breadcrumb a svg { width: .9rem; height: .9rem; flex: 0 0 auto; }
    .breadcrumb__current {
      max-width: min(34rem, 60vw);
      overflow: hidden;
      color: var(--portal-text);
      font-weight: 800;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .breadcrumb__separator {
      width: .8rem;
      height: .8rem;
      flex: 0 0 auto;
      color: var(--portal-text-faint);
    }
    @media (max-width: 639px) {
      .breadcrumb { font-size: .72rem; }
      .breadcrumb__current { max-width: 45vw; }
    }
    @media (prefers-reduced-motion: reduce) {
      .breadcrumb a { transition: none; }
    }
  `],
})
export class BreadcrumbComponent {
  private _items: BreadcrumbItem[] = [];
  safeLdHtml: SafeHtml | null = null;
  @Input() embedded = false;

  private static readonly BASE_URL = 'https://guiaprogramaciontv.com';

  constructor(private readonly sanitizer: DomSanitizer) {}

  @Input()
  set items(value: BreadcrumbItem[]) {
    this._items = value || [];
    this.buildLdJson();
  }

  get items(): BreadcrumbItem[] {
    return this._items;
  }

  private buildLdJson(): void {
    if (!this._items.length) {
      this.safeLdHtml = null;
      return;
    }
    const schema = generateBreadcrumbSchema(this._items, BreadcrumbComponent.BASE_URL);
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
