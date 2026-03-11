import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StreamingComparisonComponent } from './streaming-comparison.component';
import { MetaService } from '../../services/meta.service';

describe('StreamingComparisonComponent', () => {
  let component: StreamingComparisonComponent;
  let fixture: ComponentFixture<StreamingComparisonComponent>;
  let metaService: jasmine.SpyObj<MetaService>;

  beforeEach(async () => {
    metaService = jasmine.createSpyObj<MetaService>('MetaService', ['setMetaTags']);

    await TestBed.configureTestingModule({
      imports: [StreamingComparisonComponent],
      providers: [provideRouter([]), { provide: MetaService, useValue: metaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render the main sections', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Compara plataformas sin salir del catálogo real de la app.'
    );
    expect(fixture.nativeElement.textContent).toContain('Tabla comparativa');
    expect(fixture.nativeElement.textContent).toContain('Preguntas frecuentes');
    expect(component.platformComparisons.length).toBeGreaterThan(0);
  });

  it('should build real query params for platform catalog links', () => {
    const primeVideo = component.platformComparisons.find(
      (comparison) => comparison.platform.key === 'prime-video'
    );

    expect(primeVideo).toBeDefined();
    expect(primeVideo?.queryParams).toEqual({
      platforms: 'Prime Video',
      availability: 'streaming',
      types: 'movie,series',
    });
  });

  it('should configure canonical metadata and avoid legacy streaming routes', () => {
    expect(metaService.setMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        canonicalUrl: '/comparador-streaming',
      })
    );
    expect(fixture.nativeElement.innerHTML).not.toContain('routerlink="/streaming"');
    expect(fixture.nativeElement.innerHTML).not.toContain('href="/streaming"');
  });
});
