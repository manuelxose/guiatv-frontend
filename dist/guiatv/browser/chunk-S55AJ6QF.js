import {
  HomeDataService,
  environment,
  isPlatformBrowser
} from "./chunk-MUKTTSZO.js";
import {
  BehaviorSubject,
  DestroyRef,
  Inject,
  Injectable,
  Observable,
  PLATFORM_ID,
  RendererFactory2,
  assertInInjectionContext,
  inject,
  map,
  of,
  setClassMetadata,
  takeUntil,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-UEL6V4IP.js";

// node_modules/@angular/core/fesm2022/rxjs-interop.mjs
function takeUntilDestroyed(destroyRef) {
  if (!destroyRef) {
    ngDevMode && assertInInjectionContext(takeUntilDestroyed);
    destroyRef = inject(DestroyRef);
  }
  const destroyed$ = new Observable((observer) => {
    const unregisterFn = destroyRef.onDestroy(observer.next.bind(observer));
    return unregisterFn;
  });
  return (source) => {
    return source.pipe(takeUntil(destroyed$));
  };
}

// src/app/services/core/logger.service.ts
var _ConsoleLoggerService = class _ConsoleLoggerService {
  constructor() {
    this.isDevelopment = !environment.production;
  }
  info(message, ...args) {
    if (this.isDevelopment) {
      console.log(`\u2139\uFE0F ${this.formatMessage(message)}`, ...args);
    }
  }
  warn(message, ...args) {
    console.warn(`\u26A0\uFE0F ${this.formatMessage(message)}`, ...args);
  }
  error(message, ...args) {
    console.error(`\u274C ${this.formatMessage(message)}`, ...args);
  }
  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(`\u{1F50D} ${this.formatMessage(message)}`, ...args);
    }
  }
  formatMessage(message) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    return `[${timestamp}] ${message}`;
  }
};
_ConsoleLoggerService.\u0275fac = function ConsoleLoggerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ConsoleLoggerService)();
};
_ConsoleLoggerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ConsoleLoggerService, factory: _ConsoleLoggerService.\u0275fac, providedIn: "root" });
var ConsoleLoggerService = _ConsoleLoggerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ConsoleLoggerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@angular/animations/fesm2022/private_export-faY_wCkZ.mjs
var AnimationMetadataType;
(function(AnimationMetadataType2) {
  AnimationMetadataType2[AnimationMetadataType2["State"] = 0] = "State";
  AnimationMetadataType2[AnimationMetadataType2["Transition"] = 1] = "Transition";
  AnimationMetadataType2[AnimationMetadataType2["Sequence"] = 2] = "Sequence";
  AnimationMetadataType2[AnimationMetadataType2["Group"] = 3] = "Group";
  AnimationMetadataType2[AnimationMetadataType2["Animate"] = 4] = "Animate";
  AnimationMetadataType2[AnimationMetadataType2["Keyframes"] = 5] = "Keyframes";
  AnimationMetadataType2[AnimationMetadataType2["Style"] = 6] = "Style";
  AnimationMetadataType2[AnimationMetadataType2["Trigger"] = 7] = "Trigger";
  AnimationMetadataType2[AnimationMetadataType2["Reference"] = 8] = "Reference";
  AnimationMetadataType2[AnimationMetadataType2["AnimateChild"] = 9] = "AnimateChild";
  AnimationMetadataType2[AnimationMetadataType2["AnimateRef"] = 10] = "AnimateRef";
  AnimationMetadataType2[AnimationMetadataType2["Query"] = 11] = "Query";
  AnimationMetadataType2[AnimationMetadataType2["Stagger"] = 12] = "Stagger";
})(AnimationMetadataType || (AnimationMetadataType = {}));
var AUTO_STYLE = "*";
function trigger(name, definitions) {
  return { type: AnimationMetadataType.Trigger, name, definitions, options: {} };
}
function animate(timings, styles = null) {
  return { type: AnimationMetadataType.Animate, styles, timings };
}
function sequence(steps, options = null) {
  return { type: AnimationMetadataType.Sequence, steps, options };
}
function style(tokens) {
  return { type: AnimationMetadataType.Style, styles: tokens, offset: null };
}
function state(name, styles, options) {
  return { type: AnimationMetadataType.State, name, styles, options };
}
function transition(stateChangeExpr, steps, options = null) {
  return { type: AnimationMetadataType.Transition, expr: stateChangeExpr, animation: steps, options };
}
var NoopAnimationPlayer = class {
  _onDoneFns = [];
  _onStartFns = [];
  _onDestroyFns = [];
  _originalOnDoneFns = [];
  _originalOnStartFns = [];
  _started = false;
  _destroyed = false;
  _finished = false;
  _position = 0;
  parentPlayer = null;
  totalTime;
  constructor(duration = 0, delay = 0) {
    this.totalTime = duration + delay;
  }
  _onFinish() {
    if (!this._finished) {
      this._finished = true;
      this._onDoneFns.forEach((fn) => fn());
      this._onDoneFns = [];
    }
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
  hasStarted() {
    return this._started;
  }
  init() {
  }
  play() {
    if (!this.hasStarted()) {
      this._onStart();
      this.triggerMicrotask();
    }
    this._started = true;
  }
  /** @internal */
  triggerMicrotask() {
    queueMicrotask(() => this._onFinish());
  }
  _onStart() {
    this._onStartFns.forEach((fn) => fn());
    this._onStartFns = [];
  }
  pause() {
  }
  restart() {
  }
  finish() {
    this._onFinish();
  }
  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      if (!this.hasStarted()) {
        this._onStart();
      }
      this.finish();
      this._onDestroyFns.forEach((fn) => fn());
      this._onDestroyFns = [];
    }
  }
  reset() {
    this._started = false;
    this._finished = false;
    this._onStartFns = this._originalOnStartFns;
    this._onDoneFns = this._originalOnDoneFns;
  }
  setPosition(position) {
    this._position = this.totalTime ? position * this.totalTime : 1;
  }
  getPosition() {
    return this.totalTime ? this._position / this.totalTime : 1;
  }
  /** @internal */
  triggerCallback(phaseName) {
    const methods = phaseName == "start" ? this._onStartFns : this._onDoneFns;
    methods.forEach((fn) => fn());
    methods.length = 0;
  }
};
var AnimationGroupPlayer = class {
  _onDoneFns = [];
  _onStartFns = [];
  _finished = false;
  _started = false;
  _destroyed = false;
  _onDestroyFns = [];
  parentPlayer = null;
  totalTime = 0;
  players;
  constructor(_players) {
    this.players = _players;
    let doneCount = 0;
    let destroyCount = 0;
    let startCount = 0;
    const total = this.players.length;
    if (total == 0) {
      queueMicrotask(() => this._onFinish());
    } else {
      this.players.forEach((player) => {
        player.onDone(() => {
          if (++doneCount == total) {
            this._onFinish();
          }
        });
        player.onDestroy(() => {
          if (++destroyCount == total) {
            this._onDestroy();
          }
        });
        player.onStart(() => {
          if (++startCount == total) {
            this._onStart();
          }
        });
      });
    }
    this.totalTime = this.players.reduce((time, player) => Math.max(time, player.totalTime), 0);
  }
  _onFinish() {
    if (!this._finished) {
      this._finished = true;
      this._onDoneFns.forEach((fn) => fn());
      this._onDoneFns = [];
    }
  }
  init() {
    this.players.forEach((player) => player.init());
  }
  onStart(fn) {
    this._onStartFns.push(fn);
  }
  _onStart() {
    if (!this.hasStarted()) {
      this._started = true;
      this._onStartFns.forEach((fn) => fn());
      this._onStartFns = [];
    }
  }
  onDone(fn) {
    this._onDoneFns.push(fn);
  }
  onDestroy(fn) {
    this._onDestroyFns.push(fn);
  }
  hasStarted() {
    return this._started;
  }
  play() {
    if (!this.parentPlayer) {
      this.init();
    }
    this._onStart();
    this.players.forEach((player) => player.play());
  }
  pause() {
    this.players.forEach((player) => player.pause());
  }
  restart() {
    this.players.forEach((player) => player.restart());
  }
  finish() {
    this._onFinish();
    this.players.forEach((player) => player.finish());
  }
  destroy() {
    this._onDestroy();
  }
  _onDestroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._onFinish();
      this.players.forEach((player) => player.destroy());
      this._onDestroyFns.forEach((fn) => fn());
      this._onDestroyFns = [];
    }
  }
  reset() {
    this.players.forEach((player) => player.reset());
    this._destroyed = false;
    this._finished = false;
    this._started = false;
  }
  setPosition(p) {
    const timeAtPosition = p * this.totalTime;
    this.players.forEach((player) => {
      const position = player.totalTime ? Math.min(1, timeAtPosition / player.totalTime) : 1;
      player.setPosition(position);
    });
  }
  getPosition() {
    const longestPlayer = this.players.reduce((longestSoFar, player) => {
      const newPlayerIsLongest = longestSoFar === null || player.totalTime > longestSoFar.totalTime;
      return newPlayerIsLongest ? player : longestSoFar;
    }, null);
    return longestPlayer != null ? longestPlayer.getPosition() : 0;
  }
  beforeDestroy() {
    this.players.forEach((player) => {
      if (player.beforeDestroy) {
        player.beforeDestroy();
      }
    });
  }
  /** @internal */
  triggerCallback(phaseName) {
    const methods = phaseName == "start" ? this._onStartFns : this._onDoneFns;
    methods.forEach((fn) => fn());
    methods.length = 0;
  }
};
var \u0275PRE_STYLE = "!";

