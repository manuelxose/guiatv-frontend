import {
  SliderComponent
} from "./chunk-YVTN3PAS.js";
import {
  BannerComponent
} from "./chunk-2UMAA7PO.js";
import {
  NavBarComponent
} from "./chunk-MEXIL4LO.js";
import "./chunk-REERXIA3.js";
import {
  MetaService
} from "./chunk-MKFCNM4X.js";
import {
  CommonModule,
  HttpService,
  NgForOf,
  NgIf,
  Router,
  TvGuideService
} from "./chunk-MUKTTSZO.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Subject,
  ViewChild,
  filter,
  first,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/pages/peliculas/peliculas.component.ts
var _c0 = ["enEmisionSlider"];
var _c1 = ["allSlider"];
function PeliculasComponent_section_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 11);
    \u0275\u0275element(1, "app-banner", 12);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("data", ctx_r0.destacada);
  }
}
function PeliculasComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275element(2, "div", 15)(3, "div", 16)(4, "div", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 18);
    \u0275\u0275text(6, "Cargando pel\xEDculas de televisi\xF3n...");
    \u0275\u0275elementEnd()();
  }
}
function PeliculasComponent_article_13_app_slider_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 39, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("programas", ctx_r0.en_emision);
  }
}
function PeliculasComponent_article_13_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 40);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 41);
    \u0275\u0275element(2, "path", 42);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 43);
    \u0275\u0275text(4, " No hay pel\xEDculas en emisi\xF3n en este momento ");
    \u0275\u0275elementEnd()();
  }
}
function PeliculasComponent_article_13_app_slider_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 39, 1);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("programas", ctx_r0.peliculas);
  }
}
function PeliculasComponent_article_13_section_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 44)(1, "header", 20)(2, "div", 21)(3, "h2", 45);
    \u0275\u0275text(4, " Pel\xEDculas de ");
    \u0275\u0275elementStart(5, "span", 46);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275text(7, " en TV hoy ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "p", 29);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(10, "app-slider", 39);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275attribute("aria-labelledby", "cat-heading-" + i_r4);
    \u0275\u0275advance(3);
    \u0275\u0275property("id", "cat-heading-" + i_r4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cat_r3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" Explora las mejores pel\xEDculas de la categor\xEDa ", cat_r3, " emitidas hoy. ");
    \u0275\u0275advance();
    \u0275\u0275property("programas", ctx_r0.getPeliculasByCategory(cat_r3));
  }
}
function PeliculasComponent_article_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article")(1, "section", 19)(2, "header", 20)(3, "div", 21)(4, "h2", 22);
    \u0275\u0275text(5, " Pel\xEDculas ahora en televisi\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "nav", 23)(7, "button", 24);
    \u0275\u0275listener("click", function PeliculasComponent_article_13_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.enEmisionSlider == null ? null : ctx_r0.enEmisionSlider.prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 25);
    \u0275\u0275element(9, "path", 26);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(10, "button", 27);
    \u0275\u0275listener("click", function PeliculasComponent_article_13_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.enEmisionSlider == null ? null : ctx_r0.enEmisionSlider.next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 25);
    \u0275\u0275element(12, "path", 28);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "p", 29);
    \u0275\u0275text(14, " Descubre las pel\xEDculas que est\xE1n en emisi\xF3n ahora mismo. Desde comedias hasta thrillers, dramas, romances y acci\xF3n. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 30);
    \u0275\u0275template(16, PeliculasComponent_article_13_app_slider_16_Template, 2, 1, "app-slider", 31)(17, PeliculasComponent_article_13_div_17_Template, 5, 0, "div", 32);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "section", 33)(19, "header", 20)(20, "div", 21)(21, "h2", 34);
    \u0275\u0275text(22, " Todas las pel\xEDculas en televisi\xF3n hoy ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "nav", 35)(24, "button", 36);
    \u0275\u0275listener("click", function PeliculasComponent_article_13_Template_button_click_24_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.allSlider == null ? null : ctx_r0.allSlider.prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(25, "svg", 25);
    \u0275\u0275element(26, "path", 26);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(27, "button", 37);
    \u0275\u0275listener("click", function PeliculasComponent_article_13_Template_button_click_27_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.allSlider == null ? null : ctx_r0.allSlider.next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(28, "svg", 25);
    \u0275\u0275element(29, "path", 28);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(30, "p", 29);
    \u0275\u0275text(31, " Consulta nuestra gu\xEDa completa con todas las pel\xEDculas que se emiten hoy en los principales canales de Espa\xF1a. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(32, PeliculasComponent_article_13_app_slider_32_Template, 2, 1, "app-slider", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275template(33, PeliculasComponent_article_13_section_33_Template, 11, 5, "section", 38);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275property("ngIf", ctx_r0.en_emision.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.en_emision.length === 0);
    \u0275\u0275advance(15);
    \u0275\u0275property("ngIf", ctx_r0.peliculas.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.categorias)("ngForTrackBy", ctx_r0.trackByCategory);
  }
}
var _PeliculasComponent = class _PeliculasComponent {
  constructor(svcGuide, http, metaSvc, router, cdr) {
    this.svcGuide = svcGuide;
    this.http = http;
    this.metaSvc = metaSvc;
    this.router = router;
    this.cdr = cdr;
    this.peliculas = [];
    this.categorias = [];
    this.destacada = null;
    this.en_emision = [];
    this.isLoading = true;
    this.ldJson = "";
    this.debugPayload = null;
    this.peliculasPorCategoria = /* @__PURE__ */ new Map();
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    this.metaSvc.setMetaTags({
      title: "Pel\xEDculas en TV Hoy | Cartelera Completa de Televisi\xF3n Espa\xF1a",
      description: "Encuentra las mejores pel\xEDculas que se emiten hoy en televisi\xF3n espa\xF1ola: estrenos, cl\xE1sicos, acci\xF3n, comedia, drama y m\xE1s. Gu\xEDa actualizada con horarios.",
      canonicalUrl: this.router.url,
      keywords: "peliculas tv hoy, peliculas television, cartelera tv, cine en television espa\xF1a",
      ogImage: "/assets/images/peliculas-og.jpg"
    });
    this.loadPeliculasData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.peliculasPorCategoria.clear();
  }
  loadPeliculasData() {
    const loadStartTime = performance.now();
    console.log("PeliculasComponent: starting loadPeliculasData");
    this.http.getProgramacion("today").pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        console.log("PeliculasComponent: getProgramacion next. received:", Array.isArray(data) ? data.length : typeof data);
        if (Array.isArray(data) && data.length > 0) {
          this.manageMovies(data);
          const loadEndTime = performance.now();
          console.log(`\u26A1 Pel\xEDculas cargadas en ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
          return;
        }
        console.log("PeliculasComponent: getProgramacion returned empty, subscribing to programas$ fallback");
        this.http.programas$.pipe(filter((d) => d.length > 0), first(), takeUntil(this.destroy$)).subscribe({
          next: (d) => {
            console.log("PeliculasComponent: programas$ fallback next. received:", Array.isArray(d) ? d.length : typeof d);
            this.manageMovies(d);
            const loadEndTime = performance.now();
            console.log(`\u26A1 Pel\xEDculas cargadas (fallback) en ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
          },
          error: (err) => {
            console.error("\u274C Error al cargar datos:", err);
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (error) => {
        console.error("\u274C Error al llamar getProgramacion:", error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  manageMovies(data) {
    console.log("PeliculasComponent: manageMovies called with data length:", Array.isArray(data) ? data.length : typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log("PeliculasComponent: sample raw data[0]:", data[0]);
    }
    const startTime = performance.now();
    console.log("PeliculasComponent: setting data into TvGuideService");
    this.svcGuide.setData(data);
    const allMovies = this.svcGuide.getAllMovies();
    const validMovies = [];
    const liveMovies = [];
    const now = Date.now();
    for (const movie of allMovies) {
      const title = movie?.title?.value;
      if (!title || title.toLowerCase().trim() === "cine")
        continue;
      validMovies.push(movie);
      if (movie.start && movie.stop) {
        const startTime2 = new Date(movie.start).getTime();
        const stopTime = new Date(movie.stop).getTime();
        if (startTime2 <= now && now <= stopTime) {
          liveMovies.push(movie);
        }
      }
    }
    this.peliculas = validMovies;
    this.en_emision = liveMovies.slice(0, 15);
    try {
      console.group("PeliculasComponent -> slider data");
      console.log("peliculas.count", this.peliculas.length);
      console.log("peliculas.sample", this.peliculas.slice(0, 3));
      console.log("en_emision.count", this.en_emision.length);
      console.log("en_emision.sample", this.en_emision.slice(0, 3));
      console.groupEnd();
    } catch (e) {
      console.log("PeliculasComponent debug log error", e);
    }
    try {
      this.debugPayload = {
        peliculasCount: this.peliculas.length,
        peliculasSample: this.peliculas.slice(0, 3),
        enEmisionCount: this.en_emision.length,
        enEmisionSample: this.en_emision.slice(0, 3),
        rawFirst: Array.isArray(data) && data.length > 0 ? data[0] : null
      };
      this.cdr.markForCheck();
    } catch (_) {
    }
    const rawCategories = this.svcGuide.getMoviesCategories();
    this.categorias = rawCategories.filter((cat) => cat && cat.toLowerCase().trim() !== "otros").slice(0, 6);
    requestIdleCallback(() => {
      this.precacheCategorias();
    }, { timeout: 2e3 });
    this.loadDestacada();
    this.isLoading = false;
    this.cdr.markForCheck();
    const endTime = performance.now();
    console.log(`\u26A1 Procesamiento de pel\xEDculas: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`\u{1F4CA} Total pel\xEDculas: ${validMovies.length}, En emisi\xF3n: ${liveMovies.length}`);
  }
  precacheCategorias() {
    for (let i = 0; i < Math.min(3, this.categorias.length); i++) {
      const cat = this.categorias[i];
      if (!this.peliculasPorCategoria.has(cat)) {
        const movies = this.svcGuide.getMoviesByCategory(cat).slice(0, 12);
        this.peliculasPorCategoria.set(cat, movies);
      }
    }
  }
  loadDestacada() {
    setTimeout(() => {
      this.svcGuide.getPeliculasDestacadas().pipe(first(), takeUntil(this.destroy$)).subscribe({
        next: (data) => {
          this.destacada = data?.[0] || this.peliculas[0] || null;
          if (this.destacada) {
            this.generateJsonLd();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.warn("\u26A0\uFE0F No se pudo cargar pel\xEDcula destacada:", err);
          this.destacada = this.peliculas[0] || null;
          this.cdr.markForCheck();
        }
      });
    }, 100);
  }
  generateJsonLd() {
    try {
      const title = this.destacada?.title?.value || this.destacada?.name;
      const description = this.destacada?.description || this.destacada?.title?.subtitle || "Gu\xEDa de pel\xEDculas en televisi\xF3n";
      const image = this.destacada?.image || this.destacada?.poster || "/assets/images/peliculas-og.jpg";
      const pageLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Pel\xEDculas en televisi\xF3n",
        description: "Gu\xEDa actualizada de pel\xEDculas en televisi\xF3n en Espa\xF1a",
        url: this.router.url,
        mainEntity: {
          "@type": "Movie",
          name: title,
          description,
          image
        }
      };
      this.ldJson = JSON.stringify(pageLd);
      this.metaSvc.setMetaTags({
        title: `${title} \u2014 Pel\xEDculas en TV | Gu\xEDa TV`,
        description,
        canonicalUrl: this.router.url,
        keywords: `pelicula ${title}, peliculas tv, ${title} tv`,
        ogImage: image
      });
    } catch (e) {
      this.ldJson = "";
    }
  }
  getPeliculasByCategory(categoria) {
    if (this.peliculasPorCategoria.has(categoria)) {
      return this.peliculasPorCategoria.get(categoria);
    }
    const movies = this.svcGuide.getMoviesByCategory(categoria).slice(0, 12);
    this.peliculasPorCategoria.set(categoria, movies);
    return movies;
  }
  // TrackBy optimizado
  trackByCategory(index, categoria) {
    return categoria;
  }
  // TrackBy para películas (si se necesita en el template)
  trackByMovie(index, movie) {
    return movie?.id || movie?.uuid || `${movie?.title?.value}-${index}`;
  }
};
_PeliculasComponent.\u0275fac = function PeliculasComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _PeliculasComponent)(\u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(ChangeDetectorRef));
};
_PeliculasComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PeliculasComponent, selectors: [["app-peliculas"]], viewQuery: function PeliculasComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5);
    \u0275\u0275viewQuery(_c1, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.enEmisionSlider = _t.first);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.allSlider = _t.first);
  }
}, decls: 14, vars: 3, consts: [["enEmisionSlider", ""], ["allSlider", ""], ["href", "#main-content", 1, "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-label", "P\xE1gina de pel\xEDculas de televisi\xF3n", 1, "peliculas", "w-full", "max-w-full", "mx-auto", "py-6", "px-4", "sm:py-8", "sm:px-6", "lg:py-10", "lg:px-8", "overflow-x-hidden", "overflow-y-auto", 2, "max-height", "calc(100vh - 4rem)"], ["itemscope", "", "itemtype", "https://schema.org/WebPage", 1, "intro", "mt-4", "max-w-4xl", "mx-auto"], ["id", "page-title", "itemprop", "headline", 1, "text-2xl", "font-semibold", "text-white"], ["itemprop", "description", 1, "mt-3", "text-sm", "leading-relaxed", "text-gray-300"], [1, "mt-2", "text-xs", "text-gray-400"], ["class", "relative overflow-hidden mt-6", "itemscope", "", "itemtype", "https://schema.org/Movie", 4, "ngIf"], ["class", "mt-6 sm:mt-8", "role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 4, "ngIf"], [4, "ngIf"], ["itemscope", "", "itemtype", "https://schema.org/Movie", 1, "relative", "overflow-hidden", "mt-6"], ["loading", "eager", 3, "data"], ["role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 1, "mt-6", "sm:mt-8"], [1, "animate-pulse", "space-y-4"], [1, "h-6", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-3/4", "sm:w-1/2", "mb-4"], [1, "h-4", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-full", "sm:w-3/4", "mb-6"], [1, "h-40", "sm:h-48", "md:h-64", "bg-gray-300", "dark:bg-gray-700", "rounded"], [1, "sr-only"], ["aria-labelledby", "en-emision-heading", 1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "mb-4"], [1, "flex", "items-center", "justify-between", "mb-3"], ["id", "en-emision-heading", 1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight"], ["aria-label", "Navegaci\xF3n de pel\xEDculas en emisi\xF3n", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver pel\xEDculas anteriores en emisi\xF3n", 1, "btn-nav-control", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", "aria-hidden", "true", 1, "w-5", "h-5"], ["d", "M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"], ["type", "button", "aria-label", "Ver m\xE1s pel\xEDculas en emisi\xF3n", 1, "btn-nav-control", 3, "click"], ["d", "M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"], [1, "text-sm", "sm:text-base", "text-gray-400", "leading-relaxed"], ["role", "region", "aria-label", "Carrusel de pel\xEDculas en emisi\xF3n"], ["ngSkipHydration", "", "variant", "peliculas", 3, "programas", 4, "ngIf"], ["class", "empty-state glass-card-mobile text-center py-12 rounded-lg", 4, "ngIf"], ["aria-labelledby", "all-movies-heading", 1, "mt-8", "sm:mt-10", "lg:mt-12"], ["id", "all-movies-heading", 1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight"], ["aria-label", "Navegaci\xF3n de todas las pel\xEDculas", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver pel\xEDculas anteriores", 1, "btn-nav-control", 3, "click"], ["type", "button", "aria-label", "Ver m\xE1s pel\xEDculas", 1, "btn-nav-control", 3, "click"], ["class", "mt-8 sm:mt-10 lg:mt-12", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["ngSkipHydration", "", "variant", "peliculas", 3, "programas"], [1, "empty-state", "glass-card-mobile", "text-center", "py-12", "rounded-lg"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "aria-hidden", "true", 1, "w-16", "h-16", "mx-auto", "mb-4", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"], [1, "text-responsive", "text-gray-400"], [1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight", "capitalize", 3, "id"], [1, "text-red-600"]], template: function PeliculasComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 2);
    \u0275\u0275text(1, " Saltar al contenido\n");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 3);
    \u0275\u0275element(3, "app-nav-bar");
    \u0275\u0275elementStart(4, "section", 4)(5, "h1", 5);
    \u0275\u0275text(6, " Pel\xEDculas en televisi\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 6);
    \u0275\u0275text(8, " Encuentra las pel\xEDculas que se emiten hoy en la televisi\xF3n de Espa\xF1a: estrenos, cl\xE1sicos y selecciones por g\xE9nero (acci\xF3n, comedia, drama, thriller y m\xE1s). Nuestra gu\xEDa actualizada muestra canales, horarios y detalles de cada emisi\xF3n para ayudarte a elegir qu\xE9 ver. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 7);
    \u0275\u0275text(10, " Informaci\xF3n actualizada varias veces al d\xEDa para reflejar cambios en la programaci\xF3n. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, PeliculasComponent_section_11_Template, 2, 1, "section", 8)(12, PeliculasComponent_div_12_Template, 7, 0, "div", 9)(13, PeliculasComponent_article_13_Template, 34, 5, "article", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(11);
    \u0275\u0275property("ngIf", ctx.destacada);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.isLoading);
  }
}, dependencies: [SliderComponent, CommonModule, NgForOf, NgIf, BannerComponent, NavBarComponent], styles: ['\n\n.peliculas[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  will-change: scroll-position;\n}\n.peliculas[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n.peliculas[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n.peliculas[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  color: #ffffff !important;\n}\n.intro[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  line-height: 1.25;\n  font-weight: 700;\n  letter-spacing: -0.015em;\n  margin: 0 0 0.75rem 0;\n}\n@media (min-width: 640px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.75rem;\n  }\n}\n@media (min-width: 1024px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 2rem;\n  }\n}\n.intro[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  line-height: 1.7;\n  max-width: 78ch;\n  margin: 0.75rem 0 0 0;\n}\n.intro[_ngcontent-%COMP%]   p.text-sm[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  line-height: 1.6;\n}\n.intro[_ngcontent-%COMP%]   p.text-xs[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: rgba(156, 163, 175, 0.8);\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 700;\n  margin: 0 0 0.5rem 0;\n}\n@media (min-width: 640px) {\n  section[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n    font-size: 1.125rem;\n  }\n}\n@media (min-width: 1024px) {\n  section[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n    font-size: 1.25rem;\n  }\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   span.text-red-600[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: #9ca3af;\n  line-height: 1.6;\n  margin: 0;\n}\n@media (min-width: 640px) {\n  section[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n    font-size: 0.9375rem;\n  }\n}\n.btn-nav-control[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.04);\n  border-radius: 50%;\n  color: rgba(255, 255, 255, 0.9);\n  cursor: pointer;\n  transition: all 180ms ease;\n  -webkit-user-select: none;\n  user-select: none;\n  flex-shrink: 0;\n}\n.btn-nav-control[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  width: 20px;\n  height: 20px;\n  transition: transform 180ms ease;\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled) {\n  transform: scale(1.1);\n  background: #dc2626;\n  border-color: #dc2626;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled)   svg[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n}\n.btn-nav-control[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.btn-nav-control[_ngcontent-%COMP%]:active:not(:disabled) {\n  transform: scale(1.05);\n}\n.btn-nav-control[_ngcontent-%COMP%]:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n@media (min-width: 1024px) {\n  .btn-nav-control[_ngcontent-%COMP%] {\n    width: 48px;\n    height: 48px;\n  }\n}\n.animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.3) 25%,\n      rgba(55, 65, 81, 0.5) 50%,\n      rgba(55, 65, 81, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.empty-state[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.1));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  border-radius: 8px;\n  padding: 3rem 1.5rem;\n}\n.empty-state[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  opacity: 0.6;\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #9ca3af;\n}\n.glass-card-mobile[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 8px;\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    -webkit-backdrop-filter: blur(12px) saturate(180%);\n    backdrop-filter: blur(12px) saturate(180%);\n  }\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  min-height: 160px;\n  margin: 0.5rem 0;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.2) 0%,\n      rgba(55, 65, 81, 0.4) 50%,\n      rgba(55, 65, 81, 0.2) 100%);\n  background-size: 200% 100%;\n  border-radius: 8px;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@media (min-width: 640px) {\n  .peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%] {\n    min-height: 180px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%] {\n    min-height: 200px;\n  }\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-poster {\n  object-fit: cover;\n  object-position: center 30%;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-logo {\n  max-height: 75%;\n}\n.peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  min-height: 220px;\n  margin: 1rem 0;\n}\n@media (min-width: 768px) {\n  .peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 280px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 360px;\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only[_ngcontent-%COMP%]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (min-width: 1024px) {\n  section[_ngcontent-%COMP%]:not(:first-of-type) {\n    margin-top: 3.5rem;\n  }\n}\n@supports (content-visibility: auto) {\n  section[_ngcontent-%COMP%] {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 400px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .btn-nav-control[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n}\n@media print {\n  .btn-nav-control[_ngcontent-%COMP%], \n   nav[_ngcontent-%COMP%], \n   button[_ngcontent-%COMP%] {\n    display: none;\n  }\n  section[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n  }\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile[_ngcontent-%COMP%], \n   .empty-state[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-nav-control[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n}\n/*# sourceMappingURL=peliculas.component.css.map */'], changeDetection: 0 });
var PeliculasComponent = _PeliculasComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PeliculasComponent, [{
    type: Component,
    args: [{ selector: "app-peliculas", standalone: true, imports: [SliderComponent, CommonModule, BannerComponent, NavBarComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: `<!-- Skip link para accesibilidad -->\r
<a class="sr-only focus:not-sr-only" href="#main-content">\r
  Saltar al contenido\r
</a>\r
\r
<main\r
  id="main-content"\r
  class="peliculas w-full max-w-full mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:py-10 lg:px-8 overflow-x-hidden overflow-y-auto"\r
  role="main"\r
  aria-label="P\xE1gina de pel\xEDculas de televisi\xF3n"\r
  style="max-height: calc(100vh - 4rem)"\r
>\r
  <!-- Navegaci\xF3n global -->\r
  <app-nav-bar></app-nav-bar>\r
\r
  <!-- Header SEO optimizado -->\r
  <section\r
    class="intro mt-4 max-w-4xl mx-auto"\r
    itemscope\r
    itemtype="https://schema.org/WebPage"\r
  >\r
    <h1\r
      id="page-title"\r
      class="text-2xl font-semibold text-white"\r
      itemprop="headline"\r
    >\r
      Pel\xEDculas en televisi\xF3n\r
    </h1>\r
    <p\r
      class="mt-3 text-sm leading-relaxed text-gray-300"\r
      itemprop="description"\r
    >\r
      Encuentra las pel\xEDculas que se emiten hoy en la televisi\xF3n de Espa\xF1a:\r
      estrenos, cl\xE1sicos y selecciones por g\xE9nero (acci\xF3n, comedia, drama,\r
      thriller y m\xE1s). Nuestra gu\xEDa actualizada muestra canales, horarios y\r
      detalles de cada emisi\xF3n para ayudarte a elegir qu\xE9 ver.\r
    </p>\r
    <p class="mt-2 text-xs text-gray-400">\r
      Informaci\xF3n actualizada varias veces al d\xEDa para reflejar cambios en la\r
      programaci\xF3n.\r
    </p>\r
  </section>\r
\r
  <!-- Featured banner -->\r
  <section\r
    *ngIf="destacada"\r
    class="relative overflow-hidden mt-6"\r
    itemscope\r
    itemtype="https://schema.org/Movie"\r
  >\r
    <app-banner [data]="destacada" loading="eager"></app-banner>\r
    <!-- JSON-LD structured data -->\r
    <script type="application/ld+json" *ngIf="ldJson">\r
      {{ ldJson }}\r
    <\/script>\r
  </section>\r
\r
  <!-- Loading State -->\r
  <div\r
    *ngIf="isLoading"\r
    class="mt-6 sm:mt-8"\r
    role="status"\r
    aria-live="polite"\r
    aria-label="Cargando contenido"\r
  >\r
    <div class="animate-pulse space-y-4">\r
      <div\r
        class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 sm:w-1/2 mb-4"\r
      ></div>\r
      <div\r
        class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full sm:w-3/4 mb-6"\r
      ></div>\r
      <div\r
        class="h-40 sm:h-48 md:h-64 bg-gray-300 dark:bg-gray-700 rounded"\r
      ></div>\r
    </div>\r
    <span class="sr-only">Cargando pel\xEDculas de televisi\xF3n...</span>\r
  </div>\r
\r
  <!-- Content -->\r
  <article *ngIf="!isLoading">\r
    <!-- Pel\xEDculas en emisi\xF3n ahora -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      aria-labelledby="en-emision-heading"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            id="en-emision-heading"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
          >\r
            Pel\xEDculas ahora en televisi\xF3n\r
          </h2>\r
          <nav\r
            class="hidden sm:flex items-center gap-2"\r
            aria-label="Navegaci\xF3n de pel\xEDculas en emisi\xF3n"\r
          >\r
            <button\r
              type="button"\r
              aria-label="Ver pel\xEDculas anteriores en emisi\xF3n"\r
              class="btn-nav-control"\r
              (click)="enEmisionSlider?.prev()"\r
            >\r
              <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                viewBox="0 0 24 24"\r
                class="w-5 h-5"\r
                fill="currentColor"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
                ></path>\r
              </svg>\r
            </button>\r
            <button\r
              type="button"\r
              aria-label="Ver m\xE1s pel\xEDculas en emisi\xF3n"\r
              class="btn-nav-control"\r
              (click)="enEmisionSlider?.next()"\r
            >\r
              <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                viewBox="0 0 24 24"\r
                class="w-5 h-5"\r
                fill="currentColor"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
                ></path>\r
              </svg>\r
            </button>\r
          </nav>\r
        </div>\r
        <p class="text-sm sm:text-base text-gray-400 leading-relaxed">\r
          Descubre las pel\xEDculas que est\xE1n en emisi\xF3n ahora mismo. Desde\r
          comedias hasta thrillers, dramas, romances y acci\xF3n.\r
        </p>\r
      </header>\r
\r
      <div role="region" aria-label="Carrusel de pel\xEDculas en emisi\xF3n">\r
        <app-slider\r
          ngSkipHydration\r
          #enEmisionSlider\r
          [programas]="en_emision"\r
          variant="peliculas"\r
          *ngIf="en_emision.length > 0"\r
        ></app-slider>\r
        <div\r
          *ngIf="en_emision.length === 0"\r
          class="empty-state glass-card-mobile text-center py-12 rounded-lg"\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="w-16 h-16 mx-auto mb-4 text-gray-500"\r
            fill="none"\r
            viewBox="0 0 24 24"\r
            stroke="currentColor"\r
            aria-hidden="true"\r
          >\r
            <path\r
              stroke-linecap="round"\r
              stroke-linejoin="round"\r
              stroke-width="2"\r
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"\r
            />\r
          </svg>\r
          <p class="text-responsive text-gray-400">\r
            No hay pel\xEDculas en emisi\xF3n en este momento\r
          </p>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Todas las pel\xEDculas de hoy -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      aria-labelledby="all-movies-heading"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            id="all-movies-heading"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
          >\r
            Todas las pel\xEDculas en televisi\xF3n hoy\r
          </h2>\r
          <nav\r
            class="hidden sm:flex items-center gap-2"\r
            aria-label="Navegaci\xF3n de todas las pel\xEDculas"\r
          >\r
            <button\r
              type="button"\r
              aria-label="Ver pel\xEDculas anteriores"\r
              class="btn-nav-control"\r
              (click)="allSlider?.prev()"\r
            >\r
              <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                viewBox="0 0 24 24"\r
                class="w-5 h-5"\r
                fill="currentColor"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
                ></path>\r
              </svg>\r
            </button>\r
            <button\r
              type="button"\r
              aria-label="Ver m\xE1s pel\xEDculas"\r
              class="btn-nav-control"\r
              (click)="allSlider?.next()"\r
            >\r
              <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                viewBox="0 0 24 24"\r
                class="w-5 h-5"\r
                fill="currentColor"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
                ></path>\r
              </svg>\r
            </button>\r
          </nav>\r
        </div>\r
        <p class="text-sm sm:text-base text-gray-400 leading-relaxed">\r
          Consulta nuestra gu\xEDa completa con todas las pel\xEDculas que se emiten\r
          hoy en los principales canales de Espa\xF1a.\r
        </p>\r
      </header>\r
\r
      <app-slider\r
        ngSkipHydration\r
        #allSlider\r
        [programas]="peliculas"\r
        variant="peliculas"\r
        *ngIf="peliculas.length > 0"\r
      ></app-slider>\r
    </section>\r
\r
    <!-- Pel\xEDculas por categor\xEDa -->\r
    <section\r
      *ngFor="let cat of categorias; let i = index; trackBy: trackByCategory"\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      [attr.aria-labelledby]="'cat-heading-' + i"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            [id]="'cat-heading-' + i"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight capitalize"\r
          >\r
            Pel\xEDculas de <span class="text-red-600">{{ cat }}</span> en TV hoy\r
          </h2>\r
        </div>\r
        <p class="text-sm sm:text-base text-gray-400 leading-relaxed">\r
          Explora las mejores pel\xEDculas de la categor\xEDa {{ cat }} emitidas hoy.\r
        </p>\r
      </header>\r
\r
      <app-slider\r
        ngSkipHydration\r
        [programas]="getPeliculasByCategory(cat)"\r
        variant="peliculas"\r
      ></app-slider>\r
    </section>\r
  </article>\r
\r
  <!-- Debug panel: muestra en UI el objeto debugPayload (solo en desarrollo) -->\r
  <!-- <aside\r
    *ngIf="debugPayload"\r
    class="debug-panel mt-6 max-w-4xl mx-auto p-4 bg-gray-800 rounded text-sm text-gray-200"\r
  >\r
    <h3 class="font-semibold mb-2">Debug payload (PeliculasComponent)</h3>\r
    <pre class="whitespace-pre-wrap text-xs">{{ debugPayload | json }}</pre>\r
  </aside> -->\r
</main>\r
`, styles: ['/* src/app/pages/peliculas/peliculas.component.scss */\n.peliculas {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  will-change: scroll-position;\n}\n.peliculas h1,\n.peliculas h2,\n.peliculas h3 {\n  color: #ffffff !important;\n}\n.intro {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro h1 {\n  font-size: 1.5rem;\n  line-height: 1.25;\n  font-weight: 700;\n  letter-spacing: -0.015em;\n  margin: 0 0 0.75rem 0;\n}\n@media (min-width: 640px) {\n  .intro h1 {\n    font-size: 1.75rem;\n  }\n}\n@media (min-width: 1024px) {\n  .intro h1 {\n    font-size: 2rem;\n  }\n}\n.intro p {\n  line-height: 1.7;\n  max-width: 78ch;\n  margin: 0.75rem 0 0 0;\n}\n.intro p.text-sm {\n  font-size: 0.9rem;\n  line-height: 1.6;\n}\n.intro p.text-xs {\n  font-size: 0.8125rem;\n  color: rgba(156, 163, 175, 0.8);\n}\nsection header {\n  margin-bottom: 1rem;\n}\nsection header h2 {\n  font-size: 1rem;\n  font-weight: 700;\n  margin: 0 0 0.5rem 0;\n}\n@media (min-width: 640px) {\n  section header h2 {\n    font-size: 1.125rem;\n  }\n}\n@media (min-width: 1024px) {\n  section header h2 {\n    font-size: 1.25rem;\n  }\n}\nsection header h2 span.text-red-600 {\n  color: #dc2626;\n}\nsection header p {\n  font-size: 0.875rem;\n  color: #9ca3af;\n  line-height: 1.6;\n  margin: 0;\n}\n@media (min-width: 640px) {\n  section header p {\n    font-size: 0.9375rem;\n  }\n}\n.btn-nav-control {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.04);\n  border-radius: 50%;\n  color: rgba(255, 255, 255, 0.9);\n  cursor: pointer;\n  transition: all 180ms ease;\n  -webkit-user-select: none;\n  user-select: none;\n  flex-shrink: 0;\n}\n.btn-nav-control svg {\n  width: 20px;\n  height: 20px;\n  transition: transform 180ms ease;\n}\n.btn-nav-control:hover:not(:disabled) {\n  transform: scale(1.1);\n  background: #dc2626;\n  border-color: #dc2626;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);\n}\n.btn-nav-control:hover:not(:disabled) svg {\n  transform: scale(1.1);\n}\n.btn-nav-control:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.btn-nav-control:active:not(:disabled) {\n  transform: scale(1.05);\n}\n.btn-nav-control:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n@media (min-width: 1024px) {\n  .btn-nav-control {\n    width: 48px;\n    height: 48px;\n  }\n}\n.animate-pulse > div {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.3) 25%,\n      rgba(55, 65, 81, 0.5) 50%,\n      rgba(55, 65, 81, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.empty-state {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.1));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  border-radius: 8px;\n  padding: 3rem 1.5rem;\n}\n.empty-state svg {\n  opacity: 0.6;\n}\n.empty-state p {\n  margin: 0;\n  color: #9ca3af;\n}\n.glass-card-mobile {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 8px;\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile {\n    -webkit-backdrop-filter: blur(12px) saturate(180%);\n    backdrop-filter: blur(12px) saturate(180%);\n  }\n}\n.peliculas app-slider {\n  display: block;\n  width: 100%;\n  min-height: 160px;\n  margin: 0.5rem 0;\n}\n.peliculas app-slider:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.2) 0%,\n      rgba(55, 65, 81, 0.4) 50%,\n      rgba(55, 65, 81, 0.2) 100%);\n  background-size: 200% 100%;\n  border-radius: 8px;\n  animation: shimmer 1.5s infinite;\n}\n@media (min-width: 640px) {\n  .peliculas app-slider {\n    min-height: 180px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas app-slider {\n    min-height: 200px;\n  }\n}\n.peliculas app-slider ::ng-deep .slide-poster {\n  object-fit: cover;\n  object-position: center 30%;\n}\n.peliculas app-slider ::ng-deep .slide-logo {\n  max-height: 75%;\n}\n.peliculas app-banner {\n  display: block;\n  width: 100%;\n  min-height: 220px;\n  margin: 1rem 0;\n}\n@media (min-width: 768px) {\n  .peliculas app-banner {\n    min-height: 280px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas app-banner {\n    min-height: 360px;\n  }\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (min-width: 1024px) {\n  section:not(:first-of-type) {\n    margin-top: 3.5rem;\n  }\n}\n@supports (content-visibility: auto) {\n  section {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 400px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .btn-nav-control:hover {\n    transform: none !important;\n  }\n}\n@media print {\n  .btn-nav-control,\n  nav,\n  button {\n    display: none;\n  }\n  section {\n    page-break-inside: avoid;\n  }\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile,\n  .empty-state {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-nav-control {\n    border: 2px solid currentColor;\n  }\n}\n/*# sourceMappingURL=peliculas.component.css.map */\n'] }]
  }], () => [{ type: TvGuideService }, { type: HttpService }, { type: MetaService }, { type: Router }, { type: ChangeDetectorRef }], { enEmisionSlider: [{
    type: ViewChild,
    args: ["enEmisionSlider", { static: false }]
  }], allSlider: [{
    type: ViewChild,
    args: ["allSlider", { static: false }]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PeliculasComponent, { className: "PeliculasComponent", filePath: "src/app/pages/peliculas/peliculas.component.ts", lineNumber: 28 });
})();
if (typeof requestIdleCallback === "undefined") {
  window.requestIdleCallback = (cb) => setTimeout(cb, 1);
}
export {
  PeliculasComponent
};
//# sourceMappingURL=peliculas.component-DEDBRUXB.js.map
