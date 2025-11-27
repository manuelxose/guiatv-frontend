import {
  Component,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵtext
} from "./chunk-UEL6V4IP.js";

// src/app/pages/legal/sitemap/sitemap.component.ts
var _SitemapComponent = class _SitemapComponent {
};
_SitemapComponent.\u0275fac = function SitemapComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _SitemapComponent)();
};
_SitemapComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SitemapComponent, selectors: [["app-sitemap"]], decls: 47, vars: 0, consts: [["role", "main", "aria-labelledby", "sitemap-title", 1, "prose", "max-w-4xl", "mx-auto", "py-12", "px-4"], ["id", "sitemap-title"], [1, "lead"], ["href", "/"], ["href", "/series"], ["href", "/peliculas"], ["href", "/guia-canales"], ["href", "/que-ver-hoy"], ["href", "/en-directo"], ["href", "/blog"], ["href", "/avisolegal"], ["href", "/privacidad"], ["href", "/cookies"], ["href", "/terminos"], ["href", "/accesibilidad"], ["href", "/sitemap.xml"]], template: function SitemapComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0)(1, "h1", 1);
    \u0275\u0275text(2, "Mapa del sitio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 2);
    \u0275\u0275text(4, " Listado de las principales rutas del sitio para facilitar la indexaci\xF3n y navegaci\xF3n. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "ul")(6, "li")(7, "a", 3);
    \u0275\u0275text(8, "Inicio");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "li")(10, "a", 4);
    \u0275\u0275text(11, "Series");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "li")(13, "a", 5);
    \u0275\u0275text(14, "Pel\xEDculas");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "li")(16, "a", 6);
    \u0275\u0275text(17, "Gu\xEDa de Canales");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "li")(19, "a", 7);
    \u0275\u0275text(20, "Qu\xE9 Ver Hoy");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "li")(22, "a", 8);
    \u0275\u0275text(23, "En Directo");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "li")(25, "a", 9);
    \u0275\u0275text(26, "Blog");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "li")(28, "a", 10);
    \u0275\u0275text(29, "Aviso Legal");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "li")(31, "a", 11);
    \u0275\u0275text(32, "Pol\xEDtica de Privacidad");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(33, "li")(34, "a", 12);
    \u0275\u0275text(35, "Pol\xEDtica de Cookies");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(36, "li")(37, "a", 13);
    \u0275\u0275text(38, "T\xE9rminos y Condiciones");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(39, "li")(40, "a", 14);
    \u0275\u0275text(41, "Declaraci\xF3n de Accesibilidad");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(42, "p");
    \u0275\u0275text(43, " Tambi\xE9n puedes consultar el sitemap XML en ");
    \u0275\u0275elementStart(44, "a", 15);
    \u0275\u0275text(45, "/sitemap.xml");
    \u0275\u0275elementEnd();
    \u0275\u0275text(46, " si est\xE1 disponible. ");
    \u0275\u0275elementEnd()();
  }
}, styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n}\nmain[_ngcontent-%COMP%] {\n  color: #e6eef6;\n}\n/*# sourceMappingURL=sitemap.component.css.map */"] });
var SitemapComponent = _SitemapComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SitemapComponent, [{
    type: Component,
    args: [{ selector: "app-sitemap", template: '<main\r\n  class="prose max-w-4xl mx-auto py-12 px-4"\r\n  role="main"\r\n  aria-labelledby="sitemap-title"\r\n>\r\n  <h1 id="sitemap-title">Mapa del sitio</h1>\r\n  <p class="lead">\r\n    Listado de las principales rutas del sitio para facilitar la indexaci\xF3n y\r\n    navegaci\xF3n.\r\n  </p>\r\n\r\n  <ul>\r\n    <li><a href="/">Inicio</a></li>\r\n    <li><a href="/series">Series</a></li>\r\n    <li><a href="/peliculas">Pel\xEDculas</a></li>\r\n    <li><a href="/guia-canales">Gu\xEDa de Canales</a></li>\r\n    <li><a href="/que-ver-hoy">Qu\xE9 Ver Hoy</a></li>\r\n    <li><a href="/en-directo">En Directo</a></li>\r\n    <li><a href="/blog">Blog</a></li>\r\n    <li><a href="/avisolegal">Aviso Legal</a></li>\r\n    <li><a href="/privacidad">Pol\xEDtica de Privacidad</a></li>\r\n    <li><a href="/cookies">Pol\xEDtica de Cookies</a></li>\r\n    <li><a href="/terminos">T\xE9rminos y Condiciones</a></li>\r\n    <li><a href="/accesibilidad">Declaraci\xF3n de Accesibilidad</a></li>\r\n  </ul>\r\n\r\n  <p>\r\n    Tambi\xE9n puedes consultar el sitemap XML en\r\n    <a href="/sitemap.xml">/sitemap.xml</a> si est\xE1 disponible.\r\n  </p>\r\n</main>\r\n', styles: ["/* src/app/pages/legal/sitemap/sitemap.component.scss */\n:host {\n  display: block;\n}\nmain {\n  color: #e6eef6;\n}\n/*# sourceMappingURL=sitemap.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SitemapComponent, { className: "SitemapComponent", filePath: "src/app/pages/legal/sitemap/sitemap.component.ts", lineNumber: 8 });
})();
export {
  SitemapComponent
};
//# sourceMappingURL=sitemap.component-K4W4WKUV.js.map
