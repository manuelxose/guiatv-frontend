import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  public url: string =
    environment.SITE_URL || 'https://www.guiaprogramacion.com';

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
    this.meta.removeTag('name="twitter:card"');

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

    // Handle canonical URL safely
    if (this.document) {
      // Remove existing canonical link
      const existingCanonical = this.document.querySelector(
        'link[rel="canonical"]'
      );
      if (existingCanonical) {
        existingCanonical.remove();
      }

      // Add new canonical link
      const linkElement = this.document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      linkElement.setAttribute('href', this.url + config.canonicalUrl);
      this.document.head.appendChild(linkElement);
    }
  }
}
