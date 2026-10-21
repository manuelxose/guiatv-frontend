import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { PLATFORM_ID, RESPONSE_INIT } from '@angular/core';
import { EntityDetailComponent } from './entity-detail.component';

describe('EntityDetailComponent', () => {
  let http: HttpTestingController;
  let response: ResponseInit;
  beforeEach(() => {
    response = {};
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'test-film' })), snapshot: { data: { contentType: 'movie' } } } },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: RESPONSE_INIT, useValue: response },
    ] });
    spyOnProperty(TestBed.inject(Router), 'url').and.returnValue('/peliculas/test-film');
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('renders verified public fields with a single self canonical and noindex', () => {
    const fixture = TestBed.createComponent(EntityDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/entities/resolve')).flush({ success: true, data: {
      entityId: 'verified', kind: 'film', title: 'Test film', canonicalPath: '/peliculas/test-film', year: 2024,
    } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test film');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(new Headers(response.headers).get('Content-Type')).toBe('text/html; charset=utf-8');
    fixture.destroy();
  });

  it('falls back only for an explicitly disabled endpoint', () => {
    const fixture = TestBed.createComponent(EntityDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/entities/resolve')).flush({ error: { code: 'ENTITY_PUBLIC_READ_DISABLED' } }, { status: 404, statusText: 'Not Found' });
    expect(fixture.componentInstance.legacy).toBeTrue();
    fixture.destroy();
  });

  for (const status of [404, 410, 503]) {
    it(`keeps ${status} errors out of the legacy title resolver`, () => {
      const fixture = TestBed.createComponent(EntityDetailComponent);
      fixture.detectChanges();
      http.expectOne(r => r.url.endsWith('/entities/resolve')).flush({ error: { code: 'ENTITY_NOT_FOUND' } }, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.componentInstance.legacy).toBeFalse();
      expect(response.status).toBe(status);
      expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
      fixture.destroy();
    });
  }

  it('returns a permanent SSR redirect only to a validated canonical site path', () => {
    const fixture = TestBed.createComponent(EntityDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.params.get('redirect') === 'false').flush({ success: true, data: {
      entityId: 'verified', kind: 'movie', title: 'Test film', canonicalPath: '/peliculas/current-film',
    } });
    expect(response.status).toBe(301);
    expect(new Headers(response.headers).get('Location')).toBe('/peliculas/current-film');
    expect(new Headers(response.headers).get('X-Robots-Tag')).toBe('noindex, follow');
    fixture.destroy();
  });

  it('rejects a malformed response instead of redirecting outside the site', () => {
    const fixture = TestBed.createComponent(EntityDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/entities/resolve')).flush({ success: true, data: {
      entityId: 'verified', kind: 'movie', title: 'Test film', canonicalPath: '//example.com/film',
    } });
    expect(fixture.componentInstance.unavailable).toBeTrue();
    expect(fixture.componentInstance.legacy).toBeFalse();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    fixture.destroy();
  });
});
