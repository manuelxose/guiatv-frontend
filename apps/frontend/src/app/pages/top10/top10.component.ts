import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, first, takeUntil } from 'rxjs';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { BlogService } from 'src/app/services/blog.service';
import { MetaService } from 'src/app/services/meta.service';

interface Top10Item {
  rank: number;
  id: string;
  title: string;
  type: 'movie' | 'series' | 'program';
  image: string;
  platform?: string;
  channel?: string;
  rating: number;
  socialBadge?: string;
  change?: 'up' | 'down' | 'new' | 'same';
}

type CategoryTab = 'movies' | 'series' | 'programs' | 'platforms' | 'community';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [CommonModule, NavBarComponent],
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
})
export class Top10Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  activeTab: CategoryTab = 'movies';
  isLoading = false;

  // Mock Top 10 data (in real app would come from API/service)
  top10Data: Record<CategoryTab, Top10Item[]> = {
    movies: [
      { rank: 1, id: '1', title: 'Oppenheimer', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Amazon Prime', rating: 9.5, change: 'same', socialBadge: 'Muy recomendada por tus amigos' },
      { rank: 2, id: '2', title: 'Killers of the Flower Moon', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 9.3, change: 'up' },
      { rank: 3, id: '3', title: 'Poor Things', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.1, change: 'down' },
      { rank: 4, id: '4', title: 'La Zona de Interés', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Movistar+', rating: 8.9, change: 'new' },
      { rank: 5, id: '5', title: 'Anatomía de una Caída', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Filmin', rating: 8.8, change: 'same' },
      { rank: 6, id: '6', title: 'Los que se quedan', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Peacock', rating: 8.7, change: 'up' },
      { rank: 7, id: '7', title: 'El niño y la garza', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Max', rating: 8.6, change: 'same' },
      { rank: 8, id: '8', title: 'Maestro', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 8.5, change: 'down' },
      { rank: 9, id: '9', title: 'The Holdovers', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Peacock', rating: 8.4, change: 'new' },
      { rank: 10, id: '10', title: 'American Fiction', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Amazon Prime', rating: 8.3, change: 'up' }
    ],
    series: [
      { rank: 1, id: '11', title: 'The Last of Us', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.7, change: 'same', socialBadge: '15 amigos la están viendo' },
      { rank: 2, id: '12', title: 'The Bear - T2', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.6, change: 'up' },
      { rank: 3, id: '13', title: 'Succession - T4', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.5, change: 'down' },
      { rank: 4, id: '14', title: 'Wednesday', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 9.2, change: 'same' },
      { rank: 5, id: '15', title: 'Andor', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.1, change: 'new' },
      { rank: 6, id: '16', title: 'The White Lotus - T2', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.0, change: 'up' },
      { rank: 7, id: '17', title: 'Severance', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 8.9, change: 'same' },
      { rank: 8, id: '18', title: 'Silo', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 8.8, change: 'down' },
      { rank: 9, id: '19', title: 'The Crown - T6', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 8.7, change: 'new' },
      { rank: 10, id: '20', title: '1923', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Paramount+', rating: 8.6, change: 'up' }
    ],
    programs: [
      { rank: 1, id: '21', title: 'El Hormiguero', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Antena 3', rating: 8.5, change: 'same' },
      { rank: 2, id: '22', title: 'La Resistencia', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Movistar+', rating: 8.3, change: 'up' },
      { rank: 3, id: '23', title: 'MasterChef', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'La 1', rating: 8.2, change: 'down' },
      { rank: 4, id: '24', title: 'El Intermedio', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'La Sexta', rating: 8.0, change: 'same' },
      { rank: 5, id: '25', title: 'First Dates', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Cuatro', rating: 7.9, change: 'new' },
      { rank: 6, id: '26', title: 'Sálvame', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Telecinco', rating: 7.8, change: 'down' },
      { rank: 7, id: '27', title: 'Tu Cara Me Suena', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Antena 3', rating: 7.7, change: 'up' },
      { rank: 8, id: '28', title: 'Got Talent', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Telecinco', rating: 7.6, change: 'same' },
      { rank: 9, id: '29', title: 'Pasapalabra', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Antena 3', rating: 7.5, change: 'new' },
      { rank: 10, id: '30', title: 'La Voz', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Antena 3', rating: 7.4, change: 'down' }
    ],
    platforms: [
      { rank: 1, id: '31', title: 'The Last of Us', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.7, change: 'same' },
      { rank: 2, id: '32', title: 'Succession', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.5, change: 'up' },
      { rank: 3, id: '33', title: 'Oppenheimer', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Amazon Prime', rating: 9.5, change: 'down' },
      { rank: 4, id: '34', title: 'The Bear', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.4, change: 'same' },
      { rank: 5, id: '35', title: 'Severance', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 9.2, change: 'new' },
      { rank: 6, id: '36', title: 'Wednesday', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 9.2, change: 'down' },
      { rank: 7, id: '37', title: 'Killers of the Flower Moon', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 9.1, change: 'up' },
      { rank: 8, id: '38', title: 'Poor Things', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.0, change: 'same' },
      { rank: 9, id: '39', title: 'Silo', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 8.9, change: 'new' },
      { rank: 10, id: '40', title: 'The Crown', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 8.8, change: 'down' }
    ],
    community: [
      { rank: 1, id: '41', title: 'The Bear', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.4, change: 'same', socialBadge: 'Top recomendada por tu red' },
      { rank: 2, id: '42', title: 'Oppenheimer', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Amazon Prime', rating: 9.5, change: 'up', socialBadge: '45 amigos la recomiendan' },
      { rank: 3, id: '43', title: 'The Last of Us', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.7, change: 'down' },
      { rank: 4, id: '44', title: 'Severance', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 9.2, change: 'new' },
      { rank: 5, id: '45', title: 'Succession', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'HBO Max', rating: 9.5, change: 'same' },
      { rank: 6, id: '46', title: 'Wednesday', type: 'series', image: '/assets/images/placeholder.jpg', platform: 'Netflix', rating: 9.2, change: 'up' },
      { rank: 7, id: '47', title: 'Killers of the Flower Moon', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Apple TV+', rating: 9.1, change: 'down' },
      { rank: 8, id: '48', title: 'Poor Things', type: 'movie', image: '/assets/images/placeholder.jpg', platform: 'Disney+', rating: 9.0, change: 'same' },
      { rank: 9, id: '49', title: 'La Resistencia', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Movistar+', rating: 8.3, change: 'new' },
      { rank: 10, id: '50', title: 'El Hormiguero', type: 'program', image: '/assets/images/placeholder.jpg', channel: 'Antena 3', rating: 8.5, change: 'down' }
    ]
  };

  constructor(
    private blogSvc: BlogService,
    private metaSvc: MetaService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.setMetaTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMetaTags(): void {
    this.metaSvc.setMetaTags({
      title: 'Top 10 - Los Mejores Rankings de Cine, Series y Programas',
      description:
        'Descubre los mejores rankings de películas, series y programas de TV. Basados en  criterios de calidad y recomendaciones de la comunidad.',
      image: '/assets/images/top10-og-image.jpg',
      canonicalUrl: '/top10',
      type: 'website',
    });
  }

  setActiveTab(tab: CategoryTab): void {
    this.activeTab = tab;
  }

  get currentTop10(): Top10Item[] {
    return this.top10Data[this.activeTab] || [];
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'movie': return 'Película';
      case 'series': return 'Serie';
      case 'program': return 'Programa';
      default: return type;
    }
  }

  trackByItemId(index: number, item: Top10Item): string {
    return item.id;
  }
}
