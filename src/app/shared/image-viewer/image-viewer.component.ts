import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViolationEvent } from '../../pages/violation-data/violation-data.model';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="image-viewer">
      <div class="viewer-header">
        <button mat-icon-button class="close-button" (click)="closeModal()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="viewer-content">
        <button mat-icon-button class="nav-button prev" 
                (click)="previousImage()" 
                [disabled]="currentIndex === 0">
          <mat-icon>chevron_left</mat-icon>
        </button>
        
        <div class="image-container">
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
          <img [src]="event.images[currentIndex]" 
               [class.loading]="isLoading"
               (load)="onImageLoad()"
               (error)="onImageError()"
               alt="Event image">
        </div>
        
        <button mat-icon-button class="nav-button next" 
                (click)="nextImage()" 
                [disabled]="currentIndex === event.images.length - 1">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- Thêm thumbnail gallery nếu cần -->
      <div class="thumbnail-gallery" *ngIf="event.images.length > 1">
        <div class="thumbnails">
          <div *ngFor="let image of event.images; let i = index"
               class="thumbnail"
               [class.active]="i === currentIndex"
               (click)="selectImage(i)">
            <img [src]="image" [alt]="'Thumbnail ' + (i + 1)">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-viewer {
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .viewer-header {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
      background: rgba(0, 0, 0, 0.85);
    }

    .close-button {
      color: white;
    }

    .viewer-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .image-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .image-container img {
      max-width: 600px;
      max-height: 400px;
      object-fit: contain;
      transition: opacity 0.3s ease;
    }

    .image-container img.loading {
      opacity: 0;
    }

    .loading-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .nav-button {
      position: absolute;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      top: 50%;
      transform: translateY(-50%);
    }

    .nav-button.prev {
      left: 8px;
    }

    .nav-button.next {
      right: 8px;
    }

    .nav-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-button:disabled {
      opacity: 0.3;
    }

    .thumbnail-gallery {
      padding: 8px;
      background: rgba(0, 0, 0, 0.85);
    }

    .thumbnails {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .thumbnail {
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    .thumbnail:hover {
      opacity: 1;
    }

    .thumbnail.active {
      border: 2px solid #fff;
      opacity: 1;
    }

    .thumbnail img {
      max-width: 100px;
      max-height: 75px;
      object-fit: cover;
      border-radius: 4px;
    }
  `]
})
export class ImageViewerComponent implements OnInit {
  @Input() event!: ViolationEvent;
  @Output() close = new EventEmitter<void>();

  currentIndex = 0;
  isLoading = true;

  ngOnInit() {
    // Kiểm tra và khởi tạo images từ event
    if (!this.event.images || this.event.images.length === 0) {
      // Nếu không có mảng images, tạo mảng với imageUrl
      this.event.images = [this.event.imageUrl];
    }
  }

  nextImage(): void {
    if (this.currentIndex < this.event.images.length - 1) {
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

  selectImage(index: number): void {
    if (index !== this.currentIndex) {
      this.isLoading = true;
      this.currentIndex = index;
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onImageLoad(): void {
    this.isLoading = false;
  }

  onImageError(): void {
    this.isLoading = false;
    // Handle image loading error
  }
}