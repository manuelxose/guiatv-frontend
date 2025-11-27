import {
  AutocompleteComponent
} from "./chunk-DM6RSHWD.js";
import "./chunk-O7DAVEUU.js";
import {
  SliderComponent
} from "./chunk-YVTN3PAS.js";
import {
  MenuComponent,
  MenuStateService
} from "./chunk-REERXIA3.js";
import {
  MetaService
} from "./chunk-MKFCNM4X.js";
import {
  ActivatedRoute,
  CommonModule,
  HttpService,
  NavigationEnd,
  NgIf,
  Router
} from "./chunk-MUKTTSZO.js";
import {
  BehaviorSubject,
  Component,
  HostListener,
  Injectable,
  RendererFactory2,
  Subscription,
  ViewChild,
  __async,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinterpolate,
  ɵɵinterpolate1,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/components/header/header.component.ts
function HeaderComponent_header_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "header", 2)(1, "span", 3);
    \u0275\u0275listener("click", function HeaderComponent_header_0_Template_span_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleMenu());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 4);
    \u0275\u0275element(3, "path", 5);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "div", 6);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 7);
    \u0275\u0275element(6, "path", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "div", 9);
    \u0275\u0275text(8, " GPTV");
    \u0275\u0275elementStart(9, "span", 10);
    \u0275\u0275text(10, ".");
    \u0275\u0275elementEnd()()();
    \u0275\u0275element(11, "app-autocomplete");
    \u0275\u0275elementEnd();
  }
}
function HeaderComponent_aside_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "aside", 11)(1, "div", 12)(2, "div", 13)(3, "span", 14);
    \u0275\u0275listener("click", function HeaderComponent_aside_1_Template_span_click_3_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleMenu());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 4);
    \u0275\u0275element(5, "path", 15);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(6, "app-menu");
    \u0275\u0275elementEnd()();
  }
}
var _HeaderComponent = class _HeaderComponent {
  constructor(rendererFactory, router, menuState) {
    this.rendererFactory = rendererFactory;
    this.router = router;
    this.menuState = menuState;
    this.menuVisible = false;
    this.accVisible = false;
    this.offset = 0;
    this.headerHeight = 250;
    this.isAtTop = true;
    this.items = [];
    this.isViewable = false;
    this.isHome = false;
    this.isGuiaCanales = false;
    this.isSeries = false;
    this.isPeliculas = false;
    this.renderer = rendererFactory.createRenderer(null, null);
    this.router.events.subscribe((event2) => {
      if (event2 instanceof NavigationEnd) {
        this.isHome = false;
        this.isGuiaCanales = false;
        this.isSeries = false;
        this.isPeliculas = false;
        const parts = this.router.url.split("/").filter(Boolean);
        const key = parts.length ? parts[parts.length - 1] : "home";
        this.menuState?.setActive(key || "home");
      }
    });
  }
  // menuState se inyecta en el constructor
  handleScroll(event2) {
    this.offset = window.scrollY || document.documentElement.scrollTop;
    this.isAtTop = this.offset === 0;
  }
  get shouldShowHeader() {
    return this.offset > this.headerHeight;
  }
  ngOnInit() {
    this.items = this.menuState.getHeaderRoutes().map((r) => ({
      label: r.label,
      icon: "",
      routerLink: r.path,
      key: r.key
    }));
    this.menuState.getActive().subscribe((k) => {
      this.isHome = k === "home";
      this.isGuiaCanales = k === "guia-canales";
      this.isSeries = k === "series";
      this.isPeliculas = k === "peliculas";
    });
    this.menuState.getMobile().subscribe((open) => {
      this.isViewable = !!open;
      if (this.isViewable) {
        this.renderer.setStyle(document.body, "overflow", "hidden");
      } else {
        this.renderer.removeStyle(document.body, "overflow");
      }
    });
  }
  openMenu() {
    this.menuVisible = !this.menuVisible;
  }
  openAcc() {
    this.accVisible = !this.accVisible;
  }
  toggleMenu() {
    this.menuState.toggleMobile();
  }
  // Navegar desde header y actualizar estado compartido
  navigateFromHeader(item) {
    if (!item || !item.routerLink)
      return;
    this.router.navigateByUrl(item.routerLink).then(() => {
      if (item.key)
        this.menuState.setActive(item.key);
    });
  }
};
_HeaderComponent.\u0275fac = function HeaderComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _HeaderComponent)(\u0275\u0275directiveInject(RendererFactory2), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(MenuStateService));
};
_HeaderComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HeaderComponent, selectors: [["app-header"]], hostBindings: function HeaderComponent_HostBindings(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275listener("scroll", function HeaderComponent_scroll_HostBindingHandler($event) {
      return ctx.handleScroll($event);
    }, \u0275\u0275resolveWindow);
  }
}, decls: 2, vars: 2, consts: [["class", "font-bold text-lg flex items-center gap-x-3 md:hidden py-10 px-5 sm:px-10 z-30", 4, "ngIf"], ["class", "h-full absolute z-30 bg-gray-500/30 w-full mobile-menu-overlay", 4, "ngIf"], [1, "font-bold", "text-lg", "flex", "items-center", "gap-x-3", "md:hidden", "py-10", "px-5", "sm:px-10", "z-30"], [1, "mr-6", "menu-toggle", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "stroke-width", "2", 1, "h-7", "w-7", "text-gray-700", "dark:text-white", "icon-interactive"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M4 6h16M4 12h16M4 18h7"], ["routerLink", "/", 1, "cursor-pointer", "logo-container"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "h-8", "w-8", "fill-red-600", "shrink-0", "logo-icon"], ["d", "M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"], [1, "tracking-wide", "dark:text-white", "flex-1", "logo-text"], [1, "text-red-600"], [1, "h-full", "absolute", "z-30", "bg-gray-500/30", "w-full", "mobile-menu-overlay"], [1, "w-1/2", "py-10", "pl-10", "min-w-min", "border-r", "border-gray-300", "dark:border-zinc-700", "md:block", "z-30", "lg:hidden", "bg-white", "dark:bg-zinc-800", "h-[100vh]", "mobile-menu-container"], [1, "flex", "justify-end"], [1, "mr-6", "close-button", "p-1", 3, "click"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M6 18L18 6M6 6l12 12"]], template: function HeaderComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, HeaderComponent_header_0_Template, 12, 0, "header", 0)(1, HeaderComponent_aside_1_Template, 7, 0, "aside", 1);
  }
  if (rf & 2) {
    \u0275\u0275property("ngIf", !ctx.isViewable);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isViewable);
  }
}, dependencies: [CommonModule, NgIf, AutocompleteComponent, MenuComponent], styles: ["\n\nheader.header-hidden[_ngcontent-%COMP%] {\n  transform: translateY(-100%);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nheader.header-visible[_ngcontent-%COMP%] {\n  transform: translateY(0);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nheader.header-blur[_ngcontent-%COMP%] {\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  background-color: rgba(255, 255, 255, 0.8);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n}\n@media (prefers-color-scheme: dark) {\n  header.header-blur[_ngcontent-%COMP%] {\n    background-color: rgba(24, 24, 27, 0.8);\n    border-bottom-color: rgba(255, 255, 255, 0.1);\n  }\n}\n.menu-toggle[_ngcontent-%COMP%] {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\n.menu-toggle[_ngcontent-%COMP%]:hover {\n  transform: scale(1.05);\n}\n.menu-toggle[_ngcontent-%COMP%]:active {\n  transform: scale(0.95);\n}\n.logo-container[_ngcontent-%COMP%] {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\n.logo-container[_ngcontent-%COMP%]:hover {\n  transform: scale(1.02);\n}\n.logo-container[_ngcontent-%COMP%]   .logo-icon[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.mobile-menu-overlay[_ngcontent-%COMP%] {\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mobile-menu-overlay.menu-entering[_ngcontent-%COMP%] {\n  opacity: 0;\n  transform: translateX(-100%);\n}\n.mobile-menu-overlay.menu-entered[_ngcontent-%COMP%] {\n  opacity: 1;\n  transform: translateX(0);\n}\n.mobile-menu-container[_ngcontent-%COMP%] {\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\n  will-change: transform;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-color-scheme: dark) {\n  .mobile-menu-container[_ngcontent-%COMP%] {\n    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);\n  }\n}\n.close-button[_ngcontent-%COMP%] {\n  will-change: transform;\n  transition: all 0.2s ease;\n  border-radius: 0.375rem;\n}\n.close-button[_ngcontent-%COMP%]:hover {\n  background-color: rgba(0, 0, 0, 0.05);\n  transform: rotate(90deg);\n}\n@media (prefers-color-scheme: dark) {\n  .close-button[_ngcontent-%COMP%]:hover {\n    background-color: rgba(255, 255, 255, 0.05);\n  }\n}\n.close-button[_ngcontent-%COMP%]:active {\n  transform: rotate(90deg) scale(0.95);\n}\nsvg[_ngcontent-%COMP%] {\n  shape-rendering: geometricPrecision;\n}\nsvg.icon-interactive[_ngcontent-%COMP%] {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\nsvg.icon-interactive[_ngcontent-%COMP%]:hover {\n  transform: scale(1.1);\n}\nbutton[_ngcontent-%COMP%]:focus-visible, \n[role=button][_ngcontent-%COMP%]:focus-visible, \na[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.25rem;\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%] {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .logo-text[_ngcontent-%COMP%] {\n    font-weight: 700;\n  }\n  svg[_ngcontent-%COMP%] {\n    stroke-width: 2.5;\n  }\n}\n/*# sourceMappingURL=header.component.css.map */"] });
var HeaderComponent = _HeaderComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HeaderComponent, [{
    type: Component,
    args: [{ selector: "app-header", standalone: true, imports: [CommonModule, AutocompleteComponent, MenuComponent], template: '<header\r\n  *ngIf="!isViewable"\r\n  class="font-bold text-lg flex items-center gap-x-3 md:hidden py-10 px-5 sm:px-10 z-30"\r\n>\r\n  <span (click)="toggleMenu()" class="mr-6 menu-toggle">\r\n    <svg\r\n      xmlns="http://www.w3.org/2000/svg"\r\n      class="h-7 w-7 text-gray-700 dark:text-white icon-interactive"\r\n      fill="none"\r\n      viewBox="0 0 24 24"\r\n      stroke="currentColor"\r\n      stroke-width="2"\r\n    >\r\n      <path\r\n        stroke-linecap="round"\r\n        stroke-linejoin="round"\r\n        d="M4 6h16M4 12h16M4 18h7"\r\n      />\r\n    </svg>\r\n  </span>  <div class="cursor-pointer logo-container" routerLink="/">\r\n    <svg\r\n      class="h-8 w-8 fill-red-600 shrink-0 logo-icon"\r\n      xmlns="http://www.w3.org/2000/svg"\r\n      viewBox="0 0 24 24"\r\n    >\r\n      <path\r\n        d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r\n      ></path>\r\n    </svg>    <div class="tracking-wide dark:text-white flex-1 logo-text">\r\n      GPTV<span class="text-red-600">.</span>\r\n    </div>\r\n  </div>\r\n\r\n  <app-autocomplete></app-autocomplete>\r\n</header>\r\n\r\n<aside *ngIf="isViewable" class="h-full absolute z-30 bg-gray-500/30 w-full mobile-menu-overlay">\r\n  <div\r\n    class="w-1/2 py-10 pl-10 min-w-min border-r border-gray-300 dark:border-zinc-700 md:block z-30 lg:hidden bg-white dark:bg-zinc-800 h-[100vh] mobile-menu-container"\r\n  >\r\n    <!-- BOTON DE CERRAR MENU CON UNA X -->\r\n    <div class="flex justify-end">\r\n      <span (click)="toggleMenu()" class="mr-6 close-button p-1">\r\n        <svg\r\n          xmlns="http://www.w3.org/2000/svg"\r\n          class="h-7 w-7 text-gray-700 dark:text-white icon-interactive"\r\n          fill="none"\r\n          viewBox="0 0 24 24"\r\n          stroke="currentColor"\r\n          stroke-width="2"\r\n        >\r\n          <path\r\n            stroke-linecap="round"\r\n            stroke-linejoin="round"\r\n            d="M6 18L18 6M6 6l12 12"\r\n          />\r\n        </svg>\r\n      </span>\r\n    </div>\r\n\r\n    <!-- Menu -->\r\n    <app-menu></app-menu>\r\n    <!-- /Menu -->\r\n  </div>\r\n</aside>\r\n', styles: ["/* src/app/components/header/header.component.scss */\nheader.header-hidden {\n  transform: translateY(-100%);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nheader.header-visible {\n  transform: translateY(0);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\nheader.header-blur {\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  background-color: rgba(255, 255, 255, 0.8);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n}\n@media (prefers-color-scheme: dark) {\n  header.header-blur {\n    background-color: rgba(24, 24, 27, 0.8);\n    border-bottom-color: rgba(255, 255, 255, 0.1);\n  }\n}\n.menu-toggle {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\n.menu-toggle:hover {\n  transform: scale(1.05);\n}\n.menu-toggle:active {\n  transform: scale(0.95);\n}\n.logo-container {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\n.logo-container:hover {\n  transform: scale(1.02);\n}\n.logo-container .logo-icon {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n.mobile-menu-overlay {\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mobile-menu-overlay.menu-entering {\n  opacity: 0;\n  transform: translateX(-100%);\n}\n.mobile-menu-overlay.menu-entered {\n  opacity: 1;\n  transform: translateX(0);\n}\n.mobile-menu-container {\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\n  will-change: transform;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n@media (prefers-color-scheme: dark) {\n  .mobile-menu-container {\n    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);\n  }\n}\n.close-button {\n  will-change: transform;\n  transition: all 0.2s ease;\n  border-radius: 0.375rem;\n}\n.close-button:hover {\n  background-color: rgba(0, 0, 0, 0.05);\n  transform: rotate(90deg);\n}\n@media (prefers-color-scheme: dark) {\n  .close-button:hover {\n    background-color: rgba(255, 255, 255, 0.05);\n  }\n}\n.close-button:active {\n  transform: rotate(90deg) scale(0.95);\n}\nsvg {\n  shape-rendering: geometricPrecision;\n}\nsvg.icon-interactive {\n  will-change: transform;\n  transition: transform 0.2s ease;\n}\nsvg.icon-interactive:hover {\n  transform: scale(1.1);\n}\nbutton:focus-visible,\n[role=button]:focus-visible,\na:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.25rem;\n}\n@media (prefers-reduced-motion: reduce) {\n  * {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .logo-text {\n    font-weight: 700;\n  }\n  svg {\n    stroke-width: 2.5;\n  }\n}\n/*# sourceMappingURL=header.component.css.map */\n"] }]
  }], () => [{ type: RendererFactory2 }, { type: Router }, { type: MenuStateService }], { handleScroll: [{
    type: HostListener,
    args: ["window:scroll", ["$event"]]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HeaderComponent, { className: "HeaderComponent", filePath: "src/app/components/header/header.component.ts", lineNumber: 20 });
})();

