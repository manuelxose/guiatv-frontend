import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PortalContextNavComponent } from './portal-context-nav.component';

describe('PortalContextNavComponent', () => {
  let fixture: ComponentFixture<PortalContextNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalContextNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PortalContextNavComponent);
  });

  it('renders all football route destinations with the active view and one breadcrumb', () => {
    fixture.componentRef.setInput('kind', 'sports');
    fixture.componentRef.setInput('active', 'today');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-breadcrumb').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.portal-context-nav__track a').length).toBe(7);
    expect(fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent).toContain('Partidos de hoy');
  });

  it('renders local state destinations as pressed buttons and emits selection', () => {
    fixture.componentRef.setInput('kind', 'live');
    fixture.componentRef.setInput('active', 'night');
    fixture.detectChanges();
    spyOn(fixture.componentInstance.itemSelect, 'emit');

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.portal-context-nav__track button')) as HTMLButtonElement[];
    expect(buttons.length).toBe(4);
    expect(buttons.find((button) => button.textContent?.includes('Esta noche'))?.getAttribute('aria-pressed')).toBe('true');
    buttons[1].click();
    expect(fixture.componentInstance.itemSelect.emit).toHaveBeenCalledWith('next');
  });

  it('collapses only the hierarchy after scrolling', () => {
    fixture.detectChanges();
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(80);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    fixture.componentInstance.onWindowScroll();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.portal-context-nav').classList).toContain('portal-context-nav--compact');
    expect(fixture.nativeElement.querySelector('.portal-context-nav__tabs')).not.toBeNull();
  });
});
