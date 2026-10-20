import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { MetaService } from './meta.service';

describe('MetaService.markUnavailable', () => {
  it('marks the route as a temporary, non-indexable 503', () => {
    const service = TestBed.inject(MetaService);
    const meta = TestBed.inject(Meta);

    service.setMetaTags({ title: 'x', description: 'x', canonicalUrl: '/canales/la-sexta' });
    service.markUnavailable('Canal no disponible | Guía TV');

    expect(meta.getTag('name="ssr-status"')?.content).toBe('503');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
    // An error response is not a page to consolidate on: no canonical (the earlier one is removed).
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('MetaService canonical', () => {
  it('keeps exactly one canonical, without query string, and removes it on null', () => {
    const service = TestBed.inject(MetaService);
    service.setMetaTags({ title: 'a', description: 'a', canonicalUrl: '/canales/la-1?dia=manana' });
    service.setMetaTags({ title: 'b', description: 'b', canonicalUrl: '/canales/la-2' });
    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toMatch(/\/canales\/la-2$/);

    service.setMetaTags({ title: 'c', description: 'c', canonicalUrl: '/canales/la-1?dia=manana' });
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/canales\/la-1$/);

    service.setMetaTags({ title: 'd', description: 'd', canonicalUrl: null });
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('MetaService.clamp', () => {
  it('keeps short text and cuts long text at a word boundary', () => {
    expect(MetaService.clamp('Corto', 160)).toBe('Corto');
    const out = MetaService.clamp('palabra '.repeat(40), 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith('…')).toBeTrue();
    expect(out).not.toMatch(/palab…$/);
  });
});
