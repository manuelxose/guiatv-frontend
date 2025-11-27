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
  isPlatformBrowser
} from "./chunk-MUKTTSZO.js";
import {
  Component,
  Inject,
  Input,
  PLATFORM_ID,
  Subject,
  __async,
  first,
  setClassMetadata,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵadvance,
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
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-UEL6V4IP.js";

// src/app/blog/components/share-buttons/share-buttons.component.ts
function ShareButtonsComponent__svg_svg_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 13);
    \u0275\u0275element(1, "path", 14);
    \u0275\u0275elementEnd();
  }
}
function ShareButtonsComponent__svg_svg_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 13);
    \u0275\u0275element(1, "path", 15);
    \u0275\u0275elementEnd();
  }
}
var _ShareButtonsComponent = class _ShareButtonsComponent {
  constructor(platformId) {
    this.url = "";
    this.title = "";
    this.copied = false;
    this.isBrowser = isPlatformBrowser(platformId);
  }
  get encodedUrl() {
    return encodeURIComponent(this.url);
  }
  get encodedTitle() {
    return encodeURIComponent(this.title);
  }
  copyToClipboard() {
    return __async(this, null, function* () {
      if (!this.isBrowser)
        return;
      try {
        yield navigator.clipboard.writeText(this.url);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2e3);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    });
  }
};
_ShareButtonsComponent.\u0275fac = function ShareButtonsComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ShareButtonsComponent)(\u0275\u0275directiveInject(PLATFORM_ID));
};
_ShareButtonsComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ShareButtonsComponent, selectors: [["app-share-buttons"]], inputs: { url: "url", title: "title" }, decls: 18, vars: 8, consts: [[1, "flex", "items-center", "gap-3"], [1, "text-sm", "text-gray-400", "mr-2"], ["target", "_blank", "rel", "noopener noreferrer", "aria-label", "Compartir en Facebook", 1, "share-btn", "bg-[#1877F2]", "hover:bg-[#166FE5]", 3, "href"], ["fill", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5"], ["d", "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"], ["target", "_blank", "rel", "noopener noreferrer", "aria-label", "Compartir en X (Twitter)", 1, "share-btn", "bg-black", "hover:bg-gray-900", 3, "href"], ["d", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"], ["target", "_blank", "rel", "noopener noreferrer", "aria-label", "Compartir en LinkedIn", 1, "share-btn", "bg-[#0A66C2]", "hover:bg-[#004182]", 3, "href"], ["d", "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"], ["target", "_blank", "rel", "noopener noreferrer", "aria-label", "Compartir en WhatsApp", 1, "share-btn", "bg-[#25D366]", "hover:bg-[#1DA851]", 3, "href"], ["d", "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"], ["aria-label", "Copiar enlace", 1, "share-btn", "bg-gray-700", "hover:bg-gray-600", 3, "click"], ["class", "w-5 h-5", "fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 4, "ngIf"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M5 13l4 4L19 7"]], template: function ShareButtonsComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "span", 1);
    \u0275\u0275text(2, "Compartir:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "a", 2);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 3);
    \u0275\u0275element(5, "path", 4);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "a", 5);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 3);
    \u0275\u0275element(8, "path", 6);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "a", 7);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 3);
    \u0275\u0275element(11, "path", 8);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(12, "a", 9);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 3);
    \u0275\u0275element(14, "path", 10);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "button", 11);
    \u0275\u0275listener("click", function ShareButtonsComponent_Template_button_click_15_listener() {
      return ctx.copyToClipboard();
    });
    \u0275\u0275template(16, ShareButtonsComponent__svg_svg_16_Template, 2, 0, "svg", 12)(17, ShareButtonsComponent__svg_svg_17_Template, 2, 0, "svg", 12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275property("href", "https://www.facebook.com/sharer/sharer.php?u=" + ctx.encodedUrl, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(3);
    \u0275\u0275property("href", "https://twitter.com/intent/tweet?url=" + ctx.encodedUrl + "&text=" + ctx.encodedTitle, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(3);
    \u0275\u0275property("href", "https://www.linkedin.com/shareArticle?mini=true&url=" + ctx.encodedUrl, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(3);
    \u0275\u0275property("href", "https://wa.me/?text=" + ctx.encodedTitle + " " + ctx.encodedUrl, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(3);
    \u0275\u0275classProp("copied", ctx.copied);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.copied);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.copied);
  }
}, dependencies: [CommonModule, NgIf], styles: ["\n\n.share-btn[_ngcontent-%COMP%] {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-radius: 9999px;\n  padding: 0.5rem;\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n  transition-property: all;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 300ms;\n}\n.share-btn[_ngcontent-%COMP%]:hover {\n  --tw-scale-x: 1.1;\n  --tw-scale-y: 1.1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n.share-btn[_ngcontent-%COMP%]:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow:\n    var(--tw-ring-offset-shadow),\n    var(--tw-ring-shadow),\n    var(--tw-shadow, 0 0 #0000);\n  --tw-ring-offset-width: 2px;\n  --tw-ring-offset-color: #111827 ;\n}\n.share-btn.copied[_ngcontent-%COMP%] {\n  --tw-bg-opacity: 1;\n  background-color: rgb(22 163 74 / var(--tw-bg-opacity, 1));\n}\n/*# sourceMappingURL=share-buttons.component.css.map */"] });
var ShareButtonsComponent = _ShareButtonsComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ShareButtonsComponent, [{
    type: Component,
    args: [{ selector: "app-share-buttons", standalone: true, imports: [CommonModule], template: `
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-400 mr-2">Compartir:</span>

      <!-- Facebook -->
      <a
        [href]="'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn bg-[#1877F2] hover:bg-[#166FE5]"
        aria-label="Compartir en Facebook"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      </a>

      <!-- Twitter/X -->
      <a
        [href]="
          'https://twitter.com/intent/tweet?url=' +
          encodedUrl +
          '&text=' +
          encodedTitle
        "
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn bg-black hover:bg-gray-900"
        aria-label="Compartir en X (Twitter)"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </a>

      <!-- LinkedIn -->
      <a
        [href]="
          'https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl
        "
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn bg-[#0A66C2] hover:bg-[#004182]"
        aria-label="Compartir en LinkedIn"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
          />
        </svg>
      </a>

      <!-- WhatsApp -->
      <a
        [href]="'https://wa.me/?text=' + encodedTitle + ' ' + encodedUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn bg-[#25D366] hover:bg-[#1DA851]"
        aria-label="Compartir en WhatsApp"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          />
        </svg>
      </a>

      <!-- Copy Link -->
      <button
        (click)="copyToClipboard()"
        class="share-btn bg-gray-700 hover:bg-gray-600"
        [class.copied]="copied"
        aria-label="Copiar enlace"
      >
        <svg
          *ngIf="!copied"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          *ngIf="copied"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  `, styles: ["/* angular:styles/component:scss;129e41cf52ec01899d3b354fccdc6b91fc1875b4d76f470736912ca72a13e574;C:/Users/mgonzalezv.INDRA/Documents/private-workspace/guia-tv/src/app/blog/components/share-buttons/share-buttons.component.ts */\n.share-btn {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-radius: 9999px;\n  padding: 0.5rem;\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n  transition-property: all;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 300ms;\n}\n.share-btn:hover {\n  --tw-scale-x: 1.1;\n  --tw-scale-y: 1.1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n.share-btn:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow:\n    var(--tw-ring-offset-shadow),\n    var(--tw-ring-shadow),\n    var(--tw-shadow, 0 0 #0000);\n  --tw-ring-offset-width: 2px;\n  --tw-ring-offset-color: #111827 ;\n}\n.share-btn.copied {\n  --tw-bg-opacity: 1;\n  background-color: rgb(22 163 74 / var(--tw-bg-opacity, 1));\n}\n/*# sourceMappingURL=share-buttons.component.css.map */\n"] }]
  }], () => [{ type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], { url: [{
    type: Input
  }], title: [{
    type: Input
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ShareButtonsComponent, { className: "ShareButtonsComponent", filePath: "src/app/blog/components/share-buttons/share-buttons.component.ts", lineNumber: 129 });
})();

// src/app/blog/pages/post-detail/post-detail.component.ts
function PostDetailComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3)(1, "div", 4);
    \u0275\u0275element(2, "div", 5)(3, "div", 6);
    \u0275\u0275elementStart(4, "div", 7);
    \u0275\u0275element(5, "div", 8)(6, "div", 9)(7, "div", 10);
    \u0275\u0275elementEnd()()();
  }
}
function PostDetailComponent_article_2_div_12_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", cat_r1.name, " ");
  }
}
function PostDetailComponent_article_2_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 38);
    \u0275\u0275template(1, PostDetailComponent_article_2_div_12_span_1_Template, 2, 1, "span", 39);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.post.categories_name);
  }
}
function PostDetailComponent_article_2_figure_30_figcaption_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "figcaption", 44);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("innerHTML", ctx_r1.post.featured_image.caption, \u0275\u0275sanitizeHtml);
  }
}
function PostDetailComponent_article_2_figure_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "figure", 41);
    \u0275\u0275element(1, "img", 42);
    \u0275\u0275template(2, PostDetailComponent_article_2_figure_30_figcaption_2_Template, 1, 1, "figcaption", 43);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("src", ctx_r1.post.featured_image.source_url, \u0275\u0275sanitizeUrl)("alt", (ctx_r1.post.title == null ? null : ctx_r1.post.title.rendered) || "Imagen destacada del art\xEDculo");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.post.featured_image.caption);
  }
}
function PostDetailComponent_article_2_div_32_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 47);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tag_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" #", tag_r3, " ");
  }
}
function PostDetailComponent_article_2_div_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 36)(1, "h3", 45);
    \u0275\u0275text(2, "Etiquetas");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 38);
    \u0275\u0275template(4, PostDetailComponent_article_2_div_32_span_4_Template, 2, 1, "span", 46);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r1.post.tags);
  }
}
function PostDetailComponent_article_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "article", 3)(1, "nav", 11)(2, "ol", 12)(3, "li")(4, "a", 13);
    \u0275\u0275text(5, "Blog");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "li");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 14);
    \u0275\u0275element(8, "path", 15);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "li", 16);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "header", 17);
    \u0275\u0275template(12, PostDetailComponent_article_2_div_12_Template, 2, 1, "div", 18);
    \u0275\u0275elementStart(13, "h1", 19);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div", 20)(16, "div", 21);
    \u0275\u0275element(17, "img", 22);
    \u0275\u0275elementStart(18, "span", 23);
    \u0275\u0275text(19, "Equipo Editorial");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(20, "span", 24);
    \u0275\u0275text(21, "\u2022");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "time", 25);
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "span", 24);
    \u0275\u0275text(26, "\u2022");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "span");
    \u0275\u0275text(28);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(29, "app-share-buttons", 26);
    \u0275\u0275elementEnd();
    \u0275\u0275template(30, PostDetailComponent_article_2_figure_30_Template, 3, 3, "figure", 27);
    \u0275\u0275element(31, "div", 28);
    \u0275\u0275template(32, PostDetailComponent_article_2_div_32_Template, 5, 1, "div", 29);
    \u0275\u0275elementStart(33, "aside", 30)(34, "div", 31);
    \u0275\u0275element(35, "img", 32);
    \u0275\u0275elementStart(36, "div", 33)(37, "h3", 34);
    \u0275\u0275text(38, " Equipo Editorial ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(39, "p", 35);
    \u0275\u0275text(40, " Apasionados del cine, las series y el anime. Compartimos an\xE1lisis, rese\xF1as y las \xFAltimas noticias del mundo del entretenimiento. ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(41, "div", 36)(42, "p", 37);
    \u0275\u0275text(43, "\xBFTe gust\xF3 este art\xEDculo? \xA1Comp\xE1rtelo!");
    \u0275\u0275elementEnd();
    \u0275\u0275element(44, "app-share-buttons", 26);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate1(" ", ctx_r1.post.title == null ? null : ctx_r1.post.title.rendered, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.post.categories_name == null ? null : ctx_r1.post.categories_name.length);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.post.title == null ? null : ctx_r1.post.title.rendered, " ");
    \u0275\u0275advance(8);
    \u0275\u0275property("dateTime", ctx_r1.post.date);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(24, 13, ctx_r1.post.date, "dd MMMM yyyy"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", ctx_r1.readingTime, " min de lectura");
    \u0275\u0275advance();
    \u0275\u0275property("url", ctx_r1.currentUrl)("title", ctx_r1.post.title == null ? null : ctx_r1.post.title.rendered);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.post.featured_image == null ? null : ctx_r1.post.featured_image.source_url);
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", ctx_r1.post.content == null ? null : ctx_r1.post.content.rendered, \u0275\u0275sanitizeHtml);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.post.tags == null ? null : ctx_r1.post.tags.length);
    \u0275\u0275advance(12);
    \u0275\u0275property("url", ctx_r1.currentUrl)("title", ctx_r1.post.title == null ? null : ctx_r1.post.title.rendered);
  }
}
function PostDetailComponent_section_3_app_post_card_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-post-card", 53);
    \u0275\u0275listener("click", function PostDetailComponent_section_3_app_post_card_5_Template_app_post_card_click_0_listener() {
      const post_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.navigateToPost(post_r5));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const post_r5 = ctx.$implicit;
    \u0275\u0275property("post", post_r5);
  }
}
function PostDetailComponent_section_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 48)(1, "div", 49)(2, "h2", 50);
    \u0275\u0275text(3, " Art\xEDculos Relacionados ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 51);
    \u0275\u0275template(5, PostDetailComponent_section_3_app_post_card_5_Template, 1, 1, "app-post-card", 52);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", ctx_r1.relatedPosts)("ngForTrackBy", ctx_r1.trackByPostId);
  }
}
var _PostDetailComponent = class _PostDetailComponent {
  constructor(route, router, blogSvc, metaSvc, platformId) {
    this.route = route;
    this.router = router;
    this.blogSvc = blogSvc;
    this.metaSvc = metaSvc;
    this.destroy$ = new Subject();
    this.post = null;
    this.relatedPosts = [];
    this.isLoading = true;
    this.readingTime = 0;
    this.currentUrl = "";
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params["slug"];
      this.loadPost(slug);
    });
    if (this.isBrowser) {
      this.currentUrl = window.location.href;
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadPost(slug) {
    this.isLoading = true;
    this.blogSvc.getPostBySlug(slug).pipe(first()).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.post = data[0];
          this.normalizePostContent(this.post);
          this.calculateReadingTime();
          this.setMetaTags();
          this.loadRelatedPosts();
          this.isLoading = false;
          if (this.isBrowser) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          this.router.navigate(["/blog"]);
        }
      },
      error: (err) => {
        console.error("Error loading post:", err);
        this.router.navigate(["/blog"]);
      }
    });
  }
  /**
   * Ensure the post.content.rendered and post.excerpt.rendered are strings.
   * Some backends may return an object shape unexpectedly; convert to a
   * safe HTML string or JSON fallback to avoid [object Object] in templates.
   */
  normalizePostContent(post) {
    if (!post)
      return;
    const ensureString = (value) => {
      if (typeof value === "string")
        return value;
      if (!value)
        return "";
      const keys = ["rendered", "raw", "html", "value", "text"];
      for (const k of keys) {
        if (value[k] && typeof value[k] === "string")
          return value[k];
      }
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    };
    try {
      if (post.content) {
        post.content = {
          rendered: ensureString(post.content.rendered ?? post.content)
        };
      } else {
        post.content = { rendered: "" };
      }
      if (post.excerpt) {
        post.excerpt = {
          rendered: ensureString(post.excerpt.rendered ?? post.excerpt)
        };
      } else {
        post.excerpt = { rendered: "" };
      }
      if (post.featured_image && post.featured_image.caption) {
        post.featured_image.caption = ensureString(post.featured_image.caption.rendered ?? post.featured_image.caption);
      }
      if (post.title) {
        post.title = {
          rendered: ensureString(post.title.rendered ?? post.title)
        };
      } else {
        post.title = { rendered: "" };
      }
    } catch (err) {
      post.content = post.content || { rendered: "" };
      post.excerpt = post.excerpt || { rendered: "" };
    }
  }
  calculateReadingTime() {
    if (!this.post?.content?.rendered) {
      this.readingTime = 1;
      return;
    }
    const text = this.stripHtml(this.post.content.rendered);
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    this.readingTime = Math.max(1, Math.ceil(words / wordsPerMinute));
  }
  setMetaTags() {
    const description = this.stripHtml(this.post.excerpt?.rendered || "").slice(0, 160);
    this.metaSvc.setMetaTags({
      title: `${this.post.title?.rendered} | Blog`,
      description,
      image: this.post.featured_image?.source_url || "/assets/images/blog-og-image.jpg",
      canonicalUrl: `/blog/${this.post.slug}`,
      type: "article"
    });
  }
  loadRelatedPosts() {
    if (!this.post.categories || this.post.categories.length === 0) {
      return;
    }
    const categoryId = this.post.categories[0];
    this.blogSvc.getRelatedPosts(categoryId).pipe(first()).subscribe((posts) => {
      this.relatedPosts = posts.filter((p) => p.id !== this.post.id).slice(0, 3);
    });
  }
  stripHtml(html) {
    if (!html)
      return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  navigateToPost(post) {
    this.router.navigate(["/blog", post.slug]);
  }
  trackByPostId(index, post) {
    return post.id || index;
  }
};
_PostDetailComponent.\u0275fac = function PostDetailComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _PostDetailComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(BlogService), \u0275\u0275directiveInject(MetaService), \u0275\u0275directiveInject(PLATFORM_ID));
};
_PostDetailComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PostDetailComponent, selectors: [["app-post-detail"]], decls: 4, vars: 3, consts: [[1, "w-full", "min-h-screen"], ["class", "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12", 4, "ngIf"], ["class", "py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50", 4, "ngIf"], [1, "max-w-4xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-12"], [1, "animate-pulse", "space-y-8"], [1, "h-8", "bg-gray-700", "rounded", "w-3/4"], [1, "h-96", "bg-gray-700", "rounded"], [1, "space-y-4"], [1, "h-4", "bg-gray-700", "rounded"], [1, "h-4", "bg-gray-700", "rounded", "w-5/6"], [1, "h-4", "bg-gray-700", "rounded", "w-4/6"], ["aria-label", "Breadcrumb", 1, "mb-8"], [1, "flex", "items-center", "space-x-2", "text-sm", "text-gray-400"], ["routerLink", "/blog", 1, "hover:text-white", "transition-colors"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-4", "h-4"], ["fill-rule", "evenodd", "d", "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", "clip-rule", "evenodd"], ["aria-current", "page", 1, "text-white"], [1, "mb-12", "space-y-6"], ["class", "flex flex-wrap gap-2", 4, "ngIf"], [1, "text-3xl", "sm:text-4xl", "lg:text-5xl", "font-bold", "text-white", "leading-tight"], [1, "flex", "flex-wrap", "items-center", "gap-4", "text-gray-400", "text-sm"], [1, "flex", "items-center", "gap-2"], ["src", "/assets/images/author-avatar.jpg", "alt", "Autor", "onerror", "this.src='/assets/images/default-movie-poster.svg'", 1, "w-10", "h-10", "rounded-full"], [1, "font-medium", "text-white"], [1, "hidden", "sm:inline"], [3, "dateTime"], [3, "url", "title"], ["class", "mb-12 rounded-lg overflow-hidden", 4, "ngIf"], [1, "post-content", "prose", "prose-invert", "prose-lg", "max-w-none", "prose-headings:text-white", "prose-headings:font-bold", "prose-h2:text-3xl", "prose-h2:mt-12", "prose-h2:mb-6", "prose-h3:text-2xl", "prose-h3:mt-8", "prose-h3:mb-4", "prose-p:text-gray-300", "prose-p:leading-relaxed", "prose-p:mb-6", "prose-a:text-red-400", "prose-a:no-underline", "hover:prose-a:text-red-300", "prose-strong:text-white", "prose-strong:font-semibold", "prose-ul:text-gray-300", "prose-ol:text-gray-300", "prose-li:mb-2", "prose-blockquote:border-l-4", "prose-blockquote:border-red-500", "prose-blockquote:pl-6", "prose-blockquote:italic", "prose-blockquote:text-gray-400", "prose-code:text-red-400", "prose-code:bg-gray-800", "prose-code:px-2", "prose-code:py-1", "prose-code:rounded", "prose-img:rounded-lg", "prose-img:shadow-lg", 3, "innerHTML"], ["class", "mt-12 pt-8 border-t border-gray-700", 4, "ngIf"], [1, "mt-12", "p-6", "bg-gray-800", "rounded-lg"], [1, "flex", "items-start", "gap-4"], ["src", "/assets/images/author-avatar.jpg", "alt", "Autor", "onerror", "this.src='/assets/images/default-movie-poster.svg'", 1, "w-16", "h-16", "rounded-full", "flex-shrink-0"], [1, "flex-1"], [1, "text-xl", "font-semibold", "text-white", "mb-2"], [1, "text-gray-300", "leading-relaxed"], [1, "mt-12", "pt-8", "border-t", "border-gray-700"], [1, "text-gray-400", "mb-4"], [1, "flex", "flex-wrap", "gap-2"], ["class", "inline-block px-3 py-1 text-sm font-medium text-red-400 bg-red-400/10 rounded-full", 4, "ngFor", "ngForOf"], [1, "inline-block", "px-3", "py-1", "text-sm", "font-medium", "text-red-400", "bg-red-400/10", "rounded-full"], [1, "mb-12", "rounded-lg", "overflow-hidden"], ["loading", "eager", 1, "w-full", "h-auto", "object-cover", 3, "src", "alt"], ["class", "mt-3 text-sm text-gray-400 text-center", 3, "innerHTML", 4, "ngIf"], [1, "mt-3", "text-sm", "text-gray-400", "text-center", 3, "innerHTML"], [1, "text-lg", "font-semibold", "text-white", "mb-4"], ["class", "px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors", 4, "ngFor", "ngForOf"], [1, "px-3", "py-1", "text-sm", "bg-gray-800", "text-gray-300", "rounded-full", "hover:bg-gray-700", "transition-colors"], [1, "py-16", "px-4", "sm:px-6", "lg:px-8", "bg-gray-800/50"], [1, "max-w-7xl", "mx-auto"], [1, "text-2xl", "lg:text-3xl", "font-bold", "text-white", "mb-8"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-6", "lg:gap-8"], [3, "post", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [3, "click", "post"]], template: function PostDetailComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "main", 0);
    \u0275\u0275template(1, PostDetailComponent_div_1_Template, 8, 0, "div", 1)(2, PostDetailComponent_article_2_Template, 45, 16, "article", 1)(3, PostDetailComponent_section_3_Template, 6, 2, "section", 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.isLoading && ctx.post);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.relatedPosts.length > 0);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, DatePipe, RouterLink, PostCardComponent, ShareButtonsComponent], styles: ['\n\n[_nghost-%COMP%] {\n  display: block;\n}\n.main-article[_ngcontent-%COMP%] {\n  max-width: 65ch;\n  margin: 0 auto;\n  padding: 3rem 1rem;\n  color: #e5e7eb;\n}\n.prose[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  color: #ffffff;\n  font-weight: 700;\n  margin-top: 1.5rem;\n  margin-bottom: 0.75rem;\n}\n.prose[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  font-size: 2.25rem;\n}\n.prose[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  font-size: 1.75rem;\n}\n.prose[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  font-size: 1.25rem;\n}\n.prose[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  color: #d1d5db;\n  line-height: 1.75;\n  margin-bottom: 1rem;\n}\n.prose[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  display: block;\n  max-width: 100%;\n  height: auto;\n  border-radius: 8px;\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   ol[_ngcontent-%COMP%] {\n  margin-left: 1.25rem;\n  margin-bottom: 1rem;\n}\n.prose[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  margin-bottom: 0.5rem;\n}\n.prose[_ngcontent-%COMP%]   blockquote[_ngcontent-%COMP%] {\n  border-left: 4px solid #ef4444;\n  padding-left: 1rem;\n  color: #f3f4f6;\n  background: rgba(248, 113, 113, 0.03);\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   pre[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   code[_ngcontent-%COMP%] {\n  background: #0f172a;\n  color: #fde68a;\n  padding: 0.5rem 0.75rem;\n  border-radius: 6px;\n  overflow: auto;\n}\n.author-bio[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 1rem;\n  align-items: flex-start;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 8px;\n  padding: 1rem;\n  margin-top: 1.5rem;\n}\n.author-bio[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  width: 64px;\n  height: 64px;\n  object-fit: cover;\n  border-radius: 9999px;\n}\n.author-bio[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 0.25rem 0;\n  color: #fff;\n}\n.author-bio[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #d1d5db;\n}\n@media (max-width: 768px) {\n  .main-article[_ngcontent-%COMP%] {\n    padding: 2rem 1rem;\n  }\n  .prose[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n    font-size: 1.75rem;\n  }\n}\n.prose[_ngcontent-%COMP%]   figure[_ngcontent-%COMP%] {\n  margin: 1.25rem 0;\n}\n.prose[_ngcontent-%COMP%]   figcaption[_ngcontent-%COMP%] {\n  color: #9ca3af;\n  font-size: 0.9rem;\n  text-align: center;\n  margin-top: 0.5rem;\n}\n.prose[_ngcontent-%COMP%]   .wp-block-gallery[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   .gallery[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 0.5rem;\n  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   .wp-block-image[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   .entry-content[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  height: auto;\n  margin: 0.75rem 0;\n  object-fit: cover;\n  border-radius: 8px;\n}\n.prose[_ngcontent-%COMP%]   .embed-responsive[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   iframe[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   .wp-block-embed[_ngcontent-%COMP%] {\n  width: 100%;\n  aspect-ratio: 16/9;\n  display: block;\n  border-radius: 8px;\n  overflow: hidden;\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  margin: 1rem 0;\n  background: rgba(255, 255, 255, 0.02);\n}\n.prose[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.prose[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.75rem 1rem;\n  border: 1px solid rgba(255, 255, 255, 0.04);\n}\n.prose[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.03);\n  color: #f8fafc;\n  font-weight: 600;\n}\n.prose[_ngcontent-%COMP%]   pre[_ngcontent-%COMP%] {\n  background: #020617;\n  color: #fef3c7;\n  padding: 1rem;\n  border-radius: 8px;\n  overflow: auto;\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   code[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.03);\n  color: #fca5a5;\n  padding: 0.15rem 0.4rem;\n  border-radius: 6px;\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    Monaco,\n    "Roboto Mono",\n    "Courier New",\n    monospace;\n}\n.prose[_ngcontent-%COMP%]   details[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.02);\n  padding: 0.75rem 1rem;\n  border-radius: 8px;\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   .blockquote[_ngcontent-%COMP%] {\n  margin: 1rem 0;\n}\n.prose[_ngcontent-%COMP%]   img[src$=".svg"][_ngcontent-%COMP%] {\n  max-width: 60%;\n}\n@media (max-width: 640px) {\n  .prose[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n  .prose[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n    font-size: 1.5rem;\n  }\n}\n/*# sourceMappingURL=post-detail.component.css.map */'] });
