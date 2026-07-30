import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogItem } from '../../services/catalog.service';
import { CatalogCardComponent } from '../catalog-card/catalog-card.component';

@Component({
  selector: 'app-catalog-rail',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogCardComponent],
  template: `
    <section class="space-y-4">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p *ngIf="eyebrow" class="text-[11px] uppercase tracking-[0.35em] text-slate-500">
            {{ eyebrow }}
          </p>
          <h2 class="text-2xl font-semibold text-white">{{ title }}</h2>
          <p *ngIf="subtitle" class="mt-1 text-sm text-slate-400">{{ subtitle }}</p>
        </div>
        <a
          *ngIf="linkLabel && linkPath"
          [routerLink]="linkPath"
          [queryParams]="linkQueryParams"
          class="min-h-[40px] rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
        >
          {{ linkLabel }}
        </a>
      </div>

      <div class="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
        <div *ngFor="let item of items" class="w-[280px] flex-shrink-0">
          <app-catalog-card [item]="item" [compact]="true"></app-catalog-card>
        </div>
      </div>
    </section>
  `,
})
export class CatalogRailComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() linkLabel = '';
  @Input() linkPath: any[] | string | null = null;
  @Input() linkQueryParams: Record<string, string> | null = null;
  @Input() items: CatalogItem[] = [];
}
