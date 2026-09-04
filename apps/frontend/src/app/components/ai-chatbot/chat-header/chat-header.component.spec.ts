import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChatHeaderComponent } from './chat-header.component';

describe('ChatHeaderComponent', () => {
  let fixture: ComponentFixture<ChatHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChatHeaderComponent);
    fixture.componentInstance.isAuthenticated = true;
    fixture.componentInstance.profileIncomplete = true;
    fixture.detectChanges();
  });

  it('keeps the primary assistant actions directly accessible', () => {
    const labels = fixture.debugElement
      .queryAll(By.css('button'))
      .map((button) => button.attributes['aria-label']);

    expect(labels).toContain('Conversaciones');
    expect(labels).toContain('Completar Perfil IA');
    expect(labels).toContain('Nueva conversación');
    expect(labels).toContain('Minimizar asistente');
  });
});
