import {
  BannerComponent
} from "./chunk-2UMAA7PO.js";
import {
  NavBarComponent
} from "./chunk-MEXIL4LO.js";
import "./chunk-REERXIA3.js";
import {
  ActivatedRoute,
  CommonModule,
  HttpService,
  NgForOf,
  NgIf,
  TvGuideService,
  diffHour
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  inject,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/pages/pelicula-details/pelicula-details.compoent.ts
function PeliculaDetailsComponent_app_banner_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-banner", 18);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("data", ctx_r0.destacada);
  }
}
function PeliculaDetailsComponent_section_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 4)(1, "div", 5)(2, "span", 6);
    \u0275\u0275text(3, "Direcci\xF3n");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 7);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.data == null ? null : ctx_r0.data.desc == null ? null : ctx_r0.data.desc.directors);
  }
}
function PeliculaDetailsComponent_section_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 4)(1, "div", 5)(2, "span", 6);
    \u0275\u0275text(3, "Creada Por");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 7);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", (ctx_r0.data == null ? null : ctx_r0.data.desc == null ? null : ctx_r0.data.desc.directors) || ((ctx_r0.movie == null ? null : ctx_r0.movie.created_by == null ? null : ctx_r0.movie.created_by.length) ? ctx_r0.movie == null ? null : ctx_r0.movie.created_by[0] == null ? null : ctx_r0.movie.created_by[0].name : ""), ". ");
  }
}
function PeliculaDetailsComponent_div_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275element(1, "img", 20);
    \u0275\u0275elementStart(2, "div", 21)(3, "a", 22);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 23);
    \u0275\u0275element(5, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "div", 25)(7, "span", 26);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 27);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const actor_r2 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("src", "https://image.tmdb.org/t/p/w200" + (actor_r2 == null ? null : actor_r2.profile_path) + "?s=64&d=identicon", \u0275\u0275sanitizeUrl)("alt", (actor_r2 == null ? null : actor_r2.name) || "Actor");
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate((actor_r2 == null ? null : actor_r2.name) || "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("+", (actor_r2 == null ? null : actor_r2.known_for == null ? null : actor_r2.known_for.length) || 0, " Pel\xEDculas");
  }
}
function PeliculaDetailsComponent_section_34_article_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 34)(1, "div", 35)(2, "img", 36);
    \u0275\u0275listener("error", function PeliculaDetailsComponent_section_34_article_12_Template_img_error_2_listener($event) {
      \u0275\u0275restoreView(_r4);
      return \u0275\u0275resetView($event.target.src = "https://via.placeholder.com/200x300?text=Sin+Imagen");
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 37)(4, "h3", 38);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 39)(7, "div", 40);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 41)(9, "g", 42);
    \u0275\u0275element(10, "rect", 43);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "g", 44);
    \u0275\u0275element(12, "polygon", 45)(13, "path", 46)(14, "path", 47)(15, "path", 48);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(16, "span", 49);
    \u0275\u0275text(17);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const movie_r5 = ctx.$implicit;
    \u0275\u0275attribute("aria-label", "Ver detalles de " + ((movie_r5 == null ? null : movie_r5.title) || (movie_r5 == null ? null : movie_r5.name)));
    \u0275\u0275advance(2);
    \u0275\u0275property("src", "https://image.tmdb.org/t/p/w200" + (movie_r5 == null ? null : movie_r5.poster_path), \u0275\u0275sanitizeUrl)("alt", (movie_r5 == null ? null : movie_r5.title) || (movie_r5 == null ? null : movie_r5.name) || "Pel\xEDcula");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (movie_r5 == null ? null : movie_r5.title) || (movie_r5 == null ? null : movie_r5.name) || "Sin t\xEDtulo", " ");
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate((movie_r5 == null ? null : movie_r5.vote_average == null ? null : movie_r5.vote_average.toFixed(1)) || "N/A");
  }
}
function PeliculaDetailsComponent_section_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 28)(1, "header", 5)(2, "h2", 6);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 9)(5, "button", 29);
    \u0275\u0275listener("click", function PeliculaDetailsComponent_section_34_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.previousMovies());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 30);
    \u0275\u0275element(7, "path", 12);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(8, "button", 31);
    \u0275\u0275listener("click", function PeliculaDetailsComponent_section_34_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.nextMovies());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 30);
    \u0275\u0275element(10, "path", 14);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "div", 32);
    \u0275\u0275template(12, PeliculaDetailsComponent_section_34_article_12_Template, 18, 5, "article", 33);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r0.tipo === "Series" ? "Series Similares" : "Pel\xEDculas Similares", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r0.movieStartIndex === 0);
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", ctx_r0.movieStartIndex + 6 >= ctx_r0.relatedMovies.length);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r0.relatedMovies.slice(ctx_r0.movieStartIndex, ctx_r0.movieStartIndex + 6));
  }
}
var _PeliculaDetailsComponent = class _PeliculaDetailsComponent {
  constructor(guiaSvc, httpSvc) {
    this.guiaSvc = guiaSvc;
    this.httpSvc = httpSvc;
    this.route = inject(ActivatedRoute);
    this.post = {};
    this.post_list = [];
    this.blog = {};
    this.headers = [];
    this.alt = "";
    this.data = {};
    this.actors = [];
    this.actor = {};
    this.relatedMovies = [];
    this.actorStartIndex = 0;
    this.movieStartIndex = 0;
    this.popular_movies = [];
    this.movie = {};
    this.movieId = "";
    this.time = "";
    this.logo = "";
    this.tipo = "";
    this.destacada = {};
    this.skipInitialRouteFetch = false;
  }
  ngOnInit() {
    try {
      const navBanner = history && history.state?.bannerData || null;
      if (navBanner) {
        this.data = navBanner;
        this.destacada = navBanner;
        this.time = diffHour(navBanner.start || "", navBanner.stop || "");
        this.tipo = this.getTipo();
        this.updateProperties();
        this.skipInitialRouteFetch = true;
      }
    } catch (_) {
    }
    this.route.paramMap.subscribe((params) => {
      if (this.skipInitialRouteFetch) {
        this.skipInitialRouteFetch = false;
        return;
      }
      const slugParam = params.get("slug");
      const idParam = params.get("id");
      this.movie = {};
      this.data = {};
      this.destacada = {};
      this.actors = [];
      this.actorStartIndex = 0;
      this.movieStartIndex = 0;
      if (slugParam) {
        this.httpSvc.getMovieId(slugParam).subscribe((res) => {
          const first = res?.results?.[0];
          if (first?.id) {
            this.httpSvc.getMovieDetails(String(first.id)).subscribe((m) => {
              this.movie = m;
              this.data = this.transformMovieToData(m);
              this.destacada = this.data;
              this.time = diffHour(this.data.start || "", this.data.stop || "");
              this.tipo = this.getTipo();
              this.updateProperties();
            });
          }
        });
      } else if (idParam) {
        if (/^\d+$/.test(idParam)) {
          this.httpSvc.getMovieDetails(idParam).subscribe((m) => {
            this.movie = m;
            this.data = this.transformMovieToData(m);
            this.destacada = this.data;
            this.time = diffHour(this.data.start || "", this.data.stop || "");
            this.tipo = this.getTipo();
            this.updateProperties();
          });
        } else {
          this.httpSvc.getMovieId(idParam).subscribe((res) => {
            const first = res?.results?.[0];
            if (first?.id) {
              this.httpSvc.getMovieDetails(String(first.id)).subscribe((m) => {
                this.movie = m;
                this.data = this.transformMovieToData(m);
                this.destacada = this.data;
                this.time = diffHour(this.data.start || "", this.data.stop || "");
                this.tipo = this.getTipo();
                this.updateProperties();
              });
            }
          });
        }
      }
    });
    this.guiaSvc.getDetallesPrograma().subscribe((data) => {
      if (!data)
        return;
      this.data = data;
      this.destacada = data;
      this.time = diffHour(data.start, data.stop);
      this.tipo = this.getTipo();
      this.updateProperties();
    });
  }
  transformMovieToData(m) {
    return {
      title: { value: m.title || m.name || "" },
      desc: {
        cast: (m.credits?.cast || []).slice(0, 10).map((c) => c.name).join(",")
      },
      start: m.release_date || "",
      stop: "",
      id: m.id,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : void 0,
      category: { value: "Cine" }
    };
  }
  updateProperties() {
    if (this.data?.channel_id) {
    }
    if (this.data && Object.keys(this.data).length > 0) {
      this.getActors();
      if (this.tipo === "Series") {
        this.getSeriesDetails();
        this.getRelatedSeries();
        this.getPopularSeries();
      } else {
        this.getRelatedMovies();
        this.getMovieDetails();
        this.getPopularMovies();
      }
    }
  }
  getTipo() {
    if (/T\d/.test(this.data.title.value)) {
      return "Series";
    } else {
      return "Peliculas";
    }
  }
  ngAfterViewInit() {
  }
  getActors() {
    this.actors = [];
    const castString = this.data?.desc?.cast;
    if (!castString)
      return;
    const castArray = String(castString).split(",").map((s) => s.trim()).filter(Boolean);
    for (let actorName of castArray) {
      this.httpSvc.getPerson(actorName).subscribe((resp) => {
        const person = resp?.results?.[0];
        if (person)
          this.actors.push(person);
      });
    }
  }
  getRelatedSeries() {
    const title = this.data.title.value.replace(/T\d+.*/, "");
    this.httpSvc.getSeriesId(title).subscribe((data) => {
      this.httpSvc.getSimilarSeries(data.results[0].id).subscribe((data2) => {
        this.relatedMovies = data2.results;
      });
    });
  }
  getPopularSeries() {
    this.httpSvc.getPopularSeries().subscribe((data) => {
      this.popular_movies = data.results;
    });
  }
  getSeriesDetails() {
    const title = this.data.title.value.replace(/T\d+.*/, "");
    this.httpSvc.getSeriesId(title).subscribe((data) => {
      this.httpSvc.getSeriesDetails(data.results[0].id).subscribe((data2) => {
        this.movie = data2;
      });
    });
  }
  getRelatedMovies() {
    this.httpSvc.getMovieId(this.data.title.value).subscribe((data) => {
      this.httpSvc.getSimilarMovie(data.results[0].id).subscribe((data2) => {
        this.relatedMovies = data2.results;
      });
    });
  }
  getPopularMovies() {
    this.httpSvc.getPopularMovies().subscribe((data) => {
      this.popular_movies = data.results;
    });
  }
  getMovieDetails() {
    this.httpSvc.getMovieId(this.data.title.value).subscribe((data) => {
      this.httpSvc.getMovieDetails(data.results[0].id).subscribe((data2) => {
        this.movie = data2;
      });
    });
  }
  nextActors() {
    if (this.actorStartIndex + 4 < this.actors.length) {
      this.actorStartIndex += 4;
    }
  }
  previousActors() {
    if (this.actorStartIndex > 0) {
      this.actorStartIndex -= 4;
    }
  }
  nextMovies() {
    if (this.movieStartIndex + 6 < this.relatedMovies.length) {
      this.movieStartIndex += 6;
    }
  }
  previousMovies() {
    this.movieStartIndex = Math.max(this.movieStartIndex - 6, 0);
  }
};
_PeliculaDetailsComponent.\u0275fac = function PeliculaDetailsComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _PeliculaDetailsComponent)(\u0275\u0275directiveInject(TvGuideService), \u0275\u0275directiveInject(HttpService));
};
_PeliculaDetailsComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PeliculaDetailsComponent, selectors: [["app-pelicula-details"]], decls: 35, vars: 7, consts: [["href", "#main-content", 1, "sr-only", "focus:not-sr-only"], ["id", "main-content", "role", "main", "aria-label", "Detalles de pel\xEDcula", 1, "pelicula-details-page", "flex-1", "py-10", "px-5", "sm:px-10"], [1, "container"], [3, "data", 4, "ngIf"], [1, "content-section", "mt-9"], [1, "section-header"], [1, "section-title"], [1, "section-text", "mt-4"], ["class", "content-section mt-9", 4, "ngIf"], [1, "nav-controls"], ["type", "button", "aria-label", "Ver actores anteriores", 1, "nav-btn", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor"], ["d", "M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42-4.3-4.3 4.29-4.293Z"], ["type", "button", "aria-label", "Ver siguientes actores", 1, "nav-btn", 3, "click"], ["d", "M10.7 17.707l5.7-5.71-5.71-5.707L9.27 7.7l4.29 4.293-4.3 4.29Z"], [1, "mt-4", "grid", "grid-cols-2", "sm:grid-cols-4", "gap-x-5", "gap-y-5"], ["class", "cast-card relative rounded-xl overflow-hidden", 4, "ngFor", "ngForOf"], ["class", "content-section related-section", 4, "ngIf"], [3, "data"], [1, "cast-card", "relative", "rounded-xl", "overflow-hidden"], ["loading", "lazy", 1, "object-cover", "w-full", "h-full", "-z-10", 3, "src", "alt"], [1, "absolute", "top-0", "h-full", "w-full", "bg-gradient-to-t", "from-black/50", "p-3", "flex", "flex-col", "justify-between"], ["href", "#", 1, "p-2.5", "bg-gray-800/80", "bg-white", "rounded-lg", "text-white", "self-end", "hover:bg-red-600/80"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 20 20", "fill", "currentColor", 1, "h-4", "w-4"], ["fill-rule", "evenodd", "d", "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z", "clip-rule", "evenodd"], [1, "self-center", "flex", "flex-col", "items-center", "space-y-2"], [1, "capitalize", "text-white", "font-medium", "drop-shadow-md"], [1, "text-gray-100", "text-xs"], [1, "content-section", "related-section"], ["type", "button", "aria-label", "Ver pel\xEDculas anteriores", 1, "nav-btn", 3, "click", "disabled"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "currentColor", 1, "w-5", "h-5"], ["type", "button", "aria-label", "Ver siguientes pel\xEDculas", 1, "nav-btn", 3, "click", "disabled"], [1, "related-grid"], ["class", "related-card", "tabindex", "0", "role", "button", 4, "ngFor", "ngForOf"], ["tabindex", "0", "role", "button", 1, "related-card"], [1, "related-image-wrapper"], ["loading", "lazy", 1, "related-image", 3, "error", "src", "alt"], [1, "related-info"], [1, "related-title"], [1, "related-meta"], [1, "imdb-badge"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 64 32", "aria-label", "IMDb", 1, "imdb-logo"], ["fill", "#F5C518"], ["x", "0", "y", "0", "width", "100%", "height", "100%", "rx", "4"], ["transform", "translate(8, 7)", "fill", "#000000"], ["points", "0 18 5 18 5 0 0 0"], ["d", "M15.6725178,0 L14.5534833,8.40846934 L13.8582008,3.83502426 C13.65661,2.37009263 13.4632474,1.09175121 13.278113,0 L7,0 L7,18 L11.2416347,18 L11.2580911,6.11380679 L13.0436094,18 L16.0633571,18 L17.7583653,5.8517865 L17.7707076,18 L22,18 L22,0 L15.6725178,0 Z"], ["d", "M24,18 L24,0 L31.8045586,0 C33.5693522,0 35,1.41994415 35,3.17660424 L35,14.8233958 C35,16.5777858 33.5716617,18 31.8045586,18 L24,18 Z M29.8322479,3.2395236 C29.6339219,3.13233348 29.2545158,3.08072342 28.7026524,3.08072342 L28.7026524,14.8914865 C29.4312846,14.8914865 29.8796736,14.7604764 30.0478195,14.4865461 C30.2159654,14.2165858 30.3021941,13.486105 30.3021941,12.2871637 L30.3021941,5.3078959 C30.3021941,4.49404499 30.272014,3.97397442 30.2159654,3.74371416 C30.1599168,3.5134539 30.0348852,3.34671372 29.8322479,3.2395236 Z"], ["d", "M44.4299079,4.50685823 L44.749518,4.50685823 C46.5447098,4.50685823 48,5.91267586 48,7.64486762 L48,14.8619906 C48,16.5950653 46.5451816,18 44.749518,18 L44.4299079,18 C43.3314617,18 42.3602746,17.4736618 41.7718697,16.6682739 L41.4838962,17.7687785 L37,17.7687785 L37,0 L41.7843263,0 L41.7843263,5.78053556 C42.4024982,5.01015739 43.3551514,4.50685823 44.4299079,4.50685823 Z M43.4055679,13.2842155 L43.4055679,9.01907814 C43.4055679,8.31433946 43.3603268,7.85185468 43.2660746,7.63896485 C43.1718224,7.42607505 42.7955881,7.2893916 42.5316822,7.2893916 C42.267776,7.2893916 41.8607934,7.40047379 41.7816216,7.58767002 L41.7816216,9.01907814 L41.7816216,13.4207851 L41.7816216,14.8074788 C41.8721037,15.0130276 42.2602358,15.1274059 42.5316822,15.1274059 C42.8031285,15.1274059 43.1982131,15.0166981 43.281155,14.8074788 C43.3640968,14.5982595 43.4055679,14.0880581 43.4055679,13.2842155 Z"], [1, "rating-value"]], template: function PeliculaDetailsComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 0);
    \u0275\u0275text(1, "Saltar al contenido");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "main", 1)(3, "div", 2)(4, "section");
    \u0275\u0275element(5, "app-nav-bar");
    \u0275\u0275template(6, PeliculaDetailsComponent_app_banner_6_Template, 1, 1, "app-banner", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "section", 4)(8, "div", 5)(9, "span", 6);
    \u0275\u0275text(10, "Sinopsis");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 7);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(13, PeliculaDetailsComponent_section_13_Template, 6, 1, "section", 8)(14, PeliculaDetailsComponent_section_14_Template, 6, 1, "section", 8);
    \u0275\u0275elementStart(15, "section", 4)(16, "div", 5)(17, "span", 6);
    \u0275\u0275text(18, "Gui\xF3n");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 7);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "section", 4)(22, "div", 5)(23, "span", 6);
    \u0275\u0275text(24, "Reparto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "div", 9)(26, "button", 10);
    \u0275\u0275listener("click", function PeliculaDetailsComponent_Template_button_click_26_listener() {
      return ctx.previousActors();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(27, "svg", 11);
    \u0275\u0275element(28, "path", 12);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(29, "button", 13);
    \u0275\u0275listener("click", function PeliculaDetailsComponent_Template_button_click_29_listener() {
      return ctx.nextActors();
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(30, "svg", 11);
    \u0275\u0275element(31, "path", 14);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(32, "div", 15);
    \u0275\u0275template(33, PeliculaDetailsComponent_div_33_Template, 11, 4, "div", 16);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(34, PeliculaDetailsComponent_section_34_Template, 13, 4, "section", 17);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(6);
    \u0275\u0275property("ngIf", ctx.destacada);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx.movie.overview);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.tipo !== "Series");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.tipo === "Series");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.desc == null ? null : ctx.data.desc.screenplay);
    \u0275\u0275advance(13);
    \u0275\u0275property("ngForOf", ctx.actors.slice(ctx.actorStartIndex, ctx.actorStartIndex + 4));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.relatedMovies && ctx.relatedMovies.length > 0);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, NavBarComponent, BannerComponent], styles: ['@charset "UTF-8";\n\n\n\n.pelicula-details-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  color: #e5e7eb;\n  background: transparent;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  padding: 2.5rem 1rem;\n}\n@media (min-width: 640px) {\n  .pelicula-details-page[_ngcontent-%COMP%] {\n    padding: 3rem 2.5rem;\n  }\n}\n@media (min-width: 1024px) {\n  .pelicula-details-page[_ngcontent-%COMP%] {\n    padding: 3.5rem 3rem;\n  }\n}\n.pelicula-details-page[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%] {\n  max-width: 1200px;\n  margin: 0 auto;\n  width: 100%;\n}\n.banner-hero[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n  animation: _ngcontent-%COMP%_fadeInUp 0.4s ease-out;\n}\n.content-section[_ngcontent-%COMP%] {\n  margin-top: 2.5rem;\n  animation: _ngcontent-%COMP%_fadeInUp 0.5s ease-out backwards;\n}\n.content-section[_ngcontent-%COMP%]:nth-child(2) {\n  animation-delay: 0.1s;\n}\n.content-section[_ngcontent-%COMP%]:nth-child(3) {\n  animation-delay: 0.15s;\n}\n.content-section[_ngcontent-%COMP%]:nth-child(4) {\n  animation-delay: 0.2s;\n}\n@media (min-width: 640px) {\n  .content-section[_ngcontent-%COMP%] {\n    margin-top: 3rem;\n  }\n}\n.section-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 1rem;\n}\n@media (min-width: 640px) {\n  .section-header[_ngcontent-%COMP%] {\n    margin-bottom: 1.25rem;\n  }\n}\n.section-title[_ngcontent-%COMP%] {\n  font-size: 1.05rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  letter-spacing: -0.01em;\n}\n@media (min-width: 640px) {\n  .section-title[_ngcontent-%COMP%] {\n    font-size: 1.15rem;\n  }\n}\n@media (min-width: 1024px) {\n  .section-title[_ngcontent-%COMP%] {\n    font-size: 1.25rem;\n  }\n}\n.section-text[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  line-height: 1.7;\n  color: #9ca3af;\n  max-width: 78ch;\n}\n@media (min-width: 640px) {\n  .section-text[_ngcontent-%COMP%] {\n    font-size: 0.95rem;\n  }\n}\n@media (min-width: 1024px) {\n  .section-text[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n.nav-controls[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.nav-btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  padding: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 50%;\n  color: #e5e7eb;\n  cursor: pointer;\n  transition: all 180ms ease;\n}\n.nav-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: #dc2626;\n  color: #dc2626;\n  transform: scale(1.05);\n}\n.nav-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n.nav-btn[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.nav-btn[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n}\n.cast-section[_ngcontent-%COMP%]   .cast-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n}\n@media (min-width: 640px) {\n  .cast-section[_ngcontent-%COMP%]   .cast-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(4, 1fr);\n    gap: 1.25rem;\n  }\n}\n.cast-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  border-radius: 8px;\n  overflow: hidden;\n  background: transparent;\n  border: 1px solid rgba(255, 255, 255, 0.03);\n  transition: all 180ms ease;\n  cursor: pointer;\n}\n.cast-card[_ngcontent-%COMP%]:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);\n  border-color: rgba(255, 255, 255, 0.08);\n}\n.cast-card[_ngcontent-%COMP%]:hover   .cast-image[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.cast-card[_ngcontent-%COMP%]:hover   .add-btn[_ngcontent-%COMP%] {\n  opacity: 1;\n  transform: scale(1);\n}\n.cast-card[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.cast-image-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2/3;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.02);\n}\n.cast-image[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n  transition: transform 0.3s ease;\n}\n.cast-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      transparent 0%,\n      transparent 50%,\n      rgba(0, 0, 0, 0.8) 100%);\n  display: flex;\n  align-items: flex-start;\n  justify-content: flex-end;\n  padding: 0.75rem;\n}\n.add-btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  background: rgba(0, 0, 0, 0.8);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 6px;\n  color: #ffffff;\n  cursor: pointer;\n  opacity: 0;\n  transform: scale(0.9);\n  transition: all 180ms ease;\n}\n.add-btn[_ngcontent-%COMP%]:hover {\n  background: #dc2626;\n  border-color: #dc2626;\n  transform: scale(1.1);\n}\n.add-btn[_ngcontent-%COMP%]:focus-visible {\n  opacity: 1;\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.cast-info[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  align-items: center;\n  text-align: center;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.01),\n      rgba(0, 0, 0, 0.05));\n}\n.cast-name[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  line-height: 1.3;\n}\n@media (min-width: 640px) {\n  .cast-name[_ngcontent-%COMP%] {\n    font-size: 0.92rem;\n  }\n}\n.cast-meta[_ngcontent-%COMP%] {\n  font-size: 0.79rem;\n  color: #9ca3af;\n  margin: 0;\n}\n.related-section[_ngcontent-%COMP%]   .related-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n}\n@media (min-width: 640px) {\n  .related-section[_ngcontent-%COMP%]   .related-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(3, 1fr);\n    gap: 1.25rem;\n  }\n}\n@media (min-width: 1024px) {\n  .related-section[_ngcontent-%COMP%]   .related-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(4, 1fr);\n  }\n}\n.related-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  border-radius: 8px;\n  overflow: hidden;\n  background: transparent;\n  border: 1px solid rgba(255, 255, 255, 0.03);\n  cursor: pointer;\n  transition: all 180ms ease;\n}\n.related-card[_ngcontent-%COMP%]:hover, \n.related-card[_ngcontent-%COMP%]:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);\n  border-color: rgba(255, 255, 255, 0.08);\n}\n.related-card[_ngcontent-%COMP%]:hover   .related-image[_ngcontent-%COMP%], \n.related-card[_ngcontent-%COMP%]:focus-visible   .related-image[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.related-card[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.related-image-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2/3;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.02);\n}\n.related-image[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n  transition: transform 0.3s ease;\n}\n.related-info[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.01),\n      rgba(0, 0, 0, 0.05));\n  border-top: 2px solid #dc2626;\n}\n.related-title[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  line-height: 1.3;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n@media (min-width: 640px) {\n  .related-title[_ngcontent-%COMP%] {\n    font-size: 0.92rem;\n  }\n}\n.related-meta[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.imdb-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n  font-size: 0.8rem;\n  font-weight: 600;\n  color: #e5e7eb;\n}\n.imdb-logo[_ngcontent-%COMP%] {\n  width: 42px;\n  height: 20px;\n  flex-shrink: 0;\n}\n.rating-value[_ngcontent-%COMP%] {\n  color: #e5e7eb;\n  font-weight: 700;\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only[_ngcontent-%COMP%]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .pelicula-details-page[_ngcontent-%COMP%] {\n    color: #e5e7eb;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .cast-card[_ngcontent-%COMP%]:hover, \n   .related-card[_ngcontent-%COMP%]:hover, \n   .nav-btn[_ngcontent-%COMP%]:hover {\n    transform: none !important;\n  }\n}\n@media print {\n  .nav-controls[_ngcontent-%COMP%], \n   .add-btn[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .cast-card[_ngcontent-%COMP%], \n   .related-card[_ngcontent-%COMP%] {\n    page-break-inside: avoid;\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .cast-card[_ngcontent-%COMP%], \n   .related-card[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .nav-btn[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .pelicula-details-page[_ngcontent-%COMP%] {\n    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));\n  }\n}\n/*# sourceMappingURL=pelicula-details.compoent.css.map */'] });
