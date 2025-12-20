import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FavoriteItem {
  id: string;
  title: string;
  image: string;
  subtitle?: string;
  type: 'channel' | 'program' | 'list' | 'user';
}

@Component({
  selector: 'app-user-favorites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Favoritos</h2>
          <p class="text-sm text-slate-400">Gestiona lo que mas te gusta desde un solo lugar.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtros de favoritos">
        <button
          *ngFor="let filter of filters"
          type="button"
          (click)="activeFilter = filter.id"
          class="min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          [attr.aria-pressed]="activeFilter === filter.id"
          [ngClass]="activeFilter === filter.id ? 'border-red-500/60 text-white bg-red-500/10' : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'"
        >
          {{ filter.label }}
        </button>
      </div>

      <div *ngIf="getFilteredItems().length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center">
        <p class="text-white font-medium mb-2">No hay favoritos en este filtro.</p>
        <p class="text-sm text-slate-400">Explora contenido y marca tus favoritos para verlos aqui.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          *ngFor="let item of getFilteredItems()"
          class="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col"
        >
          <div class="aspect-[2/3] bg-slate-900/80">
            <img [src]="item.image" class="w-full h-full object-cover" [alt]="item.title" />
          </div>
          <div class="p-4 space-y-3 flex-1 flex flex-col">
            <div class="space-y-1">
              <span class="text-[10px] uppercase tracking-[0.2em] text-slate-500">{{ item.type }}</span>
              <h3 class="text-sm font-semibold text-white leading-tight line-clamp-2">{{ item.title }}</h3>
              <p *ngIf="item.subtitle" class="text-xs text-slate-400 line-clamp-1">{{ item.subtitle }}</p>
            </div>
            <div class="mt-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Abrir
              </button>
              <button
                type="button"
                class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Quitar favorito"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserFavoritesComponent implements OnInit {
  activeFilter: string = 'all';
  filters = [
    { id: 'all', label: 'Todos' },
    { id: 'channels', label: 'Canales' },
    { id: 'programs', label: 'Programas' },
    { id: 'lists', label: 'Listas' },
    { id: 'users', label: 'Usuarios' },
  ];

  items: FavoriteItem[] = [];

  ngOnInit() {
    this.items = [
      {
        id: '1',
        title: 'Antena 3',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Antena_3_%282017%29.svg/1200px-Antena_3_%282017%29.svg.png',
        type: 'channel',
        subtitle: 'Generalista',
      },
      {
        id: '2',
        title: 'La Resistencia',
        image: 'https://img.nbc.com/sites/nbcunbc/files/images/2021/3/31/190215_3905096_La_Resistencia_an_Interview_Show_Like_No_Ot.jpg',
        type: 'program',
        subtitle: 'Late Night',
      },
      {
        id: '3',
        title: 'Cine de Accion',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7zR0s0j1k_1k_1k_1k_1k_1k_1k_1k_1k&s',
        type: 'list',
        subtitle: 'Por @alex',
      },
      {
        id: '4',
        title: 'Maria Lopez',
        image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        type: 'user',
        subtitle: '@marial',
      },
      {
        id: '5',
        title: 'Stranger Things',
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/78/Stranger_Things_season_4.jpg/220px-Stranger_Things_season_4.jpg',
        type: 'program',
        subtitle: 'Serie',
      },
    ];
  }

  getFilteredItems() {
    if (this.activeFilter === 'all') return this.items;
    return this.items.filter((item) => {
      if (this.activeFilter === 'channels') return item.type === 'channel';
      if (this.activeFilter === 'programs') return item.type === 'program';
      if (this.activeFilter === 'lists') return item.type === 'list';
      if (this.activeFilter === 'users') return item.type === 'user';
      return true;
    });
  }
}
