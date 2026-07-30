import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';

interface DeveloperEndpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

interface DeveloperLinkCard {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#081018] text-slate-100">
      <section class="relative overflow-hidden border-b border-slate-800/70">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_36%)]"></div>
        <div class="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-300">Desarrolladores</p>
          <div class="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div class="space-y-5">
              <h1 class="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                API y widget embebible para TV, catálogo y programación.
              </h1>
              <p class="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                Documentación pública para consultar canales, parrillas, layouts, catálogo y búsqueda.
                También puedes integrar el widget real de programación con parámetros soportados y oEmbed.
              </p>
              <div class="flex flex-wrap gap-3">
                <a
                  href="/v2/docs"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                >
                  Abrir docs API
                </a>
                <a
                  [routerLink]="'/embed'"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-6 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:text-white"
                >
                  Ver widget
                </a>
                <a
                  [routerLink]="'/embed/programacion'"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-semibold text-emerald-200 transition-colors hover:border-emerald-400/40"
                >
                  Probar iframe real
                </a>
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5">
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Cobertura</p>
                <p class="mt-2 text-2xl font-bold text-white">Canales, layouts y catálogo</p>
                <p class="mt-2 text-sm text-slate-400">La misma superficie técnica que alimenta la app pública.</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5">
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Widget</p>
                <p class="mt-2 text-2xl font-bold text-white">Programación embebible</p>
                <p class="mt-2 text-sm text-slate-400">Parrilla real basada en <code>ProgramListComponent</code>, no una demo estática.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div class="space-y-10">
            <section class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">API pública</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">Endpoints reales disponibles</h2>
              </div>

              <div class="space-y-3">
                <article
                  *ngFor="let endpoint of endpoints"
                  class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                      [ngClass]="endpoint.method === 'GET'
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'bg-sky-500/15 text-sky-200'"
                    >
                      {{ endpoint.method }}
                    </span>
                    <div class="min-w-0">
                      <code class="break-all text-sm font-semibold text-white">{{ endpoint.path }}</code>
                      <p class="mt-1 text-sm text-slate-400">{{ endpoint.description }}</p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="grid gap-4 lg:grid-cols-2">
              <article
                *ngFor="let card of linkCards"
                class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5"
              >
                <p class="text-sm font-semibold text-white">{{ card.title }}</p>
                <p class="mt-2 text-sm leading-6 text-slate-400">{{ card.description }}</p>
                <a
                  class="mt-4 inline-flex text-sm font-semibold text-sky-300 hover:text-sky-200"
                  [href]="card.href"
                  [attr.target]="card.external ? '_blank' : null"
                  [attr.rel]="card.external ? 'noopener noreferrer' : null"
                >
                  Abrir recurso
                </a>
              </article>
            </section>

            <section class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Inicio rápido</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">Consultas de ejemplo</h2>
              </div>

              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/80 overflow-hidden">
                <div class="border-b border-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">cURL</div>
                <pre class="overflow-x-auto p-4 text-sm text-emerald-200"><code>{{ curlExample }}</code></pre>
              </div>

              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/80 overflow-hidden">
                <div class="border-b border-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">JavaScript</div>
                <pre class="overflow-x-auto p-4 text-sm text-sky-100"><code>{{ jsExample }}</code></pre>
              </div>

              <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/80 overflow-hidden">
                <div class="border-b border-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Python</div>
                <pre class="overflow-x-auto p-4 text-sm text-slate-100"><code>{{ pythonExample }}</code></pre>
              </div>
            </section>

            <section class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Widget</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">Contrato público soportado</h2>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div
                  *ngFor="let param of widgetParams"
                  class="rounded-[1.25rem] border border-slate-800/80 bg-slate-950/70 p-4"
                >
                  <code class="text-sm font-semibold text-white">{{ param.name }}</code>
                  <p class="mt-2 text-sm text-slate-400">{{ param.description }}</p>
                </div>
              </div>
            </section>
          </div>

          <aside class="space-y-6">
            <section class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Respuesta tipo</p>
              <pre class="mt-3 overflow-x-auto text-xs leading-6 text-slate-200"><code>{{ responseExample }}</code></pre>
            </section>

            <section class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Buenas prácticas</p>
              <ul class="mt-4 space-y-3 text-sm text-slate-300">
                <li>Usa <code>/v2/docs</code> como referencia principal del contrato HTTP.</li>
                <li>Para embebidos, prioriza <code>/v2/oembed</code>, <code>/embed</code> y <code>/embed/programacion</code>.</li>
                <li>Los endpoints personalizados como <code>/v2/discovery/for-you</code> requieren sesión.</li>
                <li>La zona horaria operativa es <code>Europe/Madrid</code> y las fechas se exponen en ISO 8601.</li>
              </ul>
            </section>

            <section class="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/70 p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">Contacto técnico</p>
              <p class="mt-3 text-sm text-slate-300">
                Para integraciones, incidencias o acuerdos de uso, contacta con
                <a href="mailto:dev@tecnoriasl.com" class="font-semibold text-sky-300 hover:text-sky-200">
                  dev&#64;tecnoriasl.com
                </a>.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  `,
})
export class DevelopersComponent implements OnInit {
  readonly endpoints: DeveloperEndpoint[] = [
    { method: 'GET', path: '/v2/channels', description: 'Listado de canales activos con metadatos y filtros básicos.' },
    { method: 'GET', path: '/v2/channels/:id', description: 'Detalle de canal con información editorial y operativa.' },
    { method: 'GET', path: '/v2/channels/:id/programs', description: 'Programación del canal seleccionado.' },
    { method: 'GET', path: '/v2/schedules/:date', description: 'Parrilla agrupada por fecha con alias como `today` o `tomorrow`.' },
    { method: 'GET', path: '/v2/layouts/:date', description: 'Layouts listos para la guía y el widget embebible.' },
    { method: 'GET', path: '/v2/catalog', description: 'Catálogo unificado de TV, streaming y disponibilidad.' },
    { method: 'GET', path: '/v2/catalog/platforms', description: 'Registro canónico de plataformas del catálogo.' },
    { method: 'GET', path: '/v2/catalog/slug/:contentType/:slug', description: 'Detalle SEO-friendly por slug para película, serie o programa.' },
    { method: 'GET', path: '/v2/discovery/search', description: 'Búsqueda pública para discovery y navegación.' },
    { method: 'GET', path: '/v2/oembed', description: 'Respuesta oEmbed oficial del widget embebible.' },
  ];

  readonly linkCards: DeveloperLinkCard[] = [
    {
      title: 'Swagger / OpenAPI',
      description: 'Referencia navegable del API HTTP expuesto por el backend público.',
      href: '/v2/docs',
      external: false,
    },
    {
      title: 'Landing del widget',
      description: 'Documentación comercial y técnica del embed con ejemplos reales.',
      href: '/embed',
      external: false,
    },
    {
      title: 'Widget real de programación',
      description: 'Ruta pública pensada para iframe con la parrilla completa.',
      href: '/embed/programacion?theme=light&channels=5&date=today',
      external: false,
    },
    {
      title: 'oEmbed',
      description: 'Entrada automática para CMS, previews y plataformas compatibles con oEmbed.',
      href: '/v2/oembed?url=https://guiaprogramaciontv.com/embed/programacion',
      external: true,
    },
  ];

  readonly widgetParams = [
    { name: 'theme=light|dark', description: 'Tema visual del iframe.' },
    { name: 'channels=<n>', description: 'Límite máximo de canales visibles.' },
    { name: 'channelIds=<csv>', description: 'Selección exacta de canales con prioridad sobre `channels`.' },
    { name: 'date=today|tomorrow|YYYYMMDD', description: 'Fecha o alias soportado por el widget.' },
    { name: 'timeSlot=0..7', description: 'Franja inicial visible dentro de la parrilla.' },
    { name: 'channelTypes=<csv>', description: 'Filtro por familia de canal: `TDT`, `AUTONOMICO`, `MOVISTAR`, `CABLE`, `OTT`.' },
    { name: 'category=<alias>', description: 'Alias legacy normalizado internamente a tipos de canal.' },
    { name: 'autorefresh=<segundos>', description: 'Autorefresco acotado para integraciones activas.' },
    { name: 'lang=es', description: 'Compatibilidad de idioma actualmente soportada.' },
  ];

  readonly curlExample = `curl -s "https://guiaprogramaciontv.com/v2/layouts/today?fields=full&limit=20" \\
  -H "Accept: application/json"`;

  readonly jsExample = `const response = await fetch(
  'https://guiaprogramaciontv.com/v2/catalog?types=movie,series&availability=streaming&limit=12'
);
const { data } = await response.json();
return data.items;`;

  readonly pythonExample = `import requests

response = requests.get(
    'https://guiaprogramaciontv.com/v2/channels/la_1/programs',
    params={'date': 'today'}
)
payload = response.json()
programs = payload['data']`;

  readonly responseExample = `{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 0,
      "hasMore": false
    }
  }
}`;

  constructor(private readonly metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Desarrolladores y API pública - Guía TV',
      description:
        'Consulta la API pública de Guía TV, la documentación oficial y el widget embebible de programación para canales, catálogo y layouts.',
      canonicalUrl: '/developers',
    });
  }
}