// node_modules/swiper/shared/ssr-window.esm.mjs
function isObject(obj) {
  return obj !== null && typeof obj === "object" && "constructor" in obj && obj.constructor === Object;
}
function extend(target, src) {
  if (target === void 0) {
    target = {};
  }
  if (src === void 0) {
    src = {};
  }
  const noExtend = ["__proto__", "constructor", "prototype"];
  Object.keys(src).filter((key) => noExtend.indexOf(key) < 0).forEach((key) => {
    if (typeof target[key] === "undefined") target[key] = src[key];
    else if (isObject(src[key]) && isObject(target[key]) && Object.keys(src[key]).length > 0) {
      extend(target[key], src[key]);
    }
  });
}
var ssrDocument = {
  body: {},
  addEventListener() {
  },
  removeEventListener() {
  },
  activeElement: {
    blur() {
    },
    nodeName: ""
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  getElementById() {
    return null;
  },
  createEvent() {
    return {
      initEvent() {
      }
    };
  },
  createElement() {
    return {
      children: [],
      childNodes: [],
      style: {},
      setAttribute() {
      },
      getElementsByTagName() {
        return [];
      }
    };
  },
  createElementNS() {
    return {};
  },
  importNode() {
    return null;
  },
  location: {
    hash: "",
    host: "",
    hostname: "",
    href: "",
    origin: "",
    pathname: "",
    protocol: "",
    search: ""
  }
};
function getDocument() {
  const doc = typeof document !== "undefined" ? document : {};
  extend(doc, ssrDocument);
  return doc;
}
var ssrWindow = {
  document: ssrDocument,
  navigator: {
    userAgent: ""
  },
  location: {
    hash: "",
    host: "",
    hostname: "",
    href: "",
    origin: "",
    pathname: "",
    protocol: "",
    search: ""
  },
  history: {
    replaceState() {
    },
    pushState() {
    },
    go() {
    },
    back() {
    }
  },
  CustomEvent: function CustomEvent() {
    return this;
  },
  addEventListener() {
  },
  removeEventListener() {
  },
  getComputedStyle() {
    return {
      getPropertyValue() {
        return "";
      }
    };
  },
  Image() {
  },
  Date() {
  },
  screen: {},
  setTimeout() {
  },
  clearTimeout() {
  },
  matchMedia() {
    return {};
  },
  requestAnimationFrame(callback) {
    if (typeof setTimeout === "undefined") {
      callback();
      return null;
    }
    return setTimeout(callback, 0);
  },
  cancelAnimationFrame(id) {
    if (typeof setTimeout === "undefined") {
      return;
    }
    clearTimeout(id);
  }
};
function getWindow() {
  const win = typeof window !== "undefined" ? window : {};
  extend(win, ssrWindow);
  return win;
}

// node_modules/swiper/shared/utils.mjs
function classesToTokens(classes) {
  if (classes === void 0) {
    classes = "";
  }
  return classes.trim().split(" ").filter((c) => !!c.trim());
}
function elementChildren(element, selector) {
  if (selector === void 0) {
    selector = "";
  }
  const window2 = getWindow();
  const children = [...element.children];
  if (window2.HTMLSlotElement && element instanceof HTMLSlotElement) {
    children.push(...element.assignedElements());
  }
  if (!selector) {
    return children;
  }
  return children.filter((el) => el.matches(selector));
}
function createElement(tag, classes) {
  if (classes === void 0) {
    classes = [];
  }
  const el = document.createElement(tag);
  el.classList.add(...Array.isArray(classes) ? classes : classesToTokens(classes));
  return el;
}
function elementIndex(el) {
  let child = el;
  let i;
  if (child) {
    i = 0;
    while ((child = child.previousSibling) !== null) {
      if (child.nodeType === 1) i += 1;
    }
    return i;
  }
  return void 0;
}
function elementParents(el, selector) {
  const parents = [];
  let parent = el.parentElement;
  while (parent) {
    if (selector) {
      if (parent.matches(selector)) parents.push(parent);
    } else {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }
  return parents;
}
function elementOuterSize(el, size, includeMargins) {
  const window2 = getWindow();
  if (includeMargins) {
    return el[size === "width" ? "offsetWidth" : "offsetHeight"] + parseFloat(window2.getComputedStyle(el, null).getPropertyValue(size === "width" ? "margin-right" : "margin-top")) + parseFloat(window2.getComputedStyle(el, null).getPropertyValue(size === "width" ? "margin-left" : "margin-bottom"));
  }
  return el.offsetWidth;
}
function makeElementsArray(el) {
  return (Array.isArray(el) ? el : [el]).filter((e) => !!e);
}
function setInnerHTML(el, html) {
  if (html === void 0) {
    html = "";
  }
  if (typeof trustedTypes !== "undefined") {
    el.innerHTML = trustedTypes.createPolicy("html", {
      createHTML: (s) => s
    }).createHTML(html);
  } else {
    el.innerHTML = html;
  }
}

// node_modules/swiper/shared/create-element-if-not-defined.mjs
function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
  if (swiper.params.createElements) {
    Object.keys(checkProps).forEach((key) => {
      if (!params[key] && params.auto === true) {
        let element = elementChildren(swiper.el, `.${checkProps[key]}`)[0];
        if (!element) {
          element = createElement("div", checkProps[key]);
          element.className = checkProps[key];
          swiper.el.append(element);
        }
        params[key] = element;
        originalParams[key] = element;
      }
    });
  }
  return params;
}

// node_modules/swiper/modules/navigation.mjs
function Navigation(_ref) {
  let {
    swiper,
    extendParams,
    on,
    emit
  } = _ref;
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      hideOnClick: false,
      disabledClass: "swiper-button-disabled",
      hiddenClass: "swiper-button-hidden",
      lockClass: "swiper-button-lock",
      navigationDisabledClass: "swiper-navigation-disabled"
    }
  });
  swiper.navigation = {
    nextEl: null,
    prevEl: null
  };
  function getEl(el) {
    let res;
    if (el && typeof el === "string" && swiper.isElement) {
      res = swiper.el.querySelector(el) || swiper.hostEl.querySelector(el);
      if (res) return res;
    }
    if (el) {
      if (typeof el === "string") res = [...document.querySelectorAll(el)];
      if (swiper.params.uniqueNavElements && typeof el === "string" && res && res.length > 1 && swiper.el.querySelectorAll(el).length === 1) {
        res = swiper.el.querySelector(el);
      } else if (res && res.length === 1) {
        res = res[0];
      }
    }
    if (el && !res) return el;
    return res;
  }
  function toggleEl(el, disabled) {
    const params = swiper.params.navigation;
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      if (subEl) {
        subEl.classList[disabled ? "add" : "remove"](...params.disabledClass.split(" "));
        if (subEl.tagName === "BUTTON") subEl.disabled = disabled;
        if (swiper.params.watchOverflow && swiper.enabled) {
          subEl.classList[swiper.isLocked ? "add" : "remove"](params.lockClass);
        }
      }
    });
  }
  function update() {
    const {
      nextEl,
      prevEl
    } = swiper.navigation;
    if (swiper.params.loop) {
      toggleEl(prevEl, false);
      toggleEl(nextEl, false);
      return;
    }
    toggleEl(prevEl, swiper.isBeginning && !swiper.params.rewind);
    toggleEl(nextEl, swiper.isEnd && !swiper.params.rewind);
  }
  function onPrevClick(e) {
    e.preventDefault();
    if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind) return;
    swiper.slidePrev();
    emit("navigationPrev");
  }
  function onNextClick(e) {
    e.preventDefault();
    if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind) return;
    swiper.slideNext();
    emit("navigationNext");
  }
  function init() {
    const params = swiper.params.navigation;
    swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
      nextEl: "swiper-button-next",
      prevEl: "swiper-button-prev"
    });
    if (!(params.nextEl || params.prevEl)) return;
    let nextEl = getEl(params.nextEl);
    let prevEl = getEl(params.prevEl);
    Object.assign(swiper.navigation, {
      nextEl,
      prevEl
    });
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const initButton = (el, dir) => {
      if (el) {
        el.addEventListener("click", dir === "next" ? onNextClick : onPrevClick);
      }
      if (!swiper.enabled && el) {
        el.classList.add(...params.lockClass.split(" "));
      }
    };
    nextEl.forEach((el) => initButton(el, "next"));
    prevEl.forEach((el) => initButton(el, "prev"));
  }
  function destroy() {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const destroyButton = (el, dir) => {
      el.removeEventListener("click", dir === "next" ? onNextClick : onPrevClick);
      el.classList.remove(...swiper.params.navigation.disabledClass.split(" "));
    };
    nextEl.forEach((el) => destroyButton(el, "next"));
    prevEl.forEach((el) => destroyButton(el, "prev"));
  }
  on("init", () => {
    if (swiper.params.navigation.enabled === false) {
      disable();
    } else {
      init();
      update();
    }
  });
  on("toEdge fromEdge lock unlock", () => {
    update();
  });
  on("destroy", () => {
    destroy();
  });
  on("enable disable", () => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (swiper.enabled) {
      update();
      return;
    }
    [...nextEl, ...prevEl].filter((el) => !!el).forEach((el) => el.classList.add(swiper.params.navigation.lockClass));
  });
  on("click", (_s, e) => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const targetEl = e.target;
    let targetIsButton = prevEl.includes(targetEl) || nextEl.includes(targetEl);
    if (swiper.isElement && !targetIsButton) {
      const path = e.path || e.composedPath && e.composedPath();
      if (path) {
        targetIsButton = path.find((pathEl) => nextEl.includes(pathEl) || prevEl.includes(pathEl));
      }
    }
    if (swiper.params.navigation.hideOnClick && !targetIsButton) {
      if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl))) return;
      let isHidden;
      if (nextEl.length) {
        isHidden = nextEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      } else if (prevEl.length) {
        isHidden = prevEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      }
      if (isHidden === true) {
        emit("navigationShow");
      } else {
        emit("navigationHide");
      }
      [...nextEl, ...prevEl].filter((el) => !!el).forEach((el) => el.classList.toggle(swiper.params.navigation.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(...swiper.params.navigation.navigationDisabledClass.split(" "));
    init();
    update();
  };
  const disable = () => {
    swiper.el.classList.add(...swiper.params.navigation.navigationDisabledClass.split(" "));
    destroy();
  };
  Object.assign(swiper.navigation, {
    enable,
    disable,
    update,
    init,
    destroy
  });
}

