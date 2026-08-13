import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { generateFAQSchema } from '../../utils/utils';

export interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="items.length" class="mt-10" itemscope itemtype="https://schema.org/FAQPage">
      <h2 class="text-lg font-bold text-[var(--portal-text)] mb-4">{{ heading }}</h2>
      <div class="space-y-2">
        <details
          *ngFor="let item of items; let i = index"
          class="group border border-[var(--portal-border)] rounded-lg bg-[var(--portal-surface-soft)]"
          itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"
        >
          <summary
            class="flex items-center justify-between gap-4 cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-200 hover:text-[var(--portal-text)] transition-colors"
          >
            <span itemprop="name">{{ item.question }}</span>
            <svg
              class="w-4 h-4 shrink-0 text-[var(--portal-text-muted)] group-open:rotate-180 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div class="px-4 pb-4 text-sm text-[var(--portal-text-muted)] leading-relaxed"
               itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <p itemprop="text">{{ item.answer }}</p>
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
    const schema = generateFAQSchema(this.items);
    this.safeLdJson = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
