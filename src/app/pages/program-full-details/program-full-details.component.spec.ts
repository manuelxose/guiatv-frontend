import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramFullDetailsComponent } from './program-full-details.component';

describe('ProgramFullDetailsComponent', () => {
  let component: ProgramFullDetailsComponent;
  let fixture: ComponentFixture<ProgramFullDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgramFullDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramFullDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
