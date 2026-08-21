import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StreamingComparisonComponent } from './streaming-comparison.component';

describe('StreamingComparisonComponent', () => {
  let component: StreamingComparisonComponent;
  let fixture: ComponentFixture<StreamingComparisonComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingComparisonComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render the main sections', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Comparador de plataformas');
    expect(fixture.nativeElement.textContent).toContain('Precios y prestaciones');
    expect(fixture.nativeElement.textContent).toContain('Preguntas frecuentes');
    expect(component.platformComparisons.length).toBeGreaterThan(0);
  });

  it('should build real query params for platform catalog links', () => {
    const primeVideo = component.platformComparisons.find(
      (comparison) => comparison.platform.key === 'prime-video'
    );

    expect(primeVideo).toBeDefined();
    expect(primeVideo?.queryParams).toEqual({
      platform: 'Prime Video',
      availability: 'streaming',
    });
  });

  it('should render as an inner Platforms view without a second shell or breadcrumb', () => {
    expect(fixture.nativeElement.querySelector('app-portal-context-nav')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-breadcrumb')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-unified-portal-shell')).toBeNull();
    expect(fixture.nativeElement.innerHTML).not.toContain('routerlink="/streaming"');
    expect(fixture.nativeElement.innerHTML).not.toContain('href="/streaming"');
  });
});
