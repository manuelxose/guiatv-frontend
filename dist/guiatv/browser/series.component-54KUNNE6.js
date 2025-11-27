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
  TvGuideService,
  isLive
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Subject,
  ViewChild,
  ViewChildren,
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
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/pages/series/series.component.ts
var _c0 = ["sliderComponent23"];
var _c1 = ["sliderComponent"];
var _c2 = ["sliderComponent1"];
function SeriesComponent_section_11_Template(rf, ctx) {
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
function SeriesComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275element(2, "div", 15)(3, "div", 16)(4, "div", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 18);
    \u0275\u0275text(6, "Cargando series de televisi\xF3n...");
    \u0275\u0275elementEnd()();
  }
}
function SeriesComponent_article_13_app_slider_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 39, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("programas", ctx_r0.en_emision);
  }
}
function SeriesComponent_article_13_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 40);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 41);
    \u0275\u0275element(2, "path", 42);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 43);
    \u0275\u0275text(4, " No hay series en emisi\xF3n en este momento ");
    \u0275\u0275elementEnd()();
  }
}
function SeriesComponent_article_13_app_slider_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 39, 1);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("programas", ctx_r0.series);
  }
}
function SeriesComponent_article_13_section_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 44)(1, "header", 20)(2, "div", 21)(3, "h2", 45);
    \u0275\u0275text(4, " Series de ");
    \u0275\u0275elementStart(5, "span", 46);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275text(7, " en TV hoy ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275element(8, "app-slider", 39);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275attribute("aria-labelledby", "category-heading-" + i_r4);
    \u0275\u0275advance(3);
    \u0275\u0275property("id", "category-heading-" + i_r4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cat_r3);
    \u0275\u0275advance(2);
    \u0275\u0275property("programas", ctx_r0.getSeriesByCategory(cat_r3));
  }
}
function SeriesComponent_article_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article")(1, "section", 19)(2, "header", 20)(3, "div", 21)(4, "h2", 22);
    \u0275\u0275text(5, " Series ahora en televisi\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "nav", 23)(7, "button", 24);
    \u0275\u0275listener("click", function SeriesComponent_article_13_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sliderComponent23 == null ? null : ctx_r0.sliderComponent23.prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 25);
    \u0275\u0275element(9, "path", 26);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(10, "button", 27);
    \u0275\u0275listener("click", function SeriesComponent_article_13_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sliderComponent23 == null ? null : ctx_r0.sliderComponent23.next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 25);
    \u0275\u0275element(12, "path", 28);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "p", 29);
    \u0275\u0275text(14, " Descubre las mejores series que se est\xE1n emitiendo en este momento. Desde comedias hasta dramas emocionantes, thrillers y ciencia ficci\xF3n. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 30);
    \u0275\u0275template(16, SeriesComponent_article_13_app_slider_16_Template, 2, 1, "app-slider", 31)(17, SeriesComponent_article_13_div_17_Template, 5, 0, "div", 32);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "section", 33)(19, "header", 20)(20, "div", 21)(21, "h2", 34);
    \u0275\u0275text(22, " Series en TV hoy ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "nav", 35)(24, "button", 36);
    \u0275\u0275listener("click", function SeriesComponent_article_13_Template_button_click_24_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sliderComponent == null ? null : ctx_r0.sliderComponent.prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(25, "svg", 25);
    \u0275\u0275element(26, "path", 26);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(27, "button", 37);
    \u0275\u0275listener("click", function SeriesComponent_article_13_Template_button_click_27_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sliderComponent == null ? null : ctx_r0.sliderComponent.next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(28, "svg", 25);
    \u0275\u0275element(29, "path", 28);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(30, "p", 29);
    \u0275\u0275text(31, " Consulta nuestra gu\xEDa completa con todas las series que se emiten hoy en los canales m\xE1s populares de Espa\xF1a. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(32, SeriesComponent_article_13_app_slider_32_Template, 2, 1, "app-slider", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275template(33, SeriesComponent_article_13_section_33_Template, 9, 4, "section", 38);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275property("ngIf", ctx_r0.en_emision.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.en_emision.length === 0);
    \u0275\u0275advance(15);
    \u0275\u0275property("ngIf", ctx_r0.series.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.categorias)("ngForTrackBy", ctx_r0.trackByCategory);
  }
}
var _SeriesComponent = class _SeriesComponent {
  constructor(svcGuide, http, metaSvc, router) {
    this.svcGuide = svcGuide;
    this.http = http;
    this.metaSvc = metaSvc;
    this.router = router;
    this.series = [];
    this.categorias = [];
    this.destacada = null;
    this.en_emision = [];
    this.isLoading = true;
    this.ldJson = "";
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    this.metaSvc.setMetaTags({
      title: "Series de TV en Espa\xF1a Hoy | Gu\xEDa Completa de Programaci\xF3n",
      description: "Descubre todas las series que se emiten hoy en TV: dramas, comedias, thrillers y m\xE1s. Gu\xEDa actualizada de series en televisi\xF3n espa\xF1ola con horarios.",
      canonicalUrl: this.router.url,
      keywords: "series tv hoy, series television espa\xF1a, programacion series, guia tv series",
      ogImage: "/assets/images/series-og.jpg"
      // Añade una imagen OG si la tienes
    });
    this.loadSeriesData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadSeriesData() {
    this.http.getProgramacion("today").pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.manageSeries(data);
          this.isLoading = false;
          return;
        }
        this.http.programas$.pipe(filter((d) => d.length > 0), first(), takeUntil(this.destroy$)).subscribe({
          next: (d) => {
            this.manageSeries(d);
            this.isLoading = false;
          },
          error: (err) => {
            console.error("\u274C SERIES - Error al cargar datos desde programas$:", err);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error("\u274C SERIES - Error al llamar getProgramacion:", error);
        this.http.programas$.pipe(filter((d) => d.length > 0), first(), takeUntil(this.destroy$)).subscribe({
          next: (d) => {
            this.manageSeries(d);
            this.isLoading = false;
          },
          error: (err) => {
            console.error("\u274C SERIES - Error al cargar datos desde programas$ fallback:", err);
            this.isLoading = false;
          }
        });
      }
    });
  }
  manageSeries(data) {
    const startTime = performance.now();
    this.svcGuide.setData(data);
    this.series = this.svcGuide.getAllSeries();
    this.en_emision = this.series.filter((serie) => isLive(serie.start, serie.stop));
    this.en_emision = this.en_emision.slice(0, 20);
    this.categorias = this.svcGuide.getSeriesCategories().filter((cat) => cat && cat.toLowerCase().trim() !== "otros").slice(0, 8);
    this.loadDestacada();
    const endTime = performance.now();
    console.log(`\u26A1 SERIES - Procesamiento completado en ${(endTime - startTime).toFixed(2)}ms`);
  }
  loadDestacada() {
    try {
      this.svcGuide.setSeriesDestacadas();
    } catch (e) {
    }
    this.svcGuide.getSeriesDestacadas().pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.destacada = data?.[0] || null;
        try {
          const pageName = "Series en televisi\xF3n";
          const pageDescription = "Gu\xEDa actualizada de series en televisi\xF3n en Espa\xF1a: horarios, canales y detalles de emisi\xF3n.";
          const pageLd = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pageName,
            description: pageDescription,
            url: this.router.url
          };
          if (this.destacada) {
            const title = this.destacada?.title?.value || this.destacada?.name;
            const description = this.destacada?.description || this.destacada?.title?.subtitle || pageDescription;
            const image = this.destacada?.image || this.destacada?.poster || this.destacada?.thumb || "/assets/images/series-og.jpg";
            const seriesLd = {
              "@type": "TVSeries",
              name: title,
              description,
              image
            };
            pageLd.mainEntity = seriesLd;
            this.metaSvc.setMetaTags({
              title: `${title} \u2014 Series en TV | Gu\xEDa TV`,
              description,
              canonicalUrl: this.router.url,
              keywords: `serie ${title}, series tv, ${title} tv`,
              ogImage: image
            });
          }
          this.ldJson = JSON.stringify(pageLd, null, 2);
        } catch (e) {
          this.ldJson = "";
        }
      },
      error: (err) => console.warn("\u26A0\uFE0F No se pudo cargar serie destacada:", err)
    });
  }
  getSeriesByCategory(categoria) {
    return this.svcGuide.getSeriesByCategory(categoria).slice(0, 15);
  }
  // Método para lazy loading de categorías adicionales si es necesario
  loadMoreCategories() {
  }
  /**
   * TrackBy function para optimizar el rendering de categorías
   * Evita re-renderizados innecesarios cuando los datos no cambian
   */
  trackByCategory(index, categoria) {
    return categoria;
  }
};
_SeriesComponent.\u0275fac = function SeriesComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _SeriesComponent)(\u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router));
};
_SeriesComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SeriesComponent, selectors: [["app-series"]], viewQuery: function SeriesComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5);
    \u0275\u0275viewQuery(_c1, 5);
    \u0275\u0275viewQuery(_c2, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sliderComponent23 = _t.first);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sliderComponent = _t.first);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sliderComponents = _t);
  }
}, decls: 14, vars: 3, consts: [["sliderComponent23", ""], ["sliderComponent", ""], ["href", "#main-content", 1, "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-label", "P\xE1gina de series de televisi\xF3n", 1, "series", "w-full", "max-w-full", "mx-auto", "py-6", "px-4", "sm:py-8", "sm:px-6", "lg:py-10", "lg:px-8", "overflow-x-hidden", "overflow-y-auto", 2, "max-height", "calc(100vh - 4rem)"], ["itemscope", "", "itemtype", "https://schema.org/WebPage", 1, "intro", "mt-4", "max-w-4xl", "mx-auto"], ["id", "page-title", "itemprop", "headline", 1, "text-2xl", "font-semibold", "text-white"], ["itemprop", "description", 1, "mt-3", "text-sm", "leading-relaxed", "text-gray-300"], [1, "mt-2", "text-xs", "text-gray-400"], ["class", "relative overflow-hidden mt-6", "itemscope", "", "itemtype", "https://schema.org/TVSeries", 4, "ngIf"], ["class", "mt-6 sm:mt-8", "role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 4, "ngIf"], [4, "ngIf"], ["itemscope", "", "itemtype", "https://schema.org/TVSeries", 1, "relative", "overflow-hidden", "mt-6"], ["loading", "eager", 3, "data"], ["role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 1, "mt-6", "sm:mt-8"], [1, "animate-pulse", "space-y-4"], [1, "h-6", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-3/4", "sm:w-1/2", "mb-4"], [1, "h-4", "bg-gray-300", "dark:bg-gray-700", "rounded", "w-full", "sm:w-3/4", "mb-6"], [1, "h-40", "sm:h-48", "md:h-64", "bg-gray-300", "dark:bg-gray-700", "rounded"], [1, "sr-only"], ["aria-labelledby", "live-series-heading", 1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "mb-4"], [1, "flex", "items-center", "justify-between", "mb-3"], ["id", "live-series-heading", 1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight"], ["aria-label", "Navegaci\xF3n de series en emisi\xF3n", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver series anteriores en emisi\xF3n", 1, "btn-nav-control", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", "aria-hidden", "true", 1, "w-5", "h-5"], ["d", "M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"], ["type", "button", "aria-label", "Ver m\xE1s series en emisi\xF3n", 1, "btn-nav-control", 3, "click"], ["d", "M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"], [1, "text-sm", "sm:text-base", "text-gray-400", "leading-relaxed"], ["role", "region", "aria-label", "Carrusel de series en emisi\xF3n"], ["variant", "series", 3, "programas", 4, "ngIf"], ["class", "empty-state glass-card-mobile text-center py-12 rounded-lg", 4, "ngIf"], ["aria-labelledby", "all-series-heading", 1, "mt-8", "sm:mt-10", "lg:mt-12"], ["id", "all-series-heading", 1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight"], ["aria-label", "Navegaci\xF3n de todas las series", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver series anteriores", 1, "btn-nav-control", 3, "click"], ["type", "button", "aria-label", "Ver m\xE1s series", 1, "btn-nav-control", 3, "click"], ["class", "mt-8 sm:mt-10 lg:mt-12", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["variant", "series", 3, "programas"], [1, "empty-state", "glass-card-mobile", "text-center", "py-12", "rounded-lg"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "aria-hidden", "true", 1, "w-16", "h-16", "mx-auto", "mb-4", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], [1, "text-responsive", "text-gray-400"], [1, "mt-8", "sm:mt-10", "lg:mt-12"], [1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "leading-tight", "capitalize", 3, "id"], [1, "text-red-600"]], template: function SeriesComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 2);
    \u0275\u0275text(1, " Saltar al contenido\n");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 3);
    \u0275\u0275element(3, "app-nav-bar");
    \u0275\u0275elementStart(4, "section", 4)(5, "h1", 5);
    \u0275\u0275text(6, " Series en televisi\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 6);
    \u0275\u0275text(8, " Encuentra las series que se emiten hoy en la televisi\xF3n de Espa\xF1a: dramas, comedias, thrillers y m\xE1s. Nuestra gu\xEDa muestra canales, episodios y horarios para que no te pierdas ning\xFAn cap\xEDtulo. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 7);
    \u0275\u0275text(10, " Informaci\xF3n actualizada constantemente para reflejar la programaci\xF3n m\xE1s reciente. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, SeriesComponent_section_11_Template, 2, 1, "section", 8)(12, SeriesComponent_div_12_Template, 7, 0, "div", 9)(13, SeriesComponent_article_13_Template, 34, 5, "article", 10);
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
}, dependencies: [CommonModule, NgForOf, NgIf, SliderComponent, NavBarComponent, BannerComponent], styles: ['@charset "UTF-8";\n\n\n\n.peliculas[_ngcontent-%COMP%], \n.series[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n}\n.intro[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff !important;\n}\n@media (max-width: 640px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.5rem;\n  }\n}\n.intro[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro[_ngcontent-%COMP%]   p.text-sm[_ngcontent-%COMP%] {\n  line-height: 1.5;\n}\n.animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  color: #ffffff !important;\n  font-weight: 600;\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   span.text-red-600[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\nsection[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  color: #9ca3af;\n}\n.btn-nav-control[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  color: rgba(255, 255, 255, 0.95);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.btn-nav-control[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transition: transform 0.2s ease;\n  pointer-events: none;\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled) {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled)   svg[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n}\n.btn-nav-control[_ngcontent-%COMP%]:focus-visible {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.btn-nav-control[_ngcontent-%COMP%]:active:not(:disabled) {\n  transform: translateY(0) scale(0.98);\n}\n.btn-nav-control[_ngcontent-%COMP%]:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n  transform: none;\n}\n@media (min-width: 640px) {\n  .btn-nav-control[_ngcontent-%COMP%] {\n    width: 48px;\n    height: 48px;\n  }\n}\n.empty-state[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n.empty-state[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  opacity: 0.5;\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%], \n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  min-height: 180px;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]:empty::after, \n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.2) 0%,\n      rgba(209, 213, 219, 0.4) 50%,\n      rgba(209, 213, 219, 0.2) 100%);\n  border-radius: 0.75rem;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-poster, \n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-logo, \n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-poster, \n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-logo {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center center;\n}\n.peliculas[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slider--series .slide-poster, \n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slider--series .slide-poster {\n  object-position: center top;\n}\n.peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%], \n.series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n  display: block;\n  margin-top: 1rem;\n  min-height: 200px;\n  color: #ffffff;\n}\n@media (min-width: 768px) {\n  .peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%], \n   .series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 300px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%], \n   .series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 400px;\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only[_ngcontent-%COMP%]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .peliculas[_ngcontent-%COMP%], \n   .series[_ngcontent-%COMP%] {\n    color: #e5e7eb;\n  }\n  .animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  section[_ngcontent-%COMP%] {\n    animation: none;\n  }\n  .btn-nav-control[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  section[_ngcontent-%COMP%] {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 500px;\n  }\n}\n@media print {\n  .btn-nav-control[_ngcontent-%COMP%], \n   nav[_ngcontent-%COMP%], \n   button[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n  section[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n  }\n  .empty-state[_ngcontent-%COMP%], \n   app-slider[_ngcontent-%COMP%], \n   app-banner[_ngcontent-%COMP%] {\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .empty-state[_ngcontent-%COMP%], \n   .glass-card-mobile[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-nav-control[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n}\n@media (min-width: 640px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.875rem;\n  }\n}\n@media (min-width: 1024px) {\n  .intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 2.25rem;\n  }\n  section[_ngcontent-%COMP%]:not(:first-child) {\n    margin-top: 5rem;\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section[_ngcontent-%COMP%] {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .peliculas[_ngcontent-%COMP%], \n   .series[_ngcontent-%COMP%] {\n    padding-bottom: calc(2rem + env(safe-area-inset-bottom));\n  }\n}\nhtml[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n}\n.glass-card-mobile[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 0.75rem;\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    -webkit-backdrop-filter: blur(12px) saturate(180%);\n    backdrop-filter: blur(12px) saturate(180%);\n  }\n}\n@supports not (backdrop-filter: blur(12px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    background: rgba(31, 41, 55, 0.95);\n  }\n}\n.text-responsive[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\n@media (min-width: 640px) {\n  .text-responsive[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n@media (min-width: 1024px) {\n  .text-responsive[_ngcontent-%COMP%] {\n    font-size: 1.125rem;\n    line-height: 1.6;\n  }\n}\n.text-truncate-mobile[_ngcontent-%COMP%] {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 100%;\n}\n.line-clamp-2[_ngcontent-%COMP%] {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n.touch-target[_ngcontent-%COMP%] {\n  min-height: 44px;\n  min-width: 44px;\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.gpu-accelerated[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.series[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n}\n.series[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n.series[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n.series[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  color: #ffffff !important;\n}\n.intro[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n.intro[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  color: #fff !important;\n}\n.intro[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.btn-nav-control[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  color: rgba(255, 255, 255, 0.95);\n  cursor: pointer;\n  transition:\n    transform 0.12s ease,\n    background 0.12s ease,\n    box-shadow 0.12s ease;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.btn-nav-control[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  transition: transform 0.2s ease;\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled) {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.btn-nav-control[_ngcontent-%COMP%]:hover:not(:disabled)   svg[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n}\n.btn-nav-control[_ngcontent-%COMP%]:focus-visible {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.btn-nav-control[_ngcontent-%COMP%]:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.empty-state[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n.glass-card-mobile[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%] {\n  display: block;\n  min-height: 180px;\n}\n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.2) 0%,\n      rgba(209, 213, 219, 0.4) 50%,\n      rgba(209, 213, 219, 0.2) 100%);\n  border-radius: 0.75rem;\n  animation: _ngcontent-%COMP%_shimmer 1.5s infinite;\n}\n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-poster {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center top;\n}\n.series[_ngcontent-%COMP%]   app-slider[_ngcontent-%COMP%]     .slide-logo {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;\n}\n.series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n  display: block;\n  margin-top: 1rem;\n  color: #ffffff;\n  min-height: 200px;\n}\n@media (min-width: 768px) {\n  .series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 300px;\n  }\n}\n@media (min-width: 1024px) {\n  .series[_ngcontent-%COMP%]   app-banner[_ngcontent-%COMP%] {\n    min-height: 400px;\n  }\n}\n.sr-only[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only[_ngcontent-%COMP%]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .animate-pulse[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%] {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .btn-nav-control[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  section[_ngcontent-%COMP%] {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 500px;\n  }\n}\n@media print {\n  .btn-nav-control[_ngcontent-%COMP%], \n   nav[_ngcontent-%COMP%] {\n    display: none;\n  }\n  section[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n  }\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n}\nhtml[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n}\n/*# sourceMappingURL=series.component.css.map */'] });
var SeriesComponent = _SeriesComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SeriesComponent, [{
    type: Component,
    args: [{ selector: "app-series", standalone: true, imports: [CommonModule, SliderComponent, NavBarComponent, BannerComponent], template: `<!-- Skip link para accesibilidad -->\r
<a class="sr-only focus:not-sr-only" href="#main-content">\r
  Saltar al contenido\r
</a>\r
\r
<main\r
  id="main-content"\r
  class="series w-full max-w-full mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:py-10 lg:px-8 overflow-x-hidden overflow-y-auto"\r
  role="main"\r
  aria-label="P\xE1gina de series de televisi\xF3n"\r
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
      Series en televisi\xF3n\r
    </h1>\r
    <p\r
      class="mt-3 text-sm leading-relaxed text-gray-300"\r
      itemprop="description"\r
    >\r
      Encuentra las series que se emiten hoy en la televisi\xF3n de Espa\xF1a: dramas,\r
      comedias, thrillers y m\xE1s. Nuestra gu\xEDa muestra canales, episodios y\r
      horarios para que no te pierdas ning\xFAn cap\xEDtulo.\r
    </p>\r
    <p class="mt-2 text-xs text-gray-400">\r
      Informaci\xF3n actualizada constantemente para reflejar la programaci\xF3n m\xE1s\r
      reciente.\r
    </p>\r
  </section>\r
\r
  <!-- Featured banner -->\r
  <section\r
    *ngIf="destacada"\r
    class="relative overflow-hidden mt-6"\r
    itemscope\r
    itemtype="https://schema.org/TVSeries"\r
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
    <span class="sr-only">Cargando series de televisi\xF3n...</span>\r
  </div>\r
\r
  <!-- Content -->\r
  <article *ngIf="!isLoading">\r
    <!-- Series en emisi\xF3n ahora -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      aria-labelledby="live-series-heading"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            id="live-series-heading"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
          >\r
            Series ahora en televisi\xF3n\r
          </h2>\r
          <nav\r
            class="hidden sm:flex items-center gap-2"\r
            aria-label="Navegaci\xF3n de series en emisi\xF3n"\r
          >\r
            <button\r
              type="button"\r
              aria-label="Ver series anteriores en emisi\xF3n"\r
              class="btn-nav-control"\r
              (click)="sliderComponent23?.prev()"\r
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
              aria-label="Ver m\xE1s series en emisi\xF3n"\r
              class="btn-nav-control"\r
              (click)="sliderComponent23?.next()"\r
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
          Descubre las mejores series que se est\xE1n emitiendo en este momento.\r
          Desde comedias hasta dramas emocionantes, thrillers y ciencia ficci\xF3n.\r
        </p>\r
      </header>\r
\r
      <div role="region" aria-label="Carrusel de series en emisi\xF3n">\r
        <app-slider\r
          #sliderComponent23\r
          [programas]="en_emision"\r
          variant="series"\r
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"\r
            />\r
          </svg>\r
          <p class="text-responsive text-gray-400">\r
            No hay series en emisi\xF3n en este momento\r
          </p>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Todas las series de hoy -->\r
    <section\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      aria-labelledby="all-series-heading"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            id="all-series-heading"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight"\r
          >\r
            Series en TV hoy\r
          </h2>\r
          <nav\r
            class="hidden sm:flex items-center gap-2"\r
            aria-label="Navegaci\xF3n de todas las series"\r
          >\r
            <button\r
              type="button"\r
              aria-label="Ver series anteriores"\r
              class="btn-nav-control"\r
              (click)="sliderComponent?.prev()"\r
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
              aria-label="Ver m\xE1s series"\r
              class="btn-nav-control"\r
              (click)="sliderComponent?.next()"\r
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
          Consulta nuestra gu\xEDa completa con todas las series que se emiten hoy\r
          en los canales m\xE1s populares de Espa\xF1a.\r
        </p>\r
      </header>\r
\r
      <app-slider\r
        #sliderComponent\r
        [programas]="series"\r
        variant="series"\r
        *ngIf="series.length > 0"\r
      ></app-slider>\r
    </section>\r
\r
    <!-- Series por categor\xEDa -->\r
    <section\r
      *ngFor="let cat of categorias; trackBy: trackByCategory; let i = index"\r
      class="mt-8 sm:mt-10 lg:mt-12"\r
      [attr.aria-labelledby]="'category-heading-' + i"\r
    >\r
      <header class="mb-4">\r
        <div class="flex items-center justify-between mb-3">\r
          <h2\r
            [id]="'category-heading-' + i"\r
            class="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight capitalize"\r
          >\r
            Series de <span class="text-red-600">{{ cat }}</span> en TV hoy\r
          </h2>\r
        </div>\r
      </header>\r
\r
      <app-slider\r
        [programas]="getSeriesByCategory(cat)"\r
        variant="series"\r
      ></app-slider>\r
    </section>\r
  </article>\r
</main>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/pages/series/series.component.scss */\n.peliculas,\n.series {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n  overflow-x: hidden;\n}\n.intro {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro h1 {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  color: #ffffff !important;\n}\n@media (max-width: 640px) {\n  .intro h1 {\n    font-size: 1.5rem;\n  }\n}\n.intro p {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.intro p.text-sm {\n  line-height: 1.5;\n}\n.animate-pulse > div {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\nsection header h2 {\n  color: #ffffff !important;\n  font-weight: 600;\n}\nsection header h2 span.text-red-600 {\n  color: #dc2626;\n}\nsection header p {\n  color: #9ca3af;\n}\n.btn-nav-control {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  color: rgba(255, 255, 255, 0.95);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.btn-nav-control svg {\n  transition: transform 0.2s ease;\n  pointer-events: none;\n}\n.btn-nav-control:hover:not(:disabled) {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  border-color: rgba(220, 38, 38, 0.3);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.btn-nav-control:hover:not(:disabled) svg {\n  transform: scale(1.1);\n}\n.btn-nav-control:focus-visible {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.btn-nav-control:active:not(:disabled) {\n  transform: translateY(0) scale(0.98);\n}\n.btn-nav-control:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n  transform: none;\n}\n@media (min-width: 640px) {\n  .btn-nav-control {\n    width: 48px;\n    height: 48px;\n  }\n}\n.empty-state {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n.empty-state svg {\n  opacity: 0.5;\n}\n.empty-state p {\n  margin: 0;\n}\n.peliculas app-slider,\n.series app-slider {\n  display: block;\n  width: 100%;\n  min-height: 180px;\n}\n.peliculas app-slider:empty::after,\n.series app-slider:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.2) 0%,\n      rgba(209, 213, 219, 0.4) 50%,\n      rgba(209, 213, 219, 0.2) 100%);\n  border-radius: 0.75rem;\n  animation: shimmer 1.5s infinite;\n}\n.peliculas app-slider ::ng-deep .slide-poster,\n.peliculas app-slider ::ng-deep .slide-logo,\n.series app-slider ::ng-deep .slide-poster,\n.series app-slider ::ng-deep .slide-logo {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center center;\n}\n.peliculas app-slider ::ng-deep .slider--series .slide-poster,\n.series app-slider ::ng-deep .slider--series .slide-poster {\n  object-position: center top;\n}\n.peliculas app-banner,\n.series app-banner {\n  display: block;\n  margin-top: 1rem;\n  min-height: 200px;\n  color: #ffffff;\n}\n@media (min-width: 768px) {\n  .peliculas app-banner,\n  .series app-banner {\n    min-height: 300px;\n  }\n}\n@media (min-width: 1024px) {\n  .peliculas app-banner,\n  .series app-banner {\n    min-height: 400px;\n  }\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .peliculas,\n  .series {\n    color: #e5e7eb;\n  }\n  .animate-pulse > div {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  section {\n    animation: none;\n  }\n  .btn-nav-control:hover {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  section {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 500px;\n  }\n}\n@media print {\n  .btn-nav-control,\n  nav,\n  button {\n    display: none !important;\n  }\n  section {\n    page-break-inside: avoid;\n  }\n  .empty-state,\n  app-slider,\n  app-banner {\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .empty-state,\n  .glass-card-mobile {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-nav-control {\n    border: 2px solid currentColor;\n  }\n}\n@media (min-width: 640px) {\n  .intro h1 {\n    font-size: 1.875rem;\n  }\n}\n@media (min-width: 1024px) {\n  .intro h1 {\n    font-size: 2.25rem;\n  }\n  section:not(:first-child) {\n    margin-top: 5rem;\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .peliculas,\n  .series {\n    padding-bottom: calc(2rem + env(safe-area-inset-bottom));\n  }\n}\nhtml {\n  scroll-behavior: smooth;\n}\n.glass-card-mobile {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 0.75rem;\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile {\n    -webkit-backdrop-filter: blur(12px) saturate(180%);\n    backdrop-filter: blur(12px) saturate(180%);\n  }\n}\n@supports not (backdrop-filter: blur(12px)) {\n  .glass-card-mobile {\n    background: rgba(31, 41, 55, 0.95);\n  }\n}\n.text-responsive {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\n@media (min-width: 640px) {\n  .text-responsive {\n    font-size: 1rem;\n  }\n}\n@media (min-width: 1024px) {\n  .text-responsive {\n    font-size: 1.125rem;\n    line-height: 1.6;\n  }\n}\n.text-truncate-mobile {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 100%;\n}\n.line-clamp-2 {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n.touch-target {\n  min-height: 44px;\n  min-width: 44px;\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.gpu-accelerated {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.series {\n  min-height: 100vh;\n  background: transparent;\n  color: #e5e7eb;\n}\n.series h1,\n.series h2,\n.series h3 {\n  color: #ffffff !important;\n}\n.intro {\n  animation: fadeInUp 0.4s ease-out;\n}\n.intro h1 {\n  line-height: 1.3;\n  letter-spacing: -0.025em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  color: #fff !important;\n}\n.intro p {\n  line-height: 1.6;\n  max-width: 65ch;\n}\n.animate-pulse > div {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.3) 25%,\n      rgba(209, 213, 219, 0.5) 50%,\n      rgba(209, 213, 219, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.btn-nav-control {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.03),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 10px;\n  color: rgba(255, 255, 255, 0.95);\n  cursor: pointer;\n  transition:\n    transform 0.12s ease,\n    background 0.12s ease,\n    box-shadow 0.12s ease;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.btn-nav-control svg {\n  transition: transform 0.2s ease;\n}\n.btn-nav-control:hover:not(:disabled) {\n  transform: translateY(-2px) scale(1.02);\n  background: rgba(220, 38, 38, 0.12);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);\n}\n.btn-nav-control:hover:not(:disabled) svg {\n  transform: scale(1.1);\n}\n.btn-nav-control:focus-visible {\n  outline: none;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);\n}\n.btn-nav-control:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.empty-state {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(0, 0, 0, 0.15));\n  border: 1px solid rgba(255, 255, 255, 0.05);\n}\n.glass-card-mobile {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n}\n@supports (backdrop-filter: blur(12px)) {\n  .glass-card-mobile {\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n.series app-slider {\n  display: block;\n  min-height: 180px;\n}\n.series app-slider:empty::after {\n  content: "";\n  display: block;\n  height: 180px;\n  background:\n    linear-gradient(\n      90deg,\n      rgba(209, 213, 219, 0.2) 0%,\n      rgba(209, 213, 219, 0.4) 50%,\n      rgba(209, 213, 219, 0.2) 100%);\n  border-radius: 0.75rem;\n  animation: shimmer 1.5s infinite;\n}\n.series app-slider ::ng-deep .slide-poster {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center top;\n}\n.series app-slider ::ng-deep .slide-logo {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;\n}\n.series app-banner {\n  display: block;\n  margin-top: 1rem;\n  color: #ffffff;\n  min-height: 200px;\n}\n@media (min-width: 768px) {\n  .series app-banner {\n    min-height: 300px;\n  }\n}\n@media (min-width: 1024px) {\n  .series app-banner {\n    min-height: 400px;\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .animate-pulse > div {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(55, 65, 81, 0.3) 25%,\n        rgba(55, 65, 81, 0.5) 50%,\n        rgba(55, 65, 81, 0.3) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  * {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .btn-nav-control:hover {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  section {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 500px;\n  }\n}\n@media print {\n  .btn-nav-control,\n  nav {\n    display: none;\n  }\n  section {\n    page-break-inside: avoid;\n  }\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n}\nhtml {\n  scroll-behavior: smooth;\n}\n/*# sourceMappingURL=series.component.css.map */\n'] }]
  }], () => [{ type: TvGuideService }, { type: HttpService }, { type: MetaService }, { type: Router }], { sliderComponent23: [{
    type: ViewChild,
    args: ["sliderComponent23", { static: false }]
  }], sliderComponent: [{
    type: ViewChild,
    args: ["sliderComponent", { static: false }]
  }], sliderComponents: [{
    type: ViewChildren,
    args: ["sliderComponent1"]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SeriesComponent, { className: "SeriesComponent", filePath: "src/app/pages/series/series.component.ts", lineNumber: 26 });
})();
export {
  SeriesComponent
};
//# sourceMappingURL=series.component-54KUNNE6.js.map
