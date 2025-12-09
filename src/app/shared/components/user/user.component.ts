import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UnderDevelopmentService } from '../../services/under-development.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
export class UserComponent implements OnInit {
  avatarUrl: string = 'https://i.pravatar.cc/40';
  username: string = 'Unknown';
  userEmail: string = 'user@example.com';
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
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
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
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
