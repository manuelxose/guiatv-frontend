import { CommonModule, isPlatformServer } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, PLATFORM_ID, RESPONSE_INIT, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetaService } from '../../services/meta.service';
import { CatalogDetailComponent } from '../catalog-detail/catalog-detail.component';
import { UnifiedAsyncStateComponent } from '../../components/unified-async-state/unified-async-state.component';

interface PublicEntity {
  entityId: string;
  kind: string;
  title: string;
  canonicalPath: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  genres?: string[];
}

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CatalogDetailComponent, UnifiedAsyncStateComponent],
  styles: [':host { display: block; min-width: 0; }'],
  template: `
    @if (legacy) {
      <app-catalog-detail />
    } @else {
      <section class="min-h-[60vh] bg-[var(--portal-bg)] px-4 py-10 text-[var(--portal-text)] sm:px-6">
        <div class="mx-auto max-w-4xl space-y-6">
          <a routerLink="/" class="inline-block underline underline-offset-4">Inicio</a>
          @if (loading) {
            <p role="status" aria-live="polite">Cargando ficha…</p>
          } @else if (entity; as content) {
            <h1 class="break-words text-3xl font-bold sm:text-5xl">{{ content.title }}</h1>
            @if (content.originalTitle && content.originalTitle !== content.title) {
              <p>{{ content.originalTitle }}</p>
            }
            @if (content.year) { <p>{{ content.year }}</p> }
            @if (content.genres?.length) { <p>{{ content.genres?.join(' · ') }}</p> }
            @if (content.synopsis) {
              <p class="max-w-prose whitespace-pre-line text-base leading-7">{{ content.synopsis }}</p>
            } @else { <p>Sinopsis no disponible.</p> }
          } @else {
            <app-unified-async-state [kind]="unavailable ? 'error' : 'empty'"
              [title]="unavailable ? 'Ficha no disponible' : 'Contenido no encontrado'"
              [message]="unavailable ? 'No se pudo cargar la ficha. Inténtalo más tarde.' : 'Esta ficha no está disponible.'" />
          }
        </div>
      </section>
    }
  `,
})
export class EntityDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  private readonly server = isPlatformServer(inject(PLATFORM_ID));
  entity?: PublicEntity;
  legacy = false;
  loading = true;
  unavailable = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(() => {
        this.entity = undefined;
        this.legacy = false;
        this.loading = true;
        this.unavailable = false;
        this.setMeta('Ficha - Guía TV', null);
        return this.http.get<{ success: boolean; data: PublicEntity }>(`${environment.API_BASE_URL}/entities/resolve`, {
          params: { path: this.router.url.split(/[?#]/)[0], redirect: 'false' },
        }).pipe(catchError((error: HttpErrorResponse) => {
          this.loading = false;
          if (error.status === 404 && error.error?.error?.code === 'ENTITY_PUBLIC_READ_DISABLED' && this.route.snapshot.data['contentType']) {
            this.legacy = true;
          } else {
            this.fail([400, 404, 410].includes(error.status) ? error.status : 503);
          }
          return EMPTY;
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ success, data }) => {
        this.loading = false;
        if (!success || !data?.title || !/^\/(peliculas|series|programas)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.canonicalPath)) {
          this.fail(503);
          return;
        }
        this.entity = data;
        this.markEntityResponse();
        this.setMeta(`${data.title} - Guía TV`, data.canonicalPath, 200, data.synopsis);
        if (data.canonicalPath !== this.router.url.split(/[?#]/)[0]) {
          if (this.server && this.response) {
            this.response.status = 301;
            this.response.headers = { ...this.response.headers, Location: data.canonicalPath, 'X-Robots-Tag': 'noindex, follow' };
          } else {
            void this.router.navigateByUrl(data.canonicalPath, { replaceUrl: true });
          }
        }
      },
    });
  }

  private fail(status: number): void {
    this.markEntityResponse();
    this.unavailable = status >= 500;
    this.setMeta('Ficha no disponible - Guía TV', null, status);
  }

  private markEntityResponse(): void {
    if (this.response) this.response.headers = {
      ...this.response.headers,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Entity-Public-Read': '1',
      'Cache-Control': 'no-store',
    };
  }

  private setMeta(title: string, canonicalUrl: string | null, httpStatus?: number, description = ''): void {
    this.meta.setMetaTags({ title, description, canonicalUrl, robots: 'noindex, follow', httpStatus });
    if (this.response && httpStatus) this.response.status = httpStatus;
  }
}
