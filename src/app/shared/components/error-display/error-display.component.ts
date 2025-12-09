import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { ErrorHandlerService, AppError } from '../../../core/services/error-handler.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatBadgeModule
  ],
  template: `
    <div class="error-display" *ngIf="errors.length > 0">
      <button mat-icon-button 
              [matBadge]="unhandledErrorsCount" 
              matBadgeColor="warn"
              [matBadgeHidden]="unhandledErrorsCount === 0"
              (click)="toggleErrorList()">
        <mat-icon>error</mat-icon>
      </button>

      <div class="error-list" *ngIf="showErrorList">
        <mat-card *ngFor="let error of errors; trackBy: trackByErrorId" 
                  class="error-item"
                  [class.handled]="error.handled">
          <mat-card-header>
            <mat-card-title>{{ getErrorTypeLabel(error.type) }}</mat-card-title>
            <mat-card-subtitle>{{ error.timestamp | date:'HH:mm:ss' }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p>{{ error.message }}</p>
            <small *ngIf="error.url">{{ error.method }} {{ error.url }}</small>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button 
                    *ngIf="!error.handled"
                    (click)="markAsHandled(error.id)">
              Đánh dấu đã xử lý
            </button>
          </mat-card-actions>
        </mat-card>

        <div class="error-actions">
          <button mat-button (click)="clearAllErrors()">
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-display {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .error-list {
      position: absolute;
      top: 100%;
      right: 0;
      width: 400px;
      max-height: 500px;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 16px;
    }

    .error-item {
      margin-bottom: 12px;
    }

    .error-item.handled {
      opacity: 0.6;
    }

    .error-actions {
      margin-top: 16px;
      text-align: center;
    }
  `]
})
export class ErrorDisplayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  errors: AppError[] = [];
  showErrorList = false;
  
  get unhandledErrorsCount(): number {
    return this.errors.filter(error => !error.handled).length;
  }

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void {
    this.errorHandler.errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe(errors => {
        this.errors = errors;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleErrorList(): void {
    this.showErrorList = !this.showErrorList;
  }

  markAsHandled(errorId: string): void {
    this.errorHandler.markErrorAsHandled(errorId);
  }

  clearAllErrors(): void {
    this.errorHandler.clearAllErrors();
    this.showErrorList = false;
  }

  trackByErrorId(index: number, error: AppError): string {
    return error.id;
  }

  getErrorTypeLabel(type: AppError['type']): string {
    const labels = {
      'network': 'Lỗi kết nối mạng',
      'server': 'Lỗi server',
      'client': 'Lỗi client',
      'timeout': 'Timeout',
      'unknown': 'Lỗi không xác định'
    };
    return labels[type] || type;
  }
}