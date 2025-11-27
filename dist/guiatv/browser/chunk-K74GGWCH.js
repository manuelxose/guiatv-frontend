import {
  HttpService,
  TvGuideService,
  environment
} from "./chunk-MUKTTSZO.js";
import {
  BehaviorSubject,
  Injectable,
  catchError,
  concatMap,
  map,
  of,
  retryWhen,
  scan,
  setClassMetadata,
  shareReplay,
  tap,
  timer,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-UEL6V4IP.js";

// src/app/services/blog.service.ts
var _BlogService = class _BlogService {
  constructor(httpService, tvService) {
    this.httpService = httpService;
    this.tvService = tvService;
    this.postsCache$ = null;
    this.cacheTimestamp = 0;
    this.CACHE_DURATION = 5 * 60 * 1e3;
    this._blogCategories = new BehaviorSubject([]);
    this.blogCategories$ = this._blogCategories.asObservable();
    this._posts = new BehaviorSubject([]);
    this.posts$ = this._posts.asObservable();
    this.API_URL = environment.API_BLOG;
    this._error = new BehaviorSubject(null);
    this.error$ = this._error.asObservable();
    this.MOCK_POSTS = [
      {
        id: 0,
        title: { rendered: "Blog temporal - contenido no disponible" },
        slug: "blog-temporal-contenido-no-disponible",
        excerpt: {
          rendered: "No hemos podido cargar el blog en remoto. Aqu\xED tienes una entrada temporal."
        },
        content: {
          rendered: "<p>Lo sentimos, el servicio de blog no est\xE1 disponible temporalmente. Vuelve a intentarlo en unos minutos.</p>"
        },
        date: (/* @__PURE__ */ new Date()).toISOString(),
        categories: [],
        categories_name: []
      }
    ];
  }
  // ============================================
  // CONTROL DE FLUJO DE DATOS
  // ============================================
  setBlogCategories(data) {
    this._blogCategories.next(data);
  }
  setPosts(data) {
    if (!data) {
      this._posts.next([]);
      return;
    }
    const normalizedData = Array.isArray(data) ? data : [data];
    this._posts.next(normalizedData);
  }
  getBlogCategories() {
    return this._blogCategories.getValue();
  }
  getPosts() {
    return this._posts.getValue();
  }
  // ============================================
  // INICIALIZACIÓN DE PROGRAMAS TV
  // ============================================
  setProgramsFromApi() {
    this.tvService.getProgramsAndChannels().subscribe((data) => {
      if (data.length === 0) {
        this.tvService.getFromApi().subscribe((apiData) => {
          this.httpService.setProgramas(apiData, "today").then(() => {
            this.tvService.setData(apiData);
          });
        });
      }
    });
  }
  // ============================================
  // PETICIONES A LA API
  // ============================================
  /**
   * Obtiene todos los posts con caché inteligente
   */
  getAllPosts() {
    const now = Date.now();
    const currentPosts = this.getPosts();
    if (currentPosts.length > 0 && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return of(currentPosts);
    }
    if (this.postsCache$) {
      return this.postsCache$;
    }
    const maxRetries = 3;
    this.postsCache$ = this.httpService.get(this.API_URL).pipe(
      // retry with exponential backoff
      retryWhen((errors) => errors.pipe(
        scan((retryCount, err) => {
          const next = retryCount + 1;
          if (next > maxRetries) {
            throw err;
          }
          return next;
        }, 0),
        // wait 2^retryCount * 1000 ms
        concatMap((retryCount) => timer(Math.pow(2, retryCount) * 1e3))
      )),
      tap((posts) => {
        this._error.next(null);
        this.setPosts(posts);
        this.cacheTimestamp = now;
      }),
      catchError((error) => {
        console.error("Error fetching posts:", error);
        this.postsCache$ = null;
        this._error.next("No se ha podido cargar el blog. Se muestran art\xEDculos locales.");
        const fallback = this.MOCK_POSTS;
        this.setPosts(fallback);
        this.cacheTimestamp = now;
        return of(fallback);
      }),
      shareReplay(1)
    );
    return this.postsCache$;
  }
  /**
   * Obtiene un post por slug
   */
  getPostBySlug(slug) {
    return this.httpService.get(`${this.API_URL}?slug=${slug}`).pipe(catchError((error) => {
      console.error("Error fetching post by slug:", error);
      return of([]);
    }));
  }
  /**
   * Obtiene todas las categorías del blog
   */
  getBlogCategoriesFromApi() {
    return this.httpService.get(`${this.API_URL}/categories`).pipe(tap((categories) => this.setBlogCategories(categories)), catchError((error) => {
      console.error("Error fetching categories:", error);
      return of([]);
    }));
  }
  /**
   * Obtiene posts relacionados por categoría
   */
  getRelatedPosts(categoryId, limit = 3) {
    return this.httpService.get(`${this.API_URL}?categories=${categoryId}&per_page=${limit + 1}`).pipe(catchError((error) => {
      console.error("Error fetching related posts:", error);
      return of([]);
    }));
  }
  // ============================================
  // FILTRADO Y PROCESAMIENTO DE DATOS
  // ============================================
  /**
   * Inicializa categorías desde los posts
   */
  intiCategories(posts) {
    const categoriesMap = /* @__PURE__ */ new Map();
    posts.forEach((post) => {
      if (post.categories_name && Array.isArray(post.categories_name)) {
        post.categories_name.forEach((category) => {
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
  filterByCategory(categoryId) {
    return this.posts$.pipe(map((posts) => posts.filter((post) => post.categories && post.categories.includes(categoryId))));
  }
  /**
   * Busca posts por texto
   */
  searchPosts(query) {
    const normalizedQuery = query.toLowerCase().trim();
    return this.posts$.pipe(map((posts) => posts.filter((post) => {
      const title = (post.title?.rendered || "").toLowerCase();
      const excerpt = (post.excerpt?.rendered || "").toLowerCase();
      const content = (post.content?.rendered || "").toLowerCase();
      return title.includes(normalizedQuery) || excerpt.includes(normalizedQuery) || content.includes(normalizedQuery);
    })));
  }
  /**
   * Ordena posts por fecha
   */
  sortPostsByDate(posts, ascending = false) {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }
  /**
   * Invalida el caché
   */
  clearCache() {
    this.postsCache$ = null;
    this.cacheTimestamp = 0;
  }
};
_BlogService.\u0275fac = function BlogService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _BlogService)(\u0275\u0275inject(HttpService), \u0275\u0275inject(TvGuideService));
};
_BlogService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _BlogService, factory: _BlogService.\u0275fac, providedIn: "root" });
var BlogService = _BlogService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlogService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: HttpService }, { type: TvGuideService }], null);
})();

export {
  BlogService
};
//# sourceMappingURL=chunk-K74GGWCH.js.map
