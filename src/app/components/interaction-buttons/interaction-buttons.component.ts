import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-interaction-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center" [class.gap-3]="!compact" [class.gap-1.5]="compact">
      <!-- Watchlist Button -->
      <button
        (click)="toggleWatchlist()"
        class="group flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-600 transition-all duration-200 backdrop-blur-sm"
        [ngClass]="{
          '!bg-red-600/20 !border-red-500/50': isInWatchlist,
          'px-2 py-2': compact
        }"
        [title]="isInWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-300 group-hover:text-white transition-colors"
          [ngClass]="{'!text-red-400': isInWatchlist, 'h-4 w-4': compact}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium text-gray-300 group-hover:text-white" [ngClass]="{'!text-red-300': isInWatchlist}">
          {{ isInWatchlist ? 'En lista' : 'Mi lista' }}
        </span>
      </button>

      <!-- Recommend Button -->
      <button
        (click)="showModal = true"
        class="group flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-600 transition-all duration-200 backdrop-blur-sm"
        [ngClass]="{'px-2 py-2': compact}"
        title="Recomendar a amigos"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-300 group-hover:text-white transition-colors"
          [ngClass]="{'h-4 w-4': compact}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium text-gray-300 group-hover:text-white">Recomendar</span>
      </button>

      <!-- Rate Button -->
      <button
        (click)="rate()"
        class="group flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-600 transition-all duration-200 backdrop-blur-sm"
        [ngClass]="{'px-2 py-2': compact}"
        title="Valorar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-300 group-hover:text-yellow-400 transition-colors"
          [ngClass]="{'h-4 w-4': compact}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>
    </div>

    <!-- Recommendation Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button (click)="showModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 class="text-xl font-bold text-white mb-4">Recomendar a amigos</h3>
        <p class="text-gray-300 text-sm mb-6">Comparte "{{ title }}" con tus seguidores.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Nota (opcional)</label>
            <textarea
              #noteInput
              rows="3"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="¿Por qué te ha gustado?"
            ></textarea>
          </div>
          
          <button
            (click)="submitRecommendation(noteInput.value)"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Enviar recomendación
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class InteractionButtonsComponent {
  @Input() itemId: string = '';
  @Input() title: string = '';
  @Input() type: 'movie' | 'series' | 'program' = 'program';
  @Input() compact: boolean = false;

  public isInWatchlist = false;
  public showModal = false;

  constructor(private userService: UserService) {}

  toggleWatchlist() {
    this.isInWatchlist = !this.isInWatchlist;
    if (this.isInWatchlist) {
      this.userService.updateListItemState(this.itemId || 'temp-id', 'pending');
    }
  }

  submitRecommendation(note: string) {
    this.userService.addRecommendation({
      title: this.title,
      type: this.type === 'program' ? 'movie' : this.type,
      visibility: 'friends',
      note: note
    });
    this.showModal = false;
    // Optional: Show success toast
  }

  rate() {
    alert('Funcionalidad de valoración próximamente.');
  }
}
