import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="items.length" class="mt-10">
      <h2 class="text-lg font-bold text-white mb-4">{{ heading }}</h2>
      <div class="space-y-2">
        <details
          *ngFor="let item of items; let i = index"
          class="group border border-white/10 rounded-lg bg-white/[0.02]"
        >
          <summary
            class="flex items-center justify-between gap-4 cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-200 hover:text-white transition-colors"
          >
            {{ item.question }}
            <svg
              class="w-4 h-4 shrink-0 text-gray-500 group-open:rotate-180 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div class="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
            {{ item.answer }}
          </div>
        </details>
      </div>
      <div [innerHTML]="safeLdJson"></div>
    </section>
  `,
})
export class FaqSectionComponent implements OnChanges {
  @Input() heading = 'Preguntas frecuentes';
  @Input() items: FaqItem[] = [];
  safeLdJson: SafeHtml = '';

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    if (!this.items.length) {
      this.safeLdJson = '';
      return;
    }
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    this.safeLdJson = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
