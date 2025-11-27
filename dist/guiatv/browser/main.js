import {
  AutocompleteComponent
} from "./chunk-DM6RSHWD.js";
import {
  BlogLayoutComponent
} from "./chunk-SSDZXPCL.js";
import "./chunk-K74GGWCH.js";
import {
  AUTO_STYLE,
  AnimationGroupPlayer,
  AnimationMetadataType,
  CategoryStyleManagerService,
  ChannelLogoManagerService,
  ConsoleLoggerService,
  DimensionCalculatorService,
  NoopAnimationPlayer,
  ProgramListFacadeService,
  TimeManagerService,
  ViewportManagerService,
  sequence,
  style,
  takeUntilDestroyed,
  ɵPRE_STYLE
} from "./chunk-S55AJ6QF.js";
import "./chunk-O7DAVEUU.js";
import {
  MenuComponent
} from "./chunk-REERXIA3.js";
import {
  AppConfigurationService,
  BrowserModule,
  CACHE_MANAGER_TOKEN,
  CONTENT_FILTER_TOKEN,
  CacheKeys,
  CommonModule,
  ContentType,
  DATA_TRANSFORMER_TOKEN,
  DomRendererFactory2,
  FeaturedMoviesService,
  HomeDataService,
  HttpClient,
  HttpHeaders,
  ICacheManager,
  ILogger,
  INITIALIZATION_MANAGER_TOKEN,
  IPosterProvider,
  LOGGER_TOKEN,
  MOVIE_PROVIDER_TOKEN,
  NavigationEnd,
  NavigationStart,
  NgForOf,
  NgIf,
  POSTER_PROVIDER_TOKEN,
  PROGRAM_PROVIDER_TOKEN,
  Router,
  RouterOutlet,
  TvGuideService,
  bootstrapApplication,
  debugTimeZone,
  environment,
  formatCorrectTime,
  getCorrectTime,
  provideHttpClient,
  provideRouter,
  slugify,
  withFetch
} from "./chunk-MUKTTSZO.js";
import {
  ANIMATION_MODULE_TYPE,
  BehaviorSubject,
  Component,
  DOCUMENT,
  DestroyRef,
  Inject,
  Injectable,
  NgModule,
  NgZone,
  PLATFORM_ID,
  RendererFactory2,
  RuntimeError,
  Subject,
  __objRest,
  __spreadProps,
  __spreadValues,
  catchError,
  filter,
  forkJoin,
  inject,
  map,
  of,
  performanceMarkFeature,
  setClassMetadata,
  signal,
  takeUntil,
  tap,
  timeout,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
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

// node_modules/@angular/animations/fesm2022/util-D9FfmVnv.mjs
var LINE_START = "\n - ";
function invalidTimingValue(exp) {
  return new RuntimeError(3e3, ngDevMode && `The provided timing value "${exp}" is invalid.`);
}
function negativeStepValue() {
  return new RuntimeError(3100, ngDevMode && "Duration values below 0 are not allowed for this animation step.");
}
function negativeDelayValue() {
  return new RuntimeError(3101, ngDevMode && "Delay values below 0 are not allowed for this animation step.");
}
function invalidStyleParams(varName) {
  return new RuntimeError(3001, ngDevMode && `Unable to resolve the local animation param ${varName} in the given list of values`);
}
function invalidParamValue(varName) {
  return new RuntimeError(3003, ngDevMode && `Please provide a value for the animation param ${varName}`);
}
function invalidNodeType(nodeType) {
  return new RuntimeError(3004, ngDevMode && `Unable to resolve animation metadata node #${nodeType}`);
}
function invalidCssUnitValue(userProvidedProperty, value) {
  return new RuntimeError(3005, ngDevMode && `Please provide a CSS unit value for ${userProvidedProperty}:${value}`);
}
function invalidTrigger() {
  return new RuntimeError(3006, ngDevMode && "animation triggers cannot be prefixed with an `@` sign (e.g. trigger('@foo', [...]))");
}
function invalidDefinition() {
  return new RuntimeError(3007, ngDevMode && "only state() and transition() definitions can sit inside of a trigger()");
}
function invalidState(metadataName, missingSubs) {
  return new RuntimeError(3008, ngDevMode && `state("${metadataName}", ...) must define default values for all the following style substitutions: ${missingSubs.join(", ")}`);
}
function invalidStyleValue(value) {
  return new RuntimeError(3002, ngDevMode && `The provided style string value ${value} is not allowed.`);
}
function invalidParallelAnimation(prop, firstStart, firstEnd, secondStart, secondEnd) {
  return new RuntimeError(3010, ngDevMode && `The CSS property "${prop}" that exists between the times of "${firstStart}ms" and "${firstEnd}ms" is also being animated in a parallel animation between the times of "${secondStart}ms" and "${secondEnd}ms"`);
}
function invalidKeyframes() {
  return new RuntimeError(3011, ngDevMode && `keyframes() must be placed inside of a call to animate()`);
}
function invalidOffset() {
  return new RuntimeError(3012, ngDevMode && `Please ensure that all keyframe offsets are between 0 and 1`);
}
function keyframeOffsetsOutOfOrder() {
  return new RuntimeError(3200, ngDevMode && `Please ensure that all keyframe offsets are in order`);
}
function keyframesMissingOffsets() {
  return new RuntimeError(3202, ngDevMode && `Not all style() steps within the declared keyframes() contain offsets`);
}
function invalidStagger() {
  return new RuntimeError(3013, ngDevMode && `stagger() can only be used inside of query()`);
}
function invalidQuery(selector) {
  return new RuntimeError(3014, ngDevMode && `\`query("${selector}")\` returned zero elements. (Use \`query("${selector}", { optional: true })\` if you wish to allow this.)`);
}
function invalidExpression(expr) {
  return new RuntimeError(3015, ngDevMode && `The provided transition expression "${expr}" is not supported`);
}
function invalidTransitionAlias(alias) {
  return new RuntimeError(3016, ngDevMode && `The transition alias value "${alias}" is not supported`);
}
function triggerBuildFailed(name, errors) {
  return new RuntimeError(3404, ngDevMode && `The animation trigger "${name}" has failed to build due to the following errors:
 - ${errors.map((err) => err.message).join("\n - ")}`);
}
function animationFailed(errors) {
  return new RuntimeError(3502, ngDevMode && `Unable to animate due to the following errors:${LINE_START}${errors.map((err) => err.message).join(LINE_START)}`);
}
function registerFailed(errors) {
  return new RuntimeError(3503, ngDevMode && `Unable to build the animation due to the following errors: ${errors.map((err) => err.message).join("\n")}`);
}
function missingOrDestroyedAnimation() {
  return new RuntimeError(3300, ngDevMode && "The requested animation doesn't exist or has already been destroyed");
}
function createAnimationFailed(errors) {
  return new RuntimeError(3504, ngDevMode && `Unable to create the animation due to the following errors:${errors.map((err) => err.message).join("\n")}`);
}
function missingPlayer(id) {
  return new RuntimeError(3301, ngDevMode && `Unable to find the timeline player referenced by ${id}`);
}
function missingTrigger(phase, name) {
  return new RuntimeError(3302, ngDevMode && `Unable to listen on the animation trigger event "${phase}" because the animation trigger "${name}" doesn't exist!`);
}
function missingEvent(name) {
  return new RuntimeError(3303, ngDevMode && `Unable to listen on the animation trigger "${name}" because the provided event is undefined!`);
}
function unsupportedTriggerEvent(phase, name) {
  return new RuntimeError(3400, ngDevMode && `The provided animation trigger event "${phase}" for the animation trigger "${name}" is not supported!`);
}
function unregisteredTrigger(name) {
  return new RuntimeError(3401, ngDevMode && `The provided animation trigger "${name}" has not been registered!`);
}
function triggerTransitionsFailed(errors) {
  return new RuntimeError(3402, ngDevMode && `Unable to process animations due to the following failed trigger transitions
 ${errors.map((err) => err.message).join("\n")}`);
}
function transitionFailed(name, errors) {
  return new RuntimeError(3505, ngDevMode && `@${name} has failed due to:
 ${errors.map((err) => err.message).join("\n- ")}`);
}
var ANIMATABLE_PROP_SET = /* @__PURE__ */ new Set([
  "-moz-outline-radius",
  "-moz-outline-radius-bottomleft",
  "-moz-outline-radius-bottomright",
  "-moz-outline-radius-topleft",
  "-moz-outline-radius-topright",
  "-ms-grid-columns",
  "-ms-grid-rows",
  "-webkit-line-clamp",
  "-webkit-text-fill-color",
  "-webkit-text-stroke",
  "-webkit-text-stroke-color",
  "accent-color",
  "all",
  "backdrop-filter",
  "background",
  "background-color",
  "background-position",
  "background-size",
  "block-size",
  "border",
  "border-block-end",
  "border-block-end-color",
  "border-block-end-width",
  "border-block-start",
  "border-block-start-color",
  "border-block-start-width",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-width",
  "border-color",
  "border-end-end-radius",
  "border-end-start-radius",
  "border-image-outset",
  "border-image-slice",
  "border-image-width",
  "border-inline-end",
  "border-inline-end-color",
  "border-inline-end-width",
  "border-inline-start",
  "border-inline-start-color",
  "border-inline-start-width",
  "border-left",
  "border-left-color",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-right-color",
  "border-right-width",
  "border-start-end-radius",
  "border-start-start-radius",
  "border-top",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-width",
  "border-width",
  "bottom",
  "box-shadow",
  "caret-color",
  "clip",
  "clip-path",
  "color",
  "column-count",
  "column-gap",
  "column-rule",
  "column-rule-color",
  "column-rule-width",
  "column-width",
  "columns",
  "filter",
  "flex",
  "flex-basis",
  "flex-grow",
  "flex-shrink",
  "font",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-variation-settings",
  "font-weight",
  "gap",
  "grid-column-gap",
  "grid-gap",
  "grid-row-gap",
  "grid-template-columns",
  "grid-template-rows",
  "height",
  "inline-size",
  "input-security",
  "inset",
  "inset-block",
  "inset-block-end",
  "inset-block-start",
  "inset-inline",
  "inset-inline-end",
  "inset-inline-start",
  "left",
  "letter-spacing",
  "line-clamp",
  "line-height",
  "margin",
  "margin-block-end",
  "margin-block-start",
  "margin-bottom",
  "margin-inline-end",
  "margin-inline-start",
  "margin-left",
  "margin-right",
  "margin-top",
  "mask",
  "mask-border",
  "mask-position",
  "mask-size",
  "max-block-size",
  "max-height",
  "max-inline-size",
  "max-lines",
  "max-width",
  "min-block-size",
  "min-height",
  "min-inline-size",
  "min-width",
  "object-position",
  "offset",
  "offset-anchor",
  "offset-distance",
  "offset-path",
  "offset-position",
  "offset-rotate",
  "opacity",
  "order",
  "outline",
  "outline-color",
  "outline-offset",
  "outline-width",
  "padding",
  "padding-block-end",
  "padding-block-start",
  "padding-bottom",
  "padding-inline-end",
  "padding-inline-start",
  "padding-left",
  "padding-right",
  "padding-top",
  "perspective",
  "perspective-origin",
  "right",
  "rotate",
  "row-gap",
  "scale",
  "scroll-margin",
  "scroll-margin-block",
  "scroll-margin-block-end",
  "scroll-margin-block-start",
  "scroll-margin-bottom",
  "scroll-margin-inline",
  "scroll-margin-inline-end",
  "scroll-margin-inline-start",
  "scroll-margin-left",
  "scroll-margin-right",
  "scroll-margin-top",
  "scroll-padding",
  "scroll-padding-block",
  "scroll-padding-block-end",
  "scroll-padding-block-start",
  "scroll-padding-bottom",
  "scroll-padding-inline",
  "scroll-padding-inline-end",
  "scroll-padding-inline-start",
  "scroll-padding-left",
  "scroll-padding-right",
  "scroll-padding-top",
  "scroll-snap-coordinate",
  "scroll-snap-destination",
  "scrollbar-color",
  "shape-image-threshold",
  "shape-margin",
  "shape-outside",
  "tab-size",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-thickness",
  "text-emphasis",
  "text-emphasis-color",
  "text-indent",
  "text-shadow",
  "text-underline-offset",
  "top",
  "transform",
  "transform-origin",
  "translate",
  "vertical-align",
  "visibility",
  "width",
  "word-spacing",
  "z-index",
  "zoom"
]);
function optimizeGroupPlayer(players) {
  switch (players.length) {
    case 0:
      return new NoopAnimationPlayer();
    case 1:
      return players[0];
    default:
      return new AnimationGroupPlayer(players);
  }
}
function normalizeKeyframes$1(normalizer, keyframes, preStyles = /* @__PURE__ */ new Map(), postStyles = /* @__PURE__ */ new Map()) {
  const errors = [];
  const normalizedKeyframes = [];
  let previousOffset = -1;
  let previousKeyframe = null;
  keyframes.forEach((kf) => {
    const offset = kf.get("offset");
    const isSameOffset = offset == previousOffset;
    const normalizedKeyframe = isSameOffset && previousKeyframe || /* @__PURE__ */ new Map();
    kf.forEach((val, prop) => {
      let normalizedProp = prop;
      let normalizedValue = val;
      if (prop !== "offset") {
        normalizedProp = normalizer.normalizePropertyName(normalizedProp, errors);
        switch (normalizedValue) {
          case \u0275PRE_STYLE:
            normalizedValue = preStyles.get(prop);
            break;
          case AUTO_STYLE:
            normalizedValue = postStyles.get(prop);
            break;
          default:
            normalizedValue = normalizer.normalizeStyleValue(prop, normalizedProp, normalizedValue, errors);
            break;
        }
      }
      normalizedKeyframe.set(normalizedProp, normalizedValue);
    });
    if (!isSameOffset) {
      normalizedKeyframes.push(normalizedKeyframe);
    }
    previousKeyframe = normalizedKeyframe;
    previousOffset = offset;
  });
  if (errors.length) {
    throw animationFailed(errors);
  }
  return normalizedKeyframes;
}
function listenOnPlayer(player, eventName, event, callback) {
  switch (eventName) {
    case "start":
      player.onStart(() => callback(event && copyAnimationEvent(event, "start", player)));
      break;
    case "done":
      player.onDone(() => callback(event && copyAnimationEvent(event, "done", player)));
      break;
    case "destroy":
      player.onDestroy(() => callback(event && copyAnimationEvent(event, "destroy", player)));
      break;
  }
}
function copyAnimationEvent(e, phaseName, player) {
  const totalTime = player.totalTime;
  const disabled = player.disabled ? true : false;
  const event = makeAnimationEvent(e.element, e.triggerName, e.fromState, e.toState, phaseName || e.phaseName, totalTime == void 0 ? e.totalTime : totalTime, disabled);
  const data = e["_data"];
  if (data != null) {
    event["_data"] = data;
  }
  return event;
}
function makeAnimationEvent(element, triggerName, fromState, toState, phaseName = "", totalTime = 0, disabled) {
  return { element, triggerName, fromState, toState, phaseName, totalTime, disabled: !!disabled };
}
function getOrSetDefaultValue(map2, key, defaultValue) {
  let value = map2.get(key);
  if (!value) {
    map2.set(key, value = defaultValue);
  }
  return value;
}
function parseTimelineCommand(command) {
  const separatorPos = command.indexOf(":");
  const id = command.substring(1, separatorPos);
  const action = command.slice(separatorPos + 1);
  return [id, action];
}
var documentElement = /* @__PURE__ */ (() => typeof document === "undefined" ? null : document.documentElement)();
function getParentElement(element) {
  const parent = element.parentNode || element.host || null;
  if (parent === documentElement) {
    return null;
  }
  return parent;
}
function containsVendorPrefix(prop) {
  return prop.substring(1, 6) == "ebkit";
}
var _CACHED_BODY = null;
var _IS_WEBKIT = false;
function validateStyleProperty(prop) {
  if (!_CACHED_BODY) {
    _CACHED_BODY = getBodyNode() || {};
    _IS_WEBKIT = _CACHED_BODY.style ? "WebkitAppearance" in _CACHED_BODY.style : false;
  }
  let result = true;
  if (_CACHED_BODY.style && !containsVendorPrefix(prop)) {
    result = prop in _CACHED_BODY.style;
    if (!result && _IS_WEBKIT) {
      const camelProp = "Webkit" + prop.charAt(0).toUpperCase() + prop.slice(1);
      result = camelProp in _CACHED_BODY.style;
    }
  }
  return result;
}
function validateWebAnimatableStyleProperty(prop) {
  return ANIMATABLE_PROP_SET.has(prop);
}
function getBodyNode() {
  if (typeof document != "undefined") {
    return document.body;
  }
  return null;
}
function containsElement(elm1, elm2) {
  while (elm2) {
    if (elm2 === elm1) {
      return true;
    }
    elm2 = getParentElement(elm2);
  }
  return false;
}
function invokeQuery(element, selector, multi) {
  if (multi) {
    return Array.from(element.querySelectorAll(selector));
  }
  const elem = element.querySelector(selector);
  return elem ? [elem] : [];
}
var ONE_SECOND = 1e3;
var SUBSTITUTION_EXPR_START = "{{";
var SUBSTITUTION_EXPR_END = "}}";
var ENTER_CLASSNAME = "ng-enter";
var LEAVE_CLASSNAME = "ng-leave";
var NG_TRIGGER_CLASSNAME = "ng-trigger";
var NG_TRIGGER_SELECTOR = ".ng-trigger";
var NG_ANIMATING_CLASSNAME = "ng-animating";
var NG_ANIMATING_SELECTOR = ".ng-animating";
function resolveTimingValue(value) {
  if (typeof value == "number")
    return value;
  const matches = value.match(/^(-?[\.\d]+)(m?s)/);
  if (!matches || matches.length < 2)
    return 0;
  return _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
}
function _convertTimeValueToMS(value, unit) {
  switch (unit) {
    case "s":
      return value * ONE_SECOND;
    default:
      return value;
  }
}
function resolveTiming(timings, errors, allowNegativeValues) {
  return timings.hasOwnProperty("duration") ? timings : parseTimeExpression(timings, errors, allowNegativeValues);
}
function parseTimeExpression(exp, errors, allowNegativeValues) {
  const regex = /^(-?[\.\d]+)(m?s)(?:\s+(-?[\.\d]+)(m?s))?(?:\s+([-a-z]+(?:\(.+?\))?))?$/i;
  let duration;
  let delay = 0;
  let easing = "";
  if (typeof exp === "string") {
    const matches = exp.match(regex);
    if (matches === null) {
      errors.push(invalidTimingValue(exp));
      return { duration: 0, delay: 0, easing: "" };
    }
    duration = _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
    const delayMatch = matches[3];
    if (delayMatch != null) {
      delay = _convertTimeValueToMS(parseFloat(delayMatch), matches[4]);
    }
    const easingVal = matches[5];
    if (easingVal) {
      easing = easingVal;
    }
  } else {
    duration = exp;
  }
  if (!allowNegativeValues) {
    let containsErrors = false;
    let startIndex = errors.length;
    if (duration < 0) {
      errors.push(negativeStepValue());
      containsErrors = true;
    }
    if (delay < 0) {
      errors.push(negativeDelayValue());
      containsErrors = true;
    }
    if (containsErrors) {
      errors.splice(startIndex, 0, invalidTimingValue(exp));
    }
  }
  return { duration, delay, easing };
}
function normalizeKeyframes(keyframes) {
  if (!keyframes.length) {
    return [];
  }
  if (keyframes[0] instanceof Map) {
    return keyframes;
  }
  return keyframes.map((kf) => new Map(Object.entries(kf)));
}
function setStyles(element, styles, formerStyles) {
  styles.forEach((val, prop) => {
    const camelProp = dashCaseToCamelCase(prop);
    if (formerStyles && !formerStyles.has(prop)) {
      formerStyles.set(prop, element.style[camelProp]);
    }
    element.style[camelProp] = val;
  });
}
function eraseStyles(element, styles) {
  styles.forEach((_, prop) => {
    const camelProp = dashCaseToCamelCase(prop);
    element.style[camelProp] = "";
  });
}
function normalizeAnimationEntry(steps) {
  if (Array.isArray(steps)) {
    if (steps.length == 1)
      return steps[0];
    return sequence(steps);
  }
  return steps;
}
function validateStyleParams(value, options, errors) {
  const params = options.params || {};
  const matches = extractStyleParams(value);
  if (matches.length) {
    matches.forEach((varName) => {
      if (!params.hasOwnProperty(varName)) {
        errors.push(invalidStyleParams(varName));
      }
    });
  }
}
var PARAM_REGEX = /* @__PURE__ */ new RegExp(`${SUBSTITUTION_EXPR_START}\\s*(.+?)\\s*${SUBSTITUTION_EXPR_END}`, "g");
function extractStyleParams(value) {
  let params = [];
  if (typeof value === "string") {
    let match;
    while (match = PARAM_REGEX.exec(value)) {
      params.push(match[1]);
    }
    PARAM_REGEX.lastIndex = 0;
  }
  return params;
}
function interpolateParams(value, params, errors) {
  const original = `${value}`;
  const str = original.replace(PARAM_REGEX, (_, varName) => {
    let localVal = params[varName];
    if (localVal == null) {
      errors.push(invalidParamValue(varName));
      localVal = "";
    }
    return localVal.toString();
  });
  return str == original ? value : str;
}
var DASH_CASE_REGEXP = /-+([a-z0-9])/g;
function dashCaseToCamelCase(input) {
  return input.replace(DASH_CASE_REGEXP, (...m) => m[1].toUpperCase());
}
function camelCaseToDashCase(input) {
  return input.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function allowPreviousPlayerStylesMerge(duration, delay) {
  return duration === 0 || delay === 0;
}
function balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles) {
  if (previousStyles.size && keyframes.length) {
    let startingKeyframe = keyframes[0];
    let missingStyleProps = [];
    previousStyles.forEach((val, prop) => {
      if (!startingKeyframe.has(prop)) {
        missingStyleProps.push(prop);
      }
      startingKeyframe.set(prop, val);
    });
    if (missingStyleProps.length) {
      for (let i = 1; i < keyframes.length; i++) {
        let kf = keyframes[i];
        missingStyleProps.forEach((prop) => kf.set(prop, computeStyle(element, prop)));
      }
    }
  }
  return keyframes;
}
function visitDslNode(visitor, node, context) {
  switch (node.type) {
    case AnimationMetadataType.Trigger:
      return visitor.visitTrigger(node, context);
    case AnimationMetadataType.State:
      return visitor.visitState(node, context);
    case AnimationMetadataType.Transition:
      return visitor.visitTransition(node, context);
    case AnimationMetadataType.Sequence:
      return visitor.visitSequence(node, context);
    case AnimationMetadataType.Group:
      return visitor.visitGroup(node, context);
    case AnimationMetadataType.Animate:
      return visitor.visitAnimate(node, context);
    case AnimationMetadataType.Keyframes:
      return visitor.visitKeyframes(node, context);
    case AnimationMetadataType.Style:
      return visitor.visitStyle(node, context);
    case AnimationMetadataType.Reference:
      return visitor.visitReference(node, context);
    case AnimationMetadataType.AnimateChild:
      return visitor.visitAnimateChild(node, context);
    case AnimationMetadataType.AnimateRef:
      return visitor.visitAnimateRef(node, context);
    case AnimationMetadataType.Query:
      return visitor.visitQuery(node, context);
    case AnimationMetadataType.Stagger:
      return visitor.visitStagger(node, context);
    default:
      throw invalidNodeType(node.type);
  }
}
function computeStyle(element, prop) {
  return window.getComputedStyle(element)[prop];
}

// node_modules/@angular/animations/fesm2022/browser.mjs
var NoopAnimationDriver = class _NoopAnimationDriver {
  /**
   * @returns Whether `prop` is a valid CSS property
   */
  validateStyleProperty(prop) {
    return validateStyleProperty(prop);
  }
  /**
   *
   * @returns Whether elm1 contains elm2.
   */
  containsElement(elm1, elm2) {
    return containsElement(elm1, elm2);
  }
  /**
   * @returns Rhe parent of the given element or `null` if the element is the `document`
   */
  getParentElement(element) {
    return getParentElement(element);
  }
  /**
   * @returns The result of the query selector on the element. The array will contain up to 1 item
   *     if `multi` is  `false`.
   */
  query(element, selector, multi) {
    return invokeQuery(element, selector, multi);
  }
  /**
   * @returns The `defaultValue` or empty string
   */
  computeStyle(element, prop, defaultValue) {
    return defaultValue || "";
  }
  /**
   * @returns An `NoopAnimationPlayer`
   */
  animate(element, keyframes, duration, delay, easing, previousPlayers = [], scrubberAccessRequested) {
    return new NoopAnimationPlayer(duration, delay);
  }
  static \u0275fac = function NoopAnimationDriver_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NoopAnimationDriver)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _NoopAnimationDriver,
    factory: _NoopAnimationDriver.\u0275fac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NoopAnimationDriver, [{
    type: Injectable
  }], null, null);
})();
var AnimationDriver = class {
  /**
   * @deprecated Use the NoopAnimationDriver class.
   */
  static NOOP = new NoopAnimationDriver();
};
var AnimationStyleNormalizer = class {
};
var DIMENSIONAL_PROP_SET = /* @__PURE__ */ new Set(["width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight", "left", "top", "bottom", "right", "fontSize", "outlineWidth", "outlineOffset", "paddingTop", "paddingLeft", "paddingBottom", "paddingRight", "marginTop", "marginLeft", "marginBottom", "marginRight", "borderRadius", "borderWidth", "borderTopWidth", "borderLeftWidth", "borderRightWidth", "borderBottomWidth", "textIndent", "perspective"]);
var WebAnimationsStyleNormalizer = class extends AnimationStyleNormalizer {
  normalizePropertyName(propertyName, errors) {
    return dashCaseToCamelCase(propertyName);
  }
  normalizeStyleValue(userProvidedProperty, normalizedProperty, value, errors) {
    let unit = "";
    const strVal = value.toString().trim();
    if (DIMENSIONAL_PROP_SET.has(normalizedProperty) && value !== 0 && value !== "0") {
      if (typeof value === "number") {
        unit = "px";
      } else {
        const valAndSuffixMatch = value.match(/^[+-]?[\d\.]+([a-z]*)$/);
        if (valAndSuffixMatch && valAndSuffixMatch[1].length == 0) {
          errors.push(invalidCssUnitValue(userProvidedProperty, value));
        }
      }
    }
    return strVal + unit;
  }
};
function createListOfWarnings(warnings) {
  const LINE_START2 = "\n - ";
  return `${LINE_START2}${warnings.filter(Boolean).map((warning) => warning).join(LINE_START2)}`;
}
function warnTriggerBuild(name, warnings) {
  console.warn(`The animation trigger "${name}" has built with the following warnings:${createListOfWarnings(warnings)}`);
}
function warnRegister(warnings) {
  console.warn(`Animation built with the following warnings:${createListOfWarnings(warnings)}`);
}
function pushUnrecognizedPropertiesWarning(warnings, props) {
  if (props.length) {
    warnings.push(`The following provided properties are not recognized: ${props.join(", ")}`);
  }
}
var ANY_STATE = "*";
function parseTransitionExpr(transitionValue, errors) {
  const expressions = [];
  if (typeof transitionValue == "string") {
    transitionValue.split(/\s*,\s*/).forEach((str) => parseInnerTransitionStr(str, expressions, errors));
  } else {
    expressions.push(transitionValue);
  }
  return expressions;
}
function parseInnerTransitionStr(eventStr, expressions, errors) {
  if (eventStr[0] == ":") {
    const result = parseAnimationAlias(eventStr, errors);
    if (typeof result == "function") {
      expressions.push(result);
      return;
    }
    eventStr = result;
  }
  const match = eventStr.match(/^(\*|[-\w]+)\s*(<?[=-]>)\s*(\*|[-\w]+)$/);
  if (match == null || match.length < 4) {
    errors.push(invalidExpression(eventStr));
    return expressions;
  }
  const fromState = match[1];
  const separator = match[2];
  const toState = match[3];
  expressions.push(makeLambdaFromStates(fromState, toState));
  const isFullAnyStateExpr = fromState == ANY_STATE && toState == ANY_STATE;
  if (separator[0] == "<" && !isFullAnyStateExpr) {
    expressions.push(makeLambdaFromStates(toState, fromState));
  }
  return;
}
function parseAnimationAlias(alias, errors) {
  switch (alias) {
    case ":enter":
      return "void => *";
    case ":leave":
      return "* => void";
    case ":increment":
      return (fromState, toState) => parseFloat(toState) > parseFloat(fromState);
    case ":decrement":
      return (fromState, toState) => parseFloat(toState) < parseFloat(fromState);
    default:
      errors.push(invalidTransitionAlias(alias));
      return "* => *";
  }
}
var TRUE_BOOLEAN_VALUES = /* @__PURE__ */ new Set(["true", "1"]);
var FALSE_BOOLEAN_VALUES = /* @__PURE__ */ new Set(["false", "0"]);
function makeLambdaFromStates(lhs, rhs) {
  const LHS_MATCH_BOOLEAN = TRUE_BOOLEAN_VALUES.has(lhs) || FALSE_BOOLEAN_VALUES.has(lhs);
  const RHS_MATCH_BOOLEAN = TRUE_BOOLEAN_VALUES.has(rhs) || FALSE_BOOLEAN_VALUES.has(rhs);
  return (fromState, toState) => {
    let lhsMatch = lhs == ANY_STATE || lhs == fromState;
    let rhsMatch = rhs == ANY_STATE || rhs == toState;
    if (!lhsMatch && LHS_MATCH_BOOLEAN && typeof fromState === "boolean") {
      lhsMatch = fromState ? TRUE_BOOLEAN_VALUES.has(lhs) : FALSE_BOOLEAN_VALUES.has(lhs);
    }
    if (!rhsMatch && RHS_MATCH_BOOLEAN && typeof toState === "boolean") {
      rhsMatch = toState ? TRUE_BOOLEAN_VALUES.has(rhs) : FALSE_BOOLEAN_VALUES.has(rhs);
    }
    return lhsMatch && rhsMatch;
  };
}
var SELF_TOKEN = ":self";
var SELF_TOKEN_REGEX = /* @__PURE__ */ new RegExp(`s*${SELF_TOKEN}s*,?`, "g");
function buildAnimationAst(driver, metadata, errors, warnings) {
  return new AnimationAstBuilderVisitor(driver).build(metadata, errors, warnings);
}
var ROOT_SELECTOR = "";
var AnimationAstBuilderVisitor = class {
  _driver;
  constructor(_driver) {
    this._driver = _driver;
  }
  build(metadata, errors, warnings) {
    const context = new AnimationAstBuilderContext(errors);
    this._resetContextStyleTimingState(context);
    const ast = visitDslNode(this, normalizeAnimationEntry(metadata), context);
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      if (context.unsupportedCSSPropertiesFound.size) {
        pushUnrecognizedPropertiesWarning(warnings, [...context.unsupportedCSSPropertiesFound.keys()]);
      }
    }
    return ast;
  }
  _resetContextStyleTimingState(context) {
    context.currentQuerySelector = ROOT_SELECTOR;
    context.collectedStyles = /* @__PURE__ */ new Map();
    context.collectedStyles.set(ROOT_SELECTOR, /* @__PURE__ */ new Map());
    context.currentTime = 0;
  }
  visitTrigger(metadata, context) {
    let queryCount = context.queryCount = 0;
    let depCount = context.depCount = 0;
    const states = [];
    const transitions = [];
    if (metadata.name.charAt(0) == "@") {
      context.errors.push(invalidTrigger());
    }
    metadata.definitions.forEach((def) => {
      this._resetContextStyleTimingState(context);
      if (def.type == AnimationMetadataType.State) {
        const stateDef = def;
        const name = stateDef.name;
        name.toString().split(/\s*,\s*/).forEach((n) => {
          stateDef.name = n;
          states.push(this.visitState(stateDef, context));
        });
        stateDef.name = name;
      } else if (def.type == AnimationMetadataType.Transition) {
        const transition = this.visitTransition(def, context);
        queryCount += transition.queryCount;
        depCount += transition.depCount;
        transitions.push(transition);
      } else {
        context.errors.push(invalidDefinition());
      }
    });
    return {
      type: AnimationMetadataType.Trigger,
      name: metadata.name,
      states,
      transitions,
      queryCount,
      depCount,
      options: null
    };
  }
  visitState(metadata, context) {
    const styleAst = this.visitStyle(metadata.styles, context);
    const astParams = metadata.options && metadata.options.params || null;
    if (styleAst.containsDynamicStyles) {
      const missingSubs = /* @__PURE__ */ new Set();
      const params = astParams || {};
      styleAst.styles.forEach((style2) => {
        if (style2 instanceof Map) {
          style2.forEach((value) => {
            extractStyleParams(value).forEach((sub) => {
              if (!params.hasOwnProperty(sub)) {
                missingSubs.add(sub);
              }
            });
          });
        }
      });
      if (missingSubs.size) {
        context.errors.push(invalidState(metadata.name, [...missingSubs.values()]));
      }
    }
    return {
      type: AnimationMetadataType.State,
      name: metadata.name,
      style: styleAst,
      options: astParams ? {
        params: astParams
      } : null
    };
  }
  visitTransition(metadata, context) {
    context.queryCount = 0;
    context.depCount = 0;
    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    const matchers = parseTransitionExpr(metadata.expr, context.errors);
    return {
      type: AnimationMetadataType.Transition,
      matchers,
      animation,
      queryCount: context.queryCount,
      depCount: context.depCount,
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitSequence(metadata, context) {
    return {
      type: AnimationMetadataType.Sequence,
      steps: metadata.steps.map((s) => visitDslNode(this, s, context)),
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitGroup(metadata, context) {
    const currentTime = context.currentTime;
    let furthestTime = 0;
    const steps = metadata.steps.map((step) => {
      context.currentTime = currentTime;
      const innerAst = visitDslNode(this, step, context);
      furthestTime = Math.max(furthestTime, context.currentTime);
      return innerAst;
    });
    context.currentTime = furthestTime;
    return {
      type: AnimationMetadataType.Group,
      steps,
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitAnimate(metadata, context) {
    const timingAst = constructTimingAst(metadata.timings, context.errors);
    context.currentAnimateTimings = timingAst;
    let styleAst;
    let styleMetadata = metadata.styles ? metadata.styles : style({});
    if (styleMetadata.type == AnimationMetadataType.Keyframes) {
      styleAst = this.visitKeyframes(styleMetadata, context);
    } else {
      let styleMetadata2 = metadata.styles;
      let isEmpty = false;
      if (!styleMetadata2) {
        isEmpty = true;
        const newStyleData = {};
        if (timingAst.easing) {
          newStyleData["easing"] = timingAst.easing;
        }
        styleMetadata2 = style(newStyleData);
      }
      context.currentTime += timingAst.duration + timingAst.delay;
      const _styleAst = this.visitStyle(styleMetadata2, context);
      _styleAst.isEmptyStep = isEmpty;
      styleAst = _styleAst;
    }
    context.currentAnimateTimings = null;
    return {
      type: AnimationMetadataType.Animate,
      timings: timingAst,
      style: styleAst,
      options: null
    };
  }
  visitStyle(metadata, context) {
    const ast = this._makeStyleAst(metadata, context);
    this._validateStyleAst(ast, context);
    return ast;
  }
  _makeStyleAst(metadata, context) {
    const styles = [];
    const metadataStyles = Array.isArray(metadata.styles) ? metadata.styles : [metadata.styles];
    for (let styleTuple of metadataStyles) {
      if (typeof styleTuple === "string") {
        if (styleTuple === AUTO_STYLE) {
          styles.push(styleTuple);
        } else {
          context.errors.push(invalidStyleValue(styleTuple));
        }
      } else {
        styles.push(new Map(Object.entries(styleTuple)));
      }
    }
    let containsDynamicStyles = false;
    let collectedEasing = null;
    styles.forEach((styleData) => {
      if (styleData instanceof Map) {
        if (styleData.has("easing")) {
          collectedEasing = styleData.get("easing");
          styleData.delete("easing");
        }
        if (!containsDynamicStyles) {
          for (let value of styleData.values()) {
            if (value.toString().indexOf(SUBSTITUTION_EXPR_START) >= 0) {
              containsDynamicStyles = true;
              break;
            }
          }
        }
      }
    });
    return {
      type: AnimationMetadataType.Style,
      styles,
      easing: collectedEasing,
      offset: metadata.offset,
      containsDynamicStyles,
      options: null
    };
  }
  _validateStyleAst(ast, context) {
    const timings = context.currentAnimateTimings;
    let endTime = context.currentTime;
    let startTime = context.currentTime;
    if (timings && startTime > 0) {
      startTime -= timings.duration + timings.delay;
    }
    ast.styles.forEach((tuple) => {
      if (typeof tuple === "string") return;
      tuple.forEach((value, prop) => {
        if (typeof ngDevMode === "undefined" || ngDevMode) {
          if (!this._driver.validateStyleProperty(prop)) {
            tuple.delete(prop);
            context.unsupportedCSSPropertiesFound.add(prop);
            return;
          }
        }
        const collectedStyles = context.collectedStyles.get(context.currentQuerySelector);
        const collectedEntry = collectedStyles.get(prop);
        let updateCollectedStyle = true;
        if (collectedEntry) {
          if (startTime != endTime && startTime >= collectedEntry.startTime && endTime <= collectedEntry.endTime) {
            context.errors.push(invalidParallelAnimation(prop, collectedEntry.startTime, collectedEntry.endTime, startTime, endTime));
            updateCollectedStyle = false;
          }
          startTime = collectedEntry.startTime;
        }
        if (updateCollectedStyle) {
          collectedStyles.set(prop, {
            startTime,
            endTime
          });
        }
        if (context.options) {
          validateStyleParams(value, context.options, context.errors);
        }
      });
    });
  }
  visitKeyframes(metadata, context) {
    const ast = {
      type: AnimationMetadataType.Keyframes,
      styles: [],
      options: null
    };
    if (!context.currentAnimateTimings) {
      context.errors.push(invalidKeyframes());
      return ast;
    }
    const MAX_KEYFRAME_OFFSET = 1;
    let totalKeyframesWithOffsets = 0;
    const offsets = [];
    let offsetsOutOfOrder = false;
    let keyframesOutOfRange = false;
    let previousOffset = 0;
    const keyframes = metadata.steps.map((styles) => {
      const style2 = this._makeStyleAst(styles, context);
      let offsetVal = style2.offset != null ? style2.offset : consumeOffset(style2.styles);
      let offset = 0;
      if (offsetVal != null) {
        totalKeyframesWithOffsets++;
        offset = style2.offset = offsetVal;
      }
      keyframesOutOfRange = keyframesOutOfRange || offset < 0 || offset > 1;
      offsetsOutOfOrder = offsetsOutOfOrder || offset < previousOffset;
      previousOffset = offset;
      offsets.push(offset);
      return style2;
    });
    if (keyframesOutOfRange) {
      context.errors.push(invalidOffset());
    }
    if (offsetsOutOfOrder) {
      context.errors.push(keyframeOffsetsOutOfOrder());
    }
    const length = metadata.steps.length;
    let generatedOffset = 0;
    if (totalKeyframesWithOffsets > 0 && totalKeyframesWithOffsets < length) {
      context.errors.push(keyframesMissingOffsets());
    } else if (totalKeyframesWithOffsets == 0) {
      generatedOffset = MAX_KEYFRAME_OFFSET / (length - 1);
    }
    const limit = length - 1;
    const currentTime = context.currentTime;
    const currentAnimateTimings = context.currentAnimateTimings;
    const animateDuration = currentAnimateTimings.duration;
    keyframes.forEach((kf, i) => {
      const offset = generatedOffset > 0 ? i == limit ? 1 : generatedOffset * i : offsets[i];
      const durationUpToThisFrame = offset * animateDuration;
      context.currentTime = currentTime + currentAnimateTimings.delay + durationUpToThisFrame;
      currentAnimateTimings.duration = durationUpToThisFrame;
      this._validateStyleAst(kf, context);
      kf.offset = offset;
      ast.styles.push(kf);
    });
    return ast;
  }
  visitReference(metadata, context) {
    return {
      type: AnimationMetadataType.Reference,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitAnimateChild(metadata, context) {
    context.depCount++;
    return {
      type: AnimationMetadataType.AnimateChild,
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitAnimateRef(metadata, context) {
    return {
      type: AnimationMetadataType.AnimateRef,
      animation: this.visitReference(metadata.animation, context),
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitQuery(metadata, context) {
    const parentSelector = context.currentQuerySelector;
    const options = metadata.options || {};
    context.queryCount++;
    context.currentQuery = metadata;
    const [selector, includeSelf] = normalizeSelector(metadata.selector);
    context.currentQuerySelector = parentSelector.length ? parentSelector + " " + selector : selector;
    getOrSetDefaultValue(context.collectedStyles, context.currentQuerySelector, /* @__PURE__ */ new Map());
    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    context.currentQuery = null;
    context.currentQuerySelector = parentSelector;
    return {
      type: AnimationMetadataType.Query,
      selector,
      limit: options.limit || 0,
      optional: !!options.optional,
      includeSelf,
      animation,
      originalSelector: metadata.selector,
      options: normalizeAnimationOptions(metadata.options)
    };
  }
  visitStagger(metadata, context) {
    if (!context.currentQuery) {
      context.errors.push(invalidStagger());
    }
    const timings = metadata.timings === "full" ? {
      duration: 0,
      delay: 0,
      easing: "full"
    } : resolveTiming(metadata.timings, context.errors, true);
    return {
      type: AnimationMetadataType.Stagger,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
      timings,
      options: null
    };
  }
};
function normalizeSelector(selector) {
  const hasAmpersand = selector.split(/\s*,\s*/).find((token) => token == SELF_TOKEN) ? true : false;
  if (hasAmpersand) {
    selector = selector.replace(SELF_TOKEN_REGEX, "");
  }
  selector = selector.replace(/@\*/g, NG_TRIGGER_SELECTOR).replace(/@\w+/g, (match) => NG_TRIGGER_SELECTOR + "-" + match.slice(1)).replace(/:animating/g, NG_ANIMATING_SELECTOR);
  return [selector, hasAmpersand];
}
function normalizeParams(obj) {
  return obj ? __spreadValues({}, obj) : null;
}
var AnimationAstBuilderContext = class {
  errors;
  queryCount = 0;
  depCount = 0;
  currentTransition = null;
  currentQuery = null;
  currentQuerySelector = null;
  currentAnimateTimings = null;
  currentTime = 0;
  collectedStyles = /* @__PURE__ */ new Map();
  options = null;
  unsupportedCSSPropertiesFound = /* @__PURE__ */ new Set();
  constructor(errors) {
    this.errors = errors;
  }
};
function consumeOffset(styles) {
  if (typeof styles == "string") return null;
  let offset = null;
  if (Array.isArray(styles)) {
    styles.forEach((styleTuple) => {
      if (styleTuple instanceof Map && styleTuple.has("offset")) {
        const obj = styleTuple;
        offset = parseFloat(obj.get("offset"));
        obj.delete("offset");
      }
    });
  } else if (styles instanceof Map && styles.has("offset")) {
    const obj = styles;
    offset = parseFloat(obj.get("offset"));
    obj.delete("offset");
  }
  return offset;
}
function constructTimingAst(value, errors) {
  if (value.hasOwnProperty("duration")) {
    return value;
  }
  if (typeof value == "number") {
    const duration = resolveTiming(value, errors).duration;
    return makeTimingAst(duration, 0, "");
  }
  const strValue = value;
  const isDynamic = strValue.split(/\s+/).some((v) => v.charAt(0) == "{" && v.charAt(1) == "{");
  if (isDynamic) {
    const ast = makeTimingAst(0, 0, "");
    ast.dynamic = true;
    ast.strValue = strValue;
    return ast;
  }
  const timings = resolveTiming(strValue, errors);
  return makeTimingAst(timings.duration, timings.delay, timings.easing);
}
function normalizeAnimationOptions(options) {
  if (options) {
    options = __spreadValues({}, options);
    if (options["params"]) {
      options["params"] = normalizeParams(options["params"]);
    }
  } else {
    options = {};
  }
  return options;
}
function makeTimingAst(duration, delay, easing) {
  return {
    duration,
    delay,
    easing
  };
}
function createTimelineInstruction(element, keyframes, preStyleProps, postStyleProps, duration, delay, easing = null, subTimeline = false) {
  return {
    type: 1,
    element,
    keyframes,
    preStyleProps,
    postStyleProps,
    duration,
    delay,
    totalTime: duration + delay,
    easing,
    subTimeline
  };
}
var ElementInstructionMap = class {
  _map = /* @__PURE__ */ new Map();
  get(element) {
    return this._map.get(element) || [];
  }
  append(element, instructions) {
    let existingInstructions = this._map.get(element);
    if (!existingInstructions) {
      this._map.set(element, existingInstructions = []);
    }
    existingInstructions.push(...instructions);
  }
  has(element) {
    return this._map.has(element);
  }
  clear() {
    this._map.clear();
  }
};
var ONE_FRAME_IN_MILLISECONDS = 1;
var ENTER_TOKEN = ":enter";
var ENTER_TOKEN_REGEX = /* @__PURE__ */ new RegExp(ENTER_TOKEN, "g");
var LEAVE_TOKEN = ":leave";
var LEAVE_TOKEN_REGEX = /* @__PURE__ */ new RegExp(LEAVE_TOKEN, "g");
function buildAnimationTimelines(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles = /* @__PURE__ */ new Map(), finalStyles = /* @__PURE__ */ new Map(), options, subInstructions, errors = []) {
  return new AnimationTimelineBuilderVisitor().buildKeyframes(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles, finalStyles, options, subInstructions, errors);
}
var AnimationTimelineBuilderVisitor = class {
  buildKeyframes(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles, finalStyles, options, subInstructions, errors = []) {
    subInstructions = subInstructions || new ElementInstructionMap();
    const context = new AnimationTimelineContext(driver, rootElement, subInstructions, enterClassName, leaveClassName, errors, []);
    context.options = options;
    const delay = options.delay ? resolveTimingValue(options.delay) : 0;
    context.currentTimeline.delayNextStep(delay);
    context.currentTimeline.setStyles([startingStyles], null, context.errors, options);
    visitDslNode(this, ast, context);
    const timelines = context.timelines.filter((timeline) => timeline.containsAnimation());
    if (timelines.length && finalStyles.size) {
      let lastRootTimeline;
      for (let i = timelines.length - 1; i >= 0; i--) {
        const timeline = timelines[i];
        if (timeline.element === rootElement) {
          lastRootTimeline = timeline;
          break;
        }
      }
      if (lastRootTimeline && !lastRootTimeline.allowOnlyTimelineStyles()) {
        lastRootTimeline.setStyles([finalStyles], null, context.errors, options);
      }
    }
    return timelines.length ? timelines.map((timeline) => timeline.buildKeyframes()) : [createTimelineInstruction(rootElement, [], [], [], 0, delay, "", false)];
  }
  visitTrigger(ast, context) {
  }
  visitState(ast, context) {
  }
  visitTransition(ast, context) {
  }
  visitAnimateChild(ast, context) {
    const elementInstructions = context.subInstructions.get(context.element);
    if (elementInstructions) {
      const innerContext = context.createSubContext(ast.options);
      const startTime = context.currentTimeline.currentTime;
      const endTime = this._visitSubInstructions(elementInstructions, innerContext, innerContext.options);
      if (startTime != endTime) {
        context.transformIntoNewTimeline(endTime);
      }
    }
    context.previousNode = ast;
  }
  visitAnimateRef(ast, context) {
    const innerContext = context.createSubContext(ast.options);
    innerContext.transformIntoNewTimeline();
    this._applyAnimationRefDelays([ast.options, ast.animation.options], context, innerContext);
    this.visitReference(ast.animation, innerContext);
    context.transformIntoNewTimeline(innerContext.currentTimeline.currentTime);
    context.previousNode = ast;
  }
  _applyAnimationRefDelays(animationsRefsOptions, context, innerContext) {
    for (const animationRefOptions of animationsRefsOptions) {
      const animationDelay = animationRefOptions?.delay;
      if (animationDelay) {
        const animationDelayValue = typeof animationDelay === "number" ? animationDelay : resolveTimingValue(interpolateParams(animationDelay, animationRefOptions?.params ?? {}, context.errors));
        innerContext.delayNextStep(animationDelayValue);
      }
    }
  }
  _visitSubInstructions(instructions, context, options) {
    const startTime = context.currentTimeline.currentTime;
    let furthestTime = startTime;
    const duration = options.duration != null ? resolveTimingValue(options.duration) : null;
    const delay = options.delay != null ? resolveTimingValue(options.delay) : null;
    if (duration !== 0) {
      instructions.forEach((instruction) => {
        const instructionTimings = context.appendInstructionToTimeline(instruction, duration, delay);
        furthestTime = Math.max(furthestTime, instructionTimings.duration + instructionTimings.delay);
      });
    }
    return furthestTime;
  }
  visitReference(ast, context) {
    context.updateOptions(ast.options, true);
    visitDslNode(this, ast.animation, context);
    context.previousNode = ast;
  }
  visitSequence(ast, context) {
    const subContextCount = context.subContextCount;
    let ctx = context;
    const options = ast.options;
    if (options && (options.params || options.delay)) {
      ctx = context.createSubContext(options);
      ctx.transformIntoNewTimeline();
      if (options.delay != null) {
        if (ctx.previousNode.type == AnimationMetadataType.Style) {
          ctx.currentTimeline.snapshotCurrentStyles();
          ctx.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
        }
        const delay = resolveTimingValue(options.delay);
        ctx.delayNextStep(delay);
      }
    }
    if (ast.steps.length) {
      ast.steps.forEach((s) => visitDslNode(this, s, ctx));
      ctx.currentTimeline.applyStylesToKeyframe();
      if (ctx.subContextCount > subContextCount) {
        ctx.transformIntoNewTimeline();
      }
    }
    context.previousNode = ast;
  }
  visitGroup(ast, context) {
    const innerTimelines = [];
    let furthestTime = context.currentTimeline.currentTime;
    const delay = ast.options && ast.options.delay ? resolveTimingValue(ast.options.delay) : 0;
    ast.steps.forEach((s) => {
      const innerContext = context.createSubContext(ast.options);
      if (delay) {
        innerContext.delayNextStep(delay);
      }
      visitDslNode(this, s, innerContext);
      furthestTime = Math.max(furthestTime, innerContext.currentTimeline.currentTime);
      innerTimelines.push(innerContext.currentTimeline);
    });
    innerTimelines.forEach((timeline) => context.currentTimeline.mergeTimelineCollectedStyles(timeline));
    context.transformIntoNewTimeline(furthestTime);
    context.previousNode = ast;
  }
  _visitTiming(ast, context) {
    if (ast.dynamic) {
      const strValue = ast.strValue;
      const timingValue = context.params ? interpolateParams(strValue, context.params, context.errors) : strValue;
      return resolveTiming(timingValue, context.errors);
    } else {
      return {
        duration: ast.duration,
        delay: ast.delay,
        easing: ast.easing
      };
    }
  }
  visitAnimate(ast, context) {
    const timings = context.currentAnimateTimings = this._visitTiming(ast.timings, context);
    const timeline = context.currentTimeline;
    if (timings.delay) {
      context.incrementTime(timings.delay);
      timeline.snapshotCurrentStyles();
    }
    const style2 = ast.style;
    if (style2.type == AnimationMetadataType.Keyframes) {
      this.visitKeyframes(style2, context);
    } else {
      context.incrementTime(timings.duration);
      this.visitStyle(style2, context);
      timeline.applyStylesToKeyframe();
    }
    context.currentAnimateTimings = null;
    context.previousNode = ast;
  }
  visitStyle(ast, context) {
    const timeline = context.currentTimeline;
    const timings = context.currentAnimateTimings;
    if (!timings && timeline.hasCurrentStyleProperties()) {
      timeline.forwardFrame();
    }
    const easing = timings && timings.easing || ast.easing;
    if (ast.isEmptyStep) {
      timeline.applyEmptyStep(easing);
    } else {
      timeline.setStyles(ast.styles, easing, context.errors, context.options);
    }
    context.previousNode = ast;
  }
  visitKeyframes(ast, context) {
    const currentAnimateTimings = context.currentAnimateTimings;
    const startTime = context.currentTimeline.duration;
    const duration = currentAnimateTimings.duration;
    const innerContext = context.createSubContext();
    const innerTimeline = innerContext.currentTimeline;
    innerTimeline.easing = currentAnimateTimings.easing;
    ast.styles.forEach((step) => {
      const offset = step.offset || 0;
      innerTimeline.forwardTime(offset * duration);
      innerTimeline.setStyles(step.styles, step.easing, context.errors, context.options);
      innerTimeline.applyStylesToKeyframe();
    });
    context.currentTimeline.mergeTimelineCollectedStyles(innerTimeline);
    context.transformIntoNewTimeline(startTime + duration);
    context.previousNode = ast;
  }
  visitQuery(ast, context) {
    const startTime = context.currentTimeline.currentTime;
    const options = ast.options || {};
    const delay = options.delay ? resolveTimingValue(options.delay) : 0;
    if (delay && (context.previousNode.type === AnimationMetadataType.Style || startTime == 0 && context.currentTimeline.hasCurrentStyleProperties())) {
      context.currentTimeline.snapshotCurrentStyles();
      context.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
    }
    let furthestTime = startTime;
    const elms = context.invokeQuery(ast.selector, ast.originalSelector, ast.limit, ast.includeSelf, options.optional ? true : false, context.errors);
    context.currentQueryTotal = elms.length;
    let sameElementTimeline = null;
    elms.forEach((element, i) => {
      context.currentQueryIndex = i;
      const innerContext = context.createSubContext(ast.options, element);
      if (delay) {
        innerContext.delayNextStep(delay);
      }
      if (element === context.element) {
        sameElementTimeline = innerContext.currentTimeline;
      }
      visitDslNode(this, ast.animation, innerContext);
      innerContext.currentTimeline.applyStylesToKeyframe();
      const endTime = innerContext.currentTimeline.currentTime;
      furthestTime = Math.max(furthestTime, endTime);
    });
    context.currentQueryIndex = 0;
    context.currentQueryTotal = 0;
    context.transformIntoNewTimeline(furthestTime);
    if (sameElementTimeline) {
      context.currentTimeline.mergeTimelineCollectedStyles(sameElementTimeline);
      context.currentTimeline.snapshotCurrentStyles();
    }
    context.previousNode = ast;
  }
  visitStagger(ast, context) {
    const parentContext = context.parentContext;
    const tl = context.currentTimeline;
    const timings = ast.timings;
    const duration = Math.abs(timings.duration);
    const maxTime = duration * (context.currentQueryTotal - 1);
    let delay = duration * context.currentQueryIndex;
    let staggerTransformer = timings.duration < 0 ? "reverse" : timings.easing;
    switch (staggerTransformer) {
      case "reverse":
        delay = maxTime - delay;
        break;
      case "full":
        delay = parentContext.currentStaggerTime;
        break;
    }
    const timeline = context.currentTimeline;
    if (delay) {
      timeline.delayNextStep(delay);
    }
    const startingTime = timeline.currentTime;
    visitDslNode(this, ast.animation, context);
    context.previousNode = ast;
    parentContext.currentStaggerTime = tl.currentTime - startingTime + (tl.startTime - parentContext.currentTimeline.startTime);
  }
};
var DEFAULT_NOOP_PREVIOUS_NODE = {};
var AnimationTimelineContext = class _AnimationTimelineContext {
  _driver;
  element;
  subInstructions;
  _enterClassName;
  _leaveClassName;
  errors;
  timelines;
  parentContext = null;
  currentTimeline;
  currentAnimateTimings = null;
  previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
  subContextCount = 0;
  options = {};
  currentQueryIndex = 0;
  currentQueryTotal = 0;
  currentStaggerTime = 0;
  constructor(_driver, element, subInstructions, _enterClassName, _leaveClassName, errors, timelines, initialTimeline) {
    this._driver = _driver;
    this.element = element;
    this.subInstructions = subInstructions;
    this._enterClassName = _enterClassName;
    this._leaveClassName = _leaveClassName;
    this.errors = errors;
    this.timelines = timelines;
    this.currentTimeline = initialTimeline || new TimelineBuilder(this._driver, element, 0);
    timelines.push(this.currentTimeline);
  }
  get params() {
    return this.options.params;
  }
  updateOptions(options, skipIfExists) {
    if (!options) return;
    const newOptions = options;
    let optionsToUpdate = this.options;
    if (newOptions.duration != null) {
      optionsToUpdate.duration = resolveTimingValue(newOptions.duration);
    }
    if (newOptions.delay != null) {
      optionsToUpdate.delay = resolveTimingValue(newOptions.delay);
    }
    const newParams = newOptions.params;
    if (newParams) {
      let paramsToUpdate = optionsToUpdate.params;
      if (!paramsToUpdate) {
        paramsToUpdate = this.options.params = {};
      }
      Object.keys(newParams).forEach((name) => {
        if (!skipIfExists || !paramsToUpdate.hasOwnProperty(name)) {
          paramsToUpdate[name] = interpolateParams(newParams[name], paramsToUpdate, this.errors);
        }
      });
    }
  }
  _copyOptions() {
    const options = {};
    if (this.options) {
      const oldParams = this.options.params;
      if (oldParams) {
        const params = options["params"] = {};
        Object.keys(oldParams).forEach((name) => {
          params[name] = oldParams[name];
        });
      }
    }
    return options;
  }
  createSubContext(options = null, element, newTime) {
    const target = element || this.element;
    const context = new _AnimationTimelineContext(this._driver, target, this.subInstructions, this._enterClassName, this._leaveClassName, this.errors, this.timelines, this.currentTimeline.fork(target, newTime || 0));
    context.previousNode = this.previousNode;
    context.currentAnimateTimings = this.currentAnimateTimings;
    context.options = this._copyOptions();
    context.updateOptions(options);
    context.currentQueryIndex = this.currentQueryIndex;
    context.currentQueryTotal = this.currentQueryTotal;
    context.parentContext = this;
    this.subContextCount++;
    return context;
  }
  transformIntoNewTimeline(newTime) {
    this.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
    this.currentTimeline = this.currentTimeline.fork(this.element, newTime);
    this.timelines.push(this.currentTimeline);
    return this.currentTimeline;
  }
  appendInstructionToTimeline(instruction, duration, delay) {
    const updatedTimings = {
      duration: duration != null ? duration : instruction.duration,
      delay: this.currentTimeline.currentTime + (delay != null ? delay : 0) + instruction.delay,
      easing: ""
    };
    const builder = new SubTimelineBuilder(this._driver, instruction.element, instruction.keyframes, instruction.preStyleProps, instruction.postStyleProps, updatedTimings, instruction.stretchStartingKeyframe);
    this.timelines.push(builder);
    return updatedTimings;
  }
  incrementTime(time) {
    this.currentTimeline.forwardTime(this.currentTimeline.duration + time);
  }
  delayNextStep(delay) {
    if (delay > 0) {
      this.currentTimeline.delayNextStep(delay);
    }
  }
  invokeQuery(selector, originalSelector, limit, includeSelf, optional, errors) {
    let results = [];
    if (includeSelf) {
      results.push(this.element);
    }
    if (selector.length > 0) {
      selector = selector.replace(ENTER_TOKEN_REGEX, "." + this._enterClassName);
      selector = selector.replace(LEAVE_TOKEN_REGEX, "." + this._leaveClassName);
      const multi = limit != 1;
      let elements = this._driver.query(this.element, selector, multi);
      if (limit !== 0) {
        elements = limit < 0 ? elements.slice(elements.length + limit, elements.length) : elements.slice(0, limit);
      }
      results.push(...elements);
    }
    if (!optional && results.length == 0) {
      errors.push(invalidQuery(originalSelector));
    }
    return results;
  }
};
var TimelineBuilder = class _TimelineBuilder {
  _driver;
  element;
  startTime;
  _elementTimelineStylesLookup;
  duration = 0;
  easing = null;
  _previousKeyframe = /* @__PURE__ */ new Map();
  _currentKeyframe = /* @__PURE__ */ new Map();
  _keyframes = /* @__PURE__ */ new Map();
  _styleSummary = /* @__PURE__ */ new Map();
  _localTimelineStyles = /* @__PURE__ */ new Map();
  _globalTimelineStyles;
  _pendingStyles = /* @__PURE__ */ new Map();
  _backFill = /* @__PURE__ */ new Map();
  _currentEmptyStepKeyframe = null;
  constructor(_driver, element, startTime, _elementTimelineStylesLookup) {
    this._driver = _driver;
    this.element = element;
    this.startTime = startTime;
    this._elementTimelineStylesLookup = _elementTimelineStylesLookup;
    if (!this._elementTimelineStylesLookup) {
      this._elementTimelineStylesLookup = /* @__PURE__ */ new Map();
    }
    this._globalTimelineStyles = this._elementTimelineStylesLookup.get(element);
    if (!this._globalTimelineStyles) {
      this._globalTimelineStyles = this._localTimelineStyles;
      this._elementTimelineStylesLookup.set(element, this._localTimelineStyles);
    }
    this._loadKeyframe();
  }
  containsAnimation() {
    switch (this._keyframes.size) {
      case 0:
        return false;
      case 1:
        return this.hasCurrentStyleProperties();
      default:
        return true;
    }
  }
  hasCurrentStyleProperties() {
    return this._currentKeyframe.size > 0;
  }
  get currentTime() {
    return this.startTime + this.duration;
  }
  delayNextStep(delay) {
    const hasPreStyleStep = this._keyframes.size === 1 && this._pendingStyles.size;
    if (this.duration || hasPreStyleStep) {
      this.forwardTime(this.currentTime + delay);
      if (hasPreStyleStep) {
        this.snapshotCurrentStyles();
      }
    } else {
      this.startTime += delay;
    }
  }
  fork(element, currentTime) {
    this.applyStylesToKeyframe();
    return new _TimelineBuilder(this._driver, element, currentTime || this.currentTime, this._elementTimelineStylesLookup);
  }
  _loadKeyframe() {
    if (this._currentKeyframe) {
      this._previousKeyframe = this._currentKeyframe;
    }
    this._currentKeyframe = this._keyframes.get(this.duration);
    if (!this._currentKeyframe) {
      this._currentKeyframe = /* @__PURE__ */ new Map();
      this._keyframes.set(this.duration, this._currentKeyframe);
    }
  }
  forwardFrame() {
    this.duration += ONE_FRAME_IN_MILLISECONDS;
    this._loadKeyframe();
  }
  forwardTime(time) {
    this.applyStylesToKeyframe();
    this.duration = time;
    this._loadKeyframe();
  }
  _updateStyle(prop, value) {
    this._localTimelineStyles.set(prop, value);
    this._globalTimelineStyles.set(prop, value);
    this._styleSummary.set(prop, {
      time: this.currentTime,
      value
    });
  }
  allowOnlyTimelineStyles() {
    return this._currentEmptyStepKeyframe !== this._currentKeyframe;
  }
  applyEmptyStep(easing) {
    if (easing) {
      this._previousKeyframe.set("easing", easing);
    }
    for (let [prop, value] of this._globalTimelineStyles) {
      this._backFill.set(prop, value || AUTO_STYLE);
      this._currentKeyframe.set(prop, AUTO_STYLE);
    }
    this._currentEmptyStepKeyframe = this._currentKeyframe;
  }
  setStyles(input, easing, errors, options) {
    if (easing) {
      this._previousKeyframe.set("easing", easing);
    }
    const params = options && options.params || {};
    const styles = flattenStyles(input, this._globalTimelineStyles);
    for (let [prop, value] of styles) {
      const val = interpolateParams(value, params, errors);
      this._pendingStyles.set(prop, val);
      if (!this._localTimelineStyles.has(prop)) {
        this._backFill.set(prop, this._globalTimelineStyles.get(prop) ?? AUTO_STYLE);
      }
      this._updateStyle(prop, val);
    }
  }
  applyStylesToKeyframe() {
    if (this._pendingStyles.size == 0) return;
    this._pendingStyles.forEach((val, prop) => {
      this._currentKeyframe.set(prop, val);
    });
    this._pendingStyles.clear();
    this._localTimelineStyles.forEach((val, prop) => {
      if (!this._currentKeyframe.has(prop)) {
        this._currentKeyframe.set(prop, val);
      }
    });
  }
  snapshotCurrentStyles() {
    for (let [prop, val] of this._localTimelineStyles) {
      this._pendingStyles.set(prop, val);
      this._updateStyle(prop, val);
    }
  }
  getFinalKeyframe() {
    return this._keyframes.get(this.duration);
  }
  get properties() {
    const properties = [];
    for (let prop in this._currentKeyframe) {
      properties.push(prop);
    }
    return properties;
  }
  mergeTimelineCollectedStyles(timeline) {
    timeline._styleSummary.forEach((details1, prop) => {
      const details0 = this._styleSummary.get(prop);
      if (!details0 || details1.time > details0.time) {
        this._updateStyle(prop, details1.value);
      }
    });
  }
  buildKeyframes() {
    this.applyStylesToKeyframe();
    const preStyleProps = /* @__PURE__ */ new Set();
    const postStyleProps = /* @__PURE__ */ new Set();
    const isEmpty = this._keyframes.size === 1 && this.duration === 0;
    let finalKeyframes = [];
    this._keyframes.forEach((keyframe, time) => {
      const finalKeyframe = new Map([...this._backFill, ...keyframe]);
      finalKeyframe.forEach((value, prop) => {
        if (value === \u0275PRE_STYLE) {
          preStyleProps.add(prop);
        } else if (value === AUTO_STYLE) {
          postStyleProps.add(prop);
        }
      });
      if (!isEmpty) {
        finalKeyframe.set("offset", time / this.duration);
      }
      finalKeyframes.push(finalKeyframe);
    });
    const preProps = [...preStyleProps.values()];
    const postProps = [...postStyleProps.values()];
    if (isEmpty) {
      const kf0 = finalKeyframes[0];
      const kf1 = new Map(kf0);
      kf0.set("offset", 0);
      kf1.set("offset", 1);
      finalKeyframes = [kf0, kf1];
    }
    return createTimelineInstruction(this.element, finalKeyframes, preProps, postProps, this.duration, this.startTime, this.easing, false);
  }
};
var SubTimelineBuilder = class extends TimelineBuilder {
  keyframes;
  preStyleProps;
  postStyleProps;
  _stretchStartingKeyframe;
  timings;
  constructor(driver, element, keyframes, preStyleProps, postStyleProps, timings, _stretchStartingKeyframe = false) {
    super(driver, element, timings.delay);
    this.keyframes = keyframes;
    this.preStyleProps = preStyleProps;
    this.postStyleProps = postStyleProps;
    this._stretchStartingKeyframe = _stretchStartingKeyframe;
    this.timings = {
      duration: timings.duration,
      delay: timings.delay,
      easing: timings.easing
    };
  }
  containsAnimation() {
    return this.keyframes.length > 1;
  }
  buildKeyframes() {
    let keyframes = this.keyframes;
    let {
      delay,
      duration,
      easing
    } = this.timings;
    if (this._stretchStartingKeyframe && delay) {
      const newKeyframes = [];
      const totalTime = duration + delay;
      const startingGap = delay / totalTime;
      const newFirstKeyframe = new Map(keyframes[0]);
      newFirstKeyframe.set("offset", 0);
      newKeyframes.push(newFirstKeyframe);
      const oldFirstKeyframe = new Map(keyframes[0]);
      oldFirstKeyframe.set("offset", roundOffset(startingGap));
      newKeyframes.push(oldFirstKeyframe);
      const limit = keyframes.length - 1;
      for (let i = 1; i <= limit; i++) {
        let kf = new Map(keyframes[i]);
        const oldOffset = kf.get("offset");
        const timeAtKeyframe = delay + oldOffset * duration;
        kf.set("offset", roundOffset(timeAtKeyframe / totalTime));
        newKeyframes.push(kf);
      }
      duration = totalTime;
      delay = 0;
      easing = "";
      keyframes = newKeyframes;
    }
    return createTimelineInstruction(this.element, keyframes, this.preStyleProps, this.postStyleProps, duration, delay, easing, true);
  }
};
function roundOffset(offset, decimalPoints = 3) {
  const mult = Math.pow(10, decimalPoints - 1);
  return Math.round(offset * mult) / mult;
}
function flattenStyles(input, allStyles) {
  const styles = /* @__PURE__ */ new Map();
  let allProperties;
  input.forEach((token) => {
    if (token === "*") {
      allProperties ??= allStyles.keys();
      for (let prop of allProperties) {
        styles.set(prop, AUTO_STYLE);
      }
    } else {
      for (let [prop, val] of token) {
        styles.set(prop, val);
      }
    }
  });
  return styles;
}
function createTransitionInstruction(element, triggerName, fromState, toState, isRemovalTransition, fromStyles, toStyles, timelines, queriedElements, preStyleProps, postStyleProps, totalTime, errors) {
  return {
    type: 0,
    element,
    triggerName,
    isRemovalTransition,
    fromState,
    fromStyles,
    toState,
    toStyles,
    timelines,
    queriedElements,
    preStyleProps,
    postStyleProps,
    totalTime,
    errors
  };
}
var EMPTY_OBJECT = {};
var AnimationTransitionFactory = class {
  _triggerName;
  ast;
  _stateStyles;
  constructor(_triggerName, ast, _stateStyles) {
    this._triggerName = _triggerName;
    this.ast = ast;
    this._stateStyles = _stateStyles;
  }
  match(currentState, nextState, element, params) {
    return oneOrMoreTransitionsMatch(this.ast.matchers, currentState, nextState, element, params);
  }
  buildStyles(stateName, params, errors) {
    let styler = this._stateStyles.get("*");
    if (stateName !== void 0) {
      styler = this._stateStyles.get(stateName?.toString()) || styler;
    }
    return styler ? styler.buildStyles(params, errors) : /* @__PURE__ */ new Map();
  }
  build(driver, element, currentState, nextState, enterClassName, leaveClassName, currentOptions, nextOptions, subInstructions, skipAstBuild) {
    const errors = [];
    const transitionAnimationParams = this.ast.options && this.ast.options.params || EMPTY_OBJECT;
    const currentAnimationParams = currentOptions && currentOptions.params || EMPTY_OBJECT;
    const currentStateStyles = this.buildStyles(currentState, currentAnimationParams, errors);
    const nextAnimationParams = nextOptions && nextOptions.params || EMPTY_OBJECT;
    const nextStateStyles = this.buildStyles(nextState, nextAnimationParams, errors);
    const queriedElements = /* @__PURE__ */ new Set();
    const preStyleMap = /* @__PURE__ */ new Map();
    const postStyleMap = /* @__PURE__ */ new Map();
    const isRemoval = nextState === "void";
    const animationOptions = {
      params: applyParamDefaults(nextAnimationParams, transitionAnimationParams),
      delay: this.ast.options?.delay
    };
    const timelines = skipAstBuild ? [] : buildAnimationTimelines(driver, element, this.ast.animation, enterClassName, leaveClassName, currentStateStyles, nextStateStyles, animationOptions, subInstructions, errors);
    let totalTime = 0;
    timelines.forEach((tl) => {
      totalTime = Math.max(tl.duration + tl.delay, totalTime);
    });
    if (errors.length) {
      return createTransitionInstruction(element, this._triggerName, currentState, nextState, isRemoval, currentStateStyles, nextStateStyles, [], [], preStyleMap, postStyleMap, totalTime, errors);
    }
    timelines.forEach((tl) => {
      const elm = tl.element;
      const preProps = getOrSetDefaultValue(preStyleMap, elm, /* @__PURE__ */ new Set());
      tl.preStyleProps.forEach((prop) => preProps.add(prop));
      const postProps = getOrSetDefaultValue(postStyleMap, elm, /* @__PURE__ */ new Set());
      tl.postStyleProps.forEach((prop) => postProps.add(prop));
      if (elm !== element) {
        queriedElements.add(elm);
      }
    });
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      checkNonAnimatableInTimelines(timelines, this._triggerName, driver);
    }
    return createTransitionInstruction(element, this._triggerName, currentState, nextState, isRemoval, currentStateStyles, nextStateStyles, timelines, [...queriedElements.values()], preStyleMap, postStyleMap, totalTime);
  }
};
function checkNonAnimatableInTimelines(timelines, triggerName, driver) {
  if (!driver.validateAnimatableStyleProperty) {
    return;
  }
  const allowedNonAnimatableProps = /* @__PURE__ */ new Set([
    // 'easing' is a utility/synthetic prop we use to represent
    // easing functions, it represents a property of the animation
    // which is not animatable but different values can be used
    // in different steps
    "easing"
  ]);
  const invalidNonAnimatableProps = /* @__PURE__ */ new Set();
  timelines.forEach(({
    keyframes
  }) => {
    const nonAnimatablePropsInitialValues = /* @__PURE__ */ new Map();
    keyframes.forEach((keyframe) => {
      const entriesToCheck = Array.from(keyframe.entries()).filter(([prop]) => !allowedNonAnimatableProps.has(prop));
      for (const [prop, value] of entriesToCheck) {
        if (!driver.validateAnimatableStyleProperty(prop)) {
          if (nonAnimatablePropsInitialValues.has(prop) && !invalidNonAnimatableProps.has(prop)) {
            const propInitialValue = nonAnimatablePropsInitialValues.get(prop);
            if (propInitialValue !== value) {
              invalidNonAnimatableProps.add(prop);
            }
          } else {
            nonAnimatablePropsInitialValues.set(prop, value);
          }
        }
      }
    });
  });
  if (invalidNonAnimatableProps.size > 0) {
    console.warn(`Warning: The animation trigger "${triggerName}" is attempting to animate the following not animatable properties: ` + Array.from(invalidNonAnimatableProps).join(", ") + "\n(to check the list of all animatable properties visit https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties)");
  }
}
function oneOrMoreTransitionsMatch(matchFns, currentState, nextState, element, params) {
  return matchFns.some((fn) => fn(currentState, nextState, element, params));
}
function applyParamDefaults(userParams, defaults) {
  const result = __spreadValues({}, defaults);
  Object.entries(userParams).forEach(([key, value]) => {
    if (value != null) {
      result[key] = value;
    }
  });
  return result;
}
var AnimationStateStyles = class {
  styles;
  defaultParams;
  normalizer;
  constructor(styles, defaultParams, normalizer) {
    this.styles = styles;
    this.defaultParams = defaultParams;
    this.normalizer = normalizer;
  }
  buildStyles(params, errors) {
    const finalStyles = /* @__PURE__ */ new Map();
    const combinedParams = applyParamDefaults(params, this.defaultParams);
    this.styles.styles.forEach((value) => {
      if (typeof value !== "string") {
        value.forEach((val, prop) => {
          if (val) {
            val = interpolateParams(val, combinedParams, errors);
          }
          const normalizedProp = this.normalizer.normalizePropertyName(prop, errors);
          val = this.normalizer.normalizeStyleValue(prop, normalizedProp, val, errors);
          finalStyles.set(prop, val);
        });
      }
    });
    return finalStyles;
  }
};
function buildTrigger(name, ast, normalizer) {
  return new AnimationTrigger(name, ast, normalizer);
}
var AnimationTrigger = class {
  name;
  ast;
  _normalizer;
  transitionFactories = [];
  fallbackTransition;
  states = /* @__PURE__ */ new Map();
  constructor(name, ast, _normalizer) {
    this.name = name;
    this.ast = ast;
    this._normalizer = _normalizer;
    ast.states.forEach((ast2) => {
      const defaultParams = ast2.options && ast2.options.params || {};
      this.states.set(ast2.name, new AnimationStateStyles(ast2.style, defaultParams, _normalizer));
    });
    balanceProperties(this.states, "true", "1");
    balanceProperties(this.states, "false", "0");
    ast.transitions.forEach((ast2) => {
      this.transitionFactories.push(new AnimationTransitionFactory(name, ast2, this.states));
    });
    this.fallbackTransition = createFallbackTransition(name, this.states);
  }
  get containsQueries() {
    return this.ast.queryCount > 0;
  }
  matchTransition(currentState, nextState, element, params) {
    const entry = this.transitionFactories.find((f) => f.match(currentState, nextState, element, params));
    return entry || null;
  }
  matchStyles(currentState, params, errors) {
    return this.fallbackTransition.buildStyles(currentState, params, errors);
  }
};
function createFallbackTransition(triggerName, states, normalizer) {
  const matchers = [(fromState, toState) => true];
  const animation = {
    type: AnimationMetadataType.Sequence,
    steps: [],
    options: null
  };
  const transition = {
    type: AnimationMetadataType.Transition,
    animation,
    matchers,
    options: null,
    queryCount: 0,
    depCount: 0
  };
  return new AnimationTransitionFactory(triggerName, transition, states);
}
function balanceProperties(stateMap, key1, key2) {
  if (stateMap.has(key1)) {
    if (!stateMap.has(key2)) {
      stateMap.set(key2, stateMap.get(key1));
    }
  } else if (stateMap.has(key2)) {
    stateMap.set(key1, stateMap.get(key2));
  }
}
var EMPTY_INSTRUCTION_MAP = /* @__PURE__ */ new ElementInstructionMap();
var TimelineAnimationEngine = class {
  bodyNode;
  _driver;
  _normalizer;
  _animations = /* @__PURE__ */ new Map();
  _playersById = /* @__PURE__ */ new Map();
  players = [];
  constructor(bodyNode, _driver, _normalizer) {
    this.bodyNode = bodyNode;
    this._driver = _driver;
    this._normalizer = _normalizer;
  }
  register(id, metadata) {
    const errors = [];
    const warnings = [];
    const ast = buildAnimationAst(this._driver, metadata, errors, warnings);
    if (errors.length) {
      throw registerFailed(errors);
    } else {
      if (typeof ngDevMode === "undefined" || ngDevMode) {
        if (warnings.length) {
          warnRegister(warnings);
        }
      }
      this._animations.set(id, ast);
    }
  }
  _buildPlayer(i, preStyles, postStyles) {
    const element = i.element;
    const keyframes = normalizeKeyframes$1(this._normalizer, i.keyframes, preStyles, postStyles);
    return this._driver.animate(element, keyframes, i.duration, i.delay, i.easing, [], true);
  }
  create(id, element, options = {}) {
    const errors = [];
    const ast = this._animations.get(id);
    let instructions;
    const autoStylesMap = /* @__PURE__ */ new Map();
    if (ast) {
      instructions = buildAnimationTimelines(this._driver, element, ast, ENTER_CLASSNAME, LEAVE_CLASSNAME, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Map(), options, EMPTY_INSTRUCTION_MAP, errors);
      instructions.forEach((inst) => {
        const styles = getOrSetDefaultValue(autoStylesMap, inst.element, /* @__PURE__ */ new Map());
        inst.postStyleProps.forEach((prop) => styles.set(prop, null));
      });
    } else {
      errors.push(missingOrDestroyedAnimation());
      instructions = [];
    }
    if (errors.length) {
      throw createAnimationFailed(errors);
    }
    autoStylesMap.forEach((styles, element2) => {
      styles.forEach((_, prop) => {
        styles.set(prop, this._driver.computeStyle(element2, prop, AUTO_STYLE));
      });
    });
    const players = instructions.map((i) => {
      const styles = autoStylesMap.get(i.element);
      return this._buildPlayer(i, /* @__PURE__ */ new Map(), styles);
    });
    const player = optimizeGroupPlayer(players);
    this._playersById.set(id, player);
    player.onDestroy(() => this.destroy(id));
    this.players.push(player);
    return player;
  }
  destroy(id) {
    const player = this._getPlayer(id);
    player.destroy();
    this._playersById.delete(id);
    const index = this.players.indexOf(player);
    if (index >= 0) {
      this.players.splice(index, 1);
    }
  }
  _getPlayer(id) {
    const player = this._playersById.get(id);
    if (!player) {
      throw missingPlayer(id);
    }
    return player;
  }
  listen(id, element, eventName, callback) {
    const baseEvent = makeAnimationEvent(element, "", "", "");
    listenOnPlayer(this._getPlayer(id), eventName, baseEvent, callback);
    return () => {
    };
  }
  command(id, element, command, args) {
    if (command == "register") {
      this.register(id, args[0]);
      return;
    }
    if (command == "create") {
      const options = args[0] || {};
      this.create(id, element, options);
      return;
    }
    const player = this._getPlayer(id);
    switch (command) {
      case "play":
        player.play();
        break;
      case "pause":
        player.pause();
        break;
      case "reset":
        player.reset();
        break;
      case "restart":
        player.restart();
        break;
      case "finish":
        player.finish();
        break;
      case "init":
        player.init();
        break;
      case "setPosition":
        player.setPosition(parseFloat(args[0]));
        break;
      case "destroy":
        this.destroy(id);
        break;
    }
  }
};
var QUEUED_CLASSNAME = "ng-animate-queued";
var QUEUED_SELECTOR = ".ng-animate-queued";
var DISABLED_CLASSNAME = "ng-animate-disabled";
var DISABLED_SELECTOR = ".ng-animate-disabled";
var STAR_CLASSNAME = "ng-star-inserted";
var STAR_SELECTOR = ".ng-star-inserted";
var EMPTY_PLAYER_ARRAY = [];
var NULL_REMOVAL_STATE = {
  namespaceId: "",
  setForRemoval: false,
  setForMove: false,
  hasAnimation: false,
  removedBeforeQueried: false
};
var NULL_REMOVED_QUERIED_STATE = {
  namespaceId: "",
  setForMove: false,
  setForRemoval: false,
  hasAnimation: false,
  removedBeforeQueried: true
};
var REMOVAL_FLAG = "__ng_removed";
var StateValue = class {
  namespaceId;
  value;
  options;
  get params() {
    return this.options.params;
  }
  constructor(input, namespaceId = "") {
    this.namespaceId = namespaceId;
    const isObj = input && input.hasOwnProperty("value");
    const value = isObj ? input["value"] : input;
    this.value = normalizeTriggerValue(value);
    if (isObj) {
      const _a = input, {
        value: value2
      } = _a, options = __objRest(_a, [
        "value"
      ]);
      this.options = options;
    } else {
      this.options = {};
    }
    if (!this.options.params) {
      this.options.params = {};
    }
  }
  absorbOptions(options) {
    const newParams = options.params;
    if (newParams) {
      const oldParams = this.options.params;
      Object.keys(newParams).forEach((prop) => {
        if (oldParams[prop] == null) {
          oldParams[prop] = newParams[prop];
        }
      });
    }
  }
};
var VOID_VALUE = "void";
var DEFAULT_STATE_VALUE = /* @__PURE__ */ new StateValue(VOID_VALUE);
var AnimationTransitionNamespace = class {
  id;
  hostElement;
  _engine;
  players = [];
  _triggers = /* @__PURE__ */ new Map();
  _queue = [];
  _elementListeners = /* @__PURE__ */ new Map();
  _hostClassName;
  constructor(id, hostElement, _engine) {
    this.id = id;
    this.hostElement = hostElement;
    this._engine = _engine;
    this._hostClassName = "ng-tns-" + id;
    addClass(hostElement, this._hostClassName);
  }
  listen(element, name, phase, callback) {
    if (!this._triggers.has(name)) {
      throw missingTrigger(phase, name);
    }
    if (phase == null || phase.length == 0) {
      throw missingEvent(name);
    }
    if (!isTriggerEventValid(phase)) {
      throw unsupportedTriggerEvent(phase, name);
    }
    const listeners = getOrSetDefaultValue(this._elementListeners, element, []);
    const data = {
      name,
      phase,
      callback
    };
    listeners.push(data);
    const triggersWithStates = getOrSetDefaultValue(this._engine.statesByElement, element, /* @__PURE__ */ new Map());
    if (!triggersWithStates.has(name)) {
      addClass(element, NG_TRIGGER_CLASSNAME);
      addClass(element, NG_TRIGGER_CLASSNAME + "-" + name);
      triggersWithStates.set(name, DEFAULT_STATE_VALUE);
    }
    return () => {
      this._engine.afterFlush(() => {
        const index = listeners.indexOf(data);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
        if (!this._triggers.has(name)) {
          triggersWithStates.delete(name);
        }
      });
    };
  }
  register(name, ast) {
    if (this._triggers.has(name)) {
      return false;
    } else {
      this._triggers.set(name, ast);
      return true;
    }
  }
  _getTrigger(name) {
    const trigger = this._triggers.get(name);
    if (!trigger) {
      throw unregisteredTrigger(name);
    }
    return trigger;
  }
  trigger(element, triggerName, value, defaultToFallback = true) {
    const trigger = this._getTrigger(triggerName);
    const player = new TransitionAnimationPlayer(this.id, triggerName, element);
    let triggersWithStates = this._engine.statesByElement.get(element);
    if (!triggersWithStates) {
      addClass(element, NG_TRIGGER_CLASSNAME);
      addClass(element, NG_TRIGGER_CLASSNAME + "-" + triggerName);
      this._engine.statesByElement.set(element, triggersWithStates = /* @__PURE__ */ new Map());
    }
    let fromState = triggersWithStates.get(triggerName);
    const toState = new StateValue(value, this.id);
    const isObj = value && value.hasOwnProperty("value");
    if (!isObj && fromState) {
      toState.absorbOptions(fromState.options);
    }
    triggersWithStates.set(triggerName, toState);
    if (!fromState) {
      fromState = DEFAULT_STATE_VALUE;
    }
    const isRemoval = toState.value === VOID_VALUE;
    if (!isRemoval && fromState.value === toState.value) {
      if (!objEquals(fromState.params, toState.params)) {
        const errors = [];
        const fromStyles = trigger.matchStyles(fromState.value, fromState.params, errors);
        const toStyles = trigger.matchStyles(toState.value, toState.params, errors);
        if (errors.length) {
          this._engine.reportError(errors);
        } else {
          this._engine.afterFlush(() => {
            eraseStyles(element, fromStyles);
            setStyles(element, toStyles);
          });
        }
      }
      return;
    }
    const playersOnElement = getOrSetDefaultValue(this._engine.playersByElement, element, []);
    playersOnElement.forEach((player2) => {
      if (player2.namespaceId == this.id && player2.triggerName == triggerName && player2.queued) {
        player2.destroy();
      }
    });
    let transition = trigger.matchTransition(fromState.value, toState.value, element, toState.params);
    let isFallbackTransition = false;
    if (!transition) {
      if (!defaultToFallback) return;
      transition = trigger.fallbackTransition;
      isFallbackTransition = true;
    }
    this._engine.totalQueuedPlayers++;
    this._queue.push({
      element,
      triggerName,
      transition,
      fromState,
      toState,
      player,
      isFallbackTransition
    });
    if (!isFallbackTransition) {
      addClass(element, QUEUED_CLASSNAME);
      player.onStart(() => {
        removeClass(element, QUEUED_CLASSNAME);
      });
    }
    player.onDone(() => {
      let index = this.players.indexOf(player);
      if (index >= 0) {
        this.players.splice(index, 1);
      }
      const players = this._engine.playersByElement.get(element);
      if (players) {
        let index2 = players.indexOf(player);
        if (index2 >= 0) {
          players.splice(index2, 1);
        }
      }
    });
    this.players.push(player);
    playersOnElement.push(player);
    return player;
  }
  deregister(name) {
    this._triggers.delete(name);
    this._engine.statesByElement.forEach((stateMap) => stateMap.delete(name));
    this._elementListeners.forEach((listeners, element) => {
      this._elementListeners.set(element, listeners.filter((entry) => {
        return entry.name != name;
      }));
    });
  }
  clearElementCache(element) {
    this._engine.statesByElement.delete(element);
    this._elementListeners.delete(element);
    const elementPlayers = this._engine.playersByElement.get(element);
    if (elementPlayers) {
      elementPlayers.forEach((player) => player.destroy());
      this._engine.playersByElement.delete(element);
    }
  }
  _signalRemovalForInnerTriggers(rootElement, context) {
    const elements = this._engine.driver.query(rootElement, NG_TRIGGER_SELECTOR, true);
    elements.forEach((elm) => {
      if (elm[REMOVAL_FLAG]) return;
      const namespaces = this._engine.fetchNamespacesByElement(elm);
      if (namespaces.size) {
        namespaces.forEach((ns) => ns.triggerLeaveAnimation(elm, context, false, true));
      } else {
        this.clearElementCache(elm);
      }
    });
    this._engine.afterFlushAnimationsDone(() => elements.forEach((elm) => this.clearElementCache(elm)));
  }
  triggerLeaveAnimation(element, context, destroyAfterComplete, defaultToFallback) {
    const triggerStates = this._engine.statesByElement.get(element);
    const previousTriggersValues = /* @__PURE__ */ new Map();
    if (triggerStates) {
      const players = [];
      triggerStates.forEach((state, triggerName) => {
        previousTriggersValues.set(triggerName, state.value);
        if (this._triggers.has(triggerName)) {
          const player = this.trigger(element, triggerName, VOID_VALUE, defaultToFallback);
          if (player) {
            players.push(player);
          }
        }
      });
      if (players.length) {
        this._engine.markElementAsRemoved(this.id, element, true, context, previousTriggersValues);
        if (destroyAfterComplete) {
          optimizeGroupPlayer(players).onDone(() => this._engine.processLeaveNode(element));
        }
        return true;
      }
    }
    return false;
  }
  prepareLeaveAnimationListeners(element) {
    const listeners = this._elementListeners.get(element);
    const elementStates = this._engine.statesByElement.get(element);
    if (listeners && elementStates) {
      const visitedTriggers = /* @__PURE__ */ new Set();
      listeners.forEach((listener) => {
        const triggerName = listener.name;
        if (visitedTriggers.has(triggerName)) return;
        visitedTriggers.add(triggerName);
        const trigger = this._triggers.get(triggerName);
        const transition = trigger.fallbackTransition;
        const fromState = elementStates.get(triggerName) || DEFAULT_STATE_VALUE;
        const toState = new StateValue(VOID_VALUE);
        const player = new TransitionAnimationPlayer(this.id, triggerName, element);
        this._engine.totalQueuedPlayers++;
        this._queue.push({
          element,
          triggerName,
          transition,
          fromState,
          toState,
          player,
          isFallbackTransition: true
        });
      });
    }
  }
  removeNode(element, context) {
    const engine = this._engine;
    if (element.childElementCount) {
      this._signalRemovalForInnerTriggers(element, context);
    }
    if (this.triggerLeaveAnimation(element, context, true)) return;
    let containsPotentialParentTransition = false;
    if (engine.totalAnimations) {
      const currentPlayers = engine.players.length ? engine.playersByQueriedElement.get(element) : [];
      if (currentPlayers && currentPlayers.length) {
        containsPotentialParentTransition = true;
      } else {
        let parent = element;
        while (parent = parent.parentNode) {
          const triggers = engine.statesByElement.get(parent);
          if (triggers) {
            containsPotentialParentTransition = true;
            break;
          }
        }
      }
    }
    this.prepareLeaveAnimationListeners(element);
    if (containsPotentialParentTransition) {
      engine.markElementAsRemoved(this.id, element, false, context);
    } else {
      const removalFlag = element[REMOVAL_FLAG];
      if (!removalFlag || removalFlag === NULL_REMOVAL_STATE) {
        engine.afterFlush(() => this.clearElementCache(element));
        engine.destroyInnerAnimations(element);
        engine._onRemovalComplete(element, context);
      }
    }
  }
  insertNode(element, parent) {
    addClass(element, this._hostClassName);
  }
  drainQueuedTransitions(microtaskId) {
    const instructions = [];
    this._queue.forEach((entry) => {
      const player = entry.player;
      if (player.destroyed) return;
      const element = entry.element;
      const listeners = this._elementListeners.get(element);
      if (listeners) {
        listeners.forEach((listener) => {
          if (listener.name == entry.triggerName) {
            const baseEvent = makeAnimationEvent(element, entry.triggerName, entry.fromState.value, entry.toState.value);
            baseEvent["_data"] = microtaskId;
            listenOnPlayer(entry.player, listener.phase, baseEvent, listener.callback);
          }
        });
      }
      if (player.markedForDestroy) {
        this._engine.afterFlush(() => {
          player.destroy();
        });
      } else {
        instructions.push(entry);
      }
    });
    this._queue = [];
    return instructions.sort((a, b) => {
      const d0 = a.transition.ast.depCount;
      const d1 = b.transition.ast.depCount;
      if (d0 == 0 || d1 == 0) {
        return d0 - d1;
      }
      return this._engine.driver.containsElement(a.element, b.element) ? 1 : -1;
    });
  }
  destroy(context) {
    this.players.forEach((p) => p.destroy());
    this._signalRemovalForInnerTriggers(this.hostElement, context);
  }
};
var TransitionAnimationEngine = class {
  bodyNode;
  driver;
  _normalizer;
  players = [];
  newHostElements = /* @__PURE__ */ new Map();
  playersByElement = /* @__PURE__ */ new Map();
  playersByQueriedElement = /* @__PURE__ */ new Map();
  statesByElement = /* @__PURE__ */ new Map();
  disabledNodes = /* @__PURE__ */ new Set();
  totalAnimations = 0;
  totalQueuedPlayers = 0;
  _namespaceLookup = {};
  _namespaceList = [];
  _flushFns = [];
  _whenQuietFns = [];
  namespacesByHostElement = /* @__PURE__ */ new Map();
  collectedEnterElements = [];
  collectedLeaveElements = [];
  // this method is designed to be overridden by the code that uses this engine
  onRemovalComplete = (element, context) => {
  };
  /** @internal */
  _onRemovalComplete(element, context) {
    this.onRemovalComplete(element, context);
  }
  constructor(bodyNode, driver, _normalizer) {
    this.bodyNode = bodyNode;
    this.driver = driver;
    this._normalizer = _normalizer;
  }
  get queuedPlayers() {
    const players = [];
    this._namespaceList.forEach((ns) => {
      ns.players.forEach((player) => {
        if (player.queued) {
          players.push(player);
        }
      });
    });
    return players;
  }
  createNamespace(namespaceId, hostElement) {
    const ns = new AnimationTransitionNamespace(namespaceId, hostElement, this);
    if (this.bodyNode && this.driver.containsElement(this.bodyNode, hostElement)) {
      this._balanceNamespaceList(ns, hostElement);
    } else {
      this.newHostElements.set(hostElement, ns);
      this.collectEnterElement(hostElement);
    }
    return this._namespaceLookup[namespaceId] = ns;
  }
  _balanceNamespaceList(ns, hostElement) {
    const namespaceList = this._namespaceList;
    const namespacesByHostElement = this.namespacesByHostElement;
    const limit = namespaceList.length - 1;
    if (limit >= 0) {
      let found = false;
      let ancestor = this.driver.getParentElement(hostElement);
      while (ancestor) {
        const ancestorNs = namespacesByHostElement.get(ancestor);
        if (ancestorNs) {
          const index = namespaceList.indexOf(ancestorNs);
          namespaceList.splice(index + 1, 0, ns);
          found = true;
          break;
        }
        ancestor = this.driver.getParentElement(ancestor);
      }
      if (!found) {
        namespaceList.unshift(ns);
      }
    } else {
      namespaceList.push(ns);
    }
    namespacesByHostElement.set(hostElement, ns);
    return ns;
  }
  register(namespaceId, hostElement) {
    let ns = this._namespaceLookup[namespaceId];
    if (!ns) {
      ns = this.createNamespace(namespaceId, hostElement);
    }
    return ns;
  }
  registerTrigger(namespaceId, name, trigger) {
    let ns = this._namespaceLookup[namespaceId];
    if (ns && ns.register(name, trigger)) {
      this.totalAnimations++;
    }
  }
  destroy(namespaceId, context) {
    if (!namespaceId) return;
    this.afterFlush(() => {
    });
    this.afterFlushAnimationsDone(() => {
      const ns = this._fetchNamespace(namespaceId);
      this.namespacesByHostElement.delete(ns.hostElement);
      const index = this._namespaceList.indexOf(ns);
      if (index >= 0) {
        this._namespaceList.splice(index, 1);
      }
      ns.destroy(context);
      delete this._namespaceLookup[namespaceId];
    });
  }
  _fetchNamespace(id) {
    return this._namespaceLookup[id];
  }
  fetchNamespacesByElement(element) {
    const namespaces = /* @__PURE__ */ new Set();
    const elementStates = this.statesByElement.get(element);
    if (elementStates) {
      for (let stateValue of elementStates.values()) {
        if (stateValue.namespaceId) {
          const ns = this._fetchNamespace(stateValue.namespaceId);
          if (ns) {
            namespaces.add(ns);
          }
        }
      }
    }
    return namespaces;
  }
  trigger(namespaceId, element, name, value) {
    if (isElementNode(element)) {
      const ns = this._fetchNamespace(namespaceId);
      if (ns) {
        ns.trigger(element, name, value);
        return true;
      }
    }
    return false;
  }
  insertNode(namespaceId, element, parent, insertBefore) {
    if (!isElementNode(element)) return;
    const details = element[REMOVAL_FLAG];
    if (details && details.setForRemoval) {
      details.setForRemoval = false;
      details.setForMove = true;
      const index = this.collectedLeaveElements.indexOf(element);
      if (index >= 0) {
        this.collectedLeaveElements.splice(index, 1);
      }
    }
    if (namespaceId) {
      const ns = this._fetchNamespace(namespaceId);
      if (ns) {
        ns.insertNode(element, parent);
      }
    }
    if (insertBefore) {
      this.collectEnterElement(element);
    }
  }
  collectEnterElement(element) {
    this.collectedEnterElements.push(element);
  }
  markElementAsDisabled(element, value) {
    if (value) {
      if (!this.disabledNodes.has(element)) {
        this.disabledNodes.add(element);
        addClass(element, DISABLED_CLASSNAME);
      }
    } else if (this.disabledNodes.has(element)) {
      this.disabledNodes.delete(element);
      removeClass(element, DISABLED_CLASSNAME);
    }
  }
  removeNode(namespaceId, element, context) {
    if (isElementNode(element)) {
      const ns = namespaceId ? this._fetchNamespace(namespaceId) : null;
      if (ns) {
        ns.removeNode(element, context);
      } else {
        this.markElementAsRemoved(namespaceId, element, false, context);
      }
      const hostNS = this.namespacesByHostElement.get(element);
      if (hostNS && hostNS.id !== namespaceId) {
        hostNS.removeNode(element, context);
      }
    } else {
      this._onRemovalComplete(element, context);
    }
  }
  markElementAsRemoved(namespaceId, element, hasAnimation, context, previousTriggersValues) {
    this.collectedLeaveElements.push(element);
    element[REMOVAL_FLAG] = {
      namespaceId,
      setForRemoval: context,
      hasAnimation,
      removedBeforeQueried: false,
      previousTriggersValues
    };
  }
  listen(namespaceId, element, name, phase, callback) {
    if (isElementNode(element)) {
      return this._fetchNamespace(namespaceId).listen(element, name, phase, callback);
    }
    return () => {
    };
  }
  _buildInstruction(entry, subTimelines, enterClassName, leaveClassName, skipBuildAst) {
    return entry.transition.build(this.driver, entry.element, entry.fromState.value, entry.toState.value, enterClassName, leaveClassName, entry.fromState.options, entry.toState.options, subTimelines, skipBuildAst);
  }
  destroyInnerAnimations(containerElement) {
    let elements = this.driver.query(containerElement, NG_TRIGGER_SELECTOR, true);
    elements.forEach((element) => this.destroyActiveAnimationsForElement(element));
    if (this.playersByQueriedElement.size == 0) return;
    elements = this.driver.query(containerElement, NG_ANIMATING_SELECTOR, true);
    elements.forEach((element) => this.finishActiveQueriedAnimationOnElement(element));
  }
  destroyActiveAnimationsForElement(element) {
    const players = this.playersByElement.get(element);
    if (players) {
      players.forEach((player) => {
        if (player.queued) {
          player.markedForDestroy = true;
        } else {
          player.destroy();
        }
      });
    }
  }
  finishActiveQueriedAnimationOnElement(element) {
    const players = this.playersByQueriedElement.get(element);
    if (players) {
      players.forEach((player) => player.finish());
    }
  }
  whenRenderingDone() {
    return new Promise((resolve) => {
      if (this.players.length) {
        return optimizeGroupPlayer(this.players).onDone(() => resolve());
      } else {
        resolve();
      }
    });
  }
  processLeaveNode(element) {
    const details = element[REMOVAL_FLAG];
    if (details && details.setForRemoval) {
      element[REMOVAL_FLAG] = NULL_REMOVAL_STATE;
      if (details.namespaceId) {
        this.destroyInnerAnimations(element);
        const ns = this._fetchNamespace(details.namespaceId);
        if (ns) {
          ns.clearElementCache(element);
        }
      }
      this._onRemovalComplete(element, details.setForRemoval);
    }
    if (element.classList?.contains(DISABLED_CLASSNAME)) {
      this.markElementAsDisabled(element, false);
    }
    this.driver.query(element, DISABLED_SELECTOR, true).forEach((node) => {
      this.markElementAsDisabled(node, false);
    });
  }
  flush(microtaskId = -1) {
    let players = [];
    if (this.newHostElements.size) {
      this.newHostElements.forEach((ns, element) => this._balanceNamespaceList(ns, element));
      this.newHostElements.clear();
    }
    if (this.totalAnimations && this.collectedEnterElements.length) {
      for (let i = 0; i < this.collectedEnterElements.length; i++) {
        const elm = this.collectedEnterElements[i];
        addClass(elm, STAR_CLASSNAME);
      }
    }
    if (this._namespaceList.length && (this.totalQueuedPlayers || this.collectedLeaveElements.length)) {
      const cleanupFns = [];
      try {
        players = this._flushAnimations(cleanupFns, microtaskId);
      } finally {
        for (let i = 0; i < cleanupFns.length; i++) {
          cleanupFns[i]();
        }
      }
    } else {
      for (let i = 0; i < this.collectedLeaveElements.length; i++) {
        const element = this.collectedLeaveElements[i];
        this.processLeaveNode(element);
      }
    }
    this.totalQueuedPlayers = 0;
    this.collectedEnterElements.length = 0;
    this.collectedLeaveElements.length = 0;
    this._flushFns.forEach((fn) => fn());
    this._flushFns = [];
    if (this._whenQuietFns.length) {
      const quietFns = this._whenQuietFns;
      this._whenQuietFns = [];
      if (players.length) {
        optimizeGroupPlayer(players).onDone(() => {
          quietFns.forEach((fn) => fn());
        });
      } else {
        quietFns.forEach((fn) => fn());
      }
    }
  }
  reportError(errors) {
    throw triggerTransitionsFailed(errors);
  }
  _flushAnimations(cleanupFns, microtaskId) {
    const subTimelines = new ElementInstructionMap();
    const skippedPlayers = [];
    const skippedPlayersMap = /* @__PURE__ */ new Map();
    const queuedInstructions = [];
    const queriedElements = /* @__PURE__ */ new Map();
    const allPreStyleElements = /* @__PURE__ */ new Map();
    const allPostStyleElements = /* @__PURE__ */ new Map();
    const disabledElementsSet = /* @__PURE__ */ new Set();
    this.disabledNodes.forEach((node) => {
      disabledElementsSet.add(node);
      const nodesThatAreDisabled = this.driver.query(node, QUEUED_SELECTOR, true);
      for (let i2 = 0; i2 < nodesThatAreDisabled.length; i2++) {
        disabledElementsSet.add(nodesThatAreDisabled[i2]);
      }
    });
    const bodyNode = this.bodyNode;
    const allTriggerElements = Array.from(this.statesByElement.keys());
    const enterNodeMap = buildRootMap(allTriggerElements, this.collectedEnterElements);
    const enterNodeMapIds = /* @__PURE__ */ new Map();
    let i = 0;
    enterNodeMap.forEach((nodes, root) => {
      const className = ENTER_CLASSNAME + i++;
      enterNodeMapIds.set(root, className);
      nodes.forEach((node) => addClass(node, className));
    });
    const allLeaveNodes = [];
    const mergedLeaveNodes = /* @__PURE__ */ new Set();
    const leaveNodesWithoutAnimations = /* @__PURE__ */ new Set();
    for (let i2 = 0; i2 < this.collectedLeaveElements.length; i2++) {
      const element = this.collectedLeaveElements[i2];
      const details = element[REMOVAL_FLAG];
      if (details && details.setForRemoval) {
        allLeaveNodes.push(element);
        mergedLeaveNodes.add(element);
        if (details.hasAnimation) {
          this.driver.query(element, STAR_SELECTOR, true).forEach((elm) => mergedLeaveNodes.add(elm));
        } else {
          leaveNodesWithoutAnimations.add(element);
        }
      }
    }
    const leaveNodeMapIds = /* @__PURE__ */ new Map();
    const leaveNodeMap = buildRootMap(allTriggerElements, Array.from(mergedLeaveNodes));
    leaveNodeMap.forEach((nodes, root) => {
      const className = LEAVE_CLASSNAME + i++;
      leaveNodeMapIds.set(root, className);
      nodes.forEach((node) => addClass(node, className));
    });
    cleanupFns.push(() => {
      enterNodeMap.forEach((nodes, root) => {
        const className = enterNodeMapIds.get(root);
        nodes.forEach((node) => removeClass(node, className));
      });
      leaveNodeMap.forEach((nodes, root) => {
        const className = leaveNodeMapIds.get(root);
        nodes.forEach((node) => removeClass(node, className));
      });
      allLeaveNodes.forEach((element) => {
        this.processLeaveNode(element);
      });
    });
    const allPlayers = [];
    const erroneousTransitions = [];
    for (let i2 = this._namespaceList.length - 1; i2 >= 0; i2--) {
      const ns = this._namespaceList[i2];
      ns.drainQueuedTransitions(microtaskId).forEach((entry) => {
        const player = entry.player;
        const element = entry.element;
        allPlayers.push(player);
        if (this.collectedEnterElements.length) {
          const details = element[REMOVAL_FLAG];
          if (details && details.setForMove) {
            if (details.previousTriggersValues && details.previousTriggersValues.has(entry.triggerName)) {
              const previousValue = details.previousTriggersValues.get(entry.triggerName);
              const triggersWithStates = this.statesByElement.get(entry.element);
              if (triggersWithStates && triggersWithStates.has(entry.triggerName)) {
                const state = triggersWithStates.get(entry.triggerName);
                state.value = previousValue;
                triggersWithStates.set(entry.triggerName, state);
              }
            }
            player.destroy();
            return;
          }
        }
        const nodeIsOrphaned = !bodyNode || !this.driver.containsElement(bodyNode, element);
        const leaveClassName = leaveNodeMapIds.get(element);
        const enterClassName = enterNodeMapIds.get(element);
        const instruction = this._buildInstruction(entry, subTimelines, enterClassName, leaveClassName, nodeIsOrphaned);
        if (instruction.errors && instruction.errors.length) {
          erroneousTransitions.push(instruction);
          return;
        }
        if (nodeIsOrphaned) {
          player.onStart(() => eraseStyles(element, instruction.fromStyles));
          player.onDestroy(() => setStyles(element, instruction.toStyles));
          skippedPlayers.push(player);
          return;
        }
        if (entry.isFallbackTransition) {
          player.onStart(() => eraseStyles(element, instruction.fromStyles));
          player.onDestroy(() => setStyles(element, instruction.toStyles));
          skippedPlayers.push(player);
          return;
        }
        const timelines = [];
        instruction.timelines.forEach((tl) => {
          tl.stretchStartingKeyframe = true;
          if (!this.disabledNodes.has(tl.element)) {
            timelines.push(tl);
          }
        });
        instruction.timelines = timelines;
        subTimelines.append(element, instruction.timelines);
        const tuple = {
          instruction,
          player,
          element
        };
        queuedInstructions.push(tuple);
        instruction.queriedElements.forEach((element2) => getOrSetDefaultValue(queriedElements, element2, []).push(player));
        instruction.preStyleProps.forEach((stringMap, element2) => {
          if (stringMap.size) {
            let setVal = allPreStyleElements.get(element2);
            if (!setVal) {
              allPreStyleElements.set(element2, setVal = /* @__PURE__ */ new Set());
            }
            stringMap.forEach((_, prop) => setVal.add(prop));
          }
        });
        instruction.postStyleProps.forEach((stringMap, element2) => {
          let setVal = allPostStyleElements.get(element2);
          if (!setVal) {
            allPostStyleElements.set(element2, setVal = /* @__PURE__ */ new Set());
          }
          stringMap.forEach((_, prop) => setVal.add(prop));
        });
      });
    }
    if (erroneousTransitions.length) {
      const errors = [];
      erroneousTransitions.forEach((instruction) => {
        errors.push(transitionFailed(instruction.triggerName, instruction.errors));
      });
      allPlayers.forEach((player) => player.destroy());
      this.reportError(errors);
    }
    const allPreviousPlayersMap = /* @__PURE__ */ new Map();
    const animationElementMap = /* @__PURE__ */ new Map();
    queuedInstructions.forEach((entry) => {
      const element = entry.element;
      if (subTimelines.has(element)) {
        animationElementMap.set(element, element);
        this._beforeAnimationBuild(entry.player.namespaceId, entry.instruction, allPreviousPlayersMap);
      }
    });
    skippedPlayers.forEach((player) => {
      const element = player.element;
      const previousPlayers = this._getPreviousPlayers(element, false, player.namespaceId, player.triggerName, null);
      previousPlayers.forEach((prevPlayer) => {
        getOrSetDefaultValue(allPreviousPlayersMap, element, []).push(prevPlayer);
        prevPlayer.destroy();
      });
    });
    const replaceNodes = allLeaveNodes.filter((node) => {
      return replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements);
    });
    const postStylesMap = /* @__PURE__ */ new Map();
    const allLeaveQueriedNodes = cloakAndComputeStyles(postStylesMap, this.driver, leaveNodesWithoutAnimations, allPostStyleElements, AUTO_STYLE);
    allLeaveQueriedNodes.forEach((node) => {
      if (replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements)) {
        replaceNodes.push(node);
      }
    });
    const preStylesMap = /* @__PURE__ */ new Map();
    enterNodeMap.forEach((nodes, root) => {
      cloakAndComputeStyles(preStylesMap, this.driver, new Set(nodes), allPreStyleElements, \u0275PRE_STYLE);
    });
    replaceNodes.forEach((node) => {
      const post = postStylesMap.get(node);
      const pre = preStylesMap.get(node);
      postStylesMap.set(node, new Map([...post?.entries() ?? [], ...pre?.entries() ?? []]));
    });
    const rootPlayers = [];
    const subPlayers = [];
    const NO_PARENT_ANIMATION_ELEMENT_DETECTED = {};
    queuedInstructions.forEach((entry) => {
      const {
        element,
        player,
        instruction
      } = entry;
      if (subTimelines.has(element)) {
        if (disabledElementsSet.has(element)) {
          player.onDestroy(() => setStyles(element, instruction.toStyles));
          player.disabled = true;
          player.overrideTotalTime(instruction.totalTime);
          skippedPlayers.push(player);
          return;
        }
        let parentWithAnimation = NO_PARENT_ANIMATION_ELEMENT_DETECTED;
        if (animationElementMap.size > 1) {
          let elm = element;
          const parentsToAdd = [];
          while (elm = elm.parentNode) {
            const detectedParent = animationElementMap.get(elm);
            if (detectedParent) {
              parentWithAnimation = detectedParent;
              break;
            }
            parentsToAdd.push(elm);
          }
          parentsToAdd.forEach((parent) => animationElementMap.set(parent, parentWithAnimation));
        }
        const innerPlayer = this._buildAnimation(player.namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap);
        player.setRealPlayer(innerPlayer);
        if (parentWithAnimation === NO_PARENT_ANIMATION_ELEMENT_DETECTED) {
          rootPlayers.push(player);
        } else {
          const parentPlayers = this.playersByElement.get(parentWithAnimation);
          if (parentPlayers && parentPlayers.length) {
            player.parentPlayer = optimizeGroupPlayer(parentPlayers);
          }
          skippedPlayers.push(player);
        }
      } else {
        eraseStyles(element, instruction.fromStyles);
        player.onDestroy(() => setStyles(element, instruction.toStyles));
        subPlayers.push(player);
        if (disabledElementsSet.has(element)) {
          skippedPlayers.push(player);
        }
      }
    });
    subPlayers.forEach((player) => {
      const playersForElement = skippedPlayersMap.get(player.element);
      if (playersForElement && playersForElement.length) {
        const innerPlayer = optimizeGroupPlayer(playersForElement);
        player.setRealPlayer(innerPlayer);
      }
    });
    skippedPlayers.forEach((player) => {
      if (player.parentPlayer) {
        player.syncPlayerEvents(player.parentPlayer);
      } else {
        player.destroy();
      }
    });
    for (let i2 = 0; i2 < allLeaveNodes.length; i2++) {
      const element = allLeaveNodes[i2];
      const details = element[REMOVAL_FLAG];
      removeClass(element, LEAVE_CLASSNAME);
      if (details && details.hasAnimation) continue;
      let players = [];
      if (queriedElements.size) {
        let queriedPlayerResults = queriedElements.get(element);
        if (queriedPlayerResults && queriedPlayerResults.length) {
          players.push(...queriedPlayerResults);
        }
        let queriedInnerElements = this.driver.query(element, NG_ANIMATING_SELECTOR, true);
        for (let j = 0; j < queriedInnerElements.length; j++) {
          let queriedPlayers = queriedElements.get(queriedInnerElements[j]);
          if (queriedPlayers && queriedPlayers.length) {
            players.push(...queriedPlayers);
          }
        }
      }
      const activePlayers = players.filter((p) => !p.destroyed);
      if (activePlayers.length) {
        removeNodesAfterAnimationDone(this, element, activePlayers);
      } else {
        this.processLeaveNode(element);
      }
    }
    allLeaveNodes.length = 0;
    rootPlayers.forEach((player) => {
      this.players.push(player);
      player.onDone(() => {
        player.destroy();
        const index = this.players.indexOf(player);
        this.players.splice(index, 1);
      });
      player.play();
    });
    return rootPlayers;
  }
  afterFlush(callback) {
    this._flushFns.push(callback);
  }
  afterFlushAnimationsDone(callback) {
    this._whenQuietFns.push(callback);
  }
  _getPreviousPlayers(element, isQueriedElement, namespaceId, triggerName, toStateValue) {
    let players = [];
    if (isQueriedElement) {
      const queriedElementPlayers = this.playersByQueriedElement.get(element);
      if (queriedElementPlayers) {
        players = queriedElementPlayers;
      }
    } else {
      const elementPlayers = this.playersByElement.get(element);
      if (elementPlayers) {
        const isRemovalAnimation = !toStateValue || toStateValue == VOID_VALUE;
        elementPlayers.forEach((player) => {
          if (player.queued) return;
          if (!isRemovalAnimation && player.triggerName != triggerName) return;
          players.push(player);
        });
      }
    }
    if (namespaceId || triggerName) {
      players = players.filter((player) => {
        if (namespaceId && namespaceId != player.namespaceId) return false;
        if (triggerName && triggerName != player.triggerName) return false;
        return true;
      });
    }
    return players;
  }
  _beforeAnimationBuild(namespaceId, instruction, allPreviousPlayersMap) {
    const triggerName = instruction.triggerName;
    const rootElement = instruction.element;
    const targetNameSpaceId = instruction.isRemovalTransition ? void 0 : namespaceId;
    const targetTriggerName = instruction.isRemovalTransition ? void 0 : triggerName;
    for (const timelineInstruction of instruction.timelines) {
      const element = timelineInstruction.element;
      const isQueriedElement = element !== rootElement;
      const players = getOrSetDefaultValue(allPreviousPlayersMap, element, []);
      const previousPlayers = this._getPreviousPlayers(element, isQueriedElement, targetNameSpaceId, targetTriggerName, instruction.toState);
      previousPlayers.forEach((player) => {
        const realPlayer = player.getRealPlayer();
        if (realPlayer.beforeDestroy) {
          realPlayer.beforeDestroy();
        }
        player.destroy();
        players.push(player);
      });
    }
    eraseStyles(rootElement, instruction.fromStyles);
  }
  _buildAnimation(namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap) {
    const triggerName = instruction.triggerName;
    const rootElement = instruction.element;
    const allQueriedPlayers = [];
    const allConsumedElements = /* @__PURE__ */ new Set();
    const allSubElements = /* @__PURE__ */ new Set();
    const allNewPlayers = instruction.timelines.map((timelineInstruction) => {
      const element = timelineInstruction.element;
      allConsumedElements.add(element);
      const details = element[REMOVAL_FLAG];
      if (details && details.removedBeforeQueried) return new NoopAnimationPlayer(timelineInstruction.duration, timelineInstruction.delay);
      const isQueriedElement = element !== rootElement;
      const previousPlayers = flattenGroupPlayers((allPreviousPlayersMap.get(element) || EMPTY_PLAYER_ARRAY).map((p) => p.getRealPlayer())).filter((p) => {
        const pp = p;
        return pp.element ? pp.element === element : false;
      });
      const preStyles = preStylesMap.get(element);
      const postStyles = postStylesMap.get(element);
      const keyframes = normalizeKeyframes$1(this._normalizer, timelineInstruction.keyframes, preStyles, postStyles);
      const player2 = this._buildPlayer(timelineInstruction, keyframes, previousPlayers);
      if (timelineInstruction.subTimeline && skippedPlayersMap) {
        allSubElements.add(element);
      }
      if (isQueriedElement) {
        const wrappedPlayer = new TransitionAnimationPlayer(namespaceId, triggerName, element);
        wrappedPlayer.setRealPlayer(player2);
        allQueriedPlayers.push(wrappedPlayer);
      }
      return player2;
    });
    allQueriedPlayers.forEach((player2) => {
      getOrSetDefaultValue(this.playersByQueriedElement, player2.element, []).push(player2);
      player2.onDone(() => deleteOrUnsetInMap(this.playersByQueriedElement, player2.element, player2));
    });
    allConsumedElements.forEach((element) => addClass(element, NG_ANIMATING_CLASSNAME));
    const player = optimizeGroupPlayer(allNewPlayers);
    player.onDestroy(() => {
      allConsumedElements.forEach((element) => removeClass(element, NG_ANIMATING_CLASSNAME));
      setStyles(rootElement, instruction.toStyles);
    });
    allSubElements.forEach((element) => {
      getOrSetDefaultValue(skippedPlayersMap, element, []).push(player);
    });
    return player;
  }
  _buildPlayer(instruction, keyframes, previousPlayers) {
    if (keyframes.length > 0) {
      return this.driver.animate(instruction.element, keyframes, instruction.duration, instruction.delay, instruction.easing, previousPlayers);
    }
    return new NoopAnimationPlayer(instruction.duration, instruction.delay);
  }
};
var TransitionAnimationPlayer = class {
  namespaceId;
  triggerName;
  element;
  _player = new NoopAnimationPlayer();
  _containsRealPlayer = false;
  _queuedCallbacks = /* @__PURE__ */ new Map();
  destroyed = false;
  parentPlayer = null;
  markedForDestroy = false;
  disabled = false;
  queued = true;
  totalTime = 0;
  constructor(namespaceId, triggerName, element) {
    this.namespaceId = namespaceId;
    this.triggerName = triggerName;
    this.element = element;
  }
  setRealPlayer(player) {
    if (this._containsRealPlayer) return;
    this._player = player;
    this._queuedCallbacks.forEach((callbacks, phase) => {
      callbacks.forEach((callback) => listenOnPlayer(player, phase, void 0, callback));
    });
    this._queuedCallbacks.clear();
    this._containsRealPlayer = true;
    this.overrideTotalTime(player.totalTime);
    this.queued = false;
  }
  getRealPlayer() {
    return this._player;
  }
  overrideTotalTime(totalTime) {
    this.totalTime = totalTime;
  }
  syncPlayerEvents(player) {
    const p = this._player;
    if (p.triggerCallback) {
      player.onStart(() => p.triggerCallback("start"));
    }
    player.onDone(() => this.finish());
    player.onDestroy(() => this.destroy());
  }
  _queueEvent(name, callback) {
    getOrSetDefaultValue(this._queuedCallbacks, name, []).push(callback);
  }
  onDone(fn) {
    if (this.queued) {
      this._queueEvent("done", fn);
    }
    this._player.onDone(fn);
  }
  onStart(fn) {
    if (this.queued) {
      this._queueEvent("start", fn);
    }
    this._player.onStart(fn);
  }
  onDestroy(fn) {
    if (this.queued) {
      this._queueEvent("destroy", fn);
    }
    this._player.onDestroy(fn);
  }
  init() {
    this._player.init();
  }
  hasStarted() {
    return this.queued ? false : this._player.hasStarted();
  }
  play() {
    !this.queued && this._player.play();
  }
  pause() {
    !this.queued && this._player.pause();
  }
  restart() {
    !this.queued && this._player.restart();
  }
  finish() {
    this._player.finish();
  }
  destroy() {
    this.destroyed = true;
    this._player.destroy();
  }
  reset() {
    !this.queued && this._player.reset();
  }
  setPosition(p) {
    if (!this.queued) {
      this._player.setPosition(p);
    }
  }
  getPosition() {
    return this.queued ? 0 : this._player.getPosition();
  }
  /** @internal */
  triggerCallback(phaseName) {
    const p = this._player;
    if (p.triggerCallback) {
      p.triggerCallback(phaseName);
    }
  }
};
function deleteOrUnsetInMap(map2, key, value) {
  let currentValues = map2.get(key);
  if (currentValues) {
    if (currentValues.length) {
      const index = currentValues.indexOf(value);
      currentValues.splice(index, 1);
    }
    if (currentValues.length == 0) {
      map2.delete(key);
    }
  }
  return currentValues;
}
function normalizeTriggerValue(value) {
  return value != null ? value : null;
}
function isElementNode(node) {
  return node && node["nodeType"] === 1;
}
function isTriggerEventValid(eventName) {
  return eventName == "start" || eventName == "done";
}
function cloakElement(element, value) {
  const oldValue = element.style.display;
  element.style.display = value != null ? value : "none";
  return oldValue;
}
function cloakAndComputeStyles(valuesMap, driver, elements, elementPropsMap, defaultStyle) {
  const cloakVals = [];
  elements.forEach((element) => cloakVals.push(cloakElement(element)));
  const failedElements = [];
  elementPropsMap.forEach((props, element) => {
    const styles = /* @__PURE__ */ new Map();
    props.forEach((prop) => {
      const value = driver.computeStyle(element, prop, defaultStyle);
      styles.set(prop, value);
      if (!value || value.length == 0) {
        element[REMOVAL_FLAG] = NULL_REMOVED_QUERIED_STATE;
        failedElements.push(element);
      }
    });
    valuesMap.set(element, styles);
  });
  let i = 0;
  elements.forEach((element) => cloakElement(element, cloakVals[i++]));
  return failedElements;
}
function buildRootMap(roots, nodes) {
  const rootMap = /* @__PURE__ */ new Map();
  roots.forEach((root) => rootMap.set(root, []));
  if (nodes.length == 0) return rootMap;
  const NULL_NODE = 1;
  const nodeSet = new Set(nodes);
  const localRootMap = /* @__PURE__ */ new Map();
  function getRoot(node) {
    if (!node) return NULL_NODE;
    let root = localRootMap.get(node);
    if (root) return root;
    const parent = node.parentNode;
    if (rootMap.has(parent)) {
      root = parent;
    } else if (nodeSet.has(parent)) {
      root = NULL_NODE;
    } else {
      root = getRoot(parent);
    }
    localRootMap.set(node, root);
    return root;
  }
  nodes.forEach((node) => {
    const root = getRoot(node);
    if (root !== NULL_NODE) {
      rootMap.get(root).push(node);
    }
  });
  return rootMap;
}
function addClass(element, className) {
  element.classList?.add(className);
}
function removeClass(element, className) {
  element.classList?.remove(className);
}
function removeNodesAfterAnimationDone(engine, element, players) {
  optimizeGroupPlayer(players).onDone(() => engine.processLeaveNode(element));
}
function flattenGroupPlayers(players) {
  const finalPlayers = [];
  _flattenGroupPlayersRecur(players, finalPlayers);
  return finalPlayers;
}
function _flattenGroupPlayersRecur(players, finalPlayers) {
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player instanceof AnimationGroupPlayer) {
      _flattenGroupPlayersRecur(player.players, finalPlayers);
    } else {
      finalPlayers.push(player);
    }
  }
}
function objEquals(a, b) {
  const k1 = Object.keys(a);
  const k2 = Object.keys(b);
  if (k1.length != k2.length) return false;
  for (let i = 0; i < k1.length; i++) {
    const prop = k1[i];
    if (!b.hasOwnProperty(prop) || a[prop] !== b[prop]) return false;
  }
  return true;
}
function replacePostStylesAsPre(element, allPreStyleElements, allPostStyleElements) {
  const postEntry = allPostStyleElements.get(element);
  if (!postEntry) return false;
  let preEntry = allPreStyleElements.get(element);
  if (preEntry) {
    postEntry.forEach((data) => preEntry.add(data));
  } else {
    allPreStyleElements.set(element, postEntry);
  }
  allPostStyleElements.delete(element);
  return true;
}
var AnimationEngine = class {
  _driver;
  _normalizer;
  _transitionEngine;
  _timelineEngine;
  _triggerCache = {};
  // this method is designed to be overridden by the code that uses this engine
  onRemovalComplete = (element, context) => {
  };
  constructor(doc, _driver, _normalizer) {
    this._driver = _driver;
    this._normalizer = _normalizer;
    this._transitionEngine = new TransitionAnimationEngine(doc.body, _driver, _normalizer);
    this._timelineEngine = new TimelineAnimationEngine(doc.body, _driver, _normalizer);
    this._transitionEngine.onRemovalComplete = (element, context) => this.onRemovalComplete(element, context);
  }
  registerTrigger(componentId, namespaceId, hostElement, name, metadata) {
    const cacheKey = componentId + "-" + name;
    let trigger = this._triggerCache[cacheKey];
    if (!trigger) {
      const errors = [];
      const warnings = [];
      const ast = buildAnimationAst(this._driver, metadata, errors, warnings);
      if (errors.length) {
        throw triggerBuildFailed(name, errors);
      }
      if (typeof ngDevMode === "undefined" || ngDevMode) {
        if (warnings.length) {
          warnTriggerBuild(name, warnings);
        }
      }
      trigger = buildTrigger(name, ast, this._normalizer);
      this._triggerCache[cacheKey] = trigger;
    }
    this._transitionEngine.registerTrigger(namespaceId, name, trigger);
  }
  register(namespaceId, hostElement) {
    this._transitionEngine.register(namespaceId, hostElement);
  }
  destroy(namespaceId, context) {
    this._transitionEngine.destroy(namespaceId, context);
  }
  onInsert(namespaceId, element, parent, insertBefore) {
    this._transitionEngine.insertNode(namespaceId, element, parent, insertBefore);
  }
  onRemove(namespaceId, element, context) {
    this._transitionEngine.removeNode(namespaceId, element, context);
  }
  disableAnimations(element, disable) {
    this._transitionEngine.markElementAsDisabled(element, disable);
  }
  process(namespaceId, element, property, value) {
    if (property.charAt(0) == "@") {
      const [id, action] = parseTimelineCommand(property);
      const args = value;
      this._timelineEngine.command(id, element, action, args);
    } else {
      this._transitionEngine.trigger(namespaceId, element, property, value);
    }
  }
  listen(namespaceId, element, eventName, eventPhase, callback) {
    if (eventName.charAt(0) == "@") {
      const [id, action] = parseTimelineCommand(eventName);
      return this._timelineEngine.listen(id, element, action, callback);
    }
    return this._transitionEngine.listen(namespaceId, element, eventName, eventPhase, callback);
  }
  flush(microtaskId = -1) {
    this._transitionEngine.flush(microtaskId);
  }
  get players() {
    return [...this._transitionEngine.players, ...this._timelineEngine.players];
  }
  whenRenderingDone() {
    return this._transitionEngine.whenRenderingDone();
  }
  afterFlushAnimationsDone(cb) {
    this._transitionEngine.afterFlushAnimationsDone(cb);
  }
};
function packageNonAnimatableStyles(element, styles) {
  let startStyles = null;
  let endStyles = null;
  if (Array.isArray(styles) && styles.length) {
    startStyles = filterNonAnimatableStyles(styles[0]);
    if (styles.length > 1) {
      endStyles = filterNonAnimatableStyles(styles[styles.length - 1]);
    }
  } else if (styles instanceof Map) {
    startStyles = filterNonAnimatableStyles(styles);
  }
  return startStyles || endStyles ? new SpecialCasedStyles(element, startStyles, endStyles) : null;
}
var SpecialCasedStyles = class _SpecialCasedStyles {
  _element;
  _startStyles;
  _endStyles;
  static initialStylesByElement = /* @__PURE__ */ new WeakMap();
  _state = 0;
  _initialStyles;
  constructor(_element, _startStyles, _endStyles) {
    this._element = _element;
    this._startStyles = _startStyles;
    this._endStyles = _endStyles;
    let initialStyles = _SpecialCasedStyles.initialStylesByElement.get(_element);
    if (!initialStyles) {
      _SpecialCasedStyles.initialStylesByElement.set(_element, initialStyles = /* @__PURE__ */ new Map());
    }
    this._initialStyles = initialStyles;
  }
  start() {
    if (this._state < 1) {
      if (this._startStyles) {
        setStyles(this._element, this._startStyles, this._initialStyles);
      }
      this._state = 1;
    }
  }
  finish() {
    this.start();
    if (this._state < 2) {
      setStyles(this._element, this._initialStyles);
      if (this._endStyles) {
        setStyles(this._element, this._endStyles);
        this._endStyles = null;
      }
      this._state = 1;
    }
  }
  destroy() {
    this.finish();
    if (this._state < 3) {
      _SpecialCasedStyles.initialStylesByElement.delete(this._element);
      if (this._startStyles) {
        eraseStyles(this._element, this._startStyles);
        this._endStyles = null;
      }
      if (this._endStyles) {
        eraseStyles(this._element, this._endStyles);
        this._endStyles = null;
      }
      setStyles(this._element, this._initialStyles);
      this._state = 3;
    }
  }
};
function filterNonAnimatableStyles(styles) {
  let result = null;
  styles.forEach((val, prop) => {
    if (isNonAnimatableStyle(prop)) {
      result = result || /* @__PURE__ */ new Map();
      result.set(prop, val);
    }
  });
  return result;
}
function isNonAnimatableStyle(prop) {
  return prop === "display" || prop === "position";
}
var WebAnimationsPlayer = class {
  element;
  keyframes;
  options;
  _specialStyles;
  _onDoneFns = [];
  _onStartFns = [];
  _onDestroyFns = [];
  _duration;
  _delay;
  _initialized = false;
  _finished = false;
  _started = false;
  _destroyed = false;
  _finalKeyframe;
  // the following original fns are persistent copies of the _onStartFns and _onDoneFns
  // and are used to reset the fns to their original values upon reset()
  // (since the _onStartFns and _onDoneFns get deleted after they are called)
  _originalOnDoneFns = [];
  _originalOnStartFns = [];
  // using non-null assertion because it's re(set) by init();
  domPlayer;
  time = 0;
  parentPlayer = null;
  currentSnapshot = /* @__PURE__ */ new Map();
  constructor(element, keyframes, options, _specialStyles) {
    this.element = element;
    this.keyframes = keyframes;
    this.options = options;
    this._specialStyles = _specialStyles;
    this._duration = options["duration"];
    this._delay = options["delay"] || 0;
    this.time = this._duration + this._delay;
  }
  _onFinish() {
    if (!this._finished) {
      this._finished = true;
      this._onDoneFns.forEach((fn) => fn());
      this._onDoneFns = [];
    }
  }
  init() {
    this._buildPlayer();
    this._preparePlayerBeforeStart();
  }
  _buildPlayer() {
    if (this._initialized) return;
    this._initialized = true;
    const keyframes = this.keyframes;
    this.domPlayer = this._triggerWebAnimation(this.element, keyframes, this.options);
    this._finalKeyframe = keyframes.length ? keyframes[keyframes.length - 1] : /* @__PURE__ */ new Map();
    const onFinish = () => this._onFinish();
    this.domPlayer.addEventListener("finish", onFinish);
    this.onDestroy(() => {
      this.domPlayer.removeEventListener("finish", onFinish);
    });
  }
  _preparePlayerBeforeStart() {
    if (this._delay) {
      this._resetDomPlayerState();
    } else {
      this.domPlayer.pause();
    }
  }
  _convertKeyframesToObject(keyframes) {
    const kfs = [];
    keyframes.forEach((frame) => {
      kfs.push(Object.fromEntries(frame));
    });
    return kfs;
  }
  /** @internal */
  _triggerWebAnimation(element, keyframes, options) {
    return element.animate(this._convertKeyframesToObject(keyframes), options);
  }
  onStart(fn) {
    this._originalOnStartFns.push(fn);
    this._onStartFns.push(fn);
  }
  onDone(fn) {
    this._originalOnDoneFns.push(fn);
    this._onDoneFns.push(fn);
  }
  onDestroy(fn) {
    this._onDestroyFns.push(fn);
  }
  play() {
    this._buildPlayer();
    if (!this.hasStarted()) {
      this._onStartFns.forEach((fn) => fn());
      this._onStartFns = [];
      this._started = true;
      if (this._specialStyles) {
        this._specialStyles.start();
      }
    }
    this.domPlayer.play();
  }
  pause() {
    this.init();
    this.domPlayer.pause();
  }
  finish() {
    this.init();
    if (this._specialStyles) {
      this._specialStyles.finish();
    }
    this._onFinish();
    this.domPlayer.finish();
  }
  reset() {
    this._resetDomPlayerState();
    this._destroyed = false;
    this._finished = false;
    this._started = false;
    this._onStartFns = this._originalOnStartFns;
    this._onDoneFns = this._originalOnDoneFns;
  }
  _resetDomPlayerState() {
    if (this.domPlayer) {
      this.domPlayer.cancel();
    }
  }
  restart() {
    this.reset();
    this.play();
  }
  hasStarted() {
    return this._started;
  }
  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._resetDomPlayerState();
      this._onFinish();
      if (this._specialStyles) {
        this._specialStyles.destroy();
      }
      this._onDestroyFns.forEach((fn) => fn());
      this._onDestroyFns = [];
    }
  }
  setPosition(p) {
    if (this.domPlayer === void 0) {
      this.init();
    }
    this.domPlayer.currentTime = p * this.time;
  }
  getPosition() {
    return +(this.domPlayer.currentTime ?? 0) / this.time;
  }
  get totalTime() {
    return this._delay + this._duration;
  }
  beforeDestroy() {
    const styles = /* @__PURE__ */ new Map();
    if (this.hasStarted()) {
      const finalKeyframe = this._finalKeyframe;
      finalKeyframe.forEach((val, prop) => {
        if (prop !== "offset") {
          styles.set(prop, this._finished ? val : computeStyle(this.element, prop));
        }
      });
    }
    this.currentSnapshot = styles;
  }
  /** @internal */
  triggerCallback(phaseName) {
    const methods = phaseName === "start" ? this._onStartFns : this._onDoneFns;
    methods.forEach((fn) => fn());
    methods.length = 0;
  }
};
var WebAnimationsDriver = class {
  validateStyleProperty(prop) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      return validateStyleProperty(prop);
    }
    return true;
  }
  validateAnimatableStyleProperty(prop) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      const cssProp = camelCaseToDashCase(prop);
      return validateWebAnimatableStyleProperty(cssProp);
    }
    return true;
  }
  containsElement(elm1, elm2) {
    return containsElement(elm1, elm2);
  }
  getParentElement(element) {
    return getParentElement(element);
  }
  query(element, selector, multi) {
    return invokeQuery(element, selector, multi);
  }
  computeStyle(element, prop, defaultValue) {
    return computeStyle(element, prop);
  }
  animate(element, keyframes, duration, delay, easing, previousPlayers = []) {
    const fill = delay == 0 ? "both" : "forwards";
    const playerOptions = {
      duration,
      delay,
      fill
    };
    if (easing) {
      playerOptions["easing"] = easing;
    }
    const previousStyles = /* @__PURE__ */ new Map();
    const previousWebAnimationPlayers = previousPlayers.filter((player) => player instanceof WebAnimationsPlayer);
    if (allowPreviousPlayerStylesMerge(duration, delay)) {
      previousWebAnimationPlayers.forEach((player) => {
        player.currentSnapshot.forEach((val, prop) => previousStyles.set(prop, val));
      });
    }
    let _keyframes = normalizeKeyframes(keyframes).map((styles) => new Map(styles));
    _keyframes = balancePreviousStylesIntoKeyframes(element, _keyframes, previousStyles);
    const specialStyles = packageNonAnimatableStyles(element, _keyframes);
    return new WebAnimationsPlayer(element, _keyframes, playerOptions, specialStyles);
  }
};
var ANIMATION_PREFIX = "@";
var DISABLE_ANIMATIONS_FLAG = "@.disabled";
var BaseAnimationRenderer = class {
  namespaceId;
  delegate;
  engine;
  _onDestroy;
  // We need to explicitly type this property because of an api-extractor bug
  // See https://github.com/microsoft/rushstack/issues/4390
  \u0275type = 0;
  constructor(namespaceId, delegate, engine, _onDestroy) {
    this.namespaceId = namespaceId;
    this.delegate = delegate;
    this.engine = engine;
    this._onDestroy = _onDestroy;
  }
  get data() {
    return this.delegate.data;
  }
  destroyNode(node) {
    this.delegate.destroyNode?.(node);
  }
  destroy() {
    this.engine.destroy(this.namespaceId, this.delegate);
    this.engine.afterFlushAnimationsDone(() => {
      queueMicrotask(() => {
        this.delegate.destroy();
      });
    });
    this._onDestroy?.();
  }
  createElement(name, namespace) {
    return this.delegate.createElement(name, namespace);
  }
  createComment(value) {
    return this.delegate.createComment(value);
  }
  createText(value) {
    return this.delegate.createText(value);
  }
  appendChild(parent, newChild) {
    this.delegate.appendChild(parent, newChild);
    this.engine.onInsert(this.namespaceId, newChild, parent, false);
  }
  insertBefore(parent, newChild, refChild, isMove = true) {
    this.delegate.insertBefore(parent, newChild, refChild);
    this.engine.onInsert(this.namespaceId, newChild, parent, isMove);
  }
  removeChild(parent, oldChild, isHostElement) {
    if (this.parentNode(oldChild)) {
      this.engine.onRemove(this.namespaceId, oldChild, this.delegate);
    }
  }
  selectRootElement(selectorOrNode, preserveContent) {
    return this.delegate.selectRootElement(selectorOrNode, preserveContent);
  }
  parentNode(node) {
    return this.delegate.parentNode(node);
  }
  nextSibling(node) {
    return this.delegate.nextSibling(node);
  }
  setAttribute(el, name, value, namespace) {
    this.delegate.setAttribute(el, name, value, namespace);
  }
  removeAttribute(el, name, namespace) {
    this.delegate.removeAttribute(el, name, namespace);
  }
  addClass(el, name) {
    this.delegate.addClass(el, name);
  }
  removeClass(el, name) {
    this.delegate.removeClass(el, name);
  }
  setStyle(el, style2, value, flags) {
    this.delegate.setStyle(el, style2, value, flags);
  }
  removeStyle(el, style2, flags) {
    this.delegate.removeStyle(el, style2, flags);
  }
  setProperty(el, name, value) {
    if (name.charAt(0) == ANIMATION_PREFIX && name == DISABLE_ANIMATIONS_FLAG) {
      this.disableAnimations(el, !!value);
    } else {
      this.delegate.setProperty(el, name, value);
    }
  }
  setValue(node, value) {
    this.delegate.setValue(node, value);
  }
  listen(target, eventName, callback, options) {
    return this.delegate.listen(target, eventName, callback, options);
  }
  disableAnimations(element, value) {
    this.engine.disableAnimations(element, value);
  }
};
var AnimationRenderer = class extends BaseAnimationRenderer {
  factory;
  constructor(factory, namespaceId, delegate, engine, onDestroy) {
    super(namespaceId, delegate, engine, onDestroy);
    this.factory = factory;
    this.namespaceId = namespaceId;
  }
  setProperty(el, name, value) {
    if (name.charAt(0) == ANIMATION_PREFIX) {
      if (name.charAt(1) == "." && name == DISABLE_ANIMATIONS_FLAG) {
        value = value === void 0 ? true : !!value;
        this.disableAnimations(el, value);
      } else {
        this.engine.process(this.namespaceId, el, name.slice(1), value);
      }
    } else {
      this.delegate.setProperty(el, name, value);
    }
  }
  listen(target, eventName, callback, options) {
    if (eventName.charAt(0) == ANIMATION_PREFIX) {
      const element = resolveElementFromTarget(target);
      let name = eventName.slice(1);
      let phase = "";
      if (name.charAt(0) != ANIMATION_PREFIX) {
        [name, phase] = parseTriggerCallbackName(name);
      }
      return this.engine.listen(this.namespaceId, element, name, phase, (event) => {
        const countId = event["_data"] || -1;
        this.factory.scheduleListenerCallback(countId, callback, event);
      });
    }
    return this.delegate.listen(target, eventName, callback, options);
  }
};
function resolveElementFromTarget(target) {
  switch (target) {
    case "body":
      return document.body;
    case "document":
      return document;
    case "window":
      return window;
    default:
      return target;
  }
}
function parseTriggerCallbackName(triggerName) {
  const dotIndex = triggerName.indexOf(".");
  const trigger = triggerName.substring(0, dotIndex);
  const phase = triggerName.slice(dotIndex + 1);
  return [trigger, phase];
}
var AnimationRendererFactory = class {
  delegate;
  engine;
  _zone;
  _currentId = 0;
  _microtaskId = 1;
  _animationCallbacksBuffer = [];
  _rendererCache = /* @__PURE__ */ new Map();
  _cdRecurDepth = 0;
  constructor(delegate, engine, _zone) {
    this.delegate = delegate;
    this.engine = engine;
    this._zone = _zone;
    engine.onRemovalComplete = (element, delegate2) => {
      delegate2?.removeChild(null, element);
    };
  }
  createRenderer(hostElement, type) {
    const EMPTY_NAMESPACE_ID = "";
    const delegate = this.delegate.createRenderer(hostElement, type);
    if (!hostElement || !type?.data?.["animation"]) {
      const cache = this._rendererCache;
      let renderer = cache.get(delegate);
      if (!renderer) {
        const onRendererDestroy = () => cache.delete(delegate);
        renderer = new BaseAnimationRenderer(EMPTY_NAMESPACE_ID, delegate, this.engine, onRendererDestroy);
        cache.set(delegate, renderer);
      }
      return renderer;
    }
    const componentId = type.id;
    const namespaceId = type.id + "-" + this._currentId;
    this._currentId++;
    this.engine.register(namespaceId, hostElement);
    const registerTrigger = (trigger) => {
      if (Array.isArray(trigger)) {
        trigger.forEach(registerTrigger);
      } else {
        this.engine.registerTrigger(componentId, namespaceId, hostElement, trigger.name, trigger);
      }
    };
    const animationTriggers = type.data["animation"];
    animationTriggers.forEach(registerTrigger);
    return new AnimationRenderer(this, namespaceId, delegate, this.engine);
  }
  begin() {
    this._cdRecurDepth++;
    if (this.delegate.begin) {
      this.delegate.begin();
    }
  }
  _scheduleCountTask() {
    queueMicrotask(() => {
      this._microtaskId++;
    });
  }
  /** @internal */
  scheduleListenerCallback(count, fn, data) {
    if (count >= 0 && count < this._microtaskId) {
      this._zone.run(() => fn(data));
      return;
    }
    const animationCallbacksBuffer = this._animationCallbacksBuffer;
    if (animationCallbacksBuffer.length == 0) {
      queueMicrotask(() => {
        this._zone.run(() => {
          animationCallbacksBuffer.forEach((tuple) => {
            const [fn2, data2] = tuple;
            fn2(data2);
          });
          this._animationCallbacksBuffer = [];
        });
      });
    }
    animationCallbacksBuffer.push([fn, data]);
  }
  end() {
    this._cdRecurDepth--;
    if (this._cdRecurDepth == 0) {
      this._zone.runOutsideAngular(() => {
        this._scheduleCountTask();
        this.engine.flush(this._microtaskId);
      });
    }
    if (this.delegate.end) {
      this.delegate.end();
    }
  }
  whenRenderingDone() {
    return this.engine.whenRenderingDone();
  }
  /**
   * Used during HMR to clear any cached data about a component.
   * @param componentId ID of the component that is being replaced.
   */
  componentReplaced(componentId) {
    this.engine.flush();
    this.delegate.componentReplaced?.(componentId);
  }
};

