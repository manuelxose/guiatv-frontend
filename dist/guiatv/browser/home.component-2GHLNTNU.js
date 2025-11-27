import {
  ConsoleLoggerService,
  ProgramListFacadeService,
  animate,
  sequence,
  state,
  style,
  takeUntilDestroyed,
  transition,
  trigger
} from "./chunk-S55AJ6QF.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-O7DAVEUU.js";
import {
  BannerComponent
} from "./chunk-2UMAA7PO.js";
import {
  NavBarComponent
} from "./chunk-MEXIL4LO.js";
import "./chunk-REERXIA3.js";
import {
  MetaService
} from "./chunk-MKFCNM4X.js";
import {
  CommonModule,
  HomeDataService,
  HttpClient,
  NgClass,
  NgForOf,
  NgIf,
  isPlatformBrowser,
  isPlatformServer
} from "./chunk-MUKTTSZO.js";
import {
  ANIMATION_MODULE_TYPE,
  BehaviorSubject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  DestroyRef,
  EventEmitter,
  HostListener,
  Inject,
  Injectable,
  Injector,
  Input,
  Output,
  PLATFORM_ID,
  REQUEST,
  RendererFactory2,
  RuntimeError,
  TransferState,
  ViewChild,
  ViewEncapsulation,
  __spreadProps,
  __spreadValues,
  computed,
  debounceTime,
  filter,
  fromEvent,
  inject,
  makeStateKey,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵviewQuery
} from "./chunk-UEL6V4IP.js";

// src/app/services/program-list/category-filter.service.ts
var _CategoryFilterService = class _CategoryFilterService {
  constructor() {
    this._selectedCategory = new BehaviorSubject(null);
    this._availableCategories = new BehaviorSubject([]);
    this._allPrograms = new BehaviorSubject([]);
    this._selectedCategorySignal = signal(null);
    this._availableCategoriesSignal = signal([]);
    this._allProgramsSignal = signal([]);
    this.selectedCategory$ = this._selectedCategory.asObservable();
    this.availableCategories$ = this._availableCategories.asObservable();
    this.filteredPrograms$ = this._allPrograms.asObservable();
    this.filteredPrograms = computed(() => {
      const selectedCategory = this._selectedCategorySignal();
      const allPrograms = this._allProgramsSignal();
      if (!selectedCategory) {
        return allPrograms;
      }
      return allPrograms.filter((program) => this.programMatchesCategory(program, selectedCategory));
    });
    this.availableCategories = computed(() => {
      const programs = this._allProgramsSignal();
      return this.extractCategoriesFromPrograms(programs);
    });
  }
  // ===============================================
  // MÉTODOS PÚBLICOS - INTERFACE IMPLEMENTATION
  // ===============================================
  /**
   * Selecciona una categoría para filtrar
   */
  selectCategory(category) {
    if (!this.isValidCategory(category)) {
      console.warn(`CategoryFilterService: Invalid category: ${category}`);
      return;
    }
    this._selectedCategorySignal.set(category);
    this._selectedCategory.next(category);
    console.log(`CategoryFilterService: Category selected: ${category}`);
  }
  /**
   * Limpia el filtro de categoría
   */
  clearCategoryFilter() {
    this._selectedCategorySignal.set(null);
    this._selectedCategory.next(null);
    console.log("CategoryFilterService: Category filter cleared");
  }
  /**
   * Actualiza la lista de programas
   */
  updatePrograms(programs) {
    this._allProgramsSignal.set(programs);
    this._allPrograms.next(programs);
    const categories = this.extractCategoriesFromPrograms(programs);
    this._availableCategoriesSignal.set(categories);
    this._availableCategories.next(categories);
    console.log(`CategoryFilterService: Programs updated: ${programs.length} items, ${categories.length} categories`);
  }
  /**
   * Obtiene estadísticas de una categoría específica
   */
  getCategoryStats(category) {
    const programs = this._allProgramsSignal();
    const categoryPrograms = programs.filter((program) => this.programMatchesCategory(program, category));
    const now = /* @__PURE__ */ new Date();
    const currentlyAiring = categoryPrograms.filter((program) => {
      const startTime = new Date(program.start);
      const endTime = new Date(program.end);
      return startTime <= now && endTime > now;
    }).length;
    const nextPrograms = categoryPrograms.filter((program) => new Date(program.start) > now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const nextProgramTime = nextPrograms.length > 0 ? new Date(nextPrograms[0].start).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }) : "N/A";
    const channelsCount = new Set(categoryPrograms.map((program) => program.channel?.id || program.channel_id)).size;
    return {
      totalPrograms: categoryPrograms.length,
      channelsCount,
      currentlyAiring,
      nextProgramTime
    };
  }
  /**
   * Verifica si una categoría es válida
   */
  isValidCategory(category) {
    return typeof category === "string" && category.trim().length > 0;
  }
  /**
   * Extrae categorías únicas de una lista de programas
   */
  extractCategoriesFromPrograms(programs) {
    const categoriesSet = /* @__PURE__ */ new Set();
    programs.forEach((program) => {
      if (program.category && typeof program.category === "object" && program.category.value) {
        const categories = program.category.value.split(",").map((cat) => cat.trim());
        categories.forEach((cat) => {
          if (cat)
            categoriesSet.add(cat);
        });
      }
    });
    return Array.from(categoriesSet).sort();
  }
  // ===============================================
  // GETTERS PARA SIGNALS (API CONVENIENTE)
  // ===============================================
  /**
   * Obtiene la categoría seleccionada actual
   */
  getSelectedCategory() {
    return this._selectedCategorySignal();
  }
  /**
   * Obtiene todas las categorías disponibles
   */
  getAvailableCategories() {
    return this._availableCategoriesSignal();
  }
  /**
   * Obtiene los programas filtrados
   */
  getFilteredPrograms() {
    return this.filteredPrograms();
  }
  // ===============================================
  // MÉTODOS PRIVADOS
  // ===============================================
  /**
   * Verifica si un programa coincide con la categoría especificada
   */
  programMatchesCategory(program, category) {
    if (!program.category)
      return false;
    if (typeof program.category === "object" && program.category.value) {
      return program.category.value.toLowerCase().includes(category.toLowerCase());
    }
    return false;
  }
};
_CategoryFilterService.\u0275fac = function CategoryFilterService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _CategoryFilterService)();
};
_CategoryFilterService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CategoryFilterService, factory: _CategoryFilterService.\u0275fac, providedIn: "root" });
var CategoryFilterService = _CategoryFilterService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CategoryFilterService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@angular/animations/fesm2022/animations.mjs
var AnimationBuilder = class _AnimationBuilder {
  static \u0275fac = function AnimationBuilder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AnimationBuilder)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _AnimationBuilder,
    factory: () => (() => inject(BrowserAnimationBuilder))(),
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AnimationBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root",
      useFactory: () => inject(BrowserAnimationBuilder)
    }]
  }], null, null);
})();
var AnimationFactory = class {
};
var BrowserAnimationBuilder = class _BrowserAnimationBuilder extends AnimationBuilder {
  animationModuleType = inject(ANIMATION_MODULE_TYPE, {
    optional: true
  });
  _nextAnimationId = 0;
  _renderer;
  constructor(rootRenderer, doc) {
    super();
    const typeData = {
      id: "0",
      encapsulation: ViewEncapsulation.None,
      styles: [],
      data: {
        animation: []
      }
    };
    this._renderer = rootRenderer.createRenderer(doc.body, typeData);
    if (this.animationModuleType === null && !isAnimationRenderer(this._renderer)) {
      throw new RuntimeError(3600, (typeof ngDevMode === "undefined" || ngDevMode) && "Angular detected that the `AnimationBuilder` was injected, but animation support was not enabled. Please make sure that you enable animations in your application by calling `provideAnimations()` or `provideAnimationsAsync()` function.");
    }
  }
  build(animation2) {
    const id = this._nextAnimationId;
    this._nextAnimationId++;
    const entry = Array.isArray(animation2) ? sequence(animation2) : animation2;
    issueAnimationCommand(this._renderer, null, id, "register", [entry]);
    return new BrowserAnimationFactory(id, this._renderer);
  }
  static \u0275fac = function BrowserAnimationBuilder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrowserAnimationBuilder)(\u0275\u0275inject(RendererFactory2), \u0275\u0275inject(DOCUMENT));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _BrowserAnimationBuilder,
    factory: _BrowserAnimationBuilder.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserAnimationBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: RendererFactory2
  }, {
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var BrowserAnimationFactory = class extends AnimationFactory {
  _id;
  _renderer;
  constructor(_id, _renderer) {
    super();
    this._id = _id;
    this._renderer = _renderer;
  }
  create(element, options) {
    return new RendererAnimationPlayer(this._id, element, options || {}, this._renderer);
  }
};
var RendererAnimationPlayer = class {
  id;
  element;
  _renderer;
  parentPlayer = null;
  _started = false;
  constructor(id, element, options, _renderer) {
    this.id = id;
    this.element = element;
    this._renderer = _renderer;
    this._command("create", options);
  }
  _listen(eventName, callback) {
    return this._renderer.listen(this.element, `@@${this.id}:${eventName}`, callback);
  }
  _command(command, ...args) {
    issueAnimationCommand(this._renderer, this.element, this.id, command, args);
  }
  onDone(fn) {
    this._listen("done", fn);
  }
  onStart(fn) {
    this._listen("start", fn);
  }
  onDestroy(fn) {
    this._listen("destroy", fn);
  }
  init() {
    this._command("init");
  }
  hasStarted() {
    return this._started;
  }
  play() {
    this._command("play");
    this._started = true;
  }
  pause() {
    this._command("pause");
  }
  restart() {
    this._command("restart");
  }
  finish() {
    this._command("finish");
  }
  destroy() {
    this._command("destroy");
  }
  reset() {
    this._command("reset");
    this._started = false;
  }
  setPosition(p) {
    this._command("setPosition", p);
  }
  getPosition() {
    return unwrapAnimationRenderer(this._renderer)?.engine?.players[this.id]?.getPosition() ?? 0;
  }
  totalTime = 0;
};
function issueAnimationCommand(renderer, element, id, command, args) {
  renderer.setProperty(element, `@@${id}:${command}`, args);
}
function unwrapAnimationRenderer(renderer) {
  const type = renderer.\u0275type;
  if (type === 0) {
    return renderer;
  } else if (type === 1) {
    return renderer.animationRenderer;
  }
  return null;
}
function isAnimationRenderer(renderer) {
  const type = renderer.\u0275type;
  return type === 0 || type === 1;
}

// src/app/services/program-list-transform.service.ts
var UI_CONFIG = {
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  BASE_CHANNEL_HEIGHT: 75,
  LAYER_HEIGHT: 75,
  EXPANDED_BANNER_HEIGHT: 320,
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5,
  MAX_GRID_COLUMNS: 7,
  NIGHT_SLOT_END_MINUTES: 30,
  MAX_LAYERS: 5
};
var _ProgramListTransformService = class _ProgramListTransformService {
  constructor() {
  }
  findActiveSlotIndex(currentHours) {
    if (!Array.isArray(currentHours) || currentHours.length === 0)
      return null;
    const start = currentHours[0];
    const [startH, startM] = start.split(":").map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const SLOT_STARTS = [
      0,
      180,
      360,
      540,
      720,
      900,
      1080,
      1260
    ];
    const idx = SLOT_STARTS.indexOf(startMinutes);
    return idx === -1 ? null : idx;
  }
  pickPrecomputedLayout(programa, activeSlotIndex) {
    const slotLayouts = programa?.layoutsBySlot || programa?.slotLayouts || [];
    if (Array.isArray(slotLayouts) && slotLayouts.length) {
      if (activeSlotIndex !== null) {
        const matched = slotLayouts.find((l) => l.timeSlotIndex === activeSlotIndex);
        if (matched)
          return matched;
        return null;
      }
      return slotLayouts[0] || null;
    }
    const hasInlineLayout = typeof programa?.gridColumnStart === "number" && typeof programa?.gridColumnEnd === "number";
    if (hasInlineLayout) {
      return {
        timeSlotIndex: typeof programa?.timeSlotIndex === "number" ? programa.timeSlotIndex : activeSlotIndex ?? 0,
        gridColumnStart: programa.gridColumnStart,
        gridColumnEnd: programa.gridColumnEnd,
        layerIndex: programa.layerIndex,
        isCutAtStart: programa.isCutAtStart,
        isCutAtEnd: programa.isCutAtEnd,
        visibleStartTime: programa.visibleStartTime,
        visibleEndTime: programa.visibleEndTime,
        crossesMidnight: programa.crossesMidnight,
        pxStart: programa.pxStart,
        pxWidth: programa.pxWidth
      };
    }
    return null;
  }
  parseTimeToMinutes(timeString) {
    const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }
  formatMinutesToHHMM(totalMinutes) {
    const norm = (Math.floor(totalMinutes) % 1440 + 1440) % 1440;
    const hh = Math.floor(norm / 60).toString().padStart(2, "0");
    const mm = (norm % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }
  minutesToGridColumn(minutes, slotStartMinutes, totalColumns, isNightSlot) {
    const unit = UI_CONFIG.MINUTES_PER_COLUMN;
    let delta = minutes - slotStartMinutes;
    if (delta < 0 && isNightSlot) {
      delta += 1440;
    }
    if (delta < 0)
      delta = 0;
    const colIndex = Math.floor(delta / unit);
    return Math.max(1, Math.min(totalColumns, colIndex + 1));
  }
  isNightTimeSlot(currentHours) {
    return currentHours?.includes("00:00") ?? false;
  }
  getSlotEndMinutes(currentHours) {
    if (!currentHours?.length)
      return 1440;
    const lastHour = currentHours[currentHours.length - 1];
    const [hours, minutes] = lastHour.split(":").map(Number);
    let lastHourMinutes = hours * 60 + (minutes || 0);
    let slotEndMinutes = lastHourMinutes + UI_CONFIG.MINUTES_PER_SLOT;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    if (slotEndMinutes <= slotStartMinutes) {
      slotEndMinutes += 1440;
    }
    return slotEndMinutes;
  }
  getSlotStartTimestamp(dayOffset, slotStartMinutes) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayOffset;
    const hours = Math.floor(slotStartMinutes / 60);
    const minutes = slotStartMinutes % 60;
    return Date.UTC(year, month, date, hours, minutes, 0, 0);
  }
  getProgramStartTimestamp(programa) {
    try {
      return Date.parse(String(programa.start));
    } catch {
      return 0;
    }
  }
  getProgramEndTimestamp(programa) {
    try {
      const startTs = Date.parse(String(programa.start));
      let endTs = Date.parse(String(programa.stop));
      if (isNaN(endTs) || isNaN(startTs))
        return endTs || startTs || 0;
      if (endTs <= startTs) {
        endTs += 24 * 60 * 60 * 1e3;
      }
      return endTs;
    } catch {
      return 0;
    }
  }
  normalizeProgramRange(programStartMinutes, programEndMinutes, slotStartMinutes) {
    let start = programStartMinutes;
    let end = programEndMinutes;
    if (end <= start) {
      end += 1440;
    }
    while (end <= slotStartMinutes) {
      start += 1440;
      end += 1440;
    }
    if (start < slotStartMinutes && end > slotStartMinutes) {
      start = slotStartMinutes;
    }
    if (end <= start) {
      end = start + 1;
    }
    return { start, end };
  }
  getProgramStartMinutes(programa) {
    if (!programa?.start)
      return 0;
    try {
      const date = new Date(String(programa.start));
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    } catch {
      return 0;
    }
  }
  getProgramEndMinutes(programa) {
    if (!programa?.stop || !programa?.start)
      return 0;
    try {
      const startDate = new Date(String(programa.start));
      const endDate = new Date(String(programa.stop));
      const startMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
      let endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
      if (endDate.getTime() <= startDate.getTime() || endMinutes <= startMinutes) {
        endMinutes += 1440;
      }
      return endMinutes;
    } catch {
      return 0;
    }
  }
  programCrossesMidnight(programa) {
    if (!programa?.start || !programa?.stop)
      return false;
    try {
      const startMinutes = this.getProgramStartMinutes(programa);
      const endMinutes = this.getProgramEndMinutes(programa);
      return endMinutes > 1440 || endMinutes > startMinutes;
    } catch {
      return false;
    }
  }
  minutesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }
  programsOverlapInGrid(p1, p2) {
    if (typeof p1._normStartMinutes === "number" && typeof p1._normEndMinutes === "number" && typeof p2._normStartMinutes === "number" && typeof p2._normEndMinutes === "number") {
      return this.minutesOverlap(p1._normStartMinutes, p1._normEndMinutes, p2._normStartMinutes, p2._normEndMinutes);
    }
    const noOverlap = p1.gridColumnEnd <= p2.gridColumnStart || p2.gridColumnEnd <= p1.gridColumnStart;
    return !noOverlap;
  }
  removeOverlappingPrograms(programs, currentHours) {
    if (!programs || programs.length < 2)
      return programs;
    const slotStartMinutes = currentHours.length ? this.parseTimeToMinutes(currentHours[0]) : 0;
    const mapped = programs.map((p) => {
      const startMin = this.getProgramStartMinutes(p);
      const endMin = this.getProgramEndMinutes(p);
      const { start, end } = this.normalizeProgramRange(startMin, endMin, slotStartMinutes);
      return { program: p, start, end };
    });
    mapped.sort((a, b) => a.start !== b.start ? a.start - b.start : a.end - b.end);
    const kept = [];
    kept.push(mapped[0]);
    for (let i = 1; i < mapped.length; i++) {
      const current = mapped[i];
      const last = kept[kept.length - 1];
      if (current.start >= last.end) {
        kept.push(current);
        continue;
      }
      kept[kept.length - 1] = current;
    }
    return kept.map((k) => k.program);
  }
  isProgramInVisibleSlot(programa, slotStartMinutes, slotEndMinutes, isNightSlot) {
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    if (isNightSlot) {
      return programStartMinutes >= slotStartMinutes || programEndMinutes <= slotEndMinutes || programStartMinutes < slotStartMinutes && programEndMinutes > slotStartMinutes;
    } else {
      return programStartMinutes < slotEndMinutes && programEndMinutes > slotStartMinutes;
    }
  }
  calculateNightCrossingEndMinutes(programEndMinutes, slotEndMinutes) {
    return programEndMinutes <= slotEndMinutes ? programEndMinutes : slotEndMinutes;
  }
  calculateGridColumnEnd(programa, programStartMinutes, effectiveEndMinutes, slotStartMinutes, isNightSlot, crossesMidnight) {
    const columnsPerSlot = UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;
    const unit = UI_CONFIG.MINUTES_PER_COLUMN;
    let endMinutesFromSlotStart = effectiveEndMinutes - slotStartMinutes;
    if (endMinutesFromSlotStart < 0 && isNightSlot) {
      endMinutesFromSlotStart += 1440;
    }
    if (endMinutesFromSlotStart < 1)
      endMinutesFromSlotStart = 1;
    const endColIndex = Math.ceil(endMinutesFromSlotStart / unit);
    const finalEndColumn = Math.max(2, Math.min(totalColumns + 1, endColIndex + 1));
    return finalEndColumn;
  }
  getProgramGridColumn(programa, currentHours) {
    const activeSlotIndex = this.findActiveSlotIndex(currentHours);
    const layout = this.pickPrecomputedLayout(programa, activeSlotIndex);
    if (layout?.gridColumnStart)
      return layout.gridColumnStart || 1;
    if (!currentHours.length)
      return 1;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const columnsPerSlot = UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;
    const { start: normalizedStart } = this.normalizeProgramRange(programStartMinutes, programEndMinutes, slotStartMinutes);
    return this.minutesToGridColumn(normalizedStart, slotStartMinutes, totalColumns, isNightSlot);
  }
  getProgramGridColumnEnd(programa, currentHours) {
    const activeSlotIndex = this.findActiveSlotIndex(currentHours);
    const layout = this.pickPrecomputedLayout(programa, activeSlotIndex);
    if (layout?.gridColumnEnd)
      return layout.gridColumnEnd || 2;
    if (!currentHours.length)
      return 2;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);
    const { start: normalizedStart, end: normalizedEnd } = this.normalizeProgramRange(programStartMinutes, programEndMinutes, slotStartMinutes);
    let effectiveProgramEndMinutes;
    const programInVisibleSlot = this.isProgramInVisibleSlot(programa, slotStartMinutes, slotEndMinutes, isNightSlot);
    if (!programInVisibleSlot) {
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot && crossesMidnight) {
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot) {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    } else {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    }
    return this.calculateGridColumnEnd(programa, normalizedStart, effectiveProgramEndMinutes, slotStartMinutes, isNightSlot, crossesMidnight);
  }
  getLayoutForProgram(programa, currentHours) {
    const activeSlotIndex = this.findActiveSlotIndex(currentHours);
    return this.pickPrecomputedLayout(programa, activeSlotIndex);
  }
  getVisiblePrograms(programs, currentHours, activeDay) {
    if (!programs?.length)
      return [];
    if (!currentHours.length)
      return programs;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const slotStartTs = this.getSlotStartTimestamp(activeDay, slotStartMinutes);
    const slotEndTs = slotStartTs + (slotEndMinutes - slotStartMinutes) * 6e4;
    const DAY_MS = 24 * 60 * 60 * 1e3;
    const visible = programs.filter((programa) => {
      const hasDate = /\d{4}-\d{2}-\d{2}T/.test(String(programa.start));
      if (hasDate) {
        const startTs = Date.parse(String(programa.start));
        let endTs = Date.parse(String(programa.stop));
        if (isNaN(startTs) || isNaN(endTs))
          return false;
        if (endTs <= startTs)
          endTs += DAY_MS;
        const programIntersectsSlot = startTs < slotEndTs && endTs > slotStartTs;
        if (programIntersectsSlot)
          return true;
        const approxShiftDays = Math.round((slotStartTs - startTs) / DAY_MS);
        for (let k = approxShiftDays - 1; k <= approxShiftDays + 1; k++) {
          const adjStart = startTs + k * DAY_MS;
          const adjEnd = endTs + k * DAY_MS;
          if (adjStart < slotEndTs && adjEnd > slotStartTs)
            return true;
        }
        return false;
      }
      const programStartMinutes = this.getProgramStartMinutes(programa);
      const programEndMinutes = this.getProgramEndMinutes(programa);
      const { start: normStart, end: normEnd } = this.normalizeProgramRange(programStartMinutes, programEndMinutes, slotStartMinutes);
      return normEnd > slotStartMinutes && normStart < slotEndMinutes;
    });
    return visible;
  }
  calculateVisibleDuration(programa, currentHours) {
    if (!currentHours.length)
      return 30;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);
    if (isNightSlot && crossesMidnight) {
      return this.calculateNightCrossingDuration(programStartMinutes, programEndMinutes, slotStartMinutes, slotEndMinutes);
    }
    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const visibleEndMinutes = isNightSlot ? Math.min(programEndMinutes, 1440) : Math.min(programEndMinutes, slotEndMinutes);
    return Math.max(1, visibleEndMinutes - visibleStartMinutes);
  }
  calculateNightCrossingDuration(programStartMinutes, programEndMinutes, slotStartMinutes, slotEndMinutes) {
    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const durationUntilMidnight = 1440 - visibleStartMinutes;
    const durationAfterMidnight = Math.min(programEndMinutes, slotEndMinutes);
    return Math.max(1, durationUntilMidnight + durationAfterMidnight);
  }
  calculateRealDuration(programa) {
    const startMinutes = this.getProgramStartMinutes(programa);
    const endMinutes = this.getProgramEndMinutes(programa);
    if (this.programCrossesMidnight(programa)) {
      return 1440 - startMinutes + endMinutes;
    }
    return endMinutes - startMinutes;
  }
  filterProgramsByActiveDay(programs, dayIndex) {
    if (!Array.isArray(programs) || programs.length === 0)
      return [];
    const DAY_MS = 24 * 60 * 60 * 1e3;
    const now = /* @__PURE__ */ new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayIndex;
    const dayStartTs = Date.UTC(year, month, date, 0, 0, 0, 0);
    const dayEndTs = dayStartTs + DAY_MS;
    const parsePossibleTimestamp = (value, preferDateForTimeOnly = true) => {
      if (value == null)
        return null;
      const s = String(value).trim();
      if (/\d{4}-\d{2}-\d{2}T/.test(s)) {
        const ts2 = Date.parse(s);
        return isNaN(ts2) ? null : ts2;
      }
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
        const ts2 = Date.parse(s.replace(" ", "T"));
        return isNaN(ts2) ? null : ts2;
      }
      if (/^\d{1,2}:\d{2}$/.test(s)) {
        const [hStr, mStr] = s.split(":");
        const h = Number(hStr || 0);
        const m = Number(mStr || 0);
        if (!Number.isFinite(h) || !Number.isFinite(m))
          return null;
        return Date.UTC(year, month, date, h, m, 0, 0);
      }
      const ts = Date.parse(s);
      return isNaN(ts) ? null : ts;
    };
    return programs.filter((p) => {
      let startTs = parsePossibleTimestamp(p.start);
      let endTs = parsePossibleTimestamp(p.stop);
      if (startTs != null && endTs != null) {
        if (endTs <= startTs)
          endTs += DAY_MS;
        if (startTs < dayEndTs && endTs > dayStartTs)
          return true;
        const approxShift = Math.round((dayStartTs - startTs) / DAY_MS);
        for (let k = approxShift - 1; k <= approxShift + 1; k++) {
          const adjStart = startTs + k * DAY_MS;
          const adjEnd = endTs + k * DAY_MS;
          if (adjStart < dayEndTs && adjEnd > dayStartTs)
            return true;
        }
        return false;
      }
      if (startTs == null && typeof p.start === "string" && /^\d{1,2}:\d{2}$/.test(p.start)) {
        startTs = parsePossibleTimestamp(p.start);
      }
      if (endTs == null && typeof p.stop === "string" && /^\d{1,2}:\d{2}$/.test(p.stop)) {
        endTs = parsePossibleTimestamp(p.stop);
      }
      if (startTs != null && endTs == null) {
        endTs = startTs + 30 * 60 * 1e3;
      }
      if (startTs == null || endTs == null)
        return false;
      if (endTs <= startTs)
        endTs += DAY_MS;
      return startTs < dayEndTs && endTs > dayStartTs;
    });
  }
  normalizeCategoryName(category) {
    const normalizedCategory = category.toLowerCase().trim();
    const categoryMappings = {
      pelicula: "Pel\xC3\xADculas",
      peliculas: "Pel\xC3\xADculas",
      cine: "Pel\xC3\xADculas",
      serie: "Series",
      series: "Series",
      drama: "Series",
      documental: "Documentales",
      documentales: "Documentales",
      noticia: "Noticias",
      noticias: "Noticias",
      informativo: "Noticias",
      deporte: "Deportes",
      deportes: "Deportes",
      futbol: "Deportes",
      entretenimiento: "Entretenimiento",
      show: "Entretenimiento",
      musica: "M\xFAsica",
      m\u00FAsica: "M\xFAsica",
      infantil: "Infantil",
      ni\u00F1os: "Infantil"
    };
    return categoryMappings[normalizedCategory] || this.capitalizeFirstLetter(normalizedCategory);
  }
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  sortCategories(categories) {
    const categoryOrder = [
      "Pel\xC3\xADculas",
      "Series",
      "Documentales",
      "Noticias",
      "Deportes",
      "Entretenimiento",
      "M\xC3\xBAsica",
      "Infantil"
    ];
    return categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1)
        return aIndex - bIndex;
      if (aIndex !== -1)
        return -1;
      if (bIndex !== -1)
        return 1;
      return a.localeCompare(b);
    });
  }
  programMatchesCategory(programa, categories) {
    if (!programa?.category?.value)
      return false;
    const programCategories = String(programa.category.value).split(",").map((cat) => this.normalizeCategoryName(cat.trim())).filter((cat) => cat);
    return categories.some((category) => programCategories.some((programCategory) => programCategory.toLowerCase() === category.toLowerCase()));
  }
  /**
   * Extrae y normaliza la lista de categorÃ­as disponibles a partir de los canales
   */
  getAvailableCategories(channels) {
    if (!Array.isArray(channels) || channels.length === 0)
      return [];
    const categoriesSet = /* @__PURE__ */ new Set();
    channels.forEach((canal) => {
      const progs = Array.isArray(canal.channels) ? canal.channels : [];
      progs.forEach((p) => {
        if (p?.category?.value) {
          String(p.category.value).split(",").map((c) => this.normalizeCategoryName(c.trim())).filter((c) => c).forEach((c) => categoriesSet.add(c));
        }
      });
    });
    return this.sortCategories(Array.from(categoriesSet));
  }
  /**
   * Filtra canales por las categorÃ­as seleccionadas (Set<string>), devolviendo solo
   * canales que tengan al menos un programa que coincida.
   */
  getFilteredChannels(channels, selectedCategories) {
    if (!Array.isArray(channels) || channels.length === 0)
      return [];
    if (!selectedCategories || selectedCategories.size === 0)
      return channels;
    const categoriesArray = Array.from(selectedCategories);
    return channels.map((canal) => __spreadProps(__spreadValues({}, canal), {
      channels: (canal.channels || []).filter((programa) => this.programMatchesCategory(programa, categoriesArray))
    })).filter((canal) => Array.isArray(canal.channels) && canal.channels.length > 0);
  }
  // Main helper used by the component: compute layers for a channel
  getProgramLayers(canal, activeDay, currentHours) {
    if (!canal || !Array.isArray(canal.channels) || canal.channels.length === 0)
      return [];
    const programsForActiveDay = this.filterProgramsByActiveDay(canal.channels || [], activeDay);
    const activeSlotIndex = this.findActiveSlotIndex(currentHours);
    const precomputed = [];
    programsForActiveDay.forEach((programa) => {
      const layout = this.pickPrecomputedLayout(programa, activeSlotIndex);
      if (!layout && programa && programa.layoutsBySlot) {
        return;
      }
      if (layout) {
        precomputed.push(__spreadProps(__spreadValues({}, programa), {
          gridColumnStart: layout.gridColumnStart ?? 1,
          gridColumnEnd: layout.gridColumnEnd ?? 2,
          layerIndex: layout.layerIndex ?? 0,
          visibleStartTime: layout.visibleStartTime ?? this.formatMinutesToHHMM(this.getProgramStartMinutes(programa)),
          visibleEndTime: layout.visibleEndTime ?? this.formatMinutesToHHMM(this.getProgramEndMinutes(programa)),
          isCutAtStart: !!layout.isCutAtStart,
          isCutAtEnd: !!layout.isCutAtEnd,
          pxStart: layout.pxStart,
          pxWidth: layout.pxWidth,
          timeSlotIndex: layout.timeSlotIndex
        }));
      }
    });
    if (precomputed.length) {
      const layers2 = [];
      precomputed.sort((a, b) => a.gridColumnStart - b.gridColumnStart).forEach((program) => {
        const targetLayer = program.layerIndex ?? 0;
        if (!layers2[targetLayer])
          layers2[targetLayer] = [];
        layers2[targetLayer].push(program);
      });
      return layers2.filter((layer) => Array.isArray(layer) && layer.length);
    }
    const cleanedPrograms = this.removeOverlappingPrograms(programsForActiveDay, currentHours);
    const visiblePrograms = this.getVisiblePrograms(cleanedPrograms, currentHours, activeDay);
    if (!visiblePrograms.length)
      return [];
    const programsWithPositions = visiblePrograms.map((programa) => {
      const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
      const { start: normStart, end: normEnd } = this.normalizeProgramRange(this.getProgramStartMinutes(programa), this.getProgramEndMinutes(programa), slotStartMinutes);
      return __spreadProps(__spreadValues({}, programa), {
        gridColumnStart: this.getProgramGridColumn(programa, currentHours),
        gridColumnEnd: this.getProgramGridColumnEnd(programa, currentHours),
        layerIndex: 0,
        visibleStartTime: this.formatMinutesToHHMM(normStart),
        visibleEndTime: this.formatMinutesToHHMM(normEnd),
        isCutAtStart: normStart > this.getProgramStartMinutes(programa),
        isCutAtEnd: normEnd < this.getProgramEndMinutes(programa),
        _normStartMinutes: normStart,
        _normEndMinutes: normEnd
      });
    });
    programsWithPositions.sort((a, b) => {
      if (a.gridColumnStart !== b.gridColumnStart)
        return a.gridColumnStart - b.gridColumnStart;
      return b.gridColumnEnd - b.gridColumnStart - (a.gridColumnEnd - a.gridColumnStart);
    });
    const layers = [];
    programsWithPositions.forEach((program) => {
      let layerIndex = 0;
      let placed = false;
      while (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        if (!layers[layerIndex])
          layers[layerIndex] = [];
        const hasOverlap = layers[layerIndex].some((existingProgram) => this.programsOverlapInGrid(program, existingProgram));
        if (!hasOverlap) {
          program.layerIndex = layerIndex;
          layers[layerIndex].push(program);
          placed = true;
        } else {
          layerIndex++;
        }
      }
      if (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        program.layerIndex = layerIndex;
        layers[layerIndex] = [program];
      }
    });
    return layers;
  }
};
_ProgramListTransformService.\u0275fac = function ProgramListTransformService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ProgramListTransformService)();
};
_ProgramListTransformService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ProgramListTransformService, factory: _ProgramListTransformService.\u0275fac, providedIn: "root" });
var ProgramListTransformService = _ProgramListTransformService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgramListTransformService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [], null);
})();

