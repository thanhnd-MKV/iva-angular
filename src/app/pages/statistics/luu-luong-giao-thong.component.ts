import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DateRangePickerComponent } from '../../shared/date-picker-ranger/date-range-picker.component';
import { TrafficFlowMapComponent } from './traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CameraService } from '../camera/camera.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-luu-luong-giao-thong',
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
  templateUrl: './luu-luong-giao-thong.component.html',
  styleUrls: ['./luu-luong-giao-thong.component.scss']
})
export class LuuLuongGiaoThongComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private sidebarSubscription?: Subscription;
  isSidebarOpened = true;
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  showAreaDropdown = false;
  selectedTimeRange = 'today'; // Default to today
  selectedCamera = '';
  selectedArea = '';
  
  // Chart filter state
  lineChartFilter: 'all' | 'car' | 'motorbike' | 'truck' = 'all';
  barChartFilter: 'all' | 'car' | 'motorbike' | 'truck' | 'bus' = 'all';
  showChartLegend = false; // Toggle for legend visibility
  
  // Store raw data for filtering
  private rawLineChartData: any[] = [];
  private rawBarChartData: any[] = [];
  private barChartLabels: string[] = [];
  private isSingleDayView: boolean = false;
  
  // Date range for custom filter
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

  areaOptions: { label: string; value: string }[] = [
    { label: 'Tất cả khu vực', value: '' }
  ];
  
  // Loading states
  isLineChartLoading = false;
  isBarChartLoading = false;
  isStatsLoading = false;
  
  // Map data
  mapCenter = { lat: 14.0583, lng: 108.2772 }; // Vietnam center for country view
  mapZoom = 5; // Start with country overview
  cameraLocations: any[] = [];
  
  // Summary cards data - Different metrics for traffic flow (3 columns as per design)
  summaryCards = [
    { title: 'Tổng số phương tiện', value: 8213, change: 12, isPositive: true, color: 'blue' },
    { title: 'Phương tiện chiếm tỉ lệ cao nhất', value: 0, change: 8, isPositive: true, subtitle: 'Xe máy', color: 'green' },
    { title: 'Giờ cao điểm giao thông', value: 0, change: -3, isPositive: false, subtitle: '16-19h', color: 'purple' }
  ];
  
  // Line Chart Data (Traffic flow by hour)
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2.5,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  // Bar Chart Data (Traffic by location/camera)
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
        display: false
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
          },
          callback: function(value) {
            // Format large numbers (e.g., 1000 → 1k)
            if (typeof value === 'number') {
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value;
            }
            return value;
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
    this.loadTrafficData();
    
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
      this.loadTrafficData();
    }
  }
  
  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.loadTrafficData();
  }
  
  selectArea(value: string): void {
    this.selectedArea = value;
    this.showAreaDropdown = false;
    this.loadTrafficData();
  }
  
  onSearch(): void {
    this.loadTrafficData();
  }
  
  onDateRangeSelected(range: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: range.startDate, end: range.endDate };
    this.loadTrafficData();
  }
  
  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.selectedTimeRange = 'today';
    this.loadTrafficData();
  }
  
  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = 'today';
    this.selectedCamera = '';
    this.selectedArea = '';
    this.customDateRange = { start: null, end: null };
    this.loadTrafficData();
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

  // DEPRECATED: This method is no longer used - GPS data loaded from /api/admin/events/traffic-volume/stats
  // Kept for reference only - can be removed in future cleanup
  /*
  private loadCameraLocations(): void {
    this.http.get('/api/admin/camera/camera-with-location').subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          // 🔍 DEBUG: Log complete response structure
          console.log('🔍 API Response:', JSON.stringify(response.data, null, 2));
          console.log('🔍 Cameras array:', response.data.cameras);
          console.log('🔍 Locations array:', response.data.locations);
          
          // 🔍 DEBUG: Log first camera object structure
          if (response.data.cameras && response.data.cameras.length > 0) {
            console.log('🔍 First camera object:', JSON.stringify(response.data.cameras[0], null, 2));
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
  */

  private loadTrafficData(): void {
    console.log('=== loadTrafficData called ===');
    
    // Show loading indicators
    this.isBarChartLoading = true;
    this.isStatsLoading = true;
    
    // Calculate date range based on selected time range
    const { fromUtc, toUtc } = this.getDateRange();
    
    console.log('Date range:', { fromUtc, toUtc });
    
    // Prepare params for API
    const params: any = {
      eventCategory: 'TRAFFIC',
      fromUtc: fromUtc,
      toUtc: toUtc
    };
    
    if (this.selectedCamera) {
      params.cameraSn = this.selectedCamera;
      console.log('Adding camera filter:', this.selectedCamera);
    }
    
    if (this.selectedArea) {
      params.location = this.selectedArea;
      console.log('Adding location filter:', this.selectedArea);
    }
    
    // Determine which API to use based on date range
    const fromDate = new Date(fromUtc);
    const toDate = new Date(toUtc);

    // Check if it's the same day by comparing UTC date parts only
    const isSingleDay = fromDate.getUTCFullYear() === toDate.getUTCFullYear() &&
                        fromDate.getUTCMonth() === toDate.getUTCMonth() &&
                        fromDate.getUTCDate() === toDate.getUTCDate();

    console.log('Date comparison debug:', {
      fromUtc,
      toUtc,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      fromUTCDate: { year: fromDate.getUTCFullYear(), month: fromDate.getUTCMonth(), date: fromDate.getUTCDate() },
      toUTCDate: { year: toDate.getUTCFullYear(), month: toDate.getUTCMonth(), date: toDate.getUTCDate() },
      isSingleDay
    });

    // Reset chart data when switching between single/multiple day views
    if (this.isSingleDayView !== isSingleDay) {
      console.log(`Switching view mode: ${this.isSingleDayView ? 'single day' : 'multiple days'} -> ${isSingleDay ? 'single day' : 'multiple days'}`);
      this.resetChartData();
      this.isSingleDayView = isSingleDay;
    }

    // Call API for traffic volume by day/hour (bar chart data)
    const chartApiUrl = isSingleDay
      ? '/api/admin/events/traffic-volume/by-hour-of-day'
      : '/api/admin/events/traffic-volume/by-day';
    
    console.log(`Calling Chart API (${isSingleDay ? 'single day - by hour' : 'multiple days - by day'}):`, chartApiUrl, 'with params:', params);
    
    this.http.get<any>(chartApiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('✅ Chart API response:', response);
          // Update both chart data and stats data from the same API response
          this.processTrafficVolumeByDayData(response, isSingleDay);
          this.applyBarChartFilter();
          this.updateStatsData(response);
          this.isBarChartLoading = false;
          this.isStatsLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error fetching chart data:', error);
          this.isBarChartLoading = false;
          this.isStatsLoading = false;
          // Fallback to mock data
          this.generateMockTrafficData();
        }
      });

    // Call stats API for GPS data
    this.loadGpsData(params);
  }

  private loadGpsData(params: any): void {
    console.log('🗺️ Loading GPS data from stats API with params:', params);
    
    this.http.get('/api/admin/events/traffic-volume/stats', { params }).subscribe({
      next: (response: any) => {
        console.log('🗺️ GPS stats response:', response);
        if (response && response.success && response.data) {
          this.updateMapWithGpsData(response.data);
        } else {
          console.warn('⚠️ No GPS data available');
        }
      },
      error: (error) => {
        console.error('❌ Error loading GPS stats:', error);
      }
    });
  }

  private updateMapWithGpsData(data: any): void {
    console.log('🗺️ Processing GPS data for map:', data);
    console.log('🗺️ Raw data structure:', JSON.stringify(data, null, 2));
    
    const locations = data.locations || [];
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      console.log('🗺️ Found', locations.length, 'location groups from API');
      
      // Flatten all cameraInfo from all locations
      const allCameras: any[] = [];
      locations.forEach((location: any, locIndex: number) => {
        console.log(`🗺️ [${locIndex}] Processing location:`, location.location, 'with', location.cameraInfo?.length || 0, 'cameras');
        
        if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
          location.cameraInfo.forEach((camera: any, camIndex: number) => {
            // More robust coordinate parsing
            let lat: number;
            let lng: number;
            
            if (typeof camera.latitude === 'number') {
              lat = camera.latitude;
            } else if (typeof camera.latitude === 'string') {
              lat = parseFloat(camera.latitude);
            } else {
              console.warn(`🗺️ Invalid latitude type for camera ${camera.cameraSn}:`, typeof camera.latitude, camera.latitude);
              return; // Skip this camera
            }
            
            if (typeof camera.longitude === 'number') {
              lng = camera.longitude;
            } else if (typeof camera.longitude === 'string') {
              lng = parseFloat(camera.longitude);
            } else {
              console.warn(`🗺️ Invalid longitude type for camera ${camera.cameraSn}:`, typeof camera.longitude, camera.longitude);
              return; // Skip this camera
            }
            
            // Validate coordinates are finite numbers
            if (!isFinite(lat) || isNaN(lat)) {
              console.warn(`🗺️ ❌ Invalid latitude for camera ${camera.cameraSn}: ${lat} (type: ${typeof lat})`);
              return; // Skip this camera
            }
            
            if (!isFinite(lng) || isNaN(lng)) {
              console.warn(`🗺️ ❌ Invalid longitude for camera ${camera.cameraSn}: ${lng} (type: ${typeof lng})`);
              return; // Skip this camera
            }
            
            // Check valid range
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              console.warn(`🗺️ ❌ Coordinates out of valid range for camera ${camera.cameraSn}: lat=${lat}, lng=${lng}`);
              return; // Skip this camera
            }
            
            console.log(`🗺️  ✅ [${locIndex}.${camIndex}] Camera:`, camera.cameraSn, 
              `| Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)} | Total: ${camera.total || 0}`);
            
            allCameras.push({
              ...camera,
              locationName: location.location,
              lat: lat,
              lng: lng
            });
          });
        } else {
          console.warn(`🗺️ [${locIndex}] Location "${location.location}" has no valid cameraInfo array`);
        }
      });
      
      console.log('🗺️ Total cameras after flattening:', allCameras.length);
      console.log('🗺️ All cameras details:', allCameras.map(c => ({ 
        sn: c.cameraSn, 
        lat: c.lat, 
        lng: c.lng, 
        total: c.total 
      })));
      
      // Build map markers directly from cameras
      const validCameras: any[] = [];
      
      allCameras.forEach((camera: any, index: number) => {
        // Skip invalid coordinates (0,0 might be valid in some edge cases, but usually indicates missing data)
        const hasInvalidCoords = isNaN(camera.lat) || isNaN(camera.lng) || 
                                 (camera.lat === 0 && camera.lng === 0) ||
                                 camera.lat < -90 || camera.lat > 90 ||
                                 camera.lng < -180 || camera.lng > 180;
        
        if (hasInvalidCoords) {
          console.warn(`🗺️ [${index}] Skipping camera with invalid coordinates:`, {
            sn: camera.cameraSn,
            lat: camera.lat,
            lng: camera.lng,
            reason: isNaN(camera.lat) || isNaN(camera.lng) ? 'NaN' : 
                    (camera.lat === 0 && camera.lng === 0) ? 'Zero coordinates' : 
                    'Out of valid range'
          });
          return;
        }
        
        validCameras.push({
          cameraSn: camera.cameraSn,
          lat: camera.lat,
          lng: camera.lng,
          total: camera.total || 0,
          locationName: camera.locationName
        });
        
        console.log(`🗺️ ✅ [${index}] Valid camera:`, {
          sn: camera.cameraSn,
          lat: camera.lat.toFixed(6),
          lng: camera.lng.toFixed(6),
          total: camera.total || 0
        });
      });
      
      console.log('🗺️ Valid cameras for mapping:', validCameras.length);
      console.log('🗺️ Valid camera list:', validCameras.map(c => ({ 
        sn: c.cameraSn, 
        coords: `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`, 
        total: c.total 
      })));
      
      // Group cameras by exact coordinates to cluster markers at same position
      const coordGroups: { [key: string]: any[] } = {};
      
      validCameras.forEach((camera: any, index: number) => {
        // Create key with 6 decimal precision (approx 10cm accuracy)
        const coordKey = `${camera.lat.toFixed(6)},${camera.lng.toFixed(6)}`;
        
        if (!coordGroups[coordKey]) {
          coordGroups[coordKey] = [];
          console.log(`🗺️ 📍 New coordinate group created: ${coordKey}`);
        }
        
        coordGroups[coordKey].push(camera);
        console.log(`🗺️ [${index}] Added camera ${camera.cameraSn} to group ${coordKey}`);
      });
      
      const groupCount = Object.keys(coordGroups).length;
      console.log(`🗺️ Coordinate groups (clustered by position): ${groupCount}`);
      console.log('🗺️ Group details:', Object.entries(coordGroups).map(([key, cams]) => ({
        coord: key,
        cameras: cams.length,
        total: cams.reduce((sum, c) => sum + c.total, 0)
      })));
      
      // Convert groups to map locations format
      this.cameraLocations = Object.entries(coordGroups).map(([coordKey, cameras], groupIndex) => {
        const totalCount = cameras.reduce((sum, cam) => sum + cam.total, 0);
        const locationNames = [...new Set(cameras.map(c => c.locationName))].join(', ');
        
        // Use first camera's coordinates (all should be the same in this group)
        const mainCamera = cameras[0];
        
        const markerData = {
          lat: mainCamera.lat,
          lng: mainCamera.lng,
          name: locationNames,
          count: totalCount,
          cameraCode: cameras.length === 1 ? mainCamera.cameraSn : `${cameras.length} cameras`,
          cameras: cameras.map(c => c.cameraSn),
          individualCameras: cameras
        };
        
        console.log(`🗺️ 🎯 Marker[${groupIndex}] created at ${coordKey}:`, {
          cameras: cameras.length,
          total: totalCount,
          locations: locationNames,
          coords: { lat: mainCamera.lat, lng: mainCamera.lng }
        });
        
        return markerData;
      });
      
      console.log('🗺️ ✅ Final camera locations (markers):', this.cameraLocations.length);
      console.log('🗺️ 🗺️ Complete markers list:', this.cameraLocations.map((loc, i) => ({ 
        index: i,
        lat: loc.lat.toFixed(6), 
        lng: loc.lng.toFixed(6), 
        count: loc.count,
        name: loc.name
      })));
      
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
        
        // Determine zoom level with better thresholds
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
      // Reset map when no GPS data - only if currently has data
      if (this.cameraLocations.length > 0) {
        console.log('⚠️ No GPS data - resetting map');
        this.cameraLocations = [];
        // Reset to default Vietnam overview
        this.mapCenter = { lat: 14.0583, lng: 108.2772 };
        this.mapZoom = 5;
        this.cdr.detectChanges();
      }
    }
  }

  private loadTrafficVolumeByDay(): void {
    this.isBarChartLoading = true;
    
    // Calculate date range based on selected time range
    const { fromUtc, toUtc } = this.getDateRange();
    
    // Determine which API to use based on date range - use same logic as loadTrafficData
    const fromDate = new Date(fromUtc);
    const toDate = new Date(toUtc);
    
    // Check if it's the same day by comparing UTC date parts only (same as loadTrafficData)
    const isSingleDay = fromDate.getUTCFullYear() === toDate.getUTCFullYear() &&
                        fromDate.getUTCMonth() === toDate.getUTCMonth() &&
                        fromDate.getUTCDate() === toDate.getUTCDate();
    
    console.log('Date comparison debug in loadTrafficVolumeByDay:', {
      fromUtc,
      toUtc,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      fromUTCDate: { year: fromDate.getUTCFullYear(), month: fromDate.getUTCMonth(), date: fromDate.getUTCDate() },
      toUTCDate: { year: toDate.getUTCFullYear(), month: toDate.getUTCMonth(), date: toDate.getUTCDate() },
      isSingleDay
    });
    
    const apiEndpoint = isSingleDay 
      ? '/api/admin/events/traffic-volume/by-hour-of-day'
      : '/api/admin/events/traffic-volume/by-day';
    
    const params = {
      fromUtc,
      toUtc,
      ...(this.selectedCamera && { cameraSn: this.selectedCamera })
    };

    console.log(`Loading traffic volume data using ${apiEndpoint} for ${isSingleDay ? 'single day' : 'multiple days'}`);
    
    this.http.get(apiEndpoint, { params }).subscribe({
      next: (response: any) => {
        this.processTrafficVolumeByDayData(response, isSingleDay);
        this.applyBarChartFilter();
        this.isBarChartLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading traffic volume by day:', error);
        this.isBarChartLoading = false;
        // Fallback to mock data if API fails
        this.generateMockTrafficData();
      }
    });
  }

  private processTrafficVolumeByDayData(data: any, isSingleDay: boolean = false): void {
    console.log('🔴 processTrafficVolumeByDayData CALLED', { data, isSingleDay });
    
    // Extract data from API response
    const apiData = data.data || data;
    
    console.log('🔴 apiData extracted:', apiData);
    console.log('🔴 Will call:', isSingleDay ? 'processSingleDayData' : 'processMultipleDaysData');

    if (!apiData) {
      console.error('🔴 No apiData - using mock');
      this.generateMockTrafficData();
      return;
    }

    if (isSingleDay) {
      // Process data for single day view (by-hour-of-day API)
      this.processSingleDayData(apiData);
    } else {
      // Process data for multiple days view (by-day API)
      this.processMultipleDaysData(apiData);
    }
  }

  private processSingleDayData(apiData: any): void {
    // Process data for single day view (by-hour-of-day API)
    // Support two data structures:
    // 1. New format: { hourlyData: { "0": {}, "1": {Motor: 5}, ... } }
    // 2. Old format: { hourlyBreakdown: [{ hour, vehicles: {Bus, Motor, Car, Truck}, total }] }

    let hourlyBreakdown: any[] = [];

    // Check for new format (hourlyData object)
    if (apiData.hourlyData && typeof apiData.hourlyData === 'object') {
      console.log('📊 Processing hourlyData (new format)');
      // Convert object to array format
      hourlyBreakdown = Object.entries(apiData.hourlyData).map(([hour, vehicles]: [string, any]) => ({
        hour: parseInt(hour),
        vehicles: vehicles || {},
        total: vehicles ? Object.values(vehicles).reduce((sum: number, count: any) => sum + (count || 0), 0) : 0
      }));
      console.log('📊 Converted hourlyData to array:', hourlyBreakdown.slice(0, 3));
    } else if (apiData.hourlyBreakdown && Array.isArray(apiData.hourlyBreakdown)) {
      // Old format
      console.log('📊 Processing hourlyBreakdown (old format)');
      hourlyBreakdown = apiData.hourlyBreakdown;
    }

    if (!Array.isArray(hourlyBreakdown) || hourlyBreakdown.length === 0) {
      console.warn('⚠️ No hourly data available');
      this.generateMockTrafficData();
      return;
    }

    // Prepare datasets for chart
    const vehicleTypes = ['Car', 'Motor', 'Truck', 'Bus'];
    const colors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA'];

    // Get all hours for labels (0-23)
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);

    const datasets = vehicleTypes.map((type, index) => ({
      label: this.getVehicleTypeLabel(type.toLowerCase()),
      data: hours.map((_, hourIndex) => {
        const hourData = hourlyBreakdown.find(h => h.hour === hourIndex);
        return hourData?.vehicles?.[type] || 0;
      }),
      backgroundColor: colors[index],
      borderWidth: 0,
      borderRadius: 2
    }));

    console.log('📊 Single day datasets created:', datasets.map(d => ({ label: d.label, total: d.data.reduce((a: number, b: number) => a + b, 0) })));

    this.rawBarChartData = datasets;
    this.barChartLabels = hours;
    this.applyBarChartFilter();
  }

  private processMultipleDaysData(apiData: any): void {
    console.log('🔵 processMultipleDaysData CALLED with:', apiData);
    
    // Process data for multiple days view (by-day API)
    // Data structure: { dailyBreakdown: [{ day, vehicles: {Bus, Motor, Car, Truck}, total }] }

    const dailyBreakdown = apiData.dailyBreakdown || [];
    
    console.log('🔵 dailyBreakdown extracted:', dailyBreakdown);
    console.log('🔵 dailyBreakdown length:', dailyBreakdown.length);
    console.log('🔵 Is array?', Array.isArray(dailyBreakdown));

    if (!Array.isArray(dailyBreakdown) || dailyBreakdown.length === 0) {
      console.error('❌ dailyBreakdown is empty or not array - falling back to mock data');
      this.generateMockTrafficData();
      return;
    }

    // Get date range to create proper labels
    const { fromUtc, toUtc } = this.getDateRange();
    const fromDate = new Date(fromUtc);
    const toDate = new Date(toUtc);

    console.log('🔍 Processing multiple days data:', {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      dailyBreakdownLength: dailyBreakdown.length,
      dailyBreakdownSample: dailyBreakdown.slice(0, 3)
    });

    // Create labels for each day in the range
    const labels: string[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const day = currentDate.getUTCDate();
      const month = currentDate.getUTCMonth() + 1;
      labels.push(`${day}/${month}`);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log('📅 Generated labels:', labels);

    // Prepare datasets for chart
    const vehicleTypes = ['Car', 'Motor', 'Truck', 'Bus'];
    const colors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA'];

    // IMPORTANT: API returns day as 1-based sequential index (day 1 = first day in range, NOT calendar day)
    // Example: If searching 18/12 to 24/12, day:1 means 18/12, day:7 means 24/12
    console.log('📊 Daily breakdown data:', dailyBreakdown.map((d: any) => ({ 
      day: d.day, 
      total: d.total, 
      vehicles: d.vehicles 
    })));
    
    // CRITICAL FIX: Find which API day corresponds to our fromDate
    // If fromDate is 17/12, we need to find which 'day' number that is in the API response
    const fromDay = fromDate.getUTCDate(); // e.g., 17 for 17/12
    console.log('📊 From date day number:', fromDay, '(calendar day of month)');

    const datasets = vehicleTypes.map((type, index) => {
      const data = labels.map((label, labelIndex) => {
        // Calculate the calendar day for this label
        const labelDate = new Date(fromDate);
        labelDate.setUTCDate(fromDate.getUTCDate() + labelIndex);
        const calendarDay = labelDate.getUTCDate(); // Actual day of month
        
        // Find the matching day in API response
        const dayData = dailyBreakdown.find((d: any) => d.day === calendarDay);
        const value = dayData?.vehicles?.[type] || 0;
        
        if (labelIndex < 3 || value > 0) {
          console.log(`📊 [${type}] Label "${label}" (${calendarDay}/${labelDate.getUTCMonth()+1}) → API day ${calendarDay} → value: ${value}`);
        }
        
        return value;
      });

      console.log(`🚗 Dataset for ${type}:`, {
        type,
        label: this.getVehicleTypeLabel(type.toLowerCase()),
        totalCount: data.reduce((sum, v) => sum + v, 0),
        nonZeroCount: data.filter(v => v > 0).length
      });

      return {
        label: this.getVehicleTypeLabel(type.toLowerCase()),
        data,
        backgroundColor: colors[index],
        borderWidth: 0,
        borderRadius: 2
      };
    });

    console.log('✅ Final datasets:', datasets.map(ds => ({ 
      label: ds.label, 
      dataLength: ds.data.length,
      totalCount: ds.data.reduce((sum, v) => sum + v, 0)
    })));
    
    console.log('✅✅✅ SETTING rawBarChartData and barChartLabels');
    console.log('  - rawBarChartData will have', datasets.length, 'datasets');
    console.log('  - barChartLabels will have', labels.length, 'labels');

    this.rawBarChartData = datasets;
    this.barChartLabels = labels;
    
    console.log('✅✅✅ AFTER ASSIGNMENT:');
    console.log('  - this.rawBarChartData:', this.rawBarChartData?.length);
    console.log('  - this.barChartLabels:', this.barChartLabels?.length);
    
    console.log('✅ Chart data prepared:', {
      labelsCount: this.barChartLabels.length,
      datasetsCount: this.rawBarChartData.length,
      rawBarChartData: this.rawBarChartData,
      barChartLabels: this.barChartLabels
    });
    
    console.log('🔵 BEFORE applyBarChartFilter - barChartData:', JSON.stringify(this.barChartData, null, 2));
    this.applyBarChartFilter();
    console.log('🔵 AFTER applyBarChartFilter - barChartData:', JSON.stringify(this.barChartData, null, 2));
  }

  private processTrafficVolumeStatsData(data: any): void {
    if (!data) {
      this.initializeFallbackData();
      return;
    }

    // Process summary cards data
    this.summaryCards = [
      {
        title: 'Tổng số phương tiện',
        value: data.totalVehicles || 0,
        change: data.totalChange || 0,
        isPositive: (data.totalChange || 0) >= 0,
        color: 'blue'
      },
      {
        title: 'Phương tiện chiếm tỉ lệ cao nhất',
        value: 0,
        change: 0,
        isPositive: true,
        subtitle: data.topVehicleType || 'Xe máy',
        color: 'green'
      },
      {
        title: 'Giờ cao điểm giao thông',
        value: 0,
        change: 0,
        isPositive: true,
        subtitle: data.peakHour || '16-19h',
        color: 'purple'
      }
    ];

    // Process camera locations if available
    if (data.cameraStats && Array.isArray(data.cameraStats)) {
      this.cameraLocations = data.cameraStats.map((cam: any) => ({
        lat: cam.latitude || 0,
        lng: cam.longitude || 0,
        name: cam.cameraName || cam.name || 'Unknown',
        count: cam.totalCount || 0,
        cameraCode: cam.cameraCode || cam.id || '',
        totalIn: cam.totalIn || 0,
        totalOut: cam.totalOut || 0
      }));
    }
  }

  private updateStatsData(data: any): void {
    console.log('📊 Updating stats data from traffic volume API:', data);

    if (!data) {
      this.initializeFallbackData();
      return;
    }

    // Extract data from the new API format
    const apiData = data.data || data;

    // Use API provided values - support both new and old formats
    const totalVehicles = apiData.totalVehicles || 0;
    
    // Most common vehicle type
    const mostCommonVehicleType = apiData.mostCommonVehicleType || apiData.mostCommonVehicleClass || 'Motor';
    const mostCommonVehicleCount = apiData.mostCommonVehicleCount || apiData.mostCommonVehicleClassCount || 0;
    
    // Peak hour/day
    const peakHour = apiData.peakHour;
    const peakHourCount = apiData.peakHourCount || 0;
    const peakDay = apiData.peakDay || 0;
    const peakDayCount = apiData.peakDayCount || 0;

    // Determine if this is hourly or daily data
    const isHourlyData = apiData.hourlyData || apiData.hourlyBreakdown;

    console.log('📊 Stats extracted:', {
      totalVehicles,
      mostCommonVehicleType,
      mostCommonVehicleCount,
      peakHour,
      peakHourCount,
      peakDay,
      peakDayCount,
      isHourlyData: !!isHourlyData
    });

    // Process summary cards data
    this.summaryCards = [
      {
        title: 'Tổng số phương tiện',
        value: totalVehicles,
        change: 0,
        isPositive: true,
        color: 'blue'
      },
      {
        title: 'Phương tiện chiếm tỉ lệ cao nhất',
        value: mostCommonVehicleCount,
        change: 0,
        isPositive: true,
        subtitle: this.getVehicleTypeLabel(mostCommonVehicleType.toLowerCase()) || 'Xe máy',
        color: 'green'
      },
      {
        title: isHourlyData ? 'Giờ cao điểm giao thông' : 'Ngày cao điểm giao thông',
        value: isHourlyData ? peakHourCount : peakDayCount,
        change: 0,
        isPositive: true,
        subtitle: isHourlyData ? (peakHour !== undefined ? `${peakHour}:00` : 'N/A') : (peakDay ? `Ngày ${peakDay}` : 'N/A'),
        color: 'purple'
      }
    ];

    console.log('✅ Summary cards updated:', this.summaryCards);

    // Process camera locations from API if available
    const locations = apiData.locations || [];
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      console.log('🗺️ [LuuLuongGiaoThong] Processing locations data - FOUND:', locations.length, 'locations');
      
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
      
      console.log('🗺️ [LuuLuongGiaoThong] Total cameras from all locations:', allCameras.length);
      
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
      
      console.log('🗺️ [LuuLuongGiaoThong] Final camera locations for map:', this.cameraLocations.length, 'locations');
    } else {
      // NO FALLBACK - GPS data already loaded from separate stats API call
      console.log('🗺️ [LuuLuongGiaoThong] No locations in chart API response - GPS data loaded separately from stats API');
    }

    console.log('✅ Stats data updated:', this.summaryCards);
  }

  private resetChartData(): void {
    // Reset all chart-related data when switching between single/multiple day views
    this.rawBarChartData = [];
    this.rawLineChartData = [];
    this.barChartLabels = [];
    this.barChartData = {
      labels: [],
      datasets: []
    };
    this.lineChartData = {
      labels: [],
      datasets: []
    };
    // Reset filter to 'all' when switching views
    this.barChartFilter = 'all';
    this.lineChartFilter = 'all';
    console.log('✅ Chart data reset for view mode switch');
  }

  private generateMockTrafficData(): void {
    // Generate stacked bar chart data matching the design (24 hours, 0-23)
    const hours = Array.from({length: 24}, (_, i) => i.toString());
    
    // Mock data for stacked bars with colors matching the design
    const oToData = [40, 65, 45, 35, 30, 45, 80, 120, 160, 180, 170, 165, 180, 190, 200, 220, 240, 260, 200, 150, 120, 90, 70, 50];
    const xeMayData = [80, 120, 90, 70, 60, 90, 160, 240, 320, 360, 340, 330, 360, 380, 400, 440, 480, 520, 400, 300, 240, 180, 140, 100];
    const xeTaiData = [20, 35, 25, 15, 10, 25, 40, 60, 80, 90, 85, 82, 90, 95, 100, 110, 120, 130, 100, 75, 60, 45, 35, 25];
    const xeBusData = [15, 25, 18, 12, 8, 18, 30, 45, 60, 68, 64, 62, 68, 72, 75, 82, 90, 98, 75, 56, 45, 34, 26, 19];
    const xeKhacData = [10, 15, 12, 8, 5, 12, 20, 30, 40, 45, 43, 41, 45, 48, 50, 55, 60, 65, 50, 37, 30, 23, 17, 12];

    this.barChartData = {
      labels: hours,
      datasets: [
        {
          label: 'Ô tô',
          data: oToData,
          backgroundColor: '#60A5FA', // Light blue
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe máy', 
          data: xeMayData,
          backgroundColor: '#34D399', // Green
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe tải',
          data: xeTaiData,
          backgroundColor: '#FBBF24', // Yellow
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe buýt',
          data: xeBusData,
          backgroundColor: '#A78BFA', // Purple 
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe khác',
          data: xeKhacData,
          backgroundColor: '#FB7185', // Pink
          borderWidth: 0,
          borderRadius: 2
        }
      ]
    };

    this.cdr.detectChanges();
  }

  // Chart filter methods
  setLineChartFilter(filter: 'all' | 'car' | 'motorbike' | 'truck'): void {
    this.lineChartFilter = filter;
    this.updateLineChartData();
  }

  setBarChartFilter(filter: 'all' | 'car' | 'motorbike' | 'truck' | 'bus'): void {
    this.barChartFilter = filter;
    this.applyBarChartFilter();
  }

  private applyBarChartFilter(): void {
    console.log('applyBarChartFilter called', {
      hasRawData: !!this.rawBarChartData,
      rawDataLength: this.rawBarChartData?.length,
      labelsLength: this.barChartLabels?.length,
      filter: this.barChartFilter
    });

    if (!this.rawBarChartData || this.rawBarChartData.length === 0) {
      console.warn('No raw bar chart data available');
      return;
    }

    if (this.barChartFilter === 'all') {
      this.barChartData.datasets = [...this.rawBarChartData];
    } else {
      const filterLabel = this.getVehicleTypeLabel(this.barChartFilter);
      this.barChartData.datasets = this.rawBarChartData.filter(dataset => dataset.label === filterLabel);
    }

    this.barChartData.labels = [...this.barChartLabels];
    
    // CRITICAL: Create new object reference to trigger Angular change detection
    this.barChartData = {
      labels: [...this.barChartLabels],
      datasets: [...this.barChartData.datasets]
    };
    
    console.log('Bar chart updated:', {
      labels: this.barChartData.labels,
      labelsLength: this.barChartData.labels?.length || 0,
      datasets: this.barChartData.datasets.map(ds => ({
        label: ds.label,
        dataLength: ds.data.length,
        sampleData: ds.data.slice(0, 5),
        totalSum: ds.data.reduce((a: number, b: any) => (a || 0) + (typeof b === 'number' ? b : 0), 0)
      }))
    });

    // Force chart update with timeout to ensure chart is initialized
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.chart?.chart) {
        console.log('🔄 Updating chart instance');
        this.chart.chart.update('active');
      } else {
        console.warn('⚠️ Chart instance not available yet');
      }
    }, 100);
  }

  private updateLineChartData(): void {
    // Update line chart based on filter - reload data from API
    this.loadTrafficVolumeByDay();
  }

  private getVehicleTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'car': 'Ô tô',
      'motorbike': 'Xe máy',
      'truck': 'Xe tải',
      'bus': 'Xe buýt',
      'other': 'Khác'
    };
    return labels[type] || type;
  }

  toggleChartLegend(): void {
    this.showChartLegend = !this.showChartLegend;
  }

  private getDateRange(): { fromUtc: string; toUtc: string } {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    switch (this.selectedTimeRange) {
      case 'today':
        // Today in UTC: from 00:00:00 UTC to 23:59:59.999 UTC of today
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        fromDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000); // Convert to UTC
        fromDate.setUTCHours(0, 0, 0, 0);
        toDate = new Date(fromDate.getTime());
        toDate.setUTCHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        // Yesterday in UTC: from 00:00:00 UTC to 23:59:59.999 UTC of yesterday
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        fromDate = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000); // Convert to UTC
        fromDate.setUTCHours(0, 0, 0, 0);
        toDate = new Date(fromDate.getTime());
        toDate.setUTCHours(23, 59, 59, 999);
        break;
      case '7days':
        // Last 7 days in UTC
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate = new Date(sevenDaysAgo.getTime() - sevenDaysAgo.getTimezoneOffset() * 60000);
        fromDate.setUTCHours(0, 0, 0, 0);
        toDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        toDate.setUTCHours(23, 59, 59, 999);
        break;
      case '30days':
        // Last 30 days in UTC
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        fromDate = new Date(thirtyDaysAgo.getTime() - thirtyDaysAgo.getTimezoneOffset() * 60000);
        fromDate.setUTCHours(0, 0, 0, 0);
        toDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        toDate.setUTCHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (this.customDateRange.start && this.customDateRange.end) {
          // Custom range in UTC
          fromDate = new Date(this.customDateRange.start.getTime() - this.customDateRange.start.getTimezoneOffset() * 60000);
          fromDate.setUTCHours(0, 0, 0, 0);
          toDate = new Date(this.customDateRange.end.getTime() - this.customDateRange.end.getTimezoneOffset() * 60000);
          toDate.setUTCHours(23, 59, 59, 999);
        } else {
          // Default to first day of month to today in UTC
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          fromDate = new Date(firstDayOfMonth.getTime() - firstDayOfMonth.getTimezoneOffset() * 60000);
          fromDate.setUTCHours(0, 0, 0, 0);
          toDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
          toDate.setUTCHours(23, 59, 59, 999);
        }
        break;
      default:
        // No filter selected: first day of current month to today in UTC
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        fromDate = new Date(firstDayOfMonth.getTime() - firstDayOfMonth.getTimezoneOffset() * 60000);
        fromDate.setUTCHours(0, 0, 0, 0);
        toDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        toDate.setUTCHours(23, 59, 59, 999);
    }

    // Format date to UTC string
    const formatToUTC = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      const ms = String(date.getUTCMilliseconds()).padStart(3, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    };

    return {
      fromUtc: formatToUTC(fromDate),
      toUtc: formatToUTC(toDate)
    };
  }

  private initializeFallbackData(): void {
    // Fallback data when API fails
    this.cameraLocations = [
      {
        lat: 21.0285,
        lng: 105.8542,
        name: 'Cầu Long Biên',
        count: 1245,
        cameraCode: 'CAM-001',
        totalIn: 678,
        totalOut: 567
      },
      {
        lat: 21.0245,
        lng: 105.8412,
        name: 'Ngã Tư Sở',
        count: 892,
        cameraCode: 'CAM-002',
        totalIn: 445,
        totalOut: 447
      },
      {
        lat: 10.7769,
        lng: 106.7009,
        name: 'Bến Thành',
        count: 1567,
        cameraCode: 'CAM-003',
        totalIn: 823,
        totalOut: 744
      },
      {
        lat: 10.7891,
        lng: 106.6668,
        name: 'Quận 1',
        count: 2134,
        cameraCode: 'CAM-004',
        totalIn: 1089,
        totalOut: 1045
      },
      {
        lat: 16.0544,
        lng: 108.2022,
        name: 'Cầu Rồng',
        count: 756,
        cameraCode: 'CAM-005',
        totalIn: 389,
        totalOut: 367
      }
    ];

    // Fallback summary cards
    this.summaryCards = [
      { 
        title: 'Tổng số phương tiện', 
        value: 8213, 
        change: 0, 
        isPositive: true,
        color: 'blue'
      },
      { 
        title: 'Phương tiện chiếm tỉ lệ cao nhất', 
        value: 0, 
        change: 0, 
        isPositive: true, 
        subtitle: 'Xe máy',
        color: 'green'
      },
      { 
        title: 'Giờ cao điểm giao thông', 
        value: 0, 
        change: 0, 
        isPositive: true, 
        subtitle: '16-19h',
        color: 'purple'
      }
    ];

    console.log('🚗 Fallback camera locations:', this.cameraLocations);
    console.log('📊 Fallback summary cards:', this.summaryCards);
  }
}
