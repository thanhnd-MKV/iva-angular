import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { SSEService } from '../../core/services/sse.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { Subscription } from 'rxjs';

interface SSENotification {
  event: string;
  data: any;
  receivedAt?: Date;
}

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule
  ],
  template: `
    <div class="notification-test-container">
      <mat-card class="control-card">
        <mat-card-header>
          <mat-card-title>Test SSE Multi Notification</mat-card-title>
          <mat-card-subtitle>Endpoint: /sse/admin/notification/connect-multi?names=alarm&names=traffic-event</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="button-group">
            <button 
              mat-raised-button 
              color="primary" 
              (click)="connectWithFakeData()"
              [disabled]="isConnected">
              <mat-icon>science</mat-icon>
              Connect với Fake Data
            </button>
            
            <button 
              mat-raised-button 
              color="accent" 
              (click)="connectReal()"
              [disabled]="isConnected">
              <mat-icon>cloud</mat-icon>
              Connect thật (Real API)
            </button>
            
            <button 
              mat-raised-button 
              color="warn" 
              (click)="disconnect()"
              [disabled]="!isConnected">
              <mat-icon>stop</mat-icon>
              Disconnect
            </button>
            
            <button 
              mat-raised-button 
              (click)="clearNotifications()">
              <mat-icon>clear_all</mat-icon>
              Clear Notifications
            </button>
          </div>

          <div class="status-info">
            <div class="status-item">
              <strong>Trạng thái:</strong>
              <span [class]="isConnected ? 'status-connected' : 'status-disconnected'">
                {{ isConnected ? '🟢 Đã kết nối' : '🔴 Chưa kết nối' }}
              </span>
            </div>
            <div class="status-item">
              <strong>Số thông báo:</strong>
              <span class="badge">{{ notifications.length }}</span>
            </div>
            <div class="status-item">
              <strong>Alarm:</strong>
              <span class="badge alarm">{{ alarmCount }}</span>
            </div>
            <div class="status-item">
              <strong>Traffic Events:</strong>
              <span class="badge traffic">{{ trafficEventCount }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="notifications-card">
        <mat-card-header>
          <mat-card-title>
            Notifications Received
            <mat-icon 
              [matBadge]="notifications.length" 
              matBadgeColor="warn"
              *ngIf="notifications.length > 0">
              notifications
            </mat-icon>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="notifications-list" *ngIf="notifications.length > 0">
            <div 
              *ngFor="let notification of notifications; let i = index" 
              class="notification-item"
              [class.alarm-notification]="notification.event === 'alarm'"
              [class.traffic-notification]="notification.event === 'traffic-event'">
              
              <div class="notification-header">
                <mat-icon class="notification-icon">
                  {{ notification.event === 'alarm' ? 'warning' : 'traffic' }}
                </mat-icon>
                <span class="notification-type">{{ notification.event }}</span>
                <span class="notification-time">{{ notification.receivedAt | date:'HH:mm:ss' }}</span>
              </div>
              
              <div class="notification-body">
                <div class="notification-title">{{ notification.data.title }}</div>
                <div class="notification-message">{{ notification.data.message }}</div>
                <div class="notification-details">
                  <span *ngIf="notification.data.location">
                    <mat-icon>location_on</mat-icon>
                    {{ notification.data.location }}
                  </span>
                  <span *ngIf="notification.data.severity">
                    <mat-icon>priority_high</mat-icon>
                    {{ notification.data.severity }}
                  </span>
                  <span *ngIf="notification.data.camera">
                    <mat-icon>videocam</mat-icon>
                    {{ notification.data.camera }}
                  </span>
                  <span *ngIf="notification.data.licensePlate">
                    <mat-icon>directions_car</mat-icon>
                    {{ notification.data.licensePlate }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="empty-state" *ngIf="notifications.length === 0">
            <mat-icon>inbox</mat-icon>
            <p>Chưa có thông báo nào</p>
            <p class="hint">Click "Connect với Fake Data" để test với dữ liệu giả</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notification-test-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .control-card, .notifications-card {
      margin-bottom: 20px;
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .button-group button {
      flex: 1;
      min-width: 200px;
    }

    .status-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .status-connected {
      color: #4caf50;
      font-weight: 600;
    }

    .status-disconnected {
      color: #f44336;
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #2196f3;
      color: white;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .badge.alarm {
      background: #ff9800;
    }

    .badge.traffic {
      background: #9c27b0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 600px;
      overflow-y: auto;
    }

    .notification-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: white;
      transition: all 0.3s ease;
    }

    .notification-item:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .notification-item.alarm-notification {
      border-left: 5px solid #ff9800;
      background: #fff3e0;
    }

    .notification-item.traffic-notification {
      border-left: 5px solid #9c27b0;
      background: #f3e5f5;
    }

    .notification-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    .notification-icon {
      color: #666;
    }

    .notification-type {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      color: #666;
      flex: 1;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
    }

    .notification-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notification-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .notification-message {
      font-size: 14px;
      color: #666;
    }

    .notification-details {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 8px;
      font-size: 13px;
      color: #666;
    }

    .notification-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .notification-details mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ddd;
    }

    .empty-state p {
      margin: 10px 0;
    }

    .empty-state .hint {
      font-size: 13px;
      color: #bbb;
    }
  `]
})
export class NotificationTestComponent implements OnInit, OnDestroy {
  isConnected = false;
  notifications: SSENotification[] = [];
  private sseSubscription?: Subscription;
  
