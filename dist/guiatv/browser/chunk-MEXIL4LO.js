import {
  MenuComponent,
  MenuStateService
} from "./chunk-REERXIA3.js";
import {
  AsyncPipe,
  CommonModule,
  NgClass,
  NgIf,
  Router
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Subject,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
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
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext
} from "./chunk-UEL6V4IP.js";

// src/app/components/nav-bar/nav-bar.component.ts
var _c0 = (a0, a1) => ({ "text-white bg-red-500/20 border-b-2 border-red-500": a0, "hover:text-red-300": a1 });
var _c1 = (a0, a1) => ({ "text-white bg-blue-500/20 border-b-2 border-blue-500": a0, "hover:text-blue-300": a1 });
var _c2 = (a0, a1) => ({ "text-white bg-purple-500/20 border-b-2 border-purple-500": a0, "hover:text-purple-300": a1 });
var _c3 = (a0, a1) => ({ "text-white bg-green-500/20 border-b-2 border-green-500": a0, "hover:text-green-300": a1 });
var _c4 = (a0, a1) => ({ "text-white bg-violet-500/20 border-b-2 border-violet-500": a0, "hover:text-violet-300": a1 });
var _c5 = (a0, a1) => ({ "text-white bg-orange-500/20 border-b-2 border-orange-500": a0, "hover:text-orange-300": a1 });
function NavBarComponent_div_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 29);
  }
}
function NavBarComponent_div_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 30);
  }
}
function NavBarComponent_div_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 31);
  }
}
function NavBarComponent_div_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 32);
  }
}
function NavBarComponent_div_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 33);
  }
}
function NavBarComponent_div_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 34);
  }
}
function NavBarComponent_aside_41_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "aside", 35);
    \u0275\u0275listener("click", function NavBarComponent_aside_41_Template_aside_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.menuState.toggleMobile());
    });
    \u0275\u0275element(1, "div", 36);
    \u0275\u0275elementStart(2, "div", 37);
    \u0275\u0275listener("click", function NavBarComponent_aside_41_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(3, "div", 38)(4, "div", 39);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 5);
    \u0275\u0275element(6, "path", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "span", 7);
    \u0275\u0275text(8, "GPTV");
    \u0275\u0275elementStart(9, "span", 8);
    \u0275\u0275text(10, ".");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "button", 40);
    \u0275\u0275listener("click", function NavBarComponent_aside_41_Template_button_click_11_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.menuState.toggleMobile());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(12, "svg", 41);
    \u0275\u0275element(13, "path", 42);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "div", 43)(15, "app-menu", 44);
    \u0275\u0275listener("click", function NavBarComponent_aside_41_Template_app_menu_click_15_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd()()()();
  }
}
var _NavBarComponent = class _NavBarComponent {
  constructor(router, menuState) {
    this.router = router;
    this.menuState = menuState;
    this.isHome = false;
    this.isGuiaCanales = false;
    this.isSeries = false;
    this.isPeliculas = false;
    this.isBlog = false;
    this.isDirecto = false;
    this.unsuscribe$ = new Subject();
    this.menuState.getActive().pipe(takeUntil(this.unsuscribe$)).subscribe((k) => {
      this.isHome = k === "home";
      this.isGuiaCanales = k === "guia-canales";
      this.isSeries = k === "series";
      this.isPeliculas = k === "peliculas";
      this.isBlog = k === "blog";
      this.isDirecto = k === "en-directo";
    });
  }
  ngOnDestroy() {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
};
_NavBarComponent.\u0275fac = function NavBarComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _NavBarComponent)(\u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(MenuStateService));
};
_NavBarComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NavBarComponent, selectors: [["app-nav-bar"]], decls: 43, vars: 33, consts: [[1, "relative", "z-50"], [1, "bg-gradient-to-r", "from-gray-900", "via-gray-800", "to-gray-900", "backdrop-blur-sm", "border-b", "border-gray-700/50", "shadow-xl", "shadow-black/20"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8"], [1, "flex", "items-center", "justify-between", "h-16", "lg:h-20"], [1, "md:hidden", "flex", "items-center", "space-x-3"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "h-8", "w-8", "fill-red-500"], ["d", "M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"], [1, "text-white", "font-bold", "text-lg"], [1, "text-red-500"], [1, "hidden", "md:flex", "space-x-8", "text-gray-300", "font-medium"], ["routerLink", "/", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-red-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/50", 3, "ngClass"], [1, "relative", "z-10"], ["class", "absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg", 4, "ngIf"], ["routerLink", "/programacion-tv/guia-canales", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-blue-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500/50", 3, "ngClass"], ["class", "absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg", 4, "ngIf"], ["routerLink", "/programacion-tv/peliculas", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-purple-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-purple-500/50", 3, "ngClass"], ["class", "absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg", 4, "ngIf"], ["routerLink", "/programacion-tv/series", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-green-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-green-500/50", 3, "ngClass"], ["class", "absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg", 4, "ngIf"], ["routerLink", "/blog", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-violet-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-violet-500/50", 3, "ngClass"], ["class", "absolute inset-0 bg-gradient-to-r from-violet-500/20 to-violet-600/20 rounded-lg", 4, "ngIf"], ["routerLink", "/programacion-tv/en-directo", 1, "relative", "px-3", "py-2", "rounded-lg", "transition-all", "duration-300", "hover:text-white", "hover:bg-orange-500/10", "focus:outline-none", "focus:ring-2", "focus:ring-orange-500/50", 3, "ngClass"], [1, "relative", "z-10", "flex", "items-center", "space-x-2"], [1, "w-2", "h-2", "bg-red-500", "rounded-full", "animate-pulse"], ["class", "absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg", 4, "ngIf"], [1, "md:hidden", "p-2", "rounded-lg", "text-gray-300", "hover:text-white", "hover:bg-gray-700/50", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/50", "transition-colors", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-6", "h-6"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M4 6h16M4 12h16M4 18h16"], ["class", "mobile-drawer fixed inset-0 z-50 lg:hidden", 3, "click", 4, "ngIf"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-red-500/20", "to-red-600/20", "rounded-lg"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-blue-500/20", "to-blue-600/20", "rounded-lg"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-purple-500/20", "to-purple-600/20", "rounded-lg"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-green-500/20", "to-green-600/20", "rounded-lg"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-violet-500/20", "to-violet-600/20", "rounded-lg"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-orange-500/20", "to-orange-600/20", "rounded-lg"], [1, "mobile-drawer", "fixed", "inset-0", "z-50", "lg:hidden", 3, "click"], ["aria-hidden", "true", 1, "drawer-backdrop"], [1, "drawer-panel", "w-11/12", "max-w-xs", "h-full", "bg-gradient-to-b", "from-white/95", "to-white/90", "dark:from-zinc-900", "dark:to-zinc-800", "p-4", 3, "click"], [1, "flex", "items-center", "justify-between", "mb-4"], [1, "flex", "items-center", "space-x-3"], ["aria-label", "Cerrar men\xFA", 1, "p-2", "rounded-md", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/40", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", "stroke-width", "2", 1, "h-6", "w-6", "text-white"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M6 18L18 6M6 6l12 12"], [1, "mobile-menu", "overflow-auto", "h-[calc(100vh-88px)]", "pr-2"], [3, "click"]], template: function NavBarComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "header", 0)(1, "nav", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 5);
    \u0275\u0275element(6, "path", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "span", 7);
    \u0275\u0275text(8, "GPTV");
    \u0275\u0275elementStart(9, "span", 8);
    \u0275\u0275text(10, ".");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "nav", 9)(12, "a", 10)(13, "span", 11);
    \u0275\u0275text(14, "Gu\xEDa TV");
    \u0275\u0275elementEnd();
    \u0275\u0275template(15, NavBarComponent_div_15_Template, 1, 0, "div", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "a", 13)(17, "span", 11);
    \u0275\u0275text(18, "Canales");
    \u0275\u0275elementEnd();
    \u0275\u0275template(19, NavBarComponent_div_19_Template, 1, 0, "div", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "a", 15)(21, "span", 11);
    \u0275\u0275text(22, "Pel\xEDculas");
    \u0275\u0275elementEnd();
    \u0275\u0275template(23, NavBarComponent_div_23_Template, 1, 0, "div", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "a", 17)(25, "span", 11);
    \u0275\u0275text(26, "Series");
    \u0275\u0275elementEnd();
    \u0275\u0275template(27, NavBarComponent_div_27_Template, 1, 0, "div", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "a", 19)(29, "span", 11);
    \u0275\u0275text(30, "Blog");
    \u0275\u0275elementEnd();
    \u0275\u0275template(31, NavBarComponent_div_31_Template, 1, 0, "div", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "a", 21)(33, "span", 22)(34, "span");
    \u0275\u0275text(35, "En Vivo");
    \u0275\u0275elementEnd();
    \u0275\u0275element(36, "div", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275template(37, NavBarComponent_div_37_Template, 1, 0, "div", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(38, "button", 25);
    \u0275\u0275listener("click", function NavBarComponent_Template_button_click_38_listener() {
      return ctx.menuState.toggleMobile();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(39, "svg", 26);
    \u0275\u0275element(40, "path", 27);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275template(41, NavBarComponent_aside_41_Template, 16, 0, "aside", 28);
    \u0275\u0275pipe(42, "async");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(12);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(15, _c0, ctx.isHome, !ctx.isHome));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx.isHome);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(18, _c1, ctx.isGuiaCanales, !ctx.isGuiaCanales));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx.isGuiaCanales);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(21, _c2, ctx.isPeliculas, !ctx.isPeliculas));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx.isPeliculas);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(24, _c3, ctx.isSeries, !ctx.isSeries));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx.isSeries);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(27, _c4, ctx.isBlog, !ctx.isBlog));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx.isBlog);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(30, _c5, ctx.isDirecto, !ctx.isDirecto));
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx.isDirecto);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", \u0275\u0275pipeBind1(42, 13, ctx.menuState.getMobile()));
  }
}, dependencies: [CommonModule, NgClass, NgIf, AsyncPipe, MenuComponent], styles: ["\n\n.mobile-drawer[_ngcontent-%COMP%] {\n  display: block;\n}\n.drawer-backdrop[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.55),\n      rgba(0, 0, 0, 0.6));\n  -webkit-backdrop-filter: blur(6px);\n  backdrop-filter: blur(6px);\n}\n.drawer-panel[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 100%;\n  transform: translateX(-6%);\n  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.6);\n  border-top-right-radius: 12px;\n  border-bottom-right-radius: 12px;\n  overflow: hidden;\n  animation: _ngcontent-%COMP%_slide-in 260ms cubic-bezier(0.2, 0.9, 0.3, 1) both;\n  background:\n    linear-gradient(\n      180deg,\n      #0f1724 0%,\n      #111827 50%,\n      #000000 100%);\n  color: #e5e7eb;\n}\n@keyframes _ngcontent-%COMP%_slide-in {\n  from {\n    transform: translateX(-12%);\n    opacity: 0;\n  }\n  to {\n    transform: translateX(0);\n    opacity: 1;\n  }\n}\n.mobile-menu[_ngcontent-%COMP%] {\n  -webkit-overflow-scrolling: touch;\n}\n.mobile-menu[_ngcontent-%COMP%]   a[_ngcontent-%COMP%], \n.mobile-menu[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  width: 100%;\n  padding: 0.75rem 0.5rem;\n  border-radius: 8px;\n  color: #e5e7eb;\n  text-decoration: none;\n  font-weight: 600;\n  transition:\n    background-color 150ms ease,\n    color 150ms ease,\n    transform 120ms ease;\n}\n.mobile-menu[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover, \n.mobile-menu[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(244, 63, 94, 0.06),\n      rgba(255, 255, 255, 0.02));\n  color: #fff;\n}\n.mobile-menu[_ngcontent-%COMP%]   a.active[_ngcontent-%COMP%], \n.mobile-menu[_ngcontent-%COMP%]   a[aria-current=page][_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(244, 63, 94, 0.14),\n      rgba(244, 63, 94, 0.04));\n  color: #fff;\n  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.03);\n}\n.mobile-menu[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:focus, \n.mobile-menu[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:focus {\n  outline: 2px solid rgba(244, 63, 94, 0.18);\n  outline-offset: 2px;\n}\n.mobile-menu[_ngcontent-%COMP%]   .break-words[_ngcontent-%COMP%] {\n  word-break: break-word;\n}\n.dark[_nghost-%COMP%]   .drawer-panel[_ngcontent-%COMP%], .dark   [_nghost-%COMP%]   .drawer-panel[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      180deg,\n      #0b1220 0%,\n      #0b1220 100%);\n}\n/*# sourceMappingURL=nav-bar.component.css.map */"] });
var NavBarComponent = _NavBarComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NavBarComponent, [{
    type: Component,
    args: [{ selector: "app-nav-bar", standalone: true, imports: [CommonModule, MenuComponent], template: `<!-- nav-bar.component.html - MODERNIZADO CON TAILWIND -->\r
<header class="relative z-50">\r
  <nav\r
    class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm border-b border-gray-700/50 shadow-xl shadow-black/20"\r
  >\r
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\r
      <div class="flex items-center justify-between h-16 lg:h-20">\r
        <!-- Mobile Logo (visible on small screens) -->\r
        <div class="md:hidden flex items-center space-x-3">\r
          <svg\r
            class="h-8 w-8 fill-red-500"\r
            xmlns="http://www.w3.org/2000/svg"\r
            viewBox="0 0 24 24"\r
          >\r
            <path\r
              d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r
            ></path>\r
          </svg>\r
          <span class="text-white font-bold text-lg"\r
            >GPTV<span class="text-red-500">.</span></span\r
          >\r
        </div>\r
\r
        <!-- Navigation Links -->\r
        <nav class="hidden md:flex space-x-8 text-gray-300 font-medium">\r
          <a\r
            routerLink="/"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/50"\r
            [ngClass]="{\r
              'text-white bg-red-500/20 border-b-2 border-red-500': isHome,\r
              'hover:text-red-300': !isHome\r
            }"\r
          >\r
            <span class="relative z-10">Gu\xEDa TV</span>\r
            <div\r
              *ngIf="isHome"\r
              class="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
\r
          <a\r
            routerLink="/programacion-tv/guia-canales"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"\r
            [ngClass]="{\r
              'text-white bg-blue-500/20 border-b-2 border-blue-500':\r
                isGuiaCanales,\r
              'hover:text-blue-300': !isGuiaCanales\r
            }"\r
          >\r
            <span class="relative z-10">Canales</span>\r
            <div\r
              *ngIf="isGuiaCanales"\r
              class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
\r
          <a\r
            routerLink="/programacion-tv/peliculas"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"\r
            [ngClass]="{\r
              'text-white bg-purple-500/20 border-b-2 border-purple-500':\r
                isPeliculas,\r
              'hover:text-purple-300': !isPeliculas\r
            }"\r
          >\r
            <span class="relative z-10">Pel\xEDculas</span>\r
            <div\r
              *ngIf="isPeliculas"\r
              class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
\r
          <a\r
            routerLink="/programacion-tv/series"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-green-500/10 focus:outline-none focus:ring-2 focus:ring-green-500/50"\r
            [ngClass]="{\r
              'text-white bg-green-500/20 border-b-2 border-green-500':\r
                isSeries,\r
              'hover:text-green-300': !isSeries\r
            }"\r
          >\r
            <span class="relative z-10">Series</span>\r
            <div\r
              *ngIf="isSeries"\r
              class="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
\r
          <a\r
            routerLink="/blog"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50"\r
            [ngClass]="{\r
              'text-white bg-violet-500/20 border-b-2 border-violet-500':\r
                isBlog,\r
              'hover:text-violet-300': !isBlog\r
            }"\r
          >\r
            <span class="relative z-10">Blog</span>\r
            <div\r
              *ngIf="isBlog"\r
              class="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-violet-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
\r
          <a\r
            routerLink="/programacion-tv/en-directo"\r
            class="relative px-3 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50"\r
            [ngClass]="{\r
              'text-white bg-orange-500/20 border-b-2 border-orange-500':\r
                isDirecto,\r
              'hover:text-orange-300': !isDirecto\r
            }"\r
          >\r
            <span class="relative z-10 flex items-center space-x-2">\r
              <span>En Vivo</span>\r
              <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>\r
            </span>\r
            <div\r
              *ngIf="isDirecto"\r
              class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg"\r
            ></div>\r
          </a>\r
        </nav>\r
\r
        <!-- Mobile Menu Button -->\r
        <button\r
          class="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"\r
          (click)="$any(menuState).toggleMobile()"\r
        >\r
          <svg\r
            class="w-6 h-6"\r
            fill="none"\r
            stroke="currentColor"\r
            viewBox="0 0 24 24"\r
          >\r
            <path\r
              stroke-linecap="round"\r
              stroke-linejoin="round"\r
              stroke-width="2"\r
              d="M4 6h16M4 12h16M4 18h16"\r
            ></path>\r
          </svg>\r
        </button>\r
      </div>\r
    </div>\r
  </nav>\r
  <!-- Mobile overlay: shown when MenuStateService.mobileOpen is true -->\r
  <aside\r
    *ngIf="menuState.getMobile() | async"\r
    class="mobile-drawer fixed inset-0 z-50 lg:hidden"\r
    (click)="$any(menuState).toggleMobile()"\r
  >\r
    <div class="drawer-backdrop" aria-hidden="true"></div>\r
\r
    <div\r
      class="drawer-panel w-11/12 max-w-xs h-full bg-gradient-to-b from-white/95 to-white/90 dark:from-zinc-900 dark:to-zinc-800 p-4"\r
      (click)="$event.stopPropagation()"\r
    >\r
      <div class="flex items-center justify-between mb-4">\r
        <div class="flex items-center space-x-3">\r
          <!-- Small logo -->\r
          <svg\r
            class="h-8 w-8 fill-red-500"\r
            xmlns="http://www.w3.org/2000/svg"\r
            viewBox="0 0 24 24"\r
          >\r
            <path\r
              d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r
            ></path>\r
          </svg>\r
          <span class="text-white font-bold text-lg"\r
            >GPTV<span class="text-red-500">.</span></span\r
          >\r
        </div>\r
\r
        <button\r
          (click)="$any(menuState).toggleMobile()"\r
          class="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/40"\r
          aria-label="Cerrar men\xFA"\r
        >\r
          <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            class="h-6 w-6 text-white"\r
            fill="none"\r
            viewBox="0 0 24 24"\r
            stroke="currentColor"\r
            stroke-width="2"\r
          >\r
            <path\r
              stroke-linecap="round"\r
              stroke-linejoin="round"\r
              d="M6 18L18 6M6 6l12 12"\r
            />\r
          </svg>\r
        </button>\r
      </div>\r
\r
      <!-- Use the app-menu but style links via CSS for better active state -->\r
      <div class="mobile-menu overflow-auto h-[calc(100vh-88px)] pr-2">\r
        <app-menu (click)="$event.stopPropagation()"></app-menu>\r
      </div>\r
    </div>\r
  </aside>\r
</header>\r
`, styles: ["/* src/app/components/nav-bar/nav-bar.component.scss */\n.mobile-drawer {\n  display: block;\n}\n.drawer-backdrop {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(0, 0, 0, 0.55),\n      rgba(0, 0, 0, 0.6));\n  -webkit-backdrop-filter: blur(6px);\n  backdrop-filter: blur(6px);\n}\n.drawer-panel {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 100%;\n  transform: translateX(-6%);\n  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.6);\n  border-top-right-radius: 12px;\n  border-bottom-right-radius: 12px;\n  overflow: hidden;\n  animation: slide-in 260ms cubic-bezier(0.2, 0.9, 0.3, 1) both;\n  background:\n    linear-gradient(\n      180deg,\n      #0f1724 0%,\n      #111827 50%,\n      #000000 100%);\n  color: #e5e7eb;\n}\n@keyframes slide-in {\n  from {\n    transform: translateX(-12%);\n    opacity: 0;\n  }\n  to {\n    transform: translateX(0);\n    opacity: 1;\n  }\n}\n.mobile-menu {\n  -webkit-overflow-scrolling: touch;\n}\n.mobile-menu a,\n.mobile-menu button {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  width: 100%;\n  padding: 0.75rem 0.5rem;\n  border-radius: 8px;\n  color: #e5e7eb;\n  text-decoration: none;\n  font-weight: 600;\n  transition:\n    background-color 150ms ease,\n    color 150ms ease,\n    transform 120ms ease;\n}\n.mobile-menu a:hover,\n.mobile-menu button:hover {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(244, 63, 94, 0.06),\n      rgba(255, 255, 255, 0.02));\n  color: #fff;\n}\n.mobile-menu a.active,\n.mobile-menu a[aria-current=page] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(244, 63, 94, 0.14),\n      rgba(244, 63, 94, 0.04));\n  color: #fff;\n  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.03);\n}\n.mobile-menu a:focus,\n.mobile-menu button:focus {\n  outline: 2px solid rgba(244, 63, 94, 0.18);\n  outline-offset: 2px;\n}\n.mobile-menu .break-words {\n  word-break: break-word;\n}\n:host-context(.dark) .drawer-panel {\n  background:\n    linear-gradient(\n      180deg,\n      #0b1220 0%,\n      #0b1220 100%);\n}\n/*# sourceMappingURL=nav-bar.component.css.map */\n"] }]
  }], () => [{ type: Router }, { type: MenuStateService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NavBarComponent, { className: "NavBarComponent", filePath: "src/app/components/nav-bar/nav-bar.component.ts", lineNumber: 15 });
})();

export {
  NavBarComponent
};
//# sourceMappingURL=chunk-MEXIL4LO.js.map