var PeliculaDetailsComponent = _PeliculaDetailsComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PeliculaDetailsComponent, [{
    type: Component,
    args: [{ selector: "app-pelicula-details", standalone: true, imports: [CommonModule, NavBarComponent, BannerComponent], template: `<!-- Skip link para accesibilidad -->\r
<a class="sr-only focus:not-sr-only" href="#main-content"\r
  >Saltar al contenido</a\r
>\r
\r
<main\r
  id="main-content"\r
  class="pelicula-details-page flex-1 py-10 px-5 sm:px-10"\r
  role="main"\r
  aria-label="Detalles de pel\xEDcula"\r
>\r
  <div class="container">\r
    <!-- Navegaci\xF3n -->\r
    <section>\r
      <app-nav-bar></app-nav-bar>\r
\r
      <!-- Banner Hero -->\r
      <app-banner *ngIf="destacada" [data]="destacada"></app-banner>\r
    </section>\r
\r
    <!-- Sinopsis -->\r
    <section class="content-section mt-9">\r
      <div class="section-header">\r
        <span class="section-title">Sinopsis</span>\r
      </div>\r
      <div class="section-text mt-4">{{ movie.overview }}</div>\r
    </section>\r
\r
    <!-- Direcci\xF3n (solo pel\xEDculas) -->\r
    <section *ngIf="tipo !== 'Series'" class="content-section mt-9">\r
      <div class="section-header">\r
        <span class="section-title">Direcci\xF3n</span>\r
      </div>\r
      <div class="section-text mt-4">{{ data?.desc?.directors }}</div>\r
    </section>\r
\r
    <!-- Creada por (solo series) -->\r
    <section *ngIf="tipo === 'Series'" class="content-section mt-9">\r
      <div class="section-header">\r
        <span class="section-title">Creada Por</span>\r
      </div>\r
      <div class="section-text mt-4">\r
        {{ data?.desc?.directors || (movie?.created_by?.length ?\r
        movie?.created_by[0]?.name : "") }}.\r
      </div>\r
    </section>\r
\r
    <!-- Gui\xF3n -->\r
    <section class="content-section mt-9">\r
      <div class="section-header">\r
        <span class="section-title">Gui\xF3n</span>\r
      </div>\r
      <div class="section-text mt-4">{{ data?.desc?.screenplay }}</div>\r
    </section>\r
\r
    <!-- Reparto -->\r
    <section class="content-section mt-9">\r
      <div class="section-header">\r
        <span class="section-title">Reparto</span>\r
        <div class="nav-controls">\r
          <button\r
            type="button"\r
            class="nav-btn"\r
            (click)="previousActors()"\r
            aria-label="Ver actores anteriores"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              fill="currentColor"\r
            >\r
              <path\r
                d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42-4.3-4.3 4.29-4.293Z"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            type="button"\r
            class="nav-btn"\r
            (click)="nextActors()"\r
            aria-label="Ver siguientes actores"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              fill="currentColor"\r
            >\r
              <path\r
                d="M10.7 17.707l5.7-5.71-5.71-5.707L9.27 7.7l4.29 4.293-4.3 4.29Z"\r
              ></path>\r
            </svg>\r
          </button>\r
        </div>\r
      </div>\r
\r
      <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-5">\r
        <div\r
          *ngFor="let actor of actors.slice(actorStartIndex, actorStartIndex + 4)"\r
          class="cast-card relative rounded-xl overflow-hidden"\r
        >\r
          <img\r
            [src]="'https://image.tmdb.org/t/p/w200' + actor?.profile_path + '?s=64&d=identicon'"\r
            class="object-cover w-full h-full -z-10"\r
            [alt]="actor?.name || 'Actor'"\r
            loading="lazy"\r
          />\r
          <div\r
            class="absolute top-0 h-full w-full bg-gradient-to-t from-black/50 p-3 flex flex-col justify-between"\r
          >\r
            <a\r
              href="#"\r
              class="p-2.5 bg-gray-800/80 bg-white rounded-lg text-white self-end hover:bg-red-600/80"\r
            >\r
              <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                class="h-4 w-4"\r
                viewBox="0 0 20 20"\r
                fill="currentColor"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"\r
                  clip-rule="evenodd"\r
                />\r
              </svg>\r
            </a>\r
\r
            <div class="self-center flex flex-col items-center space-y-2">\r
              <span class="capitalize text-white font-medium drop-shadow-md"\r
                >{{ actor?.name || '' }}</span\r
              >\r
              <span class="text-gray-100 text-xs"\r
                >+{{ (actor?.known_for?.length) || 0 }} Pel\xEDculas</span\r
              >\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Pel\xEDculas/Series similares -->\r
    <!-- Pel\xEDculas/Series similares -->\r
    <section\r
      class="content-section related-section"\r
      *ngIf="relatedMovies && relatedMovies.length > 0"\r
    >\r
      <header class="section-header">\r
        <h2 class="section-title">\r
          {{ tipo === 'Series' ? 'Series Similares' : 'Pel\xEDculas Similares' }}\r
        </h2>\r
        <div class="nav-controls">\r
          <button\r
            type="button"\r
            class="nav-btn"\r
            (click)="previousMovies()"\r
            [disabled]="movieStartIndex === 0"\r
            aria-label="Ver pel\xEDculas anteriores"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              fill="currentColor"\r
              class="w-5 h-5"\r
            >\r
              <path\r
                d="M13.293 6.293L7.58 12l5.7 5.7 1.41-1.42-4.3-4.3 4.29-4.293Z"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            type="button"\r
            class="nav-btn"\r
            (click)="nextMovies()"\r
            [disabled]="movieStartIndex + 6 >= relatedMovies.length"\r
            aria-label="Ver siguientes pel\xEDculas"\r
          >\r
            <svg\r
              xmlns="http://www.w3.org/2000/svg"\r
              viewBox="0 0 24 24"\r
              fill="currentColor"\r
              class="w-5 h-5"\r
            >\r
              <path\r
                d="M10.7 17.707l5.7-5.71-5.71-5.707L9.27 7.7l4.29 4.293-4.3 4.29Z"\r
              ></path>\r
            </svg>\r
          </button>\r
        </div>\r
      </header>\r
\r
      <div class="related-grid">\r
        <article\r
          *ngFor="let movie of relatedMovies.slice(movieStartIndex, movieStartIndex + 6)"\r
          class="related-card"\r
          tabindex="0"\r
          role="button"\r
          [attr.aria-label]="'Ver detalles de ' + (movie?.title || movie?.name)"\r
        >\r
          <div class="related-image-wrapper">\r
            <img\r
              [src]="'https://image.tmdb.org/t/p/w200' + movie?.poster_path"\r
              [alt]="movie?.title || movie?.name || 'Pel\xEDcula'"\r
              class="related-image"\r
              loading="lazy"\r
              (error)="$any($event.target).src='https://via.placeholder.com/200x300?text=Sin+Imagen'"\r
            />\r
          </div>\r
          <div class="related-info">\r
            <h3 class="related-title">\r
              {{ movie?.title || movie?.name || 'Sin t\xEDtulo' }}\r
            </h3>\r
            <div class="related-meta">\r
              <div class="imdb-badge">\r
                <svg\r
                  class="imdb-logo"\r
                  xmlns="http://www.w3.org/2000/svg"\r
                  viewBox="0 0 64 32"\r
                  aria-label="IMDb"\r
                >\r
                  <g fill="#F5C518">\r
                    <rect x="0" y="0" width="100%" height="100%" rx="4"></rect>\r
                  </g>\r
                  <g transform="translate(8, 7)" fill="#000000">\r
                    <polygon points="0 18 5 18 5 0 0 0"></polygon>\r
                    <path\r
                      d="M15.6725178,0 L14.5534833,8.40846934 L13.8582008,3.83502426 C13.65661,2.37009263 13.4632474,1.09175121 13.278113,0 L7,0 L7,18 L11.2416347,18 L11.2580911,6.11380679 L13.0436094,18 L16.0633571,18 L17.7583653,5.8517865 L17.7707076,18 L22,18 L22,0 L15.6725178,0 Z"\r
                    ></path>\r
                    <path\r
                      d="M24,18 L24,0 L31.8045586,0 C33.5693522,0 35,1.41994415 35,3.17660424 L35,14.8233958 C35,16.5777858 33.5716617,18 31.8045586,18 L24,18 Z M29.8322479,3.2395236 C29.6339219,3.13233348 29.2545158,3.08072342 28.7026524,3.08072342 L28.7026524,14.8914865 C29.4312846,14.8914865 29.8796736,14.7604764 30.0478195,14.4865461 C30.2159654,14.2165858 30.3021941,13.486105 30.3021941,12.2871637 L30.3021941,5.3078959 C30.3021941,4.49404499 30.272014,3.97397442 30.2159654,3.74371416 C30.1599168,3.5134539 30.0348852,3.34671372 29.8322479,3.2395236 Z"\r
                    ></path>\r
                    <path\r
                      d="M44.4299079,4.50685823 L44.749518,4.50685823 C46.5447098,4.50685823 48,5.91267586 48,7.64486762 L48,14.8619906 C48,16.5950653 46.5451816,18 44.749518,18 L44.4299079,18 C43.3314617,18 42.3602746,17.4736618 41.7718697,16.6682739 L41.4838962,17.7687785 L37,17.7687785 L37,0 L41.7843263,0 L41.7843263,5.78053556 C42.4024982,5.01015739 43.3551514,4.50685823 44.4299079,4.50685823 Z M43.4055679,13.2842155 L43.4055679,9.01907814 C43.4055679,8.31433946 43.3603268,7.85185468 43.2660746,7.63896485 C43.1718224,7.42607505 42.7955881,7.2893916 42.5316822,7.2893916 C42.267776,7.2893916 41.8607934,7.40047379 41.7816216,7.58767002 L41.7816216,9.01907814 L41.7816216,13.4207851 L41.7816216,14.8074788 C41.8721037,15.0130276 42.2602358,15.1274059 42.5316822,15.1274059 C42.8031285,15.1274059 43.1982131,15.0166981 43.281155,14.8074788 C43.3640968,14.5982595 43.4055679,14.0880581 43.4055679,13.2842155 Z"\r
                    ></path>\r
                  </g>\r
                </svg>\r
                <span class="rating-value"\r
                  >{{ movie?.vote_average?.toFixed(1) || 'N/A' }}</span\r
                >\r
              </div>\r
            </div>\r
          </div>\r
        </article>\r
      </div>\r
    </section>\r
  </div>\r
</main>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/pages/pelicula-details/pelicula-details.compoent.scss */\n.pelicula-details-page {\n  min-height: 100vh;\n  color: #e5e7eb;\n  background: transparent;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  padding: 2.5rem 1rem;\n}\n@media (min-width: 640px) {\n  .pelicula-details-page {\n    padding: 3rem 2.5rem;\n  }\n}\n@media (min-width: 1024px) {\n  .pelicula-details-page {\n    padding: 3.5rem 3rem;\n  }\n}\n.pelicula-details-page .container {\n  max-width: 1200px;\n  margin: 0 auto;\n  width: 100%;\n}\n.banner-hero {\n  margin-bottom: 2rem;\n  animation: fadeInUp 0.4s ease-out;\n}\n.content-section {\n  margin-top: 2.5rem;\n  animation: fadeInUp 0.5s ease-out backwards;\n}\n.content-section:nth-child(2) {\n  animation-delay: 0.1s;\n}\n.content-section:nth-child(3) {\n  animation-delay: 0.15s;\n}\n.content-section:nth-child(4) {\n  animation-delay: 0.2s;\n}\n@media (min-width: 640px) {\n  .content-section {\n    margin-top: 3rem;\n  }\n}\n.section-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 1rem;\n}\n@media (min-width: 640px) {\n  .section-header {\n    margin-bottom: 1.25rem;\n  }\n}\n.section-title {\n  font-size: 1.05rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  letter-spacing: -0.01em;\n}\n@media (min-width: 640px) {\n  .section-title {\n    font-size: 1.15rem;\n  }\n}\n@media (min-width: 1024px) {\n  .section-title {\n    font-size: 1.25rem;\n  }\n}\n.section-text {\n  font-size: 0.9rem;\n  line-height: 1.7;\n  color: #9ca3af;\n  max-width: 78ch;\n}\n@media (min-width: 640px) {\n  .section-text {\n    font-size: 0.95rem;\n  }\n}\n@media (min-width: 1024px) {\n  .section-text {\n    font-size: 1rem;\n  }\n}\n.nav-controls {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.nav-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  padding: 0;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.02),\n      rgba(255, 255, 255, 0.01));\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 50%;\n  color: #e5e7eb;\n  cursor: pointer;\n  transition: all 180ms ease;\n}\n.nav-btn:hover:not(:disabled) {\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.05),\n      rgba(255, 255, 255, 0.02));\n  border-color: #dc2626;\n  color: #dc2626;\n  transform: scale(1.05);\n}\n.nav-btn:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n.nav-btn:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.nav-btn svg {\n  width: 18px;\n  height: 18px;\n}\n.cast-section .cast-grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n}\n@media (min-width: 640px) {\n  .cast-section .cast-grid {\n    grid-template-columns: repeat(4, 1fr);\n    gap: 1.25rem;\n  }\n}\n.cast-card {\n  display: flex;\n  flex-direction: column;\n  border-radius: 8px;\n  overflow: hidden;\n  background: transparent;\n  border: 1px solid rgba(255, 255, 255, 0.03);\n  transition: all 180ms ease;\n  cursor: pointer;\n}\n.cast-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);\n  border-color: rgba(255, 255, 255, 0.08);\n}\n.cast-card:hover .cast-image {\n  transform: scale(1.05);\n}\n.cast-card:hover .add-btn {\n  opacity: 1;\n  transform: scale(1);\n}\n.cast-card:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.cast-image-wrapper {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2/3;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.02);\n}\n.cast-image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n  transition: transform 0.3s ease;\n}\n.cast-overlay {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      180deg,\n      transparent 0%,\n      transparent 50%,\n      rgba(0, 0, 0, 0.8) 100%);\n  display: flex;\n  align-items: flex-start;\n  justify-content: flex-end;\n  padding: 0.75rem;\n}\n.add-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  background: rgba(0, 0, 0, 0.8);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 6px;\n  color: #ffffff;\n  cursor: pointer;\n  opacity: 0;\n  transform: scale(0.9);\n  transition: all 180ms ease;\n}\n.add-btn:hover {\n  background: #dc2626;\n  border-color: #dc2626;\n  transform: scale(1.1);\n}\n.add-btn:focus-visible {\n  opacity: 1;\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.cast-info {\n  padding: 0.75rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  align-items: center;\n  text-align: center;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.01),\n      rgba(0, 0, 0, 0.05));\n}\n.cast-name {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  line-height: 1.3;\n}\n@media (min-width: 640px) {\n  .cast-name {\n    font-size: 0.92rem;\n  }\n}\n.cast-meta {\n  font-size: 0.79rem;\n  color: #9ca3af;\n  margin: 0;\n}\n.related-section .related-grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n}\n@media (min-width: 640px) {\n  .related-section .related-grid {\n    grid-template-columns: repeat(3, 1fr);\n    gap: 1.25rem;\n  }\n}\n@media (min-width: 1024px) {\n  .related-section .related-grid {\n    grid-template-columns: repeat(4, 1fr);\n  }\n}\n.related-card {\n  display: flex;\n  flex-direction: column;\n  border-radius: 8px;\n  overflow: hidden;\n  background: transparent;\n  border: 1px solid rgba(255, 255, 255, 0.03);\n  cursor: pointer;\n  transition: all 180ms ease;\n}\n.related-card:hover,\n.related-card:focus-visible {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);\n  border-color: rgba(255, 255, 255, 0.08);\n}\n.related-card:hover .related-image,\n.related-card:focus-visible .related-image {\n  transform: scale(1.05);\n}\n.related-card:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n}\n.related-image-wrapper {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2/3;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.02);\n}\n.related-image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n  transition: transform 0.3s ease;\n}\n.related-info {\n  padding: 0.75rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255, 255, 255, 0.01),\n      rgba(0, 0, 0, 0.05));\n  border-top: 2px solid #dc2626;\n}\n.related-title {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #e5e7eb;\n  margin: 0;\n  line-height: 1.3;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n@media (min-width: 640px) {\n  .related-title {\n    font-size: 0.92rem;\n  }\n}\n.related-meta {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.imdb-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.375rem;\n  font-size: 0.8rem;\n  font-weight: 600;\n  color: #e5e7eb;\n}\n.imdb-logo {\n  width: 42px;\n  height: 20px;\n  flex-shrink: 0;\n}\n.rating-value {\n  color: #e5e7eb;\n  font-weight: 700;\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.sr-only.focus\\:not-sr-only:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  padding: 1rem;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n  white-space: normal;\n  background: #dc2626;\n  color: white;\n  z-index: 1000;\n}\n*:focus-visible {\n  outline: 2px solid #dc2626;\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .pelicula-details-page {\n    color: #e5e7eb;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n  .cast-card:hover,\n  .related-card:hover,\n  .nav-btn:hover {\n    transform: none !important;\n  }\n}\n@media print {\n  .nav-controls,\n  .add-btn {\n    display: none;\n  }\n  .cast-card,\n  .related-card {\n    page-break-inside: avoid;\n    box-shadow: none !important;\n    border: 1px solid #000 !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .cast-card,\n  .related-card {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .nav-btn {\n    border: 2px solid currentColor;\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .pelicula-details-page {\n    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));\n  }\n}\n/*# sourceMappingURL=pelicula-details.compoent.css.map */\n'] }]
  }], () => [{ type: TvGuideService }, { type: HttpService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PeliculaDetailsComponent, { className: "PeliculaDetailsComponent", filePath: "src/app/pages/pelicula-details/pelicula-details.compoent.ts", lineNumber: 16 });
})();
export {
  PeliculaDetailsComponent
};
//# sourceMappingURL=pelicula-details.compoent-K5YF7Z3A.js.map
