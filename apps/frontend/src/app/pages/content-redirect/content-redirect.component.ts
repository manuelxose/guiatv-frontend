import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-content-redirect',
  standalone: true,
  template: '<p class="p-8 text-center text-slate-400">Redirigiendo…</p>',
})
export class ContentRedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);

  ngOnInit(): void {
    const catalogId = decodeURIComponent(
      this.route.snapshot.paramMap.get('catalogId') || ''
    );
    if (!catalogId) {
      void this.router.navigate(['/not-found'], { skipLocationChange: true });
      return;
    }

    this.catalogService.getDetail(catalogId).subscribe({
      next: (item) => {
        if (item?.detailPath) {
          void this.router.navigate([item.detailPath], { replaceUrl: true });
        } else {
          void this.router.navigate(['/not-found'], { skipLocationChange: true });
        }
      },
      error: () => {
        void this.router.navigate(['/not-found'], { skipLocationChange: true });
      },
    });
  }
}
