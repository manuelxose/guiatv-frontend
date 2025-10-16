/**
 * Servicio para manejo del viewport virtual
 * Ubicación: src/app/services/program-list/viewport-manager.service.ts
 */

import { Injectable, ElementRef, Renderer2, RendererFactory2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IViewportManager } from 'src/app/interfaces/program-list.interface';
import { PROGRAM_LIST_CONFIG } from 'src/app/constants/program-list.constants';


@Injectable({
  providedIn: 'root'
})
export class ViewportManagerService implements IViewportManager {
  
  private renderer: Renderer2;
  private setupAttempted = new Set<string>();
  private setupInProgress = new Set<string>();

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  setupUniqueViewport(elementRef: ElementRef, componentId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🚫 VIEWPORT - Skipping setup on server side');
      return;
    }

    // Prevent multiple simultaneous calls for the same component
    if (this.setupInProgress.has(componentId)) {
      console.log('🔄 VIEWPORT - Setup already in progress for', componentId);
      return;
    }

    // Mark that we've attempted setup for this component
    this.setupAttempted.add(componentId);
    this.setupInProgress.add(componentId);

    console.log('🔧 VIEWPORT - Starting setup for component:', componentId);

    // Start setup with retry mechanism
    this.attemptViewportSetup(elementRef, componentId, 0);
  }

  ensureViewportUniqueness(retryCount: number = 0): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const maxRetries = PROGRAM_LIST_CONFIG.VIEWPORT.MAX_RETRIES;
    
    if (retryCount >= maxRetries) {
      console.warn('🛑 VIEWPORT - Max retries reached for uniqueness check');
      return false;
    }

    try {
      // Check for duplicate viewport IDs in the DOM
      const viewports = document.querySelectorAll('[data-cdk-virtual-scroll-viewport]');
      const uniqueIds = new Set<string>();
      let duplicatesFound = false;

      viewports.forEach((viewport) => {
        const id = viewport.getAttribute('id') || viewport.getAttribute('data-viewport-id');
        if (id) {
          if (uniqueIds.has(id)) {
            duplicatesFound = true;
            console.warn('🚨 VIEWPORT - Duplicate viewport ID found:', id);
          } else {
            uniqueIds.add(id);
          }
        }
      });

      if (duplicatesFound) {
        console.log('🔄 VIEWPORT - Fixing duplicate IDs...');
        this.fixDuplicateViewportIds();
      }

      return !duplicatesFound;
    } catch (error) {
      console.error('❌ VIEWPORT - Error checking uniqueness:', error);
      return false;
    }
  }

  cleanupViewport(): void {
    this.setupAttempted.clear();
    this.setupInProgress.clear();
    console.log('🗑️ VIEWPORT - Cleanup completed');
  }

  isViewportReady(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      const viewports = document.querySelectorAll('cdk-virtual-scroll-viewport');
      return viewports.length > 0;
    } catch (error) {
      console.error('❌ VIEWPORT - Error checking if ready:', error);
      return false;
    }
  }

  private attemptViewportSetup(elementRef: ElementRef, componentId: string, retryCount: number): void {
    const maxRetries = PROGRAM_LIST_CONFIG.VIEWPORT.MAX_RETRIES;
    
    if (retryCount >= maxRetries) {
      console.log('🛑 VIEWPORT - Max retries reached for component:', componentId);
      this.setupInProgress.delete(componentId);
      return;
    }

    setTimeout(() => {
      if (this.performViewportSetup(elementRef, componentId)) {
        console.log('✅ VIEWPORT - Setup successful for component:', componentId);
        this.setupInProgress.delete(componentId);
      } else {
        console.log(`⚠️ VIEWPORT - Setup failed, retrying... (${retryCount + 1}/${maxRetries})`);
        this.attemptViewportSetup(elementRef, componentId, retryCount + 1);
      }
    }, retryCount * PROGRAM_LIST_CONFIG.VIEWPORT.RETRY_DELAY);
  }

  private performViewportSetup(elementRef: ElementRef, componentId: string): boolean {
    try {
      const element = elementRef?.nativeElement;
      
      if (!element) {
        console.warn('⚠️ VIEWPORT - Element not found for component:', componentId);
        return false;
      }

      // Generate unique viewport ID
      const viewportId = this.generateUniqueViewportId(componentId);
      
      // Set multiple unique attributes
      this.setViewportAttributes(element, componentId, viewportId);
      
      // Ensure uniqueness across the DOM
      this.ensureViewportUniqueness();
      
      console.log('✅ VIEWPORT - Attributes set successfully:', {
        componentId,
        viewportId,
        element: element.tagName
      });
      
      return true;
    } catch (error) {
      console.error('❌ VIEWPORT - Setup error:', error);
      return false;
    }
  }

  private setViewportAttributes(element: HTMLElement, componentId: string, viewportId: string): void {
    // Core CDK attributes
    this.renderer.setAttribute(element, 'id', viewportId);
    this.renderer.setAttribute(element, 'data-viewport-id', viewportId);
    
    // Uniqueness attributes
    this.renderer.setAttribute(element, 'data-cdk-unique-instance', componentId);
    this.renderer.setAttribute(element, 'data-component-instance', componentId);
    this.renderer.setAttribute(element, 'cdk-virtual-scroll-unique', componentId);
    
    // Override attributes
    this.renderer.setAttribute(element, 'data-cdk-viewport-instance', componentId);
    this.renderer.setAttribute(element, 'data-angular-component-id', componentId);
    
    // CSS classes for styling and identification
    this.renderer.addClass(element, `viewport-${componentId}`);
    this.renderer.addClass(element, 'unique-viewport-instance');
    
    // Accessibility
    this.renderer.setAttribute(element, 'aria-label', `Program list viewport ${componentId}`);
    this.renderer.setAttribute(element, 'role', 'grid');
  }

  private generateUniqueViewportId(componentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `viewport-${componentId}-${timestamp}-${random}`;
  }

  private fixDuplicateViewportIds(): void {
    try {
      const viewports = document.querySelectorAll('cdk-virtual-scroll-viewport');
      const usedIds = new Set<string>();
      
      viewports.forEach((viewport, index) => {
        const currentId = viewport.getAttribute('id');
        
        if (!currentId || usedIds.has(currentId)) {
          // Generate new unique ID
          const newId = `viewport-fixed-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
          this.renderer.setAttribute(viewport, 'id', newId);
          this.renderer.setAttribute(viewport, 'data-viewport-id', newId);
          this.renderer.addClass(viewport, 'viewport-id-fixed');
          
          console.log('🔧 VIEWPORT - Fixed duplicate ID:', { old: currentId, new: newId });
        }
        
        const finalId = viewport.getAttribute('id');
        if (finalId) {
          usedIds.add(finalId);
        }
      });
    } catch (error) {
      console.error('❌ VIEWPORT - Error fixing duplicate IDs:', error);
    }
  }

  /**
   * Diagnóstico del estado del viewport
   */
  diagnoseViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔍 VIEWPORT DIAGNOSIS - Running on server side');
      return;
    }

    console.log('🔍 VIEWPORT DIAGNOSIS - Starting...');
    
    try {
      const viewports = document.querySelectorAll('cdk-virtual-scroll-viewport');
      
      console.table({
        'Total Viewports': viewports.length,
        'Setup Attempted': this.setupAttempted.size,
        'Setup In Progress': this.setupInProgress.size,
        'Is Ready': this.isViewportReady()
      });
      
      viewports.forEach((viewport, index) => {
        console.log(`Viewport ${index + 1}:`, {
          id: viewport.getAttribute('id'),
          componentId: viewport.getAttribute('data-component-instance'),
          classes: viewport.className,
          uniqueInstance: viewport.getAttribute('data-cdk-unique-instance')
        });
      });
      
    } catch (error) {
      console.error('❌ VIEWPORT DIAGNOSIS - Error:', error);
    }
  }
}