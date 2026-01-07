import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMapComponent } from '../../shared/components/google-map/google-map.component';
import { ImageViewerComponent } from '../../shared/image-viewer/image-viewer.component';
import { VideoPlayerComponent } from '../../shared/components/video-player/video-player.component';
import { EventService } from './event.service';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    GoogleMapComponent,
    ImageViewerComponent,
    VideoPlayerComponent
  ],
  templateUrl: './event-detail-page.component.html',
  styleUrls: ['./event-detail-page.component.css']
})
export class EventDetailPageComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  eventId: string | null = null;
  eventDetail: any = null;
  loading = true;
  error = false;
  errorMessage = '';
  previousUrl: string = '/event/info'; // Default fallback
  
  // Media state
  selectedPlateType = 'yellow';
  selectedMediaType: 'video' | 'image' = 'image';
  selectedImage: string | null = null;
  selectedImageIndex = 0;
  selectedVideoIndex = 0;
  currentVideoUrl: string | null = null;
  thumbnailScrollIndex = 0;
  
  // Video state
  isPlaying = false;
  videoProgress = 0;
  playbackSpeed = 1;
  currentTime = 0;
  duration = 0;
  timelineMarkers: string[] = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  
  // Image viewer state
  showImageViewer = false;
  viewerImages: string[] = [];
  viewerInitialIndex = 0;
  
  // Map state - always show map, use event coords or default Hanoi
  mapLatitude: number = 21.0285;
  mapLongitude: number = 105.8542;
  hasEventCoordinates: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private eventService: EventService
  ) {}

  ngOnInit() {
    // Get previous URL from navigation state or query params
    const navigation = this.router.getCurrentNavigation();
    const state = history.state;
    
    // Try to get returnUrl from state, query params, or referrer
    this.previousUrl = state?.returnUrl || 
                       this.route.snapshot.queryParams['returnUrl'] || 
                       '/event/info';
    
    console.log('Previous URL:', this.previousUrl);
    
    // Lấy ID từ route params
    this.eventId = this.route.snapshot.paramMap.get('id');
    
    if (this.eventId) {
      this.loadEventDetail(this.eventId);
    } else {
      this.error = true;
      this.errorMessage = 'Không tìm thấy ID sự kiện';
      this.loading = false;
    }
  }

  loadEventDetail(id: string) {
    this.loading = true;
    this.error = false;

    this.eventService.getEventById(id).subscribe({
      next: (response) => {
        if (response && response.data) {
          const data = response.data;
          this.eventDetail = {
            ...data,
            // Map dữ liệu mới từ API
            eventId: data.eventId,
            cameraSn: data.cameraSn,
            cameraId: data.cameraId,
            cameraName: data.cameraName,
            eventType: data.eventType,
            eventCategory: data.eventCategory,
            startTime: data.startTime,
            eventTime: data.eventTime,
            duration: data.duration,
            location: data.location,
            longitude: data.longitude,
            latitude: data.latitude,
            status: data.status,
            
            // Map attributes
            gender: data.attributes?.gender || data.gender,
            topColor: data.attributes?.topColor || data.topColor,
            topCategory: data.attributes?.topCategory || data.topCategory,
            bottomColor: data.attributes?.bottomColor || data.bottomColor,
            bottomCategory: data.attributes?.bottomCategory || data.bottomCategory,
            
            // Map images and videos
            fullImagePath: data.fullImagePath,
            croppedImagePath: data.croppedImagePath,
            clipPath: data.clipPath,
            
            // Backward compatibility
            image: data.croppedImagePath || data.fullImagePath || data.imagePath,
            camera: data.cameraName || data.cameraSn || 'Unknown Camera'
          };
          
          // Set map properties once
          this.updateMapProperties();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event detail:', error);
        this.error = true;
        this.errorMessage = 'Không thể tải chi tiết sự kiện';
        this.loading = false;
      }
    });
  }

  private getFirstImageFromPath(imagePath: string): string {
    if (!imagePath) return '/assets/images/no-image.png';
    const imageUrls = imagePath.split(',');
    return imageUrls[0]?.trim() || '/assets/images/no-image.png';
  }

  // Sử dụng Location service để back về màn trước đó
  goBack() {
    // Try to navigate to stored previous URL, fallback to location.back()
    if (this.previousUrl && this.previousUrl !== '/event/info') {
      this.router.navigateByUrl(this.previousUrl);
    } else {
      this.location.back();
    }
  }

  onEventUpdated(updatedEvent: any) {
    // Reload data khi event được update
    if (this.eventId) {
      this.loadEventDetail(this.eventId);
    }
  }

  retry() {
    if (this.eventId) {
      this.loadEventDetail(this.eventId);
    }
  }

  // Search related events
  searchRelatedEvents() {
    const plateNumber = this.eventDetail?.plateNumber;
    if (plateNumber) {
      this.router.navigate(['/event/info'], { 
        queryParams: { plateNumber: plateNumber }
      });
    }
  }

  // Get plate type class for styling
  getPlateTypeClass(plateType: string): string {
    const typeMap: { [key: string]: string } = {
      'yellow': 'plate-yellow',
      'white': 'plate-white',
      'blue': 'plate-blue',
      'red': 'plate-red'
    };
    return typeMap[plateType] || 'plate-white';
  }

  // Get vehicle color display
  getVehicleColor(color: string): string {
    const colorMap: { [key: string]: string } = {
      'white': 'Trắng',
      'black': 'Đen',
      'silver': 'Bạc',
      'red': 'Đỏ',
      'blue': 'Xanh dương',
      'gray': 'Xám',
      'yellow': 'Vàng',
      'green': 'Xanh lá'
    };
    return colorMap[color?.toLowerCase()] || color || 'N/A';
  }

  // Get color hex code for display
  getColorCode(color: string): string {
    const colorCodes: { [key: string]: string } = {
      'white': '#ffffff',
      'black': '#000000',
      'silver': '#c0c0c0',
      'red': '#ff0000',
      'blue': '#0000ff',
      'gray': '#808080',
      'yellow': '#ffff00',
      'green': '#00ff00'
    };
    return colorCodes[color?.toLowerCase()] || '#e0e0e0';
  }

  // Format date time for display
  formatDateTime(dateTime: string): string {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateTime;
    }
  }

  // Get event type display (convert Red_Light to "Vượt đèn đỏ", etc.)
  getEventTypeDisplay(eventType: string): string {
    if (!eventType) return 'N/A';
    
    const eventTypeMap: { [key: string]: string } = {
      'red_light': 'Vượt đèn đỏ',
      'speeding': 'Vượt tốc độ',
      'wrong_lane': 'Đi sai làn',
      'lane_violation': 'Vi phạm làn đường',
      'no_helmet': 'Không đội mũ bảo hiểm',
      'wrong_direction': 'Đi ngược chiều',
      'parking_violation': 'Dừng đỗ sai quy định',
      'face_recognition': 'Nhận diện khuôn mặt',
      'person': 'Phát hiện người',
      'vehicle': 'Phát hiện phương tiện'
    };
    
    return eventTypeMap[eventType.toLowerCase()] || eventType.replace(/_/g, ' ');
  }

  // Get location link for Google Maps
  getLocationLink(): string {
    const lat = this.eventDetail?.latitude;
    const lng = this.eventDetail?.longitude;
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return '#';
  }

  // Update map properties - called once when data loads
  private updateMapProperties(): void {
    const lat = this.eventDetail?.latitude;
    const lng = this.eventDetail?.longitude;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    
    // Check if event has valid coordinates
    this.hasEventCoordinates = lat !== null && lat !== undefined && 
                               lng !== null && lng !== undefined &&
                               !isNaN(latNum) && !isNaN(lngNum) &&
                               latNum !== 0 && lngNum !== 0;
    
    // If has coordinates, use them; otherwise keep default Hanoi
    if (this.hasEventCoordinates) {
      this.mapLatitude = latNum;
      this.mapLongitude = lngNum;
    }
    
    console.log('Map properties updated:', { hasEventCoordinates: this.hasEventCoordinates, lat: this.mapLatitude, lng: this.mapLongitude });
  }

  // Download current media
  downloadCurrentMedia() {
    if (this.selectedMediaType === 'video') {
      const videoUrl = this.eventDetail?.videoPath;
      if (videoUrl) {
        this.downloadFile(videoUrl, `video_${this.eventId}.mp4`);
      }
    } else {
      const imageUrl = this.selectedImage || this.getMainImage();
      if (imageUrl) {
        this.downloadFile(imageUrl, `image_${this.eventId}_${this.selectedImageIndex}.jpg`);
      }
    }
  }

  // Video loaded handler
  onVideoLoaded() {
    console.log('Video loaded successfully');
  }

  // Video error handler
  onVideoError(event: any) {
    console.error('Video loading error:', event);
  }

  // Skip backward 10 seconds
  skipBackward() {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.currentTime = Math.max(0, this.videoPlayer.nativeElement.currentTime - 10);
    }
  }

  // Toggle play/pause
  togglePlay() {
    if (this.videoPlayer?.nativeElement) {
      if (this.isPlaying) {
        this.videoPlayer.nativeElement.pause();
      } else {
        this.videoPlayer.nativeElement.play();
      }
      this.isPlaying = !this.isPlaying;
    }
  }

  // Skip forward 10 seconds
  skipForward() {
    if (this.videoPlayer?.nativeElement) {
      const duration = this.videoPlayer.nativeElement.duration || 0;
      this.videoPlayer.nativeElement.currentTime = Math.min(duration, this.videoPlayer.nativeElement.currentTime + 10);
    }
  }

  // Change playback speed
  changePlaybackSpeed() {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(this.playbackSpeed);
    this.playbackSpeed = speeds[(currentIndex + 1) % speeds.length];
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.playbackRate = this.playbackSpeed;
    }
  }

  // Select video to play
  selectVideo(videoUrl?: string, index?: number) {
    this.selectedMediaType = 'video';
    if (videoUrl !== undefined && index !== undefined) {
      this.currentVideoUrl = videoUrl;
      this.selectedVideoIndex = index;
    } else {
      // If called without params, select first video
      const videos = this.getEventVideos();
      if (videos.length > 0) {
        this.currentVideoUrl = videos[0];
        this.selectedVideoIndex = 0;
      }
    }
  }

  // Check if event has video (clipPath)
  hasVideo(): boolean {
    return this.getEventVideos().length > 0;
  }

  // Get current video URL for player
  getCurrentVideoUrl(): string {
    if (this.currentVideoUrl) {
      return this.currentVideoUrl;
    }
    const videos = this.getEventVideos();
    return videos[0] || '';
  }

  // Video time update handler
  onVideoTimeUpdate() {
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      this.currentTime = video.currentTime;
      this.duration = video.duration || 0;
      if (this.duration > 0) {
        this.videoProgress = (this.currentTime / this.duration) * 100;
      }
    }
  }

  // Video ended handler
  onVideoEnded() {
    this.isPlaying = false;
    this.videoProgress = 100;
  }

  // Handle progress bar change
  onProgressChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const progress = parseFloat(target.value);
    if (this.videoPlayer?.nativeElement && this.duration > 0) {
      this.videoPlayer.nativeElement.currentTime = (progress / 100) * this.duration;
    }
  }

  // Format video time for display
  formatVideoTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Select image to view
  selectImage(image: string, index: number) {
    this.selectedMediaType = 'image';
    this.selectedImage = image;
    this.selectedImageIndex = index;
  }

  // Get video thumbnail - use first image as thumbnail
  getVideoThumbnail(): string {
    // Use first event image as video thumbnail, or default placeholder
    const images = this.getEventImages();
    return images[0] || '/assets/images/video-thumbnail.png';
  }

  // Get event images array
  getEventImages(): string[] {
    if (!this.eventDetail) return [];
    
    const images: string[] = [];
    
    // Add croppedImagePath if exists
    if (this.eventDetail.croppedImagePath) {
      images.push(this.eventDetail.croppedImagePath);
    }
    
    // Add fullImagePath if exists
    if (this.eventDetail.fullImagePath) {
      images.push(this.eventDetail.fullImagePath);
    }
    
    // Add imagePath if exists (backward compatibility)
    if (this.eventDetail.imagePath) {
      const oldImages = this.eventDetail.imagePath.split(',').map((img: string) => img.trim()).filter((img: string) => img);
      oldImages.forEach((img: string) => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    return images;
  }

  // Get event videos array from clipPath
  getEventVideos(): string[] {
    if (!this.eventDetail?.clipPath) return [];
    
    // If clipPath is already an array, return it
    if (Array.isArray(this.eventDetail.clipPath)) {
      return this.eventDetail.clipPath.filter((url: string) => url && url !== 'No data');
    }
    
    // If clipPath is a string, return as single-item array
    if (typeof this.eventDetail.clipPath === 'string' && this.eventDetail.clipPath !== 'No data') {
      return [this.eventDetail.clipPath];
    }
    
    return [];
  }

  // Get main display image
  getMainImage(): string {
    if (this.selectedImage) return this.selectedImage;
    const images = this.getEventImages();
    return images[0] || '/assets/images/no-image.png';
  }

  // Get image label (badge) for thumbnail
  getImageLabel(index: number): string {
    const images = this.getEventImages();
    
    // For person events, show specific labels
    if (this.isPersonEvent()) {
      if (index === 0 && this.eventDetail?.croppedImagePath) {
        return 'Đối tượng (crop)';
      }
      if (index === 1 && this.eventDetail?.fullImagePath) {
        return 'Đối tượng (full)';
      }
    }
    
    // Default label for other images
    return `Ảnh ${index + 1}`;
  }

  // Get image caption
  getImageCaption(index: number): string {
    return `Ảnh ${index + 1}`;
  }

  // Scroll thumbnails
  scrollThumbnails(direction: 'left' | 'right') {
    const images = this.getEventImages();
    const maxIndex = Math.max(0, images.length - 4);
    
    if (direction === 'left') {
      this.thumbnailScrollIndex = Math.max(0, this.thumbnailScrollIndex - 1);
    } else {
      this.thumbnailScrollIndex = Math.min(maxIndex, this.thumbnailScrollIndex + 1);
    }
  }

  // Open image viewer modal
  openImageViewer() {
    this.viewerImages = this.getEventImages();
    this.viewerInitialIndex = this.selectedImageIndex;
    this.showImageViewer = true;
  }

  // Close image viewer modal
  closeImageViewer() {
    this.showImageViewer = false;
  }

  // Get viewer event object for ImageViewerComponent
  getViewerEvent(): any {
    return {
      images: this.getEventImages(),
      imageUrl: this.getMainImage(),
      ...this.eventDetail
    };
  }

  // Download all media
  downloadAllMedia() {
    const images = this.getEventImages();
    images.forEach((image, index) => {
      setTimeout(() => {
        this.downloadFile(image, `event_${this.eventId}_image_${index + 1}.jpg`);
      }, index * 500);
    });
    
    const videoUrl = this.eventDetail?.videoPath;
    if (videoUrl) {
      setTimeout(() => {
        this.downloadFile(videoUrl, `event_${this.eventId}_video.mp4`);
      }, images.length * 500);
    }
  }

  // Helper: Download file
  private downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse float helper for template
  parseFloat(value: any): number {
    return parseFloat(value) || 0;
  }

  // ============ Event Type Detection Methods ============
  
  // Check if event is person/face recognition type
  isPersonEvent(): boolean {
    if (!this.eventDetail?.eventType && !this.eventDetail?.eventCategory) return false;
    
    // Check eventCategory first (more reliable)
    if (this.eventDetail.eventCategory?.toUpperCase() === 'PERSON') {
      return true;
    }
    
    // Fallback to eventType check
    const personTypes = ['face_recognition', 'people_in_out', 'people_unidentified', 
                         'people_unknown_face_alert', 'person', 'face', 'người', 'nhận diện'];
    return personTypes.some(type => 
      this.eventDetail.eventType.toLowerCase().includes(type.toLowerCase())
    );
  }

  // Check if event is traffic type
  isTrafficEvent(): boolean {
    if (!this.eventDetail?.eventType && !this.eventDetail?.eventCategory) return false;
    
    // Check eventCategory first - support both VEHICLE and TRAFFIC
    if (this.eventDetail.eventCategory?.toUpperCase() === 'VEHICLE' || 
        this.eventDetail.eventCategory?.toUpperCase() === 'TRAFFIC') {
      return true;
    }
    
    // Fallback to eventType check
    const trafficTypes = ['traffic', 'vehicle', 'giao thông', 'xe', 'biển số', 
                          'license_plate', 'motorcycle', 'car', 'truck'];
    return trafficTypes.some(type => 
      this.eventDetail.eventType.toLowerCase().includes(type.toLowerCase())
    );
  }

  // Check if event is security type
  isSecurityEvent(): boolean {
    if (!this.eventDetail?.eventType) return false;
    const securityTypes = ['security', 'intrusion', 'crowd', 'abandoned', 'an ninh', 
                           'xâm nhập', 'đám đông', 'bất thường'];
    return securityTypes.some(type => 
      this.eventDetail.eventType.toLowerCase().includes(type.toLowerCase())
    );
  }

  // Get event category title based on event type
  getEventCategoryTitle(): string {
    if (this.isPersonEvent()) return 'Nhận diện đối tượng';
    if (this.isTrafficEvent()) return 'Sự kiện Giao thông';
    if (this.isSecurityEvent()) return 'An ninh trật tự';
    return 'Chi tiết sự kiện';
  }

  // ============ Person Event Methods ============

  // Get reference images for person event
  getReferenceImages(): string[] {
    if (!this.eventDetail) return [];
    const refs: string[] = [];
    
    // Add reference images from various possible fields
    if (this.eventDetail.referenceImages && Array.isArray(this.eventDetail.referenceImages)) {
      refs.push(...this.eventDetail.referenceImages);
    }
    if (this.eventDetail.faceImages && Array.isArray(this.eventDetail.faceImages)) {
      refs.push(...this.eventDetail.faceImages);
    }
    if (this.eventDetail.thumbnailUrl) {
      refs.push(this.eventDetail.thumbnailUrl);
    }
    
    return refs.slice(0, 4); // Max 4 reference images
  }

  // Get gender display text
  getGenderDisplay(gender: string | null | undefined): string {
    if (!gender || gender === null) return 'N/A';
    const genderMap: { [key: string]: string } = {
      'male': 'Nam',
      'female': 'Nữ',
      'm': 'Nam',
      'f': 'Nữ',
      'nam': 'Nam',
      'nữ': 'Nữ'
    };
    return genderMap[gender.toLowerCase()] || gender;
  }

  // Get clothing color
  getClothingColor(color: string | null | undefined): string {
    if (!color || color === null) return '#e0e0e0';
    return this.getColorCode(color);
  }

  // Format top category (loại áo)
  getTopCategoryDisplay(category: string | null | undefined): string {
    if (!category || category === null) return 'N/A';
    const categoryMap: { [key: string]: string } = {
      'LongSleeve': 'Áo dài tay',
      'ShortSleeve': 'Áo ngắn tay',
      'Sleeveless': 'Áo không tay'
    };
    return categoryMap[category] || category;
  }

  // Format bottom category (loại quần)
  getBottomCategoryDisplay(category: string | null | undefined): string {
    if (!category || category === null) return 'N/A';
    const categoryMap: { [key: string]: string } = {
      'LongPants': 'Quần dài',
      'ShortPants': 'Quần ngắn',
      'Skirt': 'Váy'
    };
    return categoryMap[category] || category;
  }

  // Format color display
  getColorDisplay(color: string | null | undefined): string {
    if (!color || color === null) return 'N/A';
    const colorMap: { [key: string]: string } = {
      'White': 'Trắng',
      'Black': 'Đen',
      'Red': 'Đỏ',
      'Blue': 'Xanh dương',
      'Green': 'Xanh lá',
      'Yellow': 'Vàng',
      'Gray': 'Xám',
      'Brown': 'Nâu',
      'Orange': 'Cam',
      'Pink': 'Hồng'
    };
    return colorMap[color] || color;
  }

  // ============ Status Methods ============

  // Get status display text
  getStatusDisplay(status: any): string {
    if (status === true || status === 'processed' || status === 'Đã xử lý') {
      return 'Đã xử lý';
    }
    if (status === false || status === 'pending' || status === 'Chưa xử lý') {
      return 'Chưa xử lý';
    }
    return 'N/A';
  }

  // Get status CSS class
  getStatusClass(status: any): string {
    if (status === true || status === 'processed' || status === 'Đã xử lý') {
      return 'status-processed';
    }
    if (status === false || status === 'pending' || status === 'Chưa xử lý') {
      return 'status-pending';
    }
    return 'status-default';
  }

  // Get severity CSS class for security events
  getSeverityClass(severity: string): string {
    if (!severity) return '';
    const severityMap: { [key: string]: string } = {
      'high': 'severity-high',
      'cao': 'severity-high',
      'medium': 'severity-medium',
      'trung bình': 'severity-medium',
      'low': 'severity-low',
      'thấp': 'severity-low'
    };
    return severityMap[severity.toLowerCase()] || '';
  }
}
