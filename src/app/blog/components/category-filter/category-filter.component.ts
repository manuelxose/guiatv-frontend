import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 pb-2"
      role="navigation"
      aria-label="Filtro de categorías"
    >
      <button
        (click)="selectCategory(null)"
        [class.active]="selectedCategory === null"
        class="filter-btn whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        [class.bg-red-600]="selectedCategory === null"
        [class.text-white]="selectedCategory === null"
        [class.bg-gray-700]="selectedCategory !== null"
        [class.text-gray-300]="selectedCategory !== null"
        [class.hover:bg-red-700]="selectedCategory === null"
        [class.hover:bg-gray-600]="selectedCategory !== null"
        aria-label="Mostrar todas las categorías"
      >
        <svg
          class="inline-block w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        Todas
      </button>

      <button
        *ngFor="let category of categories; trackBy: trackById"
        (click)="selectCategory(category.id)"
        [class.active]="selectedCategory === category.id"
        class="filter-btn whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        [class.bg-red-600]="selectedCategory === category.id"
        [class.text-white]="selectedCategory === category.id"
        [class.bg-gray-700]="selectedCategory !== category.id"
        [class.text-gray-300]="selectedCategory !== category.id"
        [class.hover:bg-red-700]="selectedCategory === category.id"
        [class.hover:bg-gray-600]="selectedCategory !== category.id"
        [attr.aria-label]="'Filtrar por ' + category.name"
        [attr.aria-pressed]="selectedCategory === category.id"
      >
        {{ category.name }}
      </button>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .filter-btn {
        transform: scale(1);
      }

      .filter-btn:hover {
        transform: scale(1.05);
      }

      .filter-btn.active {
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      }

      /* Scroll behavior optimizado */
      nav {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      @media (max-width: 640px) {
        .filter-btn {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }
      }
    `,
  ],
})
export class CategoryFilterComponent {
  @Input() categories: any[] = [];
  @Input() selectedCategory: string | null = null;
  @Output() categorySelected = new EventEmitter<string | null>();

  selectCategory(categoryId: string | null): void {
    this.categorySelected.emit(categoryId);
  }

  trackById(index: number, item: any): number {
    return item.id || index;
  }
}
