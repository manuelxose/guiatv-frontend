import {
  BlogService
} from "./chunk-K74GGWCH.js";
import {
  CommonModule,
  NgIf,
  RouterOutlet
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Subject,
  first,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-UEL6V4IP.js";

// src/app/blog/layout/blog-layout.component.ts
function BlogLayoutComponent_div_2_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.errorMessage);
  }
}
function BlogLayoutComponent_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "div")(3, "strong");
    \u0275\u0275text(4, "Atenci\xF3n:");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, BlogLayoutComponent_div_2_span_5_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div")(7, "button", 7);
    \u0275\u0275listener("click", function BlogLayoutComponent_div_2_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.hasError = false);
    });
    \u0275\u0275text(8, "Cerrar");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r1.errorMessage);
  }
}
var _BlogLayoutComponent = class _BlogLayoutComponent {
  constructor(blogSvc) {
    this.blogSvc = blogSvc;
    this.hasError = false;
    this.errorMessage = null;
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    this.blogSvc.posts$.pipe(first()).subscribe((posts) => {
      if (!posts || posts.length === 0) {
        this.blogSvc.getAllPosts().pipe(first()).subscribe();
      }
    });
    this.blogSvc.error$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if (msg) {
        this.hasError = true;
        this.errorMessage = msg;
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
};
_BlogLayoutComponent.\u0275fac = function BlogLayoutComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _BlogLayoutComponent)(\u0275\u0275directiveInject(BlogService));
};
_BlogLayoutComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BlogLayoutComponent, selectors: [["app-blog-layout"]], decls: 5, vars: 1, consts: [[1, "font-montserrat", "bg-gradient-to-br", "from-gray-900", "via-gray-800", "to-black", "min-h-screen"], [1, "flex", "flex-col", "lg:flex-row", "h-full", "w-full"], ["class", "w-full bg-yellow-600 text-black py-3 px-4", 4, "ngIf"], [1, "flex-1", "w-full", "mx-auto", "max-w-7xl"], [1, "w-full", "bg-yellow-600", "text-black", "py-3", "px-4"], [1, "max-w-7xl", "mx-auto", "flex", "items-center", "justify-between"], [4, "ngIf"], [1, "underline", 3, "click"]], template: function BlogLayoutComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
    \u0275\u0275template(2, BlogLayoutComponent_div_2_Template, 9, 1, "div", 2);
    \u0275\u0275elementStart(3, "main", 3);
    \u0275\u0275element(4, "router-outlet");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx.hasError);
  }
}, dependencies: [CommonModule, NgIf, RouterOutlet], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  min-height: 100vh;\n}\n/*# sourceMappingURL=blog-layout.component.css.map */"] });
var BlogLayoutComponent = _BlogLayoutComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlogLayoutComponent, [{
    type: Component,
    args: [{ selector: "app-blog-layout", standalone: true, imports: [CommonModule, RouterOutlet], template: '<div\r\n  class="font-montserrat bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen"\r\n>\r\n  <div class="flex flex-col lg:flex-row h-full w-full">\r\n    <!-- Error banner when blog API fails -->\r\n    <div *ngIf="hasError" class="w-full bg-yellow-600 text-black py-3 px-4">\r\n      <div class="max-w-7xl mx-auto flex items-center justify-between">\r\n        <div>\r\n          <strong>Atenci\xF3n:</strong>\r\n          <span *ngIf="errorMessage">{{ errorMessage }}</span>\r\n        </div>\r\n        <div>\r\n          <button class="underline" (click)="hasError = false">Cerrar</button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n\r\n    <!-- Main Content Area con m\xE1ximo ancho optimizado -->\r\n    <main class="flex-1 w-full mx-auto max-w-7xl">\r\n      <router-outlet></router-outlet>\r\n    </main>\r\n  </div>\r\n</div>\r\n', styles: ["/* src/app/blog/layout/blog-layout.component.scss */\n:host {\n  display: block;\n  width: 100%;\n  min-height: 100vh;\n}\n/*# sourceMappingURL=blog-layout.component.css.map */\n"] }]
  }], () => [{ type: BlogService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BlogLayoutComponent, { className: "BlogLayoutComponent", filePath: "src/app/blog/layout/blog-layout.component.ts", lineNumber: 14 });
})();

export {
  BlogLayoutComponent
};
//# sourceMappingURL=chunk-SSDZXPCL.js.map
