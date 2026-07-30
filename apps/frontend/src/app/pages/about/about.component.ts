import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MetaService } from '../../services/meta.service';
import { generateOrganizationSchema } from '../../utils/utils';
import { FaqSectionComponent, FaqItem } from '../../components/faq-section/faq-section.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, FaqSectionComponent],
  template: `
    <div class="min-h-screen bg-[#081018] text-slate-100">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <!-- Hero -->
      <section class="relative overflow-hidden border-b border-slate-800/80">
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,68,68,0.08),transparent_50%)]"></div>
        <div class="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p class="text-[11px] uppercase tracking-[0.34em] text-red-500 mb-4">Sobre nosotros</p>
          <h1 class="text-4xl font-black tracking-tight text-white md:text-6xl">
            La guía de TV y streaming<br>de referencia en España
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            Guía Programación TV nace con la misión de ofrecer a todos los españoles un punto único donde
            descubrir qué ver, dónde verlo y qué está pasando ahora mismo en televisión y plataformas de streaming.
          </p>
        </div>
      </section>

      <!-- Content -->
      <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

        <!-- Mission -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-4">Nuestra misión</h2>
          <p class="text-slate-300 leading-8">
            Centralizar toda la información de programación televisiva y catálogos de streaming en una sola plataforma.
            Ya no necesitas consultar cada app por separado. Con Guía Programación TV tienes la parrilla completa de TDT,
            canales autonómicos y las principales plataformas de streaming — todo en un solo lugar, actualizado al minuto.
          </p>
        </section>

        <!-- Numbers -->
        <section class="mb-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 text-center">
            <p class="text-3xl font-black text-red-500">100+</p>
            <p class="mt-1 text-sm text-slate-400">Canales de TV</p>
          </div>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 text-center">
            <p class="text-3xl font-black text-red-500">15+</p>
            <p class="mt-1 text-sm text-slate-400">Plataformas streaming</p>
          </div>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 text-center">
            <p class="text-3xl font-black text-red-500">24/7</p>
            <p class="mt-1 text-sm text-slate-400">Actualización en tiempo real</p>
          </div>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 text-center">
            <p class="text-3xl font-black text-red-500">100%</p>
            <p class="mt-1 text-sm text-slate-400">Gratuito</p>
          </div>
        </section>

        <!-- What We Offer -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-6">Qué ofrecemos</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-lg font-semibold text-white mb-2">Programación TV en directo</h3>
              <p class="text-sm text-slate-300">Parrilla completa de todos los canales de la TDT española y canales autonómicos, actualizada en tiempo real con horarios, sinopsis y categorías.</p>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-lg font-semibold text-white mb-2">Catálogo de streaming</h3>
              <p class="text-sm text-slate-300">Explora el catálogo completo de Netflix, HBO Max, Disney+, Amazon Prime Video, Movistar+ y más. Filtra por género, plataforma y disponibilidad.</p>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-lg font-semibold text-white mb-2">Recomendaciones personalizadas</h3>
              <p class="text-sm text-slate-300">Algoritmo de recomendación basado en tus gustos, historial y valoraciones. Descubre contenido nuevo que realmente te interesa.</p>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-lg font-semibold text-white mb-2">Editorial y rankings</h3>
              <p class="text-sm text-slate-300">Artículos, reseñas, rankings y análisis sobre cine, series y anime, conectados con el resto de la app y escritos por expertos en entretenimiento audiovisual.</p>
            </div>
          </div>
        </section>

        <!-- Technology -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-4">Tecnología</h2>
          <p class="text-slate-300 leading-8">
            Desarrollado con Angular 20, Server-Side Rendering para SEO óptimo, y una arquitectura de microservicios
            que garantiza rendimiento y disponibilidad. Nuestra infraestructura procesa datos de EPG (Electronic Program Guide)
            de múltiples fuentes y los enriquece con metadatos de TMDB para ofrecer fichas completas de cada contenido.
          </p>
        </section>

        <!-- Team -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-4">Equipo</h2>
          <p class="text-slate-300 leading-8 mb-6">
            Guía Programación TV es un proyecto de <a href="https://tecnoriasl.com/" target="_blank" rel="noopener" class="text-red-400 hover:text-red-300 transition-colors">TecnoRia S.L.</a>,
            empresa tecnológica española especializada en desarrollo de productos digitales.
          </p>
        </section>

        <!-- Contact -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-4">Contacto</h2>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 space-y-3">
            <p class="text-sm text-slate-300"><span class="text-slate-500">Soporte:</span> soporte&#64;tecnoriasl.com</p>
            <p class="text-sm text-slate-300"><span class="text-slate-500">Legal:</span> legal&#64;tecnoriasl.com</p>
            <p class="text-sm text-slate-300"><span class="text-slate-500">Prensa:</span> prensa&#64;tecnoriasl.com</p>
          </div>
        </section>

        <!-- FAQ -->
        <app-faq-section [items]="faqItems" heading="Preguntas frecuentes sobre Guía TV"></app-faq-section>
      </div>
    </div>
  `,
})
export class AboutComponent implements OnInit {
  safeLdHtml: SafeHtml | null = null;

  faqItems: FaqItem[] = [
    { question: '¿Guía Programación TV es gratis?', answer: 'Sí, el servicio es completamente gratuito. No requiere suscripción ni pago para acceder a toda la programación de TV y catálogo de streaming.' },
    { question: '¿Qué canales de TV incluye?', answer: 'Incluimos todos los canales de la TDT española (La 1, La 2, Antena 3, Cuatro, Telecinco, La Sexta, etc.) y canales autonómicos de todas las comunidades autónomas.' },
    { question: '¿Qué plataformas de streaming cubre?', answer: 'Cubrimos Netflix, HBO Max, Disney+, Amazon Prime Video, Movistar+, Filmin, FlixOlé, Crunchyroll, Apple TV+ y más plataformas disponibles en España.' },
    { question: '¿Cada cuánto se actualiza la programación?', answer: 'La programación de TV se actualiza en tiempo real con datos de EPG (Electronic Program Guide). Los catálogos de streaming se sincronizan diariamente.' },
    { question: '¿Puedo ver televisión directamente en la web?', answer: 'Guía Programación TV es una guía de consulta. Te mostramos qué se emite y dónde, pero el visionado se realiza en la plataforma o canal correspondiente.' },
    { question: '¿Cómo puedo contactar con vosotros?', answer: 'Puedes escribirnos a soporte@tecnoriasl.com para soporte técnico, o a prensa@tecnoriasl.com para consultas de medios y colaboraciones.' },
  ];

  constructor(
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Sobre nosotros - Guía Programación TV',
      description: 'Conoce Guía Programación TV: la guía de televisión y streaming de referencia en España. Descubre nuestra misión, tecnología y equipo.',
      canonicalUrl: '/sobre-nosotros',
    });
    this.buildStructuredData();
  }

  private buildStructuredData(): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schema = generateOrganizationSchema(baseUrl);
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
