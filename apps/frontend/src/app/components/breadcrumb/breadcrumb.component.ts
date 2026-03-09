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
    <nav aria-label="Breadcrumb" class="mb-4 text-sm text-slate-400">
      <ol class="flex flex-wrap items-center gap-1">
        <li *ngFor="let item of items; let last = last">
          <a
            *ngIf="!last"
            [routerLink]="item.url"
            class="hover:text-white transition-colors"
          >{{ item.name }}</a>
          <span *ngIf="last" class="text-slate-200">{{ item.name }}</span>
          <span *ngIf="!last" class="mx-1 text-slate-600" aria-hidden="true">›</span>
        </li>
      </ol>
    </nav>
    <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>
  `,
})
export class BreadcrumbComponent {
  private _items: BreadcrumbItem[] = [];
  safeLdHtml: SafeHtml | null = null;

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
