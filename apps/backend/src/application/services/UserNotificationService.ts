import { UserNotificationModel } from '../../infrastructure/database/models/UserNotification.model';
import { ChatSocketHub } from '../../presentation/realtime/ChatSocketHub';

export class UserNotificationService {
  async createNotification(input: {
    recipientId: string;
    actorId?: string;
    type: 'follow' | 'message' | 'recommendation' | 'report_status' | 'system';
    title: string;
    description?: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const doc = await UserNotificationModel.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
    });

    try {
      ChatSocketHub.getInstance().emitNotification(input.recipientId, {
        id: String(doc._id),
        type: input.type,
        title: input.title,
        description: input.description,
        entityType: input.entityType,
        entityId: input.entityId,
        createdAt: (doc as any).createdAt,
      });
    } catch {
      // Socket emission is best-effort; don't fail the notification creation
    }
  }

  async notifyFollow(input: {
    recipientId: string;
    actorId: string;
    actorName: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: 'follow',
      title: 'Nuevo seguidor',
      description: `${input.actorName} ha empezado a seguirte.`,
      entityType: 'user',
      entityId: input.actorId,
    });
  }

  async notifyMessage(input: {
    recipientId: string;
    actorId: string;
    actorName: string;
    conversationId: string;
    preview?: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: 'message',
      title: `Nuevo mensaje de ${input.actorName}`,
      description: input.preview || 'Tienes un nuevo mensaje.',
      entityType: 'conversation',
      entityId: input.conversationId,
    });
  }

  async notifyReportStatus(input: {
    recipientId: string;
    reportId: string;
    status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
    note?: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: input.recipientId,
      type: 'report_status',
      title: 'Actualización de reporte',
      description: input.note || `Tu reporte ha cambiado a estado ${input.status}.`,
      entityType: 'report',
      entityId: input.reportId,
      payload: { status: input.status },
    });
  }
}
