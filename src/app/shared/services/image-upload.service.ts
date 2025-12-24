import { Injectable } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ImageUploadResponse {
  success: boolean;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
}

export interface UploadedImage {
  id: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  file?: File; // Original File object for upload
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  
  // Simulated storage URL
  private readonly STORAGE_BASE_URL = 'https://storage.example.com/uploads';
  
  constructor() { }

  /**
   * Upload image to storage (FAKE API - simulates upload with setTimeout)
   * @param file Image file to upload
   * @returns Observable with upload response
   */
  uploadImage(file: File): Observable<ImageUploadResponse> {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return throwError(() => new Error('Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP'));
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return throwError(() => new Error('Kích thước file vượt quá 5MB'));
    }

    // Simulate upload with 2.5s delay
    const fileName = this.generateFileName(file.name);
    const imageUrl = `${this.STORAGE_BASE_URL}/${fileName}`;
    const response: ImageUploadResponse = {
      success: true,
      imageUrl: imageUrl,
      fileName: fileName,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      thumbnailUrl: imageUrl // In real API, this would be a smaller thumbnail
    };

    // Return observable with 2.5s delay to simulate API call
    return of(response).pipe(delay(2500));
  }

  /**
   * Upload multiple images
   * @param files Array of image files
   * @returns Observable array of upload responses
   */
  uploadMultipleImages(files: File[]): Observable<ImageUploadResponse[]> {
    const uploadObservables = files.map(file => this.uploadImage(file));
    // Use forkJoin to wait for all uploads to complete
    return forkJoin(uploadObservables);
  }

  /**
   * Generate unique file name with timestamp
   * @param originalName Original file name
   * @returns Unique file name
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `image_${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Validate image file before upload
   * @param file File to validate
   * @returns Validation result
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Kích thước file vượt quá 5MB'
      };
    }

    return { valid: true };
  }

  /**
   * Convert File to base64 for preview
   * @param file Image file
   * @returns Observable with base64 string
   */
  getImagePreview(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      
      reader.onerror = (error) => {
        observer.error(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
}
