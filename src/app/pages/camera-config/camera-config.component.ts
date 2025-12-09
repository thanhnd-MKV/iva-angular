import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CameraService } from '../camera/camera.service';
import { CustomCheckboxComponent } from '../../shared/components/custom-checkbox/custom-checkbox.component';

interface Camera {
  id: number;
  name: string;
  checked: boolean;
}

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  color: string;
  disabled?: boolean;
}

interface ViolationType {
  id: string;
  name: string;
  enabled: boolean;
}

@Component({
  selector: 'app-camera-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    CustomCheckboxComponent
  ],
  templateUrl: './camera-config.component.html',
  styleUrls: ['./camera-config.component.css']
})
export class CameraConfigComponent implements OnInit {
  // Active section in sidebar
  activeSection: string = 'chon-camera';

  // Camera selection
  searchCameraText: string = '';
  cameras: Camera[] = [];
  isLoadingCameras: boolean = false;
  selectedCamera: Camera | null = null;

  // License Plate Recognition
  lprEnabled: boolean = true;
  dataRetentionDays: number = 7;
  alertSettings = {
    softwareAlert: true,
    smsAlert: false,
    emailAlert: false
  };

  // Vehicle Detection Zones
  detectionZones = {
    preview: true,
    directions: {
      forward: true,
      backward: true
    }
  };

  // Camera Preview Image
  cameraImageUrl: string = '';
  isLoadingCameraImage: boolean = false;
  imageLoadError: boolean = false;

  // Vehicle Types
  vehicleTypes: VehicleType[] = [
    { id: 'car', name: 'Ô tô', icon: '', enabled: true, color: '#3b82f6' },
    { id: 'truck', name: 'Máy kéo', icon: '', enabled: true, color: '#f97316' },
    { id: 'motorcycle', name: 'Mô tô 2 bánh', icon: '', enabled: true, color: '#06b6d4' },
  ];

  // Traffic Violations
  violationTypes: ViolationType[] = [
    { id: 'red-light', name: 'Vượt đèn đỏ', enabled: false },
    { id: 'wrong-lane', name: 'Đi sai làn đường', enabled: false },
    { id: 'speeding', name: 'Vượt tốc độ quy định', enabled: false },
    { id: 'slow-speed', name: 'Chạy chậm hơn tốc độ tối thiểu', enabled: false }
  ];

  speedLimits = {
    min: 23,
    max: 100
  };

  stopTimeLimits = {
    min: 23,
    max: 100
  };

  stopTimeUnit: number = 360; // seconds

  // Traffic Flow Counting
  trafficFlowEnabled: boolean = true;
  trafficFlowRetentionDays: number = 30;

  constructor(
    private cameraService: CameraService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCameras();
  }

  loadCameras(): void {
    this.isLoadingCameras = true;
    const params = {
      page: 1,
      size: 100
    };

    this.cameraService.getCameraList(params).subscribe({
      next: (response) => {
        if (response?.data?.records) {
          this.cameras = response.data.records.map((camera: any) => ({
            id: camera.id,
            name: camera.name,
            checked: false
          }));
        }
        this.isLoadingCameras = false;
      },
      error: (error) => {
        console.error('Error loading cameras:', error);
        this.snackBar.open('Lỗi khi tải danh sách camera', 'Đóng', { duration: 3000 });
        this.isLoadingCameras = false;
      }
    });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    
    // If navigating to license plate section and camera is selected, load image
    if (section === 'nhan-dien-bien-so' && this.selectedCamera) {
      this.loadCameraSnapshot();
    }
  }

  get filteredCameras(): Camera[] {
    if (!this.searchCameraText) {
      return this.cameras;
    }
    return this.cameras.filter(camera =>
      camera.name.toLowerCase().includes(this.searchCameraText.toLowerCase()) ||
      camera.id.toString().includes(this.searchCameraText)
    );
  }

  get selectedCamerasCount(): number {
    return this.cameras.filter(c => c.checked).length;
  }

  selectCamera(camera: Camera): void {
    // Uncheck all other cameras
    this.cameras.forEach(c => c.checked = false);
    // Check selected camera
    camera.checked = true;
    this.selectedCamera = camera;
    
    // Navigate to license plate recognition section
    this.activeSection = 'nhan-dien-bien-so';
    this.snackBar.open(`Đã chọn ${camera.name}`, 'Đóng', { duration: 2000 });
    
    // Load camera snapshot
    this.loadCameraSnapshot();
  }

  onCameraCheckChange(camera: Camera): void {
    if (camera.checked) {
      // If this camera is checked, uncheck all others and select this one
      this.cameras.forEach(c => {
        if (c.id !== camera.id) {
          c.checked = false;
        }
      });
      this.selectedCamera = camera;
      
      // Navigate to license plate recognition section
      this.activeSection = 'nhan-dien-bien-so';
      this.snackBar.open(`Đã chọn ${camera.name}`, 'Đóng', { duration: 2000 });
      
      // Load camera snapshot
      this.loadCameraSnapshot();
    } else {
      // If unchecked, clear selection
      this.selectedCamera = null;
    }
  }

  loadCameraSnapshot(): void {
    this.isLoadingCameraImage = true;
    this.imageLoadError = false;
    this.cameraImageUrl = '';

    // Simulate API call with 3-4 seconds timeout
    // In real implementation, replace with actual API call to get camera snapshot
    setTimeout(() => {
      // Simulate successful image load with a demo image
      this.cameraImageUrl = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=450&fit=crop';
      this.isLoadingCameraImage = false;
      
      // Alternative: Use local placeholder or actual camera endpoint
      // this.cameraImageUrl = `/api/camera/${this.selectedCamera?.id}/snapshot`;
    }, 3500); // 3.5 seconds delay to simulate loading
  }

  reloadCameraImage(): void {
    this.loadCameraSnapshot();
  }

  deselectCamera(): void {
    this.selectedCamera = null;
    this.cameras.forEach(c => c.checked = false);
    this.activeSection = 'chon-camera';
  }

  saveCameraSelection(): void {
    const selectedCameras = this.cameras.filter(c => c.checked);
    console.log('Saving camera selection:', selectedCameras);
    this.snackBar.open(`Đã chọn ${selectedCameras.length} camera`, 'Đóng', { duration: 2000 });
    // TODO: Implement API call when backend is ready
  }

  sendConfigToCamera(): void {
    const selectedCameras = this.cameras.filter(c => c.checked);
    if (selectedCameras.length === 0) {
      this.snackBar.open('Vui lòng chọn ít nhất một camera', 'Đóng', { duration: 3000 });
      return;
    }
    console.log('Sending config to cameras:', selectedCameras);
    this.snackBar.open(`Đang gửi cấu hình đến ${selectedCameras.length} camera...`, 'Đóng', { duration: 2000 });
    // TODO: Implement API call when backend is ready
  }

  cancelConfiguration(): void {
    // Reset to initial state or go back
    this.snackBar.open('Đã hủy thao tác', 'Đóng', { duration: 2000 });
  }

  saveConfiguration(): void {
    console.log('Saving configuration');
    this.snackBar.open('Đang lưu cấu hình...', 'Đóng', { duration: 2000 });
    // TODO: Implement API call when backend is ready
  }

  changeVehicleColor(vehicle: VehicleType, color: string): void {
    vehicle.color = color;
  }

  formatLabel(value: number): string {
    return `${value} Ngày`;
  }
}
