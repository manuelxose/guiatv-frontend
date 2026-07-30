import { Inject, Pipe, PipeTransform, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

let _DOMPurify: any;

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  private readonly isBrowser: boolean;

  constructor(
    private readonly sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    marked.setOptions({ breaks: true, gfm: true });

    if (this.isBrowser && !_DOMPurify) {
      _DOMPurify = require('dompurify');
    }
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const raw = marked.parse(value, { async: false }) as string;

    if (!this.isBrowser || !_DOMPurify) {
      return this.sanitizer.bypassSecurityTrustHtml(raw);
    }

    const clean = _DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u',
        'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4',
        'a', 'code', 'pre', 'blockquote',
        'span', 'div', 'iframe',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'title'],
    });

    // Force all links to open in new tab safely
    let safeHtml = clean.replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" '
    );

    // Convert YouTube links to embedded players
    safeHtml = this.embedYouTubeLinks(safeHtml);

    return this.sanitizer.bypassSecurityTrustHtml(safeHtml);
  }

  private embedYouTubeLinks(html: string): string {
    // Match YouTube URLs in <a> tags and replace with responsive iframe
    const youtubeRegex = /<a[^>]*href="(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^"]*"[^>]*>[^<]*<\/a>/gi;

    return html.replace(youtubeRegex, (_match, videoId: string) => {
      return `<div class="mt-2 mb-2 rounded-xl overflow-hidden" style="position:relative;padding-bottom:56.25%;height:0">` +
        `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" ` +
        `title="YouTube video" loading="lazy" frameborder="0" ` +
        `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
        `allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:0.75rem"></iframe>` +
        `</div>`;
    });
  }
}