// node_modules/swiper/shared/classes-to-selector.mjs
function classesToSelector(classes) {
  if (classes === void 0) {
    classes = "";
  }
  return `.${classes.trim().replace(/([\.:!+\/()[\]])/g, "\\$1").replace(/ /g, ".")}`;
}

// node_modules/swiper/modules/pagination.mjs
function Pagination(_ref) {
  let {
    swiper,
    extendParams,
    on,
    emit
  } = _ref;
  const pfx = "swiper-pagination";
  extendParams({
    pagination: {
      el: null,
      bulletElement: "span",
      clickable: false,
      hideOnClick: false,
      renderBullet: null,
      renderProgressbar: null,
      renderFraction: null,
      renderCustom: null,
      progressbarOpposite: false,
      type: "bullets",
      // 'bullets' or 'progressbar' or 'fraction' or 'custom'
      dynamicBullets: false,
      dynamicMainBullets: 1,
      formatFractionCurrent: (number) => number,
      formatFractionTotal: (number) => number,
      bulletClass: `${pfx}-bullet`,
      bulletActiveClass: `${pfx}-bullet-active`,
      modifierClass: `${pfx}-`,
      currentClass: `${pfx}-current`,
      totalClass: `${pfx}-total`,
      hiddenClass: `${pfx}-hidden`,
      progressbarFillClass: `${pfx}-progressbar-fill`,
      progressbarOppositeClass: `${pfx}-progressbar-opposite`,
      clickableClass: `${pfx}-clickable`,
      lockClass: `${pfx}-lock`,
      horizontalClass: `${pfx}-horizontal`,
      verticalClass: `${pfx}-vertical`,
      paginationDisabledClass: `${pfx}-disabled`
    }
  });
  swiper.pagination = {
    el: null,
    bullets: []
  };
  let bulletSize;
  let dynamicBulletIndex = 0;
  function isPaginationDisabled() {
    return !swiper.params.pagination.el || !swiper.pagination.el || Array.isArray(swiper.pagination.el) && swiper.pagination.el.length === 0;
  }
  function setSideBullets(bulletEl, position) {
    const {
      bulletActiveClass
    } = swiper.params.pagination;
    if (!bulletEl) return;
    bulletEl = bulletEl[`${position === "prev" ? "previous" : "next"}ElementSibling`];
    if (bulletEl) {
      bulletEl.classList.add(`${bulletActiveClass}-${position}`);
      bulletEl = bulletEl[`${position === "prev" ? "previous" : "next"}ElementSibling`];
      if (bulletEl) {
        bulletEl.classList.add(`${bulletActiveClass}-${position}-${position}`);
      }
    }
  }
  function getMoveDirection(prevIndex, nextIndex, length) {
    prevIndex = prevIndex % length;
    nextIndex = nextIndex % length;
    if (nextIndex === prevIndex + 1) {
      return "next";
    } else if (nextIndex === prevIndex - 1) {
      return "previous";
    }
    return;
  }
  function onBulletClick(e) {
    const bulletEl = e.target.closest(classesToSelector(swiper.params.pagination.bulletClass));
    if (!bulletEl) {
      return;
    }
    e.preventDefault();
    const index = elementIndex(bulletEl) * swiper.params.slidesPerGroup;
    if (swiper.params.loop) {
      if (swiper.realIndex === index) return;
      const moveDirection = getMoveDirection(swiper.realIndex, index, swiper.slides.length);
      if (moveDirection === "next") {
        swiper.slideNext();
      } else if (moveDirection === "previous") {
        swiper.slidePrev();
      } else {
        swiper.slideToLoop(index);
      }
    } else {
      swiper.slideTo(index);
    }
  }
  function update() {
    const rtl = swiper.rtl;
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    let current;
    let previousIndex;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
    const total = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
    if (swiper.params.loop) {
      previousIndex = swiper.previousRealIndex || 0;
      current = swiper.params.slidesPerGroup > 1 ? Math.floor(swiper.realIndex / swiper.params.slidesPerGroup) : swiper.realIndex;
    } else if (typeof swiper.snapIndex !== "undefined") {
      current = swiper.snapIndex;
      previousIndex = swiper.previousSnapIndex;
    } else {
      previousIndex = swiper.previousIndex || 0;
      current = swiper.activeIndex || 0;
    }
    if (params.type === "bullets" && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
      const bullets = swiper.pagination.bullets;
      let firstIndex;
      let lastIndex;
      let midIndex;
      if (params.dynamicBullets) {
        bulletSize = elementOuterSize(bullets[0], swiper.isHorizontal() ? "width" : "height", true);
        el.forEach((subEl) => {
          subEl.style[swiper.isHorizontal() ? "width" : "height"] = `${bulletSize * (params.dynamicMainBullets + 4)}px`;
        });
        if (params.dynamicMainBullets > 1 && previousIndex !== void 0) {
          dynamicBulletIndex += current - (previousIndex || 0);
          if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
            dynamicBulletIndex = params.dynamicMainBullets - 1;
          } else if (dynamicBulletIndex < 0) {
            dynamicBulletIndex = 0;
          }
        }
        firstIndex = Math.max(current - dynamicBulletIndex, 0);
        lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
        midIndex = (lastIndex + firstIndex) / 2;
      }
      bullets.forEach((bulletEl) => {
        const classesToRemove = [...["", "-next", "-next-next", "-prev", "-prev-prev", "-main"].map((suffix) => `${params.bulletActiveClass}${suffix}`)].map((s) => typeof s === "string" && s.includes(" ") ? s.split(" ") : s).flat();
        bulletEl.classList.remove(...classesToRemove);
      });
      if (el.length > 1) {
        bullets.forEach((bullet) => {
          const bulletIndex = elementIndex(bullet);
          if (bulletIndex === current) {
            bullet.classList.add(...params.bulletActiveClass.split(" "));
          } else if (swiper.isElement) {
            bullet.setAttribute("part", "bullet");
          }
          if (params.dynamicBullets) {
            if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
              bullet.classList.add(...`${params.bulletActiveClass}-main`.split(" "));
            }
            if (bulletIndex === firstIndex) {
              setSideBullets(bullet, "prev");
            }
            if (bulletIndex === lastIndex) {
              setSideBullets(bullet, "next");
            }
          }
        });
      } else {
        const bullet = bullets[current];
        if (bullet) {
          bullet.classList.add(...params.bulletActiveClass.split(" "));
        }
        if (swiper.isElement) {
          bullets.forEach((bulletEl, bulletIndex) => {
            bulletEl.setAttribute("part", bulletIndex === current ? "bullet-active" : "bullet");
          });
        }
        if (params.dynamicBullets) {
          const firstDisplayedBullet = bullets[firstIndex];
          const lastDisplayedBullet = bullets[lastIndex];
          for (let i = firstIndex; i <= lastIndex; i += 1) {
            if (bullets[i]) {
              bullets[i].classList.add(...`${params.bulletActiveClass}-main`.split(" "));
            }
          }
          setSideBullets(firstDisplayedBullet, "prev");
          setSideBullets(lastDisplayedBullet, "next");
        }
      }
      if (params.dynamicBullets) {
        const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
        const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
        const offsetProp = rtl ? "right" : "left";
        bullets.forEach((bullet) => {
          bullet.style[swiper.isHorizontal() ? offsetProp : "top"] = `${bulletsOffset}px`;
        });
      }
    }
    el.forEach((subEl, subElIndex) => {
      if (params.type === "fraction") {
        subEl.querySelectorAll(classesToSelector(params.currentClass)).forEach((fractionEl) => {
          fractionEl.textContent = params.formatFractionCurrent(current + 1);
        });
        subEl.querySelectorAll(classesToSelector(params.totalClass)).forEach((totalEl) => {
          totalEl.textContent = params.formatFractionTotal(total);
        });
      }
      if (params.type === "progressbar") {
        let progressbarDirection;
        if (params.progressbarOpposite) {
          progressbarDirection = swiper.isHorizontal() ? "vertical" : "horizontal";
        } else {
          progressbarDirection = swiper.isHorizontal() ? "horizontal" : "vertical";
        }
        const scale = (current + 1) / total;
        let scaleX = 1;
        let scaleY = 1;
        if (progressbarDirection === "horizontal") {
          scaleX = scale;
        } else {
          scaleY = scale;
        }
        subEl.querySelectorAll(classesToSelector(params.progressbarFillClass)).forEach((progressEl) => {
          progressEl.style.transform = `translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`;
          progressEl.style.transitionDuration = `${swiper.params.speed}ms`;
        });
      }
      if (params.type === "custom" && params.renderCustom) {
        setInnerHTML(subEl, params.renderCustom(swiper, current + 1, total));
        if (subElIndex === 0) emit("paginationRender", subEl);
      } else {
        if (subElIndex === 0) emit("paginationRender", subEl);
        emit("paginationUpdate", subEl);
      }
      if (swiper.params.watchOverflow && swiper.enabled) {
        subEl.classList[swiper.isLocked ? "add" : "remove"](params.lockClass);
      }
    });
  }
  function render() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.grid && swiper.params.grid.rows > 1 ? swiper.slides.length / Math.ceil(swiper.params.grid.rows) : swiper.slides.length;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    let paginationHTML = "";
    if (params.type === "bullets") {
      let numberOfBullets = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
      if (swiper.params.freeMode && swiper.params.freeMode.enabled && numberOfBullets > slidesLength) {
        numberOfBullets = slidesLength;
      }
      for (let i = 0; i < numberOfBullets; i += 1) {
        if (params.renderBullet) {
          paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
        } else {
          paginationHTML += `<${params.bulletElement} ${swiper.isElement ? 'part="bullet"' : ""} class="${params.bulletClass}"></${params.bulletElement}>`;
        }
      }
    }
    if (params.type === "fraction") {
      if (params.renderFraction) {
        paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
      } else {
        paginationHTML = `<span class="${params.currentClass}"></span> / <span class="${params.totalClass}"></span>`;
      }
    }
    if (params.type === "progressbar") {
      if (params.renderProgressbar) {
        paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
      } else {
        paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
      }
    }
    swiper.pagination.bullets = [];
    el.forEach((subEl) => {
      if (params.type !== "custom") {
        setInnerHTML(subEl, paginationHTML || "");
      }
      if (params.type === "bullets") {
        swiper.pagination.bullets.push(...subEl.querySelectorAll(classesToSelector(params.bulletClass)));
      }
    });
    if (params.type !== "custom") {
      emit("paginationRender", el[0]);
    }
  }
  function init() {
    swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
      el: "swiper-pagination"
    });
    const params = swiper.params.pagination;
    if (!params.el) return;
    let el;
    if (typeof params.el === "string" && swiper.isElement) {
      el = swiper.el.querySelector(params.el);
    }
    if (!el && typeof params.el === "string") {
      el = [...document.querySelectorAll(params.el)];
    }
    if (!el) {
      el = params.el;
    }
    if (!el || el.length === 0) return;
    if (swiper.params.uniqueNavElements && typeof params.el === "string" && Array.isArray(el) && el.length > 1) {
      el = [...swiper.el.querySelectorAll(params.el)];
      if (el.length > 1) {
        el = el.find((subEl) => {
          if (elementParents(subEl, ".swiper")[0] !== swiper.el) return false;
          return true;
        });
      }
    }
    if (Array.isArray(el) && el.length === 1) el = el[0];
    Object.assign(swiper.pagination, {
      el
    });
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      if (params.type === "bullets" && params.clickable) {
        subEl.classList.add(...(params.clickableClass || "").split(" "));
      }
      subEl.classList.add(params.modifierClass + params.type);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
      if (params.type === "bullets" && params.dynamicBullets) {
        subEl.classList.add(`${params.modifierClass}${params.type}-dynamic`);
        dynamicBulletIndex = 0;
        if (params.dynamicMainBullets < 1) {
          params.dynamicMainBullets = 1;
        }
      }
      if (params.type === "progressbar" && params.progressbarOpposite) {
        subEl.classList.add(params.progressbarOppositeClass);
      }
      if (params.clickable) {
        subEl.addEventListener("click", onBulletClick);
      }
      if (!swiper.enabled) {
        subEl.classList.add(params.lockClass);
      }
    });
  }
  function destroy() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    let el = swiper.pagination.el;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => {
        subEl.classList.remove(params.hiddenClass);
        subEl.classList.remove(params.modifierClass + params.type);
        subEl.classList.remove(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        if (params.clickable) {
          subEl.classList.remove(...(params.clickableClass || "").split(" "));
          subEl.removeEventListener("click", onBulletClick);
        }
      });
    }
    if (swiper.pagination.bullets) swiper.pagination.bullets.forEach((subEl) => subEl.classList.remove(...params.bulletActiveClass.split(" ")));
  }
  on("changeDirection", () => {
    if (!swiper.pagination || !swiper.pagination.el) return;
    const params = swiper.params.pagination;
    let {
      el
    } = swiper.pagination;
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.classList.remove(params.horizontalClass, params.verticalClass);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
    });
  });
  on("init", () => {
    if (swiper.params.pagination.enabled === false) {
      disable();
    } else {
      init();
      render();
      update();
    }
  });
  on("activeIndexChange", () => {
    if (typeof swiper.snapIndex === "undefined") {
      update();
    }
  });
  on("snapIndexChange", () => {
    update();
  });
  on("snapGridLengthChange", () => {
    render();
    update();
  });
  on("destroy", () => {
    destroy();
  });
  on("enable disable", () => {
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList[swiper.enabled ? "remove" : "add"](swiper.params.pagination.lockClass));
    }
  });
  on("lock unlock", () => {
    update();
  });
  on("click", (_s, e) => {
    const targetEl = e.target;
    const el = makeElementsArray(swiper.pagination.el);
    if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && el && el.length > 0 && !targetEl.classList.contains(swiper.params.pagination.bulletClass)) {
      if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl)) return;
      const isHidden = el[0].classList.contains(swiper.params.pagination.hiddenClass);
      if (isHidden === true) {
        emit("paginationShow");
      } else {
        emit("paginationHide");
      }
      el.forEach((subEl) => subEl.classList.toggle(swiper.params.pagination.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList.remove(swiper.params.pagination.paginationDisabledClass));
    }
    init();
    render();
    update();
  };
  const disable = () => {
    swiper.el.classList.add(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList.add(swiper.params.pagination.paginationDisabledClass));
    }
    destroy();
  };
  Object.assign(swiper.pagination, {
    enable,
    disable,
    render,
    update,
    init,
    destroy
  });
}

