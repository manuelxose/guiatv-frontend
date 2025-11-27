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
  ActivatedRoute,
  CommonModule,
  DatePipe,
  NgForOf,
  NgIf,
  Router,
  RouterLink,
  isPlatformBrowser,
  slugify
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Inject,
  PLATFORM_ID,
  Subject,
  __async,
  first,
  setClassMetadata,
  switchMap,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
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
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/blog/pages/category/category.component.ts
var _c0 = () => [1, 2, 3, 4, 5, 6];
function CategoryComponent_div_1_div_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 9);
  }
}
function CategoryComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3)(1, "div", 4);
    \u0275\u0275element(2, "div", 5)(3, "div", 6);
    \u0275\u0275elementStart(4, "div", 7);
    \u0275\u0275template(5, CategoryComponent_div_1_div_5_Template, 1, 0, "div", 8);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c0));
  }
}
function CategoryComponent_div_2_p_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "p", 39);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("innerHTML", ctx_r0.category.description, \u0275\u0275sanitizeHtml);
  }
}
function CategoryComponent_div_2_section_31_span_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 57);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", cat_r3.name, " ");
  }
}
function CategoryComponent_div_2_section_31_p_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 58);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.stripHtml(ctx_r0.featuredPost.excerpt.rendered), " ");
  }
}
function CategoryComponent_div_2_section_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 40)(1, "h2", 41);
    \u0275\u0275text(2, "Art\xEDculo Destacado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "article", 42);
    \u0275\u0275listener("click", function CategoryComponent_div_2_section_31_Template_article_click_3_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.navigateToPost(ctx_r0.featuredPost));
    });
    \u0275\u0275elementStart(4, "div", 43)(5, "div", 44);
    \u0275\u0275element(6, "img", 45)(7, "div", 46);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 47)(9, "div", 48);
    \u0275\u0275template(10, CategoryComponent_div_2_section_31_span_10_Template, 2, 1, "span", 49);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "h3", 50);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275template(13, CategoryComponent_div_2_section_31_p_13_Template, 2, 1, "p", 51);
    \u0275\u0275elementStart(14, "div", 52)(15, "time", 53);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "span", 54);
    \u0275\u0275text(19, " Leer art\xEDculo ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(20, "svg", 55);
    \u0275\u0275element(21, "path", 56);
    \u0275\u0275elementEnd()()()()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(6);
    \u0275\u0275property("src", (ctx_r0.featuredPost.featured_image == null ? null : ctx_r0.featuredPost.featured_image.source_url) || "/assets/images/placeholder.jpg", \u0275\u0275sanitizeUrl)("alt", ctx_r0.featuredPost.title == null ? null : ctx_r0.featuredPost.title.rendered);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r0.featuredPost.categories_name == null ? null : ctx_r0.featuredPost.categories_name.slice(0, 2));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.featuredPost.title == null ? null : ctx_r0.featuredPost.title.rendered, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.featuredPost.excerpt == null ? null : ctx_r0.featuredPost.excerpt.rendered);
    \u0275\u0275advance(2);
    \u0275\u0275property("dateTime", ctx_r0.featuredPost.date);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(17, 7, ctx_r0.featuredPost.date, "dd MMMM yyyy"), " ");
  }
}
function CategoryComponent_div_2_app_post_card_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-post-card", 59);
    \u0275\u0275listener("click", function CategoryComponent_div_2_app_post_card_36_Template_app_post_card_click_0_listener() {
      const post_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.navigateToPost(post_r5));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const post_r5 = ctx.$implicit;
    \u0275\u0275property("post", post_r5);
  }
}
function CategoryComponent_div_2_div_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 60);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 61);
    \u0275\u0275element(2, "path", 62);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "p", 63);
    \u0275\u0275text(4, " No hay art\xEDculos disponibles en esta categor\xEDa a\xFAn. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "a", 64);
    \u0275\u0275text(6, " Explorar Otras Categor\xEDas ");
    \u0275\u0275elementEnd()();
  }
}
function CategoryComponent_div_2_div_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 65)(1, "button", 66);
    \u0275\u0275listener("click", function CategoryComponent_div_2_div_38_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.loadMore());
    });
    \u0275\u0275text(2, " Cargar M\xE1s Art\xEDculos ");
    \u0275\u0275elementEnd()();
  }
}
function CategoryComponent_div_2_section_39_button_4_p_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 76);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", cat_r8.count, " art\xEDculos ");
  }
}
function CategoryComponent_div_2_section_39_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 70);
    \u0275\u0275listener("click", function CategoryComponent_div_2_section_39_button_4_Template_button_click_0_listener() {
      const cat_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.navigateToCategory(cat_r8));
    });
    \u0275\u0275elementStart(1, "div", 71)(2, "h3", 72);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 73);
    \u0275\u0275element(5, "path", 74);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, CategoryComponent_div_2_section_39_button_4_p_6_Template, 2, 1, "p", 75);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r8 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275classProp("ring-2", cat_r8.id === ctx_r0.category.id)("ring-red-500", cat_r8.id === ctx_r0.category.id);
    \u0275\u0275attribute("aria-label", "Ver categor\xEDa " + cat_r8.name)("aria-pressed", cat_r8.id === ctx_r0.category.id);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", cat_r8.name, " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", cat_r8.count);
  }
}
function CategoryComponent_div_2_section_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 67)(1, "h2", 27);
    \u0275\u0275text(2, " Explorar Otras Categor\xEDas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 68);
    \u0275\u0275template(4, CategoryComponent_div_2_section_39_button_4_Template, 7, 8, "button", 69);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r0.allCategories)("ngForTrackBy", ctx_r0.trackByCategoryId);
  }
}
function CategoryComponent_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "nav", 10)(2, "ol", 11)(3, "li")(4, "a", 12);
    \u0275\u0275text(5, "Blog");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "li");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 13);
    \u0275\u0275element(8, "path", 14);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "li")(10, "a", 15);
    \u0275\u0275text(11, "Categor\xEDas");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "li");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 13);
    \u0275\u0275element(14, "path", 14);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "li", 16);
    \u0275\u0275text(16);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(17, "section", 17)(18, "div", 18)(19, "div")(20, "span", 19);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(21, "svg", 20);
    \u0275\u0275element(22, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(24, "div", 22)(25, "h1", 23);
    \u0275\u0275text(26);
    \u0275\u0275elementEnd();
    \u0275\u0275template(27, CategoryComponent_div_2_p_27_Template, 1, 1, "p", 24);
    \u0275\u0275elementStart(28, "div", 25)(29, "span");
    \u0275\u0275text(30);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275template(31, CategoryComponent_div_2_section_31_Template, 22, 10, "section", 26);
    \u0275\u0275elementStart(32, "section", 3)(33, "h2", 27);
    \u0275\u0275text(34, "Todos los Art\xEDculos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(35, "div", 28);
    \u0275\u0275template(36, CategoryComponent_div_2_app_post_card_36_Template, 1, 1, "app-post-card", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275template(37, CategoryComponent_div_2_div_37_Template, 7, 0, "div", 30)(38, CategoryComponent_div_2_div_38_Template, 3, 0, "div", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275template(39, CategoryComponent_div_2_section_39_Template, 5, 2, "section", 32);
    \u0275\u0275elementStart(40, "section", 3)(41, "div", 33)(42, "h2", 34);
    \u0275\u0275text(43, " Suscr\xEDbete al Newsletter ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(44, "p", 35);
    \u0275\u0275text(45);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(46, "form", 36);
    \u0275\u0275element(47, "input", 37);
    \u0275\u0275elementStart(48, "button", 38);
    \u0275\u0275text(49, " Suscribirse ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275textInterpolate1(" ", ctx_r0.category.name, " ");
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" ", ctx_r0.category.name, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r0.category.name, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.category.description);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", ctx_r0.posts.length, " art\xEDculos");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.featuredPost);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", ctx_r0.displayedPosts)("ngForTrackBy", ctx_r0.trackByPostId);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.displayedPosts.length === 0 && !ctx_r0.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.hasMorePosts);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.allCategories.length > 1);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" Recibe las \xFAltimas actualizaciones de ", ctx_r0.category.name, " directamente en tu email. ");
  }
}
var _CategoryComponent = class _CategoryComponent {
  constructor(route, router, blogSvc, metaSvc, platformId) {
    this.route = route;
    this.router = router;
    this.blogSvc = blogSvc;
    this.metaSvc = metaSvc;
    this.destroy$ = new Subject();
    this.category = null;
    this.posts = [];
    this.allCategories = [];
    this.featuredPost = null;
    this.currentPage = 1;
    this.postsPerPage = 12;
    this.displayedPosts = [];
    this.isLoading = true;
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$), switchMap((params) => {
      const slug = params["slug"];
      this.isLoading = true;
      return this.loadCategoryAndPosts(slug);
    })).subscribe();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadCategoryAndPosts(slug) {
    return __async(this, null, function* () {
      try {
        yield this.loadAllCategories();
        this.category = this.allCategories.find((cat) => slugify(cat.name) === slug || slugify(cat.slug) === slug);
        if (!this.category) {
          this.router.navigate(["/blog"]);
          return;
        }
        yield this.loadCategoryPosts();
        this.setMetaTags();
        this.isLoading = false;
        if (this.isBrowser) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        console.error("Error loading category:", error);
        this.router.navigate(["/blog"]);
      }
    });
  }
  loadAllCategories() {
    return __async(this, null, function* () {
      return new Promise((resolve) => {
        this.blogSvc.blogCategories$.pipe(first()).subscribe((categories) => {
          if (categories.length === 0) {
            this.blogSvc.getAllPosts().pipe(first()).subscribe((posts) => {
              this.blogSvc.intiCategories(posts);
              this.blogSvc.blogCategories$.pipe(first()).subscribe((cats) => {
                this.allCategories = cats;
                resolve();
              });
            });
          } else {
            this.allCategories = categories;
            resolve();
          }
        });
      });
    });
  }
  loadCategoryPosts() {
    return __async(this, null, function* () {
      return new Promise((resolve) => {
        this.blogSvc.filterByCategory(this.category.id).pipe(first()).subscribe((posts) => {
          this.posts = this.blogSvc.sortPostsByDate(posts);
          if (this.posts.length > 0) {
            this.featuredPost = this.posts[0];
            this.updateDisplayedPosts();
          }
          resolve();
        });
      });
    });
  }
  setMetaTags() {
    const description = this.category.description ? this.stripHtml(this.category.description).slice(0, 160) : `Descubre los mejores art\xEDculos sobre ${this.category.name}. An\xE1lisis, rese\xF1as y noticias actualizadas.`;
    this.metaSvc.setMetaTags({
      title: `${this.category.name} - Blog | Gu\xEDa Programaci\xF3n`,
      description,
      image: this.featuredPost?.featured_image?.source_url || "/assets/images/blog-og-image.jpg",
      canonicalUrl: `/blog/categoria/${slugify(this.category.slug || this.category.name)}`,
      type: "website"
    });
  }
  updateDisplayedPosts() {
    const start = 0;
    const end = this.currentPage * this.postsPerPage;
    const postsToDisplay = this.posts.slice(1);
    this.displayedPosts = postsToDisplay.slice(start, end);
  }
  // Pagination
  loadMore() {
    this.currentPage++;
    this.updateDisplayedPosts();
  }
  get hasMorePosts() {
    const totalPosts = this.posts.length - 1;
    return this.currentPage * this.postsPerPage < totalPosts;
  }
  // Navigation
  navigateToPost(post) {
    const slug = slugify(post.slug || post.title?.rendered || "");
    this.router.navigate(["/blog", slug]);
  }
  navigateToCategory(category) {
    const slug = slugify(category.slug || category.name);
    this.router.navigate(["/blog/categoria", slug]);
  }
  // Utils
  stripHtml(html) {
    if (!html)
      return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  trackByPostId(index, post) {
    return post.id || index;
  }
  trackByCategoryId(index, category) {
    return category.id || index;
  }
};
_CategoryComponent.\u0275fac = function CategoryComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _CategoryComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(BlogService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(PLATFORM_ID));
};
_CategoryComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CategoryComponent, selectors: [["app-category"]], decls: 3, vars: 2, consts: [[1, "w-full", "min-h-screen"], ["class", "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", 4, "ngIf"], [4, "ngIf"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-12"], [1, "animate-pulse", "space-y-8"], [1, "h-12", "bg-gray-700", "rounded", "w-1/2"], [1, "h-96", "bg-gray-700", "rounded"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-6"], ["class", "h-64 bg-gray-700 rounded", 4, "ngFor", "ngForOf"], [1, "h-64", "bg-gray-700", "rounded"], ["aria-label", "Breadcrumb", 1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-6"], [1, "flex", "items-center", "space-x-2", "text-sm", "text-gray-400"], ["routerLink", "/blog", 1, "hover:text-white", "transition-colors"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-4", "h-4"], ["fill-rule", "evenodd", "d", "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", "clip-rule", "evenodd"], [1, "hover:text-white", "transition-colors"], ["aria-current", "page", 1, "text-white"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-8", "lg:py-12"], [1, "space-y-6"], [1, "inline-flex", "items-center", "px-4", "py-2", "bg-red-600", "text-white", "font-semibold", "rounded-full", "text-sm"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "mr-2"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"], [1, "space-y-4"], [1, "text-3xl", "sm:text-4xl", "lg:text-5xl", "font-bold", "text-white"], ["class", "text-lg text-gray-300 max-w-3xl", 3, "innerHTML", 4, "ngIf"], [1, "flex", "items-center", "gap-4", "text-sm", "text-gray-400"], ["class", "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", 4, "ngIf"], [1, "text-2xl", "font-bold", "text-white", "mb-8"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-6", "lg:gap-8"], [3, "post", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "text-center py-12", 4, "ngIf"], ["class", "flex justify-center mt-12", 4, "ngIf"], ["class", "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-700", 4, "ngIf"], [1, "bg-gradient-to-r", "from-red-900/20", "to-gray-900", "rounded-lg", "p-8", "lg:p-12", "text-center"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white", "mb-4"], [1, "text-lg", "text-gray-300", "mb-6", "max-w-2xl", "mx-auto"], [1, "flex", "flex-col", "sm:flex-row", "gap-4", "max-w-md", "mx-auto"], ["type", "email", "placeholder", "tu@email.com", "aria-label", "Correo electr\xF3nico", 1, "flex-1", "px-4", "py-3", "rounded-full", "bg-gray-700", "text-white", "placeholder-gray-400", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], ["type", "submit", 1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500"], [1, "text-lg", "text-gray-300", "max-w-3xl", 3, "innerHTML"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-8"], [1, "text-2xl", "font-bold", "text-white", "mb-6"], [1, "group", "relative", "bg-gray-800", "rounded-lg", "overflow-hidden", "hover:transform", "hover:scale-[1.02]", "transition-all", "duration-300", "cursor-pointer", 3, "click"], [1, "grid", "lg:grid-cols-2", "gap-6"], [1, "relative", "aspect-video", "lg:aspect-auto", "h-64", "lg:h-auto", "overflow-hidden"], ["loading", "eager", 1, "w-full", "h-full", "object-cover", "group-hover:scale-110", "transition-transform", "duration-300", 3, "src", "alt"], [1, "absolute", "inset-0", "bg-gradient-to-t", "lg:bg-gradient-to-r", "from-gray-900/80", "to-transparent"], [1, "p-6", "lg:p-8", "flex", "flex-col", "justify-center", "space-y-4"], [1, "flex", "gap-2"], ["class", "inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full", 4, "ngFor", "ngForOf"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white", "group-hover:text-red-400", "transition-colors"], ["class", "text-gray-300 line-clamp-3", 4, "ngIf"], [1, "flex", "items-center", "justify-between", "pt-4"], [1, "text-sm", "text-gray-500", 3, "dateTime"], [1, "inline-flex", "items-center", "text-red-400", "font-semibold", "group-hover:translate-x-2", "transition-transform"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "ml-2", "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M13 7l5 5m0 0l-5 5m5-5H6"], [1, "inline-block", "px-3", "py-1", "text-xs", "font-medium", "text-red-400", "bg-red-400/10", "rounded-full"], [1, "text-gray-300", "line-clamp-3"], [3, "click", "post"], [1, "text-center", "py-12"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "mx-auto", "w-16", "h-16", "text-gray-600", "mb-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"], [1, "text-gray-400", "text-lg"], ["routerLink", "/blog", 1, "inline-block", "mt-4", "px-6", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300"], [1, "flex", "justify-center", "mt-12"], [1, "px-8", "py-3", "bg-red-600", "hover:bg-red-700", "text-white", "font-semibold", "rounded-full", "transition-all", "duration-300", "transform", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-12", "border-t", "border-gray-700"], [1, "grid", "grid-cols-2", "sm:grid-cols-3", "lg:grid-cols-4", "gap-4"], ["class", "group p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-red-500", 3, "ring-2", "ring-red-500", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "group", "p-4", "bg-gray-800", "hover:bg-gray-700", "rounded-lg", "transition-all", "duration-300", "text-left", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", 3, "click"], [1, "flex", "items-center", "justify-between", "mb-2"], [1, "font-semibold", "text-white", "group-hover:text-red-400", "transition-colors"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "text-gray-500", "group-hover:text-red-400", "group-hover:translate-x-1", "transition-all"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], ["class", "text-sm text-gray-400", 4, "ngIf"], [1, "text-sm", "text-gray-400"]], template: function CategoryComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0);
    \u0275\u0275template(1, CategoryComponent_div_1_Template, 6, 2, "div", 1)(2, CategoryComponent_div_2_Template, 50, 12, "div", 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.isLoading && ctx.category);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, DatePipe, RouterLink, PostCardComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n@media (prefers-reduced-motion: no-preference) {\n  *[_ngcontent-%COMP%] {\n    scroll-behavior: smooth;\n  }\n}\n.categories-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n  gap: 1rem;\n}\nbutton[aria-pressed=true][_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.1),\n      rgba(220, 38, 38, 0.05));\n}\n/*# sourceMappingURL=category.component.css.map */"] });
