import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent surface colors', () => {
  it('keeps embedded page breadcrumbs readable and opts dark heroes in explicitly', () => {
    TestBed.configureTestingModule({ imports: [BreadcrumbComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BreadcrumbComponent);
    const host: HTMLElement = fixture.nativeElement;
    host.style.setProperty('--portal-text-soft', '#222222');
    host.style.setProperty('--portal-text', '#111111');
    host.style.setProperty('--hero-text-muted', '#dddddd');
    host.style.setProperty('--hero-text', '#ffffff');
    fixture.componentRef.setInput('items', [{ name: 'Inicio', url: '/' }, { name: 'TV', url: '/tv' }]);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    host.querySelector('a')!.style.transition = 'none';
    expect(getComputedStyle(host.querySelector('a')!).color).toBe('rgb(34, 34, 34)');
    expect(getComputedStyle(host.querySelector('.breadcrumb__current')!).color).toBe('rgb(17, 17, 17)');

    fixture.componentRef.setInput('onHero', true);
    fixture.detectChanges();
    expect(getComputedStyle(host.querySelector('a')!).color).toBe('rgb(221, 221, 221)');
    expect(getComputedStyle(host.querySelector('.breadcrumb__current')!).color).toBe('rgb(255, 255, 255)');
  });
});