// node_modules/swiper/modules/a11y.mjs
function A11y(_ref) {
  let {
    swiper,
    extendParams,
    on
  } = _ref;
  extendParams({
    a11y: {
      enabled: true,
      notificationClass: "swiper-notification",
      prevSlideMessage: "Previous slide",
      nextSlideMessage: "Next slide",
      firstSlideMessage: "This is the first slide",
      lastSlideMessage: "This is the last slide",
      paginationBulletMessage: "Go to slide {{index}}",
      slideLabelMessage: "{{index}} / {{slidesLength}}",
      containerMessage: null,
      containerRoleDescriptionMessage: null,
      containerRole: null,
      itemRoleDescriptionMessage: null,
      slideRole: "group",
      id: null,
      scrollOnFocus: true
    }
  });
  swiper.a11y = {
    clicked: false
  };
  let liveRegion = null;
  let preventFocusHandler;
  let focusTargetSlideEl;
  let visibilityChangedTimestamp = (/* @__PURE__ */ new Date()).getTime();
  function notify(message) {
    const notification = liveRegion;
    if (notification.length === 0) return;
    setInnerHTML(notification, message);
  }
  function getRandomNumber(size) {
    if (size === void 0) {
      size = 16;
    }
    const randomChar = () => Math.round(16 * Math.random()).toString(16);
    return "x".repeat(size).replace(/x/g, randomChar);
  }
  function makeElFocusable(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("tabIndex", "0");
    });
  }
  function makeElNotFocusable(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("tabIndex", "-1");
    });
  }
  function addElRole(el, role) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("role", role);
    });
  }
  function addElRoleDescription(el, description) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-roledescription", description);
    });
  }
  function addElControls(el, controls) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-controls", controls);
    });
  }
  function addElLabel(el, label) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-label", label);
    });
  }
  function addElId(el, id) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("id", id);
    });
  }
  function addElLive(el, live) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-live", live);
    });
  }
  function disableEl(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-disabled", true);
    });
  }
  function enableEl(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-disabled", false);
    });
  }
  function onEnterOrSpaceKey(e) {
    if (e.keyCode !== 13 && e.keyCode !== 32) return;
    const params = swiper.params.a11y;
    const targetEl = e.target;
    if (swiper.pagination && swiper.pagination.el && (targetEl === swiper.pagination.el || swiper.pagination.el.contains(e.target))) {
      if (!e.target.matches(classesToSelector(swiper.params.pagination.bulletClass))) return;
    }
    if (swiper.navigation && swiper.navigation.prevEl && swiper.navigation.nextEl) {
      const prevEls = makeElementsArray(swiper.navigation.prevEl);
      const nextEls = makeElementsArray(swiper.navigation.nextEl);
      if (nextEls.includes(targetEl)) {
        if (!(swiper.isEnd && !swiper.params.loop)) {
          swiper.slideNext();
        }
        if (swiper.isEnd) {
          notify(params.lastSlideMessage);
        } else {
          notify(params.nextSlideMessage);
        }
      }
      if (prevEls.includes(targetEl)) {
        if (!(swiper.isBeginning && !swiper.params.loop)) {
          swiper.slidePrev();
        }
        if (swiper.isBeginning) {
          notify(params.firstSlideMessage);
        } else {
          notify(params.prevSlideMessage);
        }
      }
    }
    if (swiper.pagination && targetEl.matches(classesToSelector(swiper.params.pagination.bulletClass))) {
      targetEl.click();
    }
  }
  function updateNavigation() {
    if (swiper.params.loop || swiper.params.rewind || !swiper.navigation) return;
    const {
      nextEl,
      prevEl
    } = swiper.navigation;
    if (prevEl) {
      if (swiper.isBeginning) {
        disableEl(prevEl);
        makeElNotFocusable(prevEl);
      } else {
        enableEl(prevEl);
        makeElFocusable(prevEl);
      }
    }
    if (nextEl) {
      if (swiper.isEnd) {
        disableEl(nextEl);
        makeElNotFocusable(nextEl);
      } else {
        enableEl(nextEl);
        makeElFocusable(nextEl);
      }
    }
  }
  function hasPagination() {
    return swiper.pagination && swiper.pagination.bullets && swiper.pagination.bullets.length;
  }
  function hasClickablePagination() {
    return hasPagination() && swiper.params.pagination.clickable;
  }
  function updatePagination() {
    const params = swiper.params.a11y;
    if (!hasPagination()) return;
    swiper.pagination.bullets.forEach((bulletEl) => {
      if (swiper.params.pagination.clickable) {
        makeElFocusable(bulletEl);
        if (!swiper.params.pagination.renderBullet) {
          addElRole(bulletEl, "button");
          addElLabel(bulletEl, params.paginationBulletMessage.replace(/\{\{index\}\}/, elementIndex(bulletEl) + 1));
        }
      }
      if (bulletEl.matches(classesToSelector(swiper.params.pagination.bulletActiveClass))) {
        bulletEl.setAttribute("aria-current", "true");
      } else {
        bulletEl.removeAttribute("aria-current");
      }
    });
  }
  const initNavEl = (el, wrapperId, message) => {
    makeElFocusable(el);
    if (el.tagName !== "BUTTON") {
      addElRole(el, "button");
      el.addEventListener("keydown", onEnterOrSpaceKey);
    }
    addElLabel(el, message);
    addElControls(el, wrapperId);
  };
  const handlePointerDown = (e) => {
    if (focusTargetSlideEl && focusTargetSlideEl !== e.target && !focusTargetSlideEl.contains(e.target)) {
      preventFocusHandler = true;
    }
    swiper.a11y.clicked = true;
  };
  const handlePointerUp = () => {
    preventFocusHandler = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!swiper.destroyed) {
          swiper.a11y.clicked = false;
        }
      });
    });
  };
  const onVisibilityChange = (e) => {
    visibilityChangedTimestamp = (/* @__PURE__ */ new Date()).getTime();
  };
  const handleFocus = (e) => {
    if (swiper.a11y.clicked || !swiper.params.a11y.scrollOnFocus) return;
    if ((/* @__PURE__ */ new Date()).getTime() - visibilityChangedTimestamp < 100) return;
    const slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
    if (!slideEl || !swiper.slides.includes(slideEl)) return;
    focusTargetSlideEl = slideEl;
    const isActive = swiper.slides.indexOf(slideEl) === swiper.activeIndex;
    const isVisible = swiper.params.watchSlidesProgress && swiper.visibleSlides && swiper.visibleSlides.includes(slideEl);
    if (isActive || isVisible) return;
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (swiper.isHorizontal()) {
      swiper.el.scrollLeft = 0;
    } else {
      swiper.el.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      if (preventFocusHandler) return;
      if (swiper.params.loop) {
        swiper.slideToLoop(swiper.getSlideIndexWhenGrid(parseInt(slideEl.getAttribute("data-swiper-slide-index"))), 0);
      } else {
        swiper.slideTo(swiper.getSlideIndexWhenGrid(swiper.slides.indexOf(slideEl)), 0);
      }
      preventFocusHandler = false;
    });
  };
  const initSlides = () => {
    const params = swiper.params.a11y;
    if (params.itemRoleDescriptionMessage) {
      addElRoleDescription(swiper.slides, params.itemRoleDescriptionMessage);
    }
    if (params.slideRole) {
      addElRole(swiper.slides, params.slideRole);
    }
    const slidesLength = swiper.slides.length;
    if (params.slideLabelMessage) {
      swiper.slides.forEach((slideEl, index) => {
        const slideIndex = swiper.params.loop ? parseInt(slideEl.getAttribute("data-swiper-slide-index"), 10) : index;
        const ariaLabelMessage = params.slideLabelMessage.replace(/\{\{index\}\}/, slideIndex + 1).replace(/\{\{slidesLength\}\}/, slidesLength);
        addElLabel(slideEl, ariaLabelMessage);
      });
    }
  };
  const init = () => {
    const params = swiper.params.a11y;
    swiper.el.append(liveRegion);
    const containerEl = swiper.el;
    if (params.containerRoleDescriptionMessage) {
      addElRoleDescription(containerEl, params.containerRoleDescriptionMessage);
    }
    if (params.containerMessage) {
      addElLabel(containerEl, params.containerMessage);
    }
    if (params.containerRole) {
      addElRole(containerEl, params.containerRole);
    }
    const wrapperEl = swiper.wrapperEl;
    const wrapperId = params.id || wrapperEl.getAttribute("id") || `swiper-wrapper-${getRandomNumber(16)}`;
    const live = swiper.params.autoplay && swiper.params.autoplay.enabled ? "off" : "polite";
    addElId(wrapperEl, wrapperId);
    addElLive(wrapperEl, live);
    initSlides();
    let {
      nextEl,
      prevEl
    } = swiper.navigation ? swiper.navigation : {};
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (nextEl) {
      nextEl.forEach((el) => initNavEl(el, wrapperId, params.nextSlideMessage));
    }
    if (prevEl) {
      prevEl.forEach((el) => initNavEl(el, wrapperId, params.prevSlideMessage));
    }
    if (hasClickablePagination()) {
      const paginationEl = makeElementsArray(swiper.pagination.el);
      paginationEl.forEach((el) => {
        el.addEventListener("keydown", onEnterOrSpaceKey);
      });
    }
    const document2 = getDocument();
    document2.addEventListener("visibilitychange", onVisibilityChange);
    swiper.el.addEventListener("focus", handleFocus, true);
    swiper.el.addEventListener("focus", handleFocus, true);
    swiper.el.addEventListener("pointerdown", handlePointerDown, true);
    swiper.el.addEventListener("pointerup", handlePointerUp, true);
  };
  function destroy() {
    if (liveRegion) liveRegion.remove();
    let {
      nextEl,
      prevEl
    } = swiper.navigation ? swiper.navigation : {};
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (nextEl) {
      nextEl.forEach((el) => el.removeEventListener("keydown", onEnterOrSpaceKey));
    }
    if (prevEl) {
      prevEl.forEach((el) => el.removeEventListener("keydown", onEnterOrSpaceKey));
    }
    if (hasClickablePagination()) {
      const paginationEl = makeElementsArray(swiper.pagination.el);
      paginationEl.forEach((el) => {
        el.removeEventListener("keydown", onEnterOrSpaceKey);
      });
    }
    const document2 = getDocument();
    document2.removeEventListener("visibilitychange", onVisibilityChange);
    if (swiper.el && typeof swiper.el !== "string") {
      swiper.el.removeEventListener("focus", handleFocus, true);
      swiper.el.removeEventListener("pointerdown", handlePointerDown, true);
      swiper.el.removeEventListener("pointerup", handlePointerUp, true);
    }
  }
  on("beforeInit", () => {
    liveRegion = createElement("span", swiper.params.a11y.notificationClass);
    liveRegion.setAttribute("aria-live", "assertive");
    liveRegion.setAttribute("aria-atomic", "true");
  });
  on("afterInit", () => {
    if (!swiper.params.a11y.enabled) return;
    init();
  });
  on("slidesLengthChange snapGridLengthChange slidesGridLengthChange", () => {
    if (!swiper.params.a11y.enabled) return;
    initSlides();
  });
  on("fromEdge toEdge afterInit lock unlock", () => {
    if (!swiper.params.a11y.enabled) return;
    updateNavigation();
  });
  on("paginationUpdate", () => {
    if (!swiper.params.a11y.enabled) return;
    updatePagination();
  });
  on("destroy", () => {
    if (!swiper.params.a11y.enabled) return;
    destroy();
  });
}

