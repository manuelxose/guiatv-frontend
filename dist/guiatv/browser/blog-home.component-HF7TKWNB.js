import {
  BlogService
} from "./chunk-K74GGWCH.js";
import {
  MetaService
} from "./chunk-MKFCNM4X.js";
import {
  CommonModule,
  DatePipe,
  NgForOf,
  NgIf,
  Router,
  RouterLink,
  RouterModule,
  isPlatformBrowser,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  Output,
  PLATFORM_ID,
  Subject,
  first,
  setClassMetadata,
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
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/components/post-card/post-card.component.ts
function PostCardComponent_div_7_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", cat_r1.name, " ");
  }
}
function PostCardComponent_div_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275template(1, PostCardComponent_div_7_span_1_Template, 2, 1, "span", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.post.categories_name.slice(0, 2));
  }
}
function PostCardComponent_p_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.stripHtml(ctx_r1.post.excerpt.rendered), " ");
  }
}
var _PostCardComponent = class _PostCardComponent {
  stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  getReadingTime(content) {
    if (!content)
      return 1;
    const text = this.stripHtml(content);
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }
};
_PostCardComponent.\u0275fac = function PostCardComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _PostCardComponent)();
};
_PostCardComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PostCardComponent, selectors: [["app-post-card"]], inputs: { post: "post" }, decls: 19, vars: 12, consts: [[1, "group", "relative", "bg-gray-800", "rounded-lg", "overflow-hidden", "transition-all", "duration-300", "hover:transform", "hover:scale-105", "hover:shadow-2xl", "cursor-pointer"], [1, "relative", "aspect-[16/9]", "overflow-hidden", "bg-gray-700"], ["loading", "lazy", "width", "400", "height", "225", 1, "w-full", "h-full", "object-cover", "transition-transform", "duration-300", "group-hover:scale-110", 3, "src", "alt"], [1, "absolute", "inset-0", "bg-gradient-to-t", "from-black/70", "via-black/20", "to-transparent", "opacity-0", "group-hover:opacity-100", "transition-opacity", "duration-300"], [1, "absolute", "top-3", "right-3", "px-3", "py-1", "bg-black/70", "backdrop-blur-sm", "text-white", "text-xs", "font-medium", "rounded-full"], [1, "p-5", "space-y-3"], ["class", "flex flex-wrap gap-2", 4, "ngIf"], [1, "text-lg", "font-bold", "text-white", "line-clamp-2", "group-hover:text-red-400", "transition-colors", "duration-200"], ["class", "text-sm text-gray-400 line-clamp-2", 4, "ngIf"], [1, "flex", "items-center", "justify-between", "pt-3", "border-t", "border-gray-700"], [1, "text-xs", "text-gray-500", 3, "dateTime"], [1, "text-xs", "text-red-400", "font-medium", "group-hover:translate-x-1", "transition-transform", "duration-200", "inline-flex", "items-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "ml-1", "w-4", "h-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], [1, "flex", "flex-wrap", "gap-2"], ["class", "inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full", 4, "ngFor", "ngForOf"], [1, "inline-block", "px-3", "py-1", "text-xs", "font-medium", "text-red-400", "bg-red-400/10", "rounded-full"], [1, "text-sm", "text-gray-400", "line-clamp-2"]], template: function PostCardComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "article", 0)(1, "div", 1);
    \u0275\u0275element(2, "img", 2)(3, "div", 3);
    \u0275\u0275elementStart(4, "span", 4);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 5);
    \u0275\u0275template(7, PostCardComponent_div_7_Template, 2, 1, "div", 6);
    \u0275\u0275elementStart(8, "h3", 7);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, PostCardComponent_p_10_Template, 2, 1, "p", 8);
    \u0275\u0275elementStart(11, "div", 9)(12, "time", 10);
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "span", 11);
    \u0275\u0275text(16, " Leer m\xE1s ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(17, "svg", 12);
    \u0275\u0275element(18, "path", 13);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    \u0275\u0275attribute("aria-label", "Art\xEDculo: " + (ctx.post.title == null ? null : ctx.post.title.rendered));
    \u0275\u0275advance(2);
    \u0275\u0275property("src", (ctx.post.featured_image == null ? null : ctx.post.featured_image.source_url) || "/assets/images/placeholder.jpg", \u0275\u0275sanitizeUrl)("alt", (ctx.post.title == null ? null : ctx.post.title.rendered) || "Imagen del art\xEDculo");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx.getReadingTime(ctx.post.content == null ? null : ctx.post.content.rendered), " min ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx.post.categories_name == null ? null : ctx.post.categories_name.length);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx.post.title == null ? null : ctx.post.title.rendered, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.post.excerpt == null ? null : ctx.post.excerpt.rendered);
    \u0275\u0275advance(2);
    \u0275\u0275property("dateTime", ctx.post.date);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(14, 9, ctx.post.date, "dd MMM yyyy"), " ");
  }
}, dependencies: [CommonModule, NgForOf, NgIf, DatePipe], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n}\n/*# sourceMappingURL=post-card.component.css.map */"], changeDetection: 0 });
var PostCardComponent = _PostCardComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PostCardComponent, [{
    type: Component,
    args: [{ selector: "app-post-card", standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
    <article
      class="group relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl cursor-pointer"
      [attr.aria-label]="'Art\xEDculo: ' + post.title?.rendered"
    >
      <!-- Image Container -->
      <div class="relative aspect-[16/9] overflow-hidden bg-gray-700">
        <img
          [src]="
            post.featured_image?.source_url || '/assets/images/placeholder.jpg'
          "
          [alt]="post.title?.rendered || 'Imagen del art\xEDculo'"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          width="400"
          height="225"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>

        <!-- Reading Time Badge -->
        <span
          class="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full"
        >
          {{ getReadingTime(post.content?.rendered) }} min
        </span>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-3">
        <!-- Categories -->
        <div class="flex flex-wrap gap-2" *ngIf="post.categories_name?.length">
          <span
            *ngFor="let cat of post.categories_name.slice(0, 2)"
            class="inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full"
          >
            {{ cat.name }}
          </span>
        </div>

        <!-- Title -->
        <h3
          class="text-lg font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors duration-200"
        >
          {{ post.title?.rendered }}
        </h3>

        <!-- Excerpt -->
        <p
          class="text-sm text-gray-400 line-clamp-2"
          *ngIf="post.excerpt?.rendered"
        >
          {{ stripHtml(post.excerpt.rendered) }}
        </p>

        <!-- Meta Info -->
        <div
          class="flex items-center justify-between pt-3 border-t border-gray-700"
        >
          <time [dateTime]="post.date" class="text-xs text-gray-500">
            {{ post.date | date : 'dd MMM yyyy' }}
          </time>
          <span
            class="text-xs text-red-400 font-medium group-hover:translate-x-1 transition-transform duration-200 inline-flex items-center"
          >
            Leer m\xE1s
            <svg
              class="ml-1 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>

      <!-- Schema.org JSON-LD for SEO -->
      <script type="application/ld+json">
        {{
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title?.rendered,
            "image": post.featured_image?.source_url,
            "datePublished": post.date,
            "dateModified": post.modified,
            "author": {
              "@type": "Person",
              "name": "Equipo Editorial"
            }
          } | json
        }}
      <\/script>
    </article>
  `, styles: ["/* angular:styles/component:scss;7f43ff1825ad05d68e14cc46aa4157d1978629e507df9ccdf9f54268a878a284;C:/Users/mgonzalezv.INDRA/Documents/private-workspace/guia-tv/src/app/components/post-card/post-card.component.ts */\n:host {\n  display: block;\n}\n/*# sourceMappingURL=post-card.component.css.map */\n"] }]
  }], null, { post: [{
    type: Input
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PostCardComponent, { className: "PostCardComponent", filePath: "src/app/components/post-card/post-card.component.ts", lineNumber: 121 });
})();

// src/app/blog/components/category-filter/category-filter.component.ts
function CategoryFilterComponent_button_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 5);
    \u0275\u0275listener("click", function CategoryFilterComponent_button_5_Template_button_click_0_listener() {
      const category_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectCategory(category_r2.id));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const category_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("active", ctx_r2.selectedCategory === category_r2.id)("bg-red-600", ctx_r2.selectedCategory === category_r2.id)("text-white", ctx_r2.selectedCategory === category_r2.id)("bg-gray-700", ctx_r2.selectedCategory !== category_r2.id)("text-gray-300", ctx_r2.selectedCategory !== category_r2.id)("hover:bg-red-700", ctx_r2.selectedCategory === category_r2.id)("hover:bg-gray-600", ctx_r2.selectedCategory !== category_r2.id);
    \u0275\u0275attribute("aria-label", "Filtrar por " + category_r2.name)("aria-pressed", ctx_r2.selectedCategory === category_r2.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", category_r2.name, " ");
  }
}
var _CategoryFilterComponent = class _CategoryFilterComponent {
  constructor() {
    this.categories = [];
    this.selectedCategory = null;
    this.categorySelected = new EventEmitter();
  }
  selectCategory(categoryId) {
    this.categorySelected.emit(categoryId);
  }
  trackById(index, item) {
    return item.id || index;
  }
};
_CategoryFilterComponent.\u0275fac = function CategoryFilterComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _CategoryFilterComponent)();
};
_CategoryFilterComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CategoryFilterComponent, selectors: [["app-category-filter"]], inputs: { categories: "categories", selectedCategory: "selectedCategory" }, outputs: { categorySelected: "categorySelected" }, decls: 6, vars: 16, consts: [["role", "navigation", "aria-label", "Filtro de categor\xEDas", 1, "flex", "items-center", "gap-3", "overflow-x-auto", "scrollbar-thin", "scrollbar-thumb-gray-700", "pb-2"], ["aria-label", "Mostrar todas las categor\xEDas", 1, "filter-btn", "whitespace-nowrap", "px-5", "py-2", "rounded-full", "font-medium", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "inline-block", "w-4", "h-4", "mr-2"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M4 6h16M4 12h16M4 18h16"], ["class", "filter-btn whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500", 3, "active", "bg-red-600", "text-white", "bg-gray-700", "text-gray-300", "hover:bg-red-700", "hover:bg-gray-600", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "filter-btn", "whitespace-nowrap", "px-5", "py-2", "rounded-full", "font-medium", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"]], template: function CategoryFilterComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "nav", 0)(1, "button", 1);
    \u0275\u0275listener("click", function CategoryFilterComponent_Template_button_click_1_listener() {
      return ctx.selectCategory(null);
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 2);
    \u0275\u0275element(3, "path", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4, " Todas ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, CategoryFilterComponent_button_5_Template, 2, 17, "button", 4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275classProp("active", ctx.selectedCategory === null)("bg-red-600", ctx.selectedCategory === null)("text-white", ctx.selectedCategory === null)("bg-gray-700", ctx.selectedCategory !== null)("text-gray-300", ctx.selectedCategory !== null)("hover:bg-red-700", ctx.selectedCategory === null)("hover:bg-gray-600", ctx.selectedCategory !== null);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx.categories)("ngForTrackBy", ctx.trackById);
  }
}, dependencies: [CommonModule, NgForOf], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.filter-btn[_ngcontent-%COMP%] {\n  transform: scale(1);\n}\n.filter-btn[_ngcontent-%COMP%]:hover {\n  transform: scale(1.05);\n}\n.filter-btn.active[_ngcontent-%COMP%] {\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n}\nnav[_ngcontent-%COMP%] {\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n}\n@media (max-width: 640px) {\n  .filter-btn[_ngcontent-%COMP%] {\n    font-size: 0.875rem;\n    padding: 0.5rem 1rem;\n  }\n}\n/*# sourceMappingURL=category-filter.component.css.map */"], changeDetection: 0 });
var CategoryFilterComponent = _CategoryFilterComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CategoryFilterComponent, [{
    type: Component,
    args: [{ selector: "app-category-filter", standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
    <nav
      class="flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 pb-2"
      role="navigation"
      aria-label="Filtro de categor\xEDas"
    >
      <button
        (click)="selectCategory(null)"
        [class.active]="selectedCategory === null"
        class="filter-btn whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        [class.bg-red-600]="selectedCategory === null"
        [class.text-white]="selectedCategory === null"
        [class.bg-gray-700]="selectedCategory !== null"
        [class.text-gray-300]="selectedCategory !== null"
        [class.hover:bg-red-700]="selectedCategory === null"
        [class.hover:bg-gray-600]="selectedCategory !== null"
        aria-label="Mostrar todas las categor\xEDas"
      >
        <svg
          class="inline-block w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        Todas
      </button>

      <button
        *ngFor="let category of categories; trackBy: trackById"
        (click)="selectCategory(category.id)"
        [class.active]="selectedCategory === category.id"
        class="filter-btn whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        [class.bg-red-600]="selectedCategory === category.id"
        [class.text-white]="selectedCategory === category.id"
        [class.bg-gray-700]="selectedCategory !== category.id"
        [class.text-gray-300]="selectedCategory !== category.id"
        [class.hover:bg-red-700]="selectedCategory === category.id"
        [class.hover:bg-gray-600]="selectedCategory !== category.id"
        [attr.aria-label]="'Filtrar por ' + category.name"
        [attr.aria-pressed]="selectedCategory === category.id"
      >
        {{ category.name }}
      </button>
    </nav>
  `, styles: ["/* angular:styles/component:scss;2f8a9a01d378eb6836d4bee16e9a6ed7dd7de2ce5c2b8c11a5637ab512200d2e;C:/Users/mgonzalezv.INDRA/Documents/private-workspace/guia-tv/src/app/blog/components/category-filter/category-filter.component.ts */\n:host {\n  display: block;\n  width: 100%;\n}\n.filter-btn {\n  transform: scale(1);\n}\n.filter-btn:hover {\n  transform: scale(1.05);\n}\n.filter-btn.active {\n  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);\n}\nnav {\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n}\n@media (max-width: 640px) {\n  .filter-btn {\n    font-size: 0.875rem;\n    padding: 0.5rem 1rem;\n  }\n}\n/*# sourceMappingURL=category-filter.component.css.map */\n"] }]
  }], null, { categories: [{
    type: Input
  }], selectedCategory: [{
    type: Input
  }], categorySelected: [{
    type: Output
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CategoryFilterComponent, { className: "CategoryFilterComponent", filePath: "src/app/blog/components/category-filter/category-filter.component.ts", lineNumber: 101 });
})();

