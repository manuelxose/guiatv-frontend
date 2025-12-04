import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';

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
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Favoritos</h2>
          <p class="text-gray-400 text-sm">Todo lo que te encanta en un solo lugar</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <button 
          *ngFor="let filter of filters"
          (click)="activeFilter = filter.id"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent"
          [ngClass]="activeFilter === filter.id ? 'bg-white/10 text-white border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div 
          *ngFor="let item of getFilteredItems()" 
          class="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer"
        >
          <img [src]="item.image" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" [alt]="item.title">
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="absolute inset-0 p-4 flex flex-col justify-end">
            <span class="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">{{ item.type }}</span>
            <h3 class="font-bold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">{{ item.title }}</h3>
            <p *ngIf="item.subtitle" class="text-xs text-gray-400 mt-1 line-clamp-1">{{ item.subtitle }}</p>
          </div>

          <button class="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserFavoritesComponent implements OnInit {
  activeFilter: string = 'all';
  filters = [
    { id: 'all', label: 'Todos' },
    { id: 'channels', label: 'Canales' },
    { id: 'programs', label: 'Programas' },
    { id: 'lists', label: 'Listas' },
    { id: 'users', label: 'Usuarios' }
  ];

  items: FavoriteItem[] = [];

  ngOnInit() {
    // Mock data
    this.items = [
      { id: '1', title: 'Antena 3', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Antena_3_%282017%29.svg/1200px-Antena_3_%282017%29.svg.png', type: 'channel', subtitle: 'Generalista' },
      { id: '2', title: 'La Resistencia', image: 'https://img.nbc.com/sites/nbcunbc/files/images/2021/3/31/190215_3905096_La_Resistencia_an_Interview_Show_Like_No_Ot.jpg', type: 'program', subtitle: 'Late Night' },
      { id: '3', title: 'Cine de Acción', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7zR0s0j1k_1k_1k_1k_1k_1k_1k_1k_1k&s', type: 'list', subtitle: 'Por @alex' },
      { id: '4', title: 'María López', image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', type: 'user', subtitle: '@marial' },
      { id: '5', title: 'Stranger Things', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/78/Stranger_Things_season_4.jpg/220px-Stranger_Things_season_4.jpg', type: 'program', subtitle: 'Serie' }
    ];
  }

  getFilteredItems() {
    if (this.activeFilter === 'all') return this.items;
    return this.items.filter(item => {
      if (this.activeFilter === 'channels') return item.type === 'channel';
      if (this.activeFilter === 'programs') return item.type === 'program';
      if (this.activeFilter === 'lists') return item.type === 'list';
      if (this.activeFilter === 'users') return item.type === 'user';
      return true;
    });
  }
}
