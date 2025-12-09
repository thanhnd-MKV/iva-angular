import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImageUploadService, ImageUploadResponse, UploadedImage } from '../../services/image-upload.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class ImageUploadComponent {
  @Output() imagesUploaded = new EventEmitter<UploadedImage[]>();
  @Output() uploadCancelled = new EventEmitter<void>();
  @Input() autoUpload = true;
  @Input() allowMultiple = true;
  @Input() existingImages: UploadedImage[] = [];
  
  selectedFiles: File[] = [];
  previewUrls: { file: File; url: string }[] = [];
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  errorMessage: string | null = null;
  uploadedImages: UploadedImage[] = [];
  // Store local preview URLs for uploaded images
  private imagePreviewMap: Map<string, string> = new Map();

  constructor(private imageUploadService: ImageUploadService) {}

  ngOnInit() {
    if (this.existingImages && this.existingImages.length > 0) {
      this.uploadedImages = [...this.existingImages];
      // Copy preview URLs from existing images if they have them
      this.existingImages.forEach(img => {
        if (img.thumbnailUrl && img.thumbnailUrl.startsWith('blob:')) {
          this.imagePreviewMap.set(img.id, img.thumbnailUrl);
        }
      });
    }
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(Array.from(files));
    }
  }

  // File input handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(Array.from(input.files));
    }
  }

  // Handle file selection
  private handleFileSelection(files: File[]): void {
    this.errorMessage = null;

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = this.imageUploadService.validateImageFile(file);
      if (!validation.valid) {
        this.errorMessage = validation.error || 'File không hợp lệ';
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add to selected files
    if (this.allowMultiple) {
      this.selectedFiles.push(...validFiles);
    } else {
      this.selectedFiles = [validFiles[0]];
    }

    // Generate previews for new files
    validFiles.forEach(file => {
      this.imageUploadService.getImagePreview(file).subscribe({
        next: (preview) => {
          this.previewUrls.push({ file, url: preview });
          
          // Auto upload if enabled
          if (this.autoUpload) {
            this.uploadImages();
          }
        },
        error: (error) => {
          this.errorMessage = 'Không thể tạo preview cho ảnh';
          console.error('Preview error:', error);
        }
      });
    });
  }

  // Upload images
  uploadImages(): void {
    if (this.selectedFiles.length === 0) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = null;

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 250);

    // Store files with their preview URLs (don't clear them yet!)
    const filesWithPreviews: { file: File; previewUrl: string }[] = [];
    this.selectedFiles.forEach(file => {
      const preview = this.previewUrls.find(p => p.file === file);
      if (preview) {
        filesWithPreviews.push({ file, previewUrl: preview.url });
      }
    });

    // Upload all files
    const uploadObservables = this.selectedFiles.map(file => 
      this.imageUploadService.uploadImage(file)
    );

    forkJoin(uploadObservables).subscribe({
      next: (responses) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        
        // Add to uploaded images with local preview URLs
        responses.forEach((response, index) => {
          const imageId = this.generateId();
          const localPreviewUrl = filesWithPreviews[index]?.previewUrl || '';
          
          // Store local preview URL in map (keep it, don't revoke!)
          if (localPreviewUrl) {
            this.imagePreviewMap.set(imageId, localPreviewUrl);
          }
          
          this.uploadedImages.push({
            id: imageId,
            imageUrl: response.imageUrl, // This will be used when API is ready
            fileName: response.fileName,
            fileSize: response.fileSize,
            uploadedAt: response.uploadedAt,
            thumbnailUrl: localPreviewUrl // Store local preview in thumbnailUrl temporarily
          });
        });
        
        // Clear selected files and preview references (but keep the blob URLs in map!)
        this.selectedFiles = [];
        this.previewUrls = [];
        
        // Emit success event
        this.imagesUploaded.emit(this.uploadedImages);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.errorMessage = error.message || 'Upload thất bại';
        console.error('Upload error:', error);
      }
    });
  }

  // Get image preview URL (local for now, will use storage URL later)
  getImagePreviewUrl(image: UploadedImage): string {
    // Priority: 1. Local preview from map, 2. thumbnailUrl (may contain local blob), 3. imageUrl (fake for now)
    const localPreview = this.imagePreviewMap.get(image.id);
    if (localPreview) {
      return localPreview;
    }
    
    // Check if thumbnailUrl is a blob URL (local preview)
    if (image.thumbnailUrl && image.thumbnailUrl.startsWith('blob:')) {
      return image.thumbnailUrl;
    }
    
    // Fallback to storage URLs (when API is ready)
    return image.thumbnailUrl || image.imageUrl;
  }

  // Remove uploaded image
  removeUploadedImage(id: string): void {
    const image = this.uploadedImages.find(img => img.id === id);
    
    // Revoke blob URL if it exists
    if (image) {
      const previewUrl = this.imagePreviewMap.get(id);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      // Also check thumbnailUrl
      if (image.thumbnailUrl && image.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(image.thumbnailUrl);
      }
    }
    
    this.uploadedImages = this.uploadedImages.filter(img => img.id !== id);
    // Clean up preview URL from map
    this.imagePreviewMap.delete(id);
    this.imagesUploaded.emit(this.uploadedImages);
  }

  // Remove preview (before upload)
  removePreview(file: File): void {
    // Find and revoke the blob URL
    const preview = this.previewUrls.find(p => p.file === file);
    if (preview && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    this.previewUrls = this.previewUrls.filter(p => p.file !== file);
  }

  // Clear all
  clearAll(): void {
    // Revoke all blob URLs before clearing
    this.previewUrls.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
    
    this.imagePreviewMap.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    this.uploadedImages.forEach(img => {
      if (img.thumbnailUrl && img.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.thumbnailUrl);
      }
    });
    
    this.selectedFiles = [];
    this.previewUrls = [];
    this.uploadedImages = [];
    this.uploadProgress = 0;
    this.errorMessage = null;
    this.isUploading = false;
    this.imagePreviewMap.clear();
  }

  // Cancel upload
  cancel(): void {
    this.clearAll();
    this.uploadCancelled.emit();
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Trigger file input
  triggerFileInput(): void {
    const fileInput = document.getElementById('imageFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  get totalImages(): number {
    return this.uploadedImages.length;
  }
}
