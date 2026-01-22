import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UnderDevelopmentService } from '../../services/under-development.service';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
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
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private sseService: SSEService,
    public underDevService: UnderDevelopmentService
  ) {}

  ngOnInit(): void {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.username = user.userName || 'Unknown';
        this.userEmail = user.email || user.userName + '@iva.com';
      } catch (e) {
        console.warn('Lỗi parse session user:', e);
      }
    }
    
    // Load initial notification count
    this.updateNotificationCount();
    
    // Subscribe to SSE to update badge in real-time
    this.subscribeToSSE();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  private subscribeToSSE(): void {
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: () => {
        // Update count when new notification arrives
        this.updateNotificationCount();
      }
    });
  }

  private updateNotificationCount(): void {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        this.notificationCount = notifications.filter((n: any) => !n.read).length;
      } catch (e) {
        this.notificationCount = 0;
      }
    } else {
      this.notificationCount = 0;
    }
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
    
    // Update count after dialog closes
    dialogRef.afterClosed().subscribe(() => {
      this.updateNotificationCount();
    });
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