// node_modules/@angular/platform-browser/fesm2022/animations.mjs
var InjectableAnimationEngine = class _InjectableAnimationEngine extends AnimationEngine {
  // The `ApplicationRef` is injected here explicitly to force the dependency ordering.
  // Since the `ApplicationRef` should be created earlier before the `AnimationEngine`, they
  // both have `ngOnDestroy` hooks and `flush()` must be called after all views are destroyed.
  constructor(doc, driver, normalizer) {
    super(doc, driver, normalizer);
  }
  ngOnDestroy() {
    this.flush();
  }
  static \u0275fac = function InjectableAnimationEngine_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InjectableAnimationEngine)(\u0275\u0275inject(DOCUMENT), \u0275\u0275inject(AnimationDriver), \u0275\u0275inject(AnimationStyleNormalizer));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _InjectableAnimationEngine,
    factory: _InjectableAnimationEngine.\u0275fac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InjectableAnimationEngine, [{
    type: Injectable
  }], () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: AnimationDriver
  }, {
    type: AnimationStyleNormalizer
  }], null);
})();
function instantiateDefaultStyleNormalizer() {
  return new WebAnimationsStyleNormalizer();
}
function instantiateRendererFactory(renderer, engine, zone) {
  return new AnimationRendererFactory(renderer, engine, zone);
}
var SHARED_ANIMATION_PROVIDERS = [{
  provide: AnimationStyleNormalizer,
  useFactory: instantiateDefaultStyleNormalizer
}, {
  provide: AnimationEngine,
  useClass: InjectableAnimationEngine
}, {
  provide: RendererFactory2,
  useFactory: instantiateRendererFactory,
  deps: [DomRendererFactory2, AnimationEngine, NgZone]
}];
var BROWSER_NOOP_ANIMATIONS_PROVIDERS = [{
  provide: AnimationDriver,
  useClass: NoopAnimationDriver
}, {
  provide: ANIMATION_MODULE_TYPE,
  useValue: "NoopAnimations"
}, ...SHARED_ANIMATION_PROVIDERS];
var BROWSER_ANIMATIONS_PROVIDERS = [
  // Note: the `ngServerMode` happen inside factories to give the variable time to initialize.
  {
    provide: AnimationDriver,
    useFactory: () => false ? new NoopAnimationDriver() : new WebAnimationsDriver()
  },
  {
    provide: ANIMATION_MODULE_TYPE,
    useFactory: () => false ? "NoopAnimations" : "BrowserAnimations"
  },
  ...SHARED_ANIMATION_PROVIDERS
];
var BrowserAnimationsModule = class _BrowserAnimationsModule {
  /**
   * Configures the module based on the specified object.
   *
   * @param config Object used to configure the behavior of the `BrowserAnimationsModule`.
   * @see {@link BrowserAnimationsModuleConfig}
   *
   * @usageNotes
   * When registering the `BrowserAnimationsModule`, you can use the `withConfig`
   * function as follows:
   * ```ts
   * @NgModule({
   *   imports: [BrowserAnimationsModule.withConfig(config)]
   * })
   * class MyNgModule {}
   * ```
   */
  static withConfig(config) {
    return {
      ngModule: _BrowserAnimationsModule,
      providers: config.disableAnimations ? BROWSER_NOOP_ANIMATIONS_PROVIDERS : BROWSER_ANIMATIONS_PROVIDERS
    };
  }
  static \u0275fac = function BrowserAnimationsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrowserAnimationsModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _BrowserAnimationsModule,
    exports: [BrowserModule]
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    providers: BROWSER_ANIMATIONS_PROVIDERS,
    imports: [BrowserModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserAnimationsModule, [{
    type: NgModule,
    args: [{
      exports: [BrowserModule],
      providers: BROWSER_ANIMATIONS_PROVIDERS
    }]
  }], null, null);
})();
function provideAnimations() {
  performanceMarkFeature("NgEagerAnimations");
  return [...BROWSER_ANIMATIONS_PROVIDERS];
}
var NoopAnimationsModule = class _NoopAnimationsModule {
  static \u0275fac = function NoopAnimationsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NoopAnimationsModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _NoopAnimationsModule,
    exports: [BrowserModule]
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    providers: BROWSER_NOOP_ANIMATIONS_PROVIDERS,
    imports: [BrowserModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NoopAnimationsModule, [{
    type: NgModule,
    args: [{
      exports: [BrowserModule],
      providers: BROWSER_NOOP_ANIMATIONS_PROVIDERS
    }]
  }], null, null);
})();

