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
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="robots"');
    this.meta.removeTag('name="ssr-status"');

    // Add new meta tags using Angular's Meta service
    this.meta.addTag({ name: 'description', content: config.description });
    this.meta.addTag({ property: 'og:title', content: config.title });
    this.meta.addTag({
      property: 'og:description',
      content: config.description,
    });
    if (config.image) {
      this.meta.addTag({ property: 'og:image', content: config.image });
    }
    const ogImg = config.ogImage || config.image;
    if (ogImg) {
      this.meta.removeTag('property="og:image"');
      this.meta.addTag({ property: 'og:image', content: ogImg });
    }
    this.meta.addTag({
      property: 'og:type',
      content: config.type || 'article',
    });
    this.meta.addTag({
      name: 'twitter:card',
      content: config.twitterCard || 'summary_large_image',
    });
    this.meta.addTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    });

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
      const existingCanonical = this.document.querySelector(
        'link[rel="canonical"]'
      );
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
    }
  }
}
