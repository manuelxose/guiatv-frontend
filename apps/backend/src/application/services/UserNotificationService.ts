import { UserNotificationModel } from '../../infrastructure/database/models/UserNotification.model';
import { ChatSocketHub } from '../../presentation/realtime/ChatSocketHub';

type NotificationModelLike = typeof UserNotificationModel;

export class UserNotificationService {
  constructor(
    private readonly model: NotificationModelLike = UserNotificationModel
  ) {}

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
    const doc = await this.model.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
    });

    this.emitNotification(input.recipientId, doc);
  }

  private emitNotification(recipientId: string, doc: any): void {
    try {
      ChatSocketHub.getInstance().emitNotification(recipientId, {
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        description: doc.description,
        entityType: doc.entityType,
        entityId: doc.entityId,
        createdAt: doc.createdAt,
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
    const title = `Nuevo mensaje de ${input.actorName}`;
    const description = input.preview || 'Tienes un nuevo mensaje.';

    // Consolidate: if the recipient already has an UNREAD message notification
    // for this conversation, refresh it instead of stacking one per message.
    const existing = await this.model
      .findOne({
        recipientId: input.recipientId,
        type: 'message',
        entityType: 'conversation',
        entityId: input.conversationId,
        readAt: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .exec();

    let doc: any;
    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.createdAt = new Date();
      await existing.save();
      doc = existing;
    } else {
      doc = await this.model.create({
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: 'message',
        title,
        description,
        entityType: 'conversation',
        entityId: input.conversationId,
      });
    }

    this.emitNotification(input.recipientId, doc);
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
