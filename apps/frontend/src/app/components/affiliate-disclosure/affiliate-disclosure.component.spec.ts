import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AffiliateDisclosureComponent, DEFAULT_AFFILIATE_DISCLOSURE_TEXT } from './affiliate-disclosure.component';

describe('AffiliateDisclosureComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AffiliateDisclosureComponent] });
  });

  it('renders the default disclosure copy when sponsored', () => {
    const fixture = TestBed.createComponent(AffiliateDisclosureComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(DEFAULT_AFFILIATE_DISCLOSURE_TEXT);
  });

  it('renders nothing for a non-sponsored (direct) offer', () => {
    const fixture = TestBed.createComponent(AffiliateDisclosureComponent);
    fixture.componentRef.setInput('sponsored', false);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('p'))).toBeNull();
  });

  it('honors a custom disclosure text', () => {
    const fixture = TestBed.createComponent(AffiliateDisclosureComponent);
    fixture.componentRef.setInput('text', 'Texto de prueba.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Texto de prueba.');
  });
});
