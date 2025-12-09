import { Component, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-usermini',
  templateUrl: './usermini.component.html',
  styleUrls: ['./usermini.component.css'],
  standalone: true,
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CommonModule,
    MatMenuTrigger,
    MatTooltipModule
  ]
})
export class UserMiniComponent implements OnInit {
  avatarUrl: string = 'https://i.pravatar.cc/40';
  username: string = 'Unknown';
  userEmail: string = 'user@example.com';

  constructor(private authService: AuthService) {}

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

  viewProfile() {
    console.log('Xem thông tin người dùng');
  }

  changePassword() {
    console.log('Đổi mật khẩu');
  }

  logout() {
    this.authService.logout();
    console.log('Đăng xuất');
  }
}
