import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { MetaService } from './meta.service';

describe('MetaService.markUnavailable', () => {
  it('marks the route as a temporary, non-indexable 503', () => {
    const service = TestBed.inject(MetaService);
    const meta = TestBed.inject(Meta);

    service.markUnavailable('Canal no disponible | Guía TV', '/canales/la_sexta?x=1');

    expect(meta.getTag('name="ssr-status"')?.content).toBe('503');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/canales\/la_sexta$/);
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
