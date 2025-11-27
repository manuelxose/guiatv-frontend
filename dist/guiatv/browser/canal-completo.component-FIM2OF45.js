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
  ActivatedRoute,
  CommonModule,
  HttpService,
  NgClass,
  NgForOf,
  NgIf,
  Router,
  RouterLink,
  RouterModule,
  TvGuideService
} from "./chunk-MUKTTSZO.js";
import {
  ChangeDetectorRef,
  Component,
  Subject,
  ViewChild,
  ViewChildren,
  __async,
  filter,
  first,
  inject,
  setClassMetadata,
  takeUntil,
  tap,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
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
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/pages/canal-completo/canal-completo.component.ts
var _c0 = ["fullScheduleSlider"];
var _c1 = ["otherChannelsSlider"];
var _c2 = ["timeSlotSlider"];
var _c3 = ["categorySlider"];
var _c4 = (a0) => ["/canal", a0];
function CanalCompletoComponent_app_banner_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-banner", 87);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("data", ctx_r0.program);
  }
}
function CanalCompletoComponent_div_17_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.program.category.value.split(",")[0]);
  }
}
function CanalCompletoComponent_div_17_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 93);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 94);
    \u0275\u0275element(2, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", ctx_r0.formatTime(ctx_r0.program.start), " - ", ctx_r0.formatTime(ctx_r0.program.stop), " ");
  }
}
function CanalCompletoComponent_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 88)(1, "h2", 89);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 90);
    \u0275\u0275template(4, CanalCompletoComponent_div_17_span_4_Template, 2, 1, "span", 91)(5, CanalCompletoComponent_div_17_span_5_Template, 4, 2, "span", 92);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.program.title == null ? null : ctx_r0.program.title.value, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.program.category == null ? null : ctx_r0.program.category.value);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.program.start && ctx_r0.program.stop);
  }
}
function CanalCompletoComponent_button_58_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 95);
    \u0275\u0275listener("click", function CanalCompletoComponent_button_58_Template_button_click_0_listener() {
      const day_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.cambiarDia(day_r3.value));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const day_r3 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", ctx_r0.diaSeleccionado === day_r3.label ? "bg-red-600 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700");
    \u0275\u0275attribute("aria-pressed", ctx_r0.diaSeleccionado === day_r3.label)("aria-label", "Ver programaci\xF3n de " + day_r3.label.toLowerCase() + (ctx_r0.diaSeleccionado === day_r3.label ? " (seleccionado)" : ""));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", day_r3.label, " ");
  }
}
function CanalCompletoComponent_button_67_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 96);
    \u0275\u0275listener("click", function CanalCompletoComponent_button_67_Template_button_click_0_listener() {
      const slot_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.scrollToTimeSlot(slot_r5.hour));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 97);
    \u0275\u0275element(2, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "span", 98);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 99);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const slot_r5 = ctx.$implicit;
    \u0275\u0275attribute("aria-label", "Ver programaci\xF3n de " + slot_r5.label);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(slot_r5.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", slot_r5.count, " prog.");
  }
}
function CanalCompletoComponent_section_68_app_slider_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 108, 0);
  }
  if (rf & 2) {
    const slot_r8 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("programas", slot_r8.programs)("logo", "https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/" + (ctx_r0.program == null ? null : ctx_r0.program.channel) + ".png");
  }
}
function CanalCompletoComponent_section_68_p_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 109);
    \u0275\u0275text(1, " No hay programas en esta franja horaria ");
    \u0275\u0275elementEnd();
  }
}
function CanalCompletoComponent_section_68_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 100)(1, "header", 101)(2, "div", 62)(3, "div", 63)(4, "span", 102);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div")(7, "h3", 103);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 104);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "nav", 105)(12, "button", 106);
    \u0275\u0275listener("click", function CanalCompletoComponent_section_68_Template_button_click_12_listener() {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.timeSlotSliders[i_r7] == null ? null : ctx_r0.timeSlotSliders[i_r7].prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 55);
    \u0275\u0275element(14, "path", 56);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "button", 106);
    \u0275\u0275listener("click", function CanalCompletoComponent_section_68_Template_button_click_15_listener() {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.timeSlotSliders[i_r7] == null ? null : ctx_r0.timeSlotSliders[i_r7].next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(16, "svg", 55);
    \u0275\u0275element(17, "path", 58);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(18, "div", 59);
    \u0275\u0275template(19, CanalCompletoComponent_section_68_app_slider_19_Template, 2, 2, "app-slider", 60)(20, CanalCompletoComponent_section_68_p_20_Template, 2, 0, "p", 107);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const slot_r8 = ctx.$implicit;
    const i_r7 = ctx.index;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("id", "time-slot-" + slot_r8.hour);
    \u0275\u0275attribute("aria-labelledby", "time-slot-heading-" + i_r7);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", slot_r8.hour, ":00");
    \u0275\u0275advance(2);
    \u0275\u0275property("id", "time-slot-heading-" + i_r7);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", slot_r8.label, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", slot_r8.programs.length, " programas en ", ctx_r0.canal, " ");
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Navegaci\xF3n " + slot_r8.label);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Ver programas anteriores de " + slot_r8.label);
    \u0275\u0275advance(3);
    \u0275\u0275attribute("aria-label", "Ver m\xE1s programas de " + slot_r8.label);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", slot_r8.programs.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", slot_r8.programs.length === 0);
  }
}
function CanalCompletoComponent_article_76_app_slider_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 108);
  }
  if (rf & 2) {
    const categoria_r11 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("programas", ctx_r0.getProgramsByCategory(categoria_r11))("logo", "https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/" + (ctx_r0.program == null ? null : ctx_r0.program.channel) + ".png");
  }
}
function CanalCompletoComponent_article_76_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 110)(1, "header", 111)(2, "div", 62)(3, "div", 112);
    \u0275\u0275namespaceSVG();
    \u0275\u0275element(4, "svg", 113);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div")(6, "h3", 103);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p", 104);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(10, "nav", 105)(11, "button", 106);
    \u0275\u0275listener("click", function CanalCompletoComponent_article_76_Template_button_click_11_listener() {
      const i_r10 = \u0275\u0275restoreView(_r9).index;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.categorySliders[i_r10] == null ? null : ctx_r0.categorySliders[i_r10].prev());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(12, "svg", 55);
    \u0275\u0275element(13, "path", 56);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "button", 106);
    \u0275\u0275listener("click", function CanalCompletoComponent_article_76_Template_button_click_14_listener() {
      const i_r10 = \u0275\u0275restoreView(_r9).index;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.categorySliders[i_r10] == null ? null : ctx_r0.categorySliders[i_r10].next());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(15, "svg", 55);
    \u0275\u0275element(16, "path", 58);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(17, "div", 59);
    \u0275\u0275template(18, CanalCompletoComponent_article_76_app_slider_18_Template, 1, 2, "app-slider", 60);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const categoria_r11 = ctx.$implicit;
    const i_r10 = ctx.index;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275attribute("aria-labelledby", "category-heading-" + i_r10);
    \u0275\u0275advance(4);
    \u0275\u0275property("innerHTML", ctx_r0.getCategoryIcon(categoria_r11), \u0275\u0275sanitizeHtml);
    \u0275\u0275advance(2);
    \u0275\u0275property("id", "category-heading-" + i_r10);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", categoria_r11, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.getProgramsByCategory(categoria_r11).length, " programas disponibles ");
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Navegaci\xF3n categor\xEDa " + categoria_r11);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", "Ver programas anteriores de " + categoria_r11);
    \u0275\u0275advance(3);
    \u0275\u0275attribute("aria-label", "Ver m\xE1s programas de " + categoria_r11);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r0.getProgramsByCategory(categoria_r11).length > 0);
  }
}
function CanalCompletoComponent_app_slider_92_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 108, 1);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("programas", ctx_r0.programs)("logo", "https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/" + (ctx_r0.program == null ? null : ctx_r0.program.channel) + ".png");
  }
}
function CanalCompletoComponent_app_slider_112_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-slider", 114, 2);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("programas", ctx_r0.live_programs);
  }
}
function CanalCompletoComponent_p_113_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 115);
    \u0275\u0275text(1, " No hay informaci\xF3n de otros canales disponible ");
    \u0275\u0275elementEnd();
  }
}
function CanalCompletoComponent_li_131_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li")(1, "strong");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const categoria_r12 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(categoria_r12);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(": Programas especializados en ", categoria_r12.toLowerCase(), " para todos los p\xFAblicos ");
  }
}
function CanalCompletoComponent_a_175_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 116);
    \u0275\u0275element(1, "img", 117);
    \u0275\u0275elementStart(2, "span", 118);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const channel_r13 = ctx.$implicit;
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(5, _c4, channel_r13.id));
    \u0275\u0275attribute("aria-label", "Ver programaci\xF3n de " + channel_r13.name);
    \u0275\u0275advance();
    \u0275\u0275property("src", "https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/" + channel_r13.id + ".png&w=64&h=64&fit=cover&output=webp", \u0275\u0275sanitizeUrl)("alt", "Logo de " + channel_r13.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", channel_r13.name, " ");
  }
}
var _CanalCompletoComponent = class _CanalCompletoComponent {
  constructor() {
    this.route = inject(ActivatedRoute);
    this.router = inject(Router);
    this.http = inject(HttpService);
    this.svcGuide = inject(TvGuideService);
    this.metaSvc = inject(MetaService);
    this.cdr = inject(ChangeDetectorRef);
    this.query = "";
    this.diaSeleccionado = "Hoy";
    this.canal = "";
    this.programs = [];
    this.program = {};
    this.categorias = [];
    this.categoriaSeleccionada = "Selecciona una categor\xEDa";
    this.logo = "";
    this.channel = {};
    this.live_programs = [];
    this.isLoading = true;
    this.error = null;
    this.days = [
      { label: "Hoy", value: "today" },
      { label: "Ma\xF1ana", value: "tomorrow" },
      { label: "Pasado", value: "after_tomorrow" }
    ];
    this.timeSlots = [];
    this.relatedChannels = [];
    this.destroy$ = new Subject();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      dataFetchTime: 0
    };
    this.componentStartTime = 0;
    this.categoryIcons = {
      Pel\u00EDculas: '<path fill="currentColor" d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>',
      Series: '<path fill="currentColor" d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z"/>',
      Deportes: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>',
      Documentales: '<path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>',
      Infantil: '<path fill="currentColor" d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>',
      Noticias: '<path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>',
      Entretenimiento: '<path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>',
      Cultura: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      default: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    };
  }
  ngOnInit() {
    this.componentStartTime = performance.now();
    this.initializeComponent();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.logPerformanceMetrics();
  }
  /**
   * Initialize component with route params and data
   */
  initializeComponent() {
    this.route.paramMap.pipe(takeUntil(this.destroy$), tap((params) => {
      this.query = params.get("id")?.toString() || "";
      this.canal = this.formatChannelName(this.query);
    })).subscribe(() => {
      this.setupMetaTags();
      this.loadProgramData();
    });
  }
  /**
   * Setup SEO meta tags
   */
  setupMetaTags() {
    const canonicalUrl = this.router.url;
    const channelName = this.canal;
    const dayText = this.diaSeleccionado.toLowerCase();
    this.metaSvc.setMetaTags({
      title: `Programaci\xF3n de ${channelName} ${dayText} - Gu\xEDa TV Completa en Directo`,
      description: `\u2713 Consulta qu\xE9 ver en ${channelName} ${dayText}. Parrilla completa con horarios, programas en directo, pel\xEDculas y series. Gu\xEDa TV actualizada de ${channelName}.`,
      canonicalUrl,
      keywords: `${channelName}, programaci\xF3n ${channelName}, ${channelName} ${dayText}, gu\xEDa tv ${channelName}, ${channelName} en directo, parrilla ${channelName}, horarios ${channelName}, qu\xE9 ver ${channelName}`,
      ogTitle: `Programaci\xF3n ${channelName} ${dayText} - Todos los Programas y Horarios`,
      ogDescription: `Descubre toda la programaci\xF3n de ${channelName} ${dayText}. Pel\xEDculas, series, documentales y mucho m\xE1s. Gu\xEDa TV actualizada en tiempo real.`,
      ogType: "website",
      ogImage: `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${this.query}.png&w=1200&h=630&fit=cover&output=webp`
    });
  }
  /**
   * Load program data from service
   */
  loadProgramData() {
    const dataFetchStart = performance.now();
    try {
      this.http.programas$.pipe(first(), takeUntil(this.destroy$)).subscribe({
        next: (data) => __async(this, null, function* () {
          if (data.length === 0) {
            console.log(`\u23F3 CANAL-COMPLETO - Esperando datos desde HomeComponent...`);
            this.http.programas$.pipe(filter((programs) => programs.length > 0), first(), takeUntil(this.destroy$)).subscribe({
              next: (programs) => {
                console.log(`\u{1F4E6} CANAL-COMPLETO - Datos recibidos`);
                this.performanceMetrics.dataFetchTime = performance.now() - dataFetchStart;
                this.managePrograms(programs);
              },
              error: (error) => this.handleError(error)
            });
          } else {
            console.log(`\u{1F4CB} CANAL-COMPLETO - Usando datos en cache`);
            this.performanceMetrics.dataFetchTime = performance.now() - dataFetchStart;
            this.managePrograms(data);
          }
        }),
        error: (error) => this.handleError(error)
      });
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Change day and reload data
   */
  cambiarDia(dia) {
    return __async(this, null, function* () {
      this.isLoading = true;
      this.diaSeleccionado = this.formatDayName(dia);
      try {
        (yield this.http.getProgramacion(dia)).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => {
            this.http.setProgramas(data, dia).then(() => {
              this.managePrograms(data);
              this.setupMetaTags();
              this.isLoading = false;
              this.cdr.markForCheck();
            });
          },
          error: (error) => {
            this.handleError(error);
            this.isLoading = false;
          }
        });
      } catch (error) {
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }
  /**
   * Process and organize program data
   */
  managePrograms(programas) {
    const renderStart = performance.now();
    try {
      this.svcGuide.setData(programas);
      this.programs = this.svcGuide.getProgramsByChannel(this.canal.replace("-", " "));
      this.program = this.programs.find((programa) => {
        return this.compareDate(programa.start, programa.stop);
      });
      this.live_programs = [];
      for (let program of programas) {
        let liveProgram = program.programs.find((programa) => {
          return this.compareDate(programa.start, programa.stop);
        });
        if (liveProgram && liveProgram.title?.value !== "Cine") {
          this.live_programs.push(liveProgram);
        }
      }
      this.categorias = this.svcGuide.getChannelCategories(this.programs);
      if (this.program?.category?.value) {
        this.categoriaSeleccionada = this.program.category.value.split(",")[0];
      }
      this.organizeTimeSlots();
      this.relatedChannels = this.getRelatedChannelsList();
      if (this.program?.channel_id) {
      } else {
        this.isLoading = false;
      }
      this.performanceMetrics.renderTime = performance.now() - renderStart;
      this.cdr.markForCheck();
    } catch (error) {
      this.handleError(error);
      this.isLoading = false;
    }
  }
  /**
   * Organize programs into time slots (morning, afternoon, evening, night)
   */
  organizeTimeSlots() {
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    const slots = [
      { hour: 6, label: "Ma\xF1ana", range: [6, 12] },
      { hour: 12, label: "Mediod\xEDa", range: [12, 15] },
      { hour: 15, label: "Tarde", range: [15, 18] },
      { hour: 18, label: "Sobremesa", range: [18, 21] },
      { hour: 21, label: "Prime Time", range: [21, 24] },
      { hour: 0, label: "Noche", range: [0, 6] }
    ];
    this.timeSlots = slots.map((slot) => {
      const programs = this.programs.filter((p) => {
        const hour = new Date(p.start).getHours();
        return hour >= slot.range[0] && hour < slot.range[1];
      });
      return {
        hour: slot.hour,
        label: slot.label,
        programs,
        count: programs.length,
        isActive: currentHour >= slot.range[0] && currentHour < slot.range[1]
      };
    });
  }
  /**
   * Get programs for a specific category
   */
  getProgramsByCategory(categoria) {
    return this.svcGuide.getProgramsByCategory(categoria, this.channel.name);
  }
  /**
   * Compare if current time is between start and end dates
   */
  compareDate(dateIni, dateFin) {
    let horaActual = /* @__PURE__ */ new Date();
    horaActual.setHours(horaActual.getHours() + 1);
    const horaInicio = new Date(dateIni);
    const horaFin = new Date(dateFin);
    if (this.diaSeleccionado !== "Hoy") {
      switch (this.diaSeleccionado) {
        case "Ma\xF1ana":
          horaInicio.setDate(horaInicio.getDate() - 1);
          horaFin.setDate(horaFin.getDate() - 1);
          break;
        case "Pasado ma\xF1ana":
          horaInicio.setDate(horaInicio.getDate() - 2);
          horaFin.setDate(horaFin.getDate() - 2);
          break;
        default:
          break;
      }
    }
    return horaActual >= horaInicio && horaActual <= horaFin;
  }
  /**
   * Format time from ISO string
   */
  formatTime(isoString) {
    if (!isoString)
      return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  /**
   * Format channel name from URL parameter
   */
  formatChannelName(query) {
    return query.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  /**
   * Format day name from route parameter
   */
  formatDayName(dia) {
    switch (dia) {
      case "today":
        return "Hoy";
      case "tomorrow":
        return "Ma\xF1ana";
      case "after_tomorrow":
        return "Pasado ma\xF1ana";
      default:
        return "Hoy";
    }
  }
  /**
   * Get icon SVG for category
   */
  getCategoryIcon(categoria) {
    const normalizedCategory = categoria.toLowerCase();
    if (normalizedCategory.includes("pel\xEDcula") || normalizedCategory.includes("cine")) {
      return this.categoryIcons["Pel\xEDculas"];
    } else if (normalizedCategory.includes("serie")) {
      return this.categoryIcons["Series"];
    } else if (normalizedCategory.includes("deporte")) {
      return this.categoryIcons["Deportes"];
    } else if (normalizedCategory.includes("documental")) {
      return this.categoryIcons["Documentales"];
    } else if (normalizedCategory.includes("infantil") || normalizedCategory.includes("ni\xF1os")) {
      return this.categoryIcons["Infantil"];
    } else if (normalizedCategory.includes("noticia") || normalizedCategory.includes("informativo")) {
      return this.categoryIcons["Noticias"];
    } else if (normalizedCategory.includes("entretenimiento") || normalizedCategory.includes("show")) {
      return this.categoryIcons["Entretenimiento"];
    } else if (normalizedCategory.includes("cultura")) {
      return this.categoryIcons["Cultura"];
    }
    return this.categoryIcons["default"];
  }
  /**
   * Get related channels based on current channel
   */
  getRelatedChannelsList() {
    const channelGroups = {
      "La 1": ["La 2", "Antena 3", "Cuatro", "Telecinco", "laSexta"],
      "La 2": ["La 1", "Antena 3", "Cuatro", "Telecinco", "laSexta"],
      "Antena 3": ["La 1", "Cuatro", "Telecinco", "laSexta", "Neox"],
      Cuatro: ["Antena 3", "Telecinco", "laSexta", "FDF", "Energy"],
      Telecinco: ["Antena 3", "Cuatro", "laSexta", "FDF", "Energy"],
      laSexta: ["Antena 3", "Cuatro", "Telecinco", "La 1", "Neox"]
    };
    const currentChannel = this.canal.replace(/-/g, " ");
    const related = channelGroups[currentChannel] || [
      "La 1",
      "Antena 3",
      "Cuatro",
      "Telecinco",
      "laSexta",
      "La 2"
    ];
    return related.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name
    })).slice(0, 6);
  }
  /**
   * Get related channels for display
   */
  getRelatedChannels() {
    return this.relatedChannels;
  }
  /**
   * Scroll to specific time slot
   */
  scrollToTimeSlot(hour) {
    const element = document.getElementById(`time-slot-${hour}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  /**
   * Get programs count for current hour
   */
  getProgramasPorHora() {
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    return this.programs.filter((p) => {
      const hour = new Date(p.start).getHours();
      return hour === currentHour;
    }).length;
  }
  /**
   * Get featured programs count (high rating or popular)
   */
  getProgramasDestacados() {
    return this.programs.filter((p) => {
      return p.starRating && parseFloat(p.starRating) >= 3.5;
    }).length || Math.floor(this.programs.length * 0.3);
  }
  /**
   * Get current date formatted
   */
  getCurrentDate() {
    return (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  /**
   * Get canonical URL
   */
  getCanonicalUrl() {
    return `${window.location.origin}${this.router.url}`;
  }
  /**
   * Handle errors
   */
  handleError(error) {
    console.error("Error in CanalCompletoComponent:", error);
    this.error = "Error al cargar la programaci\xF3n. Por favor, intenta de nuevo.";
    this.isLoading = false;
    this.cdr.markForCheck();
  }
  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    this.performanceMetrics.loadTime = performance.now() - this.componentStartTime;
    if (this.performanceMetrics.loadTime > 0) {
      console.log("\u{1F4CA} Canal Completo Performance:", {
        Total: `${this.performanceMetrics.loadTime.toFixed(2)}ms`,
        "Data Fetch": `${this.performanceMetrics.dataFetchTime.toFixed(2)}ms`,
        Render: `${this.performanceMetrics.renderTime.toFixed(2)}ms`,
        Programs: this.programs.length,
        Categories: this.categorias.length,
        "Time Slots": this.timeSlots.length
      });
      if (this.performanceMetrics.loadTime > 3e3) {
        console.warn("\u26A0\uFE0F Load time exceeds 3s");
      }
    }
  }
};
_CanalCompletoComponent.\u0275fac = function CanalCompletoComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _CanalCompletoComponent)();
};
_CanalCompletoComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CanalCompletoComponent, selectors: [["app-canal-completo"]], viewQuery: function CanalCompletoComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5);
    \u0275\u0275viewQuery(_c1, 5);
    \u0275\u0275viewQuery(_c2, 5);
    \u0275\u0275viewQuery(_c3, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.fullScheduleSlider = _t.first);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.otherChannelsSlider = _t.first);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.timeSlotSliders = _t);
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.categorySliders = _t);
  }
}, decls: 176, vars: 39, consts: [["timeSlotSlider", ""], ["fullScheduleSlider", ""], ["otherChannelsSlider", ""], ["role", "main", 1, "flex-1", "py-4", "sm:py-6", "lg:py-8", "px-4", "sm:px-6", "lg:px-10", "max-w-[100vw]", "overflow-hidden"], ["href", "#main-content", 1, "sr-only", "focus:not-sr-only", "focus:absolute", "focus:top-4", "focus:left-4", "focus:z-50", "focus:px-4", "focus:py-2", "focus:bg-red-600", "focus:text-white", "focus:rounded-lg"], ["aria-labelledby", "hero-heading", 1, "mt-4", "sm:mt-6", "relative", "overflow-hidden", "rounded-xl", "sm:rounded-2xl"], [1, "absolute", "inset-0", "bg-gradient-to-t", "from-gray-900", "via-gray-900/80", "to-transparent", "z-10"], ["class", "block", 3, "data", 4, "ngIf"], [1, "relative", "z-20", "p-4", "sm:p-6", "lg:p-8", "flex", "flex-col", "justify-end", "min-h-[200px]", "sm:min-h-[300px]"], [1, "flex", "items-center", "gap-2", "sm:gap-3", "mb-3"], ["width", "56", "height", "56", "loading", "eager", "fetchpriority", "high", 1, "w-12", "h-12", "sm:w-14", "sm:h-14", "rounded-full", "object-cover", "shadow-lg", "ring-2", "ring-white/20", 3, "src", "alt"], [1, "flex", "items-center", "gap-2", "mb-1"], ["aria-hidden", "true", 1, "live-dot"], [1, "text-xs", "sm:text-sm", "font-semibold", "text-white", "uppercase", "tracking-wide"], ["id", "hero-heading", 1, "text-xl", "sm:text-2xl", "lg:text-3xl", "font-bold", "text-white", "leading-tight"], ["class", "max-w-2xl", 4, "ngIf"], ["aria-labelledby", "stats-heading", 1, "mt-6", "grid", "grid-cols-2", "lg:grid-cols-4", "gap-3", "sm:gap-4"], ["id", "stats-heading", 1, "sr-only"], [1, "stat-card", "stat-card--red"], ["aria-hidden", "true", 1, "stat-card__icon"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-6", "h-6", "sm:w-7", "sm:h-7"], ["d", "M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"], [1, "stat-card__value"], [1, "stat-card__label"], [1, "stat-card", "stat-card--blue"], ["fill-rule", "evenodd", "d", "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z", "clip-rule", "evenodd"], [1, "stat-card", "stat-card--purple"], ["d", "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"], [1, "stat-card", "stat-card--green"], ["fill-rule", "evenodd", "d", "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", "clip-rule", "evenodd"], ["aria-labelledby", "day-navigation-heading", 1, "mt-6", "sm:mt-8", "sticky", "top-0", "z-30", "bg-transparent", "backdrop-blur-lg", "py-3", "sm:py-4", "-mx-4", "sm:-mx-6", "lg:-mx-10", "px-4", "sm:px-6", "lg:px-10", "border-b", "border-transparent", "dark:border-transparent"], ["id", "day-navigation-heading", 1, "sr-only"], ["role", "navigation", "aria-label", "Selecci\xF3n de programaci\xF3n por d\xEDa", 1, "flex", "justify-center", "items-center"], [1, "inline-flex", "rounded-lg", "p-1", "bg-transparent"], ["type", "button", "class", "px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", 3, "ngClass", "click", 4, "ngFor", "ngForOf"], ["id", "main-content"], ["aria-labelledby", "time-slots-heading", 1, "mt-6", "sm:mt-8"], [1, "mb-4", "sm:mb-6"], ["id", "time-slots-heading", 1, "text-xl", "sm:text-2xl", "lg:text-3xl", "font-bold", "text-white", "mb-2"], [1, "text-sm", "sm:text-base", "text-white"], [1, "grid", "grid-cols-2", "sm:grid-cols-3", "lg:grid-cols-6", "gap-3", "sm:gap-4"], ["type", "button", "class", "flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500", 3, "click", 4, "ngFor", "ngForOf"], ["class", "mt-8 sm:mt-10 scroll-mt-24", 3, "id", 4, "ngFor", "ngForOf"], ["aria-labelledby", "categories-heading", 1, "mt-10", "sm:mt-12", "pt-8", "sm:pt-10", "border-t", "border-gray-200", "dark:border-gray-700"], [1, "mb-6", "sm:mb-8"], ["id", "categories-heading", 1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-white", "mb-3"], [1, "text-sm", "sm:text-base", "text-white", "max-w-3xl"], [1, "space-y-8", "sm:space-y-10"], ["class", "scroll-mt-24", 4, "ngFor", "ngForOf"], ["aria-labelledby", "full-schedule-heading", 1, "mt-10", "sm:mt-12", "pt-8", "sm:pt-10", "border-t", "border-gray-200", "dark:border-gray-700"], [1, "flex", "flex-col", "sm:flex-row", "items-start", "sm:items-center", "justify-between", "gap-3", "mb-6"], ["id", "full-schedule-heading", 1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-white", "mb-2"], [1, "text-sm", "sm:text-base", "text-gray-200"], ["aria-label", "Navegaci\xF3n parrilla completa", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver programas anteriores", 1, "w-10", "h-10", "rounded-full", "border", "border-gray-300", "dark:border-gray-600", "p-2", "hover:border-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "transition-all", "duration-300", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "w-full", "h-full", "fill-current"], ["d", "M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"], ["type", "button", "aria-label", "Ver m\xE1s programas", 1, "w-10", "h-10", "rounded-full", "border", "border-gray-300", "dark:border-gray-600", "p-2", "hover:border-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "transition-all", "duration-300", 3, "click"], ["d", "M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"], [1, "relative"], ["variant", "canales", 3, "programas", "logo", 4, "ngIf"], ["aria-labelledby", "other-channels-heading", 1, "mt-10", "sm:mt-12", "pt-8", "sm:pt-10", "border-t", "border-gray-200", "dark:border-gray-700"], [1, "flex", "items-center", "gap-3"], [1, "w-12", "h-12", "sm:w-14", "sm:h-14", "rounded-full", "bg-gradient-to-br", "from-red-500", "to-red-700", "flex", "items-center", "justify-center", "shadow-lg"], ["fill", "currentColor", "viewBox", "0 0 24 24", 1, "w-6", "h-6", "sm:w-7", "sm:h-7", "text-white"], ["d", "M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"], ["id", "other-channels-heading", 1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-white"], [1, "text-sm", "sm:text-base", "text-gray-200", "mt-1"], ["aria-label", "Navegaci\xF3n otros canales", 1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", "aria-label", "Ver canales anteriores", 1, "w-10", "h-10", "rounded-full", "border", "border-gray-300", "dark:border-gray-600", "p-2", "hover:border-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "transition-all", "duration-300", 3, "click"], ["type", "button", "aria-label", "Ver m\xE1s canales", 1, "w-10", "h-10", "rounded-full", "border", "border-gray-300", "dark:border-gray-600", "p-2", "hover:border-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "transition-all", "duration-300", 3, "click"], ["variant", "canales", 3, "programas", 4, "ngIf"], ["class", "text-center py-12 text-gray-200", 4, "ngIf"], ["aria-labelledby", "seo-content-heading", 1, "mt-10", "sm:mt-12", "pt-8", "sm:pt-10", "border-t", "border-gray-200", "dark:border-gray-700"], [1, "prose", "prose-sm", "sm:prose-base", "lg:prose-lg", "dark:prose-invert", "max-w-none"], ["id", "seo-content-heading", 1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-white", "mb-4"], [1, "space-y-4", "text-white", "leading-relaxed"], [1, "text-xl", "sm:text-2xl", "font-bold", "text-white", "mt-8", "mb-4"], [1, "list-disc", "list-inside", "space-y-2", "ml-4"], [4, "ngFor", "ngForOf"], [1, "text-xl", "sm:text-2xl", "font-bold", "text-gray-900", "dark:text-white", "mt-8", "mb-4"], [1, "text-sm", "text-white", "mt-6"], ["aria-labelledby", "related-channels-heading", 1, "mt-10", "sm:mt-12", "pt-8", "sm:pt-10", "border-t", "border-gray-200", "dark:border-gray-700", "pb-8"], [1, "mb-6"], ["id", "related-channels-heading", 1, "text-2xl", "sm:text-3xl", "font-bold", "text-white", "mb-2"], [1, "grid", "grid-cols-2", "sm:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-6", "gap-3", "sm:gap-4"], ["class", "group flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500", 3, "routerLink", 4, "ngFor", "ngForOf"], [1, "block", 3, "data"], [1, "max-w-2xl"], [1, "text-base", "sm:text-lg", "lg:text-xl", "font-semibold", "text-white", "mb-2"], [1, "flex", "flex-wrap", "items-center", "gap-2", "sm:gap-3", "text-xs", "sm:text-sm", "text-white"], [4, "ngIf"], ["class", "flex items-center gap-1", 4, "ngIf"], [1, "flex", "items-center", "gap-1"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-4", "h-4"], ["type", "button", 1, "px-4", "sm:px-6", "py-2", "sm:py-2.5", "rounded-full", "text-sm", "sm:text-base", "font-medium", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "focus:ring-offset-2", "dark:focus:ring-offset-gray-900", 3, "click", "ngClass"], ["type", "button", 1, "flex", "flex-col", "items-center", "justify-center", "p-4", "sm:p-5", "rounded-xl", "border-2", "transition-all", "duration-300", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-6", "h-6", "sm:w-8", "sm:h-8", "mb-2"], [1, "text-xs", "sm:text-sm", "font-semibold"], [1, "text-xs", "text-white", "mt-1"], [1, "mt-8", "sm:mt-10", "scroll-mt-24", 3, "id"], [1, "flex", "flex-col", "sm:flex-row", "items-start", "sm:items-center", "justify-between", "gap-3", "mb-4", "sm:mb-6"], [1, "text-lg", "sm:text-xl", "font-bold", "text-white"], [1, "text-lg", "sm:text-xl", "lg:text-2xl", "font-bold", "text-white", 3, "id"], [1, "text-xs", "sm:text-sm", "text-white"], [1, "hidden", "sm:flex", "items-center", "gap-2"], ["type", "button", 1, "w-10", "h-10", "rounded-full", "border", "border-gray-300", "dark:border-gray-600", "p-2", "hover:border-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "transition-all", "duration-300", 3, "click"], ["class", "text-center py-8 text-white", 4, "ngIf"], ["variant", "canales", 3, "programas", "logo"], [1, "text-center", "py-8", "text-white"], [1, "scroll-mt-24"], [1, "flex", "flex-col", "sm:flex-row", "items-start", "sm:items-center", "justify-between", "gap-3", "mb-4"], [1, "w-10", "h-10", "sm:w-12", "sm:h-12", "rounded-lg", "bg-gradient-to-br", "from-gray-700", "to-gray-900", "dark:from-gray-600", "dark:to-gray-800", "flex", "items-center", "justify-center", "shadow-md"], [1, "w-5", "h-5", "sm:w-6", "sm:h-6", "text-white", 3, "innerHTML"], ["variant", "canales", 3, "programas"], [1, "text-center", "py-12", "text-gray-200"], [1, "group", "flex", "flex-col", "items-center", "p-4", "rounded-xl", "border-2", "border-gray-200", "dark:border-gray-700", "hover:border-red-500", "hover:bg-red-50", "dark:hover:bg-red-900/20", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "routerLink"], ["width", "64", "height", "64", "loading", "lazy", 1, "w-12", "h-12", "sm:w-16", "sm:h-16", "rounded-full", "object-cover", "shadow-md", "group-hover:scale-110", "transition-transform", "duration-300", 3, "src", "alt"], [1, "mt-3", "text-xs", "sm:text-sm", "font-semibold", "text-white", "text-center"]], template: function CanalCompletoComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 3)(1, "a", 4);
    \u0275\u0275text(2, " Saltar al contenido principal ");
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "app-nav-bar");
    \u0275\u0275elementStart(4, "section", 5);
    \u0275\u0275element(5, "div", 6);
    \u0275\u0275template(6, CanalCompletoComponent_app_banner_6_Template, 1, 1, "app-banner", 7);
    \u0275\u0275elementStart(7, "div", 8)(8, "div", 9);
    \u0275\u0275element(9, "img", 10);
    \u0275\u0275elementStart(10, "div")(11, "div", 11);
    \u0275\u0275element(12, "span", 12);
    \u0275\u0275elementStart(13, "span", 13);
    \u0275\u0275text(14, " En Directo ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "h1", 14);
    \u0275\u0275text(16);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(17, CanalCompletoComponent_div_17_Template, 6, 3, "div", 15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "section", 16)(19, "h2", 17);
    \u0275\u0275text(20, "Estad\xEDsticas del canal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 18)(22, "div", 19);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(23, "svg", 20);
    \u0275\u0275element(24, "path", 21);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(25, "p", 22);
    \u0275\u0275text(26);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "p", 23);
    \u0275\u0275text(28, "Programas hoy");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "div", 24)(30, "div", 19);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(31, "svg", 20);
    \u0275\u0275element(32, "path", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(33, "p", 22);
    \u0275\u0275text(34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(35, "p", 23);
    \u0275\u0275text(36, "Esta hora");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(37, "div", 26)(38, "div", 19);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(39, "svg", 20);
    \u0275\u0275element(40, "path", 27);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(41, "p", 22);
    \u0275\u0275text(42);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(43, "p", 23);
    \u0275\u0275text(44, "Categor\xEDas");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(45, "div", 28)(46, "div", 19);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(47, "svg", 20);
    \u0275\u0275element(48, "path", 29);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(49, "p", 22);
    \u0275\u0275text(50);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(51, "p", 23);
    \u0275\u0275text(52, "Destacados");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(53, "section", 30)(54, "h2", 31);
    \u0275\u0275text(55, "Selecci\xF3n de d\xEDa");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(56, "nav", 32)(57, "div", 33);
    \u0275\u0275template(58, CanalCompletoComponent_button_58_Template, 2, 4, "button", 34);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(59, "div", 35)(60, "section", 36)(61, "header", 37)(62, "h2", 38);
    \u0275\u0275text(63, " Programaci\xF3n por franjas horarias ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(64, "p", 39);
    \u0275\u0275text(65);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(66, "div", 40);
    \u0275\u0275template(67, CanalCompletoComponent_button_67_Template, 7, 3, "button", 41);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(68, CanalCompletoComponent_section_68_Template, 21, 12, "section", 42);
    \u0275\u0275elementStart(69, "section", 43)(70, "header", 44)(71, "h2", 45);
    \u0275\u0275text(72, " Explora por categor\xEDas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(73, "p", 46);
    \u0275\u0275text(74);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(75, "div", 47);
    \u0275\u0275template(76, CanalCompletoComponent_article_76_Template, 19, 9, "article", 48);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(77, "section", 49)(78, "header", 50)(79, "div")(80, "h2", 51);
    \u0275\u0275text(81);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(82, "p", 52);
    \u0275\u0275text(83);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(84, "nav", 53)(85, "button", 54);
    \u0275\u0275listener("click", function CanalCompletoComponent_Template_button_click_85_listener() {
      return ctx.fullScheduleSlider == null ? null : ctx.fullScheduleSlider.prev();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(86, "svg", 55);
    \u0275\u0275element(87, "path", 56);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(88, "button", 57);
    \u0275\u0275listener("click", function CanalCompletoComponent_Template_button_click_88_listener() {
      return ctx.fullScheduleSlider == null ? null : ctx.fullScheduleSlider.next();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(89, "svg", 55);
    \u0275\u0275element(90, "path", 58);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(91, "div", 59);
    \u0275\u0275template(92, CanalCompletoComponent_app_slider_92_Template, 2, 2, "app-slider", 60);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(93, "section", 61)(94, "header", 50)(95, "div", 62)(96, "div", 63);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(97, "svg", 64);
    \u0275\u0275element(98, "path", 65);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(99, "div")(100, "h2", 66);
    \u0275\u0275text(101, " Ahora en otros canales ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(102, "p", 67);
    \u0275\u0275text(103, " Descubre qu\xE9 est\xE1 emitiendo el resto de la televisi\xF3n en este momento ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(104, "nav", 68)(105, "button", 69);
    \u0275\u0275listener("click", function CanalCompletoComponent_Template_button_click_105_listener() {
      return ctx.otherChannelsSlider == null ? null : ctx.otherChannelsSlider.prev();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(106, "svg", 55);
    \u0275\u0275element(107, "path", 56);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(108, "button", 70);
    \u0275\u0275listener("click", function CanalCompletoComponent_Template_button_click_108_listener() {
      return ctx.otherChannelsSlider == null ? null : ctx.otherChannelsSlider.next();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(109, "svg", 55);
    \u0275\u0275element(110, "path", 58);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(111, "div", 59);
    \u0275\u0275template(112, CanalCompletoComponent_app_slider_112_Template, 2, 1, "app-slider", 71)(113, CanalCompletoComponent_p_113_Template, 2, 0, "p", 72);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(114, "section", 73)(115, "article", 74)(116, "h2", 75);
    \u0275\u0275text(117);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(118, "div", 76)(119, "p");
    \u0275\u0275text(120, " Descubre la ");
    \u0275\u0275elementStart(121, "strong");
    \u0275\u0275text(122);
    \u0275\u0275elementEnd();
    \u0275\u0275text(123, " con nuestra gu\xEDa actualizada en tiempo real. Consulta todos los programas, series, pel\xEDculas y documentales que se emiten en uno de los canales m\xE1s populares de la televisi\xF3n espa\xF1ola. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(124, "p");
    \u0275\u0275text(125);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(126, "h3", 77);
    \u0275\u0275text(127);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(128, "p");
    \u0275\u0275text(129);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(130, "ul", 78);
    \u0275\u0275template(131, CanalCompletoComponent_li_131_Template, 4, 2, "li", 79);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(132, "h3", 80);
    \u0275\u0275text(133);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(134, "p");
    \u0275\u0275text(135);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(136, "p");
    \u0275\u0275text(137, " Con ");
    \u0275\u0275elementStart(138, "strong");
    \u0275\u0275text(139);
    \u0275\u0275elementEnd();
    \u0275\u0275text(140);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(141, "h3", 80);
    \u0275\u0275text(142, " C\xF3mo usar nuestra gu\xEDa de programaci\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(143, "p");
    \u0275\u0275text(144);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(145, "ul", 78)(146, "li")(147, "strong");
    \u0275\u0275text(148, "Franjas horarias");
    \u0275\u0275elementEnd();
    \u0275\u0275text(149, ": Encuentra programas por ma\xF1ana, tarde, noche o madrugada ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(150, "li")(151, "strong");
    \u0275\u0275text(152, "Categor\xEDas");
    \u0275\u0275elementEnd();
    \u0275\u0275text(153, ": Explora contenido espec\xEDfico como pel\xEDculas, series o deportes ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(154, "li")(155, "strong");
    \u0275\u0275text(156, "Parrilla completa");
    \u0275\u0275elementEnd();
    \u0275\u0275text(157, ": Consulta todos los programas ordenados cronol\xF3gicamente ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(158, "li")(159, "strong");
    \u0275\u0275text(160, "En directo");
    \u0275\u0275elementEnd();
    \u0275\u0275text(161);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(162, "h3", 80);
    \u0275\u0275text(163, " Informaci\xF3n actualizada en tiempo real ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(164, "p");
    \u0275\u0275text(165);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(166, "p", 81);
    \u0275\u0275text(167);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(168, "section", 82)(169, "header", 83)(170, "h2", 84);
    \u0275\u0275text(171, " Otros canales que te pueden interesar ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(172, "p", 39);
    \u0275\u0275text(173, " Explora la programaci\xF3n de canales similares ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(174, "div", 85);
    \u0275\u0275template(175, CanalCompletoComponent_a_175_Template, 4, 7, "a", 86);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(6);
    \u0275\u0275property("ngIf", ctx.program);
    \u0275\u0275advance(3);
    \u0275\u0275property("src", "https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/" + (ctx.program == null ? null : ctx.program.channel) + ".png&w=56&h=56&fit=cover&output=webp", \u0275\u0275sanitizeUrl)("alt", "Logo de " + ctx.canal);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" ", ctx.canal, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.program);
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate(ctx.programs.length);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx.getProgramasPorHora());
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx.categorias.length);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx.getProgramasDestacados());
    \u0275\u0275advance(8);
    \u0275\u0275property("ngForOf", ctx.days);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" Encuentra r\xE1pidamente qu\xE9 ver en ", ctx.canal, " seg\xFAn la hora del d\xEDa ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx.timeSlots);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx.timeSlots);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" Descubre toda la variedad de contenido que ofrece ", ctx.canal, ". Desde pel\xEDculas y series hasta documentales, deportes y programas infantiles. ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx.categorias);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" Parrilla completa ", ctx.diaSeleccionado.toLowerCase(), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Todos los programas de ", ctx.canal, " ordenados cronol\xF3gicamente ");
    \u0275\u0275advance(9);
    \u0275\u0275property("ngIf", ctx.programs.length > 0);
    \u0275\u0275advance(20);
    \u0275\u0275property("ngIf", ctx.live_programs.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.live_programs.length === 0);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate2(" Toda la programaci\xF3n de ", ctx.canal, " ", ctx.diaSeleccionado.toLowerCase(), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2("programaci\xF3n completa de ", ctx.canal, " ", ctx.diaSeleccionado.toLowerCase());
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" En esta p\xE1gina encontrar\xE1s informaci\xF3n detallada sobre qu\xE9 ver en ", ctx.canal, ", incluyendo horarios exactos, sinopsis de cada programa y recomendaciones personalizadas. Nuestra gu\xEDa TV te permite planificar tu d\xEDa y no perderte ninguno de tus programas favoritos. ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" \xBFQu\xE9 puedes ver en ", ctx.canal, " ", ctx.diaSeleccionado.toLowerCase(), "? ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx.canal, " ofrece una programaci\xF3n variada que incluye:");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx.categorias.slice(0, 6));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Programaci\xF3n destacada de ", ctx.canal, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Entre los programas m\xE1s populares que puedes disfrutar en ", ctx.canal, " se encuentran producciones de alta calidad que abarcan entretenimiento, informaci\xF3n, cultura y mucho m\xE1s. Nuestro sistema actualiza la informaci\xF3n cada hora para ofrecerte siempre los datos m\xE1s precisos. ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx.programs.length, " programas");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" programados para ", ctx.diaSeleccionado.toLowerCase(), ", ", ctx.canal, " te ofrece opciones para cada momento del d\xEDa, desde el desayuno hasta la madrugada. Utiliza nuestra navegaci\xF3n por franjas horarias para encontrar r\xE1pidamente lo que buscas. ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" Navega f\xE1cilmente por la programaci\xF3n de ", ctx.canal, " usando nuestras diferentes secciones: ");
    \u0275\u0275advance(17);
    \u0275\u0275textInterpolate1(": Descubre qu\xE9 se est\xE1 emitiendo ahora en ", ctx.canal, " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" Nuestra gu\xEDa de programaci\xF3n de ", ctx.canal, " se actualiza constantemente para garantizar que siempre tengas acceso a la informaci\xF3n m\xE1s reciente. Consulta tambi\xE9n qu\xE9 se emite ma\xF1ana o pasado ma\xF1ana para planificar tu semana de televisi\xF3n. ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" \xDAltima actualizaci\xF3n: ", ctx.getCurrentDate(), " ");
    \u0275\u0275advance(8);
    \u0275\u0275property("ngForOf", ctx.getRelatedChannels());
  }
}, dependencies: [
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  SliderComponent,
  BannerComponent,
  NavBarComponent,
  RouterModule,
  RouterLink
], styles: ['\n\n.live-dot[_ngcontent-%COMP%] {\n  height: 10px;\n  width: 10px;\n  background-color: #ef4444;\n  border-radius: 50%;\n  display: inline-block;\n  position: relative;\n  animation: _ngcontent-%COMP%_pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n}\n.live-dot[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 100%;\n  height: 100%;\n  border-radius: 50%;\n  background-color: #ef4444;\n  animation: _ngcontent-%COMP%_pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n}\n@media (prefers-reduced-motion: reduce) {\n  .live-dot[_ngcontent-%COMP%] {\n    animation: none;\n    box-shadow: none;\n  }\n  .live-dot[_ngcontent-%COMP%]::before {\n    display: none;\n  }\n}\n@keyframes _ngcontent-%COMP%_pulse-dot {\n  0%, 100% {\n    opacity: 1;\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n  }\n  50% {\n    opacity: 0.7;\n    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);\n  }\n}\n@keyframes _ngcontent-%COMP%_pulse-ring {\n  0% {\n    transform: translate(-50%, -50%) scale(1);\n    opacity: 0.8;\n  }\n  100% {\n    transform: translate(-50%, -50%) scale(2.5);\n    opacity: 0;\n  }\n}\nmain[_ngcontent-%COMP%] {\n  font-family:\n    "Montserrat",\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    sans-serif;\n  animation: _ngcontent-%COMP%_fadeIn 0.4s ease-out;\n  contain: layout style;\n}\n@media (min-width: 1024px) {\n  main[_ngcontent-%COMP%] {\n    contain: layout style paint;\n  }\n}\nsection[_ngcontent-%COMP%] {\n  contain: layout style;\n  content-visibility: auto;\n  contain-intrinsic-size: auto 500px;\n  scroll-margin-top: 5rem;\n}\n@media (prefers-reduced-motion: reduce) {\n  section[_ngcontent-%COMP%] {\n    animation: none;\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\nsection[aria-labelledby=hero-heading][_ngcontent-%COMP%] {\n  position: relative;\n}\nsection[aria-labelledby=hero-heading][_ngcontent-%COMP%]   .absolute.inset-0[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      to top,\n      rgba(17, 24, 39, 0.98) 0%,\n      rgba(17, 24, 39, 0.85) 40%,\n      rgba(17, 24, 39, 0.5) 70%,\n      transparent 100%);\n}\nsection[aria-labelledby=hero-heading][_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \nsection[aria-labelledby=hero-heading][_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);\n}\n[class*=bg-gradient-to-br][_ngcontent-%COMP%] {\n  position: relative;\n  overflow: hidden;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1);\n  transition:\n    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    color 0.15s ease;\n  color: #fff !important;\n}\n@media (hover: hover) {\n  [class*=bg-gradient-to-br][_ngcontent-%COMP%]:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);\n  }\n}\n[class*=bg-gradient-to-br][_ngcontent-%COMP%]::after {\n  content: "";\n  position: absolute;\n  top: -50%;\n  right: -50%;\n  bottom: -50%;\n  left: -50%;\n  background:\n    linear-gradient(\n      45deg,\n      transparent 30%,\n      rgba(255, 255, 255, 0.1) 50%,\n      transparent 70%);\n  transform: translateX(-100%) translateY(-100%) rotate(45deg);\n  transition: transform 0.6s ease;\n}\n@media (hover: hover) {\n  [class*=bg-gradient-to-br][_ngcontent-%COMP%]:hover::after {\n    transform: translateX(100%) translateY(100%) rotate(45deg);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  [class*=bg-gradient-to-br][_ngcontent-%COMP%] {\n    transition: none;\n  }\n  [class*=bg-gradient-to-br][_ngcontent-%COMP%]::after {\n    display: none;\n  }\n}\n[class*=bg-gradient-to-br][_ngcontent-%COMP%]   .text-2xl[_ngcontent-%COMP%], \n[class*=bg-gradient-to-br][_ngcontent-%COMP%]   .text-3xl[_ngcontent-%COMP%] {\n  color: #fff !important;\n  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);\n}\n.stat-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 0.35rem;\n  padding: 1rem 1.25rem;\n  border-radius: 0.75rem;\n  min-width: 180px;\n  transition: transform 0.18s ease, box-shadow 0.18s ease;\n}\n.stat-card[_ngcontent-%COMP%]   .stat-card__icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 2rem;\n  height: 2rem;\n  border-radius: 0.5rem;\n  background: rgba(255, 255, 255, 0.03);\n  color: #fff;\n}\n.stat-card[_ngcontent-%COMP%]   .stat-card__value[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  font-weight: 800;\n  color: #fff;\n  margin: 0;\n}\n.stat-card[_ngcontent-%COMP%]   .stat-card__label[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.85);\n  margin: 0;\n}\n.stat-card[_ngcontent-%COMP%]:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);\n}\n.stat-card--red[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.12),\n      rgba(220, 38, 38, 0.04));\n  border: 1px solid rgba(220, 38, 38, 0.08);\n}\n.stat-card--blue[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(59, 130, 246, 0.12),\n      rgba(59, 130, 246, 0.04));\n  border: 1px solid rgba(59, 130, 246, 0.08);\n}\n.stat-card--purple[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(139, 92, 246, 0.12),\n      rgba(139, 92, 246, 0.04));\n  border: 1px solid rgba(139, 92, 246, 0.08);\n}\n.stat-card--green[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(34, 197, 94, 0.12),\n      rgba(34, 197, 94, 0.04));\n  border: 1px solid rgba(34, 197, 94, 0.08);\n}\nsection[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%] {\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nsection[aria-labelledby=day-navigation-heading].scrolled[_ngcontent-%COMP%] {\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1);\n}\nsection[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  font-family: "Montserrat", sans-serif;\n  font-weight: 500;\n  letter-spacing: 0.01em;\n  padding: 0.45rem 0.9rem;\n  border-radius: 9999px;\n  border: 1px solid rgba(0, 0, 0, 0.06);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  color: #111827;\n}\n@media (prefers-color-scheme: dark) {\n  section[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n    background: rgba(255, 255, 255, 0.02);\n    color: #f8fafc;\n    border: 1px solid rgba(255, 255, 255, 0.04);\n  }\n}\nsection[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%]   button[class*=bg-red-600][_ngcontent-%COMP%], \nsection[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%], \nsection[aria-labelledby=day-navigation-heading][_ngcontent-%COMP%]   button[aria-pressed=true][_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #dc2626 0%,\n      #991b1b 100%);\n  color: white !important;\n  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.28);\n  border-color: rgba(220, 38, 38, 0.25);\n}\nbutton[_ngcontent-%COMP%], \na[_ngcontent-%COMP%] {\n  font-family: "Montserrat", sans-serif;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n  -webkit-font-smoothing: antialiased;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  button[_ngcontent-%COMP%]:hover, \n   a[_ngcontent-%COMP%]:hover {\n    transform: translateY(-1px) translateZ(0);\n  }\n}\nbutton[_ngcontent-%COMP%]:active, \na[_ngcontent-%COMP%]:active {\n  transform: translateY(0) translateZ(0);\n}\n@media (prefers-reduced-motion: reduce) {\n  button[_ngcontent-%COMP%], \n   a[_ngcontent-%COMP%] {\n    transition: none;\n    transform: none !important;\n  }\n}\nbutton[class*=rounded-full][_ngcontent-%COMP%] {\n  position: relative;\n  overflow: hidden;\n}\nbutton[class*=rounded-full][_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 0;\n  height: 0;\n  border-radius: 50%;\n  background: rgba(239, 68, 68, 0.15);\n  transform: translate(-50%, -50%);\n  transition: width 0.4s ease, height 0.4s ease;\n}\n@media (hover: hover) {\n  button[class*=rounded-full][_ngcontent-%COMP%]:hover::before {\n    width: 180%;\n    height: 180%;\n  }\n}\nbutton[class*=rounded-full][_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  position: relative;\n  z-index: 1;\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  button[class*=rounded-full][_ngcontent-%COMP%]:hover   svg[_ngcontent-%COMP%] {\n    transform: scale(1.15);\n  }\n}\nbutton[class*=rounded-xl][class*=border-2][_ngcontent-%COMP%] {\n  border-color: rgba(229, 231, 235, 0.3);\n  background: rgba(255, 255, 255, 0.02);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-color-scheme: dark) {\n  button[class*=rounded-xl][class*=border-2][_ngcontent-%COMP%] {\n    border-color: rgba(55, 65, 81, 0.4);\n    background: rgba(255, 255, 255, 0.03);\n  }\n}\n@media (prefers-color-scheme: light) {\n  button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%] {\n  }\n  button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h1[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h2[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h3[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h4[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h5[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   h6[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%], \n   button[class*=rounded-xl][class*=border-2]   [_nghost-%COMP%]   *[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%] {\n    color: #0f172a !important;\n  }\n}\nbutton[class*=rounded-xl][class*=border-2][class*=border-red-600][_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.15) 0%,\n      rgba(220, 38, 38, 0.05) 100%);\n  border-color: #dc2626;\n  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);\n}\n@media (hover: hover) {\n  button[class*=rounded-xl][class*=border-2][_ngcontent-%COMP%]:hover {\n    background:\n      linear-gradient(\n        135deg,\n        rgba(239, 68, 68, 0.1) 0%,\n        rgba(239, 68, 68, 0.05) 100%);\n    border-color: #ef4444;\n    transform: translateY(-2px);\n    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.2);\n  }\n}\nh1[_ngcontent-%COMP%], \nh2[_ngcontent-%COMP%], \nh3[_ngcontent-%COMP%], \nh4[_ngcontent-%COMP%], \nh5[_ngcontent-%COMP%], \nh6[_ngcontent-%COMP%] {\n  font-family: "Montserrat", sans-serif;\n  font-weight: 700;\n  line-height: 1.25;\n  letter-spacing: -0.02em;\n  text-rendering: optimizeLegibility;\n  color: #ffffff;\n}\n@media (prefers-color-scheme: light) {\n  h1[_ngcontent-%COMP%], \n   h2[_ngcontent-%COMP%], \n   h3[_ngcontent-%COMP%], \n   h4[_ngcontent-%COMP%], \n   h5[_ngcontent-%COMP%], \n   h6[_ngcontent-%COMP%] {\n    color: #0f172a;\n  }\n}\nh1[_ngcontent-%COMP%] {\n  font-size: clamp(1.5rem, 4vw + 1rem, 2.5rem);\n  font-weight: 800;\n}\nh2[_ngcontent-%COMP%] {\n  font-size: clamp(1.25rem, 3vw + 0.5rem, 2rem);\n  font-weight: 700;\n}\nh3[_ngcontent-%COMP%] {\n  font-size: clamp(1.125rem, 2vw + 0.5rem, 1.5rem);\n  font-weight: 600;\n}\np[_ngcontent-%COMP%], \nspan[_ngcontent-%COMP%], \ndiv[_ngcontent-%COMP%] {\n  font-family: "Montserrat", sans-serif;\n  line-height: 1.6;\n}\np[class*=text-gray-300][_ngcontent-%COMP%], \nspan[class*=text-gray-300][_ngcontent-%COMP%], \ndiv[class*=text-gray-300][_ngcontent-%COMP%] {\n  color: #e5e7eb;\n}\np[class*=text-gray-400][_ngcontent-%COMP%], \nspan[class*=text-gray-400][_ngcontent-%COMP%], \ndiv[class*=text-gray-400][_ngcontent-%COMP%] {\n  color: #9ca3af;\n}\np[class*=text-gray-500][_ngcontent-%COMP%], \np[class*=text-gray-600][_ngcontent-%COMP%], \nspan[class*=text-gray-500][_ngcontent-%COMP%], \nspan[class*=text-gray-600][_ngcontent-%COMP%], \ndiv[class*=text-gray-500][_ngcontent-%COMP%], \ndiv[class*=text-gray-600][_ngcontent-%COMP%] {\n  color: #374151;\n}\n@media (prefers-color-scheme: dark) {\n  p[class*=text-gray-500][_ngcontent-%COMP%], \n   p[class*=text-gray-600][_ngcontent-%COMP%], \n   span[class*=text-gray-500][_ngcontent-%COMP%], \n   span[class*=text-gray-600][_ngcontent-%COMP%], \n   div[class*=text-gray-500][_ngcontent-%COMP%], \n   div[class*=text-gray-600][_ngcontent-%COMP%] {\n    color: #d1d5db;\n  }\n}\np.text-xs[_ngcontent-%COMP%], \np.text-sm[_ngcontent-%COMP%], \nspan.text-xs[_ngcontent-%COMP%], \nspan.text-sm[_ngcontent-%COMP%], \ndiv.text-xs[_ngcontent-%COMP%], \ndiv.text-sm[_ngcontent-%COMP%] {\n  color: #6b7280;\n}\n@media (prefers-color-scheme: dark) {\n  p.text-xs[_ngcontent-%COMP%], \n   p.text-sm[_ngcontent-%COMP%], \n   span.text-xs[_ngcontent-%COMP%], \n   span.text-sm[_ngcontent-%COMP%], \n   div.text-xs[_ngcontent-%COMP%], \n   div.text-sm[_ngcontent-%COMP%] {\n    color: #c7cbd1;\n  }\n}\n[_nghost-%COMP%], \nmain[_ngcontent-%COMP%], \n#main-content[_ngcontent-%COMP%] {\n}\n@media (prefers-color-scheme: light) {\n  [_nghost-%COMP%], \n   main[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%] {\n    color: #0f172a;\n  }\n  [_nghost-%COMP%]   h1[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h2[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h3[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h4[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h5[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h6[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   strong[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n    color: #0f172a !important;\n  }\n  [_nghost-%COMP%]   [class*=text-gray-900][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-gray-800][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-gray-700][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-gray-600][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-gray-900][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-gray-800][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-gray-700][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-gray-600][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-gray-900][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-gray-800][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-gray-700][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-gray-600][_ngcontent-%COMP%] {\n    color: #0f172a !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  [_nghost-%COMP%], \n   main[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%] {\n    color: #fff6f5;\n  }\n  [_nghost-%COMP%]   h1[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h2[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h3[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h4[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h5[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   h6[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%] {\n    color: #fff6f5 !important;\n  }\n  [_nghost-%COMP%]   [class*=text-gray-][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-blue-][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-green-][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-purple-][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-slate-][_ngcontent-%COMP%], \n   [_nghost-%COMP%]   [class*=text-cool-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-gray-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-blue-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-green-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-purple-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-slate-][_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   [class*=text-cool-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-gray-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-blue-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-green-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-purple-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-slate-][_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   [class*=text-cool-][_ngcontent-%COMP%] {\n    color: #efe6e4 !important;\n  }\n  [_nghost-%COMP%]   a[_ngcontent-%COMP%], \n   [_nghost-%COMP%]   a[_ngcontent-%COMP%]:link, \n   [_nghost-%COMP%]   a[_ngcontent-%COMP%]:visited, \n   main[_ngcontent-%COMP%]   a[_ngcontent-%COMP%], \n   main[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:link, \n   main[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:visited, \n   #main-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:link, \n   #main-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:visited {\n    color: #ef4444 !important;\n  }\n  [_nghost-%COMP%]   a[_ngcontent-%COMP%]:hover, \n   main[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover, \n   #main-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n    color: rgb(242.2157635468, 105.5842364532, 105.5842364532) !important;\n  }\n}\n.text-xs[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  line-height: 1.5;\n}\n.text-sm[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\nimg[_ngcontent-%COMP%] {\n  display: block;\n  image-rendering: -webkit-optimize-contrast;\n  image-rendering: crisp-edges;\n  transform: translateZ(0);\n  user-drag: none;\n  -webkit-user-drag: none;\n  -webkit-user-select: none;\n  user-select: none;\n}\nimg[class*=rounded-full][_ngcontent-%COMP%] {\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  img[class*=rounded-full][_ngcontent-%COMP%]:hover {\n    transform: scale(1.08) translateZ(0);\n    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);\n  }\n}\nimg[class*=ring-2][_ngcontent-%COMP%] {\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);\n}\nsvg[_ngcontent-%COMP%] {\n  display: block;\n  transform: translateZ(0);\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), fill 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-reduced-motion: reduce) {\n  svg[_ngcontent-%COMP%] {\n    transition: none;\n  }\n}\narticle[class*=scroll-mt-24][_ngcontent-%COMP%]    > header[_ngcontent-%COMP%] {\n  margin-bottom: 1.5rem;\n}\narticle[class*=scroll-mt-24][_ngcontent-%COMP%]    > header[_ngcontent-%COMP%]   .rounded-lg[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #374151 0%,\n      #1f2937 100%);\n  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.2);\n}\n@media (prefers-color-scheme: dark) {\n  article[class*=scroll-mt-24][_ngcontent-%COMP%]    > header[_ngcontent-%COMP%]   .rounded-lg[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        135deg,\n        #4b5563 0%,\n        #374151 100%);\n  }\n}\n.bg-gradient-to-br.from-red-500.to-red-700[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444 0%,\n      #991b1b 100%);\n  box-shadow: 0 4px 12px -2px rgba(220, 38, 38, 0.4);\n}\n.prose[_ngcontent-%COMP%] {\n  font-family: "Montserrat", sans-serif;\n}\n.prose[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin-bottom: 1.25em;\n  line-height: 1.75;\n  color: #d1d5db;\n}\n@media (prefers-color-scheme: light) {\n  .prose[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n    color: #374151;\n  }\n}\n.prose[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%] {\n  margin-top: 1.25em;\n  margin-bottom: 1.25em;\n  padding-left: 1.75em;\n}\n.prose[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  margin-top: 0.75em;\n  margin-bottom: 0.75em;\n  line-height: 1.75;\n  color: #d1d5db;\n}\n@media (prefers-color-scheme: light) {\n  .prose[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n    color: #374151;\n  }\n}\n.prose[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]::marker {\n  color: #ef4444;\n}\n.prose[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #ef4444;\n}\n@media (prefers-color-scheme: light) {\n  .prose[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n    color: #dc2626;\n  }\n}\n.prose[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin-top: 2em;\n  margin-bottom: 1em;\n  font-weight: 700;\n}\n[role=region][_ngcontent-%COMP%], \n.overflow-x-auto[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.8) rgba(31, 41, 55, 0.3);\n}\n[role=region][_ngcontent-%COMP%]::-webkit-scrollbar, \n.overflow-x-auto[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n  height: 6px;\n}\n[role=region][_ngcontent-%COMP%]::-webkit-scrollbar-track, \n.overflow-x-auto[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: rgba(31, 41, 55, 0.3);\n  border-radius: 8px;\n}\n[role=region][_ngcontent-%COMP%]::-webkit-scrollbar-thumb, \n.overflow-x-auto[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background:\n    linear-gradient(\n      135deg,\n      #6b7280,\n      #9ca3af);\n  border-radius: 8px;\n  transition: background 0.3s ease;\n}\n[role=region][_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover, \n.overflow-x-auto[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #9ca3af,\n      #d1d5db);\n}\n@media (prefers-reduced-motion: reduce) {\n  [role=region][_ngcontent-%COMP%], \n   .overflow-x-auto[_ngcontent-%COMP%] {\n    scroll-behavior: auto;\n  }\n}\n[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n  border-radius: 0.5rem;\n}\n@media (prefers-contrast: high) {\n  [_ngcontent-%COMP%]:focus-visible {\n    outline-width: 3px;\n  }\n}\n.focus-ring-red[_ngcontent-%COMP%]:focus {\n  outline: 2px solid rgba(220, 38, 38, 0.5);\n  outline-offset: 2px;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);\n}\n.loading-skeleton[_ngcontent-%COMP%], \n.shimmer[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.3) 25%,\n      rgba(75, 85, 99, 0.5) 50%,\n      rgba(55, 65, 81, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer 2s infinite ease-in-out;\n  border-radius: 0.5rem;\n}\n@media (prefers-color-scheme: light) {\n  .loading-skeleton[_ngcontent-%COMP%], \n   .shimmer[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(229, 231, 235, 0.4) 25%,\n        rgba(229, 231, 235, 0.8) 50%,\n        rgba(229, 231, 235, 0.4) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .loading-skeleton[_ngcontent-%COMP%], \n   .shimmer[_ngcontent-%COMP%] {\n    animation: none;\n  }\n}\n@keyframes _ngcontent-%COMP%_shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.glass-effect[_ngcontent-%COMP%], \n.stat-card[_ngcontent-%COMP%] {\n  background: rgba(17, 24, 39, 0.85);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);\n}\n@media (min-width: 640px) {\n  section[_ngcontent-%COMP%] {\n    contain-intrinsic-size: auto 600px;\n  }\n}\n@media (min-width: 768px) {\n  main[_ngcontent-%COMP%] {\n    contain: layout style paint;\n  }\n}\n@media (min-width: 1024px) {\n  section[_ngcontent-%COMP%] {\n    contain-intrinsic-size: auto 700px;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  *[_ngcontent-%COMP%] {\n    -webkit-font-smoothing: auto;\n  }\n  img[_ngcontent-%COMP%] {\n    opacity: 0.95;\n  }\n  [_nghost-%COMP%], \n   main[_ngcontent-%COMP%], \n   #main-content[_ngcontent-%COMP%], \n   section[_ngcontent-%COMP%], \n   article[_ngcontent-%COMP%], \n   header[_ngcontent-%COMP%], \n   footer[_ngcontent-%COMP%] {\n    color: #efe6e4 !important;\n  }\n  h1[_ngcontent-%COMP%], \n   h2[_ngcontent-%COMP%], \n   h3[_ngcontent-%COMP%], \n   h4[_ngcontent-%COMP%], \n   h5[_ngcontent-%COMP%], \n   h6[_ngcontent-%COMP%] {\n    color: #fff6f5 !important;\n    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);\n  }\n  p[_ngcontent-%COMP%], \n   span[_ngcontent-%COMP%], \n   div[_ngcontent-%COMP%], \n   a[_ngcontent-%COMP%], \n   li[_ngcontent-%COMP%], \n   strong[_ngcontent-%COMP%] {\n    color: #e7dbd8 !important;\n  }\n  [class*=text-gray-900][_ngcontent-%COMP%], \n   [class*=text-gray-700][_ngcontent-%COMP%], \n   [class*=text-gray-600][_ngcontent-%COMP%], \n   [class*=text-gray-500][_ngcontent-%COMP%], \n   [class*=text-gray-400][_ngcontent-%COMP%], \n   [class*=text-gray-300][_ngcontent-%COMP%] {\n    color: #efe6e4 !important;\n  }\n  .text-xs[_ngcontent-%COMP%], \n   .text-sm[_ngcontent-%COMP%] {\n    color: #dccfcf !important;\n  }\n  .text-red-100[_ngcontent-%COMP%], \n   .text-blue-100[_ngcontent-%COMP%], \n   .text-purple-100[_ngcontent-%COMP%], \n   .text-green-100[_ngcontent-%COMP%] {\n    color: #fff6f5 !important;\n  }\n  a[_ngcontent-%COMP%], \n   a[_ngcontent-%COMP%]:link, \n   a[_ngcontent-%COMP%]:visited {\n    color: #ef4444 !important;\n  }\n  a[_ngcontent-%COMP%]:hover {\n    color: rgb(242.2157635468, 105.5842364532, 105.5842364532) !important;\n  }\n}\n@media (prefers-contrast: high) {\n  button[_ngcontent-%COMP%], \n   a[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n  .live-dot[_ngcontent-%COMP%] {\n    border: 2px solid #ffffff;\n  }\n  p[class*=text-gray][_ngcontent-%COMP%], \n   span[class*=text-gray][_ngcontent-%COMP%], \n   div[class*=text-gray][_ngcontent-%COMP%] {\n    color: #ffffff !important;\n  }\n}\n@media (prefers-reduced-transparency: reduce) {\n  .backdrop-blur-lg[_ngcontent-%COMP%] {\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n    background-color: rgba(17, 24, 39, 0.98);\n  }\n}\n@media (prefers-reduced-transparency: reduce) and (prefers-color-scheme: light) {\n  .backdrop-blur-lg[_ngcontent-%COMP%] {\n    background-color: rgba(255, 255, 255, 0.98);\n  }\n}\n@media print {\n  .live-dot[_ngcontent-%COMP%], \n   nav[_ngcontent-%COMP%]   button[_ngcontent-%COMP%], \n   svg[class*=cursor-pointer][_ngcontent-%COMP%], \n   button[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n  main[_ngcontent-%COMP%] {\n    padding: 0;\n  }\n  section[_ngcontent-%COMP%] {\n    break-inside: avoid;\n    page-break-inside: avoid;\n  }\n  *[_ngcontent-%COMP%] {\n    background: white !important;\n    color: black !important;\n    text-shadow: none !important;\n    box-shadow: none !important;\n  }\n  h1[_ngcontent-%COMP%], \n   h2[_ngcontent-%COMP%], \n   h3[_ngcontent-%COMP%] {\n    page-break-after: avoid;\n  }\n}\n.gpu-accelerated[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.container-safe[_ngcontent-%COMP%] {\n  max-width: 100vw;\n  overflow-x: hidden;\n}\n/*# sourceMappingURL=canal-completo.component.css.map */'] });
var CanalCompletoComponent = _CanalCompletoComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CanalCompletoComponent, [{
    type: Component,
    args: [{ selector: "app-canal-completo", standalone: true, imports: [
      CommonModule,
      SliderComponent,
      BannerComponent,
      NavBarComponent,
      RouterModule
    ], template: `<main\r
  class="flex-1 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10 max-w-[100vw] overflow-hidden"\r
  role="main"\r
>\r
  <!-- Skip Link -->\r
  <a\r
    href="#main-content"\r
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg"\r
  >\r
    Saltar al contenido principal\r
  </a>\r
\r
  <!-- Navigation Bar -->\r
  <app-nav-bar></app-nav-bar>\r
\r
  <!-- Hero Section - Live Program -->\r
  <section\r
    aria-labelledby="hero-heading"\r
    class="mt-4 sm:mt-6 relative overflow-hidden rounded-xl sm:rounded-2xl"\r
  >\r
    <div\r
      class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10"\r
    ></div>\r
    <app-banner *ngIf="program" [data]="program" class="block"></app-banner>\r
\r
    <div\r
      class="relative z-20 p-4 sm:p-6 lg:p-8 flex flex-col justify-end min-h-[200px] sm:min-h-[300px]"\r
    >\r
      <div class="flex items-center gap-2 sm:gap-3 mb-3">\r
        <img\r
          [src]="\r
            'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/' +\r
            program?.channel +\r
            '.png&w=56&h=56&fit=cover&output=webp'\r
          "\r
          [alt]="'Logo de ' + canal"\r
          class="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-lg ring-2 ring-white/20"\r
          width="56"\r
          height="56"\r
          loading="eager"\r
          fetchpriority="high"\r
        />\r
        <div>\r
          <div class="flex items-center gap-2 mb-1">\r
            <span class="live-dot" aria-hidden="true"></span>\r
            <span\r
              class="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide"\r
            >\r
              En Directo\r
            </span>\r
          </div>\r
          <h1\r
            id="hero-heading"\r
            class="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight"\r
          >\r
            {{ canal }}\r
          </h1>\r
        </div>\r
      </div>\r
\r
      <div *ngIf="program" class="max-w-2xl">\r
        <h2\r
          class="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2"\r
        >\r
          {{ program.title?.value }}\r
        </h2>\r
        <div\r
          class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white"\r
        >\r
          <span *ngIf="program.category?.value">{{\r
            program.category.value.split(",")[0]\r
          }}</span>\r
          <span\r
            *ngIf="program.start && program.stop"\r
            class="flex items-center gap-1"\r
          >\r
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">\r
              <path\r
                fill-rule="evenodd"\r
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
            {{ formatTime(program.start) }} - {{ formatTime(program.stop) }}\r
          </span>\r
        </div>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- Quick Stats Section -->\r
  <section\r
    aria-labelledby="stats-heading"\r
    class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"\r
  >\r
    <h2 id="stats-heading" class="sr-only">Estad\xEDsticas del canal</h2>\r
\r
    <div class="stat-card stat-card--red">\r
      <div class="stat-card__icon" aria-hidden="true">\r
        <svg\r
          class="w-6 h-6 sm:w-7 sm:h-7"\r
          fill="currentColor"\r
          viewBox="0 0 20 20"\r
        >\r
          <path\r
            d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"\r
          ></path>\r
        </svg>\r
      </div>\r
      <p class="stat-card__value">{{ programs.length }}</p>\r
      <p class="stat-card__label">Programas hoy</p>\r
    </div>\r
\r
    <div class="stat-card stat-card--blue">\r
      <div class="stat-card__icon" aria-hidden="true">\r
        <svg\r
          class="w-6 h-6 sm:w-7 sm:h-7"\r
          fill="currentColor"\r
          viewBox="0 0 20 20"\r
        >\r
          <path\r
            fill-rule="evenodd"\r
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"\r
            clip-rule="evenodd"\r
          ></path>\r
        </svg>\r
      </div>\r
      <p class="stat-card__value">{{ getProgramasPorHora() }}</p>\r
      <p class="stat-card__label">Esta hora</p>\r
    </div>\r
\r
    <div class="stat-card stat-card--purple">\r
      <div class="stat-card__icon" aria-hidden="true">\r
        <svg\r
          class="w-6 h-6 sm:w-7 sm:h-7"\r
          fill="currentColor"\r
          viewBox="0 0 20 20"\r
        >\r
          <path\r
            d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"\r
          ></path>\r
        </svg>\r
      </div>\r
      <p class="stat-card__value">{{ categorias.length }}</p>\r
      <p class="stat-card__label">Categor\xEDas</p>\r
    </div>\r
\r
    <div class="stat-card stat-card--green">\r
      <div class="stat-card__icon" aria-hidden="true">\r
        <svg\r
          class="w-6 h-6 sm:w-7 sm:h-7"\r
          fill="currentColor"\r
          viewBox="0 0 20 20"\r
        >\r
          <path\r
            fill-rule="evenodd"\r
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"\r
            clip-rule="evenodd"\r
          ></path>\r
        </svg>\r
      </div>\r
      <p class="stat-card__value">{{ getProgramasDestacados() }}</p>\r
      <p class="stat-card__label">Destacados</p>\r
    </div>\r
  </section>\r
\r
  <!-- Day Navigation -->\r
  <section\r
    aria-labelledby="day-navigation-heading"\r
    class="mt-6 sm:mt-8 sticky top-0 z-30 bg-transparent backdrop-blur-lg py-3 sm:py-4 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 border-b border-transparent dark:border-transparent"\r
  >\r
    <h2 id="day-navigation-heading" class="sr-only">Selecci\xF3n de d\xEDa</h2>\r
    <nav\r
      class="flex justify-center items-center"\r
      role="navigation"\r
      aria-label="Selecci\xF3n de programaci\xF3n por d\xEDa"\r
    >\r
      <div class="inline-flex rounded-lg p-1 bg-transparent">\r
        <button\r
          *ngFor="let day of days"\r
          type="button"\r
          class="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"\r
          [ngClass]="\r
            diaSeleccionado === day.label\r
              ? 'bg-red-600 text-white shadow-lg'\r
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'\r
          "\r
          (click)="cambiarDia(day.value)"\r
          [attr.aria-pressed]="diaSeleccionado === day.label"\r
          [attr.aria-label]="\r
            'Ver programaci\xF3n de ' +\r
            day.label.toLowerCase() +\r
            (diaSeleccionado === day.label ? ' (seleccionado)' : '')\r
          "\r
        >\r
          {{ day.label }}\r
        </button>\r
      </div>\r
    </nav>\r
  </section>\r
\r
  <!-- Main Content -->\r
  <div id="main-content">\r
    <!-- Time-based Quick Access -->\r
    <section aria-labelledby="time-slots-heading" class="mt-6 sm:mt-8">\r
      <header class="mb-4 sm:mb-6">\r
        <h2\r
          id="time-slots-heading"\r
          class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2"\r
        >\r
          Programaci\xF3n por franjas horarias\r
        </h2>\r
        <p class="text-sm sm:text-base text-white">\r
          Encuentra r\xE1pidamente qu\xE9 ver en {{ canal }} seg\xFAn la hora del d\xEDa\r
        </p>\r
      </header>\r
\r
      <div\r
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"\r
      >\r
        <button\r
          *ngFor="let slot of timeSlots"\r
          type="button"\r
          class="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"\r
          (click)="scrollToTimeSlot(slot.hour)"\r
          [attr.aria-label]="'Ver programaci\xF3n de ' + slot.label"\r
        >\r
          <svg\r
            class="w-6 h-6 sm:w-8 sm:h-8 mb-2"\r
            fill="currentColor"\r
            viewBox="0 0 20 20"\r
          >\r
            <path\r
              fill-rule="evenodd"\r
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"\r
              clip-rule="evenodd"\r
            ></path>\r
          </svg>\r
          <span class="text-xs sm:text-sm font-semibold">{{ slot.label }}</span>\r
          <span class="text-xs text-white mt-1">{{ slot.count }} prog.</span>\r
        </button>\r
      </div>\r
    </section>\r
\r
    <!-- Programs by Time Slot -->\r
    <section\r
      *ngFor="let slot of timeSlots; let i = index"\r
      [id]="'time-slot-' + slot.hour"\r
      class="mt-8 sm:mt-10 scroll-mt-24"\r
      [attr.aria-labelledby]="'time-slot-heading-' + i"\r
    >\r
      <header\r
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6"\r
      >\r
        <div class="flex items-center gap-3">\r
          <div\r
            class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg"\r
          >\r
            <span class="text-lg sm:text-xl font-bold text-white"\r
              >{{ slot.hour }}:00</span\r
            >\r
          </div>\r
          <div>\r
            <h3\r
              [id]="'time-slot-heading-' + i"\r
              class="text-lg sm:text-xl lg:text-2xl font-bold text-white"\r
            >\r
              {{ slot.label }}\r
            </h3>\r
            <p class="text-xs sm:text-sm text-white">\r
              {{ slot.programs.length }} programas en {{ canal }}\r
            </p>\r
          </div>\r
        </div>\r
\r
        <nav\r
          class="hidden sm:flex items-center gap-2"\r
          [attr.aria-label]="'Navegaci\xF3n ' + slot.label"\r
        >\r
          <button\r
            type="button"\r
            [attr.aria-label]="'Ver programas anteriores de ' + slot.label"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="timeSlotSliders[i]?.prev()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            type="button"\r
            [attr.aria-label]="'Ver m\xE1s programas de ' + slot.label"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="timeSlotSliders[i]?.next()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
              ></path>\r
            </svg>\r
          </button>\r
        </nav>\r
      </header>\r
\r
      <div class="relative">\r
        <app-slider\r
          #timeSlotSlider\r
          [programas]="slot.programs"\r
          variant="canales"\r
          [logo]="\r
            'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/' +\r
            program?.channel +\r
            '.png'\r
          "\r
          *ngIf="slot.programs.length > 0"\r
        ></app-slider>\r
        <p\r
          *ngIf="slot.programs.length === 0"\r
          class="text-center py-8 text-white"\r
        >\r
          No hay programas en esta franja horaria\r
        </p>\r
      </div>\r
    </section>\r
\r
    <!-- Categories Section -->\r
    <section\r
      aria-labelledby="categories-heading"\r
      class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700"\r
    >\r
      <header class="mb-6 sm:mb-8">\r
        <h2\r
          id="categories-heading"\r
          class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3"\r
        >\r
          Explora por categor\xEDas\r
        </h2>\r
        <p class="text-sm sm:text-base text-white max-w-3xl">\r
          Descubre toda la variedad de contenido que ofrece {{ canal }}. Desde\r
          pel\xEDculas y series hasta documentales, deportes y programas\r
          infantiles.\r
        </p>\r
      </header>\r
\r
      <div class="space-y-8 sm:space-y-10">\r
        <article\r
          *ngFor="let categoria of categorias; let i = index"\r
          class="scroll-mt-24"\r
          [attr.aria-labelledby]="'category-heading-' + i"\r
        >\r
          <header\r
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4"\r
          >\r
            <div class="flex items-center gap-3">\r
              <div\r
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow-md"\r
              >\r
                <svg\r
                  class="w-5 h-5 sm:w-6 sm:h-6 text-white"\r
                  [innerHTML]="getCategoryIcon(categoria)"\r
                ></svg>\r
              </div>\r
              <div>\r
                <h3\r
                  [id]="'category-heading-' + i"\r
                  class="text-lg sm:text-xl lg:text-2xl font-bold text-white"\r
                >\r
                  {{ categoria }}\r
                </h3>\r
                <p class="text-xs sm:text-sm text-white">\r
                  {{ getProgramsByCategory(categoria).length }} programas\r
                  disponibles\r
                </p>\r
              </div>\r
            </div>\r
            <nav\r
              class="hidden sm:flex items-center gap-2"\r
              [attr.aria-label]="'Navegaci\xF3n categor\xEDa ' + categoria"\r
            >\r
              <button\r
                type="button"\r
                [attr.aria-label]="'Ver programas anteriores de ' + categoria"\r
                class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
                (click)="categorySliders[i]?.prev()"\r
              >\r
                <svg\r
                  xmlns="http://www.w3.org/2000/svg"\r
                  viewBox="0 0 24 24"\r
                  class="w-full h-full fill-current"\r
                >\r
                  <path\r
                    d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
                  ></path>\r
                </svg>\r
              </button>\r
              <button\r
                type="button"\r
                [attr.aria-label]="'Ver m\xE1s programas de ' + categoria"\r
                class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
                (click)="categorySliders[i]?.next()"\r
              >\r
                <svg\r
                  xmlns="http://www.w3.org/2000/svg"\r
                  viewBox="0 0 24 24"\r
                  class="w-full h-full fill-current"\r
                >\r
                  <path\r
                    d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
                  ></path>\r
                </svg>\r
              </button>\r
            </nav>\r
          </header>\r
\r
          <div class="relative">\r
            <app-slider\r
              [programas]="getProgramsByCategory(categoria)"\r
              variant="canales"\r
              [logo]="\r
                'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/' +\r
                program?.channel +\r
                '.png'\r
              "\r
              *ngIf="getProgramsByCategory(categoria).length > 0"\r
            ></app-slider>\r
          </div>\r
        </article>\r
      </div>\r
    </section>\r
\r
    <!-- Complete Schedule -->\r
    <section\r
      aria-labelledby="full-schedule-heading"\r
      class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700"\r
    >\r
      <header\r
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"\r
      >\r
        <div>\r
          <h2\r
            id="full-schedule-heading"\r
            class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2"\r
          >\r
            Parrilla completa {{ diaSeleccionado.toLowerCase() }}\r
          </h2>\r
          <p class="text-sm sm:text-base text-gray-200">\r
            Todos los programas de {{ canal }} ordenados cronol\xF3gicamente\r
          </p>\r
        </div>\r
\r
        <nav\r
          class="hidden sm:flex items-center gap-2"\r
          aria-label="Navegaci\xF3n parrilla completa"\r
        >\r
          <button\r
            type="button"\r
            aria-label="Ver programas anteriores"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="fullScheduleSlider?.prev()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            type="button"\r
            aria-label="Ver m\xE1s programas"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="fullScheduleSlider?.next()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
              ></path>\r
            </svg>\r
          </button>\r
        </nav>\r
      </header>\r
\r
      <div class="relative">\r
        <app-slider\r
          #fullScheduleSlider\r
          [programas]="programs"\r
          variant="canales"\r
          [logo]="\r
            'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/' +\r
            program?.channel +\r
            '.png'\r
          "\r
          *ngIf="programs.length > 0"\r
        ></app-slider>\r
      </div>\r
    </section>\r
\r
    <!-- Other Channels Live -->\r
    <section\r
      aria-labelledby="other-channels-heading"\r
      class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700"\r
    >\r
      <header\r
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"\r
      >\r
        <div class="flex items-center gap-3">\r
          <div\r
            class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg"\r
          >\r
            <svg\r
              class="w-6 h-6 sm:w-7 sm:h-7 text-white"\r
              fill="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r
              ></path>\r
            </svg>\r
          </div>\r
          <div>\r
            <h2\r
              id="other-channels-heading"\r
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"\r
            >\r
              Ahora en otros canales\r
            </h2>\r
            <p class="text-sm sm:text-base text-gray-200 mt-1">\r
              Descubre qu\xE9 est\xE1 emitiendo el resto de la televisi\xF3n en este\r
              momento\r
            </p>\r
          </div>\r
        </div>\r
\r
        <nav\r
          class="hidden sm:flex items-center gap-2"\r
          aria-label="Navegaci\xF3n otros canales"\r
        >\r
          <button\r
            type="button"\r
            aria-label="Ver canales anteriores"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="otherChannelsSlider?.prev()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42 -4.3-4.3 4.29-4.293Z"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            type="button"\r
            aria-label="Ver m\xE1s canales"\r
            class="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 p-2 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"\r
            (click)="otherChannelsSlider?.next()"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              class="w-full h-full fill-current"\r
            >\r
              <path\r
                d="M10.7 17.707l5.7-5.71 -5.71-5.707L9.27 7.7l4.29 4.293 -4.3 4.29Z"\r
              ></path>\r
            </svg>\r
          </button>\r
        </nav>\r
      </header>\r
\r
      <div class="relative">\r
        <app-slider\r
          #otherChannelsSlider\r
          [programas]="live_programs"\r
          variant="canales"\r
          *ngIf="live_programs.length > 0"\r
        ></app-slider>\r
        <p\r
          *ngIf="live_programs.length === 0"\r
          class="text-center py-12 text-gray-200"\r
        >\r
          No hay informaci\xF3n de otros canales disponible\r
        </p>\r
      </div>\r
    </section>\r
\r
    <!-- SEO Content Section -->\r
    <section\r
      aria-labelledby="seo-content-heading"\r
      class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700"\r
    >\r
      <article\r
        class="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none"\r
      >\r
        <h2\r
          id="seo-content-heading"\r
          class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"\r
        >\r
          Toda la programaci\xF3n de {{ canal }}\r
          {{ diaSeleccionado.toLowerCase() }}\r
        </h2>\r
\r
        <div class="space-y-4 text-white leading-relaxed">\r
          <p>\r
            Descubre la\r
            <strong\r
              >programaci\xF3n completa de {{ canal }}\r
              {{ diaSeleccionado.toLowerCase() }}</strong\r
            >\r
            con nuestra gu\xEDa actualizada en tiempo real. Consulta todos los\r
            programas, series, pel\xEDculas y documentales que se emiten en uno de\r
            los canales m\xE1s populares de la televisi\xF3n espa\xF1ola.\r
          </p>\r
\r
          <p>\r
            En esta p\xE1gina encontrar\xE1s informaci\xF3n detallada sobre qu\xE9 ver en\r
            {{ canal }}, incluyendo horarios exactos, sinopsis de cada programa\r
            y recomendaciones personalizadas. Nuestra gu\xEDa TV te permite\r
            planificar tu d\xEDa y no perderte ninguno de tus programas favoritos.\r
          </p>\r
\r
          <h3 class="text-xl sm:text-2xl font-bold text-white mt-8 mb-4">\r
            \xBFQu\xE9 puedes ver en {{ canal }} {{ diaSeleccionado.toLowerCase() }}?\r
          </h3>\r
\r
          <p>{{ canal }} ofrece una programaci\xF3n variada que incluye:</p>\r
\r
          <ul class="list-disc list-inside space-y-2 ml-4">\r
            <li *ngFor="let categoria of categorias.slice(0, 6)">\r
              <strong>{{ categoria }}</strong\r
              >: Programas especializados en {{ categoria.toLowerCase() }}\r
              para todos los p\xFAblicos\r
            </li>\r
          </ul>\r
\r
          <h3\r
            class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4"\r
          >\r
            Programaci\xF3n destacada de {{ canal }}\r
          </h3>\r
\r
          <p>\r
            Entre los programas m\xE1s populares que puedes disfrutar en\r
            {{ canal }} se encuentran producciones de alta calidad que abarcan\r
            entretenimiento, informaci\xF3n, cultura y mucho m\xE1s. Nuestro sistema\r
            actualiza la informaci\xF3n cada hora para ofrecerte siempre los datos\r
            m\xE1s precisos.\r
          </p>\r
\r
          <p>\r
            Con <strong>{{ programs.length }} programas</strong> programados\r
            para {{ diaSeleccionado.toLowerCase() }}, {{ canal }} te ofrece\r
            opciones para cada momento del d\xEDa, desde el desayuno hasta la\r
            madrugada. Utiliza nuestra navegaci\xF3n por franjas horarias para\r
            encontrar r\xE1pidamente lo que buscas.\r
          </p>\r
\r
          <h3\r
            class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4"\r
          >\r
            C\xF3mo usar nuestra gu\xEDa de programaci\xF3n\r
          </h3>\r
\r
          <p>\r
            Navega f\xE1cilmente por la programaci\xF3n de {{ canal }} usando nuestras\r
            diferentes secciones:\r
          </p>\r
\r
          <ul class="list-disc list-inside space-y-2 ml-4">\r
            <li>\r
              <strong>Franjas horarias</strong>: Encuentra programas por ma\xF1ana,\r
              tarde, noche o madrugada\r
            </li>\r
            <li>\r
              <strong>Categor\xEDas</strong>: Explora contenido espec\xEDfico como\r
              pel\xEDculas, series o deportes\r
            </li>\r
            <li>\r
              <strong>Parrilla completa</strong>: Consulta todos los programas\r
              ordenados cronol\xF3gicamente\r
            </li>\r
            <li>\r
              <strong>En directo</strong>: Descubre qu\xE9 se est\xE1 emitiendo ahora\r
              en {{ canal }}\r
            </li>\r
          </ul>\r
\r
          <h3\r
            class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4"\r
          >\r
            Informaci\xF3n actualizada en tiempo real\r
          </h3>\r
\r
          <p>\r
            Nuestra gu\xEDa de programaci\xF3n de {{ canal }} se actualiza\r
            constantemente para garantizar que siempre tengas acceso a la\r
            informaci\xF3n m\xE1s reciente. Consulta tambi\xE9n qu\xE9 se emite ma\xF1ana o\r
            pasado ma\xF1ana para planificar tu semana de televisi\xF3n.\r
          </p>\r
\r
          <p class="text-sm text-white mt-6">\r
            \xDAltima actualizaci\xF3n: {{ getCurrentDate() }}\r
          </p>\r
        </div>\r
      </article>\r
    </section>\r
\r
    <!-- Related Channels -->\r
    <section\r
      aria-labelledby="related-channels-heading"\r
      class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700 pb-8"\r
    >\r
      <header class="mb-6">\r
        <h2\r
          id="related-channels-heading"\r
          class="text-2xl sm:text-3xl font-bold text-white mb-2"\r
        >\r
          Otros canales que te pueden interesar\r
        </h2>\r
        <p class="text-sm sm:text-base text-white">\r
          Explora la programaci\xF3n de canales similares\r
        </p>\r
      </header>\r
\r
      <div\r
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4"\r
      >\r
        <a\r
          *ngFor="let channel of getRelatedChannels()"\r
          [routerLink]="['/canal', channel.id]"\r
          class="group flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"\r
          [attr.aria-label]="'Ver programaci\xF3n de ' + channel.name"\r
        >\r
          <img\r
            [src]="\r
              'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/' +\r
              channel.id +\r
              '.png&w=64&h=64&fit=cover&output=webp'\r
            "\r
            [alt]="'Logo de ' + channel.name"\r
            class="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-md group-hover:scale-110 transition-transform duration-300"\r
            width="64"\r
            height="64"\r
            loading="lazy"\r
          />\r
          <span\r
            class="mt-3 text-xs sm:text-sm font-semibold text-white text-center"\r
          >\r
            {{ channel.name }}\r
          </span>\r
        </a>\r
      </div>\r
    </section>\r
  </div>\r
\r
  <!-- Structured Data -->\r
  <script type="application/ld+json" *ngIf="program && channel">\r
    {\r
      "@context": "https://schema.org",\r
      "@type": "BroadcastService",\r
      "name": "{{ canal }}",\r
      "broadcastDisplayName": "{{ canal }}",\r
      "description": "Programaci\xF3n completa de {{ canal }} con todos los horarios y programas del d\xEDa",\r
      "potentialAction": {\r
        "@type": "WatchAction",\r
        "target": {\r
          "@type": "EntryPoint",\r
          "urlTemplate": "{{ getCanonicalUrl() }}"\r
        }\r
      },\r
      "broadcast": {\r
        "@type": "BroadcastEvent",\r
        "name": "{{ program?.title?.value || 'Programaci\xF3n en directo' }}",\r
        "description": "{{ program?.desc?.value || 'Programaci\xF3n actual de ' + canal }}",\r
        "startDate": "{{ program?.start }}",\r
        "endDate": "{{ program?.stop }}",\r
        "isLiveBroadcast": true,\r
        "broadcastOfEvent": {\r
          "@type": "Event",\r
          "name": "{{ program?.title?.value }}"\r
        }\r
      }\r
    }\r
  <\/script>\r
</main>\r
`, styles: ['/* src/app/pages/canal-completo/canal-completo.component.scss */\n.live-dot {\n  height: 10px;\n  width: 10px;\n  background-color: #ef4444;\n  border-radius: 50%;\n  display: inline-block;\n  position: relative;\n  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n}\n.live-dot::before {\n  content: "";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 100%;\n  height: 100%;\n  border-radius: 50%;\n  background-color: #ef4444;\n  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n}\n@media (prefers-reduced-motion: reduce) {\n  .live-dot {\n    animation: none;\n    box-shadow: none;\n  }\n  .live-dot::before {\n    display: none;\n  }\n}\n@keyframes pulse-dot {\n  0%, 100% {\n    opacity: 1;\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n  }\n  50% {\n    opacity: 0.7;\n    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);\n  }\n}\n@keyframes pulse-ring {\n  0% {\n    transform: translate(-50%, -50%) scale(1);\n    opacity: 0.8;\n  }\n  100% {\n    transform: translate(-50%, -50%) scale(2.5);\n    opacity: 0;\n  }\n}\nmain {\n  font-family:\n    "Montserrat",\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    sans-serif;\n  animation: fadeIn 0.4s ease-out;\n  contain: layout style;\n}\n@media (min-width: 1024px) {\n  main {\n    contain: layout style paint;\n  }\n}\nsection {\n  contain: layout style;\n  content-visibility: auto;\n  contain-intrinsic-size: auto 500px;\n  scroll-margin-top: 5rem;\n}\n@media (prefers-reduced-motion: reduce) {\n  section {\n    animation: none;\n  }\n}\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\nsection[aria-labelledby=hero-heading] {\n  position: relative;\n}\nsection[aria-labelledby=hero-heading] .absolute.inset-0 {\n  background:\n    linear-gradient(\n      to top,\n      rgba(17, 24, 39, 0.98) 0%,\n      rgba(17, 24, 39, 0.85) 40%,\n      rgba(17, 24, 39, 0.5) 70%,\n      transparent 100%);\n}\nsection[aria-labelledby=hero-heading] h1,\nsection[aria-labelledby=hero-heading] h2 {\n  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);\n}\n[class*=bg-gradient-to-br] {\n  position: relative;\n  overflow: hidden;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1);\n  transition:\n    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    color 0.15s ease;\n  color: #fff !important;\n}\n@media (hover: hover) {\n  [class*=bg-gradient-to-br]:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);\n  }\n}\n[class*=bg-gradient-to-br]::after {\n  content: "";\n  position: absolute;\n  top: -50%;\n  right: -50%;\n  bottom: -50%;\n  left: -50%;\n  background:\n    linear-gradient(\n      45deg,\n      transparent 30%,\n      rgba(255, 255, 255, 0.1) 50%,\n      transparent 70%);\n  transform: translateX(-100%) translateY(-100%) rotate(45deg);\n  transition: transform 0.6s ease;\n}\n@media (hover: hover) {\n  [class*=bg-gradient-to-br]:hover::after {\n    transform: translateX(100%) translateY(100%) rotate(45deg);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  [class*=bg-gradient-to-br] {\n    transition: none;\n  }\n  [class*=bg-gradient-to-br]::after {\n    display: none;\n  }\n}\n[class*=bg-gradient-to-br] .text-2xl,\n[class*=bg-gradient-to-br] .text-3xl {\n  color: #fff !important;\n  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);\n}\n.stat-card {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 0.35rem;\n  padding: 1rem 1.25rem;\n  border-radius: 0.75rem;\n  min-width: 180px;\n  transition: transform 0.18s ease, box-shadow 0.18s ease;\n}\n.stat-card .stat-card__icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 2rem;\n  height: 2rem;\n  border-radius: 0.5rem;\n  background: rgba(255, 255, 255, 0.03);\n  color: #fff;\n}\n.stat-card .stat-card__value {\n  font-size: 1.5rem;\n  font-weight: 800;\n  color: #fff;\n  margin: 0;\n}\n.stat-card .stat-card__label {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.85);\n  margin: 0;\n}\n.stat-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);\n}\n.stat-card--red {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.12),\n      rgba(220, 38, 38, 0.04));\n  border: 1px solid rgba(220, 38, 38, 0.08);\n}\n.stat-card--blue {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(59, 130, 246, 0.12),\n      rgba(59, 130, 246, 0.04));\n  border: 1px solid rgba(59, 130, 246, 0.08);\n}\n.stat-card--purple {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(139, 92, 246, 0.12),\n      rgba(139, 92, 246, 0.04));\n  border: 1px solid rgba(139, 92, 246, 0.08);\n}\n.stat-card--green {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(34, 197, 94, 0.12),\n      rgba(34, 197, 94, 0.04));\n  border: 1px solid rgba(34, 197, 94, 0.08);\n}\nsection[aria-labelledby=day-navigation-heading] {\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nsection[aria-labelledby=day-navigation-heading].scrolled {\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1);\n}\nsection[aria-labelledby=day-navigation-heading] button {\n  font-family: "Montserrat", sans-serif;\n  font-weight: 500;\n  letter-spacing: 0.01em;\n  padding: 0.45rem 0.9rem;\n  border-radius: 9999px;\n  border: 1px solid rgba(0, 0, 0, 0.06);\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  color: #111827;\n}\n@media (prefers-color-scheme: dark) {\n  section[aria-labelledby=day-navigation-heading] button {\n    background: rgba(255, 255, 255, 0.02);\n    color: #f8fafc;\n    border: 1px solid rgba(255, 255, 255, 0.04);\n  }\n}\nsection[aria-labelledby=day-navigation-heading] button[class*=bg-red-600],\nsection[aria-labelledby=day-navigation-heading] button.active,\nsection[aria-labelledby=day-navigation-heading] button[aria-pressed=true] {\n  background:\n    linear-gradient(\n      135deg,\n      #dc2626 0%,\n      #991b1b 100%);\n  color: white !important;\n  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.28);\n  border-color: rgba(220, 38, 38, 0.25);\n}\nbutton,\na {\n  font-family: "Montserrat", sans-serif;\n  transform: translateZ(0);\n  backface-visibility: hidden;\n  -webkit-font-smoothing: antialiased;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  button:hover,\n  a:hover {\n    transform: translateY(-1px) translateZ(0);\n  }\n}\nbutton:active,\na:active {\n  transform: translateY(0) translateZ(0);\n}\n@media (prefers-reduced-motion: reduce) {\n  button,\n  a {\n    transition: none;\n    transform: none !important;\n  }\n}\nbutton[class*=rounded-full] {\n  position: relative;\n  overflow: hidden;\n}\nbutton[class*=rounded-full]::before {\n  content: "";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 0;\n  height: 0;\n  border-radius: 50%;\n  background: rgba(239, 68, 68, 0.15);\n  transform: translate(-50%, -50%);\n  transition: width 0.4s ease, height 0.4s ease;\n}\n@media (hover: hover) {\n  button[class*=rounded-full]:hover::before {\n    width: 180%;\n    height: 180%;\n  }\n}\nbutton[class*=rounded-full] svg {\n  position: relative;\n  z-index: 1;\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  button[class*=rounded-full]:hover svg {\n    transform: scale(1.15);\n  }\n}\nbutton[class*=rounded-xl][class*=border-2] {\n  border-color: rgba(229, 231, 235, 0.3);\n  background: rgba(255, 255, 255, 0.02);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-color-scheme: dark) {\n  button[class*=rounded-xl][class*=border-2] {\n    border-color: rgba(55, 65, 81, 0.4);\n    background: rgba(255, 255, 255, 0.03);\n  }\n}\n@media (prefers-color-scheme: light) {\n  button[class*=rounded-xl][class*=border-2] :host,\n  button[class*=rounded-xl][class*=border-2] :host * {\n  }\n  button[class*=rounded-xl][class*=border-2] :host h1,\n  button[class*=rounded-xl][class*=border-2] :host h2,\n  button[class*=rounded-xl][class*=border-2] :host h3,\n  button[class*=rounded-xl][class*=border-2] :host h4,\n  button[class*=rounded-xl][class*=border-2] :host h5,\n  button[class*=rounded-xl][class*=border-2] :host h6,\n  button[class*=rounded-xl][class*=border-2] :host * h1,\n  button[class*=rounded-xl][class*=border-2] :host * h2,\n  button[class*=rounded-xl][class*=border-2] :host * h3,\n  button[class*=rounded-xl][class*=border-2] :host * h4,\n  button[class*=rounded-xl][class*=border-2] :host * h5,\n  button[class*=rounded-xl][class*=border-2] :host * h6 {\n    color: #0f172a !important;\n  }\n}\nbutton[class*=rounded-xl][class*=border-2][class*=border-red-600] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.15) 0%,\n      rgba(220, 38, 38, 0.05) 100%);\n  border-color: #dc2626;\n  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);\n}\n@media (hover: hover) {\n  button[class*=rounded-xl][class*=border-2]:hover {\n    background:\n      linear-gradient(\n        135deg,\n        rgba(239, 68, 68, 0.1) 0%,\n        rgba(239, 68, 68, 0.05) 100%);\n    border-color: #ef4444;\n    transform: translateY(-2px);\n    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.2);\n  }\n}\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-family: "Montserrat", sans-serif;\n  font-weight: 700;\n  line-height: 1.25;\n  letter-spacing: -0.02em;\n  text-rendering: optimizeLegibility;\n  color: #ffffff;\n}\n@media (prefers-color-scheme: light) {\n  h1,\n  h2,\n  h3,\n  h4,\n  h5,\n  h6 {\n    color: #0f172a;\n  }\n}\nh1 {\n  font-size: clamp(1.5rem, 4vw + 1rem, 2.5rem);\n  font-weight: 800;\n}\nh2 {\n  font-size: clamp(1.25rem, 3vw + 0.5rem, 2rem);\n  font-weight: 700;\n}\nh3 {\n  font-size: clamp(1.125rem, 2vw + 0.5rem, 1.5rem);\n  font-weight: 600;\n}\np,\nspan,\ndiv {\n  font-family: "Montserrat", sans-serif;\n  line-height: 1.6;\n}\np[class*=text-gray-300],\nspan[class*=text-gray-300],\ndiv[class*=text-gray-300] {\n  color: #e5e7eb;\n}\np[class*=text-gray-400],\nspan[class*=text-gray-400],\ndiv[class*=text-gray-400] {\n  color: #9ca3af;\n}\np[class*=text-gray-500],\np[class*=text-gray-600],\nspan[class*=text-gray-500],\nspan[class*=text-gray-600],\ndiv[class*=text-gray-500],\ndiv[class*=text-gray-600] {\n  color: #374151;\n}\n@media (prefers-color-scheme: dark) {\n  p[class*=text-gray-500],\n  p[class*=text-gray-600],\n  span[class*=text-gray-500],\n  span[class*=text-gray-600],\n  div[class*=text-gray-500],\n  div[class*=text-gray-600] {\n    color: #d1d5db;\n  }\n}\np.text-xs,\np.text-sm,\nspan.text-xs,\nspan.text-sm,\ndiv.text-xs,\ndiv.text-sm {\n  color: #6b7280;\n}\n@media (prefers-color-scheme: dark) {\n  p.text-xs,\n  p.text-sm,\n  span.text-xs,\n  span.text-sm,\n  div.text-xs,\n  div.text-sm {\n    color: #c7cbd1;\n  }\n}\n:host,\nmain,\n#main-content {\n}\n@media (prefers-color-scheme: light) {\n  :host,\n  main,\n  #main-content {\n    color: #0f172a;\n  }\n  :host h1,\n  :host h2,\n  :host h3,\n  :host h4,\n  :host h5,\n  :host h6,\n  :host strong,\n  main h1,\n  main h2,\n  main h3,\n  main h4,\n  main h5,\n  main h6,\n  main strong,\n  #main-content h1,\n  #main-content h2,\n  #main-content h3,\n  #main-content h4,\n  #main-content h5,\n  #main-content h6,\n  #main-content strong {\n    color: #0f172a !important;\n  }\n  :host [class*=text-gray-900],\n  :host [class*=text-gray-800],\n  :host [class*=text-gray-700],\n  :host [class*=text-gray-600],\n  main [class*=text-gray-900],\n  main [class*=text-gray-800],\n  main [class*=text-gray-700],\n  main [class*=text-gray-600],\n  #main-content [class*=text-gray-900],\n  #main-content [class*=text-gray-800],\n  #main-content [class*=text-gray-700],\n  #main-content [class*=text-gray-600] {\n    color: #0f172a !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  :host,\n  main,\n  #main-content {\n    color: #fff6f5;\n  }\n  :host h1,\n  :host h2,\n  :host h3,\n  :host h4,\n  :host h5,\n  :host h6,\n  main h1,\n  main h2,\n  main h3,\n  main h4,\n  main h5,\n  main h6,\n  #main-content h1,\n  #main-content h2,\n  #main-content h3,\n  #main-content h4,\n  #main-content h5,\n  #main-content h6 {\n    color: #fff6f5 !important;\n  }\n  :host [class*=text-gray-],\n  :host [class*=text-blue-],\n  :host [class*=text-green-],\n  :host [class*=text-purple-],\n  :host [class*=text-slate-],\n  :host [class*=text-cool-],\n  main [class*=text-gray-],\n  main [class*=text-blue-],\n  main [class*=text-green-],\n  main [class*=text-purple-],\n  main [class*=text-slate-],\n  main [class*=text-cool-],\n  #main-content [class*=text-gray-],\n  #main-content [class*=text-blue-],\n  #main-content [class*=text-green-],\n  #main-content [class*=text-purple-],\n  #main-content [class*=text-slate-],\n  #main-content [class*=text-cool-] {\n    color: #efe6e4 !important;\n  }\n  :host a,\n  :host a:link,\n  :host a:visited,\n  main a,\n  main a:link,\n  main a:visited,\n  #main-content a,\n  #main-content a:link,\n  #main-content a:visited {\n    color: #ef4444 !important;\n  }\n  :host a:hover,\n  main a:hover,\n  #main-content a:hover {\n    color: rgb(242.2157635468, 105.5842364532, 105.5842364532) !important;\n  }\n}\n.text-xs {\n  font-size: 0.75rem;\n  line-height: 1.5;\n}\n.text-sm {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\nimg {\n  display: block;\n  image-rendering: -webkit-optimize-contrast;\n  image-rendering: crisp-edges;\n  transform: translateZ(0);\n  user-drag: none;\n  -webkit-user-drag: none;\n  -webkit-user-select: none;\n  user-select: none;\n}\nimg[class*=rounded-full] {\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (hover: hover) {\n  img[class*=rounded-full]:hover {\n    transform: scale(1.08) translateZ(0);\n    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);\n  }\n}\nimg[class*=ring-2] {\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);\n}\nsvg {\n  display: block;\n  transform: translateZ(0);\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), fill 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-reduced-motion: reduce) {\n  svg {\n    transition: none;\n  }\n}\narticle[class*=scroll-mt-24] > header {\n  margin-bottom: 1.5rem;\n}\narticle[class*=scroll-mt-24] > header .rounded-lg {\n  background:\n    linear-gradient(\n      135deg,\n      #374151 0%,\n      #1f2937 100%);\n  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.2);\n}\n@media (prefers-color-scheme: dark) {\n  article[class*=scroll-mt-24] > header .rounded-lg {\n    background:\n      linear-gradient(\n        135deg,\n        #4b5563 0%,\n        #374151 100%);\n  }\n}\n.bg-gradient-to-br.from-red-500.to-red-700 {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444 0%,\n      #991b1b 100%);\n  box-shadow: 0 4px 12px -2px rgba(220, 38, 38, 0.4);\n}\n.prose {\n  font-family: "Montserrat", sans-serif;\n}\n.prose p {\n  margin-bottom: 1.25em;\n  line-height: 1.75;\n  color: #d1d5db;\n}\n@media (prefers-color-scheme: light) {\n  .prose p {\n    color: #374151;\n  }\n}\n.prose ul {\n  margin-top: 1.25em;\n  margin-bottom: 1.25em;\n  padding-left: 1.75em;\n}\n.prose ul li {\n  margin-top: 0.75em;\n  margin-bottom: 0.75em;\n  line-height: 1.75;\n  color: #d1d5db;\n}\n@media (prefers-color-scheme: light) {\n  .prose ul li {\n    color: #374151;\n  }\n}\n.prose ul li::marker {\n  color: #ef4444;\n}\n.prose strong {\n  font-weight: 600;\n  color: #ef4444;\n}\n@media (prefers-color-scheme: light) {\n  .prose strong {\n    color: #dc2626;\n  }\n}\n.prose h2,\n.prose h3 {\n  margin-top: 2em;\n  margin-bottom: 1em;\n  font-weight: 700;\n}\n[role=region],\n.overflow-x-auto {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.8) rgba(31, 41, 55, 0.3);\n}\n[role=region]::-webkit-scrollbar,\n.overflow-x-auto::-webkit-scrollbar {\n  width: 6px;\n  height: 6px;\n}\n[role=region]::-webkit-scrollbar-track,\n.overflow-x-auto::-webkit-scrollbar-track {\n  background: rgba(31, 41, 55, 0.3);\n  border-radius: 8px;\n}\n[role=region]::-webkit-scrollbar-thumb,\n.overflow-x-auto::-webkit-scrollbar-thumb {\n  background:\n    linear-gradient(\n      135deg,\n      #6b7280,\n      #9ca3af);\n  border-radius: 8px;\n  transition: background 0.3s ease;\n}\n[role=region]::-webkit-scrollbar-thumb:hover,\n.overflow-x-auto::-webkit-scrollbar-thumb:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #9ca3af,\n      #d1d5db);\n}\n@media (prefers-reduced-motion: reduce) {\n  [role=region],\n  .overflow-x-auto {\n    scroll-behavior: auto;\n  }\n}\n:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n  border-radius: 0.5rem;\n}\n@media (prefers-contrast: high) {\n  :focus-visible {\n    outline-width: 3px;\n  }\n}\n.focus-ring-red:focus {\n  outline: 2px solid rgba(220, 38, 38, 0.5);\n  outline-offset: 2px;\n  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);\n}\n.loading-skeleton,\n.shimmer {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(55, 65, 81, 0.3) 25%,\n      rgba(75, 85, 99, 0.5) 50%,\n      rgba(55, 65, 81, 0.3) 75%);\n  background-size: 200% 100%;\n  animation: shimmer 2s infinite ease-in-out;\n  border-radius: 0.5rem;\n}\n@media (prefers-color-scheme: light) {\n  .loading-skeleton,\n  .shimmer {\n    background:\n      linear-gradient(\n        90deg,\n        rgba(229, 231, 235, 0.4) 25%,\n        rgba(229, 231, 235, 0.8) 50%,\n        rgba(229, 231, 235, 0.4) 75%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .loading-skeleton,\n  .shimmer {\n    animation: none;\n  }\n}\n@keyframes shimmer {\n  0% {\n    background-position: -200% 0;\n  }\n  100% {\n    background-position: 200% 0;\n  }\n}\n.glass-effect,\n.stat-card {\n  background: rgba(17, 24, 39, 0.85);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);\n}\n@media (min-width: 640px) {\n  section {\n    contain-intrinsic-size: auto 600px;\n  }\n}\n@media (min-width: 768px) {\n  main {\n    contain: layout style paint;\n  }\n}\n@media (min-width: 1024px) {\n  section {\n    contain-intrinsic-size: auto 700px;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  * {\n    -webkit-font-smoothing: auto;\n  }\n  img {\n    opacity: 0.95;\n  }\n  :host,\n  main,\n  #main-content,\n  section,\n  article,\n  header,\n  footer {\n    color: #efe6e4 !important;\n  }\n  h1,\n  h2,\n  h3,\n  h4,\n  h5,\n  h6 {\n    color: #fff6f5 !important;\n    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);\n  }\n  p,\n  span,\n  div,\n  a,\n  li,\n  strong {\n    color: #e7dbd8 !important;\n  }\n  [class*=text-gray-900],\n  [class*=text-gray-700],\n  [class*=text-gray-600],\n  [class*=text-gray-500],\n  [class*=text-gray-400],\n  [class*=text-gray-300] {\n    color: #efe6e4 !important;\n  }\n  .text-xs,\n  .text-sm {\n    color: #dccfcf !important;\n  }\n  .text-red-100,\n  .text-blue-100,\n  .text-purple-100,\n  .text-green-100 {\n    color: #fff6f5 !important;\n  }\n  a,\n  a:link,\n  a:visited {\n    color: #ef4444 !important;\n  }\n  a:hover {\n    color: rgb(242.2157635468, 105.5842364532, 105.5842364532) !important;\n  }\n}\n@media (prefers-contrast: high) {\n  button,\n  a {\n    border: 2px solid currentColor;\n  }\n  .live-dot {\n    border: 2px solid #ffffff;\n  }\n  p[class*=text-gray],\n  span[class*=text-gray],\n  div[class*=text-gray] {\n    color: #ffffff !important;\n  }\n}\n@media (prefers-reduced-transparency: reduce) {\n  .backdrop-blur-lg {\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n    background-color: rgba(17, 24, 39, 0.98);\n  }\n}\n@media (prefers-reduced-transparency: reduce) and (prefers-color-scheme: light) {\n  .backdrop-blur-lg {\n    background-color: rgba(255, 255, 255, 0.98);\n  }\n}\n@media print {\n  .live-dot,\n  nav button,\n  svg[class*=cursor-pointer],\n  button {\n    display: none !important;\n  }\n  main {\n    padding: 0;\n  }\n  section {\n    break-inside: avoid;\n    page-break-inside: avoid;\n  }\n  * {\n    background: white !important;\n    color: black !important;\n    text-shadow: none !important;\n    box-shadow: none !important;\n  }\n  h1,\n  h2,\n  h3 {\n    page-break-after: avoid;\n  }\n}\n.gpu-accelerated {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.container-safe {\n  max-width: 100vw;\n  overflow-x: hidden;\n}\n/*# sourceMappingURL=canal-completo.component.css.map */\n'] }]
  }], null, { timeSlotSliders: [{
    type: ViewChildren,
    args: ["timeSlotSlider"]
  }], categorySliders: [{
    type: ViewChildren,
    args: ["categorySlider"]
  }], fullScheduleSlider: [{
    type: ViewChild,
    args: ["fullScheduleSlider"]
  }], otherChannelsSlider: [{
    type: ViewChild,
    args: ["otherChannelsSlider"]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CanalCompletoComponent, { className: "CanalCompletoComponent", filePath: "src/app/pages/canal-completo/canal-completo.component.ts", lineNumber: 58 });
})();
export {
  CanalCompletoComponent
};
//# sourceMappingURL=canal-completo.component-FIM2OF45.js.map
