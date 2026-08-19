import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballNewsDTO } from '@app/features/football/football.models';

/**
 * Football editorial card. No copyright-unsafe ingestion: only headline,
 * excerpt (if available) and an internal or external link.
 */
@Component({
  selector: 'app-football-news-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="news"
      [routerLink]="internalLink"
      [target]="item.externalSource ? '_blank' : undefined"
      [rel]="item.externalSource ? 'noopener' : undefined"
    >
      <span class="news__image" *ngIf="item.coverImage">
        <img [src]="item.coverImage" [alt]="''" loading="lazy" />
      </span>
      <span class="news__body">
        <span class="news__eyebrow">
          {{ contentTypeLabel }}
          <span *ngIf="item.externalSource">· {{ item.externalSource.name }}</span>
        </span>
        <span class="news__title">{{ item.title }}</span>
        <span class="news__excerpt" *ngIf="item.excerpt">{{ item.excerpt }}</span>
      </span>
    </a>
  `,
  styles: `
    :host { display: block; }
    .news {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.18));
      border-radius: 0.75rem;
      background: var(--football-card-bg, rgba(15, 23, 42, 0.6));
      color: inherit;
      text-decoration: none;
      transition: border-color 0.15s ease;
    }
    .news:hover { border-color: rgba(34, 197, 94, 0.4); }
    .news__image {
      flex: 0 0 4.5rem;
      height: 4.5rem;
      border-radius: 0.5rem;
      overflow: hidden;
      background: rgba(148, 163, 184, 0.12);
    }
    .news__image img { width: 100%; height: 100%; object-fit: cover; }
    .news__body { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
    .news__eyebrow {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--football-text-muted, #94a3b8);
    }
    .news__title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--football-text, #f1f5f9);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .news__excerpt {
      font-size: 0.75rem;
      color: var(--football-text-muted, #94a3b8);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export class FootballNewsCardComponent {
  @Input({ required: true }) item!: FootballNewsDTO;

  get internalLink(): string {
    return `/deportes/futbol/noticias/${this.item.slug}`;
  }

  get contentTypeLabel(): string {
    switch (this.item.contentType) {
      case 'analysis':
        return 'Análisis';
      case 'preview':
        return 'Previa';
      case 'match-report':
        return 'Crónica';
      case 'guide':
        return 'Guía';
      case 'ranking':
        return 'Ranking';
      case 'trend':
        return 'Tendencia';
      default:
        return 'Noticia';
    }
  }
}
