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
    document.title = config.title;
    let metaTag = document.createElement('meta');
    metaTag.name = 'description';
    metaTag.content = config.description;
    document.getElementsByTagName('head')[0].appendChild(metaTag);

    metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:title');
    metaTag.content = config.title;
    document.getElementsByTagName('head')[0].appendChild(metaTag);

    metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:description');
    metaTag.content = config.description;
    document.getElementsByTagName('head')[0].appendChild(metaTag);

    // Añadir la etiqueta viewport
    metaTag = document.createElement('meta');
    metaTag.name = 'viewport';
    metaTag.content = 'width=device-width, initial-scale=1';
    document.getElementsByTagName('head')[0].appendChild(metaTag);

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
