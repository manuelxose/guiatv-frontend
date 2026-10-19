import { TransferState } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  it('loads articles beyond the API default page so category counts stay complete', async () => {
    const posts = Array.from({ length: 52 }, (_, id) => ({ id }));
    const service = new BlogService(
      { get: (url: string) => of(url.endsWith('?limit=0') ? posts : posts.slice(0, 50)) } as any,
      { buildUrl: () => 'http://api.test/blog' } as any,
      new TransferState(),
      'server' as any
    );
    expect((await firstValueFrom(service.getAllPosts())).length).toBe(52);
  });

  it('propagates a failed editorial list request after recording its UI error', async () => {
    const service = new BlogService(
      { get: () => throwError(() => new Error('Editorial API unavailable')) } as any,
      { buildUrl: () => 'http://api.test/blog' } as any,
      new TransferState(),
      'server' as any
    );

    await expectAsync(firstValueFrom(service.getAllPosts())).toBeRejectedWithError(
      'Editorial API unavailable'
    );
  });

  it('propagates a failed article request instead of rendering an empty article', async () => {
    const service = new BlogService(
      { get: () => throwError(() => new Error('Article API unavailable')) } as any,
      { buildUrl: () => 'http://api.test/blog' } as any,
      new TransferState(),
      'server' as any
    );

    await expectAsync(
      firstValueFrom(service.getPostBySlug('articulo'))
    ).toBeRejectedWithError('Article API unavailable');
  });
});
