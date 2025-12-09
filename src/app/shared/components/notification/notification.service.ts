import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private notifications: NotificationData[] = [];

  show(notification: Partial<NotificationData>): string {
    const id = this.generateId();
    const newNotification: NotificationData = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message,
      duration: notification.duration || 5000,
      autoClose: notification.autoClose !== false
    };

    this.notifications.push(newNotification);
    this.notificationsSubject.next([...this.notifications]);

    // Auto close if enabled
    if (newNotification.autoClose) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  success(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'success',
      title,
      message,
      duration: duration || 3000
    });
  }

  error(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: duration || 5000
    });
  }

  warning(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'warning',
      title,
      message,
      duration: duration || 4000
    });
  }

  info(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration: duration || 4000
    });
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationsSubject.next([...this.notifications]);
  }

  clear(): void {
    this.notifications = [];
    this.notificationsSubject.next([]);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}