import {
  CommonModule,
  NgIf,
  Router,
  TvGuideService,
  diffHour,
  formatCorrectTime,
  getHoraInicio,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
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

// src/app/components/banner/banner.component.ts
function BannerComponent_article_0_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 26)(1, "time", 27);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 28);
    \u0275\u0275text(4, "\u2014");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "time", 29);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275attribute("datetime", ctx_r1.bannerData.start);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.getHora(ctx_r1.bannerData.start), " ");
    \u0275\u0275advance(3);
    \u0275\u0275attribute("datetime", ctx_r1.bannerData.stop);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.getHora(ctx_r1.bannerData.stop), " ");
  }
}
function BannerComponent_article_0_li_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 30);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.bannerData.desc.year, " ");
  }
}
function BannerComponent_article_0_li_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 31);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.bannerData.desc.rate, " ");
  }
}
function BannerComponent_article_0_li_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 32);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.time, " ");
  }
}
function BannerComponent_article_0_li_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 33)(1, "span", 34);
    \u0275\u0275text(2, "\u2B50");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.bannerData.starRating, " ");
  }
}
function BannerComponent_article_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 2)(1, "div", 3)(2, "img", 4);
    \u0275\u0275listener("error", function BannerComponent_article_0_Template_img_error_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onImageError($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "div", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 6)(5, "header", 7)(6, "div", 8)(7, "img", 9);
    \u0275\u0275listener("error", function BannerComponent_article_0_Template_img_error_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onImageError($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 10);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, BannerComponent_article_0_div_10_Template, 7, 4, "div", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 12)(12, "h2", 13);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "ul", 14);
    \u0275\u0275template(15, BannerComponent_article_0_li_15_Template, 2, 1, "li", 15)(16, BannerComponent_article_0_li_16_Template, 2, 1, "li", 16)(17, BannerComponent_article_0_li_17_Template, 2, 1, "li", 17)(18, BannerComponent_article_0_li_18_Template, 4, 1, "li", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "p", 19);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 20)(22, "button", 21);
    \u0275\u0275listener("click", function BannerComponent_article_0_Template_button_click_22_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.navigateTo());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(23, "svg", 22);
    \u0275\u0275element(24, "path", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(25, "span");
    \u0275\u0275text(26, "M\xE1s Detalles");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "button", 24);
    \u0275\u0275listener("click", function BannerComponent_article_0_Template_button_click_27_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.addReminder());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(28, "svg", 22);
    \u0275\u0275element(29, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(30, "span");
    \u0275\u0275text(31, "Recordar");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("banner-compact", ctx_r1.compact);
    \u0275\u0275advance(2);
    \u0275\u0275property("src", "https://wsrv.nl/?url=" + ctx_r1.encodeURIComponent(ctx_r1.getProgramPosterUrl(ctx_r1.bannerData)) + "&w=1920&h=800&output=webp&q=85", \u0275\u0275sanitizeUrl)("srcset", ctx_r1.getBannerSrcset(ctx_r1.getProgramPosterUrl(ctx_r1.bannerData)))("alt", "Imagen de " + ((ctx_r1.bannerData.title == null ? null : ctx_r1.bannerData.title.value) || "programa"));
    \u0275\u0275attribute("loading", ctx_r1.compact ? "lazy" : "eager")("fetchpriority", ctx_r1.compact ? "low" : "high");
    \u0275\u0275advance(5);
    \u0275\u0275classMap(ctx_r1.compactLogo ? "channel-logo-small" : "channel-logo");
    \u0275\u0275property("src", ctx_r1.getChannelLogoUrl(ctx_r1.bannerData.channel), \u0275\u0275sanitizeUrl)("alt", ctx_r1.bannerData.channel + " logo");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.bannerData.channel);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.hideTopTime);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.bannerData.title == null ? null : ctx_r1.bannerData.title.value, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.bannerData.desc == null ? null : ctx_r1.bannerData.desc.year);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.bannerData.desc == null ? null : ctx_r1.bannerData.desc.rate);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.time);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.bannerData.starRating);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.bannerData.desc == null ? null : ctx_r1.bannerData.desc.details, " ");
    \u0275\u0275advance(2);
    \u0275\u0275attribute("aria-label", "Ver m\xE1s detalles de " + ((ctx_r1.bannerData.title == null ? null : ctx_r1.bannerData.title.value) || "programa"));
  }
}
function BannerComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 36);
    \u0275\u0275element(2, "path", 37);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 38);
    \u0275\u0275text(4, "No hay datos disponibles para mostrar");
    \u0275\u0275elementEnd()();
  }
}
var _BannerComponent = class _BannerComponent {
  constructor(router, guiatvSvc) {
    this.router = router;
    this.guiatvSvc = guiatvSvc;
    this.data = {};
    this.compact = false;
    this.compactLogo = false;
    this.hideTopTime = false;
    this.bannerData = null;
    this.logo = "";
    this.time = "";
  }
  ngOnInit() {
    this.processBannerData();
  }
  ngOnChanges(changes) {
    if (changes["data"] && changes["data"].currentValue) {
      this.processBannerData();
    }
  }
  processBannerData() {
    if (!this.data || Object.keys(this.data).length === 0) {
      this.bannerData = null;
      return;
    }
    if (this.isMovieData(this.data)) {
      this.bannerData = this.convertMovieToBannerData(this.data);
    } else if (this.isProgramData(this.data)) {
      this.bannerData = this.convertProgramToBannerData(this.data);
    } else {
      this.bannerData = this.convertGenericToBannerData(this.data);
    }
    if (this.bannerData?.start && this.bannerData?.stop) {
      this.time = this.calculateDuration(this.bannerData.start, this.bannerData.stop);
    }
  }
  isMovieData(data) {
    return !!(data.title && (data.poster || data.description || data.rating || data.releaseDate));
  }
  isProgramData(data) {
    return !!(data.title && data.channel && data.start && data.stop);
  }
  convertMovieToBannerData(movieData) {
    const title = typeof movieData.title === "string" ? { value: movieData.title } : movieData.title || { value: "T\xEDtulo desconocido" };
    const descData = typeof movieData.desc === "string" ? { details: movieData.desc } : movieData.desc;
    return {
      title,
      channel: movieData.channelName || movieData.channel || "Canal desconocido",
      poster: movieData.poster || movieData.icon,
      icon: movieData.icon,
      start: this.normalizeTimeString(movieData.startTime || movieData.start),
      stop: this.normalizeTimeString(movieData.endTime || movieData.stop),
      desc: {
        details: movieData.description || descData?.details || movieData.overview,
        year: movieData.year || movieData.releaseDate || descData?.year,
        rate: movieData.rating?.toString() || descData?.rate || "TP"
      },
      category: typeof movieData.category === "string" ? { value: movieData.category } : movieData.category,
      starRating: movieData.starRating || movieData.vote_average || movieData.rating,
      id: movieData.id
    };
  }
  convertProgramToBannerData(programData) {
    const title = typeof programData.title === "string" ? { value: programData.title } : programData.title || { value: "Programa desconocido" };
    return {
      title,
      channel: programData.channel || "Canal desconocido",
      poster: programData.poster || programData.icon,
      icon: programData.icon,
      start: this.normalizeTimeString(programData.start),
      stop: this.normalizeTimeString(programData.stop),
      desc: typeof programData.desc === "string" ? { details: programData.desc } : programData.desc,
      category: typeof programData.category === "string" ? { value: programData.category } : programData.category,
      starRating: programData.starRating,
      id: programData.id
    };
  }
  convertGenericToBannerData(data) {
    return this.convertProgramToBannerData(data);
  }
  formatTime(timeString) {
    try {
      return formatCorrectTime(timeString);
    } catch (error) {
      return getHoraInicio(timeString);
    }
  }
  calculateDuration(start, stop) {
    return diffHour(start, stop);
  }
  normalizeTimeString(time) {
    if (!time)
      return (/* @__PURE__ */ new Date()).toISOString();
    if (time instanceof Date)
      return time.toISOString();
    return time;
  }
  getChannelLogoUrl(channelName) {
    return `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${channelName}.png`;
  }
  getProgramPosterUrl(programData) {
    return programData?.poster || programData?.icon || this.getFallbackImageUrl();
  }
  // Template helper: wrapper for encodeURIComponent so the template can call it
  encodeURIComponent(v) {
    try {
      return globalThis.encodeURIComponent(String(v || ""));
    } catch (_) {
      return String(v || "");
    }
  }
  // Build srcset for the large banner background (desktop sizes)
  getBannerSrcset(raw) {
    if (!raw)
      return "";
    const sizes = [768, 1024, 1280, 1600, 1920];
    return sizes.map((w) => `https://wsrv.nl/?url=${this.encodeURIComponent(raw)}&w=${w}&h=${Math.round(w * 0.416)}&output=webp ${w}w`).join(", ");
  }
  // Stub for reminder action — keep minimal to avoid runtime errors; can be extended later
  addReminder() {
    try {
      console.log("addReminder clicked for", this.bannerData?.id || this.bannerData?.title?.value);
    } catch (_) {
    }
  }
  getFallbackImageUrl() {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=";
  }
  handleImageError(event) {
    const target = event.target;
    target.src = this.getFallbackImageUrl();
  }
  getHora(hora) {
    return this.formatTime(hora);
  }
  onImageError(event) {
    this.handleImageError(event);
  }
  navigateTo() {
    if (!this.bannerData)
      return;
    this.guiatvSvc.setDetallesPrograma(this.bannerData);
    const titleValue = this.bannerData.title?.value || "unknown";
    const slug = slugify(titleValue);
    if (this.isMovieData(this.data)) {
      this.router.navigate(["/peliculas", slug], {
        state: { bannerData: this.bannerData }
      });
    } else {
      this.router.navigate(["/programas", slug], {
        state: { bannerData: this.bannerData }
      });
    }
  }
};
_BannerComponent.\u0275fac = function BannerComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _BannerComponent)(\u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(TvGuideService));
};
_BannerComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BannerComponent, selectors: [["app-banner"]], inputs: { data: "data", compact: "compact", compactLogo: "compactLogo", hideTopTime: "hideTopTime" }, features: [\u0275\u0275NgOnChangesFeature], decls: 2, vars: 2, consts: [["class", "banner-hero", "itemscope", "", "itemtype", "https://schema.org/VideoObject", 3, "banner-compact", 4, "ngIf"], ["class", "banner-empty", "role", "status", "aria-label", "No hay datos disponibles", 4, "ngIf"], ["itemscope", "", "itemtype", "https://schema.org/VideoObject", 1, "banner-hero"], [1, "banner-background"], ["sizes", "100vw", "width", "1920", "height", "800", 1, "banner-bg-image", 3, "error", "src", "srcset", "alt"], [1, "banner-overlay"], [1, "banner-content"], [1, "banner-header"], [1, "channel-info"], ["loading", "lazy", "width", "120", "height", "60", 3, "error", "src", "alt"], ["itemprop", "provider", 1, "channel-name"], ["class", "time-badge", 4, "ngIf"], [1, "banner-info"], ["itemprop", "name", 1, "program-title"], [1, "program-metadata"], ["itemprop", "datePublished", 4, "ngIf"], ["itemprop", "contentRating", 4, "ngIf"], ["itemprop", "duration", 4, "ngIf"], ["class", "rating", "itemprop", "aggregateRating", 4, "ngIf"], ["itemprop", "description", 1, "program-description"], [1, "banner-actions"], ["type", "button", 1, "btn-primary", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 20 20", "fill", "currentColor", "aria-hidden", "true", 1, "btn-icon"], ["fill-rule", "evenodd", "d", "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", "clip-rule", "evenodd"], ["type", "button", "aria-label", "Recordar este programa", 1, "btn-secondary", 3, "click"], ["d", "M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"], [1, "time-badge"], ["itemprop", "startDate"], [1, "time-separator"], ["itemprop", "endDate"], ["itemprop", "datePublished"], ["itemprop", "contentRating"], ["itemprop", "duration"], ["itemprop", "aggregateRating", 1, "rating"], ["aria-label", "Valoraci\xF3n"], ["role", "status", "aria-label", "No hay datos disponibles", 1, "banner-empty"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "aria-hidden", "true", 1, "empty-icon"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], [1, "empty-text"]], template: function BannerComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, BannerComponent_article_0_Template, 32, 20, "article", 0)(1, BannerComponent_div_1_Template, 5, 0, "div", 1);
  }
  if (rf & 2) {
    \u0275\u0275property("ngIf", ctx.bannerData);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.bannerData);
  }
}, dependencies: [CommonModule, NgIf], styles: ['@charset "UTF-8";\n\n\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.banner-hero[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  min-height: 320px;\n  height: clamp(320px, 40vw, 500px);\n  border-radius: 12px;\n  overflow: hidden;\n  margin: 1rem 0;\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n@media (min-width: 1024px) {\n  .banner-hero[_ngcontent-%COMP%] {\n    min-height: 400px;\n    height: clamp(400px, 45vw, 600px);\n  }\n}\n.banner-hero.banner-compact[_ngcontent-%COMP%] {\n  min-height: 240px;\n  height: 280px;\n}\n.banner-background[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n}\n.banner-bg-image[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}\n.banner-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.3) 0%,\n      rgba(0, 0, 0, 0.4) 40%,\n      rgba(0, 0, 0, 0.7) 70%,\n      rgba(0, 0, 0, 0.95) 100%);\n}\n.banner-content[_ngcontent-%COMP%] {\n  position: relative;\n  z-index: 10;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  height: 100%;\n  padding: 1.5rem;\n}\n@media (min-width: 768px) {\n  .banner-content[_ngcontent-%COMP%] {\n    padding: 2rem;\n  }\n}\n@media (min-width: 1024px) {\n  .banner-content[_ngcontent-%COMP%] {\n    padding: 2.5rem;\n  }\n}\n.banner-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n  flex-wrap: wrap;\n}\n.channel-info[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.channel-logo[_ngcontent-%COMP%] {\n  width: 120px;\n  height: 60px;\n  padding: 0.5rem;\n  background: rgba(31, 41, 55, 0.6);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 8px;\n  object-fit: contain;\n}\n@media (min-width: 1024px) {\n  .channel-logo[_ngcontent-%COMP%] {\n    width: 140px;\n    height: 70px;\n  }\n}\n.channel-logo-small[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border-radius: 6px;\n  object-fit: contain;\n  background: rgba(0, 0, 0, 0.3);\n  padding: 4px;\n}\n.channel-name[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .channel-name[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n.time-badge[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1rem;\n  background: rgba(0, 0, 0, 0.75);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n}\n@media (min-width: 1024px) {\n  .time-badge[_ngcontent-%COMP%] {\n    font-size: 1rem;\n    padding: 0.75rem 1.25rem;\n  }\n}\n.time-badge[_ngcontent-%COMP%]   .time-separator[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.5);\n}\n.banner-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n  max-width: 900px;\n}\n@media (min-width: 1024px) {\n  .banner-info[_ngcontent-%COMP%] {\n    gap: 1rem;\n  }\n}\n.program-title[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  font-weight: 700;\n  color: #fff;\n  margin: 0;\n  line-height: 1.2;\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);\n  text-transform: uppercase;\n  letter-spacing: -0.01em;\n}\n@media (min-width: 768px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 2rem;\n  }\n}\n@media (min-width: 1024px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 2.5rem;\n  }\n}\n.program-metadata[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  flex-wrap: wrap;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.program-metadata[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .program-metadata[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n.program-metadata[_ngcontent-%COMP%]   li.rating[_ngcontent-%COMP%] {\n  color: #fbbf24;\n}\n.program-metadata[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:not(:last-child)::after {\n  content: "\\2022";\n  margin-left: 1rem;\n  color: rgba(255, 255, 255, 0.4);\n}\n.program-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  line-height: 1.6;\n  color: rgba(229, 231, 235, 0.95);\n  margin: 0;\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  max-width: 70ch;\n}\n@media (min-width: 768px) {\n  .program-description[_ngcontent-%COMP%] {\n    font-size: 0.9375rem;\n    -webkit-line-clamp: 2;\n  }\n}\n@media (min-width: 1024px) {\n  .program-description[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n.banner-actions[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n  margin-top: 0.5rem;\n}\n.btn-primary[_ngcontent-%COMP%], \n.btn-secondary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1.5rem;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  border: none;\n  cursor: pointer;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  min-height: 44px;\n  text-shadow: none;\n}\n@media (min-width: 1024px) {\n  .btn-primary[_ngcontent-%COMP%], \n   .btn-secondary[_ngcontent-%COMP%] {\n    padding: 0.875rem 1.75rem;\n    font-size: 0.9375rem;\n  }\n}\n.btn-primary[_ngcontent-%COMP%]   .btn-icon[_ngcontent-%COMP%], \n.btn-secondary[_ngcontent-%COMP%]   .btn-icon[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  flex-shrink: 0;\n}\n@media (min-width: 1024px) {\n  .btn-primary[_ngcontent-%COMP%]   .btn-icon[_ngcontent-%COMP%], \n   .btn-secondary[_ngcontent-%COMP%]   .btn-icon[_ngcontent-%COMP%] {\n    width: 20px;\n    height: 20px;\n  }\n}\n.btn-primary[_ngcontent-%COMP%]:focus-visible, \n.btn-secondary[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #fff;\n  outline-offset: 2px;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  background: #dc2626;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  background: rgb(187.0333333333, 30.1666666667, 30.1666666667);\n  transform: translateY(-2px);\n  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);\n}\n.btn-primary[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n}\n.btn-secondary[_ngcontent-%COMP%] {\n  background: rgba(55, 65, 81, 0.9);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}\n.btn-secondary[_ngcontent-%COMP%]:hover {\n  background: rgba(220, 38, 38, 0.9);\n  border-color: #dc2626;\n  transform: translateY(-2px);\n}\n.btn-secondary[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n}\n.banner-empty[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 320px;\n  padding: 3rem 1.5rem;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(31, 41, 55, 0.3),\n      rgba(17, 24, 39, 0.5));\n  border-radius: 12px;\n  margin: 1rem 0;\n}\n.banner-empty[_ngcontent-%COMP%]   .empty-icon[_ngcontent-%COMP%] {\n  width: 64px;\n  height: 64px;\n  color: rgba(156, 163, 175, 0.5);\n  margin-bottom: 1rem;\n}\n.banner-empty[_ngcontent-%COMP%]   .empty-text[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: rgba(156, 163, 175, 0.8);\n  margin: 0;\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .banner-hero[_ngcontent-%COMP%], \n   .btn-primary[_ngcontent-%COMP%], \n   .btn-secondary[_ngcontent-%COMP%] {\n    animation: none !important;\n    transition: none !important;\n  }\n  .btn-primary[_ngcontent-%COMP%]:hover, \n   .btn-secondary[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n}\n.banner-bg-image[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n@media print {\n  .banner-actions[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .banner-hero[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n  }\n}\n/*# sourceMappingURL=banner.component.css.map */'] });
var BannerComponent = _BannerComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BannerComponent, [{
    type: Component,
    args: [{ selector: "app-banner", standalone: true, imports: [CommonModule], template: `<!-- Banner Component - Optimizado SEO & Performance -->\r
<article\r
  *ngIf="bannerData"\r
  class="banner-hero"\r
  [class.banner-compact]="compact"\r
  itemscope\r
  itemtype="https://schema.org/VideoObject"\r
>\r
  <!-- Imagen de fondo optimizada -->\r
  <div class="banner-background">\r
    <img\r
      class="banner-bg-image"\r
      [src]="\r
        'https://wsrv.nl/?url=' +\r
        encodeURIComponent(getProgramPosterUrl(bannerData)) +\r
        '&w=1920&h=800&output=webp&q=85'\r
      "\r
      [srcset]="getBannerSrcset(getProgramPosterUrl(bannerData))"\r
      sizes="100vw"\r
      [alt]="'Imagen de ' + (bannerData.title?.value || 'programa')"\r
      [attr.loading]="compact ? 'lazy' : 'eager'"\r
      [attr.fetchpriority]="compact ? 'low' : 'high'"\r
      width="1920"\r
      height="800"\r
      (error)="onImageError($event)"\r
    />\r
    <!-- Gradient overlay -->\r
    <div class="banner-overlay"></div>\r
  </div>\r
\r
  <!-- Contenido del banner -->\r
  <div class="banner-content">\r
    <!-- Top section: Canal y horario -->\r
    <header class="banner-header">\r
      <div class="channel-info">\r
        <!-- Logo del canal -->\r
        <img\r
          [class]="compactLogo ? 'channel-logo-small' : 'channel-logo'"\r
          [src]="getChannelLogoUrl(bannerData.channel)"\r
          [alt]="bannerData.channel + ' logo'"\r
          loading="lazy"\r
          width="120"\r
          height="60"\r
          (error)="onImageError($event)"\r
        />\r
        <span class="channel-name" itemprop="provider">{{\r
          bannerData.channel\r
        }}</span>\r
      </div>\r
\r
      <!-- Horario -->\r
      <div *ngIf="!hideTopTime" class="time-badge">\r
        <time [attr.datetime]="bannerData.start" itemprop="startDate">\r
          {{ getHora(bannerData.start) }}\r
        </time>\r
        <span class="time-separator">\u2014</span>\r
        <time [attr.datetime]="bannerData.stop" itemprop="endDate">\r
          {{ getHora(bannerData.stop) }}\r
        </time>\r
      </div>\r
    </header>\r
\r
    <!-- Bottom section: Informaci\xF3n del programa -->\r
    <div class="banner-info">\r
      <!-- T\xEDtulo -->\r
      <h2 class="program-title" itemprop="name">\r
        {{ bannerData.title?.value }}\r
      </h2>\r
\r
      <!-- Metadata -->\r
      <ul class="program-metadata">\r
        <li *ngIf="bannerData.desc?.year" itemprop="datePublished">\r
          {{ bannerData.desc.year }}\r
        </li>\r
        <li *ngIf="bannerData.desc?.rate" itemprop="contentRating">\r
          {{ bannerData.desc.rate }}\r
        </li>\r
        <li *ngIf="time" itemprop="duration">\r
          {{ time }}\r
        </li>\r
        <li\r
          *ngIf="bannerData.starRating"\r
          class="rating"\r
          itemprop="aggregateRating"\r
        >\r
          <span aria-label="Valoraci\xF3n">\u2B50</span> {{ bannerData.starRating }}\r
        </li>\r
      </ul>\r
\r
      <!-- Descripci\xF3n -->\r
      <p class="program-description" itemprop="description">\r
        {{ bannerData.desc?.details }}\r
      </p>\r
\r
      <!-- Acciones -->\r
      <div class="banner-actions">\r
        <button\r
          type="button"\r
          class="btn-primary"\r
          (click)="navigateTo()"\r
          [attr.aria-label]="\r
            'Ver m\xE1s detalles de ' + (bannerData.title?.value || 'programa')\r
          "\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="btn-icon"\r
            viewBox="0 0 20 20"\r
            fill="currentColor"\r
            aria-hidden="true"\r
          >\r
            <path\r
              fill-rule="evenodd"\r
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"\r
              clip-rule="evenodd"\r
            />\r
          </svg>\r
          <span>M\xE1s Detalles</span>\r
        </button>\r
\r
        <button\r
          type="button"\r
          class="btn-secondary"\r
          (click)="addReminder()"\r
          aria-label="Recordar este programa"\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="btn-icon"\r
            viewBox="0 0 20 20"\r
            fill="currentColor"\r
            aria-hidden="true"\r
          >\r
            <path\r
              d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"\r
            />\r
          </svg>\r
          <span>Recordar</span>\r
        </button>\r
      </div>\r
    </div>\r
  </div>\r
</article>\r
\r
<!-- Estado vac\xEDo optimizado -->\r
<div\r
  *ngIf="!bannerData"\r
  class="banner-empty"\r
  role="status"\r
  aria-label="No hay datos disponibles"\r
>\r
  <svg\r
    xmlns="http://www.w3.org/2000/svg"\r
    class="empty-icon"\r
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
  <p class="empty-text">No hay datos disponibles para mostrar</p>\r
</div>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/components/banner/banner.component.scss */\n:host {\n  display: block;\n  width: 100%;\n}\n.banner-hero {\n  position: relative;\n  width: 100%;\n  min-height: 320px;\n  height: clamp(320px, 40vw, 500px);\n  border-radius: 12px;\n  overflow: hidden;\n  margin: 1rem 0;\n  animation: fadeInUp 0.4s ease-out;\n}\n@media (min-width: 1024px) {\n  .banner-hero {\n    min-height: 400px;\n    height: clamp(400px, 45vw, 600px);\n  }\n}\n.banner-hero.banner-compact {\n  min-height: 240px;\n  height: 280px;\n}\n.banner-background {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n}\n.banner-bg-image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}\n.banner-overlay {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.3) 0%,\n      rgba(0, 0, 0, 0.4) 40%,\n      rgba(0, 0, 0, 0.7) 70%,\n      rgba(0, 0, 0, 0.95) 100%);\n}\n.banner-content {\n  position: relative;\n  z-index: 10;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  height: 100%;\n  padding: 1.5rem;\n}\n@media (min-width: 768px) {\n  .banner-content {\n    padding: 2rem;\n  }\n}\n@media (min-width: 1024px) {\n  .banner-content {\n    padding: 2.5rem;\n  }\n}\n.banner-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n  flex-wrap: wrap;\n}\n.channel-info {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.channel-logo {\n  width: 120px;\n  height: 60px;\n  padding: 0.5rem;\n  background: rgba(31, 41, 55, 0.6);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 8px;\n  object-fit: contain;\n}\n@media (min-width: 1024px) {\n  .channel-logo {\n    width: 140px;\n    height: 70px;\n  }\n}\n.channel-logo-small {\n  width: 32px;\n  height: 32px;\n  border-radius: 6px;\n  object-fit: contain;\n  background: rgba(0, 0, 0, 0.3);\n  padding: 4px;\n}\n.channel-name {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .channel-name {\n    font-size: 1rem;\n  }\n}\n.time-badge {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1rem;\n  background: rgba(0, 0, 0, 0.75);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n}\n@media (min-width: 1024px) {\n  .time-badge {\n    font-size: 1rem;\n    padding: 0.75rem 1.25rem;\n  }\n}\n.time-badge .time-separator {\n  color: rgba(255, 255, 255, 0.5);\n}\n.banner-info {\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n  max-width: 900px;\n}\n@media (min-width: 1024px) {\n  .banner-info {\n    gap: 1rem;\n  }\n}\n.program-title {\n  font-size: 1.5rem;\n  font-weight: 700;\n  color: #fff;\n  margin: 0;\n  line-height: 1.2;\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);\n  text-transform: uppercase;\n  letter-spacing: -0.01em;\n}\n@media (min-width: 768px) {\n  .program-title {\n    font-size: 2rem;\n  }\n}\n@media (min-width: 1024px) {\n  .program-title {\n    font-size: 2.5rem;\n  }\n}\n.program-metadata {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  flex-wrap: wrap;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.program-metadata li {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .program-metadata li {\n    font-size: 1rem;\n  }\n}\n.program-metadata li.rating {\n  color: #fbbf24;\n}\n.program-metadata li:not(:last-child)::after {\n  content: "\\2022";\n  margin-left: 1rem;\n  color: rgba(255, 255, 255, 0.4);\n}\n.program-description {\n  font-size: 0.875rem;\n  line-height: 1.6;\n  color: rgba(229, 231, 235, 0.95);\n  margin: 0;\n  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  max-width: 70ch;\n}\n@media (min-width: 768px) {\n  .program-description {\n    font-size: 0.9375rem;\n    -webkit-line-clamp: 2;\n  }\n}\n@media (min-width: 1024px) {\n  .program-description {\n    font-size: 1rem;\n  }\n}\n.banner-actions {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n  margin-top: 0.5rem;\n}\n.btn-primary,\n.btn-secondary {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1.5rem;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  border: none;\n  cursor: pointer;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  min-height: 44px;\n  text-shadow: none;\n}\n@media (min-width: 1024px) {\n  .btn-primary,\n  .btn-secondary {\n    padding: 0.875rem 1.75rem;\n    font-size: 0.9375rem;\n  }\n}\n.btn-primary .btn-icon,\n.btn-secondary .btn-icon {\n  width: 18px;\n  height: 18px;\n  flex-shrink: 0;\n}\n@media (min-width: 1024px) {\n  .btn-primary .btn-icon,\n  .btn-secondary .btn-icon {\n    width: 20px;\n    height: 20px;\n  }\n}\n.btn-primary:focus-visible,\n.btn-secondary:focus-visible {\n  outline: 2px solid #fff;\n  outline-offset: 2px;\n}\n.btn-primary {\n  background: #dc2626;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);\n}\n.btn-primary:hover {\n  background: rgb(187.0333333333, 30.1666666667, 30.1666666667);\n  transform: translateY(-2px);\n  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);\n}\n.btn-primary:active {\n  transform: translateY(0);\n}\n.btn-secondary {\n  background: rgba(55, 65, 81, 0.9);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}\n.btn-secondary:hover {\n  background: rgba(220, 38, 38, 0.9);\n  border-color: #dc2626;\n  transform: translateY(-2px);\n}\n.btn-secondary:active {\n  transform: translateY(0);\n}\n.banner-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 320px;\n  padding: 3rem 1.5rem;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(31, 41, 55, 0.3),\n      rgba(17, 24, 39, 0.5));\n  border-radius: 12px;\n  margin: 1rem 0;\n}\n.banner-empty .empty-icon {\n  width: 64px;\n  height: 64px;\n  color: rgba(156, 163, 175, 0.5);\n  margin-bottom: 1rem;\n}\n.banner-empty .empty-text {\n  font-size: 0.875rem;\n  color: rgba(156, 163, 175, 0.8);\n  margin: 0;\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .banner-hero,\n  .btn-primary,\n  .btn-secondary {\n    animation: none !important;\n    transition: none !important;\n  }\n  .btn-primary:hover,\n  .btn-secondary:hover {\n    transform: none !important;\n  }\n}\n.banner-bg-image {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n@media print {\n  .banner-actions {\n    display: none;\n  }\n  .banner-hero {\n    page-break-inside: avoid;\n  }\n}\n/*# sourceMappingURL=banner.component.css.map */\n'] }]
  }], () => [{ type: Router }, { type: TvGuideService }], { data: [{
    type: Input
  }], compact: [{
    type: Input
  }], compactLogo: [{
    type: Input
  }], hideTopTime: [{
    type: Input
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BannerComponent, { className: "BannerComponent", filePath: "src/app/components/banner/banner.component.ts", lineNumber: 32 });
})();

export {
  BannerComponent
};
//# sourceMappingURL=chunk-2UMAA7PO.js.map
