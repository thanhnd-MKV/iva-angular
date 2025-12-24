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
  
  // Mock data toggle - set to true to use mock data
  useMockData = false;
  
  // Violation type mappings - English to Vietnamese
  private readonly violationTypeMap: { [key: string]: string } = {
    'Red_Light': 'Vượt đèn đỏ',
    'Wrong_Lane': 'Đi sai làn',
    'Wrong_Way_Driving': 'Đi sai làn',
    'No_Helmet': 'Không đội mũ bảo hiểm',
    'Phone_Use': 'Dùng điện thoại khi lái',
    'Unknown': 'Vi phạm khác',
    'Other': 'Vi phạm khác'
  };
  
  // Violation type colors - consistent across all charts
  private readonly violationTypeColors: { [key: string]: string } = {
    'Red_Light': '#EF4444',
    'Vượt đèn đỏ': '#EF4444',
    'Wrong_Lane': '#8B5CF6',
    'Wrong_Way_Driving': '#8B5CF6',
    'Đi sai làn': '#8B5CF6',
    'No_Helmet': '#10B981',
    'Không đội mũ bảo hiểm': '#10B981',
    'Phone_Use': '#F59E0B',
    'Dùng điện thoại khi lái': '#F59E0B',
    'Unknown': '#06B6D4',
    'Other': '#06B6D4',
    'Vi phạm khác': '#06B6D4'
  };
  
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
  
  // Total violations for donut chart center display
  totalViolationsForDonut = 0;
  
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
          // 🔍 DEBUG: Log complete response structure
          console.log('🔍 [VI PHAM] API Response:', JSON.stringify(response.data, null, 2));
          console.log('🔍 [VI PHAM] Cameras array:', response.data.cameras);
          console.log('🔍 [VI PHAM] Locations array:', response.data.locations);
          
          // 🔍 DEBUG: Log first camera object structure
          if (response.data.cameras && response.data.cameras.length > 0) {
            console.log('🔍 [VI PHAM] First camera object:', JSON.stringify(response.data.cameras[0], null, 2));
          }
          
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

    // Use mock data if enabled
    if (this.useMockData) {
      console.log('🎭 Using MOCK DATA for testing');
      setTimeout(() => {
        this.updateChartsWithApiData(this.getMockData());
        this.isLineChartLoading = false;
        this.isBarChartLoading = false;
      }, 500);
      return;
    }

    // Calculate date range
    const { fromUtc, toUtc } = this.getDateRange();
    
    // Prepare params for API
    const params: any = {
      eventCategory: 'TRAFFIC',
      fromUtc: fromUtc,
      toUtc: toUtc
    };
    
    if (this.selectedCamera) {
      params.cameraSn = this.selectedCamera;
    }

    if (this.selectedArea) {
      params.location = this.selectedArea;
      console.log('Adding location filter:', this.selectedArea);
    }

    console.log('Loading violation data with params:', params);

    // Call both APIs and merge data
    const statisticsCall = this.http.get('/api/admin/events/traffic-violation/statistics', { params });
    const statsCall = this.http.get('/api/admin/events/traffic-violation/stats', { params });

    // Call statistics API for chart and summary data
    statisticsCall.subscribe({
      next: (response: any) => {
        console.log('📊 Statistics API response:', response);
        if (response && response.success && response.data) {
          this.updateChartsWithApiData(response.data);
        } else {
          console.warn('No statistics data available');
        }
        this.isLineChartLoading = false;
        this.isBarChartLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLineChartLoading = false;
        this.isBarChartLoading = false;
      }
    });

    // Call stats API for GPS/map data
    statsCall.subscribe({
      next: (response: any) => {
        console.log('🗺️ Stats API response:', response);
        if (response && response.success && response.data) {
          this.updateMapWithGpsData(response.data);
        } else {
          console.warn('⚠️ No GPS data available in response - clearing map');
          // Clear map when API returns no data - create NEW array reference
          this.cameraLocations = [...[]]; // New empty array
          this.mapCenter = { lat: 14.0583, lng: 108.2772 };
          this.mapZoom = 5;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading GPS stats:', error);
        // Clear map on error - create NEW array reference
        this.cameraLocations = [...[]]; // New empty array
        this.cdr.detectChanges();
      }
    });
  }

  private updateMapWithGpsData(data: any): void {
    console.log('🗺️ Processing GPS data for map:', data);
    
    const locations = data?.locations || [];
    
    console.log('🗺️ Locations array:', locations, 'Length:', locations.length);
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      console.log('🗺️ Found', locations.length, 'location groups from API');
      
      // Flatten all cameraInfo from all locations
      const allCameras: any[] = [];
      locations.forEach((location: any) => {
        console.log('🗺️ Processing location:', location.location, 'with', location.cameraInfo?.length || 0, 'cameras');
        if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
          location.cameraInfo.forEach((camera: any) => {
            const lat = typeof camera.latitude === 'number' ? camera.latitude : parseFloat(camera.latitude);
            const lng = typeof camera.longitude === 'number' ? camera.longitude : parseFloat(camera.longitude);
            
            console.log('🗺️  - Camera:', camera.cameraSn, 'lat:', lat, 'lng:', lng, 'total:', camera.total);
            
            allCameras.push({
              ...camera,
              locationName: location.location,
              lat: lat,
              lng: lng
            });
          });
        }
      });
      
      console.log('🗺️ Total cameras after flattening:', allCameras.length);
      
      // Don't re-group by location name - use individual cameras or keep API's grouping
      // Build map markers directly from cameras
      const validCameras: any[] = [];
      
      allCameras.forEach((camera: any) => {
        // Skip invalid coordinates
        if (isNaN(camera.lat) || isNaN(camera.lng) || camera.lat === 0 || camera.lng === 0) {
          console.warn('🗺️ Skipping camera with invalid coordinates:', camera.cameraSn);
          return;
        }
        
        validCameras.push({
          cameraSn: camera.cameraSn,
          lat: camera.lat,
          lng: camera.lng,
          total: camera.total || 0,
          locationName: camera.locationName
        });
      });
      
      console.log('🗺️ Valid cameras for mapping:', validCameras.length);
      
      // Group cameras by exact coordinates to cluster markers at same position
      const coordGroups: { [key: string]: any[] } = {};
      
      validCameras.forEach((camera: any) => {
        // Create key with 6 decimal precision (approx 10cm accuracy)
        const coordKey = `${camera.lat.toFixed(6)},${camera.lng.toFixed(6)}`;
        
        if (!coordGroups[coordKey]) {
          coordGroups[coordKey] = [];
        }
        
        coordGroups[coordKey].push(camera);
      });
      
      console.log('🗺️ Coordinate groups (clustered by position):', Object.keys(coordGroups).length);
      
      // Convert groups to map locations format
      const newMarkers = Object.entries(coordGroups).map(([coordKey, cameras]) => {
        const totalCount = cameras.reduce((sum, cam) => sum + cam.total, 0);
        const locationNames = [...new Set(cameras.map(c => c.locationName))].join(', ');
        
        // Use first camera's coordinates (all should be the same in this group)
        const mainCamera = cameras[0];
        
        console.log('🗺️ Marker at', coordKey, ':', cameras.length, 'cameras, total:', totalCount, 'locations:', locationNames);
        
        return {
          lat: mainCamera.lat,
          lng: mainCamera.lng,
          name: locationNames,
          count: totalCount,
          cameraCode: cameras.length === 1 ? mainCamera.cameraSn : `${cameras.length} cameras`,
          cameras: cameras.map(c => c.cameraSn),
          individualCameras: cameras
        };
      });
      
      // Create new array reference to trigger Angular change detection
      this.cameraLocations = [...newMarkers];
      
      console.log('🗺️ Final camera locations (markers):', this.cameraLocations.length);
      console.log('🗺️ Markers:', this.cameraLocations.map(loc => ({ lat: loc.lat, lng: loc.lng, count: loc.count })));
      
      // Force change detection to update map
      this.cdr.detectChanges();
      
      // Auto-adjust map center and zoom based on locations
      if (this.cameraLocations.length > 0) {
        // Calculate bounds from all camera locations
        const lats = this.cameraLocations.map(loc => loc.lat);
        const lngs = this.cameraLocations.map(loc => loc.lng);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Calculate center from bounds (more accurate than simple average)
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        this.mapCenter = { lat: centerLat, lng: centerLng };
        
        // Calculate spread
        const latSpread = maxLat - minLat;
        const lngSpread = maxLng - minLng;
        const maxSpread = Math.max(latSpread, lngSpread);
        
        console.log('🗺️ Bounds - Lat: [', minLat.toFixed(6), ',', maxLat.toFixed(6), '] Lng: [', minLng.toFixed(6), ',', maxLng.toFixed(6), ']');
        console.log('🗺️ Spread - Lat:', latSpread.toFixed(6), 'Lng:', lngSpread.toFixed(6), 'Max:', maxSpread.toFixed(6));
        
        // Determine zoom level with better thresholds and add padding factor
        let calculatedZoom: number;
        
        if (this.cameraLocations.length === 1) {
          calculatedZoom = 15;
        } else if (maxSpread === 0) {
          calculatedZoom = 15;
        } else if (maxSpread >= 10) {
          calculatedZoom = 5;
        } else if (maxSpread >= 5) {
          calculatedZoom = 6;
        } else if (maxSpread >= 1) {
          calculatedZoom = 8;
        } else if (maxSpread >= 0.5) {
          calculatedZoom = 9;
        } else if (maxSpread >= 0.2) {
          calculatedZoom = 10;
        } else if (maxSpread >= 0.1) {
          calculatedZoom = 11;
        } else if (maxSpread >= 0.05) {
          calculatedZoom = 12;
        } else if (maxSpread >= 0.02) {
          calculatedZoom = 13;
        } else if (maxSpread >= 0.01) {
          calculatedZoom = 14;
        } else if (maxSpread >= 0.005) {
          calculatedZoom = 15;
        } else if (maxSpread >= 0.001) {
          calculatedZoom = 16;
        } else {
          calculatedZoom = 17;
        }
        
        // Apply zoom with slight zoom out for better visibility
        this.mapZoom = this.cameraLocations.length > 1 ? Math.max(calculatedZoom - 1, 5) : calculatedZoom;
        
        console.log('🗺️ Map center:', this.mapCenter, 'Calculated Zoom:', calculatedZoom, 'Final Zoom:', this.mapZoom, 'Locations:', this.cameraLocations.length);
        
        // Only trigger change detection once after all updates
        this.cdr.detectChanges();
      }
    } else {
      // ALWAYS reset map when no GPS data available
      console.log('⚠️ No GPS data available - clearing map markers');
      console.log('⚠️ Previous markers count:', this.cameraLocations.length);
      
      // Create NEW array reference to trigger change detection
      this.cameraLocations = [...[]];
      
      // Reset to default Vietnam overview
      this.mapCenter = { lat: 14.0583, lng: 108.2772 };
      this.mapZoom = 5;
      
      console.log('⚠️ Map cleared - new markers count:', this.cameraLocations.length);
      
      // Force change detection
      this.cdr.detectChanges();
    }
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
    console.log('📊 Updating charts with statistics data:', data);
    console.log('📊 Total violations:', data.totalViolations);
    console.log('📊 Event type totals:', data.eventTypeTotals);
    console.log('📊 Daily breakdown:', data.dailyBreakdown);

    // Reset summary cards if no data
    if (!data || data.totalViolations === 0 || !data.totalViolations) {
      console.log('⚠️ No violation data - resetting summary cards');
      this.summaryCards[0].value = 0;
      this.summaryCards[1].value = 0;
      this.summaryCards[1].subtitle = 'N/A';
      this.summaryCards[2].value = 0;
      this.summaryCards[2].subtitle = 'N/A';
      this.summaryCards[3].value = 0;
      this.summaryCards[3].subtitle = 'N/A';
    } else {
      // Update summary cards with correct data
      this.summaryCards[0].value = data.totalViolations || 0;
      console.log('✅ Card 1 - Total violations:', this.summaryCards[0].value);
      
      // Most common violation type - map to Vietnamese
      if (data.mostCommonViolationType) {
        const vietnameseName = this.violationTypeMap[data.mostCommonViolationType] || data.mostCommonViolationType;
        this.summaryCards[1].subtitle = vietnameseName;
        this.summaryCards[1].value = data.mostCommonViolationCount || 0;
        console.log('✅ Card 2 - Most common:', vietnameseName, '=', this.summaryCards[1].value);
      } else {
        this.summaryCards[1].value = 0;
        this.summaryCards[1].subtitle = 'N/A';
      }

      // Peak day
      if (data.peakDay !== undefined) {
        this.summaryCards[2].subtitle = `Ngày ${data.peakDay}`;
        this.summaryCards[2].value = data.peakDayCount || 0;
        console.log('✅ Card 3 - Peak day:', this.summaryCards[2].subtitle, '=', this.summaryCards[2].value);
      } else {
        this.summaryCards[2].value = 0;
        this.summaryCards[2].subtitle = 'N/A';
      }

      // Most active camera
      if (data.mostActiveCamera) {
        this.summaryCards[3].subtitle = data.mostActiveCamera;
        this.summaryCards[3].value = data.mostActiveCameraCount?.count || 0;
        console.log('✅ Card 4 - Most active camera:', this.summaryCards[3].subtitle, '=', this.summaryCards[3].value);
      } else {
        this.summaryCards[3].value = 0;
        this.summaryCards[3].subtitle = 'N/A';
      }
    }

    // Update donut chart - violation types from eventTypeTotals
    if (data.eventTypeTotals && Object.keys(data.eventTypeTotals).length > 0) {
      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = [];
      
      Object.entries(data.eventTypeTotals).forEach(([type, count]: [string, any]) => {
        // Map English type to Vietnamese
        const vietnameseName = this.violationTypeMap[type] || type;
        const color = this.violationTypeColors[type] || this.violationTypeColors[vietnameseName] || '#6B7280';
        
        labels.push(vietnameseName);
        values.push(count);
        colors.push(color);
      });

      console.log('📊 Donut chart - Event types (Vietnamese):', labels);
      console.log('📊 Donut chart - Values:', values);
      console.log('📊 Donut chart - Colors:', colors);
      console.log('📊 Donut chart - Total:', values.reduce((a, b) => a + b, 0));

      // Calculate total for donut center display
      this.totalViolationsForDonut = values.reduce((a, b) => a + b, 0);

      this.donutChartData = {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0
        }]
      };
    } else {
      // Reset donut chart when no data
      console.log('⚠️ No event type data - resetting donut chart');
      this.totalViolationsForDonut = 0;
      this.donutChartData = {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          hoverBackgroundColor: [],
          borderWidth: 0
        }]
      };
    }

    // Update bar chart - violations by location from locationByEventType
    if (data.locationByEventType && data.locationByEventType.length > 0) {
      console.log('📊 Processing locationByEventType:', data.locationByEventType);
      
      // Get all locations
      const locations = data.locationByEventType.map((item: any) => item.location);
      
      // Collect all event types across all locations
      const eventTypesSet = new Set<string>();
      data.locationByEventType.forEach((locationData: any) => {
        Object.keys(locationData.eventTypes || {}).forEach(type => eventTypesSet.add(type));
      });

      const eventTypes = Array.from(eventTypesSet);
      console.log('📊 Event types found:', eventTypes);
      console.log('📊 Locations found:', locations);

      const datasets: any[] = [];
      eventTypes.forEach((eventType) => {
        // Map English type to Vietnamese
        const vietnameseName = this.violationTypeMap[eventType] || eventType;
        const color = this.violationTypeColors[eventType] || this.violationTypeColors[vietnameseName] || '#6B7280';
        
        // Get data for each location
        const eventTypeData = data.locationByEventType.map((locationData: any) => {
          return locationData.eventTypes?.[eventType] || 0;
        });

        console.log(`📊 Bar chart - ${eventType} (${vietnameseName}):`, eventTypeData, 'Total:', eventTypeData.reduce((a: number, b: number) => a + b, 0), 'Color:', color);

        datasets.push({
          label: vietnameseName,
          data: eventTypeData,
          backgroundColor: color,
          borderWidth: 0,
          borderRadius: 2
        });
      });

      this.barChartData = {
        labels: locations,
        datasets: datasets
      };
      
      console.log('📊 Bar chart updated with', datasets.length, 'event types and', locations.length, 'locations');
    } else {
      // Reset bar chart when no data
      console.log('⚠️ No location data - resetting bar chart');
      this.barChartData = {
        labels: [],
        datasets: []
      };
    }

    console.log('📊 Charts update completed');
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

  /**
   * Get legend color for donut chart from the dataset
   */
  getDonutLegendColor(index: number): string {
    if (!this.donutChartData?.datasets?.[0]?.backgroundColor) {
      return '#6B7280';
    }
    
    const bgColors = this.donutChartData.datasets[0].backgroundColor;
    
    // Check if it's an array
    if (Array.isArray(bgColors)) {
      return (bgColors[index] as string) || '#6B7280';
    }
    
    // If it's a single color string
    if (typeof bgColors === 'string') {
      return bgColors;
    }
    
    return '#6B7280';
  }

  /**
   * Get mock data for testing
   */
  private getMockData(): any {
    return {
      "dailyBreakdown": [
        {
          "day": 17,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 650
              },
              "total": 650
            }
          },
          "total": 650
        },
        {
          "day": 18,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 562
              },
              "total": 562
            }
          },
          "total": 562
        },
        {
          "day": 19,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 576
              },
              "total": 576
            }
          },
          "total": 576
        },
        {
          "day": 20,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 298
              },
              "total": 298
            }
          },
          "total": 298
        },
        {
          "day": 21,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 172
              },
              "total": 172
            }
          },
          "total": 172
        },
        {
          "day": 22,
          "violationsByLocation": {
            "Duy Tân": {
              "eventTypes": {
                "Red_Light": 165
              },
              "total": 165
            }
          },
          "total": 165
        }
      ],
      "totalViolations": 2565,
      "locationTotals": {
        "Duy Tân": 2565
      },
      "eventTypeTotals": {
        "Red_Light": 2565
      },
      "totalCameraEvents": {
        "ACVN248240000025": {
          "latitude": "21.030194980619505",
          "count": 100,
          "location": "Duy Tân",
          "longitude": "105.8829361674611"
        },
        "BMT23032021": {
          "latitude": "21.030194980619505",
          "count": 2423,
          "location": "Duy Tân",
          "longitude": "105.78293616746109"
        },
        "ACVN248240000028": {
          "latitude": "21.030194980619505",
          "count": 42,
          "location": "Duy Tân",
          "longitude": "105.78293616746109"
        }
      },
      "locationByEventType": [
        {
          "location": "Duy Tân",
          "eventTypes": {
            "Red_Light": 2565
          },
          "total": 2565,
          "topEventType": "Red_Light",
          "topEventTypeCount": 2565
        }
      ],
      "mostActiveCamera": "BMT23032021",
      "mostActiveCameraCount": {
        "latitude": "21.030194980619505",
        "count": 2423,
        "location": "Duy Tân",
        "longitude": "105.78293616746109"
      },
      "mostViolatedLocation": "Duy Tân",
      "mostViolatedLocationCount": 2565,
      "mostCommonViolationType": "Red_Light",
      "mostCommonViolationCount": 2565,
      "peakDay": 17,
      "peakDayCount": 650,
      "peakLocationEventTypeCombination": "Duy Tân - Red_Light",
      "peakLocationEventTypeCount": 2565
    };
  }
}