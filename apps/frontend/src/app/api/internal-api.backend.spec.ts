import { TestBed } from '@angular/core/testing';
import { FetchBackend, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';
import { InternalApiBackend, toInternalApiUrl } from './internal-api.backend';

const INTERNAL = 'http://127.0.0.1:4000';

describe('toInternalApiUrl', () => {
  it('routes site API reads to the internal origin, keeping path and query', () => {
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/catalog?types=movie&limit=8', 'GET', INTERNAL))
      .toBe('http://127.0.0.1:4000/v2/catalog?types=movie&limit=8');
    expect(toInternalApiUrl('https://www.guiaprogramaciontv.com/v2', 'HEAD', INTERNAL)).toBe('http://127.0.0.1:4000/v2');
  });

  it('ignores the host port a client supplied: the target is always the configured origin', () => {
    expect(toInternalApiUrl('http://localhost:9999/v2/tv/read', 'GET', INTERNAL)).toBe('http://127.0.0.1:4000/v2/tv/read');
    expect(toInternalApiUrl('https://127.0.0.1:22/v2/x', 'GET', INTERNAL)).toBe('http://127.0.0.1:4000/v2/x');
  });

  it('never rewrites writes, third-party APIs, other hosts or non-API paths', () => {
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/affiliate/resolve', 'POST', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://api.themoviedb.org/3/movie/1', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com.evil.example/v2/x', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://user:pw@guiaprogramaciontv.com/v2/x', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/storage/channel_icons/la_1.webp', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2x/a', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/../admin', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/%2e%2e/admin', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('/v2/catalog', 'GET', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('file:///v2/x', 'GET', INTERNAL)).toBeNull();
  });
});

describe('InternalApiBackend', () => {
  it('rewrites only the URL; method, params, headers and body pass through', () => {
    TestBed.configureTestingModule({ providers: [InternalApiBackend] });
    const sent: HttpRequest<unknown>[] = [];
    spyOn(FetchBackend.prototype, 'handle').and.callFake((req: HttpRequest<unknown>) => {
      sent.push(req);
      return of();
    });
    const backend = TestBed.inject(InternalApiBackend);

    backend.handle(new HttpRequest('GET', 'https://guiaprogramaciontv.com/v2/catalog', {
      params: new HttpParams().set('q', 'la 1'),
      headers: new HttpHeaders({ Accept: 'application/json' }),
    }));
    const post = new HttpRequest('POST', 'https://guiaprogramaciontv.com/v2/affiliate/resolve', { id: 1 });
    backend.handle(post);

    expect(sent[0].urlWithParams).toBe('http://127.0.0.1:4000/v2/catalog?q=la%201');
    expect(sent[0].headers.get('Accept')).toBe('application/json');
    expect(sent[0].headers.has('Cookie')).toBeFalse();
    expect(sent[1]).toBe(post);
  });
});