// src/app/blog/blog.routes.ts
var BLOG_ROUTES = [
  {
    path: "",
    component: BlogLayoutComponent,
    children: [
      __spreadValues({
        path: "",
        loadComponent: () => import("./blog-home.component-HF7TKWNB.js").then((m) => m.BlogHomeComponent),
        data: {
          seo: {
            title: "Blog de Cine, Series y Anime | Gu\xEDa Programaci\xF3n",
            description: "Descubre los mejores art\xEDculos sobre cine, series y anime. An\xE1lisis, rese\xF1as y noticias del mundo del entretenimiento.",
            keywords: "blog cine, series, anime, rese\xF1as, noticias entretenimiento"
          }
        }
      }, false ? { \u0275entryName: "src/app/blog/pages/blog-home/blog-home.component.ts" } : {}),
      __spreadValues({
        path: "top10",
        loadComponent: () => import("./top10.component-2QSK6LQJ.js").then((m) => m.Top10Component),
        data: {
          seo: {
            title: "Top 10 - Rankings de Cine, Series y Anime",
            description: "Los mejores rankings del cine, series y anime. Descubre las obras maestras y joyas ocultas de cada temporada.",
            keywords: "top 10, rankings cine, mejores series, mejores anime"
          }
        }
      }, false ? { \u0275entryName: "src/app/blog/pages/top10/top10.component.ts" } : {}),
      __spreadValues({
        path: "categoria/:slug",
        loadComponent: () => import("./category.component-CNFHD43W.js").then((m) => m.CategoryComponent)
      }, false ? { \u0275entryName: "src/app/blog/pages/category/category.component.ts" } : {}),
      __spreadValues({
        path: ":slug",
        loadComponent: () => import("./post-detail.component-APQJBL6E.js").then((m) => m.PostDetailComponent)
      }, false ? { \u0275entryName: "src/app/blog/pages/post-detail/post-detail.component.ts" } : {})
    ]
  }
];

