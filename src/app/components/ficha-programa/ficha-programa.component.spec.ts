import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FichaProgramaComponent } from './ficha-programa.component';

describe('FichaProgramaComponent', () => {
  let component: FichaProgramaComponent;
  let fixture: ComponentFixture<FichaProgramaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FichaProgramaComponent]
    });
    fixture = TestBed.createComponent(FichaProgramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
