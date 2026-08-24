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
    <div class="min-h-screen bg-[var(--hero-bg)] text-[var(--hero-text)]">
      <section class="relative overflow-hidden border-b border-[var(--hero-border)]">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--hero-accent-strong)_14%,transparent),transparent_42%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--hero-accent-live)_10%,transparent),transparent_36%)]"></div>
        <div class="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--hero-accent)]">Desarrolladores</p>
          <div class="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div class="space-y-5">
              <h1 class="max-w-3xl text-4xl font-black tracking-tight text-[var(--hero-text)] md:text-6xl">
                API y widget embebible para TV, catálogo y programación.
              </h1>
              <p class="max-w-3xl text-base leading-7 text-[var(--hero-text-muted)] md:text-lg">
                Documentación pública para consultar canales, parrillas, layouts, catálogo y búsqueda.
                También puedes integrar el widget real de programación con parámetros soportados y oEmbed.
              </p>
              <div class="flex flex-wrap gap-3">
                <a
                  href="/v2/docs"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--hero-accent-strong)] px-6 text-sm font-semibold text-[var(--hero-bg)] transition-colors hover:bg-[var(--hero-accent)]"
                >
                  Abrir docs API
                </a>
                <a
                  [routerLink]="'/embed'"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] px-6 text-sm font-semibold text-[var(--hero-text)] transition-colors hover:border-[var(--hero-accent-strong)]"
                >
                  Ver widget
                </a>
                <a
                  [routerLink]="'/embed/programacion'"
                  class="inline-flex min-h-[48px] items-center justify-center rounded-full border border-transparent bg-[var(--hero-success-soft)] px-6 text-sm font-semibold text-[var(--hero-success)] transition-colors hover:border-[var(--hero-success)]"
                >
                  Probar iframe real
                </a>
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5">
                <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Cobertura</p>
                <p class="mt-2 text-2xl font-bold text-[var(--hero-text)]">Canales, layouts y catálogo</p>
                <p class="mt-2 text-sm text-[var(--hero-text-muted)]">La misma superficie técnica que alimenta la app pública.</p>
              </div>
              <div class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5">
                <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Widget</p>
                <p class="mt-2 text-2xl font-bold text-[var(--hero-text)]">Programación embebible</p>
                <p class="mt-2 text-sm text-[var(--hero-text-muted)]">Parrilla real basada en <code>ProgramListComponent</code>, no una demo estática.</p>
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
                <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">API pública</p>
                <h2 class="mt-2 text-2xl font-semibold text-[var(--hero-text)]">Endpoints reales disponibles</h2>
              </div>

              <div class="space-y-3">
                <article
                  *ngFor="let endpoint of endpoints"
                  class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                      [ngClass]="endpoint.method === 'GET'
                        ? 'bg-[var(--hero-success-soft)] text-[var(--hero-success)]'
                        : 'bg-[var(--hero-accent-soft)] text-[var(--hero-accent)]'"
                    >
                      {{ endpoint.method }}
                    </span>
                    <div class="min-w-0">
                      <code class="break-all text-sm font-semibold text-[var(--hero-text)]">{{ endpoint.path }}</code>
                      <p class="mt-1 text-sm text-[var(--hero-text-muted)]">{{ endpoint.description }}</p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="grid gap-4 lg:grid-cols-2">
              <article
                *ngFor="let card of linkCards"
                class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5"
              >
                <p class="text-sm font-semibold text-[var(--hero-text)]">{{ card.title }}</p>
                <p class="mt-2 text-sm leading-6 text-[var(--hero-text-muted)]">{{ card.description }}</p>
                <a
                  class="mt-4 inline-flex text-sm font-semibold text-[var(--hero-accent)] hover:text-[var(--hero-accent-strong)]"
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
                <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Inicio rápido</p>
                <h2 class="mt-2 text-2xl font-semibold text-[var(--hero-text)]">Consultas de ejemplo</h2>
              </div>

              <div class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] overflow-hidden">
                <div class="border-b border-[var(--hero-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--hero-text-muted)]">cURL</div>
                <pre class="overflow-x-auto p-4 text-sm text-[var(--hero-success)]"><code>{{ curlExample }}</code></pre>
              </div>

              <div class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] overflow-hidden">
                <div class="border-b border-[var(--hero-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--hero-text-muted)]">JavaScript</div>
                <pre class="overflow-x-auto p-4 text-sm text-[var(--hero-accent)]"><code>{{ jsExample }}</code></pre>
              </div>

              <div class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] overflow-hidden">
                <div class="border-b border-[var(--hero-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--hero-text-muted)]">Python</div>
                <pre class="overflow-x-auto p-4 text-sm text-[var(--hero-text)]"><code>{{ pythonExample }}</code></pre>
              </div>
            </section>

            <section class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Widget</p>
                <h2 class="mt-2 text-2xl font-semibold text-[var(--hero-text)]">Contrato público soportado</h2>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div
                  *ngFor="let param of widgetParams"
                  class="rounded-[1.25rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-4"
                >
                  <code class="text-sm font-semibold text-[var(--hero-text)]">{{ param.name }}</code>
                  <p class="mt-2 text-sm text-[var(--hero-text-muted)]">{{ param.description }}</p>
                </div>
              </div>
            </section>
          </div>

          <aside class="space-y-6">
            <section class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Respuesta tipo</p>
              <pre class="mt-3 overflow-x-auto text-xs leading-6 text-[var(--hero-text)]"><code>{{ responseExample }}</code></pre>
            </section>

            <section class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Buenas prácticas</p>
              <ul class="mt-4 space-y-3 text-sm text-[var(--hero-text-muted)]">
                <li>Usa <code>/v2/docs</code> como referencia principal del contrato HTTP.</li>
                <li>Para embebidos, prioriza <code>/v2/oembed</code>, <code>/embed</code> y <code>/embed/programacion</code>.</li>
                <li>Los endpoints personalizados como <code>/v2/discovery/for-you</code> requieren sesión.</li>
                <li>La zona horaria operativa es <code>Europe/Madrid</code> y las fechas se exponen en ISO 8601.</li>
              </ul>
            </section>

            <section class="rounded-[1.5rem] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] p-5">
              <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">Contacto técnico</p>
              <p class="mt-3 text-sm text-[var(--hero-text-muted)]">
                Para integraciones, incidencias o acuerdos de uso, contacta con
                <a href="mailto:dev@tecnoriasl.com" class="font-semibold text-[var(--hero-accent)] hover:text-[var(--hero-accent-strong)]">
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
    { method: 'GET', path: '/v2/tv/read', description: 'Canonical TV read model for day, now, next, night, and search views.' },
    { method: 'GET', path: '/v2/tv/read/channels', description: 'Channel summaries grouped by canonical TV metadata.' },
    { method: 'GET', path: '/v2/tv/read/channels/:channelId', description: 'Canonical TV schedule filtered to a single channel.' },
    { method: 'GET', path: '/v2/tv/surface/guide', description: 'Single-call TV guide BFF used by the main guide page.' },
    { method: 'GET', path: '/v2/tv/surface/channels/:channelId', description: 'Single-call channel page surface with current, next, tonight, and full schedule.' },
    { method: 'GET', path: '/v2/discovery/home', description: 'Home surface with live TV rails and streaming discovery rails.' },
    { method: 'GET', path: '/v2/discovery/search', description: 'Unified public discovery search for TV and streaming.' },
    { method: 'GET', path: '/v2/discovery/browse', description: 'Single-call browse surface for movies and series listings.' },
    { method: 'GET', path: '/v2/content/:id', description: 'Unified content detail endpoint for TV and streaming items.' },
    { method: 'GET', path: '/v2/catalog/platforms', description: 'Canonical platform registry used by discovery filters.' },
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

  readonly curlExample = `curl -s "https://guiaprogramaciontv.com/v2/tv/surface/guide?date=today&group=tdt" \\
  -H "Accept: application/json"`;

  readonly jsExample = `const response = await fetch(
  'https://guiaprogramaciontv.com/v2/catalog?types=movie,series&availability=streaming&limit=12'
);
const { data } = await response.json();
return data.items;`;

  readonly pythonExample = `import requests

response = requests.get(
    'https://guiaprogramaciontv.com/v2/tv/read/channels/la_1',
    params={'date': 'today'}
)
payload = response.json()
programs = payload['data']['items']`;

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
        'Consulta la API pública de Guía TV, la documentación oficial y el widget embebible de programación para TV, discovery y catálogo.',
      canonicalUrl: '/developers',
    });
  }
}
