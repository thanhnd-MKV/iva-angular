import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SSEService } from '../../../core/services/sse.service';
import { Subscription } from 'rxjs';

export interface NotificationItem {
  id: number;
  type: 'alarm' | 'event' | 'info' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
  data?: any;
}

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.css']
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private sseSubscription?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sseService: SSEService
  ) {}

  ngOnInit(): void {
    // Load initial notifications from localStorage
    this.loadNotifications();
    
    // Subscribe to SSE for real-time updates
    this.subscribeToSSE();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        this.notifications = JSON.parse(stored);
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      } catch (e) {
        console.error('Error loading notifications:', e);
        this.notifications = [];
        this.unreadCount = 0;
      }
    } else {
      // No stored notifications - start empty
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  private subscribeToSSE(): void {
    console.log('📡 Subscribing to SSE for notifications...');
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: (event) => {
        console.log('📬 Received SSE event (raw):', event);
        console.log('📬 Event type:', event?.type);
        console.log('📬 Event data:', event?.data);
        this.handleSSEEvent(event);
      },
      error: (error) => {
        console.error('❌ SSE Error:', error);
      }
    });
  }

  private handleSSEEvent(event: any): void {
    console.log('� Processing SSE event:', event);
    
    if (!event) {
      console.warn('⚠️ Empty event received');
      return;
    }

    // Get event type
    const eventType = event.type;
    console.log('🏷️ Event type:', eventType);

    // Skip connectionStatus events
    if (eventType === 'connectionStatus') {
      console.log('ℹ️ Connection status update, skipping notification');
      return;
    }

    // Parse event data
    let eventData = event.data;
    console.log('📦 Raw event data:', eventData, 'Type:', typeof eventData);

    // Parse data if it's a string
    if (typeof eventData === 'string') {
      try {
        eventData = JSON.parse(eventData);
        console.log('✅ Parsed event data:', eventData);
      } catch (e) {
        console.error('❌ Could not parse event data:', e);
        return;
      }
    }

    // Extract dataChanges
    const dataChanges = eventData?.dataChanges || {};
    console.log('🔄 Data changes:', dataChanges);

    const newNotification: NotificationItem = {
      id: Date.now() + Math.random(),
      type: this.mapEventType(eventType),
      title: this.formatTitle(eventType, dataChanges),
      message: this.formatMessage(eventType, dataChanges, eventData),
      time: this.formatTime(new Date().toISOString()),
      read: false,
      data: { type: eventType, changes: dataChanges, full: eventData }
    };

    console.log('✅ Created notification:', newNotification);

    // Add to beginning of list
    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.saveNotifications();
  }

  private formatTitle(eventType: string, dataChanges: any): string {
    const titles: { [key: string]: string } = {
      'alarm': 'Cảnh báo',
      'trafficViolation': 'Vi phạm giao thông',
      'objectRecognition': 'Nhận diện đối tượng',
      'pedestrianTraffic': 'Thống kê người đi bộ',
      'trafficVolume': 'Lưu lượng giao thông'
    };
    
    return titles[eventType] || eventType || 'Thông báo mới';
  }

  private formatMessage(eventType: string, dataChanges: any, fullData: any): string {
    console.log('💬 Formatting message for:', eventType, 'Changes:', dataChanges);

    switch (eventType) {
      case 'alarm':
        return 'Phát hiện cảnh báo từ hệ thống';
      
      case 'trafficViolation':
        return 'Phát hiện vi phạm giao thông';
      
      case 'objectRecognition':
        const parts: string[] = [];
        
        if (dataChanges.gender) {
          const genderKey = Object.keys(dataChanges.gender)[0];
          const genderMap: { [key: string]: string } = {
            'Male': 'Nam',
            'Female': 'Nữ'
          };
          parts.push(genderMap[genderKey] || genderKey);
        }
        
        if (dataChanges.complexion) {
          const complexionKey = Object.keys(dataChanges.complexion)[0];
          const complexionMap: { [key: string]: string } = {
            'Asian': 'Châu Á',
            'White': 'Da trắng',
            'Black': 'Da đen'
          };
          parts.push(complexionMap[complexionKey] || complexionKey);
        }
        
        if (dataChanges.age) {
          const ageKey = Object.keys(dataChanges.age)[0];
          parts.push(`${ageKey} tuổi`);
        }
        
        return parts.length > 0 
          ? `Phát hiện: ${parts.join(', ')}`
          : 'Phát hiện đối tượng mới';
      
      case 'pedestrianTraffic':
        if (dataChanges.inTotal !== undefined) {
          return `${dataChanges.inTotal} người vào`;
        }
        if (dataChanges.outTotal !== undefined) {
          return `${dataChanges.outTotal} người ra`;
        }
        return 'Cập nhật lưu lượng người';
      
      case 'trafficVolume':
        return 'Cập nhật lưu lượng giao thông';
      
      default:
        console.warn('⚠️ Unknown event type:', eventType);
        return `Sự kiện: ${eventType}`;
    }
  }

  private mapEventType(eventType: string): 'alarm' | 'event' | 'info' | 'warning' {
    if (!eventType) return 'info';
    
    const type = eventType.toLowerCase();
    
    if (type.includes('alarm')) {
      return 'alarm';
    }
    if (type.includes('violation') || type.includes('vi phạm')) {
      return 'warning';
    }
    if (type.includes('traffic') || type.includes('pedestrian') || type.includes('object')) {
      return 'event';
    }
    return 'info';
  }

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

  close(): void {
    this.dialogRef.close();
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.saveNotifications();
  }

  handleNotificationClick(notification: NotificationItem): void {
    notification.read = true;
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.saveNotifications();
    // TODO: Navigate to detail or perform action
    console.log('Notification clicked:', notification);
  }

  deleteNotification(notification: NotificationItem, event: Event): void {
    event.stopPropagation();
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      if (!notification.read) {
        this.unreadCount--;
      }
      this.saveNotifications();
    }
  }

  getIconName(type: string): string {
    const icons: { [key: string]: string } = {
      alarm: 'warning',
      event: 'event',
      info: 'info',
      warning: 'error_outline'
    };
    return icons[type] || 'notifications';
  }
}
