import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { of } from 'rxjs';
import { CatalogItem, CatalogService } from '../../services/catalog.service';
import { CatalogDetailComponent } from './catalog-detail.component';

const NOW = Date.now();
const iso = (hours: number) => new Date(NOW + hours * 3_600_000).toISOString();

const legacyAiring = (channelId: string, startH: number, title = 'La cura del bienestar') => ({
  channelId, channelName: channelId.toUpperCase(), start: iso(startH), end: iso(startH + 2), title, catalogId: `program:${channelId}`, detailPath: '/peliculas/la-cura-del-bienestar',
});
const broadcast = (channelId: string, startH: number, programmeTitle = 'La cura del bienestar') => ({
  airingId: `a-${channelId}`, channel: { id: channelId, name: channelId.toUpperCase(), path: `/canales/${channelId}` }, programmeTitle,
  start: iso(startH), end: iso(startH + 2), startLocal: iso(startH), localDate: '2026-10-23', localTime: '21:30', durationMinutes: 120,
});
const legacy = (over: Partial<CatalogItem> = {}): CatalogItem => ({
  catalogId: 'tmdb:movie:340837', source: 'tmdb', contentType: 'movie', title: 'La cura del bienestar', slug: 'la-cura-del-bienestar', detailPath: '/peliculas/la-cura-del-bienestar',
  synopsis: 'Texto editorial propio', genres: [], tmdbId: 340837, releaseYear: 2016, primaryPlatforms: [], airings: [legacyAiring('amc', 30)], ...over,
});

describe('CatalogDetailComponent: Phase 3E legacy enrichment', () => {
  function render(item: CatalogItem) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'la-cura-del-bienestar' })), data: of({ contentType: 'movie' }), snapshot: { data: {} } } },
        {
          provide: CatalogService,
          useValue: {
            getBySlugState: () => of({ data: item, unavailable: false, stale: false }),
            getDetailEnrichment: () => of({ related: [] }),
            query: () => of({ items: [] }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CatalogDetailComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }
  const robots = () => TestBed.inject(Meta).getTag('name="robots"')?.content;
  const jsonLd = (fixture: { nativeElement: HTMLElement }) =>
    Array.from(fixture.nativeElement.querySelectorAll('script[type="application/ld+json"]')).flatMap((s) => [JSON.parse(s.textContent || '[]')].flat());

  it('without enrichment the page is the legacy page: legacy schedule, no broadcast list, no attribution', () => {
    const fixture = render(legacy());
    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector('app-entity-broadcast-list')).toBeNull();
    expect(text).toContain('Próximas emisiones');
    expect(text).not.toContain('themoviedb.org');
    expect(robots()).toContain('index, follow');
    fixture.destroy();
  });

  it('adds the verified schedule, original title, genres, runtime and attribution while keeping every legacy fact', () => {
    const base = legacy({ airings: [legacyAiring('amc', 30), legacyAiring('tcm', 50)] });
    const plain = render(base);
    const plainRobots = robots();
    const plainCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const plainDescription = TestBed.inject(Meta).getTag('name="description"')?.content;
    plain.destroy();
    TestBed.resetTestingModule();

    const fixture = render(legacy({
      airings: [legacyAiring('amc', 30), legacyAiring('tcm', 50)],
      enrichment: {
        version: 1,
        metadata: { originalTitle: 'A Cure for Wellness', runtimeMinutes: 147, genres: ['Terror'] },
        broadcasts: { status: 'ok', generatedAt: iso(0), timeZone: 'Europe/Madrid', items: [broadcast('amc', 30), broadcast('la1', 80)] },
        attribution: { notice: 'Datos e imágenes de TMDB.', updatedAt: '2026-10-01T00:00:00.000Z' },
      },
    }));
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent as string;
    expect(el.querySelector('app-entity-broadcast-list')).not.toBeNull();
    expect(el.querySelector('a[href="/canales/amc"]')).not.toBeNull();
    expect(el.querySelector('a[href="/canales/la1"]')).not.toBeNull();
    expect(text).toContain('Título original: A Cure for Wellness');
    expect(text).toContain('Terror');
    expect(text).toContain('147 min');
    expect(text).toContain('Datos e imágenes de TMDB.');
    expect(text).toContain('Texto editorial propio');
    // The legacy airing the verification did not confirm (TCM) is still listed: nothing shown before disappears.
    expect(text).toContain('TCM');
    // SEO surface is exactly the legacy one.
    expect(robots()).toBe(plainRobots);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(plainCanonical);
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe(plainDescription);
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    fixture.destroy();
  });

  it('keeps one Movie entity, extended with the original title and the verified broadcasts', () => {
    const fixture = render(legacy({
      enrichment: {
        version: 1,
        metadata: { originalTitle: 'A Cure for Wellness', runtimeMinutes: 147, genres: ['Terror'] },
        broadcasts: { status: 'ok', generatedAt: iso(0), timeZone: 'Europe/Madrid', items: [broadcast('amc', 30)] },
      },
    }));
    const movies = jsonLd(fixture).filter((d: { '@type'?: string }) => d['@type'] === 'Movie');
    expect(movies.length).toBe(1);
    expect(movies[0].alternateName).toBe('A Cure for Wellness');
    expect(movies[0].duration).toBe('PT2H27M');
    expect(movies[0].genre).toEqual(['Terror']);
    expect(movies[0].publication.length).toBe(1);
    expect(movies[0].publication[0]['@type']).toBe('BroadcastEvent');
    fixture.destroy();
  });

  it('structured data cannot be broken out of by a hostile title', () => {
    const fixture = render(legacy({
      enrichment: {
        version: 1,
        metadata: { originalTitle: '</script><img src=x onerror=window.__pwned=1>' },
        broadcasts: { status: 'ok', generatedAt: iso(0), timeZone: 'Europe/Madrid', items: [broadcast('amc', 30, '</script><b>x</b>')] },
      },
    }));
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    expect(fixture.nativeElement.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
    expect(() => jsonLd(fixture)).not.toThrow();
    fixture.destroy();
  });

  it('says plainly when nothing is scheduled, and falls back to the legacy schedule when the schedule could not be read', () => {
    const none = render(legacy({ airings: [], enrichment: { version: 1, broadcasts: { status: 'none', generatedAt: iso(0), timeZone: 'Europe/Madrid', items: [] } } }));
    expect(none.nativeElement.textContent).toContain('No hay emisiones programadas en los próximos 7 días');
    none.destroy();
    TestBed.resetTestingModule();
    const unavailable = render(legacy({ enrichment: { version: 1, broadcasts: { status: 'unavailable', generatedAt: iso(0), timeZone: 'Europe/Madrid', items: [] } } }));
    expect(unavailable.nativeElement.querySelector('app-entity-broadcast-list')).toBeNull();
    expect(unavailable.nativeElement.textContent).toContain('AMC');
    unavailable.destroy();
  });

  it('a programme page keeps its own now/next layout', () => {
    const fixture = render(legacy({
      contentType: 'program', source: 'program',
      enrichment: { version: 1, metadata: { genres: ['Magazine'] } },
    }));
    expect(fixture.nativeElement.querySelector('app-entity-broadcast-list')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('A continuación');
    fixture.destroy();
  });
});
