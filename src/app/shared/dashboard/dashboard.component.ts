import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TrafficFlowMapComponent } from '../../pages/statistics/traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from './dashboad.service';
import { CameraService } from '../../pages/camera/camera.service';
import { SSEService } from '../../core/services/sse.service';
import { LocationService, LocationOption } from '../services/location.service';
import { CountUpDirective } from '../directives/count-up.directive';
import { DateRangePickerComponent } from '../date-picker-ranger/date-range-picker.component';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TrafficFlowMapComponent,
    CountUpDirective,
    DateRangePickerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponentShare implements OnInit, OnDestroy {
  
  // Filter state
  selectedCategoryFilter = '';
  selectedStatusFilter = '';
  selectedLocationFilter = '';
  cameraSearchText = '';
  
  // Date range filter - default to today
  selectedTimeRange = 'today';
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  fromDate: Date | null = null;
  toDate: Date | null = null;
  
  // Dropdown states
  showCategoryFilter = false;
  showStatusFilter = false;
  showLocationFilter = false;
  
  // Filter options
  locationOptions: LocationOption[] = [];
  
  // Camera list data
  cameras: any[] = [];
  filteredCameras: any[] = [];
  totalCameras = 0;
  loadingCameras = false;
  
  // Map data
  cameraLocations: any[] = [];
  
  // Summary cards data  
  summaryCards = [
    { title: 'Phát hiện người', value: 0, change: 0, isPositive: true, color: 'blue' },
    { title: 'Phát hiện giao thông', value: 0, change: 0, isPositive: true, color: 'green' },
    { title: 'Vi phạm giao thông', value: 0, change: 0, isPositive: false, color: 'purple' }
  ];
  
  // SSE Subscriptions
  private sseSubscriptions: Subscription[] = [];
  private routerSubscription?: Subscription;
  private isDashboardActive = false;
  
  constructor(
    private http: HttpClient,
    private dashboardService: DashboardService,
    private cameraService: CameraService,
    private sseService: SSEService,
    private locationService: LocationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    console.log('🚀 Dashboard component initialized - ngOnInit called');
    console.log('📊 About to call homepage stats API...');
    
    // Mark dashboard as active
    this.isDashboardActive = true;
    
    // Set default date range to today
    this.initializeDateRange();
    
    this.loadCameraList();
    this.loadLocations();
    this.connectSSE();
    
    // Listen to route changes to disconnect SSE when leaving dashboard
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const isDashboard = event.url.includes('/dashboard');
        
        if (!isDashboard && this.isDashboardActive) {
          console.log('🚪 Leaving dashboard, disconnecting SSE...');
          this.isDashboardActive = false;
          this.disconnectAllSSE();
        } else if (isDashboard && !this.isDashboardActive) {
          console.log('🏠 Returning to dashboard, reconnecting SSE...');
          this.isDashboardActive = true;
          this.connectSSE();
        }
      });
  }
  
  ngOnDestroy(): void {
    console.log('🧹 Dashboard component destroying - cleaning up...');
    
    // Mark dashboard as inactive
    this.isDashboardActive = false;
    
    // Unsubscribe from router events
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    // Cleanup SSE subscriptions
    this.disconnectAllSSE();
  }
  
  // Filter methods
  toggleCategoryFilter(): void {
    this.showCategoryFilter = !this.showCategoryFilter;
    this.showStatusFilter = false;
    this.showLocationFilter = false;
  }
  
  toggleStatusFilter(): void {
    this.showStatusFilter = !this.showStatusFilter;
    this.showCategoryFilter = false;
    this.showLocationFilter = false;
  }
  
  toggleLocationFilter(): void {
    this.showLocationFilter = !this.showLocationFilter;
    this.showCategoryFilter = false;
    this.showStatusFilter = false;
  }
  
  selectCategoryFilter(value: string): void {
    this.selectedCategoryFilter = value;
    this.showCategoryFilter = false;
    this.filterCameras();
  }
  
  selectStatusFilter(value: string): void {
    this.selectedStatusFilter = value;
    this.showStatusFilter = false;
    this.filterCameras();
  }
  
  selectLocationFilter(value: string): void {
    this.selectedLocationFilter = value;
    this.showLocationFilter = false;
    this.filterCameras();
  }
  
  onCameraSearch(): void {
    this.filterCameras();
  }
  
  getCategoryFilterLabel(): string {
    if (this.selectedCategoryFilter === 'TRAFFIC') return 'Giao thông';
    if (this.selectedCategoryFilter === 'PERSON') return 'Đối tượng người';
    return 'Tất cả loại Camera';
  }
  
  getStatusFilterLabel(): string {
    if (this.selectedStatusFilter === 'online') return 'Online';
    if (this.selectedStatusFilter === 'offline') return 'Offline';
    return 'Trạng thái';
  }
  
  getLocationFilterLabel(): string {
    return this.selectedLocationFilter || 'Tất cả khu vực';
  }
  
  filterCameras(): void {
    this.filteredCameras = this.cameras.filter(camera => {
      // Filter by category
      if (this.selectedCategoryFilter && camera.category !== this.selectedCategoryFilter) {
        return false;
      }
      
      // Filter by status
      if (this.selectedStatusFilter === 'online' && camera.connectionStatus !== 1) {
        return false;
      }
      if (this.selectedStatusFilter === 'offline' && camera.connectionStatus !== 0) {
        return false;
      }
      
      // Filter by location
      if (this.selectedLocationFilter && camera.location !== this.selectedLocationFilter) {
        return false;
      }
      
      // Filter by search text
      if (this.cameraSearchText) {
        const searchLower = this.cameraSearchText.toLowerCase();
        const nameMatch = camera.name?.toLowerCase().includes(searchLower);
        const snMatch = camera.sn?.toLowerCase().includes(searchLower);
        if (!nameMatch && !snMatch) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  clearFilters(): void {
    this.selectedCategoryFilter = '';
    this.selectedStatusFilter = '';
    this.selectedLocationFilter = '';
    this.cameraSearchText = '';
    this.initializeDateRange(); // Reset to today
    this.filterCameras();
    this.loadCameraList(); // Reload with default date
  }
  
  hasActiveFilters(): boolean {
    return this.selectedCategoryFilter !== '' || 
           this.selectedStatusFilter !== '' || 
           this.selectedLocationFilter !== '' || 
           this.cameraSearchText !== '' ||
           this.selectedTimeRange !== 'today';
  }
  
  // Initialize date range to today
  private initializeDateRange(): void {
    const now = new Date();
    this.fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    this.toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    this.selectedTimeRange = 'today';
    console.log('📅 Date range initialized to today:', {
      fromDate: this.fromDate,
      toDate: this.toDate
    });
  }
  
  // Handle date range selection from picker
  onDateRangeSelected(dateRange: { startDate: Date; endDate: Date }): void {
    console.log('📅 Date range selected:', dateRange);
    this.fromDate = new Date(dateRange.startDate);
    this.fromDate.setHours(0, 0, 0, 0);
    this.toDate = new Date(dateRange.endDate);
    this.toDate.setHours(23, 59, 59, 999);
    this.selectedTimeRange = 'custom';
    this.customDateRange = {
      start: this.fromDate,
      end: this.toDate
    };
    
    // Reload data with new date range
    this.loadCameraList();
  }
  
  // Handle date range cleared
  onDateRangeCleared(): void {
    console.log('📅 Date range cleared, resetting to today');
    this.initializeDateRange();
    this.customDateRange = { start: null, end: null };
    this.loadCameraList();
  }
  
  // Load camera list
  private loadCameraList(): void {
    console.log('📡 loadCameraList() - Starting to call getHomepageStats API...');
    this.loadingCameras = true;
    
    // Prepare API params with date range
    const params: any = {};
    if (this.fromDate && this.toDate) {
      params.fromUtc = this.fromDate.toISOString();
      params.toUtc = this.toDate.toISOString();
      console.log('📅 API params with date range:', params);
    }
    
    console.log('🌐 Calling API: /api/admin/events/stats/homepage');
    this.dashboardService.getHomepageStats(params).subscribe({
      next: (response) => {
        console.log('📊 Homepage stats response:', response);
        if (response && response.data) {
          const data = response.data;
          
          // Update summary cards with statistics
          this.updateSummaryCards(data);
          
          // Update camera locations from the same API
          this.updateCameraLocations(data.locations || []);
          
          // Extract cameras from cameraInfo in all locations
          this.extractCamerasFromLocations(data.locations || []);
        }
        this.loadingCameras = false;
      },
      error: (error) => {
        console.error('❌ Error loading homepage stats:', error);
        this.loadingCameras = false;
      }
    });
  }
  
  // Update summary cards with API data
  private updateSummaryCards(data: any): void {
    console.log('📊 Updating summary cards with data:', data);
    
    // Update Phát hiện người
    const personCard = this.summaryCards.find(c => c.title === 'Phát hiện người');
    if (personCard && data.totalPersonDetected !== undefined) {
      personCard.value = data.totalPersonDetected;
      console.log('👤 Updated person detection:', data.totalPersonDetected);
    }
    
    // Update Phát hiện giao thông
    const trafficCard = this.summaryCards.find(c => c.title === 'Phát hiện giao thông');
    if (trafficCard && data.totalTrafficDetected !== undefined) {
      trafficCard.value = data.totalTrafficDetected;
      console.log('🚗 Updated traffic detection:', data.totalTrafficDetected);
    }
    
    // Update Vi phạm giao thông
    const violationCard = this.summaryCards.find(c => c.title === 'Vi phạm giao thông');
    if (violationCard && data.totalTrafficViolation !== undefined) {
      violationCard.value = data.totalTrafficViolation;
      console.log('⚠️ Updated traffic violation:', data.totalTrafficViolation);
    }
  }
  
  // Load locations from API
  private loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locationOptions = locations;
        console.log('📍 Loaded locations from API:', locations.length);
      },
      error: (error) => {
        console.error('❌ Error loading locations:', error);
      }
    });
  }
  
  private updateCameraLocations(locations: any[]): void {
    this.cameraLocations = [];
    
    locations.forEach((location: any) => {
      if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
        location.cameraInfo.forEach((camera: any) => {
          if (camera.latitude && camera.longitude) {
            // Calculate total count based on camera type
            const count = camera.cameraType === 'PERSON' 
              ? (camera.totalPersonDetected || 0)
              : (camera.totalTrafficDetected || 0) + (camera.totalTrafficViolation || 0);
            
            this.cameraLocations.push({
              name: location.location || camera.address, // Ưu tiên tên location chung
              cameraSn: camera.cameraSn,
              cameraCode: camera.cameraSn,
              lat: camera.latitude,
              lng: camera.longitude,
              count: count,
              type: camera.cameraType,
              address: camera.address || location.location, // Lưu address chi tiết cho info window
              totalPersonDetected: camera.totalPersonDetected || 0,
              totalTrafficDetected: camera.totalTrafficDetected || 0,
              totalTrafficViolation: camera.totalTrafficViolation || 0,
              totalIn: camera.totalPersonDetected || 0,
              totalOut: camera.totalTrafficDetected || 0,
              locationName: location.location
            });
          }
        });
      }
    });
    
    console.log('📍 Updated camera locations:', this.cameraLocations.length);
    console.log('📍 Sample camera:', this.cameraLocations[0]);
  }

  exportReport(): void {
    console.log('Exporting report...');
    // Implement export functionality
  }
  
  // Camera list methods
  private extractCamerasFromLocations(locations: any[]): void {
    this.cameras = [];
    const locationSet = new Set<string>();
    
    locations.forEach((location: any) => {
      if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
        location.cameraInfo.forEach((camera: any) => {
          // Calculate event count based on camera type
          const eventCount = camera.cameraType === 'PERSON'
            ? (camera.totalPersonDetected || 0)
            : (camera.totalTrafficDetected || 0) + (camera.totalTrafficViolation || 0);
          
          this.cameras.push({
            id: camera.cameraSn,
            sn: camera.cameraSn,
            name: location.location || camera.address || camera.cameraName, // Ưu tiên tên location chung
            category: camera.cameraType,
            connectionStatus: 1,
            location: location.location,
            address: camera.address || location.location, // Lưu address chi tiết cho info window
            latitude: camera.latitude,
            longitude: camera.longitude,
            eventCount: eventCount,
            totalPersonDetected: camera.totalPersonDetected || 0,
            totalTrafficDetected: camera.totalTrafficDetected || 0,
            totalTrafficViolation: camera.totalTrafficViolation || 0
          });
        });
      }
    });
    
    this.totalCameras = this.cameras.length;
    this.filterCameras();
    console.log('📷 Extracted cameras from locations:', this.totalCameras);
  }
  
  getCategoryIcon(category: string): string {
    return category === 'PERSON' ? 'person' : 'directions_car';
  }
  
  getCategoryLabel(category: string): string {
    return category === 'PERSON' ? 'Đối tượng người' : 'Giao thông';
  }
  
  toggleCameraStatus(camera: any): void {
    const newStatus = camera.connectionStatus === 1 ? 0 : 1;
    
    this.cameraService.updateCameraStatus(camera.id, newStatus).subscribe({
      next: (response) => {
        camera.connectionStatus = newStatus;
        console.log(`Camera ${camera.name} status updated to ${newStatus}`);
      },
      error: (error) => {
        console.error('Error updating camera status:', error);
      }
    });
  }
  
  openCameraSettings(camera: any): void {
    console.log('Open settings for camera:', camera);
  }
  
  // SSE Methods
  private disconnectAllSSE(): void {
    console.log('🔌 Disconnecting all SSE connections...');
    
    // Unsubscribe all subscriptions
    this.sseSubscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.sseSubscriptions = [];
    
    // Disconnect all SSE connections in service
    this.sseService.disconnectAll();
    
    console.log('✅ All SSE connections disconnected');
  }
  
  private connectSSE(): void {
    console.log('🚀 Dashboard subscribing to global SSE stream...');
    
    // Ensure we disconnect any existing connections first
    this.disconnectAllSSE();
    
    // Subscribe to global shared SSE stream (already connected in MainLayout)
    const subscription = this.sseService.getGlobalStream().subscribe({
      next: (message) => {
        console.log('✅ Dashboard received SSE:', message);
        this.handleHomepageDashboard(message.data || message);
      },
      error: (error) => {
        console.error('❌ Dashboard SSE Error:', error);
      },
      complete: () => {
        console.log('🔌 Dashboard SSE completed');
      }
    });
    
    this.sseSubscriptions.push(subscription);
    console.log('📊 Dashboard subscribed to global SSE');
  }
  
  // Removed reconnectSSE - using global shared stream, no reconnection needed
  
  // Removed handleSSEMessage - directly call handleHomepageDashboard in connectSSE
  
  private handleObjectRecognition(data: any): void {
    // Handle real-time object recognition updates
    console.log('🔍 Object Recognition - Full data:', data);
    console.log('🔍 Data type:', typeof data);
    console.log('🔍 Data keys:', Object.keys(data));
    console.log('🔍 Has dataChanges?', 'dataChanges' in data);
    
    // Handle dataChanges event
    if (data.dataChanges) {
      console.log('✅ Data Changes detected:', data.dataChanges);
      console.log('📊 Data Changes type:', typeof data.dataChanges);
      console.log('📊 Data Changes keys:', Object.keys(data.dataChanges));
      
      // Parse dataChanges if it's a string
      let changes = data.dataChanges;
      if (typeof data.dataChanges === 'string') {
        try {
          changes = JSON.parse(data.dataChanges);
          console.log('✅ Parsed dataChanges:', changes);
        } catch (e) {
          console.error('❌ Failed to parse dataChanges:', e);
        }
      }
      
      // Log individual properties
      console.log('👤 Gender:', changes.gender);
      console.log('🎨 Complexion:', changes.complexion);
      console.log('📅 Age:', changes.age);
    } else {
      console.warn('⚠️ No dataChanges found in data');
      console.log('Available properties:', Object.keys(data));
    }
    
    // Update summary cards or camera locations if needed
    if (data.totalPersonDetected !== undefined) {
      const card = this.summaryCards.find(c => c.title === 'Phát hiện người');
      if (card) {
        card.value = data.totalPersonDetected;
      }
    }
  }
  
  private handleTrafficVolume(data: any): void {
    // Handle traffic volume updates (lưu lượng giao thông)
    console.log('🚗 Traffic Volume:', data);
    
    // Handle dataChanges format: {"dataChanges":{"cameraSn":{"vehicleType":count}}}
    if (data.dataChanges) {
      console.log('📊 DataChanges detected:', data.dataChanges);
      
      let totalNewTraffic = 0;
      
      // Iterate through each camera
      Object.keys(data.dataChanges).forEach(cameraSn => {
        const trafficData = data.dataChanges[cameraSn];
        console.log(`📷 Camera ${cameraSn} traffic:`, trafficData);
        
        // Calculate total vehicles for this camera
        let cameraTrafficCount = 0;
        Object.keys(trafficData).forEach(vehicleType => {
          const count = trafficData[vehicleType];
          cameraTrafficCount += count;
          totalNewTraffic += count;
          console.log(`  🚗 ${vehicleType}: +${count}`);
        });
        
        // Update camera location on map
        const location = this.cameraLocations.find(loc => 
          loc.cameraSn === cameraSn || loc.cameraCode === cameraSn
        );
        if (location) {
          location.totalTrafficDetected = (location.totalTrafficDetected || 0) + cameraTrafficCount;
          location.count = location.type === 'TRAFFIC' 
            ? location.totalTrafficDetected + (location.totalTrafficViolation || 0)
            : location.count;
          console.log(`📍 Updated camera ${cameraSn} traffic to ${location.totalTrafficDetected}`);
        }
        
        // Update camera in cameras list
        const camera = this.cameras.find(cam => cam.sn === cameraSn);
        if (camera) {
          camera.totalTrafficDetected = (camera.totalTrafficDetected || 0) + cameraTrafficCount;
          camera.eventCount = camera.category === 'TRAFFIC'
            ? camera.totalTrafficDetected + (camera.totalTrafficViolation || 0)
            : camera.eventCount;
        }
      });
      
      // Update summary card
      if (totalNewTraffic > 0) {
        const card = this.summaryCards.find(c => c.title === 'Phát hiện giao thông');
        if (card) {
          card.value = (card.value || 0) + totalNewTraffic;
          console.log(`📊 Updated total traffic to ${card.value}`);
        }
      }
    }
    
    // Handle direct format (legacy)
    if (data.totalTrafficDetected !== undefined) {
      const card = this.summaryCards.find(c => c.title === 'Phát hiện giao thông');
      if (card) {
        card.value = data.totalTrafficDetected;
      }
    }
    
    // Update specific camera (legacy)
    if (data.cameraSn && data.totalTrafficDetected !== undefined) {
      const location = this.cameraLocations.find(loc => loc.cameraSn === data.cameraSn);
      if (location) {
        location.totalTrafficDetected = data.totalTrafficDetected;
        location.count = location.type === 'TRAFFIC' 
          ? (data.totalTrafficDetected || 0) + (location.totalTrafficViolation || 0)
          : location.count;
      }
    }
  }
  
  private handleTrafficViolation(data: any): void {
    // Handle traffic violation updates
    console.log('⚠️ Traffic Violation:', data);
    
    // Handle dataChanges format: {"dataChanges":{"cameraSn":{"violationType":count}}}
    if (data.dataChanges) {
      console.log('📊 DataChanges detected:', data.dataChanges);
      
      let totalNewViolations = 0;
      
      // Iterate through each camera
      Object.keys(data.dataChanges).forEach(cameraSn => {
        const violationData = data.dataChanges[cameraSn];
        console.log(`📷 Camera ${cameraSn} violations:`, violationData);
        
        // Calculate total violations for this camera
        let cameraViolationCount = 0;
        Object.keys(violationData).forEach(violationType => {
          const count = violationData[violationType];
          cameraViolationCount += count;
          totalNewViolations += count;
          console.log(`  ⚠️ ${violationType}: +${count}`);
        });
        
        // Update camera location on map
        const location = this.cameraLocations.find(loc => 
          loc.cameraSn === cameraSn || loc.cameraCode === cameraSn
        );
        if (location) {
          location.totalTrafficViolation = (location.totalTrafficViolation || 0) + cameraViolationCount;
          if (location.type === 'TRAFFIC') {
            location.count = (location.totalTrafficDetected || 0) + location.totalTrafficViolation;
          }
          console.log(`📍 Updated camera ${cameraSn} violations to ${location.totalTrafficViolation}`);
        }
        
        // Update camera in cameras list
        const camera = this.cameras.find(cam => cam.sn === cameraSn);
        if (camera) {
          camera.totalTrafficViolation = (camera.totalTrafficViolation || 0) + cameraViolationCount;
          camera.eventCount = camera.category === 'TRAFFIC'
            ? (camera.totalTrafficDetected || 0) + camera.totalTrafficViolation
            : camera.eventCount;
        }
      });
      
      // Update summary card
      if (totalNewViolations > 0) {
        const card = this.summaryCards.find(c => c.title === 'Vi phạm giao thông');
        if (card) {
          card.value = (card.value || 0) + totalNewViolations;
          console.log(`📊 Updated total violations to ${card.value}`);
        }
      }
    }
    
    // Handle direct format (legacy)
    if (data.totalTrafficViolation !== undefined) {
      const card = this.summaryCards.find(c => c.title === 'Vi phạm giao thông');
      if (card) {
        card.value = data.totalTrafficViolation;
      }
    }
    
    // Update specific camera (legacy)
    if (data.cameraSn && data.totalTrafficViolation !== undefined) {
      const location = this.cameraLocations.find(loc => loc.cameraSn === data.cameraSn);
      if (location) {
        location.totalTrafficViolation = data.totalTrafficViolation;
        if (location.type === 'TRAFFIC') {
          location.count = (location.totalTrafficDetected || 0) + data.totalTrafficViolation;
        }
      }
    }
  }
  
  private handleHomepageDashboard(data: any): void {
    // Handle homepage dashboard real-time updates
    console.log('📊 Homepage Dashboard Update:', data);
    
    // Update all summary cards if data is available
    if (data.totalPersonDetected !== undefined) {
      const personCard = this.summaryCards.find(c => c.title === 'Phát hiện người');
      if (personCard) {
        personCard.value = data.totalPersonDetected;
      }
    }
    
    if (data.totalTrafficDetected !== undefined) {
      const trafficCard = this.summaryCards.find(c => c.title === 'Phát hiện giao thông');
      if (trafficCard) {
        trafficCard.value = data.totalTrafficDetected;
      }
    }
    
    if (data.totalTrafficViolation !== undefined) {
      const violationCard = this.summaryCards.find(c => c.title === 'Vi phạm giao thông');
      if (violationCard) {
        violationCard.value = data.totalTrafficViolation;
      }
    }
    
    // If locations data is provided, update camera locations and list
    if (data.locations && Array.isArray(data.locations)) {
      this.updateCameraLocations(data.locations);
      this.extractCamerasFromLocations(data.locations);
    }
  }
}
