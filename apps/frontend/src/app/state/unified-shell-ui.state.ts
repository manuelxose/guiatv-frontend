import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../services/storage.service';

export type UnifiedShellRightRailMode = 'context' | 'personal' | 'assistant';

const SHELL_UI_STORAGE_KEY = 'gtv.unified-shell-ui.state';

interface UnifiedShellUiState {
  isFilterDockOpen: boolean;
  isFilterDockPinned: boolean;
  activeShortcutGroup: string;
  mobileFilterSection: string;
  leftRailCollapsed: boolean;
  activeRightRailMode: UnifiedShellRightRailMode;
}

const DEFAULT_UI_STATE: UnifiedShellUiState = {
  isFilterDockOpen: false,
  isFilterDockPinned: false,
  activeShortcutGroup: 'default',
  mobileFilterSection: '',
  leftRailCollapsed: false,
  activeRightRailMode: 'context',
};

@Injectable({ providedIn: 'root' })
export class UnifiedShellUiStateService {
  private readonly storage = inject(StorageService);
  private readonly stateSignal = signal<UnifiedShellUiState>(DEFAULT_UI_STATE);

  readonly state = computed(() => this.stateSignal());
  readonly isFilterDockOpen = computed(() => this.stateSignal().isFilterDockOpen);
  readonly isFilterDockPinned = computed(() => this.stateSignal().isFilterDockPinned);
  readonly activeShortcutGroup = computed(() => this.stateSignal().activeShortcutGroup);
  readonly mobileFilterSection = computed(() => this.stateSignal().mobileFilterSection);
  readonly leftRailCollapsed = computed(() => this.stateSignal().leftRailCollapsed);
  readonly activeRightRailMode = computed(() => this.stateSignal().activeRightRailMode);

  constructor() {
    this.stateSignal.set(this.readState());
  }

  openFilterDock(): void {
    this.patchState({ isFilterDockOpen: true });
  }

  closeFilterDock(): void {
    this.patchState({ isFilterDockOpen: false });
  }

  toggleFilterDock(): void {
    this.patchState({ isFilterDockOpen: !this.stateSignal().isFilterDockOpen });
  }

  setFilterDockPinned(pinned: boolean): void {
    this.patchState({ isFilterDockPinned: pinned });
  }

  setActiveShortcutGroup(group: string): void {
    this.patchState({ activeShortcutGroup: String(group || 'default') });
  }

  setMobileFilterSection(section: string): void {
    this.patchState({ mobileFilterSection: String(section || '') });
  }

  setLeftRailCollapsed(collapsed: boolean): void {
    this.patchState({ leftRailCollapsed: collapsed });
  }

  toggleLeftRailCollapsed(): void {
    this.patchState({ leftRailCollapsed: !this.stateSignal().leftRailCollapsed });
  }

  setRightRailMode(mode: UnifiedShellRightRailMode): void {
    this.patchState({ activeRightRailMode: mode });
  }

  reset(): void {
    this.stateSignal.set(DEFAULT_UI_STATE);
    this.persist(DEFAULT_UI_STATE);
  }

  private patchState(partial: Partial<UnifiedShellUiState>): void {
    this.stateSignal.update((current) => {
      const next = {
        ...current,
        ...partial,
      };
      this.persist(next);
      return next;
    });
  }

  private readState(): UnifiedShellUiState {
    const parsed = this.storage.readJson<Partial<UnifiedShellUiState> | null>(
      SHELL_UI_STORAGE_KEY,
      null
    );
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_UI_STATE;
    }
    return {
      ...DEFAULT_UI_STATE,
      ...parsed,
      leftRailCollapsed: Boolean(parsed.leftRailCollapsed),
      activeRightRailMode:
        parsed.activeRightRailMode === 'personal' || parsed.activeRightRailMode === 'assistant'
          ? parsed.activeRightRailMode
          : 'context',
    };
  }

  private persist(state: UnifiedShellUiState): void {
    this.storage.writeJson(SHELL_UI_STORAGE_KEY, state);
  }
}
