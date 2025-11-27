import {
  PostCardComponent
} from "./chunk-IGWKQQQV.js";
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
  isPlatformBrowser,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Inject,
  PLATFORM_ID,
  Subject,
  first,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
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

// src/app/blog/pages/top10/top10.component.ts
var _c0 = () => [1, 2, 3, 4, 5, 6];
function Top10Component_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 38);
    \u0275\u0275element(2, "img", 39)(3, "div", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const post_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("src", post_r1.featured_image == null ? null : post_r1.featured_image.source_url, \u0275\u0275sanitizeUrl)("alt", (post_r1.title == null ? null : post_r1.title.rendered) || "Imagen destacada");
  }
}
function Top10Component_ng_container_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 38);
    \u0275\u0275element(2, "img", 39)(3, "div", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const post_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("src", post_r2.featured_image == null ? null : post_r2.featured_image.source_url, \u0275\u0275sanitizeUrl)("alt", (post_r2.title == null ? null : post_r2.title.rendered) || "Imagen destacada");
  }
}
function Top10Component_app_post_card_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-post-card", 41);
    \u0275\u0275listener("click", function Top10Component_app_post_card_34_Template_app_post_card_click_0_listener() {
      const post_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.navigateToPost(post_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const post_r4 = ctx.$implicit;
    \u0275\u0275property("post", post_r4);
  }
}
function Top10Component_div_42_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 44)(1, "div", 45);
    \u0275\u0275element(2, "div", 46);
    \u0275\u0275elementStart(3, "div", 47);
    \u0275\u0275element(4, "div", 48)(5, "div", 49)(6, "div", 50);
    \u0275\u0275elementEnd()()();
  }
}
function Top10Component_div_42_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 42);
    \u0275\u0275template(1, Top10Component_div_42_div_1_Template, 7, 0, "div", 43);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c0));
  }
}
function Top10Component_div_43_article_1_div_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 61)(1, "span", 62);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const post_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", post_r7.categories_name[0].name, " ");
  }
}
function Top10Component_div_43_article_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 52);
    \u0275\u0275listener("click", function Top10Component_div_43_article_1_Template_article_click_0_listener() {
      const post_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.navigateToPost(post_r7));
    });
    \u0275\u0275elementStart(1, "div", 53);
    \u0275\u0275element(2, "img", 54);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 55)(4, "div");
    \u0275\u0275template(5, Top10Component_div_43_article_1_div_5_Template, 3, 1, "div", 56);
    \u0275\u0275elementStart(6, "h3", 57);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 58)(9, "time", 59);
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "span", 60);
    \u0275\u0275text(13, " Ver ranking \u2192 ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const post_r7 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("src", (post_r7.featured_image == null ? null : post_r7.featured_image.source_url) || "/assets/images/placeholder.jpg", \u0275\u0275sanitizeUrl)("alt", post_r7.title == null ? null : post_r7.title.rendered);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", post_r7.categories_name == null ? null : post_r7.categories_name.length);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", post_r7.title == null ? null : post_r7.title.rendered, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("dateTime", post_r7.date);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(11, 6, post_r7.date, "dd MMM yyyy"), " ");
  }
}
function Top10Component_div_43_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 42);
    \u0275\u0275template(1, Top10Component_div_43_article_1_Template, 14, 9, "article", 51);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r4.displayedPosts)("ngForTrackBy", ctx_r4.trackByPostId);
  }
}
function Top10Component_div_44_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 63)(1, "button", 64);
    \u0275\u0275listener("click", function Top10Component_div_44_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.loadMore());
    });
    \u0275\u0275text(2, " Cargar M\xE1s Rankings ");
    \u0275\u0275elementEnd()();
  }
}
var _Top10Component = class _Top10Component {
  constructor(blogSvc, metaSvc, router, platformId) {
    this.blogSvc = blogSvc;
    this.metaSvc = metaSvc;
    this.router = router;
    this.destroy$ = new Subject();
    this.posts = [];
    this.featuredPosts = [];
    this.displayedPosts = [];
    this.carouselIndex = 0;
    this.postsPerView = 3;
    this.currentPage = 1;
    this.postsPerPage = 10;
    this.isLoading = true;
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnInit() {
    this.setMetaTags();
    this.calculatePostsPerView();
    this.loadData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  setMetaTags() {
    this.metaSvc.setMetaTags({
      title: "Top 10 - Los Mejores Rankings de Cine, Series y Anime",
      description: "Descubre los mejores rankings y listas de cine, series y anime. Obras maestras, joyas ocultas y sorpresas de cada temporada.",
      image: "/assets/images/top10-og-image.jpg",
      canonicalUrl: "/blog/top10",
      type: "website"
    });
  }
  calculatePostsPerView() {
    if (!this.isBrowser) {
      this.postsPerView = 3;
      return;
    }
    const width = window.innerWidth;
    if (width < 640) {
      this.postsPerView = 1;
    } else if (width < 1024) {
      this.postsPerView = 2;
    } else {
      this.postsPerView = 3;
    }
  }
  loadData() {
    this.blogSvc.getAllPosts().pipe(first(), takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.posts = this.blogSvc.sortPostsByDate(data);
        this.featuredPosts = this.posts.slice(0, 6);
        this.updateDisplayedPosts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading posts:", err);
        this.isLoading = false;
      }
    });
    this.blogSvc.setProgramsFromApi();
  }
  updateDisplayedPosts() {
    const start = 0;
    const end = this.currentPage * this.postsPerPage;
    this.displayedPosts = this.posts.slice(start, end);
  }
  // Carousel Controls
  nextSlide() {
    if (this.carouselIndex < this.posts.length - this.postsPerView) {
      this.carouselIndex++;
    }
  }
  prevSlide() {
    if (this.carouselIndex > 0) {
      this.carouselIndex--;
    }
  }
  get visiblePosts() {
    return this.posts.slice(this.carouselIndex, this.carouselIndex + this.postsPerView);
  }
  get canGoPrev() {
    return this.carouselIndex > 0;
  }
  get canGoNext() {
    return this.carouselIndex < this.posts.length - this.postsPerView;
  }
  // Pagination
  loadMore() {
    this.currentPage++;
    this.updateDisplayedPosts();
  }
  get hasMorePosts() {
    return this.currentPage * this.postsPerPage < this.posts.length;
  }
  // Navigation
  navigateToPost(post) {
    const slug = slugify(post.slug || post.title?.rendered || "");
    this.router.navigate(["/blog", slug]);
  }
  trackByPostId(index, post) {
    return post.id || index;
  }
};
_Top10Component.\u0275fac = function Top10Component_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _Top10Component)(\u0275\u0275directiveInject(BlogService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(PLATFORM_ID));
};
_Top10Component.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Top10Component, selectors: [["app-top10"]], decls: 53, vars: 11, consts: [[1, "w-full", "min-h-screen"], [1, "relative", "py-12", "lg:py-20", "px-4", "sm:px-6", "lg:px-8", "overflow-hidden", "border-b", "border-gray-700/50"], [1, "max-w-7xl", "mx-auto"], [1, "grid", "lg:grid-cols-2", "gap-8", "lg:gap-12", "items-center"], [1, "space-y-6", "order-2", "lg:order-1"], [1, "text-3xl", "sm:text-4xl", "lg:text-5xl", "font-bold", "text-white", "leading-tight"], [1, "text-lg", "sm:text-xl", "text-gray-300", "leading-relaxed"], ["href", "#rankings", "aria-label", "Ver rankings", 1, "inline-flex", "items-center", "px-6", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "transform", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "ml-2", "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M19 9l-7 7-7-7"], ["aria-hidden", "true", 1, "order-1", "lg:order-2", "h-64", "lg:h-96", "relative"], [1, "absolute", "inset-0", "bg-gradient-to-r", "from-gray-900", "via-transparent", "to-gray-900", "z-10", "pointer-events-none"], [1, "flex", "h-full", "gap-4", "overflow-hidden"], [1, "flex-1", "flex", "flex-col", "gap-4", "animate-scroll-up"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "flex-1", "flex", "flex-col", "gap-4", "animate-scroll-down"], ["id", "rankings", 1, "py-12", "lg:py-16", "px-4", "sm:px-6", "lg:px-8"], [1, "flex", "justify-between", "items-center", "mb-8"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white"], [1, "flex", "gap-2"], ["aria-label", "Anterior", 1, "p-3", "bg-gray-700", "hover:bg-gray-600", "disabled:bg-gray-800", "disabled:opacity-50", "disabled:cursor-not-allowed", "text-white", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click", "disabled"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 19l-7-7 7-7"], ["aria-label", "Siguiente", 1, "p-3", "bg-gray-700", "hover:bg-gray-600", "disabled:bg-gray-800", "disabled:opacity-50", "disabled:cursor-not-allowed", "text-white", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click", "disabled"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], [1, "relative", "overflow-hidden"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-6", "lg:gap-8", "transition-transform", "duration-500"], [3, "post", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "py-12", "lg:py-16", "px-4", "sm:px-6", "lg:px-8", "bg-gray-800/30"], [1, "mb-8"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white", "mb-2"], [1, "text-gray-400"], ["class", "grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8", 4, "ngIf"], ["class", "flex justify-center mt-12", 4, "ngIf"], [1, "py-12", "lg:py-16", "px-4", "sm:px-6", "lg:px-8", "bg-gradient-to-r", "from-red-900/20", "to-gray-900"], [1, "max-w-4xl", "mx-auto", "text-center", "space-y-6"], [1, "text-lg", "text-gray-300", "max-w-2xl", "mx-auto"], [1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], [1, "relative", "rounded-lg", "overflow-hidden", "flex-shrink-0", "h-64", "lg:h-80"], ["loading", "lazy", 1, "w-full", "h-full", "object-cover", 3, "src", "alt"], [1, "absolute", "inset-0", "bg-gradient-to-t", "from-black/70", "to-transparent"], [3, "click", "post"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "gap-6", "lg:gap-8"], ["class", "animate-pulse", 4, "ngFor", "ngForOf"], [1, "animate-pulse"], [1, "flex", "gap-4"], [1, "bg-gray-700", "rounded-lg", "w-32", "h-32", "flex-shrink-0"], [1, "flex-1", "space-y-3"], [1, "bg-gray-700", "h-4", "rounded"], [1, "bg-gray-700", "h-4", "rounded", "w-5/6"], [1, "bg-gray-700", "h-4", "rounded", "w-2/3"], ["class", "group flex gap-4 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 cursor-pointer", 3, "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "group", "flex", "gap-4", "bg-gray-800", "rounded-lg", "p-4", "hover:bg-gray-700", "transition-all", "duration-300", "cursor-pointer", 3, "click"], [1, "relative", "w-32", "h-32", "flex-shrink-0", "rounded-lg", "overflow-hidden"], ["loading", "lazy", 1, "w-full", "h-full", "object-cover", "group-hover:scale-110", "transition-transform", "duration-300", 3, "src", "alt"], [1, "flex-1", "flex", "flex-col", "justify-between"], ["class", "flex gap-2 mb-2", 4, "ngIf"], [1, "text-lg", "font-semibold", "text-white", "line-clamp-2", "group-hover:text-red-400", "transition-colors"], [1, "flex", "items-center", "justify-between", "pt-2"], [1, "text-xs", "text-gray-500", 3, "dateTime"], [1, "text-xs", "text-red-400", "font-medium", "group-hover:translate-x-1", "transition-transform"], [1, "flex", "gap-2", "mb-2"], [1, "text-xs", "px-2", "py-1", "bg-red-400/10", "text-red-400", "rounded-full"], [1, "flex", "justify-center", "mt-12"], [1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "transform", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"]], template: function Top10Component_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0)(1, "section", 1)(2, "div", 2)(3, "div", 3)(4, "article", 4)(5, "h1", 5);
    \u0275\u0275text(6, " Top 10: Rankings que Descubren lo Mejor del Entretenimiento ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 6);
    \u0275\u0275text(8, " \xBFTe gustan las listas? Descubre rankings de cine, series y anime basados en criterios objetivos y subjetivos. Obras maestras, joyas ocultas y sorpresas de cada temporada. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "a", 7);
    \u0275\u0275text(10, " Ver Rankings ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 8);
    \u0275\u0275element(12, "path", 9);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "div", 10);
    \u0275\u0275element(14, "div", 11);
    \u0275\u0275elementStart(15, "div", 12)(16, "div", 13);
    \u0275\u0275template(17, Top10Component_ng_container_17_Template, 4, 2, "ng-container", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div", 15);
    \u0275\u0275template(19, Top10Component_ng_container_19_Template, 4, 2, "ng-container", 14);
    \u0275\u0275elementEnd()()()()()();
    \u0275\u0275elementStart(20, "section", 16)(21, "div", 2)(22, "header", 17)(23, "h2", 18);
    \u0275\u0275text(24, " Rankings Destacados ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "div", 19)(26, "button", 20);
    \u0275\u0275listener("click", function Top10Component_Template_button_click_26_listener() {
      return ctx.prevSlide();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(27, "svg", 21);
    \u0275\u0275element(28, "path", 22);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(29, "button", 23);
    \u0275\u0275listener("click", function Top10Component_Template_button_click_29_listener() {
      return ctx.nextSlide();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(30, "svg", 21);
    \u0275\u0275element(31, "path", 24);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(32, "div", 25)(33, "div", 26);
    \u0275\u0275template(34, Top10Component_app_post_card_34_Template, 1, 1, "app-post-card", 27);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(35, "section", 28)(36, "div", 2)(37, "header", 29)(38, "h2", 30);
    \u0275\u0275text(39, " Todos los Rankings ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(40, "p", 31);
    \u0275\u0275text(41, " Explora nuestra colecci\xF3n completa de listas y rankings ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(42, Top10Component_div_42_Template, 2, 2, "div", 32)(43, Top10Component_div_43_Template, 2, 2, "div", 32)(44, Top10Component_div_44_Template, 3, 0, "div", 33);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(45, "section", 34)(46, "div", 35)(47, "h2", 18);
    \u0275\u0275text(48, " \xBFTienes una Sugerencia de Ranking? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(49, "p", 36);
    \u0275\u0275text(50, " Nos encantar\xEDa saber qu\xE9 rankings te gustar\xEDa ver. Comparte tus ideas y ay\xFAdanos a crear el contenido que realmente te interesa. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(51, "button", 37);
    \u0275\u0275text(52, " Sugerir un Ranking ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(17);
    \u0275\u0275property("ngForOf", ctx.featuredPosts.slice(0, 3))("ngForTrackBy", ctx.trackByPostId);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx.featuredPosts.slice(3, 6))("ngForTrackBy", ctx.trackByPostId);
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", !ctx.canGoPrev);
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", !ctx.canGoNext);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", ctx.visiblePosts)("ngForTrackBy", ctx.trackByPostId);
    \u0275\u0275advance(8);
    \u0275\u0275property("ngIf", ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.hasMorePosts && !ctx.isLoading);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, DatePipe, PostCardComponent], encapsulation: 2 });
var Top10Component = _Top10Component;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Top10Component, [{
    type: Component,
    args: [{ selector: "app-top10", standalone: true, imports: [CommonModule, PostCardComponent], template: `<main class="w-full min-h-screen">\r
  <!-- Hero Section -->\r
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
            Top 10: Rankings que Descubren lo Mejor del Entretenimiento\r
          </h1>\r
          <p class="text-lg sm:text-xl text-gray-300 leading-relaxed">\r
            \xBFTe gustan las listas? Descubre rankings de cine, series y anime\r
            basados en criterios objetivos y subjetivos. Obras maestras, joyas\r
            ocultas y sorpresas de cada temporada.\r
          </p>\r
          <a\r
            href="#rankings"\r
            class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"\r
            aria-label="Ver rankings"\r
          >\r
            Ver Rankings\r
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
                d="M19 9l-7 7-7-7"\r
              />\r
            </svg>\r
          </a>\r
        </article>\r
\r
        <!-- Visual Feature -->\r
        <div\r
          class="order-1 lg:order-2 h-64 lg:h-96 relative"\r
          aria-hidden="true"\r
        >\r
          <div\r
            class="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none"\r
          ></div>\r
          <div class="flex h-full gap-4 overflow-hidden">\r
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
  <!-- Featured Rankings Carousel -->\r
  <section id="rankings" class="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">\r
    <div class="max-w-7xl mx-auto">\r
      <header class="flex justify-between items-center mb-8">\r
        <h2 class="text-2xl lg:text-3xl font-bold text-white">\r
          Rankings Destacados\r
        </h2>\r
        <div class="flex gap-2">\r
          <button\r
            (click)="prevSlide()"\r
            [disabled]="!canGoPrev"\r
            class="p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"\r
            aria-label="Anterior"\r
          >\r
            <svg\r
              class="w-5 h-5"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M15 19l-7-7 7-7"\r
              />\r
            </svg>\r
          </button>\r
          <button\r
            (click)="nextSlide()"\r
            [disabled]="!canGoNext"\r
            class="p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"\r
            aria-label="Siguiente"\r
          >\r
            <svg\r
              class="w-5 h-5"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M9 5l7 7-7 7"\r
              />\r
            </svg>\r
          </button>\r
        </div>\r
      </header>\r
\r
      <!-- Carousel -->\r
      <div class="relative overflow-hidden">\r
        <div\r
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 transition-transform duration-500"\r
        >\r
          <app-post-card\r
            *ngFor="let post of visiblePosts; trackBy: trackByPostId"\r
            [post]="post"\r
            (click)="navigateToPost(post)"\r
          ></app-post-card>\r
        </div>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- All Rankings List -->\r
  <section class="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/30">\r
    <div class="max-w-7xl mx-auto">\r
      <header class="mb-8">\r
        <h2 class="text-2xl lg:text-3xl font-bold text-white mb-2">\r
          Todos los Rankings\r
        </h2>\r
        <p class="text-gray-400">\r
          Explora nuestra colecci\xF3n completa de listas y rankings\r
        </p>\r
      </header>\r
\r
      <!-- Loading State -->\r
      <div\r
        *ngIf="isLoading"\r
        class="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"\r
      >\r
        <div *ngFor="let i of [1, 2, 3, 4, 5, 6]" class="animate-pulse">\r
          <div class="flex gap-4">\r
            <div class="bg-gray-700 rounded-lg w-32 h-32 flex-shrink-0"></div>\r
            <div class="flex-1 space-y-3">\r
              <div class="bg-gray-700 h-4 rounded"></div>\r
              <div class="bg-gray-700 h-4 rounded w-5/6"></div>\r
              <div class="bg-gray-700 h-4 rounded w-2/3"></div>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <!-- Rankings Grid -->\r
      <div\r
        *ngIf="!isLoading"\r
        class="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"\r
      >\r
        <article\r
          *ngFor="let post of displayedPosts; trackBy: trackByPostId"\r
          (click)="navigateToPost(post)"\r
          class="group flex gap-4 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 cursor-pointer"\r
        >\r
          <!-- Image -->\r
          <div\r
            class="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden"\r
          >\r
            <img\r
              [src]="\r
                post.featured_image?.source_url ||\r
                '/assets/images/placeholder.jpg'\r
              "\r
              [alt]="post.title?.rendered"\r
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"\r
              loading="lazy"\r
            />\r
          </div>\r
\r
          <!-- Content -->\r
          <div class="flex-1 flex flex-col justify-between">\r
            <div>\r
              <div class="flex gap-2 mb-2" *ngIf="post.categories_name?.length">\r
                <span\r
                  class="text-xs px-2 py-1 bg-red-400/10 text-red-400 rounded-full"\r
                >\r
                  {{ post.categories_name[0].name }}\r
                </span>\r
              </div>\r
              <h3\r
                class="text-lg font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors"\r
              >\r
                {{ post.title?.rendered }}\r
              </h3>\r
            </div>\r
            <div class="flex items-center justify-between pt-2">\r
              <time [dateTime]="post.date" class="text-xs text-gray-500">\r
                {{ post.date | date : "dd MMM yyyy" }}\r
              </time>\r
              <span\r
                class="text-xs text-red-400 font-medium group-hover:translate-x-1 transition-transform"\r
              >\r
                Ver ranking \u2192\r
              </span>\r
            </div>\r
          </div>\r
        </article>\r
      </div>\r
\r
      <!-- Load More -->\r
      <div *ngIf="hasMorePosts && !isLoading" class="flex justify-center mt-12">\r
        <button\r
          (click)="loadMore()"\r
          class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"\r
        >\r
          Cargar M\xE1s Rankings\r
        </button>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- CTA Section -->\r
  <section\r
    class="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-900/20 to-gray-900"\r
  >\r
    <div class="max-w-4xl mx-auto text-center space-y-6">\r
      <h2 class="text-2xl lg:text-3xl font-bold text-white">\r
        \xBFTienes una Sugerencia de Ranking?\r
      </h2>\r
      <p class="text-lg text-gray-300 max-w-2xl mx-auto">\r
        Nos encantar\xEDa saber qu\xE9 rankings te gustar\xEDa ver. Comparte tus ideas y\r
        ay\xFAdanos a crear el contenido que realmente te interesa.\r
      </p>\r
      <button\r
        class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"\r
      >\r
        Sugerir un Ranking\r
      </button>\r
    </div>\r
  </section>\r
</main>\r
` }]
  }], () => [{ type: BlogService }, { type: MetaService }, { type: Router }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Top10Component, { className: "Top10Component", filePath: "src/app/blog/pages/top10/top10.component.ts", lineNumber: 23 });
})();
export {
  Top10Component
};
//# sourceMappingURL=top10.component-2QSK6LQJ.js.map
