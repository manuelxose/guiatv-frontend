import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SitemapService, SitemapUrl } from '../../../services/sitemap.service';
import { BlogService } from '../../../services/blog.service';

@Component({
  selector: 'app-sitemap',
  templateUrl: './sitemap.component.html',
  styleUrls: ['./sitemap.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class SitemapComponent {
  private readonly sitemapService = inject(SitemapService);
  private readonly blogService = inject(BlogService);
  
  public readonly sitemapUrls: SitemapUrl[] = this.sitemapService.getAllUrls();
  public showXmlPreview = false;
  public showRssPreview = false;
  public xmlContent = '';
  public rssContent = '';

  downloadSitemap(): void {
    this.sitemapService.downloadSitemap();
  }

  downloadRss(): void {
    this.blogService.getAllPosts().subscribe(posts => {
      const items = posts.map(post => ({
        title: post.title.rendered,
        link: `/editorial/${post.slug}`,
        description: post.excerpt.rendered,
        pubDate: new Date(post.date)
      }));
      this.sitemapService.downloadRss(items);
    });
  }

  toggleXmlPreview(): void {
    if (!this.showXmlPreview) {
      this.xmlContent = this.sitemapService.generateSitemapXML();
    }
    this.showXmlPreview = !this.showXmlPreview;
    this.showRssPreview = false;
  }

  toggleRssPreview(): void {
    if (!this.showRssPreview) {
      this.blogService.getAllPosts().subscribe(posts => {
        const items = posts.map(post => ({
          title: post.title.rendered,
          link: `/editorial/${post.slug}`,
          description: post.excerpt.rendered,
          pubDate: new Date(post.date)
        }));
        this.rssContent = this.sitemapService.generateRssXML(items);
      });
    }
    this.showRssPreview = !this.showRssPreview;
    this.showXmlPreview = false;
  }

  copyToClipboard(): void {
    const xml = this.sitemapService.generateSitemapXML();
    navigator.clipboard.writeText(xml).then(() => {
      alert('Sitemap XML copiado al portapapeles');
    });
  }

  copyRssToClipboard(): void {
    this.blogService.getAllPosts().subscribe(posts => {
      const items = posts.map(post => ({
        title: post.title.rendered,
        link: `/editorial/${post.slug}`,
        description: post.excerpt.rendered,
        pubDate: new Date(post.date)
      }));
      const xml = this.sitemapService.generateRssXML(items);
      navigator.clipboard.writeText(xml).then(() => {
        alert('RSS XML copiado al portapapeles');
      });
    });
  }

  getPriorityColor(priority: number | undefined): string {
    if (!priority) return 'text-[var(--portal-text-muted)]';
    if (priority >= 0.8) return 'text-green-400';
    if (priority >= 0.5) return 'text-yellow-400';
    return 'text-[var(--portal-text-muted)]';
  }

  getPriorityBg(priority: number | undefined): string {
    if (!priority) return 'bg-gray-500/20';
    if (priority >= 0.8) return 'bg-green-500/20';
    if (priority >= 0.5) return 'bg-yellow-500/20';
    return 'bg-gray-500/20';
  }
}
