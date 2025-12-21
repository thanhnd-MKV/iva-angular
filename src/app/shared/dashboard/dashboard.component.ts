import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateRangePickerComponent } from '../date-picker-ranger/date-range-picker.component';
import { TrafficFlowMapComponent } from '../../pages/statistics/traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from './dashboad.service';
import { CameraService } from '../../pages/camera/camera.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DateRangePickerComponent,
    TrafficFlowMapComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponentShare implements OnInit, OnDestroy {
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  selectedTimeRange = '';
  selectedCamera = '';
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  
  // Filter options
  timeOptions = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: '7days' },
    { label: '30 ngày qua', value: '30days' },
    { label: 'Tùy chỉnh', value: 'custom' }
  ];
  
  cameraOptions: { label: string; value: string }[] = [
    { label: 'Tất cả Camera', value: '' }
  ];
  
  // Map data
  cameraLocations: any[] = [];
  
  // Summary cards data
  summaryCards = [
    { title: 'Tổng vi phạm', value: 0, change: 0, isPositive: true, color: 'blue' },
    { title: 'Đã xử lý', value: 0, change: 0, isPositive: true, color: 'green' },
    { title: 'Chờ xử lý', value: 0, change: 0, isPositive: false, color: 'purple' }
  ];
  
  constructor(
    private http: HttpClient,
    private dashboardService: DashboardService,
    private cameraService: CameraService
  ) {}
  
  ngOnInit(): void {
    this.loadCameraOptions();
    this.loadSummaryData();
    this.loadCameraLocations();
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }
  
  // Filter methods
  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.showCameraDropdown = false;
  }
  
  toggleCameraDropdown(): void {
    this.showCameraDropdown = !this.showCameraDropdown;
    this.showTimeDropdown = false;
  }
  
  selectTimeRange(value: string): void {
    this.selectedTimeRange = value;
    this.showTimeDropdown = false;
    
    if (value !== 'custom') {
      this.customDateRange = { start: null, end: null };
      this.applyFilters();
    }
  }
  
  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.applyFilters();
  }
  
  onDateRangeSelected(range: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: range.startDate, end: range.endDate };
    this.applyFilters();
  }
  
  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.selectedTimeRange = 'today';
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = '';
    this.selectedCamera = '';
    this.customDateRange = { start: null, end: null };
    this.applyFilters();
  }
  
  onSearch(): void {
    this.applyFilters();
  }
  
  hasActiveFilters(): boolean {
    return this.selectedTimeRange !== '' || this.selectedCamera !== '' || this.searchText !== '';
  }
  
  getTimeRangeLabel(): string {
    if (this.selectedTimeRange === 'custom' && this.customDateRange.start && this.customDateRange.end) {
      return `${this.formatDate(this.customDateRange.start)} - ${this.formatDate(this.customDateRange.end)}`;
    }
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option?.label || 'Chọn thời gian';
  }
  
  getCameraLabel(): string {
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option?.label || 'Tất cả Camera';
  }
  
  private formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  private getDateRange(): { fromUtc: string; toUtc: string } {
    const now = new Date();
    let fromDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
    let toDate = new Date();
    
    if (this.selectedTimeRange === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (this.selectedTimeRange === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      fromDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      toDate = yesterday;
    } else if (this.selectedTimeRange === '7days') {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (this.selectedTimeRange === '30days') {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 30);
    } else if (this.selectedTimeRange === 'custom' && this.customDateRange.start && this.customDateRange.end) {
      fromDate = this.customDateRange.start;
      toDate = this.customDateRange.end;
    }
    
    return {
      fromUtc: fromDate.toISOString(),
      toUtc: toDate.toISOString()
    };
  }
  
  private applyFilters(): void {
    this.loadSummaryData();
    this.loadCameraLocations();
  }
  
  private loadCameraOptions(): void {
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        this.cameraOptions = [
          { label: 'Tất cả Camera', value: '' },
          ...cameras
        ];
      },
      error: (error) => {
        console.error('Error loading camera options:', error);
      }
    });
  }
  
  private loadSummaryData(): void {
    this.dashboardService.getSumViolationStats({}).subscribe({
      next: (response) => {
        if (response && response.data) {
          const data = response.data;
          const total = data.eventTotal || ((data.processed || 0) + (data.unprocessed || 0));
          
          this.summaryCards = [
            { title: 'Tổng vi phạm', value: total, change: 0, isPositive: true, color: 'blue' },
            { title: 'Đã xử lý', value: data.processed || 0, change: 0, isPositive: true, color: 'green' },
            { title: 'Chờ xử lý', value: data.unprocessed || 0, change: 0, isPositive: false, color: 'purple' }
          ];
        }
      },
      error: (error) => {
        console.error('Error loading summary data:', error);
      }
    });
  }
  
  private loadCameraLocations(): void {
    const { fromUtc, toUtc } = this.getDateRange();
    
    const params: any = { fromUtc, toUtc };
    if (this.selectedCamera) params.cameraSn = this.selectedCamera;
    
    this.http.get<any>('/api/admin/events/by-camera', { params }).subscribe({
      next: (response) => {
        if (response && response.data) {
          const cameras = response.data;
          
          // Update camera locations for map
          this.cameraLocations = cameras.map((c: any) => ({
            name: c.cameraName || c.cameraSn,
            lat: c.latitude || 0,
            lng: c.longitude || 0,
            inCount: c.inCount || 0,
            outCount: c.outCount || 0,
            total: c.count || 0
          })).filter((c: any) => c.lat !== 0 && c.lng !== 0);
        }
      },
      error: (error) => {
        console.error('Error loading camera locations:', error);
      }
    });
  }
  
  exportReport(): void {
    console.log('Exporting report...');
    // Implement export functionality
  }
}
