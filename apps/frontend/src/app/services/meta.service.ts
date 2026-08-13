import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  public url: string =
    environment.SITE_URL || 'https://guiaprogramaciontv.com';

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document
  ) {}

  setMetaTags(config: any) {
    // Set title using Angular's Title service
    this.title.setTitle(config.title);

    // Remove existing meta tags
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('name="viewport"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:width"');
    this.meta.removeTag('property="og:image:height"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="og:locale"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:site"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('property="article:published_time"');
    this.meta.removeTag('property="article:modified_time"');
    this.meta.removeTag('property="article:section"');
    this.meta.removeTag('name="robots"');
    this.meta.removeTag('name="ssr-status"');

    // Add new meta tags using Angular's Meta service
    this.meta.addTag({ name: 'description', content: config.description });

    // Open Graph - complete
    this.meta.addTag({ property: 'og:title', content: config.title });
    this.meta.addTag({ property: 'og:description', content: config.description });
    this.meta.addTag({ property: 'og:type', content: config.type || 'website' });
    this.meta.addTag({ property: 'og:site_name', content: 'Guía Programación TV' });
    this.meta.addTag({ property: 'og:locale', content: 'es_ES' });

    // og:image/twitter:image must be absolute per the Open Graph spec — unlike
    // canonicalUrl (resolved below), relative fallback paths (e.g. a local
    // /assets/... image) were being emitted as-is. Resolve them the same way.
    const rawOgImg = config.ogImage || config.image;
    const ogImg = rawOgImg && /^https?:\/\//i.test(rawOgImg)
      ? rawOgImg
      : rawOgImg
        ? this.url + (rawOgImg.startsWith('/') ? rawOgImg : `/${rawOgImg}`)
        : undefined;
    if (ogImg) {
      this.meta.addTag({ property: 'og:image', content: ogImg });
      this.meta.addTag({ property: 'og:image:width', content: '1200' });
      this.meta.addTag({ property: 'og:image:height', content: '630' });
    }

    // Twitter Card - complete
    this.meta.addTag({ name: 'twitter:card', content: config.twitterCard || 'summary_large_image' });
    this.meta.addTag({ name: 'twitter:site', content: '@gptv' });
    this.meta.addTag({ name: 'twitter:title', content: config.title });
    this.meta.addTag({ name: 'twitter:description', content: config.description });
    if (ogImg) {
      this.meta.addTag({ name: 'twitter:image', content: ogImg });
    }

    // Article metadata (for blog posts and content pages)
    if (config.publishedTime) {
      this.meta.addTag({ property: 'article:published_time', content: config.publishedTime });
    }
    if (config.modifiedTime) {
      this.meta.addTag({ property: 'article:modified_time', content: config.modifiedTime });
    }
    if (config.section) {
      this.meta.addTag({ property: 'article:section', content: config.section });
    }

    this.meta.addTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });

    // Set robots meta tag (per-page control for noindex)
    const robotsContent = config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    this.meta.addTag({ name: 'robots', content: robotsContent });

    // SSR status code marker — server.ts reads this to set HTTP status
    if (config.httpStatus) {
      this.meta.addTag({ name: 'ssr-status', content: String(config.httpStatus) });
    }

    // Handle canonical URL safely
    if (this.document && config.canonicalUrl) {
      // Strip query params and fragments from canonical URL
      const cleanPath = config.canonicalUrl.split('?')[0].split('#')[0];

      // Remove existing canonical link
      const existingCanonical = this.document.querySelector('link[rel="canonical"]');
      if (existingCanonical) {
        existingCanonical.remove();
      }

      // Add new canonical link with absolute URL
      const linkElement = this.document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      linkElement.setAttribute('href', this.url + cleanPath);
      this.document.head.appendChild(linkElement);

      // Set og:url matching canonical
      this.meta.addTag({ property: 'og:url', content: this.url + cleanPath });

      // oEmbed discovery link for WordPress/CMS auto-embed
      this.setOembedLink(this.url + cleanPath);
    }
  }

  private setOembedLink(pageUrl: string): void {
    // Remove existing oEmbed link
    const existing = this.document.querySelector('link[type="application/json+oembed"]');
    if (existing) {
      existing.remove();
    }

    const oembedLink = this.document.createElement('link');
    oembedLink.setAttribute('rel', 'alternate');
    oembedLink.setAttribute('type', 'application/json+oembed');
    oembedLink.setAttribute(
      'href',
      `${this.url}/v2/oembed?url=${encodeURIComponent(pageUrl)}&format=json`
    );
    oembedLink.setAttribute('title', 'oEmbed');
    this.document.head.appendChild(oembedLink);
  }
}