// src/app/constants/program-list.constants.ts
var TIME_SLOTS = [
  ["00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00"],
  ["03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00"],
  ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00"],
  ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"],
  ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00"],
  ["15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"],
  ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
  ["21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00"]
];
var PROGRAM_LIST_CONFIG = {
  VIRTUAL_SCROLL: {
    ITEM_SIZE: 150,
    MAX_HEIGHT: 700
  },
  TIME_INDICATOR: {
    UPDATE_INTERVAL: 6e4,
    // 1 minuto
    SCREEN_WIDTH_REM: 18.375,
    COLUMN_WIDTH: 180
  },
  VIEWPORT: {
    SETUP_DELAY: 200,
    RETRY_DELAY: 300,
    MAX_RETRIES: 3
  },
  LOADING: {
    TIMEOUT: 1e4,
    DEBOUNCE_TIME: 100
  },
  PROGRAM_DISPLAY: {
    MIN_WIDTH: 90,
    TIME_SLOT_DURATION: 30,
    // minutos
    HOUR_WIDTH_PX: 240,
    // Ancho en píxeles por hora
    PIXELS_PER_MINUTE: 4,
    // 240px / 60min = 4px por minuto
    LOGO_COLUMN_WIDTH: 160
    // Ancho de la columna de logos
  },
  SCROLL: {
    SYNC_THRESHOLD: 1,
    // Umbral para sincronización de scroll
    AUTO_DETECT_DELAY: 100
    // Delay para auto-detectar franja horaria
  }
};
var CATEGORY_COLORS = {
  "cine": "bg-purple-500/20 text-purple-300 border-purple-500/50",
  "movie": "bg-purple-500/20 text-purple-300 border-purple-500/50",
  "series": "bg-blue-500/20 text-blue-300 border-blue-500/50",
  "noticias": "bg-red-500/20 text-red-300 border-red-500/50",
  "news": "bg-red-500/20 text-red-300 border-red-500/50",
  "deportes": "bg-green-500/20 text-green-300 border-green-500/50",
  "sports": "bg-green-500/20 text-green-300 border-green-500/50",
  "documental": "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  "documentary": "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  "entretenimiento": "bg-pink-500/20 text-pink-300 border-pink-500/50",
  "entertainment": "bg-pink-500/20 text-pink-300 border-pink-500/50",
  "infantil": "bg-orange-500/20 text-orange-300 border-orange-500/50",
  "kids": "bg-orange-500/20 text-orange-300 border-orange-500/50",
  "m\xFAsica": "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
  "music": "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
  "estilo de vida": "bg-teal-500/20 text-teal-300 border-teal-500/50",
  "lifestyle": "bg-teal-500/20 text-teal-300 border-teal-500/50",
  "default": "bg-gray-500/20 text-gray-300 border-gray-500/50"
};
var CATEGORY_DISPLAY_NAMES = {
  "cine": "Pel\xEDcula",
  "movie": "Pel\xEDcula",
  "series": "Serie",
  "noticias": "Noticias",
  "news": "Noticias",
  "deportes": "Deportes",
  "sports": "Deportes",
  "documental": "Documental",
  "documentary": "Documental",
  "entretenimiento": "Entretenimiento",
  "entertainment": "Entretenimiento",
  "infantil": "Infantil",
  "kids": "Infantil",
  "m\xFAsica": "M\xFAsica",
  "music": "M\xFAsica",
  "estilo de vida": "Estilo de vida",
  "lifestyle": "Estilo de vida"
};