var CategoryComponent = _CategoryComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CategoryComponent, [{
    type: Component,
    args: [{ selector: "app-category", standalone: true, imports: [CommonModule, RouterLink, PostCardComponent], template: `<main class="w-full min-h-screen">\r
  <!-- Loading State -->\r
  <div *ngIf="isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\r
    <div class="animate-pulse space-y-8">\r
      <div class="h-12 bg-gray-700 rounded w-1/2"></div>\r
      <div class="h-96 bg-gray-700 rounded"></div>\r
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">\r
        <div\r
          *ngFor="let i of [1, 2, 3, 4, 5, 6]"\r
          class="h-64 bg-gray-700 rounded"\r
        ></div>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Category Content -->\r
  <div *ngIf="!isLoading && category">\r
    <!-- Breadcrumbs -->\r
    <nav\r
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"\r
      aria-label="Breadcrumb"\r
    >\r
      <ol class="flex items-center space-x-2 text-sm text-gray-400">\r
        <li>\r
          <a routerLink="/blog" class="hover:text-white transition-colors"\r
            >Blog</a\r
          >\r
        </li>\r
        <li>\r
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">\r
            <path\r
              fill-rule="evenodd"\r
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"\r
              clip-rule="evenodd"\r
            />\r
          </svg>\r
        </li>\r
        <li>\r
          <a class="hover:text-white transition-colors">Categor\xEDas</a>\r
        </li>\r
        <li>\r
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">\r
            <path\r
              fill-rule="evenodd"\r
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"\r
              clip-rule="evenodd"\r
            />\r
          </svg>\r
        </li>\r
        <li class="text-white" aria-current="page">\r
          {{ category.name }}\r
        </li>\r
      </ol>\r
    </nav>\r
\r
    <!-- Category Header -->\r
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">\r
      <div class="space-y-6">\r
        <!-- Category Badge -->\r
        <div>\r
          <span\r
            class="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-full text-sm"\r
          >\r
            <svg\r
              class="w-5 h-5 mr-2"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"\r
              />\r
            </svg>\r
            {{ category.name }}\r
          </span>\r
        </div>\r
\r
        <!-- Title and Description -->\r
        <div class="space-y-4">\r
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">\r
            {{ category.name }}\r
          </h1>\r
          <p\r
            *ngIf="category.description"\r
            class="text-lg text-gray-300 max-w-3xl"\r
            [innerHTML]="category.description"\r
          ></p>\r
          <div class="flex items-center gap-4 text-sm text-gray-400">\r
            <span>{{ posts.length }} art\xEDculos</span>\r
          </div>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Featured Post -->\r
    <section\r
      *ngIf="featuredPost"\r
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"\r
    >\r
      <h2 class="text-2xl font-bold text-white mb-6">Art\xEDculo Destacado</h2>\r
      <article\r
        (click)="navigateToPost(featuredPost)"\r
        class="group relative bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 cursor-pointer"\r
      >\r
        <div class="grid lg:grid-cols-2 gap-6">\r
          <!-- Image -->\r
          <div\r
            class="relative aspect-video lg:aspect-auto h-64 lg:h-auto overflow-hidden"\r
          >\r
            <img\r
              [src]="\r
                featuredPost.featured_image?.source_url ||\r
                '/assets/images/placeholder.jpg'\r
              "\r
              [alt]="featuredPost.title?.rendered"\r
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"\r
              loading="eager"\r
            />\r
            <div\r
              class="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-gray-900/80 to-transparent"\r
            ></div>\r
          </div>\r
\r
          <!-- Content -->\r
          <div class="p-6 lg:p-8 flex flex-col justify-center space-y-4">\r
            <div class="flex gap-2">\r
              <span\r
                *ngFor="let cat of featuredPost.categories_name?.slice(0, 2)"\r
                class="inline-block px-3 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full"\r
              >\r
                {{ cat.name }}\r
              </span>\r
            </div>\r
\r
            <h3\r
              class="text-2xl lg:text-3xl font-bold text-white group-hover:text-red-400 transition-colors"\r
            >\r
              {{ featuredPost.title?.rendered }}\r
            </h3>\r
\r
            <p\r
              *ngIf="featuredPost.excerpt?.rendered"\r
              class="text-gray-300 line-clamp-3"\r
            >\r
              {{ stripHtml(featuredPost.excerpt.rendered) }}\r
            </p>\r
\r
            <div class="flex items-center justify-between pt-4">\r
              <time\r
                [dateTime]="featuredPost.date"\r
                class="text-sm text-gray-500"\r
              >\r
                {{ featuredPost.date | date : "dd MMMM yyyy" }}\r
              </time>\r
              <span\r
                class="inline-flex items-center text-red-400 font-semibold group-hover:translate-x-2 transition-transform"\r
              >\r
                Leer art\xEDculo\r
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
              </span>\r
            </div>\r
          </div>\r
        </div>\r
      </article>\r
    </section>\r
\r
    <!-- Posts Grid -->\r
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\r
      <h2 class="text-2xl font-bold text-white mb-8">Todos los Art\xEDculos</h2>\r
\r
      <!-- Grid -->\r
      <div\r
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"\r
      >\r
        <app-post-card\r
          *ngFor="let post of displayedPosts; trackBy: trackByPostId"\r
          [post]="post"\r
          (click)="navigateToPost(post)"\r
        ></app-post-card>\r
      </div>\r
\r
      <!-- No posts message -->\r
      <div\r
        *ngIf="displayedPosts.length === 0 && !isLoading"\r
        class="text-center py-12"\r
      >\r
        <svg\r
          class="mx-auto w-16 h-16 text-gray-600 mb-4"\r
          fill="none"\r
          stroke="currentColor"\r
          viewBox="0 0 24 24"\r
        >\r
          <path\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            stroke-width="2"\r
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"\r
          />\r
        </svg>\r
        <p class="text-gray-400 text-lg">\r
          No hay art\xEDculos disponibles en esta categor\xEDa a\xFAn.\r
        </p>\r
        <a\r
          routerLink="/blog"\r
          class="inline-block mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300"\r
        >\r
          Explorar Otras Categor\xEDas\r
        </a>\r
      </div>\r
\r
      <!-- Load More -->\r
      <div *ngIf="hasMorePosts" class="flex justify-center mt-12">\r
        <button\r
          (click)="loadMore()"\r
          class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"\r
        >\r
          Cargar M\xE1s Art\xEDculos\r
        </button>\r
      </div>\r
    </section>\r
\r
    <!-- Other Categories -->\r
    <section\r
      *ngIf="allCategories.length > 1"\r
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-700"\r
    >\r
      <h2 class="text-2xl font-bold text-white mb-8">\r
        Explorar Otras Categor\xEDas\r
      </h2>\r
\r
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">\r
        <button\r
          *ngFor="let cat of allCategories; trackBy: trackByCategoryId"\r
          (click)="navigateToCategory(cat)"\r
          [class.ring-2]="cat.id === category.id"\r
          [class.ring-red-500]="cat.id === category.id"\r
          class="group p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-red-500"\r
          [attr.aria-label]="'Ver categor\xEDa ' + cat.name"\r
          [attr.aria-pressed]="cat.id === category.id"\r
        >\r
          <div class="flex items-center justify-between mb-2">\r
            <h3\r
              class="font-semibold text-white group-hover:text-red-400 transition-colors"\r
            >\r
              {{ cat.name }}\r
            </h3>\r
            <svg\r
              class="w-5 h-5 text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all"\r
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
          </div>\r
          <p class="text-sm text-gray-400" *ngIf="cat.count">\r
            {{ cat.count }} art\xEDculos\r
          </p>\r
        </button>\r
      </div>\r
    </section>\r
\r
    <!-- CTA -->\r
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\r
      <div\r
        class="bg-gradient-to-r from-red-900/20 to-gray-900 rounded-lg p-8 lg:p-12 text-center"\r
      >\r
        <h2 class="text-2xl lg:text-3xl font-bold text-white mb-4">\r
          Suscr\xEDbete al Newsletter\r
        </h2>\r
        <p class="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">\r
          Recibe las \xFAltimas actualizaciones de {{ category.name }} directamente\r
          en tu email.\r
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
          >\r
            Suscribirse\r
          </button>\r
        </form>\r
      </div>\r
    </section>\r
  </div>\r
</main>\r
`, styles: ["/* src/app/blog/pages/category/category.component.scss */\n:host {\n  display: block;\n  width: 100%;\n}\n@media (prefers-reduced-motion: no-preference) {\n  * {\n    scroll-behavior: smooth;\n  }\n}\n.categories-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n  gap: 1rem;\n}\nbutton[aria-pressed=true] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(220, 38, 38, 0.1),\n      rgba(220, 38, 38, 0.05));\n}\n/*# sourceMappingURL=category.component.css.map */\n"] }]
  }], () => [{ type: ActivatedRoute }, { type: Router }, { type: BlogService }, { type: MetaService }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CategoryComponent, { className: "CategoryComponent", filePath: "src/app/blog/pages/category/category.component.ts", lineNumber: 24 });
})();
export {
  CategoryComponent
};
//# sourceMappingURL=category.component-CNFHD43W.js.map
