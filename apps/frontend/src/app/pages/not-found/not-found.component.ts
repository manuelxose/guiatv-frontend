import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="min-h-[70vh] w-full flex items-center justify-center px-4 py-14 text-[var(--portal-text)]">
      <section class="w-full max-w-xl rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-8 text-center shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
        <p class="text-[11px] uppercase tracking-[0.22em] text-red-300">404</p>
        <h1 class="mt-3 text-2xl font-semibold text-[var(--portal-text)]">Página no encontrada</h1>
        <p class="mt-3 text-sm text-[var(--portal-text-soft)]">
          La ruta solicitada no existe o cambió de ubicación.
        </p>
        <div class="mt-6 flex items-center justify-center gap-3">
          <a
            routerLink="/"
            class="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Volver al inicio
          </a>
          <a
            routerLink="/programacion-tv/guia-canales"
            class="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--portal-border)] px-5 py-2.5 text-sm font-semibold text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Ir a la guía
          </a>
        </div>
      </section>
    </main>
  `,
})
export class NotFoundComponent implements OnInit {
  constructor(private metaSvc: MetaService) {}

  ngOnInit(): void {
    this.metaSvc.setMetaTags({
      title: 'Página no encontrada - Guía TV',
      description: 'La página que buscas no existe o ha sido movida.',
      robots: 'noindex, nofollow',
      httpStatus: 404,
    });
  }
}