// src/app/blog/pages/blog-home/blog-home.component.ts
var _c0 = () => [1, 2, 3, 4, 5, 6];
function BlogHomeComponent_ng_container_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 32);
    \u0275\u0275element(2, "img", 33)(3, "div", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const post_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("src", post_r1.featured_image == null ? null : post_r1.featured_image.source_url, \u0275\u0275sanitizeUrl)("alt", (post_r1.title == null ? null : post_r1.title.rendered) || "Imagen destacada");
  }
}
function BlogHomeComponent_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 32);
    \u0275\u0275element(2, "img", 33)(3, "div", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const post_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("src", post_r2.featured_image == null ? null : post_r2.featured_image.source_url, \u0275\u0275sanitizeUrl)("alt", (post_r2.title == null ? null : post_r2.title.rendered) || "Imagen destacada");
  }
}
function BlogHomeComponent_div_33_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 37);
    \u0275\u0275element(1, "div", 38)(2, "div", 39)(3, "div", 40);
    \u0275\u0275elementEnd();
  }
}
function BlogHomeComponent_div_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275template(1, BlogHomeComponent_div_33_div_1_Template, 4, 0, "div", 36);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c0));
  }
}
function BlogHomeComponent_div_34_app_post_card_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-post-card", 42);
    \u0275\u0275listener("click", function BlogHomeComponent_div_34_app_post_card_1_Template_app_post_card_click_0_listener() {
      const post_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.navigateToPost(post_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const post_r4 = ctx.$implicit;
    \u0275\u0275property("post", post_r4);
  }
}
function BlogHomeComponent_div_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275template(1, BlogHomeComponent_div_34_app_post_card_1_Template, 1, 1, "app-post-card", 41);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r4.latestPosts)("ngForTrackBy", ctx_r4.trackByPostId);
  }
}
function BlogHomeComponent_div_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 43)(1, "button", 44);
    \u0275\u0275listener("click", function BlogHomeComponent_div_35_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.loadMore());
    });
    \u0275\u0275text(2, " Cargar M\xE1s Art\xEDculos ");
    \u0275\u0275elementEnd()();
  }
}
var _BlogHomeComponent = class _BlogHomeComponent {
  constructor(blogSvc, metaSvc, router, platformId) {
    this.blogSvc = blogSvc;
    this.metaSvc = metaSvc;
    this.router = router;
    this.destroy$ = new Subject();
    this.posts = [];
    this.featuredPosts = [];
    this.latestPosts = [];
    this.categories = [];
    this.postsPerPage = 12;
    this.currentPage = 1;
    this.isLoading = true;
    this.selectedCategory = null;
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnInit() {
    this.setMetaTags();
    this.loadData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  setMetaTags() {
    this.metaSvc.setMetaTags({
      title: "Blog de Cine, Series y Anime | Noticias y An\xE1lisis",
      description: "Descubre art\xEDculos, rese\xF1as y an\xE1lisis sobre cine, series y anime. Mantente al d\xEDa con las \xFAltimas noticias del entretenimiento.",
      image: "/assets/images/blog-og-image.jpg",
      canonicalUrl: "/blog",
      type: "website"
    });
  }
  loadData() {
    this.blogSvc.getAllPosts().pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.posts = this.sortByDate(data);
        this.featuredPosts = this.posts.slice(0, 6);
        this.latestPosts = this.posts.slice(0, 12);
        this.loadCategories();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading posts:", err);
        this.isLoading = false;
      }
    });
  }
  loadCategories() {
    this.blogSvc.blogCategories$.pipe(takeUntil(this.destroy$)).subscribe((cats) => {
      if (cats.length === 0) {
        this.blogSvc.intiCategories(this.posts);
      } else {
        this.categories = cats;
      }
    });
  }
  sortByDate(posts) {
    return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  // UI Methods
  navigateToPost(post) {
    const slug = slugify(post.slug || post.title?.rendered || "");
    this.router.navigate(["/blog", slug]);
  }
  filterByCategory(categoryId) {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
    if (!categoryId) {
      this.latestPosts = this.posts.slice(0, this.postsPerPage);
      return;
    }
    this.blogSvc.filterByCategory(Number(categoryId)).pipe(first()).subscribe((filtered) => {
      this.latestPosts = filtered.slice(0, this.postsPerPage);
    });
  }
  loadMore() {
    this.currentPage++;
    const start = 0;
    const end = this.currentPage * this.postsPerPage;
    if (this.selectedCategory) {
      this.blogSvc.filterByCategory(Number(this.selectedCategory)).pipe(first()).subscribe((filtered) => {
        this.latestPosts = filtered.slice(start, end);
      });
    } else {
      this.latestPosts = this.posts.slice(start, end);
    }
  }
  get hasMorePosts() {
    const totalPosts = this.selectedCategory ? this.latestPosts.length : this.posts.length;
    return this.currentPage * this.postsPerPage < totalPosts;
  }
  trackByPostId(index, post) {
    return post.id || index;
  }
};
_BlogHomeComponent.\u0275fac = function BlogHomeComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _BlogHomeComponent)(\u0275\u0275directiveInject(BlogService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(PLATFORM_ID));
};
_BlogHomeComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BlogHomeComponent, selectors: [["app-blog-home"]], decls: 46, vars: 11, consts: [[1, "w-full", "min-h-screen"], [1, "relative", "py-12", "lg:py-20", "px-4", "sm:px-6", "lg:px-8", "overflow-hidden", "border-b", "border-gray-700/50"], [1, "max-w-7xl", "mx-auto"], [1, "grid", "lg:grid-cols-2", "gap-8", "lg:gap-12", "items-center"], [1, "space-y-6", "order-2", "lg:order-1"], [1, "text-3xl", "sm:text-4xl", "lg:text-5xl", "font-bold", "text-white", "leading-tight"], [1, "text-lg", "sm:text-xl", "text-gray-300", "leading-relaxed"], [1, "flex", "flex-wrap", "gap-4"], ["routerLink", "/blog", "aria-label", "Explorar art\xEDculos del blog", 1, "inline-flex", "items-center", "px-6", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "transform", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "focus:ring-offset-2", "focus:ring-offset-gray-900"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "ml-2", "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M13 7l5 5m0 0l-5 5m5-5H6"], ["routerLink", "/blog/top10", "aria-label", "Ver rankings Top 10", 1, "inline-flex", "items-center", "px-6", "py-3", "bg-gray-700", "hover:bg-gray-600", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-gray-500"], ["aria-hidden", "true", 1, "order-1", "lg:order-2", "h-64", "lg:h-96", "relative"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-gray-900", "via-transparent", "to-gray-900", "z-10", "pointer-events-none"], [1, "flex", "h-full", "gap-4", "overflow-hidden"], [1, "flex-1", "flex", "flex-col", "gap-4", "animate-scroll-up"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "flex-1", "flex", "flex-col", "gap-4", "animate-scroll-down"], [1, "py-8", "px-4", "sm:px-6", "lg:px-8", "bg-gray-800/50", "sticky", "top-0", "z-30", "backdrop-blur-sm"], [3, "categorySelected", "categories", "selectedCategory"], [1, "py-12", "lg:py-16", "px-4", "sm:px-6", "lg:px-8"], [1, "flex", "flex-col", "sm:flex-row", "justify-between", "items-start", "sm:items-center", "mb-8", "gap-4"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white"], [1, "text-gray-400", "text-sm"], ["class", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8", 4, "ngIf"], ["class", "flex justify-center mt-12", 4, "ngIf"], [1, "py-12", "lg:py-16", "px-4", "sm:px-6", "lg:px-8", "bg-gradient-to-r", "from-gray-800", "to-gray-900"], [1, "max-w-4xl", "mx-auto", "text-center", "space-y-6"], [1, "text-lg", "text-gray-300", "max-w-2xl", "mx-auto"], [1, "flex", "flex-col", "sm:flex-row", "gap-4", "max-w-md", "mx-auto"], ["type", "email", "placeholder", "tu@email.com", "aria-label", "Correo electr\xF3nico", 1, "flex-1", "px-4", "py-3", "rounded-full", "bg-gray-700", "text-white", "placeholder-gray-400", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], ["type", "submit", "aria-label", "Suscribirse al newsletter", 1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], [1, "relative", "rounded-lg", "overflow-hidden", "flex-shrink-0", "h-64", "lg:h-80"], ["loading", "lazy", 1, "w-full", "h-full", "object-cover", 3, "src", "alt"], [1, "absolute", "inset-0", "bg-gradient-to-t", "from-black/70", "to-transparent"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-6", "lg:gap-8"], ["class", "animate-pulse", 4, "ngFor", "ngForOf"], [1, "animate-pulse"], [1, "bg-gray-700", "rounded-lg", "h-64", "mb-4"], [1, "bg-gray-700", "h-4", "rounded", "mb-2"], [1, "bg-gray-700", "h-4", "rounded", "w-2/3"], [3, "post", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [3, "click", "post"], [1, "flex", "justify-center", "mt-12"], ["aria-label", "Cargar m\xE1s art\xEDculos", 1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "transform", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "focus:ring-offset-2", "focus:ring-offset-gray-900", 3, "click"]], template: function BlogHomeComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0)(1, "section", 1)(2, "div", 2)(3, "div", 3)(4, "article", 4)(5, "h1", 5);
    \u0275\u0275text(6, " Cine, Series y Anime: Tu Blog de Entretenimiento ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 6);
    \u0275\u0275text(8, " Descubre art\xEDculos de calidad sobre todos los g\xE9neros que te apasionan. Cr\xEDticas, an\xE1lisis, curiosidades y recomendaciones escritas por expertos y aficionados como t\xFA. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 7)(10, "a", 8);
    \u0275\u0275text(11, " Explorar Art\xEDculos ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(12, "svg", 9);
    \u0275\u0275element(13, "path", 10);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "a", 11);
    \u0275\u0275text(15, " Ver Top 10 ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "div", 12);
    \u0275\u0275element(17, "div", 13);
    \u0275\u0275elementStart(18, "div", 14)(19, "div", 15);
    \u0275\u0275template(20, BlogHomeComponent_ng_container_20_Template, 4, 2, "ng-container", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 17);
    \u0275\u0275template(22, BlogHomeComponent_ng_container_22_Template, 4, 2, "ng-container", 16);
    \u0275\u0275elementEnd()()()()()();
    \u0275\u0275elementStart(23, "section", 18)(24, "div", 2)(25, "app-category-filter", 19);
    \u0275\u0275listener("categorySelected", function BlogHomeComponent_Template_app_category_filter_categorySelected_25_listener($event) {
      return ctx.filterByCategory($event);
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(26, "section", 20)(27, "div", 2)(28, "header", 21)(29, "h2", 22);
    \u0275\u0275text(30);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(31, "span", 23);
    \u0275\u0275text(32);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(33, BlogHomeComponent_div_33_Template, 2, 2, "div", 24)(34, BlogHomeComponent_div_34_Template, 2, 2, "div", 24)(35, BlogHomeComponent_div_35_Template, 3, 0, "div", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(36, "section", 26)(37, "div", 27)(38, "h2", 22);
    \u0275\u0275text(39, " Suscr\xEDbete para M\xE1s Contenido ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(40, "p", 28);
    \u0275\u0275text(41, " Recibe las \xFAltimas noticias, rese\xF1as y an\xE1lisis directamente en tu bandeja de entrada. No spam, solo contenido de calidad. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "form", 29);
    \u0275\u0275element(43, "input", 30);
    \u0275\u0275elementStart(44, "button", 31);
    \u0275\u0275text(45, " Suscribirse ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(20);
    \u0275\u0275property("ngForOf", ctx.featuredPosts.slice(0, 3))("ngForTrackBy", ctx.trackByPostId);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx.featuredPosts.slice(3, 6))("ngForTrackBy", ctx.trackByPostId);
    \u0275\u0275advance(3);
    \u0275\u0275property("categories", ctx.categories)("selectedCategory", ctx.selectedCategory);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", ctx.selectedCategory ? "Art\xEDculos Filtrados" : "\xDAltimas Publicaciones", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx.latestPosts.length, " art\xEDculos ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.hasMorePosts && !ctx.isLoading);
  }
}, dependencies: [
  CommonModule,
  NgForOf,
  NgIf,
  RouterModule,
  RouterLink,
  PostCardComponent,
  CategoryFilterComponent
], styles: ["\n\n@keyframes _ngcontent-%COMP%_scroll-up {\n  0% {\n    transform: translateY(0);\n  }\n  100% {\n    transform: translateY(-50%);\n  }\n}\n@keyframes _ngcontent-%COMP%_scroll-down {\n  0% {\n    transform: translateY(-50%);\n  }\n  100% {\n    transform: translateY(0);\n  }\n}\n.animate-scroll-up[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_scroll-up 20s linear infinite;\n}\n.animate-scroll-up[_ngcontent-%COMP%]:hover {\n  animation-play-state: paused;\n}\n.animate-scroll-down[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_scroll-down 20s linear infinite;\n}\n.animate-scroll-down[_ngcontent-%COMP%]:hover {\n  animation-play-state: paused;\n}\n@media (prefers-reduced-motion: reduce) {\n  .animate-scroll-up[_ngcontent-%COMP%], \n   .animate-scroll-down[_ngcontent-%COMP%] {\n    animation: none;\n  }\n}\n@media (max-width: 768px) {\n  .animate-scroll-up[_ngcontent-%COMP%], \n   .animate-scroll-down[_ngcontent-%COMP%] {\n    animation-duration: 15s;\n  }\n}\n/*# sourceMappingURL=blog-home.component.css.map */"] });
var BlogHomeComponent = _BlogHomeComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlogHomeComponent, [{
    type: Component,
    args: [{ selector: "app-blog-home", standalone: true, imports: [
      CommonModule,
      RouterModule,
      PostCardComponent,
      CategoryFilterComponent
    ], template: `<main class="w-full min-h-screen">\r
  <!-- Hero Section con SEO optimizado -->\r
  <section\r
    class="relative py-12 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-gray-700/50"\r
  >\r
    <div class="max-w-7xl mx-auto">\r
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">\r
        <!-- Content -->\r
        <article class="space-y-6 order-2 lg:order-1">\r
          <h1\r
            class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"\r
          >\r
            Cine, Series y Anime: Tu Blog de Entretenimiento\r
          </h1>\r
          <p class="text-lg sm:text-xl text-gray-300 leading-relaxed">\r
            Descubre art\xEDculos de calidad sobre todos los g\xE9neros que te\r
            apasionan. Cr\xEDticas, an\xE1lisis, curiosidades y recomendaciones\r
            escritas por expertos y aficionados como t\xFA.\r
          </p>\r
          <div class="flex flex-wrap gap-4">\r
            <a\r
              routerLink="/blog"\r
              class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"\r
              aria-label="Explorar art\xEDculos del blog"\r
            >\r
              Explorar Art\xEDculos\r
              <svg\r
                class="ml-2 w-5 h-5"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M13 7l5 5m0 0l-5 5m5-5H6"\r
                />\r
              </svg>\r
            </a>\r
            <a\r
              routerLink="/blog/top10"\r
              class="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"\r
              aria-label="Ver rankings Top 10"\r
            >\r
              Ver Top 10\r
            </a>\r
          </div>\r
        </article>\r
\r
        <!-- Visual Feature - Auto-scroll Gallery -->\r
        <div\r
          class="order-1 lg:order-2 h-64 lg:h-96 relative"\r
          aria-hidden="true"\r
        >\r
          <div\r
            class="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none"\r
          ></div>\r
          <div class="flex h-full gap-4 overflow-hidden">\r
            <!-- Column 1 -->\r
            <div class="flex-1 flex flex-col gap-4 animate-scroll-up">\r
              <ng-container\r
                *ngFor="\r
                  let post of featuredPosts.slice(0, 3);\r
                  trackBy: trackByPostId\r
                "\r
              >\r
                <div\r
                  class="relative rounded-lg overflow-hidden flex-shrink-0 h-64 lg:h-80"\r
                >\r
                  <img\r
                    [src]="post.featured_image?.source_url"\r
                    [alt]="post.title?.rendered || 'Imagen destacada'"\r
                    class="w-full h-full object-cover"\r
                    loading="lazy"\r
                  />\r
                  <div\r
                    class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"\r
                  ></div>\r
                </div>\r
              </ng-container>\r
            </div>\r
            <!-- Column 2 -->\r
            <div class="flex-1 flex flex-col gap-4 animate-scroll-down">\r
              <ng-container\r
                *ngFor="\r
                  let post of featuredPosts.slice(3, 6);\r
                  trackBy: trackByPostId\r
                "\r
              >\r
                <div\r
                  class="relative rounded-lg overflow-hidden flex-shrink-0 h-64 lg:h-80"\r
                >\r
                  <img\r
                    [src]="post.featured_image?.source_url"\r
                    [alt]="post.title?.rendered || 'Imagen destacada'"\r
                    class="w-full h-full object-cover"\r
                    loading="lazy"\r
                  />\r
                  <div\r
                    class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"\r
                  ></div>\r
                </div>\r
              </ng-container>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- Category Filter -->\r
  <section\r
    class="py-8 px-4 sm:px-6 lg:px-8 bg-gray-800/50 sticky top-0 z-30 backdrop-blur-sm"\r
  >\r
    <div class="max-w-7xl mx-auto">\r
      <app-category-filter\r
        [categories]="categories"\r
        [selectedCategory]="selectedCategory"\r
        (categorySelected)="filterByCategory($event)"\r
      ></app-category-filter>\r
    </div>\r
  </section>\r
\r
  <!-- Latest Posts Grid -->\r
  <section class="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">\r
    <div class="max-w-7xl mx-auto">\r
      <!-- Section Header -->\r
      <header\r
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"\r
      >\r
        <h2 class="text-2xl lg:text-3xl font-bold text-white">\r
          {{\r
            selectedCategory ? "Art\xEDculos Filtrados" : "\xDAltimas Publicaciones"\r
          }}\r
        </h2>\r
        <span class="text-gray-400 text-sm">\r
          {{ latestPosts.length }} art\xEDculos\r
        </span>\r
      </header>\r
\r
      <!-- Loading State -->\r
      <div\r
        *ngIf="isLoading"\r
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"\r
      >\r
        <div *ngFor="let i of [1, 2, 3, 4, 5, 6]" class="animate-pulse">\r
          <div class="bg-gray-700 rounded-lg h-64 mb-4"></div>\r
          <div class="bg-gray-700 h-4 rounded mb-2"></div>\r
          <div class="bg-gray-700 h-4 rounded w-2/3"></div>\r
        </div>\r
      </div>\r
\r
      <!-- Posts Grid -->\r
      <div\r
        *ngIf="!isLoading"\r
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"\r
      >\r
        <app-post-card\r
          *ngFor="let post of latestPosts; trackBy: trackByPostId"\r
          [post]="post"\r
          (click)="navigateToPost(post)"\r
        ></app-post-card>\r
      </div>\r
\r
      <!-- Load More Button -->\r
      <div *ngIf="hasMorePosts && !isLoading" class="flex justify-center mt-12">\r
        <button\r
          (click)="loadMore()"\r
          class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"\r
          aria-label="Cargar m\xE1s art\xEDculos"\r
        >\r
          Cargar M\xE1s Art\xEDculos\r
        </button>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- Newsletter CTA -->\r
  <section\r
    class="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900"\r
  >\r
    <div class="max-w-4xl mx-auto text-center space-y-6">\r
      <h2 class="text-2xl lg:text-3xl font-bold text-white">\r
        Suscr\xEDbete para M\xE1s Contenido\r
      </h2>\r
      <p class="text-lg text-gray-300 max-w-2xl mx-auto">\r
        Recibe las \xFAltimas noticias, rese\xF1as y an\xE1lisis directamente en tu\r
        bandeja de entrada. No spam, solo contenido de calidad.\r
      </p>\r
      <form class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">\r
        <input\r
          type="email"\r
          placeholder="tu@email.com"\r
          class="flex-1 px-4 py-3 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"\r
          aria-label="Correo electr\xF3nico"\r
        />\r
        <button\r
          type="submit"\r
          class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"\r
          aria-label="Suscribirse al newsletter"\r
        >\r
          Suscribirse\r
        </button>\r
      </form>\r
    </div>\r
  </section>\r
</main>\r
`, styles: ["/* src/app/blog/pages/blog-home/blog-home.component.scss */\n@keyframes scroll-up {\n  0% {\n    transform: translateY(0);\n  }\n  100% {\n    transform: translateY(-50%);\n  }\n}\n@keyframes scroll-down {\n  0% {\n    transform: translateY(-50%);\n  }\n  100% {\n    transform: translateY(0);\n  }\n}\n.animate-scroll-up {\n  animation: scroll-up 20s linear infinite;\n}\n.animate-scroll-up:hover {\n  animation-play-state: paused;\n}\n.animate-scroll-down {\n  animation: scroll-down 20s linear infinite;\n}\n.animate-scroll-down:hover {\n  animation-play-state: paused;\n}\n@media (prefers-reduced-motion: reduce) {\n  .animate-scroll-up,\n  .animate-scroll-down {\n    animation: none;\n  }\n}\n@media (max-width: 768px) {\n  .animate-scroll-up,\n  .animate-scroll-down {\n    animation-duration: 15s;\n  }\n}\n/*# sourceMappingURL=blog-home.component.css.map */\n"] }]
  }], () => [{ type: BlogService }, { type: MetaService }, { type: Router }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BlogHomeComponent, { className: "BlogHomeComponent", filePath: "src/app/blog/pages/blog-home/blog-home.component.ts", lineNumber: 32 });
})();
export {
  BlogHomeComponent
};
//# sourceMappingURL=blog-home.component-HF7TKWNB.js.map
