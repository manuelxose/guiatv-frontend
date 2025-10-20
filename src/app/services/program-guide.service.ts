// program-guide.service.ts - SERVICIO OPTIMIZADO
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milisegundos
}

interface ProgramDetail {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  cast?: string[];
  director?: string;
  year?: number;
  duration: number;
  rating: number;
  category: any;
  images?: {
    poster?: string;
    backdrop?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProgramGuideService {
  private http = inject(HttpClient);

  // Caché de programación por día
  private programCache = new Map<string, CacheEntry<any>>();

  // Caché de detalles de programas
  private detailCache = new Map<string, CacheEntry<ProgramDetail>>();

  // Subject para notificar cambios
  private cacheUpdated$ = new BehaviorSubject<string | null>(null);

  // Configuración de TTL (Time To Live)
  private readonly PROGRAM_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
  private readonly DETAIL_CACHE_TTL = 60 * 60 * 1000; // 60 minutos

  // ============================================================
  // PROGRAM GUIDE DATA
  // ============================================================

  /**
   * Obtiene la guía de programación para un día específico
   * Usa caché inteligente para evitar llamadas redundantes
   */
  getProgramGuide(dayOffset: number): Observable<any> {
    const cacheKey = `day_${dayOffset}`;

    // 1. Verificar caché
    const cached = this.getFromCache(this.programCache, cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: Usando datos cacheados para día ${dayOffset}`);
      return of(cached);
    }

    console.log(`📡 Cache MISS: Cargando datos para día ${dayOffset}`);

    // 2. Cargar desde API
    return this.http
      .get<any>(`/api/v2/program-guide?dayOffset=${dayOffset}`)
      .pipe(
        catchError((error) => {
          console.warn('⚠️ API no disponible, usando mock', error);
          return of(this.generateMockData(dayOffset));
        }),
        tap((data) => {
          // 3. Guardar en caché
          this.setInCache(
            this.programCache,
            cacheKey,
            data,
            this.PROGRAM_CACHE_TTL
          );
          this.cacheUpdated$.next(cacheKey);
        }),
        shareReplay(1) // Compartir la petición entre suscriptores
      );
  }

  /**
   * Pre-carga datos de días cercanos para navegación instantánea
   */
  preloadAdjacentDays(currentDay: number): void {
    const daysToPreload = [currentDay - 1, currentDay + 1].filter(
      (d) => d >= 0 && d <= 2
    );

    daysToPreload.forEach((day) => {
      const cacheKey = `day_${day}`;
      if (!this.programCache.has(cacheKey)) {
        console.log(`🔄 Pre-cargando día ${day}`);
        this.getProgramGuide(day).subscribe();
      }
    });
  }

  // ============================================================
  // PROGRAM DETAIL
  // ============================================================

  /**
   * Obtiene detalle completo de un programa
   * Decisión: Si ya tenemos info básica, mostrarla inmediatamente
   * y cargar el detalle completo en segundo plano
   */
  getProgramDetail(
    programId: string,
    basicInfo?: any
  ): Observable<ProgramDetail> {
    const cacheKey = programId;

    // 1. Verificar caché
    const cached = this.getFromCache(this.detailCache, cacheKey);
    if (cached) {
      console.log(`✅ Detail Cache HIT: ${programId}`);
      return of(cached);
    }

    // 2. Si tenemos info básica, usarla como fallback inmediato
    const fallbackDetail: ProgramDetail = basicInfo
      ? {
          id: basicInfo.id,
          title: basicInfo.title,
          description: basicInfo.description || 'Sin descripción disponible',
          duration: basicInfo.totalDurationMinutes || 0,
          rating: basicInfo.rating || 0,
          category: basicInfo.category,
          // Campos extendidos se cargarán después
        }
      : null;

    // 3. Cargar detalle completo de API
    console.log(`📡 Cargando detalle completo: ${programId}`);

    return this.http
      .get<ProgramDetail>(`/api/program-detail/${programId}`)
      .pipe(
        catchError((error) => {
          console.warn('⚠️ Detalle no disponible, usando mock', error);

          // Fallback: enriquecer info básica con mock
          if (fallbackDetail) {
            return of({
              ...fallbackDetail,
              fullDescription: this.generateMockDescription(basicInfo.title),
              cast: this.generateMockCast(),
              director: 'Director Desconocido',
              images: {
                poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(
                  basicInfo.title
                )}`,
                backdrop: `https://via.placeholder.com/1280x720?text=${encodeURIComponent(
                  basicInfo.title
                )}`,
              },
            });
          }