// src/app/app.routes.ts
var routes = [
  __spreadValues({
    path: "",
    loadComponent: () => import("./home.component-2GHLNTNU.js").then((m) => m.HomeComponent),
    title: "Inicio - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/home/home.component.ts" } : {}),
  __spreadValues({
    path: "series",
    loadComponent: () => import("./series.component-54KUNNE6.js").then((m) => m.SeriesComponent),
    title: "Series - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/series/series.component.ts" } : {}),
  __spreadValues({
    path: "peliculas",
    loadComponent: () => import("./peliculas.component-DEDBRUXB.js").then((m) => m.PeliculasComponent),
    title: "Pel\xEDculas - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/peliculas/peliculas.component.ts" } : {}),
  __spreadValues({
    path: "guia-canales",
    loadComponent: () => import("./lista-canales.component-MDXFOVMQ.js").then((m) => m.ListaCanalesComponent),
    title: "Gu\xEDa de Canales - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/lista-canales/lista-canales.component.ts" } : {}),
  __spreadValues({
    // SEO-friendly channel route used across the app (e.g. slider/navigation)
    path: "programacion-tv/ver-canal/:id",
    loadComponent: () => import("./canal-completo.component-FIM2OF45.js").then((m) => m.CanalCompletoComponent),
    title: "Canal - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/canal-completo/canal-completo.component.ts" } : {}),
  __spreadValues({
    path: "que-ver-hoy",
    loadComponent: () => import("./lista-destacadas.component-VPTSKTC3.js").then((m) => m.ListaDestacadasComponent),
    title: "Qu\xE9 Ver Hoy - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/lista-destacadas/lista-destacadas.component.ts" } : {}),
  __spreadValues({
    path: "ver-canal/:id",
    loadComponent: () => import("./canal-completo.component-FIM2OF45.js").then((m) => m.CanalCompletoComponent),
    title: "Canal - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/canal-completo/canal-completo.component.ts" } : {}),
  // Legacy single-parameter detail routes (kept for backwards compatibility)
  __spreadValues({
    path: "detalles/:id",
    loadComponent: () => import("./pelicula-details.compoent-K5YF7Z3A.js").then((m) => m.PeliculaDetailsComponent),
    title: "Detalles - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/pelicula-details/pelicula-details.compoent.ts" } : {}),
  __spreadValues({
    path: "pelicula-details/:id",
    loadComponent: () => import("./pelicula-details.compoent-K5YF7Z3A.js").then((m) => m.PeliculaDetailsComponent),
    title: "Detalle de Pel\xEDcula - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/pelicula-details/pelicula-details.compoent.ts" } : {}),
  // SEO-friendly movie route: slug-only (no id exposed)
  __spreadValues({
    path: "peliculas/:slug",
    loadComponent: () => import("./pelicula-details.compoent-K5YF7Z3A.js").then((m) => m.PeliculaDetailsComponent),
    title: "Pel\xEDculas - Detalle - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/pelicula-details/pelicula-details.compoent.ts" } : {}),
  // SEO-friendly program route: slug-only (no id exposed)
  __spreadValues({
    path: "programas/:slug",
    loadComponent: () => import("./program-full-details.component-YL2SM6I4.js").then((m) => m.ProgramFullDetailsComponent),
    title: "Programas - Detalle - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/program-full-details/program-full-details.component.ts" } : {}),
  __spreadValues({
    path: "en-directo",
    loadComponent: () => import("./ahora-directo.component-JGZVTNAN.js").then((m) => m.AhoraDirectoComponent),
    title: "En Directo - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/ahora-directo/ahora-directo.component.ts" } : {}),
  __spreadValues({
    path: "blog",
    loadComponent: () => import("./blog-layout.component-IDPSSCOB.js").then((m) => m.BlogLayoutComponent),
    // attach children from the blog feature routes so the layout's <router-outlet>
    // can render blog-home, post-detail, categories, etc.
    children: BLOG_ROUTES && BLOG_ROUTES.length ? BLOG_ROUTES[0].children : [],
    title: "Blog - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/blog/layout/blog-layout.component.ts" } : {}),
  __spreadValues({
    path: "program-full-details/:id",
    loadComponent: () => import("./program-full-details.component-YL2SM6I4.js").then((m) => m.ProgramFullDetailsComponent),
    title: "Detalles del Programa - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/program-full-details/program-full-details.component.ts" } : {}),
  // Eliminar ruta comodín temporalmente para evitar bucles
  // {
  //   path: '**',
  //   redirectTo: ''
  // }
  __spreadValues({
    path: "avisolegal",
    loadComponent: () => import("./legal-notice.component-HFVU6VRG.js").then((m) => m.LegalNoticeComponent),
    title: "Aviso Legal - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/legal-notice/legal-notice.component.ts" } : {}),
  __spreadValues({
    path: "privacidad",
    loadComponent: () => import("./privacy.component-WDH7DICK.js").then((m) => m.PrivacyComponent),
    title: "Pol\xEDtica de Privacidad - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/privacy/privacy.component.ts" } : {}),
  __spreadValues({
    path: "cookies",
    loadComponent: () => import("./cookies.component-NISFNYMK.js").then((m) => m.CookiesComponent),
    title: "Pol\xEDtica de Cookies - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/cookies/cookies.component.ts" } : {}),
  __spreadValues({
    path: "terminos",
    loadComponent: () => import("./terms.component-K5XBRHOD.js").then((m) => m.TermsComponent),
    title: "T\xE9rminos y Condiciones - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/terms/terms.component.ts" } : {}),
  __spreadValues({
    path: "accesibilidad",
    loadComponent: () => import("./accessibility.component-H62QJK3K.js").then((m) => m.AccessibilityComponent),
    title: "Accesibilidad - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/accessibility/accessibility.component.ts" } : {}),
  __spreadValues({
    path: "sitemap",
    loadComponent: () => import("./sitemap.component-K4W4WKUV.js").then((m) => m.SitemapComponent),
    title: "Mapa del sitio - Gu\xEDa TV"
  }, false ? { \u0275entryName: "src/app/pages/legal/sitemap/sitemap.component.ts" } : {})
];

