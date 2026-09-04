import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChatConversationSidebarComponent } from './chat-conversation-sidebar.component';

describe('ChatConversationSidebarComponent', () => {
  let fixture: ComponentFixture<ChatConversationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatConversationSidebarComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChatConversationSidebarComponent);
    fixture.componentInstance.conversations = [{
      conversationId: 'conversation-1',
      sessionTitle: 'Series para el fin de semana',
      lastUsedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      messageCount: 4,
      lastMessage: 'Opciones en Netflix',
    }];
    fixture.detectChanges();
  });

  it('exposes labeled actions without hover and confirms destructive actions', () => {
    const actionsButton = fixture.debugElement.query(By.css('[aria-label^="Acciones de"]'));
    expect(actionsButton).toBeTruthy();
    actionsButton.triggerEventHandler('click');
    fixture.detectChanges();

    const actionLabels = fixture.debugElement.queryAll(By.css('article button')).map((button) =>
      (button.nativeElement as HTMLButtonElement).textContent?.trim()
    );
    expect(actionLabels).toContain('Renombrar');
    expect(actionLabels).toContain('Archivar');
    expect(actionLabels).toContain('Eliminar…');

    const deleteButton = fixture.debugElement.queryAll(By.css('article button')).find((button) =>
      (button.nativeElement as HTMLButtonElement).textContent?.trim() === 'Eliminar…'
    );
    deleteButton?.triggerEventHandler('click');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¿Eliminar esta conversación?');
  });
});
