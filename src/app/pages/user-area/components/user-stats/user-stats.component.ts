import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserActivity, UserList, UserListItem, UserProfile, UserRecommendation } from '../../../../interfaces/user.interface';

interface FavoriteCategory {
  id: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      
      <!-- Status Composer -->
      <section class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <span>👋</span> Mi Estado Actual
          </h2>
          <span class="text-xs text-green-400 font-medium px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            Modo Social Activo
          </span>
        </div>
        
        <form [formGroup]="statusForm" (ngSubmit)="onSubmitStatus()" class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              formControlName="title"
              placeholder="¿Qué estás viendo? (Ej. The Bear T3)"
              class="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            <input
              type="text"
              formControlName="mood"
              placeholder="¿Cómo te sientes? (Ej. Enganchado)"
              class="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="statusForm.invalid"
              class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/20"
            >
              Publicar Estado
            </button>
          </div>
        </form>
      </section>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- My Reminders -->
          <section class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                <span>⏰</span> Mis Próximos Recordatorios
              </h2>
              <button class="text-xs text-red-400 hover:text-red-300 font-medium">+ Nuevo</button>
            </div>
            
            <div *ngIf="reminders.length === 0" class="text-center py-6 text-gray-500">
              <p>No tienes recordatorios pendientes.</p>
            </div>

            <div class="space-y-3">
              <div *ngFor="let reminder of reminders" class="flex items-center gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 hover:bg-gray-900/60 transition-colors">
                <div class="h-12 w-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img *ngIf="reminder.poster" [src]="reminder.poster" class="w-full h-full object-cover">
                  <span *ngIf="!reminder.poster" class="text-lg">📺</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-medium text-sm truncate">{{ reminder.title }}</h4>
                  <p class="text-gray-400 text-xs">{{ reminder.type === 'movie' ? 'Película' : 'Serie' }}</p>
                </div>
                <button class="text-gray-400 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <!-- My Recent Activity -->
          <section class="space-y-4">
            <h3 class="text-gray-400 text-sm font-medium uppercase tracking-wider ml-1">Mi Actividad Reciente</h3>
            
            <div *ngIf="myActivities.length === 0" class="text-center py-10 text-gray-500 bg-gray-800/40 border border-gray-700/40 rounded-2xl">
              <p>Aún no has realizado ninguna actividad.</p>
            </div>

            <div *ngFor="let activity of myActivities" class="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-5 hover:bg-gray-800/60 transition-colors">
              <div class="flex items-start gap-4">
                <div class="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 text-lg">
                  <ng-container [ngSwitch]="activity.type">
                    <span *ngSwitchCase="'status'">📺</span>
                    <span *ngSwitchCase="'recommendation'">⭐</span>
                    <span *ngSwitchCase="'list'">📝</span>
                    <span *ngSwitchDefault>📢</span>
                  </ng-container>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="text-white font-medium">{{ activity.title }}</h4>
                    <span class="text-xs text-gray-500 whitespace-nowrap">{{ activity.createdAt }}</span>
                  </div>
                  <p class="text-gray-300 text-sm leading-relaxed">{{ activity.description }}</p>
                  <div class="mt-2 flex items-center gap-2" *ngIf="activity.badge">
                    <span class="px-2 py-1 rounded-md bg-gray-700/50 text-xs text-gray-300 border border-gray-600/50">
                      {{ activity.badge }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          
          <!-- My Lists Widget -->
          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white">Mis Listas</h2>
              <button class="text-xs text-red-400 hover:text-red-300 font-medium">Ver todas</button>
            </div>
            
            <div class="space-y-3">
              <div *ngFor="let list of lists.slice(0, 3)" class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 hover:bg-gray-900/60 transition-colors cursor-pointer">
                <div class="flex justify-between items-start mb-1">
                  <h4 class="text-white font-medium text-sm truncate pr-2">{{ list.title }}</h4>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 whitespace-nowrap">
                    {{ list.itemsCount }} items
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span [ngClass]="{
                    'text-green-400': list.visibility === 'public',
                    'text-blue-400': list.visibility === 'friends',
                    'text-gray-400': list.visibility === 'private'
                  }">
                    {{ list.visibility === 'public' ? 'Pública' : list.visibility === 'friends' ? 'Amigos' : 'Privada' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- My Recommendations Widget -->
          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm" *ngIf="recommendations.length > 0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white">Mis Recomendaciones</h2>
              <button class="text-xs text-red-400 hover:text-red-300 font-medium">Ver todas</button>
            </div>
            
            <div class="space-y-3">
              <div *ngFor="let rec of recommendations.slice(0, 3)" class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 hover:bg-gray-900/60 transition-colors cursor-pointer">
                <div class="flex justify-between items-start mb-1">
                  <h4 class="text-white font-medium text-sm truncate pr-2">{{ rec.title }}</h4>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 whitespace-nowrap">{{ rec.type }}</span>
                </div>
                <p class="text-gray-400 text-xs line-clamp-2 italic mb-2">"{{ rec.note }}"</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>⭐ {{ rec.rating }}</span>
                  <span class="text-red-400">{{ rec.visibility === 'public' ? 'Pública' : 'Amigos' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- My Favorites Widget -->
          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white">Mis Favoritos</h2>
              <button class="text-xs text-red-400 hover:text-red-300 font-medium">Ver todos</button>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <div *ngFor="let category of favoriteCategories" class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 hover:bg-gray-900/60 transition-colors cursor-pointer text-center">
                <p class="text-2xl mb-1">{{ category.icon }}</p>
                <p class="text-xs text-gray-400 mb-1">{{ category.label }}</p>
                <p class="text-lg font-bold text-white">{{ category.count }}</p>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  `,
  styles: []
})
export class UserStatsComponent {
  @Input() profile!: UserProfile | null;
  @Input() myActivities: UserActivity[] = [];
  @Input() lists: UserList[] = [];
  @Input() recommendations: UserRecommendation[] = [];
  @Input() reminders: UserListItem[] = [];
  @Output() updateStatus = new EventEmitter<{ title: string; mood: string }>();

  statusForm = this.fb.group({
    title: ['', Validators.required],
    mood: ['']
  });

  favoriteCategories = [
    { id: 'programs', label: 'Programas', icon: '📺', count: 12 },
    { id: 'channels', label: 'Canales', icon: '📡', count: 5 },
    { id: 'lists', label: 'Listas', icon: '📝', count: 3 },
    { id: 'users', label: 'Usuarios', icon: '👥', count: 8 }
  ];

  constructor(private fb: FormBuilder) {}

  onSubmitStatus() {
    if (this.statusForm.valid) {
      this.updateStatus.emit({
        title: this.statusForm.value.title!,
        mood: this.statusForm.value.mood || ''
      });
      this.statusForm.reset();
    }
  }
}
