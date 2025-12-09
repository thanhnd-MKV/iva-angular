import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export interface SSOErrorDialogData {
  title: string;
  message: string;
  errorCode?: string;
  errorDetails?: string;
}

@Component({
  selector: 'app-sso-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('slideUp', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', animate('300ms 100ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
  template: `
    <div class="sso-error-dialog" @fadeIn>
      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <mat-spinner diameter="40" strokeWidth="3"></mat-spinner>
        <p class="loading-text">Đang tải thông tin...</p>
      </div>

      <!-- Error Content -->
      <div class="error-content" *ngIf="!isLoading" @slideUp>
        <!-- Animated Error Icon -->
        <div class="icon-container">
          <div class="error-circle">
            <div class="error-circle-inner">
              <mat-icon class="error-icon">error_outline</mat-icon>
            </div>
          </div>
        </div>

        <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
        
        <mat-dialog-content class="dialog-content">
          <p class="error-message">{{ data.message }}</p>
          
          <!-- Error Details Card -->
          <div class="error-details-card" *ngIf="data.errorCode || data.errorDetails">
            <div class="card-header">
              <mat-icon>bug_report</mat-icon>
              <span>Thông tin lỗi</span>
            </div>
            <div class="card-body">
              <div class="detail-row" *ngIf="data.errorCode">
                <span class="detail-label">Mã lỗi:</span>
                <span class="detail-value error-code">{{ data.errorCode }}</span>
              </div>
              <div class="detail-row" *ngIf="data.errorDetails">
                <span class="detail-label">Chi tiết:</span>
                <span class="detail-value">{{ data.errorDetails }}</span>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="info-card">
            <div class="info-header">
              <mat-icon class="info-icon">lightbulb_outline</mat-icon>
              <span>Nguyên nhân có thể</span>
            </div>
            <ul class="info-list">
              <li>
                <mat-icon class="bullet-icon">chevron_right</mat-icon>
                <span>Mã SSO đã hết hạn hoặc không hợp lệ</span>
              </li>
              <li>
                <mat-icon class="bullet-icon">chevron_right</mat-icon>
                <span>Người dùng không tồn tại trong hệ thống</span>
              </li>
              <li>
                <mat-icon class="bullet-icon">chevron_right</mat-icon>
                <span>Có lỗi kết nối với máy chủ SSO</span>
              </li>
            </ul>
          </div>
        </mat-dialog-content>
        
        <!-- Action Buttons -->
        <mat-dialog-actions class="dialog-actions">
          <button 
            mat-stroked-button 
            (click)="onRetry()" 
            class="retry-button"
            [disabled]="isRetrying">
            <!-- <mat-spinner *ngIf="isRetrying" diameter="18" strokeWidth="2"></mat-spinner> -->
            <mat-icon *ngIf="!isRetrying">refresh</mat-icon>
            <span>{{ isRetrying ? 'Đang thử...' : 'Thử lại' }}</span>
          </button>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onBackToSSO()" 
            class="back-button"
            [disabled]="isRetrying">
            <mat-icon>login</mat-icon>
            <span>Quay về SSO</span>
          </button>
        </mat-dialog-actions>
      </div>
    </div>
  `,
  styles: [`
    .sso-error-dialog {
      width: 100%;
      max-width: 460px;
      position: relative;
      overflow: hidden;
    }

    /* Loading Overlay */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 20px;
      gap: 16px;
    }

    .loading-text {
      margin: 0;
      font-size: 14px;
      color: #616161;
      font-weight: 500;
    }

    /* Error Content */
    .error-content {
      padding: 24px 20px 20px;
    }

    /* Icon Container */
    .icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .error-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }

    .error-circle-inner {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(244, 67, 54, 0.15);
    }

    .error-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: #f44336;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }

    /* Dialog Title */
    .dialog-title {
      text-align: center;
      margin: 0 0 10px 0 !important;
      font-size: 20px !important;
      font-weight: 600 !important;
      color: #212121;
      letter-spacing: -0.3px;
    }

    /* Dialog Content */
    .dialog-content {
      padding: 0 !important;
    }

    .error-message {
      text-align: center;
      font-size: 14px;
      color: #616161;
      margin-bottom: 18px;
      line-height: 1.5;
      font-weight: 400;
    }

    /* Error Details Card */
    .error-details-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      margin-bottom: 12px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border-bottom: 1px solid #e0e0e0;
    }

    .card-header mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: #f44336;
    }

    .card-header span {
      font-size: 13px;
      font-weight: 600;
      color: #424242;
    }

    .card-body {
      padding: 12px 14px;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: #757575;
      min-width: 65px;
      flex-shrink: 0;
    }

    .detail-value {
      font-size: 13px;
      color: #212121;
      font-weight: 500;
      word-break: break-word;
    }

    .error-code {
      font-family: 'Courier New', monospace;
      background: #ffebee;
      color: #c62828;
      padding: 3px 8px;
      border-radius: 5px;
      font-weight: 600;
      font-size: 12px;
    }

    /* Info Card */
    .info-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #90caf9;
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.7);
      border-bottom: 1px solid #90caf9;
    }

    .info-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: #1976d2;
    }

    .info-header span {
      font-size: 13px;
      font-weight: 600;
      color: #0d47a1;
    }

    .info-list {
      list-style: none;
      padding: 10px 14px;
      margin: 0;
    }

    .info-list li {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #1565c0;
      line-height: 1.4;
    }

    .info-list li:last-child {
      margin-bottom: 0;
    }

    .bullet-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Dialog Actions */
    .dialog-actions {
      padding: 18px 16px 20px !important;
      display: flex;
      flex-wrap: nowrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
      border-top: none !important;
    }

    .retry-button,
    .back-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 105px;
      max-width: 50%;
      height: 40px;
      padding: 0 12px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      border-radius: 7px !important;
      text-transform: none !important;
      letter-spacing: 0.2px;
      transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      white-space: nowrap;
      flex-shrink: 0;
      overflow: hidden;
    }

    .mdc-button__label {
        display: flex;
    }

    .retry-button {
    
      color: #616161;
      border: 2px solid #e0e0e0 !important;
      background: #fff;
    }

    .retry-button:not(:disabled):hover {
      background-color: #fafafa;
      border-color: #bdbdbd !important;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .retry-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .back-button {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
      color: white !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
    }

    .back-button:not(:disabled):hover {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
    }

    .back-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .retry-button mat-icon,
    .back-button mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .retry-button mat-spinner {
      margin-right: 2px;
    }
  `]
})
export class SSOErrorDialogComponent implements OnInit {
  isLoading = true;
  isRetrying = false;

  constructor(
    public dialogRef: MatDialogRef<SSOErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SSOErrorDialogData,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Hiển thị loading tối thiểu 1.0s để có trải nghiệm mượt mà
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onRetry(): void {
    this.isRetrying = true;
    
    // Delay để hiển thị loading state
    setTimeout(() => {
      this.dialogRef.close('retry');
    }, 400);
  }

  onBackToSSO(): void {
    console.log('🔐 onBackToSSO() called - START');
    this.authService.logout()
    
    // Clear session local
    console.log('🔐 Clearing session storage...');
    sessionStorage.clear();
    localStorage.removeItem('LANG');
    
    console.log('🔐 Closing dialog with result: back-to-sso');
    this.dialogRef.close('back-to-sso');
    
    
    // Lấy token để logout SSO server
    const token = sessionStorage.getItem('token');
    
    // Redirect về SSO logout để xóa session SSO, sau đó redirect về trang login
    const ssoLogoutUrl = `${environment.SSO_SERVER}${environment.SSO_SERVER_URL_PREFIX}/login`;
    
    console.log('🔐 Redirecting to SSO logout:', ssoLogoutUrl);
    setTimeout(() => {
      console.log('🔐 Executing SSO logout redirect NOW');
      window.location.href = ssoLogoutUrl;
    }, 100);
  }
}
