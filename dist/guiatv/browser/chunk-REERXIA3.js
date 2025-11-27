import {
  CommonModule,
  NavigationEnd,
  NgClass,
  NgForOf,
  NgIf,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  TvGuideService
} from "./chunk-MUKTTSZO.js";
import {
  BehaviorSubject,
  Component,
  Injectable,
  Subject,
  __spreadValues,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
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
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-UEL6V4IP.js";

// src/app/services/menu-state.service.ts
var _MenuStateService = class _MenuStateService {
  constructor() {
    this.activeKey$ = new BehaviorSubject("home");
    this.mobileOpen$ = new BehaviorSubject(false);
    this.colors = {
      home: "#ff7a18",
      // naranja principal para home
      "guia-canales": "#f97316",
      "que-ver-hoy": "#f59e0b",
      series: "#06b6d4",
      peliculas: "#ea580c",
      blog: "#8b5cf6",
      "top-10": "#ef4444",
      "en-directo": "#f43f5e"
    };
    this.routes = [
      { label: "Inicio", path: "/", key: "home" },
      { label: "Gu\xEDa canales", path: "/guia-canales", key: "guia-canales" },
      { label: "Qu\xE9 ver hoy", path: "/que-ver-hoy", key: "que-ver-hoy" },
      { label: "Series", path: "/series", key: "series" },
      { label: "Pel\xEDculas", path: "/peliculas", key: "peliculas" },
      { label: "Blog", path: "/blog", key: "blog" },
      { label: "Top 10", path: "/top-10", key: "top-10" },
      { label: "En directo", path: "/en-directo", key: "en-directo" }
    ];
  }
  setActive(key) {
    if (!key)
      return;
    this.activeKey$.next(key);
  }
  // Mobile menu controls
  toggleMobile() {
    this.mobileOpen$.next(!this.mobileOpen$.value);
  }
  setMobile(open) {
    this.mobileOpen$.next(!!open);
  }
  getMobile() {
    return this.mobileOpen$.asObservable();
  }
  getActive() {
    return this.activeKey$.asObservable();
  }
  getCurrentActive() {
    return this.activeKey$.value;
  }
  getColorForKey(key) {
    return this.colors[key];
  }
  // Permite reemplazar el map de colores si se necesitara.
  setColors(map) {
    this.colors = __spreadValues(__spreadValues({}, this.colors), map || {});
  }
  // Subset intended for the header (mostrar solo lo más destacado)
  getHeaderRoutes() {
    return [
      this.routes.find((r) => r.key === "home"),
      this.routes.find((r) => r.key === "guia-canales"),
      this.routes.find((r) => r.key === "que-ver-hoy"),
      this.routes.find((r) => r.key === "blog"),
      this.routes.find((r) => r.key === "en-directo")
    ];
  }
};
_MenuStateService.\u0275fac = function MenuStateService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _MenuStateService)();
};
_MenuStateService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MenuStateService, factory: _MenuStateService.\u0275fac, providedIn: "root" });
var MenuStateService = _MenuStateService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MenuStateService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

