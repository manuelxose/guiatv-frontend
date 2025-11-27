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
  TvGuideService,
  getHoraInicio,
  isLive
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Subject,
  filter,
  first,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/pages/ahora-directo/ahora-directo.component.ts
function AhoraDirectoComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 10);
    \u0275\u0275element(2, "div", 11)(3, "div", 12)(4, "div", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 14);
    \u0275\u0275text(6, "Cargando programaci\xF3n en directo...");
    \u0275\u0275elementEnd()();
  }
}
function AhoraDirectoComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "h2", 17);
    \u0275\u0275text(3, " Error al cargar datos ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 18);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 19);
    \u0275\u0275text(7, " Intentando recuperar la informaci\xF3n. Si el problema persiste, intenta recargar la p\xE1gina. ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.error);
  }
}
function AhoraDirectoComponent_article_13_span_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.peliculas_live.length);
  }
}
function AhoraDirectoComponent_article_13_span_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.series_live.length);
  }
}
function AhoraDirectoComponent_article_13_div_28_article_1_img_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "img", 60);
    \u0275\u0275listener("error", function AhoraDirectoComponent_article_13_div_28_article_1_img_9_Template_img_error_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const programa_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.onLogoError($event, programa_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("src", programa_r4.channelIcon, \u0275\u0275sanitizeUrl)("alt", (programa_r4 == null ? null : programa_r4.channel) || "Canal");
  }
}
function AhoraDirectoComponent_article_13_div_28_article_1_span_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 61);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", programa_r4.category, " ");
  }
}
function AhoraDirectoComponent_article_13_div_28_article_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "article", 43)(1, "div", 44);
    \u0275\u0275element(2, "app-banner", 45);
    \u0275\u0275elementStart(3, "div", 46);
    \u0275\u0275element(4, "span", 47);
    \u0275\u0275elementStart(5, "span", 48);
    \u0275\u0275text(6, "EN DIRECTO");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(7, "div", 49)(8, "div", 50);
    \u0275\u0275template(9, AhoraDirectoComponent_article_13_div_28_article_1_img_9_Template, 1, 2, "img", 51);
    \u0275\u0275elementStart(10, "span", 52);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "h3", 53);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "div", 54)(15, "time", 55);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(16, "svg", 56);
    \u0275\u0275element(17, "circle", 57)(18, "path", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275text(19);
    \u0275\u0275elementEnd();
    \u0275\u0275template(20, AhoraDirectoComponent_article_13_div_28_article_1_span_20_Template, 2, 1, "span", 59);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const programa_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275attribute("aria-label", "Ver detalles de " + ((programa_r4 == null ? null : programa_r4.title == null ? null : programa_r4.title.value) || (programa_r4 == null ? null : programa_r4.name)) + " en " + ((programa_r4 == null ? null : programa_r4.channel) || (programa_r4 == null ? null : programa_r4.network)));
    \u0275\u0275advance(2);
    \u0275\u0275property("data", programa_r4);
    \u0275\u0275attribute("loading", "lazy");
    \u0275\u0275advance(7);
    \u0275\u0275property("ngIf", programa_r4 == null ? null : programa_r4.channelIcon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (programa_r4 == null ? null : programa_r4.channel) || (programa_r4 == null ? null : programa_r4.network) || "Canal desconocido", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (programa_r4 == null ? null : programa_r4.title == null ? null : programa_r4.title.value) || (programa_r4 == null ? null : programa_r4.name) || "Sin t\xEDtulo", " ");
    \u0275\u0275advance(2);
    \u0275\u0275attribute("datetime", programa_r4 == null ? null : programa_r4.start);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r0.horaInicio(programa_r4), " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", programa_r4 == null ? null : programa_r4.category);
  }
}
function AhoraDirectoComponent_article_13_div_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 41);
    \u0275\u0275template(1, AhoraDirectoComponent_article_13_div_28_article_1_Template, 21, 9, "article", 42);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.programs)("ngForTrackBy", ctx_r0.trackById);
  }
}
function AhoraDirectoComponent_article_13_div_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 62);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 63);
    \u0275\u0275element(2, "path", 64);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 65);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 66);
    \u0275\u0275text(6, " Prueba a cambiar de filtro o vuelve m\xE1s tarde ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" No hay ", ctx_r0.isPelicula ? "pel\xEDculas" : "series", " en directo ahora ");
  }
}
function AhoraDirectoComponent_article_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article")(1, "section", 20)(2, "div", 21)(3, "button", 22);
    \u0275\u0275listener("click", function AhoraDirectoComponent_article_13_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.getPeliculasAhora());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 23);
    \u0275\u0275element(5, "path", 24)(6, "rect", 25)(7, "rect", 26)(8, "rect", 27)(9, "rect", 28);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(10, "span");
    \u0275\u0275text(11, "Pel\xEDculas Ahora");
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, AhoraDirectoComponent_article_13_span_12_Template, 2, 1, "span", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "button", 22);
    \u0275\u0275listener("click", function AhoraDirectoComponent_article_13_Template_button_click_13_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.getSeriesAhora());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(14, "svg", 23);
    \u0275\u0275element(15, "rect", 30)(16, "rect", 31)(17, "rect", 32)(18, "rect", 33);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(19, "span");
    \u0275\u0275text(20, "Series Ahora");
    \u0275\u0275elementEnd();
    \u0275\u0275template(21, AhoraDirectoComponent_article_13_span_21_Template, 2, 1, "span", 29);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(22, "section", 34)(23, "header", 35)(24, "h2", 36);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "p", 37);
    \u0275\u0275text(27);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(28, AhoraDirectoComponent_article_13_div_28_Template, 2, 2, "div", 38)(29, AhoraDirectoComponent_article_13_div_29_Template, 7, 1, "div", 39);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("active", ctx_r0.isPelicula);
    \u0275\u0275attribute("aria-selected", ctx_r0.isPelicula)("aria-controls", "peliculas-panel");
    \u0275\u0275advance(9);
    \u0275\u0275property("ngIf", ctx_r0.peliculas_live.length > 0);
    \u0275\u0275advance();
    \u0275\u0275classProp("active", ctx_r0.isSerie);
    \u0275\u0275attribute("aria-selected", ctx_r0.isSerie)("aria-controls", "series-panel");
    \u0275\u0275advance(8);
    \u0275\u0275property("ngIf", ctx_r0.series_live.length > 0);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-labelledby", ctx_r0.isPelicula ? "peliculas-heading" : "series-heading")("id", ctx_r0.isPelicula ? "peliculas-panel" : "series-panel");
    \u0275\u0275advance(2);
    \u0275\u0275property("id", ctx_r0.isPelicula ? "peliculas-heading" : "series-heading");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.isPelicula ? "Pel\xEDculas" : "Series", " en emisi\xF3n ahora ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.isPelicula ? "Pel\xEDculas que est\xE1n emiti\xE9ndose en este momento en televisi\xF3n" : "Series que est\xE1n emiti\xE9ndose en este momento en televisi\xF3n", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.programs && ctx_r0.programs.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.programs || ctx_r0.programs.length === 0);
  }
}
var _AhoraDirectoComponent = class _AhoraDirectoComponent {
  constructor(http, svcGuide, metaSvc, router) {
    this.http = http;
    this.svcGuide = svcGuide;
    this.metaSvc = metaSvc;
    this.router = router;
    this.isPelicula = true;
    this.isSerie = false;
    this.loading = true;
    this.error = null;
    this.programs = [];
    this.peliculas_live = [];
    this.series_live = [];
    this.ldJson = "";
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    this.metaSvc.setMetaTags({
      title: "En Directo Ahora | Pel\xEDculas y Series en TV Espa\xF1a",
      description: "Descubre qu\xE9 se emite ahora mismo en la televisi\xF3n espa\xF1ola. Pel\xEDculas, series y programas en directo con informaci\xF3n actualizada en tiempo real.",
      canonicalUrl: this.router.url,
      keywords: "tv en directo, peliculas ahora, series ahora, television en vivo espa\xF1a",
      ogImage: "/assets/images/directo-og.jpg"
    });
    this.buildJsonLd();
    this.loadProgramData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Build JSON-LD structured data for SEO
   */
  buildJsonLd() {
    try {
      const pageLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Programaci\xF3n en Directo | TV Espa\xF1a",
        description: "Gu\xEDa de programaci\xF3n en directo de televisi\xF3n en Espa\xF1a: pel\xEDculas, series y programas que se emiten ahora mismo.",
        url: this.router.url,
        inLanguage: "es-ES",
        isPartOf: {
          "@type": "WebSite",
          name: "Gu\xEDa TV Espa\xF1a",
          url: window.location.origin
        }
      };
      this.ldJson = JSON.stringify(pageLd, null, 2);
    } catch (e) {
      this.ldJson = "";
    }
  }
  /**
   * Load program data from cache or fetch from API
   */
  loadProgramData() {
    const startTime = performance.now();
    this.http.getProgramacion("today").pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (this.isValidData(data)) {
          this.processPrograms(data);
          this.logPerformance(startTime);
        } else {
          this.waitForObservableFallback();
        }
      },
      error: (err) => {
        this.handleError(err);
        this.waitForObservableFallback();
      }
    });
  }
  /**
   * Wait for programas$ observable to emit valid data (fallback)
   */
  waitForObservableFallback() {
    this.http.programas$.pipe(filter((p) => this.isValidData(p)), first(), takeUntil(this.destroy$)).subscribe({
      next: (programs) => {
        this.processPrograms(programs);
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
        this.loading = false;
      }
    });
  }
  /**
   * Process programs and extract live content
   */
  processPrograms(programs) {
    try {
      this.svcGuide.setData(programs);
      this.extractLivePrograms();
      this.error = null;
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
    }
  }
  /**
   * Extract live movies and series from programs
   * Optimized for performance with single-pass filtering
   */
  extractLivePrograms() {
    this.peliculas_live = [];
    this.series_live = [];
    const allMovies = this.svcGuide.getAllMovies();
    this.peliculas_live = allMovies.filter((movie) => {
      if (!movie?.title?.value || movie.title.value.toLowerCase().trim() === "cine") {
        return false;
      }
      return isLive(movie.start, movie.stop);
    });
    const allSeries = this.svcGuide.getAllSeries();
    this.series_live = allSeries.filter((serie) => {
      return isLive(serie.start, serie.stop);
    });
    this.peliculas_live = this.peliculas_live.slice(0, 30);
    this.series_live = this.series_live.slice(0, 30);
    this.programs = [...this.peliculas_live];
  }
  /**
   * Switch to movies view
   */
  getPeliculasAhora() {
    if (this.isPelicula)
      return;
    this.isPelicula = true;
    this.isSerie = false;
    this.programs = [...this.peliculas_live];
    this.metaSvc.setMetaTags({
      title: "Pel\xEDculas en Directo Ahora | TV Espa\xF1a",
      description: `${this.peliculas_live.length} pel\xEDculas emiti\xE9ndose ahora mismo en televisi\xF3n espa\xF1ola.`
    });
  }
  /**
   * Switch to series view
   */
  getSeriesAhora() {
    if (this.isSerie)
      return;
    this.isPelicula = false;
    this.isSerie = true;
    this.programs = [...this.series_live];
    this.metaSvc.setMetaTags({
      title: "Series en Directo Ahora | TV Espa\xF1a",
      description: `${this.series_live.length} series emiti\xE9ndose ahora mismo en televisi\xF3n espa\xF1ola.`
    });
  }
  /**
   * Get formatted start time from program
   */
  horaInicio(item) {
    try {
      const start = item?.start || item?.startDate || item?.date || item?.start_time;
      if (!start)
        return "";
      return getHoraInicio(start);
    } catch {
      return "";
    }
  }
  /**
   * Handle logo error - fallback to placeholder
   */
  onLogoError(event, programa) {
    const img = event.target;
    if (img && !img.dataset["errorHandled"]) {
      img.dataset["errorHandled"] = "true";
      img.style.display = "none";
    }
  }
  /**
   * TrackBy function for ngFor performance
   */
  trackById(index, item) {
    return item?.id || item?.channelId || item?.start || index;
  }
  /**
   * Validate if data is an array with content
   */
  isValidData(data) {
    return Array.isArray(data) && data.length > 0;
  }
  /**
   * Handle errors with user-friendly messages
   */
  handleError(err) {
    console.error("\u274C AHORA-DIRECTO - Error:", err);
    this.error = "No se pudo cargar la programaci\xF3n en directo. Intenta recargar la p\xE1gina.";
    this.loading = false;
  }
  /**
   * Log performance metrics
   */
  logPerformance(startTime) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`\u26A1 AHORA-DIRECTO - Datos procesados en ${duration}ms | Pel\xEDculas: ${this.peliculas_live.length} | Series: ${this.series_live.length}`);
  }
};
_AhoraDirectoComponent.\u0275fac = function AhoraDirectoComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _AhoraDirectoComponent)(\u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router));
};
_AhoraDirectoComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AhoraDirectoComponent, selectors: [["app-ahora-directo"]], decls: 14, vars: 3, consts: [["href", "#main-content", 1, "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-label", "Pel\xEDculas y series en directo", 1, "ahora-directo", "w-full", "max-w-full", "mx-auto", "py-6", "px-4", "sm:py-8", "sm:px-6", "lg:py-10", "lg:px-8", "overflow-x-hidden"], ["itemscope", "", "itemtype", "https://schema.org/WebPage", 1, "intro", "mt-4", "max-w-4xl", "mx-auto"], ["id", "page-title", "itemprop", "headline", 1, "text-2xl", "font-semibold", "text-white"], ["itemprop", "description", 1, "mt-3", "text-sm", "leading-relaxed", "text-gray-300"], [1, "mt-2", "text-xs", "text-gray-400"], ["class", "mt-6 sm:mt-8", "role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 4, "ngIf"], ["class", "mt-6 sm:mt-8", "role", "alert", "aria-live", "assertive", 4, "ngIf"], [4, "ngIf"], ["role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 1, "mt-6", "sm:mt-8"], [1, "animate-pulse", "space-y-4"], [1, "h-6", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-3/4", "sm:w-1/2", "mb-4"], [1, "h-4", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-full", "sm:w-3/4", "mb-6"], [1, "h-40", "sm:h-48", "md:h-64", "bg-gray-300", "dark:bg-gray-700", "rounded"], [1, "sr-only"], ["role", "alert", "aria-live", "assertive", 1, "mt-6", "sm:mt-8"], [1, "error-box", "glass-card-mobile", "p-6", "rounded-lg"], [1, "text-lg", "font-semibold", "text-red-400", "mb-2"], [1, "text-responsive", "text-gray-300"], [1, "text-xs", "text-gray-400", "mt-2"], ["aria-label", "Filtros de contenido", 1, "mt-6", "sm:mt-8"], ["role", "tablist", "aria-label", "Tipo de contenido en directo", 1, "flex", "items-center", "justify-center", "gap-3"], ["type", "button", "role", "tab", 1, "filter-btn", "touch-target", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", "aria-hidden", "true", 1, "w-5", "h-5", "mr-2"], ["d", "M4 6.414L0.586 3 2 1.586 5.414 5 8.828 1.586 10.243 3 6.828 6.414 10.243 9.828 8.828 11.243 5.414 7.828 2 11.243 0.586 9.828 4 6.414z"], ["x", "12", "y", "2", "width", "10", "height", "2"], ["x", "12", "y", "6", "width", "10", "height", "2"], ["x", "12", "y", "10", "width", "10", "height", "2"], ["x", "2", "y", "14", "width", "20", "height", "8", "rx", "1"], ["class", "badge-count", 4, "ngIf"], ["x", "2", "y", "3", "width", "9", "height", "9", "rx", "1"], ["x", "13", "y", "3", "width", "9", "height", "9", "rx", "1"], ["x", "2", "y", "14", "width", "9", "height", "9", "rx", "1"], ["x", "13", "y", "14", "width", "9", "height", "9", "rx", "1"], ["role", "tabpanel", 1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "mb-4"], [1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight", 3, "id"], [1, "mt-2", "text-sm", "sm:text-base", "text-gray-400", "leading-relaxed"], ["class", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6", "role", "list", 4, "ngIf"], ["class", "empty-state-card glass-card-mobile text-center py-12", 4, "ngIf"], [1, "badge-count"], ["role", "list", 1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-4", "sm:gap-5", "lg:gap-6"], ["class", "program-card-live glass-card-mobile touch-target gpu-accelerated", "role", "listitem", "tabindex", "0", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["role", "listitem", "tabindex", "0", 1, "program-card-live", "glass-card-mobile", "touch-target", "gpu-accelerated"], [1, "program-media-wrapper"], [3, "data"], ["aria-hidden", "true", 1, "live-indicator"], [1, "live-dot"], [1, "live-text"], [1, "program-info-wrapper"], [1, "program-channel"], ["class", "channel-icon", "loading", "lazy", 3, "src", "alt", "error", 4, "ngIf"], [1, "channel-name", "text-truncate-mobile"], [1, "program-title", "line-clamp-2"], [1, "program-meta"], [1, "program-time"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", "aria-hidden", "true", 1, "w-4", "h-4", "mr-1"], ["cx", "12", "cy", "12", "r", "10", "fill", "none", "stroke", "currentColor", "stroke-width", "2"], ["d", "M12 6v6l4 2", "stroke", "currentColor", "stroke-width", "2", "fill", "none"], ["class", "program-category text-truncate-mobile", 4, "ngIf"], ["loading", "lazy", 1, "channel-icon", 3, "error", "src", "alt"], [1, "program-category", "text-truncate-mobile"], [1, "empty-state-card", "glass-card-mobile", "text-center", "py-12"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "aria-hidden", "true", 1, "w-16", "h-16", "mx-auto", "mb-4", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], [1, "text-responsive", "text-gray-400", "mb-2"], [1, "text-sm", "text-gray-500"]], template: function AhoraDirectoComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 0);
    \u0275\u0275text(1, " Saltar al contenido\n");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 1);
    \u0275\u0275element(3, "app-nav-bar");
    \u0275\u0275elementStart(4, "section", 2)(5, "h1", 3);
    \u0275\u0275text(6, " Pel\xEDculas y series en directo ahora en TV ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 4);
    \u0275\u0275text(8, " Descubre qu\xE9 se emite ahora mismo en la televisi\xF3n espa\xF1ola: pel\xEDculas, series, documentales y m\xE1s. Informaci\xF3n actualizada en tiempo real con canales, horarios y detalles de cada programa. Usa los filtros para encontrar r\xE1pidamente pel\xEDculas o series que est\xE1n en emisi\xF3n en este momento. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 5);
    \u0275\u0275text(10, " Actualizado constantemente para mostrar la programaci\xF3n en directo m\xE1s precisa. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, AhoraDirectoComponent_div_11_Template, 7, 0, "div", 6)(12, AhoraDirectoComponent_div_12_Template, 8, 1, "div", 7)(13, AhoraDirectoComponent_article_13_Template, 30, 17, "article", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(11);
    \u0275\u0275property("ngIf", ctx.loading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.loading && ctx.error);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.loading && !ctx.error);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, NavBarComponent, BannerComponent], styles: ['@charset "UTF-8";\n\n\n\n.ahora-directo[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n  will-change: scroll-position;\n}\n.intro[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff;\n}\n@media (max-width: 640px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.5rem;\n  }\n}\n.intro[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro[_ngcontent-%COMP%]   p.text-sm[_ngcontent-%COMP%] {\n  line-height: 1.5;\n}\n.animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.error-box[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(220, 38, 38, 0.08),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.error-box[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  color: #fca5a5;\n}\n.filter-btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0.75rem 1.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: rgba(255, 255, 255, 0.7);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  min-height: 44px;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.filter-btn[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transition: transform 0.2s ease;\n}\n.filter-btn[_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 20px;\n  padding: 0 6px;\n  margin-left: 0.5rem;\n  background: rgba(220, 38, 38, 0.2);\n  border-radius: 10px;\n  font-size: 0.75rem;\n  font-weight: 700;\n}\n.filter-btn[_ngcontent-%COMP%]:hover:not(.active) {\n  transform: translateY(-2px);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.filter-btn.active[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%] {\n  background: rgba(220, 38, 38, 0.12);\n  color: #ffffff;\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);\n  transform: translateY(-2px);\n}\n.filter-btn.active[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n}\n.filter-btn.active[_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%] {\n  background: rgba(220, 38, 38, 0.4);\n}\n.filter-btn[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.filter-btn[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n}\n@media (min-width: 640px) {\n  .filter-btn[_ngcontent-%COMP%] {\n    padding: 0.875rem 2rem;\n    font-size: 1rem;\n  }\n}\n.program-card-live[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  border-radius: 0.75rem;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(0, 0, 0, 0.2));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.program-card-live[_ngcontent-%COMP%]:hover, \n.program-card-live[_ngcontent-%COMP%]:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.program-card-live[_ngcontent-%COMP%]:hover   .program-media-wrapper[_ngcontent-%COMP%]   img[_ngcontent-%COMP%], \n.program-card-live[_ngcontent-%COMP%]:focus-visible   .program-media-wrapper[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.program-card-live[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.program-card-live[_ngcontent-%COMP%]:active {\n  transform: translateY(-2px);\n}\n.program-media-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(0, 0, 0, 0.3),\n      rgba(0, 0, 0, 0.2));\n}\n.program-media-wrapper[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n.program-media-wrapper[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%]     img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition: transform 0.3s ease;\n}\n.live-indicator[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0.75rem;\n  right: 0.75rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.375rem 0.75rem;\n  background: rgba(220, 38, 38, 0.95);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 6px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #ffffff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n  animation: _ngcontent-%COMP%_pulse-live 2s ease-in-out infinite;\n}\n.live-indicator[_ngcontent-%COMP%]   .live-dot[_ngcontent-%COMP%] {\n  width: 8px;\n  height: 8px;\n  background: #ffffff;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_blink-live 1.5s ease-in-out infinite;\n}\n.live-indicator[_ngcontent-%COMP%]   .live-text[_ngcontent-%COMP%] {\n  letter-spacing: 0.05em;\n}\n@keyframes _ngcontent-%COMP%_pulse-live {\n  0%, 100% {\n    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n  }\n  50% {\n    box-shadow: 0 4px 16px rgba(220, 38, 38, 0.6);\n  }\n}\n@keyframes _ngcontent-%COMP%_blink-live {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.3;\n  }\n}\n.program-info-wrapper[_ngcontent-%COMP%] {\n  padding: 1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n@media (min-width: 640px) {\n  .program-info-wrapper[_ngcontent-%COMP%] {\n    padding: 1.25rem;\n  }\n}\n.program-channel[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  margin-bottom: 0.25rem;\n}\n.program-channel[_ngcontent-%COMP%]   .channel-icon[_ngcontent-%COMP%] {\n  width: 24px;\n  height: 24px;\n  object-fit: contain;\n  border-radius: 4px;\n}\n.program-channel[_ngcontent-%COMP%]   .channel-name[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: #9ca3af;\n  flex: 1;\n  min-width: 0;\n}\n.program-title[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 700;\n  color: #ffffff;\n  line-height: 1.3;\n  margin: 0;\n  overflow: hidden;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n}\n@media (min-width: 640px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 1.125rem;\n  }\n}\n.program-meta[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n  margin-top: 0.25rem;\n}\n.program-meta[_ngcontent-%COMP%]   .program-time[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: #fca5a5;\n  background: rgba(220, 38, 38, 0.12);\n  padding: 0.25rem 0.5rem;\n  border-radius: 6px;\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.program-meta[_ngcontent-%COMP%]   .program-time[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n.program-meta[_ngcontent-%COMP%]   .program-category[_ngcontent-%COMP%] {\n  font-size: 0.8rem;\n  color: #9ca3af;\n  font-weight: 500;\n  max-width: 120px;\n}\n.empty-state-card[_ngcontent-%COMP%] {\n  border-radius: 0.75rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only[_ngcontent-%COMP%]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .ahora-directo[_ngcontent-%COMP%] {\n    color: #e5e7eb;\n  }\n  .animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .filter-btn[_ngcontent-%COMP%]:hover, \n   .program-card-live[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n  .live-indicator[_ngcontent-%COMP%], \n   .live-dot[_ngcontent-%COMP%] {\n    animation: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  .program-card-live[_ngcontent-%COMP%] {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 400px;\n  }\n}\n@media print {\n  .filter-btn[_ngcontent-%COMP%], \n   .live-indicator[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .program-card-live[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .program-card-live[_ngcontent-%COMP%], \n   .glass-card-mobile[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .filter-btn[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section[_ngcontent-%COMP%] {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .ahora-directo[_ngcontent-%COMP%] {\n    padding-bottom: calc(2rem + env(safe-area-inset-bottom));\n  }\n}\n/*# sourceMappingURL=ahora-directo.component.css.map */'] });
var AhoraDirectoComponent = _AhoraDirectoComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AhoraDirectoComponent, [{
    type: Component,
    args: [{ selector: "app-ahora-directo", standalone: true, imports: [CommonModule, NavBarComponent, BannerComponent], template: `<!-- Skip link para accesibilidad -->\r
<a class="sr-only focus:not-sr-only" href="#main-content">\r
  Saltar al contenido\r
</a>\r
\r
<main\r
  id="main-content"\r
  class="ahora-directo w-full max-w-full mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:py-10 lg:px-8 overflow-x-hidden"\r
  role="main"\r
  aria-label="Pel\xEDculas y series en directo"\r
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
      Pel\xEDculas y series en directo ahora en TV\r
    </h1>\r
    <p\r
      class="mt-3 text-sm leading-relaxed text-gray-300"\r
      itemprop="description"\r
    >\r
      Descubre qu\xE9 se emite ahora mismo en la televisi\xF3n espa\xF1ola: pel\xEDculas,\r
      series, documentales y m\xE1s. Informaci\xF3n actualizada en tiempo real con\r
      canales, horarios y detalles de cada programa. Usa los filtros para\r
      encontrar r\xE1pidamente pel\xEDculas o series que est\xE1n en emisi\xF3n en este\r
      momento.\r
    </p>\r
    <p class="mt-2 text-xs text-gray-400">\r
      Actualizado constantemente para mostrar la programaci\xF3n en directo m\xE1s\r
      precisa.\r
    </p>\r
\r
    <!-- JSON-LD structured data -->\r
    <script type="application/ld+json" *ngIf="ldJson">\r
      {{ ldJson }}\r
    <\/script>\r
  </section>\r
\r
  <!-- Estados de carga -->\r
  <div\r
    *ngIf="loading"\r
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
    <span class="sr-only">Cargando programaci\xF3n en directo...</span>\r
  </div>\r
\r
  <!-- Estado de error -->\r
  <div\r
    *ngIf="!loading && error"\r
    class="mt-6 sm:mt-8"\r
    role="alert"\r
    aria-live="assertive"\r
  >\r
    <div class="error-box glass-card-mobile p-6 rounded-lg">\r
      <h2 class="text-lg font-semibold text-red-400 mb-2">\r
        Error al cargar datos\r
      </h2>\r
      <p class="text-responsive text-gray-300">{{ error }}</p>\r
      <p class="text-xs text-gray-400 mt-2">\r
        Intentando recuperar la informaci\xF3n. Si el problema persiste, intenta\r
        recargar la p\xE1gina.\r
      </p>\r
    </div>\r
  </div>\r
\r
  <!-- Contenido principal -->\r
  <article *ngIf="!loading && !error">\r
    <!-- Filtros de contenido -->\r
    <section class="mt-6 sm:mt-8" aria-label="Filtros de contenido">\r
      <div\r
        class="flex items-center justify-center gap-3"\r
        role="tablist"\r
        aria-label="Tipo de contenido en directo"\r
      >\r
        <button\r
          type="button"\r
          role="tab"\r
          class="filter-btn touch-target"\r
          [class.active]="isPelicula"\r
          [attr.aria-selected]="isPelicula"\r
          [attr.aria-controls]="'peliculas-panel'"\r
          (click)="getPeliculasAhora()"\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="w-5 h-5 mr-2"\r
            viewBox="0 0 24 24"\r
            fill="currentColor"\r
            aria-hidden="true"\r
          >\r
            <path\r
              d="M4 6.414L0.586 3 2 1.586 5.414 5 8.828 1.586 10.243 3 6.828 6.414 10.243 9.828 8.828 11.243 5.414 7.828 2 11.243 0.586 9.828 4 6.414z"\r
            />\r
            <rect x="12" y="2" width="10" height="2" />\r
            <rect x="12" y="6" width="10" height="2" />\r
            <rect x="12" y="10" width="10" height="2" />\r
            <rect x="2" y="14" width="20" height="8" rx="1" />\r
          </svg>\r
          <span>Pel\xEDculas Ahora</span>\r
          <span class="badge-count" *ngIf="peliculas_live.length > 0">{{\r
            peliculas_live.length\r
          }}</span>\r
        </button>\r
\r
        <button\r
          type="button"\r
          role="tab"\r
          class="filter-btn touch-target"\r
          [class.active]="isSerie"\r
          [attr.aria-selected]="isSerie"\r
          [attr.aria-controls]="'series-panel'"\r
          (click)="getSeriesAhora()"\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="w-5 h-5 mr-2"\r
            viewBox="0 0 24 24"\r
            fill="currentColor"\r
            aria-hidden="true"\r
          >\r
            <rect x="2" y="3" width="9" height="9" rx="1" />\r
            <rect x="13" y="3" width="9" height="9" rx="1" />\r
            <rect x="2" y="14" width="9" height="9" rx="1" />\r
            <rect x="13" y="14" width="9" height="9" rx="1" />\r
          </svg>\r
          <span>Series Ahora</span>\r
          <span class="badge-count" *ngIf="series_live.length > 0">{{\r
            series_live.length\r
          }}</span>\r
        </button>\r
      </div>\r
    </section>\r
\r
    <!-- Grid de programas en directo -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      [attr.aria-labelledby]="\r
        isPelicula ? 'peliculas-heading' : 'series-heading'\r
      "\r
      role="tabpanel"\r
      [attr.id]="isPelicula ? 'peliculas-panel' : 'series-panel'"\r
    >\r
      <header class="mb-4">\r
        <h2\r
          [id]="isPelicula ? 'peliculas-heading' : 'series-heading'"\r
          class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
        >\r
          {{ isPelicula ? "Pel\xEDculas" : "Series" }} en emisi\xF3n ahora\r
        </h2>\r
        <p class="mt-2 text-sm sm:text-base text-gray-400 leading-relaxed">\r
          {{\r
            isPelicula\r
              ? "Pel\xEDculas que est\xE1n emiti\xE9ndose en este momento en televisi\xF3n"\r
              : "Series que est\xE1n emiti\xE9ndose en este momento en televisi\xF3n"\r
          }}\r
        </p>\r
      </header>\r
\r
      <!-- Grid responsivo -->\r
      <div\r
        *ngIf="programs && programs.length > 0"\r
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"\r
        role="list"\r
      >\r
        <article\r
          *ngFor="let programa of programs; trackBy: trackById"\r
          class="program-card-live glass-card-mobile touch-target gpu-accelerated"\r
          role="listitem"\r
          tabindex="0"\r
          [attr.aria-label]="\r
            'Ver detalles de ' +\r
            (programa?.title?.value || programa?.name) +\r
            ' en ' +\r
            (programa?.channel || programa?.network)\r
          "\r
        >\r
          <!-- Media container -->\r
          <div class="program-media-wrapper">\r
            <app-banner [data]="programa" [attr.loading]="'lazy'"></app-banner>\r
\r
            <!-- Live indicator -->\r
            <div class="live-indicator" aria-hidden="true">\r
              <span class="live-dot"></span>\r
              <span class="live-text">EN DIRECTO</span>\r
            </div>\r
          </div>\r
\r
          <!-- Program info -->\r
          <div class="program-info-wrapper">\r
            <div class="program-channel">\r
              <img\r
                *ngIf="programa?.channelIcon"\r
                [src]="programa.channelIcon"\r
                [alt]="programa?.channel || 'Canal'"\r
                class="channel-icon"\r
                loading="lazy"\r
                (error)="onLogoError($event, programa)"\r
              />\r
              <span class="channel-name text-truncate-mobile">\r
                {{\r
                  programa?.channel || programa?.network || "Canal desconocido"\r
                }}\r
              </span>\r
            </div>\r
\r
            <h3 class="program-title line-clamp-2">\r
              {{ programa?.title?.value || programa?.name || "Sin t\xEDtulo" }}\r
            </h3>\r
\r
            <div class="program-meta">\r
              <time class="program-time" [attr.datetime]="programa?.start">\r
                <svg\r
                  xmlns="http://www.w3.org/2000/svg"\r
                  class="w-4 h-4 mr-1"\r
                  viewBox="0 0 24 24"\r
                  fill="currentColor"\r
                  aria-hidden="true"\r
                >\r
                  <circle\r
                    cx="12"\r
                    cy="12"\r
                    r="10"\r
                    fill="none"\r
                    stroke="currentColor"\r
                    stroke-width="2"\r
                  />\r
                  <path\r
                    d="M12 6v6l4 2"\r
                    stroke="currentColor"\r
                    stroke-width="2"\r
                    fill="none"\r
                  />\r
                </svg>\r
                {{ horaInicio(programa) }}\r
              </time>\r
\r
              <span\r
                *ngIf="programa?.category"\r
                class="program-category text-truncate-mobile"\r
              >\r
                {{ programa.category }}\r
              </span>\r
            </div>\r
          </div>\r
        </article>\r
      </div>\r
\r
      <!-- Empty state -->\r
      <div\r
        *ngIf="!programs || programs.length === 0"\r
        class="empty-state-card glass-card-mobile text-center py-12"\r
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
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"\r
          />\r
        </svg>\r
        <p class="text-responsive text-gray-400 mb-2">\r
          No hay {{ isPelicula ? "pel\xEDculas" : "series" }} en directo ahora\r
        </p>\r
        <p class="text-sm text-gray-500">\r
          Prueba a cambiar de filtro o vuelve m\xE1s tarde\r
        </p>\r
      </div>\r
    </section>\r
  </article>\r
</main>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/pages/ahora-directo/ahora-directo.component.scss */\n.ahora-directo {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n  will-change: scroll-position;\n}\n.intro {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro h1 {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff;\n}\n@media (max-width: 640px) {\n  .intro h1 {\n    font-size: 1.5rem;\n  }\n}\n.intro p {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro p.text-sm {\n  line-height: 1.5;\n}\n.animate-pulse > div {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.error-box {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(220, 38, 38, 0.08),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.error-box h2 {\n  color: #fca5a5;\n}\n.filter-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0.75rem 1.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: rgba(255, 255, 255, 0.7);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  min-height: 44px;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.filter-btn svg {\n  transition: transform 0.2s ease;\n}\n.filter-btn .badge-count {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 20px;\n  padding: 0 6px;\n  margin-left: 0.5rem;\n  background: rgba(220, 38, 38, 0.2);\n  border-radius: 10px;\n  font-size: 0.75rem;\n  font-weight: 700;\n}\n.filter-btn:hover:not(.active) {\n  transform: translateY(-2px);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.filter-btn.active,\n.filter-btn[aria-selected=true] {\n  background: rgba(220, 38, 38, 0.12);\n  color: #ffffff;\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);\n  transform: translateY(-2px);\n}\n.filter-btn.active svg,\n.filter-btn[aria-selected=true] svg {\n  transform: scale(1.1);\n}\n.filter-btn.active .badge-count,\n.filter-btn[aria-selected=true] .badge-count {\n  background: rgba(220, 38, 38, 0.4);\n}\n.filter-btn:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.filter-btn:active {\n  transform: translateY(0);\n}\n@media (min-width: 640px) {\n  .filter-btn {\n    padding: 0.875rem 2rem;\n    font-size: 1rem;\n  }\n}\n.program-card-live {\n  display: flex;\n  flex-direction: column;\n  border-radius: 0.75rem;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(0, 0, 0, 0.2));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.program-card-live:hover,\n.program-card-live:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.program-card-live:hover .program-media-wrapper img,\n.program-card-live:focus-visible .program-media-wrapper img {\n  transform: scale(1.05);\n}\n.program-card-live:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.program-card-live:active {\n  transform: translateY(-2px);\n}\n.program-media-wrapper {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(0, 0, 0, 0.3),\n      rgba(0, 0, 0, 0.2));\n}\n.program-media-wrapper app-banner {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n.program-media-wrapper app-banner ::ng-deep img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition: transform 0.3s ease;\n}\n.live-indicator {\n  position: absolute;\n  top: 0.75rem;\n  right: 0.75rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.375rem 0.75rem;\n  background: rgba(220, 38, 38, 0.95);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 6px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #ffffff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n  animation: pulse-live 2s ease-in-out infinite;\n}\n.live-indicator .live-dot {\n  width: 8px;\n  height: 8px;\n  background: #ffffff;\n  border-radius: 50%;\n  animation: blink-live 1.5s ease-in-out infinite;\n}\n.live-indicator .live-text {\n  letter-spacing: 0.05em;\n}\n@keyframes pulse-live {\n  0%, 100% {\n    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n  }\n  50% {\n    box-shadow: 0 4px 16px rgba(220, 38, 38, 0.6);\n  }\n}\n@keyframes blink-live {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.3;\n  }\n}\n.program-info-wrapper {\n  padding: 1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n@media (min-width: 640px) {\n  .program-info-wrapper {\n    padding: 1.25rem;\n  }\n}\n.program-channel {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  margin-bottom: 0.25rem;\n}\n.program-channel .channel-icon {\n  width: 24px;\n  height: 24px;\n  object-fit: contain;\n  border-radius: 4px;\n}\n.program-channel .channel-name {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: #9ca3af;\n  flex: 1;\n  min-width: 0;\n}\n.program-title {\n  font-size: 1rem;\n  font-weight: 700;\n  color: #ffffff;\n  line-height: 1.3;\n  margin: 0;\n  overflow: hidden;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n}\n@media (min-width: 640px) {\n  .program-title {\n    font-size: 1.125rem;\n  }\n}\n.program-meta {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n  margin-top: 0.25rem;\n}\n.program-meta .program-time {\n  display: inline-flex;\n  align-items: center;\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: #fca5a5;\n  background: rgba(220, 38, 38, 0.12);\n  padding: 0.25rem 0.5rem;\n  border-radius: 6px;\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.program-meta .program-time svg {\n  flex-shrink: 0;\n}\n.program-meta .program-category {\n  font-size: 0.8rem;\n  color: #9ca3af;\n  font-weight: 500;\n  max-width: 120px;\n}\n.empty-state-card {\n  border-radius: 0.75rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .ahora-directo {\n    color: #e5e7eb;\n  }\n  .animate-pulse > div {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .filter-btn:hover,\n  .program-card-live:hover {\n    transform: none !important;\n  }\n  .live-indicator,\n  .live-dot {\n    animation: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  .program-card-live {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 400px;\n  }\n}\n@media print {\n  .filter-btn,\n  .live-indicator {\n    display: none;\n  }\n  .program-card-live {\n    page-break-inside: avoid;\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .program-card-live,\n  .glass-card-mobile {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .filter-btn {\n    border: 2px solid currentColor;\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .ahora-directo {\n    padding-bottom: calc(2rem + env(safe-area-inset-bottom));\n  }\n}\n/*# sourceMappingURL=ahora-directo.component.css.map */\n'] }]
  }], () => [{ type: HttpService }, { type: TvGuideService }, { type: MetaService }, { type: Router }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AhoraDirectoComponent, { className: "AhoraDirectoComponent", filePath: "src/app/pages/ahora-directo/ahora-directo.component.ts", lineNumber: 19 });
})();
export {
  AhoraDirectoComponent
};
//# sourceMappingURL=ahora-directo.component-JGZVTNAN.js.map
