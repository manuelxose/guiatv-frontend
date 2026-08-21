import { Injectable, Inject, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  BehaviorSubject,
  Observable,
  of,
  map,
  tap,
  catchError,
  shareReplay,
  retryWhen,
  scan,
  concatMap,
  timer,
} from 'rxjs';
import { ApiConfigService } from '../api/api-config.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  // Cache para posts
  private postsCache$: Observable<any[]> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // BehaviorSubjects para categorías y posts
  private _blogCategories = new BehaviorSubject<any[]>([]);
  public blogCategories$ = this._blogCategories.asObservable();

  private _posts = new BehaviorSubject<any[]>([]);
  public posts$ = this._posts.asObservable();

  // URL de la API
  private API_URL = '';
  private readonly isServer: boolean;
  private readonly isBrowser: boolean;
  private readonly listStateKey = makeStateKey<any[]>('editorial-list-v2');

  // Error state observable for UI consumption
  private _error = new BehaviorSubject<string | null>(null);
  public error$ = this._error.asObservable();

  constructor(
    private httpService: HttpService,
    private apiConfig: ApiConfigService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isServer = isPlatformServer(platformId);
    this.isBrowser = isPlatformBrowser(platformId);
    this.API_URL = this.apiConfig.buildUrl('/blog');
  }

  // ============================================
  // CONTROL DE FLUJO DE DATOS
  // ============================================

  public setBlogCategories(data: any[]): void {
    this._blogCategories.next(data);
  }

  public setPosts(data: any[]): void {
    if (!data) {
      this._posts.next([]);
      return;
    }

    const normalizedData = Array.isArray(data) ? data : [data];
    this._posts.next(normalizedData);
  }

  public getBlogCategories(): any[] {
    return this._blogCategories.getValue();
  }

  public getPosts(): any[] {
    return this._posts.getValue();
  }

  // ============================================
  // PETICIONES A LA API
  // ============================================

  /**
   * Obtiene todos los posts con caché inteligente
   */
  public getAllPosts(): Observable<any[]> {
    if (this.isBrowser && this.transferState.hasKey(this.listStateKey)) {
      const posts = this.transferState.get(this.listStateKey, []);
      this.setPosts(posts);
      this.cacheTimestamp = Date.now();
      return of(posts);
    }

    const now = Date.now();
    const currentPosts = this.getPosts();

    // Si hay posts en memoria y el caché es válido
    if (
      currentPosts.length > 0 &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return of(currentPosts);
    }

    // Si ya hay una petición en curso, reutilizarla
    if (this.postsCache$) {
      return this.postsCache$;
    }

    // Crear nueva petición con caché
    const maxRetries = 3;

    const request$ = this.httpService.get<any[]>(this.API_URL);
    const requestWithRetry$ = this.isServer
      ? request$
      : request$.pipe(
          // retry with exponential backoff on client-side only
          retryWhen((errors) =>
            errors.pipe(
              scan((retryCount, err) => {
                const next = retryCount + 1;
                if (next > maxRetries) {
                  throw err;
                }
                return next;
              }, 0),
              concatMap((retryCount) => timer(Math.pow(2, retryCount) * 1000))
            )
          )
        );

    this.postsCache$ = requestWithRetry$.pipe(
      tap((posts) => {
        // clear any previous error
        this._error.next(null);
        this.setPosts(posts);
        this.cacheTimestamp = now;
        if (this.isServer) this.transferState.set(this.listStateKey, posts);
      }),
      catchError((error) => {
        console.error('Error fetching posts:', error);
        this.postsCache$ = null;
        this._error.next(
          'No se ha podido cargar el blog en este momento.'
        );
        this.setPosts([]);
        this.cacheTimestamp = now;
        return of([]);
      }),
      shareReplay(1)
    );

    return this.postsCache$;
  }

  /**
   * Obtiene un post por slug
   */
  public getPostBySlug(slug: string): Observable<any[]> {
    const stateKey = makeStateKey<any[]>(`editorial-detail-v2:${slug}`);
    if (this.isBrowser && this.transferState.hasKey(stateKey)) {
      return of(this.transferState.get(stateKey, []));
    }
    return this.httpService.get<any[]>(`${this.API_URL}?slug=${slug}`).pipe(
      tap((posts) => {
        if (this.isServer) this.transferState.set(stateKey, posts);
      }),
      catchError((error) => {
        console.error('Error fetching post by slug:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene todas las categorías del blog
   */
  public getBlogCategoriesFromApi(): Observable<any[]> {
    return this.httpService.get<any[]>(`${this.API_URL}/categories`).pipe(
      tap((categories) => this.setBlogCategories(categories)),
      catchError((error) => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene posts relacionados por categoría
   */
  public getRelatedPosts(
    categoryId: number,
    limit: number = 3
  ): Observable<any[]> {
    return this.httpService
      .get<any[]>(
        `${this.API_URL}?categories=${categoryId}&per_page=${limit + 1}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching related posts:', error);
          return of([]);
        })
      );
  }

  // ============================================
  // FILTRADO Y PROCESAMIENTO DE DATOS
  // ============================================

  /**
   * Inicializa categorías desde los posts
   */
  public intiCategories(posts: any[]): void {
    const categoriesMap = new Map<number, any>();

    posts.forEach((post) => {
      if (post.categories_name && Array.isArray(post.categories_name)) {
        post.categories_name.forEach((category: any) => {
          if (category.id && !categoriesMap.has(category.id)) {
            categoriesMap.set(category.id, category);
          }
        });
      }
    });

    const categories = Array.from(categoriesMap.values());
    this.setBlogCategories(categories);
  }

  /**
   * Filtra posts por categoría
   */
  public filterByCategory(categoryId: number): Observable<any[]> {
    return this.posts$.pipe(
      map((posts) =>
        posts.filter(
          (post) => post.categories && post.categories.includes(categoryId)
        )
      )
    );
  }

  /**
   * Busca posts por texto
   */
  public searchPosts(query: string): Observable<any[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.posts$.pipe(
      map((posts) =>
        posts.filter((post) => {
          const title = (post.title?.rendered || '').toLowerCase();
          const excerpt = (post.excerpt?.rendered || '').toLowerCase();
          const content = (post.content?.rendered || '').toLowerCase();

          return (
            title.includes(normalizedQuery) ||
            excerpt.includes(normalizedQuery) ||
            content.includes(normalizedQuery)
          );
        })
      )
    );
  }

  /**
   * Ordena posts por fecha
   */
  public sortPostsByDate(posts: any[], ascending: boolean = false): any[] {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Invalida el caché
   */
  public clearCache(): void {
    this.postsCache$ = null;
    this.cacheTimestamp = 0;
  }
}