// src/app/services/program-list/time-manager.service.ts
var _TimeManagerService = class _TimeManagerService {
  getCurrentTimeSlot() {
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    return Math.floor(currentHour / 3);
  }
  getTimeSlots() {
    return TIME_SLOTS;
  }
  getCurrentTime() {
    return (/* @__PURE__ */ new Date()).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }
  parseTimeToMinutes(timeString) {
    if (!timeString)
      return 0;
    try {
      if (timeString.includes(":") && timeString.length === 5) {
        const [hours, minutes] = timeString.split(":").map(Number);
        return hours * 60 + (minutes || 0);
      }
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.getHours() * 60 + date.getMinutes();
      }
    } catch (error) {
      console.warn("Error parsing time:", timeString, error);
    }
    return 0;
  }
  calculateTimePosition(time, baseTime) {
    const timeMinutes = this.parseTimeToMinutes(time);
    const baseMinutes = this.parseTimeToMinutes(baseTime);
    let difference = timeMinutes - baseMinutes;
    if (difference < 0)
      difference += 24 * 60;
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60;
    const positionInPx = Math.max(0, difference * pixelsPerMinute);
    const remSize = 16;
    return positionInPx / remSize;
  }
  generateHoursForSlot(slotIndex) {
    const slots = this.getTimeSlots();
    if (slotIndex >= 0 && slotIndex < slots.length) {
      return [...slots[slotIndex]];
    }
    return [...slots[0]];
  }
  /**
   * Convierte tiempo a formato de visualización
   */
  formatDisplayTime(timeString) {
    if (!timeString)
      return "";
    try {
      if (timeString.includes(":") && timeString.length === 5) {
        return timeString;
      }
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      }
    } catch (error) {
      console.warn("Error formatting time:", timeString, error);
    }
    return timeString.substring(0, 5);
  }
  /**
   * Verifica si es hora de mostrar el indicador actual
   */
  shouldShowCurrentTimeIndicator(activeDay) {
    return activeDay === 0;
  }
  /**
   * Calcula la duración entre dos tiempos
   */
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime)
      return 30;
    try {
      const startMinutes = this.parseTimeToMinutes(startTime);
      const endMinutes = this.parseTimeToMinutes(endTime);
      let duration = endMinutes - startMinutes;
      if (duration <= 0)
        duration += 24 * 60;
      return Math.max(1, duration);
    } catch (error) {
      console.warn("Error calculating duration:", { startTime, endTime, error });
      return 30;
    }
  }
};
_TimeManagerService.\u0275fac = function TimeManagerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _TimeManagerService)();
};
_TimeManagerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TimeManagerService, factory: _TimeManagerService.\u0275fac, providedIn: "root" });
var TimeManagerService = _TimeManagerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TimeManagerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// src/app/services/program-list/dimension-calculator.service.ts
var _DimensionCalculatorService = class _DimensionCalculatorService {
  constructor(platformId, timeManager) {
    this.platformId = platformId;
    this.timeManager = timeManager;
    this.screenWidthInRem = PROGRAM_LIST_CONFIG.TIME_INDICATOR.SCREEN_WIDTH_REM;
    this.columnWidth = PROGRAM_LIST_CONFIG.TIME_INDICATOR.COLUMN_WIDTH;
    if (isPlatformBrowser(this.platformId)) {
      this.updateScreenDimensions();
      this.setupResizeListener();
    }
  }
  calculateProgramWidth(duration) {
    if (!duration || duration <= 0) {
      return `${PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.MIN_WIDTH}px`;
    }
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60;
    const width = duration * pixelsPerMinute;
    return `${Math.max(PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.MIN_WIDTH, width)}px`;
  }
  calculateLeftPosition(time, baseTime) {
    if (!time || !baseTime)
      return "0px";
    const timeMinutes = this.timeManager.parseTimeToMinutes(time);
    const baseMinutes = this.timeManager.parseTimeToMinutes(baseTime);
    let difference = timeMinutes - baseMinutes;
    if (difference < 0)
      difference += 24 * 60;
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60;
    const leftPosition = Math.max(0, difference * pixelsPerMinute);
    return `${leftPosition}px`;
  }
  updateScreenDimensions() {
    if (!isPlatformBrowser(this.platformId))
      return;
    try {
      const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      this.screenWidthInRem = window.innerWidth / remSize;
      this.columnWidth = Math.floor(window.innerWidth / 7);
      console.log("\u{1F4D0} Dimensions updated:", {
        screenWidthInRem: this.screenWidthInRem,
        columnWidth: this.columnWidth
      });
    } catch (error) {
      console.warn("Error updating screen dimensions:", error);
    }
  }
  getColumnWidth() {
    return this.columnWidth;
  }
  getScreenWidthInRem() {
    return this.screenWidthInRem;
  }
  /**
   * Calcula la posición del indicador de tiempo actual
   */
  calculateCurrentTimeIndicatorPosition(currentTime, baseTime) {
    const currentMinutes = this.timeManager.parseTimeToMinutes(currentTime);
    const baseMinutes = this.timeManager.parseTimeToMinutes(baseTime);
    let difference = currentMinutes - baseMinutes;
    if (difference < 0)
      difference += 24 * 60;
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60;
    const positionInPx = Math.max(0, difference * pixelsPerMinute);
    const remSize = 16;
    return positionInPx / remSize;
  }
  /**
   * Calcula las dimensiones óptimas para el viewport virtual
   */
  calculateOptimalViewportSize(itemCount) {
    const maxHeight = PROGRAM_LIST_CONFIG.VIRTUAL_SCROLL.MAX_HEIGHT;
    const itemSize = PROGRAM_LIST_CONFIG.VIRTUAL_SCROLL.ITEM_SIZE;
    if (itemCount < 5) {
      return {
        height: Math.min(itemCount * itemSize, maxHeight),
        itemSize
      };
    }
    return {
      height: maxHeight,
      itemSize
    };
  }
  /**
   * Verifica si las dimensiones actuales son válidas
   */
  areDimensionsValid() {
    return this.screenWidthInRem > 0 && this.columnWidth > 0;
  }
  setupResizeListener() {
    if (!isPlatformBrowser(this.platformId))
      return;
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateScreenDimensions();
      }, 250);
    };
    window.addEventListener("resize", handleResize);
  }
};
_DimensionCalculatorService.\u0275fac = function DimensionCalculatorService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _DimensionCalculatorService)(\u0275\u0275inject(PLATFORM_ID), \u0275\u0275inject("TimeManager"));
};
_DimensionCalculatorService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DimensionCalculatorService, factory: _DimensionCalculatorService.\u0275fac, providedIn: "root" });
var DimensionCalculatorService = _DimensionCalculatorService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DimensionCalculatorService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }, { type: void 0, decorators: [{
    type: Inject,
    args: ["TimeManager"]
  }] }], null);
})();