// src/app/services/device-detector.service.ts
var DEVICE_INFO_KEY = makeStateKey("deviceInfo");
var _DeviceDetectorService = class _DeviceDetectorService {
  constructor() {
    this.platformId = inject(PLATFORM_ID);
    this.destroyRef = inject(DestroyRef);
    this.transferState = inject(TransferState);
    this.request = inject(REQUEST, { optional: true });
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.width = signal(1024);
    this.height = signal(768);
    this._isTouchDevice = signal(false);
    this.initialized = signal(false);
    this.deviceType = computed(() => {
      const w = this.width();
      if (w < 768)
        return "mobile";
      if (w < 1024)
        return "tablet";
      return "desktop";
    });
    this.isMobile = computed(() => this.deviceType() === "mobile");
    this.isTablet = computed(() => this.deviceType() === "tablet");
    this.isDesktop = computed(() => this.deviceType() === "desktop");
    this.orientation = computed(() => {
      return this.width() < this.height() ? "portrait" : "landscape";
    });
    this.isTouchDevice = computed(() => this._isTouchDevice());
    this.deviceInfo = computed(() => ({
      type: this.deviceType(),
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop(),
      width: this.width(),
      height: this.height(),
      orientation: this.orientation(),
      isTouchDevice: this.isTouchDevice()
    }));
    console.log("\u{1F3D7}\uFE0F DeviceDetectorService constructor", {
      isServer: this.isServer,
      isBrowser: this.isBrowser,
      hasRequest: !!this.request
    });
    if (this.isServer) {
      this.detectDeviceOnServer();
    } else if (this.isBrowser) {
      this.initializeOnClient();
    }
  }
  /**
   * DETECCIÓN EN EL SERVIDOR usando User-Agent
   */
  detectDeviceOnServer() {
    if (!this.request) {
      console.warn("\u26A0\uFE0F REQUEST no disponible en servidor");
      return;
    }
    const userAgent = this.request.headers["user-agent"] || "";
    console.log("\u{1F50D} SERVER - User-Agent:", userAgent);
    const deviceInfo = this.parseUserAgent(userAgent);
    console.log("\u{1F4F1} SERVER - Device detected:", deviceInfo);
    this.width.set(deviceInfo.width);
    this.height.set(deviceInfo.height);
    this._isTouchDevice.set(deviceInfo.isTouchDevice);
    this.transferState.set(DEVICE_INFO_KEY, deviceInfo);
    console.log("\u{1F4BE} SERVER - Device info guardado en TransferState");
    this.initialized.set(true);
  }
  /**
   * INICIALIZACIÓN EN EL CLIENTE
   * Lee desde TransferState o detecta manualmente
   */
  initializeOnClient() {
    console.log("\u{1F310} CLIENT - Inicializando detecci\xF3n...");
    const serverDeviceInfo = this.transferState.get(DEVICE_INFO_KEY, null);
    if (serverDeviceInfo) {
      console.log("\u2705 CLIENT - Usando device info del servidor:", serverDeviceInfo);
      this.applyDeviceInfo(serverDeviceInfo);
      this.transferState.remove(DEVICE_INFO_KEY);
    } else {
      console.log("\u26A0\uFE0F CLIENT - No hay info del servidor, detectando manualmente...");
      this.detectDeviceOnClient();
    }
    this.setupResizeListener();
    this.initialized.set(true);
  }
  /**
   * Detectar dispositivo en el cliente (fallback)
   */
  detectDeviceOnClient() {
    if (typeof window === "undefined")
      return;
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      this.width.set(width);
      this.height.set(height);
      this._isTouchDevice.set(isTouchDevice);
      console.log("\u{1F4F1} CLIENT - Device detected:", {
        width,
        height,
        type: this.deviceType(),
        isMobile: this.isMobile(),
        isTouch: isTouchDevice
      });
      this.initialized.set(true);
    } catch (error) {
      console.error("\u274C CLIENT - Error detecting device:", error);
    }
  }
  /**
   * Aplicar información de dispositivo
   */
  applyDeviceInfo(info) {
    this.width.set(info.width);
    this.height.set(info.height);
    this._isTouchDevice.set(info.isTouchDevice);
  }
  /**
   * Parser de User-Agent para detección de dispositivos
   */
  parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase();
    const mobileRegex = /mobile|android|iphone|ipod|phone|blackberry|opera mini|iemobile|windows phone/i;
    const isMobileUA = mobileRegex.test(ua);
    const tabletRegex = /tablet|ipad|playbook|silk|kindle/i;
    const isTabletUA = tabletRegex.test(ua) && !mobileRegex.test(ua);
    const isTouchDevice = isMobileUA || isTabletUA;
    let width = 1920;
    let height = 1080;
    if (isMobileUA) {
      width = 375;
      height = 667;
      if (ua.includes("iphone") && (ua.includes("pro max") || ua.includes("plus"))) {
        width = 428;
        height = 926;
      } else if (ua.includes("iphone")) {
        width = 390;
        height = 844;
      } else if (ua.includes("pixel")) {
        width = 412;
        height = 915;
      } else if (ua.includes("samsung") || ua.includes("galaxy")) {
        width = 360;
        height = 800;
      }
    } else if (isTabletUA) {
      width = 768;
      height = 1024;
      if (ua.includes("ipad pro")) {
        width = 1024;
        height = 1366;
      }
    }
    const type = isMobileUA ? "mobile" : isTabletUA ? "tablet" : "desktop";
    return {
      type,
      isMobile: type === "mobile",
      isTablet: type === "tablet",
      isDesktop: type === "desktop",
      width,
      height,
      orientation: width < height ? "portrait" : "landscape",
      isTouchDevice
    };
  }
  /**
   * Setup resize listener (solo cliente)
   */
  setupResizeListener() {
    if (!this.isBrowser || typeof window === "undefined")
      return;
    try {
      fromEvent(window, "resize").pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (typeof window !== "undefined") {
          this.width.set(window.innerWidth);
          this.height.set(window.innerHeight);
          console.log("\u{1F504} Window resized:", {
            width: this.width(),
            height: this.height(),
            type: this.deviceType()
          });
        }
      });
    } catch (error) {
      console.error("\u274C Error setting up resize listener:", error);
    }
  }
  // Métodos públicos
  getOptimalColumns() {
    const type = this.deviceType();
    switch (type) {
      case "mobile":
        return 2;
      case "tablet":
        return 3;
      case "desktop":
        return 7;
      default:
        return 7;
    }
  }
  getOptimalItemSize() {
    const type = this.deviceType();
    switch (type) {
      case "mobile":
        return 68;
      case "tablet":
        return 75;
      case "desktop":
        return 80;
      default:
        return 75;
    }
  }
  getOptimalPadding() {
    const type = this.deviceType();
    switch (type) {
      case "mobile":
        return "0.5rem";
      case "tablet":
        return "1rem";
      case "desktop":
        return "1.5rem";
      default:
        return "1rem";
    }
  }
  get isRunningInBrowser() {
    return this.isBrowser;
  }
  isInitialized() {
    return this.initialized();
  }
  forceDetection() {
    if (this.isBrowser) {
      this.detectDeviceOnClient();
      this.initialized.set(true);
    }
  }
};
_DeviceDetectorService.\u0275fac = function DeviceDetectorService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _DeviceDetectorService)();
};
_DeviceDetectorService.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DeviceDetectorService, factory: _DeviceDetectorService.\u0275fac, providedIn: "root" });
var DeviceDetectorService = _DeviceDetectorService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DeviceDetectorService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// src/app/components/program-detail-modal/program-detail-modal.component.ts
function ProgramDetailModalComponent_div_0_img_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 20);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("src", ctx_r1.channelLogo, \u0275\u0275sanitizeUrl)("alt", ctx_r1.channelName);
  }
}
function ProgramDetailModalComponent_div_0_app_banner_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-banner", 21);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("data", ctx_r1.bannerData());
  }
}
function ProgramDetailModalComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275listener("click", function ProgramDetailModalComponent_div_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    })("keydown", function ProgramDetailModalComponent_div_0_Template_div_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEscapeKey($event));
    });
    \u0275\u0275element(1, "div", 2);
    \u0275\u0275elementStart(2, "div", 3);
    \u0275\u0275listener("click", function ProgramDetailModalComponent_div_0_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onContentClick($event));
    });
    \u0275\u0275elementStart(3, "div", 4)(4, "div", 5)(5, "div", 6);
    \u0275\u0275template(6, ProgramDetailModalComponent_div_0_img_6_Template, 1, 2, "img", 7);
    \u0275\u0275elementStart(7, "div", 8)(8, "span", 9);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span", 10);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "button", 11);
    \u0275\u0275listener("click", function ProgramDetailModalComponent_div_0_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 12);
    \u0275\u0275element(14, "path", 13);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "div", 14);
    \u0275\u0275template(16, ProgramDetailModalComponent_div_0_app_banner_16_Template, 1, 1, "app-banner", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "div", 16)(18, "button", 17);
    \u0275\u0275listener("click", function ProgramDetailModalComponent_div_0_Template_button_click_18_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(19, "svg", 18);
    \u0275\u0275element(20, "path", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275text(21, " Entendido ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("@backdropAnimation", void 0);
    \u0275\u0275attribute("aria-label", "Detalles de " + (ctx_r1.program.title || "programa"));
    \u0275\u0275advance(2);
    \u0275\u0275property("@modalAnimation", void 0);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.channelLogo);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.channelName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r1.formatTime(ctx_r1.program.start), " - ", ctx_r1.formatTime(ctx_r1.program.stop), " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r1.bannerData());
  }
}
var _ProgramDetailModalComponent = class _ProgramDetailModalComponent {
  constructor() {
    this.program = null;
    this.channelName = "";
    this.channelLogo = "";
    this.close = new EventEmitter();
    this.isVisible = signal(false);
    this.bannerData = computed(() => {
      const prog = this.program;
      if (!prog)
        return null;
      const posterFromProg = prog.poster || prog.desc?.value || "";
      const descObj = prog.desc ? prog.desc : { details: "", value: "", lang: "" };
      return {
        title: prog.title,
        channel: this.channelName,
        channelName: this.channelName,
        icon: this.channelLogo,
        poster: posterFromProg || this.channelLogo || "",
        start: prog.start,
        stop: prog.stop,
        startTime: prog.start,
        endTime: prog.stop,
        desc: descObj,
        description: descObj.details || descObj.value || "",
        year: descObj.year || "",
        rating: prog.starRating !== void 0 && prog.starRating !== null ? String(prog.starRating) : "",
        starRating: prog.starRating !== void 0 && prog.starRating !== null ? prog.starRating : "",
        category: prog.category?.value || "",
        id: prog.id
      };
    });
  }
  // Helper para formatear tiempo desde la plantilla (usa en template)
  formatTime(timeString) {
    if (!timeString)
      return "";
    try {
      const d = new Date(timeString);
      if (isNaN(d.getTime()))
        return String(timeString);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch {
      return String(timeString);
    }
  }
  /**
   * Cierra el modal
   */
  onClose() {
    this.close.emit();
  }
  /**
   * Previene el cierre al hacer clic dentro del contenido
   */
  onContentClick(event) {
    event.stopPropagation();
  }
  /**
   * Maneja el escape key
   */
  onEscapeKey(event) {
    if (event.key === "Escape") {
      this.onClose();
    }
  }
};
_ProgramDetailModalComponent.\u0275fac = function ProgramDetailModalComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ProgramDetailModalComponent)();
};
_ProgramDetailModalComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProgramDetailModalComponent, selectors: [["app-program-detail-modal"]], inputs: { program: "program", channelName: "channelName", channelLogo: "channelLogo" }, outputs: { close: "close" }, decls: 1, vars: 1, consts: [["class", "program-detail-modal-container", "tabindex", "0", "role", "dialog", "aria-modal", "true", 3, "click", "keydown", 4, "ngIf"], ["tabindex", "0", "role", "dialog", "aria-modal", "true", 1, "program-detail-modal-container", 3, "click", "keydown"], [1, "modal-backdrop"], [1, "modal-content", 3, "click"], [1, "modal-header"], [1, "modal-header-content"], [1, "channel-info"], ["class", "channel-logo", "loading", "lazy", 3, "src", "alt", 4, "ngIf"], [1, "channel-text"], [1, "channel-name"], [1, "program-time"], ["aria-label", "Cerrar detalles", 1, "close-button", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "close-icon"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M6 18L18 6M6 6l12 12"], [1, "modal-body"], [3, "data", 4, "ngIf"], [1, "modal-footer"], [1, "action-button", "action-button-primary", 3, "click"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "button-icon"], ["fill-rule", "evenodd", "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", "clip-rule", "evenodd"], ["loading", "lazy", 1, "channel-logo", 3, "src", "alt"], [3, "data"]], template: function ProgramDetailModalComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ProgramDetailModalComponent_div_0_Template, 22, 8, "div", 0);
  }
  if (rf & 2) {
    \u0275\u0275property("ngIf", ctx.program);
  }
}, dependencies: [CommonModule, NgIf, BannerComponent], styles: ['\n\n.program-detail-modal-container[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 9999;\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  overflow: hidden;\n  outline: none;\n}\n.program-detail-modal-container[_ngcontent-%COMP%]::before {\n  content: "";\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n.modal-backdrop[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.85);\n  backdrop-filter: blur(8px);\n  -webkit-backdrop-filter: blur(8px);\n}\n.modal-content[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  max-width: 100vw;\n  max-height: 95vh;\n  background:\n    linear-gradient(\n      to bottom,\n      #0f172a,\n      #000);\n  border-radius: 24px 24px 0 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5), 0 -8px 16px rgba(0, 0, 0, 0.3);\n}\n.modal-content[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.1) 50%,\n      transparent);\n}\n.modal-header[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  background: rgba(15, 23, 42, 0.95);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(51, 65, 85, 0.3);\n  padding: env(safe-area-inset-top, 0) 1rem 1rem;\n}\n.modal-header-content[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n  padding-top: 0.5rem;\n}\n.channel-info[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex: 1;\n  min-width: 0;\n}\n.channel-logo[_ngcontent-%COMP%] {\n  width: 48px;\n  height: 32px;\n  object-fit: contain;\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 0.5rem;\n  padding: 0.25rem;\n  flex-shrink: 0;\n}\n.channel-text[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.125rem;\n  min-width: 0;\n}\n.channel-name[_ngcontent-%COMP%] {\n  font-weight: 600;\n  font-size: 0.9375rem;\n  color: white;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.program-time[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: rgba(255, 255, 255, 0.6);\n  font-weight: 500;\n}\n.close-button[_ngcontent-%COMP%] {\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background: rgba(30, 41, 59, 0.8);\n  border: 1px solid rgba(51, 65, 85, 0.3);\n  color: rgba(255, 255, 255, 0.9);\n  transition: all 0.2s ease;\n  flex-shrink: 0;\n  -webkit-tap-highlight-color: transparent;\n}\n.close-button[_ngcontent-%COMP%]:active {\n  transform: scale(0.95);\n  background: #1e293b;\n}\n.close-button[_ngcontent-%COMP%]:hover {\n  background: rgba(239, 68, 68, 0.2);\n  border-color: #ef4444;\n  color: #ef4444;\n}\n.close-icon[_ngcontent-%COMP%] {\n  width: 24px;\n  height: 24px;\n}\n.modal-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  overflow-x: hidden;\n  -webkit-overflow-scrolling: touch;\n  padding: 1.5rem 1rem;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.5) transparent;\n}\n.modal-body[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 4px;\n}\n.modal-body[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.modal-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 2px;\n}\n.modal-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.7);\n}\n.modal-footer[_ngcontent-%COMP%] {\n  position: sticky;\n  bottom: 0;\n  z-index: 10;\n  background: rgba(15, 23, 42, 0.98);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(51, 65, 85, 0.3);\n  padding: 1rem;\n  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));\n  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);\n}\n.action-button[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 1rem;\n  border-radius: 1rem;\n  font-weight: 600;\n  font-size: 1rem;\n  transition: all 0.2s ease;\n  border: none;\n  -webkit-tap-highlight-color: transparent;\n  min-height: 52px;\n}\n.action-button-primary[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      rgb(234.9802955665, 21.0197044335, 21.0197044335));\n  color: white;\n  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);\n}\n.action-button-primary[_ngcontent-%COMP%]:active {\n  transform: scale(0.98);\n  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);\n}\n.button-icon[_ngcontent-%COMP%] {\n  width: 20px;\n  height: 20px;\n  flex-shrink: 0;\n}\n@media (min-width: 640px) {\n  .modal-content[_ngcontent-%COMP%] {\n    max-width: 600px;\n    border-radius: 24px;\n    max-height: 90vh;\n    margin: auto;\n  }\n  .program-detail-modal-container[_ngcontent-%COMP%] {\n    align-items: center;\n  }\n  .modal-body[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n@media (orientation: landscape) and (max-height: 500px) {\n  .modal-content[_ngcontent-%COMP%] {\n    max-height: 100vh;\n    border-radius: 0;\n  }\n  .modal-header[_ngcontent-%COMP%] {\n    padding: 0.75rem 1rem;\n  }\n  .modal-body[_ngcontent-%COMP%] {\n    padding: 1rem;\n  }\n  .modal-footer[_ngcontent-%COMP%] {\n    padding: 0.75rem 1rem;\n  }\n  .action-button[_ngcontent-%COMP%] {\n    padding: 0.75rem;\n    min-height: 44px;\n  }\n}\n.program-detail-modal-container[_ngcontent-%COMP%]:focus {\n  outline: none;\n}\n.close-button[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n}\n.action-button[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid white;\n  outline-offset: 2px;\n}\n@keyframes _ngcontent-%COMP%_slideUp {\n  from {\n    transform: translateY(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n[_nghost-%COMP%]  body {\n  overflow: hidden;\n}\n/*# sourceMappingURL=program-detail-modal.component.css.map */'], data: { animation: [
  trigger("modalAnimation", [
    transition(":enter", [
      style({ opacity: 0, transform: "translateY(100%)" }),
      animate("300ms cubic-bezier(0.4, 0, 0.2, 1)", style({ opacity: 1, transform: "translateY(0)" }))
    ]),
    transition(":leave", [
      animate("200ms cubic-bezier(0.4, 0, 1, 1)", style({ opacity: 0, transform: "translateY(100%)" }))
    ])
  ]),
  trigger("backdropAnimation", [
    transition(":enter", [
      style({ opacity: 0 }),
      animate("200ms ease-out", style({ opacity: 1 }))
    ]),
    transition(":leave", [animate("150ms ease-in", style({ opacity: 0 }))])
  ])
] }, changeDetection: 0 });
var ProgramDetailModalComponent = _ProgramDetailModalComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgramDetailModalComponent, [{
    type: Component,
    args: [{ selector: "app-program-detail-modal", standalone: true, imports: [CommonModule, BannerComponent], changeDetection: ChangeDetectionStrategy.OnPush, animations: [
      trigger("modalAnimation", [
        transition(":enter", [
          style({ opacity: 0, transform: "translateY(100%)" }),
          animate("300ms cubic-bezier(0.4, 0, 0.2, 1)", style({ opacity: 1, transform: "translateY(0)" }))
        ]),
        transition(":leave", [
          animate("200ms cubic-bezier(0.4, 0, 1, 1)", style({ opacity: 0, transform: "translateY(100%)" }))
        ])
      ]),
      trigger("backdropAnimation", [
        transition(":enter", [
          style({ opacity: 0 }),
          animate("200ms ease-out", style({ opacity: 1 }))
        ]),
        transition(":leave", [animate("150ms ease-in", style({ opacity: 0 }))])
      ])
    ], template: `<!-- program-detail-modal.component.html -->\r
<div\r
  *ngIf="program"\r
  class="program-detail-modal-container"\r
  @backdropAnimation\r
  (click)="onClose()"\r
  (keydown)="onEscapeKey($event)"\r
  tabindex="0"\r
  role="dialog"\r
  aria-modal="true"\r
  [attr.aria-label]="'Detalles de ' + (program.title || 'programa')"\r
>\r
  <!-- Backdrop -->\r
  <div class="modal-backdrop"></div>\r
\r
  <!-- Modal Content -->\r
  <div class="modal-content" @modalAnimation (click)="onContentClick($event)">\r
    <!-- Header con bot\xF3n de cierre -->\r
    <div class="modal-header">\r
      <div class="modal-header-content">\r
        <!-- Channel Info -->\r
        <div class="channel-info">\r
          <img\r
            *ngIf="channelLogo"\r
            [src]="channelLogo"\r
            [alt]="channelName"\r
            class="channel-logo"\r
            loading="lazy"\r
          />\r
          <div class="channel-text">\r
            <span class="channel-name">{{ channelName }}</span>\r
            <span class="program-time">\r
              {{ formatTime(program.start) }} - {{ formatTime(program.stop) }}\r
            </span>\r
          </div>\r
        </div>\r
\r
        <!-- Close Button -->\r
        <button\r
          (click)="onClose()"\r
          class="close-button"\r
          aria-label="Cerrar detalles"\r
        >\r
          <svg\r
            class="close-icon"\r
            fill="none"\r
            stroke="currentColor"\r
            viewBox="0 0 24 24"\r
          >\r
            <path\r
              stroke-linecap="round"\r
              stroke-linejoin="round"\r
              stroke-width="2"\r
              d="M6 18L18 6M6 6l12 12"\r
            ></path>\r
          </svg>\r
        </button>\r
      </div>\r
    </div>\r
\r
    <!-- Body con Banner -->\r
    <div class="modal-body">\r
      <app-banner *ngIf="bannerData()" [data]="bannerData()"></app-banner>\r
    </div>\r
\r
    <!-- Footer con acciones (opcional) -->\r
    <div class="modal-footer">\r
      <button (click)="onClose()" class="action-button action-button-primary">\r
        <svg class="button-icon" fill="currentColor" viewBox="0 0 20 20">\r
          <path\r
            fill-rule="evenodd"\r
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
            clip-rule="evenodd"\r
          ></path>\r
        </svg>\r
        Entendido\r
      </button>\r
    </div>\r
  </div>\r
</div>\r
`, styles: ['/* src/app/components/program-detail-modal/program-detail-modal.component.scss */\n.program-detail-modal-container {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 9999;\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  overflow: hidden;\n  outline: none;\n}\n.program-detail-modal-container::before {\n  content: "";\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n.modal-backdrop {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.85);\n  backdrop-filter: blur(8px);\n  -webkit-backdrop-filter: blur(8px);\n}\n.modal-content {\n  position: relative;\n  width: 100%;\n  max-width: 100vw;\n  max-height: 95vh;\n  background:\n    linear-gradient(\n      to bottom,\n      #0f172a,\n      #000);\n  border-radius: 24px 24px 0 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5), 0 -8px 16px rgba(0, 0, 0, 0.3);\n}\n.modal-content::before {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.1) 50%,\n      transparent);\n}\n.modal-header {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  background: rgba(15, 23, 42, 0.95);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(51, 65, 85, 0.3);\n  padding: env(safe-area-inset-top, 0) 1rem 1rem;\n}\n.modal-header-content {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n  padding-top: 0.5rem;\n}\n.channel-info {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex: 1;\n  min-width: 0;\n}\n.channel-logo {\n  width: 48px;\n  height: 32px;\n  object-fit: contain;\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 0.5rem;\n  padding: 0.25rem;\n  flex-shrink: 0;\n}\n.channel-text {\n  display: flex;\n  flex-direction: column;\n  gap: 0.125rem;\n  min-width: 0;\n}\n.channel-name {\n  font-weight: 600;\n  font-size: 0.9375rem;\n  color: white;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.program-time {\n  font-size: 0.8125rem;\n  color: rgba(255, 255, 255, 0.6);\n  font-weight: 500;\n}\n.close-button {\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background: rgba(30, 41, 59, 0.8);\n  border: 1px solid rgba(51, 65, 85, 0.3);\n  color: rgba(255, 255, 255, 0.9);\n  transition: all 0.2s ease;\n  flex-shrink: 0;\n  -webkit-tap-highlight-color: transparent;\n}\n.close-button:active {\n  transform: scale(0.95);\n  background: #1e293b;\n}\n.close-button:hover {\n  background: rgba(239, 68, 68, 0.2);\n  border-color: #ef4444;\n  color: #ef4444;\n}\n.close-icon {\n  width: 24px;\n  height: 24px;\n}\n.modal-body {\n  flex: 1;\n  overflow-y: auto;\n  overflow-x: hidden;\n  -webkit-overflow-scrolling: touch;\n  padding: 1.5rem 1rem;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.5) transparent;\n}\n.modal-body::-webkit-scrollbar {\n  width: 4px;\n}\n.modal-body::-webkit-scrollbar-track {\n  background: transparent;\n}\n.modal-body::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 2px;\n}\n.modal-body::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.7);\n}\n.modal-footer {\n  position: sticky;\n  bottom: 0;\n  z-index: 10;\n  background: rgba(15, 23, 42, 0.98);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(51, 65, 85, 0.3);\n  padding: 1rem;\n  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));\n  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);\n}\n.action-button {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 1rem;\n  border-radius: 1rem;\n  font-weight: 600;\n  font-size: 1rem;\n  transition: all 0.2s ease;\n  border: none;\n  -webkit-tap-highlight-color: transparent;\n  min-height: 52px;\n}\n.action-button-primary {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      rgb(234.9802955665, 21.0197044335, 21.0197044335));\n  color: white;\n  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);\n}\n.action-button-primary:active {\n  transform: scale(0.98);\n  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);\n}\n.button-icon {\n  width: 20px;\n  height: 20px;\n  flex-shrink: 0;\n}\n@media (min-width: 640px) {\n  .modal-content {\n    max-width: 600px;\n    border-radius: 24px;\n    max-height: 90vh;\n    margin: auto;\n  }\n  .program-detail-modal-container {\n    align-items: center;\n  }\n  .modal-body {\n    padding: 2rem 1.5rem;\n  }\n}\n@media (orientation: landscape) and (max-height: 500px) {\n  .modal-content {\n    max-height: 100vh;\n    border-radius: 0;\n  }\n  .modal-header {\n    padding: 0.75rem 1rem;\n  }\n  .modal-body {\n    padding: 1rem;\n  }\n  .modal-footer {\n    padding: 0.75rem 1rem;\n  }\n  .action-button {\n    padding: 0.75rem;\n    min-height: 44px;\n  }\n}\n.program-detail-modal-container:focus {\n  outline: none;\n}\n.close-button:focus-visible {\n  outline: 2px solid #ef4444;\n  outline-offset: 2px;\n}\n.action-button:focus-visible {\n  outline: 2px solid white;\n  outline-offset: 2px;\n}\n@keyframes slideUp {\n  from {\n    transform: translateY(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n:host::ng-deep body {\n  overflow: hidden;\n}\n/*# sourceMappingURL=program-detail-modal.component.css.map */\n'] }]
  }], null, { program: [{
    type: Input
  }], channelName: [{
    type: Input
  }], channelLogo: [{
    type: Input
  }], close: [{
    type: Output
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProgramDetailModalComponent, { className: "ProgramDetailModalComponent", filePath: "src/app/components/program-detail-modal/program-detail-modal.component.ts", lineNumber: 53 });
})();

