/**
 * AppComponent con integración SOLID (mantiene funcionalidad original)
 * Ubicación: src/app/app.component.ts
 */

import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationStart,
} from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Componentes originales
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';
import { ModalComponent } from './components/modal/modal.component';

// Servicios SOLID (opcional - solo para logging mejorado)
import { ConsoleLoggerService } from './services/core/logger.service';
import { FooterComponent } from './components/footer/footer.component';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LeftSidebarComponent,
    RightSidebarComponent,
    FooterComponent,
    ModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private static instanceCount = 0;
  private instanceId: string;
  private destroy$ = new Subject<void>();
  private routerEventsDisabled = false;
  private navigationCount = 0;

  // Integración opcional con SOLID logging
  private logger = inject(ConsoleLoggerService, { optional: true });
  private analytics = inject(AnalyticsService);

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly router: Router
  ) {
    AppComponent.instanceCount++;
    this.instanceId = `app-${AppComponent.instanceCount}`;

    // Logging mejorado con SOLID (fallback a console si no está disponible)
    this.logInfo(`🏗️ APP COMPONENT - Instancia ${this.instanceId} creada`);

    // Protección contra múltiples instancias del AppComponent
    if (AppComponent.instanceCount > 1) {
      this.logWarning(
        `⚠️ MÚLTIPLES INSTANCIAS DE APP COMPONENT DETECTADAS: ${AppComponent.instanceCount}`
      );
      this.logWarning(
        '🔄 Instancia adicional iniciada (puede ser normal en desarrollo con HMR)'
      );

      // En lugar de return, continuamos pero con logging mejorado
    }

    // Monitorear navegación con protección mejorada
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart || event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (this.routerEventsDisabled) {
          this.logWarning(
            '🚫 Eventos de router deshabilitados para evitar bucle'
          );
          return;
        }

        if (event instanceof NavigationStart) {
          this.navigationCount++;
          this.logDebug(
            `🧭 Navegación iniciada: ${event.url} (count: ${this.navigationCount})`
          );

          // Protección mejorada contra bucles de navegación
          if (this.navigationCount > 5) {
            this.logError(
              '⚠️ BUCLE DE NAVEGACIÓN DETECTADO - DESHABILITANDO EVENTOS'
            );
            this.logError(
              '🛑 ROUTER EVENTS DISABLED PARA PREVENIR BUCLE INFINITO'
            );
            this.routerEventsDisabled = true;
            this.destroy$.next();
            return;
          }
        } else if (event instanceof NavigationEnd) {
          this.logDebug(`✅ Navegación completada: ${event.url}`);

          // Resetear contador después de navegación exitosa
          this.analytics.trackPageView(event.urlAfterRedirects || event.url);
          setTimeout(() => {
            this.navigationCount = 0;
            this.logDebug('🔄 Contador de navegación reseteado');
          }, 2000);
        }
      });
  }

  ngOnInit(): void {
    this.analytics.init();
    this.logInfo(`🚀 APP COMPONENT INIT - Instancia ${this.instanceId}`);
    this.logInfo('✅ Arquitectura SOLID inicializada');

    // Protección adicional en ngOnInit
    if (AppComponent.instanceCount > 1) {
      this.logWarning(
        `⚠️ Múltiples instancias detectadas en ngOnInit (${AppComponent.instanceCount})`
      );
      // Continuar con la inicialización normal
    }

    // Log del estado de la aplicación
    this.logDebug('📊 App Component State:', {
      instanceId: this.instanceId,
      instanceCount: AppComponent.instanceCount,
      platformId: this.platformId,
      routerEventsDisabled: this.routerEventsDisabled,
    });
  }

  ngOnDestroy(): void {
    this.logInfo(`🗑️ APP COMPONENT DESTROY - Instancia ${this.instanceId}`);

    this.destroy$.next();
    this.destroy$.complete();

    // Decrementar contador de instancias
    AppComponent.instanceCount = Math.max(0, AppComponent.instanceCount - 1);

    this.logDebug(
      `📉 Instance count after destroy: ${AppComponent.instanceCount}`
    );
  }

  // ===============================================
  // MÉTODOS DE LOGGING CON FALLBACK
  // ===============================================

  private logInfo(message: string, ...args: any[]): void {
    if (this.logger) {
      this.logger.info(message, ...args);
    } else {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  private logWarning(message: string, ...args: any[]): void {
    if (this.logger) {
      this.logger.warn(message, ...args);
    } else {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  private logError(message: string, ...args: any[]): void {
    if (this.logger) {
      this.logger.error(message, ...args);
    } else {
      console.error(`❌ ${message}`, ...args);
    }
  }

  private logDebug(message: string, ...args: any[]): void {
    if (this.logger) {
      this.logger.debug(message, ...args);
    } else {
      console.debug(`🔍 ${message}`, ...args);
    }
  }

  // ===============================================
  // MÉTODOS PÚBLICOS PARA DEBUGGING
  // ===============================================

  /**
   * Método público para debugging del estado del componente
   */
  public debugAppState(): any {
    const state = {
      instanceId: this.instanceId,
      instanceCount: AppComponent.instanceCount,
      routerEventsDisabled: this.routerEventsDisabled,
      navigationCount: this.navigationCount,
      isDestroyed: this.destroy$.closed,
    };

    this.logDebug('=== APP COMPONENT DEBUG STATE ===');
    this.logDebug('App State:', state);
    this.logDebug('=== END APP COMPONENT DEBUG ===');

    return state;
  }

  /**
   * Método para resetear protecciones (útil en desarrollo)
   */
  public resetNavigationProtection(): void {
    this.logInfo('🔄 Reseteando protecciones de navegación');
    this.routerEventsDisabled = false;
    this.navigationCount = 0;
  }
}

