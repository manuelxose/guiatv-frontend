import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-card-horizontal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-card-horizontal.component.html',
  styleUrls: ['./post-card-horizontal.component.scss'],
})
export class PostCardHorizontalComponent {
  @Input() post: any;

  stripHtml(html: string): string {
    if (!html) return '';
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
