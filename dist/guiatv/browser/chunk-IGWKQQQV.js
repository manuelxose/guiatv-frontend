import {
  CommonModule,
  DatePipe,
  NgForOf,
  NgIf
} from "./chunk-MUKTTSZO.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/blog/components/post-card/post-card.component.ts
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
  `, styles: ["/* angular:styles/component:scss;7f43ff1825ad05d68e14cc46aa4157d1978629e507df9ccdf9f54268a878a284;C:/Users/mgonzalezv.INDRA/Documents/private-workspace/guia-tv/src/app/blog/components/post-card/post-card.component.ts */\n:host {\n  display: block;\n}\n/*# sourceMappingURL=post-card.component.css.map */\n"] }]
  }], null, { post: [{
    type: Input
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PostCardComponent, { className: "PostCardComponent", filePath: "src/app/blog/components/post-card/post-card.component.ts", lineNumber: 120 });
})();

export {
  PostCardComponent
};
//# sourceMappingURL=chunk-IGWKQQQV.js.map