// src/app/components/menu/menu.component.ts
var _c0 = (a0) => ({ "active-link": a0 });
var _c1 = (a0) => ({ "active-icon": a0 });
var _c2 = () => ({ exact: true });
function MenuComponent_a_4_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 26);
    \u0275\u0275text(1, "\u25CF");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("color", ctx_r2.getColor(r_r2.key));
  }
}
function MenuComponent_a_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "a", 23);
    \u0275\u0275listener("click", function MenuComponent_a_4_Template_a_click_0_listener() {
      const r_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onItemClick(r_r2.path, r_r2.key));
    });
    \u0275\u0275elementStart(1, "span", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, MenuComponent_a_4_span_3_Template, 2, 2, "span", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("border-right-color", ctx_r2.isActive(r_r2.key) ? ctx_r2.getColor(r_r2.key) : null)("color", ctx_r2.isActive(r_r2.key) ? ctx_r2.getColor(r_r2.key) : null)("--active-color", ctx_r2.isActive(r_r2.key) ? ctx_r2.getColor(r_r2.key) : null);
    \u0275\u0275property("routerLink", r_r2.path)("routerLinkActiveOptions", \u0275\u0275pureFunction0(12, _c2))("ngClass", \u0275\u0275pureFunction1(13, _c0, ctx_r2.isActive(r_r2.key)));
    \u0275\u0275attribute("aria-current", ctx_r2.router.url === r_r2.path ? "page" : null);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r2.label);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isActive(r_r2.key));
  }
}
var _MenuComponent = class _MenuComponent {
  // rutas expuestas al template (compartidas desde el servicio)
  get routes() {
    return this.menuState.routes;
  }
  constructor(router, guiaTvService, menuState) {
    this.router = router;
    this.guiaTvService = guiaTvService;
    this.menuState = menuState;
    this.activeKey = "home";
    this.unsuscribe$ = new Subject();
  }
  ngOnInit() {
    this.setActiveFromUrl(this.router.url);
    this.menuState.getActive().pipe(takeUntil(this.unsuscribe$)).subscribe((k) => {
      if (k)
        this.activeKey = k;
    });
    this.router.events.pipe(takeUntil(this.unsuscribe$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveFromUrl(event.urlAfterRedirects || event.url);
      }
    });
  }
  ngOnDestroy() {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
  resetFlags() {
    this.activeKey = "";
  }
  navigateTo() {
    this.navigate("/programacion-tv/que-ver-hoy", "que-ver-hoy");
  }
  setActiveFromUrl(url) {
    const parts = (url || "").split("/").filter(Boolean);
    const key = parts.length ? parts[parts.length - 1] : "home";
    this.activeKey = key || "home";
    this.menuState.setActive(this.activeKey);
    if (this.activeKey === "peliculas") {
      this.guiaTvService.setIsMovies();
    } else if (this.activeKey === "series") {
      this.guiaTvService.setIsSeries();
    }
  }
  /**
   * Navega a la ruta absoluta y actualiza flags.
   * Usar desde template: (click)="navigate(r.path, r.key)"
   */
  navigate(path, key) {
    if (key === "peliculas") {
      this.guiaTvService.setIsMovies();
    }
    this.router.navigateByUrl(path).then(() => {
      this.setActiveFromUrl(this.router.url);
      if (key)
        this.menuState.setActive(key);
    });
  }
  /**
   * Handler usado desde la plantilla mejorada: navega y aplica efectos secundarios
   */
  onItemClick(path, key) {
    if (key === "peliculas") {
      this.guiaTvService.setIsMovies();
    } else if (key === "series") {
      this.guiaTvService.setIsSeries();
    }
    this.navigate(path, key);
  }
  // helper usado desde template
  isActive(key) {
    return !!key && this.activeKey === key;
  }
  getColor(key) {
    return this.menuState.getColorForKey(key);
  }
};
_MenuComponent.\u0275fac = function MenuComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _MenuComponent)(\u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(MenuStateService));
};
_MenuComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _MenuComponent, selectors: [["app-menu"]], decls: 43, vars: 21, consts: [[1, "pt-12", "flex", "flex-col", "gap-y-2", "text-gray-200", "fill-gray-200", "text-sm"], [1, "text-gray-500/70", "font-medium", "uppercase", "text-xs", "tracking-wider", "mb-4", "px-3"], [1, "space-y-1", "px-2"], ["routerLinkActive", "active-link", "class", "w-full text-left px-3 py-2 rounded flex items-center gap-3 hover:bg-gray-800", 3, "routerLink", "routerLinkActiveOptions", "ngClass", "border-right-color", "color", "--active-color", "click", 4, "ngFor", "ngForOf"], [1, "mt-8", "text-gray-500/70", "font-medium", "uppercase", "text-xs", "tracking-wider", "mb-4", "px-3"], [1, "space-y-1"], ["routerLink", "/programacion-tv/top-10", 1, "flex", "items-center", "space-x-3", "py-3", "px-3", "rounded-lg", "group", "hover:bg-gray-700/30", "hover:text-red-300", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/30", 3, "ngClass"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "h-5", "w-5", "transition-colors", "duration-200", "group-hover:fill-red-400", 3, "ngClass"], ["d", "M12 2v0C9.23 2 7 4.23 7 7c0 2.76 2.23 5 5 5 2.76 0 5-2.24 5-5v0c0-2.77-2.24-5-5-5Zm0 8v0c-1.66 0-3-1.35-3-3 0-1.66 1.34-3 3-3 1.65 0 3 1.34 3 3v0c0 1.65-1.35 3-3 3Zm9 11v-1 0c0-3.87-3.14-7-7-7h-4v0c-3.87 0-7 3.13-7 7v1h2v-1 0c0-2.77 2.23-5 5-5h4v0c2.76 0 5 2.23 5 5v1Z"], [1, "font-semibold", "text-gray-200"], [1, "flex", "items-center", "space-x-3", "py-3", "px-3", "rounded-lg", "group", "hover:bg-gray-700/30", "hover:text-red-300", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/30", "cursor-pointer", 3, "click", "ngClass"], ["d", "M16.6 11.04v-.001c.6-1.04.87-2.25.75-3.44 -.18-1.79-1.18-3.37-2.81-4.44l-1.11 1.66c1.11.742 1.8 1.79 1.91 2.974l-.001 0c.11 1.1-.29 2.2-1.08 2.98l-1.2 1.19 1.61.47c4.23 1.24 4.28 5.49 4.28 5.53h2c0-1.79-.96-5.285-4.4-6.952Z"], ["d", "M9.5 12c2.2 0 4-1.8 4-4 0-2.21-1.8-4-4-4 -2.21 0-4 1.79-4 4 0 2.2 1.79 4 4 4Zm0-6c1.1 0 2 .89 2 2 0 1.1-.9 2-2 2 -1.11 0-2-.9-2-2 0-1.11.89-2 2-2Zm1.5 7H8c-3.31 0-6 2.69-6 6v1h2v-1c0-2.21 1.79-4 4-4h3c2.2 0 4 1.79 4 4v1h2v-1c0-3.31-2.7-6-6-6Z"], ["routerLink", "/programacion-tv/noticias", 1, "flex", "items-center", "space-x-3", "py-3", "px-3", "rounded-lg", "group", "hover:bg-gray-700/30", "hover:text-red-300", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/30"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "h-5", "w-5", "transition-colors", "duration-200", "group-hover:fill-red-400"], ["d", "M12 2v0C6.47 2 2 6.47 2 12c0 5.52 4.47 10 10 10 5.52 0 10-4.48 10-10v-.001c0-5.53-4.48-10-10-10Zm0 18v0c-4.42 0-8-3.59-8-8 0-4.42 3.58-8 8-8 4.41 0 8 3.58 8 8v0c0 4.41-3.59 8-8 8Z"], ["d", "M12 8v0c-2.21 0-4 1.79-4 4 0 2.2 1.79 4 4 4 2.2 0 4-1.8 4-4v0c0-2.21-1.8-4-4-4Zm0 6v0c-1.11 0-2-.9-2-2 0-1.11.89-2 2-2 1.1 0 2 .89 2 2v0c0 1.1-.9 2-2 2Z"], ["href", "#", 1, "flex", "items-center", "space-x-3", "py-3", "px-3", "rounded-lg", "group", "hover:bg-gray-700/30", "hover:text-red-300", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/30"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "stroke-width", "2", 1, "h-5", "w-5", "transition-colors", "duration-200", "group-hover:stroke-red-400"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z"], ["d", "M16 13v-2H7V8l-5 4 5 4v-3Z"], ["d", "M20 3h-9c-1.11 0-2 .89-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.89 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2Z"], ["routerLinkActive", "active-link", 1, "w-full", "text-left", "px-3", "py-2", "rounded", "flex", "items-center", "gap-3", "hover:bg-gray-800", 3, "click", "routerLink", "routerLinkActiveOptions", "ngClass"], [1, "flex-1", "text-gray-200", "font-semibold"], ["class", "text-sm", 3, "color", 4, "ngIf"], [1, "text-sm"]], template: function MenuComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "nav", 0)(1, "div", 1);
    \u0275\u0275text(2, " Menu ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 2);
    \u0275\u0275template(4, MenuComponent_a_4_Template, 4, 15, "a", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 4);
    \u0275\u0275text(6, " Listas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 5)(8, "a", 6);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 7);
    \u0275\u0275element(10, "path", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "span", 9);
    \u0275\u0275text(12, "Top 10");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "a", 10);
    \u0275\u0275listener("click", function MenuComponent_Template_a_click_13_listener() {
      return ctx.navigateTo();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(14, "svg", 7)(15, "g");
    \u0275\u0275element(16, "path", 11)(17, "path", 12);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(18, "span", 9);
    \u0275\u0275text(19, "Destacados");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(20, "a", 13);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(21, "svg", 14)(22, "g");
    \u0275\u0275element(23, "path", 15)(24, "path", 16);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(25, "span", 9);
    \u0275\u0275text(26, "Noticias");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(27, "div", 4);
    \u0275\u0275text(28, " General ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 5)(30, "a", 17);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(31, "svg", 18);
    \u0275\u0275element(32, "path", 19)(33, "path", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(34, "span", 9);
    \u0275\u0275text(35, "Configuraci\xF3n");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(36, "a", 17);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(37, "svg", 14)(38, "g");
    \u0275\u0275element(39, "path", 21)(40, "path", 22);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(41, "span", 9);
    \u0275\u0275text(42, "Cerrar Sesi\xF3n");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx.routes);
    \u0275\u0275advance(4);
    \u0275\u0275styleProp("border-right-color", ctx.isActive("top-10") ? ctx.getColor("top-10") : null)("color", ctx.isActive("top-10") ? ctx.getColor("top-10") : null);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(13, _c0, ctx.isActive("top-10")));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(15, _c1, ctx.isActive("top-10")));
    \u0275\u0275advance(4);
    \u0275\u0275styleProp("border-right-color", ctx.isActive("que-ver-hoy") ? ctx.getColor("que-ver-hoy") : null)("color", ctx.isActive("que-ver-hoy") ? ctx.getColor("que-ver-hoy") : null);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(17, _c0, ctx.isActive("que-ver-hoy")));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(19, _c1, ctx.isActive("que-ver-hoy")));
  }
}, dependencies: [CommonModule, NgClass, NgForOf, NgIf, RouterModule, RouterLink, RouterLinkActive], styles: ["\n\n.active-link[_ngcontent-%COMP%] {\n  --c: var(--active-color, #dc2626);\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.15),\n      rgba(239, 68, 68, 0.1));\n  color: #ffffff;\n  font-weight: 600;\n  border-right-width: 3px;\n  border-right-color: var(--c);\n  border-radius: 0.5rem;\n  padding-left: 0.75rem;\n  padding-right: 0.5rem;\n  margin-right: 0.5rem;\n  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.1);\n  transition: all 0.3s ease;\n}\n.active-link[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(255, 122, 24, 0.12),\n      rgba(255, 160, 82, 0.08));\n  color: var(--c);\n  transform: translateX(2px);\n}\n.active-icon[_ngcontent-%COMP%] {\n  fill: currentColor;\n  stroke: currentColor;\n}\n/*# sourceMappingURL=menu.component.css.map */"] });
var MenuComponent = _MenuComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MenuComponent, [{
    type: Component,
    args: [{ selector: "app-menu", standalone: true, imports: [CommonModule, RouterModule], template: `<!-- Menu - MODERNIZADO CON MEJORES ESTILOS DE SELECCI\xD3N -->\r
<nav class="pt-12 flex flex-col gap-y-2 text-gray-200 fill-gray-200 text-sm">\r
  <!-- Menu Header -->\r
  <div\r
    class="text-gray-500/70 font-medium uppercase text-xs tracking-wider mb-4 px-3"\r
  >\r
    Menu\r
  </div>\r
\r
  <!-- Menu Items -->\r
  <div class="space-y-1 px-2">\r
    <a\r
      *ngFor="let r of routes"\r
      [routerLink]="r.path"\r
      routerLinkActive="active-link"\r
      [routerLinkActiveOptions]="{ exact: true }"\r
      class="w-full text-left px-3 py-2 rounded flex items-center gap-3 hover:bg-gray-800"\r
      [attr.aria-current]="router.url === r.path ? 'page' : null"\r
      (click)="onItemClick(r.path, r.key)"\r
      [ngClass]="{ 'active-link': isActive(r.key) }"\r
      [style.border-right-color]="isActive(r.key) ? getColor(r.key) : null"\r
      [style.color]="isActive(r.key) ? getColor(r.key) : null"\r
      [style.--active-color]="isActive(r.key) ? getColor(r.key) : null"\r
    >\r
      <span class="flex-1 text-gray-200 font-semibold">{{ r.label }}</span>\r
      <!-- Indicador circular coloreado seg\xFAn el color de la key -->\r
      <span\r
        *ngIf="isActive(r.key)"\r
        class="text-sm"\r
        [style.color]="getColor(r.key)"\r
        >\u25CF</span\r
      >\r
    </a>\r
  </div>\r
\r
  <!-- Lists Section -->\r
  <div\r
    class="mt-8 text-gray-500/70 font-medium uppercase text-xs tracking-wider mb-4 px-3"\r
  >\r
    Listas\r
  </div>\r
\r
  <div class="space-y-1">\r
    <a\r
      class="flex items-center space-x-3 py-3 px-3 rounded-lg group hover:bg-gray-700/30 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"\r
      routerLink="/programacion-tv/top-10"\r
      [ngClass]="{ 'active-link': isActive('top-10') }"\r
      [style.border-right-color]="\r
        isActive('top-10') ? getColor('top-10') : null\r
      "\r
      [style.color]="isActive('top-10') ? getColor('top-10') : null"\r
    >\r
      <svg\r
        class="h-5 w-5 transition-colors duration-200 group-hover:fill-red-400"\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        [ngClass]="{ 'active-icon': isActive('top-10') }"\r
      >\r
        <path\r
          d="M12 2v0C9.23 2 7 4.23 7 7c0 2.76 2.23 5 5 5 2.76 0 5-2.24 5-5v0c0-2.77-2.24-5-5-5Zm0 8v0c-1.66 0-3-1.35-3-3 0-1.66 1.34-3 3-3 1.65 0 3 1.34 3 3v0c0 1.65-1.35 3-3 3Zm9 11v-1 0c0-3.87-3.14-7-7-7h-4v0c-3.87 0-7 3.13-7 7v1h2v-1 0c0-2.77 2.23-5 5-5h4v0c2.76 0 5 2.23 5 5v1Z"\r
        ></path>\r
      </svg>\r
      <span class="font-semibold text-gray-200">Top 10</span>\r
    </a>\r
\r
    <a\r
      class="flex items-center space-x-3 py-3 px-3 rounded-lg group hover:bg-gray-700/30 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer"\r
      (click)="navigateTo()"\r
      [ngClass]="{ 'active-link': isActive('que-ver-hoy') }"\r
      [style.border-right-color]="\r
        isActive('que-ver-hoy') ? getColor('que-ver-hoy') : null\r
      "\r
      [style.color]="isActive('que-ver-hoy') ? getColor('que-ver-hoy') : null"\r
    >\r
      <svg\r
        class="h-5 w-5 transition-colors duration-200 group-hover:fill-red-400"\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        [ngClass]="{ 'active-icon': isActive('que-ver-hoy') }"\r
      >\r
        <g>\r
          <path\r
            d="M16.6 11.04v-.001c.6-1.04.87-2.25.75-3.44 -.18-1.79-1.18-3.37-2.81-4.44l-1.11 1.66c1.11.742 1.8 1.79 1.91 2.974l-.001 0c.11 1.1-.29 2.2-1.08 2.98l-1.2 1.19 1.61.47c4.23 1.24 4.28 5.49 4.28 5.53h2c0-1.79-.96-5.285-4.4-6.952Z"\r
          ></path>\r
          <path\r
            d="M9.5 12c2.2 0 4-1.8 4-4 0-2.21-1.8-4-4-4 -2.21 0-4 1.79-4 4 0 2.2 1.79 4 4 4Zm0-6c1.1 0 2 .89 2 2 0 1.1-.9 2-2 2 -1.11 0-2-.9-2-2 0-1.11.89-2 2-2Zm1.5 7H8c-3.31 0-6 2.69-6 6v1h2v-1c0-2.21 1.79-4 4-4h3c2.2 0 4 1.79 4 4v1h2v-1c0-3.31-2.7-6-6-6Z"\r
          ></path>\r
        </g>\r
      </svg>\r
      <span class="font-semibold text-gray-200">Destacados</span>\r
    </a>\r
\r
    <a\r
      class="flex items-center space-x-3 py-3 px-3 rounded-lg group hover:bg-gray-700/30 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"\r
      routerLink="/programacion-tv/noticias"\r
    >\r
      <svg\r
        class="h-5 w-5 transition-colors duration-200 group-hover:fill-red-400"\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
      >\r
        <g>\r
          <path\r
            d="M12 2v0C6.47 2 2 6.47 2 12c0 5.52 4.47 10 10 10 5.52 0 10-4.48 10-10v-.001c0-5.53-4.48-10-10-10Zm0 18v0c-4.42 0-8-3.59-8-8 0-4.42 3.58-8 8-8 4.41 0 8 3.58 8 8v0c0 4.41-3.59 8-8 8Z"\r
          ></path>\r
          <path\r
            d="M12 8v0c-2.21 0-4 1.79-4 4 0 2.2 1.79 4 4 4 2.2 0 4-1.8 4-4v0c0-2.21-1.8-4-4-4Zm0 6v0c-1.11 0-2-.9-2-2 0-1.11.89-2 2-2 1.1 0 2 .89 2 2v0c0 1.1-.9 2-2 2Z"\r
          ></path>\r
        </g>\r
      </svg>\r
      <span class="font-semibold text-gray-200">Noticias</span>\r
    </a>\r
  </div>\r
\r
  <!-- General Section -->\r
  <div\r
    class="mt-8 text-gray-500/70 font-medium uppercase text-xs tracking-wider mb-4 px-3"\r
  >\r
    General\r
  </div>\r
\r
  <div class="space-y-1">\r
    <a\r
      class="flex items-center space-x-3 py-3 px-3 rounded-lg group hover:bg-gray-700/30 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"\r
      href="#"\r
    >\r
      <svg\r
        xmlns="http://www.w3.org/2000/svg"\r
        class="h-5 w-5 transition-colors duration-200 group-hover:stroke-red-400"\r
        fill="none"\r
        viewBox="0 0 24 24"\r
        stroke="currentColor"\r
        stroke-width="2"\r
      >\r
        <path\r
          stroke-linecap="round"\r
          stroke-linejoin="round"\r
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"\r
        />\r
        <path\r
          stroke-linecap="round"\r
          stroke-linejoin="round"\r
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"\r
        />\r
      </svg>\r
      <span class="font-semibold text-gray-200">Configuraci\xF3n</span>\r
    </a>\r
\r
    <a\r
      class="flex items-center space-x-3 py-3 px-3 rounded-lg group hover:bg-gray-700/30 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"\r
      href="#"\r
    >\r
      <svg\r
        class="h-5 w-5 transition-colors duration-200 group-hover:fill-red-400"\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
      >\r
        <g>\r
          <path d="M16 13v-2H7V8l-5 4 5 4v-3Z"></path>\r
          <path\r
            d="M20 3h-9c-1.11 0-2 .89-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.89 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2Z"\r
          ></path>\r
        </g>\r
      </svg>\r
      <span class="font-semibold text-gray-200">Cerrar Sesi\xF3n</span>\r
    </a>\r
  </div>\r
</nav>\r
`, styles: ["/* src/app/components/menu/menu.component.scss */\n.active-link {\n  --c: var(--active-color, #dc2626);\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.15),\n      rgba(239, 68, 68, 0.1));\n  color: #ffffff;\n  font-weight: 600;\n  border-right-width: 3px;\n  border-right-color: var(--c);\n  border-radius: 0.5rem;\n  padding-left: 0.75rem;\n  padding-right: 0.5rem;\n  margin-right: 0.5rem;\n  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.1);\n  transition: all 0.3s ease;\n}\n.active-link:hover {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(255, 122, 24, 0.12),\n      rgba(255, 160, 82, 0.08));\n  color: var(--c);\n  transform: translateX(2px);\n}\n.active-icon {\n  fill: currentColor;\n  stroke: currentColor;\n}\n/*# sourceMappingURL=menu.component.css.map */\n"] }]
  }], () => [{ type: Router }, { type: TvGuideService }, { type: MenuStateService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(MenuComponent, { className: "MenuComponent", filePath: "src/app/components/menu/menu.component.ts", lineNumber: 15 });
})();

export {
  MenuStateService,
  MenuComponent
};
//# sourceMappingURL=chunk-REERXIA3.js.map
