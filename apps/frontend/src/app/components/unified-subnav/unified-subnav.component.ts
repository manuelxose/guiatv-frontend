import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Params } from '@angular/router';
import { RouterModule } from '@angular/router';

export interface UnifiedSubnavCard {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  action: string;
  queryParams?: Params;
  tone?: 'home' | 'live' | 'discover' | 'streaming' | 'sports' | 'editorial' | 'rankings';
}

@Component({
  selector: 'app-unified-subnav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unified-subnav.component.html',
  styleUrl: './unified-subnav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedSubnavComponent {
  @Input() cards: readonly UnifiedSubnavCard[] = [];

  trackByCard(_index: number, card: UnifiedSubnavCard): string {
    return `${card.path}-${card.title}`;
  }
}
