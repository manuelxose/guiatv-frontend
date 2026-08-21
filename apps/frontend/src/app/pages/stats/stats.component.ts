import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { PortalContextNavComponent } from '../../components/portal-context-nav/portal-context-nav.component';
import { APP_PATHS } from '../../config/route-map';
import { CatalogService } from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';

interface PopularItem { title: string; path: string; platform?: string; category?: string; }

@Component({
  selector: 'app-stats', standalone: true,
  imports: [CommonModule, RouterModule, PortalContextNavComponent],
  template: `
    <div class="popular-page">
      <app-portal-context-nav kind="blog"></app-portal-context-nav>
      <header class="popular-page__header"><p>Blog</p><h1>Tendencias</h1><span>Contenidos populares del catálogo de Guía TV.</span></header>
      @if (loading) { <p class="popular-page__status" role="status">Cargando contenidos populares…</p> }
      @else if (error) { <p class="popular-page__status" role="alert">No hemos podido cargar las tendencias ahora mismo.</p> }
      @else if (!items.length) { <p class="popular-page__status">Todavía no hay contenidos populares disponibles.</p> }
      @else {
        <section aria-labelledby="popular-heading">
          <div class="popular-page__section-heading"><h2 id="popular-heading">Popular ahora</h2><a [routerLink]="appPaths.explore">Explorar catálogo</a></div>
          <ol class="popular-page__list">
            @for (item of items; track item.path; let index = $index) {
              <li><span class="popular-page__rank" aria-hidden="true">{{ index + 1 }}</span><a [routerLink]="item.path">{{ item.title }}</a>
                @if (item.platform || item.category) { <small>{{ item.platform }}{{ item.platform && item.category ? ' · ' : '' }}{{ item.category }}</small> }
              </li>
            }
          </ol>
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block}.popular-page{width:min(100%,72rem);margin:0 auto;padding:0 1rem 5rem;color:var(--portal-text)}
    .popular-page__header{padding:clamp(2rem,6vw,4.5rem) 0 2.5rem;border-bottom:1px solid var(--portal-divider)}
    .popular-page__header p{margin:0 0 .55rem;color:var(--guide-accent);font-size:var(--text-xs);font-weight:800}.popular-page__header h1{margin:0;font-size:clamp(2.25rem,6vw,4.25rem);line-height:1;letter-spacing:-.04em}.popular-page__header span{display:block;margin-top:1rem;color:var(--portal-text-soft);font-size:var(--text-lg)}
    .popular-page__status{padding:3rem 0;color:var(--portal-text-soft)}.popular-page section{padding-top:2.5rem}.popular-page__section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;margin-bottom:1rem}.popular-page__section-heading h2{margin:0;font-size:var(--text-2xl)}.popular-page__section-heading a{color:var(--guide-accent);font-weight:700}
    .popular-page__list{list-style:none;margin:0;padding:0;border-top:1px solid var(--portal-divider)}.popular-page__list li{display:grid;grid-template-columns:2.5rem minmax(0,1fr) auto;gap:.75rem;align-items:center;min-height:4.5rem;border-bottom:1px solid var(--portal-divider)}.popular-page__rank{color:var(--portal-text-muted);font-size:var(--text-xl);font-weight:900;font-variant-numeric:tabular-nums}.popular-page__list a{color:var(--portal-text);font-weight:750;text-decoration:none}.popular-page__list a:hover,.popular-page__list a:focus-visible{color:var(--guide-accent)}.popular-page__list small{color:var(--portal-text-muted);text-align:right}
    @media(max-width:639px){.popular-page__list li{grid-template-columns:2rem minmax(0,1fr);padding:.75rem 0}.popular-page__list small{grid-column:2;text-align:left}}
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit, OnDestroy {
  readonly appPaths=APP_PATHS; loading=true; error=false; items:PopularItem[]=[]; private readonly destroy$=new Subject<void>();
  constructor(private readonly metaService:MetaService,private readonly catalogService:CatalogService){}
  ngOnInit():void{
    this.metaService.setMetaTags({title:'Tendencias de TV y streaming | Guía TV',description:'Consulta los contenidos populares del catálogo de Guía TV.',canonicalUrl:APP_PATHS.stats});
    this.catalogService.queryState({sort:'popular',limit:10}).pipe(takeUntil(this.destroy$),catchError(()=>{this.error=true;return of({data:{items:[]}} as any);})).subscribe(result=>{
      const source=(result.data?.items||[]) as any[];this.items=source.map(item=>({title:item.title,path:item.detailPath||APP_PATHS.explore,platform:item.primaryPlatforms?.[0]||item.channel?.name,category:item.genres?.[0]}));this.loading=false;
    });
  }
  ngOnDestroy():void{this.destroy$.next();this.destroy$.complete();}
}
