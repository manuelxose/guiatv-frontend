import {
  NavBarComponent
} from "./chunk-MEXIL4LO.js";
import "./chunk-REERXIA3.js";
import {
  ActivatedRoute,
  CommonModule,
  HttpService,
  NgForOf,
  NgIf,
  Router,
  SlicePipe,
  TvGuideService,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Subject,
  filter,
  first,
  setClassMetadata,
  take,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind3,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/pages/lista-destacadas/lista-destacadas.component.ts
function ListaDestacadasComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 10);
    \u0275\u0275element(2, "div", 11)(3, "div", 12)(4, "div", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 14);
    \u0275\u0275text(6, "Cargando destacados...");
    \u0275\u0275elementEnd()();
  }
}
function ListaDestacadasComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "h2", 17);
    \u0275\u0275text(3, " Error al cargar datos ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 18);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 19);
    \u0275\u0275text(7, " Si el problema persiste, intenta recargar la p\xE1gina. ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.error);
  }
}
function ListaDestacadasComponent_article_13_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 34);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.peliculasDestacadas.length);
  }
}
function ListaDestacadasComponent_article_13_span_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 34);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.seriesDestacadas.length);
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_img_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "img", 54);
    \u0275\u0275listener("error", function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_img_9_Template_img_error_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const programa_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.onLogoError($event, programa_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r4 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275property("src", programa_r4.channelIcon, \u0275\u0275sanitizeUrl)("alt", ctx_r0.getChannelName(programa_r4) + " logo");
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_p_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 55);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "slice");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind3(2, 1, (programa_r4 == null ? null : programa_r4.summary) || (programa_r4 == null ? null : programa_r4.description) || (programa_r4 == null ? null : programa_r4.plot), 0, 500), " ");
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_span_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 56);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r4 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.getCategory(programa_r4));
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 39);
    \u0275\u0275listener("click", function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_Template_article_click_0_listener() {
      const programa_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.openDetails(programa_r4));
    })("keydown.enter", function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_Template_article_keydown_enter_0_listener() {
      const programa_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.openDetails(programa_r4));
    });
    \u0275\u0275elementStart(1, "div", 40)(2, "img", 41);
    \u0275\u0275listener("error", function ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_Template_img_error_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.target.src = "/assets/images/default-movie-poster.svg");
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 42);
    \u0275\u0275element(4, "span", 43);
    \u0275\u0275elementStart(5, "span", 44);
    \u0275\u0275text(6, "DESTACADO");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(7, "div", 45)(8, "div", 46);
    \u0275\u0275template(9, ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_img_9_Template, 1, 2, "img", 47);
    \u0275\u0275elementStart(10, "span", 48);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "h3", 49);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_p_14_Template, 3, 5, "p", 50);
    \u0275\u0275elementStart(15, "div", 51)(16, "time", 52);
    \u0275\u0275text(17);
    \u0275\u0275elementEnd();
    \u0275\u0275template(18, ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_span_18_Template, 2, 1, "span", 53);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const programa_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275attribute("aria-label", "Ver detalles de " + ((programa_r4 == null ? null : programa_r4.title == null ? null : programa_r4.title.value) || (programa_r4 == null ? null : programa_r4.name)) + " en " + ctx_r0.getChannelName(programa_r4));
    \u0275\u0275advance(2);
    \u0275\u0275property("src", (programa_r4 == null ? null : programa_r4.poster) || (programa_r4 == null ? null : programa_r4.image) || (programa_r4 == null ? null : programa_r4.icon) || "/assets/images/default-movie-poster.svg", \u0275\u0275sanitizeUrl)("alt", (programa_r4 == null ? null : programa_r4.title == null ? null : programa_r4.title.value) || (programa_r4 == null ? null : programa_r4.name) || "Programa");
    \u0275\u0275advance(7);
    \u0275\u0275property("ngIf", programa_r4 == null ? null : programa_r4.channelIcon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.getChannelName(programa_r4));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (programa_r4 == null ? null : programa_r4.title == null ? null : programa_r4.title.value) || (programa_r4 == null ? null : programa_r4.name) || "Sin t\xEDtulo", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (programa_r4 == null ? null : programa_r4.summary) || (programa_r4 == null ? null : programa_r4.description) || (programa_r4 == null ? null : programa_r4.plot));
    \u0275\u0275advance(2);
    \u0275\u0275attribute("datetime", programa_r4 == null ? null : programa_r4.start);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.horaInicio(programa_r4));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.getCategory(programa_r4));
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 37);
    \u0275\u0275template(1, ListaDestacadasComponent_article_13_ng_container_24_div_1_article_1_Template, 19, 10, "article", 38);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programs_r6 = \u0275\u0275nextContext().ngIf;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", programs_r6)("ngForTrackBy", ctx_r0.trackById);
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 57);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 58);
    \u0275\u0275element(2, "path", 59);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 60);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 61);
    \u0275\u0275text(6, " Prueba a cambiar de filtro o vuelve m\xE1s tarde ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" No hay ", ctx_r0.isPelicula ? "pel\xEDculas" : "series", " destacadas ");
  }
}
function ListaDestacadasComponent_article_13_ng_container_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ListaDestacadasComponent_article_13_ng_container_24_div_1_Template, 2, 2, "div", 35)(2, ListaDestacadasComponent_article_13_ng_container_24_div_2_Template, 7, 1, "div", 36);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const programs_r6 = ctx.ngIf;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", programs_r6 && programs_r6.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !programs_r6 || programs_r6.length === 0);
  }
}
function ListaDestacadasComponent_article_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article")(1, "section", 20)(2, "div", 21)(3, "button", 22);
    \u0275\u0275listener("click", function ListaDestacadasComponent_article_13_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.getPeliculasAhora());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 23);
    \u0275\u0275element(5, "rect", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7, "Pel\xEDculas");
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, ListaDestacadasComponent_article_13_span_8_Template, 2, 1, "span", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 22);
    \u0275\u0275listener("click", function ListaDestacadasComponent_article_13_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.getSeriesAhora());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 23);
    \u0275\u0275element(11, "rect", 26)(12, "rect", 27)(13, "rect", 28)(14, "rect", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "span");
    \u0275\u0275text(16, "Series");
    \u0275\u0275elementEnd();
    \u0275\u0275template(17, ListaDestacadasComponent_article_13_span_17_Template, 2, 1, "span", 25);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(18, "section", 30)(19, "header", 31)(20, "h2", 32);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "p", 33);
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(24, ListaDestacadasComponent_article_13_ng_container_24_Template, 3, 2, "ng-container", 8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("active", ctx_r0.isPelicula);
    \u0275\u0275attribute("aria-selected", ctx_r0.isPelicula)("aria-controls", "peliculas-panel");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r0.peliculasDestacadas == null ? null : ctx_r0.peliculasDestacadas.length);
    \u0275\u0275advance();
    \u0275\u0275classProp("active", ctx_r0.isSerie);
    \u0275\u0275attribute("aria-selected", ctx_r0.isSerie)("aria-controls", "series-panel");
    \u0275\u0275advance(8);
    \u0275\u0275property("ngIf", ctx_r0.seriesDestacadas == null ? null : ctx_r0.seriesDestacadas.length);
    \u0275\u0275advance();
    \u0275\u0275attribute("id", ctx_r0.isPelicula ? "peliculas-panel" : "series-panel")("aria-labelledby", ctx_r0.isPelicula ? "peliculas-heading" : "series-heading");
    \u0275\u0275advance(2);
    \u0275\u0275property("id", ctx_r0.isPelicula ? "peliculas-heading" : "series-heading");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.isPelicula ? "Pel\xEDculas" : "Series", " destacadas ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.isPelicula ? "Pel\xEDculas destacadas de hoy" : "Series destacadas de hoy", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.isPelicula ? ctx_r0.peliculasDestacadas : ctx_r0.seriesDestacadas);
  }
}
var _ListaDestacadasComponent = class _ListaDestacadasComponent {
  constructor(route, guiaSvc, http, router) {
    this.route = route;
    this.guiaSvc = guiaSvc;
    this.http = http;
    this.router = router;
    this.peliculasDestacadas = [];
    this.seriesDestacadas = [];
    this.isPelicula = true;
    this.isSerie = false;
    this.loading = false;
    this.error = null;
    this.destroy$ = new Subject();
    this.peliculasCargadas = false;
    this.seriesCargadas = false;
    this.datosInicializados = false;
  }
  ngOnInit() {
    console.log("ListaDestacadas inicializado");
    this.isPelicula = true;
    this.isSerie = false;
    this.inicializarDatos();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Inicializa los datos de programación necesarios
   */
  inicializarDatos() {
    this.loading = true;
    this.http.getProgramacion("today").pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.procesarDatosProgramacion(data);
        } else {
          this.escucharProgramas();
        }
      },
      error: (err) => {
        console.error("Error al obtener programaci\xF3n:", err);
        this.escucharProgramas();
      }
    });
  }
  /**
   * Escucha cambios en los programas
   */
  escucharProgramas() {
    this.http.programas$.pipe(filter((d) => Array.isArray(d) && d.length > 0), first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.procesarDatosProgramacion(data);
      },
      error: (err) => {
        console.error("Error en programas$:", err);
        this.loading = false;
        this.error = "No se pudieron cargar los datos";
      }
    });
  }
  /**
   * Procesa los datos de programación y genera destacados
   */
  procesarDatosProgramacion(data) {
    console.log("Procesando datos de programaci\xF3n:", data.length);
    this.guiaSvc.setData(data);
    this.datosInicializados = true;
    Promise.all([
      this.guiaSvc.setPeliculasDestacadas(),
      this.guiaSvc.setSeriesDestacadas()
    ]).then(() => {
      console.log("Destacados generados");
      this.cargarPeliculasDestacadas();
      this.precargarSeriesDestacadas();
    }).catch((err) => {
      console.error("Error al generar destacados:", err);
      this.loading = false;
    });
  }
  /**
   * Carga películas destacadas (modo principal)
   */
  cargarPeliculasDestacadas() {
    if (this.peliculasCargadas) {
      this.loading = false;
      return;
    }
    this.guiaSvc.getPeliculasDestacadas().pipe(filter((data) => Array.isArray(data) && data.length > 0), take(1), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.peliculasDestacadas = data || [];
        this.peliculasCargadas = true;
        this.loading = false;
        console.log("Pel\xEDculas destacadas cargadas:", this.peliculasDestacadas.length);
      },
      error: (err) => {
        console.error("Error al cargar pel\xEDculas:", err);
        this.error = "Error al cargar pel\xEDculas destacadas";
        this.loading = false;
      }
    });
  }
  /**
   * Precarga series en segundo plano
   */
  precargarSeriesDestacadas() {
    if (this.seriesCargadas)
      return;
    this.guiaSvc.getSeriesDestacadas().pipe(filter((data) => Array.isArray(data) && data.length > 0), take(1), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.seriesDestacadas = data || [];
        this.seriesCargadas = true;
        console.log("Series destacadas precargadas:", this.seriesDestacadas.length);
      },
      error: (err) => {
        console.error("Error al precargar series:", err);
      }
    });
  }
  /**
   * Cambia a modo películas
   */
  getPeliculasAhora() {
    console.log("Cambiando a pel\xEDculas");
    this.isPelicula = true;
    this.isSerie = false;
    if (!this.peliculasCargadas) {
      this.loading = true;
      this.cargarPeliculasDestacadas();
    }
  }
  /**
   * Cambia a modo series
   */
  getSeriesAhora() {
    console.log("Cambiando a series");
    this.isPelicula = false;
    this.isSerie = true;
    if (!this.seriesCargadas) {
      this.loading = true;
      this.guiaSvc.getSeriesDestacadas().pipe(filter((data) => Array.isArray(data) && data.length > 0), take(1), takeUntil(this.destroy$)).subscribe({
        next: (data) => {
          this.seriesDestacadas = data || [];
          this.seriesCargadas = true;
          this.loading = false;
        },
        error: (err) => {
          console.error("Error al cargar series:", err);
          this.error = "Error al cargar series destacadas";
          this.loading = false;
        }
      });
    }
  }
  // ===== Template Helpers =====
  trackById(index, item) {
    return item?.id || item?.uuid || index;
  }
  horaInicio(programa) {
    if (!programa)
      return "";
    const start = programa?.start || programa?.start_time || programa?.time;
    if (!start)
      return "";
    try {
      const d = new Date(start);
      return d.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return String(start);
    }
  }
  getChannelName(programa) {
    if (!programa)
      return "Canal desconocido";
    const ch = programa.channel ?? programa.network ?? programa.channelName ?? programa?.channel?.name;
    if (!ch)
      return "Canal desconocido";
    if (typeof ch === "string")
      return ch;
    if (typeof ch === "object") {
      return (ch.name || ch.title || ch.label || ch.id || "Canal").toString();
    }
    return String(ch);
  }
  getCategory(programa) {
    const cat = programa?.category ?? programa?.category?.value;
    if (!cat)
      return "";
    let raw = "";
    if (typeof cat === "string")
      raw = cat;
    else if (Array.isArray(cat))
      raw = cat.join(",");
    else if (typeof cat === "object")
      raw = cat.value || cat.name || Object.values(cat).join(",");
    else
      raw = String(cat);
    const parts = raw.split(",");
    return (parts[1]?.trim() || parts[0]?.trim() || "").toString();
  }
  onLogoError(event, item) {
    const img = event?.target;
    if (img) {
      img.src = "/assets/images/channels/antena3.svg";
      img.alt = (this.getChannelName(item) || "Canal") + " logo";
    }
  }
  /**
   * Abre la ficha completa del programa (misma lógica que en Slider.manageData)
   */
  openDetails(programa) {
    if (!programa)
      return;
    if (programa?.channel) {
      this.guiaSvc.setDetallesPrograma(programa);
      const title = (programa?.title?.value || programa?.name || "").trim();
      const slug = slugify(title);
      if (this.isPelicula) {
        this.router.navigate(["/peliculas", slug]);
        return;
      }
      const cat = programa?.category || programa?.category?.value || "";
      const looksLikeMovie = typeof cat === "string" && cat.startsWith("Cine") || !!programa?.poster || !!programa?.tmdbId;
      if (looksLikeMovie) {
        this.router.navigate(["/peliculas", slug]);
      } else {
        this.router.navigate(["/programas", slug]);
      }
    } else {
      const slug = slugify(programa?.name || "");
      this.router.navigate(["programacion-tv/ver-canal", slug]);
    }
  }
};
_ListaDestacadasComponent.\u0275fac = function ListaDestacadasComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ListaDestacadasComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(Router));
};
_ListaDestacadasComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ListaDestacadasComponent, selectors: [["app-lista-destacadas"]], decls: 14, vars: 3, consts: [["href", "#main-content", 1, "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-label", "Pel\xEDculas y series destacadas", 1, "ahora-directo", "w-full", "max-w-full", "mx-auto", "py-6", "px-4", "sm:py-8", "sm:px-6", "lg:py-10", "lg:px-8", "overflow-x-hidden"], ["itemscope", "", "itemtype", "https://schema.org/WebPage", 1, "intro", "mt-4", "max-w-4xl", "mx-auto"], ["id", "page-title", "itemprop", "headline", 1, "text-2xl", "font-semibold", "text-white"], ["itemprop", "description", 1, "mt-3", "text-sm", "leading-relaxed", "text-gray-300"], [1, "mt-2", "text-xs", "text-gray-400"], ["class", "mt-6 sm:mt-8", "role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 4, "ngIf"], ["class", "mt-6 sm:mt-8", "role", "alert", "aria-live", "assertive", 4, "ngIf"], [4, "ngIf"], ["role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 1, "mt-6", "sm:mt-8"], [1, "animate-pulse", "space-y-4"], [1, "h-6", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-3/4", "sm:w-1/2", "mb-4"], [1, "h-4", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-full", "sm:w-3/4", "mb-6"], [1, "h-40", "sm:h-48", "md:h-64", "bg-gray-300", "dark:bg-gray-700", "rounded"], [1, "sr-only"], ["role", "alert", "aria-live", "assertive", 1, "mt-6", "sm:mt-8"], [1, "error-box", "glass-card-mobile", "p-6", "rounded-lg"], [1, "text-lg", "font-semibold", "text-red-400", "mb-2"], [1, "text-responsive", "text-gray-300"], [1, "text-xs", "text-gray-400", "mt-2"], ["aria-label", "Filtros de contenido", 1, "mt-6", "sm:mt-8"], ["role", "tablist", "aria-label", "Tipo de contenido", 1, "flex", "items-center", "justify-center", "gap-3"], ["type", "button", "role", "tab", 1, "filter-btn", "touch-target", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", "aria-hidden", "true", 1, "w-5", "h-5", "mr-2"], ["x", "2", "y", "7", "width", "20", "height", "10", "rx", "2"], ["class", "badge-count", 4, "ngIf"], ["x", "2", "y", "3", "width", "9", "height", "9", "rx", "1"], ["x", "13", "y", "3", "width", "9", "height", "9", "rx", "1"], ["x", "2", "y", "14", "width", "9", "height", "9", "rx", "1"], ["x", "13", "y", "14", "width", "9", "height", "9", "rx", "1"], ["role", "tabpanel", 1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "mb-4"], [1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight", 3, "id"], [1, "mt-2", "text-sm", "sm:text-base", "text-gray-400", "leading-relaxed"], [1, "badge-count"], ["class", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6", "role", "list", 4, "ngIf"], ["class", "empty-state-card glass-card-mobile text-center py-12", 4, "ngIf"], ["role", "list", 1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-4", "sm:gap-5", "lg:gap-6"], ["class", "program-card-live glass-card-mobile touch-target gpu-accelerated", "role", "listitem", "role", "link", "tabindex", "0", 3, "click", "keydown.enter", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["role", "listitem", "role", "link", "tabindex", "0", 1, "program-card-live", "glass-card-mobile", "touch-target", "gpu-accelerated", 3, "click", "keydown.enter"], [1, "program-media-wrapper"], ["loading", "lazy", 1, "program-poster", 3, "error", "src", "alt"], ["aria-hidden", "true", 1, "live-indicator"], [1, "live-dot"], [1, "live-text"], [1, "program-info-wrapper"], [1, "program-channel"], ["class", "channel-icon", "loading", "lazy", 3, "src", "alt", "error", 4, "ngIf"], [1, "channel-name"], [1, "program-title"], ["class", "program-description", 4, "ngIf"], [1, "program-meta"], [1, "program-time"], ["class", "program-category", 4, "ngIf"], ["loading", "lazy", 1, "channel-icon", 3, "error", "src", "alt"], [1, "program-description"], [1, "program-category"], [1, "empty-state-card", "glass-card-mobile", "text-center", "py-12"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "aria-hidden", "true", 1, "w-16", "h-16", "mx-auto", "mb-4", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], [1, "text-responsive", "text-gray-400", "mb-2"], [1, "text-sm", "text-gray-500"]], template: function ListaDestacadasComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 0);
    \u0275\u0275text(1, "Saltar al contenido");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 1);
    \u0275\u0275element(3, "app-nav-bar");
    \u0275\u0275elementStart(4, "section", 2)(5, "h1", 3);
    \u0275\u0275text(6, " Pel\xEDculas y series destacadas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 4);
    \u0275\u0275text(8, " Selecci\xF3n de pel\xEDculas y series destacadas. Usa los filtros para alternar entre pel\xEDculas y series. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 5);
    \u0275\u0275text(10, "Actualizado peri\xF3dicamente.");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, ListaDestacadasComponent_div_11_Template, 7, 0, "div", 6)(12, ListaDestacadasComponent_div_12_Template, 8, 1, "div", 7)(13, ListaDestacadasComponent_article_13_Template, 25, 16, "article", 8);
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
}, dependencies: [CommonModule, NgForOf, NgIf, SlicePipe, NavBarComponent], styles: ['@charset "UTF-8";\n\n\n\n.lista-destacadas[_ngcontent-%COMP%], \n.ahora-directo[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n  will-change: scroll-position;\n}\n.intro[_ngcontent-%COMP%] {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff;\n}\n@media (max-width: 640px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.5rem;\n  }\n}\n.intro[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro[_ngcontent-%COMP%]   p.text-sm[_ngcontent-%COMP%] {\n  line-height: 1.5;\n}\n.animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.error-box[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(220, 38, 38, 0.08),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.error-box[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  color: #fca5a5;\n}\n.filter-btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0.75rem 1.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: rgba(255, 255, 255, 0.7);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  min-height: 44px;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.filter-btn[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transition: transform 0.2s ease;\n  flex-shrink: 0;\n}\n.filter-btn[_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 20px;\n  padding: 0 6px;\n  margin-left: 0.5rem;\n  background: rgba(220, 38, 38, 0.2);\n  border-radius: 10px;\n  font-size: 0.75rem;\n  font-weight: 700;\n}\n.filter-btn[_ngcontent-%COMP%]:hover:not(.active) {\n  transform: translateY(-2px);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.filter-btn.active[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%] {\n  background: rgba(220, 38, 38, 0.12);\n  color: #ffffff;\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);\n  transform: translateY(-2px);\n}\n.filter-btn.active[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n}\n.filter-btn.active[_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%], \n.filter-btn[aria-selected=true][_ngcontent-%COMP%]   .badge-count[_ngcontent-%COMP%] {\n  background: rgba(220, 38, 38, 0.4);\n}\n.filter-btn[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.filter-btn[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n}\n@media (min-width: 640px) {\n  .filter-btn[_ngcontent-%COMP%] {\n    padding: 0.875rem 2rem;\n    font-size: 1rem;\n  }\n}\n.program-card-live[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  border-radius: 0.75rem;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(0, 0, 0, 0.2));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.program-card-live[_ngcontent-%COMP%]:hover, \n.program-card-live[_ngcontent-%COMP%]:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.program-card-live[_ngcontent-%COMP%]:hover   .program-poster[_ngcontent-%COMP%], \n.program-card-live[_ngcontent-%COMP%]:focus-visible   .program-poster[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.program-card-live[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.program-card-live[_ngcontent-%COMP%]:active {\n  transform: translateY(-2px);\n}\n.program-media-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(0, 0, 0, 0.3),\n      rgba(0, 0, 0, 0.2));\n}\n.program-poster[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition: transform 0.3s ease;\n}\n.program-description[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  color: #9ca3af;\n  font-size: 0.875rem;\n  line-height: 1.4;\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.program-info-wrapper[_ngcontent-%COMP%] {\n  padding: 0.75rem 1rem;\n}\n.program-title[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #e5e7eb;\n  font-size: 1rem;\n  font-weight: 700;\n  line-height: 1.2;\n  margin-top: 0.25rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.program-meta[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n  margin-top: 0.5rem;\n}\n.program-time[_ngcontent-%COMP%] {\n  color: #9ca3af;\n  font-size: 0.875rem;\n  background: rgba(255, 255, 255, 0.02);\n  padding: 0.125rem 0.5rem;\n  border-radius: 4px;\n}\n.program-category[_ngcontent-%COMP%] {\n  color: rgba(220, 38, 38, 0.95);\n  font-size: 0.8rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n}\n.program-channel[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.channel-icon[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  object-fit: contain;\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.02);\n  padding: 2px;\n}\n.channel-name[_ngcontent-%COMP%] {\n  color: #9ca3af;\n  font-size: 0.875rem;\n  font-weight: 600;\n}\n@media (min-width: 768px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 1.05rem;\n  }\n  .program-description[_ngcontent-%COMP%] {\n    -webkit-line-clamp: 2;\n  }\n}\n.live-indicator[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0.75rem;\n  right: 0.75rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.375rem 0.75rem;\n  background: rgba(220, 38, 38, 0.95);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 6px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #ffffff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n}\n/*# sourceMappingURL=lista-destacadas.component.css.map */'] });
var ListaDestacadasComponent = _ListaDestacadasComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ListaDestacadasComponent, [{
    type: Component,
    args: [{ selector: "app-lista-destacadas", standalone: true, imports: [CommonModule, NavBarComponent], template: `<!-- Skip link para accesibilidad -->\r
<a class="sr-only focus:not-sr-only" href="#main-content"\r
  >Saltar al contenido</a\r
>\r
\r
<main\r
  id="main-content"\r
  class="ahora-directo w-full max-w-full mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:py-10 lg:px-8 overflow-x-hidden"\r
  role="main"\r
  aria-label="Pel\xEDculas y series destacadas"\r
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
      Pel\xEDculas y series destacadas\r
    </h1>\r
    <p\r
      class="mt-3 text-sm leading-relaxed text-gray-300"\r
      itemprop="description"\r
    >\r
      Selecci\xF3n de pel\xEDculas y series destacadas. Usa los filtros para alternar\r
      entre pel\xEDculas y series.\r
    </p>\r
    <p class="mt-2 text-xs text-gray-400">Actualizado peri\xF3dicamente.</p>\r
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
    <span class="sr-only">Cargando destacados...</span>\r
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
        Si el problema persiste, intenta recargar la p\xE1gina.\r
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
        aria-label="Tipo de contenido"\r
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
            <rect x="2" y="7" width="20" height="10" rx="2" />\r
          </svg>\r
          <span>Pel\xEDculas</span>\r
          <span class="badge-count" *ngIf="peliculasDestacadas?.length">{{\r
            peliculasDestacadas.length\r
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
          <span>Series</span>\r
          <span class="badge-count" *ngIf="seriesDestacadas?.length">{{\r
            seriesDestacadas.length\r
          }}</span>\r
        </button>\r
      </div>\r
    </section>\r
\r
    <!-- Grid de destacados -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      role="tabpanel"\r
      [attr.id]="isPelicula ? 'peliculas-panel' : 'series-panel'"\r
      [attr.aria-labelledby]="\r
        isPelicula ? 'peliculas-heading' : 'series-heading'\r
      "\r
    >\r
      <header class="mb-4">\r
        <h2\r
          [id]="isPelicula ? 'peliculas-heading' : 'series-heading'"\r
          class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
        >\r
          {{ isPelicula ? "Pel\xEDculas" : "Series" }} destacadas\r
        </h2>\r
        <p class="mt-2 text-sm sm:text-base text-gray-400 leading-relaxed">\r
          {{\r
            isPelicula\r
              ? "Pel\xEDculas destacadas de hoy"\r
              : "Series destacadas de hoy"\r
          }}\r
        </p>\r
      </header>\r
\r
      <ng-container\r
        *ngIf="isPelicula ? peliculasDestacadas : seriesDestacadas as programs"\r
      >\r
        <div\r
          *ngIf="programs && programs.length > 0"\r
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"\r
          role="list"\r
        >\r
          <article\r
            *ngFor="let programa of programs; trackBy: trackById"\r
            class="program-card-live glass-card-mobile touch-target gpu-accelerated"\r
            role="listitem"\r
            role="link"\r
            tabindex="0"\r
            (click)="openDetails(programa)"\r
            (keydown.enter)="openDetails(programa)"\r
            [attr.aria-label]="\r
              'Ver detalles de ' +\r
              (programa?.title?.value || programa?.name) +\r
              ' en ' +\r
              getChannelName(programa)\r
            "\r
          >\r
            <!-- Imagen del programa (NO usar app-banner aqu\xED) -->\r
            <div class="program-media-wrapper">\r
              <img\r
                [src]="\r
                  programa?.poster ||\r
                  programa?.image ||\r
                  programa?.icon ||\r
                  '/assets/images/default-movie-poster.svg'\r
                "\r
                [alt]="programa?.title?.value || programa?.name || 'Programa'"\r
                class="program-poster"\r
                loading="lazy"\r
                (error)="\r
                  $any($event.target).src =\r
                    '/assets/images/default-movie-poster.svg'\r
                "\r
              />\r
\r
              <div class="live-indicator" aria-hidden="true">\r
                <span class="live-dot"></span>\r
                <span class="live-text">DESTACADO</span>\r
              </div>\r
            </div>\r
\r
            <div class="program-info-wrapper">\r
              <div class="program-channel">\r
                <img\r
                  *ngIf="programa?.channelIcon"\r
                  [src]="programa.channelIcon"\r
                  [alt]="getChannelName(programa) + ' logo'"\r
                  class="channel-icon"\r
                  loading="lazy"\r
                  (error)="onLogoError($event, programa)"\r
                />\r
                <span class="channel-name">{{ getChannelName(programa) }}</span>\r
              </div>\r
\r
              <h3 class="program-title">\r
                {{ programa?.title?.value || programa?.name || "Sin t\xEDtulo" }}\r
              </h3>\r
\r
              <p\r
                class="program-description"\r
                *ngIf="\r
                  programa?.summary || programa?.description || programa?.plot\r
                "\r
              >\r
                {{\r
                  programa?.summary || programa?.description || programa?.plot\r
                    | slice : 0 : 500\r
                }}\r
              </p>\r
\r
              <div class="program-meta">\r
                <time class="program-time" [attr.datetime]="programa?.start">{{\r
                  horaInicio(programa)\r
                }}</time>\r
                <span *ngIf="getCategory(programa)" class="program-category">{{\r
                  getCategory(programa)\r
                }}</span>\r
              </div>\r
            </div>\r
          </article>\r
        </div>\r
\r
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
            No hay {{ isPelicula ? "pel\xEDculas" : "series" }} destacadas\r
          </p>\r
          <p class="text-sm text-gray-500">\r
            Prueba a cambiar de filtro o vuelve m\xE1s tarde\r
          </p>\r
        </div>\r
      </ng-container>\r
    </section>\r
  </article>\r
</main>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/pages/lista-destacadas/lista-destacadas.component.scss */\n.lista-destacadas,\n.ahora-directo {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n  will-change: scroll-position;\n}\n.intro {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro h1 {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff;\n}\n@media (max-width: 640px) {\n  .intro h1 {\n    font-size: 1.5rem;\n  }\n}\n.intro p {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro p.text-sm {\n  line-height: 1.5;\n}\n.animate-pulse > div {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.error-box {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(220, 38, 38, 0.08),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(220, 38, 38, 0.2);\n}\n.error-box h2 {\n  color: #fca5a5;\n}\n.filter-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0.75rem 1.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: rgba(255, 255, 255, 0.7);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  min-height: 44px;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.filter-btn svg {\n  transition: transform 0.2s ease;\n  flex-shrink: 0;\n}\n.filter-btn .badge-count {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 20px;\n  padding: 0 6px;\n  margin-left: 0.5rem;\n  background: rgba(220, 38, 38, 0.2);\n  border-radius: 10px;\n  font-size: 0.75rem;\n  font-weight: 700;\n}\n.filter-btn:hover:not(.active) {\n  transform: translateY(-2px);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.filter-btn.active,\n.filter-btn[aria-selected=true] {\n  background: rgba(220, 38, 38, 0.12);\n  color: #ffffff;\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);\n  transform: translateY(-2px);\n}\n.filter-btn.active svg,\n.filter-btn[aria-selected=true] svg {\n  transform: scale(1.1);\n}\n.filter-btn.active .badge-count,\n.filter-btn[aria-selected=true] .badge-count {\n  background: rgba(220, 38, 38, 0.4);\n}\n.filter-btn:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.filter-btn:active {\n  transform: translateY(0);\n}\n@media (min-width: 640px) {\n  .filter-btn {\n    padding: 0.875rem 2rem;\n    font-size: 1rem;\n  }\n}\n.program-card-live {\n  display: flex;\n  flex-direction: column;\n  border-radius: 0.75rem;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(0, 0, 0, 0.2));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.program-card-live:hover,\n.program-card-live:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n.program-card-live:hover .program-poster,\n.program-card-live:focus-visible .program-poster {\n  transform: scale(1.05);\n}\n.program-card-live:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.program-card-live:active {\n  transform: translateY(-2px);\n}\n.program-media-wrapper {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  overflow: hidden;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(0, 0, 0, 0.3),\n      rgba(0, 0, 0, 0.2));\n}\n.program-poster {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition: transform 0.3s ease;\n}\n.program-description {\n  margin-top: 0.5rem;\n  color: #9ca3af;\n  font-size: 0.875rem;\n  line-height: 1.4;\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.program-info-wrapper {\n  padding: 0.75rem 1rem;\n}\n.program-title {\n  margin: 0;\n  color: #e5e7eb;\n  font-size: 1rem;\n  font-weight: 700;\n  line-height: 1.2;\n  margin-top: 0.25rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.program-meta {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n  margin-top: 0.5rem;\n}\n.program-time {\n  color: #9ca3af;\n  font-size: 0.875rem;\n  background: rgba(255, 255, 255, 0.02);\n  padding: 0.125rem 0.5rem;\n  border-radius: 4px;\n}\n.program-category {\n  color: rgba(220, 38, 38, 0.95);\n  font-size: 0.8rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n}\n.program-channel {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.channel-icon {\n  width: 28px;\n  height: 28px;\n  object-fit: contain;\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.02);\n  padding: 2px;\n}\n.channel-name {\n  color: #9ca3af;\n  font-size: 0.875rem;\n  font-weight: 600;\n}\n@media (min-width: 768px) {\n  .program-title {\n    font-size: 1.05rem;\n  }\n  .program-description {\n    -webkit-line-clamp: 2;\n  }\n}\n.live-indicator {\n  position: absolute;\n  top: 0.75rem;\n  right: 0.75rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.375rem 0.75rem;\n  background: rgba(220, 38, 38, 0.95);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 6px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #ffffff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n}\n/*# sourceMappingURL=lista-destacadas.component.css.map */\n'] }]
  }], () => [{ type: ActivatedRoute }, { type: TvGuideService }, { type: HttpService }, { type: Router }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ListaDestacadasComponent, { className: "ListaDestacadasComponent", filePath: "src/app/pages/lista-destacadas/lista-destacadas.component.ts", lineNumber: 18 });
})();
export {
  ListaDestacadasComponent
};
//# sourceMappingURL=lista-destacadas.component-VPTSKTC3.js.map
