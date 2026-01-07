import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { NotificationService } from '../components/notification/notification.service';
import { EventCategoryPipe } from '../pipes/event-category.pipe';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule,
    MatProgressSpinnerModule, 
    ImageViewerComponent,
    GoogleMapComponent,
    EventCategoryPipe
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent {
  @Input() set eventDetail(value: any) {
    console.log('EventDetail received data:', value);
    this._eventDetail = value;
  }
  
  get eventDetail() {
    return this._eventDetail;
  }
  
  private _eventDetail: any;
  isUpdating = false;

  @Output() eventUpdated = new EventEmitter<any>();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}
  isImageLoading = true;
  showImageViewer = false;

  onImageLoad() {
    this.isImageLoading = false;
  }

  getStatusClass(status: string): string {
    if (!status || status === 'No data') return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'processed':
      case 'đã xử lý':
        return 'status-active';
      case 'inactive':
      case 'pending':
      case 'chưa xử lý':
        return 'status-pending';
      default:
        return 'status-default';
    }
  }

  // Check if has valid coordinates for showing map
  hasValidCoordinates(): boolean {
    if (!this.eventDetail) return false;
    
    const lat = this.parseFloat(this.eventDetail.latitude);
    const lng = this.parseFloat(this.eventDetail.longitude);
    
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  }

  // Helper function to parse string to float
  parseFloat(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Get all images for the event
  getEventImages(): string[] {
    if (!this.eventDetail) return [];
    
    const images: string[] = [];
    
    // Add main image if exists
    if (this.eventDetail.imageUrl && this.eventDetail.imageUrl !== 'No data') {
      images.push(this.eventDetail.imageUrl);
    }
    
    // Add additional images if exists
    if (this.eventDetail.images && Array.isArray(this.eventDetail.images)) {
      this.eventDetail.images.forEach((img: string) => {
        if (img && img !== 'No data' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    return images;
  }

  openImageViewer(images: string[], startIndex: number = 0): void {
    if (!images || images.length === 0) {
      console.warn('No images to display');
      return;
    }
    
    console.log('Opening image viewer with images:', images, 'starting at index:', startIndex);
    
    // Cập nhật eventDetail với format mà ImageViewerComponent expect
    this._eventDetail = {
      ...this._eventDetail,
      images: images,
      imageUrl: images[startIndex] || images[0], // Start with selected image
      currentImageIndex: startIndex
    };
    
    this.showImageViewer = true;
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
  }

  updateEvent(): void {
    if (!this.eventDetail || !this.eventDetail.id) return;
    
    this.isUpdating = true;
    
    // Mặc định set status thành true khi bấm cập nhật
    const statusValue = true;
        
    this.http
      .put(`/api/admin/events/${this.eventDetail.id}`, { status: statusValue })
      .subscribe({
        next: (res) => {
          this.isUpdating = false;
          
          this._eventDetail = {
            ...this._eventDetail,
            status: 'Đã xử lý',
          };
          
          // Emit event để thông báo cho component cha cập nhật dữ liệu
          this.eventUpdated.emit({
            id: this.eventDetail.id,
            status: 'Đã xử lý',
            updatedData: this._eventDetail
          });
          
          // Hiển thị thông báo thành công
          this.notificationService.success(
            'Cập nhật thành công!', 
            `Sự kiện #${this.eventDetail.id} đã được xử lý.`
          );
        },
        error: (err) => {
          this.isUpdating = false;
          console.error('Update event failed:', err);
          
          // Hiển thị thông báo lỗi
          this.notificationService.error(
            'Cập nhật thất bại!', 
            `Không thể cập nhật sự kiện #${this.eventDetail.id}. Vui lòng thử lại.`
          );
        },
      });
  }

  // Format time to "HH:mm dd/MM/yyyy" format
  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString || dateTimeString === 'No data') {
      return 'No data';
    }

    try {
      // Parse the input date string
      const date = new Date(dateTimeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateTimeString; // Return original if can't parse
      }

      // Format to "HH:mm dd/MM/yyyy"
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateTimeString; // Return original if error
    }
  }
}