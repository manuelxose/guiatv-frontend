import {
  Component,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵtext
} from "./chunk-UEL6V4IP.js";

// src/app/pages/legal/legal-notice/legal-notice.component.ts
var _LegalNoticeComponent = class _LegalNoticeComponent {
};
_LegalNoticeComponent.\u0275fac = function LegalNoticeComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _LegalNoticeComponent)();
};
_LegalNoticeComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LegalNoticeComponent, selectors: [["app-legal-notice"]], decls: 15, vars: 0, consts: [["role", "main", "aria-labelledby", "legal-title", 1, "prose", "max-w-4xl", "mx-auto", "py-12", "px-4"], ["id", "legal-title"], [1, "lead"]], template: function LegalNoticeComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0)(1, "h1", 1);
    \u0275\u0275text(2, "Aviso Legal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 2);
    \u0275\u0275text(4, " Informaci\xF3n legal sobre GPTV y condiciones de uso conforme a la normativa aplicable. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "section")(6, "h2");
    \u0275\u0275text(7, "Identificaci\xF3n");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p");
    \u0275\u0275text(9, " TecnoRia S.L. CIF: B00000000. Domicilio social: Calle Ejemplo 1, Madrid. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "section")(11, "h2");
    \u0275\u0275text(12, "Contacto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "p");
    \u0275\u0275text(14, "Correo: legal@tecnoriasl.com");
    \u0275\u0275elementEnd()()();
  }
}, styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n}\nmain[_ngcontent-%COMP%] {\n  color: #e6eef6;\n}\n/*# sourceMappingURL=legal-notice.component.css.map */"] });
var LegalNoticeComponent = _LegalNoticeComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LegalNoticeComponent, [{
    type: Component,
    args: [{ selector: "app-legal-notice", template: '<main\r\n  class="prose max-w-4xl mx-auto py-12 px-4"\r\n  role="main"\r\n  aria-labelledby="legal-title"\r\n>\r\n  <h1 id="legal-title">Aviso Legal</h1>\r\n  <p class="lead">\r\n    Informaci\xF3n legal sobre GPTV y condiciones de uso conforme a la normativa\r\n    aplicable.\r\n  </p>\r\n\r\n  <section>\r\n    <h2>Identificaci\xF3n</h2>\r\n    <p>\r\n      TecnoRia S.L. CIF: B00000000. Domicilio social: Calle Ejemplo 1, Madrid.\r\n    </p>\r\n  </section>\r\n\r\n  <section>\r\n    <h2>Contacto</h2>\r\n    <p>Correo: legal&#64;tecnoriasl.com</p>\r\n  </section>\r\n</main>\r\n', styles: ["/* src/app/pages/legal/legal-notice/legal-notice.component.scss */\n:host {\n  display: block;\n}\nmain {\n  color: #e6eef6;\n}\n/*# sourceMappingURL=legal-notice.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LegalNoticeComponent, { className: "LegalNoticeComponent", filePath: "src/app/pages/legal/legal-notice/legal-notice.component.ts", lineNumber: 8 });
})();
export {
  LegalNoticeComponent
};
//# sourceMappingURL=legal-notice.component-HFVU6VRG.js.map
