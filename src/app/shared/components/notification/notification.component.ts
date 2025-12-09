import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService, NotificationData } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notification of notifications; trackBy: trackByFn" 
        class="notification-item"
        [ngClass]="'notification-' + notification.type">
        
        <div class="notification-content">
          <mat-icon class="notification-icon">{{ getIcon(notification.type) }}</mat-icon>
          <div class="notification-text">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message" *ngIf="notification.message">{{ notification.message }}</div>
          </div>
        </div>
        
        <button 
          mat-icon-button 
          class="close-button" 
          (click)="closeNotification(notification.id)">
          <mat-icon>close</mat-icon>
        </button>
        
        <!-- Progress bar for auto-dismiss -->
        <div 
          class="progress-bar" 
          *ngIf="notification.autoClose && notification.duration"
          [style.animation-duration.ms]="notification.duration">
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  notifications: NotificationData[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe((notifications: NotificationData[]) => {
      this.notifications = notifications;
    });
  }

  closeNotification(id: string): void {
    this.notificationService.remove(id);
  }

  getIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type];
  }

  trackByFn(index: number, item: NotificationData): string {
    return item.id;
  }
}