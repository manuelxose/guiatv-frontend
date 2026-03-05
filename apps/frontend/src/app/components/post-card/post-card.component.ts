import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl cursor-pointer"
      [attr.aria-label]="'Artículo: ' + post.title?.rendered"
    >
      <!-- Image Container -->
      <div class="relative aspect-[16/9] overflow-hidden bg-gray-700">
        <img
          [src]="
            post.featured_image?.source_url || '/assets/images/placeholder.jpg'
          "
          [alt]="post.title?.rendered || 'Imagen del artículo'"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          width="400"
          height="225"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>

        <!-- Reading Time Badge -->
        <span
          class="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full"
        >
          {{ getReadingTime(post.content?.rendered) }} min
        </span>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-3">
        <!-- Categories -->
        <div class="flex flex-wrap gap-2" *ngIf="post.categories_name?.length">
          <span
            *ngFor="let cat of post.categories_name.slice(0, 2)"
            class="inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full"
          >
            {{ cat.name }}
          </span>
        </div>

        <!-- Title -->
        <h3
          class="text-lg font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors duration-200"
        >
          {{ post.title?.rendered }}
        </h3>

        <!-- Excerpt -->
        <p
          class="text-sm text-gray-400 line-clamp-2"
          *ngIf="post.excerpt?.rendered"
        >
          {{ stripHtml(post.excerpt.rendered) }}
        </p>

        <!-- Meta Info -->
        <div
          class="flex items-center justify-between pt-3 border-t border-gray-700"
        >
          <time [dateTime]="post.date" class="text-xs text-gray-500">
            {{ post.date | date : 'dd MMM yyyy' }}
          </time>
          <span
            class="text-xs text-red-400 font-medium group-hover:translate-x-1 transition-transform duration-200 inline-flex items-center"
          >
            Leer más
            <svg
              class="ml-1 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>

      <!-- Schema.org JSON-LD for SEO -->
      <script type="application/ld+json">
        {{
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title?.rendered,
            "image": post.featured_image?.source_url,
            "datePublished": post.date,
            "dateModified": post.modified,
            "author": {
              "@type": "Person",
              "name": "Equipo Editorial"
            }
          } | json
        }}
      </script>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostCardComponent {
  @Input() post: any;

  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  getReadingTime(content: string): number {
    if (!content) return 1;
    const text = this.stripHtml(content);
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }
}
