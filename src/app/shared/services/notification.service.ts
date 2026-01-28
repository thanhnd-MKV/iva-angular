import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NotificationItem {
  id: number;
  type: 'alarm' | 'event' | 'info' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
  image?: string | null;
  location?: string | null;
  eventTime?: string | null;
  data?: any;
}

export interface EventListResponse {
  success: boolean;
  code: string;
  message: string | null;
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách sự kiện từ API để hiển thị trong chuông thông báo
   */
  loadNotificationsFromAPI(): Observable<NotificationItem[]> {
    const params = {
      isSuspect: 'true',
      recognitionThreshold: '0.5'
    };

    return this.http.get<EventListResponse>('/api/admin/events/list', { params }).pipe(
      map(response => {
        console.log('📦 [API Response]:', response);
        const notifications = this.mapEventsToNotifications(response.data || []);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
        return notifications;
      })
    );
  }

  /**
   * Chuyển đổi event từ API sang NotificationItem
   */
  private mapEventsToNotifications(events: any[]): NotificationItem[] {
    return events.map((event, index) => ({
      id: event.id || Date.now() + index,
      type: 'alarm' as const,
      title: 'Cảnh báo',
      message: this.formatEventMessage(event),
      time: this.formatTime(event.eventTime || event.createTime || new Date().toISOString()),
      read: false,
      image: event.croppedImagePath || event.fullImagePath || null,
      location: event.location || null,
      eventTime: event.eventTime || null,
      data: event
    }));
  }

  /**
   * Format message từ event data
   */
  private formatEventMessage(event: any): string {
    const parts: string[] = [];
    
    // Event type - format đẹp
    if (event.eventType) {
      const typeMap: { [key: string]: string } = {
        'Face_Recognition': 'Nhận diện khuôn mặt',
        'Line_Cross': 'Vượt vạch',
        'Intrusion': 'Xâm nhập',
        'Loitering': 'Lảng vảng',
        'Tailgating': 'Theo đuôi',
        'Parking': 'Đỗ xe trái phép'
      };
      const eventTypeText = typeMap[event.eventType] || event.eventType;
      parts.push(`⚠️ ${eventTypeText}`);
    }
    
    // Gender từ attributes
    if (event.attributes?.gender || event.gender) {
      const gender = event.attributes?.gender || event.gender;
      const genderMap: { [key: string]: string } = {
        'Male': 'Nam',
        'Female': 'Nữ'
      };
      parts.push(genderMap[gender] || gender);
    }
    
    // Location
    if (event.location) {
      parts.push(`📍 ${event.location}`);
    }
    
    // Camera name (nếu không phải SN mặc định)
    if (event.cameraName && event.cameraName !== '0123456789ABCDEF' && event.cameraName !== 'ACVN248240000200') {
      parts.push(`📹 ${event.cameraName}`);
    }
    
    // Event time
    if (event.eventTime) {
      const eventTime = new Date(event.eventTime);
      const timeStr = eventTime.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
      parts.push(`🕐 ${timeStr}`);
    }
    
    return parts.length > 0 
      ? parts.join(' • ') 
      : 'Phát hiện cảnh báo từ hệ thống';
  }

  /**
   * Format thời gian tương đối
   */
  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  }

  /**
   * Thêm notification mới từ SSE
   */
  addNotificationFromSSE(event: any): void {
    const eventType = event.event || event.type;
    let eventData = event.data;
    
    // Parse data if string
    if (typeof eventData === 'string') {
      try {
        eventData = JSON.parse(eventData);
      } catch (e) {
        console.error('Failed to parse event data:', e);
        return;
      }
    }

    const newNotification: NotificationItem = {
      id: Date.now() + Math.random(),
      type: 'alarm',
      title: 'Cảnh báo',
      message: this.formatEventMessage(eventData),
      time: this.formatTime(new Date().toISOString()),
      read: false,
      image: eventData?.croppedImagePath || eventData?.fullImagePath || null,
      location: eventData?.location || null,
      eventTime: eventData?.eventTime || null,
      data: { type: eventType, changes: eventData?.dataChanges || {}, full: eventData }
    };

    // Add to beginning of list
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    
    // Keep only last 50 notifications
    if (updatedNotifications.length > 50) {
      updatedNotifications.length = 50;
    }

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
    
    console.log('💾 [NotificationService] Added notification from SSE:', newNotification);
  }

  /**
   * Lấy danh sách notifications hiện tại
   */
  getNotifications(): NotificationItem[] {
    return this.notificationsSubject.value;
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  /**
   * Đánh dấu một notification đã đọc
   */
  markAsRead(notificationId: number): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  /**
   * Xóa một notification
   */
  deleteNotification(notificationId: number): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  /**
   * Cập nhật số lượng chưa đọc
   */
  private updateUnreadCount(notifications: NotificationItem[]): void {
    const count = notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  /**
   * Lấy số lượng chưa đọc
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
