import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="image-viewer">
      <div class="viewer-header">
        <span class="title">Chi tiết hình ảnh</span>
        <button mat-icon-button (click)="close()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="viewer-content">
        <button mat-icon-button class="nav-button prev" (click)="previousImage()" [disabled]="currentIndex === 0">
          <mat-icon>chevron_left</mat-icon>
        </button>
        
        <div class="main-image-container">
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          <img [src]="images[currentIndex]" 
               [class.loading]="isLoading"
               (load)="onImageLoad()"
               (error)="onImageError()"
               alt="Event image">
        </div>
        
        <button mat-icon-button class="nav-button next" (click)="nextImage()" [disabled]="currentIndex === images.length - 1">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
      
      <div class="thumbnail-container">
        <div class="thumbnails">
          <div *ngFor="let image of images; let i = index" 
               class="thumbnail" 
               [class.active]="i === currentIndex"
               (click)="setCurrentImage(i)">
            <img [src]="image" [alt]="'Thumbnail ' + (i + 1)">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-viewer {
      background: rgb(0, 0, 0);
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      /* Loại bỏ position fixed và sizing cố định */
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      z-index: 1000;
      flex-shrink: 0;
    }

    .title {
      font-size: 18px;
      font-weight: 500;
    }

    .close-button {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .viewer-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: rgb(0, 0, 0);
      min-height: 0; /* Cho phép flex shrink */
    }

    .main-image-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      height: 100%;
      padding: 20px;
    }

    .main-image-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      transition: opacity 0.3s ease;
    }

    .main-image-container img.loading {
      opacity: 0;
    }

    .loading-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      width: 48px;
      height: 48px;
      z-index: 100;
      transition: all 0.3s ease;
      
      .mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .nav-button.prev {
      left: 20px;
    }

    .nav-button.next {
      right: 20px;
    }

    .nav-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-button:disabled {
      opacity: 0.3;
      cursor: not-allowed; 
    }

    .thumbnail-container {
      background: rgba(0, 0, 0, 0.9);
      padding: 20px 0;
      flex-shrink: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .thumbnails {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 0 24px;
      scroll-behavior: smooth;
      
      /* Custom scrollbar */
      &::-webkit-scrollbar {
        height: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .thumbnail {
      width: 80px;
      height: 60px;
      flex-shrink: 0;
      cursor: pointer;
      border: 2px solid transparent;
      opacity: 0.6;
      transition: all 0.3s ease;
      border-radius: 6px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
    }

    .thumbnail.active {
      border-color: #2196f3;
      opacity: 1;
      transform: scale(1.05);
    }

    .thumbnail:hover:not(.active) {
      opacity: 0.8;
      transform: scale(1.02);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .viewer-header {
        padding: 12px 16px;
      }
      
      .title {
        font-size: 16px;
      }
      
      .nav-button {
        width: 40px;
        height: 40px;
        
        .mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      .nav-button.prev {
        left: 10px;
      }
      
      .nav-button.next {
        right: 10px;
      }
      
      .thumbnail {
        width: 60px;
        height: 45px;
      }
      
      .thumbnails {
        padding: 0 16px;
        gap: 8px;
      }
    }
  `]
})
export class ImageViewerComponent {
  images: string[] = [];
  currentIndex = 0;
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<ImageViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { images: string[], startIndex?: number }
  ) {
    this.images = data.images;
    this.currentIndex = data.startIndex || 0;
  }

  onImageLoad(): void {
    this.isLoading = false;
  }

  onImageError(): void {
    this.isLoading = false;
    // Có thể thêm xử lý lỗi ở đây
  }

  nextImage(): void {
    if (this.currentIndex < this.images.length - 1) {
      this.isLoading = true;
      this.currentIndex++;
    }
  }

  previousImage(): void {
    if (this.currentIndex > 0) {
      this.isLoading = true;
      this.currentIndex--;
    }
  }

  setCurrentImage(index: number): void {
    if (this.currentIndex !== index) {
      this.isLoading = true;
      this.currentIndex = index;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}