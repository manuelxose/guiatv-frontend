import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  public url: string = 'https://www.guiaprogramacion.com';

  constructor(private meta: Meta, private title: Title) {}

  setMetaTags(config: any) {
    // Eliminar todas las metaetiquetas existentes
    const metaTags = document.getElementsByTagName('meta');
    while (metaTags.length) {
      if (metaTags[0].parentNode) {
        metaTags[0].parentNode.removeChild(metaTags[0]);
      }
    }

    // Añadir las nuevas metaetiquetas
    this.title.setTitle(config.title);
    this.meta.addTag({ name: 'description', content: config.description });
    this.meta.addTag({ property: 'og:title', content: config.title });
    this.meta.addTag({
      property: 'og:description',
      content: config.description,
    });

    // Añadir la etiqueta viewport
    this.meta.addTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    });

    // Eliminar la URL canónica existente
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      document.head.removeChild(existingCanonical);
    }

    // Añadir la nueva URL canónica
    const linkElement: HTMLLinkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'canonical');
    linkElement.setAttribute('href', this.url + config.canonicalUrl);
    document.head.appendChild(linkElement);
  }
}