// src/app/components/program-list/program-list.component.ts
var _c0 = ["virtualScrollViewport"];
var _c1 = (a0, a1) => ({ "program-cut-start": a0, "program-cut-end": a1 });
function ProgramListComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 2)(2, "div", 3)(3, "div", 4)(4, "div", 5);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 6);
    \u0275\u0275element(6, "path", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "h2", 8);
    \u0275\u0275text(8, "Gu\xEDa TV");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 9);
    \u0275\u0275text(10, " Cargando programaci\xF3n de televisi\xF3n... ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 10);
    \u0275\u0275element(12, "div", 11)(13, "div", 12)(14, "div", 13);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 31)(1, "h3", 32);
    \u0275\u0275text(2, "Error al cargar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 33);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 19);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_2_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.facade.refreshData());
    });
    \u0275\u0275text(6, " Reintentar ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.error());
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_img_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "img", 44);
    \u0275\u0275listener("error", function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_img_3_Template_img_error_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.onChannelLogoError($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const canal_r7 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275property("src", ctx_r2.getChannelLogoUrl(canal_r7), \u0275\u0275sanitizeUrl)("alt", canal_r7.channel.name);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_div_9_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 50);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const programa_r9 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275classMap(ctx_r2.getCategoryBadgeClasses(programa_r9.category.value));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getCategoryDisplayName(programa_r9.category.value), " ");
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 45);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_div_9_Template_div_click_0_listener($event) {
      const programa_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const canalIndex_r5 = \u0275\u0275nextContext().index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      ctx_r2.onProgramSelected(canalIndex_r5, programa_r9);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "div", 46)(2, "h4", 47);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 48);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_div_9_span_6_Template, 2, 3, "span", 49);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_9_0;
    const programa_r9 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275classProp("mobile-program-active", ((tmp_9_0 = ctx_r2.selectedProgram()) == null ? null : tmp_9_0.id) === programa_r9.id);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.getProgramTitle(programa_r9), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r2.getProgramLayout(programa_r9).visibleStartTime, " - ", ctx_r2.getProgramLayout(programa_r9).visibleEndTime, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", programa_r9 == null ? null : programa_r9.category == null ? null : programa_r9.category.value);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 37)(1, "div", 38);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_Template_div_click_1_listener($event) {
      const canalIndex_r5 = \u0275\u0275restoreView(_r4).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      ctx_r2.onChannelToggle(canalIndex_r5);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementContainerStart(2);
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_img_3_Template, 1, 2, "img", 39);
    \u0275\u0275elementStart(4, "span", 40);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 41);
    \u0275\u0275element(7, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(8, "div", 42);
    \u0275\u0275template(9, ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_div_9_Template, 7, 6, "div", 43);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const canal_r7 = ctx.$implicit;
    const canalIndex_r5 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.getChannelLogoUrl(canal_r7));
    \u0275\u0275advance();
    \u0275\u0275classProp("hidden", ctx_r2.getChannelLogoUrl(canal_r7));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", canal_r7.channel.name, " ");
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isChannelExpanded(canalIndex_r5));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("expanded", ctx_r2.isChannelExpanded(canalIndex_r5));
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.getMobileVisiblePrograms(canal_r7))("ngForTrackBy", ctx_r2.trackByProgramId);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34)(1, "cdk-virtual-scroll-viewport", 35, 0);
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_1_div_3_div_3_Template, 10, 10, "div", 36);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("itemSize", ctx_r2.getMobileItemSize());
    \u0275\u0275advance(2);
    \u0275\u0275property("cdkVirtualForOf", ctx_r2.filteredChannels())("cdkVirtualForTrackBy", ctx_r2.trackByChannelId);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_13_button_1__svg_svg_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 58);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_13_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_13_button_1_Template_button_click_0_listener($event) {
      const i_r12 = \u0275\u0275restoreView(_r11).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.selectDay(i_r12, $event));
    });
    \u0275\u0275elementStart(1, "div", 54)(2, "span", 55);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 56);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, ProgramListComponent_ng_container_1_ng_container_1_div_13_button_1__svg_svg_6_Template, 2, 0, "svg", 57);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const dia_r13 = ctx.$implicit;
    const i_r12 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("mobile-dropdown-active", i_r12 === ctx_r2.activeDay());
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(dia_r13.diaSemana);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(dia_r13.diaNumero);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r12 === ctx_r2.activeDay());
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 51);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_13_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r10);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(1, ProgramListComponent_ng_container_1_ng_container_1_div_13_button_1_Template, 7, 5, "button", 52);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.daysInfo());
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_22_button_1__svg_svg_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 58);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_22_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_22_button_1_Template_button_click_0_listener($event) {
      const i_r16 = \u0275\u0275restoreView(_r15).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      ctx_r2.selectTimeSlot(i_r16);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_1_div_22_button_1__svg_svg_3_Template, 2, 0, "svg", 57);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const franja_r17 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("mobile-dropdown-active", franja_r17[0] === ctx_r2.currentTimeSlot());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", franja_r17[0], " - ", franja_r17[franja_r17.length - 1]);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", franja_r17[0] === ctx_r2.currentTimeSlot());
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 51);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_22_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(1, ProgramListComponent_ng_container_1_ng_container_1_div_22_button_1_Template, 4, 5, "button", 52);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.currentTimeSlots());
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_button_23_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 63);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.selectedCategories().size);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_button_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 60);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_button_23_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r2 = \u0275\u0275nextContext(3);
      ctx_r2.toggleCategoryDropdown();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 20);
    \u0275\u0275element(2, "path", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_1_button_23_span_3_Template, 2, 1, "span", 62);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.selectedCategories().size > 0);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_24__svg_svg_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 58);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_24_button_5__svg_svg_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 58);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_24_button_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_24_button_5_Template_button_click_0_listener($event) {
      const category_r21 = \u0275\u0275restoreView(_r20).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      ctx_r2.selectCategory(category_r21);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_1_div_24_button_5__svg_svg_3_Template, 2, 0, "svg", 57);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const category_r21 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("mobile-dropdown-active", ctx_r2.isCategorySelected(category_r21));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.getCategoryDisplayName(category_r21));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isCategorySelected(category_r21));
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_div_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 64);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_24_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r19);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "button", 53);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_div_24_Template_button_click_1_listener($event) {
      \u0275\u0275restoreView(_r19);
      const ctx_r2 = \u0275\u0275nextContext(3);
      ctx_r2.selectCategory(null);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3, "Todas las categor\xEDas");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ProgramListComponent_ng_container_1_ng_container_1_div_24__svg_svg_4_Template, 2, 0, "svg", 57);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, ProgramListComponent_ng_container_1_ng_container_1_div_24_button_5_Template, 4, 4, "button", 65);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275classProp("mobile-dropdown-active", ctx_r2.isAllCategoriesSelected());
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.isAllCategoriesSelected());
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.availableCategories())("ngForTrackBy", ctx_r2.trackByCategory);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_app_program_detail_modal_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-program-detail-modal", 66);
    \u0275\u0275listener("close", function ProgramListComponent_ng_container_1_ng_container_1_app_program_detail_modal_25_Template_app_program_detail_modal_close_0_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.closeMobileProgram());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("program", ctx_r2.selectedProgram())("channelName", ctx_r2.modalChannelInfo().channelName)("channelLogo", ctx_r2.modalChannelInfo().channelLogo);
  }
}
function ProgramListComponent_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "section", 14);
    \u0275\u0275template(2, ProgramListComponent_ng_container_1_ng_container_1_div_2_Template, 7, 1, "div", 15)(3, ProgramListComponent_ng_container_1_ng_container_1_div_3_Template, 4, 3, "div", 16);
    \u0275\u0275elementStart(4, "div", 17)(5, "div", 18)(6, "button", 19);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_Template_button_click_6_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.toggleDayDropdown();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 20);
    \u0275\u0275element(8, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span", 22);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 23);
    \u0275\u0275element(12, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(13, ProgramListComponent_ng_container_1_ng_container_1_div_13_Template, 2, 1, "div", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "div", 18)(15, "button", 26);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_1_Template_button_click_15_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.toggleTimeSlotDropdown();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(16, "svg", 20);
    \u0275\u0275element(17, "path", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(18, "span", 22);
    \u0275\u0275text(19);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(20, "svg", 23);
    \u0275\u0275element(21, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(22, ProgramListComponent_ng_container_1_ng_container_1_div_22_Template, 2, 1, "div", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275template(23, ProgramListComponent_ng_container_1_ng_container_1_button_23_Template, 4, 1, "button", 28)(24, ProgramListComponent_ng_container_1_ng_container_1_div_24_Template, 6, 5, "div", 29);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(25, ProgramListComponent_ng_container_1_ng_container_1_app_program_detail_modal_25_Template, 1, 3, "app-program-detail-modal", 30);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.uiState().hasError);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.uiState().showContent);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(ctx_r2.getCurrentSelectedDay());
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isDayDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isDayDropdownOpen());
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r2.getCurrentSelectedTimeSlot());
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isTimeSlotDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isTimeSlotDropdownOpen());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.showCategoryFilter());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isCategoryDropdownOpen());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.selectedProgram() && ctx_r2.modalChannelInfo());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_13_button_2__svg_svg_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 101);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_13_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 96);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_13_button_2_Template_button_click_0_listener($event) {
      const i_r25 = \u0275\u0275restoreView(_r24).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.selectDay(i_r25, $event));
    });
    \u0275\u0275elementStart(1, "div", 97)(2, "div", 98);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 99);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, ProgramListComponent_ng_container_1_ng_container_2_div_13_button_2__svg_svg_6_Template, 2, 0, "svg", 100);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const dia_r26 = ctx.$implicit;
    const i_r25 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classMap(ctx_r2.getDayDropdownItemClasses(i_r25));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", dia_r26.diaSemana, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", dia_r26.diaNumero, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r25 === ctx_r2.activeDay());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 93)(1, "div", 94);
    \u0275\u0275template(2, ProgramListComponent_ng_container_1_ng_container_2_div_13_button_2_Template, 7, 5, "button", 95);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r2.daysInfo())("ngForTrackBy", ctx_r2.trackByDayIndex);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 103);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.selectedCategories().size, " ");
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10__svg_svg_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 73);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_button_6__svg_svg_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 73);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_button_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r29 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 104);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_button_6_Template_button_click_0_listener() {
      const category_r30 = \u0275\u0275restoreView(_r29).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.selectCategory(category_r30));
    });
    \u0275\u0275elementStart(1, "span", 105);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_button_6__svg_svg_3_Template, 2, 0, "svg", 106);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const category_r30 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275classMap(ctx_r2.getCategoryDropdownItemClasses(category_r30));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.getCategoryDisplayName(category_r30));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isCategorySelected(category_r30));
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 93)(1, "div", 94)(2, "button", 104);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.selectCategory(null));
    });
    \u0275\u0275elementStart(3, "span", 105);
    \u0275\u0275text(4, "Todas las categor\xEDas");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10__svg_svg_5_Template, 2, 0, "svg", 106);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_button_6_Template, 4, 4, "button", 107);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r2.getCategoryDropdownItemClasses(null));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.isAllCategoriesSelected());
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.availableCategories())("ngForTrackBy", ctx_r2.trackByCategory);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 70)(1, "button", 77);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_14_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.toggleCategoryDropdown());
    });
    \u0275\u0275elementStart(2, "div", 72);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 73);
    \u0275\u0275element(4, "path", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, ProgramListComponent_ng_container_1_ng_container_2_div_14_span_7_Template, 2, 1, "span", 102);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 74);
    \u0275\u0275element(9, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, ProgramListComponent_ng_container_1_ng_container_2_div_14_div_10_Template, 7, 5, "div", 75);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r2.getCategoryButtonText());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.selectedCategories().size > 0);
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isCategoryDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isCategoryDropdownOpen());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_24_button_2__svg_svg_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 73);
    \u0275\u0275element(1, "path", 59);
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_24_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r31 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 104);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_24_button_2_Template_button_click_0_listener() {
      const i_r32 = \u0275\u0275restoreView(_r31).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.selectTimeSlot(i_r32));
    });
    \u0275\u0275elementStart(1, "span", 105);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_2_div_24_button_2__svg_svg_3_Template, 2, 0, "svg", 106);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const franja_r33 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classMap(ctx_r2.getTimeSlotDropdownItemClasses(franja_r33[0]));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", franja_r33[0], " - ", franja_r33[franja_r33.length - 1]);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", franja_r33[0] === ctx_r2.currentTimeSlot());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 93)(1, "div", 94);
    \u0275\u0275template(2, ProgramListComponent_ng_container_1_ng_container_2_div_24_button_2_Template, 4, 5, "button", 107);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r2.currentTimeSlots())("ngForTrackBy", ctx_r2.trackByTimeSlot);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 108)(1, "div", 109);
    \u0275\u0275element(2, "div", 110);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 111);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275styleProp("left", ctx_r2.timeIndicatorPositionPx(), "px")("height", "calc(100% - 60px)")("top", 60, "px")("z-index", ctx_r2.getTimeIndicatorZIndex());
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r2.getCurrentTime(), " ");
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 112)(1, "span", 113);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const hora_r34 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(hora_r34);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r35 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 114)(1, "h3", 115);
    \u0275\u0275text(2, " Error al cargar la programaci\xF3n ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 116);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 117);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_36_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.facade.refreshData());
    });
    \u0275\u0275text(6, " Reintentar ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.error());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 118)(1, "h3", 115);
    \u0275\u0275text(2, " No hay programaci\xF3n disponible ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 119);
    \u0275\u0275text(4, " No se encontraron programas para mostrar. ");
    \u0275\u0275elementEnd()();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_img_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r38 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "img", 133);
    \u0275\u0275listener("error", function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_img_4_Template_img_error_0_listener($event) {
      \u0275\u0275restoreView(_r38);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.onChannelLogoError($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r38 = \u0275\u0275nextContext();
    const canal_r40 = ctx_r38.$implicit;
    const canalIndex_r37 = ctx_r38.index;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("scale-105", ctx_r2.isChannelExpanded(canalIndex_r37));
    \u0275\u0275property("src", ctx_r2.getChannelLogoUrl(canal_r40), \u0275\u0275sanitizeUrl)("alt", canal_r40.channel.name + " logo");
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 145);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 146);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 147);
    \u0275\u0275text(1, "\u21BB");
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 148);
    \u0275\u0275text(1, "\u21BB");
    \u0275\u0275elementEnd();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 149)(1, "span", 150);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const programa_r42 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.getCategoryBadgeClasses(programa_r42.category.value));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getCategoryDisplayName(programa_r42.category.value), " ");
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r41 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 135);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_Template_div_click_0_listener($event) {
      const programa_r42 = \u0275\u0275restoreView(_r41).$implicit;
      const canalIndex_r37 = \u0275\u0275nextContext(2).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      ctx_r2.onProgramSelected(canalIndex_r37, programa_r42);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "div", 136);
    \u0275\u0275template(2, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_2_Template, 1, 0, "div", 137)(3, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_3_Template, 1, 0, "div", 138);
    \u0275\u0275elementStart(4, "div", 139)(5, "h3", 140);
    \u0275\u0275template(6, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_span_6_Template, 2, 0, "span", 141);
    \u0275\u0275text(7);
    \u0275\u0275template(8, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_span_8_Template, 2, 0, "span", 142);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 143)(10, "span");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275text(12, " - ");
    \u0275\u0275elementStart(13, "span");
    \u0275\u0275text(14);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(15, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_div_15_Template, 3, 3, "div", 144);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const programa_r42 = ctx.$implicit;
    const layerIndex_r43 = \u0275\u0275nextContext().index;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275styleProp("grid-column-start", ctx_r2.getProgramLayout(programa_r42).gridColumnStart)("grid-column-end", ctx_r2.getProgramLayout(programa_r42).gridColumnEnd)("grid-row", layerIndex_r43 + 1)("z-index", 15 + layerIndex_r43);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(22, _c1, ctx_r2.getProgramLayout(programa_r42).isCutAtStart, ctx_r2.getProgramLayout(programa_r42).isCutAtEnd));
    \u0275\u0275attribute("title", ctx_r2.getProgramTitle(programa_r42));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.getProgramLayout(programa_r42).isCutAtStart);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.getProgramLayout(programa_r42).isCutAtEnd);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.getProgramLayout(programa_r42).isCutAtStart);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getProgramTitle(programa_r42), " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.getProgramLayout(programa_r42).isCutAtEnd);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("text-yellow-300", ctx_r2.getProgramLayout(programa_r42).isCutAtStart);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.getProgramLayout(programa_r42).visibleStartTime);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("text-yellow-300", ctx_r2.getProgramLayout(programa_r42).isCutAtEnd);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.getProgramLayout(programa_r42).visibleEndTime);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", programa_r42 == null ? null : programa_r42.category == null ? null : programa_r42.category.value);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_div_1_Template, 16, 25, "div", 134);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const layer_r44 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", layer_r44)("ngForTrackBy", ctx_r2.trackByProgramId);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 151)(1, "div", 152);
    \u0275\u0275element(2, "app-banner", 153);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275property("@expandCollapse", "expanded");
    \u0275\u0275advance(2);
    \u0275\u0275property("data", ctx_r2.getSelectedProgramBannerData());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r36 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 123)(1, "div", 124)(2, "div", 125);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_Template_div_click_2_listener() {
      const canalIndex_r37 = \u0275\u0275restoreView(_r36).index;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.onChannelToggle(canalIndex_r37));
    });
    \u0275\u0275elementStart(3, "div", 126);
    \u0275\u0275template(4, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_img_4_Template, 1, 4, "img", 127);
    \u0275\u0275elementStart(5, "div", 128);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(7, "div", 129)(8, "div", 130);
    \u0275\u0275template(9, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_ng_container_9_Template, 2, 2, "ng-container", 131);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(10, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_div_10_Template, 3, 2, "div", 132);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const canal_r40 = ctx.$implicit;
    const canalIndex_r37 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275styleProp("height", ctx_r2.getChannelHeight(canal_r40, canalIndex_r37), "px");
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r2.getChannelLogoUrl(canal_r40));
    \u0275\u0275advance();
    \u0275\u0275classProp("hidden", ctx_r2.getChannelLogoUrl(canal_r40));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", canal_r40.channel.name, " ");
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("display", "grid")("grid-template-columns", ctx_r2.gridTemplateColumns)("grid-template-rows", "repeat(" + ctx_r2.getLayerCount(canal_r40) + ", 75px)");
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.getProgramLayers(canal_r40));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isChannelExpanded(canalIndex_r37) && ctx_r2.selectedProgram());
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "cdk-virtual-scroll-viewport", 120, 0)(2, "div", 121);
    \u0275\u0275template(3, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_div_3_Template, 11, 14, "div", 122);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("itemSize", ctx_r2.getItemSize());
    \u0275\u0275advance(3);
    \u0275\u0275property("cdkVirtualForOf", ctx_r2.filteredChannels())("cdkVirtualForTrackBy", ctx_r2.trackByChannelId);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_39_button_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r46 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 164);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_39_button_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r46);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.scrollToNow());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 157);
    \u0275\u0275element(2, "path", 165);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "span", 159);
    \u0275\u0275text(4, "Ahora");
    \u0275\u0275elementEnd()();
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_div_39_Template(rf, ctx) {
  if (rf & 1) {
    const _r45 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 154)(1, "div", 155)(2, "button", 156);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 157);
    \u0275\u0275element(4, "path", 158);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "span", 159);
    \u0275\u0275text(6, "Filtrar");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(7, ProgramListComponent_ng_container_1_ng_container_2_div_39_button_7_Template, 5, 0, "button", 160);
    \u0275\u0275elementStart(8, "button", 161);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_39_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r45);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.previousTimeSlot());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 157);
    \u0275\u0275element(10, "path", 162);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "span", 159);
    \u0275\u0275text(12, "Anterior");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "button", 161);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_div_39_Template_button_click_13_listener() {
      \u0275\u0275restoreView(_r45);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.nextTimeSlot());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(14, "svg", 157);
    \u0275\u0275element(15, "path", 163);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(16, "span", 159);
    \u0275\u0275text(17, "Siguiente");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(7);
    \u0275\u0275property("ngIf", ctx_r2.activeDay() === 0);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r2.activeTimeSlot() === 0);
    \u0275\u0275advance(5);
    \u0275\u0275property("disabled", ctx_r2.activeTimeSlot() === 7);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_app_program_detail_modal_40_Template(rf, ctx) {
  if (rf & 1) {
    const _r47 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-program-detail-modal", 166);
    \u0275\u0275listener("close", function ProgramListComponent_ng_container_1_ng_container_2_app_program_detail_modal_40_Template_app_program_detail_modal_close_0_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.closeMobileProgram());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("program", ctx_r2.selectedProgram())("channelName", ctx_r2.modalChannelInfo().channelName)("channelLogo", ctx_r2.modalChannelInfo().channelLogo);
  }
}
function ProgramListComponent_ng_container_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "section", 67)(2, "div", 68)(3, "div", 69)(4, "div", 70)(5, "button", 71);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_Template_button_click_5_listener($event) {
      \u0275\u0275restoreView(_r23);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.toggleDayDropdown();
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(6, "div", 72);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 73);
    \u0275\u0275element(8, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 74);
    \u0275\u0275element(12, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(13, ProgramListComponent_ng_container_1_ng_container_2_div_13_Template, 3, 2, "div", 75);
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, ProgramListComponent_ng_container_1_ng_container_2_div_14_Template, 11, 5, "div", 76);
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "div", 70)(16, "button", 77);
    \u0275\u0275listener("click", function ProgramListComponent_ng_container_1_ng_container_2_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r23);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleTimeSlotDropdown());
    });
    \u0275\u0275elementStart(17, "div", 72);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(18, "svg", 73);
    \u0275\u0275element(19, "path", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(20, "span");
    \u0275\u0275text(21);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(22, "svg", 74);
    \u0275\u0275element(23, "path", 24);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(24, ProgramListComponent_ng_container_1_ng_container_2_div_24_Template, 3, 2, "div", 75);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(25, "div", 78);
    \u0275\u0275template(26, ProgramListComponent_ng_container_1_ng_container_2_div_26_Template, 5, 9, "div", 79);
    \u0275\u0275elementStart(27, "div", 80)(28, "div", 81)(29, "div", 82)(30, "span", 83);
    \u0275\u0275text(31, "Canales");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(32, "div", 84)(33, "div", 85);
    \u0275\u0275template(34, ProgramListComponent_ng_container_1_ng_container_2_div_34_Template, 3, 1, "div", 86);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(35, "div", 87);
    \u0275\u0275template(36, ProgramListComponent_ng_container_1_ng_container_2_div_36_Template, 7, 1, "div", 88)(37, ProgramListComponent_ng_container_1_ng_container_2_div_37_Template, 5, 0, "div", 89)(38, ProgramListComponent_ng_container_1_ng_container_2_cdk_virtual_scroll_viewport_38_Template, 4, 3, "cdk-virtual-scroll-viewport", 90);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(39, ProgramListComponent_ng_container_1_ng_container_2_div_39_Template, 18, 3, "div", 91);
    \u0275\u0275elementEnd();
    \u0275\u0275template(40, ProgramListComponent_ng_container_1_ng_container_2_app_program_detail_modal_40_Template, 1, 3, "app-program-detail-modal", 92);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate(ctx_r2.getCurrentSelectedDay());
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isDayDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isDayDropdownOpen());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.showCategoryFilter());
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(ctx_r2.getCurrentSelectedTimeSlot());
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", ctx_r2.isTimeSlotDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isTimeSlotDropdownOpen());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.showTimeIndicator());
    \u0275\u0275advance(8);
    \u0275\u0275property("ngForOf", ctx_r2.currentHours())("ngForTrackBy", ctx_r2.trackByHour);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.uiState().hasError);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.uiState().showEmpty);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.uiState().showContent);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.uiState().showContent);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.selectedProgram() && ctx_r2.modalChannelInfo());
  }
}
function ProgramListComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ProgramListComponent_ng_container_1_ng_container_1_Template, 26, 13, "ng-container", 1)(2, ProgramListComponent_ng_container_1_ng_container_2_Template, 41, 17, "ng-container", 1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isMobile());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r2.isMobile());
  }
}
var UI_CONFIG2 = {
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  BASE_CHANNEL_HEIGHT: 75,
  LAYER_HEIGHT: 75,
  EXPANDED_BANNER_HEIGHT: 320,
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5,
  MAX_GRID_COLUMNS: 7,
  NIGHT_SLOT_END_MINUTES: 30,
  MAX_LAYERS: 5,
  MOBILE_ITEM_SIZE: 60,
  TABLET_ITEM_SIZE: 70
};
var _ProgramListComponent = class _ProgramListComponent {
  constructor() {
    this.DEBUG = false;
    this.destroyRef = inject(DestroyRef);
    this.facade = inject(ProgramListFacadeService);
    this.transform = inject(ProgramListTransformService);
    this.cdr = inject(ChangeDetectorRef);
    this.http = inject(HttpClient);
    this.platformId = inject(PLATFORM_ID);
    this.deviceDetector = inject(DeviceDetectorService);
    this.injector = inject(Injector);
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.deviceInfo = computed(() => this.deviceDetector.deviceInfo());
    this.isMobile = computed(() => this.deviceDetector.isMobile());
    this.isTablet = computed(() => this.deviceDetector.isTablet());
    this.isDesktop = computed(() => this.deviceDetector.isDesktop());
    this.dayChanged = new EventEmitter();
    this.categorySelected = new EventEmitter();
    this.canalesConProgramas = signal([]);
    this.isLoading = signal(true);
    this.error = signal(null);
    this.activeDay = signal(0);
    this.activeTimeSlot = signal(0);
    this.currentTimeSlot = signal("");
    this.expandedChannels = signal(/* @__PURE__ */ new Set());
    this.selectedChannel = signal(-1);
    this.selectedProgram = signal(null);
    this.isDayDropdownOpen = signal(false);
    this.isCategoryDropdownOpen = signal(false);
    this.isTimeSlotDropdownOpen = signal(false);
    this.selectedCategories = signal(/* @__PURE__ */ new Set());
    this.showCategoryFilter = signal(true);
    this.showTimeIndicator = signal(true);
    this.hasChannels = computed(() => this.canalesConProgramas().length > 0);
    this.currentTimeSlots = computed(() => this.facade.getTimeSlots());
    this.currentHours = computed(() => this.facade.generateHoursForSlot(this.activeTimeSlot()));
    this.daysInfo = computed(() => this.facade.generateDaysInfo());
    this.filteredChannels = computed(() => {
      const channels = this.transform.getFilteredChannels(this.canalesConProgramas(), this.selectedCategories());
      if (this.DEBUG && !this.isMobile()) {
        console.log(`\u{1F50D} Canales filtrados: ${channels.length} de ${this.canalesConProgramas().length}`);
      }
      return channels;
    });
    this.modalChannelInfo = computed(() => {
      const program = this.selectedProgram();
      if (!program)
        return null;
      const channelData = this.filteredChannels().find((canal) => canal.channels && canal.channels.some((p) => p.id === program.id));
      if (!channelData) {
        console.warn("\u26A0\uFE0F No se encontr\xF3 canal para el programa:", program.id);
        return null;
      }
      return {
        channelName: channelData.channel?.name || "Canal Desconocido",
        channelLogo: this.getChannelLogoUrl(channelData) || ""
      };
    });
    this.availableCategories = computed(() => {
      return this.transform.getAvailableCategories(this.canalesConProgramas());
    });
    this.uiState = computed(() => ({
      hasData: this.hasChannels(),
      isLoading: this.isLoading(),
      hasError: this.error() !== null,
      showContent: this.hasChannels() && !this.isLoading() && !this.error(),
      showEmpty: !this.hasChannels() && !this.isLoading() && !this.error()
    }));
    this.timeIndicatorPositionPx = computed(() => {
      if (!this.showTimeIndicator() || !this.isBrowser)
        return 0;
      const currentHours = this.currentHours();
      if (!currentHours.length)
        return 0;
      const now = /* @__PURE__ */ new Date();
      const localMinutes = now.getHours() * 60 + now.getMinutes();
      const slotStartMinutes = this.parseTimeToMinutes(this.currentTimeSlot());
      const slotEndMinutes = this.getSlotEndMinutes(currentHours);
      const slotDuration = slotEndMinutes - slotStartMinutes;
      let minutesFromSlotStart = localMinutes - slotStartMinutes;
      if (minutesFromSlotStart < 0)
        minutesFromSlotStart += 24 * 60;
      if (minutesFromSlotStart < 0)
        minutesFromSlotStart = 0;
      if (minutesFromSlotStart > slotDuration)
        minutesFromSlotStart = slotDuration;
      return UI_CONFIG2.LOGO_COLUMN_WIDTH + minutesFromSlotStart / 60 * UI_CONFIG2.PIXELS_PER_HOUR;
    });
    this.isMobileFallback = signal(false);
    this.componentId = `pl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.channelIndexCache = /* @__PURE__ */ new Map();
    this.lastLoadTimestamp = 0;
    this.trackByDayIndex = (index) => index;
    this.trackByTimeSlot = (index, item) => item[0];
    this.trackByHour = (index, item) => item;
    this.trackByChannelId = (index, item) => item.id || item.channel?.id || `channel-${index}`;
    this.trackByProgramId = (index, item) => item.id || `${item.start}-${item.stop}-${index}`;
    this.trackByCategory = (index, category) => category;
  }
  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================
  ngOnInit() {
    if (this.DEBUG)
      console.log("[ProgramList] ngOnInit");
    this.initializeDataStreams();
    const currentSlot = this.facade.getCurrentTimeSlot();
    this.onTimeSlotChanged(currentSlot);
  }
  ngAfterViewInit() {
    if (this.DEBUG)
      console.log("[ProgramList] ngAfterViewInit");
    if (this.isBrowser) {
      this.updateInterval = setInterval(() => {
        if (this.showTimeIndicator()) {
          this.updateTimeIndicator();
        }
      }, 6e4);
    }
  }
  ngOnDestroy() {
    if (this.DEBUG)
      console.log("[ProgramList] ngOnDestroy");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
  // ===============================================
  // INITIALIZATION
  // ===============================================
  initializeDataStreams() {
    this.facade.getProgramListData().pipe(filter((data) => !!data), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.handleDataUpdate(data);
      },
      error: (error) => {
        console.error("Error in data stream:", error);
        this.handleDataError(error);
      }
    });
  }
  handleDataUpdate(data) {
    this.canalesConProgramas.set(data);
    this.isLoading.set(false);
    this.error.set(null);
    this.cdr.markForCheck();
    if (this.isBrowser) {
      setTimeout(() => {
        this.checkViewport();
      }, 100);
    }
  }
  handleDataError(error) {
    this.error.set("Error cargando datos");
    this.isLoading.set(false);
    this.cdr.markForCheck();
  }
  checkViewport() {
    try {
      if (this.virtualScrollViewport) {
        this.virtualScrollViewport.checkViewportSize();
      }
    } catch (e) {
      console.warn("Error checking viewport:", e);
    }
  }
  updateTimeIndicator() {
    this.cdr.markForCheck();
  }
  get gridTemplateColumns() {
    const columnsPerSlot = UI_CONFIG2.MINUTES_PER_SLOT / UI_CONFIG2.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG2.MAX_GRID_COLUMNS * columnsPerSlot;
    return `repeat(${totalColumns}, 1fr)`;
  }
  getMobileItemSize() {
    return this.deviceDetector.getOptimalItemSize();
  }
  getMobileVisiblePrograms(canal) {
    const programs = this.transform.getVisiblePrograms(canal.channels, this.currentHours(), this.activeDay());
    const channelIndex = this.getChannelIndex(canal);
    if (!this.isChannelExpanded(channelIndex)) {
      return programs.slice(0, 3);
    }
    return programs;
  }
  getChannelIndex(canal) {
    const channelId = canal.id || canal.channel?.id || "";
    if (!this.channelIndexCache.has(channelId)) {
      const index = this.filteredChannels().findIndex((c) => (c.id || c.channel?.id) === channelId);
      this.channelIndexCache.set(channelId, index);
    }
    return this.channelIndexCache.get(channelId) || 0;
  }
  // ===============================================
  // MÉTODOS DELEGADOS AL TRANSFORM SERVICE
  // ===============================================
  getSlotEndMinutes(currentHours) {
    return this.transform.getSlotEndMinutes(currentHours);
  }
  parseTimeToMinutes(timeString) {
    return this.transform.parseTimeToMinutes(timeString);
  }
  getProgramLayers(canal) {
    const layers = this.transform.getProgramLayers(canal, this.activeDay(), this.currentHours());
    if (this.DEBUG && !this.isMobile()) {
      console.log(`Canal ${canal.channel?.name}: ${layers.length} capas, ${layers.reduce((sum, layer) => sum + layer.length, 0)} programas`);
    }
    return layers;
  }
  // ===============================================
  // EVENT HANDLERS
  // ===============================================
  onDayChanged(dayIndex) {
    console.log("[ProgramList] onDayChanged called with", dayIndex, "current activeDay=", this.activeDay());
    if (this.activeDay() === dayIndex)
      return;
    const dayInfo = this.daysInfo()[dayIndex];
    if (!dayInfo)
      return;
    this.activeDay.set(dayIndex);
    this.showTimeIndicator.set(dayIndex === 0 && this.activeTimeSlot() === this.facade.getCurrentTimeSlot());
    if (dayIndex === 0) {
      const currentSlot = this.facade.getCurrentTimeSlot();
      this.onTimeSlotChanged(currentSlot);
    }
    this.selectedProgram.set(null);
    this.expandedChannels.set(/* @__PURE__ */ new Set());
    this.channelIndexCache.clear();
    this.lastLoadTimestamp = Date.now();
    this.isLoading.set(true);
    this.error.set(null);
    this.facade.loadProgramsForDay(dayIndex).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        if (!result.success) {
          this.error.set(result.error || "Error al cargar datos");
        }
        this.isLoading.set(false);
        this.cdr.detectChanges();
        if (this.isBrowser) {
          setTimeout(() => {
            try {
              this.virtualScrollViewport?.checkViewportSize();
              this.virtualScrollViewport?.scrollToIndex(0);
            } catch (e) {
              console.warn("Error reseteando scroll:", e);
            }
          }, 100);
        }
      },
      error: (err) => {
        this.error.set("Error al cambiar de d\xEDa");
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
    this.dayChanged.emit({ dayIndex, dayInfo });
  }
  onTimeSlotChanged(slotIndex) {
    if (this.activeTimeSlot() === slotIndex || slotIndex < 0 || slotIndex >= 8)
      return;
    const timeSlots = this.facade.getTimeSlots();
    const selectedSlot = timeSlots[slotIndex];
    if (!selectedSlot)
      return;
    this.activeTimeSlot.set(slotIndex);
    this.currentTimeSlot.set(selectedSlot[0]);
    this.showTimeIndicator.set(this.activeDay() === 0 && slotIndex === this.facade.getCurrentTimeSlot());
    if (this.showTimeIndicator() && this.isBrowser) {
      this.updateTimeIndicator();
    }
    this.cdr.markForCheck();
  }
  onProgramSelected(channelIndex, program) {
    console.log("[ProgramList] onProgramSelected called, channelIndex=", channelIndex, "programId=", program?.id);
    this.closeAllDropdowns();
    if (this.selectedProgram()?.id === program.id && this.isChannelExpanded(channelIndex)) {
      this.selectedProgram.set(null);
      if (!this.isMobile()) {
        this.onChannelToggle(channelIndex);
      }
      return;
    }
    if (!this.isChannelExpanded(channelIndex)) {
      this.onChannelToggle(channelIndex);
    }
    if (!this.isMobile()) {
      const expandedChannels = this.expandedChannels();
      expandedChannels.forEach((expandedIndex) => {
        if (expandedIndex !== channelIndex) {
          this.onChannelToggle(expandedIndex);
        }
      });
    }
    this.selectedProgram.set(program);
    this.cdr.markForCheck();
  }
  onChannelToggle(index) {
    const expanded = new Set(this.expandedChannels());
    if (expanded.has(index)) {
      expanded.delete(index);
      this.selectedChannel.set(-1);
      if (!this.isMobile()) {
        this.selectedProgram.set(null);
      }
    } else {
      if (this.isMobile()) {
        expanded.clear();
      }
      expanded.add(index);
      this.selectedChannel.set(index);
    }
    this.expandedChannels.set(expanded);
    this.cdr.markForCheck();
  }
  // ===============================================
  // DROPDOWN METHODS
  // ===============================================
  toggleDayDropdown() {
    this.isDayDropdownOpen.set(!this.isDayDropdownOpen());
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }
  toggleCategoryDropdown() {
    this.isCategoryDropdownOpen.set(!this.isCategoryDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }
  toggleTimeSlotDropdown() {
    this.isTimeSlotDropdownOpen.set(!this.isTimeSlotDropdownOpen());
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.cdr.markForCheck();
  }
  closeAllDropdowns() {
    this.isDayDropdownOpen.set(false);
    this.isCategoryDropdownOpen.set(false);
    this.isTimeSlotDropdownOpen.set(false);
    this.cdr.markForCheck();
  }
  // ===============================================
  // CATEGORY FILTERING
  // ===============================================
  onCategorySelected(category) {
    const selectedCategories = new Set(this.selectedCategories());
    if (selectedCategories.has(category)) {
      selectedCategories.delete(category);
    } else {
      selectedCategories.add(category);
    }
    this.selectedCategories.set(selectedCategories);
    this.categorySelected.emit(Array.from(selectedCategories));
    this.cdr.markForCheck();
  }
  clearCategoryFilter() {
    this.selectedCategories.set(/* @__PURE__ */ new Set());
    this.categorySelected.emit([]);
    this.cdr.markForCheck();
  }
  // ===============================================
  // TEMPLATE HELPER METHODS
  // ===============================================
  getCurrentSelectedDay() {
    const dayInfo = this.daysInfo()[this.activeDay()];
    return dayInfo ? `${dayInfo.diaSemana} ${dayInfo.diaNumero}` : "Seleccionar d\xEDa";
  }
  getCurrentSelectedTimeSlot() {
    const timeSlots = this.currentTimeSlots();
    const activeSlot = this.activeTimeSlot();
    if (timeSlots && timeSlots[activeSlot]) {
      const franja = timeSlots[activeSlot];
      return `${franja[0]} - ${franja[franja.length - 1]}`;
    }
    return "Seleccionar franja";
  }
  getCategoryButtonText() {
    const selectedCategories = this.selectedCategories();
    if (selectedCategories.size === 0)
      return "Todas las categor\xEDas";
    if (selectedCategories.size === 1) {
      const category = Array.from(selectedCategories)[0];
      return this.getCategoryDisplayName(category);
    }
    return `${selectedCategories.size} categor\xEDas`;
  }
  selectDay(dayIndex, event) {
    if (event) {
      try {
        event.stopPropagation();
        event.preventDefault();
      } catch {
      }
    }
    console.log("[ProgramList] selectDay ->", dayIndex);
    this.onDayChanged(dayIndex);
    this.isDayDropdownOpen.set(false);
    this.selectedProgram.set(null);
    this.expandedChannels.set(/* @__PURE__ */ new Set());
  }
  selectCategory(category) {
    if (category) {
      this.onCategorySelected(category);
    } else {
      this.clearCategoryFilter();
      this.isCategoryDropdownOpen.set(false);
    }
    this.cdr.markForCheck();
  }
  selectTimeSlot(slotIndex) {
    this.onTimeSlotChanged(slotIndex);
    this.isTimeSlotDropdownOpen.set(false);
    this.selectedProgram.set(null);
    this.expandedChannels.set(/* @__PURE__ */ new Set());
  }
  // ===============================================
  // STATE CHECK METHODS
  // ===============================================
  isChannelExpanded(index) {
    return this.expandedChannels().has(index);
  }
  isCategorySelected(category) {
    return this.selectedCategories().has(category);
  }
  isAllCategoriesSelected() {
    return this.selectedCategories().size === 0;
  }
  getProgramLayout(programa) {
    const currentHours = this.currentHours();
    const layout = this.transform.getLayoutForProgram(programa, currentHours);
    if (layout) {
      return {
        gridColumnStart: layout.gridColumnStart ?? 1,
        gridColumnEnd: layout.gridColumnEnd ?? 2,
        layerIndex: layout.layerIndex ?? 0,
        isCutAtStart: !!layout.isCutAtStart,
        isCutAtEnd: !!layout.isCutAtEnd,
        visibleStartTime: layout.visibleStartTime || this.transform.formatMinutesToHHMM(this.transform.getProgramStartMinutes(programa)),
        visibleEndTime: layout.visibleEndTime || this.transform.formatMinutesToHHMM(this.transform.getProgramEndMinutes(programa))
      };
    }
    const gridColumnStart = this.transform.getProgramGridColumn(programa, currentHours);
    const gridColumnEnd = this.transform.getProgramGridColumnEnd(programa, currentHours);
    const slotStartMinutes = currentHours.length ? this.parseTimeToMinutes(currentHours[0]) : 0;
    const { start: normStart, end: normEnd } = this.transform.normalizeProgramRange(this.transform.getProgramStartMinutes(programa), this.transform.getProgramEndMinutes(programa), slotStartMinutes);
    return {
      gridColumnStart,
      gridColumnEnd,
      layerIndex: 0,
      isCutAtStart: normStart > this.transform.getProgramStartMinutes(programa),
      isCutAtEnd: normEnd < this.transform.getProgramEndMinutes(programa),
      visibleStartTime: this.transform.formatMinutesToHHMM(normStart),
      visibleEndTime: this.transform.formatMinutesToHHMM(normEnd)
    };
  }
  // ===============================================
  // FACADE DELEGATION METHODS
  // ===============================================
  formatDisplayTime(timeString) {
    return this.facade.formatDisplayTime(timeString);
  }
  getCategoryBadgeClasses(categoryValue) {
    return this.facade.getCategoryBadgeClasses(categoryValue);
  }
  getCategoryDisplayName(categoryValue) {
    return this.transform.normalizeCategoryName(categoryValue);
  }
  getDayButtonClasses(dayIndex) {
    return this.facade.getDayButtonClasses(dayIndex, this.activeDay());
  }
  getTimeSlotButtonClasses(timeSlot) {
    return this.facade.getTimeSlotButtonClasses(timeSlot, this.currentTimeSlot());
  }
  getChannelLogoUrl(channelData) {
    if (channelData?.channel?.icon)
      return channelData.channel.icon;
    if (channelData?.icon)
      return channelData.icon;
    return this.facade.getChannelLogoUrl(channelData) || "";
  }
  onChannelLogoError(event) {
    const img = event.target;
    img.style.display = "none";
    const fallbackElement = img.parentElement?.querySelector(".channel-name-fallback");
    if (fallbackElement) {
      fallbackElement.classList.remove("hidden");
    }
  }
  getProgramTitle(programa) {
    if (!programa?.title)
      return "Sin t\xEDtulo";
    if (typeof programa.title === "string") {
      return programa.title;
    }
    if (typeof programa.title === "object" && programa.title.value) {
      return String(programa.title.value);
    }
    return "Sin t\xEDtulo";
  }
  getCurrentTime() {
    if (!this.isBrowser)
      return "00:00";
    const now = /* @__PURE__ */ new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  // ===============================================
  // UI HELPER METHODS
  // ===============================================
  getChannelHeight(canal, index) {
    const layers = this.getProgramLayers(canal);
    const layerCount = layers.length || 1;
    const baseHeight = UI_CONFIG2.LAYER_HEIGHT * layerCount;
    if (this.isChannelExpanded(index) && this.selectedProgram()) {
      return baseHeight + UI_CONFIG2.EXPANDED_BANNER_HEIGHT;
    }
    return baseHeight;
  }
  getLayerCount(canal) {
    const layers = this.getProgramLayers(canal);
    return Math.max(1, layers.length);
  }
  getItemSize() {
    return this.deviceDetector.getOptimalItemSize();
  }
  getTimeIndicatorZIndex() {
    const hasOpenDropdown = this.isDayDropdownOpen() || this.isCategoryDropdownOpen() || this.isTimeSlotDropdownOpen();
    return hasOpenDropdown ? 30 : 1e4;
  }
  getSelectedProgramBannerData() {
    return this.selectedProgram();
  }
  // ===============================================
  // DROPDOWN CSS CLASSES
  // ===============================================
  getDayDropdownItemClasses(dayIndex) {
    const isActive = dayIndex === this.activeDay();
    return isActive ? "bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold" : "";
  }
  getCategoryDropdownItemClasses(category) {
    const isActive = category ? this.selectedCategories().has(category) : this.selectedCategories().size === 0;
    return isActive ? "bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold" : "";
  }
  getTimeSlotDropdownItemClasses(timeSlotStart) {
    const isActive = timeSlotStart === this.currentTimeSlot();
    return isActive ? "bg-red-600/30 text-red-200 border-l-4 border-red-400 font-semibold" : "";
  }
  // ===============================================
  // 5. AÑADIR método para cerrar programa en móvil
  // ===============================================
  closeMobileProgram() {
    this.selectedProgram.set(null);
    const expandedChannels = this.expandedChannels();
    expandedChannels.clear();
    this.expandedChannels.set(expandedChannels);
    this.cdr.markForCheck();
  }
  // ===============================================
  // MOBILE NAVIGATION METHODS
  // ===============================================
  previousTimeSlot() {
    const current = this.activeTimeSlot();
    if (current > 0) {
      this.onTimeSlotChanged(current - 1);
    }
  }
  nextTimeSlot() {
    const current = this.activeTimeSlot();
    if (current < 7) {
      this.onTimeSlotChanged(current + 1);
    }
  }
  scrollToNow() {
    if (this.activeDay() !== 0)
      return;
    const currentSlot = this.facade.getCurrentTimeSlot();
    this.onTimeSlotChanged(currentSlot);
  }
  // ===============================================
  // HOST LISTENERS
  // ===============================================
  onScroll(event) {
    if (this.showTimeIndicator() && this.activeDay() === 0) {
      this.updateTimeIndicator();
    }
  }
  onDocumentClick(event) {
    if (!this.isBrowser)
      return;
    const target = event.target;
    if (target.closest(".program-detail-modal-container") || target.closest(".desktop-modal") || target.closest("app-program-detail-modal")) {
      return;
    }
    if (target.closest(".dropdown-container") || target.closest(".mobile-control")) {
      return;
    }
    if (!target.closest(".mobile-dropdown") && !target.closest(".mobile-btn")) {
      this.closeAllDropdowns();
    }
    if (this.isMobile()) {
      return;
    }
    if (!target.closest(".channel-programs-container") && !target.closest(".expanded-banner") && !target.closest("app-banner") && this.selectedProgram()) {
      const expandedChannels = this.expandedChannels();
      expandedChannels.forEach((channelIndex) => {
        this.onChannelToggle(channelIndex);
      });
      this.selectedProgram.set(null);
      this.cdr.markForCheck();
    }
  }
};
_ProgramListComponent.\u0275fac = function ProgramListComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _ProgramListComponent)();
};
_ProgramListComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProgramListComponent, selectors: [["app-program-list"]], viewQuery: function ProgramListComponent_Query(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275viewQuery(_c0, 5);
  }
  if (rf & 2) {
    let _t;
    \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.virtualScrollViewport = _t.first);
  }
}, hostBindings: function ProgramListComponent_HostBindings(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275listener("scroll", function ProgramListComponent_scroll_HostBindingHandler($event) {
      return ctx.onScroll($event);
    })("click", function ProgramListComponent_click_HostBindingHandler($event) {
      return ctx.onDocumentClick($event);
    }, \u0275\u0275resolveDocument);
  }
}, outputs: { dayChanged: "dayChanged", categorySelected: "categorySelected" }, decls: 2, vars: 2, consts: [["virtualScrollViewport", ""], [4, "ngIf"], [1, "ssr-placeholder"], [1, "min-h-screen", "bg-gradient-to-br", "from-gray-900", "via-gray-800", "to-black", "flex", "items-center", "justify-center"], [1, "text-center", "px-4"], [1, "mb-6"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "w-16", "h-16", "mx-auto", "text-red-500", "animate-pulse"], ["d", "M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"], [1, "text-white", "text-2xl", "lg:text-3xl", "font-bold", "mb-3"], [1, "text-gray-400", "text-base", "lg:text-lg", "mb-6"], [1, "flex", "items-center", "justify-center", "space-x-2"], [1, "w-2", "h-2", "bg-red-500", "rounded-full", "animate-bounce", 2, "animation-delay", "0s"], [1, "w-2", "h-2", "bg-red-500", "rounded-full", "animate-bounce", 2, "animation-delay", "0.2s"], [1, "w-2", "h-2", "bg-red-500", "rounded-full", "animate-bounce", 2, "animation-delay", "0.4s"], [1, "mobile-tv-guide"], ["class", "mobile-error", 4, "ngIf"], ["class", "mobile-content", 4, "ngIf"], [1, "mobile-bottom-header"], [1, "mobile-control"], [1, "mobile-btn", "mobile-btn-primary", 3, "click"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "mobile-icon"], ["fill-rule", "evenodd", "d", "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z", "clip-rule", "evenodd"], [1, "mobile-text-truncate"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "mobile-icon-sm"], ["fill-rule", "evenodd", "d", "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", "clip-rule", "evenodd"], ["class", "mobile-dropdown mobile-dropdown-up", 3, "click", 4, "ngIf"], [1, "mobile-btn", "mobile-btn-secondary", 3, "click"], ["fill-rule", "evenodd", "d", "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z", "clip-rule", "evenodd"], ["class", "mobile-btn-icon", 3, "click", 4, "ngIf"], ["class", "mobile-dropdown mobile-dropdown-up mobile-dropdown-right", 3, "click", 4, "ngIf"], [3, "program", "channelName", "channelLogo", "close", 4, "ngIf"], [1, "mobile-error"], [1, "mobile-error-title"], [1, "mobile-error-text"], [1, "mobile-content"], [1, "mobile-scroll", 3, "itemSize"], ["class", "mobile-channel", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "mobile-channel"], [1, "mobile-channel-header", 3, "click"], ["class", "mobile-channel-logo", "loading", "lazy", 3, "src", "alt", "error", 4, "ngIf"], [1, "mobile-channel-name", "channel-name-fallback"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "mobile-icon-sm", "mobile-chevron"], [1, "mobile-programs-compact"], ["class", "mobile-program-card", 3, "mobile-program-active", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["loading", "lazy", 1, "mobile-channel-logo", 3, "error", "src", "alt"], [1, "mobile-program-card", 3, "click"], [1, "mobile-program-header"], [1, "mobile-program-title"], [1, "mobile-program-time"], ["class", "mobile-category-badge", 3, "class", 4, "ngIf"], [1, "mobile-category-badge"], [1, "mobile-dropdown", "mobile-dropdown-up", 3, "click"], ["class", "mobile-dropdown-item", 3, "mobile-dropdown-active", "click", 4, "ngFor", "ngForOf"], [1, "mobile-dropdown-item", 3, "click"], [1, "mobile-dropdown-content"], [1, "mobile-dropdown-title"], [1, "mobile-dropdown-subtitle"], ["class", "mobile-icon-sm mobile-check", "fill", "currentColor", "viewBox", "0 0 20 20", 4, "ngIf"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "mobile-icon-sm", "mobile-check"], ["fill-rule", "evenodd", "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", "clip-rule", "evenodd"], [1, "mobile-btn-icon", 3, "click"], ["fill-rule", "evenodd", "d", "M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z", "clip-rule", "evenodd"], ["class", "mobile-badge", 4, "ngIf"], [1, "mobile-badge"], [1, "mobile-dropdown", "mobile-dropdown-up", "mobile-dropdown-right", 3, "click"], ["class", "mobile-dropdown-item", 3, "mobile-dropdown-active", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [3, "close", "program", "channelName", "channelLogo"], [1, "pt-6", "pb-4", "px-4", "lg:px-6", "w-full", "min-h-screen"], [1, "mb-8", "space-y-4", "w-full"], [1, "grid", "grid-cols-1", "lg:grid-cols-3", "gap-4", "max-w-7xl", "mx-auto"], [1, "relative", "dropdown-container"], ["type", "button", 1, "w-full", "flex", "items-center", "justify-between", "px-4", "py-3", "bg-gradient-to-r", "from-gray-800", "to-gray-700", "border", "border-gray-600", "rounded-xl", "text-white", "font-semibold", "hover:from-gray-700", "hover:to-gray-600", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "shadow-lg", 3, "click"], [1, "flex", "items-center", "space-x-3"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "h-5", "w-5", "text-red-400"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "h-5", "w-5", "transition-transform", "duration-200"], ["class", "absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-sm", "style", "z-index: 50", 4, "ngIf"], ["class", "relative dropdown-container", 4, "ngIf"], [1, "w-full", "flex", "items-center", "justify-between", "px-4", "py-3", "bg-gradient-to-r", "from-gray-800", "to-gray-700", "border", "border-gray-600", "rounded-xl", "text-white", "font-semibold", "hover:from-gray-700", "hover:to-gray-600", "transition-all", "duration-300", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "shadow-lg", 3, "click"], [1, "bg-gray-900", "rounded-xl", "shadow-2xl", "overflow-hidden", "relative", "w-full"], ["class", "absolute w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 shadow-2xl shadow-red-500/50 time-indicator pointer-events-none", 3, "left", "height", "top", "z-index", 4, "ngIf"], [1, "sticky", "top-0", "bg-gradient-to-r", "from-gray-800", "via-gray-700", "to-gray-800", "border-b-2", "border-red-500/30", "shadow-lg", "time-header", 2, "z-index", "40"], [1, "flex"], [1, "w-32", "lg:w-40", "flex-shrink-0", "bg-gray-800", "border-r", "border-gray-600", "p-3", "flex", "items-center", "justify-center"], [1, "text-white", "font-semibold", "text-sm", "tracking-wide"], [1, "flex-1", "overflow-hidden"], [1, "grid", "grid-cols-7", "h-full", "w-full", 2, "display", "grid !important"], ["class", "px-2 py-3 text-center border-r border-gray-600/50 last:border-r-0 hover:bg-gray-600/30 transition-colors duration-200 flex items-center justify-center", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "relative", "overflow-hidden", 2, "height", "700px"], ["class", "p-8 text-center text-red-400", 4, "ngIf"], ["class", "p-8 text-center text-gray-400", 4, "ngIf"], ["class", "h-full", 3, "itemSize", 4, "ngIf"], ["class", "fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 z-40 lg:hidden", 4, "ngIf"], ["class", "desktop-modal", 3, "program", "channelName", "channelLogo", "close", 4, "ngIf"], [1, "absolute", "top-full", "left-0", "right-0", "mt-2", "bg-gray-900", "border", "border-gray-600", "rounded-xl", "shadow-2xl", "max-h-64", "overflow-y-auto", "backdrop-blur-sm", 2, "z-index", "50"], [1, "py-2"], ["type", "button", "class", "w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center space-x-3 text-white", 3, "class", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["type", "button", 1, "w-full", "text-left", "px-4", "py-3", "hover:bg-gray-700/80", "transition-colors", "duration-200", "flex", "items-center", "space-x-3", "text-white", 3, "click"], [1, "flex-1"], [1, "font-medium", "text-base", "text-gray-100"], [1, "text-sm", "opacity-75", "text-gray-300"], ["class", "h-5 w-5 text-red-400 flex-shrink-0", "fill", "currentColor", "viewBox", "0 0 20 20", 4, "ngIf"], ["fill", "currentColor", "viewBox", "0 0 20 20", 1, "h-5", "w-5", "text-red-400", "flex-shrink-0"], ["class", "inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full", 4, "ngIf"], [1, "inline-flex", "items-center", "justify-center", "w-5", "h-5", "text-xs", "font-bold", "text-white", "bg-red-500", "rounded-full"], [1, "w-full", "text-left", "px-4", "py-3", "hover:bg-gray-700/80", "transition-colors", "duration-200", "flex", "items-center", "justify-between", "text-white", 3, "click"], [1, "text-gray-100"], ["class", "h-5 w-5 text-red-400", "fill", "currentColor", "viewBox", "0 0 20 20", 4, "ngIf"], ["class", "w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center justify-between text-white", 3, "class", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "absolute", "w-0.5", "bg-gradient-to-b", "from-red-400", "via-red-500", "to-red-600", "shadow-2xl", "shadow-red-500/50", "time-indicator", "pointer-events-none"], [1, "absolute", "-top-2", "w-4", "h-4", "bg-red-500", "rounded-full", "-translate-x-1.5", "animate-pulse", "shadow-xl", "shadow-red-500/60", "border-2", "border-white", "pointer-events-none"], [1, "absolute", "inset-1", "w-2", "h-2", "bg-white", "rounded-full"], [1, "absolute", "-top-10", "-translate-x-1/2", "left-1/2", "bg-gradient-to-r", "from-red-600", "to-red-500", "text-white", "text-xs", "font-semibold", "px-3", "py-1.5", "rounded-lg", "shadow-xl", "shadow-red-500/50", "whitespace-nowrap", "border", "border-red-400/50", "backdrop-blur-sm", "pointer-events-none"], [1, "px-2", "py-3", "text-center", "border-r", "border-gray-600/50", "last:border-r-0", "hover:bg-gray-600/30", "transition-colors", "duration-200", "flex", "items-center", "justify-center"], [1, "text-white", "text-xs", "lg:text-sm", "font-medium", "tracking-wide", "whitespace-nowrap"], [1, "p-8", "text-center", "text-red-400"], [1, "text-lg", "font-semibold", "mb-2"], [1, "text-gray-400", "mb-4"], [1, "px-4", "py-2", "bg-red-600", "hover:bg-red-700", "text-white", "rounded-lg", "transition-colors", 3, "click"], [1, "p-8", "text-center", "text-gray-400"], [1, "text-gray-400"], [1, "h-full", 3, "itemSize"], [1, "overflow-hidden"], ["class", "channel-row border-b border-gray-700 last:border-b-0 hover:bg-gray-800/30 transition-colors duration-200", 3, "height", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "channel-row", "border-b", "border-gray-700", "last:border-b-0", "hover:bg-gray-800/30", "transition-colors", "duration-200"], [1, "flex", "channel-programs-container", "h-full"], [1, "w-32", "lg:w-40", "flex-shrink-0", "bg-gradient-to-br", "from-gray-800", "to-gray-900", "border-r", "border-gray-600", "p-3", "flex", "items-center", "justify-center", "cursor-pointer", 3, "click"], [1, "relative", "w-full", "h-16", "flex", "items-center", "justify-center"], ["class", "max-w-full max-h-full object-contain rounded-lg bg-white/5 p-1 shadow-lg transition-transform duration-300", "loading", "lazy", 3, "src", "alt", "scale-105", "error", 4, "ngIf"], [1, "channel-name-fallback", "text-white", "text-center", "font-medium", "text-sm", "leading-tight", "break-words", "px-2"], [1, "flex-1", "programs-container", "relative"], [1, "programs-grid", "w-full", "h-full", "relative"], [4, "ngFor", "ngForOf"], ["class", "bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 shadow-2xl relative", "style", "z-index: 60", 4, "ngIf"], ["loading", "lazy", 1, "max-w-full", "max-h-full", "object-contain", "rounded-lg", "bg-white/5", "p-1", "shadow-lg", "transition-transform", "duration-300", 3, "error", "src", "alt"], ["class", "border-r border-gray-600/30 cursor-pointer hover:bg-red-600/20 transition-all duration-200 group bg-gray-800/60 overflow-hidden relative", 3, "gridColumnStart", "gridColumnEnd", "gridRow", "zIndex", "ngClass", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "border-r", "border-gray-600/30", "cursor-pointer", "hover:bg-red-600/20", "transition-all", "duration-200", "group", "bg-gray-800/60", "overflow-hidden", "relative", 3, "click", "ngClass"], [1, "h-full", "p-1.5", "flex", "flex-col", "justify-between", "overflow-hidden", "relative"], ["class", "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 opacity-75", 4, "ngIf"], ["class", "absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 opacity-75", 4, "ngIf"], [1, "flex-1", "min-h-0"], [1, "text-white", "text-xs", "font-medium", "line-clamp-1", "leading-tight", "group-hover:text-red-200", "transition-colors"], ["class", "text-yellow-400 mr-1", 4, "ngIf"], ["class", "text-yellow-400 ml-1", 4, "ngIf"], [1, "text-gray-400", "text-xs", "group-hover:text-red-300", "transition-colors", "mt-0.5"], ["class", "mt-1", 4, "ngIf"], [1, "absolute", "left-0", "top-0", "bottom-0", "w-1", "bg-gradient-to-b", "from-yellow-400", "to-orange-500", "opacity-75"], [1, "absolute", "right-0", "top-0", "bottom-0", "w-1", "bg-gradient-to-b", "from-yellow-400", "to-orange-500", "opacity-75"], [1, "text-yellow-400", "mr-1"], [1, "text-yellow-400", "ml-1"], [1, "mt-1"], [1, "inline-block", "px-1.5", "py-0.5", "text-xs", "rounded-full", "truncate", "max-w-full", "leading-tight"], [1, "bg-gray-800/95", "backdrop-blur-sm", "border-t", "border-gray-700", "shadow-2xl", "relative", 2, "z-index", "60"], [1, "p-4"], [3, "data"], [1, "fixed", "bottom-0", "left-0", "right-0", "bg-gray-900/95", "backdrop-blur-sm", "border-t", "border-gray-700", "p-3", "z-40", "lg:hidden"], [1, "flex", "justify-around", "items-center"], [1, "flex", "flex-col", "items-center", "text-gray-400", "hover:text-white", "transition-colors"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-6", "h-6", "mb-1"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"], [1, "text-xs"], ["class", "flex flex-col items-center text-gray-400 hover:text-white transition-colors", 3, "click", 4, "ngIf"], [1, "flex", "flex-col", "items-center", "text-gray-400", "hover:text-white", "transition-colors", 3, "click", "disabled"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 19l-7-7 7-7"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], [1, "flex", "flex-col", "items-center", "text-gray-400", "hover:text-white", "transition-colors", 3, "click"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"], [1, "desktop-modal", 3, "close", "program", "channelName", "channelLogo"]], template: function ProgramListComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ProgramListComponent_ng_container_0_Template, 15, 0, "ng-container", 1)(1, ProgramListComponent_ng_container_1_Template, 3, 2, "ng-container", 1);
  }
  if (rf & 2) {
    \u0275\u0275property("ngIf", ctx.uiState().isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx.uiState().isLoading);
  }
}, dependencies: [
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  BannerComponent,
  ScrollingModule,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ProgramDetailModalComponent
], styles: ['@charset "UTF-8";\n\n\n\n.mobile-tv-guide[_ngcontent-%COMP%] {\n  display: none;\n}\n@media (max-width: 767px) {\n  .mobile-tv-guide[_ngcontent-%COMP%] {\n    display: flex !important;\n    flex-direction: column;\n    height: 100vh;\n    background:\n      linear-gradient(\n        to bottom,\n        #111827,\n        #000);\n    overflow: hidden;\n    -webkit-overflow-scrolling: touch;\n    visibility: visible !important;\n    opacity: 1 !important;\n  }\n}\n.desktop-tv-guide[_ngcontent-%COMP%] {\n  display: block;\n}\n@media (max-width: 767px) {\n  .desktop-tv-guide[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n}\n.mobile-bottom-header[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  z-index: 100;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(55, 65, 81, 0.3);\n  padding: 0.75rem;\n  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));\n  display: grid;\n  grid-template-columns: 1fr 1fr auto;\n  gap: 0.5rem;\n  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);\n}\n.mobile-control[_ngcontent-%COMP%] {\n  position: relative;\n}\n.mobile-btn[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  padding: 0.75rem;\n  border-radius: 0.75rem;\n  font-weight: 600;\n  font-size: 0.875rem;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  background: rgba(31, 41, 55, 0.8);\n  color: white;\n  min-height: 44px;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n}\n.mobile-btn[_ngcontent-%COMP%]:active {\n  transform: scale(0.98);\n}\n.mobile-btn-primary[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #dc2626);\n  border-color: #ef4444;\n}\n.mobile-btn-primary[_ngcontent-%COMP%]:active {\n  background:\n    linear-gradient(\n      135deg,\n      #dc2626,\n      rgb(200.2083333333, 32.2916666667, 32.2916666667));\n}\n.mobile-btn-secondary[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.9);\n  border-color: rgba(55, 65, 81, 0.5);\n}\n.mobile-btn-secondary[_ngcontent-%COMP%]:active {\n  background: #1f2937;\n}\n.mobile-btn-icon[_ngcontent-%COMP%] {\n  position: relative;\n  width: 44px;\n  height: 44px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 0.75rem;\n  background: rgba(31, 41, 55, 0.8);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  color: white;\n  -webkit-tap-highlight-color: transparent;\n}\n.mobile-btn-icon[_ngcontent-%COMP%]:active {\n  transform: scale(0.95);\n}\n.mobile-icon[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  flex-shrink: 0;\n  color: rgba(255, 255, 255, 0.9);\n}\n.mobile-icon-sm[_ngcontent-%COMP%] {\n  width: 16px;\n  height: 16px;\n  flex-shrink: 0;\n  transition: transform 0.2s ease;\n}\n.mobile-icon-sm.rotate-180[_ngcontent-%COMP%] {\n  transform: rotate(180deg);\n}\n.mobile-check[_ngcontent-%COMP%] {\n  color: #ef4444;\n}\n.mobile-chevron[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.6);\n}\n.mobile-text-truncate[_ngcontent-%COMP%] {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n}\n.mobile-badge[_ngcontent-%COMP%] {\n  position: absolute;\n  top: -4px;\n  right: -4px;\n  min-width: 18px;\n  height: 18px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #ef4444;\n  color: white;\n  border-radius: 9px;\n  font-size: 0.625rem;\n  font-weight: 700;\n  padding: 0 4px;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n}\n.mobile-dropdown[_ngcontent-%COMP%] {\n  position: absolute;\n  z-index: 200;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(16px);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  border-radius: 0.75rem;\n  max-height: 280px;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  box-shadow: 0 -12px 24px rgba(0, 0, 0, 0.3);\n  bottom: calc(100% + 0.5rem);\n  left: 0;\n  right: 0;\n}\n.mobile-dropdown[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 4px;\n}\n.mobile-dropdown[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.mobile-dropdown[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 2px;\n}\n.mobile-dropdown-right[_ngcontent-%COMP%] {\n  left: auto;\n  right: 0;\n  min-width: 200px;\n}\n.mobile-dropdown-up[_ngcontent-%COMP%] {\n  top: auto;\n  bottom: calc(100% + 0.5rem);\n}\n.mobile-dropdown-item[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.875rem;\n  color: rgba(255, 255, 255, 0.9);\n  font-size: 0.875rem;\n  transition: background-color 0.15s ease;\n  border-bottom: 1px solid rgba(55, 65, 81, 0.15);\n  min-height: 48px;\n  -webkit-tap-highlight-color: transparent;\n}\n.mobile-dropdown-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.mobile-dropdown-item[_ngcontent-%COMP%]:active {\n  background: rgba(31, 41, 55, 0.5);\n}\n.mobile-dropdown-item.mobile-dropdown-active[_ngcontent-%COMP%] {\n  background: rgba(239, 68, 68, 0.15);\n  color: white;\n  font-weight: 600;\n}\n.mobile-dropdown-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.125rem;\n  flex: 1;\n}\n.mobile-dropdown-title[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: white;\n}\n.mobile-dropdown-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.6);\n}\n.mobile-content[_ngcontent-%COMP%] {\n  flex: 1;\n  margin-bottom: 120px;\n  overflow: hidden;\n}\n.mobile-scroll[_ngcontent-%COMP%] {\n  height: 100%;\n  width: 100%;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n}\n.mobile-loading[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: calc(100vh - 120px);\n  gap: 1rem;\n}\n.mobile-spinner[_ngcontent-%COMP%] {\n  width: 48px;\n  height: 48px;\n  border: 3px solid rgba(239, 68, 68, 0.2);\n  border-top-color: #ef4444;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 1s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.mobile-loading-text[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.7);\n  font-size: 0.875rem;\n}\n.mobile-error[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: calc(100vh - 120px);\n  gap: 1rem;\n  padding: 2rem;\n  text-align: center;\n}\n.mobile-error-title[_ngcontent-%COMP%] {\n  color: #ef4444;\n  font-size: 1.125rem;\n  font-weight: 700;\n}\n.mobile-error-text[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.6);\n  font-size: 0.875rem;\n}\n.mobile-channel[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.4);\n  border-bottom: 1px solid rgba(55, 65, 81, 0.2);\n}\n.mobile-channel[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.mobile-channel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.875rem;\n  background: rgba(31, 41, 55, 0.6);\n  border-bottom: 1px solid rgba(55, 65, 81, 0.2);\n  -webkit-tap-highlight-color: transparent;\n  min-height: 56px;\n}\n.mobile-channel-header[_ngcontent-%COMP%]:active {\n  background: rgba(31, 41, 55, 0.8);\n}\n.mobile-channel-logo[_ngcontent-%COMP%] {\n  width: 48px;\n  height: 32px;\n  object-fit: contain;\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 0.375rem;\n  padding: 0.25rem;\n}\n.mobile-channel-name[_ngcontent-%COMP%] {\n  flex: 1;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: white;\n}\n.mobile-programs-compact[_ngcontent-%COMP%] {\n  display: none;\n  flex-direction: column;\n}\n.mobile-programs-compact.expanded[_ngcontent-%COMP%] {\n  display: flex;\n}\n.mobile-program-card[_ngcontent-%COMP%] {\n  padding: 0.875rem;\n  border-bottom: 1px solid rgba(55, 65, 81, 0.1);\n  transition: background-color 0.15s ease;\n  -webkit-tap-highlight-color: transparent;\n  min-height: 68px;\n}\n.mobile-program-card[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.mobile-program-card[_ngcontent-%COMP%]:active {\n  background: rgba(31, 41, 55, 0.5);\n}\n.mobile-program-card.mobile-program-active[_ngcontent-%COMP%] {\n  background: rgba(239, 68, 68, 0.1);\n  border-left: 3px solid #ef4444;\n  padding-left: calc(0.875rem - 3px);\n}\n.mobile-program-header[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  margin-bottom: 0.5rem;\n}\n.mobile-program-title[_ngcontent-%COMP%] {\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: white;\n  line-height: 1.3;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n.mobile-program-time[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.6);\n  font-weight: 500;\n}\n.mobile-category-badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 0.25rem 0.5rem;\n  font-size: 0.625rem;\n  font-weight: 600;\n  border-radius: 0.375rem;\n  text-transform: uppercase;\n  letter-spacing: 0.025em;\n}\n.mobile-program-details[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 120px;\n  left: 0;\n  right: 0;\n  z-index: 90;\n  padding: 0.875rem;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(55, 65, 81, 0.2);\n  max-height: 50vh;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  animation: _ngcontent-%COMP%_slideUp 0.3s ease-out;\n  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);\n}\n@keyframes _ngcontent-%COMP%_slideUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n*[_ngcontent-%COMP%] {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  backface-visibility: hidden;\n}\n.mobile-scroll[_ngcontent-%COMP%], \n.mobile-dropdown[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  will-change: scroll-position;\n}\n.mobile-btn[_ngcontent-%COMP%], \n.mobile-program-card[_ngcontent-%COMP%], \n.mobile-channel-header[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .mobile-bottom-header[_ngcontent-%COMP%] {\n    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));\n  }\n  .mobile-program-details[_ngcontent-%COMP%] {\n    bottom: calc(120px + env(safe-area-inset-bottom));\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .mobile-channel[_ngcontent-%COMP%], \n   .mobile-program-card[_ngcontent-%COMP%] {\n    border: 1px solid currentColor;\n  }\n  .mobile-btn[_ngcontent-%COMP%] {\n    border-width: 2px;\n  }\n}\n@media (orientation: landscape) and (max-height: 500px) {\n  .mobile-bottom-header[_ngcontent-%COMP%] {\n    padding: 0.5rem;\n    gap: 0.375rem;\n  }\n  .mobile-btn[_ngcontent-%COMP%] {\n    padding: 0.5rem;\n    font-size: 0.75rem;\n    min-height: 36px;\n  }\n  .mobile-program-card[_ngcontent-%COMP%] {\n    padding: 0.625rem;\n    min-height: 56px;\n  }\n  .mobile-program-details[_ngcontent-%COMP%] {\n    max-height: 40vh;\n  }\n}\n@media (min-width: 768px) {\n  .mobile-tv-guide[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n  .desktop-tv-guide[_ngcontent-%COMP%] {\n    display: block !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .mobile-tv-guide[_ngcontent-%COMP%] {\n    background:\n      linear-gradient(\n        to bottom,\n        #0a0a0a,\n        #000);\n  }\n  .mobile-bottom-header[_ngcontent-%COMP%] {\n    background: rgba(10, 10, 10, 0.98);\n  }\n}\n@media (hover: none) and (pointer: coarse) {\n  .mobile-btn[_ngcontent-%COMP%], \n   .mobile-dropdown-item[_ngcontent-%COMP%], \n   .mobile-program-card[_ngcontent-%COMP%], \n   .mobile-channel-header[_ngcontent-%COMP%] {\n    min-height: 48px;\n  }\n  .mobile-btn[_ngcontent-%COMP%]:active, \n   .mobile-program-card[_ngcontent-%COMP%]:active, \n   .mobile-channel-header[_ngcontent-%COMP%]:active {\n    opacity: 0.8;\n  }\n}\n.mobile-scroll[_ngcontent-%COMP%], \n.mobile-program-details[_ngcontent-%COMP%] {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.4) transparent;\n}\n.mobile-scroll[_ngcontent-%COMP%]::-webkit-scrollbar, \n.mobile-program-details[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 4px;\n}\n.mobile-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-track, \n.mobile-program-details[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.mobile-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb, \n.mobile-program-details[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.4);\n  border-radius: 2px;\n}\n.mobile-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover, \n.mobile-program-details[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.6);\n}\n.hidden[_ngcontent-%COMP%] {\n  display: none !important;\n}\n.channel-name-fallback.hidden[_ngcontent-%COMP%] {\n  display: none;\n}\n.mobile-tv-guide[_ngcontent-%COMP%] {\n  display: none !important;\n}\n@media (max-width: 767px) {\n  .mobile-tv-guide[_ngcontent-%COMP%] {\n    display: flex !important;\n  }\n}\n@media (min-width: 768px) {\n  .mobile-tv-guide[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n}\n.programs-grid[_ngcontent-%COMP%] {\n  display: grid !important;\n  gap: 0 !important;\n  grid-auto-rows: 75px !important;\n  width: 100% !important;\n  overflow: visible !important;\n  min-height: 75px !important;\n  position: relative !important;\n}\n.programs-grid[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  width: auto !important;\n  min-width: 0 !important;\n  max-width: 100% !important;\n  position: relative !important;\n  display: block !important;\n  height: 75px !important;\n  overflow: hidden !important;\n  box-sizing: border-box !important;\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.programs-grid[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  display: flex !important;\n  flex-direction: column !important;\n  height: 100% !important;\n  width: 100% !important;\n}\n.programs-container[_ngcontent-%COMP%] {\n  overflow: visible !important;\n  position: relative !important;\n  flex: 1;\n  min-width: 0;\n}\n.programs-container[_ngcontent-%COMP%]   .programs-grid[_ngcontent-%COMP%] {\n  position: relative !important;\n  width: 100% !important;\n  height: 100% !important;\n}\n.channel-programs-container[_ngcontent-%COMP%] {\n  position: relative !important;\n  display: flex !important;\n  min-height: 75px !important;\n  overflow: visible !important;\n  isolation: isolate;\n}\n.channel-programs-container[_ngcontent-%COMP%]    > *[_ngcontent-%COMP%] {\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.channel-row[_ngcontent-%COMP%] {\n  border-bottom: 1px solid rgba(75, 85, 99, 0.4) !important;\n  isolation: isolate;\n  min-height: 75px !important;\n  position: relative !important;\n  display: block !important;\n  visibility: visible !important;\n}\n.channel-row[_ngcontent-%COMP%]   *[_ngcontent-%COMP%] {\n  visibility: inherit;\n}\n.channel-row[_ngcontent-%COMP%]:last-child {\n  border-bottom: none !important;\n}\ndiv[class*=border-r][class*=cursor-pointer][_ngcontent-%COMP%] {\n  visibility: visible !important;\n  opacity: 1 !important;\n  display: block !important;\n}\ndiv[class*=border-r][class*=cursor-pointer][_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  visibility: visible !important;\n  opacity: 1 !important;\n  display: flex !important;\n}\ncdk-virtual-scroll-viewport[_ngcontent-%COMP%] {\n  contain: layout style paint !important;\n  will-change: scroll-position;\n  scroll-behavior: smooth;\n  -webkit-overflow-scrolling: touch;\n  width: 100% !important;\n  overflow-y: auto !important;\n  overflow-x: hidden !important;\n}\ncdk-virtual-scroll-viewport[_ngcontent-%COMP%]   .cdk-virtual-scroll-content-wrapper[_ngcontent-%COMP%] {\n  width: 100% !important;\n  contain: layout style !important;\n}\ncdk-virtual-scroll-viewport[_ngcontent-%COMP%]   .cdk-virtual-scroll-content-wrapper[_ngcontent-%COMP%]    > *[_ngcontent-%COMP%] {\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.time-header[_ngcontent-%COMP%] {\n  position: sticky !important;\n  top: 0 !important;\n  z-index: 40 !important;\n  background:\n    linear-gradient(\n      to right,\n      #1f2937,\n      #374151,\n      #1f2937) !important;\n}\n.time-header[_ngcontent-%COMP%]   .grid[_ngcontent-%COMP%] {\n  display: grid !important;\n  grid-template-columns: repeat(7, 1fr) !important;\n  width: 100% !important;\n}\n.time-header[_ngcontent-%COMP%]   .grid[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  visibility: visible !important;\n}\n.programs-grid[_ngcontent-%COMP%] {\n  grid-template-columns: repeat(42, minmax(0, 1fr)) !important;\n}\n.programs-grid[_ngcontent-%COMP%]    > div[style*=grid-column-start][_ngcontent-%COMP%] {\n  min-width: 10px !important;\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n@media (min-width: 768px) {\n  .programs-grid[_ngcontent-%COMP%], \n   .programs-container[_ngcontent-%COMP%], \n   .channel-programs-container[_ngcontent-%COMP%], \n   .channel-row[_ngcontent-%COMP%] {\n    visibility: visible !important;\n    opacity: 1 !important;\n  }\n  .programs-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(42, minmax(15px, 1fr)) !important;\n  }\n}\n@media (min-width: 1024px) {\n  .programs-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(42, minmax(20px, 1fr)) !important;\n  }\n}\n@media (min-width: 1440px) {\n  .programs-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(42, minmax(25px, 1fr)) !important;\n  }\n}\n.time-header[_ngcontent-%COMP%] {\n  z-index: 40 !important;\n}\n.dropdown-container[_ngcontent-%COMP%] {\n  z-index: 50 !important;\n}\n.time-indicator[_ngcontent-%COMP%] {\n  z-index: 30 !important;\n}\n.time-indicator.time-indicator-priority[_ngcontent-%COMP%] {\n  z-index: 10000 !important;\n}\n.channel-row[_ngcontent-%COMP%] {\n  z-index: 1 !important;\n}\n.programs-grid[_ngcontent-%COMP%] {\n  z-index: auto !important;\n}\n.programs-grid[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  z-index: auto !important;\n}\n.programs-grid[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%]:hover {\n  z-index: 20 !important;\n}\n/*# sourceMappingURL=program-list.component.css.map */'], data: { animation: [
  trigger("expandCollapse", [
    state("collapsed", style({ height: "0px", opacity: 0 })),
    state("expanded", style({ height: "*", opacity: 1 })),
    transition("collapsed <=> expanded", animate("300ms ease-in-out"))
  ])
] }, changeDetection: 0 });
var ProgramListComponent = _ProgramListComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgramListComponent, [{
    type: Component,
    args: [{ selector: "app-program-list", standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      CommonModule,
      BannerComponent,
      ScrollingModule,
      ProgramDetailModalComponent
    ], animations: [
      trigger("expandCollapse", [
        state("collapsed", style({ height: "0px", opacity: 0 })),
        state("expanded", style({ height: "*", opacity: 1 })),
        transition("collapsed <=> expanded", animate("300ms ease-in-out"))
      ])
    ], template: `<!-- TEMPLATE COMPLETO CON MODAL EN AMBAS VERSIONES -->\r
\r
<!-- Loading Global -->\r
<ng-container *ngIf="uiState().isLoading">\r
  <div class="ssr-placeholder">\r
    <div\r
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center"\r
    >\r
      <div class="text-center px-4">\r
        <div class="mb-6">\r
          <svg\r
            class="w-16 h-16 mx-auto text-red-500 animate-pulse"\r
            fill="currentColor"\r
            viewBox="0 0 20 20"\r
          >\r
            <path\r
              d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"\r
            ></path>\r
          </svg>\r
        </div>\r
        <h2 class="text-white text-2xl lg:text-3xl font-bold mb-3">Gu\xEDa TV</h2>\r
        <p class="text-gray-400 text-base lg:text-lg mb-6">\r
          Cargando programaci\xF3n de televisi\xF3n...\r
        </p>\r
        <div class="flex items-center justify-center space-x-2">\r
          <div\r
            class="w-2 h-2 bg-red-500 rounded-full animate-bounce"\r
            style="animation-delay: 0s"\r
          ></div>\r
          <div\r
            class="w-2 h-2 bg-red-500 rounded-full animate-bounce"\r
            style="animation-delay: 0.2s"\r
          ></div>\r
          <div\r
            class="w-2 h-2 bg-red-500 rounded-full animate-bounce"\r
            style="animation-delay: 0.4s"\r
          ></div>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\r
</ng-container>\r
\r
<!-- Contenido cuando NO est\xE1 cargando -->\r
<ng-container *ngIf="!uiState().isLoading">\r
  <!-- ========================================== -->\r
  <!-- VERSI\xD3N M\xD3VIL (< 768px) -->\r
  <!-- ========================================== -->\r
  <ng-container *ngIf="isMobile()">\r
    <section class="mobile-tv-guide">\r
      <!-- Error State -->\r
      <div *ngIf="uiState().hasError" class="mobile-error">\r
        <h3 class="mobile-error-title">Error al cargar</h3>\r
        <p class="mobile-error-text">{{ error() }}</p>\r
        <button\r
          (click)="facade.refreshData()"\r
          class="mobile-btn mobile-btn-primary"\r
        >\r
          Reintentar\r
        </button>\r
      </div>\r
\r
      <!-- Program List -->\r
      <div *ngIf="uiState().showContent" class="mobile-content">\r
        <cdk-virtual-scroll-viewport\r
          #virtualScrollViewport\r
          [itemSize]="getMobileItemSize()"\r
          class="mobile-scroll"\r
        >\r
          <div\r
            *cdkVirtualFor="\r
              let canal of filteredChannels();\r
              let canalIndex = index;\r
              trackBy: trackByChannelId\r
            "\r
            class="mobile-channel"\r
          >\r
            <!-- Channel Header -->\r
            <div\r
              class="mobile-channel-header"\r
              (click)="onChannelToggle(canalIndex); $event.stopPropagation()"\r
            >\r
              <ng-container>\r
                <img\r
                  *ngIf="getChannelLogoUrl(canal)"\r
                  [src]="getChannelLogoUrl(canal)"\r
                  [alt]="canal.channel.name"\r
                  class="mobile-channel-logo"\r
                  loading="lazy"\r
                  (error)="onChannelLogoError($event)"\r
                />\r
                <span\r
                  class="mobile-channel-name channel-name-fallback"\r
                  [class.hidden]="getChannelLogoUrl(canal)"\r
                >\r
                  {{ canal.channel.name }}\r
                </span>\r
              </ng-container>\r
              <svg\r
                class="mobile-icon-sm mobile-chevron"\r
                [class.rotate-180]="isChannelExpanded(canalIndex)"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </div>\r
\r
            <!-- Programs List (Collapsible) -->\r
            <div\r
              class="mobile-programs-compact"\r
              [class.expanded]="isChannelExpanded(canalIndex)"\r
            >\r
              <div\r
                *ngFor="\r
                  let programa of getMobileVisiblePrograms(canal);\r
                  trackBy: trackByProgramId\r
                "\r
                (click)="\r
                  onProgramSelected(canalIndex, programa);\r
                  $event.stopPropagation()\r
                "\r
                class="mobile-program-card"\r
                [class.mobile-program-active]="\r
                  selectedProgram()?.id === programa.id\r
                "\r
              >\r
                <div class="mobile-program-header">
                  <h4 class="mobile-program-title">
                    {{ getProgramTitle(programa) }}
                  </h4>
                  <span class="mobile-program-time">
                    {{
                      getProgramLayout(programa).visibleStartTime
                    }}
                    -
                    {{
                      getProgramLayout(programa).visibleEndTime
                    }}
                  </span>
                </div>
                <span\r
                  *ngIf="programa?.category?.value"\r
                  class="mobile-category-badge"\r
                  [class]="getCategoryBadgeClasses(programa.category.value)"\r
                >\r
                  {{ getCategoryDisplayName(programa.category.value) }}\r
                </span>\r
              </div>\r
            </div>\r
          </div>\r
        </cdk-virtual-scroll-viewport>\r
      </div>\r
\r
      <!-- Bottom Header con controles -->\r
      <div class="mobile-bottom-header">\r
        <!-- Day Selector -->\r
        <div class="mobile-control">\r
          <button\r
            (click)="toggleDayDropdown(); $event.stopPropagation()"\r
            class="mobile-btn mobile-btn-primary"\r
          >\r
            <svg class="mobile-icon" fill="currentColor" viewBox="0 0 20 20">\r
              <path\r
                fill-rule="evenodd"\r
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
            <span class="mobile-text-truncate">{{\r
              getCurrentSelectedDay()\r
            }}</span>\r
            <svg\r
              class="mobile-icon-sm"\r
              [class.rotate-180]="isDayDropdownOpen()"\r
              fill="currentColor"\r
              viewBox="0 0 20 20"\r
            >\r
              <path\r
                fill-rule="evenodd"\r
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
          </button>\r
          <div\r
            *ngIf="isDayDropdownOpen()"\r
            class="mobile-dropdown mobile-dropdown-up"\r
            (click)="$event.stopPropagation()"\r
          >\r
            <button\r
              *ngFor="let dia of daysInfo(); let i = index"\r
              (click)="selectDay(i, $event)"\r
              [class.mobile-dropdown-active]="i === activeDay()"\r
              class="mobile-dropdown-item"\r
            >\r
              <div class="mobile-dropdown-content">\r
                <span class="mobile-dropdown-title">{{ dia.diaSemana }}</span>\r
                <span class="mobile-dropdown-subtitle">{{\r
                  dia.diaNumero\r
                }}</span>\r
              </div>\r
              <svg\r
                *ngIf="i === activeDay()"\r
                class="mobile-icon-sm mobile-check"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </button>\r
          </div>\r
        </div>\r
\r
        <!-- Time Slot Selector -->\r
        <div class="mobile-control">\r
          <button\r
            (click)="toggleTimeSlotDropdown(); $event.stopPropagation()"\r
            class="mobile-btn mobile-btn-secondary"\r
          >\r
            <svg class="mobile-icon" fill="currentColor" viewBox="0 0 20 20">\r
              <path\r
                fill-rule="evenodd"\r
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
            <span class="mobile-text-truncate">{{\r
              getCurrentSelectedTimeSlot()\r
            }}</span>\r
            <svg\r
              class="mobile-icon-sm"\r
              [class.rotate-180]="isTimeSlotDropdownOpen()"\r
              fill="currentColor"\r
              viewBox="0 0 20 20"\r
            >\r
              <path\r
                fill-rule="evenodd"\r
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
          </button>\r
          <div\r
            *ngIf="isTimeSlotDropdownOpen()"\r
            class="mobile-dropdown mobile-dropdown-up"\r
            (click)="$event.stopPropagation()"\r
          >\r
            <button\r
              *ngFor="let franja of currentTimeSlots(); let i = index"\r
              (click)="selectTimeSlot(i); $event.stopPropagation()"\r
              [class.mobile-dropdown-active]="franja[0] === currentTimeSlot()"\r
              class="mobile-dropdown-item"\r
            >\r
              <span>{{ franja[0] }} - {{ franja[franja.length - 1] }}</span>\r
              <svg\r
                *ngIf="franja[0] === currentTimeSlot()"\r
                class="mobile-icon-sm mobile-check"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </button>\r
          </div>\r
        </div>\r
\r
        <!-- Category Filter -->\r
        <button\r
          *ngIf="showCategoryFilter()"\r
          (click)="toggleCategoryDropdown(); $event.stopPropagation()"\r
          class="mobile-btn-icon"\r
        >\r
          <svg class="mobile-icon" fill="currentColor" viewBox="0 0 20 20">\r
            <path\r
              fill-rule="evenodd"\r
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"\r
              clip-rule="evenodd"\r
            ></path>\r
          </svg>\r
          <span *ngIf="selectedCategories().size > 0" class="mobile-badge">{{\r
            selectedCategories().size\r
          }}</span>\r
        </button>\r
        <div\r
          *ngIf="isCategoryDropdownOpen()"\r
          class="mobile-dropdown mobile-dropdown-up mobile-dropdown-right"\r
          (click)="$event.stopPropagation()"\r
        >\r
          <button\r
            (click)="selectCategory(null); $event.stopPropagation()"\r
            [class.mobile-dropdown-active]="isAllCategoriesSelected()"\r
            class="mobile-dropdown-item"\r
          >\r
            <span>Todas las categor\xEDas</span>\r
            <svg\r
              *ngIf="isAllCategoriesSelected()"\r
              class="mobile-icon-sm mobile-check"\r
              fill="currentColor"\r
              viewBox="0 0 20 20"\r
            >\r
              <path\r
                fill-rule="evenodd"\r
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
          </button>\r
          <button\r
            *ngFor="\r
              let category of availableCategories();\r
              trackBy: trackByCategory\r
            "\r
            (click)="selectCategory(category); $event.stopPropagation()"\r
            [class.mobile-dropdown-active]="isCategorySelected(category)"\r
            class="mobile-dropdown-item"\r
          >\r
            <span>{{ getCategoryDisplayName(category) }}</span>\r
            <svg\r
              *ngIf="isCategorySelected(category)"\r
              class="mobile-icon-sm mobile-check"\r
              fill="currentColor"\r
              viewBox="0 0 20 20"\r
            >\r
              <path\r
                fill-rule="evenodd"\r
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                clip-rule="evenodd"\r
              ></path>\r
            </svg>\r
          </button>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Modal para M\xF3vil -->\r
    <app-program-detail-modal\r
      *ngIf="selectedProgram() && modalChannelInfo()"\r
      [program]="selectedProgram()!"\r
      [channelName]="modalChannelInfo()!.channelName"\r
      [channelLogo]="modalChannelInfo()!.channelLogo"\r
      (close)="closeMobileProgram()"\r
    ></app-program-detail-modal>\r
  </ng-container>\r
\r
  <!-- ========================================== -->\r
  <!-- VERSI\xD3N DESKTOP (>= 768px) -->\r
  <!-- ========================================== -->\r
  <ng-container *ngIf="!isMobile()">\r
    <section class="pt-6 pb-4 px-4 lg:px-6 w-full min-h-screen">\r
      <!-- Controls Row -->\r
      <div class="mb-8 space-y-4 w-full">\r
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">\r
          <!-- Day Selector Dropdown -->\r
          <div class="relative dropdown-container">\r
            <button\r
              type="button"\r
              (click)="\r
                toggleDayDropdown();\r
                $event.stopPropagation();\r
                $event.preventDefault()\r
              "\r
              class="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white font-semibold hover:from-gray-700 hover:to-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"\r
            >\r
              <div class="flex items-center space-x-3">\r
                <svg\r
                  class="h-5 w-5 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"\r
                    clip-rule="evenodd"\r
                  ></path>\r
                </svg>\r
                <span>{{ getCurrentSelectedDay() }}</span>\r
              </div>\r
              <svg\r
                class="h-5 w-5 transition-transform duration-200"\r
                [class.rotate-180]="isDayDropdownOpen()"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </button>\r
            <div\r
              *ngIf="isDayDropdownOpen()"\r
              class="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-sm"\r
              style="z-index: 50"\r
            >\r
              <div class="py-2">\r
                <button\r
                  type="button"\r
                  *ngFor="\r
                    let dia of daysInfo();\r
                    let i = index;\r
                    trackBy: trackByDayIndex\r
                  "\r
                  (click)="selectDay(i, $event)"\r
                  [class]="getDayDropdownItemClasses(i)"\r
                  class="w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center space-x-3 text-white"\r
                >\r
                  <div class="flex-1">\r
                    <div class="font-medium text-base text-gray-100">\r
                      {{ dia.diaSemana }}\r
                    </div>\r
                    <div class="text-sm opacity-75 text-gray-300">\r
                      {{ dia.diaNumero }}\r
                    </div>\r
                  </div>\r
                  <svg\r
                    *ngIf="i === activeDay()"\r
                    class="h-5 w-5 text-red-400 flex-shrink-0"\r
                    fill="currentColor"\r
                    viewBox="0 0 20 20"\r
                  >\r
                    <path\r
                      fill-rule="evenodd"\r
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                      clip-rule="evenodd"\r
                    ></path>\r
                  </svg>\r
                </button>\r
              </div>\r
            </div>\r
          </div>\r
\r
          <!-- Category Filter Dropdown -->\r
          <div class="relative dropdown-container" *ngIf="showCategoryFilter()">\r
            <button\r
              (click)="toggleCategoryDropdown()"\r
              class="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white font-semibold hover:from-gray-700 hover:to-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"\r
            >\r
              <div class="flex items-center space-x-3">\r
                <svg\r
                  class="h-5 w-5 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"\r
                    clip-rule="evenodd"\r
                  ></path>\r
                </svg>\r
                <span>{{ getCategoryButtonText() }}</span>\r
                <span\r
                  *ngIf="selectedCategories().size > 0"\r
                  class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"\r
                >\r
                  {{ selectedCategories().size }}\r
                </span>\r
              </div>\r
              <svg\r
                class="h-5 w-5 transition-transform duration-200"\r
                [class.rotate-180]="isCategoryDropdownOpen()"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </button>\r
            <div\r
              *ngIf="isCategoryDropdownOpen()"\r
              class="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-sm"\r
              style="z-index: 50"\r
            >\r
              <div class="py-2">\r
                <button\r
                  (click)="selectCategory(null)"\r
                  [class]="getCategoryDropdownItemClasses(null)"\r
                  class="w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center justify-between text-white"\r
                >\r
                  <span class="text-gray-100">Todas las categor\xEDas</span>\r
                  <svg\r
                    *ngIf="isAllCategoriesSelected()"\r
                    class="h-5 w-5 text-red-400"\r
                    fill="currentColor"\r
                    viewBox="0 0 20 20"\r
                  >\r
                    <path\r
                      fill-rule="evenodd"\r
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                      clip-rule="evenodd"\r
                    ></path>\r
                  </svg>\r
                </button>\r
                <button\r
                  *ngFor="\r
                    let category of availableCategories();\r
                    trackBy: trackByCategory\r
                  "\r
                  (click)="selectCategory(category)"\r
                  [class]="getCategoryDropdownItemClasses(category)"\r
                  class="w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center justify-between text-white"\r
                >\r
                  <span class="text-gray-100">{{\r
                    getCategoryDisplayName(category)\r
                  }}</span>\r
                  <svg\r
                    *ngIf="isCategorySelected(category)"\r
                    class="h-5 w-5 text-red-400"\r
                    fill="currentColor"\r
                    viewBox="0 0 20 20"\r
                  >\r
                    <path\r
                      fill-rule="evenodd"\r
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                      clip-rule="evenodd"\r
                    ></path>\r
                  </svg>\r
                </button>\r
              </div>\r
            </div>\r
          </div>\r
\r
          <!-- Time Slot Dropdown -->\r
          <div class="relative dropdown-container">\r
            <button\r
              (click)="toggleTimeSlotDropdown()"\r
              class="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white font-semibold hover:from-gray-700 hover:to-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"\r
            >\r
              <div class="flex items-center space-x-3">\r
                <svg\r
                  class="h-5 w-5 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"\r
                    clip-rule="evenodd"\r
                  ></path>\r
                </svg>\r
                <span>{{ getCurrentSelectedTimeSlot() }}</span>\r
              </div>\r
              <svg\r
                class="h-5 w-5 transition-transform duration-200"\r
                [class.rotate-180]="isTimeSlotDropdownOpen()"\r
                fill="currentColor"\r
                viewBox="0 0 20 20"\r
              >\r
                <path\r
                  fill-rule="evenodd"\r
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"\r
                  clip-rule="evenodd"\r
                ></path>\r
              </svg>\r
            </button>\r
            <div\r
              *ngIf="isTimeSlotDropdownOpen()"\r
              class="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-sm"\r
              style="z-index: 50"\r
            >\r
              <div class="py-2">\r
                <button\r
                  *ngFor="\r
                    let franja of currentTimeSlots();\r
                    let i = index;\r
                    trackBy: trackByTimeSlot\r
                  "\r
                  (click)="selectTimeSlot(i)"\r
                  [class]="getTimeSlotDropdownItemClasses(franja[0])"\r
                  class="w-full text-left px-4 py-3 hover:bg-gray-700/80 transition-colors duration-200 flex items-center justify-between text-white"\r
                >\r
                  <span class="text-gray-100"\r
                    >{{ franja[0] }} - {{ franja[franja.length - 1] }}</span\r
                  >\r
                  <svg\r
                    *ngIf="franja[0] === currentTimeSlot()"\r
                    class="h-5 w-5 text-red-400"\r
                    fill="currentColor"\r
                    viewBox="0 0 20 20"\r
                  >\r
                    <path\r
                      fill-rule="evenodd"\r
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\r
                      clip-rule="evenodd"\r
                    ></path>\r
                  </svg>\r
                </button>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <!-- Programming Grid -->\r
      <div\r
        class="bg-gray-900 rounded-xl shadow-2xl overflow-hidden relative w-full"\r
      >\r
        <!-- Current Time Indicator -->\r
        <div\r
          *ngIf="showTimeIndicator()"\r
          class="absolute w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 shadow-2xl shadow-red-500/50 time-indicator pointer-events-none"\r
          [style.left.px]="timeIndicatorPositionPx()"\r
          [style.height]="'calc(100% - 60px)'"\r
          [style.top.px]="60"\r
          [style.z-index]="getTimeIndicatorZIndex()"\r
        >\r
          <div\r
            class="absolute -top-2 w-4 h-4 bg-red-500 rounded-full -translate-x-1.5 animate-pulse shadow-xl shadow-red-500/60 border-2 border-white pointer-events-none"\r
          >\r
            <div class="absolute inset-1 w-2 h-2 bg-white rounded-full"></div>\r
          </div>\r
          <div\r
            class="absolute -top-10 -translate-x-1/2 left-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl shadow-red-500/50 whitespace-nowrap border border-red-400/50 backdrop-blur-sm pointer-events-none"\r
          >\r
            {{ getCurrentTime() }}\r
          </div>\r
        </div>\r
\r
        <!-- Time Header -->\r
        <div\r
          class="sticky top-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-red-500/30 shadow-lg time-header"\r
          style="z-index: 40"\r
        >\r
          <div class="flex">\r
            <div\r
              class="w-32 lg:w-40 flex-shrink-0 bg-gray-800 border-r border-gray-600 p-3 flex items-center justify-center"\r
            >\r
              <span class="text-white font-semibold text-sm tracking-wide"\r
                >Canales</span\r
              >\r
            </div>\r
            <div class="flex-1 overflow-hidden">\r
              <div\r
                class="grid grid-cols-7 h-full w-full"\r
                style="display: grid !important"\r
              >\r
                <div\r
                  *ngFor="let hora of currentHours(); trackBy: trackByHour"\r
                  class="px-2 py-3 text-center border-r border-gray-600/50 last:border-r-0 hover:bg-gray-600/30 transition-colors duration-200 flex items-center justify-center"\r
                >\r
                  <span\r
                    class="text-white text-xs lg:text-sm font-medium tracking-wide whitespace-nowrap"\r
                    >{{ hora }}</span\r
                  >\r
                </div>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
\r
        <!-- Programs Content with Virtual Scrolling -->\r
        <div class="relative overflow-hidden" style="height: 700px">\r
          <!-- Error State -->\r
          <div *ngIf="uiState().hasError" class="p-8 text-center text-red-400">\r
            <h3 class="text-lg font-semibold mb-2">\r
              Error al cargar la programaci\xF3n\r
            </h3>\r
            <p class="text-gray-400 mb-4">{{ error() }}</p>\r
            <button\r
              (click)="facade.refreshData()"\r
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"\r
            >\r
              Reintentar\r
            </button>\r
          </div>\r
\r
          <!-- Empty State -->\r
          <div\r
            *ngIf="uiState().showEmpty"\r
            class="p-8 text-center text-gray-400"\r
          >\r
            <h3 class="text-lg font-semibold mb-2">\r
              No hay programaci\xF3n disponible\r
            </h3>\r
            <p class="text-gray-400">\r
              No se encontraron programas para mostrar.\r
            </p>\r
          </div>\r
\r
          <!-- Programs List with CDK Virtual Scrolling -->\r
          <cdk-virtual-scroll-viewport\r
            *ngIf="uiState().showContent"\r
            #virtualScrollViewport\r
            [itemSize]="getItemSize()"\r
            class="h-full"\r
          >\r
            <div class="overflow-hidden">\r
              <div\r
                *cdkVirtualFor="\r
                  let canal of filteredChannels();\r
                  let canalIndex = index;\r
                  trackBy: trackByChannelId\r
                "\r
                class="channel-row border-b border-gray-700 last:border-b-0 hover:bg-gray-800/30 transition-colors duration-200"\r
                [style.height.px]="getChannelHeight(canal, canalIndex)"\r
              >\r
                <!-- Channel Row -->\r
                <div class="flex channel-programs-container h-full">\r
                  <!-- Channel Logo (Fixed) -->\r
                  <div\r
                    class="w-32 lg:w-40 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 border-r border-gray-600 p-3 flex items-center justify-center cursor-pointer"\r
                    (click)="onChannelToggle(canalIndex)"\r
                  >\r
                    <div\r
                      class="relative w-full h-16 flex items-center justify-center"\r
                    >\r
                      <img\r
                        *ngIf="getChannelLogoUrl(canal)"\r
                        [src]="getChannelLogoUrl(canal)"\r
                        [alt]="canal.channel.name + ' logo'"\r
                        class="max-w-full max-h-full object-contain rounded-lg bg-white/5 p-1 shadow-lg transition-transform duration-300"\r
                        [class.scale-105]="isChannelExpanded(canalIndex)"\r
                        loading="lazy"\r
                        (error)="onChannelLogoError($event)"\r
                      />\r
                      <div\r
                        class="channel-name-fallback text-white text-center font-medium text-sm leading-tight break-words px-2"\r
                        [class.hidden]="getChannelLogoUrl(canal)"\r
                      >\r
                        {{ canal.channel.name }}\r
                      </div>\r
                    </div>\r
                  </div>\r
\r
                  <!-- Programs Row -->\r
                  <!-- Programs Row -->\r
                  <div class="flex-1 programs-container relative">\r
                    <!-- DEBUG: Mostrar info del canal -->\r
                    <!-- <div\r
                      *ngIf="getProgramLayers(canal).length > 0"\r
                      class="absolute top-0 left-0 text-xs text-yellow-400 z-50 bg-black/80 p-1 rounded"\r
                    >\r
                      Canal: {{ canal.channel.name }} | Layers:\r
                      {{ getProgramLayers(canal).length }} | Programs:\r
                      {{ getProgramLayers(canal).reduce((sum, layer) => sum + layer.length, 0) }}\r
                    </div> -->\r
\r
                    <div\r
                      class="programs-grid w-full h-full relative"\r
                      [style.display]="'grid'"\r
                      [style.gridTemplateColumns]="gridTemplateColumns"\r
                      [style.gridTemplateRows]="\r
                        'repeat(' + getLayerCount(canal) + ', 75px)'\r
                      "\r
                    >\r
                      <ng-container\r
                        *ngFor="\r
                          let layer of getProgramLayers(canal);\r
                          let layerIndex = index\r
                        "\r
                      >\r
                        <div\r
                          *ngFor="\r
                            let programa of layer;\r
                            let i = index;\r
                            trackBy: trackByProgramId\r
                          "\r
                          class="border-r border-gray-600/30 cursor-pointer hover:bg-red-600/20 transition-all duration-200 group bg-gray-800/60 overflow-hidden relative"\r
                          [style.gridColumnStart]="
                            getProgramLayout(programa).gridColumnStart
                          "
                          [style.gridColumnEnd]="
                            getProgramLayout(programa).gridColumnEnd
                          "
                          [style.gridRow]="layerIndex + 1"
                          [style.zIndex]="15 + layerIndex"
                          [ngClass]="{
                            'program-cut-start': getProgramLayout(programa).isCutAtStart,
                            'program-cut-end': getProgramLayout(programa).isCutAtEnd
                          }"
                          (click)="\r
                            onProgramSelected(canalIndex, programa);\r
                            $event.stopPropagation()\r
                          "\r
                          [attr.title]="getProgramTitle(programa)"\r
                        >\r
                          <div\r
                            class="h-full p-1.5 flex flex-col justify-between overflow-hidden relative"\r
                          >\r
                            <!-- Indicador de corte inicio -->\r
                            <div\r
                              *ngIf="getProgramLayout(programa).isCutAtStart"
                              class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 opacity-75"\r
                            ></div>\r
\r
                            <!-- Indicador de corte final -->\r
                            <div\r
                              *ngIf="getProgramLayout(programa).isCutAtEnd"
                              class="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 opacity-75"\r
                            ></div>\r
\r
                            <!-- Program Title and Time -->\r
                            <div class="flex-1 min-h-0">\r
                              <h3\r
                                class="text-white text-xs font-medium line-clamp-1 leading-tight group-hover:text-red-200 transition-colors"\r
                              >\r
                                <span\r
                                  *ngIf="getProgramLayout(programa).isCutAtStart"
                                  class="text-yellow-400 mr-1"\r
                                  >\u21BB</span\r
                                >\r
                                {{ getProgramTitle(programa) }}\r
                                <span\r
                                  *ngIf="getProgramLayout(programa).isCutAtEnd"\r
                                  class="text-yellow-400 ml-1"\r
                                  >\u21BB</span\r
                                >\r
                              </h3>\r
                              <p\r
                                class="text-gray-400 text-xs group-hover:text-red-300 transition-colors mt-0.5"\r
                              >\r
                                <span\r
                                  [class.text-yellow-300]="
                                    getProgramLayout(programa).isCutAtStart
                                  "
                                  >{{
                                    getProgramLayout(programa).visibleStartTime
                                  }}</span
                                >\r
                                -\r
                                <span\r
                                  [class.text-yellow-300]="
                                    getProgramLayout(programa).isCutAtEnd
                                  "
                                  >{{
                                    getProgramLayout(programa).visibleEndTime
                                  }}</span
                                >\r
                              </p>\r
                            </div>\r
\r
                            <!-- Program Category Badge -->\r
                            <div *ngIf="programa?.category?.value" class="mt-1">\r
                              <span\r
                                class="inline-block px-1.5 py-0.5 text-xs rounded-full truncate max-w-full leading-tight"\r
                                [class]="\r
                                  getCategoryBadgeClasses(\r
                                    programa.category.value\r
                                  )\r
                                "\r
                              >\r
                                {{\r
                                  getCategoryDisplayName(\r
                                    programa.category.value\r
                                  )\r
                                }}\r
                              </span>\r
                            </div>\r
                          </div>\r
                        </div>\r
                      </ng-container>\r
                    </div>\r
                  </div>\r
                </div>\r
\r
                <!-- Expanded Channel Banner (Desktop inline) -->\r
                <div\r
                  *ngIf="isChannelExpanded(canalIndex) && selectedProgram()"\r
                  class="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 shadow-2xl relative"\r
                  style="z-index: 60"\r
                  [@expandCollapse]="'expanded'"\r
                >\r
                  <div class="p-4">\r
                    <app-banner\r
                      [data]="getSelectedProgramBannerData()"\r
                    ></app-banner>\r
                  </div>\r
                </div>\r
              </div>\r
            </div>\r
          </cdk-virtual-scroll-viewport>\r
        </div>\r
      </div>\r
\r
      <!-- Mobile Bottom Navigation (Oculto en desktop >= 1024px) -->\r
      <div\r
        class="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 z-40 lg:hidden"\r
        *ngIf="uiState().showContent"\r
      >\r
        <div class="flex justify-around items-center">\r
          <button\r
            class="flex flex-col items-center text-gray-400 hover:text-white transition-colors"\r
          >\r
            <svg\r
              class="w-6 h-6 mb-1"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"\r
              ></path>\r
            </svg>\r
            <span class="text-xs">Filtrar</span>\r
          </button>\r
          <button\r
            (click)="scrollToNow()"\r
            class="flex flex-col items-center text-gray-400 hover:text-white transition-colors"\r
            *ngIf="activeDay() === 0"\r
          >\r
            <svg\r
              class="w-6 h-6 mb-1"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"\r
              ></path>\r
            </svg>\r
            <span class="text-xs">Ahora</span>\r
          </button>\r
          <button\r
            (click)="previousTimeSlot()"\r
            class="flex flex-col items-center text-gray-400 hover:text-white transition-colors"\r
            [disabled]="activeTimeSlot() === 0"\r
          >\r
            <svg\r
              class="w-6 h-6 mb-1"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M15 19l-7-7 7-7"\r
              ></path>\r
            </svg>\r
            <span class="text-xs">Anterior</span>\r
          </button>\r
          <button\r
            (click)="nextTimeSlot()"\r
            class="flex flex-col items-center text-gray-400 hover:text-white transition-colors"\r
            [disabled]="activeTimeSlot() === 7"\r
          >\r
            <svg\r
              class="w-6 h-6 mb-1"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M9 5l7 7-7 7"\r
              ></path>\r
            </svg>\r
            <span class="text-xs">Siguiente</span>\r
          </button>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Modal para Desktop (adaptado con estilos desktop) -->\r
    <app-program-detail-modal\r
      *ngIf="selectedProgram() && modalChannelInfo()"\r
      [program]="selectedProgram()!"\r
      [channelName]="modalChannelInfo()!.channelName"\r
      [channelLogo]="modalChannelInfo()!.channelLogo"\r
      (close)="closeMobileProgram()"\r
      class="desktop-modal"\r
    ></app-program-detail-modal>\r
  </ng-container>\r
</ng-container>\r
\r
\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/components/program-list/program-list.component.scss */\n.mobile-tv-guide {\n  display: none;\n}\n@media (max-width: 767px) {\n  .mobile-tv-guide {\n    display: flex !important;\n    flex-direction: column;\n    height: 100vh;\n    background:\n      linear-gradient(\n        to bottom,\n        #111827,\n        #000);\n    overflow: hidden;\n    -webkit-overflow-scrolling: touch;\n    visibility: visible !important;\n    opacity: 1 !important;\n  }\n}\n.desktop-tv-guide {\n  display: block;\n}\n@media (max-width: 767px) {\n  .desktop-tv-guide {\n    display: none !important;\n  }\n}\n.mobile-bottom-header {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  z-index: 100;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(55, 65, 81, 0.3);\n  padding: 0.75rem;\n  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));\n  display: grid;\n  grid-template-columns: 1fr 1fr auto;\n  gap: 0.5rem;\n  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);\n}\n.mobile-control {\n  position: relative;\n}\n.mobile-btn {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  padding: 0.75rem;\n  border-radius: 0.75rem;\n  font-weight: 600;\n  font-size: 0.875rem;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  background: rgba(31, 41, 55, 0.8);\n  color: white;\n  min-height: 44px;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n}\n.mobile-btn:active {\n  transform: scale(0.98);\n}\n.mobile-btn-primary {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #dc2626);\n  border-color: #ef4444;\n}\n.mobile-btn-primary:active {\n  background:\n    linear-gradient(\n      135deg,\n      #dc2626,\n      rgb(200.2083333333, 32.2916666667, 32.2916666667));\n}\n.mobile-btn-secondary {\n  background: rgba(31, 41, 55, 0.9);\n  border-color: rgba(55, 65, 81, 0.5);\n}\n.mobile-btn-secondary:active {\n  background: #1f2937;\n}\n.mobile-btn-icon {\n  position: relative;\n  width: 44px;\n  height: 44px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 0.75rem;\n  background: rgba(31, 41, 55, 0.8);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  color: white;\n  -webkit-tap-highlight-color: transparent;\n}\n.mobile-btn-icon:active {\n  transform: scale(0.95);\n}\n.mobile-icon {\n  width: 18px;\n  height: 18px;\n  flex-shrink: 0;\n  color: rgba(255, 255, 255, 0.9);\n}\n.mobile-icon-sm {\n  width: 16px;\n  height: 16px;\n  flex-shrink: 0;\n  transition: transform 0.2s ease;\n}\n.mobile-icon-sm.rotate-180 {\n  transform: rotate(180deg);\n}\n.mobile-check {\n  color: #ef4444;\n}\n.mobile-chevron {\n  color: rgba(255, 255, 255, 0.6);\n}\n.mobile-text-truncate {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n}\n.mobile-badge {\n  position: absolute;\n  top: -4px;\n  right: -4px;\n  min-width: 18px;\n  height: 18px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #ef4444;\n  color: white;\n  border-radius: 9px;\n  font-size: 0.625rem;\n  font-weight: 700;\n  padding: 0 4px;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n}\n.mobile-dropdown {\n  position: absolute;\n  z-index: 200;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(16px);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(55, 65, 81, 0.3);\n  border-radius: 0.75rem;\n  max-height: 280px;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  box-shadow: 0 -12px 24px rgba(0, 0, 0, 0.3);\n  bottom: calc(100% + 0.5rem);\n  left: 0;\n  right: 0;\n}\n.mobile-dropdown::-webkit-scrollbar {\n  width: 4px;\n}\n.mobile-dropdown::-webkit-scrollbar-track {\n  background: transparent;\n}\n.mobile-dropdown::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 2px;\n}\n.mobile-dropdown-right {\n  left: auto;\n  right: 0;\n  min-width: 200px;\n}\n.mobile-dropdown-up {\n  top: auto;\n  bottom: calc(100% + 0.5rem);\n}\n.mobile-dropdown-item {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.875rem;\n  color: rgba(255, 255, 255, 0.9);\n  font-size: 0.875rem;\n  transition: background-color 0.15s ease;\n  border-bottom: 1px solid rgba(55, 65, 81, 0.15);\n  min-height: 48px;\n  -webkit-tap-highlight-color: transparent;\n}\n.mobile-dropdown-item:last-child {\n  border-bottom: none;\n}\n.mobile-dropdown-item:active {\n  background: rgba(31, 41, 55, 0.5);\n}\n.mobile-dropdown-item.mobile-dropdown-active {\n  background: rgba(239, 68, 68, 0.15);\n  color: white;\n  font-weight: 600;\n}\n.mobile-dropdown-content {\n  display: flex;\n  flex-direction: column;\n  gap: 0.125rem;\n  flex: 1;\n}\n.mobile-dropdown-title {\n  font-weight: 600;\n  color: white;\n}\n.mobile-dropdown-subtitle {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.6);\n}\n.mobile-content {\n  flex: 1;\n  margin-bottom: 120px;\n  overflow: hidden;\n}\n.mobile-scroll {\n  height: 100%;\n  width: 100%;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  scroll-behavior: smooth;\n}\n.mobile-loading {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: calc(100vh - 120px);\n  gap: 1rem;\n}\n.mobile-spinner {\n  width: 48px;\n  height: 48px;\n  border: 3px solid rgba(239, 68, 68, 0.2);\n  border-top-color: #ef4444;\n  border-radius: 50%;\n  animation: spin 1s linear infinite;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.mobile-loading-text {\n  color: rgba(255, 255, 255, 0.7);\n  font-size: 0.875rem;\n}\n.mobile-error {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: calc(100vh - 120px);\n  gap: 1rem;\n  padding: 2rem;\n  text-align: center;\n}\n.mobile-error-title {\n  color: #ef4444;\n  font-size: 1.125rem;\n  font-weight: 700;\n}\n.mobile-error-text {\n  color: rgba(255, 255, 255, 0.6);\n  font-size: 0.875rem;\n}\n.mobile-channel {\n  background: rgba(31, 41, 55, 0.4);\n  border-bottom: 1px solid rgba(55, 65, 81, 0.2);\n}\n.mobile-channel:last-child {\n  border-bottom: none;\n}\n.mobile-channel-header {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.875rem;\n  background: rgba(31, 41, 55, 0.6);\n  border-bottom: 1px solid rgba(55, 65, 81, 0.2);\n  -webkit-tap-highlight-color: transparent;\n  min-height: 56px;\n}\n.mobile-channel-header:active {\n  background: rgba(31, 41, 55, 0.8);\n}\n.mobile-channel-logo {\n  width: 48px;\n  height: 32px;\n  object-fit: contain;\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 0.375rem;\n  padding: 0.25rem;\n}\n.mobile-channel-name {\n  flex: 1;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: white;\n}\n.mobile-programs-compact {\n  display: none;\n  flex-direction: column;\n}\n.mobile-programs-compact.expanded {\n  display: flex;\n}\n.mobile-program-card {\n  padding: 0.875rem;\n  border-bottom: 1px solid rgba(55, 65, 81, 0.1);\n  transition: background-color 0.15s ease;\n  -webkit-tap-highlight-color: transparent;\n  min-height: 68px;\n}\n.mobile-program-card:last-child {\n  border-bottom: none;\n}\n.mobile-program-card:active {\n  background: rgba(31, 41, 55, 0.5);\n}\n.mobile-program-card.mobile-program-active {\n  background: rgba(239, 68, 68, 0.1);\n  border-left: 3px solid #ef4444;\n  padding-left: calc(0.875rem - 3px);\n}\n.mobile-program-header {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  margin-bottom: 0.5rem;\n}\n.mobile-program-title {\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: white;\n  line-height: 1.3;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n.mobile-program-time {\n  font-size: 0.75rem;\n  color: rgba(255, 255, 255, 0.6);\n  font-weight: 500;\n}\n.mobile-category-badge {\n  display: inline-block;\n  padding: 0.25rem 0.5rem;\n  font-size: 0.625rem;\n  font-weight: 600;\n  border-radius: 0.375rem;\n  text-transform: uppercase;\n  letter-spacing: 0.025em;\n}\n.mobile-program-details {\n  position: fixed;\n  bottom: 120px;\n  left: 0;\n  right: 0;\n  z-index: 90;\n  padding: 0.875rem;\n  background: rgba(17, 24, 39, 0.98);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(55, 65, 81, 0.2);\n  max-height: 50vh;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  animation: slideUp 0.3s ease-out;\n  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);\n}\n@keyframes slideUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n* {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  backface-visibility: hidden;\n}\n.mobile-scroll,\n.mobile-dropdown {\n  transform: translateZ(0);\n  will-change: scroll-position;\n}\n.mobile-btn,\n.mobile-program-card,\n.mobile-channel-header {\n  transform: translateZ(0);\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .mobile-bottom-header {\n    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));\n  }\n  .mobile-program-details {\n    bottom: calc(120px + env(safe-area-inset-bottom));\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n@media (prefers-contrast: high) {\n  .mobile-channel,\n  .mobile-program-card {\n    border: 1px solid currentColor;\n  }\n  .mobile-btn {\n    border-width: 2px;\n  }\n}\n@media (orientation: landscape) and (max-height: 500px) {\n  .mobile-bottom-header {\n    padding: 0.5rem;\n    gap: 0.375rem;\n  }\n  .mobile-btn {\n    padding: 0.5rem;\n    font-size: 0.75rem;\n    min-height: 36px;\n  }\n  .mobile-program-card {\n    padding: 0.625rem;\n    min-height: 56px;\n  }\n  .mobile-program-details {\n    max-height: 40vh;\n  }\n}\n@media (min-width: 768px) {\n  .mobile-tv-guide {\n    display: none !important;\n  }\n  .desktop-tv-guide {\n    display: block !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .mobile-tv-guide {\n    background:\n      linear-gradient(\n        to bottom,\n        #0a0a0a,\n        #000);\n  }\n  .mobile-bottom-header {\n    background: rgba(10, 10, 10, 0.98);\n  }\n}\n@media (hover: none) and (pointer: coarse) {\n  .mobile-btn,\n  .mobile-dropdown-item,\n  .mobile-program-card,\n  .mobile-channel-header {\n    min-height: 48px;\n  }\n  .mobile-btn:active,\n  .mobile-program-card:active,\n  .mobile-channel-header:active {\n    opacity: 0.8;\n  }\n}\n.mobile-scroll,\n.mobile-program-details {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.4) transparent;\n}\n.mobile-scroll::-webkit-scrollbar,\n.mobile-program-details::-webkit-scrollbar {\n  width: 4px;\n}\n.mobile-scroll::-webkit-scrollbar-track,\n.mobile-program-details::-webkit-scrollbar-track {\n  background: transparent;\n}\n.mobile-scroll::-webkit-scrollbar-thumb,\n.mobile-program-details::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.4);\n  border-radius: 2px;\n}\n.mobile-scroll::-webkit-scrollbar-thumb:hover,\n.mobile-program-details::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.6);\n}\n.hidden {\n  display: none !important;\n}\n.channel-name-fallback.hidden {\n  display: none;\n}\n.mobile-tv-guide {\n  display: none !important;\n}\n@media (max-width: 767px) {\n  .mobile-tv-guide {\n    display: flex !important;\n  }\n}\n@media (min-width: 768px) {\n  .mobile-tv-guide {\n    display: none !important;\n  }\n}\n.programs-grid {\n  display: grid !important;\n  gap: 0 !important;\n  grid-auto-rows: 75px !important;\n  width: 100% !important;\n  overflow: visible !important;\n  min-height: 75px !important;\n  position: relative !important;\n}\n.programs-grid > div {\n  width: auto !important;\n  min-width: 0 !important;\n  max-width: 100% !important;\n  position: relative !important;\n  display: block !important;\n  height: 75px !important;\n  overflow: hidden !important;\n  box-sizing: border-box !important;\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.programs-grid > div > div {\n  display: flex !important;\n  flex-direction: column !important;\n  height: 100% !important;\n  width: 100% !important;\n}\n.programs-container {\n  overflow: visible !important;\n  position: relative !important;\n  flex: 1;\n  min-width: 0;\n}\n.programs-container .programs-grid {\n  position: relative !important;\n  width: 100% !important;\n  height: 100% !important;\n}\n.channel-programs-container {\n  position: relative !important;\n  display: flex !important;\n  min-height: 75px !important;\n  overflow: visible !important;\n  isolation: isolate;\n}\n.channel-programs-container > * {\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.channel-row {\n  border-bottom: 1px solid rgba(75, 85, 99, 0.4) !important;\n  isolation: isolate;\n  min-height: 75px !important;\n  position: relative !important;\n  display: block !important;\n  visibility: visible !important;\n}\n.channel-row * {\n  visibility: inherit;\n}\n.channel-row:last-child {\n  border-bottom: none !important;\n}\ndiv[class*=border-r][class*=cursor-pointer] {\n  visibility: visible !important;\n  opacity: 1 !important;\n  display: block !important;\n}\ndiv[class*=border-r][class*=cursor-pointer] > div {\n  visibility: visible !important;\n  opacity: 1 !important;\n  display: flex !important;\n}\ncdk-virtual-scroll-viewport {\n  contain: layout style paint !important;\n  will-change: scroll-position;\n  scroll-behavior: smooth;\n  -webkit-overflow-scrolling: touch;\n  width: 100% !important;\n  overflow-y: auto !important;\n  overflow-x: hidden !important;\n}\ncdk-virtual-scroll-viewport .cdk-virtual-scroll-content-wrapper {\n  width: 100% !important;\n  contain: layout style !important;\n}\ncdk-virtual-scroll-viewport .cdk-virtual-scroll-content-wrapper > * {\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n.time-header {\n  position: sticky !important;\n  top: 0 !important;\n  z-index: 40 !important;\n  background:\n    linear-gradient(\n      to right,\n      #1f2937,\n      #374151,\n      #1f2937) !important;\n}\n.time-header .grid {\n  display: grid !important;\n  grid-template-columns: repeat(7, 1fr) !important;\n  width: 100% !important;\n}\n.time-header .grid > div {\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  visibility: visible !important;\n}\n.programs-grid {\n  grid-template-columns: repeat(42, minmax(0, 1fr)) !important;\n}\n.programs-grid > div[style*=grid-column-start] {\n  min-width: 10px !important;\n  visibility: visible !important;\n  opacity: 1 !important;\n}\n@media (min-width: 768px) {\n  .programs-grid,\n  .programs-container,\n  .channel-programs-container,\n  .channel-row {\n    visibility: visible !important;\n    opacity: 1 !important;\n  }\n  .programs-grid {\n    grid-template-columns: repeat(42, minmax(15px, 1fr)) !important;\n  }\n}\n@media (min-width: 1024px) {\n  .programs-grid {\n    grid-template-columns: repeat(42, minmax(20px, 1fr)) !important;\n  }\n}\n@media (min-width: 1440px) {\n  .programs-grid {\n    grid-template-columns: repeat(42, minmax(25px, 1fr)) !important;\n  }\n}\n.time-header {\n  z-index: 40 !important;\n}\n.dropdown-container {\n  z-index: 50 !important;\n}\n.time-indicator {\n  z-index: 30 !important;\n}\n.time-indicator.time-indicator-priority {\n  z-index: 10000 !important;\n}\n.channel-row {\n  z-index: 1 !important;\n}\n.programs-grid {\n  z-index: auto !important;\n}\n.programs-grid > div {\n  z-index: auto !important;\n}\n.programs-grid > div:hover {\n  z-index: 20 !important;\n}\n/*# sourceMappingURL=program-list.component.css.map */\n'] }]
  }], null, { dayChanged: [{
    type: Output
  }], categorySelected: [{
    type: Output
  }], virtualScrollViewport: [{
    type: ViewChild,
    args: ["virtualScrollViewport"]
  }], onScroll: [{
    type: HostListener,
    args: ["scroll", ["$event"]]
  }], onDocumentClick: [{
    type: HostListener,
    args: ["document:click", ["$event"]]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProgramListComponent, { className: "ProgramListComponent", filePath: "src/app/components/program-list/program-list.component.ts", lineNumber: 100 });
})();

// src/app/pages/home/home.component.ts
function HomeComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9)(2, "div", 10);
    \u0275\u0275element(3, "div", 11)(4, "div", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 13)(6, "h2", 14);
    \u0275\u0275text(7, " Cargando Gu\xEDa TV ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p", 15);
    \u0275\u0275text(9, " Obteniendo la programaci\xF3n m\xE1s actualizada de todos los canales... ");
    \u0275\u0275elementEnd()()()();
  }
}
function HomeComponent_div_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "div", 17)(2, "div", 18);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 19);
    \u0275\u0275element(4, "path", 20);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "h2", 21);
    \u0275\u0275text(6, " Error al cargar los datos ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 22);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 23);
    \u0275\u0275listener("click", function HomeComponent_div_6_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onRetry());
    });
    \u0275\u0275elementStart(10, "span", 24);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 25);
    \u0275\u0275element(12, "path", 26);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "span");
    \u0275\u0275text(14, "Reintentar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.error());
  }
}
function HomeComponent_main_7_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 81)(1, "div", 82)(2, "div", 83)(3, "div", 84)(4, "div", 85);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 86);
    \u0275\u0275element(6, "path", 87);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "div", 88)(8, "p", 89);
    \u0275\u0275text(9, " Filtrando por categor\xEDa ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "p", 90);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "button", 91);
    \u0275\u0275listener("click", function HomeComponent_main_7_div_1_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.clearCategoryFilter());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 92);
    \u0275\u0275element(14, "path", 93);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "span", 94);
    \u0275\u0275text(16, "Limpiar filtro");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "span", 95);
    \u0275\u0275text(18, "Limpiar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(11);
    \u0275\u0275textInterpolate1(" ", ctx_r1.selectedCategory(), " ");
  }
}
function HomeComponent_main_7_section_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 96)(1, "app-banner", 97);
    \u0275\u0275listener("movieSelected", function HomeComponent_main_7_section_2_Template_app_banner_movieSelected_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onMovieSelected($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("data", ctx_r1.getBannerData());
  }
}
function HomeComponent_main_7_section_171_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 98)(1, "div", 44)(2, "header", 99)(3, "h3", 63);
    \u0275\u0275text(4, " Estad\xEDsticas de ");
    \u0275\u0275elementStart(5, "span", 100);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "p", 101);
    \u0275\u0275text(8, " Resumen de la programaci\xF3n filtrada por esta categor\xEDa ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 102)(10, "div", 103)(11, "div", 104);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(12, "svg", 105);
    \u0275\u0275element(13, "path", 106);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "p", 107);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "p", 108);
    \u0275\u0275text(17, " Programas ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div", 109)(19, "div", 110);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(20, "svg", 111);
    \u0275\u0275element(21, "path", 58);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(22, "p", 112);
    \u0275\u0275text(23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "p", 108);
    \u0275\u0275text(25, " Canales ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(26, "div", 113)(27, "div", 114);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(28, "svg", 115);
    \u0275\u0275element(29, "path", 53);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(30, "p", 116);
    \u0275\u0275text(31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "p", 108);
    \u0275\u0275text(33, " En Emisi\xF3n ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(34, "div", 117)(35, "div", 118);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(36, "svg", 119);
    \u0275\u0275element(37, "path", 60);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(38, "p", 120);
    \u0275\u0275text(39);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(40, "p", 108);
    \u0275\u0275text(41, " Pr\xF3ximo ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", ctx_r1.selectedCategory(), " ");
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getCategoryProgramCount(), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getCategoryChannelCount(), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getCurrentCategoryPrograms(), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getNextCategoryProgram(), " ");
  }
}
function HomeComponent_main_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "main", 27);
    \u0275\u0275template(1, HomeComponent_main_7_div_1_Template, 19, 1, "div", 28)(2, HomeComponent_main_7_section_2_Template, 2, 1, "section", 29);
    \u0275\u0275elementStart(3, "section", 30)(4, "div", 31)(5, "h1", 32);
    \u0275\u0275text(6, " Gu\xEDa de Programaci\xF3n TV Espa\xF1a ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 33);
    \u0275\u0275text(8, " Consulta toda la ");
    \u0275\u0275elementStart(9, "strong");
    \u0275\u0275text(10, "programaci\xF3n de televisi\xF3n");
    \u0275\u0275elementEnd();
    \u0275\u0275text(11, " actualizada en tiempo real. La mejor ");
    \u0275\u0275elementStart(12, "strong");
    \u0275\u0275text(13, "gu\xEDa TV");
    \u0275\u0275elementEnd();
    \u0275\u0275text(14, " para todos los canales espa\xF1oles. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div", 34)(16, "div", 35)(17, "div", 36);
    \u0275\u0275text(18, " 100+ ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 37);
    \u0275\u0275text(20, "Canales");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "div", 35)(22, "div", 38);
    \u0275\u0275text(23, " 24/7 ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "div", 37);
    \u0275\u0275text(25, "Actualizado");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(26, "div", 39)(27, "div", 40);
    \u0275\u0275text(28, " Gratis ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 37);
    \u0275\u0275text(30, "100% Gratuito");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(31, "section", 41)(32, "app-program-list", 42);
    \u0275\u0275listener("dayChanged", function HomeComponent_main_7_Template_app_program_list_dayChanged_32_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDayChanged($event));
    })("categorySelected", function HomeComponent_main_7_Template_app_program_list_categorySelected_32_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCategorySelected($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(33, "section", 43)(34, "div", 44)(35, "header", 45)(36, "h2", 46);
    \u0275\u0275text(37, " Tu Gu\xEDa Completa de ");
    \u0275\u0275elementStart(38, "span", 47);
    \u0275\u0275text(39, "Televisi\xF3n en Espa\xF1a");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(40, "p", 48);
    \u0275\u0275text(41, " Descubre toda la programaci\xF3n TV de los principales canales espa\xF1oles. Informaci\xF3n detallada, sinopsis, horarios y mucho m\xE1s en la mejor ");
    \u0275\u0275elementStart(42, "strong");
    \u0275\u0275text(43, "gu\xEDa televisi\xF3n online");
    \u0275\u0275elementEnd();
    \u0275\u0275text(44, ". ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(45, "div", 49)(46, "article", 50)(47, "h3", 51);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(48, "svg", 52);
    \u0275\u0275element(49, "path", 53);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(50, "span", 54);
    \u0275\u0275text(51, "Canales Principales");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(52, "div", 55)(53, "p")(54, "strong", 56);
    \u0275\u0275text(55, "Canales Nacionales:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(56, " La 1, La 2, Antena 3, Cuatro, Telecinco, La Sexta ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(57, "p")(58, "strong", 56);
    \u0275\u0275text(59, "Auton\xF3micos:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(60, " TV3, ETB, Canal Sur, Telemadrid, \xC0 Punt, TVG ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(61, "p")(62, "strong", 56);
    \u0275\u0275text(63, "Tem\xE1ticos:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(64, " Neox, Nova, Mega, FDF, Energy, Divinity, Be Mad ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(65, "p")(66, "strong", 56);
    \u0275\u0275text(67, "Infantiles:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(68, " Clan, Disney Channel, Nickelodeon, Boing ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(69, "article", 57)(70, "h3", 51);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(71, "svg", 52);
    \u0275\u0275element(72, "path", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275text(73, " Contenido por Categor\xEDas ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(74, "div", 55)(75, "p")(76, "strong", 56);
    \u0275\u0275text(77, "Pel\xEDculas:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(78, " Estrenos, cine espa\xF1ol, cl\xE1sicos, blockbusters internacionales ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(79, "p")(80, "strong", 56);
    \u0275\u0275text(81, "Series:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(82, " Dramas, comedias, thrillers, series espa\xF1olas e internacionales ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(83, "p")(84, "strong", 56);
    \u0275\u0275text(85, "Deportes:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(86, " F\xFAtbol, baloncesto, tenis, motor, olimpiadas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(87, "p")(88, "strong", 56);
    \u0275\u0275text(89, "Documentales:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(90, " Naturaleza, historia, ciencia, biograf\xEDas ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(91, "p")(92, "strong", 56);
    \u0275\u0275text(93, "Entretenimiento:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(94, " Reality shows, talent shows, programas de actualidad ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(95, "article", 59)(96, "h3", 51);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(97, "svg", 52);
    \u0275\u0275element(98, "path", 60);
    \u0275\u0275elementEnd();
    \u0275\u0275text(99, " Programaci\xF3n por Horas ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(100, "div", 55)(101, "p")(102, "strong", 56);
    \u0275\u0275text(103, "Prime Time (20:00-00:00):");
    \u0275\u0275elementEnd();
    \u0275\u0275text(104, " Las mejores pel\xEDculas, series de estreno y programas principales ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(105, "p")(106, "strong", 56);
    \u0275\u0275text(107, "Ma\xF1ana (06:00-14:00):");
    \u0275\u0275elementEnd();
    \u0275\u0275text(108, " Informativos, magazines matinales y programas de debate ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(109, "p")(110, "strong", 56);
    \u0275\u0275text(111, "Tarde (14:00-20:00):");
    \u0275\u0275elementEnd();
    \u0275\u0275text(112, " Telenovelas, series, concursos y entretenimiento familiar ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(113, "p")(114, "strong", 56);
    \u0275\u0275text(115, "Madrugada (00:00-06:00):");
    \u0275\u0275elementEnd();
    \u0275\u0275text(116, " Cine de culto, repeticiones y programaci\xF3n nocturna ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(117, "div", 61)(118, "div", 62)(119, "h3", 63);
    \u0275\u0275text(120, " La Mejor ");
    \u0275\u0275elementStart(121, "span", 47);
    \u0275\u0275text(122, "Gu\xEDa TV Online");
    \u0275\u0275elementEnd();
    \u0275\u0275text(123, " de Espa\xF1a ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(124, "p", 64);
    \u0275\u0275text(125, " Encuentra f\xE1cilmente qu\xE9 ver en televisi\xF3n hoy. Nuestra ");
    \u0275\u0275elementStart(126, "strong");
    \u0275\u0275text(127, "parrilla de programaci\xF3n");
    \u0275\u0275elementEnd();
    \u0275\u0275text(128, " se actualiza constantemente para ofrecerte la informaci\xF3n m\xE1s precisa. Filtra por canal, categor\xEDa u horario y descubre pel\xEDculas de estreno, series populares y programas de entretenimiento. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(129, "div", 65)(130, "span", 66);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(131, "svg", 67);
    \u0275\u0275element(132, "path", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275text(133, " Actualizaci\xF3n continua ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(134, "span", 66);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(135, "svg", 67);
    \u0275\u0275element(136, "path", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275text(137, " 100% gratuito ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(138, "span", 66);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(139, "svg", 67);
    \u0275\u0275element(140, "path", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275text(141, " Todos los dispositivos ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(142, "span", 66);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(143, "svg", 67);
    \u0275\u0275element(144, "path", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275text(145, " Sin registro ");
    \u0275\u0275elementEnd()()()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(146, "section", 69)(147, "div", 70)(148, "h2", 71);
    \u0275\u0275text(149, " Preguntas Frecuentes sobre la ");
    \u0275\u0275elementStart(150, "span", 47);
    \u0275\u0275text(151, "Gu\xEDa TV");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(152, "div", 72)(153, "details", 73)(154, "summary", 74)(155, "span", 75);
    \u0275\u0275text(156, "\xBFCada cu\xE1nto se actualiza la programaci\xF3n?");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(157, "svg", 76);
    \u0275\u0275element(158, "path", 77);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(159, "div", 78)(160, "p", 79);
    \u0275\u0275text(161, " S\xED, puedes filtrar la programaci\xF3n por m\xFAltiples categor\xEDas: pel\xEDculas, series, deportes, documentales, noticias, infantil, entretenimiento y m\xE1s. Simplemente usa los filtros en la parte superior para ver solo el contenido que te interesa. ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(162, "details", 73)(163, "summary", 74)(164, "span", 75);
    \u0275\u0275text(165, "\xBFEs compatible con dispositivos m\xF3viles?");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(166, "svg", 76);
    \u0275\u0275element(167, "path", 77);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(168, "div", 78)(169, "p", 79);
    \u0275\u0275text(170, " Totalmente. Nuestra gu\xEDa TV est\xE1 optimizada para funcionar perfectamente en smartphones, tablets y ordenadores. El dise\xF1o responsive se adapta autom\xE1ticamente a cualquier tama\xF1o de pantalla para ofrecerte la mejor experiencia de usuario. ");
    \u0275\u0275elementEnd()()()()()();
    \u0275\u0275template(171, HomeComponent_main_7_section_171_Template, 42, 5, "section", 80);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.selectedCategory());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.uiState().hasFeaturedMovie && !ctx_r1.selectedCategory());
    \u0275\u0275advance(169);
    \u0275\u0275property("ngIf", ctx_r1.selectedCategory());
  }
}
function HomeComponent_div_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 121)(1, "div", 122)(2, "div", 123);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 124);
    \u0275\u0275element(4, "path", 53);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "h2", 125);
    \u0275\u0275text(6, " No hay programaci\xF3n disponible ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 126);
    \u0275\u0275text(8, " No se encontraron programas para mostrar en este momento. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 127);
    \u0275\u0275listener("click", function HomeComponent_div_8_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onRefresh());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 128);
    \u0275\u0275element(11, "path", 26);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(12, "span");
    \u0275\u0275text(13, "Cargar Programaci\xF3n");
    \u0275\u0275elementEnd()()()();
  }
}
var _HomeComponent = class _HomeComponent {
  constructor() {
    this.deviceDetector = inject(DeviceDetectorService);
    this.destroyRef = inject(DestroyRef);
    this.metaService = inject(MetaService);
    this.homeDataService = inject(HomeDataService);
    this.categoryFilterService = inject(CategoryFilterService);
    this.logger = inject(ConsoleLoggerService);
    this.programs = signal([]);
    this.featuredMovie = signal(null);
    this.popularMovies = signal([]);
    this.isLoading = signal(true);
    this.error = signal(null);
    this.selectedCategory = computed(() => this.categoryFilterService.getSelectedCategory());
    this.hasData = computed(() => this.programs().length > 0);
    this.hasFeaturedMovie = computed(() => this.featuredMovie() !== null);
    this.hasError = computed(() => this.error() !== null);
    this.uiState = computed(() => ({
      isLoading: this.isLoading(),
      hasFeaturedMovie: this.hasFeaturedMovie(),
      hasError: this.hasError(),
      showContent: !this.isLoading() && this.hasData() && !this.hasError(),
      showError: !this.isLoading() && this.hasError(),
      showEmpty: !this.isLoading() && !this.hasData() && !this.hasError()
    }));
  }
  // ===============================================
  // LIFECYCLE METHODS
  // ===============================================
  ngOnInit() {
    this.logger.info("HomeComponent initializing");
    this.setupMetaTags();
    this.initializeDataStreams();
    this.initializeData();
    if (!this.isProduction()) {
      this.exposeDebugMethods();
      setTimeout(() => {
        this.checkDataConsistency();
      }, 3e3);
    }
  }
  // ===============================================
  // INITIALIZATION METHODS - SINGLE RESPONSIBILITY
  // ===============================================
  /**
   * Configura los meta tags SEO - responsabilidad específica
   */
  setupMetaTags() {
    this.metaService.setMetaTags({
      title: "Gu\xEDa TV - Programaci\xF3n de Televisi\xF3n Actual",
      description: "Descubre qu\xE9 ver en TV hoy. Gu\xEDa completa de programaci\xF3n televisiva con horarios actualizados.",
      canonicalUrl: "/"
    });
  }
  /**
   * Inicializa los streams de datos reactivos - responsabilidad específica
   */
  initializeDataStreams() {
    this.logger.debug("Initializing reactive data streams");
    this.homeDataService.programs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((programs) => {
      this.logger.debug(`Programs updated: ${programs.length} items`);
      this.programs.set(programs);
      this.categoryFilterService.updatePrograms(programs);
    });
    this.homeDataService.featuredMovie$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((movie) => {
      this.logger.debug(`Featured movie updated: ${movie?.title || "none"}`);
      this.logger.debug(`Featured movie details:`, movie);
      this.featuredMovie.set(movie);
    });
    this.homeDataService.popularMovies$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((movies) => {
      this.logger.debug(`Popular movies updated: ${movies.length} items`);
      this.popularMovies.set(movies);
    });
    this.homeDataService.loading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => {
      this.logger.debug(`Loading state: ${loading}`);
      this.isLoading.set(loading);
    });
    this.homeDataService.error$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      this.logger.debug(`Error state: ${error || "none"}`);
      this.error.set(error);
    });
  }
  /**
   * Inicializa los datos del componente - delegación al servicio
   */
  initializeData() {
    this.logger.info("Starting data initialization");
    this.homeDataService.initializeData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result.success) {
        this.logger.info("Home data initialization successful");
      } else {
        this.logger.error(`Home data initialization failed: ${result}`);
      }
    });
  }
  // ===============================================
  // EVENT HANDLERS - INTERFACE SEGREGATION (CORREGIDOS)
  // ===============================================
  /**
   * Maneja el cambio de día en la programación - CORREGIDO
   */
  onDayChanged(event) {
    const { dayIndex, dayInfo } = event;
    this.logger.info(`Day changed: index ${dayIndex}, day: ${dayInfo.diaSemana} ${dayInfo.diaNumero}`);
    if (dayIndex === 0) {
      this.updatePageTitle("Gu\xEDa TV - Programaci\xF3n de Hoy");
    } else if (dayIndex === 1) {
      this.updatePageTitle(`Gu\xEDa TV - Programaci\xF3n de Ma\xF1ana (${dayInfo.diaSemana} ${dayInfo.diaNumero})`);
    } else {
      this.updatePageTitle(`Gu\xEDa TV - Programaci\xF3n ${dayInfo.diaSemana} ${dayInfo.diaNumero}`);
    }
  }
  /**
   * Maneja la selección de una película
   */
  onMovieSelected(movie) {
    this.logger.info(`Movie selected: ${movie.title}`);
  }
  /**
   * Maneja el reintentar en caso de error
   */
  onRetry() {
    this.logger.info("Retry requested by user");
    this.error.set(null);
    this.homeDataService.refreshData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (!result.success) {
        this.logger.error(`Retry failed: ${result}`);
      }
    });
  }
  /**
   * Maneja la recarga manual de datos
   */
  onRefresh() {
    this.logger.info("Manual refresh requested");
    this.homeDataService.refreshData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result.success) {
        this.logger.info("Manual refresh completed");
      } else {
        this.logger.error(`Manual refresh failed: ${result}`);
      }
    });
  }
  // ===============================================
  // UTILITY METHODS - PURE FUNCTIONS (CORREGIDOS)
  // ===============================================
  /**
   * Formatea el tiempo de un programa
   */
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      this.logger.warn(`Invalid date string: ${dateString}`);
      return "N/A";
    }
  }
  /**
   * Formatea el rating para mostrar - CORREGIDO PARA STRINGS
   */
  formatRating(rating) {
    if (!rating)
      return "N/A";
    if (typeof rating === "string") {
      if (rating.includes("/10") || rating.includes("/")) {
        return rating;
      }
      const numRating = parseFloat(rating);
      if (!isNaN(numRating)) {
        return `${numRating.toFixed(1)}`;
      }
      return rating;
    }
    if (typeof rating === "number") {
      return `${rating.toFixed(1)}`;
    }
    return "N/A";
  }
  /**
   * Track by function para optimizar rendering
   */
  trackByMovieId(index, movie) {
    return movie.id;
  }
  /**
   * Track by function para programas
   */
  trackByProgramId(index, program) {
    return program.id;
  }
  // ===============================================
  // TEMPLATE HELPER METHODS - NUEVOS MÉTODOS AGREGADOS
  // ===============================================
  /**
   * CORREGIDO: Convierte la película destacada al formato que espera el Banner
   */
  getBannerData() {
    const featured = this.featuredMovie();
    if (!featured)
      return null;
    return {
      title: { value: featured.title },
      channel: featured.channelName || "Canal desconocido",
      // Usar el nombre real del canal
      channelName: featured.channelName,
      icon: featured.poster || "assets/images/default-movie-poster.svg",
      poster: featured.poster || "assets/images/default-movie-poster.svg",
      start: featured.startTime || (/* @__PURE__ */ new Date()).toISOString(),
      stop: featured.endTime || new Date(Date.now() + 2 * 60 * 60 * 1e3).toISOString(),
      startTime: featured.startTime,
      endTime: featured.endTime,
      desc: {
        details: featured.description || "Pel\xEDcula destacada de la programaci\xF3n actual.",
        year: featured.releaseDate,
        rate: "TP"
      },
      description: featured.description,
      year: featured.releaseDate,
      rating: featured.rating,
      starRating: featured.rating || "7.0",
      category: featured.category || "Cine",
      id: featured.id
    };
  }
  /**
   * Obtiene la URL del poster con fallback mejorado
   */
  getPosterUrl(movie) {
    return movie.poster || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=";
  }
  /**
   * Maneja errores de carga de posters
   */
  onPosterError(event) {
    const img = event.target;
    img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=";
  }
  /**
   * Verifica si está en modo debug
   */
  isDebugMode() {
    return !this.isProduction();
  }
  // ===============================================
  // HELPER METHODS
  // ===============================================
  /**
   * Actualizar título de página
   */
  updatePageTitle(title) {
    this.metaService.setMetaTags({
      title,
      description: "Descubre qu\xE9 ver en TV. Gu\xEDa completa de programaci\xF3n televisiva con horarios actualizados.",
      canonicalUrl: "/"
    });
  }
  /**
   * Verificar si es producción
   */
  isProduction() {
    return false;
  }
  // ===============================================
  // DEBUG METHODS MEJORADOS (solo en desarrollo)
  // ===============================================
  /**
   * Debug del estado actual del componente y servicios
   */
  debugComponentState() {
    if (this.logger) {
      this.logger.debug("=== HOME COMPONENT STATE ===");
      this.logger.debug(`UI State:`, this.uiState());
      this.logger.debug(`Programs: ${this.programs().length}`);
      this.logger.debug(`Featured Movie: ${this.featuredMovie()?.title || "none"}`);
      this.logger.debug(`Popular Movies: ${this.popularMovies().length}`);
      this.homeDataService.debugState();
      this.logger.debug("=== END COMPONENT STATE ===");
    }
  }
  /**
   * Método para forzar sincronización de datos si algo falla
   */
  forceSyncData() {
    this.logger.info("\u{1F504} FORCE SYNC - Forcing data synchronization");
    const currentState = this.homeDataService.getCurrentState();
    if (currentState.programListData.length > 0 && this.programs().length === 0) {
      this.logger.warn("\u26A0\uFE0F FORCE SYNC - Data mismatch detected, forcing sync");
      this.homeDataService.updateProgramListData(currentState.programListData);
      setTimeout(() => {
        this.logger.info("\u{1F504} FORCE SYNC - Forcing change detection");
      }, 100);
    }
  }
  /**
   * Verificación de consistencia de datos
   */
  checkDataConsistency() {
    const serviceState = this.homeDataService.getCurrentState();
    const componentState = {
      programs: this.programs().length,
      featuredMovie: this.featuredMovie()?.title || "none",
      popularMovies: this.popularMovies().length
    };
    console.log("\u{1F50D} DATA CONSISTENCY CHECK:");
    console.log("Service State:", {
      programs: serviceState.programs.length,
      programListData: serviceState.programListData.length,
      featuredMovie: serviceState.featuredMovie?.title || "none",
      popularMovies: serviceState.popularMovies.length,
      isLoading: serviceState.isLoading,
      hasData: serviceState.hasData
    });
    console.log("Component State:", componentState);
    if (serviceState.programListData.length > 0 && this.programs().length === 0) {
      console.warn("\u{1F6A8} INCONSISTENCY: Service has ProgramList data but component has no programs");
      this.forceSyncData();
    }
    if (serviceState.featuredMovie && !this.featuredMovie()) {
      console.warn("\u{1F6A8} INCONSISTENCY: Service has featured movie but component does not");
    }
  }
  /**
   * Método para exponer en consola para debugging manual
   */
  exposeDebugMethods() {
    if (typeof window !== "undefined") {
      window.homeComponentDebug = {
        state: () => this.debugComponentState(),
        sync: () => this.forceSyncData(),
        check: () => this.checkDataConsistency(),
        refresh: () => this.onRefresh(),
        serviceState: () => this.homeDataService.getCurrentState(),
        componentState: () => ({
          programs: this.programs().length,
          featuredMovie: this.featuredMovie()?.title,
          popularMovies: this.popularMovies().length,
          uiState: this.uiState()
        }),
        testFormatRating: (value) => this.formatRating(value)
      };
      console.log("\u{1F6E0}\uFE0F DEBUG METHODS EXPOSED:");
      console.log("- homeComponentDebug.state() - Ver estado completo");
      console.log("- homeComponentDebug.sync() - Forzar sincronizaci\xF3n");
      console.log("- homeComponentDebug.check() - Verificar consistencia");
      console.log("- homeComponentDebug.refresh() - Refrescar datos");
      console.log("- homeComponentDebug.serviceState() - Estado del servicio");
      console.log("- homeComponentDebug.componentState() - Estado del componente");
      console.log("- homeComponentDebug.testFormatRating(value) - Probar formatRating");
    }
  }
  // ===============================================
  // MÉTODOS PARA FILTRADO DE CATEGORÍAS - PRINCIPIO SINGLE RESPONSIBILITY
  // ===============================================
  /**
   * Maneja la selección de categorías desde el componente hijo
   * Principio: Single Responsibility - Delega al servicio especializado
   * ACTUALIZADO: Ahora maneja selección múltiple
   */
  onCategorySelected(categories) {
    this.logger.info(`HomeComponent: Categor\xEDas seleccionadas: ${categories.join(", ")}`);
    if (categories.length === 0) {
      this.categoryFilterService.clearCategoryFilter();
      return;
    }
    const primaryCategory = categories[0];
    this.categoryFilterService.selectCategory(primaryCategory);
    if (categories.length > 1) {
      this.logger.info(`HomeComponent: M\xFAltiples categor\xEDas seleccionadas, usando como principal: ${primaryCategory}`);
      this.logger.debug(`HomeComponent: Categor\xEDas adicionales: ${categories.slice(1).join(", ")}`);
    }
  }
  /**
   * Limpia el filtro de categoría
   * Principio: Single Responsibility - Delega al servicio
   */
  clearCategoryFilter() {
    this.categoryFilterService.clearCategoryFilter();
    this.logger.info("HomeComponent: Filtro de categor\xEDa limpiado");
  }
  /**
   * Obtiene el número de programas de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  getCategoryProgramCount() {
    const category = this.selectedCategory();
    if (!category)
      return 0;
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.totalPrograms;
  }
  /**
   * Obtiene el número de canales que tienen programas de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  getCategoryChannelCount() {
    const category = this.selectedCategory();
    if (!category)
      return 0;
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.channelsCount;
  }
  /**
   * Obtiene el número de programas actualmente en emisión de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  getCurrentCategoryPrograms() {
    const category = this.selectedCategory();
    if (!category)
      return 0;
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.currentlyAiring;
  }
  /**
   * Obtiene información del próximo programa de las categorías seleccionadas
   * Principio: Single Responsibility - Delega al servicio especializado
   * NOTA: Actualmente funciona con la categoría principal debido a limitaciones del servicio
   */
  getNextCategoryProgram() {
    const category = this.selectedCategory();
    if (!category)
      return "0";
    const stats = this.categoryFilterService.getCategoryStats(category);
    return stats.nextProgramTime;
  }
};
_HomeComponent.\u0275fac = function HomeComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _HomeComponent)();
};
_HomeComponent.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HomeComponent, selectors: [["app-home"]], decls: 9, vars: 5, consts: [["itemscope", "", "itemtype", "https://schema.org/WebApplication", 1, "min-h-screen", "bg-gradient-to-br", "from-gray-900", "via-gray-800", "to-black"], ["itemprop", "name", "content", "Gu\xEDa de Programaci\xF3n TV - Toda la televisi\xF3n espa\xF1ola"], ["itemprop", "description", "content", "Consulta la programaci\xF3n completa de TV en Espa\xF1a. Descubre qu\xE9 ver en La 1, Antena 3, Telecinco, La Sexta y todos los canales. Actualizaci\xF3n en tiempo real."], ["itemprop", "applicationCategory", "content", "Entertainment"], ["class", "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm", "role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 4, "ngIf"], ["class", "min-h-screen flex items-center justify-center px-4 py-8", "role", "alert", "aria-live", "assertive", 4, "ngIf"], ["class", "relative overflow-y-auto", "style", "max-height: calc(100vh - 4rem)", 4, "ngIf"], ["class", "min-h-screen flex items-center justify-center px-4 py-8", "role", "status", "aria-live", "polite", 4, "ngIf"], ["role", "status", "aria-live", "polite", "aria-label", "Cargando contenido", 1, "fixed", "inset-0", "z-50", "flex", "items-center", "justify-center", "bg-gray-900/95", "backdrop-blur-sm"], [1, "flex", "flex-col", "items-center", "space-y-4", "text-center", "px-4"], [1, "relative"], ["aria-hidden", "true", 1, "animate-spin", "rounded-full", "h-12", "w-12", "sm:h-16", "sm:w-16", "border-b-2", "border-red-500"], ["aria-hidden", "true", 1, "absolute", "inset-0", "rounded-full", "border-2", "border-gray-600", "opacity-25"], [1, "space-y-2"], [1, "text-white", "text-lg", "sm:text-xl", "font-semibold"], [1, "text-gray-400", "text-sm", "max-w-md"], ["role", "alert", "aria-live", "assertive", 1, "min-h-screen", "flex", "items-center", "justify-center", "px-4", "py-8"], [1, "max-w-md", "w-full", "bg-gray-800/50", "backdrop-blur-sm", "rounded-2xl", "p-6", "sm:p-8", "text-center", "border", "border-red-500/20"], ["aria-hidden", "true", 1, "w-12", "h-12", "sm:w-16", "sm:h-16", "mx-auto", "mb-4", "bg-red-500/20", "rounded-full", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-6", "h-6", "sm:w-8", "sm:h-8", "text-red-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"], [1, "text-lg", "sm:text-xl", "font-bold", "text-white", "mb-2"], [1, "text-gray-400", "mb-6", "text-sm", "sm:text-base"], ["aria-label", "Reintentar carga de datos", 1, "w-full", "px-6", "py-3", "bg-red-600", "hover:bg-red-700", "active:bg-red-800", "text-white", "font-semibold", "rounded-xl", "transition-all", "duration-200", "focus:outline-none", "focus:ring-2", "focus:ring-red-500", "focus:ring-offset-2", "focus:ring-offset-gray-900", "touch-manipulation", 3, "click"], [1, "flex", "items-center", "justify-center", "space-x-2"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"], [1, "relative", "overflow-y-auto", 2, "max-height", "calc(100vh - 4rem)"], ["class", "bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-600/30 sticky top-0 z-30", "role", "status", "aria-live", "polite", 4, "ngIf"], ["class", "relative overflow-hidden", "itemscope", "", "itemtype", "https://schema.org/Movie", 4, "ngIf"], [1, "relative", "py-6", "sm:py-8", "lg:py-12", "px-4"], [1, "max-w-4xl", "mx-auto", "text-center"], ["itemprop", "name", 1, "text-3xl", "sm:text-4xl", "lg:text-5xl", "font-bold", "bg-gradient-to-r", "from-red-400", "via-red-500", "to-red-600", "bg-clip-text", "text-transparent", "mb-3", "sm:mb-4", "leading-tight"], [1, "text-gray-400", "text-base", "sm:text-lg", "lg:text-xl", "max-w-3xl", "mx-auto", "mb-4", "sm:mb-6", "leading-relaxed"], [1, "grid", "grid-cols-2", "sm:grid-cols-3", "gap-3", "sm:gap-4", "max-w-2xl", "mx-auto", "mb-6", "sm:mb-8"], [1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "p-3", "sm:p-4", "border", "border-gray-700/30"], ["aria-label", "M\xE1s de 100 canales", 1, "text-xl", "sm:text-2xl", "font-bold", "text-red-400"], [1, "text-xs", "sm:text-sm", "text-gray-400"], ["aria-label", "Actualizaci\xF3n cada 24 horas", 1, "text-xl", "sm:text-2xl", "font-bold", "text-red-400"], [1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "p-3", "sm:p-4", "border", "border-gray-700/30", "col-span-2", "sm:col-span-1"], ["aria-label", "Totalmente gratis", 1, "text-xl", "sm:text-2xl", "font-bold", "text-red-400"], ["aria-label", "Parrilla de programaci\xF3n televisiva", 1, "relative"], [3, "dayChanged", "categorySelected"], ["itemscope", "", "itemtype", "https://schema.org/Article", 1, "py-8", "sm:py-12", "lg:py-16", "bg-gray-800/20"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8"], [1, "text-center", "mb-8", "sm:mb-12"], ["itemprop", "headline", 1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-white", "mb-4"], [1, "text-red-400"], ["itemprop", "description", 1, "text-gray-300", "text-sm", "sm:text-base", "lg:text-lg", "max-w-3xl", "mx-auto", "leading-relaxed"], [1, "grid", "sm:grid-cols-2", "lg:grid-cols-3", "gap-4", "sm:gap-6", "lg:gap-8", "mb-8", "sm:mb-12"], ["itemscope", "", "itemtype", "https://schema.org/ItemList", 1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "p-5", "sm:p-6", "border", "border-gray-700/30", "hover:border-red-500/30", "transition-all", "duration-300"], [1, "text-lg", "sm:text-xl", "font-bold", "text-white", "mb-4", "flex", "items-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "w-5", "h-5", "sm:w-6", "sm:h-6", "text-red-400", "mr-2", "sm:mr-3", "flex-shrink-0"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"], ["itemprop", "name"], [1, "space-y-3", "text-xs", "sm:text-sm", "text-gray-300", "leading-relaxed"], [1, "text-white"], [1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "p-5", "sm:p-6", "border", "border-gray-700/30", "hover:border-red-500/30", "transition-all", "duration-300"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"], [1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "p-5", "sm:p-6", "border", "border-gray-700/30", "hover:border-red-500/30", "transition-all", "duration-300", "sm:col-span-2", "lg:col-span-1"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"], [1, "text-center"], [1, "bg-gradient-to-r", "from-red-600/20", "to-red-700/20", "backdrop-blur-sm", "rounded-2xl", "p-6", "sm:p-8", "lg:p-10", "border", "border-red-500/30"], [1, "text-xl", "sm:text-2xl", "lg:text-3xl", "font-bold", "text-white", "mb-3", "sm:mb-4"], [1, "text-gray-300", "text-sm", "sm:text-base", "lg:text-lg", "mb-4", "sm:mb-6", "max-w-3xl", "mx-auto", "leading-relaxed"], [1, "flex", "flex-wrap", "justify-center", "gap-3", "sm:gap-4", "text-xs", "sm:text-sm", "text-gray-400"], [1, "flex", "items-center"], ["fill", "currentColor", "viewBox", "0 0 20 20", "aria-hidden", "true", 1, "w-4", "h-4", "mr-1", "text-red-400"], ["fill-rule", "evenodd", "d", "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", "clip-rule", "evenodd"], ["itemscope", "", "itemtype", "https://schema.org/FAQPage", 1, "py-8", "sm:py-12", "lg:py-16", "bg-gray-900/50"], [1, "max-w-4xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8"], [1, "text-2xl", "sm:text-3xl", "font-bold", "text-white", "mb-6", "sm:mb-8", "text-center"], [1, "space-y-4"], ["itemscope", "", "itemprop", "mainEntity", "itemtype", "https://schema.org/Question", 1, "bg-gray-800/40", "backdrop-blur-sm", "rounded-xl", "border", "border-gray-700/30", "overflow-hidden", "group"], ["itemprop", "name", 1, "cursor-pointer", "px-5", "sm:px-6", "py-4", "font-semibold", "text-white", "hover:bg-gray-700/30", "transition-colors", "list-none", "flex", "justify-between", "items-center", "touch-manipulation"], [1, "text-sm", "sm:text-base"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "w-5", "h-5", "text-red-400", "transition-transform", "group-open:rotate-180"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M19 9l-7 7-7-7"], ["itemscope", "", "itemprop", "acceptedAnswer", "itemtype", "https://schema.org/Answer", 1, "px-5", "sm:px-6", "py-4", "text-xs", "sm:text-sm", "text-gray-300", "bg-gray-800/20"], ["itemprop", "text"], ["class", "py-8 sm:py-12 lg:py-16 bg-gray-800/30", 4, "ngIf"], ["role", "status", "aria-live", "polite", 1, "bg-gradient-to-r", "from-gray-800/90", "via-gray-700/90", "to-gray-800/90", "backdrop-blur-sm", "border-b", "border-gray-600/30", "sticky", "top-0", "z-30"], [1, "max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-3"], [1, "flex", "flex-col", "sm:flex-row", "sm:items-center", "sm:justify-between", "gap-3"], [1, "flex", "items-center", "space-x-3", "min-w-0"], ["aria-hidden", "true", 1, "w-8", "h-8", "flex-shrink-0", "bg-red-500/20", "rounded-lg", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-4", "h-4", "text-red-400"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"], [1, "min-w-0", "flex-1"], [1, "text-xs", "sm:text-sm", "text-gray-300", "truncate"], [1, "font-semibold", "text-white", "text-base", "sm:text-lg", "truncate"], ["aria-label", "Limpiar filtro de categor\xEDa", 1, "inline-flex", "items-center", "justify-center", "px-4", "py-2", "bg-red-600/20", "hover:bg-red-600/30", "active:bg-red-600/40", "text-red-400", "hover:text-red-300", "rounded-lg", "transition-all", "duration-200", "text-sm", "font-medium", "touch-manipulation", "whitespace-nowrap", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "w-4", "h-4", "mr-2"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M6 18L18 6M6 6l12 12"], [1, "hidden", "xs:inline"], [1, "xs:hidden"], ["itemscope", "", "itemtype", "https://schema.org/Movie", 1, "relative", "overflow-hidden"], ["loading", "eager", 3, "movieSelected", "data"], [1, "py-8", "sm:py-12", "lg:py-16", "bg-gray-800/30"], [1, "text-center", "mb-6", "sm:mb-8", "lg:mb-12"], [1, "bg-gradient-to-r", "from-red-400", "to-red-600", "bg-clip-text", "text-transparent"], [1, "text-gray-400", "text-sm", "sm:text-base", "lg:text-lg"], [1, "grid", "grid-cols-2", "lg:grid-cols-4", "gap-3", "sm:gap-4", "lg:gap-6"], [1, "bg-gradient-to-br", "from-gray-800/80", "to-gray-900/80", "backdrop-blur-sm", "rounded-xl", "sm:rounded-2xl", "p-4", "sm:p-6", "lg:p-8", "border", "border-gray-700/30", "hover:border-red-500/30", "transition-all", "duration-300", "hover:shadow-xl", "hover:shadow-red-500/10", "text-center", "group"], ["aria-hidden", "true", 1, "w-10", "h-10", "sm:w-12", "sm:h-12", "lg:w-16", "lg:h-16", "mx-auto", "mb-3", "sm:mb-4", "bg-red-500/20", "rounded-xl", "sm:rounded-2xl", "flex", "items-center", "justify-center", "group-hover:bg-red-500/30", "transition-colors", "duration-300"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "sm:w-6", "sm:h-6", "lg:w-8", "lg:h-8", "text-red-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"], [1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-red-500", "mb-1", "sm:mb-2"], [1, "text-xs", "sm:text-sm", "lg:text-base", "text-gray-400", "font-medium"], [1, "bg-gradient-to-br", "from-gray-800/80", "to-gray-900/80", "backdrop-blur-sm", "rounded-xl", "sm:rounded-2xl", "p-4", "sm:p-6", "lg:p-8", "border", "border-gray-700/30", "hover:border-blue-500/30", "transition-all", "duration-300", "hover:shadow-xl", "hover:shadow-blue-500/10", "text-center", "group"], ["aria-hidden", "true", 1, "w-10", "h-10", "sm:w-12", "sm:h-12", "lg:w-16", "lg:h-16", "mx-auto", "mb-3", "sm:mb-4", "bg-blue-500/20", "rounded-xl", "sm:rounded-2xl", "flex", "items-center", "justify-center", "group-hover:bg-blue-500/30", "transition-colors", "duration-300"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "sm:w-6", "sm:h-6", "lg:w-8", "lg:h-8", "text-blue-500"], [1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-blue-500", "mb-1", "sm:mb-2"], [1, "bg-gradient-to-br", "from-gray-800/80", "to-gray-900/80", "backdrop-blur-sm", "rounded-xl", "sm:rounded-2xl", "p-4", "sm:p-6", "lg:p-8", "border", "border-gray-700/30", "hover:border-green-500/30", "transition-all", "duration-300", "hover:shadow-xl", "hover:shadow-green-500/10", "text-center", "group"], ["aria-hidden", "true", 1, "w-10", "h-10", "sm:w-12", "sm:h-12", "lg:w-16", "lg:h-16", "mx-auto", "mb-3", "sm:mb-4", "bg-green-500/20", "rounded-xl", "sm:rounded-2xl", "flex", "items-center", "justify-center", "group-hover:bg-green-500/30", "transition-colors", "duration-300"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "sm:w-6", "sm:h-6", "lg:w-8", "lg:h-8", "text-green-500"], [1, "text-2xl", "sm:text-3xl", "lg:text-4xl", "font-bold", "text-green-500", "mb-1", "sm:mb-2"], [1, "bg-gradient-to-br", "from-gray-800/80", "to-gray-900/80", "backdrop-blur-sm", "rounded-xl", "sm:rounded-2xl", "p-4", "sm:p-6", "lg:p-8", "border", "border-gray-700/30", "hover:border-purple-500/30", "transition-all", "duration-300", "hover:shadow-xl", "hover:shadow-purple-500/10", "text-center", "group"], ["aria-hidden", "true", 1, "w-10", "h-10", "sm:w-12", "sm:h-12", "lg:w-16", "lg:h-16", "mx-auto", "mb-3", "sm:mb-4", "bg-purple-500/20", "rounded-xl", "sm:rounded-2xl", "flex", "items-center", "justify-center", "group-hover:bg-purple-500/30", "transition-colors", "duration-300"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5", "sm:w-6", "sm:h-6", "lg:w-8", "lg:h-8", "text-purple-500"], [1, "text-xl", "sm:text-2xl", "lg:text-3xl", "font-bold", "text-purple-500", "mb-1", "sm:mb-2"], ["role", "status", "aria-live", "polite", 1, "min-h-screen", "flex", "items-center", "justify-center", "px-4", "py-8"], [1, "max-w-lg", "w-full", "text-center"], ["aria-hidden", "true", 1, "w-16", "h-16", "sm:w-24", "sm:h-24", "mx-auto", "mb-4", "sm:mb-6", "bg-gray-800/50", "rounded-full", "flex", "items-center", "justify-center"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-8", "h-8", "sm:w-12", "sm:h-12", "text-gray-500"], [1, "text-xl", "sm:text-2xl", "font-bold", "text-white", "mb-3", "sm:mb-4"], [1, "text-gray-400", "mb-6", "sm:mb-8", "text-base", "sm:text-lg"], ["aria-label", "Cargar programaci\xF3n de televisi\xF3n", 1, "inline-flex", "items-center", "px-6", "sm:px-8", "py-3", "bg-gradient-to-r", "from-red-600", "to-red-700", "hover:from-red-700", "hover:to-red-800", "active:from-red-800", "active:to-red-900", "text-white", "font-semibold", "rounded-xl", "transition-all", "duration-200", "hover:scale-105", "active:scale-95", "focus:outline-none", "focus:ring-4", "focus:ring-red-500/50", "shadow-lg", "touch-manipulation", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", "aria-hidden", "true", 1, "w-5", "h-5", "mr-2"]], template: function HomeComponent_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "meta", 1)(2, "meta", 2)(3, "meta", 3)(4, "app-nav-bar");
    \u0275\u0275template(5, HomeComponent_div_5_Template, 10, 0, "div", 4)(6, HomeComponent_div_6_Template, 15, 1, "div", 5)(7, HomeComponent_main_7_Template, 172, 3, "main", 6)(8, HomeComponent_div_8_Template, 14, 0, "div", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275attribute("data-state", ctx.uiState().isLoading ? "loading" : ctx.uiState().hasError ? "error" : "loaded");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx.uiState().isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.uiState().showError);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.uiState().showContent);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx.uiState().showEmpty);
  }
}, dependencies: [
  CommonModule,
  NgIf,
  NavBarComponent,
  ProgramListComponent,
  BannerComponent
], styles: ['@charset "UTF-8";\n\n\n\n[_ngcontent-%COMP%]:root {\n  --tv-red-primary: #ef4444;\n  --tv-red-hover: #dc2626;\n  --tv-red-active: #b91c1c;\n  --tv-gradient-primary:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #dc2626,\n      #b91c1c);\n  --tv-gradient-dark:\n    linear-gradient(\n      135deg,\n      #1f2937,\n      #111827,\n      #000000);\n  --tv-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);\n  --tv-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);\n  --tv-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);\n  --tv-shadow-glow: 0 0 20px rgba(239, 68, 68, 0.3);\n  --spacing-xs: 0.5rem;\n  --spacing-sm: 0.75rem;\n  --spacing-md: 1rem;\n  --spacing-lg: 1.5rem;\n  --spacing-xl: 2rem;\n  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);\n  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);\n  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);\n}\nhtml[_ngcontent-%COMP%] {\n  scroll-behavior: smooth;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  text-rendering: optimizeLegibility;\n}\nbody[_ngcontent-%COMP%] {\n  overscroll-behavior-y: none;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n}\n.touch-target[_ngcontent-%COMP%] {\n  min-height: 44px;\n  min-width: 44px;\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.gpu-accelerated[_ngcontent-%COMP%] {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.text-truncate-mobile[_ngcontent-%COMP%] {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 100%;\n}\n@supports not (-webkit-line-clamp: 2) {\n  .line-clamp-2[_ngcontent-%COMP%] {\n    display: block;\n    max-height: 3em;\n    overflow: hidden;\n  }\n}\n@keyframes _ngcontent-%COMP%_shimmer-optimized {\n  0% {\n    background-position: -200% center;\n  }\n  100% {\n    background-position: 200% center;\n  }\n}\n.loading-shimmer[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(75, 85, 99, 0.2) 0%,\n      rgba(107, 114, 128, 0.4) 50%,\n      rgba(75, 85, 99, 0.2) 100%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_shimmer-optimized 2s ease-in-out infinite;\n  will-change: background-position;\n}\n.spinner-mobile[_ngcontent-%COMP%] {\n  width: 40px;\n  height: 40px;\n  border: 3px solid rgba(255, 255, 255, 0.1);\n  border-top-color: var(--tv-red-primary);\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 1s linear infinite;\n  will-change: transform;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.glass-card-mobile[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.7);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: var(--tv-shadow-md);\n}\n@supports (backdrop-filter: blur(16px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    -webkit-backdrop-filter: blur(16px) saturate(180%);\n    backdrop-filter: blur(16px) saturate(180%);\n  }\n}\n@supports not (backdrop-filter: blur(16px)) {\n  .glass-card-mobile[_ngcontent-%COMP%] {\n    background: rgba(31, 41, 55, 0.95);\n  }\n}\n.btn-primary-mobile[_ngcontent-%COMP%], \n.btn-secondary-mobile[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 44px;\n  padding: 12px 24px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  border-radius: 12px;\n  background:\n    linear-gradient(\n      135deg,\n      var(--tv-red-primary),\n      var(--tv-red-hover));\n  color: white;\n  transition: all var(--transition-fast);\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.btn-primary-mobile[_ngcontent-%COMP%]:active, \n.btn-secondary-mobile[_ngcontent-%COMP%]:active {\n  transform: scale(0.95);\n  background: var(--tv-red-active);\n}\n.btn-primary-mobile[_ngcontent-%COMP%]:disabled, \n.btn-secondary-mobile[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n  transform: none;\n}\n@media (min-width: 640px) {\n  .btn-primary-mobile[_ngcontent-%COMP%], \n   .btn-secondary-mobile[_ngcontent-%COMP%] {\n    min-height: 48px;\n    padding: 14px 28px;\n    font-size: 1rem;\n  }\n}\n.btn-secondary-mobile[_ngcontent-%COMP%] {\n  background: rgba(75, 85, 99, 0.3);\n  border: 1px solid rgba(156, 163, 175, 0.3);\n}\n.btn-secondary-mobile[_ngcontent-%COMP%]:hover {\n  background: rgba(75, 85, 99, 0.4);\n  border-color: rgba(156, 163, 175, 0.5);\n}\n.fab-mobile[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 1.5rem;\n  right: 1.5rem;\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: var(--tv-gradient-primary);\n  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all var(--transition-normal);\n  touch-action: manipulation;\n  z-index: 40;\n}\n.fab-mobile[_ngcontent-%COMP%]:active {\n  transform: scale(0.9);\n}\n@media (min-width: 640px) {\n  .fab-mobile[_ngcontent-%COMP%] {\n    width: 64px;\n    height: 64px;\n  }\n}\n.card-mobile[_ngcontent-%COMP%] {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 16px;\n  padding: var(--spacing-lg);\n  transition: all var(--transition-normal);\n}\n@supports (backdrop-filter: blur(12px)) {\n  .card-mobile[_ngcontent-%COMP%] {\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n.card-mobile[_ngcontent-%COMP%]:active {\n  transform: translateY(2px);\n}\n@media (min-width: 640px) {\n  .card-mobile[_ngcontent-%COMP%] {\n    padding: var(--spacing-xl);\n    border-radius: 20px;\n  }\n}\ndetails[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%] {\n  cursor: pointer;\n  list-style: none;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n  padding: 1rem 1.25rem;\n}\ndetails[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%]::-webkit-details-marker {\n  display: none;\n}\ndetails[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%]::marker {\n  display: none;\n}\n@media (min-width: 640px) {\n  details[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%] {\n    padding: 1.25rem 1.5rem;\n  }\n}\ndetails[open][_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_slideDown 0.2s ease-out;\n}\n@keyframes _ngcontent-%COMP%_slideDown {\n  from {\n    opacity: 0;\n    transform: translateY(-8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.grid-mobile-2[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .grid-mobile-2[_ngcontent-%COMP%] {\n    gap: var(--spacing-lg);\n  }\n}\n@media (min-width: 768px) {\n  .grid-mobile-2[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n@media (min-width: 1024px) {\n  .grid-mobile-2[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(4, 1fr);\n  }\n}\n.heading-responsive-h1[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  line-height: 1.2;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h1[_ngcontent-%COMP%] {\n    font-size: 2.25rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h1[_ngcontent-%COMP%] {\n    font-size: 3rem;\n  }\n}\n.heading-responsive-h2[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  line-height: 1.3;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h2[_ngcontent-%COMP%] {\n    font-size: 1.875rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h2[_ngcontent-%COMP%] {\n    font-size: 2.25rem;\n  }\n}\n.heading-responsive-h3[_ngcontent-%COMP%] {\n  font-size: 1.25rem;\n  line-height: 1.4;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h3[_ngcontent-%COMP%] {\n    font-size: 1.5rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h3[_ngcontent-%COMP%] {\n    font-size: 1.875rem;\n  }\n}\n.text-responsive[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\n@media (min-width: 640px) {\n  .text-responsive[_ngcontent-%COMP%] {\n    font-size: 1rem;\n  }\n}\n@media (min-width: 1024px) {\n  .text-responsive[_ngcontent-%COMP%] {\n    font-size: 1.125rem;\n    line-height: 1.6;\n  }\n}\n*[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid var(--tv-red-primary);\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n*[_ngcontent-%COMP%]:focus:not(:focus-visible) {\n  outline: none;\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile[_ngcontent-%COMP%], \n   .card-mobile[_ngcontent-%COMP%] {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-primary-mobile[_ngcontent-%COMP%], \n   .btn-secondary-mobile[_ngcontent-%COMP%] {\n    border: 2px solid currentColor;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *[_ngcontent-%COMP%], \n   *[_ngcontent-%COMP%]::before, \n   *[_ngcontent-%COMP%]::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  [_ngcontent-%COMP%]:root {\n    color-scheme: dark;\n  }\n}\n.lazy-placeholder[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(75, 85, 99, 0.2),\n      rgba(107, 114, 128, 0.3));\n  animation: _ngcontent-%COMP%_pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n  will-change: opacity;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}\n.will-animate[_ngcontent-%COMP%] {\n  will-change: transform, opacity;\n}\n.animated-done[_ngcontent-%COMP%] {\n  will-change: auto;\n}\n@media (max-width: 640px) {\n  a[_ngcontent-%COMP%], \n   button[_ngcontent-%COMP%], \n   [role=button][_ngcontent-%COMP%] {\n    min-height: 44px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n  }\n  .interactive-list[_ngcontent-%COMP%]    > *[_ngcontent-%COMP%]    + *[_ngcontent-%COMP%] {\n    margin-top: 0.75rem;\n  }\n  .sticky-mobile[_ngcontent-%COMP%] {\n    position: sticky;\n    top: 0;\n    z-index: 30;\n    background: rgba(17, 24, 39, 0.95);\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section[_ngcontent-%COMP%] {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n  .grid-mobile-2[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .safe-bottom[_ngcontent-%COMP%] {\n    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));\n  }\n  .fab-mobile[_ngcontent-%COMP%] {\n    bottom: calc(1.5rem + env(safe-area-inset-bottom));\n  }\n}\n@media print {\n  .fab-mobile[_ngcontent-%COMP%], \n   .btn-primary-mobile[_ngcontent-%COMP%], \n   .btn-secondary-mobile[_ngcontent-%COMP%], \n   nav[_ngcontent-%COMP%], \n   button[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n  body[_ngcontent-%COMP%] {\n    background: white !important;\n    color: black !important;\n  }\n  .card-mobile[_ngcontent-%COMP%], \n   .glass-card-mobile[_ngcontent-%COMP%] {\n    background: white !important;\n    border: 1px solid #000 !important;\n    box-shadow: none !important;\n    page-break-inside: avoid;\n  }\n  a[_ngcontent-%COMP%] {\n    text-decoration: underline;\n    color: #000 !important;\n  }\n  a[href^=http][_ngcontent-%COMP%]:after {\n    content: " (" attr(href) ")";\n    font-size: 0.8em;\n  }\n}\n.skeleton[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(75, 85, 99, 0.2) 25%,\n      rgba(107, 114, 128, 0.3) 50%,\n      rgba(75, 85, 99, 0.2) 75%);\n  background-size: 200% 100%;\n  animation: _ngcontent-%COMP%_skeleton-loading 1.5s ease-in-out infinite;\n  border-radius: 8px;\n}\n.skeleton-text[_ngcontent-%COMP%] {\n  height: 1em;\n  margin-bottom: 0.5em;\n}\n.skeleton-text[_ngcontent-%COMP%]:last-child {\n  margin-bottom: 0;\n  width: 80%;\n}\n.skeleton-heading[_ngcontent-%COMP%] {\n  height: 2em;\n  margin-bottom: 1em;\n}\n.skeleton-avatar[_ngcontent-%COMP%] {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n}\n.skeleton-card[_ngcontent-%COMP%] {\n  height: 200px;\n  width: 100%;\n}\n@keyframes _ngcontent-%COMP%_skeleton-loading {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n.gradient-text-mobile[_ngcontent-%COMP%] {\n  background: var(--tv-gradient-primary);\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-fill-color: transparent;\n  color: transparent;\n}\n@supports not (-webkit-background-clip: text) {\n  .gradient-text-mobile[_ngcontent-%COMP%] {\n    color: var(--tv-red-primary);\n  }\n}\n.scroll-snap-container[_ngcontent-%COMP%] {\n  scroll-snap-type: y mandatory;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n}\n.scroll-snap-container[_ngcontent-%COMP%]    > section[_ngcontent-%COMP%] {\n  scroll-snap-align: start;\n  scroll-snap-stop: always;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: rgba(31, 41, 55, 0.3);\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 4px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.7);\n}\n*[_ngcontent-%COMP%] {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.5) rgba(31, 41, 55, 0.3);\n}\n.img-responsive[_ngcontent-%COMP%] {\n  max-width: 100%;\n  height: auto;\n  display: block;\n}\n.img-responsive-cover[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.img-responsive-contain[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n.mobile-menu[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 50;\n  background: rgba(0, 0, 0, 0.8);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity var(--transition-normal);\n}\n.mobile-menu.open[_ngcontent-%COMP%] {\n  opacity: 1;\n  pointer-events: all;\n}\n.mobile-menu-content[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  width: 80%;\n  max-width: 320px;\n  background: rgba(17, 24, 39, 0.98);\n  transform: translateX(100%);\n  transition: transform var(--transition-slow);\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n}\n.mobile-menu.open[_ngcontent-%COMP%]   .mobile-menu-content[_ngcontent-%COMP%] {\n  transform: translateX(0);\n}\n.toast-mobile[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 1rem;\n  left: 1rem;\n  right: 1rem;\n  padding: 1rem;\n  background: rgba(31, 41, 55, 0.95);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(156, 163, 175, 0.3);\n  border-radius: 12px;\n  box-shadow: var(--tv-shadow-lg);\n  z-index: 100;\n  animation: _ngcontent-%COMP%_slideUp 0.3s ease-out;\n}\n@media (min-width: 640px) {\n  .toast-mobile[_ngcontent-%COMP%] {\n    left: auto;\n    right: 1rem;\n    max-width: 400px;\n  }\n}\n@keyframes _ngcontent-%COMP%_slideUp {\n  from {\n    transform: translateY(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n.bottom-nav-mobile[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background: rgba(17, 24, 39, 0.95);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(75, 85, 99, 0.3);\n  padding: 0.75rem;\n  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));\n  z-index: 40;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));\n  gap: 0.5rem;\n}\n@media (min-width: 1024px) {\n  .bottom-nav-mobile[_ngcontent-%COMP%] {\n    display: none;\n  }\n}\n.bottom-nav-mobile-item[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 0.25rem;\n  min-height: 48px;\n  color: rgb(156, 163, 175);\n  transition: color var(--transition-fast);\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.bottom-nav-mobile-item.active[_ngcontent-%COMP%] {\n  color: var(--tv-red-primary);\n}\n.bottom-nav-mobile-item[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  width: 24px;\n  height: 24px;\n}\n.bottom-nav-mobile-item[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.p-responsive[_ngcontent-%COMP%] {\n  padding: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .p-responsive[_ngcontent-%COMP%] {\n    padding: var(--spacing-lg);\n  }\n}\n@media (min-width: 1024px) {\n  .p-responsive[_ngcontent-%COMP%] {\n    padding: var(--spacing-xl);\n  }\n}\n.px-responsive[_ngcontent-%COMP%] {\n  padding-left: var(--spacing-md);\n  padding-right: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .px-responsive[_ngcontent-%COMP%] {\n    padding-left: var(--spacing-lg);\n    padding-right: var(--spacing-lg);\n  }\n}\n@media (min-width: 1024px) {\n  .px-responsive[_ngcontent-%COMP%] {\n    padding-left: var(--spacing-xl);\n    padding-right: var(--spacing-xl);\n  }\n}\n.py-responsive[_ngcontent-%COMP%] {\n  padding-top: var(--spacing-lg);\n  padding-bottom: var(--spacing-lg);\n}\n@media (min-width: 640px) {\n  .py-responsive[_ngcontent-%COMP%] {\n    padding-top: var(--spacing-xl);\n    padding-bottom: var(--spacing-xl);\n  }\n}\n@media (min-width: 1024px) {\n  .py-responsive[_ngcontent-%COMP%] {\n    padding-top: calc(var(--spacing-xl) * 2);\n    padding-bottom: calc(var(--spacing-xl) * 2);\n  }\n}\n@supports (-webkit-appearance: none) {\n  .smooth-scroll[_ngcontent-%COMP%] {\n    scroll-behavior: smooth;\n    -webkit-overflow-scrolling: touch;\n  }\n}\n@supports (-webkit-touch-callout: none) {\n  input[_ngcontent-%COMP%], \n   textarea[_ngcontent-%COMP%], \n   select[_ngcontent-%COMP%] {\n    font-size: 16px !important;\n  }\n  .fab-mobile[_ngcontent-%COMP%] {\n    bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));\n  }\n}\n.main-container-mobile[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  min-height: -webkit-fill-available;\n  display: flex;\n  flex-direction: column;\n}\n.no-select[_ngcontent-%COMP%] {\n  user-select: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n}\n.virtualized-list[_ngcontent-%COMP%] {\n  contain: layout style paint;\n  content-visibility: auto;\n}\n/*# sourceMappingURL=home.component.css.map */'], changeDetection: 0 });
var HomeComponent = _HomeComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HomeComponent, [{
    type: Component,
    args: [{ selector: "app-home", standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
      CommonModule,
      NavBarComponent,
      ProgramListComponent,
      BannerComponent
    ], template: `<!-- home.component.html - SEO OPTIMIZADO Y MOBILE-FIRST -->\r
<div\r
  class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black"\r
  itemscope\r
  itemtype="https://schema.org/WebApplication"\r
  [attr.data-state]="\r
    uiState().isLoading ? 'loading' : uiState().hasError ? 'error' : 'loaded'\r
  "\r
>\r
  <!-- Schema.org Metadata -->\r
  <meta\r
    itemprop="name"\r
    content="Gu\xEDa de Programaci\xF3n TV - Toda la televisi\xF3n espa\xF1ola"\r
  />\r
  <meta\r
    itemprop="description"\r
    content="Consulta la programaci\xF3n completa de TV en Espa\xF1a. Descubre qu\xE9 ver en La 1, Antena 3, Telecinco, La Sexta y todos los canales. Actualizaci\xF3n en tiempo real."\r
  />\r
  <meta itemprop="applicationCategory" content="Entertainment" />\r
\r
  <!-- Navigation integrada -->\r
  <app-nav-bar></app-nav-bar>\r
\r
  <!-- Loading State - Optimizado para Core Web Vitals -->\r
  <div\r
    *ngIf="uiState().isLoading"\r
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm"\r
    role="status"\r
    aria-live="polite"\r
    aria-label="Cargando contenido"\r
  >\r
    <div class="flex flex-col items-center space-y-4 text-center px-4">\r
      <div class="relative">\r
        <div\r
          class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-red-500"\r
          aria-hidden="true"\r
        ></div>\r
        <div\r
          class="absolute inset-0 rounded-full border-2 border-gray-600 opacity-25"\r
          aria-hidden="true"\r
        ></div>\r
      </div>\r
      <div class="space-y-2">\r
        <h2 class="text-white text-lg sm:text-xl font-semibold">\r
          Cargando Gu\xEDa TV\r
        </h2>\r
        <p class="text-gray-400 text-sm max-w-md">\r
          Obteniendo la programaci\xF3n m\xE1s actualizada de todos los canales...\r
        </p>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Error State - Mejorado para m\xF3viles -->\r
  <div\r
    *ngIf="uiState().showError"\r
    class="min-h-screen flex items-center justify-center px-4 py-8"\r
    role="alert"\r
    aria-live="assertive"\r
  >\r
    <div\r
      class="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border border-red-500/20"\r
    >\r
      <div\r
        class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"\r
        aria-hidden="true"\r
      >\r
        <svg\r
          class="w-6 h-6 sm:w-8 sm:h-8 text-red-500"\r
          fill="none"\r
          stroke="currentColor"\r
          viewBox="0 0 24 24"\r
        >\r
          <path\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            stroke-width="2"\r
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"\r
          />\r
        </svg>\r
      </div>\r
      <h2 class="text-lg sm:text-xl font-bold text-white mb-2">\r
        Error al cargar los datos\r
      </h2>\r
      <p class="text-gray-400 mb-6 text-sm sm:text-base">{{ error() }}</p>\r
      <button\r
        (click)="onRetry()"\r
        class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 touch-manipulation"\r
        aria-label="Reintentar carga de datos"\r
      >\r
        <span class="flex items-center justify-center space-x-2">\r
          <svg\r
            class="w-5 h-5"\r
            fill="none"\r
            stroke="currentColor"\r
            viewBox="0 0 24 24"\r
            aria-hidden="true"\r
          >\r
            <path\r
              stroke-linecap="round"\r
              stroke-linejoin="round"\r
              stroke-width="2"\r
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"\r
            />\r
          </svg>\r
          <span>Reintentar</span>\r
        </span>\r
      </button>\r
    </div>\r
  </div>\r
\r
  <!-- Main Content Container -->\r
  <main\r
    *ngIf="uiState().showContent"\r
    class="relative overflow-y-auto"\r
    style="max-height: calc(100vh - 4rem)"\r
  >\r
    <!-- Category Filter Banner - Optimizado m\xF3vil -->\r
    <div\r
      *ngIf="selectedCategory()"\r
      class="bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-600/30 sticky top-0 z-30"\r
      role="status"\r
      aria-live="polite"\r
    >\r
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">\r
        <div\r
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"\r
        >\r
          <div class="flex items-center space-x-3 min-w-0">\r
            <div\r
              class="w-8 h-8 flex-shrink-0 bg-red-500/20 rounded-lg flex items-center justify-center"\r
              aria-hidden="true"\r
            >\r
              <svg\r
                class="w-4 h-4 text-red-400"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"\r
                />\r
              </svg>\r
            </div>\r
            <div class="min-w-0 flex-1">\r
              <p class="text-xs sm:text-sm text-gray-300 truncate">\r
                Filtrando por categor\xEDa\r
              </p>\r
              <p class="font-semibold text-white text-base sm:text-lg truncate">\r
                {{ selectedCategory() }}\r
              </p>\r
            </div>\r
          </div>\r
          <button\r
            (click)="clearCategoryFilter()"\r
            class="inline-flex items-center justify-center px-4 py-2 bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium touch-manipulation whitespace-nowrap"\r
            aria-label="Limpiar filtro de categor\xEDa"\r
          >\r
            <svg\r
              class="w-4 h-4 mr-2"\r
              fill="none"\r
              stroke="currentColor"\r
              viewBox="0 0 24 24"\r
              aria-hidden="true"\r
            >\r
              <path\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
                stroke-width="2"\r
                d="M6 18L18 6M6 6l12 12"\r
              />\r
            </svg>\r
            <span class="hidden xs:inline">Limpiar filtro</span>\r
            <span class="xs:hidden">Limpiar</span>\r
          </button>\r
        </div>\r
      </div>\r
    </div>\r
\r
    <!-- Featured Movie Banner - Con lazy loading -->\r
    <section\r
      *ngIf="uiState().hasFeaturedMovie && !selectedCategory()"\r
      class="relative overflow-hidden"\r
      itemscope\r
      itemtype="https://schema.org/Movie"\r
    >\r
      <app-banner\r
        [data]="getBannerData()"\r
        (movieSelected)="onMovieSelected($event)"\r
        loading="eager"\r
      >\r
      </app-banner>\r
    </section>\r
\r
    <!-- SEO Hero Section - Above the fold -->\r
    <section class="relative py-6 sm:py-8 lg:py-12 px-4">\r
      <div class="max-w-4xl mx-auto text-center">\r
        <!-- H1 Principal - SEO Critical -->\r
        <h1\r
          class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight"\r
          itemprop="name"\r
        >\r
          Gu\xEDa de Programaci\xF3n TV Espa\xF1a\r
        </h1>\r
\r
        <!-- Descripci\xF3n Principal - SEO Critical -->\r
        <p\r
          class="text-gray-400 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed"\r
        >\r
          Consulta toda la\r
          <strong>programaci\xF3n de televisi\xF3n</strong> actualizada en tiempo\r
          real. La mejor <strong>gu\xEDa TV</strong> para todos los canales\r
          espa\xF1oles.\r
        </p>\r
\r
        <!-- Quick Stats - Mobile Friendly -->\r
        <div\r
          class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8"\r
        >\r
          <div\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/30"\r
          >\r
            <div\r
              class="text-xl sm:text-2xl font-bold text-red-400"\r
              aria-label="M\xE1s de 100 canales"\r
            >\r
              100+\r
            </div>\r
            <div class="text-xs sm:text-sm text-gray-400">Canales</div>\r
          </div>\r
          <div\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/30"\r
          >\r
            <div\r
              class="text-xl sm:text-2xl font-bold text-red-400"\r
              aria-label="Actualizaci\xF3n cada 24 horas"\r
            >\r
              24/7\r
            </div>\r
            <div class="text-xs sm:text-sm text-gray-400">Actualizado</div>\r
          </div>\r
          <div\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/30 col-span-2 sm:col-span-1"\r
          >\r
            <div\r
              class="text-xl sm:text-2xl font-bold text-red-400"\r
              aria-label="Totalmente gratis"\r
            >\r
              Gratis\r
            </div>\r
            <div class="text-xs sm:text-sm text-gray-400">100% Gratuito</div>\r
          </div>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Program List Section - Componente Principal -->\r
    <section class="relative" aria-label="Parrilla de programaci\xF3n televisiva">\r
      <app-program-list\r
        (dayChanged)="onDayChanged($event)"\r
        (categorySelected)="onCategorySelected($event)"\r
      >\r
      </app-program-list>\r
    </section>\r
\r
    <!-- SEO Content - Rich Content Section -->\r
    <section\r
      class="py-8 sm:py-12 lg:py-16 bg-gray-800/20"\r
      itemscope\r
      itemtype="https://schema.org/Article"\r
    >\r
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\r
        <!-- SEO H2 Principal -->\r
        <header class="text-center mb-8 sm:mb-12">\r
          <h2\r
            class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"\r
            itemprop="headline"\r
          >\r
            Tu Gu\xEDa Completa de\r
            <span class="text-red-400">Televisi\xF3n en Espa\xF1a</span>\r
          </h2>\r
          <p\r
            class="text-gray-300 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed"\r
            itemprop="description"\r
          >\r
            Descubre toda la programaci\xF3n TV de los principales canales\r
            espa\xF1oles. Informaci\xF3n detallada, sinopsis, horarios y mucho m\xE1s en\r
            la mejor <strong>gu\xEDa televisi\xF3n online</strong>.\r
          </p>\r
        </header>\r
\r
        <!-- Content Grid - Mobile Optimizado -->\r
        <div\r
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12"\r
        >\r
          <!-- Card 1: Canales Principales -->\r
          <article\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300"\r
            itemscope\r
            itemtype="https://schema.org/ItemList"\r
          >\r
            <h3\r
              class="text-lg sm:text-xl font-bold text-white mb-4 flex items-center"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2 sm:mr-3 flex-shrink-0"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"\r
                ></path>\r
              </svg>\r
              <span itemprop="name">Canales Principales</span>\r
            </h3>\r
            <div\r
              class="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed"\r
            >\r
              <p>\r
                <strong class="text-white">Canales Nacionales:</strong> La 1, La\r
                2, Antena 3, Cuatro, Telecinco, La Sexta\r
              </p>\r
              <p>\r
                <strong class="text-white">Auton\xF3micos:</strong> TV3, ETB, Canal\r
                Sur, Telemadrid, \xC0 Punt, TVG\r
              </p>\r
              <p>\r
                <strong class="text-white">Tem\xE1ticos:</strong> Neox, Nova, Mega,\r
                FDF, Energy, Divinity, Be Mad\r
              </p>\r
              <p>\r
                <strong class="text-white">Infantiles:</strong> Clan, Disney\r
                Channel, Nickelodeon, Boing\r
              </p>\r
            </div>\r
          </article>\r
\r
          <!-- Card 2: Categor\xEDas de Contenido -->\r
          <article\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300"\r
          >\r
            <h3\r
              class="text-lg sm:text-xl font-bold text-white mb-4 flex items-center"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2 sm:mr-3 flex-shrink-0"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"\r
                ></path>\r
              </svg>\r
              Contenido por Categor\xEDas\r
            </h3>\r
            <div\r
              class="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed"\r
            >\r
              <p>\r
                <strong class="text-white">Pel\xEDculas:</strong> Estrenos, cine\r
                espa\xF1ol, cl\xE1sicos, blockbusters internacionales\r
              </p>\r
              <p>\r
                <strong class="text-white">Series:</strong> Dramas, comedias,\r
                thrillers, series espa\xF1olas e internacionales\r
              </p>\r
              <p>\r
                <strong class="text-white">Deportes:</strong> F\xFAtbol,\r
                baloncesto, tenis, motor, olimpiadas\r
              </p>\r
              <p>\r
                <strong class="text-white">Documentales:</strong> Naturaleza,\r
                historia, ciencia, biograf\xEDas\r
              </p>\r
              <p>\r
                <strong class="text-white">Entretenimiento:</strong> Reality\r
                shows, talent shows, programas de actualidad\r
              </p>\r
            </div>\r
          </article>\r
\r
          <!-- Card 3: Franjas Horarias -->\r
          <article\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300 sm:col-span-2 lg:col-span-1"\r
          >\r
            <h3\r
              class="text-lg sm:text-xl font-bold text-white mb-4 flex items-center"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2 sm:mr-3 flex-shrink-0"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"\r
                ></path>\r
              </svg>\r
              Programaci\xF3n por Horas\r
            </h3>\r
            <div\r
              class="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed"\r
            >\r
              <p>\r
                <strong class="text-white">Prime Time (20:00-00:00):</strong>\r
                Las mejores pel\xEDculas, series de estreno y programas principales\r
              </p>\r
              <p>\r
                <strong class="text-white">Ma\xF1ana (06:00-14:00):</strong>\r
                Informativos, magazines matinales y programas de debate\r
              </p>\r
              <p>\r
                <strong class="text-white">Tarde (14:00-20:00):</strong>\r
                Telenovelas, series, concursos y entretenimiento familiar\r
              </p>\r
              <p>\r
                <strong class="text-white">Madrugada (00:00-06:00):</strong>\r
                Cine de culto, repeticiones y programaci\xF3n nocturna\r
              </p>\r
            </div>\r
          </article>\r
        </div>\r
\r
        <!-- CTA Section - Mobile Optimizado -->\r
        <div class="text-center">\r
          <div\r
            class="bg-gradient-to-r from-red-600/20 to-red-700/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 border border-red-500/30"\r
          >\r
            <h3\r
              class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4"\r
            >\r
              La Mejor <span class="text-red-400">Gu\xEDa TV Online</span> de\r
              Espa\xF1a\r
            </h3>\r
            <p\r
              class="text-gray-300 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed"\r
            >\r
              Encuentra f\xE1cilmente qu\xE9 ver en televisi\xF3n hoy. Nuestra\r
              <strong>parrilla de programaci\xF3n</strong>\r
              se actualiza constantemente para ofrecerte la informaci\xF3n m\xE1s\r
              precisa. Filtra por canal, categor\xEDa u horario y descubre\r
              pel\xEDculas de estreno, series populares y programas de\r
              entretenimiento.\r
            </p>\r
            <div\r
              class="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400"\r
            >\r
              <span class="flex items-center">\r
                <svg\r
                  class="w-4 h-4 mr-1 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                  aria-hidden="true"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"\r
                    clip-rule="evenodd"\r
                  />\r
                </svg>\r
                Actualizaci\xF3n continua\r
              </span>\r
              <span class="flex items-center">\r
                <svg\r
                  class="w-4 h-4 mr-1 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                  aria-hidden="true"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"\r
                    clip-rule="evenodd"\r
                  />\r
                </svg>\r
                100% gratuito\r
              </span>\r
              <span class="flex items-center">\r
                <svg\r
                  class="w-4 h-4 mr-1 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                  aria-hidden="true"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"\r
                    clip-rule="evenodd"\r
                  />\r
                </svg>\r
                Todos los dispositivos\r
              </span>\r
              <span class="flex items-center">\r
                <svg\r
                  class="w-4 h-4 mr-1 text-red-400"\r
                  fill="currentColor"\r
                  viewBox="0 0 20 20"\r
                  aria-hidden="true"\r
                >\r
                  <path\r
                    fill-rule="evenodd"\r
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"\r
                    clip-rule="evenodd"\r
                  />\r
                </svg>\r
                Sin registro\r
              </span>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- FAQ Section - SEO Boost -->\r
    <section\r
      class="py-8 sm:py-12 lg:py-16 bg-gray-900/50"\r
      itemscope\r
      itemtype="https://schema.org/FAQPage"\r
    >\r
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">\r
        <h2\r
          class="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center"\r
        >\r
          Preguntas Frecuentes sobre la\r
          <span class="text-red-400">Gu\xEDa TV</span>\r
        </h2>\r
\r
        <div class="space-y-4">\r
          <!-- FAQ Item 1 -->\r
          <details\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden group"\r
            itemscope\r
            itemprop="mainEntity"\r
            itemtype="https://schema.org/Question"\r
          >\r
            <summary\r
              class="cursor-pointer px-5 sm:px-6 py-4 font-semibold text-white hover:bg-gray-700/30 transition-colors list-none flex justify-between items-center touch-manipulation"\r
              itemprop="name"\r
            >\r
              <span class="text-sm sm:text-base"\r
                >\xBFCada cu\xE1nto se actualiza la programaci\xF3n?</span\r
              >\r
              <svg\r
                class="w-5 h-5 text-red-400 transition-transform group-open:rotate-180"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M19 9l-7 7-7-7"\r
                />\r
              </svg>\r
            </summary>\r
            <div\r
              class="px-5 sm:px-6 py-4 text-xs sm:text-sm text-gray-300 bg-gray-800/20"\r
              itemscope\r
              itemprop="acceptedAnswer"\r
              itemtype="https://schema.org/Answer"\r
            >\r
              <p itemprop="text">\r
                S\xED, puedes filtrar la programaci\xF3n por m\xFAltiples categor\xEDas:\r
                pel\xEDculas, series, deportes, documentales, noticias, infantil,\r
                entretenimiento y m\xE1s. Simplemente usa los filtros en la parte\r
                superior para ver solo el contenido que te interesa.\r
              </p>\r
            </div>\r
          </details>\r
\r
          <!-- FAQ Item 4 -->\r
          <details\r
            class="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden group"\r
            itemscope\r
            itemprop="mainEntity"\r
            itemtype="https://schema.org/Question"\r
          >\r
            <summary\r
              class="cursor-pointer px-5 sm:px-6 py-4 font-semibold text-white hover:bg-gray-700/30 transition-colors list-none flex justify-between items-center touch-manipulation"\r
              itemprop="name"\r
            >\r
              <span class="text-sm sm:text-base"\r
                >\xBFEs compatible con dispositivos m\xF3viles?</span\r
              >\r
              <svg\r
                class="w-5 h-5 text-red-400 transition-transform group-open:rotate-180"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
                aria-hidden="true"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M19 9l-7 7-7-7"\r
                />\r
              </svg>\r
            </summary>\r
            <div\r
              class="px-5 sm:px-6 py-4 text-xs sm:text-sm text-gray-300 bg-gray-800/20"\r
              itemscope\r
              itemprop="acceptedAnswer"\r
              itemtype="https://schema.org/Answer"\r
            >\r
              <p itemprop="text">\r
                Totalmente. Nuestra gu\xEDa TV est\xE1 optimizada para funcionar\r
                perfectamente en smartphones, tablets y ordenadores. El dise\xF1o\r
                responsive se adapta autom\xE1ticamente a cualquier tama\xF1o de\r
                pantalla para ofrecerte la mejor experiencia de usuario.\r
              </p>\r
            </div>\r
          </details>\r
        </div>\r
      </div>\r
    </section>\r
\r
    <!-- Category Statistics - Solo cuando hay filtro -->\r
    <section\r
      *ngIf="selectedCategory()"\r
      class="py-8 sm:py-12 lg:py-16 bg-gray-800/30"\r
    >\r
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\r
        <header class="text-center mb-6 sm:mb-8 lg:mb-12">\r
          <h3\r
            class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4"\r
          >\r
            Estad\xEDsticas de\r
            <span\r
              class="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent"\r
            >\r
              {{ selectedCategory() }}\r
            </span>\r
          </h3>\r
          <p class="text-gray-400 text-sm sm:text-base lg:text-lg">\r
            Resumen de la programaci\xF3n filtrada por esta categor\xEDa\r
          </p>\r
        </header>\r
\r
        <!-- Stats Grid - Optimizado m\xF3vil -->\r
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">\r
          <!-- Total Programs -->\r
          <div\r
            class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 text-center group"\r
          >\r
            <div\r
              class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-red-500/30 transition-colors duration-300"\r
              aria-hidden="true"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-500"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"\r
                />\r
              </svg>\r
            </div>\r
            <p\r
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-500 mb-1 sm:mb-2"\r
            >\r
              {{ getCategoryProgramCount() }}\r
            </p>\r
            <p\r
              class="text-xs sm:text-sm lg:text-base text-gray-400 font-medium"\r
            >\r
              Programas\r
            </p>\r
          </div>\r
\r
          <!-- Channels -->\r
          <div\r
            class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 text-center group"\r
          >\r
            <div\r
              class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 bg-blue-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300"\r
              aria-hidden="true"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-500"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"\r
                />\r
              </svg>\r
            </div>\r
            <p\r
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-500 mb-1 sm:mb-2"\r
            >\r
              {{ getCategoryChannelCount() }}\r
            </p>\r
            <p\r
              class="text-xs sm:text-sm lg:text-base text-gray-400 font-medium"\r
            >\r
              Canales\r
            </p>\r
          </div>\r
\r
          <!-- Currently Airing -->\r
          <div\r
            class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/30 hover:border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 text-center group"\r
          >\r
            <div\r
              class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 bg-green-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-300"\r
              aria-hidden="true"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-500"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"\r
                />\r
              </svg>\r
            </div>\r
            <p\r
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-500 mb-1 sm:mb-2"\r
            >\r
              {{ getCurrentCategoryPrograms() }}\r
            </p>\r
            <p\r
              class="text-xs sm:text-sm lg:text-base text-gray-400 font-medium"\r
            >\r
              En Emisi\xF3n\r
            </p>\r
          </div>\r
\r
          <!-- Next Program -->\r
          <div\r
            class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 text-center group"\r
          >\r
            <div\r
              class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 bg-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-300"\r
              aria-hidden="true"\r
            >\r
              <svg\r
                class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-500"\r
                fill="none"\r
                stroke="currentColor"\r
                viewBox="0 0 24 24"\r
              >\r
                <path\r
                  stroke-linecap="round"\r
                  stroke-linejoin="round"\r
                  stroke-width="2"\r
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"\r
                />\r
              </svg>\r
            </div>\r
            <p\r
              class="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 mb-1 sm:mb-2"\r
            >\r
              {{ getNextCategoryProgram() }}\r
            </p>\r
            <p\r
              class="text-xs sm:text-sm lg:text-base text-gray-400 font-medium"\r
            >\r
              Pr\xF3ximo\r
            </p>\r
          </div>\r
        </div>\r
      </div>\r
    </section>\r
  </main>\r
\r
  <!-- Floating Action Button - Mejorado t\xE1ctil -->\r
  <!-- <button\r
    *ngIf="uiState().showContent"\r
    (click)="onRefresh()"\r
    [disabled]="uiState().isLoading"\r
    class="fixed bottom-6 right-6 z-40 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-200 hover:scale-110 active:scale-95 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-red-500/50 flex items-center justify-center touch-manipulation lg:hidden"\r
    aria-label="Actualizar programaci\xF3n"\r
  >\r
    <svg\r
      *ngIf="!uiState().isLoading"\r
      class="w-6 h-6"\r
      fill="none"\r
      stroke="currentColor"\r
      viewBox="0 0 24 24"\r
      aria-hidden="true"\r
    >\r
      <path\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
        stroke-width="2"\r
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"\r
      />\r
    </svg>\r
    <div\r
      *ngIf="uiState().isLoading"\r
      class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"\r
      aria-hidden="true"\r
    ></div>\r
  </button>\r
\r
  <button\r
    *ngIf="uiState().showContent"\r
    (click)="onRefresh()"\r
    [disabled]="uiState().isLoading"\r
    class="hidden lg:inline-flex fixed bottom-8 right-8 z-40 items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-red-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-red-500/50 touch-manipulation"\r
    aria-label="Actualizar programaci\xF3n de televisi\xF3n"\r
  >\r
    <svg\r
      *ngIf="!uiState().isLoading"\r
      class="w-5 h-5 mr-2"\r
      fill="none"\r
      stroke="currentColor"\r
      viewBox="0 0 24 24"\r
      aria-hidden="true"\r
    >\r
      <path\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
        stroke-width="2"\r
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"\r
      />\r
    </svg>\r
    <div\r
      *ngIf="uiState().isLoading"\r
      class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"\r
      aria-hidden="true"\r
    ></div>\r
    <span>{{\r
      uiState().isLoading ? "Actualizando..." : "Actualizar Programaci\xF3n"\r
    }}</span>\r
  </button> -->\r
\r
  <!-- Empty State - Mejorado -->\r
  <div\r
    *ngIf="uiState().showEmpty"\r
    class="min-h-screen flex items-center justify-center px-4 py-8"\r
    role="status"\r
    aria-live="polite"\r
  >\r
    <div class="max-w-lg w-full text-center">\r
      <div\r
        class="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-800/50 rounded-full flex items-center justify-center"\r
        aria-hidden="true"\r
      >\r
        <svg\r
          class="w-8 h-8 sm:w-12 sm:h-12 text-gray-500"\r
          fill="none"\r
          stroke="currentColor"\r
          viewBox="0 0 24 24"\r
        >\r
          <path\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            stroke-width="2"\r
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"\r
          />\r
        </svg>\r
      </div>\r
      <h2 class="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">\r
        No hay programaci\xF3n disponible\r
      </h2>\r
      <p class="text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg">\r
        No se encontraron programas para mostrar en este momento.\r
      </p>\r
      <button\r
        (click)="onRefresh()"\r
        class="inline-flex items-center px-6 sm:px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-500/50 shadow-lg touch-manipulation"\r
        aria-label="Cargar programaci\xF3n de televisi\xF3n"\r
      >\r
        <svg\r
          class="w-5 h-5 mr-2"\r
          fill="none"\r
          stroke="currentColor"\r
          viewBox="0 0 24 24"\r
          aria-hidden="true"\r
        >\r
          <path\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            stroke-width="2"\r
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"\r
          />\r
        </svg>\r
        <span>Cargar Programaci\xF3n</span>\r
      </button>\r
    </div>\r
  </div>\r
</div>\r
`, styles: ['@charset "UTF-8";\n\n/* src/app/pages/home/home.component.scss */\n:root {\n  --tv-red-primary: #ef4444;\n  --tv-red-hover: #dc2626;\n  --tv-red-active: #b91c1c;\n  --tv-gradient-primary:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #dc2626,\n      #b91c1c);\n  --tv-gradient-dark:\n    linear-gradient(\n      135deg,\n      #1f2937,\n      #111827,\n      #000000);\n  --tv-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);\n  --tv-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);\n  --tv-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);\n  --tv-shadow-glow: 0 0 20px rgba(239, 68, 68, 0.3);\n  --spacing-xs: 0.5rem;\n  --spacing-sm: 0.75rem;\n  --spacing-md: 1rem;\n  --spacing-lg: 1.5rem;\n  --spacing-xl: 2rem;\n  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);\n  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);\n  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);\n}\nhtml {\n  scroll-behavior: smooth;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  text-rendering: optimizeLegibility;\n}\nbody {\n  overscroll-behavior-y: none;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n}\n.touch-target {\n  min-height: 44px;\n  min-width: 44px;\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.gpu-accelerated {\n  transform: translateZ(0);\n  will-change: transform;\n  backface-visibility: hidden;\n}\n.text-truncate-mobile {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 100%;\n}\n@supports not (-webkit-line-clamp: 2) {\n  .line-clamp-2 {\n    display: block;\n    max-height: 3em;\n    overflow: hidden;\n  }\n}\n@keyframes shimmer-optimized {\n  0% {\n    background-position: -200% center;\n  }\n  100% {\n    background-position: 200% center;\n  }\n}\n.loading-shimmer {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(75, 85, 99, 0.2) 0%,\n      rgba(107, 114, 128, 0.4) 50%,\n      rgba(75, 85, 99, 0.2) 100%);\n  background-size: 200% 100%;\n  animation: shimmer-optimized 2s ease-in-out infinite;\n  will-change: background-position;\n}\n.spinner-mobile {\n  width: 40px;\n  height: 40px;\n  border: 3px solid rgba(255, 255, 255, 0.1);\n  border-top-color: var(--tv-red-primary);\n  border-radius: 50%;\n  animation: spin 1s linear infinite;\n  will-change: transform;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.glass-card-mobile {\n  background: rgba(31, 41, 55, 0.7);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: var(--tv-shadow-md);\n}\n@supports (backdrop-filter: blur(16px)) {\n  .glass-card-mobile {\n    -webkit-backdrop-filter: blur(16px) saturate(180%);\n    backdrop-filter: blur(16px) saturate(180%);\n  }\n}\n@supports not (backdrop-filter: blur(16px)) {\n  .glass-card-mobile {\n    background: rgba(31, 41, 55, 0.95);\n  }\n}\n.btn-primary-mobile,\n.btn-secondary-mobile {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 44px;\n  padding: 12px 24px;\n  font-weight: 600;\n  font-size: 0.875rem;\n  border-radius: 12px;\n  background:\n    linear-gradient(\n      135deg,\n      var(--tv-red-primary),\n      var(--tv-red-hover));\n  color: white;\n  transition: all var(--transition-fast);\n  touch-action: manipulation;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.btn-primary-mobile:active,\n.btn-secondary-mobile:active {\n  transform: scale(0.95);\n  background: var(--tv-red-active);\n}\n.btn-primary-mobile:disabled,\n.btn-secondary-mobile:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n  transform: none;\n}\n@media (min-width: 640px) {\n  .btn-primary-mobile,\n  .btn-secondary-mobile {\n    min-height: 48px;\n    padding: 14px 28px;\n    font-size: 1rem;\n  }\n}\n.btn-secondary-mobile {\n  background: rgba(75, 85, 99, 0.3);\n  border: 1px solid rgba(156, 163, 175, 0.3);\n}\n.btn-secondary-mobile:hover {\n  background: rgba(75, 85, 99, 0.4);\n  border-color: rgba(156, 163, 175, 0.5);\n}\n.fab-mobile {\n  position: fixed;\n  bottom: 1.5rem;\n  right: 1.5rem;\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: var(--tv-gradient-primary);\n  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all var(--transition-normal);\n  touch-action: manipulation;\n  z-index: 40;\n}\n.fab-mobile:active {\n  transform: scale(0.9);\n}\n@media (min-width: 640px) {\n  .fab-mobile {\n    width: 64px;\n    height: 64px;\n  }\n}\n.card-mobile {\n  background: rgba(31, 41, 55, 0.6);\n  border: 1px solid rgba(75, 85, 99, 0.3);\n  border-radius: 16px;\n  padding: var(--spacing-lg);\n  transition: all var(--transition-normal);\n}\n@supports (backdrop-filter: blur(12px)) {\n  .card-mobile {\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n.card-mobile:active {\n  transform: translateY(2px);\n}\n@media (min-width: 640px) {\n  .card-mobile {\n    padding: var(--spacing-xl);\n    border-radius: 20px;\n  }\n}\ndetails summary {\n  cursor: pointer;\n  list-style: none;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n  padding: 1rem 1.25rem;\n}\ndetails summary::-webkit-details-marker {\n  display: none;\n}\ndetails summary::marker {\n  display: none;\n}\n@media (min-width: 640px) {\n  details summary {\n    padding: 1.25rem 1.5rem;\n  }\n}\ndetails[open] > div {\n  animation: slideDown 0.2s ease-out;\n}\n@keyframes slideDown {\n  from {\n    opacity: 0;\n    transform: translateY(-8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.grid-mobile-2 {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .grid-mobile-2 {\n    gap: var(--spacing-lg);\n  }\n}\n@media (min-width: 768px) {\n  .grid-mobile-2 {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n@media (min-width: 1024px) {\n  .grid-mobile-2 {\n    grid-template-columns: repeat(4, 1fr);\n  }\n}\n.heading-responsive-h1 {\n  font-size: 1.875rem;\n  line-height: 1.2;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h1 {\n    font-size: 2.25rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h1 {\n    font-size: 3rem;\n  }\n}\n.heading-responsive-h2 {\n  font-size: 1.5rem;\n  line-height: 1.3;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h2 {\n    font-size: 1.875rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h2 {\n    font-size: 2.25rem;\n  }\n}\n.heading-responsive-h3 {\n  font-size: 1.25rem;\n  line-height: 1.4;\n}\n@media (min-width: 640px) {\n  .heading-responsive-h3 {\n    font-size: 1.5rem;\n  }\n}\n@media (min-width: 1024px) {\n  .heading-responsive-h3 {\n    font-size: 1.875rem;\n  }\n}\n.text-responsive {\n  font-size: 0.875rem;\n  line-height: 1.5;\n}\n@media (min-width: 640px) {\n  .text-responsive {\n    font-size: 1rem;\n  }\n}\n@media (min-width: 1024px) {\n  .text-responsive {\n    font-size: 1.125rem;\n    line-height: 1.6;\n  }\n}\n*:focus-visible {\n  outline: 2px solid var(--tv-red-primary);\n  outline-offset: 2px;\n  border-radius: 4px;\n}\n*:focus:not(:focus-visible) {\n  outline: none;\n}\n@media (prefers-contrast: high) {\n  .glass-card-mobile,\n  .card-mobile {\n    background: rgba(0, 0, 0, 0.95);\n    border: 2px solid #ffffff;\n  }\n  .btn-primary-mobile,\n  .btn-secondary-mobile {\n    border: 2px solid currentColor;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    color-scheme: dark;\n  }\n}\n.lazy-placeholder {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(75, 85, 99, 0.2),\n      rgba(107, 114, 128, 0.3));\n  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n  will-change: opacity;\n}\n@keyframes pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}\n.will-animate {\n  will-change: transform, opacity;\n}\n.animated-done {\n  will-change: auto;\n}\n@media (max-width: 640px) {\n  a,\n  button,\n  [role=button] {\n    min-height: 44px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n  }\n  .interactive-list > * + * {\n    margin-top: 0.75rem;\n  }\n  .sticky-mobile {\n    position: sticky;\n    top: 0;\n    z-index: 30;\n    background: rgba(17, 24, 39, 0.95);\n    -webkit-backdrop-filter: blur(12px);\n    backdrop-filter: blur(12px);\n  }\n}\n@media (min-width: 641px) and (max-width: 1023px) and (orientation: landscape) {\n  section {\n    padding-top: 2rem;\n    padding-bottom: 2rem;\n  }\n  .grid-mobile-2 {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n@supports (padding: env(safe-area-inset-bottom)) {\n  .safe-bottom {\n    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));\n  }\n  .fab-mobile {\n    bottom: calc(1.5rem + env(safe-area-inset-bottom));\n  }\n}\n@media print {\n  .fab-mobile,\n  .btn-primary-mobile,\n  .btn-secondary-mobile,\n  nav,\n  button {\n    display: none !important;\n  }\n  body {\n    background: white !important;\n    color: black !important;\n  }\n  .card-mobile,\n  .glass-card-mobile {\n    background: white !important;\n    border: 1px solid #000 !important;\n    box-shadow: none !important;\n    page-break-inside: avoid;\n  }\n  a {\n    text-decoration: underline;\n    color: #000 !important;\n  }\n  a[href^=http]:after {\n    content: " (" attr(href) ")";\n    font-size: 0.8em;\n  }\n}\n.skeleton {\n  background:\n    linear-gradient(\n      90deg,\n      rgba(75, 85, 99, 0.2) 25%,\n      rgba(107, 114, 128, 0.3) 50%,\n      rgba(75, 85, 99, 0.2) 75%);\n  background-size: 200% 100%;\n  animation: skeleton-loading 1.5s ease-in-out infinite;\n  border-radius: 8px;\n}\n.skeleton-text {\n  height: 1em;\n  margin-bottom: 0.5em;\n}\n.skeleton-text:last-child {\n  margin-bottom: 0;\n  width: 80%;\n}\n.skeleton-heading {\n  height: 2em;\n  margin-bottom: 1em;\n}\n.skeleton-avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n}\n.skeleton-card {\n  height: 200px;\n  width: 100%;\n}\n@keyframes skeleton-loading {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n.gradient-text-mobile {\n  background: var(--tv-gradient-primary);\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-fill-color: transparent;\n  color: transparent;\n}\n@supports not (-webkit-background-clip: text) {\n  .gradient-text-mobile {\n    color: var(--tv-red-primary);\n  }\n}\n.scroll-snap-container {\n  scroll-snap-type: y mandatory;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n}\n.scroll-snap-container > section {\n  scroll-snap-align: start;\n  scroll-snap-stop: always;\n}\n::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n::-webkit-scrollbar-track {\n  background: rgba(31, 41, 55, 0.3);\n}\n::-webkit-scrollbar-thumb {\n  background: rgba(239, 68, 68, 0.5);\n  border-radius: 4px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: rgba(239, 68, 68, 0.7);\n}\n* {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(239, 68, 68, 0.5) rgba(31, 41, 55, 0.3);\n}\n.img-responsive {\n  max-width: 100%;\n  height: auto;\n  display: block;\n}\n.img-responsive-cover {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.img-responsive-contain {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n.mobile-menu {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 50;\n  background: rgba(0, 0, 0, 0.8);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity var(--transition-normal);\n}\n.mobile-menu.open {\n  opacity: 1;\n  pointer-events: all;\n}\n.mobile-menu-content {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  width: 80%;\n  max-width: 320px;\n  background: rgba(17, 24, 39, 0.98);\n  transform: translateX(100%);\n  transition: transform var(--transition-slow);\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n}\n.mobile-menu.open .mobile-menu-content {\n  transform: translateX(0);\n}\n.toast-mobile {\n  position: fixed;\n  bottom: 1rem;\n  left: 1rem;\n  right: 1rem;\n  padding: 1rem;\n  background: rgba(31, 41, 55, 0.95);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(156, 163, 175, 0.3);\n  border-radius: 12px;\n  box-shadow: var(--tv-shadow-lg);\n  z-index: 100;\n  animation: slideUp 0.3s ease-out;\n}\n@media (min-width: 640px) {\n  .toast-mobile {\n    left: auto;\n    right: 1rem;\n    max-width: 400px;\n  }\n}\n@keyframes slideUp {\n  from {\n    transform: translateY(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n.bottom-nav-mobile {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background: rgba(17, 24, 39, 0.95);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(75, 85, 99, 0.3);\n  padding: 0.75rem;\n  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));\n  z-index: 40;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));\n  gap: 0.5rem;\n}\n@media (min-width: 1024px) {\n  .bottom-nav-mobile {\n    display: none;\n  }\n}\n.bottom-nav-mobile-item {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 0.25rem;\n  min-height: 48px;\n  color: rgb(156, 163, 175);\n  transition: color var(--transition-fast);\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-tap-highlight-color: transparent;\n}\n.bottom-nav-mobile-item.active {\n  color: var(--tv-red-primary);\n}\n.bottom-nav-mobile-item svg {\n  width: 24px;\n  height: 24px;\n}\n.bottom-nav-mobile-item span {\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.p-responsive {\n  padding: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .p-responsive {\n    padding: var(--spacing-lg);\n  }\n}\n@media (min-width: 1024px) {\n  .p-responsive {\n    padding: var(--spacing-xl);\n  }\n}\n.px-responsive {\n  padding-left: var(--spacing-md);\n  padding-right: var(--spacing-md);\n}\n@media (min-width: 640px) {\n  .px-responsive {\n    padding-left: var(--spacing-lg);\n    padding-right: var(--spacing-lg);\n  }\n}\n@media (min-width: 1024px) {\n  .px-responsive {\n    padding-left: var(--spacing-xl);\n    padding-right: var(--spacing-xl);\n  }\n}\n.py-responsive {\n  padding-top: var(--spacing-lg);\n  padding-bottom: var(--spacing-lg);\n}\n@media (min-width: 640px) {\n  .py-responsive {\n    padding-top: var(--spacing-xl);\n    padding-bottom: var(--spacing-xl);\n  }\n}\n@media (min-width: 1024px) {\n  .py-responsive {\n    padding-top: calc(var(--spacing-xl) * 2);\n    padding-bottom: calc(var(--spacing-xl) * 2);\n  }\n}\n@supports (-webkit-appearance: none) {\n  .smooth-scroll {\n    scroll-behavior: smooth;\n    -webkit-overflow-scrolling: touch;\n  }\n}\n@supports (-webkit-touch-callout: none) {\n  input,\n  textarea,\n  select {\n    font-size: 16px !important;\n  }\n  .fab-mobile {\n    bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));\n  }\n}\n.main-container-mobile {\n  min-height: 100vh;\n  min-height: -webkit-fill-available;\n  display: flex;\n  flex-direction: column;\n}\n.no-select {\n  user-select: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n}\n.virtualized-list {\n  contain: layout style paint;\n  content-visibility: auto;\n}\n/*# sourceMappingURL=home.component.css.map */\n'] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HomeComponent, { className: "HomeComponent", filePath: "src/app/pages/home/home.component.ts", lineNumber: 53 });
})();
export {
  HomeComponent
};
/*! Bundled license information:

@angular/animations/fesm2022/animations.mjs:
  (**
   * @license Angular v20.0.0
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=home.component-2GHLNTNU.js.map
