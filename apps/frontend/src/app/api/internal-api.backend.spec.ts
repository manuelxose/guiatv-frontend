import { TestBed } from '@angular/core/testing';
import { FetchBackend, HttpErrorResponse, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { InternalApiBackend, SSR_API_TIMEOUT_MS, toInternalApiUrl } from './internal-api.backend';

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

  it('routes the read-shaped affiliate resolve POST internally (it stalled renders over Cloudflare)', () => {
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/affiliate/resolve', 'POST', INTERNAL))
      .toBe('http://127.0.0.1:4000/v2/affiliate/resolve');
  });

  it('never rewrites writes, third-party APIs, other hosts or non-API paths', () => {
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/affiliate/impression', 'POST', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/affiliate/resolve/x', 'POST', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/auth/login', 'POST', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://guiaprogramaciontv.com/v2/affiliate/resolve', 'PUT', INTERNAL)).toBeNull();
    expect(toInternalApiUrl('https://evil.example/v2/affiliate/resolve', 'POST', INTERNAL)).toBeNull();
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
    backend.handle(new HttpRequest('POST', 'https://guiaprogramaciontv.com/v2/affiliate/resolve', { id: 1 }));
    const write = new HttpRequest('POST', 'https://guiaprogramaciontv.com/v2/affiliate/impression', { id: 1 });
    backend.handle(write);

    expect(sent[0].urlWithParams).toBe('http://127.0.0.1:4000/v2/catalog?q=la%201');
    expect(sent[0].headers.get('Accept')).toBe('application/json');
    expect(sent[0].headers.has('Cookie')).toBeFalse();
    expect(sent[1].url).toBe('http://127.0.0.1:4000/v2/affiliate/resolve');
    expect(sent[1].method).toBe('POST');
    expect(sent[1].body).toEqual({ id: 1 });
    expect(sent[2].url).toBe(write.url);
    expect(sent[2].method).toBe('POST');
    expect(sent[2].body).toBe(write.body);
  });

  it('caps every request at SSR_API_TIMEOUT_MS of total time, keeping a shorter caller timeout', () => {
    TestBed.configureTestingModule({ providers: [InternalApiBackend] });
    const sent: HttpRequest<unknown>[] = [];
    spyOn(FetchBackend.prototype, 'handle').and.callFake((req: HttpRequest<unknown>) => {
      sent.push(req);
      return of();
    });
    const backend = TestBed.inject(InternalApiBackend);
    backend.handle(new HttpRequest('GET', 'https://guiaprogramaciontv.com/v2/a'));
    backend.handle(new HttpRequest('GET', 'https://guiaprogramaciontv.com/v2/b', { timeout: 1000 }));
    backend.handle(new HttpRequest('GET', 'https://guiaprogramaciontv.com/v2/c', { timeout: 60_000 }));
    backend.handle(new HttpRequest('GET', 'https://api.themoviedb.org/3/movie/1'));
    expect(sent.map((r) => r.timeout)).toEqual([SSR_API_TIMEOUT_MS, 1000, SSR_API_TIMEOUT_MS, SSR_API_TIMEOUT_MS]);
  });

  // 2D-2C.2: a dependency that never answers used to hold the render until the 20 s SSR timeout (503). The real
  // FetchBackend enforces the timeout: it aborts the fetch itself and errors, however the response trickles in.
  it('aborts a stalled fetch and fails with a TimeoutError once the timeout elapses', async () => {
    TestBed.configureTestingModule({ providers: [InternalApiBackend] });
    let signal: AbortSignal | undefined;
    spyOn(globalThis, 'fetch').and.callFake((_url: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => signal?.addEventListener('abort', () => reject(signal?.reason)));
    });
    const backend = TestBed.inject(InternalApiBackend);
    const started = Date.now();
    const error = await lastValueFrom(
      backend.handle(new HttpRequest('GET', 'https://guiaprogramaciontv.com/v2/catalog', { timeout: 50 }))
    ).then(
      () => undefined,
      (e: HttpErrorResponse) => e
    );
    expect(error instanceof HttpErrorResponse).toBeTrue();
    expect(error?.error?.name).toBe('TimeoutError');
    expect(signal?.aborted).toBeTrue();
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
