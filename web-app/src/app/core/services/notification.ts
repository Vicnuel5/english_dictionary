import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const SUCCESS_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationList = signal<AppNotification[]>([]);
  private readonly timeoutIds = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly notifications = this.notificationList.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  dismiss(id: number): void {
    const timeoutId = this.timeoutIds.get(id);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(id);
    }

    this.notificationList.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  }

  private push(type: NotificationType, message: string): void {
    const alreadyVisible = this.notificationList().some(
      (notification) => notification.type === type && notification.message === message,
    );

    if (alreadyVisible) {
      return;
    }

    const id = ++this.nextId;

    this.notificationList.update((notifications) => [...notifications, { id, type, message }]);

    if (type === 'success') {
      this.timeoutIds.set(
        id,
        setTimeout(() => this.dismiss(id), SUCCESS_DURATION_MS),
      );
    }
  }
}
