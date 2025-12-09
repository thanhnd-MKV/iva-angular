import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface LogoutDialogData {
  title: string;
  message: string;
  token?: string;
  countdown?: number;
}

@Component({
  selector: 'app-logout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="logout-dialog">
      <!-- Simple Header -->
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <!-- Main Content -->
      <mat-dialog-content class="dialog-content">
        <p class="main-message">{{ data.message }}</p>
        
        <!-- Token Information -->
        <div class="token-section" *ngIf="data.token">
          <label class="token-label">Token hiện tại:</label>
          <div class="token-container">
            <span class="token-value">{{ data.token }}</span>
            <button mat-icon-button class="copy-btn" (click)="copyToken()" matTooltip="Sao chép">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
        </div>
        
        <!-- Countdown -->
        <div class="countdown-section" *ngIf="countdown > 0">
          <div class="countdown-display">
            <mat-icon class="timer-icon">schedule</mat-icon>
            <span class="countdown-text">{{ countdown }}s</span>
          </div>
          <p class="countdown-message">Tự động đăng xuất sau {{ countdown }} giây</p>
        </div>
      </mat-dialog-content>
      
      <!-- Action Buttons -->
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" [disabled]="countdown > 0">
          Hủy bỏ
        </button>
        <button mat-flat-button color="warn" (click)="onLogoutNow()">
          Đăng xuất ngay
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .logout-dialog {
      max-width: 90vw;
    }

    /* Simple Header */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #424242;
    }

    /* Content */
    .dialog-content {
      padding: 24px;
    }

    .main-message {
      font-size: 14px;
      line-height: 1.5;
      color: #616161;
      margin: 0 0 20px 0;
    }

    /* Token Section */
    .token-section {
      margin-bottom: 20px;
    }

    .token-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #757575;
      margin-bottom: 8px;
    }

    .token-container {
      display: flex;
      align-items: center;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 8px 12px;
    }

    .token-value {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #424242;
      flex: 1;
      word-break: break-all;
      margin-right: 8px;
    }

    .copy-btn {
      width: 32px;
      height: 32px;
      color: #757575;
    }

    .copy-btn:hover {
      color: #424242;
      background: rgba(0,0,0,0.04);
    }

    /* Countdown Section */
    .countdown-section {
      background: #fff3e0;
      border: 1px solid #ffcc02;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .countdown-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .timer-icon {
      color: #f57c00;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .countdown-text {
      font-size: 18px;
      font-weight: 600;
      color: #e65100;
      min-width: 40px;
    }

    .countdown-message {
      font-size: 13px;
      color: #ef6c00;
      margin: 0;
      line-height: 1.4;
    }

    /* Action Buttons */
    .dialog-actions {
      padding: 16px 24px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 100px;
      height: 36px;
    }

    .dialog-actions button:disabled {
      opacity: 0.6;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .logout-dialog {
        width: 100%;
        max-width: 100%;
      }
      
      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  `]
})
export class LogoutDialogComponent {
  countdown = 0;
  totalCountdown = 0;
  private countdownInterval?: any;

  constructor(
    public dialogRef: MatDialogRef<LogoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogoutDialogData
  ) {
    if (data.countdown && data.countdown > 0) {
      this.totalCountdown = data.countdown;
      this.startCountdown(data.countdown);
    }
  }

  private startCountdown(seconds: number): void {
    this.countdown = seconds;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.clearCountdown();
        this.onLogoutNow();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  onCancel(): void {
    this.clearCountdown();
    this.dialogRef.close('cancel');
  }

  onLogoutNow(): void {
    this.clearCountdown();
    this.dialogRef.close('logout');
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  /**
   * Copy token to clipboard with visual feedback
   */
  copyToken(): void {
    if (!this.data.token) {
      return;
    }

    const token = this.data.token;

    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(token).then(() => {
        this.showCopySuccess();
      }).catch(() => {
        this.fallbackCopyTextToClipboard(token);
      });
    } else {
      this.fallbackCopyTextToClipboard(token);
    }
  }

  /**
   * Fallback method for copying text to clipboard
   */
  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Show visual feedback for successful copy
   */
  private showCopySuccess(): void {
    // You can implement snackbar or tooltip feedback here
    // For now, we'll just log it
    console.log('Token copied to clipboard');
  }

  /**
   * Calculate stroke-dashoffset for circular progress animation
   * Full circle circumference = 2 * π * r = 2 * π * 20 = 125.6
   */
  getProgressOffset(): number {
    if (this.totalCountdown === 0) return 125.6;
    
    const circumference = 125.6; // 2 * Math.PI * 20 (radius)
    const progress = (this.countdown / this.totalCountdown) * 100;
    return circumference - (progress / 100) * circumference;
  }
}