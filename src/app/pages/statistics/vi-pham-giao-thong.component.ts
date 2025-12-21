import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartConfiguration } from 'chart.js';
import { DateRangePickerComponent } from '../../shared/date-picker-ranger/date-range-picker.component';
import { TrafficFlowMapComponent } from './traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CameraService } from '../camera/camera.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vi-pham-giao-thong',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    DateRangePickerComponent,
    TrafficFlowMapComponent
  ],
  templateUrl: './vi-pham-giao-thong.component.html',
  styleUrls: ['./vi-pham-giao-thong.component.scss']
})
export class ViPhamGiaoThongComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private sidebarSubscription?: Subscription;
  isSidebarOpened = true;
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  showAreaDropdown = false;
  selectedTimeRange = 'today';
  selectedCamera = '';
  selectedArea = '';
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  
  // Options
  timeOptions = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: 'last7days' },
    { label: '30 ngày qua', value: 'last30days' },
    { label: 'Tùy chỉnh', value: 'custom' }
  ];
  
  cameraOptions: any[] = [
    { label: 'Tất cả Camera', value: '' }
  ];

  areaOptions: { label: string; value: string }[] = [
    { label: 'Tất cả khu vực', value: '' }
  ];
  
  // Loading states
  isLineChartLoading = false;
  isBarChartLoading = false;
  
  // Map data
  mapCenter = { lat: 14.0583, lng: 108.2772 }; // Vietnam center for country view
  mapZoom = 5; // Start with country overview
  cameraLocations: any[] = [];
  
  // Summary cards data - 4 metrics for violations
  summaryCards = [
    { title: 'Tổng số vi phạm', value: 8213, change: 0, isPositive: false, color: 'blue' },
    { title: 'Vi phạm phổ biến nhất', value: 0, change: 0, isPositive: false, subtitle: 'Vượt đèn đỏ', color: 'green' },
    { title: 'Giờ cao điểm vi phạm', value: 0, change: 0, isPositive: true, subtitle: '16-19h', color: 'purple' },
    { title: 'Camera ghi nhận nhiều vi phạm nhất', value: 3213, change: 0, isPositive: false, subtitle: 'Camera 04', color: 'blue' }
  ];
  
  // Chart filter state
  lineChartFilter: 'all' | 'speed' | 'light' | 'lane' | 'helmet' = 'all';

  // Donut Chart - Loại vi phạm
  public donutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverBackgroundColor: [],
      borderWidth: 0
    }]
  };
  
  public donutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const percentage = ((context.raw / context.chart._metasets[0].total) * 100).toFixed(0);
            return `${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      onComplete: function(animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        
        chart.data.datasets.forEach((dataset: any, i: number) => {
          const meta = chart.getDatasetMeta(i);
          const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
          
          meta.data.forEach((element: any, index: number) => {
            const value = dataset.data[index];
            const percentage = (value / total) * 100;
            
            // Only show number if percentage >= 10%
            if (percentage >= 10) {
              const centerPoint = element.getCenterPoint();
              ctx.save();
              ctx.font = 'bold 14px Arial';
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(value.toString(), centerPoint.x, centerPoint.y);
              ctx.restore();
            }
          });
        });
      }
    }
  };
  
  // Bar Chart Data (Violations by type)
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2.5,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sidebarService: SidebarService,
    private cameraService: CameraService
  ) {}

  ngOnInit(): void {
    this.loadCameraOptions();
    this.loadAreaOptions();
    this.loadCameraLocations();
    this.loadViolationData();
    
    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarService.sidebarOpened$.subscribe(
      (isOpened: boolean) => {
        this.isSidebarOpened = isOpened;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
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
  
  private loadAreaOptions(): void {
    console.log('Loading area options from API...');
    this.http.get<any>('/api/admin/camera/list').subscribe({
      next: (response) => {
        const cameras = response.data || response || [];
        const locationSet = new Set<string>();
        cameras.forEach((camera: any) => {
          if (camera.location && camera.location.trim()) {
            locationSet.add(camera.location.trim());
          }
        });
        
        const dynamicAreaOptions = Array.from(locationSet)
          .sort()
          .map(location => ({
            label: location,
            value: location.toLowerCase().replace(/\\s+/g, '-')
          }));
        
        this.areaOptions = [
          { label: 'Tất cả khu vực', value: '' },
          ...dynamicAreaOptions
        ];
      },
      error: (error) => {
        console.error('Error loading area options:', error);
      }
    });
  }
  
  // Filter methods
  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.showCameraDropdown = false;
    this.showAreaDropdown = false;
  }
  
  toggleCameraDropdown(): void {
    this.showCameraDropdown = !this.showCameraDropdown;
    this.showTimeDropdown = false;
    this.showAreaDropdown = false;
  }
  
  toggleAreaDropdown(): void {
    this.showAreaDropdown = !this.showAreaDropdown;
    this.showTimeDropdown = false;
    this.showCameraDropdown = false;
  }
  
  selectTimeRange(value: string): void {
    this.selectedTimeRange = value;
    this.showTimeDropdown = false;
    
    if (value !== 'custom') {
      this.customDateRange = { start: null, end: null };
      this.loadViolationData();
    }
  }
  
  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.loadViolationData();
  }
  
  selectArea(value: string): void {
    this.selectedArea = value;
    this.showAreaDropdown = false;
    this.loadViolationData();
  }
  
  onSearch(): void {
    this.loadViolationData();
  }
  
  onDateRangeSelected(range: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: range.startDate, end: range.endDate };
    this.loadViolationData();
  }
  
  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.selectedTimeRange = 'today';
    this.loadViolationData();
  }
  
  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = 'today';
    this.selectedCamera = '';
    this.selectedArea = '';
    this.customDateRange = { start: null, end: null };
    this.loadViolationData();
  }
  
  get hasActiveFilters(): boolean {
    return this.searchText !== '' || this.selectedCamera !== '' || this.selectedArea !== '' || this.selectedTimeRange !== 'today';
  }
  
  getTimeRangeLabel(): string {
    if (!this.selectedTimeRange || this.selectedTimeRange === 'today') {
      return 'Hôm nay';
    }
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option ? option.label : 'Chọn thời gian';
  }
  
  getCameraLabel(): string {
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option ? option.label : 'Tất cả Camera';
  }
  
  getAreaLabel(): string {
    const option = this.areaOptions.find(opt => opt.value === this.selectedArea);
    return option ? option.label : 'Tất cả khu vực';
  }
  
  exportReport(): void {
    console.log('Exporting report...');
  }

  private loadCameraLocations(): void {
    this.http.get('/api/admin/camera/camera-with-location').subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.cameraLocations = response.data.cameras || [];
          
          // Map locations to areaOptions
          const locations = response.data.locations || [];
          this.areaOptions = [
            { label: 'Tất cả khu vực', value: '' },
            ...locations.map((location: string) => ({
              label: location,
              value: location
            }))
          ];
          
          console.log('Camera locations loaded:', this.cameraLocations);
          console.log('Area options updated:', this.areaOptions);
        }
      },
      error: (error) => {
        console.error('Error loading camera locations:', error);
      }
    });
  }

  private loadViolationData(): void {
    // Show loading indicators
    this.isLineChartLoading = true;
    this.isBarChartLoading = true;

    // Calculate date range
    const { fromUtc, toUtc } = this.getDateRange();
    
    // Prepare params for API
    const params: any = {
      fromUtc: fromUtc,
      toUtc: toUtc
    };
    
    if (this.selectedCamera) {
      params.cameraSn = this.selectedCamera;
    }

    if (this.selectedArea) {
      params.area = this.selectedArea;
      console.log('Adding area filter:', this.selectedArea);
    }

    console.log('Loading violation data with params:', params);

    // Call API
    this.http.get('/api/admin/events/traffic-violation/stats', { params }).subscribe({
      next: (response: any) => {
        console.log('Violation data response:', response);
        if (response && response.success && response.data) {
          this.updateChartsWithApiData(response.data);
        } else {
          console.warn('No violation data available');
        }
        this.isLineChartLoading = false;
        this.isBarChartLoading = false;
      },
      error: (error) => {
        console.error('Error loading violation data:', error);
        this.isLineChartLoading = false;
        this.isBarChartLoading = false;
      }
    });
  }

  private getDateRange(): { fromUtc: string; toUtc: string } {
    let fromDate: Date;
    let toDate: Date;
    
    // Priority: custom date picker first, then selected time range
    if (this.customDateRange.start && this.customDateRange.end) {
      fromDate = new Date(this.customDateRange.start);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(this.customDateRange.end);
      toDate.setHours(23, 59, 59, 999);
    } else if (this.selectedTimeRange && this.selectedTimeRange !== 'custom') {
      const now = new Date();
      switch (this.selectedTimeRange) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'yesterday':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
          break;
        case 'last7days':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'last30days':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        default:
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    
    // Format to UTC string
    const formatToUTC = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    };
    
    return {
      fromUtc: formatToUTC(fromDate),
      toUtc: formatToUTC(toDate)
    };
  }

  private updateChartsWithApiData(data: any): void {
    console.log('Updating charts with API data:', data);

    // Update summary cards
    this.summaryCards[0].value = data.totalViolations || 0;
    
    // Most common violation type
    if (data.mostCommonViolationType) {
      this.summaryCards[1].subtitle = data.mostCommonViolationType;
      this.summaryCards[1].value = data.mostCommonViolationCount || 0;
    }

    // Peak day/time
    if (data.peakDay !== undefined) {
      this.summaryCards[2].subtitle = `Ngày ${data.peakDay}`;
      this.summaryCards[2].value = data.peakDayCount || 0;
    }

    // Most active camera
    if (data.mostActiveCamera) {
      this.summaryCards[3].subtitle = data.mostActiveCamera;
      this.summaryCards[3].value = data.mostActiveCameraCount?.count || 0;
    }

    // Update donut chart - violation types from eventTypeTotals
    if (data.eventTypeTotals) {
      const labels: string[] = [];
      const values: number[] = [];
      const colors = ['#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#3B82F6'];
      
      Object.entries(data.eventTypeTotals).forEach(([type, count]: [string, any]) => {
        labels.push(type);
        values.push(count);
      });

      this.donutChartData = {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          hoverBackgroundColor: colors.slice(0, labels.length),
          borderWidth: 0
        }]
      };
    }

    // Update bar chart - violations by day from dailyBreakdown
    if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
      const days = data.dailyBreakdown.map((item: any) => item.day.toString());
      
      // Collect all event types across all days
      const eventTypesSet = new Set<string>();
      data.dailyBreakdown.forEach((dayData: any) => {
        Object.values(dayData.violationsByLocation || {}).forEach((locationData: any) => {
          Object.keys(locationData.eventTypes || {}).forEach(type => eventTypesSet.add(type));
        });
      });

      const eventTypes = Array.from(eventTypesSet);
      const typeColors: { [key: string]: string } = {
        'Unknown': '#EF4444',
        'Vượt đèn đỏ': '#EF4444',
        'Đi sai làn': '#8B5CF6',
        'Không đội mũ bảo hiểm': '#10B981',
        'Dùng điện thoại khi lái': '#F59E0B',
        'Vi phạm khác': '#06B6D4'
      };

      const datasets: any[] = [];
      eventTypes.forEach((eventType, index) => {
        const eventTypeData = data.dailyBreakdown.map((dayData: any) => {
          let total = 0;
          Object.values(dayData.violationsByLocation || {}).forEach((locationData: any) => {
            total += locationData.eventTypes?.[eventType] || 0;
          });
          return total;
        });

        datasets.push({
          label: eventType,
          data: eventTypeData,
          backgroundColor: typeColors[eventType] || `#${Math.floor(Math.random()*16777215).toString(16)}`,
          borderWidth: 0,
          borderRadius: 2
        });
      });

      this.barChartData = {
        labels: days,
        datasets: datasets
      };
    }

    // Update camera locations with violation data from locations array
    const locations = data.locations || [];
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      console.log('🗺️ [ViPhamGiaoThong] Processing locations data - FOUND:', locations.length, 'locations');
      
      // Flatten all cameraInfo from all locations
      const allCameras: any[] = [];
      locations.forEach((location: any) => {
        if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
          location.cameraInfo.forEach((camera: any) => {
            allCameras.push({
              ...camera,
              locationName: location.location // Add location name from parent
            });
          });
        }
      });
      
      console.log('🗺️ [ViPhamGiaoThong] Total cameras from all locations:', allCameras.length);
      
      // Group cameras by location name
      const locationGroups: { [key: string]: any[] } = {};
      
      allCameras.forEach((camera: any) => {
        const lat = typeof camera.latitude === 'number' ? camera.latitude : parseFloat(camera.latitude);
        const lng = typeof camera.longitude === 'number' ? camera.longitude : parseFloat(camera.longitude);
        
        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.warn('🗺️ Skipping camera with invalid coordinates:', camera);
          return;
        }
        
        // Use location name from API response
        const locationName = camera.locationName || `Camera ${camera.cameraSn}`;
        
        if (!locationGroups[locationName]) {
          locationGroups[locationName] = [];
        }
        
        locationGroups[locationName].push({
          cameraSn: camera.cameraSn,
          lat: lat,
          lng: lng,
          total: camera.total || 0
        });
      });
      
      // Convert groups to map locations format
      this.cameraLocations = Object.entries(locationGroups).map(([locationName, cameras]) => {
        const avgLat = cameras.reduce((sum, cam) => sum + cam.lat, 0) / cameras.length;
        const avgLng = cameras.reduce((sum, cam) => sum + cam.lng, 0) / cameras.length;
        const totalCount = cameras.reduce((sum, cam) => sum + cam.total, 0);
        
        return {
          lat: avgLat,
          lng: avgLng,
          name: locationName,
          count: totalCount,
          cameraCode: locationName,
          cameras: cameras.map(c => c.cameraSn),
          individualCameras: cameras
        };
      });
      
      console.log('🗺️ [ViPhamGiaoThong] Final camera locations for map:', this.cameraLocations.length, 'locations');
    } else if (data.totalCameraEvents) {
      // Fallback: use old totalCameraEvents format
      this.cameraLocations = Object.entries(data.totalCameraEvents).map(([cameraSn, cameraData]: [string, any]) => ({
        lat: parseFloat(cameraData.latitude),
        lng: parseFloat(cameraData.longitude),
        name: cameraData.location || cameraSn,
        count: cameraData.count || 0,
        cameraCode: cameraSn,
        totalIn: 0,
        totalOut: 0
      }));
      console.log('Updated camera locations:', this.cameraLocations);
    }

    this.cdr.detectChanges();
  }

  // Chart filter methods
  setLineChartFilter(filter: 'all' | 'speed' | 'light' | 'lane' | 'helmet'): void {
    this.lineChartFilter = filter;
    // Filter logic can be implemented if needed
  }

  getDonutColor(index: number): string {
    const colors = ['#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4'];
    return colors[index] || '#6B7280';
  }
}