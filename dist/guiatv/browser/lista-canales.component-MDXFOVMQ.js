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
  DomSanitizer,
  HttpClient,
  HttpService,
  NgForOf,
  NgIf,
  Router,
  TvGuideService,
  isPlatformBrowser
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Output,
  PLATFORM_ID,
  ViewChildren,
  __async,
  first,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinterpolate,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction5,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/pages/lista-canales/lista-canales.component.ts
var _c0 = ["channelSection"];
var _c1 = (a0) => ({ key: "tdt", title: "Canales TDT Espa\xF1a", list: a0 });
var _c2 = (a0) => ({ key: "movistar", title: "Canales exclusivos de Movistar+", list: a0 });
var _c3 = (a0) => ({ key: "online", title: "Canales de TV online en Espa\xF1a", list: a0 });
var _c4 = (a0) => ({ key: "autonomo", title: "Canales Auton\xF3micos Espa\xF1a", list: a0 });
var _c5 = (a0) => ({ key: "deporte", title: "Canales Deportes Espa\xF1a", list: a0 });
var _c6 = (a0, a1, a2, a3, a4) => [a0, a1, a2, a3, a4];
var _c7 = () => [1, 2, 3, 4, 5];
function ListaCanalesComponent_app_banner_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-banner", 11);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("data", ctx_r0.destacada);
  }
}
function ListaCanalesComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 12);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("innerHTML", ctx_r0.safeLdHtml, \u0275\u0275sanitizeHtml);
  }
}
function ListaCanalesComponent_section_12_li_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "a", 17);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const c_r2 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("href", ctx_r0.url_web && ((ctx_r0.url_web[c_r2.id] == null ? null : ctx_r0.url_web[c_r2.id].url) || (ctx_r0.url_web[c_r2.name] == null ? null : ctx_r0.url_web[c_r2.name].url)) || "#", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(c_r2.name || c_r2.nombre || c_r2.title || c_r2.titulo);
  }
}
function ListaCanalesComponent_section_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 13)(1, "h2", 14);
    \u0275\u0275text(2, " Canales populares ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 15);
    \u0275\u0275text(4, " Listado de canales populares para facilitar el rastreo a buscadores ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "ul", 16);
    \u0275\u0275template(6, ListaCanalesComponent_section_12_li_6_Template, 3, 2, "li", 10);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275property("ngForOf", ctx_r0.topChannels);
  }
}
function ListaCanalesComponent_ng_container_13_div_14_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 30);
  }
}
function ListaCanalesComponent_ng_container_13_div_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 28);
    \u0275\u0275template(1, ListaCanalesComponent_ng_container_13_div_14_div_1_Template, 1, 0, "div", 29);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c7));
  }
}
function ListaCanalesComponent_ng_container_13_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "app-slider", 31);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const s_r4 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("key", s_r4.key)("programas", s_r4.list);
    \u0275\u0275attribute("data-lazy", ctx_r0.isBrowser ? "true" : "false")("aria-label", "Carrusel de " + s_r4.title);
  }
}
function ListaCanalesComponent_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "section", 18, 0)(3, "div", 19)(4, "h2", 20);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 21)(7, "button", 22);
    \u0275\u0275listener("click", function ListaCanalesComponent_ng_container_13_Template_button_click_7_listener() {
      const s_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.prevFor(s_r4.key));
    });
    \u0275\u0275text(8, " \u2039 ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 23);
    \u0275\u0275listener("click", function ListaCanalesComponent_ng_container_13_Template_button_click_9_listener() {
      const s_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.nextFor(s_r4.key));
    });
    \u0275\u0275text(10, " \u203A ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "p", 24);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "div", 25);
    \u0275\u0275template(14, ListaCanalesComponent_ng_container_13_div_14_Template, 2, 2, "div", 26)(15, ListaCanalesComponent_ng_container_13_ng_container_15_Template, 2, 4, "ng-container", 27);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const s_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275attribute("data-key", s_r4.key)("aria-labelledby", "section-" + s_r4.key + "-title");
    \u0275\u0275advance(3);
    \u0275\u0275property("id", \u0275\u0275interpolate("section-" + s_r4.key + "-title"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", s_r4.title, " ");
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" ", s_r4.title, " \u2014 explora la programaci\xF3n y encuentra tus canales favoritos. ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.cargando);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.cargando && (ctx_r0.isBrowser ? ctx_r0.sliderVisible[s_r4.key] : true));
  }
}
var _ListaCanalesComponent = class _ListaCanalesComponent {
  constructor(guideSvc, httpService, metaSvc, router, http, sanitizer, platformId) {
    this.guideSvc = guideSvc;
    this.httpService = httpService;
    this.metaSvc = metaSvc;
    this.router = router;
    this.http = http;
    this.sanitizer = sanitizer;
    this.platformId = platformId;
    this.nextClicked = new EventEmitter();
    this.prevClicked = new EventEmitter();
    this.categorias = ["TDT", "Cable", "Autonomico"];
    this.canales = [];
    this.url_web = {};
    this.cargando = true;
    this.canales_tdt = [];
    this.canales_m = [];
    this.canales_auto = [];
    this.canales_dep = [];
    this.canales_cable = [];
    this.popular_movies = [];
    this.movieStartIndex = 0;
    this.actorStartIndex = 0;
    this.actor = {};
    this.isBrowser = false;
    this.sliderVisible = {};
    this.ldJson = "";
    this.safeLdHtml = null;
    this.topChannels = [];
  }
  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.setupMetaTags();
    this.loadCanalesData();
    this.loadProgramsData();
    this.sliderVisible = {
      tdt: !this.isBrowser,
      // SSR: don't render sliders, but on browser set to false -> will be enabled via observer
      movistar: !this.isBrowser,
      online: !this.isBrowser,
      autonomo: !this.isBrowser,
      deporte: !this.isBrowser
    };
  }
  ngAfterViewInit() {
    if (!this.isBrowser)
      return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const key = el.getAttribute("data-key") || el.id || "";
        if (!key)
          return;
        if (entry.isIntersecting) {
          this.sliderVisible[key] = true;
          if (this.intersectionObserver)
            this.intersectionObserver.unobserve(el);
        }
      });
    }, { root: null, rootMargin: "200px 0px", threshold: 0.05 });
    setTimeout(() => {
      this.channelSections.forEach((q) => {
        const el = q.nativeElement;
        const key = el.getAttribute("data-key") || el.id || "";
        if (key && this.intersectionObserver && !this.sliderVisible[key]) {
          this.intersectionObserver.observe(el);
        }
      });
    }, 80);
  }
  ngOnDestroy() {
    this.cleanup();
  }
  // ============== MÉTODOS PRIVADOS ==============
  setupMetaTags() {
    const canonicalUrl = this.router.url;
    this.metaSvc.setMetaTags({
      title: "Canales de TV de Espa\xF1a",
      description: "Listado de canales de televisi\xF3n de Espa\xF1a, como TVE, Antena 3, Telecinco, Cuatro, La Sexta, etc.",
      canonicalUrl
    });
  }
  loadCanalesData() {
    if (isPlatformBrowser(this.platformId)) {
      this.canalesSubscription = this.http.get("/assets/canales.json").subscribe({
        next: (data) => {
          this.url_web = data;
        },
        error: (error) => {
          console.error("Error loading canales:", error);
          this.url_web = {};
        }
      });
    }
  }
  loadProgramsData() {
    try {
      this.programasSubscription = this.httpService.programas$.pipe(first()).subscribe((data) => __async(this, null, function* () {
        if (data.length === 0) {
          yield this.loadFromApi();
        } else {
          this.manageCanales(data);
        }
      }));
    } catch (error) {
      console.error("Error loading programs data:", error);
      this.cargando = false;
    }
  }
  loadFromApi() {
    return __async(this, null, function* () {
      try {
        console.log(`\u23F3 LISTA-CANALES - No hay datos, esperando a que se carguen desde HomeComponent...`);
        this.httpService.getProgramacion("today").pipe(first()).subscribe({
          next: (data) => __async(this, null, function* () {
            try {
              if (Array.isArray(data) && data.length > 0) {
                console.log("\u{1F4E1} LISTA-CANALES - Datos recibidos desde API (today)");
                yield this.httpService.setProgramas(data, "today");
                this.manageCanales(data);
              } else {
                console.warn("\u26A0\uFE0F LISTA-CANALES - La API devolvi\xF3 datos vac\xEDos para today");
                this.cargando = false;
              }
            } catch (err) {
              console.error("Error processing data from API:", err);
              this.cargando = false;
            }
          }),
          error: (error) => {
            console.error("Error loading programacion from API fallback:", error);
            this.cargando = false;
          }
        });
      } catch (error) {
        console.error("Error in loadFromApi:", error);
        this.cargando = false;
      }
    });
  }
  manageCanales(data) {
    this.guideSvc.setData(data);
    this.canales_auto = this.guideSvc.getAutonomicoCanales();
    this.canales_tdt = this.guideSvc.getTDTCanales();
    this.canales_m = this.guideSvc.getMovistarCanales();
    this.canales_dep = this.guideSvc.getDeportesCanales();
    this.canales_cable = this.guideSvc.getCableCanales();
    this.cargando = false;
    if (this.isBrowser) {
      setTimeout(() => {
        Object.keys(this.sliderVisible).forEach((k) => this.sliderVisible[k] = true);
      }, 120);
    }
    try {
      this.buildLdJson();
    } catch (err) {
      console.warn("Error building JSON-LD for channels", err);
    }
  }
  buildLdJson() {
    const channels = [
      ...this.canales_tdt,
      ...this.canales_m,
      ...this.canales_cable,
      ...this.canales_auto,
      ...this.canales_dep
    ].filter(Boolean);
    this.topChannels = channels.slice(0, 12);
    const itemListElement = channels.map((c, i) => {
      const name = c.name || c.nombre || c.title || c.titulo || `Canal ${i + 1}`;
      const urlFromMap = this.url_web && (this.url_web[c.id] || this.url_web[name] || this.url_web[c.slug]);
      const url = urlFromMap && urlFromMap.url ? urlFromMap.url : "";
      return {
        "@type": "ListItem",
        position: i + 1,
        name,
        url
      };
    });
    const ld = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Listado de canales de televisi\xF3n en Espa\xF1a",
      description: "Listado y programaci\xF3n de los principales canales de TV en Espa\xF1a.",
      itemListElement: itemListElement.slice(0, 200)
    };
    this.ldJson = JSON.stringify(ld, null, 2);
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(`<script type="application/ld+json">${this.ldJson}<\/script>`);
  }
  cleanup() {
    if (this.programasSubscription) {
      this.programasSubscription.unsubscribe();
    }
    if (this.canalesSubscription) {
      this.canalesSubscription.unsubscribe();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = void 0;
    }
  }
  // ============== MÉTODOS PÚBLICOS ==============
  canalesPorCategoria(categoria) {
    return this.canales.filter((canal) => canal.tipo === categoria);
  }
  onNextClick() {
    this.nextClicked.emit();
  }
  onPrevClick() {
    this.prevClicked.emit();
  }
  // Parent controls to navigate a specific slider by its key
  prevFor(key) {
    const found = this.sliderComponents.find((s) => s.key === key);
    if (found) {
      found.prev();
    }
  }
  nextFor(key) {
    const found = this.sliderComponents.find((s) => s.key === key);
    if (found) {
      found.next();
    }
  }
  // ============== GETTERS PARA FACILITAR EL ACCESO A DATOS ==============
  get hasCanalesTdt() {
    return this.canales_tdt.length > 0;
  }
  get hasCanalesTotales() {
    return this.canales_auto.length > 0 || this.canales_tdt.length > 0 || this.canales_m.length > 0 || this.canales_dep.length > 0 || this.canales_cable.length > 0;
  }
  get totalCanales() {
    return this.canales_auto.length + this.canales_tdt.length + this.canales_m.length + this.canales_dep.length + this.canales_cable.length;
  }
};
_ListaCanalesComponent.\u0275fac = function ListaCanalesComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ListaCanalesComponent)(\u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(HttpClient), \u0275\u0275directiveInject(DomSanitizer), \u0275\u0275directiveInject(PLATFORM_ID));
};
_ListaCanalesComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ListaCanalesComponent, selectors: [["app-lista-canales"]], viewQuery: function ListaCanalesComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5, ElementRef);
    \u0275\u0275viewQuery(SliderComponent, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.channelSections = _t);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sliderComponents = _t);
  }
}, outputs: { nextClicked: "nextClicked", prevClicked: "prevClicked" }, decls: 14, vars: 20, consts: [["channelSection", ""], ["href", "#main-content", 1, "skip-link", "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-labelledby", "page-title", 1, "lista-canales", "root", "flex-1", "py-8", "px-4", "sm:px-8", "lg:px-12"], [1, "top"], ["lazy", "true", 3, "data", 4, "ngIf"], [1, "intro", "mt-6", "max-w-4xl", "mx-auto", "text-gray-600"], ["id", "page-title", 1, "text-xl", "font-semibold", "text-gray-100"], [1, "mt-3", "text-sm", "leading-relaxed"], [3, "innerHTML", 4, "ngIf"], ["class", "top-channels mt-6 max-w-4xl mx-auto text-sm text-gray-300", "aria-labelledby", "top-channels-title", 4, "ngIf"], [4, "ngFor", "ngForOf"], ["lazy", "true", 3, "data"], [3, "innerHTML"], ["aria-labelledby", "top-channels-title", 1, "top-channels", "mt-6", "max-w-4xl", "mx-auto", "text-sm", "text-gray-300"], ["id", "top-channels-title", 1, "text-base", "font-semibold", "text-gray-100"], [1, "sr-only"], [1, "grid", "grid-cols-2", "sm:grid-cols-3", "gap-2"], ["rel", "noopener noreferrer", 1, "text-gray-300", "hover:text-red-400", "underline-offset-2", "focus:outline-none", "focus:ring-2", "focus:ring-red-400", 3, "href"], [1, "channel-section", "mt-8"], [1, "flex", "items-center", "justify-between"], [1, "font-semibold", "text-gray-100", "text-base", 3, "id"], [1, "controls", "flex", "items-center", "space-x-2", "text-gray-400"], ["aria-label", "Anterior", 1, "btn-nav", 3, "click"], ["aria-label", "Siguiente", 1, "btn-nav", 3, "click"], [1, "mt-3", "text-sm", "text-gray-400"], [1, "mt-4"], ["class", "skeleton-grid", "aria-hidden", "true", 4, "ngIf"], [4, "ngIf"], ["aria-hidden", "true", 1, "skeleton-grid"], ["class", "s-item", 4, "ngFor", "ngForOf"], [1, "s-item"], ["variant", "canales", 3, "key", "programas"]], template: function ListaCanalesComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 1);
    \u0275\u0275text(1, "Saltar al contenido");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 2)(3, "section", 3);
    \u0275\u0275element(4, "app-nav-bar");
    \u0275\u0275template(5, ListaCanalesComponent_app_banner_5_Template, 1, 1, "app-banner", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "section", 5)(7, "h1", 6);
    \u0275\u0275text(8, " Listado de canales de televisi\xF3n en Espa\xF1a ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 7);
    \u0275\u0275text(10, " Consulta la programaci\xF3n de los principales canales espa\xF1oles. Filtra por TDT, Movistar+, canales online o auton\xF3micos. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, ListaCanalesComponent_div_11_Template, 1, 1, "div", 8)(12, ListaCanalesComponent_section_12_Template, 7, 1, "section", 9)(13, ListaCanalesComponent_ng_container_13_Template, 16, 8, "ng-container", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx.destacada);
    \u0275\u0275advance(6);
    \u0275\u0275property("ngIf", ctx.safeLdHtml);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.topChannels == null ? null : ctx.topChannels.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction5(14, _c6, \u0275\u0275pureFunction1(4, _c1, ctx.canales_tdt), \u0275\u0275pureFunction1(6, _c2, ctx.canales_m), \u0275\u0275pureFunction1(8, _c3, ctx.canales_cable), \u0275\u0275pureFunction1(10, _c4, ctx.canales_auto), \u0275\u0275pureFunction1(12, _c5, ctx.canales_dep)));
  }
}, dependencies: [CommonModule, NgForOf, NgIf, NavBarComponent, BannerComponent, SliderComponent], styles: ['\n\n.lista-canales[_ngcontent-%COMP%] {\n  background: transparent;\n  color: var(--color-text, #e5e7eb);\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  color: #fff;\n}\n.channel-section[_ngcontent-%COMP%] {\n  border-top: 1px solid rgba(255, 255, 255, 0.03);\n  padding-top: 1.25rem;\n}\n.controls[_ngcontent-%COMP%]   .btn-nav[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  color: rgba(255, 255, 255, 0.95);\n  width: 44px;\n  height: 44px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 10px;\n  cursor: pointer;\n  transition:\n    transform 0.12s ease,\n    background 0.12s ease,\n    box-shadow 0.12s ease;\n}\n.controls[_ngcontent-%COMP%]   .btn-nav[_ngcontent-%COMP%]:hover {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.controls[_ngcontent-%COMP%]   .btn-nav[_ngcontent-%COMP%]:focus {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.skeleton-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n  gap: 12px;\n}\n.s-item[_ngcontent-%COMP%] {\n  height: 84px;\n  border-radius: 12px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(255, 255, 255, 0.03) 0%,\n      rgba(255, 255, 255, 0.06) 50%,\n      rgba(255, 255, 255, 0.03) 100%);\n  position: relative;\n  overflow: hidden;\n}\n.s-item[_ngcontent-%COMP%]::after {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: -100%;\n  width: 100%;\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.04),\n      transparent);\n  animation: _ngcontent-%COMP%_shimmer 1.2s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    left: -100%;\n  }\n  100% {\n    left: 100%;\n  }\n}\n@media (min-width: 1024px) {\n  .lista-canales[_ngcontent-%COMP%] {\n    padding-left: 2rem;\n    padding-right: 2rem;\n  }\n  .s-item[_ngcontent-%COMP%] {\n    height: 96px;\n  }\n}\n/*# sourceMappingURL=lista-canales.component.css.map */'] });
var ListaCanalesComponent = _ListaCanalesComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ListaCanalesComponent, [{
    type: Component,
    args: [{ selector: "app-lista-canales", standalone: true, imports: [CommonModule, NavBarComponent, BannerComponent, SliderComponent], template: `<!-- Skip link for keyboard users -->\r
<a class="skip-link sr-only focus:not-sr-only" href="#main-content"\r
  >Saltar al contenido</a\r
>\r
\r
<main\r
  id="main-content"\r
  class="lista-canales root flex-1 py-8 px-4 sm:px-8 lg:px-12"\r
  role="main"\r
  aria-labelledby="page-title"\r
>\r
  <section class="top">\r
    <app-nav-bar></app-nav-bar>\r
    <app-banner *ngIf="destacada" [data]="destacada" lazy="true"></app-banner>\r
  </section>\r
\r
  <section class="intro mt-6 max-w-4xl mx-auto text-gray-600">\r
    <h1 id="page-title" class="text-xl font-semibold text-gray-100">\r
      Listado de canales de televisi\xF3n en Espa\xF1a\r
    </h1>\r
    <p class="mt-3 text-sm leading-relaxed">\r
      Consulta la programaci\xF3n de los principales canales espa\xF1oles. Filtra por\r
      TDT, Movistar+, canales online o auton\xF3micos.\r
    </p>\r
  </section>\r
\r
  <!-- JSON-LD para SEO -->\r
  <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>\r
\r
  <!-- Top channels (crawlable list for SEO) -->\r
  <section\r
    *ngIf="topChannels?.length"\r
    class="top-channels mt-6 max-w-4xl mx-auto text-sm text-gray-300"\r
    aria-labelledby="top-channels-title"\r
  >\r
    <h2 id="top-channels-title" class="text-base font-semibold text-gray-100">\r
      Canales populares\r
    </h2>\r
    <p class="sr-only">\r
      Listado de canales populares para facilitar el rastreo a buscadores\r
    </p>\r
    <ul class="grid grid-cols-2 sm:grid-cols-3 gap-2">\r
      <li *ngFor="let c of topChannels">\r
        <a\r
          [href]="\r
            (url_web && (url_web[c.id]?.url || url_web[c.name]?.url)) || '#'\r
          "\r
          rel="noopener noreferrer"\r
          class="text-gray-300 hover:text-red-400 underline-offset-2 focus:outline-none focus:ring-2 focus:ring-red-400"\r
          >{{ c.name || c.nombre || c.title || c.titulo }}</a\r
        >\r
      </li>\r
    </ul>\r
  </section>\r
\r
  <!-- Reusable section template: title, description, navigation and lazy slider -->\r
  <ng-container\r
    *ngFor="\r
      let s of [\r
        { key: 'tdt', title: 'Canales TDT Espa\xF1a', list: canales_tdt },\r
        {\r
          key: 'movistar',\r
          title: 'Canales exclusivos de Movistar+',\r
          list: canales_m\r
        },\r
        {\r
          key: 'online',\r
          title: 'Canales de TV online en Espa\xF1a',\r
          list: canales_cable\r
        },\r
        {\r
          key: 'autonomo',\r
          title: 'Canales Auton\xF3micos Espa\xF1a',\r
          list: canales_auto\r
        },\r
        { key: 'deporte', title: 'Canales Deportes Espa\xF1a', list: canales_dep }\r
      ]\r
    "\r
  >\r
    <section\r
      #channelSection\r
      class="channel-section mt-8"\r
      [attr.data-key]="s.key"\r
      [attr.aria-labelledby]="'section-' + s.key + '-title'"\r
    >\r
      <div class="flex items-center justify-between">\r
        <h2\r
          id="{{ 'section-' + s.key + '-title' }}"\r
          class="font-semibold text-gray-100 text-base"\r
        >\r
          {{ s.title }}\r
        </h2>\r
        <div class="controls flex items-center space-x-2 text-gray-400">\r
          <button\r
            aria-label="Anterior"\r
            class="btn-nav"\r
            (click)="prevFor(s.key)"\r
          >\r
            \u2039\r
          </button>\r
          <button\r
            aria-label="Siguiente"\r
            class="btn-nav"\r
            (click)="nextFor(s.key)"\r
          >\r
            \u203A\r
          </button>\r
        </div>\r
      </div>\r
\r
      <p class="mt-3 text-sm text-gray-400">\r
        {{ s.title }} \u2014 explora la programaci\xF3n y encuentra tus canales\r
        favoritos.\r
      </p>\r
\r
      <div class="mt-4">\r
        <!-- skeleton while loading -->\r
        <div *ngIf="cargando" class="skeleton-grid" aria-hidden="true">\r
          <div class="s-item" *ngFor="let i of [1, 2, 3, 4, 5]"></div>\r
        </div>\r
\r
        <!-- Lazy render slider only on browser and when sliderVisible flag is true -->\r
        <ng-container\r
          *ngIf="!cargando && (isBrowser ? sliderVisible[s.key] : true)"\r
        >\r
          <app-slider\r
            [key]="s.key"\r
            [programas]="s.list"\r
            variant="canales"\r
            [attr.data-lazy]="isBrowser ? 'true' : 'false'"\r
            [attr.aria-label]="'Carrusel de ' + s.title"\r
          ></app-slider>\r
        </ng-container>\r
      </div>\r
    </section>\r
  </ng-container>\r
</main>\r
`, styles: ['/* src/app/pages/lista-canales/lista-canales.component.scss */\n.lista-canales {\n  background: transparent;\n  color: var(--color-text, #e5e7eb);\n}\n.intro h1 {\n  color: #fff;\n}\n.channel-section {\n  border-top: 1px solid rgba(255, 255, 255, 0.03);\n  padding-top: 1.25rem;\n}\n.controls .btn-nav {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  color: rgba(255, 255, 255, 0.95);\n  width: 44px;\n  height: 44px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 10px;\n  cursor: pointer;\n  transition:\n    transform 0.12s ease,\n    background 0.12s ease,\n    box-shadow 0.12s ease;\n}\n.controls .btn-nav:hover {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.controls .btn-nav:focus {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.skeleton-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n  gap: 12px;\n}\n.s-item {\n  height: 84px;\n  border-radius: 12px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(255, 255, 255, 0.03) 0%,\n      rgba(255, 255, 255, 0.06) 50%,\n      rgba(255, 255, 255, 0.03) 100%);\n  position: relative;\n  overflow: hidden;\n}\n.s-item::after {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: -100%;\n  width: 100%;\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.04),\n      transparent);\n  animation: shimmer 1.2s infinite;\n}\n@keyframes shimmer {\n  0% {\n    left: -100%;\n  }\n  100% {\n    left: 100%;\n  }\n}\n@media (min-width: 1024px) {\n  .lista-canales {\n    padding-left: 2rem;\n    padding-right: 2rem;\n  }\n  .s-item {\n    height: 96px;\n  }\n}\n/*# sourceMappingURL=lista-canales.component.css.map */\n'] }]
  }], () => [{ type: TvGuideService }, { type: HttpService }, { type: MetaService }, { type: Router }, { type: HttpClient }, { type: DomSanitizer }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], { nextClicked: [{
    type: Output
  }], prevClicked: [{
    type: Output
  }], channelSections: [{
    type: ViewChildren,
    args: ["channelSection", { read: ElementRef }]
  }], sliderComponents: [{
    type: ViewChildren,
    args: [SliderComponent]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ListaCanalesComponent, { className: "ListaCanalesComponent", filePath: "src/app/pages/lista-canales/lista-canales.component.ts", lineNumber: 35 });
})();
export {
  ListaCanalesComponent
};
//# sourceMappingURL=lista-canales.component-MDXFOVMQ.js.map