var PostDetailComponent = _PostDetailComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PostDetailComponent, [{
    type: Component,
    args: [{ selector: "app-post-detail", standalone: true, imports: [CommonModule, RouterLink, PostCardComponent, ShareButtonsComponent], template: `<main class="w-full min-h-screen">\r
  <!-- Loading State -->\r
  <div *ngIf="isLoading" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\r
    <div class="animate-pulse space-y-8">\r
      <div class="h-8 bg-gray-700 rounded w-3/4"></div>\r
      <div class="h-96 bg-gray-700 rounded"></div>\r
      <div class="space-y-4">\r
        <div class="h-4 bg-gray-700 rounded"></div>\r
        <div class="h-4 bg-gray-700 rounded w-5/6"></div>\r
        <div class="h-4 bg-gray-700 rounded w-4/6"></div>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Post Content -->\r
  <article\r
    *ngIf="!isLoading && post"\r
    class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"\r
  >\r
    <!-- Breadcrumbs -->\r
    <nav class="mb-8" aria-label="Breadcrumb">\r
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
        <li class="text-white" aria-current="page">\r
          {{ post.title?.rendered }}\r
        </li>\r
      </ol>\r
    </nav>\r
\r
    <!-- Post Header -->\r
    <header class="mb-12 space-y-6">\r
      <!-- Categories -->\r
      <div class="flex flex-wrap gap-2" *ngIf="post.categories_name?.length">\r
        <span\r
          *ngFor="let cat of post.categories_name"\r
          class="inline-block px-3 py-1 text-sm font-medium text-red-400 bg-red-400/10 rounded-full"\r
        >\r
          {{ cat.name }}\r
        </span>\r
      </div>\r
\r
      <!-- Title -->\r
      <h1\r
        class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"\r
      >\r
        {{ post.title?.rendered }}\r
      </h1>\r
\r
      <!-- Meta Information -->\r
      <div class="flex flex-wrap items-center gap-4 text-gray-400 text-sm">\r
        <div class="flex items-center gap-2">\r
          <img\r
            src="/assets/images/author-avatar.jpg"\r
            alt="Autor"\r
            class="w-10 h-10 rounded-full"\r
            onerror="this.src='/assets/images/default-movie-poster.svg'"\r
          />\r
          <span class="font-medium text-white">Equipo Editorial</span>\r
        </div>\r
        <span class="hidden sm:inline">\u2022</span>\r
        <time [dateTime]="post.date">\r
          {{ post.date | date : "dd MMMM yyyy" }}\r
        </time>\r
        <span class="hidden sm:inline">\u2022</span>\r
        <span>{{ readingTime }} min de lectura</span>\r
      </div>\r
\r
      <!-- Share Buttons -->\r
      <app-share-buttons\r
        [url]="currentUrl"\r
        [title]="post.title?.rendered"\r
      ></app-share-buttons>\r
    </header>\r
\r
    <!-- Featured Image -->\r
    <figure\r
      class="mb-12 rounded-lg overflow-hidden"\r
      *ngIf="post.featured_image?.source_url"\r
    >\r
      <img\r
        [src]="post.featured_image.source_url"\r
        [alt]="post.title?.rendered || 'Imagen destacada del art\xEDculo'"\r
        class="w-full h-auto object-cover"\r
        loading="eager"\r
      />\r
      <figcaption\r
        *ngIf="post.featured_image.caption"\r
        class="mt-3 text-sm text-gray-400 text-center"\r
        [innerHTML]="post.featured_image.caption"\r
      ></figcaption>\r
    </figure>\r
\r
    <!-- Post Content -->\r
    <div\r
      class="post-content prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-red-400 prose-a:no-underline hover:prose-a:text-red-300 prose-strong:text-white prose-strong:font-semibold prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400 prose-code:text-red-400 prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-img:rounded-lg prose-img:shadow-lg"\r
      [innerHTML]="post.content?.rendered"\r
    ></div>\r
\r
    <!-- Tags Section -->\r
    <div class="mt-12 pt-8 border-t border-gray-700" *ngIf="post.tags?.length">\r
      <h3 class="text-lg font-semibold text-white mb-4">Etiquetas</h3>\r
      <div class="flex flex-wrap gap-2">\r
        <span\r
          *ngFor="let tag of post.tags"\r
          class="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors"\r
        >\r
          #{{ tag }}\r
        </span>\r
      </div>\r
    </div>\r
\r
    <!-- Author Bio -->\r
    <aside class="mt-12 p-6 bg-gray-800 rounded-lg">\r
      <div class="flex items-start gap-4">\r
        <img\r
          src="/assets/images/author-avatar.jpg"\r
          alt="Autor"\r
          class="w-16 h-16 rounded-full flex-shrink-0"\r
          onerror="this.src='/assets/images/default-movie-poster.svg'"\r
        />\r
        <div class="flex-1">\r
          <h3 class="text-xl font-semibold text-white mb-2">\r
            Equipo Editorial\r
          </h3>\r
          <p class="text-gray-300 leading-relaxed">\r
            Apasionados del cine, las series y el anime. Compartimos an\xE1lisis,\r
            rese\xF1as y las \xFAltimas noticias del mundo del entretenimiento.\r
          </p>\r
        </div>\r
      </div>\r
    </aside>\r
\r
    <!-- Share Again -->\r
    <div class="mt-12 pt-8 border-t border-gray-700">\r
      <p class="text-gray-400 mb-4">\xBFTe gust\xF3 este art\xEDculo? \xA1Comp\xE1rtelo!</p>\r
      <app-share-buttons\r
        [url]="currentUrl"\r
        [title]="post.title?.rendered"\r
      ></app-share-buttons>\r
    </div>\r
  </article>\r
\r
  <!-- Related Posts -->\r
  <section\r
    *ngIf="relatedPosts.length > 0"\r
    class="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50"\r
  >\r
    <div class="max-w-7xl mx-auto">\r
      <h2 class="text-2xl lg:text-3xl font-bold text-white mb-8">\r
        Art\xEDculos Relacionados\r
      </h2>\r
      <div\r
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"\r
      >\r
        <app-post-card\r
          *ngFor="let post of relatedPosts; trackBy: trackByPostId"\r
          [post]="post"\r
          (click)="navigateToPost(post)"\r
        ></app-post-card>\r
      </div>\r
    </div>\r
  </section>\r
\r
  <!-- Schema.org JSON-LD -->\r
  <script type="application/ld+json" *ngIf="post">\r
    {{\r
      {\r
        "@context": "https://schema.org",\r
        "@type": "BlogPosting",\r
        "headline": post.title?.rendered,\r
        "image": post.featured_image?.source_url,\r
        "datePublished": post.date,\r
        "dateModified": post.modified,\r
        "author": {\r
          "@type": "Organization",\r
          "name": "Gu\xEDa Programaci\xF3n"\r
        },\r
        "publisher": {\r
          "@type": "Organization",\r
          "name": "Gu\xEDa Programaci\xF3n",\r
          "logo": {\r
            "@type": "ImageObject",\r
            "url": "https://www.guiaprogramacion.com/assets/images/logo.png"\r
          }\r
        },\r
        "description": stripHtml(post.excerpt?.rendered),\r
        "mainEntityOfPage": {\r
          "@type": "WebPage",\r
          "@id": currentUrl\r
        }\r
      } | json\r
    }}\r
  <\/script>\r
</main>\r
`, styles: ['/* src/app/blog/pages/post-detail/post-detail.component.scss */\n:host {\n  display: block;\n}\n.main-article {\n  max-width: 65ch;\n  margin: 0 auto;\n  padding: 3rem 1rem;\n  color: #e5e7eb;\n}\n.prose h1,\n.prose h2,\n.prose h3,\n.prose h4 {\n  color: #ffffff;\n  font-weight: 700;\n  margin-top: 1.5rem;\n  margin-bottom: 0.75rem;\n}\n.prose h1 {\n  font-size: 2.25rem;\n}\n.prose h2 {\n  font-size: 1.75rem;\n}\n.prose h3 {\n  font-size: 1.25rem;\n}\n.prose p {\n  color: #d1d5db;\n  line-height: 1.75;\n  margin-bottom: 1rem;\n}\n.prose img {\n  display: block;\n  max-width: 100%;\n  height: auto;\n  border-radius: 8px;\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);\n  margin: 1rem 0;\n}\n.prose ul,\n.prose ol {\n  margin-left: 1.25rem;\n  margin-bottom: 1rem;\n}\n.prose li {\n  margin-bottom: 0.5rem;\n}\n.prose blockquote {\n  border-left: 4px solid #ef4444;\n  padding-left: 1rem;\n  color: #f3f4f6;\n  background: rgba(248, 113, 113, 0.03);\n  margin: 1rem 0;\n}\n.prose pre,\n.prose code {\n  background: #0f172a;\n  color: #fde68a;\n  padding: 0.5rem 0.75rem;\n  border-radius: 6px;\n  overflow: auto;\n}\n.author-bio {\n  display: flex;\n  gap: 1rem;\n  align-items: flex-start;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 8px;\n  padding: 1rem;\n  margin-top: 1.5rem;\n}\n.author-bio img {\n  width: 64px;\n  height: 64px;\n  object-fit: cover;\n  border-radius: 9999px;\n}\n.author-bio h3 {\n  margin: 0 0 0.25rem 0;\n  color: #fff;\n}\n.author-bio p {\n  margin: 0;\n  color: #d1d5db;\n}\n@media (max-width: 768px) {\n  .main-article {\n    padding: 2rem 1rem;\n  }\n  .prose h1 {\n    font-size: 1.75rem;\n  }\n}\n.prose figure {\n  margin: 1.25rem 0;\n}\n.prose figcaption {\n  color: #9ca3af;\n  font-size: 0.9rem;\n  text-align: center;\n  margin-top: 0.5rem;\n}\n.prose .wp-block-gallery,\n.prose .gallery {\n  display: grid;\n  gap: 0.5rem;\n  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));\n  margin: 1rem 0;\n}\n.prose .wp-block-image,\n.prose .entry-content img {\n  display: block;\n  width: 100%;\n  height: auto;\n  margin: 0.75rem 0;\n  object-fit: cover;\n  border-radius: 8px;\n}\n.prose .embed-responsive,\n.prose iframe,\n.prose .wp-block-embed {\n  width: 100%;\n  aspect-ratio: 16/9;\n  display: block;\n  border-radius: 8px;\n  overflow: hidden;\n  margin: 1rem 0;\n}\n.prose table {\n  width: 100%;\n  border-collapse: collapse;\n  margin: 1rem 0;\n  background: rgba(255, 255, 255, 0.02);\n}\n.prose th,\n.prose td {\n  padding: 0.75rem 1rem;\n  border: 1px solid rgba(255, 255, 255, 0.04);\n}\n.prose thead th {\n  background: rgba(255, 255, 255, 0.03);\n  color: #f8fafc;\n  font-weight: 600;\n}\n.prose pre {\n  background: #020617;\n  color: #fef3c7;\n  padding: 1rem;\n  border-radius: 8px;\n  overflow: auto;\n  margin: 1rem 0;\n}\n.prose code {\n  background: rgba(255, 255, 255, 0.03);\n  color: #fca5a5;\n  padding: 0.15rem 0.4rem;\n  border-radius: 6px;\n  font-family:\n    ui-monospace,\n    SFMono-Regular,\n    Menlo,\n    Monaco,\n    "Roboto Mono",\n    "Courier New",\n    monospace;\n}\n.prose details {\n  background: rgba(255, 255, 255, 0.02);\n  padding: 0.75rem 1rem;\n  border-radius: 8px;\n  margin: 1rem 0;\n}\n.prose .blockquote {\n  margin: 1rem 0;\n}\n.prose img[src$=".svg"] {\n  max-width: 60%;\n}\n@media (max-width: 640px) {\n  .prose {\n    font-size: 1rem;\n  }\n  .prose h2 {\n    font-size: 1.5rem;\n  }\n}\n/*# sourceMappingURL=post-detail.component.css.map */\n'] }]
  }], () => [{ type: ActivatedRoute }, { type: Router }, { type: BlogService }, { type: MetaService }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PostDetailComponent, { className: "PostDetailComponent", filePath: "src/app/blog/pages/post-detail/post-detail.component.ts", lineNumber: 23 });
})();
export {
  PostDetailComponent
};
//# sourceMappingURL=post-detail.component-APQJBL6E.js.map