  alarmCount = 0;
  trafficEventCount = 0;

  constructor(
    private sseService: SSEService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('📱 Notification Test Component initialized');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  connectWithFakeData(): void {
    console.log('🧪 Starting connection with FAKE DATA...');
    this.connect(true);
  }

  connectReal(): void {
    console.log('🌐 Starting connection with REAL API...');
    this.connect(false);
  }

  private connect(useFakeData: boolean): void {
    if (this.isConnected) {
      console.warn('⚠️ Already connected');
      return;
    }

    const names = ['alarm', 'traffic-event'];
    this.isConnected = true;

    this.sseSubscription = this.sseService.connectMulti(names, useFakeData)
      .subscribe({
        next: (notification: SSENotification) => {
          console.log('📬 Received notification:', notification);
          
          // Add timestamp
          const notificationWithTime = {
            ...notification,
            receivedAt: new Date()
          };
          
          // Add to list (keep last 50)
          this.notifications.unshift(notificationWithTime);
          if (this.notifications.length > 50) {
            this.notifications.pop();
          }

          // Update counters
          if (notification.event === 'alarm') {
            this.alarmCount++;
          } else if (notification.event === 'traffic-event') {
            this.trafficEventCount++;
          }

          // Show toast notification
          this.showToastNotification(notification);
        },
        error: (error) => {
          console.error('❌ SSE Error:', error);
          this.isConnected = false;
          this.notificationService.error(
            'Lỗi kết nối',
            'Không thể kết nối đến server SSE. Đang thử kết nối lại...'
          );
          
          // Auto reconnect
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('🔄 Auto reconnecting...');
              this.connect(useFakeData);
            }
          }, 5000);
        },
        complete: () => {
          console.log('✅ SSE Connection completed');
          this.isConnected = false;
        }
      });

    this.notificationService.success(
      'Đã kết nối',
      useFakeData ? 'Đang sử dụng fake data' : 'Đã kết nối đến server thật'
    );
  }

  disconnect(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = undefined;
    }
    this.isConnected = false;
    console.log('🔌 Disconnected from SSE');
    this.notificationService.info('Đã ngắt kết nối', 'Kết nối SSE đã được đóng');
  }

  clearNotifications(): void {
    this.notifications = [];
    this.alarmCount = 0;
    this.trafficEventCount = 0;
    console.log('🗑️ Cleared all notifications');
  }

  formatTime(date?: Date): string {
    return date ? date.toLocaleTimeString('vi-VN') : '';
  }

  private showToastNotification(notification: SSENotification): void {
    const { event, data } = notification;
    
    if (event === 'alarm') {
      const severity = data.severity || 'info';
      const type = severity === 'critical' || severity === 'high' ? 'error' : 'warning';
      
      this.notificationService.show({
        type: type,
        title: data.title || 'Cảnh báo',
        message: `${data.message || ''} - ${data.location || ''}`,
        duration: type === 'error' ? 8000 : 5000
      });
    } else if (event === 'traffic-event') {
      this.notificationService.show({
        type: 'info',
        title: data.title || 'Sự kiện giao thông',
        message: `${data.message || ''} - ${data.location || ''}`,
        duration: 5000
      });
    }
  }
}