// src/app/services/core/cache.service.ts
var _MemoryCacheService = class _MemoryCacheService {
  constructor(logger) {
    this.logger = logger;
    this.cache = /* @__PURE__ */ new Map();
    this.defaultTTL = 5 * 60 * 1e3;
  }
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }
    this.logger.debug(`Cache hit for key: ${key}`);
    return cached.data;
  }
  set(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
    this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}ms`);
  }
  has(key) {
    const cached = this.cache.get(key);
    const isValid = cached ? Date.now() <= cached.expiry : false;
    return isValid;
  }
  clear(key) {
    if (key) {
      this.cache.delete(key);
      this.logger.debug(`Cache cleared for key: ${key}`);
    } else {
      this.cache.clear();
      this.logger.debug("All cache cleared");
    }
  }
  getSize() {
    return this.cache.size;
  }
  getKeys() {
    return Array.from(this.cache.keys());
  }
};
_MemoryCacheService.\u0275fac = function MemoryCacheService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _MemoryCacheService)(\u0275\u0275inject(ILogger));
};
_MemoryCacheService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MemoryCacheService, factory: _MemoryCacheService.\u0275fac, providedIn: "root" });
var MemoryCacheService = _MemoryCacheService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MemoryCacheService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: ILogger }], null);
})();

// src/app/services/core/initialization-manager.service.ts
var _InitializationManagerService = class _InitializationManagerService {
  constructor(logger) {
    this.logger = logger;
    this._isInitialized = false;
    this._isInitializing = false;
    this.initializationError = null;
    this.statusSubject = new BehaviorSubject({
      initialized: false,
      initializing: false,
      error: null
    });
    this.status$ = this.statusSubject.asObservable();
    this.logger.info("Initialization Manager created");
  }
  isInitialized() {
    return this._isInitialized;
  }
  isInitializing() {
    return this._isInitializing;
  }
  getInitializationError() {
    return this.initializationError;
  }
  startInitialization() {
    this.logger.debug(`Start initialization called - Current state: initialized=${this._isInitialized}, initializing=${this._isInitializing}`);
    if (this._isInitialized) {
      this.logger.info("Already initialized, skipping initialization");
      return false;
    }
    if (this._isInitializing) {
      this.logger.info("Initialization already in progress, waiting");
      return false;
    }
    this.logger.info("Starting initialization process");
    this._isInitializing = true;
    this.initializationError = null;
    this.emitStatus();
    return true;
  }
  completeInitialization(dataVerification) {
    if (dataVerification && typeof dataVerification === "function") {
      const hasValidData = dataVerification();
      if (!hasValidData) {
        this.logger.error("Data verification failed during initialization completion");
        this.failInitialization("Initialization completed but data verification failed");
        return;
      }
      this.logger.debug("Data verification passed");
    }
    this.logger.info("Initialization completed successfully");
    this._isInitialized = true;
    this._isInitializing = false;
    this.initializationError = null;
    this.emitStatus();
  }
  failInitialization(error) {
    this.logger.error(`Initialization failed: ${error}`);
    this._isInitialized = false;
    this._isInitializing = false;
    this.initializationError = error;
    this.emitStatus();
  }
  resetInitialization() {
    this.logger.info("Resetting initialization state");
    this._isInitialized = false;
    this._isInitializing = false;
    this.initializationError = null;
    this.emitStatus();
  }
  forceReinitialize() {
    this.logger.info("Forcing reinitialization");
    this.resetInitialization();
    this.emitStatus();
  }
  hasRealData(dataCheck) {
    if (!this._isInitialized) {
      return false;
    }
    if (dataCheck && typeof dataCheck === "function") {
      const hasData = dataCheck();
      this.logger.debug(`Real data verification: ${hasData}`);
      if (!hasData) {
        this.logger.warn("Real data missing detected, resetting initialization state");
        this.resetInitialization();
        return false;
      }
      return hasData;
    }
    return this._isInitialized;
  }
  debugStateConsistency(externalDataCheck) {
    this.logger.debug("\n=== DEBUG STATE CONSISTENCY ===");
    this.logger.debug(`Internal State - Initialized: ${this._isInitialized}`);
    this.logger.debug(`Internal State - Initializing: ${this._isInitializing}`);
    this.logger.debug(`Internal State - Error: ${this.initializationError || "None"}`);
    if (externalDataCheck && typeof externalDataCheck === "function") {
      const hasExternalData = externalDataCheck();
      this.logger.debug(`External Data Check: ${hasExternalData}`);
      if (this._isInitialized && !hasExternalData) {
        this.logger.warn("INCONSISTENCY DETECTED: Service says initialized but no external data!");
      }
      if (!this._isInitialized && hasExternalData) {
        this.logger.warn("INCONSISTENCY DETECTED: Service says not initialized but external data exists!");
      }
    }
    this.logger.debug("=== END DEBUG STATE CONSISTENCY ===\n");
  }
  getStatusSummary() {
    return `Initialization Status - Initialized: ${this._isInitialized}, Initializing: ${this._isInitializing}, Error: ${this.initializationError || "None"}`;
  }
  emitStatus() {
    const status = {
      initialized: this._isInitialized,
      initializing: this._isInitializing,
      error: this.initializationError
    };
    this.logger.debug("Emitting initialization status", status);
    this.statusSubject.next(status);
  }
};
_InitializationManagerService.\u0275fac = function InitializationManagerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _InitializationManagerService)(\u0275\u0275inject(ILogger));
};
_InitializationManagerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _InitializationManagerService, factory: _InitializationManagerService.\u0275fac, providedIn: "root" });
var InitializationManagerService = _InitializationManagerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InitializationManagerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: ILogger }], null);
})();

// src/app/services/providers/api-program.provider.ts
var _ApiProgramProvider = class _ApiProgramProvider {
  constructor(http, cache, logger, configService) {
    this.http = http;
    this.cache = cache;
    this.logger = logger;
    this.configService = configService;
    const apiConfig = this.configService.getApiConfig();
    this.baseUrl = apiConfig.backend?.baseUrl;
  }
  getPrograms(date) {
    const cacheKey = `${CacheKeys.TODAY_PROGRAMS}_${date}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info(`[ApiProgramProvider] Returning cached programs for ${date}`);
      return of(cached);
    }
    this.logger.info(`[ApiProgramProvider] Fetching programs for ${date} from ${this.baseUrl}/programs`);
    return this.http.get(`${this.baseUrl}/programs`, {
      // fields=minimal reduce payload; backend soporta alias de fecha
      params: { date, fields: "minimal", limit: 5e3 }
    }).pipe(tap((response) => this.logger.info(`[ApiProgramProvider] Raw response received for ${date}`, response)), map((response) => response?.data ?? response), map((payload) => {
      const channels = payload?.channels ?? [];
      const programs = payload?.programs ?? [];
      this.logger.info(`[ApiProgramProvider] Payload parsed: ${channels.length} channels, ${programs.length} programs`);
      if (!programs.length || !channels.length)
        return [];
      const channelMap = new Map(channels.map((c) => [c.id, c]));
      return programs.map((p) => ({
        id: p.id,
        title: p.title,
        start: p.start,
        end: p.end,
        duration: p.durationMinutes ?? this.calculateDuration(p.start, p.end),
        channel_id: p.channelId,
        channel: channelMap.get(p.channelId) || { id: p.channelId, name: "" },
        desc: p.description ? { value: p.description, lang: "es" } : void 0,
        category: p.category ? { value: p.category, lang: "es" } : void 0,
        image: p.image,
        starRating: p.rating ? Number(p.rating) : void 0,
        // layout fields (para compatibilidad futura)
        gridColumnStart: p.gridColumnStart,
        gridColumnEnd: p.gridColumnEnd,
        layerIndex: p.layerIndex,
        isCutAtStart: p.isCutAtStart,
        isCutAtEnd: p.isCutAtEnd,
        visibleStartTime: p.visibleStartTime,
        visibleEndTime: p.visibleEndTime,
        crossesMidnight: p.crossesMidnight,
        layoutsBySlot: p.layoutsBySlot,
        pxStart: p.pxStart,
        pxWidth: p.pxWidth,
        timeSlotIndex: p.timeSlotIndex
      }));
    }), tap((programs) => {
      this.logger.info(`[ApiProgramProvider] Processed ${programs.length} programs`);
      this.cache.set(cacheKey, programs);
    }), catchError((error) => {
      this.logger.error(`[ApiProgramProvider] Failed to fetch programs for ${date}`, error);
      throw error;
    }));
  }
  getChannels() {
    const cacheKey = "channels";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info("Using cached channels");
      return of(cached);
    }
    this.logger.info("Fetching channels from API");
    return this.http.get(`${this.baseUrl}/channels`).pipe(map((response) => response.channels || []), map((apiChannels) => apiChannels.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "",
      type: c.type
    }))), tap((channels) => {
      this.cache.set(cacheKey, channels);
      this.logger.info("Channels cached", { count: channels.length });
    }), catchError((error) => {
      this.logger.error("Failed to fetch channels", error);
      throw error;
    }));
  }
  transformApiData(channelsData) {
    if (!Array.isArray(channelsData)) {
      return [];
    }
    const allPrograms = [];
    channelsData.forEach(({ channel, programs }) => {
      if (!channel || !Array.isArray(programs))
        return;
      programs.forEach((program) => {
        allPrograms.push({
          id: program.id,
          title: program.title,
          start: program.startTime ?? program.start,
          end: program.endTime ?? program.end,
          channel_id: channel.id,
          channel: {
            id: channel.id,
            name: channel.name,
            icon: channel.icon || "",
            type: channel.type
          },
          desc: program.description ? {
            value: program.description,
            lang: "es",
            details: program.details?.longText || program.details?.summary
          } : void 0,
          category: program.category ? { value: program.category, lang: "es" } : void 0,
          starRating: program.rating ? Number(program.rating) : void 0,
          image: program.image,
          duration: program.durationMinutes ?? program.duration ?? this.calculateDuration(program.startTime ?? program.start, program.endTime ?? program.end)
        });
      });
    });
    return allPrograms;
  }
  // Modo para compatibilidad con ProgramListComponent
  getProgramsForProgramList(date) {
    return this.http.get(`${this.baseUrl}/layouts/${date}`, {
      params: { fields: "full" }
    }).pipe(map((response) => response?.data ?? response), map((payload) => {
      const channels = payload?.channels ?? [];
      return channels.map((entry) => ({
        id: entry?.channel?.id,
        channel: entry?.channel,
        channels: (entry?.programs || []).map((p) => ({
          id: p.id,
          title: p.title,
          start: p.start,
          stop: p.end,
          duracion: p.durationMinutes ?? this.calculateDuration(p.startTime ?? p.start, p.endTime ?? p.end),
          desc: p.description ? { value: p.description, lang: "es" } : void 0,
          category: p.category ? { value: p.category, lang: "es" } : void 0,
          image: p.image,
          rating: p.rating,
          gridColumnStart: p.gridColumnStart,
          gridColumnEnd: p.gridColumnEnd,
          layerIndex: p.layerIndex,
          isCutAtStart: p.isCutAtStart,
          isCutAtEnd: p.isCutAtEnd,
          visibleStartTime: p.visibleStartTime,
          visibleEndTime: p.visibleEndTime,
          crossesMidnight: p.crossesMidnight,
          layoutsBySlot: p.layoutsBySlot,
          fieldsProvided: p.fieldsProvided,
          pxStart: p.pxStart,
          pxWidth: p.pxWidth,
          timeSlotIndex: p.timeSlotIndex
        }))
      }));
    }));
  }
  calculateDuration(start, end) {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return Math.max(1, Math.floor((endTime - startTime) / (1e3 * 60)));
    } catch {
      return 30;
    }
  }
};
_ApiProgramProvider.\u0275fac = function ApiProgramProvider_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ApiProgramProvider)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(ICacheManager), \u0275\u0275inject(ILogger), \u0275\u0275inject(AppConfigurationService));
};
_ApiProgramProvider.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ApiProgramProvider, factory: _ApiProgramProvider.\u0275fac, providedIn: "root" });
var ApiProgramProvider = _ApiProgramProvider;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ApiProgramProvider, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: HttpClient }, { type: ICacheManager }, { type: ILogger }, { type: AppConfigurationService }], null);
})();

// src/app/services/providers/tmdb-movie.provider.ts
var _TMDbMovieProvider = class _TMDbMovieProvider {
  constructor(http, cache, logger, configService) {
    this.http = http;
    this.cache = cache;
    this.logger = logger;
    this.configService = configService;
    const apiConfig = this.configService.getApiConfig().tmdb;
    this.baseUrl = apiConfig.baseUrl;
    this.headers = new HttpHeaders({
      "Accept": "application/json",
      "Authorization": apiConfig.apiKey
    });
  }
  getPopularMovies() {
    const cacheKey = CacheKeys.FEATURED_MOVIES;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info("Using cached popular movies", { count: cached.length });
      return of(cached);
    }
    this.logger.info("Fetching popular movies from TMDb");
    const language = this.configService.getApiConfig().tmdb.language;
    return this.http.get(`${this.baseUrl}/movie/popular?language=${language}&page=1`, {
      headers: this.headers
    }).pipe(map((response) => this.transformTMDbMovies(response.results || [])), tap((movies) => {
      this.cache.set(cacheKey, movies);
      this.logger.info("Popular movies cached", { count: movies.length });
    }), catchError((error) => {
      this.logger.error("Failed to fetch popular movies from TMDb", error);
      return of([]);
    }));
  }
  searchMovie(title) {
    if (!title?.trim()) {
      this.logger.warn("Empty title provided for movie search");
      return of({ results: [] });
    }
    const language = this.configService.getApiConfig().tmdb.language;
    const url = `${this.baseUrl}/search/movie?language=${language}&query=${encodeURIComponent(title.trim())}&page=1&include_adult=false`;
    this.logger.debug(`Searching movie: "${title}"`);
    return this.http.get(url, { headers: this.headers }).pipe(tap(() => this.logger.debug(`Movie search completed for: "${title}"`)), catchError((error) => {
      this.logger.error(`Failed to search movie: "${title}"`, error);
      return of({ results: [] });
    }));
  }
  getMovieDetails(id) {
    if (!id?.trim()) {
      this.logger.warn("Empty ID provided for movie details");
      return of({});
    }
    const language = this.configService.getApiConfig().tmdb.language;
    const url = `${this.baseUrl}/movie/${id}?language=${language}`;
    this.logger.debug(`Fetching movie details for ID: ${id}`);
    return this.http.get(url, { headers: this.headers }).pipe(tap(() => this.logger.debug(`Movie details fetched for ID: ${id}`)), catchError((error) => {
      this.logger.error(`Failed to fetch movie details for ID: ${id}`, error);
      return of({});
    }));
  }
  transformTMDbMovies(movies) {
    if (!Array.isArray(movies)) {
      this.logger.warn("Invalid movies data received from TMDb", movies);
      return [];
    }
    const maxMovies = this.configService.getUIConfig().maxFeaturedMovies;
    return movies.slice(0, maxMovies).map((movie, index) => ({
      id: movie.id?.toString() || `tmdb_${index}`,
      title: movie.title || "Sin t\xEDtulo",
      description: movie.overview || "Sin descripci\xF3n disponible",
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "",
      rating: movie.vote_average || null,
      tmdbId: movie.id,
      releaseDate: movie.release_date,
      isFallback: true
    }));
  }
};
_TMDbMovieProvider.\u0275fac = function TMDbMovieProvider_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _TMDbMovieProvider)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(ICacheManager), \u0275\u0275inject(ILogger), \u0275\u0275inject(AppConfigurationService));
};
_TMDbMovieProvider.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TMDbMovieProvider, factory: _TMDbMovieProvider.\u0275fac, providedIn: "root" });
var TMDbMovieProvider = _TMDbMovieProvider;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TMDbMovieProvider, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: HttpClient }, { type: ICacheManager }, { type: ILogger }, { type: AppConfigurationService }], null);
})();

