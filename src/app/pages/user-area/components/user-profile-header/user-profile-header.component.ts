import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserProfile } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-profile-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm"
      *ngIf="profile"
    >
      <div class="flex items-center gap-5">
        <div class="relative">
          <div
            class="h-24 w-24 rounded-2xl bg-gradient-to-br from-red-500/80 to-red-700/80 flex items-center justify-center text-3xl font-bold shadow-lg shadow-red-900/30 overflow-hidden"
          >
            <img
              *ngIf="profile.avatar && profile.avatar !== '/assets/gpt-avatar.png'"
              [src]="profile.avatar"
              alt="Avatar"
              class="h-full w-full object-cover"
            />
            <span *ngIf="!profile.avatar || profile.avatar === '/assets/gpt-avatar.png'">
              {{ profile.name.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div
            class="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-4 border-gray-800 rounded-full"
            title="Online"
            *ngIf="profile.privacy.showOnline"
          ></div>
        </div>
        
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-extrabold leading-tight text-white tracking-tight">
              {{ profile.name }}
            </h1>
            <span class="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/20">
              Pro
            </span>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 ml-2">
              <button 
                *ngIf="isOwnProfile"
                (click)="onEditProfile()"
                class="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Editar Perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              <ng-container *ngIf="!isOwnProfile">
                <button 
                  class="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-900/20"
                >
                  Seguir
                </button>
                <button 
                  class="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  title="Enviar Mensaje"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </ng-container>
            </div>
          </div>
          
          <p class="text-gray-400 text-sm font-medium">
            {{ '@' + profile.username }} · {{ profile.location }}
          </p>
          <p class="text-gray-300 text-sm max-w-md line-clamp-2">
            {{ profile.bio }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 lg:pb-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-700/50 w-full lg:w-auto">
        <div class="text-center min-w-[70px] cursor-pointer group">
          <p class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-red-400 transition-colors">Seguidores</p>
          <p class="text-xl font-black text-white">{{ profile.stats.followers | number }}</p>
        </div>
        <div class="w-px h-8 bg-gray-700/50"></div>
        <div class="text-center min-w-[70px] cursor-pointer group">
          <p class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-red-400 transition-colors">Siguiendo</p>
          <p class="text-xl font-black text-white">{{ profile.stats.following | number }}</p>
        </div>
        <div class="w-px h-8 bg-gray-700/50"></div>
        <div class="text-center min-w-[70px] cursor-pointer group">
          <p class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-red-400 transition-colors">Listas</p>
          <p class="text-xl font-black text-white">{{ profile.stats.listsCreated | number }}</p>
        </div>
        <div class="w-px h-8 bg-gray-700/50"></div>
        <div class="text-center min-w-[70px] cursor-pointer group">
          <p class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-red-400 transition-colors">Recom.</p>
          <p class="text-xl font-black text-white">{{ profile.stats.recommendations | number }}</p>
        </div>
        <div class="w-px h-8 bg-gray-700/50"></div>
        <div class="text-center min-w-[70px] cursor-pointer group">
          <p class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-red-400 transition-colors">Valoraciones</p>
          <p class="text-xl font-black text-white">{{ profile.stats.ratings | number }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UserProfileHeaderComponent {
  @Input() profile!: UserProfile;
  @Input() isOwnProfile: boolean = true;
  @Output() editProfile = new EventEmitter<void>();

  onEditProfile() {
    this.editProfile.emit();
  }
}
