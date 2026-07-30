import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MetaService } from '../../services/meta.service';

interface EmbedExample {
  title: string;
  code: string;
}

interface EmbedParam {
  name: string;
  type: string;
  description: string;
}

@Component({
  selector: 'app-embed-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './embed-page.component.html',
  styleUrls: ['./embed-page.component.scss'],
})
export class EmbedPageComponent implements OnInit {
  public copied = false;
  private readonly previewPath =
    '/embed/programacion?theme=light&channels=5&date=today&autorefresh=300&lang=es';
  public readonly previewSrc: SafeResourceUrl;

  public readonly embedCode = `<iframe
  src="https://guiaprogramaciontv.com/embed/programacion?theme=light&channels=5&date=today&autorefresh=300&lang=es"
  width="390"
  height="720"
  frameborder="0"
  title="Programación TV embebida"
  loading="lazy">
</iframe>`;

  public readonly params: EmbedParam[] = [
    { name: 'theme', type: 'string', description: '"light" o "dark". Por defecto: light.' },
    { name: 'channels', type: 'number', description: 'Límite visible de canales (1-20). Por defecto: 5.' },
    { name: 'channelIds', type: 'csv', description: 'Ids exactos de canal; tiene prioridad sobre el límite numérico.' },
    { name: 'date', type: 'string', description: '"yesterday", "today", "tomorrow", "after_tomorrow" o YYYYMMDD.' },
    { name: 'timeSlot', type: 'number', description: 'Franja inicial de 0 a 7.' },
    { name: 'channelTypes', type: 'csv', description: 'TDT,AUTONOMICO,MOVISTAR,CABLE,OTT.' },
    { name: 'category', type: 'string', description: 'Alias legacy de tipo: "tdt", "autonomicos", "tvpago" o "todos".' },
    { name: 'autorefresh', type: 'number', description: 'Autorefresco en segundos. Mínimo 60.' },
    { name: 'lang', type: 'string', description: 'Compatibilidad actual: solo "es".' },
  ];

  public readonly examples: EmbedExample[] = [
    {
      title: 'Widget claro con cinco canales',
      code: '<iframe src="https://guiaprogramaciontv.com/embed/programacion?theme=light&channels=5&date=today" width="390" height="720" frameborder="0" loading="lazy"></iframe>',
    },
    {
      title: 'Widget oscuro con TV de pago',
      code: '<iframe src="https://guiaprogramaciontv.com/embed/programacion?theme=dark&category=tvpago&channels=8&timeSlot=6" width="420" height="760" frameborder="0"></iframe>',
    },
    {
      title: 'Selección exacta de canales',
      code: '<iframe src="https://guiaprogramaciontv.com/embed/programacion?theme=light&channelIds=la_1,antena_3,telecinco&autorefresh=300" width="420" height="760" frameborder="0"></iframe>',
    },
  ];

  constructor(
    private readonly metaService: MetaService,
    private readonly sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.previewSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.previewPath
    );
  }

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Widget de Programación TV | Guía TV',
      description:
        'Integra la parrilla real de programación TV en tu web con un iframe configurable y compatible con oEmbed.',
      canonicalUrl: '/embed',
    });
  }

  copyCode(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    navigator.clipboard.writeText(this.embedCode);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
