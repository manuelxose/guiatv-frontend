import {
  Meta,
  Title,
  environment
} from "./chunk-MUKTTSZO.js";
import {
  DOCUMENT,
  Inject,
  Injectable,
  setClassMetadata,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-UEL6V4IP.js";

// src/app/services/meta.service.ts
var _MetaService = class _MetaService {
  constructor(meta, title, document) {
    this.meta = meta;
    this.title = title;
    this.document = document;
    this.url = environment.SITE_URL || "https://www.guiaprogramacion.com";
  }
  setMetaTags(config) {
    this.title.setTitle(config.title);
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('name="viewport"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.addTag({ name: "description", content: config.description });
    this.meta.addTag({ property: "og:title", content: config.title });
    this.meta.addTag({
      property: "og:description",
      content: config.description
    });
    if (config.image) {
      this.meta.addTag({ property: "og:image", content: config.image });
    }
    this.meta.addTag({
      property: "og:type",
      content: config.type || "article"
    });
    this.meta.addTag({
      name: "twitter:card",
      content: config.twitterCard || "summary_large_image"
    });
    this.meta.addTag({
      name: "viewport",
      content: "width=device-width, initial-scale=1"
    });
    if (this.document) {
      const existingCanonical = this.document.querySelector('link[rel="canonical"]');
      if (existingCanonical) {
        existingCanonical.remove();
      }
      const linkElement = this.document.createElement("link");
      linkElement.setAttribute("rel", "canonical");
      linkElement.setAttribute("href", this.url + config.canonicalUrl);
      this.document.head.appendChild(linkElement);
    }
  }
};
_MetaService.\u0275fac = function MetaService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _MetaService)(\u0275\u0275inject(Meta), \u0275\u0275inject(Title), \u0275\u0275inject(DOCUMENT));
};
_MetaService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MetaService, factory: _MetaService.\u0275fac, providedIn: "root" });
var MetaService = _MetaService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MetaService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: Meta }, { type: Title }, { type: Document, decorators: [{
    type: Inject,
    args: [DOCUMENT]
  }] }], null);
})();

export {
  MetaService
};
//# sourceMappingURL=chunk-MKFCNM4X.js.map