// src/app/services/program-list/category-style-manager.service.ts
var _CategoryStyleManagerService = class _CategoryStyleManagerService {
  getCategoryBadgeClasses(categoryValue) {
    if (!categoryValue) {
      return `border ${CATEGORY_COLORS.default}`;
    }
    const mainCategory = this.extractMainCategory(categoryValue);
    const normalizedCategory = this.normalizeCategory(mainCategory);
    const colorClass = CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default;
    return `border ${colorClass}`;
  }
  getCategoryDisplayName(categoryValue) {
    if (!categoryValue)
      return "General";
    const mainCategory = this.extractMainCategory(categoryValue);
    const normalizedCategory = this.normalizeCategory(mainCategory);
    return CATEGORY_DISPLAY_NAMES[normalizedCategory] || mainCategory || "General";
  }
  getDayButtonClasses(dayIndex, activeIndex) {
    const baseClasses = "px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg";
    if (dayIndex === activeIndex) {
      return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  }
  getTimeSlotButtonClasses(timeSlot, activeSlot) {
    const baseClasses = "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg";
    if (timeSlot === activeSlot) {
      return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  }
  /**
   * Genera clases para el contenedor del programa según su estado
   */
  getProgramContainerClasses(isSelected, isLive) {
    let classes = "relative border-r border-gray-600/30 last:border-r-0 cursor-pointer transition-all duration-200 group overflow-hidden";
    if (isSelected) {
      classes += " bg-red-600/30 border-red-500";
    } else {
      classes += " hover:bg-red-600/20";
    }
    if (isLive) {
      classes += " ring-2 ring-red-500 ring-opacity-50";
    }
    return classes;
  }
  /**
   * Genera clases para el indicador de tiempo actual
   */
  getCurrentTimeIndicatorClasses() {
    return "absolute w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 z-50 shadow-2xl shadow-red-500/50";
  }
  /**
   * Extrae la categoría principal de una string de categoría
   */
  extractMainCategory(categoryValue) {
    if (!categoryValue)
      return "";
    const parts = categoryValue.split(",");
    return parts[0]?.trim() || "";
  }
  /**
   * Normaliza una categoría para buscar en el mapping
   */
  normalizeCategory(category) {
    if (!category)
      return "";
    const normalized = category.toLowerCase().trim();
    const spanishToEnglish = {
      "cine": "movie",
      "pel\xEDcula": "movie",
      "pel\xEDculas": "movie",
      "series": "series",
      "serie": "series",
      "noticias": "news",
      "informativo": "news",
      "informaci\xF3n": "news",
      "deportes": "sports",
      "deporte": "sports",
      "documental": "documentary",
      "documentales": "documentary",
      "entretenimiento": "entertainment",
      "variedades": "entertainment",
      "infantil": "kids",
      "ni\xF1os": "kids",
      "m\xFAsica": "music",
      "musical": "music",
      "estilo de vida": "lifestyle",
      "lifestyle": "lifestyle"
    };
    return spanishToEnglish[normalized] || normalized;
  }
  /**
   * Obtiene el color de texto apropiado para un fondo
   */
  getTextColorForBackground(backgroundColor) {
    return "text-white";
  }
  /**
   * Genera clases para estado de loading
   */
  getLoadingClasses() {
    return "absolute inset-0 z-30 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm";
  }
  /**
   * Genera clases para el skeleton loading
   */
  getSkeletonClasses() {
    return "animate-pulse bg-gray-700 rounded";
  }
};
_CategoryStyleManagerService.\u0275fac = function CategoryStyleManagerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _CategoryStyleManagerService)();
};
_CategoryStyleManagerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CategoryStyleManagerService, factory: _CategoryStyleManagerService.\u0275fac, providedIn: "root" });
var CategoryStyleManagerService = _CategoryStyleManagerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CategoryStyleManagerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// src/app/services/program-list/channel-logo-manager.service.ts
var _ChannelLogoManagerService = class _ChannelLogoManagerService {
  constructor() {
    this.logoUrlCache = /* @__PURE__ */ new Map();
    this.failedLogos = /* @__PURE__ */ new Set();
    this.canalesData$ = new BehaviorSubject({});
  }
  getChannelLogoUrl(channelData) {
    if (!channelData) {
      return "";
    }
    const channelId = channelData.id || channelData.name;
    const channelName = channelData.name;
    if (this.logoUrlCache.has(channelId)) {
      return this.logoUrlCache.get(channelId);
    }
    if (this.failedLogos.has(channelId)) {
      return "";
    }
    if (channelData.icon && this.isValidUrl(channelData.icon)) {
      this.logoUrlCache.set(channelId, channelData.icon);
      return channelData.icon;
    }
    const canalesData = this.canalesData$.value;
    if (canalesData && Object.keys(canalesData).length > 0) {
      const logoUrl = this.findLogoInCanalesData(channelName, canalesData);
      if (logoUrl) {
        this.logoUrlCache.set(channelId, logoUrl);
        return logoUrl;
      }
    }
    const alternativeUrl = this.generateAlternativeLogoUrl(channelName);
    if (alternativeUrl) {
      this.logoUrlCache.set(channelId, alternativeUrl);
      return alternativeUrl;
    }
    return "";
  }
  handleLogoError(event) {
    const img = event.target;
    const src = img.src;
    this.markLogoAsFailed(src);
    img.style.display = "none";
    const container = img.closest(".relative");
    const fallback = container?.querySelector(".channel-name-fallback");
    if (fallback) {
      fallback.classList.remove("hidden");
    }
    console.debug("Logo failed to load:", src);
  }
  handleLogoLoad(event) {
    const img = event.target;
    const container = img.closest(".relative");
    const fallback = container?.querySelector(".channel-name-fallback");
    if (fallback) {
      fallback.classList.add("hidden");
    }
    console.debug("Logo loaded successfully:", img.src);
  }
  clearCache() {
    this.logoUrlCache.clear();
    this.failedLogos.clear();
    console.log("\u{1F5D1}\uFE0F Channel logo cache cleared");
  }
  /**
   * Actualiza los datos de canales desde canales.json
   */
  updateCanalesData(canalesData) {
    this.canalesData$.next(canalesData || {});
    this.logoUrlCache.clear();
  }
  /**
   * Obtiene el observable de datos de canales
   */
  getCanalesData() {
    return this.canalesData$.asObservable();
  }
  /**
   * Precargar logos para mejorar performance
   */
  preloadLogos(channels) {
    channels.forEach((channel) => {
      const logoUrl = this.getChannelLogoUrl(channel);
      if (logoUrl && !this.failedLogos.has(logoUrl)) {
        this.preloadImage(logoUrl);
      }
    });
  }
  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    const total = this.logoUrlCache.size + this.failedLogos.size;
    const hitRate = total > 0 ? this.logoUrlCache.size / total * 100 : 0;
    return {
      cached: this.logoUrlCache.size,
      failed: this.failedLogos.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }
  findLogoInCanalesData(channelName, canalesData) {
    if (!channelName || !canalesData)
      return "";
    const channelKey = this.normalizeChannelName(channelName);
    const channelInfo = canalesData[channelKey];
    if (channelInfo) {
      return channelInfo.logo || channelInfo.icon || "";
    }
    return "";
  }
  normalizeChannelName(channelName) {
    return channelName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").replace(/\+/g, "").replace(/hd$/i, "").replace(/tv$/i, "") || "";
  }
  generateAlternativeLogoUrl(channelName) {
    if (!channelName)
      return "";
    const alternatives = [
      `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${encodeURIComponent(channelName)}.png`,
      `https://graph.facebook.com/${encodeURIComponent(channelName)}/picture?type=large`
      // Add more alternative sources as needed
    ];
    return alternatives[0];
  }
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  markLogoAsFailed(url) {
    this.failedLogos.add(url);
    for (const [key, value] of this.logoUrlCache.entries()) {
      if (value === url) {
        this.logoUrlCache.delete(key);
        break;
      }
    }
  }
  preloadImage(url) {
    const img = new Image();
    img.onload = () => console.debug("Logo preloaded:", url);
    img.onerror = () => this.markLogoAsFailed(url);
    img.src = url;
  }
};
_ChannelLogoManagerService.\u0275fac = function ChannelLogoManagerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ChannelLogoManagerService)();
};
_ChannelLogoManagerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ChannelLogoManagerService, factory: _ChannelLogoManagerService.\u0275fac, providedIn: "root" });
var ChannelLogoManagerService = _ChannelLogoManagerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ChannelLogoManagerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// src/app/services/program-list/viewport-manager.service.ts
var _ViewportManagerService = class _ViewportManagerService {
  constructor(rendererFactory, platformId) {
    this.rendererFactory = rendererFactory;
    this.platformId = platformId;
    this.setupAttempted = /* @__PURE__ */ new Set();
    this.setupInProgress = /* @__PURE__ */ new Set();
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }
  setupUniqueViewport(elementRef, componentId) {
    if (!isPlatformBrowser(this.platformId)) {
      console.log("\u{1F6AB} VIEWPORT - Skipping setup on server side");
      return;
    }
    if (this.setupInProgress.has(componentId)) {
      console.log("\u{1F504} VIEWPORT - Setup already in progress for", componentId);
      return;
    }
    this.setupAttempted.add(componentId);
    this.setupInProgress.add(componentId);
    console.log("\u{1F527} VIEWPORT - Starting setup for component:", componentId);
    this.attemptViewportSetup(elementRef, componentId, 0);
  }
  ensureViewportUniqueness(retryCount = 0) {
    if (!isPlatformBrowser(this.platformId))
      return false;
    const maxRetries = PROGRAM_LIST_CONFIG.VIEWPORT.MAX_RETRIES;
    if (retryCount >= maxRetries) {
      console.warn("\u{1F6D1} VIEWPORT - Max retries reached for uniqueness check");
      return false;
    }
    try {
      const viewports = document.querySelectorAll("[data-cdk-virtual-scroll-viewport]");
      const uniqueIds = /* @__PURE__ */ new Set();
      let duplicatesFound = false;
      viewports.forEach((viewport) => {
        const id = viewport.getAttribute("id") || viewport.getAttribute("data-viewport-id");
        if (id) {
          if (uniqueIds.has(id)) {
            duplicatesFound = true;
            console.warn("\u{1F6A8} VIEWPORT - Duplicate viewport ID found:", id);
          } else {
            uniqueIds.add(id);
          }
        }
      });
      if (duplicatesFound) {
        console.log("\u{1F504} VIEWPORT - Fixing duplicate IDs...");
        this.fixDuplicateViewportIds();
      }
      return !duplicatesFound;
    } catch (error) {
      console.error("\u274C VIEWPORT - Error checking uniqueness:", error);
      return false;
    }
  }
  cleanupViewport() {
    this.setupAttempted.clear();
    this.setupInProgress.clear();
    console.log("\u{1F5D1}\uFE0F VIEWPORT - Cleanup completed");
  }
  isViewportReady() {
    if (!isPlatformBrowser(this.platformId))
      return false;
    try {
      const viewports = document.querySelectorAll("cdk-virtual-scroll-viewport");
      return viewports.length > 0;
    } catch (error) {
      console.error("\u274C VIEWPORT - Error checking if ready:", error);
      return false;
    }
  }
  attemptViewportSetup(elementRef, componentId, retryCount) {
    const maxRetries = PROGRAM_LIST_CONFIG.VIEWPORT.MAX_RETRIES;
    if (retryCount >= maxRetries) {
      console.log("\u{1F6D1} VIEWPORT - Max retries reached for component:", componentId);
      this.setupInProgress.delete(componentId);
      return;
    }
    setTimeout(() => {
      if (this.performViewportSetup(elementRef, componentId)) {
        console.log("\u2705 VIEWPORT - Setup successful for component:", componentId);
        this.setupInProgress.delete(componentId);
      } else {
        console.log(`\u26A0\uFE0F VIEWPORT - Setup failed, retrying... (${retryCount + 1}/${maxRetries})`);
        this.attemptViewportSetup(elementRef, componentId, retryCount + 1);
      }
    }, retryCount * PROGRAM_LIST_CONFIG.VIEWPORT.RETRY_DELAY);
  }
  performViewportSetup(elementRef, componentId) {
    try {
      const element = elementRef?.nativeElement;
      if (!element) {
        console.warn("\u26A0\uFE0F VIEWPORT - Element not found for component:", componentId);
        return false;
      }
      const viewportId = this.generateUniqueViewportId(componentId);
      this.setViewportAttributes(element, componentId, viewportId);
      this.ensureViewportUniqueness();
      console.log("\u2705 VIEWPORT - Attributes set successfully:", {
        componentId,
        viewportId,
        element: element.tagName
      });
      return true;
    } catch (error) {
      console.error("\u274C VIEWPORT - Setup error:", error);
      return false;
    }
  }
  setViewportAttributes(element, componentId, viewportId) {
    this.renderer.setAttribute(element, "id", viewportId);
    this.renderer.setAttribute(element, "data-viewport-id", viewportId);
    this.renderer.setAttribute(element, "data-cdk-unique-instance", componentId);
    this.renderer.setAttribute(element, "data-component-instance", componentId);
    this.renderer.setAttribute(element, "cdk-virtual-scroll-unique", componentId);
    this.renderer.setAttribute(element, "data-cdk-viewport-instance", componentId);
    this.renderer.setAttribute(element, "data-angular-component-id", componentId);
    this.renderer.addClass(element, `viewport-${componentId}`);
    this.renderer.addClass(element, "unique-viewport-instance");
    this.renderer.setAttribute(element, "aria-label", `Program list viewport ${componentId}`);
    this.renderer.setAttribute(element, "role", "grid");
  }
  generateUniqueViewportId(componentId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `viewport-${componentId}-${timestamp}-${random}`;
  }
  fixDuplicateViewportIds() {
    try {
      const viewports = document.querySelectorAll("cdk-virtual-scroll-viewport");
      const usedIds = /* @__PURE__ */ new Set();
      viewports.forEach((viewport, index) => {
        const currentId = viewport.getAttribute("id");
        if (!currentId || usedIds.has(currentId)) {
          const newId = `viewport-fixed-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
          this.renderer.setAttribute(viewport, "id", newId);
          this.renderer.setAttribute(viewport, "data-viewport-id", newId);
          this.renderer.addClass(viewport, "viewport-id-fixed");
          console.log("\u{1F527} VIEWPORT - Fixed duplicate ID:", { old: currentId, new: newId });
        }
        const finalId = viewport.getAttribute("id");
        if (finalId) {
          usedIds.add(finalId);
        }
      });
    } catch (error) {
      console.error("\u274C VIEWPORT - Error fixing duplicate IDs:", error);
    }
  }
  /**
   * Diagnóstico del estado del viewport
   */
  diagnoseViewportState() {
    if (!isPlatformBrowser(this.platformId)) {
      console.log("\u{1F50D} VIEWPORT DIAGNOSIS - Running on server side");
      return;
    }
    console.log("\u{1F50D} VIEWPORT DIAGNOSIS - Starting...");
    try {
      const viewports = document.querySelectorAll("cdk-virtual-scroll-viewport");
      console.table({
        "Total Viewports": viewports.length,
        "Setup Attempted": this.setupAttempted.size,
        "Setup In Progress": this.setupInProgress.size,
        "Is Ready": this.isViewportReady()
      });
      viewports.forEach((viewport, index) => {
        console.log(`Viewport ${index + 1}:`, {
          id: viewport.getAttribute("id"),
          componentId: viewport.getAttribute("data-component-instance"),
          classes: viewport.className,
          uniqueInstance: viewport.getAttribute("data-cdk-unique-instance")
        });
      });
    } catch (error) {
      console.error("\u274C VIEWPORT DIAGNOSIS - Error:", error);
    }
  }
};
_ViewportManagerService.\u0275fac = function ViewportManagerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ViewportManagerService)(\u0275\u0275inject(RendererFactory2), \u0275\u0275inject(PLATFORM_ID));
};
_ViewportManagerService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ViewportManagerService, factory: _ViewportManagerService.\u0275fac, providedIn: "root" });
var ViewportManagerService = _ViewportManagerService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ViewportManagerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: RendererFactory2 }, { type: Object, decorators: [{
    type: Inject,
    args: [PLATFORM_ID]
  }] }], null);
})();

// src/app/services/program-list/program-list-facade.service.ts
var _ProgramListFacadeService = class _ProgramListFacadeService {
  constructor(timeManager, dimensionCalculator, styleManager, logoManager, viewportManager, homeDataService) {
    this.timeManager = timeManager;
    this.dimensionCalculator = dimensionCalculator;
    this.styleManager = styleManager;
    this.logoManager = logoManager;
    this.viewportManager = viewportManager;
    this.homeDataService = homeDataService;
    console.log("[ProgramListFacade] Constructor initialized");
    console.log("[ProgramListFacade] HomeDataService instance:", !!this.homeDataService);
    if (this.homeDataService) {
      console.log("[ProgramListFacade] programListData$ exists:", !!this.homeDataService.programListData$);
    }
  }
  // ===============================================
  // DATOS Y ESTADO
  // ===============================================
  /**
   * Obtiene los datos de programación para la lista
   */
  getProgramListData() {
    console.log("[ProgramListFacade] getProgramListData called");
    if (!this.homeDataService) {
      console.error("[ProgramListFacade] CRITICAL: HomeDataService is undefined!");
      return of([]);
    }
    const stream = this.homeDataService.programListData$ ?? this.homeDataService.getProgramListData$?.();
    if (stream) {
      return stream;
    }
    console.warn("[ProgramListFacade] programListData$ not available, returning empty stream fallback");
    return of([]);
  }
  /**
   * Obtiene el estado de carga
   */
  getLoadingState() {
    return this.homeDataService.loading$;
  }
  /**
   * Obtiene el estado de error
   */
  getErrorState() {
    return this.homeDataService.error$;
  }
  /**
   * Refresca los datos
   */
  refreshData() {
    return this.homeDataService.refreshData().pipe(map((result) => ({
      success: result.success,
      data: result.success ? true : false,
      error: result.success ? void 0 : result.error
    })));
  }
  // ===============================================
  // TIEMPO Y FRANJAS HORARIAS
  // ===============================================
  /**
   * Obtiene las franjas horarias disponibles
   */
  getTimeSlots() {
    return this.timeManager.getTimeSlots();
  }
  /**
   * Obtiene la franja horaria actual
   */
  getCurrentTimeSlot() {
    return this.timeManager.getCurrentTimeSlot();
  }
  /**
   * Genera las horas para una franja específica
   */
  generateHoursForSlot(slotIndex) {
    return this.timeManager.generateHoursForSlot(slotIndex);
  }
  /**
   * Formatea tiempo para visualización
   */
  formatDisplayTime(timeString) {
    return this.timeManager.formatDisplayTime(timeString);
  }
  /**
   * Calcula el estado del indicador de tiempo actual
   */
  calculateTimeIndicatorState(activeDay, currentTimeSlot) {
    return new Observable((subscriber) => {
      const visible = this.timeManager.shouldShowCurrentTimeIndicator(activeDay);
      const currentTime = this.timeManager.getCurrentTime();
      const leftPosition = this.dimensionCalculator.calculateCurrentTimeIndicatorPosition(currentTime, currentTimeSlot);
      subscriber.next({
        visible,
        leftPosition,
        currentTime
      });
    });
  }
  // ===============================================
  // DIMENSIONES Y POSICIONAMIENTO
  // ===============================================
  /**
   * Calcula el ancho de un programa
   */
  calculateProgramWidth(duration) {
    return this.dimensionCalculator.calculateProgramWidth(duration);
  }
  /**
   * Calcula la posición izquierda de un programa
   */
  calculateLeftPosition(programTime, baseTime) {
    return this.dimensionCalculator.calculateLeftPosition(programTime, baseTime);
  }
  /**
   * Actualiza las dimensiones de pantalla
   */
  updateScreenDimensions() {
    this.dimensionCalculator.updateScreenDimensions();
  }
  // ===============================================
  // ESTILOS Y CATEGORÍAS
  // ===============================================
  /**
   * Obtiene las clases CSS para el badge de categoría
   */
  getCategoryBadgeClasses(categoryValue) {
    return this.styleManager.getCategoryBadgeClasses(categoryValue);
  }
  /**
   * Obtiene el nombre de visualización de una categoría
   */
  getCategoryDisplayName(categoryValue) {
    return this.styleManager.getCategoryDisplayName(categoryValue);
  }
  /**
   * Obtiene las clases CSS para botones de día
   */
  getDayButtonClasses(dayIndex, activeIndex) {
    return this.styleManager.getDayButtonClasses(dayIndex, activeIndex);
  }
  /**
   * Obtiene las clases CSS para botones de franja horaria
   */
  getTimeSlotButtonClasses(timeSlot, activeSlot) {
    return this.styleManager.getTimeSlotButtonClasses(timeSlot, activeSlot);
  }
  /**
   * Obtiene las clases CSS para contenedor de programa
   */
  getProgramContainerClasses(isSelected, isLive) {
    return this.styleManager.getProgramContainerClasses(isSelected, isLive);
  }
  // ===============================================
  // LOGOS DE CANALES
  // ===============================================
  /**
   * Obtiene la URL del logo de un canal
   */
  getChannelLogoUrl(channelData) {
    return this.logoManager.getChannelLogoUrl(channelData);
  }
  /**
   * Maneja el error de carga de logo
   */
  handleLogoError(event) {
    this.logoManager.handleLogoError(event);
  }
  /**
   * Maneja la carga exitosa de logo
   */
  handleLogoLoad(event) {
    this.logoManager.handleLogoLoad(event);
  }
  /**
   * Actualiza los datos de canales para logos
   */
  updateChannelData(canalesData) {
    this.logoManager.updateCanalesData(canalesData);
  }
  // ===============================================
  // VIEWPORT VIRTUAL
  // ===============================================
  /**
   * Configura el viewport único
   */
  setupUniqueViewport(elementRef, componentId) {
    this.viewportManager.setupUniqueViewport(elementRef, componentId);
  }
  /**
   * Verifica si el viewport está listo
   */
  isViewportReady() {
    return this.viewportManager.isViewportReady();
  }
  /**
   * Limpia el viewport
   */
  cleanupViewport() {
    this.viewportManager.cleanupViewport();
  }
  // ===============================================
  // UTILIDADES Y HELPERS
  // ===============================================
  /**
   * Genera información de días
   */
  generateDaysInfo() {
    const days = [];
    const currentDate = /* @__PURE__ */ new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      const diaSemana = date.toLocaleDateString("es-ES", { weekday: "long" });
      const diaNumero = date.toLocaleDateString("es-ES", { day: "numeric" });
      days.push({ diaSemana, diaNumero, index: i });
    }
    return days;
  }
  /**
   * Carga datos para un día específico
   * @param dayIndex - 0 = today, 1 = tomorrow, 2 = after_tomorrow
   */
  loadProgramsForDay(dayIndex) {
    return this.homeDataService.loadDataForDay(dayIndex).pipe(map((result) => ({
      success: result.success,
      data: result.success ? true : false,
      error: result.success ? void 0 : result.error
    })));
  }
  /**
   * Calcula la duración de un programa
   */
  calculateProgramDuration(startTime, endTime) {
    return this.timeManager.calculateDuration(startTime, endTime);
  }
  /**
   * Genera aria-label para un programa
   */
  generateProgramAriaLabel(programa) {
    const startTime = this.formatDisplayTime(programa.start);
    const endTime = this.formatDisplayTime(programa.stop);
    const category = this.getCategoryDisplayName(programa.category?.value || "");
    return `${programa.title || "Programa"}, ${startTime} a ${endTime}, ${category}`;
  }
  /**
   * Diagnóstico completo del estado
   */
  diagnoseState() {
    console.log("\u{1F9D0} PROGRAM LIST FACADE - Diagnosing state...");
    const dimensionsValid = this.dimensionCalculator.areDimensionsValid();
    console.log("\u{1F9D0} Dimensions valid:", dimensionsValid);
    this.viewportManager.diagnoseViewportState();
    const logoStats = this.logoManager.getCacheStats();
    console.log("\u{1F5C2}\uFE0F Logo cache stats:", logoStats);
    this.homeDataService.debugState();
  }
  /**
   * Reinicia todos los caches y estados
   */
  resetAllCaches() {
    this.logoManager.clearCache();
    this.viewportManager.cleanupViewport();
    console.log("\u{1F5C2}\uFE0F All caches reset");
  }
};
_ProgramListFacadeService.\u0275fac = function ProgramListFacadeService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ProgramListFacadeService)(\u0275\u0275inject(TimeManagerService), \u0275\u0275inject(DimensionCalculatorService), \u0275\u0275inject(CategoryStyleManagerService), \u0275\u0275inject(ChannelLogoManagerService), \u0275\u0275inject(ViewportManagerService), \u0275\u0275inject(HomeDataService));
};
_ProgramListFacadeService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ProgramListFacadeService, factory: _ProgramListFacadeService.\u0275fac, providedIn: "root" });
var ProgramListFacadeService = _ProgramListFacadeService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgramListFacadeService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{ type: TimeManagerService }, { type: DimensionCalculatorService }, { type: CategoryStyleManagerService }, { type: ChannelLogoManagerService }, { type: ViewportManagerService }, { type: HomeDataService }], null);
})();

export {
  AnimationMetadataType,
  AUTO_STYLE,
  trigger,
  animate,
  sequence,
  style,
  state,
  transition,
  NoopAnimationPlayer,
  AnimationGroupPlayer,
  ɵPRE_STYLE,
  takeUntilDestroyed,
  ConsoleLoggerService,
  TimeManagerService,
  DimensionCalculatorService,
  CategoryStyleManagerService,
  ChannelLogoManagerService,
  ViewportManagerService,
  ProgramListFacadeService
};
/*! Bundled license information:

@angular/core/fesm2022/rxjs-interop.mjs:
@angular/animations/fesm2022/private_export-faY_wCkZ.mjs:
  (**
   * @license Angular v20.0.0
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-S55AJ6QF.js.map
