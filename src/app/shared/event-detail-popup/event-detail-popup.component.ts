import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { EventCategoryPipe } from '../pipes/event-category.pipe';

@Component({
  selector: 'app-event-detail-popup',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatTooltipModule, 
    GoogleMapComponent,
    ImageViewerComponent,
    EventCategoryPipe
  ],
  templateUrl: './event-detail-popup.component.html',
  styleUrls: ['./event-detail-popup.component.css']
})
export class EventDetailPopupComponent {
  @Input() eventDetail: any;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() viewFullDetail = new EventEmitter<void>();
  @Output() imageViewerStateChange = new EventEmitter<boolean>();

  showImageViewer = false;
  showVideoViewer = false;
  currentVideoUrl: string = '';
  isImageLoading = true;

  closePopup(): void {
    this.close.emit();
  }

  openImageViewer(images: string[], startIndex: number = 0): void {
    if (!images || images.length === 0) return;
    
    this.eventDetail = {
      ...this.eventDetail,
      images: images,
      imageUrl: images[startIndex] || images[0],
      currentImageIndex: startIndex
    };
    
    this.showImageViewer = true;
    this.imageViewerStateChange.emit(true);
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.imageViewerStateChange.emit(false);
  }

  onImageLoad(): void {
    this.isImageLoading = false;
  }

  getEventImages(): string[] {
    if (!this.eventDetail) return [];
    
    const images: string[] = [];
    
    if (this.eventDetail.imageUrl && this.eventDetail.imageUrl !== 'No data') {
      images.push(this.eventDetail.imageUrl);
    }
    
    if (this.eventDetail.images && Array.isArray(this.eventDetail.images)) {
      this.eventDetail.images.forEach((img: string) => {
        if (img && img !== 'No data' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    return images;
  }

  getEventVideos(): string[] {
    if (!this.eventDetail?.clipPath) return [];
    
    if (Array.isArray(this.eventDetail.clipPath)) {
      return this.eventDetail.clipPath.filter((url: string) => url && url !== 'No data');
    }
    
    return [];
  }

  openVideoViewer(videoUrl: string): void {
    this.currentVideoUrl = videoUrl;
    this.showVideoViewer = true;
    this.imageViewerStateChange.emit(true);
  }

  closeVideoViewer(): void {
    this.showVideoViewer = false;
    this.currentVideoUrl = '';
    this.imageViewerStateChange.emit(false);
  }

  getFakeImages(count: number): any[] {
    return count > 0 ? Array(count).fill(null) : [];
  }

  getFakeItemsCount(): number {
    const videosCount = this.getEventVideos().length;
    const imagesCount = this.getEventImages().length;
    const total = videosCount + imagesCount;
    return total < 4 ? (4 - total) : 0;
  }

  getEventImageLabel(index: number): string {
    const labels = ['Trước sự kiện', 'Trong sự kiện', 'Sau sự kiện', 'Sau sự kiện'];
    return labels[index] || 'Sự kiện';
  }

  // Check if event is person type
  isPersonEvent(): boolean {
    if (!this.eventDetail?.eventCategory) return false;
    return this.eventDetail.eventCategory.toUpperCase() === 'PERSON';
  }

  // Get main image label based on event type
  getMainImageLabel(index: number): string {
    if (this.isPersonEvent()) {
      if (index === 0) return 'Đối tượng (crop)';
      if (index === 1) return 'Đối tượng (full)';
      return 'Đối tượng';
    }
    return index === 0 ? 'Biển số' : 'Phương tiện';
  }

  hasValidCoordinates(): boolean {
    if (!this.eventDetail) return false;
    
    const lat = this.parseFloat(this.eventDetail.latitude);
    const lng = this.parseFloat(this.eventDetail.longitude);
    
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  }

  parseFloat(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  downloadEvent(): void {
    console.log('Download event:', this.eventDetail);
  }

  viewDetails(): void {
    this.viewFullDetail.emit(this.eventDetail);
  }
}