// src/app/services/modal.service.ts
var _ModalService = class _ModalService {
  constructor() {
    this.programaSource = new BehaviorSubject({});
    this.programa$ = this.programaSource.asObservable();
  }
  setPrograma(programa) {
    this.programaSource.next(programa);
  }
  getPrograma() {
    return this.programaSource.getValue();
  }
  clearPrograma() {
    this.programaSource.next({});
  }
};
_ModalService.\u0275fac = function ModalService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ModalService)();
};
_ModalService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ModalService, factory: _ModalService.\u0275fac, providedIn: "root" });
var ModalService = _ModalService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ModalService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// src/app/pages/program-full-details/program-full-details.component.ts
var _ProgramFullDetailsComponent = class _ProgramFullDetailsComponent {
  constructor(route, http, modalService, router, metaSvc) {
    this.route = route;
    this.http = http;
    this.modalService = modalService;
    this.router = router;
    this.metaSvc = metaSvc;
    this.program = {};
    this.isVisible = false;
    this.array = [1, 2, 3, 4, 5, 6, 7, 8];
    this.show = false;
    this.slides$ = new BehaviorSubject([""]);
    this.programas_canal = [];
    this.programas_ahora = [];
    this.categoria = "";
    this.programas_similares = [];
    this.program_modal = {};
    this.programas = [];
    this.subscriptions = new Subscription();
    this.config = {
      modules: [Navigation, Pagination, A11y],
      slidesPerView: 4,
      spaceBetween: 5,
      breakpoints: {
        320: {
          slidesPerView: 2,
          spaceBetween: 5
        },
        480: {
          slidesPerView: 2,
          spaceBetween: 5
        },
        640: {
          slidesPerView: 3,
          spaceBetween: 5
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 5
        }
      },
      pagination: {
        clickable: true,
        type: "bullets",
        dynamicBullets: true
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
      },
      observer: true,
      observeParents: true,
      on: {
        click: (swiper, event2) => {
          console.log("Slide clicked:", event2);
        }
      }
    };
    this.virtualSlides = Array.from({ length: 600 }, (_, index) => `Slide ${index + 1}`);
  }
  ngOnInit() {
    this.initializeMetaTags();
    this.subscribeToModalService();
    this.subscribeToHttpService();
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  // Métodos privados optimizados
  initializeMetaTags() {
    const canonicalUrl = this.router.url;
    this.metaSvc.setMetaTags({
      title: "Gu\xEDa Programaci\xF3n TV - Detalles de programa",
      description: "Detalles de programa de la gu\xEDa de programaci\xF3n de TV espa\xF1ola",
      canonicalUrl
    });
  }
  subscribeToModalService() {
    const modalSub = this.modalService.programa$.subscribe((programa) => {
      this.program = programa;
    });
    this.subscriptions.add(modalSub);
  }
  subscribeToHttpService() {
    const httpSub = this.http.programas$.subscribe((programas) => __async(this, null, function* () {
      this.programas = programas;
      if (this.programas.length === 0) {
        this.loadProgramasFromAPI();
      } else {
        this.getProgramaById();
      }
    }));
    this.subscriptions.add(httpSub);
  }
  loadProgramasFromAPI() {
    const apiSub = this.http.getProgramacion("today").subscribe((programas) => {
      this.programas = programas;
      this.getProgramaById();
    });
    this.subscriptions.add(apiSub);
  }
  getProgramaById() {
    const idParam = this.route.snapshot.params["id"];
    if (!this.programas?.length)
      return;
    const allPrograms = this.programas.flatMap((programa) => programa.programs);
    this.program = allPrograms.find((program) => program?.title?.value?.replace(/ /g, "-").trim() === idParam.replace(/ /g, "-").trim());
    if (!this.program)
      return;
    this.programas_canal = this.getChannelPrograms(allPrograms);
    this.programas_ahora = this.getCurrentPrograms(allPrograms);
    this.programas_similares = this.getSimilarPrograms(allPrograms);
  }
  getChannelPrograms(allPrograms) {
    return allPrograms.filter((programa) => programa?.channel_id === this?.program?.channel_id);
  }
  getCurrentPrograms(allPrograms) {
    return allPrograms.filter((programa) => this.compareDate(programa.start, programa.stop));
  }
  getSimilarPrograms(allPrograms) {
    return allPrograms.filter((programa) => {
      const programCategory = this.program?.desc?.category;
      const currentCategory = programa?.desc?.category;
      if (!programCategory || !currentCategory)
        return false;
      const programCats = programCategory.split("/");
      const currentCats = currentCategory.split("/");
      return (programCats[0] === currentCats[0] || programCats[1] === currentCats[1]) && this.compareDate(programa.start, programa.stop);
    });
  }
  // Métodos públicos optimizados
  compareDate(dateIni, dateFin) {
    if (!dateIni || !dateFin)
      return false;
    const now2 = /* @__PURE__ */ new Date();
    const start = new Date(dateIni);
    const end = new Date(dateFin);
    const currentTime = new Date(now2.getTime() + 2 * 60 * 60 * 1e3);
    return currentTime >= start && currentTime <= end;
  }
  manageModal(program) {
    if (program) {
      this.modalService.setPrograma(program);
    }
  }
  getSlides() {
    const slides = Array.from({ length: 600 }, (_, index) => `Slide ${index + 1}`);
    this.slides$.next(slides);
  }
  // Handlers de Swiper
  onSwiper(swiper) {
    console.log("Swiper initialized:", swiper);
  }
  onSlideChange() {
    console.log("Slide changed");
  }
  log(message) {
    if (console && console.log) {
      console.log(message);
    }
  }
};
_ProgramFullDetailsComponent.\u0275fac = function ProgramFullDetailsComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ProgramFullDetailsComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(HttpService), \u0275\u0275directiveInject(ModalService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(MetaService));
};
_ProgramFullDetailsComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProgramFullDetailsComponent, selectors: [["app-program-full-details"]], viewQuery: function ProgramFullDetailsComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(HeaderComponent, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.header = _t.first);
  }
}, decls: 33, vars: 11, consts: [[1, "relative", "lg:h-[36.25vw]", "md:h-[50vw]", "h-[100vw]"], ["width", "100%", "height", "100%", 1, "absolute", "inset-0", "w-full", "h-full", "object-cover", "object-center", "brightness-[60%]", "lg:w-full", 3, "src", "alt"], [1, "absolute", "top-[30%]", "md:top-[20%]", "ml-4", "md:ml-16"], [1, "text-white", "text-[8px]", "md:text-lg", "font-semibold", "bg-white", "bg-opacity-20", "px-2", "py-1", "rounded-md"], [1, "text-white", "text-1xl", "md:text-5xl", "mt-4", "h-full", "w-[90%]", "lg:text-6xl", "font-bold", "drop-shadow-xl"], [1, "text-white", "text-[8px]", "md:text-lg", "mt-3", "md:mt-8", "w-[90%]", "md:w-[80%]", "lg:w-[50%]", "drop-shadow-xl", "text-sm"], [1, "flex", "flex-row", "items-center", "mt-3", "md:mt-4", "gap-3"], [1, "bg-opacity-100", "bg-white", "rounded-md", "py-1", "md:py-2", "px-2", "md:px-4", "w-auto", "text-xs", "lg:text-lf", "font-semibold", "flex", "flex-row", "items-center", "hover:bg-opacity-20", "transition"], [1, "bi", "bi-play-fill", "text-black", "text-sm"], [1, "text-black", "text-sm"], [1, "bg-opacity-30", "bg-white", "rounded-md", "py-1", "md:py-2", "px-2", "md:px-4", "w-auto", "text-xs", "lg:text-lf", "font-semibold", "flex", "flex-row", "items-center", "hover:bg-opacity-20", "transition", 3, "click"], [1, "bi", "bi-info-circle", "text-white", "text-sm", "pr-1"], [1, "text-white", "text-sm"], [1, "pb-5", "lg:pt-10", "pt-3"], [1, "md:p-8", "lg:mt-4", "sm:mt-2", "mt-2", "space-y-8"], [1, "text-white", "text-md", "md:text-xl", "lg:text-2xl", "font-semibold", "pb-4", "ml-3"], ["variant", "peliculas", 3, "programas"], ["variant", "canales", 3, "programas"], [1, "pb-5"], [1, "md:p-8", "lg:mt-4", "sm:mt-2", "mt-1", "space-y-8"], [1, "text-white", "text-md", "md:text-xl", "lg:text-2xl", "font-semibold", "lg:pb-4", "ml-3"]], template: function ProgramFullDetailsComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "img", 1);
    \u0275\u0275elementStart(2, "div", 2)(3, "span", 3);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h2", 4);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 5);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 6)(10, "button", 7);
    \u0275\u0275element(11, "i", 8);
    \u0275\u0275elementStart(12, "span", 9);
    \u0275\u0275text(13, "Ver ahora");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "button", 10);
    \u0275\u0275listener("click", function ProgramFullDetailsComponent_Template_button_click_14_listener() {
      return ctx.manageModal(ctx.program);
    });
    \u0275\u0275element(15, "i", 11);
    \u0275\u0275elementStart(16, "span", 12);
    \u0275\u0275text(17, "M\xE1s Info");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(18, "div", 13)(19, "div", 14)(20, "p", 15);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd();
    \u0275\u0275element(22, "app-slider", 16);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "div", 13)(24, "div", 14)(25, "p", 15);
    \u0275\u0275text(26, " M\xE1s del Canal ");
    \u0275\u0275elementEnd();
    \u0275\u0275element(27, "app-slider", 17);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(28, "div", 18)(29, "div", 19)(30, "p", 20);
    \u0275\u0275text(31, " Ahora en Directo - Resto de Canales ");
    \u0275\u0275elementEnd();
    \u0275\u0275element(32, "app-slider", 17);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("src", \u0275\u0275interpolate1("https://wsrv.nl/?url=", ctx.program == null ? null : ctx.program.icon), \u0275\u0275sanitizeUrl)("alt", \u0275\u0275interpolate(ctx.program == null ? null : ctx.program.title == null ? null : ctx.program.title.value));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx.program == null ? null : ctx.program.channel);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx.program == null ? null : ctx.program.title == null ? null : ctx.program.title.value, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx.program == null ? null : ctx.program.desc == null ? null : ctx.program.desc.details, " ");
    \u0275\u0275advance(13);
    \u0275\u0275textInterpolate1(" ", ctx.program == null ? null : ctx.program.desc == null ? null : ctx.program.desc.category, " En Directo ");
    \u0275\u0275advance();
    \u0275\u0275property("programas", ctx.programas_similares);
    \u0275\u0275advance(5);
    \u0275\u0275property("programas", ctx.programas_canal);
    \u0275\u0275advance(5);
    \u0275\u0275property("programas", ctx.programas_ahora);
  }
}, dependencies: [CommonModule, SliderComponent], styles: ['@charset "UTF-8";\n\n\n\n[_ngcontent-%COMP%]:root {\n  --swiper-theme-color: #fff;\n}\n  .swiper-button-prev, \n  .swiper-button-next {\n  width: 40px;\n  height: 100%;\n  background: rgba(0, 0, 0, 0.5);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 20px;\n  transition: background 0.3s ease, transform 0.3s ease;\n  position: absolute;\n  top: 0;\n}\n  .swiper-button-prev {\n  left: 0;\n  border-top-right-radius: 10px;\n  border-bottom-right-radius: 10px;\n}\n  .swiper-button-next {\n  right: 0;\n  border-top-left-radius: 10px;\n  border-bottom-left-radius: 10px;\n}\n  .swiper-button-prev:hover, \n  .swiper-button-next:hover {\n  background: rgba(0, 0, 0, 0.8);\n  transform: scale(1.1);\n}\n  .swiper-wrapper {\n  display: flex;\n  margin-top: 50px;\n  margin-bottom: 50px;\n}\n  .swiper-slide {\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 10px;\n  transition: transform 300ms ease 100ms;\n}\n  .swiper-slide:after {\n  content: "";\n  display: block;\n}\n  .swiper-slide:nth-child(even) {\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 10px;\n}\n  .swiper-wrapper:hover   .swiper-slide {\n  transform: translateX(-25%);\n}\n  .swiper-slide:hover ~   .swiper-slide {\n  transform: translateX(25%);\n}\n  .swiper-wrapper   .swiper-slide:hover {\n  transform: scale(1.5);\n}\nbody[_ngcontent-%COMP%] {\n  overflow: hidden;\n}\n@media (max-width: 768px) {\n    .swiper-button-prev, \n     .swiper-button-next {\n    display: none;\n  }\n}\n/*# sourceMappingURL=program-full-details.component.css.map */'] });
var ProgramFullDetailsComponent = _ProgramFullDetailsComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgramFullDetailsComponent, [{
    type: Component,
    args: [{ selector: "app-program-full-details", standalone: true, imports: [CommonModule, SliderComponent], template: '<div class="relative lg:h-[36.25vw] md:h-[50vw] h-[100vw]">\r\n  <img\r\n    class="absolute inset-0 w-full h-full object-cover object-center brightness-[60%] lg:w-full"\r\n    src="https://wsrv.nl/?url={{ program?.icon }}"\r\n    alt="{{ program?.title?.value }}"\r\n    width="100%"\r\n    height="100%"\r\n  />\r\n  <div class="absolute top-[30%] md:top-[20%] ml-4 md:ml-16">\r\n    <!-- CREAR UN SPAN CON EL TIPO DE PROGRAMA -->\r\n    <span\r\n      class="text-white text-[8px] md:text-lg font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-md"\r\n      >{{ program?.channel }}</span\r\n    >\r\n\r\n    <h2\r\n      class="text-white text-1xl md:text-5xl mt-4 h-full w-[90%] lg:text-6xl font-bold drop-shadow-xl"\r\n    >\r\n      {{ program?.title?.value }}\r\n    </h2>\r\n    <p\r\n      class="text-white text-[8px] md:text-lg mt-3 md:mt-8 w-[90%] md:w-[80%] lg:w-[50%] drop-shadow-xl text-sm"\r\n    >\r\n      {{ program?.desc?.details }}\r\n    </p>\r\n    <div class="flex flex-row items-center mt-3 md:mt-4 gap-3">\r\n      <button\r\n        class="bg-opacity-100 bg-white rounded-md py-1 md:py-2 px-2 md:px-4 w-auto text-xs lg:text-lf font-semibold flex flex-row items-center hover:bg-opacity-20 transition"\r\n      >\r\n        <i class="bi bi-play-fill text-black text-sm"></i>\r\n\r\n        <span class="text-black text-sm">Ver ahora</span>\r\n      </button>\r\n      <button\r\n        (click)="manageModal(program)"\r\n        class="bg-opacity-30 bg-white rounded-md py-1 md:py-2 px-2 md:px-4 w-auto text-xs lg:text-lf font-semibold flex flex-row items-center hover:bg-opacity-20 transition"\r\n      >\r\n        <i class="bi bi-info-circle text-white text-sm pr-1"></i>\r\n        <span class="text-white text-sm">M\xE1s Info</span>\r\n      </button>\r\n    </div>\r\n  </div>\r\n</div>\r\n\r\n<div class="pb-5 lg:pt-10 pt-3">\r\n  <div class="md:p-8 lg:mt-4 sm:mt-2 mt-2 space-y-8">\r\n    <p\r\n      class="text-white text-md md:text-xl lg:text-2xl font-semibold pb-4 ml-3"\r\n    >\r\n      {{ program?.desc?.category }} En Directo\r\n    </p>\r\n\r\n    <app-slider\r\n      variant="peliculas"\r\n      [programas]="programas_similares"\r\n    ></app-slider>\r\n  </div>\r\n</div>\r\n\r\n<div class="pb-5 lg:pt-10 pt-3">\r\n  <div class="md:p-8 lg:mt-4 sm:mt-2 mt-2 space-y-8">\r\n    <p\r\n      class="text-white text-md md:text-xl lg:text-2xl font-semibold pb-4 ml-3"\r\n    >\r\n      M\xE1s del Canal\r\n    </p>\r\n\r\n    <app-slider variant="canales" [programas]="programas_canal"></app-slider>\r\n  </div>\r\n</div>\r\n\r\n<div class="pb-5">\r\n  <div class="md:p-8 lg:mt-4 sm:mt-2 mt-1 space-y-8">\r\n    <p\r\n      class="text-white text-md md:text-xl lg:text-2xl font-semibold lg:pb-4 ml-3"\r\n    >\r\n      Ahora en Directo - Resto de Canales\r\n    </p>\r\n\r\n    <app-slider variant="canales" [programas]="programas_ahora"></app-slider>\r\n  </div>\r\n</div>\r\n', styles: ['@charset "UTF-8";\n\n/* src/app/pages/program-full-details/program-full-details.component.scss */\n:root {\n  --swiper-theme-color: #fff;\n}\n::ng-deep .swiper-button-prev,\n::ng-deep .swiper-button-next {\n  width: 40px;\n  height: 100%;\n  background: rgba(0, 0, 0, 0.5);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 20px;\n  transition: background 0.3s ease, transform 0.3s ease;\n  position: absolute;\n  top: 0;\n}\n::ng-deep .swiper-button-prev {\n  left: 0;\n  border-top-right-radius: 10px;\n  border-bottom-right-radius: 10px;\n}\n::ng-deep .swiper-button-next {\n  right: 0;\n  border-top-left-radius: 10px;\n  border-bottom-left-radius: 10px;\n}\n::ng-deep .swiper-button-prev:hover,\n::ng-deep .swiper-button-next:hover {\n  background: rgba(0, 0, 0, 0.8);\n  transform: scale(1.1);\n}\n::ng-deep .swiper-wrapper {\n  display: flex;\n  margin-top: 50px;\n  margin-bottom: 50px;\n}\n::ng-deep .swiper-slide {\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 10px;\n  transition: transform 300ms ease 100ms;\n}\n::ng-deep .swiper-slide:after {\n  content: "";\n  display: block;\n}\n::ng-deep .swiper-slide:nth-child(even) {\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 10px;\n}\n::ng-deep .swiper-wrapper:hover ::ng-deep .swiper-slide {\n  transform: translateX(-25%);\n}\n::ng-deep .swiper-slide:hover ~ ::ng-deep .swiper-slide {\n  transform: translateX(25%);\n}\n::ng-deep .swiper-wrapper ::ng-deep .swiper-slide:hover {\n  transform: scale(1.5);\n}\nbody {\n  overflow: hidden;\n}\n@media (max-width: 768px) {\n  ::ng-deep .swiper-button-prev,\n  ::ng-deep .swiper-button-next {\n    display: none;\n  }\n}\n/*# sourceMappingURL=program-full-details.component.css.map */\n'] }]
  }], () => [{ type: ActivatedRoute }, { type: HttpService }, { type: ModalService }, { type: Router }, { type: MetaService }], { header: [{
    type: ViewChild,
    args: [HeaderComponent]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProgramFullDetailsComponent, { className: "ProgramFullDetailsComponent", filePath: "src/app/pages/program-full-details/program-full-details.component.ts", lineNumber: 22 });
})();
export {
  ProgramFullDetailsComponent
};
//# sourceMappingURL=program-full-details.component-YL2SM6I4.js.map