// src/app/services/providers/tmdb-poster.provider.ts
var _TMDbPosterProvider = class _TMDbPosterProvider {
  constructor(http, cache, logger, configService) {
    this.http = http;
    this.cache = cache;
    this.logger = logger;
    this.configService = configService;
    this.imageBaseUrl = "https://image.tmdb.org/t/p/w500";
    this.defaultPoster = "assets/images/default-movie-poster.svg";
    this.cachePrefix = "poster_";
    this.cacheTTL = 24 * 60 * 60 * 1e3;
    this.isNetworkAvailable = true;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.networkRetryDelay = 3e4;
    const apiConfig = this.configService.getApiConfig().tmdb;
    this.baseUrl = apiConfig.baseUrl;
    this.headers = new HttpHeaders({
      "Accept": "application/json",
      "Authorization": apiConfig.apiKey
    });
  }
  /**
   * Extrae poster por título y año de película (método requerido por interfaz)
   */
  extractPoster(movieTitle, year) {
    return this.extractPosterWithData(movieTitle, year).pipe(map((result) => result.posterUrl));
  }
  /**
   * Extrae poster y datos de película por título y año
   */
  extractPosterWithData(movieTitle, year) {
    if (!movieTitle?.trim()) {
      this.logger.warn("Empty movie title provided for poster extraction");
      return of({
        posterUrl: this.getDefaultPoster()
      });
    }
    const cacheKey = this.generateCacheKey(movieTitle, year);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Using cached poster for: "${movieTitle}"`);
      return of({
        posterUrl: cached
      });
    }
    if (!this.isNetworkAvailable) {
      this.logger.warn(`Network unavailable for "${movieTitle}", using default poster`);
      return of({
        posterUrl: this.getDefaultPoster()
      });
    }
    this.logger.debug(`Searching poster and data for movie: "${movieTitle}" (${year || "no year"})`);
    return this.searchMoviePosterAndData(movieTitle, year).pipe(
      map((result) => {
        this.consecutiveFailures = 0;
        this.isNetworkAvailable = true;
        this.cache.set(cacheKey, result.posterUrl, this.cacheTTL);
        this.logger.debug(`Movie data found for "${movieTitle}": ${result.posterUrl !== this.getDefaultPoster() ? "TMDb" : "default"}`);
        return result;
      }),
      catchError((error) => {
        this.handleNetworkError(error, movieTitle);
        return of({
          posterUrl: this.getDefaultPoster()
        });
      }),
      timeout(1e4)
      // Timeout de 10 segundos
    );
  }
  /**
   * Extrae poster desde un programa de TV
   */
  extractPosterFromProgram(program) {
    const title = this.extractMovieTitle(program);
    const year = this.extractMovieYear(program);
    if (!title) {
      this.logger.warn("No title found in program for poster extraction", {
        programId: program.id,
        originalTitle: program.title
      });
      return of(this.getFallbackPoster(program));
    }
    this.logger.info("Extracting poster for program:", {
      id: program.id,
      title,
      channel: program.channel?.name,
      category: program.category?.value,
      year,
      rating: program.starRating,
      startTime: this.formatTime(program.start)
    });
    return this.extractPoster(title, year).pipe(catchError((error) => {
      this.logger.warn(`Failed to extract poster for program "${title}", using fallback`, error);
      return of(this.getFallbackPoster(program));
    }));
  }
  /**
   * Extrae poster y datos de película desde un programa de TV (método optimizado)
   */
  extractPosterAndDataFromProgram(program) {
    const title = this.extractMovieTitle(program);
    const year = this.extractMovieYear(program);
    if (!title) {
      return of({
        posterUrl: this.getFallbackPoster(program),
        originalProgram: program
      });
    }
    return this.extractPosterWithData(title, year).pipe(map((result) => __spreadProps(__spreadValues({}, result), {
      originalProgram: program
    })), catchError((error) => {
      this.logger.warn(`Failed to extract poster and data for program "${title}"`);
      return of({
        posterUrl: this.getFallbackPoster(program),
        originalProgram: program
      });
    }));
  }
  /**
   * Retorna el poster por defecto
   */
  getDefaultPoster() {
    return this.defaultPoster;
  }
  /**
   * Busca poster y datos en TMDb
   */
  searchMoviePosterAndData(title, year) {
    const language = this.configService.getApiConfig().tmdb.language;
    let query = encodeURIComponent(title.trim());
    if (year) {
      query += `&year=${year}`;
    }
    const url = `${this.baseUrl}/search/movie?language=${language}&query=${query}&page=1&include_adult=false`;
    return this.http.get(url, { headers: this.headers }).pipe(map((response) => {
      if (!response?.results?.length) {
        return {
          posterUrl: this.getDefaultPoster()
        };
      }
      const bestMatch = this.findBestMatch(response.results, title, year);
      if (bestMatch) {
        const result = {
          posterUrl: bestMatch.poster_path ? `${this.imageBaseUrl}${bestMatch.poster_path}` : this.getDefaultPoster()
        };
        if (bestMatch.poster_path) {
          result.movieData = {
            tmdbId: bestMatch.id,
            rating: bestMatch.vote_average,
            description: bestMatch.overview || "",
            releaseDate: bestMatch.release_date || ""
          };
        }
        return result;
      }
      return {
        posterUrl: this.getDefaultPoster()
      };
    }), catchError((error) => {
      if (this.consecutiveFailures === 0) {
        this.logger.error(`\u{1F50D} TMDb API error searching "${title}":`, error);
      } else {
        this.logger.debug(`TMDb API error for "${title}" (failure ${this.consecutiveFailures + 1})`);
      }
      return of({
        posterUrl: this.getDefaultPoster()
      });
    }));
  }
  /**
   * Busca poster en TMDb (método legacy)
   */
  searchMoviePoster(title, year) {
    return this.searchMoviePosterAndData(title, year).pipe(map((result) => result.posterUrl));
  }
  /**
   * Verifica si el error es relacionado con SSL/Red
   */
  isSSLError(error) {
    return error?.error?.code === "SELF_SIGNED_CERT_IN_CHAIN" || error?.message?.includes("certificate") || error?.message?.includes("SSL") || error?.message?.includes("TLS") || error?.status === 0;
  }
  /**
   * Encuentra la mejor coincidencia de película
   */
  findBestMatch(results, searchTitle, searchYear) {
    if (!results.length)
      return null;
    if (searchYear) {
      const yearMatches = results.filter((movie) => {
        const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "";
        return movieYear === searchYear;
      });
      if (yearMatches.length > 0) {
        return yearMatches.sort((a, b) => b.vote_average - a.vote_average)[0];
      }
    }
    const titleLower = searchTitle.toLowerCase();
    const exactMatches = results.filter((movie) => movie.title.toLowerCase() === titleLower);
    if (exactMatches.length > 0) {
      return exactMatches.sort((a, b) => b.vote_average - a.vote_average)[0];
    }
    return results.sort((a, b) => b.vote_average - a.vote_average)[0];
  }
  /**
   * Extrae el título de la película del programa
   */
  extractMovieTitle(program) {
    if (typeof program.title === "string") {
      return program.title.trim();
    }
    return program.title?.value?.trim() || "";
  }
  /**
   * Extrae el año de la película del programa
   */
  extractMovieYear(program) {
    const year = program.desc?.year;
    if (year && /^\d{4}$/.test(year.toString())) {
      return year.toString();
    }
    const titleYear = this.extractYearFromText(this.extractMovieTitle(program));
    if (titleYear)
      return titleYear;
    const descYear = this.extractYearFromText(program.desc?.details || "");
    if (descYear)
      return descYear;
    return void 0;
  }
  /**
   * Extrae año de un texto usando regex
   */
  extractYearFromText(text) {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : void 0;
  }
  /**
   * Obtiene poster de fallback (icono del canal)
   */
  getFallbackPoster(program) {
    return program.channel?.icon || this.getDefaultPoster();
  }
  /**
   * Genera clave única para cache
   */
  generateCacheKey(title, year) {
    const key = `${title.toLowerCase().replace(/\s+/g, "_")}${year ? `_${year}` : ""}`;
    return `${this.cachePrefix}${key}`;
  }
  /**
   * Formatea tiempo para logging
   */
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "hora desconocida";
    }
  }
  /**
   * Maneja errores de red de manera inteligente
   */
  handleNetworkError(error, movieTitle) {
    this.consecutiveFailures++;
    if (this.isSSLError(error)) {
      this.logger.warn(`\u{1F512} SSL/Network error for "${movieTitle}" (failure ${this.consecutiveFailures}/${this.maxConsecutiveFailures})`);
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.isNetworkAvailable = false;
        this.logger.warn(`\u{1F6AB} Network marked as unavailable after ${this.consecutiveFailures} consecutive failures. Retrying in ${this.networkRetryDelay / 1e3} seconds.`);
        setTimeout(() => {
          this.logger.info("\u{1F504} Attempting to restore network connectivity...");
          this.isNetworkAvailable = true;
          this.consecutiveFailures = 0;
        }, this.networkRetryDelay);
      }
    } else {
      this.logger.warn(`\u274C API error for "${movieTitle}":`, error.message || error);
    }
  }
  /**
   * Verifica si el servicio está disponible
   */
  isServiceAvailable() {
    return this.isNetworkAvailable && this.consecutiveFailures < this.maxConsecutiveFailures;
  }
  /**
   * Fuerza reconexión de red
   */
  forceReconnect() {
    this.logger.info("\u{1F504} Forcing network reconnection...");
    this.isNetworkAvailable = true;
    this.consecutiveFailures = 0;
  }
};
_TMDbPosterProvider.\u0275fac = function TMDbPosterProvider_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _TMDbPosterProvider)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(ICacheManager), \u0275\u0275inject(ILogger), \u0275\u0275inject(AppConfigurationService));
};
_TMDbPosterProvider.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TMDbPosterProvider, factory: _TMDbPosterProvider.\u0275fac, providedIn: "root" });
var TMDbPosterProvider = _TMDbPosterProvider;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TMDbPosterProvider, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: HttpClient }, { type: ICacheManager }, { type: ILogger }, { type: AppConfigurationService }], null);
})();

// src/app/services/providers/content-filter.service.ts
var _ContentFilterService = class _ContentFilterService {
  constructor(logger) {
    this.logger = logger;
  }
  filterMovies(programs) {
    if (!Array.isArray(programs)) {
      this.logger.warn("Invalid programs array provided to filterMovies");
      return [];
    }
    if (programs.length > 0) {
      this.logger.debug("First program structure:", JSON.stringify(programs[5], null, 2));
    }
    const filtered = programs.filter((program) => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      const isMovieCategory = this.isMovieCategory(category);
      const hasValidTitle = this.hasValidMovieTitle(title);
      const isNotGeneric = this.isNotGenericMovieBlock(program);
      const isValid = isMovieCategory && hasValidTitle && isNotGeneric;
      if (isValid) {
        this.logger.debug(`Movie found: "${title}" on ${program.channel?.name}`);
      }
      return isValid;
    });
    this.logger.info(`Filtered ${filtered.length} movies from ${programs.length} programs`);
    return filtered;
  }
  /**
   * Filtra películas para destacadas con criterios más estrictos (horario prime time)
   */
  filterFeaturedMovies(programs) {
    if (!Array.isArray(programs)) {
      this.logger.warn("Invalid programs array provided to filterFeaturedMovies");
      return [];
    }
    const filtered = programs.filter((program) => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      const isMovieCategory = this.isMovieCategory(category);
      const hasValidTitle = this.hasValidMovieTitle(title);
      const isNotGeneric = this.isNotGenericMovieBlock(program);
      const isPrimeTime = this.isPrimeTimeMovie(program);
      const isValid = isMovieCategory && hasValidTitle && isNotGeneric && isPrimeTime;
      if (isValid) {
        this.logger.debug(`Featured movie found: "${title}" on ${program.channel?.name} at ${this.formatTime(program.start)}`);
      } else if (isMovieCategory && hasValidTitle && isNotGeneric && !isPrimeTime) {
        this.logger.debug(`Movie "${title}" excluded: not in prime time (${this.formatTime(program.start)})`);
      }
      return isValid;
    });
    this.logger.info(`Filtered ${filtered.length} featured movies from ${programs.length} programs (prime time: 21:00-23:59)`);
    return filtered;
  }
  filterSeries(programs) {
    if (!Array.isArray(programs)) {
      this.logger.warn("Invalid programs array provided to filterSeries");
      return [];
    }
    const filtered = programs.filter((program) => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      const isSeriesCategory = category === ContentType.SERIES;
      const hasValidTitle = title && title.length > 0;
      return isSeriesCategory && hasValidTitle;
    });
    this.logger.info(`Filtered ${filtered.length} series from ${programs.length} programs`);
    return filtered;
  }
  filterByCategory(programs, category) {
    if (!Array.isArray(programs)) {
      this.logger.warn("Invalid programs array provided to filterByCategory");
      return [];
    }
    if (!category?.trim()) {
      this.logger.warn("Empty category provided to filterByCategory");
      return [];
    }
    const filtered = programs.filter((program) => {
      const programCategory = this.extractCategoryValue(program.category?.value);
      return programCategory === category.trim();
    });
    this.logger.info(`Filtered ${filtered.length} programs for category: ${category}`);
    return filtered;
  }
  extractCategoryValue(categoryValue) {
    if (!categoryValue)
      return "";
    return categoryValue.split(",")[0]?.trim() || "";
  }
  extractTitle(title) {
    if (typeof title === "string") {
      return title;
    }
    return title?.value || "";
  }
  isMovieCategory(category) {
    const movieKeywords = ["cine", "movie", "pel\xEDcula", "film"];
    const lowerCategory = category.toLowerCase();
    return movieKeywords.some((keyword) => lowerCategory.includes(keyword)) || category === ContentType.MOVIE;
  }
  hasValidMovieTitle(title) {
    if (!title || title.length === 0) {
      return false;
    }
    const lowerTitle = title.toLowerCase();
    const invalidTitles = ["cine", "pel\xEDcula", "movies", "film"];
    return !invalidTitles.includes(lowerTitle);
  }
  isNotGenericMovieBlock(program) {
    const description = program.desc?.details || program.desc?.value || "";
    const genericDescriptions = [
      "emisi\xF3n de una pel\xEDcula",
      "cine gen\xE9rico",
      "programaci\xF3n de pel\xEDculas"
    ];
    const lowerDescription = description.toLowerCase();
    return !genericDescriptions.some((generic) => lowerDescription.includes(generic));
  }
  /**
   * Verifica si la película se emite en horario prime time (21:00 a 23:59)
   */
  isPrimeTimeMovie(program) {
    if (!program.start) {
      return false;
    }
    try {
      const correctedDate = getCorrectTime(program.start);
      const rawDate = new Date(program.start);
      const hour = correctedDate.getHours();
      const minute = correctedDate.getMinutes();
      const isPrimeTime = hour >= 21 && hour <= 23;
      const title = this.extractTitle(program.title);
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const rawTimeStr = `${rawDate.getHours().toString().padStart(2, "0")}:${rawDate.getMinutes().toString().padStart(2, "0")}`;
      if (title.toLowerCase().includes("ghost") || title.toLowerCase().includes("equalizer")) {
        this.logger.info(`DEBUG: Movie "${title}" - Raw time: ${rawTimeStr} -> Corrected: ${timeStr} (hour: ${hour}) - Prime time: ${isPrimeTime}`);
        this.logger.info(`DEBUG: Raw start string: ${program.start}`);
        debugTimeZone(program.start, `Movie: ${title}`);
      } else {
        this.logger.debug(`Movie "${title}" starts at ${timeStr} - Prime time: ${isPrimeTime}`);
      }
      return isPrimeTime;
    } catch (error) {
      this.logger.warn(`Invalid start date for program: ${program.start}`);
      return false;
    }
  }
  /**
   * Formatea la hora para logging usando corrección centralizada
   */
  formatTime(dateString) {
    try {
      return formatCorrectTime(dateString);
    } catch (error) {
      return "hora desconocida";
    }
  }
};
_ContentFilterService.\u0275fac = function ContentFilterService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ContentFilterService)(\u0275\u0275inject(ILogger));
};
_ContentFilterService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ContentFilterService, factory: _ContentFilterService.\u0275fac, providedIn: "root" });
var ContentFilterService = _ContentFilterService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ContentFilterService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: ILogger }], null);
})();

// src/app/services/providers/data-transformer.service.ts
var _DataTransformerService = class _DataTransformerService {
  constructor(logger, posterProvider, configService) {
    this.logger = logger;
    this.posterProvider = posterProvider;
    this.configService = configService;
  }
  transformToFeaturedMovies(programs) {
    if (!Array.isArray(programs)) {
      this.logger.warn("Invalid programs array provided to transformToFeaturedMovies");
      return of([]);
    }
    const maxMovies = this.configService.getUIConfig().maxFeaturedMovies;
    const programsToTransform = programs.slice(0, maxMovies);
    if (programsToTransform.length === 0) {
      this.logger.info("No programs to transform");
      return of([]);
    }
    const isServiceAvailable = this.posterProvider.isServiceAvailable?.() ?? true;
    if (!isServiceAvailable) {
      this.logger.warn("\u{1F6AB} TMDb service temporarily unavailable. Using fallback posters for all movies.");
    }
    this.logger.info(`Starting transformation of ${programsToTransform.length} programs to featured movies`);
    const uniquePrograms = /* @__PURE__ */ new Map();
    programsToTransform.forEach((program) => {
      const title = this.extractTitle(program.title);
      if (title && !uniquePrograms.has(title.toLowerCase())) {
        uniquePrograms.set(title.toLowerCase(), program);
      }
    });
    const uniqueProgramsArray = Array.from(uniquePrograms.values());
    this.logger.info(`Removed duplicates: ${programsToTransform.length} -> ${uniqueProgramsArray.length} unique movies`);
    const transformObservables = uniqueProgramsArray.map((program, index) => this.transformSingleProgramOptimized(program, index));
    return forkJoin(transformObservables).pipe(map((movies) => {
      const validMovies = movies.filter((movie) => movie !== null);
      const tmdbMovies = validMovies.filter((movie) => !movie.isFallback).length;
      const fallbackMovies = validMovies.filter((movie) => movie.isFallback).length;
      this.logger.info(`\u{1F3AC} Transformation complete: ${validMovies.length} movies (${tmdbMovies} from TMDb, ${fallbackMovies} fallback)`);
      return validMovies;
    }), catchError((error) => {
      this.logger.error("Error transforming programs to featured movies", error);
      return of([]);
    }));
  }
  /**
   * Transforma un solo programa a película destacada
   */
  transformSingleProgram(program, index) {
    const title = this.extractTitle(program.title);
    if (!title) {
      this.logger.warn(`Program at index ${index} has no valid title`, { programId: program.id });
      return of(null);
    }
    return this.posterProvider.extractPosterFromProgram(program).pipe(map((poster) => ({
      id: program.id || `movie_${index}`,
      title,
      description: this.extractDescription(program),
      poster,
      rating: program.starRating || null,
      // Información adicional para enriquecimiento
      tmdbId: null,
      releaseDate: program.desc?.year,
      isFallback: false,
      // Datos del programa original
      channelId: program.channel_id,
      channelName: program.channel?.name,
      startTime: program.start,
      endTime: program.end,
      category: program.category?.value
    })), catchError((error) => {
      this.logger.warn(`Error transforming program "${title}":`, error);
      return of({
        id: program.id || `movie_${index}`,
        title,
        description: this.extractDescription(program),
        poster: this.posterProvider.getDefaultPoster(),
        rating: program.starRating || null,
        tmdbId: null,
        releaseDate: program.desc?.year,
        isFallback: true,
        channelId: program.channel_id,
        channelName: program.channel?.name,
        startTime: program.start,
        endTime: program.end,
        category: program.category?.value
      });
    }));
  }
  /**
   * Transforma un solo programa a película destacada (versión optimizada)
   */
  transformSingleProgramOptimized(program, index) {
    const title = this.extractTitle(program.title);
    if (!title) {
      this.logger.warn(`Program at index ${index} has no valid title`, { programId: program.id });
      return of(null);
    }
    const isServiceAvailable = this.posterProvider.isServiceAvailable?.() ?? true;
    if (!isServiceAvailable) {
      return of(this.createMovieWithFallback(program, index, title));
    }
    const shouldLogDetails = index < 3 || index % 5 === 0;
    if (shouldLogDetails) {
      this.logger.info("\u{1F3AC} Processing movie:", {
        id: program.id,
        title,
        channel: program.channel?.name,
        category: program.category?.value,
        year: program.desc?.year,
        rating: program.starRating,
        startTime: this.formatTime(program.start)
      });
    }
    return this.posterProvider.extractPosterFromProgram(program).pipe(map((poster) => {
      const baseMovie = {
        id: program.id || `movie_${index}`,
        title,
        description: this.extractDescription(program),
        poster,
        rating: this.extractRating(program),
        tmdbId: null,
        releaseDate: program.desc?.year,
        isFallback: poster === this.posterProvider.getDefaultPoster(),
        // Datos del programa original
        channelId: program.channel_id,
        channelName: program.channel?.name,
        startTime: program.start,
        endTime: program.end,
        category: program.category?.value
      };
      if (shouldLogDetails && !baseMovie.isFallback) {
        this.logger.info(`\u2705 TMDb poster found for "${title}"`);
      }
      return baseMovie;
    }), catchError((error) => {
      if (shouldLogDetails) {
        this.logger.warn(`\u26A0\uFE0F Error transforming program "${title}", using fallback`);
      }
      return of(this.createMovieWithFallback(program, index, title));
    }));
  }
  /**
   * Crea una película con datos de fallback
   */
  createMovieWithFallback(program, index, title) {
    return {
      id: program.id || `movie_${index}`,
      title,
      description: this.extractDescription(program),
      poster: program.channel?.icon || this.posterProvider.getDefaultPoster(),
      rating: this.extractRating(program),
      tmdbId: null,
      releaseDate: program.desc?.year,
      isFallback: true,
      channelId: program.channel_id,
      channelName: program.channel?.name,
      startTime: program.start,
      endTime: program.end,
      category: program.category?.value
    };
  }
  /**
   * Extrae el rating del programa de manera inteligente
   */
  extractRating(program) {
    const rating = program.starRating;
    if (!rating) {
      return null;
    }
    if (typeof rating === "string") {
      const match = rating.match(/^(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    if (typeof rating === "number") {
      return rating;
    }
    return null;
  }
  selectFeaturedMovie(movies) {
    if (!Array.isArray(movies) || movies.length === 0) {
      this.logger.warn("No movies available for selection");
      return null;
    }
    const highRatedMovie = movies.find((movie) => movie.rating && movie.rating > 7);
    if (highRatedMovie) {
      this.logger.info(`Selected featured movie by rating: "${highRatedMovie.title}" (${highRatedMovie.rating})`);
      return highRatedMovie;
    }
    const movieWithPoster = movies.find((movie) => movie.poster && movie.poster.length > 0);
    if (movieWithPoster) {
      this.logger.info(`Selected featured movie with poster: "${movieWithPoster.title}"`);
      return movieWithPoster;
    }
    const selected = movies[0];
    this.logger.info(`Selected default featured movie: "${selected.title}"`);
    return selected;
  }
  extractTitle(title) {
    if (typeof title === "string") {
      return title;
    }
    return title?.value || "";
  }
  extractDescription(program) {
    if (program.desc?.value) {
      return program.desc.value;
    }
    if (program.desc?.details) {
      return program.desc.details;
    }
    const title = this.extractTitle(program.title);
    const channelName = program.channel?.name || "canal desconocido";
    const startTime = this.formatTime(program.start);
    return `${title} en ${channelName} a las ${startTime}`;
  }
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      this.logger.warn(`Invalid date string: ${dateString}`);
      return "hora desconocida";
    }
  }
  /**
   * Obtiene estadísticas del servicio de posters
   */
  getPosterServiceStats() {
    const posterService = this.posterProvider;
    return {
      isAvailable: posterService.isServiceAvailable?.() ?? true,
      consecutiveFailures: posterService.consecutiveFailures ?? 0,
      cacheSize: 0
      // Podríamos implementar esto si el cache lo soporta
    };
  }
  /**
   * Fuerza reconexión del servicio de posters
   */
  forceReconnectPosterService() {
    const posterService = this.posterProvider;
    if (posterService.forceReconnect) {
      posterService.forceReconnect();
      this.logger.info("\u{1F504} Poster service reconnection forced");
    }
  }
};
_DataTransformerService.\u0275fac = function DataTransformerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _DataTransformerService)(\u0275\u0275inject(LOGGER_TOKEN), \u0275\u0275inject(POSTER_PROVIDER_TOKEN), \u0275\u0275inject(AppConfigurationService));
};
_DataTransformerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DataTransformerService, factory: _DataTransformerService.\u0275fac, providedIn: "root" });
var DataTransformerService = _DataTransformerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DataTransformerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: ILogger, decorators: [{
    type: Inject,
    args: [LOGGER_TOKEN]
  }] }, { type: IPosterProvider, decorators: [{
    type: Inject,
    args: [POSTER_PROVIDER_TOKEN]
  }] }, { type: AppConfigurationService }], null);
})();

// src/app/config/providers.config.ts
var coreProviders = [
  // Logger service - base para toda la aplicación
  {
    provide: LOGGER_TOKEN,
    useClass: ConsoleLoggerService
  },
  // Configuration service - configuración centralizada
  AppConfigurationService,
  // Cache manager - gestión de cache en memoria
  {
    provide: CACHE_MANAGER_TOKEN,
    useFactory: (logger) => new MemoryCacheService(logger),
    deps: [LOGGER_TOKEN]
  }
];
var programListProviders = [
  // Time Manager - manejo de tiempo y franjas horarias
  TimeManagerService,
  // Category Style Manager - manejo de estilos y categorías
  CategoryStyleManagerService,
  // Channel Logo Manager - manejo de logos de canales
  ChannelLogoManagerService,
  // Viewport Manager - manejo del viewport virtual
  ViewportManagerService,
  // Dimension Calculator - depende de TimeManager y PLATFORM_ID
  {
    provide: DimensionCalculatorService,
    useFactory: (platformId, timeManager) => new DimensionCalculatorService(platformId, timeManager),
    deps: [PLATFORM_ID, TimeManagerService]
  },
  // Facade Service - orquesta todos los servicios de ProgramList
  {
    provide: ProgramListFacadeService,
    useClass: ProgramListFacadeService,
    deps: [
      TimeManagerService,
      DimensionCalculatorService,
      CategoryStyleManagerService,
      ChannelLogoManagerService,
      ViewportManagerService,
      INITIALIZATION_MANAGER_TOKEN,
      LOGGER_TOKEN
    ]
  }
];
var dataProviders = [
  // Program Provider - datos de programación desde API Standard
  {
    provide: PROGRAM_PROVIDER_TOKEN,
    useFactory: (http, cache, logger, config) => new ApiProgramProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  // Movie Provider - datos de películas desde TMDb
  {
    provide: MOVIE_PROVIDER_TOKEN,
    useFactory: (http, cache, logger, config) => new TMDbMovieProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  // Poster Provider - extracción de posters desde TMDb
  {
    provide: POSTER_PROVIDER_TOKEN,
    useFactory: (http, cache, logger, config) => new TMDbPosterProvider(http, cache, logger, config),
    deps: [HttpClient, CACHE_MANAGER_TOKEN, LOGGER_TOKEN, AppConfigurationService]
  },
  // Content Filter - filtrado de contenido
  {
    provide: CONTENT_FILTER_TOKEN,
    useFactory: (logger) => new ContentFilterService(logger),
    deps: [LOGGER_TOKEN]
  },
  // Data Transformer - transformación de datos (ahora con poster provider)
  {
    provide: DATA_TRANSFORMER_TOKEN,
    useFactory: (logger, posterProvider, config) => new DataTransformerService(logger, posterProvider, config),
    deps: [LOGGER_TOKEN, POSTER_PROVIDER_TOKEN, AppConfigurationService]
  }
];
var stateProviders = [
  // Initialization Manager - gestión del estado de inicialización
  {
    provide: INITIALIZATION_MANAGER_TOKEN,
    useFactory: (logger) => new InitializationManagerService(logger),
    deps: [LOGGER_TOKEN]
  }
];
var applicationProviders = [
  // Featured Movies Service - orquestador de películas destacadas
  {
    provide: FeaturedMoviesService,
    useClass: FeaturedMoviesService,
    deps: [
      PROGRAM_PROVIDER_TOKEN,
      MOVIE_PROVIDER_TOKEN,
      CONTENT_FILTER_TOKEN,
      DATA_TRANSFORMER_TOKEN,
      CACHE_MANAGER_TOKEN,
      LOGGER_TOKEN
    ]
  },
  // Home Data Service - gestión de datos del home
  {
    provide: HomeDataService,
    useClass: HomeDataService,
    deps: [
      PROGRAM_PROVIDER_TOKEN,
      INITIALIZATION_MANAGER_TOKEN,
      LOGGER_TOKEN,
      FeaturedMoviesService
    ]
  }
];
var allProviders = [
  ...coreProviders,
  // Primero los servicios fundamentales
  ...dataProviders,
  // Luego los proveedores de datos
  ...stateProviders,
  // Después los gestores de estado
  ...programListProviders,
  // NUEVO: Servicios especializados de ProgramList
  ...applicationProviders
  // Finalmente los servicios de aplicación
];
function validateProviders(providers) {
  try {
    const services = providers.map((p) => {
      if (typeof p === "function")
        return p.name;
      if (typeof p === "object" && "provide" in p)
        return p.provide.toString();
      return "unknown";
    });
    console.log("\u2705 Providers validation passed:", services.length, "services");
    return true;
  } catch (error) {
    console.error("\u274C Providers validation failed:", error);
    return false;
  }
}

// src/app/app.config.ts
var appConfig = {
  providers: [
    // Providers básicos de Angular para standalone
    provideRouter(routes),
    // Habilitar animaciones en el cliente (necesario para triggers @expandCollapse)
    provideAnimations(),
    // provideClientHydration(),
    provideHttpClient(withFetch()),
    // Providers SOLID para toda la aplicación (INCLUYE ProgramList)
    ...allProviders,
    // Providers condicionales según el entorno
    ...getEnvironmentProviders(environment),
    // Providers de validación en desarrollo
    ...getValidationProviders(environment)
  ]
};
function getEnvironmentProviders(env) {
  const providers = [];
  if (env.production) {
    console.log("\u{1F3ED} SOLID App - Configurando providers para PRODUCCI\xD3N");
    providers.push({
      provide: "ENVIRONMENT_MODE",
      useValue: "production"
    });
  } else {
    console.log("\u{1F6E0}\uFE0F SOLID App - Configurando providers para DESARROLLO");
    providers.push({
      provide: "ENVIRONMENT_MODE",
      useValue: "development"
    }, {
      provide: "DEBUG_ENABLED",
      useValue: true
    });
  }
  return providers;
}
function getValidationProviders(env) {
  if (env.production) {
    return [];
  }
  return [
    {
      provide: "SOLID_VALIDATION",
      useFactory: () => {
        const isValid = validateProviders(allProviders);
        if (isValid) {
          console.log("\u2705 SOLID Validation - All providers are correctly configured");
        } else {
          console.error("\u274C SOLID Validation - Provider configuration issues detected");
        }
        return isValid;
      }
    }
  ];
}
if (!environment.production && typeof window !== "undefined") {
  window.SOLID_DEBUG = {
    providers: allProviders,
    environment,
    validateProviders: () => validateProviders(allProviders),
    getProviderCount: () => allProviders.length,
    getProviderTypes: () => {
      return allProviders.map((p) => {
        if (typeof p === "function")
          return `Class: ${p.name}`;
        if (typeof p === "object" && "provide" in p) {
          return `Token: ${p.provide.toString()}`;
        }
        return "Unknown provider type";
      });
    }
  };
  console.log("\u{1F6E0}\uFE0F SOLID Debug tools available at window.SOLID_DEBUG");
}

// src/app/components/left-sidebar/left-sidebar.component.ts
var _LeftSidebarComponent = class _LeftSidebarComponent {
};
_LeftSidebarComponent.\u0275fac = function LeftSidebarComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _LeftSidebarComponent)();
};
_LeftSidebarComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LeftSidebarComponent, selectors: [["app-left-sidebar"]], decls: 12, vars: 0, consts: [[1, "w-80", "xl:w-96", "min-h-screen", "py-8", "pl-8", "pr-6", "bg-gradient-to-b", "from-gray-900", "via-gray-800", "to-gray-900", "border-r", "border-gray-700/50", "hidden", "md:block", "sticky", "top-0", "flex-shrink-0", "backdrop-blur-sm"], ["routerLink", "/", 1, "font-bold", "text-xl", "flex", "items-center", "gap-x-3", "cursor-pointer", "logo-section", "mb-12", "group"], [1, "relative"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", 1, "h-10", "w-10", "fill-red-500", "group-hover:fill-red-400", "transition-all", "duration-300", "transform", "group-hover:scale-110", "logo-icon"], ["d", "M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"], [1, "absolute", "inset-0", "rounded-full", "bg-red-500/20", "blur-xl", "opacity-0", "group-hover:opacity-100", "transition-opacity", "duration-300"], [1, "tracking-wide", "text-white", "group-hover:text-red-300", "transition-colors", "duration-300", "logo-text"], [1, "text-red-500", "group-hover:text-red-400"], [1, "navigation-menu"]], template: function LeftSidebarComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "aside", 0)(1, "div", 1)(2, "div", 2);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 3);
    \u0275\u0275element(4, "path", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(5, "div", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 6);
    \u0275\u0275text(7, " GPTV");
    \u0275\u0275elementStart(8, "span", 7);
    \u0275\u0275text(9, ".");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(10, "div", 8);
    \u0275\u0275element(11, "app-menu");
    \u0275\u0275elementEnd()();
  }
}, dependencies: [MenuComponent], styles: ['\n\naside[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;\n  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background-color: rgba(156, 163, 175, 0.5);\n  border-radius: 3px;\n  transition: background-color 0.2s ease;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background-color: rgba(156, 163, 175, 0.8);\n}\n@media (prefers-color-scheme: dark) {\n  aside[_ngcontent-%COMP%] {\n    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);\n  }\n}\n.logo-section[_ngcontent-%COMP%] {\n  will-change: transform;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.logo-section[_ngcontent-%COMP%]:hover {\n  transform: translateY(-1px);\n}\n.logo-section[_ngcontent-%COMP%]   .logo-icon[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n  transition: all 0.3s ease;\n}\n.logo-section[_ngcontent-%COMP%]   .logo-icon[_ngcontent-%COMP%]:hover {\n  filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3));\n}\n.logo-section[_ngcontent-%COMP%]   .logo-text[_ngcontent-%COMP%] {\n  transition: all 0.2s ease;\n}\n.logo-section[_ngcontent-%COMP%]   .logo-text[_ngcontent-%COMP%]:hover {\n  letter-spacing: 0.05em;\n}\n.navigation-menu[_ngcontent-%COMP%] {\n  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%] {\n  position: relative;\n  transition: all 0.2s ease;\n  border-radius: 0.5rem;\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  width: 0;\n  background:\n    linear-gradient(\n      135deg,\n      rgb(239, 68, 68),\n      rgb(220, 38, 38));\n  border-radius: 0 0.25rem 0.25rem 0;\n  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  z-index: -1;\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%]:hover, \n.navigation-menu[_ngcontent-%COMP%]   .menu-item.active[_ngcontent-%COMP%] {\n  background-color: rgba(239, 68, 68, 0.05);\n  transform: translateX(4px);\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%]:hover::before, \n.navigation-menu[_ngcontent-%COMP%]   .menu-item.active[_ngcontent-%COMP%]::before {\n  width: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%]:hover, \n   .navigation-menu[_ngcontent-%COMP%]   .menu-item.active[_ngcontent-%COMP%] {\n    background-color: rgba(239, 68, 68, 0.1);\n  }\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%]:active {\n  transform: translateX(2px) scale(0.98);\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-icon[_ngcontent-%COMP%] {\n  transition: all 0.2s ease;\n}\n.menu-item[_ngcontent-%COMP%]:hover   .navigation-menu[_ngcontent-%COMP%]   .menu-icon[_ngcontent-%COMP%] {\n  transform: scale(1.1);\n  color: rgb(239, 68, 68);\n}\n.navigation-menu[_ngcontent-%COMP%]   .menu-text[_ngcontent-%COMP%] {\n  transition: all 0.2s ease;\n}\n.menu-item[_ngcontent-%COMP%]:hover   .navigation-menu[_ngcontent-%COMP%]   .menu-text[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: rgb(239, 68, 68);\n}\n@media (prefers-color-scheme: dark) {\n  .menu-item[_ngcontent-%COMP%]:hover   .navigation-menu[_ngcontent-%COMP%]   .menu-text[_ngcontent-%COMP%] {\n    color: rgb(248, 113, 113);\n  }\n}\n@media (max-width: 768px) {\n  aside[_ngcontent-%COMP%] {\n    transform: translateX(-100%);\n    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  aside.mobile-open[_ngcontent-%COMP%] {\n    transform: translateX(0);\n  }\n}\n[routerLink][_ngcontent-%COMP%]:focus-visible, \nbutton[_ngcontent-%COMP%]:focus-visible, \n[role=button][_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.375rem;\n}\n[routerLink][_ngcontent-%COMP%]:focus:not(:focus-visible), \nbutton[_ngcontent-%COMP%]:focus:not(:focus-visible), \n[role=button][_ngcontent-%COMP%]:focus:not(:focus-visible) {\n  outline: none;\n}\n*[_ngcontent-%COMP%] {\n  backface-visibility: hidden;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%] {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .logo-text[_ngcontent-%COMP%] {\n    font-weight: 800;\n  }\n  .menu-text[_ngcontent-%COMP%] {\n    font-weight: 600;\n  }\n  .navigation-menu[_ngcontent-%COMP%]   .menu-item[_ngcontent-%COMP%] {\n    border: 1px solid currentColor;\n    margin-bottom: 0.25rem;\n  }\n}\n/*# sourceMappingURL=left-sidebar.component.css.map */'] });
var LeftSidebarComponent = _LeftSidebarComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LeftSidebarComponent, [{
    type: Component,
    args: [{ selector: "app-left-sidebar", standalone: true, imports: [MenuComponent], template: '<!-- left-sidebar.component.html - MODERNIZADO CON TAILWIND -->\r\n<aside\r\n  class="w-80 xl:w-96 min-h-screen py-8 pl-8 pr-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 hidden md:block sticky top-0 flex-shrink-0 backdrop-blur-sm"\r\n>\r\n  <!-- Logo Section -->\r\n  <div\r\n    class="font-bold text-xl flex items-center gap-x-3 cursor-pointer logo-section mb-12 group"\r\n    routerLink="/"\r\n  >\r\n    <!-- Logo Icon with Animation -->\r\n    <div class="relative">\r\n      <svg\r\n        class="h-10 w-10 fill-red-500 group-hover:fill-red-400 transition-all duration-300 transform group-hover:scale-110 logo-icon"\r\n        xmlns="http://www.w3.org/2000/svg"\r\n        viewBox="0 0 24 24"\r\n      >\r\n        <path\r\n          d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r\n        ></path>\r\n      </svg>\r\n\r\n      <!-- Glow Effect -->\r\n      <div\r\n        class="absolute inset-0 rounded-full bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"\r\n      ></div>\r\n    </div>\r\n\r\n    <!-- Logo Text -->\r\n    <div\r\n      class="tracking-wide text-white group-hover:text-red-300 transition-colors duration-300 logo-text"\r\n    >\r\n      GPTV<span class="text-red-500 group-hover:text-red-400">.</span>\r\n    </div>\r\n  </div>\r\n\r\n  <!-- Navigation Menu Section -->\r\n  <div class="navigation-menu">\r\n    <app-menu></app-menu>\r\n  </div>\r\n</aside>\r\n', styles: ['/* src/app/components/left-sidebar/left-sidebar.component.scss */\naside {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;\n  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);\n}\naside::-webkit-scrollbar {\n  width: 6px;\n}\naside::-webkit-scrollbar-track {\n  background: transparent;\n}\naside::-webkit-scrollbar-thumb {\n  background-color: rgba(156, 163, 175, 0.5);\n  border-radius: 3px;\n  transition: background-color 0.2s ease;\n}\naside::-webkit-scrollbar-thumb:hover {\n  background-color: rgba(156, 163, 175, 0.8);\n}\n@media (prefers-color-scheme: dark) {\n  aside {\n    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);\n  }\n}\n.logo-section {\n  will-change: transform;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.logo-section:hover {\n  transform: translateY(-1px);\n}\n.logo-section .logo-icon {\n  transform: translateZ(0);\n  backface-visibility: hidden;\n  transition: all 0.3s ease;\n}\n.logo-section .logo-icon:hover {\n  filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3));\n}\n.logo-section .logo-text {\n  transition: all 0.2s ease;\n}\n.logo-section .logo-text:hover {\n  letter-spacing: 0.05em;\n}\n.navigation-menu {\n  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.navigation-menu .menu-item {\n  position: relative;\n  transition: all 0.2s ease;\n  border-radius: 0.5rem;\n}\n.navigation-menu .menu-item::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  width: 0;\n  background:\n    linear-gradient(\n      135deg,\n      rgb(239, 68, 68),\n      rgb(220, 38, 38));\n  border-radius: 0 0.25rem 0.25rem 0;\n  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  z-index: -1;\n}\n.navigation-menu .menu-item:hover,\n.navigation-menu .menu-item.active {\n  background-color: rgba(239, 68, 68, 0.05);\n  transform: translateX(4px);\n}\n.navigation-menu .menu-item:hover::before,\n.navigation-menu .menu-item.active::before {\n  width: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  .navigation-menu .menu-item:hover,\n  .navigation-menu .menu-item.active {\n    background-color: rgba(239, 68, 68, 0.1);\n  }\n}\n.navigation-menu .menu-item:active {\n  transform: translateX(2px) scale(0.98);\n}\n.navigation-menu .menu-icon {\n  transition: all 0.2s ease;\n}\n.menu-item:hover .navigation-menu .menu-icon {\n  transform: scale(1.1);\n  color: rgb(239, 68, 68);\n}\n.navigation-menu .menu-text {\n  transition: all 0.2s ease;\n}\n.menu-item:hover .navigation-menu .menu-text {\n  font-weight: 600;\n  color: rgb(239, 68, 68);\n}\n@media (prefers-color-scheme: dark) {\n  .menu-item:hover .navigation-menu .menu-text {\n    color: rgb(248, 113, 113);\n  }\n}\n@media (max-width: 768px) {\n  aside {\n    transform: translateX(-100%);\n    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  aside.mobile-open {\n    transform: translateX(0);\n  }\n}\n[routerLink]:focus-visible,\nbutton:focus-visible,\n[role=button]:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.375rem;\n}\n[routerLink]:focus:not(:focus-visible),\nbutton:focus:not(:focus-visible),\n[role=button]:focus:not(:focus-visible) {\n  outline: none;\n}\n* {\n  backface-visibility: hidden;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n@media (prefers-reduced-motion: reduce) {\n  * {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .logo-text {\n    font-weight: 800;\n  }\n  .menu-text {\n    font-weight: 600;\n  }\n  .navigation-menu .menu-item {\n    border: 1px solid currentColor;\n    margin-bottom: 0.25rem;\n  }\n}\n/*# sourceMappingURL=left-sidebar.component.css.map */\n'] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LeftSidebarComponent, { className: "LeftSidebarComponent", filePath: "src/app/components/left-sidebar/left-sidebar.component.ts", lineNumber: 11 });
})();

// src/app/components/right-sidebar/right-sidebar.component.ts
function RightSidebarComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275element(2, "div", 15);
    \u0275\u0275elementStart(3, "div", 16);
    \u0275\u0275element(4, "div", 17)(5, "div", 18)(6, "div", 19);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 14);
    \u0275\u0275element(8, "div", 15);
    \u0275\u0275elementStart(9, "div", 16);
    \u0275\u0275element(10, "div", 17)(11, "div", 18)(12, "div", 19);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 14);
    \u0275\u0275element(14, "div", 15);
    \u0275\u0275elementStart(15, "div", 16);
    \u0275\u0275element(16, "div", 17)(17, "div", 18)(18, "div", 19);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "p", 20);
    \u0275\u0275text(20, "Cargando pel\xEDculas destacadas...");
    \u0275\u0275elementEnd()();
  }
}
function RightSidebarComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 21)(1, "div", 22);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 23);
    \u0275\u0275element(3, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "p", 25);
    \u0275\u0275text(5, "No hay pel\xEDculas disponibles");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 26);
    \u0275\u0275listener("click", function RightSidebarComponent_div_12_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.forceReload());
    });
    \u0275\u0275text(7, " Recargar ");
    \u0275\u0275elementEnd()();
  }
}
function RightSidebarComponent_div_13_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275listener("click", function RightSidebarComponent_div_13_div_2_Template_div_click_0_listener() {
      const movie_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.navigateTo(movie_r5));
    });
    \u0275\u0275elementStart(1, "div", 36)(2, "div", 37)(3, "img", 38);
    \u0275\u0275listener("error", function RightSidebarComponent_div_13_div_2_Template_img_error_3_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onImageError($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "div", 39);
    \u0275\u0275elementStart(5, "div", 40)(6, "div", 41);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 42);
    \u0275\u0275element(8, "path", 43);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "div", 44)(10, "div", 45)(11, "h3", 46);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "p", 47);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 48)(16, "div", 49);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(17, "svg", 50);
    \u0275\u0275element(18, "path", 51);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(19, "span", 52);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const movie_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275attribute("aria-label", "Ver detalles de " + movie_r5.title.value);
    \u0275\u0275advance(3);
    \u0275\u0275property("src", ctx_r1.getMovieImageUrl(movie_r5), \u0275\u0275sanitizeUrl)("alt", movie_r5.title.value + " poster");
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate1(" ", movie_r5.title.value, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getMovieCategory(movie_r5), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r1.formatRating(movie_r5.starRating));
  }
}
function RightSidebarComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27)(1, "div", 28);
    \u0275\u0275template(2, RightSidebarComponent_div_13_div_2_Template, 21, 6, "div", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 30)(4, "button", 31);
    \u0275\u0275listener("click", function RightSidebarComponent_div_13_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.navigateTo2("movie"));
    });
    \u0275\u0275elementStart(5, "span", 32)(6, "span");
    \u0275\u0275text(7, "Ver M\xE1s Pel\xEDculas");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 33);
    \u0275\u0275element(9, "path", 34);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.popular_movies())("ngForTrackBy", ctx_r1.trackByMovieId);
  }
}
function RightSidebarComponent_div_14_div_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 61);
    \u0275\u0275listener("click", function RightSidebarComponent_div_14_div_8_Template_div_click_0_listener() {
      const serie_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.navigateTo(serie_r8));
    });
    \u0275\u0275elementStart(1, "div", 36)(2, "div", 37)(3, "img", 38);
    \u0275\u0275listener("error", function RightSidebarComponent_div_14_div_8_Template_img_error_3_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onImageError($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "div", 39);
    \u0275\u0275elementStart(5, "div", 40)(6, "div", 62);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 42);
    \u0275\u0275element(8, "path", 43);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "div", 44)(10, "div", 45)(11, "h3", 63);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "p", 47);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 48)(16, "div", 49);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(17, "svg", 50);
    \u0275\u0275element(18, "path", 51);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(19, "span", 52);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const serie_r8 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275attribute("aria-label", "Ver detalles de " + serie_r8.title.value);
    \u0275\u0275advance(3);
    \u0275\u0275property("src", ctx_r1.getSerieImageUrl(serie_r8), \u0275\u0275sanitizeUrl)("alt", serie_r8.title.value + " poster");
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate1(" ", serie_r8.title.value, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getSerieCategory(serie_r8), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r1.formatRating(serie_r8.starRating));
  }
}
function RightSidebarComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 53)(1, "div", 4)(2, "h2", 54);
    \u0275\u0275text(3, " Series Destacadas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 55);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 56);
    \u0275\u0275element(6, "path", 57);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "div", 13);
    \u0275\u0275template(8, RightSidebarComponent_div_14_div_8_Template, 21, 6, "div", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 59)(10, "button", 60);
    \u0275\u0275listener("click", function RightSidebarComponent_div_14_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.navigateTo2("series"));
    });
    \u0275\u0275elementStart(11, "span", 32)(12, "span");
    \u0275\u0275text(13, "Ver M\xE1s Series");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(14, "svg", 33);
    \u0275\u0275element(15, "path", 34);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275property("ngForOf", ctx_r1.popular_series())("ngForTrackBy", ctx_r1.trackBySerieId);
  }
}
var _RightSidebarComponent = class _RightSidebarComponent {
  constructor() {
    this.homeDataService = inject(HomeDataService);
    this.tvGuide = inject(TvGuideService);
    this.router = inject(Router);
    this.destroyRef = inject(DestroyRef);
    this.popular_movies = signal([]);
    this.popular_series = signal([]);
    this.isLoading = signal(true);
  }
  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================
  ngOnInit() {
    console.log("\u{1F527} RIGHT-SIDEBAR - Initializing with corrected SOLID system");
    this.initializeDataStreams();
    try {
      if (this.popular_movies().length === 0) {
        console.log("\u{1F504} RIGHT-SIDEBAR - Triggering peliculas destacadas load");
        this.tvGuide.setPeliculasDestacadas();
      }
      if (this.popular_series().length === 0) {
        console.log("\u{1F504} RIGHT-SIDEBAR - Triggering series destacadas load");
        this.tvGuide.setSeriesDestacadas();
      }
    } catch (e) {
    }
  }
  // ===============================================
  // DATA INITIALIZATION
  // ===============================================
  /**
   * Inicializar streams de datos desde HomeDataService
   */
  initializeDataStreams() {
    console.log("\u{1F4E1} RIGHT-SIDEBAR - Setting up data streams");
    this.homeDataService.popularMovies$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((movies) => {
      console.log("\u{1F3AC} RIGHT-SIDEBAR - Popular movies received:", movies.length);
      if (movies && movies.length > 0) {
        const convertedMovies = this.convertToSidebarFormat(movies, "movie");
        this.popular_movies.set(convertedMovies);
        this.isLoading.set(false);
        console.log("\u2705 RIGHT-SIDEBAR - Movies converted and set:", convertedMovies.length);
      } else {
        console.log("\u26A0\uFE0F RIGHT-SIDEBAR - No movies received, keeping loading state");
      }
    });
    this.tvGuide.getSeriesDestacadas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((series) => {
      if (series && series.length > 0) {
        const convertedSeries = this.convertToSidebarFormat(series, "series");
        this.popular_series.set(convertedSeries);
        console.log("\u{1F4FA} RIGHT-SIDEBAR - Series received and set:", convertedSeries.length);
      }
    });
    this.homeDataService.loading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => {
      if (!loading && this.popular_movies().length === 0) {
        setTimeout(() => {
          if (this.popular_movies().length === 0) {
            console.log("\u23F0 RIGHT-SIDEBAR - Loading timeout, no movies available");
            this.isLoading.set(false);
          }
        }, 2e3);
      }
    });
  }
  // ===============================================
  // DATA CONVERSION METHODS
  // ===============================================
  /**
   * Convierte IFeaturedMovie al formato que espera el template del sidebar
   */
  convertToSidebarFormat(movies, type) {
    const maxItems = 4;
    return movies.slice(0, maxItems).map((movie, index) => {
      const rawTitle = typeof movie?.title === "string" ? movie.title : movie?.title?.value || movie?.name || "";
      const baseTitle = rawTitle || `${type === "movie" ? "Pel\xEDcula" : "Serie"} ${index + 1}`;
      return {
        id: movie.id || movie.tmdbId || `${type}_${index}`,
        title: {
          value: type === "series" ? `${baseTitle} (Serie)` : baseTitle
        },
        category: {
          value: type === "series" ? movie.category || "Series,Drama" : movie.category || "Cine,Drama"
        },
        icon: this.getValidImageUrl(movie, index),
        starRating: this.normalizeRating(movie.rating || movie.starRating)
      };
    });
  }
  /**
   * Normaliza el rating a un formato consistente
   */
  normalizeRating(rating) {
    if (!rating)
      return "6.0";
    if (typeof rating === "number") {
      return rating.toFixed(1);
    }
    if (typeof rating === "string") {
      if (rating.includes("/10")) {
        const parts = rating.split("/10");
        return parts[0] || "6.0";
      }
      const numRating = parseFloat(rating);
      if (!isNaN(numRating)) {
        return numRating.toFixed(1);
      }
    }
    return "6.0";
  }
  /**
   * Obtiene URL de poster por defecto
   */
  getDefaultPosterUrl() {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGE1NTY4Ii8+CjxwYXRoIGQ9Ik00NS41IDk1TDYwIDgwVjEyMEw0NS41IDEwNVpNNzUgODBMMTA0LjUgOTVMNzUgMTEwVjgwWiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4K";
  }
  /**
   * NUEVO: Obtiene una imagen válida, evitando llamadas externas innecesarias
   */
  getValidImageUrl(movie, index) {
    const staticImages = [
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNkYzI2MjYiLz48cGF0aCBkPSJNNjAgNzBMMTAwIDk1TDYwIDEyMFY3MFpNNzUgNDBIODVWNjBINzVWNDBaTTc1IDE0MEg4NVYxNjBINzVWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=",
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=",
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNTk1MjEiLz48cGF0aCBkPSJNNTUgNzBMMTAzIDk1TDU1IDEyMFY3MFpNNzIgNDBIODJWNjBINzJWNDBaTTcyIDE0MEg4MlYxNjBINzJWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=",
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM4YjVjZjYiLz48cGF0aCBkPSJNNTggNzBMMTAxIDk1TDU4IDEyMFY3MFpNNzQgNDBIODRWNjBINzRWNDBaTTc0IDE0MEg4NFYxNjBINzRWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo="
    ];
    if (movie.poster && this.isValidImageUrl(movie.poster)) {
      return movie.poster;
    }
    return staticImages[index % staticImages.length];
  }
  /**
   * Verifica si una URL es válida y no es un placeholder
   */
  isValidImageUrl(url) {
    if (!url)
      return false;
    if (url.includes("placeholder.com") || url.includes("via.placeholder") || url.includes("placehold")) {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  // ===============================================
  // NAVIGATION METHODS
  // ===============================================
  /**
   * Navegar a detalles de una película/serie
   */
  navigateTo(item) {
    const rawTitle = item?.title?.value || "";
    console.log("\u{1F517} RIGHT-SIDEBAR - Navigating to details:", rawTitle);
    const slug = slugify(rawTitle);
    const cat = item?.category?.value || "";
    const looksLikeMovie = cat.startsWith("Cine") || !!item.tmdbId || !!item.icon;
    if (looksLikeMovie) {
      this.router.navigate(["/peliculas", slug]);
    } else {
      this.router.navigate(["/programas", slug]);
    }
  }
  /**
   * Navegar a listas de películas o series
   */
  navigateTo2(type) {
    console.log("\u{1F517} RIGHT-SIDEBAR - Navigating to list:", type);
    if (type === "movie") {
      try {
        this.homeDataService.getCurrentState();
      } catch {
      }
      this.tvGuide.setIsMovies();
      this.router.navigate(["programacion-tv/peliculas"]);
    } else if (type === "serie") {
      this.tvGuide.setIsSeries();
      this.router.navigate(["programacion-tv/series"]);
    }
  }
  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================
  /**
   * Obtiene la URL de imagen para una película
   */
  getMovieImageUrl(movie) {
    if (movie.icon && !movie.icon.includes("picons_dobleM")) {
      return movie.icon;
    }
    return this.getDefaultPosterUrl();
  }
  /**
   * Obtiene la URL de imagen para una serie
   */
  getSerieImageUrl(serie) {
    return serie.icon || this.getDefaultPosterUrl();
  }
  /**
   * Obtiene la categoría de una película
   */
  getMovieCategory(movie) {
    if (!movie?.category?.value)
      return "Drama";
    const val = movie.category.value;
    let raw = "";
    if (typeof val === "string")
      raw = val;
    else if (Array.isArray(val))
      raw = val.join(",");
    else if (val && typeof val === "object")
      raw = val.value || val.name || Object.values(val).join(",");
    else
      raw = String(val || "");
    const parts = raw.split(",");
    return parts[1]?.trim() || parts[0]?.trim() || "Drama";
  }
  /**
   * Obtiene la categoría de una serie
   */
  getSerieCategory(serie) {
    if (!serie?.category?.value)
      return "Drama";
    const val = serie.category.value;
    let raw = "";
    if (typeof val === "string")
      raw = val;
    else if (Array.isArray(val))
      raw = val.join(",");
    else if (val && typeof val === "object")
      raw = val.value || val.name || Object.values(val).join(",");
    else
      raw = String(val || "");
    const parts = raw.split(",");
    return parts[1]?.trim() || parts[0]?.trim() || "Drama";
  }
  /**
   * Formatea el rating para mostrar
   */
  formatRating(rating) {
    if (!rating)
      return "N/A";
    const normalizedRating = this.normalizeRating(rating);
    if (!normalizedRating.includes("/10")) {
      return `${normalizedRating}/10`;
    }
    return normalizedRating;
  }
  /**
   * Maneja errores de carga de imágenes
   */
  onImageError(event) {
    const img = event.target;
    img.src = this.getDefaultPosterUrl();
  }
  /**
   * Verifica si está en modo debug
   */
  isDebugMode() {
    return !environment.production;
  }
  // ===============================================
  // TRACK BY FUNCTIONS
  // ===============================================
  /**
   * Track by function para películas
   */
  trackByMovieId(index, movie) {
    const title = movie.title?.value || "";
    return (movie.id || title || index.toString()).toString();
  }
  /**
   * Track by function para series
   */
  trackBySerieId(index, serie) {
    const title = serie.title?.value || "";
    return (serie.id || title || index.toString()).toString();
  }
  // ===============================================
  // DEBUG METHODS
  // ===============================================
  /**
   * Debug del estado del componente
   */
  debugState() {
    console.log("\u{1F50D} RIGHT-SIDEBAR - Component state:");
    console.table({
      "Popular Movies": this.popular_movies().length,
      "Popular Series": this.popular_series().length,
      "Is Loading": this.isLoading()
    });
    console.log("Movies data:", this.popular_movies());
    console.log("Series data:", this.popular_series());
    const serviceState = this.homeDataService.getCurrentState();
    console.log("Service state:", {
      featuredMovie: serviceState.featuredMovie?.title || "none",
      popularMovies: serviceState.popularMovies.length,
      isLoading: serviceState.isLoading
    });
  }
  /**
   * Fuerza la recarga de datos
   */
  forceReload() {
    console.log("\u{1F504} RIGHT-SIDEBAR - Forcing data reload");
    this.isLoading.set(true);
    this.popular_movies.set([]);
    this.popular_series.set([]);
    this.homeDataService.refreshData().subscribe((result) => {
      console.log("\u{1F504} RIGHT-SIDEBAR - Refresh result:", result.success);
    });
  }
};
_RightSidebarComponent.\u0275fac = function RightSidebarComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _RightSidebarComponent)();
};
_RightSidebarComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RightSidebarComponent, selectors: [["app-right-sidebar"]], decls: 15, vars: 4, consts: [[1, "w-80", "xl:w-96", "h-full", "bg-gradient-to-b", "from-gray-900", "via-gray-800", "to-gray-900", "border-l", "border-gray-700/50", "hidden", "lg:flex", "flex-col", "backdrop-blur-sm"], [1, "flex-shrink-0", "p-6", "pb-4", "border-b", "border-gray-700/30", "bg-gray-900/90", "backdrop-blur-sm", "sticky", "top-0", "z-10"], [1, "flex-1", "overflow-y-auto", "scrollbar-thin", "scrollbar-thumb-gray-700", "scrollbar-track-gray-800/50"], [1, "p-6"], [1, "flex", "items-center", "justify-between", "mb-6"], [1, "text-lg", "font-bold", "bg-gradient-to-r", "from-red-400", "to-red-600", "bg-clip-text", "text-transparent"], [1, "w-8", "h-8", "bg-red-500/20", "rounded-lg", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-4", "h-4", "text-red-400"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"], ["class", "space-y-4", 4, "ngIf"], ["class", "text-center py-8", 4, "ngIf"], ["class", "flex-1 overflow-y-auto custom-scrollbar", 4, "ngIf"], ["class", "px-6 pb-6", 4, "ngIf"], [1, "space-y-4"], [1, "flex", "space-x-3", "animate-pulse"], [1, "w-16", "h-20", "bg-gray-700/50", "rounded-lg"], [1, "flex-1", "space-y-2"], [1, "h-4", "bg-gray-700/50", "rounded", "w-3/4"], [1, "h-3", "bg-gray-700/50", "rounded", "w-1/2"], [1, "h-3", "bg-gray-700/50", "rounded", "w-1/4"], [1, "text-center", "text-gray-400", "text-sm", "mt-4"], [1, "text-center", "py-8"], [1, "w-16", "h-16", "mx-auto", "mb-4", "bg-gray-800/50", "rounded-2xl", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-8", "h-8", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10h6V6H9z"], [1, "text-gray-400", "text-sm", "mb-4"], [1, "px-4", "py-2", "bg-red-600/20", "hover:bg-red-600/30", "text-red-400", "hover:text-red-300", "rounded-lg", "transition-all", "duration-200", "text-sm", "font-medium", 3, "click"], [1, "flex-1", "overflow-y-auto", "custom-scrollbar"], [1, "space-y-4", "pr-2"], ["class", "group flex space-x-3 cursor-pointer p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10", 3, "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "mt-6", "flex-shrink-0"], ["aria-label", "Ver m\xE1s pel\xEDculas", 1, "w-full", "px-4", "py-3", "bg-gradient-to-r", "from-red-600/20", "to-red-700/20", "hover:from-red-600/30", "hover:to-red-700/30", "border", "border-red-500/30", "hover:border-red-500/50", "rounded-xl", "text-center", "font-medium", "text-red-400", "hover:text-red-300", "text-sm", "transition-all", "duration-300", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-red-500/50", 3, "click"], [1, "flex", "items-center", "justify-center", "space-x-2"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-4", "h-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M17 8l4 4m0 0l-4 4m4-4H3"], [1, "group", "flex", "space-x-3", "cursor-pointer", "p-3", "rounded-xl", "bg-gray-800/30", "hover:bg-gray-800/50", "border", "border-gray-700/30", "hover:border-red-500/30", "transition-all", "duration-300", "hover:shadow-lg", "hover:shadow-red-500/10", 3, "click"], [1, "w-16", "flex-shrink-0"], [1, "relative", "aspect-[2/3]", "rounded-lg", "overflow-hidden"], ["loading", "lazy", 1, "w-full", "h-full", "object-cover", "transition-transform", "duration-300", "group-hover:scale-110", 3, "error", "src", "alt"], [1, "absolute", "inset-0", "bg-gradient-to-t", "from-black/60", "via-transparent", "to-transparent", "opacity-0", "group-hover:opacity-100", "transition-opacity", "duration-300"], [1, "absolute", "inset-0", "flex", "items-center", "justify-center", "opacity-0", "group-hover:opacity-100", "transition-opacity", "duration-300"], [1, "w-8", "h-8", "bg-red-500/90", "rounded-full", "flex", "items-center", "justify-center"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-4", "h-4", "text-white", "ml-0.5"], ["d", "M8.445 14.832A1 1 0 0010 14v-4a1 1 0 00-.555-.832L6 7.732V4a1 1 0 00-1.496-.868l-4 2.132A1 1 0 000 6v8a1 1 0 00.504.868l4 2.132A1 1 0 006 16v-3.732l3.445-1.436z"], [1, "flex", "flex-col", "justify-between", "flex-1", "min-w-0"], [1, "space-y-1"], [1, "text-white", "font-semibold", "text-sm", "line-clamp-2", "leading-tight", "group-hover:text-red-300", "transition-colors"], [1, "text-gray-400", "text-xs"], [1, "flex", "items-center", "justify-between", "mt-2"], [1, "flex", "items-center", "space-x-1"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-4", "h-4", "text-yellow-400"], ["d", "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"], [1, "text-yellow-400", "text-xs", "font-medium"], [1, "px-6", "pb-6"], [1, "text-lg", "font-bold", "bg-gradient-to-r", "from-blue-400", "to-blue-600", "bg-clip-text", "text-transparent"], [1, "w-8", "h-8", "bg-blue-500/20", "rounded-lg", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-4", "h-4", "text-blue-400"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], ["class", "group flex space-x-3 cursor-pointer p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10", 3, "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "mt-6"], ["aria-label", "Ver m\xE1s series", 1, "w-full", "px-4", "py-3", "bg-gradient-to-r", "from-blue-600/20", "to-blue-700/20", "hover:from-blue-600/30", "hover:to-blue-700/30", "border", "border-blue-500/30", "hover:border-blue-500/50", "rounded-xl", "text-center", "font-medium", "text-blue-400", "hover:text-blue-300", "text-sm", "transition-all", "duration-300", "hover:scale-105", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500/50", 3, "click"], [1, "group", "flex", "space-x-3", "cursor-pointer", "p-3", "rounded-xl", "bg-gray-800/30", "hover:bg-gray-800/50", "border", "border-gray-700/30", "hover:border-blue-500/30", "transition-all", "duration-300", "hover:shadow-lg", "hover:shadow-blue-500/10", 3, "click"], [1, "w-8", "h-8", "bg-blue-500/90", "rounded-full", "flex", "items-center", "justify-center"], [1, "text-white", "font-semibold", "text-sm", "line-clamp-2", "leading-tight", "group-hover:text-blue-300", "transition-colors"]], template: function RightSidebarComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "aside", 0)(1, "div", 1);
    \u0275\u0275element(2, "app-autocomplete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 2)(4, "div", 3)(5, "div", 4)(6, "h2", 5);
    \u0275\u0275text(7, " Pel\xEDculas Destacadas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 6);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 7);
    \u0275\u0275element(10, "path", 8);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(11, RightSidebarComponent_div_11_Template, 21, 0, "div", 9)(12, RightSidebarComponent_div_12_Template, 8, 0, "div", 10)(13, RightSidebarComponent_div_13_Template, 10, 2, "div", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, RightSidebarComponent_div_14_Template, 16, 2, "div", 12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(11);
    \u0275\u0275property("ngIf", ctx.popular_movies().length === 0 && ctx.isLoading());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.popular_movies().length === 0 && !ctx.isLoading());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.popular_movies().length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.popular_series().length > 0);
  }
}, dependencies: [CommonModule, NgForOf, NgIf, AutocompleteComponent], styles: ['\n\naside[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;\n  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background-color: rgba(156, 163, 175, 0.5);\n  border-radius: 3px;\n  transition: background-color 0.2s ease;\n}\naside[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background-color: rgba(156, 163, 175, 0.8);\n}\n@media (prefers-color-scheme: dark) {\n  aside[_ngcontent-%COMP%] {\n    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);\n  }\n}\n.section-title[_ngcontent-%COMP%] {\n  position: relative;\n}\n.section-title[_ngcontent-%COMP%]::after {\n  content: "";\n  position: absolute;\n  bottom: -0.5rem;\n  left: 0;\n  width: 2rem;\n  height: 2px;\n  background:\n    linear-gradient(\n      90deg,\n      rgb(239, 68, 68),\n      transparent);\n  border-radius: 1px;\n}\n.content-card[_ngcontent-%COMP%] {\n  position: relative;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: 0.75rem;\n  overflow: hidden;\n}\n.content-card[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      135deg,\n      transparent,\n      rgba(239, 68, 68, 0.05));\n  opacity: 0;\n  transition: opacity 0.3s ease;\n  z-index: -1;\n}\n.content-card[_ngcontent-%COMP%]:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n}\n.content-card[_ngcontent-%COMP%]:hover::before {\n  opacity: 1;\n}\n.content-card[_ngcontent-%COMP%]:hover   .card-image[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n}\n.content-card[_ngcontent-%COMP%]:hover   .card-title[_ngcontent-%COMP%] {\n  color: rgb(239, 68, 68);\n}\n@media (prefers-color-scheme: dark) {\n  .content-card[_ngcontent-%COMP%]:hover   .card-title[_ngcontent-%COMP%] {\n    color: rgb(248, 113, 113);\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .content-card[_ngcontent-%COMP%]:hover {\n    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);\n  }\n}\n.content-card[_ngcontent-%COMP%]:active {\n  transform: translateY(-1px) scale(0.98);\n}\n.content-card[_ngcontent-%COMP%]   .card-image[_ngcontent-%COMP%] {\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  will-change: transform;\n}\n.content-card[_ngcontent-%COMP%]   .card-title[_ngcontent-%COMP%] {\n  transition: color 0.2s ease;\n  font-weight: 600;\n}\n.content-card[_ngcontent-%COMP%]   .card-subtitle[_ngcontent-%COMP%] {\n  transition: opacity 0.2s ease;\n}\n.content-card[_ngcontent-%COMP%]:hover   .content-card[_ngcontent-%COMP%]   .card-subtitle[_ngcontent-%COMP%] {\n  opacity: 0.8;\n}\n.rating-container[_ngcontent-%COMP%]   .rating-badge[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #F5C518,\n      #E6B800);\n  transition: all 0.2s ease;\n}\n.rating-container[_ngcontent-%COMP%]   .rating-badge[_ngcontent-%COMP%]:hover {\n  transform: scale(1.05);\n  box-shadow: 0 4px 8px rgba(245, 197, 24, 0.3);\n}\n.rating-container[_ngcontent-%COMP%]   .rating-text[_ngcontent-%COMP%] {\n  font-weight: 700;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\n}\n.action-button[_ngcontent-%COMP%] {\n  position: relative;\n  overflow: hidden;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.action-button[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: -100%;\n  width: 100%;\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.2),\n      transparent);\n  transition: left 0.6s ease;\n}\n.action-button[_ngcontent-%COMP%]:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 8px 25px -5px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.1);\n}\n.action-button[_ngcontent-%COMP%]:hover::before {\n  left: 100%;\n}\n.action-button[_ngcontent-%COMP%]:active {\n  transform: translateY(0) scale(0.98);\n}\n.content-list[_ngcontent-%COMP%]   .list-item[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  margin-bottom: 0.5rem;\n  border-radius: 0.5rem;\n  transition: all 0.2s ease;\n}\n.content-list[_ngcontent-%COMP%]   .list-item[_ngcontent-%COMP%]:last-child {\n  margin-bottom: 0;\n}\n.content-list[_ngcontent-%COMP%]   .list-item[_ngcontent-%COMP%]:hover {\n  background-color: rgba(0, 0, 0, 0.03);\n}\n@media (prefers-color-scheme: dark) {\n  .content-list[_ngcontent-%COMP%]   .list-item[_ngcontent-%COMP%]:hover {\n    background-color: rgba(255, 255, 255, 0.03);\n  }\n}\n@media (max-width: 1024px) {\n  aside[_ngcontent-%COMP%] {\n    width: 100%;\n    position: fixed;\n    top: 0;\n    right: -100%;\n    z-index: 50;\n    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  aside.mobile-open[_ngcontent-%COMP%] {\n    right: 0;\n  }\n}\n.content-card[_ngcontent-%COMP%], \n.action-button[_ngcontent-%COMP%] {\n  will-change: transform;\n  backface-visibility: hidden;\n}\nbutton[_ngcontent-%COMP%]:focus-visible, \n[role=button][_ngcontent-%COMP%]:focus-visible, \n.content-card[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.375rem;\n}\nbutton[_ngcontent-%COMP%]:focus:not(:focus-visible), \n[role=button][_ngcontent-%COMP%]:focus:not(:focus-visible), \n.content-card[_ngcontent-%COMP%]:focus:not(:focus-visible) {\n  outline: none;\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%] {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .content-card[_ngcontent-%COMP%] {\n    border: 1px solid currentColor;\n  }\n  .content-card[_ngcontent-%COMP%]:hover {\n    border-width: 2px;\n  }\n  .action-button[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n  .rating-badge[_ngcontent-%COMP%] {\n    border: 1px solid #000;\n  }\n}\n/*# sourceMappingURL=right-sidebar.component.css.map */'] });
var RightSidebarComponent = _RightSidebarComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RightSidebarComponent, [{
    type: Component,
    args: [{ selector: "app-right-sidebar", standalone: true, imports: [CommonModule, AutocompleteComponent], template: `<!-- right-sidebar.component.html - SCROLL REORGANIZADO -->\r
<aside class="w-80 xl:w-96 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-l border-gray-700/50 hidden lg:flex flex-col backdrop-blur-sm">\r
  \r
  <!-- Search Section (Fixed at top) -->\r
  <div class="flex-shrink-0 p-6 pb-4 border-b border-gray-700/30 bg-gray-900/90 backdrop-blur-sm sticky top-0 z-10">\r
    <app-autocomplete></app-autocomplete>\r
  </div>\r
\r
  <!-- Scrollable Content Container -->\r
  <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">\r
    \r
    <!-- Pel\xEDculas Destacadas Section -->\r
    <div class="p-6">\r
      <div class="flex items-center justify-between mb-6">\r
        <h2 class="text-lg font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">\r
          Pel\xEDculas Destacadas\r
        </h2>\r
        <div class="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">\r
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"></path>\r
          </svg>\r
        </div>\r
      </div>\r
    \r
    <!-- Loading State -->\r
    <div *ngIf="popular_movies().length === 0 && isLoading()" class="space-y-4">\r
      <div class="flex space-x-3 animate-pulse">\r
        <div class="w-16 h-20 bg-gray-700/50 rounded-lg"></div>\r
        <div class="flex-1 space-y-2">\r
          <div class="h-4 bg-gray-700/50 rounded w-3/4"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/2"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/4"></div>\r
        </div>\r
      </div>\r
      <div class="flex space-x-3 animate-pulse">\r
        <div class="w-16 h-20 bg-gray-700/50 rounded-lg"></div>\r
        <div class="flex-1 space-y-2">\r
          <div class="h-4 bg-gray-700/50 rounded w-3/4"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/2"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/4"></div>\r
        </div>\r
      </div>\r
      <div class="flex space-x-3 animate-pulse">\r
        <div class="w-16 h-20 bg-gray-700/50 rounded-lg"></div>\r
        <div class="flex-1 space-y-2">\r
          <div class="h-4 bg-gray-700/50 rounded w-3/4"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/2"></div>\r
          <div class="h-3 bg-gray-700/50 rounded w-1/4"></div>\r
        </div>\r
      </div>\r
      <p class="text-center text-gray-400 text-sm mt-4">Cargando pel\xEDculas destacadas...</p>\r
    </div>\r
\r
    <!-- Empty State -->\r
    <div *ngIf="popular_movies().length === 0 && !isLoading()" class="text-center py-8">\r
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-2xl flex items-center justify-center">\r
        <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10h6V6H9z"></path>\r
        </svg>\r
      </div>\r
      <p class="text-gray-400 text-sm mb-4">No hay pel\xEDculas disponibles</p>\r
      <button (click)="forceReload()" \r
              class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium">\r
        Recargar\r
      </button>\r
    </div>\r
\r
    <!-- Movies List -->\r
    <div *ngIf="popular_movies().length > 0" class="flex-1 overflow-y-auto custom-scrollbar">\r
      <div class="space-y-4 pr-2">\r
        <div *ngFor="let movie of popular_movies(); let i = index; trackBy: trackByMovieId"\r
             class="group flex space-x-3 cursor-pointer p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"\r
             (click)="navigateTo(movie)"\r
             [attr.aria-label]="'Ver detalles de ' + movie.title.value">\r
        \r
        <!-- Movie Poster -->\r
        <div class="w-16 flex-shrink-0">\r
          <div class="relative aspect-[2/3] rounded-lg overflow-hidden">\r
            <img [src]="getMovieImageUrl(movie)"\r
                 [alt]="movie.title.value + ' poster'"\r
                 class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"\r
                 loading="lazy"\r
                 (error)="onImageError($event)">\r
            \r
            <!-- Overlay on Hover -->\r
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>\r
            \r
            <!-- Play Icon -->\r
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">\r
              <div class="w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center">\r
                <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">\r
                  <path d="M8.445 14.832A1 1 0 0010 14v-4a1 1 0 00-.555-.832L6 7.732V4a1 1 0 00-1.496-.868l-4 2.132A1 1 0 000 6v8a1 1 0 00.504.868l4 2.132A1 1 0 006 16v-3.732l3.445-1.436z"></path>\r
                </svg>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
        \r
        <!-- Movie Info -->\r
        <div class="flex flex-col justify-between flex-1 min-w-0">\r
          <div class="space-y-1">\r
            <h3 class="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-red-300 transition-colors">\r
              {{ movie.title.value }}\r
            </h3>\r
            <p class="text-gray-400 text-xs">\r
              {{ getMovieCategory(movie) }}\r
            </p>\r
          </div>\r
          \r
          <!-- Rating and Info -->\r
          <div class="flex items-center justify-between mt-2">\r
            <div class="flex items-center space-x-1">\r
              <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">\r
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>\r
              </svg>\r
              <span class="text-yellow-400 text-xs font-medium">{{ formatRating(movie.starRating) }}</span>\r
            </div>\r
          </div>\r
        </div>\r
        </div>\r
      </div>\r
      \r
      <!-- View More Movies Button -->\r
      <div class="mt-6 flex-shrink-0">\r
        <button (click)="navigateTo2('movie')"\r
                class="w-full px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 border border-red-500/30 hover:border-red-500/50 rounded-xl text-center font-medium text-red-400 hover:text-red-300 text-sm transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"\r
                aria-label="Ver m\xE1s pel\xEDculas">\r
          <span class="flex items-center justify-center space-x-2">\r
            <span>Ver M\xE1s Pel\xEDculas</span>\r
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>\r
            </svg>\r
          </span>\r
        </button>\r
      </div>\r
    </div>\r
    </div>\r
    \r
    <!-- Series Section -->\r
    <div class="px-6 pb-6" *ngIf="popular_series().length > 0">\r
      <div class="flex items-center justify-between mb-6">\r
        <h2 class="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">\r
          Series Destacadas\r
        </h2>\r
        <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">\r
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>\r
          </svg>\r
        </div>\r
      </div>\r
      \r
      <div class="space-y-4">\r
        <div *ngFor="let serie of popular_series(); let i = index; trackBy: trackBySerieId"\r
             class="group flex space-x-3 cursor-pointer p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"\r
             (click)="navigateTo(serie)"\r
             [attr.aria-label]="'Ver detalles de ' + serie.title.value">\r
          \r
          <!-- Serie Poster -->\r
          <div class="w-16 flex-shrink-0">\r
            <div class="relative aspect-[2/3] rounded-lg overflow-hidden">\r
              <img [src]="getSerieImageUrl(serie)"\r
                   [alt]="serie.title.value + ' poster'"\r
                   class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"\r
                   loading="lazy"\r
                   (error)="onImageError($event)">\r
              \r
              <!-- Overlay on Hover -->\r
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>\r
              \r
              <!-- Play Icon -->\r
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">\r
                <div class="w-8 h-8 bg-blue-500/90 rounded-full flex items-center justify-center">\r
                  <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">\r
                    <path d="M8.445 14.832A1 1 0 0010 14v-4a1 1 0 00-.555-.832L6 7.732V4a1 1 0 00-1.496-.868l-4 2.132A1 1 0 000 6v8a1 1 0 00.504.868l4 2.132A1 1 0 006 16v-3.732l3.445-1.436z"></path>\r
                  </svg>\r
                </div>\r
              </div>\r
            </div>\r
          </div>\r
          \r
          <!-- Serie Info -->\r
          <div class="flex flex-col justify-between flex-1 min-w-0">\r
            <div class="space-y-1">\r
              <h3 class="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">\r
                {{ serie.title.value }}\r
              </h3>\r
              <p class="text-gray-400 text-xs">\r
                {{ getSerieCategory(serie) }}\r
              </p>\r
            </div>\r
            \r
            <!-- Rating and Info -->\r
            <div class="flex items-center justify-between mt-2">\r
              <div class="flex items-center space-x-1">\r
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">\r
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>\r
                </svg>\r
                <span class="text-yellow-400 text-xs font-medium">{{ formatRating(serie.starRating) }}</span>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
      \r
      <!-- View More Series Button -->\r
      <div class="mt-6">\r
        <button (click)="navigateTo2('series')"\r
                class="w-full px-4 py-3 bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-center font-medium text-blue-400 hover:text-blue-300 text-sm transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"\r
                aria-label="Ver m\xE1s series">\r
          <span class="flex items-center justify-center space-x-2">\r
            <span>Ver M\xE1s Series</span>\r
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>\r
            </svg>\r
          </span>\r
        </button>\r
      </div>\r
    </div>\r
    \r
  </div>\r
\r
</aside>`, styles: ['/* src/app/components/right-sidebar/right-sidebar.component.scss */\naside {\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;\n  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);\n}\naside::-webkit-scrollbar {\n  width: 6px;\n}\naside::-webkit-scrollbar-track {\n  background: transparent;\n}\naside::-webkit-scrollbar-thumb {\n  background-color: rgba(156, 163, 175, 0.5);\n  border-radius: 3px;\n  transition: background-color 0.2s ease;\n}\naside::-webkit-scrollbar-thumb:hover {\n  background-color: rgba(156, 163, 175, 0.8);\n}\n@media (prefers-color-scheme: dark) {\n  aside {\n    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);\n  }\n}\n.section-title {\n  position: relative;\n}\n.section-title::after {\n  content: "";\n  position: absolute;\n  bottom: -0.5rem;\n  left: 0;\n  width: 2rem;\n  height: 2px;\n  background:\n    linear-gradient(\n      90deg,\n      rgb(239, 68, 68),\n      transparent);\n  border-radius: 1px;\n}\n.content-card {\n  position: relative;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: 0.75rem;\n  overflow: hidden;\n}\n.content-card::before {\n  content: "";\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(\n      135deg,\n      transparent,\n      rgba(239, 68, 68, 0.05));\n  opacity: 0;\n  transition: opacity 0.3s ease;\n  z-index: -1;\n}\n.content-card:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n}\n.content-card:hover::before {\n  opacity: 1;\n}\n.content-card:hover .card-image {\n  transform: scale(1.05);\n}\n.content-card:hover .card-title {\n  color: rgb(239, 68, 68);\n}\n@media (prefers-color-scheme: dark) {\n  .content-card:hover .card-title {\n    color: rgb(248, 113, 113);\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .content-card:hover {\n    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);\n  }\n}\n.content-card:active {\n  transform: translateY(-1px) scale(0.98);\n}\n.content-card .card-image {\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  will-change: transform;\n}\n.content-card .card-title {\n  transition: color 0.2s ease;\n  font-weight: 600;\n}\n.content-card .card-subtitle {\n  transition: opacity 0.2s ease;\n}\n.content-card:hover .content-card .card-subtitle {\n  opacity: 0.8;\n}\n.rating-container .rating-badge {\n  background:\n    linear-gradient(\n      135deg,\n      #F5C518,\n      #E6B800);\n  transition: all 0.2s ease;\n}\n.rating-container .rating-badge:hover {\n  transform: scale(1.05);\n  box-shadow: 0 4px 8px rgba(245, 197, 24, 0.3);\n}\n.rating-container .rating-text {\n  font-weight: 700;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\n}\n.action-button {\n  position: relative;\n  overflow: hidden;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.action-button::before {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: -100%;\n  width: 100%;\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.2),\n      transparent);\n  transition: left 0.6s ease;\n}\n.action-button:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 8px 25px -5px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.1);\n}\n.action-button:hover::before {\n  left: 100%;\n}\n.action-button:active {\n  transform: translateY(0) scale(0.98);\n}\n.content-list .list-item {\n  padding: 0.75rem;\n  margin-bottom: 0.5rem;\n  border-radius: 0.5rem;\n  transition: all 0.2s ease;\n}\n.content-list .list-item:last-child {\n  margin-bottom: 0;\n}\n.content-list .list-item:hover {\n  background-color: rgba(0, 0, 0, 0.03);\n}\n@media (prefers-color-scheme: dark) {\n  .content-list .list-item:hover {\n    background-color: rgba(255, 255, 255, 0.03);\n  }\n}\n@media (max-width: 1024px) {\n  aside {\n    width: 100%;\n    position: fixed;\n    top: 0;\n    right: -100%;\n    z-index: 50;\n    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  aside.mobile-open {\n    right: 0;\n  }\n}\n.content-card,\n.action-button {\n  will-change: transform;\n  backface-visibility: hidden;\n}\nbutton:focus-visible,\n[role=button]:focus-visible,\n.content-card:focus-visible {\n  outline: 2px solid rgb(239, 68, 68);\n  outline-offset: 2px;\n  border-radius: 0.375rem;\n}\nbutton:focus:not(:focus-visible),\n[role=button]:focus:not(:focus-visible),\n.content-card:focus:not(:focus-visible) {\n  outline: none;\n}\n@media (prefers-reduced-motion: reduce) {\n  * {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .content-card {\n    border: 1px solid currentColor;\n  }\n  .content-card:hover {\n    border-width: 2px;\n  }\n  .action-button {\n    border: 2px solid currentColor;\n  }\n  .rating-badge {\n    border: 1px solid #000;\n  }\n}\n/*# sourceMappingURL=right-sidebar.component.css.map */\n'] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RightSidebarComponent, { className: "RightSidebarComponent", filePath: "src/app/components/right-sidebar/right-sidebar.component.ts", lineNumber: 38 });
})();

// src/app/components/footer/footer.component.ts
var _FooterComponent = class _FooterComponent {
  constructor() {
    this.tdt = ["La 1", "La 2", "Antena 3", "Cuatro", "Telecinco", "La Sexta", "Mega", "Factor\xEDa de Ficci\xF3n", "Neox", "Nova", "Boing", "Divinity", "Energy", "Paramount Network", "DMAX", "Disney Channel", "Ten", "Clan", "Teledeporte", "Be Mad", "TRECE", "DKISS", "Atreseries", "GOL PLAY"];
    this.movistar = [
      "M+ #0",
      "M+ #Vamos",
      "M+ Estrenos",
      "M+ Estrenos 2",
      "M+ Oscars",
      "M+ Cl\xE1sicos",
      "M+ Acci\xF3n",
      "M+ Comedia",
      "M+ Drama",
      "M+ Cine Espa\xF1ol",
      "M+ Fest",
      "M+ Series",
      "M+ Series 2"
    ];
    this.currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    this.urls = this.tdt.concat(this.movistar);
  }
  ngOnInit() {
  }
};
_FooterComponent.\u0275fac = function FooterComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _FooterComponent)();
};
_FooterComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FooterComponent, selectors: [["app-footer"]], decls: 84, vars: 1, consts: [["role", "contentinfo", "aria-label", "Pie de p\xE1gina", 1, "footer", "mt-8", "z-30", "w-full"], ["itemscope", "", "itemtype", "https://schema.org/WPFooter", 1, "footer-inner"], ["itemprop", "publisher", "itemscope", "", "itemtype", "https://schema.org/Organization", 1, "brand"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "logo"], ["d", "M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"], ["itemprop", "name", 1, "brand-text"], [1, "dot"], ["itemprop", "url", "content", "https://guiatv.example.com/"], [1, "footer-columns", 2, "display", "flex", "gap", "1rem", "align-items", "flex-start", "flex", "1", "justify-content", "space-between"], [1, "col", "col-site", 2, "min-width", "200px", "max-width", "320px"], [1, "text-sm", "font-semibold"], ["aria-label", "Enlaces principales"], [2, "list-style", "none", "padding", "0", "margin", "0"], ["href", "/", 1, "footer-link"], ["href", "/guia-canales", 1, "footer-link"], ["href", "/que-ver-hoy", 1, "footer-link"], ["href", "/en-directo", 1, "footer-link"], ["href", "/blog", 1, "footer-link"], [1, "col", "col-legal", 2, "min-width", "200px", "max-width", "320px"], ["aria-label", "Enlaces legales"], ["href", "/avisolegal", 1, "footer-link"], ["href", "/privacidad", 1, "footer-link"], ["href", "/cookies", 1, "footer-link"], ["href", "/terminos", 1, "footer-link"], ["href", "/accesibilidad", 1, "footer-link"], [1, "col", "col-contact", 2, "min-width", "220px", "max-width", "360px"], [2, "font-style", "normal", "color", "inherit"], ["href", "mailto:soporte@tecnoriasl.com", 1, "footer-link"], ["href", "mailto:legal@tecnoriasl.com", 1, "footer-link"], [1, "mt-2"], [2, "display", "flex", "gap", "0.5rem", "margin-top", "0.5rem"], ["href", "https://twitter.com/", "target", "_blank", "rel", "noopener noreferrer", "aria-label", "Twitter", 1, "footer-link"], ["href", "https://facebook.com/", "target", "_blank", "rel", "noopener noreferrer", "aria-label", "Facebook", 1, "footer-link"], ["href", "https://instagram.com/", "target", "_blank", "rel", "noopener noreferrer", "aria-label", "Instagram", 1, "footer-link"], [2, "display", "flex", "align-items", "center", "gap", "1rem", "margin-top", "1rem", "width", "100%", "justify-content", "space-between", "flex-wrap", "wrap"], [1, "copyright", 2, "flex", "1", "min-width", "220px"], ["href", "https://tecnoriasl.com/", "target", "_blank", "rel", "noopener"], [2, "text-align", "right", "min-width", "220px"], ["href", "/sitemap", 1, "footer-link"], [2, "margin", "0 0.5rem", "color", "rgba(230, 238, 246, 0.5)"], ["href", "/rss.xml", 1, "footer-link"]], template: function FooterComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "footer", 0)(1, "div", 1)(2, "div", 2);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 3);
    \u0275\u0275element(4, "path", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div", 5);
    \u0275\u0275text(6, " GPTV");
    \u0275\u0275elementStart(7, "span", 6);
    \u0275\u0275text(8, ".");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(9, "meta", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div", 8)(11, "div", 9)(12, "h3", 10);
    \u0275\u0275text(13, "Explorar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "nav", 11)(15, "ul", 12)(16, "li")(17, "a", 13);
    \u0275\u0275text(18, "Inicio");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "li")(20, "a", 14);
    \u0275\u0275text(21, "Gu\xEDa de Canales");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(22, "li")(23, "a", 15);
    \u0275\u0275text(24, "Qu\xE9 ver hoy");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "li")(26, "a", 16);
    \u0275\u0275text(27, "En directo");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(28, "li")(29, "a", 17);
    \u0275\u0275text(30, "Blog");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(31, "div", 18)(32, "h3", 10);
    \u0275\u0275text(33, "Legal & Pol\xEDticas");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "nav", 19)(35, "ul", 12)(36, "li")(37, "a", 20);
    \u0275\u0275text(38, "Aviso Legal");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(39, "li")(40, "a", 21);
    \u0275\u0275text(41, "Pol\xEDtica de Privacidad");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(42, "li")(43, "a", 22);
    \u0275\u0275text(44, "Pol\xEDtica de Cookies");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(45, "li")(46, "a", 23);
    \u0275\u0275text(47, "T\xE9rminos y Condiciones");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(48, "li")(49, "a", 24);
    \u0275\u0275text(50, "Declaraci\xF3n de Accesibilidad");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(51, "div", 25)(52, "h3", 10);
    \u0275\u0275text(53, "Contacto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "address", 26)(55, "div");
    \u0275\u0275text(56, " Soporte: ");
    \u0275\u0275elementStart(57, "a", 27);
    \u0275\u0275text(58, "soporte@tecnoriasl.com");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(59, "div");
    \u0275\u0275text(60, " Legal: ");
    \u0275\u0275elementStart(61, "a", 28);
    \u0275\u0275text(62, "legal@tecnoriasl.com");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(63, "div", 29);
    \u0275\u0275text(64, "S\xEDguenos:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(65, "div", 30)(66, "a", 31);
    \u0275\u0275text(67, "Twitter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(68, "a", 32);
    \u0275\u0275text(69, "Facebook");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(70, "a", 33);
    \u0275\u0275text(71, "Instagram");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(72, "div", 34)(73, "div", 35);
    \u0275\u0275text(74);
    \u0275\u0275elementStart(75, "a", 36);
    \u0275\u0275text(76, "TecnoRia");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(77, "div", 37)(78, "a", 38);
    \u0275\u0275text(79, "Mapa del sitio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(80, "span", 39);
    \u0275\u0275text(81, "|");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(82, "a", 40);
    \u0275\u0275text(83, "RSS");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(74);
    \u0275\u0275textInterpolate1(" \xA9 ", ctx.currentYear, " GPTV \u2022 Dise\xF1ado por ");
  }
}, styles: ['@charset "UTF-8";\n\n\n\n.footer[_ngcontent-%COMP%] {\n  display: block;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(17, 24, 39, 0.9),\n      rgba(31, 41, 55, 0.95));\n  color: #e6eef6;\n  padding: 1.25rem 1rem;\n  font-size: 13px;\n  position: relative;\n  overflow: visible;\n  margin-top: 1.75rem;\n  border-top: 1px solid rgba(255, 255, 255, 0.04);\n}\n.footer[_ngcontent-%COMP%]   .footer-inner[_ngcontent-%COMP%] {\n  max-width: 1100px;\n  margin: 0 auto;\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  justify-content: space-between;\n  flex-wrap: wrap;\n}\n.footer[_ngcontent-%COMP%]   .brand[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.footer[_ngcontent-%COMP%]   .logo[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  fill: #ef4444;\n  opacity: 0.95;\n}\n.footer[_ngcontent-%COMP%]   .brand-text[_ngcontent-%COMP%] {\n  color: #fff;\n  font-weight: 700;\n}\n.footer[_ngcontent-%COMP%]   .brand-text[_ngcontent-%COMP%]   .dot[_ngcontent-%COMP%] {\n  color: #ef4444;\n  margin-left: 2px;\n}\n.footer[_ngcontent-%COMP%]   .footer-nav[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: center;\n}\n.footer[_ngcontent-%COMP%]   .footer-link[_ngcontent-%COMP%] {\n  color: rgba(230, 238, 246, 0.8);\n  text-decoration: none;\n  font-weight: 600;\n  padding: 0.25rem 0.5rem;\n  border-radius: 0.25rem;\n}\n.footer[_ngcontent-%COMP%]   .footer-link[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.03);\n}\n.footer[_ngcontent-%COMP%]   .copyright[_ngcontent-%COMP%] {\n  color: rgba(230, 238, 246, 0.7);\n  font-size: 12px;\n}\n@media (prefers-color-scheme: dark) {\n  .footer[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        135deg,\n        rgba(2, 6, 23, 0.9),\n        rgba(14, 23, 35, 0.95));\n  }\n}\n.footer-links[_ngcontent-%COMP%] {\n  width: 100%;\n  margin: 1rem 0;\n  font-size: 0.75rem;\n  color: #9ca3af;\n  line-height: 1.5;\n  background: rgba(0, 0, 0, 0.02);\n  border-top: 1px solid rgba(0, 0, 0, 0.05);\n}\n@media (prefers-color-scheme: dark) {\n  .footer-links[_ngcontent-%COMP%] {\n    background: rgba(255, 255, 255, 0.02);\n    border-top: 1px solid rgba(255, 255, 255, 0.05);\n  }\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%] {\n  max-width: 850px;\n  margin: 0 auto;\n  padding: 1rem;\n  text-align: center;\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  color: #6b7280;\n  text-decoration: none;\n  transition: all 0.2s ease;\n  padding: 0.125rem 0.25rem;\n  border-radius: 0.25rem;\n  position: relative;\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  inset: 0;\n  background: rgba(239, 68, 68, 0.1);\n  border-radius: 0.25rem;\n  opacity: 0;\n  transition: opacity 0.2s ease;\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n  color: #374151;\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover::before {\n  opacity: 1;\n}\n@media (prefers-color-scheme: dark) {\n  .footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n    color: #d1d5db;\n  }\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n}\n.footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   br[_ngcontent-%COMP%] {\n  display: block;\n  margin: 0.5rem 0;\n}\n@keyframes _ngcontent-%COMP%_fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n@media (max-width: 640px) {\n  .footer[_ngcontent-%COMP%] {\n    padding: 1.5rem 1rem;\n    font-size: 13px;\n  }\n  .footer[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n    line-height: 1.4;\n  }\n  .footer-links[_ngcontent-%COMP%] {\n    font-size: 0.7rem;\n  }\n  .footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%] {\n    padding: 0.75rem;\n  }\n}\n@media (prefers-contrast: high) {\n  .footer[_ngcontent-%COMP%] {\n    background: #000;\n    color: #fff;\n    border-top: 2px solid #fff;\n  }\n  .footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n    color: #ffff00;\n    font-weight: 700;\n  }\n  .footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n    background-color: #ffff00;\n    color: #000;\n  }\n  .footer-links[_ngcontent-%COMP%] {\n    background: #000;\n    border-top: 1px solid #fff;\n  }\n  .footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n    color: #fff;\n    border: 1px solid transparent;\n  }\n  .footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n    border-color: #fff;\n    background-color: rgba(255, 255, 255, 0.1);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .footer[_ngcontent-%COMP%], \n   .footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%], \n   .footer-links[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n    animation: none !important;\n    transition: none !important;\n  }\n  .footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]::after {\n    transition: none !important;\n  }\n}\n@media print {\n  .footer[_ngcontent-%COMP%] {\n    background: none !important;\n    color: #000 !important;\n    box-shadow: none !important;\n  }\n  .footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n    color: #000 !important;\n    text-decoration: underline !important;\n  }\n}\n@media (max-width: 768px) {\n  .footer-links[_ngcontent-%COMP%]   .footer-links-content[_ngcontent-%COMP%] {\n    padding: 0.5rem;\n  }\n}\n/*# sourceMappingURL=footer.component.css.map */'] });
var FooterComponent = _FooterComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FooterComponent, [{
    type: Component,
    args: [{ selector: "app-footer", standalone: true, template: '<footer\r\n  class="footer mt-8 z-30 w-full"\r\n  role="contentinfo"\r\n  aria-label="Pie de p\xE1gina"\r\n>\r\n  <div class="footer-inner" itemscope itemtype="https://schema.org/WPFooter">\r\n    <div\r\n      class="brand"\r\n      itemprop="publisher"\r\n      itemscope\r\n      itemtype="https://schema.org/Organization"\r\n    >\r\n      <svg\r\n        class="logo"\r\n        xmlns="http://www.w3.org/2000/svg"\r\n        viewBox="0 0 24 24"\r\n        aria-hidden="true"\r\n      >\r\n        <path\r\n          d="M10 15.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4Zm11.96-4.45c.58 6.26-4.64 11.48-10.9 10.9 -4.43-.41-8.12-3.85-8.9-8.23 -.26-1.42-.19-2.78.12-4.04 .14-.58.76-.9 1.31-.7v0c.47.17.75.67.63 1.16 -.2.82-.27 1.7-.19 2.61 .37 4.04 3.89 7.25 7.95 7.26 4.79.01 8.61-4.21 7.94-9.12 -.51-3.7-3.66-6.62-7.39-6.86 -.83-.06-1.63.02-2.38.2 -.49.11-.99-.16-1.16-.64v0c-.2-.56.12-1.17.69-1.31 1.79-.43 3.75-.41 5.78.37 3.56 1.35 6.15 4.62 6.5 8.4ZM5.5 4C4.67 4 4 4.67 4 5.5 4 6.33 4.67 7 5.5 7 6.33 7 7 6.33 7 5.5 7 4.67 6.33 4 5.5 4Z"\r\n        ></path>\r\n      </svg>\r\n      <div class="brand-text" itemprop="name">\r\n        GPTV<span class="dot">.</span>\r\n      </div>\r\n      <meta itemprop="url" content="https://guiatv.example.com/" />\r\n    </div>\r\n\r\n    <div\r\n      class="footer-columns"\r\n      style="\r\n        display: flex;\r\n        gap: 1rem;\r\n        align-items: flex-start;\r\n        flex: 1;\r\n        justify-content: space-between;\r\n      "\r\n    >\r\n      <div class="col col-site" style="min-width: 200px; max-width: 320px">\r\n        <h3 class="text-sm font-semibold">Explorar</h3>\r\n        <nav aria-label="Enlaces principales">\r\n          <ul style="list-style: none; padding: 0; margin: 0">\r\n            <li><a class="footer-link" href="/">Inicio</a></li>\r\n            <li>\r\n              <a class="footer-link" href="/guia-canales">Gu\xEDa de Canales</a>\r\n            </li>\r\n            <li><a class="footer-link" href="/que-ver-hoy">Qu\xE9 ver hoy</a></li>\r\n            <li><a class="footer-link" href="/en-directo">En directo</a></li>\r\n            <li><a class="footer-link" href="/blog">Blog</a></li>\r\n          </ul>\r\n        </nav>\r\n      </div>\r\n\r\n      <div class="col col-legal" style="min-width: 200px; max-width: 320px">\r\n        <h3 class="text-sm font-semibold">Legal & Pol\xEDticas</h3>\r\n        <nav aria-label="Enlaces legales">\r\n          <ul style="list-style: none; padding: 0; margin: 0">\r\n            <li><a class="footer-link" href="/avisolegal">Aviso Legal</a></li>\r\n            <li>\r\n              <a class="footer-link" href="/privacidad"\r\n                >Pol\xEDtica de Privacidad</a\r\n              >\r\n            </li>\r\n            <li>\r\n              <a class="footer-link" href="/cookies">Pol\xEDtica de Cookies</a>\r\n            </li>\r\n            <li>\r\n              <a class="footer-link" href="/terminos">T\xE9rminos y Condiciones</a>\r\n            </li>\r\n            <li>\r\n              <a class="footer-link" href="/accesibilidad"\r\n                >Declaraci\xF3n de Accesibilidad</a\r\n              >\r\n            </li>\r\n          </ul>\r\n        </nav>\r\n      </div>\r\n\r\n      <div class="col col-contact" style="min-width: 220px; max-width: 360px">\r\n        <h3 class="text-sm font-semibold">Contacto</h3>\r\n        <address style="font-style: normal; color: inherit">\r\n          <div>\r\n            Soporte:\r\n            <a class="footer-link" href="mailto:soporte@tecnoriasl.com"\r\n              >soporte&#64;tecnoriasl.com</a\r\n            >\r\n          </div>\r\n          <div>\r\n            Legal:\r\n            <a class="footer-link" href="mailto:legal@tecnoriasl.com"\r\n              >legal&#64;tecnoriasl.com</a\r\n            >\r\n          </div>\r\n          <div class="mt-2">S\xEDguenos:</div>\r\n          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem">\r\n            <a\r\n              class="footer-link"\r\n              href="https://twitter.com/"\r\n              target="_blank"\r\n              rel="noopener noreferrer"\r\n              aria-label="Twitter"\r\n              >Twitter</a\r\n            >\r\n            <a\r\n              class="footer-link"\r\n              href="https://facebook.com/"\r\n              target="_blank"\r\n              rel="noopener noreferrer"\r\n              aria-label="Facebook"\r\n              >Facebook</a\r\n            >\r\n            <a\r\n              class="footer-link"\r\n              href="https://instagram.com/"\r\n              target="_blank"\r\n              rel="noopener noreferrer"\r\n              aria-label="Instagram"\r\n              >Instagram</a\r\n            >\r\n          </div>\r\n        </address>\r\n      </div>\r\n    </div>\r\n\r\n    <div\r\n      style="\r\n        display: flex;\r\n        align-items: center;\r\n        gap: 1rem;\r\n        margin-top: 1rem;\r\n        width: 100%;\r\n        justify-content: space-between;\r\n        flex-wrap: wrap;\r\n      "\r\n    >\r\n      <div class="copyright" style="flex: 1; min-width: 220px">\r\n        \xA9 {{ currentYear }} GPTV \u2022 Dise\xF1ado por\r\n        <a href="https://tecnoriasl.com/" target="_blank" rel="noopener"\r\n          >TecnoRia</a\r\n        >\r\n      </div>\r\n\r\n      <div style="text-align: right; min-width: 220px">\r\n        <a class="footer-link" href="/sitemap">Mapa del sitio</a>\r\n        <span style="margin: 0 0.5rem; color: rgba(230, 238, 246, 0.5)">|</span>\r\n        <a class="footer-link" href="/rss.xml">RSS</a>\r\n      </div>\r\n    </div>\r\n\r\n    <!-- JSON-LD Organization Structured Data for SEO -->\r\n    <script type="application/ld+json">\r\n      {\r\n        "@context": "https://schema.org",\r\n        "@type": "Organization",\r\n        "name": "GPTV",\r\n        "url": "https://guiatv.example.com/",\r\n        "logo": "https://guiatv.example.com/assets/logo.svg",\r\n        "sameAs": [\r\n          "https://twitter.com/",\r\n          "https://facebook.com/",\r\n          "https://instagram.com/"\r\n        ],\r\n        "contactPoint": [\r\n          {\r\n            "@type": "ContactPoint",\r\n            "contactType": "customer support",\r\n            "email": "soporte\\u0040tecnoriasl.com"\r\n          }\r\n        ]\r\n      }\r\n    <\/script>\r\n  </div>\r\n</footer>\r\n', styles: ['@charset "UTF-8";\n\n/* src/app/components/footer/footer.component.scss */\n.footer {\n  display: block;\n  background:\n    linear-gradient(\n      135deg,\n      rgba(17, 24, 39, 0.9),\n      rgba(31, 41, 55, 0.95));\n  color: #e6eef6;\n  padding: 1.25rem 1rem;\n  font-size: 13px;\n  position: relative;\n  overflow: visible;\n  margin-top: 1.75rem;\n  border-top: 1px solid rgba(255, 255, 255, 0.04);\n}\n.footer .footer-inner {\n  max-width: 1100px;\n  margin: 0 auto;\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  justify-content: space-between;\n  flex-wrap: wrap;\n}\n.footer .brand {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.footer .logo {\n  width: 28px;\n  height: 28px;\n  fill: #ef4444;\n  opacity: 0.95;\n}\n.footer .brand-text {\n  color: #fff;\n  font-weight: 700;\n}\n.footer .brand-text .dot {\n  color: #ef4444;\n  margin-left: 2px;\n}\n.footer .footer-nav {\n  display: flex;\n  gap: 0.75rem;\n  align-items: center;\n}\n.footer .footer-link {\n  color: rgba(230, 238, 246, 0.8);\n  text-decoration: none;\n  font-weight: 600;\n  padding: 0.25rem 0.5rem;\n  border-radius: 0.25rem;\n}\n.footer .footer-link:hover {\n  background: rgba(255, 255, 255, 0.03);\n}\n.footer .copyright {\n  color: rgba(230, 238, 246, 0.7);\n  font-size: 12px;\n}\n@media (prefers-color-scheme: dark) {\n  .footer {\n    background:\n      linear-gradient(\n        135deg,\n        rgba(2, 6, 23, 0.9),\n        rgba(14, 23, 35, 0.95));\n  }\n}\n.footer-links {\n  width: 100%;\n  margin: 1rem 0;\n  font-size: 0.75rem;\n  color: #9ca3af;\n  line-height: 1.5;\n  background: rgba(0, 0, 0, 0.02);\n  border-top: 1px solid rgba(0, 0, 0, 0.05);\n}\n@media (prefers-color-scheme: dark) {\n  .footer-links {\n    background: rgba(255, 255, 255, 0.02);\n    border-top: 1px solid rgba(255, 255, 255, 0.05);\n  }\n}\n.footer-links .footer-links-content {\n  max-width: 850px;\n  margin: 0 auto;\n  padding: 1rem;\n  text-align: center;\n}\n.footer-links .footer-links-content a {\n  color: #6b7280;\n  text-decoration: none;\n  transition: all 0.2s ease;\n  padding: 0.125rem 0.25rem;\n  border-radius: 0.25rem;\n  position: relative;\n}\n.footer-links .footer-links-content a::before {\n  content: "";\n  position: absolute;\n  inset: 0;\n  background: rgba(239, 68, 68, 0.1);\n  border-radius: 0.25rem;\n  opacity: 0;\n  transition: opacity 0.2s ease;\n}\n.footer-links .footer-links-content a:hover {\n  color: #374151;\n}\n.footer-links .footer-links-content a:hover::before {\n  opacity: 1;\n}\n@media (prefers-color-scheme: dark) {\n  .footer-links .footer-links-content a:hover {\n    color: #d1d5db;\n  }\n}\n.footer-links .footer-links-content a:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n}\n.footer-links .footer-links-content br {\n  display: block;\n  margin: 0.5rem 0;\n}\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n@media (max-width: 640px) {\n  .footer {\n    padding: 1.5rem 1rem;\n    font-size: 13px;\n  }\n  .footer p {\n    line-height: 1.4;\n  }\n  .footer-links {\n    font-size: 0.7rem;\n  }\n  .footer-links .footer-links-content {\n    padding: 0.75rem;\n  }\n}\n@media (prefers-contrast: high) {\n  .footer {\n    background: #000;\n    color: #fff;\n    border-top: 2px solid #fff;\n  }\n  .footer a {\n    color: #ffff00;\n    font-weight: 700;\n  }\n  .footer a:hover {\n    background-color: #ffff00;\n    color: #000;\n  }\n  .footer-links {\n    background: #000;\n    border-top: 1px solid #fff;\n  }\n  .footer-links .footer-links-content a {\n    color: #fff;\n    border: 1px solid transparent;\n  }\n  .footer-links .footer-links-content a:hover {\n    border-color: #fff;\n    background-color: rgba(255, 255, 255, 0.1);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .footer,\n  .footer a,\n  .footer-links a {\n    animation: none !important;\n    transition: none !important;\n  }\n  .footer a::after {\n    transition: none !important;\n  }\n}\n@media print {\n  .footer {\n    background: none !important;\n    color: #000 !important;\n    box-shadow: none !important;\n  }\n  .footer a {\n    color: #000 !important;\n    text-decoration: underline !important;\n  }\n}\n@media (max-width: 768px) {\n  .footer-links .footer-links-content {\n    padding: 0.5rem;\n  }\n}\n/*# sourceMappingURL=footer.component.css.map */\n'] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FooterComponent, { className: "FooterComponent", filePath: "src/app/components/footer/footer.component.ts", lineNumber: 9 });
})();

// src/app/app.component.ts
var _AppComponent = class _AppComponent {
  constructor(platformId, router) {
    this.platformId = platformId;
    this.router = router;
    this.destroy$ = new Subject();
    this.routerEventsDisabled = false;
    this.navigationCount = 0;
    this.logger = inject(ConsoleLoggerService, { optional: true });
    _AppComponent.instanceCount++;
    this.instanceId = `app-${_AppComponent.instanceCount}`;
    this.logInfo(`\u{1F3D7}\uFE0F APP COMPONENT - Instancia ${this.instanceId} creada`);
    if (_AppComponent.instanceCount > 1) {
      this.logWarning(`\u26A0\uFE0F M\xDALTIPLES INSTANCIAS DE APP COMPONENT DETECTADAS: ${_AppComponent.instanceCount}`);
      this.logWarning("\u{1F504} Instancia adicional iniciada (puede ser normal en desarrollo con HMR)");
    }
    this.router.events.pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd), takeUntil(this.destroy$)).subscribe((event) => {
      if (this.routerEventsDisabled) {
        this.logWarning("\u{1F6AB} Eventos de router deshabilitados para evitar bucle");
        return;
      }
      if (event instanceof NavigationStart) {
        this.navigationCount++;
        this.logDebug(`\u{1F9ED} Navegaci\xF3n iniciada: ${event.url} (count: ${this.navigationCount})`);
        if (this.navigationCount > 5) {
          this.logError("\u26A0\uFE0F BUCLE DE NAVEGACI\xD3N DETECTADO - DESHABILITANDO EVENTOS");
          this.logError("\u{1F6D1} ROUTER EVENTS DISABLED PARA PREVENIR BUCLE INFINITO");
          this.routerEventsDisabled = true;
          this.destroy$.next();
          return;
        }
      } else if (event instanceof NavigationEnd) {
        this.logDebug(`\u2705 Navegaci\xF3n completada: ${event.url}`);
        setTimeout(() => {
          this.navigationCount = 0;
          this.logDebug("\u{1F504} Contador de navegaci\xF3n reseteado");
        }, 2e3);
      }
    });
  }
  ngOnInit() {
    this.logInfo(`\u{1F680} APP COMPONENT INIT - Instancia ${this.instanceId}`);
    this.logInfo("\u2705 Arquitectura SOLID inicializada");
    if (_AppComponent.instanceCount > 1) {
      this.logWarning(`\u26A0\uFE0F M\xFAltiples instancias detectadas en ngOnInit (${_AppComponent.instanceCount})`);
    }
    this.logDebug("\u{1F4CA} App Component State:", {
      instanceId: this.instanceId,
      instanceCount: _AppComponent.instanceCount,
      platformId: this.platformId,
      routerEventsDisabled: this.routerEventsDisabled
    });
  }
  ngOnDestroy() {
    this.logInfo(`\u{1F5D1}\uFE0F APP COMPONENT DESTROY - Instancia ${this.instanceId}`);
    this.destroy$.next();
    this.destroy$.complete();
    _AppComponent.instanceCount = Math.max(0, _AppComponent.instanceCount - 1);
    this.logDebug(`\u{1F4C9} Instance count after destroy: ${_AppComponent.instanceCount}`);
  }
  // ===============================================
  // MÉTODOS DE LOGGING CON FALLBACK
  // ===============================================
  logInfo(message, ...args) {
    if (this.logger) {
      this.logger.info(message, ...args);
    } else {
      console.log(`\u2139\uFE0F ${message}`, ...args);
    }
  }
  logWarning(message, ...args) {
    if (this.logger) {
      this.logger.warn(message, ...args);
    } else {
      console.warn(`\u26A0\uFE0F ${message}`, ...args);
    }
  }
  logError(message, ...args) {
    if (this.logger) {
      this.logger.error(message, ...args);
    } else {
      console.error(`\u274C ${message}`, ...args);
    }
  }
  logDebug(message, ...args) {
    if (this.logger) {
      this.logger.debug(message, ...args);
    } else {
      console.debug(`\u{1F50D} ${message}`, ...args);
    }
  }
  // ===============================================
  // MÉTODOS PÚBLICOS PARA DEBUGGING
  // ===============================================
  /**
   * Método público para debugging del estado del componente
   */
  debugAppState() {
    const state = {
      instanceId: this.instanceId,
      instanceCount: _AppComponent.instanceCount,
      routerEventsDisabled: this.routerEventsDisabled,
      navigationCount: this.navigationCount,
      isDestroyed: this.destroy$.closed
    };
    this.logDebug("=== APP COMPONENT DEBUG STATE ===");
    this.logDebug("App State:", state);
    this.logDebug("=== END APP COMPONENT DEBUG ===");
    return state;
  }
  /**
   * Método para resetear protecciones (útil en desarrollo)
   */
  resetNavigationProtection() {
    this.logInfo("\u{1F504} Reseteando protecciones de navegaci\xF3n");
    this.routerEventsDisabled = false;
    this.navigationCount = 0;
  }
};
_AppComponent.instanceCount = 0;
_AppComponent.\u0275fac = function AppComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _AppComponent)(\u0275\u0275directiveInject(PLATFORM_ID), \u0275\u0275directiveInject(Router));
};
_AppComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AppComponent, selectors: [["app-root"]], decls: 7, vars: 0, consts: [[1, "font-montserrat", "bg-gradient-to-br", "from-gray-900", "via-gray-800", "to-black", "min-h-screen", "flex", "flex-col"], [1, "flex", "flex-1", "w-full"], [1, "flex-1", "overflow-auto"]], template: function AppComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
    \u0275\u0275element(2, "app-left-sidebar");
    \u0275\u0275elementStart(3, "main", 2);
    \u0275\u0275element(4, "router-outlet");
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "app-right-sidebar");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "app-footer");
    \u0275\u0275elementEnd();
  }
}, dependencies: [
  CommonModule,
  RouterOutlet,
  LeftSidebarComponent,
  RightSidebarComponent,
  FooterComponent
], encapsulation: 2 });
var AppComponent = _AppComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AppComponent, [{
    type: Component,
    args: [{ selector: "app-root", standalone: true, imports: [
      CommonModule,
      RouterOutlet,
      LeftSidebarComponent,
      RightSidebarComponent,
      FooterComponent
    ], template: '<!-- app.component.html - ESTRUCTURA PRINCIPAL CORREGIDA SIN ESPACIOS EN BLANCO -->\r\n<div\r\n  class="font-montserrat bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen flex flex-col"\r\n>\r\n  <!-- Layout Principal: Sidebar + Content + Sidebar -->\r\n  <div class="flex flex-1 w-full">\r\n    <!-- Left Sidebar -->\r\n    <app-left-sidebar></app-left-sidebar>\r\n\r\n    <!-- Main Content Area -->\r\n    <main class="flex-1 overflow-auto">\r\n      <router-outlet></router-outlet>\r\n    </main>\r\n\r\n    <!-- Right Sidebar -->\r\n    <app-right-sidebar></app-right-sidebar>\r\n  </div>\r\n\r\n  <!-- Footer -->\r\n  <app-footer></app-footer>\r\n</div>\r\n' }]
  }], () => [{ type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }, { type: Router }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AppComponent, { className: "AppComponent", filePath: "src/app/app.component.ts", lineNumber: 45 });
})();

// src/main.ts
bootstrapApplication(AppComponent, appConfig).then(() => {
  console.log("\u{1F680} Aplicaci\xF3n iniciada con arquitectura SOLID");
  console.log("\u2705 SSR y standalone components configurados");
}).catch((err) => {
  console.error("\u274C Error al iniciar la aplicaci\xF3n:", err);
});
/*! Bundled license information:

@angular/animations/fesm2022/util-D9FfmVnv.mjs:
@angular/animations/fesm2022/browser.mjs:
@angular/platform-browser/fesm2022/animations.mjs:
  (**
   * @license Angular v20.0.0
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=main.js.map
