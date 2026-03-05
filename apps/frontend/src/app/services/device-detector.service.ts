/**
 * Device Detection Service - SSR Compatible con User-Agent
 * Detecta en servidor y transfiere estado al cliente
 */

import {
  Injectable,
  signal,
  computed,
  PLATFORM_ID,
  inject,
  DestroyRef,
  Inject,
  Optional,
  REQUEST,
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Request } from 'express';
import { TransferState, makeStateKey } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
}

// Keys para TransferState
const DEVICE_INFO_KEY = makeStateKey<DeviceInfo>('deviceInfo');

@Injectable({
  providedIn: 'root',
})
export class DeviceDetectorService {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private transferState = inject(TransferState);

  // Request solo disponible en servidor
  private request = inject(REQUEST, { optional: true });

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly isServer = isPlatformServer(this.platformId);

  // Signals reactivos
  private readonly width = signal(1024);
  private readonly height = signal(768);
  private readonly _isTouchDevice = signal(false);
  // Inicialización
  private readonly initialized = signal(false);

  // Computed properties
  public readonly deviceType = computed<DeviceType>(() => {
    const w = this.width();
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  public readonly isMobile = computed(() => this.deviceType() === 'mobile');
  public readonly isTablet = computed(() => this.deviceType() === 'tablet');
  public readonly isDesktop = computed(() => this.deviceType() === 'desktop');

  public readonly orientation = computed<'portrait' | 'landscape'>(() => {
    return this.width() < this.height() ? 'portrait' : 'landscape';
  });

  public readonly isTouchDevice = computed(() => this._isTouchDevice());

  public readonly deviceInfo = computed<DeviceInfo>(() => ({
    type: this.deviceType(),
    isMobile: this.isMobile(),
    isTablet: this.isTablet(),
    isDesktop: this.isDesktop(),
    width: this.width(),
    height: this.height(),
    orientation: this.orientation(),
    isTouchDevice: this.isTouchDevice(),
  }));

  constructor() {
    console.log('🏗️ DeviceDetectorService constructor', {
      isServer: this.isServer,
      isBrowser: this.isBrowser,
      hasRequest: !!this.request,
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
  private detectDeviceOnServer(): void {
    if (!this.request) {
      console.warn('⚠️ REQUEST no disponible en servidor');
      return;
    }

    const userAgent = this.request.headers['user-agent'] || '';
    console.log('🔍 SERVER - User-Agent:', userAgent);

    // Detectar tipo de dispositivo por User-Agent
    const deviceInfo = this.parseUserAgent(userAgent);

    console.log('📱 SERVER - Device detected:', deviceInfo);

    // Aplicar detección
    this.width.set(deviceInfo.width);
    this.height.set(deviceInfo.height);
    this._isTouchDevice.set(deviceInfo.isTouchDevice);

    // Guardar en TransferState para el cliente
    this.transferState.set(DEVICE_INFO_KEY, deviceInfo);

    console.log('💾 SERVER - Device info guardado en TransferState');

    // Marcar inicializado
    this.initialized.set(true);
  }

  /**
   * INICIALIZACIÓN EN EL CLIENTE
   * Lee desde TransferState o detecta manualmente
   */
  private initializeOnClient(): void {
    console.log('🌐 CLIENT - Inicializando detección...');

    // 1. Intentar obtener info del servidor
    const serverDeviceInfo = this.transferState.get<DeviceInfo>(
      DEVICE_INFO_KEY,
      null
    );

    if (serverDeviceInfo) {
      console.log(
        '✅ CLIENT - Usando device info del servidor:',
        serverDeviceInfo
      );
      this.applyDeviceInfo(serverDeviceInfo);

      // Limpiar TransferState
      this.transferState.remove(DEVICE_INFO_KEY);
    } else {
      console.log(
        '⚠️ CLIENT - No hay info del servidor, detectando manualmente...'
      );
      this.detectDeviceOnClient();
    }

    // 2. Setup resize listener
    this.setupResizeListener();

    // Marcar inicializado (ya tenemos valores aplicados o listener listo)
    this.initialized.set(true);
  }

  /**
   * Detectar dispositivo en el cliente (fallback)
   */
  private detectDeviceOnClient(): void {
    if (typeof window === 'undefined') return;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      this.width.set(width);
      this.height.set(height);
      this._isTouchDevice.set(isTouchDevice);

      console.log('📱 CLIENT - Device detected:', {
        width,
        height,
        type: this.deviceType(),
        isMobile: this.isMobile(),
        isTouch: isTouchDevice,
      });

      // Marcar inicializado
      this.initialized.set(true);
    } catch (error) {
      console.error('❌ CLIENT - Error detecting device:', error);
    }
  }

  /**
   * Aplicar información de dispositivo
   */
  private applyDeviceInfo(info: DeviceInfo): void {
    this.width.set(info.width);
    this.height.set(info.height);
    this._isTouchDevice.set(info.isTouchDevice);
  }

  /**
   * Parser de User-Agent para detección de dispositivos
   */
  private parseUserAgent(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    // Detectar móviles
    const mobileRegex =
      /mobile|android|iphone|ipod|phone|blackberry|opera mini|iemobile|windows phone/i;
    const isMobileUA = mobileRegex.test(ua);

    // Detectar tablets
    const tabletRegex = /tablet|ipad|playbook|silk|kindle/i;
    const isTabletUA = tabletRegex.test(ua) && !mobileRegex.test(ua);

    // Detectar touch
    const isTouchDevice = isMobileUA || isTabletUA;

    // Determinar dimensiones estimadas
    let width = 1920; // Desktop por defecto
    let height = 1080;

    if (isMobileUA) {
      // Móvil portrait
      width = 375;
      height = 667;

      // Detectar móviles específicos con pantallas más grandes
      if (
        ua.includes('iphone') &&
        (ua.includes('pro max') || ua.includes('plus'))
      ) {
        width = 428;
        height = 926;
      } else if (ua.includes('iphone')) {
        width = 390;
        height = 844;
      } else if (ua.includes('pixel')) {
        width = 412;
        height = 915;
      } else if (ua.includes('samsung') || ua.includes('galaxy')) {
        width = 360;
        height = 800;
      }
    } else if (isTabletUA) {
      // Tablet
      width = 768;
      height = 1024;

      if (ua.includes('ipad pro')) {
        width = 1024;
        height = 1366;
      }
    }

    const type: DeviceType = isMobileUA
      ? 'mobile'
      : isTabletUA
      ? 'tablet'
      : 'desktop';

    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      width,
      height,
      orientation: width < height ? 'portrait' : 'landscape',
      isTouchDevice,
    };
  }

  /**
   * Setup resize listener (solo cliente)
   */
  private setupResizeListener(): void {
    if (!this.isBrowser || typeof window === 'undefined') return;

    try {
      fromEvent(window, 'resize')
        .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (typeof window !== 'undefined') {
            this.width.set(window.innerWidth);
            this.height.set(window.innerHeight);
            console.log('🔄 Window resized:', {
              width: this.width(),
              height: this.height(),
              type: this.deviceType(),
            });
          }
        });
    } catch (error) {
      console.error('❌ Error setting up resize listener:', error);
    }
  }

  // Métodos públicos
  public getOptimalColumns(): number {
    const type = this.deviceType();
    switch (type) {
      case 'mobile':
        return 2;
      case 'tablet':
        return 3;
      case 'desktop':
        return 7;
      default:
        return 7;
    }
  }

  public getOptimalItemSize(): number {
    const type = this.deviceType();
    switch (type) {
      case 'mobile':
        return 68;
      case 'tablet':
        return 75;
      case 'desktop':
        return 80;
      default:
        return 75;
    }
  }

  public getOptimalPadding(): string {
    const type = this.deviceType();
    switch (type) {
      case 'mobile':
        return '0.5rem';
      case 'tablet':
        return '1rem';
      case 'desktop':
        return '1.5rem';
      default:
        return '1rem';
    }
  }

  public get isRunningInBrowser(): boolean {
    return this.isBrowser;
  }

  public isInitialized(): boolean {
    return this.initialized();
  }

  public forceDetection(): void {
    if (this.isBrowser) {
      this.detectDeviceOnClient();
      // Asegurar flag de inicialización
      this.initialized.set(true);
    }
  }
}