          throw error;
        }),
        tap((detail) => {
          // 4. Guardar en caché
          this.setInCache(
            this.detailCache,
            cacheKey,
            detail,
            this.DETAIL_CACHE_TTL
          );
        }),
        shareReplay(1)
      );
  }

  // ============================================================
  // CACHE MANAGEMENT
  // ============================================================

  /**
   * Obtiene datos de caché si están vigentes
   */
  private getFromCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string
  ): T | null {
    const entry = cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.expiresIn;

    if (isExpired) {
      console.log(`⏰ Cache expirado: ${key}`);
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Guarda datos en caché con TTL
   */
  private setInCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl: number
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });

    console.log(`💾 Datos guardados en caché: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Limpia caché completa
   */
  clearCache(): void {
    this.programCache.clear();
    this.detailCache.clear();
    console.log('🗑️ Caché limpiada');
  }

  /**
   * Limpia entradas expiradas
   */
  cleanExpiredCache(): void {
    const now = Date.now();

    // Limpiar caché de programas
    this.programCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        this.programCache.delete(key);
        console.log(`🗑️ Eliminada entrada expirada: ${key}`);
      }
    });

    // Limpiar caché de detalles
    this.detailCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        this.detailCache.delete(key);
      }
    });
  }

  /**
   * Obtiene estadísticas de caché
   */
  getCacheStats() {
    return {
      programCacheSize: this.programCache.size,
      detailCacheSize: this.detailCache.size,
      totalSize: this.programCache.size + this.detailCache.size,
    };
  }

  // ============================================================
  // MOCK DATA GENERATORS
  // ============================================================

  private generateMockData(dayOffset: number): any {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);

    return {
      metadata: {
        date: date.toISOString().split('T')[0],
        dayOffset,
      },
      timeSlots: this.generateMockTimeSlots(),
      channels: this.generateMockChannels(),
    };
  }

  private generateMockTimeSlots(): any[] {
    const slots = [
      { start: '06:00', end: '09:00' },
      { start: '09:00', end: '12:00' },
      { start: '12:00', end: '15:00' },
      { start: '15:00', end: '18:00' },
      { start: '18:00', end: '21:00' },
      { start: '21:00', end: '00:00' },
      { start: '00:00', end: '03:00' },
      { start: '03:00', end: '06:00' },
    ];

    const currentHour = new Date().getHours();
    const currentSlot = Math.floor(currentHour / 3);

    return slots.map((slot, index) => ({
      index,
      label: `${slot.start} - ${slot.end}`,
      startTime: slot.start,
      endTime: slot.end,
      hours: this.generateHours(slot.start, slot.end),
      currentSlot: index === currentSlot,
    }));
  }

  private generateHours(start: string, end: string): string[] {
    const hours: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    while (true) {
      hours.push(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      );

      if (h === endH && m === endM) break;

      m += 30;
      if (m >= 60) {
        m = 0;
        h = (h + 1) % 24;
      }
    }

    return hours;
  }

  private generateMockChannels(): any[] {
    const channels = [
      {
        id: 'tve1',
        name: 'La 1',
        logo: 'https://graph.facebook.com/la1tve/picture?type=large',
        position: 1,
      },
      {
        id: 'la2',
        name: 'La 2',
        logo: 'https://graph.facebook.com/la2tve/picture?type=large',
        position: 2,
      },
      {
        id: 'antena3',
        name: 'Antena 3',
        logo: 'https://graph.facebook.com/antena3/picture?type=large',
        position: 3,
      },
      {
        id: 'cuatro',
        name: 'Cuatro',
        logo: 'https://graph.facebook.com/cuatro/picture?type=large',
        position: 4,
      },
      {
        id: 'telecinco',
        name: 'Telecinco',
        logo: 'https://graph.facebook.com/telecinco/picture?type=large',
        position: 5,
      },
      {
        id: 'lasexta',
        name: 'La Sexta',
        logo: 'https://graph.facebook.com/lasexta/picture?type=large',
        position: 6,
      },
    ];

    return channels.map((channel) => ({
      ...channel,
      timeSlotPrograms: this.generateMockProgramsForChannel(channel.id),
    }));
  }

  private generateMockProgramsForChannel(channelId: string): any {
    const programs: any = {};

    // Generar programas para cada franja (0-7)
    for (let slotIndex = 0; slotIndex < 8; slotIndex++) {
      programs[slotIndex] = this.generateMockPrograms(channelId, slotIndex);
    }

    return programs;
  }

  private generateMockPrograms(channelId: string, slotIndex: number): any[] {
    const categories = [
      { id: 'news', name: 'Noticias', color: '#ef4444' },
      { id: 'entertainment', name: 'Entretenimiento', color: '#f59e0b' },
      { id: 'sports', name: 'Deportes', color: '#22c55e' },
      { id: 'movies', name: 'Películas', color: '#8b5cf6' },
      { id: 'series', name: 'Series', color: '#3b82f6' },
      { id: 'documentary', name: 'Documental', color: '#14b8a6' },
    ];

    const programTitles = [
      'Telediario',
      'La Mañana',
      'Magazine',
      'Cocina con...',
      'Noticias',
      'Cine de Tarde',
      'Serie Drama',
      'Deportes',
      'Programa Musical',
      'Documental',
      'Reality Show',
    ];

    // Generar 2 programas por franja
    const programs = [];

    for (let i = 0; i < 2; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const title =
        programTitles[Math.floor(Math.random() * programTitles.length)];

      // Calcular posiciones en grid
      const columnStart = i === 0 ? 1 : 19;
      const columnEnd = i === 0 ? 19 : 37;

      programs.push({
        id: `${channelId}_slot${slotIndex}_prog${i + 1}`,
        title: `${title} ${slotIndex * 2 + i + 1}`,
        description: `Programa de ${category.name.toLowerCase()}`,
        visibleStartTime: i === 0 ? '09:00' : '10:30',
        visibleEndTime: i === 0 ? '10:30' : '12:00',
        totalDurationMinutes: 90,
        visibleDurationMinutes: 90,
        gridPosition: {
          columnStart,
          columnEnd,
          layer: 0,
        },
        flags: {
          startsBeforeSlot: false,
          endsAfterSlot: false,
          startsBeforeDay: false,
        },
        category,
        rating: Math.floor(Math.random() * 4) + 6, // 6-10
      });
    }

    return programs;
  }

  private generateMockDescription(title: string): string {
    return `Descripción completa del programa "${title}". Este es un contenido de ejemplo generado automáticamente. En producción, aquí aparecería la sinopsis completa del programa con información detallada sobre el contenido, los temas tratados, y otros detalles relevantes para el espectador.`;
  }

  private generateMockCast(): string[] {
    const names = [
      'Ana García',
      'Carlos López',
      'María Fernández',
      'José Martínez',
      'Laura Sánchez',
      'David Rodríguez',
    ];

    const castSize = Math.floor(Math.random() * 3) + 2;
    return names.slice(0, castSize);
  }
}
