import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserActivity, UserFriend, UserRecommendation } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-social-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Activity Feed -->
      <section class="lg:col-span-2 space-y-6">
        
        <!-- Share Status Composer -->
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <span>🌐</span> Comparte qué estás viendo
            </h2>
            <span class="text-xs text-green-400 font-medium px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              Compartir con Amigos
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
                Publicar en Feed
              </button>
            </div>
          </form>
        </div>

        <!-- Friends Activity Feed -->
        <div class="space-y-4">
          <h3 class="text-gray-400 text-sm font-medium uppercase tracking-wider ml-1">Actividad de Amigos y Comunidad</h3>
          
          <div *ngIf="activities.length === 0" class="text-center py-10 text-gray-500 bg-gray-800/40 border border-gray-700/40 rounded-2xl">
            <p>No hay actividad reciente de tus amigos.</p>
          </div>

          <div *ngFor="let activity of activities" class="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-5 hover:bg-gray-800/60 transition-colors">
            <div class="flex items-start gap-4">
              <!-- Avatar -->
              <div class="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600 overflow-hidden">
                 <img *ngIf="activity.user?.avatar" [src]="activity.user?.avatar" class="w-full h-full object-cover">
                 <span *ngIf="!activity.user?.avatar" class="text-lg">
                    <ng-container [ngSwitch]="activity.type">
                        <span *ngSwitchCase="'status'">📺</span>
                        <span *ngSwitchCase="'recommendation'">⭐</span>
                        <span *ngSwitchCase="'list'">📝</span>
                        <span *ngSwitchCase="'follow'">👥</span>
                        <span *ngSwitchDefault>📢</span>
                    </ng-container>
                 </span>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                      <span class="text-white font-bold">{{ activity.user?.name || 'Usuario' }}</span>
                      <span class="text-gray-400 text-sm">
                        {{ getActivityVerb(activity.type) }}
                      </span>
                  </div>
                  <span class="text-xs text-gray-500 whitespace-nowrap">{{ activity.createdAt }}</span>
                </div>
                
                <h4 class="text-white font-medium truncate mt-1">{{ activity.title }}</h4>
                <p class="text-gray-300 text-sm leading-relaxed mt-1">{{ activity.description }}</p>
                
                <!-- Optional Image -->
                <div *ngIf="activity.image" class="mt-3 rounded-xl overflow-hidden border border-gray-700/50 max-w-md">
                    <img [src]="activity.image" class="w-full h-48 object-cover" alt="Content">
                </div>

                <!-- Badge -->
                <div class="mt-3 flex items-center gap-2" *ngIf="activity.badge">
                  <span class="px-2 py-1 rounded-md bg-gray-700/50 text-xs text-gray-300 border border-gray-600/50">
                    {{ activity.badge }}
                  </span>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                  <button class="text-gray-400 hover:text-red-400 text-xs font-medium flex items-center gap-1 transition-colors">
                    ❤️ Me gusta
                  </button>
                  <button class="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors">
                    💬 Comentar
                  </button>
                  <button class="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors ml-auto">
                    ➕ Añadir a lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Sidebar: Friends & Recommendations -->
      <aside class="space-y-6">
        
        <!-- Active Friends -->
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white">Amigos Activos</h2>
            <button class="text-xs text-red-400 hover:text-red-300 font-medium">Buscar</button>
          </div>
          
          <div class="space-y-4">
            <div *ngFor="let friend of friends" class="flex items-center gap-3 group">
              <div class="relative">
                <div class="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 overflow-hidden">
                  <img *ngIf="friend.avatar" [src]="friend.avatar" class="w-full h-full object-cover">
                  <span *ngIf="!friend.avatar">{{ friend.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div 
                  class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-800"
                  [ngClass]="friend.isOnline ? 'bg-green-500' : 'bg-gray-500'"
                ></div>
              </div>
              
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ friend.name }}</p>
                <p class="text-gray-500 text-xs truncate">{{ friend.lastActivity }}</p>
              </div>

              <div class="flex gap-2">
                <button 
                  (click)="onToggleFollow(friend.id)"
                  class="px-3 py-1 rounded-full text-xs font-bold transition-all border"
                  [ngClass]="friend.following ? 'bg-transparent border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-500' : 'bg-white text-black border-transparent hover:bg-gray-200'"
                >
                  {{ friend.following ? 'Siguiendo' : 'Seguir' }}
                </button>
                <button 
                  class="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title="Enviar mensaje"
                >
                  💬
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Social Trends -->
        <div class="bg-gradient-to-br from-blue-900/20 to-gray-800/60 border border-blue-500/20 rounded-2xl p-6">
          <h3 class="text-blue-200 font-semibold mb-3">Tendencias de Mi Red</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Lo más recomendado:</span>
              <span class="text-white font-medium">Dune 2</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Lista más seguida:</span>
              <span class="text-white font-medium">Sci-Fi Épico</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Más comentado:</span>
              <span class="text-white font-medium">The Bear T3</span>
            </div>
          </div>
        </div>

        <!-- Friends Recommendations -->
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm" *ngIf="recommendations.length > 0">
          <h2 class="text-lg font-semibold text-white mb-4">Recomendaciones de Amigos</h2>
          <div class="space-y-4">
            <div *ngFor="let rec of recommendations.slice(0, 3)" class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 hover:bg-gray-900/60 transition-colors cursor-pointer">
              <div class="flex items-start gap-2 mb-2">
                <div class="h-6 w-6 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                  <img *ngIf="rec.user?.avatar" [src]="rec.user.avatar" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-400">{{ rec.user?.name || 'Amigo' }} recomienda:</p>
                  <h4 class="text-white font-medium text-sm truncate">{{ rec.title }}</h4>
                </div>
              </div>
              <p class="text-gray-400 text-xs line-clamp-2 italic">"{{ rec.note }}"</p>
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-yellow-400">⭐ {{ rec.rating }}</span>
                <span class="text-gray-500">{{ rec.createdAt }}</span>
              </div>
            </div>
          </div>
        </div>

      </aside>
    </div>
  `,
  styles: []
})
export class UserSocialFeedComponent {
  @Input() activities: UserActivity[] = [];
  @Input() friends: UserFriend[] = [];
  @Input() recommendations: UserRecommendation[] = [];
  @Output() updateStatus = new EventEmitter<{ title: string; mood: string }>();
  @Output() toggleFollow = new EventEmitter<string>();

  statusForm = this.fb.group({
    title: ['', Validators.required],
    mood: ['']
  });

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

  onToggleFollow(id: string) {
    this.toggleFollow.emit(id);
  }

  getActivityVerb(type: string): string {
    switch (type) {
      case 'status': return 'está viendo';
      case 'recommendation': return 'recomendó';
      case 'list': return 'creó una lista';
      case 'follow': return 'ahora sigue a';
      case 'comment': return 'comentó';
      case 'like': return 'le gustó';
      default: return 'actividad';
    }
  }
}
