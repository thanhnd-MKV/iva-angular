import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SSOErrorDialogComponent } from '../../shared/components/sso-error-dialog/sso-error-dialog.component';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <div class="logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
        </div>
        
        <div class="loading-content">
          <mat-spinner diameter="50" [strokeWidth]="3"></mat-spinner>
          <h2>{{ loadingMessage }}</h2>
          <p>{{ loadingSubtext }}</p>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule]
})
export class LoginComponent implements OnInit {
  loadingMessage = 'Đang xử lý đăng nhập';
  loadingSubtext = 'Vui lòng đợi trong giây lát...';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Kiểm tra xem user đã được lưu chưa
    const isLoggedIn = this.authService.isAuthenticated();
    if (isLoggedIn) {
      this.loadingMessage = 'Đăng nhập thành công';
      this.loadingSubtext = 'Đang chuyển hướng...';
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 800);
      return;
    }

    const ssoCode = this.authService.getSSOCode();

    if (ssoCode) {
      this.performCheckCode();
    } else {
      this.loadingMessage = 'Đang chuyển hướng';
      this.loadingSubtext = 'Chuyển đến trang đăng nhập SSO...';
      // Nếu chưa đăng nhập và không có sso_code → đi đăng nhập SSO
      this.authService.loginSSO();
    }
  }

  /**
   * Thực hiện checkCode và xử lý lỗi
   */
  private performCheckCode(): void {
    this.loadingMessage = 'Đang xác thực';
    this.loadingSubtext = 'Đang kiểm tra thông tin đăng nhập...';
    
    this.authService.checkCodeAndLogin().subscribe({
      next: (result) => {
        this.loadingMessage = 'Đăng nhập thành công';
        this.loadingSubtext = 'Chào mừng bạn trở lại!';
        
        setTimeout(() => {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }, 1000);
      },
      error: (error) => {
        console.error('[Login] SSO checkCode error:', error);
        
        // Kiểm tra nếu là lỗi SSO Code invalid (9994)
        if (this.errorHandler.isSSOCodeInvalid(error)) {
          this.handleSSOCodeInvalidError(error);
        } else {
          // Xử lý các lỗi khác
          this.handleGenericError(error);
        }
      }
    });
  }

  /**
   * Xử lý lỗi SSO Code invalid
   */
  private handleSSOCodeInvalidError(error: any): void {
    this.loadingMessage = 'Đăng nhập thất bại';
    this.loadingSubtext = 'Mã SSO không hợp lệ';

    const dialogRef = this.dialog.open(SSOErrorDialogComponent, {
      width: '460px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Lỗi xác thực SSO',
        message: error.message || 'SSO Code không hợp lệ hoặc đã hết hạn.',
        errorCode: error.code,
        errorDetails: this.extractErrorDetails(error)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔍 Dialog closed with result:', result);
      
      if (result === 'retry') {
        // Thử lại checkCode
        this.performCheckCode();
      } else if (result === 'back-to-sso') {
        // Dialog đã xử lý redirect trong onBackToSSO(), không làm gì thêm
        console.log('🔐 Dialog handled SSO redirect');
      } else {
        // Fallback: redirect về SSO nếu có lỗi
        console.log('🔐 Fallback: redirecting to SSO login');
        this.authService.loginSSO();
      }
    });
  }

  /**
   * Xử lý lỗi chung
   */
  private handleGenericError(error: any): void {
    this.loadingMessage = 'Đăng nhập thất bại';
    this.loadingSubtext = error.message || 'Đã xảy ra lỗi không xác định';

    // Sau 2 giây tự động chuyển về trang đăng nhập SSO
    setTimeout(() => {
      this.authService.loginSSO();
    }, 2000);
  }

  /**
   * Trích xuất chi tiết lỗi từ response
   */
  private extractErrorDetails(error: any): string {
    if (error.message) {
      // Tìm phần "Details: " trong message
      const detailsMatch = error.message.match(/Details:\s*(.+)/);
      if (detailsMatch && detailsMatch[1]) {
        return detailsMatch[1];
      }
    }
    return '';
  }
}
