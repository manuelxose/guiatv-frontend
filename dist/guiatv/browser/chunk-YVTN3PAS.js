import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  Router,
  TvGuideService,
  formatCorrectTime,
  getHoraInicio,
  isPlatformBrowser,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  PLATFORM_ID,
  ViewChild,
  setClassMetadata,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/components/slider/slider.component.ts
var _c0 = ["scrollContainer"];
var _c1 = () => [400, 600, 800];
function SliderComponent_article_3_time_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "time");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    const program_r2 = ctx_r3.$implicit;
    const i_r5 = ctx_r3.index;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275attribute("datetime", program_r2.start);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.horaInicio(i_r5), " ");
  }
}
function SliderComponent_article_3_span_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const program_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(program_r2.desc.year);
  }
}
function SliderComponent_article_3_span_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const program_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u2605 ", program_r2.starRating);
  }
}
function SliderComponent_article_3_span_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const program_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(program_r2.desc.rate);
  }
}
function SliderComponent_article_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 5)(1, "a", 6);
    \u0275\u0275listener("click", function SliderComponent_article_3_Template_a_click_1_listener() {
      const program_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.manageData(program_r2));
    })("keydown.enter", function SliderComponent_article_3_Template_a_keydown_enter_1_listener() {
      const program_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.manageData(program_r2));
    })("keydown.space", function SliderComponent_article_3_Template_a_keydown_space_1_listener($event) {
      const program_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.manageData(program_r2));
    });
    \u0275\u0275elementStart(2, "figure", 7)(3, "img", 8);
    \u0275\u0275listener("error", function SliderComponent_article_3_Template_img_error_3_listener($event) {
      const program_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onLogoError($event, program_r2));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "div", 9);
    \u0275\u0275elementStart(5, "figcaption", 10)(6, "div", 11);
    \u0275\u0275template(7, SliderComponent_article_3_time_7_Template, 2, 2, "time", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 13)(9, "div", 14);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "h3", 15);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "div", 16);
    \u0275\u0275template(14, SliderComponent_article_3_span_14_Template, 2, 1, "span", 17)(15, SliderComponent_article_3_span_15_Template, 2, 1, "span", 18)(16, SliderComponent_article_3_span_16_Template, 2, 1, "span", 19);
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const program_r2 = ctx.$implicit;
    const i_r5 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Ver " + ((program_r2 == null ? null : program_r2.title == null ? null : program_r2.title.value) || (program_r2 == null ? null : program_r2.name) || "programa"));
    \u0275\u0275advance(2);
    \u0275\u0275property("src", ctx_r2.isFirst(i_r5) ? ctx_r2.buildWsrvUrl(program_r2 == null ? null : program_r2.icon, 800, 450) : ctx_r2.posterPlaceholder, \u0275\u0275sanitizeUrl)("srcset", ctx_r2.isFirst(i_r5) ? ctx_r2.buildSrcset(program_r2 == null ? null : program_r2.icon, \u0275\u0275pureFunction0(13, _c1)) : "");
    \u0275\u0275attribute("data-src", ctx_r2.buildWsrvUrl(program_r2 == null ? null : program_r2.icon, 800, 450))("alt", (program_r2 == null ? null : program_r2.title == null ? null : program_r2.title.value) || "Programa")("loading", ctx_r2.isFirst(i_r5) ? "eager" : "lazy")("decoding", ctx_r2.isFirst(i_r5) ? "sync" : "async");
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", program_r2 == null ? null : program_r2.start);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (program_r2 == null ? null : program_r2.channel) || "Canal", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (program_r2 == null ? null : program_r2.title == null ? null : program_r2.title.value) || "T\xEDtulo desconocido", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", program_r2 == null ? null : program_r2.desc == null ? null : program_r2.desc.year);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", program_r2 == null ? null : program_r2.starRating);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", program_r2 == null ? null : program_r2.desc == null ? null : program_r2.desc.rate);
  }
}
function SliderComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 23)(1, "button", 24);
    \u0275\u0275listener("click", function SliderComponent_div_4_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.prev());
    });
    \u0275\u0275text(2, " \u2039 ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 25);
    \u0275\u0275listener("click", function SliderComponent_div_4_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.next());
    });
    \u0275\u0275text(4, " \u203A ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r2.canScrollPrev());
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r2.canScrollNext());
  }
}
var _SliderComponent = class _SliderComponent {
  constructor(guiatvSvc, router, platformId, cdr) {
    this.guiatvSvc = guiatvSvc;
    this.router = router;
    this.platformId = platformId;
    this.cdr = cdr;
    this.programas = [];
    this.variant = "default";
    this.logo = "";
    this.isBrowser = false;
    this.scrollTimeout = null;
    this.posterPlaceholder = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 450%27%3E%3Crect width=%27800%27 height=%27450%27 fill=%27%23111827%27/%3E%3C/svg%3E";
    this.logoPlaceholder = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 400%27%3E%3Crect width=%27400%27 height=%27400%27 fill=%27%23111827%27/%3E%3C/svg%3E";
  }
  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  ngAfterViewInit() {
    if (!this.isBrowser || !this.scrollContainer)
      return;
    this.setupIntersectionObserver();
    this.setupResizeObserver();
  }
  ngOnDestroy() {
    if (this.scrollTimeout)
      clearTimeout(this.scrollTimeout);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }
  setupIntersectionObserver() {
    if (!("IntersectionObserver" in window))
      return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const dataSrc = img.getAttribute("data-src");
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute("data-src");
            try {
              this.intersectionObserver?.unobserve(img);
            } catch (_) {
            }
          }
        }
      });
    }, {
      rootMargin: "50px",
      threshold: 0.01
    });
    setTimeout(() => {
      const images = this.scrollContainer?.nativeElement.querySelectorAll("img[data-src]");
      images?.forEach((img) => this.intersectionObserver?.observe(img));
    }, 100);
  }
  setupResizeObserver() {
    if (!("ResizeObserver" in window))
      return;
    this.resizeObserver = new ResizeObserver(() => {
      this.cdr.markForCheck();
    });
    if (this.scrollContainer?.nativeElement) {
      this.resizeObserver.observe(this.scrollContainer.nativeElement);
    }
  }
  // Navegación con smooth scroll
  scrollTo(direction) {
    if (!this.scrollContainer?.nativeElement)
      return;
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  }
  next() {
    this.scrollTo("next");
  }
  prev() {
    this.scrollTo("prev");
  }
  // Backwards-compatible
  onNextClick() {
    this.next();
  }
  onPrevClick() {
    this.prev();
  }
  hasMultipleSlides() {
    return Array.isArray(this.programas) && this.programas.length > 1;
  }
  canScrollPrev() {
    if (!this.scrollContainer?.nativeElement)
      return false;
    return this.scrollContainer.nativeElement.scrollLeft > 10;
  }
  canScrollNext() {
    if (!this.scrollContainer?.nativeElement)
      return false;
    const container = this.scrollContainer.nativeElement;
    const maxScroll = container.scrollWidth - container.clientWidth;
    return container.scrollLeft < maxScroll - 10;
  }
  horaInicio(i) {
    try {
      return getHoraInicio(this.programas[i].start);
    } catch (_) {
      return "";
    }
  }
  isFirst(index) {
    return index === 0;
  }
  horaFin(i) {
    try {
      const p = this.programas[i] || {};
      const endRaw = p.end || p.stop || p.endTime || p.stop_date || p?.stopDate;
      return endRaw ? formatCorrectTime(endRaw) : "";
    } catch (_) {
      return "";
    }
  }
  manageData(programa) {
    if (!programa)
      return;
    const titleValue = programa?.title && (programa.title.value || programa.title) || programa?.name || "";
    const categoryValue = programa?.category && (programa.category.value || programa.category) || "";
    const looksLikeChannelOnly = !!programa?.programs || !programa?.title && !programa?.start && !programa?.stop && (programa?.name || programa?.id);
    if (looksLikeChannelOnly) {
      const slug = slugify(programa?.name || programa?.channel || programa?.id || "");
      this.router.navigate(["programacion-tv/ver-canal", slug]);
      return;
    }
    if (programa) {
      const bannerData = {
        title: typeof titleValue === "string" ? { value: titleValue } : titleValue,
        channel: (typeof programa.channel === "string" ? programa.channel : programa.channel?.name || programa.channel?.channel || programa.channel?.title) || programa.channel || "Canal desconocido",
        poster: programa?.poster || programa?.icon,
        icon: programa?.icon,
        start: this.normalizeTimeString?.(programa.start) ?? (programa.start || ""),
        stop: this.normalizeTimeString?.(programa.stop) ?? (programa.stop || ""),
        desc: typeof programa.desc === "string" ? { details: programa.desc } : programa.desc,
        category: typeof programa.category === "string" ? { value: programa.category } : programa.category,
        starRating: programa.starRating,
        id: programa.id || programa.uuid || null,
        channel_id: typeof programa.channel === "object" ? programa.channel.id || programa.channel_id : programa.channel_id || null
      };
      try {
        this.guiatvSvc.setDetallesPrograma(bannerData);
      } catch (_) {
      }
      const cat = String(categoryValue || "").toLowerCase();
      const isMovieData = cat.includes("cine") || !!programa?.poster || !!programa?.icon || !!programa?.tmdbId || !!programa?.release_date || !!programa?.releaseDate;
      const isSeriesData = cat.includes("series") || /T\d/.test(String(titleValue)) || programa?.type && String(programa.type).toLowerCase().includes("series");
      const isProgramData = !!programa?.start && !!programa?.stop && !!programa?.channel;
      const slug = slugify(bannerData.title && bannerData.title.value || "");
      if (isMovieData) {
        this.router.navigate(["/peliculas", slug], { state: { bannerData } });
      } else if (isSeriesData || isProgramData) {
        this.router.navigate(["/programas", slug], { state: { bannerData } });
      } else {
        this.router.navigate(["/peliculas", slug], { state: { bannerData } });
      }
    } else {
      const slug = slugify(programa?.name || programa?.channel || programa?.id || "");
      this.router.navigate(["programacion-tv/ver-canal", slug]);
    }
  }
  // Local helper: normalize time values safely
  normalizeTimeString(time) {
    if (!time)
      return "";
    try {
      if (time instanceof Date)
        return time.toISOString();
      return String(time);
    } catch (_) {
      return String(time || "");
    }
  }
  // Image helpers optimizados
  buildWsrvUrl(rawUrl, w = 400, h = 225) {
    if (!rawUrl)
      return "";
    try {
      const s = String(rawUrl);
      const low = s.toLowerCase();
      if (low.includes("wsrv.nl") || low.includes("?url="))
        return s;
      return `https://wsrv.nl/?url=${encodeURIComponent(s)}&w=${w}&h=${h}&output=webp`;
    } catch (_) {
      return String(rawUrl);
    }
  }
  buildSrcset(rawUrl, sizes = [400, 600, 800]) {
    if (!rawUrl)
      return "";
    return sizes.map((s) => `${this.buildWsrvUrl(rawUrl, s, Math.round(s * 0.5625))} ${s}w`).join(", ");
  }
  getLogoSrc(program, w = 400, h = 225) {
    const explicit = program?.icon || program?.channelLogo || program?.logo;
    if (explicit)
      return this.buildWsrvUrl(explicit, w, h);
    if (this.logo)
      return this.buildWsrvUrl(this.logo, w, h);
    const name = program?.channel || program?.name || program?.channelName || program?.channelId || program?.id;
    if (!name)
      return "";
    const fallback = `https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${name}.png`;
    return this.buildWsrvUrl(fallback, w, h);
  }
  getOverlayIcon(program, size = 120) {
    const explicit = program?.icon || program?.channelLogo || program?.logo;
    if (explicit && typeof explicit === "string") {
      const low = explicit.toLowerCase();
      const looksLikePoster = /poster|posters|cover|caratula|poster-large/i.test(low);
      if (!looksLikePoster)
        return this.buildWsrvUrl(explicit, size, size);
    }
    return this.getLogoSrc(program, size, size);
  }
  onLogoError(event, program) {
    const img = event?.target;
    if (!img)
      return;
    const attempts = Number(img.dataset["attempts"] || "0");
    if (attempts === 0 && program?.icon) {
      img.dataset["attempts"] = "1";
      img.src = program.icon;
      return;
    }
    if (attempts === 1) {
      img.dataset["attempts"] = "2";
      img.src = this.posterPlaceholder;
      return;
    }
    img.style.display = "none";
  }
  // TrackBy para mejor performance
  trackByProgram(index, program) {
    return program?.id || program?.uuid || `${program?.title?.value}-${index}`;
  }
};
_SliderComponent.\u0275fac = function SliderComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _SliderComponent)(\u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(PLATFORM_ID), \u0275\u0275directiveInject(ChangeDetectorRef));
};
_SliderComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SliderComponent, selectors: [["app-slider"]], viewQuery: function SliderComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.scrollContainer = _t.first);
  }
}, inputs: { key: "key", programas: "programas", variant: "variant", logo: "logo" }, decls: 5, vars: 5, consts: [["scrollContainer", ""], [1, "native-slider", 3, "ngClass"], ["role", "list", 1, "slider-scroll-container"], ["class", "slider-item", "role", "listitem", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "slider-nav", "role", "group", "aria-label", "Controles", 4, "ngIf"], ["role", "listitem", 1, "slider-item"], ["role", "button", "tabindex", "0", 1, "slider-item-inner", 3, "click", "keydown.enter", "keydown.space"], [1, "slide-media"], ["sizes", "(max-width: 640px) 92vw, (max-width: 1024px) 32vw, 19vw", "width", "800", "height", "450", 1, "slide-image", 3, "error", "src", "srcset"], [1, "slide-overlay"], [1, "slide-caption"], [1, "time-badge"], [4, "ngIf"], [1, "program-info"], [1, "channel-badge"], [1, "program-title"], [1, "program-meta"], ["class", "meta-item", 4, "ngIf"], ["class", "meta-item rating", 4, "ngIf"], ["class", "meta-item age-rating", 4, "ngIf"], [1, "meta-item"], [1, "meta-item", "rating"], [1, "meta-item", "age-rating"], ["role", "group", "aria-label", "Controles", 1, "slider-nav"], ["type", "button", "aria-label", "Anterior", 1, "slider-nav-btn", "slider-nav-prev", 3, "click", "disabled"], ["type", "button", "aria-label", "Siguiente", 1, "slider-nav-btn", "slider-nav-next", 3, "click", "disabled"]], template: function SliderComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 1)(1, "div", 2, 0);
    \u0275\u0275template(3, SliderComponent_article_3_Template, 17, 14, "article", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, SliderComponent_div_4_Template, 5, 2, "div", 4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("ngClass", "slider--" + (ctx.variant || "default"));
    \u0275\u0275attribute("aria-label", "Carrusel de " + (ctx.variant === "peliculas" ? "pel\xEDculas" : ctx.variant === "series" ? "series" : "programas"));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx.programas)("ngForTrackBy", ctx.trackByProgram);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isBrowser && ctx.hasMultipleSlides());
  }
}, dependencies: [CommonModule, NgClass, NgForOf, NgIf], styles: ['@charset "UTF-8";\n\n\n\n.native-slider[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  margin: 2.5rem 0;\n  padding: 2rem 0;\n}\n@media (min-width: 1024px) {\n  .native-slider[_ngcontent-%COMP%] {\n    margin: 3.5rem 0;\n    padding: 3rem 0;\n  }\n}\n.slider-scroll-container[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scroll-behavior: smooth;\n  scroll-snap-type: x mandatory;\n  -webkit-overflow-scrolling: touch;\n  scrollbar-width: none;\n}\n.slider-scroll-container[_ngcontent-%COMP%]::-webkit-scrollbar {\n  display: none;\n}\n@media (min-width: 1024px) {\n  .slider-scroll-container[_ngcontent-%COMP%] {\n    gap: 0.75rem;\n  }\n}\n.slider-item[_ngcontent-%COMP%] {\n  flex: 0 0 auto;\n  scroll-snap-align: start;\n  list-style: none;\n  width: 90vw;\n}\n@media (min-width: 640px) {\n  .slider-item[_ngcontent-%COMP%] {\n    width: 45vw;\n  }\n}\n@media (min-width: 1024px) {\n  .slider-item[_ngcontent-%COMP%] {\n    width: 30vw;\n  }\n}\n@media (min-width: 1280px) {\n  .slider-item[_ngcontent-%COMP%] {\n    width: 24vw;\n  }\n}\n@media (min-width: 1536px) {\n  .slider-item[_ngcontent-%COMP%] {\n    width: 19vw;\n  }\n}\n.slider-item-inner[_ngcontent-%COMP%] {\n  display: block;\n  text-decoration: none;\n  color: inherit;\n  cursor: pointer;\n}\n.slide-media[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  border-radius: 6px;\n  overflow: hidden;\n  background: #181818;\n  transition: all 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n  transform: translateZ(0);\n}\n.slider-item[_ngcontent-%COMP%]:hover   .slide-media[_ngcontent-%COMP%] {\n  transform: scale(1.1) translateY(-12px);\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);\n  z-index: 100;\n}\n.slide-image[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n  transition: transform 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n}\n.slider-item[_ngcontent-%COMP%]:hover   .slide-image[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.slide-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      transparent 0%,\n      transparent 40%,\n      rgba(0, 0, 0, 0.4) 70%,\n      rgba(0, 0, 0, 0.9) 100%);\n  pointer-events: none;\n  transition: background 0.3s ease;\n}\n.slider-item[_ngcontent-%COMP%]:hover   .slide-overlay[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.2) 0%,\n      rgba(0, 0, 0, 0.4) 40%,\n      rgba(0, 0, 0, 0.7) 70%,\n      rgba(0, 0, 0, 0.95) 100%);\n}\n.slide-caption[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  padding: 1rem;\n  pointer-events: none;\n}\n@media (min-width: 1024px) {\n  .slide-caption[_ngcontent-%COMP%] {\n    padding: 1.25rem;\n  }\n}\n.time-badge[_ngcontent-%COMP%] {\n  align-self: flex-start;\n  background: rgba(0, 0, 0, 0.9);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n  padding: 0.5rem 0.875rem;\n  border-radius: 4px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .time-badge[_ngcontent-%COMP%] {\n    font-size: 0.9375rem;\n    padding: 0.625rem 1rem;\n  }\n}\n.program-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n@media (min-width: 1024px) {\n  .program-info[_ngcontent-%COMP%] {\n    gap: 0.625rem;\n  }\n}\n.program-title[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 700;\n  color: #fff;\n  margin: 0;\n  line-height: 1.2;\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  opacity: 1;\n  transform: translateY(0);\n}\n@media (min-width: 1024px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 1.125rem;\n  }\n}\n@media (min-width: 1280px) {\n  .program-title[_ngcontent-%COMP%] {\n    font-size: 1.25rem;\n  }\n}\n.program-details[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  opacity: 0;\n  transform: translateY(10px);\n  transition: all 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n  max-height: 0;\n  overflow: hidden;\n}\n.slider-item[_ngcontent-%COMP%]:hover   .program-details[_ngcontent-%COMP%] {\n  opacity: 1;\n  transform: translateY(0);\n  max-height: 200px;\n}\n.channel-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-self: flex-start;\n  padding: 0.25rem 0.625rem;\n  background: rgba(255, 255, 255, 0.15);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 3px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #fff;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n@media (min-width: 1024px) {\n  .channel-badge[_ngcontent-%COMP%] {\n    font-size: 0.8125rem;\n    padding: 0.3125rem 0.75rem;\n  }\n}\n.program-meta[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.625rem;\n  flex-wrap: wrap;\n}\n.meta-item[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n}\n@media (min-width: 1024px) {\n  .meta-item[_ngcontent-%COMP%] {\n    font-size: 0.875rem;\n  }\n}\n.meta-item.rating[_ngcontent-%COMP%] {\n  color: #fbbf24;\n}\n.meta-item.duration[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.85);\n}\n.meta-item.duration[_ngcontent-%COMP%]::before {\n  content: "\\2022";\n  margin-right: 0.5rem;\n  color: rgba(255, 255, 255, 0.5);\n}\n.meta-item.age-rating[_ngcontent-%COMP%] {\n  padding: 0.125rem 0.375rem;\n  background: rgba(255, 255, 255, 0.2);\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n.slider-nav[_ngcontent-%COMP%] {\n  display: none;\n}\n@media (min-width: 1024px) {\n  .slider-nav[_ngcontent-%COMP%] {\n    display: block;\n    opacity: 0;\n    transition: opacity 0.3s ease;\n  }\n}\n.native-slider[_ngcontent-%COMP%]:hover   .slider-nav[_ngcontent-%COMP%] {\n  opacity: 1;\n}\n.slider-nav-btn[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 60px;\n  height: 60px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(20, 20, 20, 0.7);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: none;\n  color: #fff;\n  font-size: 48px;\n  font-weight: 200;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  z-index: 200;\n}\n.slider-nav-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: rgba(20, 20, 20, 0.9);\n  transform: translateY(-50%) scale(1.1);\n}\n.slider-nav-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n.slider-nav-prev[_ngcontent-%COMP%] {\n  left: 0;\n  border-radius: 0 4px 4px 0;\n}\n.slider-nav-next[_ngcontent-%COMP%] {\n  right: 0;\n  border-radius: 4px 0 0 4px;\n}\n.slider--peliculas[_ngcontent-%COMP%]   .slide-image[_ngcontent-%COMP%], \n.slider--series[_ngcontent-%COMP%]   .slide-image[_ngcontent-%COMP%] {\n  object-position: center 25%;\n}\n@media (prefers-reduced-motion: reduce) {\n  .slider-scroll-container[_ngcontent-%COMP%] {\n    scroll-behavior: auto;\n  }\n  .slide-media[_ngcontent-%COMP%], \n   .program-info[_ngcontent-%COMP%] {\n    transition: none !important;\n  }\n  .slider-item[_ngcontent-%COMP%]:hover   .slide-media[_ngcontent-%COMP%] {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  .slider-item[_ngcontent-%COMP%] {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 200px;\n  }\n}\n.slide-media[_ngcontent-%COMP%], \n.slide-image[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\nimg[data-src][_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #1f2937 0%,\n      #111827 100%);\n}\n@media print {\n  .slider-nav[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .slider-scroll-container[_ngcontent-%COMP%] {\n    overflow: visible;\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 1rem;\n  }\n  .slider-item[_ngcontent-%COMP%] {\n    width: 100%;\n    page-break-inside: avoid;\n  }\n}\n/*# sourceMappingURL=slider.component.css.map */'], changeDetection: 0 });
var SliderComponent = _SliderComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SliderComponent, [{
    type: Component,
    args: [{ selector: "app-slider", standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `<!-- Native Slider - Optimizado para datos reales -->\r
<section\r
  class="native-slider"\r
  [ngClass]="'slider--' + (variant || 'default')"\r
  [attr.aria-label]="\r
    'Carrusel de ' +\r
    (variant === 'peliculas'\r
      ? 'pel\xEDculas'\r
      : variant === 'series'\r
      ? 'series'\r
      : 'programas')\r
  "\r
>\r
  <!-- Scroll Container -->\r
  <div #scrollContainer class="slider-scroll-container" role="list">\r
    <article\r
      *ngFor="let program of programas; index as i; trackBy: trackByProgram"\r
      class="slider-item"\r
      role="listitem"\r
    >\r
      <a\r
        class="slider-item-inner"\r
        role="button"\r
        tabindex="0"\r
        (click)="manageData(program)"\r
        (keydown.enter)="manageData(program)"\r
        (keydown.space)="$event.preventDefault(); manageData(program)"\r
        [attr.aria-label]="\r
          'Ver ' + (program?.title?.value || program?.name || 'programa')\r
        "\r
      >\r
        <figure class="slide-media">\r
          <!-- Imagen principal del programa (icon es la imagen del programa) -->\r
          <img\r
            class="slide-image"\r
            [attr.data-src]="buildWsrvUrl(program?.icon, 800, 450)"\r
            [src]="\r
              isFirst(i)\r
                ? buildWsrvUrl(program?.icon, 800, 450)\r
                : posterPlaceholder\r
            "\r
            [srcset]="\r
              isFirst(i) ? buildSrcset(program?.icon, [400, 600, 800]) : ''\r
            "\r
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 32vw, 19vw"\r
            [attr.alt]="program?.title?.value || 'Programa'"\r
            [attr.loading]="isFirst(i) ? 'eager' : 'lazy'"\r
            [attr.decoding]="isFirst(i) ? 'sync' : 'async'"\r
            width="800"\r
            height="450"\r
            (error)="onLogoError($event, program)"\r
          />\r
\r
          <!-- Overlay gradient -->\r
          <div class="slide-overlay"></div>\r
\r
          <!-- Informaci\xF3n del programa -->\r
          <figcaption class="slide-caption">\r
            <!-- Hora arriba izquierda -->\r
            <div class="time-badge">\r
              <time *ngIf="program?.start" [attr.datetime]="program.start">\r
                {{ horaInicio(i) }}\r
              </time>\r
            </div>\r
\r
            <!-- Info abajo -->\r
            <div class="program-info">\r
              <!-- Canal -->\r
              <div class="channel-badge">\r
                {{ program?.channel || "Canal" }}\r
              </div>\r
\r
              <!-- T\xEDtulo -->\r
              <h3 class="program-title">\r
                {{ program?.title?.value || "T\xEDtulo desconocido" }}\r
              </h3>\r
\r
              <!-- Metadata -->\r
              <div class="program-meta">\r
                <span *ngIf="program?.desc?.year" class="meta-item">{{\r
                  program.desc.year\r
                }}</span>\r
                <span *ngIf="program?.starRating" class="meta-item rating"\r
                  >\u2605 {{ program.starRating }}</span\r
                >\r
                <span\r
                  *ngIf="program?.desc?.rate"\r
                  class="meta-item age-rating"\r
                  >{{ program.desc.rate }}</span\r
                >\r
              </div>\r
            </div>\r
          </figcaption>\r
        </figure>\r
      </a>\r
    </article>\r
  </div>\r
\r
  <!-- Controles de navegaci\xF3n -->\r
  <div\r
    class="slider-nav"\r
    role="group"\r
    aria-label="Controles"\r
    *ngIf="isBrowser && hasMultipleSlides()"\r
  >\r
    <button\r
      class="slider-nav-btn slider-nav-prev"\r
      type="button"\r
      aria-label="Anterior"\r
      [disabled]="!canScrollPrev()"\r
      (click)="prev()"\r
    >\r
      \u2039\r
    </button>\r
    <button\r
      class="slider-nav-btn slider-nav-next"\r
      type="button"\r
      aria-label="Siguiente"\r
      [disabled]="!canScrollNext()"\r
      (click)="next()"\r
    >\r
      \u203A\r
    </button>\r
  </div>\r
</section>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/components/slider/slider.component.scss */\n.native-slider {\n  position: relative;\n  width: 100%;\n  margin: 2.5rem 0;\n  padding: 2rem 0;\n}\n@media (min-width: 1024px) {\n  .native-slider {\n    margin: 3.5rem 0;\n    padding: 3rem 0;\n  }\n}\n.slider-scroll-container {\n  display: flex;\n  gap: 0.5rem;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scroll-behavior: smooth;\n  scroll-snap-type: x mandatory;\n  -webkit-overflow-scrolling: touch;\n  scrollbar-width: none;\n}\n.slider-scroll-container::-webkit-scrollbar {\n  display: none;\n}\n@media (min-width: 1024px) {\n  .slider-scroll-container {\n    gap: 0.75rem;\n  }\n}\n.slider-item {\n  flex: 0 0 auto;\n  scroll-snap-align: start;\n  list-style: none;\n  width: 90vw;\n}\n@media (min-width: 640px) {\n  .slider-item {\n    width: 45vw;\n  }\n}\n@media (min-width: 1024px) {\n  .slider-item {\n    width: 30vw;\n  }\n}\n@media (min-width: 1280px) {\n  .slider-item {\n    width: 24vw;\n  }\n}\n@media (min-width: 1536px) {\n  .slider-item {\n    width: 19vw;\n  }\n}\n.slider-item-inner {\n  display: block;\n  text-decoration: none;\n  color: inherit;\n  cursor: pointer;\n}\n.slide-media {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  border-radius: 6px;\n  overflow: hidden;\n  background: #181818;\n  transition: all 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n  transform: translateZ(0);\n}\n.slider-item:hover .slide-media {\n  transform: scale(1.1) translateY(-12px);\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);\n  z-index: 100;\n}\n.slide-image {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n  transition: transform 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n}\n.slider-item:hover .slide-image {\n  transform: scale(1.05);\n}\n.slide-overlay {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      transparent 0%,\n      transparent 40%,\n      rgba(0, 0, 0, 0.4) 70%,\n      rgba(0, 0, 0, 0.9) 100%);\n  pointer-events: none;\n  transition: background 0.3s ease;\n}\n.slider-item:hover .slide-overlay {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.2) 0%,\n      rgba(0, 0, 0, 0.4) 40%,\n      rgba(0, 0, 0, 0.7) 70%,\n      rgba(0, 0, 0, 0.95) 100%);\n}\n.slide-caption {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  padding: 1rem;\n  pointer-events: none;\n}\n@media (min-width: 1024px) {\n  .slide-caption {\n    padding: 1.25rem;\n  }\n}\n.time-badge {\n  align-self: flex-start;\n  background: rgba(0, 0, 0, 0.9);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n  padding: 0.5rem 0.875rem;\n  border-radius: 4px;\n  font-size: 0.875rem;\n  font-weight: 700;\n  color: #fff;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);\n}\n@media (min-width: 1024px) {\n  .time-badge {\n    font-size: 0.9375rem;\n    padding: 0.625rem 1rem;\n  }\n}\n.program-info {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n@media (min-width: 1024px) {\n  .program-info {\n    gap: 0.625rem;\n  }\n}\n.program-title {\n  font-size: 1rem;\n  font-weight: 700;\n  color: #fff;\n  margin: 0;\n  line-height: 1.2;\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  opacity: 1;\n  transform: translateY(0);\n}\n@media (min-width: 1024px) {\n  .program-title {\n    font-size: 1.125rem;\n  }\n}\n@media (min-width: 1280px) {\n  .program-title {\n    font-size: 1.25rem;\n  }\n}\n.program-details {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  opacity: 0;\n  transform: translateY(10px);\n  transition: all 0.3s cubic-bezier(0.5, 0, 0.1, 1);\n  max-height: 0;\n  overflow: hidden;\n}\n.slider-item:hover .program-details {\n  opacity: 1;\n  transform: translateY(0);\n  max-height: 200px;\n}\n.channel-badge {\n  display: inline-flex;\n  align-self: flex-start;\n  padding: 0.25rem 0.625rem;\n  background: rgba(255, 255, 255, 0.15);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-radius: 3px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #fff;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n@media (min-width: 1024px) {\n  .channel-badge {\n    font-size: 0.8125rem;\n    padding: 0.3125rem 0.75rem;\n  }\n}\n.program-meta {\n  display: flex;\n  align-items: center;\n  gap: 0.625rem;\n  flex-wrap: wrap;\n}\n.meta-item {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.9);\n}\n@media (min-width: 1024px) {\n  .meta-item {\n    font-size: 0.875rem;\n  }\n}\n.meta-item.rating {\n  color: #fbbf24;\n}\n.meta-item.duration {\n  color: rgba(255, 255, 255, 0.85);\n}\n.meta-item.duration::before {\n  content: "\\2022";\n  margin-right: 0.5rem;\n  color: rgba(255, 255, 255, 0.5);\n}\n.meta-item.age-rating {\n  padding: 0.125rem 0.375rem;\n  background: rgba(255, 255, 255, 0.2);\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n.slider-nav {\n  display: none;\n}\n@media (min-width: 1024px) {\n  .slider-nav {\n    display: block;\n    opacity: 0;\n    transition: opacity 0.3s ease;\n  }\n}\n.native-slider:hover .slider-nav {\n  opacity: 1;\n}\n.slider-nav-btn {\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 60px;\n  height: 60px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(20, 20, 20, 0.7);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: none;\n  color: #fff;\n  font-size: 48px;\n  font-weight: 200;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  z-index: 200;\n}\n.slider-nav-btn:hover:not(:disabled) {\n  background: rgba(20, 20, 20, 0.9);\n  transform: translateY(-50%) scale(1.1);\n}\n.slider-nav-btn:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n.slider-nav-prev {\n  left: 0;\n  border-radius: 0 4px 4px 0;\n}\n.slider-nav-next {\n  right: 0;\n  border-radius: 4px 0 0 4px;\n}\n.slider--peliculas .slide-image,\n.slider--series .slide-image {\n  object-position: center 25%;\n}\n@media (prefers-reduced-motion: reduce) {\n  .slider-scroll-container {\n    scroll-behavior: auto;\n  }\n  .slide-media,\n  .program-info {\n    transition: none !important;\n  }\n  .slider-item:hover .slide-media {\n    transform: none !important;\n  }\n}\n@supports (content-visibility: auto) {\n  .slider-item {\n    content-visibility: auto;\n    contain-intrinsic-size: 0 200px;\n  }\n}\n.slide-media,\n.slide-image {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\nimg[data-src] {\n  background:\n    linear-gradient(\n      135deg,\n      #1f2937 0%,\n      #111827 100%);\n}\n@media print {\n  .slider-nav {\n    display: none;\n  }\n  .slider-scroll-container {\n    overflow: visible;\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 1rem;\n  }\n  .slider-item {\n    width: 100%;\n    page-break-inside: avoid;\n  }\n}\n/*# sourceMappingURL=slider.component.css.map */\n'] }]
  }], () => [{ type: TvGuideService }, { type: Router }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }, { type: ChangeDetectorRef }], { key: [{
    type: Input
  }], programas: [{
    type: Input
  }], variant: [{
    type: Input
  }], logo: [{
    type: Input
  }], scrollContainer: [{
    type: ViewChild,
    args: ["scrollContainer", { static: false }]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SliderComponent, { className: "SliderComponent", filePath: "src/app/components/slider/slider.component.ts", lineNumber: 37 });
})();

export {
  SliderComponent
};
//# sourceMappingURL=chunk-YVTN3PAS.js.map
