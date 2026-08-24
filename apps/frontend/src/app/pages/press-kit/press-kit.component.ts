import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetaService } from '../../services/meta.service';

@Component({
  selector: 'app-press-kit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <!-- Hero -->
      <section class="relative overflow-hidden border-b border-[var(--portal-border)]">
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,68,68,0.06),transparent_50%)]"></div>
        <div class="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p class="text-[11px] uppercase tracking-[0.34em] text-[var(--accent-live)] mb-4">Prensa</p>
          <h1 class="text-4xl font-black tracking-tight text-[var(--portal-text)] md:text-6xl">
            Kit de Prensa
          </h1>
          <p class="mt-6 text-lg leading-8 text-[var(--portal-text-soft)] max-w-2xl mx-auto">
            Recursos oficiales para medios de comunicación y periodistas. Logos, descripción editorial y datos clave de Guía Programación TV.
          </p>
        </div>
      </section>

      <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

        <!-- Quick Facts -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-6">Datos clave</h2>
          <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6">
            <dl class="space-y-4 text-sm">
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">Nombre</dt>
                <dd class="text-[var(--portal-text)] font-medium">Guía Programación TV</dd>
              </div>
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">URL</dt>
                <dd class="text-[var(--portal-text)] font-medium">guiaprogramaciontv.com</dd>
              </div>
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">Empresa</dt>
                <dd class="text-[var(--portal-text)] font-medium">TecnoRia S.L.</dd>
              </div>
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">Sector</dt>
                <dd class="text-[var(--portal-text)] font-medium">Entretenimiento / Tecnología</dd>
              </div>
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">Mercado</dt>
                <dd class="text-[var(--portal-text)] font-medium">España</dd>
              </div>
              <div class="flex justify-between border-b border-[var(--portal-border)] pb-3">
                <dt class="text-[var(--portal-text-muted)]">Año de lanzamiento</dt>
                <dd class="text-[var(--portal-text)] font-medium">2023</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-[var(--portal-text-muted)]">Precio</dt>
                <dd class="text-[var(--portal-text)] font-medium">Gratuito</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- Description -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-4">Descripción editorial</h2>
          <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6 space-y-4">
            <div>
              <p class="text-[11px] uppercase tracking-wider text-[var(--portal-text-muted)] mb-2">Versión corta (1 línea)</p>
              <p class="text-[var(--portal-text-soft)] italic">"Guía Programación TV es la guía de televisión y streaming de referencia en España."</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-[var(--portal-text-muted)] mb-2">Versión media (2-3 líneas)</p>
              <p class="text-[var(--portal-text-soft)] italic">
                "Guía Programación TV es una plataforma gratuita que centraliza la programación de todos los canales de la TDT española
                y los catálogos de las principales plataformas de streaming. Permite descubrir qué ver, cuándo y dónde, con recomendaciones
                personalizadas y actualizaciones en tiempo real."
              </p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-[var(--portal-text-muted)] mb-2">Versión larga</p>
              <p class="text-[var(--portal-text-soft)] italic">
                "Guía Programación TV (guiaprogramaciontv.com) es la guía de televisión y streaming más completa de España.
                La plataforma ofrece la parrilla en tiempo real de más de 100 canales de la TDT y canales autonómicos, junto
                con el catálogo completo de Netflix, HBO Max, Disney+, Amazon Prime Video, Movistar+ y más de 15 plataformas de streaming.
                Con un sistema de recomendaciones personalizadas, blog editorial con análisis de contenido, y una comunidad activa de
                amantes del cine y la televisión, Guía Programación TV se posiciona como el punto de referencia para decidir qué ver
                cada día. El proyecto es desarrollado por TecnoRia S.L., empresa tecnológica española."
              </p>
            </div>
          </div>
        </section>

        <!-- Logos -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-6">Logotipos</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-8 flex flex-col items-center gap-4">
              <div class="bg-[var(--portal-surface)] rounded-xl p-6 flex items-center justify-center">
                <img src="/assets/logo.svg" alt="Logo Guía TV" class="h-16 w-auto" loading="lazy" />
              </div>
              <p class="text-sm text-[var(--portal-text-muted)]">Logo principal (fondo oscuro)</p>
              <a href="/assets/logo.svg" download class="text-sm text-[var(--accent-live)] hover:opacity-75 transition-opacity">Descargar SVG</a>
            </div>
            <div class="rounded-2xl border border-[var(--portal-border)] bg-white p-8 flex flex-col items-center gap-4">
              <div class="p-6 flex items-center justify-center">
                <img src="/assets/logo.svg" alt="Logo Guía TV" class="h-16 w-auto" loading="lazy" />
              </div>
              <p class="text-sm text-[var(--portal-text-faint)]">Logo principal (fondo claro)</p>
              <a href="/assets/logo.svg" download class="text-sm text-[var(--accent-live)] hover:opacity-75 transition-opacity">Descargar SVG</a>
            </div>
          </div>
          <div class="mt-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6">
            <h3 class="text-sm font-semibold text-[var(--portal-text)] mb-3">Colores de marca</h3>
            <div class="flex gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-red-500"></div>
                <span class="text-sm text-[var(--portal-text-soft)]">#EF4444 (Rojo principal)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-[var(--portal-bg)]"></div>
                <span class="text-sm text-[var(--portal-text-soft)]">#081018 (Fondo)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-white"></div>
                <span class="text-sm text-[var(--portal-text-soft)]">#FFFFFF (Texto)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Screenshots -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-4">Capturas de pantalla</h2>
          <p class="text-[var(--portal-text-muted)] text-sm mb-6">
            Para solicitar capturas de pantalla de alta resolución, contacta con prensa&#64;tecnoriasl.com.
          </p>
        </section>

        <!-- Contact -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-4">Contacto de prensa</h2>
          <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6 space-y-3">
            <p class="text-sm text-[var(--portal-text-soft)]"><span class="text-[var(--portal-text-muted)]">Email:</span> prensa&#64;tecnoriasl.com</p>
            <p class="text-sm text-[var(--portal-text-soft)]"><span class="text-[var(--portal-text-muted)]">Tiempo de respuesta:</span> Menos de 24 horas laborables</p>
          </div>
        </section>

        <!-- Usage Guidelines -->
        <section>
          <h2 class="text-2xl font-bold text-[var(--portal-text)] mb-4">Directrices de uso</h2>
          <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6">
            <ul class="list-disc list-inside space-y-2 text-sm text-[var(--portal-text-soft)]">
              <li>Utiliza el nombre completo "Guía Programación TV" en la primera mención.</li>
              <li>En menciones posteriores se acepta "Guía TV", "GuíaTV" o "GPTV".</li>
              <li>No distorsiones, recortes ni modifiques los logotipos.</li>
              <li>Respeta los colores originales sin modificar la paleta.</li>
              <li>Incluye un enlace a <a href="https://guiaprogramaciontv.com" class="text-[var(--accent-live)] hover:opacity-75 transition-opacity">guiaprogramaciontv.com</a> cuando sea posible.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class PressKitComponent implements OnInit {
  constructor(private readonly metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Kit de Prensa - Guía Programación TV',
      description: 'Recursos oficiales para medios de comunicación: logotipos, descripción editorial, datos clave y contacto de prensa de Guía Programación TV.',
      canonicalUrl: '/prensa',
    });
  }
}
