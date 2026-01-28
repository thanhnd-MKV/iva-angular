import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UnderDevelopmentService } from '../../services/under-development.service';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { NotificationService } from '../../services/notification.service';
import { SSEService } from '../../../core/services/sse.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class UserComponent implements OnInit, OnDestroy {
  avatarUrl: string = 'https://i.pravatar.cc/40';
  username: string = 'Unknown';
  userEmail: string = 'user@example.com';
  isMenuOpen = false;
  isNotificationOpen = false;
  notificationCount = 0;
  private sseSubscription?: Subscription;
  private notificationCountSubscription?: Subscription;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private sseService: SSEService,
    private notificationService: NotificationService,
    public underDevService: UnderDevelopmentService
  ) {}

  ngOnInit(): void {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.username = user.realName || 'Unknown';
        this.userEmail = user.email || user.userName + '@iva.com';
      } catch (e) {
        console.warn('Lỗi parse session user:', e);
      }
    }
    
    // Load notifications from API on init
    this.loadNotificationsFromAPI();
    
    // Subscribe to notification count changes
    this.subscribeToNotificationCount();
    
    // Subscribe to SSE to update badge in real-time
    this.subscribeToSSE();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
    if (this.notificationCountSubscription) {
      this.notificationCountSubscription.unsubscribe();
    }
  }

  private loadNotificationsFromAPI(): void {
    console.log('🌐 [USER-BELL] Loading notifications from API...');
    this.notificationService.loadNotificationsFromAPI().subscribe({
      next: (notifications) => {
        console.log('✅ [USER-BELL] Loaded notifications:', notifications.length);
      },
      error: (error) => {
        console.error('❌ [USER-BELL] Error loading notifications:', error);
      }
    });
  }

  private subscribeToNotificationCount(): void {
    this.notificationCountSubscription = this.notificationService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
      console.log('🔔 [USER-BELL] Unread count updated:', count);
    });
  }

  private subscribeToSSE(): void {
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: (event) => {
        console.log('🔔 [USER-BELL] Received SSE event:', event);
        
        // *** FILTER: ONLY PROCESS ALARM EVENTS FOR BELL ***
        const eventType = event.event || event.type;
        const isAlarm = eventType === 'alarm' || eventType === 'ALARM:event';
        
        console.log('🔍 [USER-BELL] Event type:', eventType, 'isAlarm:', isAlarm);
        
        if (isAlarm) {
          console.log('✅ [USER-BELL] Alarm event - adding to notification service');
          this.notificationService.addNotificationFromSSE(event);
        } else {
          console.log('🔇 [USER-BELL] Non-alarm event filtered:', eventType);
        }
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isNotificationOpen = false;
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  toggleNotifications() {
    const dialogRef = this.dialog.open(NotificationPopupComponent, {
      width: '480px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '600px',
      panelClass: 'notification-dialog',
      hasBackdrop: true,
      backdropClass: 'notification-backdrop'
    });
    
    // No need to update count after dialog closes - using Observable now
  }

  closeNotifications() {
    this.isNotificationOpen = false;
  }

  viewAllNotifications() {
    this.closeNotifications();
    this.router.navigate(['/notification-test']);
  }

  viewProfile() {
    this.underDevService.show({
      title: 'Thông Tin Cá Nhân',
      message: 'Tính năng xem và chỉnh sửa thông tin cá nhân đang được phát triển và sẽ sớm ra mắt.',
      features: [
        'Cập nhật thông tin cá nhân',
        'Thay đổi ảnh đại diện',
        'Quản lý tài khoản'
      ]
    });
    this.closeMenu();
  }

  changePassword() {
    this.underDevService.show({
      title: 'Đổi Mật Khẩu',
      message: 'Tính năng đổi mật khẩu đang được phát triển và sẽ sớm ra mắt với bảo mật cao.',
      features: [
        'Xác thực 2 lớp',
        'Mật khẩu mạnh',
        'Lịch sử thay đổi'
      ]
    });
    this.closeMenu();
  }

  logout() {
    this.authService.logout();
    console.log('Đăng xuất');
    this.closeMenu();
  }
}
