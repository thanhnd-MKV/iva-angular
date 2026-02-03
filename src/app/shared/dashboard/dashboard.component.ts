import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponentShare implements OnInit, OnDestroy {
  
  // Filter state
  selectedCategoryFilter = '';
  selectedStatusFilter = '';
  selectedLocationFilter = '';
  selectedCameraFilter = '';
  cameraSearchText = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  
  // Dropdown states
  showCategoryFilter = false;
  showStatusFilter = false;
  showLocationFilter = false;
  showCameraFilter = false;
  
  // Filter options
  locationOptions: LocationOption[] = [];
  
  // Camera list data
  cameras: any[] = [];
  filteredCameras: any[] = [];
  totalCameras = 0;
  loadingCameras = false;
  selectedCameraCode: string | null = null; // Camera selected from map
  
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
    
    // Clear search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Unsubscribe from router events
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    // Cleanup SSE subscriptions
    this.disconnectAllSSE();
  }
  
  // Filter methods
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click is outside filter buttons and dropdown menus
    if (!target.closest('.filter-btn-wrapper')) {
      this.showCategoryFilter = false;
      this.showStatusFilter = false;
      this.showLocationFilter = false;
      this.showCameraFilter = false;
    }
  }
  
  toggleCategoryFilter(): void {
    this.showCategoryFilter = !this.showCategoryFilter;
    this.showStatusFilter = false;
    this.showLocationFilter = false;
    this.showCameraFilter = false;
  }
  
  toggleStatusFilter(): void {
    this.showStatusFilter = !this.showStatusFilter;
    this.showCategoryFilter = false;
    this.showLocationFilter = false;
    this.showCameraFilter = false;
  }
  
  toggleLocationFilter(): void {
    this.showLocationFilter = !this.showLocationFilter;
    this.showCategoryFilter = false;
    this.showStatusFilter = false;
    this.showCameraFilter = false;
  }

  toggleCameraFilter(): void {
    this.showCameraFilter = !this.showCameraFilter;
    this.showCategoryFilter = false;
    this.showStatusFilter = false;
    this.showLocationFilter = false;
  }
  
  selectCategoryFilter(value: string): void {
    this.selectedCategoryFilter = value;
    this.showCategoryFilter = false;
    this.loadCameraList();
  }
  
  selectStatusFilter(value: string): void {
    this.selectedStatusFilter = value;
    this.showStatusFilter = false;
    this.loadCameraList();
  }
  
  selectLocationFilter(value: string): void {
    this.selectedLocationFilter = value;
    this.showLocationFilter = false;
    this.loadCameraList();
  }

  selectCameraFilter(value: string): void {
    this.selectedCameraFilter = value;
    this.showCameraFilter = false;
    this.loadCameraList();
  }

  getCameraFilterLabel(): string {
    if (this.selectedCameraFilter) {
      const camera = this.cameras.find(c => c.sn === this.selectedCameraFilter);
      return camera ? (camera.cameraName || camera.sn) : 'Tất cả';
    }
    return 'Tất cả';
  }

  onCameraSelectedFromMap(cameraCode: string): void {
    console.log('📍 Camera selected from map:', cameraCode);
    this.selectedCameraCode = cameraCode;
    
    // Scroll to selected camera
    setTimeout(() => {
      const cameraElement = document.querySelector('.camera-card.camera-selected');
      if (cameraElement) {
        cameraElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  onInfoWindowClosed(): void {
    console.log('❌ Info window closed, clearing selection');
    this.selectedCameraCode = null;
  }
  
  onCameraSearch(): void {
    // Debounce search - call API after user stops typing
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadCameraList();
    }, 500);
  }

  private searchTimeout: any;
  
  getCategoryFilterLabel(): string {
    if (this.selectedCategoryFilter === 'TRAFFIC') return 'Trạng thái: Giao thông';
    if (this.selectedCategoryFilter === 'PERSON') return 'Trạng thái: Đối tượng người';
    if (this.selectedCategoryFilter === 'FACE') return 'Trạng thái: Nhận diện khuôn mặt';
    return 'Trạng thái: Tất cả';
  }
  
  getStatusFilterLabel(): string {
    if (this.selectedStatusFilter === 'online') return 'Online';
    if (this.selectedStatusFilter === 'offline') return 'Offline';
    return 'Trạng thái';
  }
  
  getLocationFilterLabel(): string {
    return this.selectedLocationFilter || 'Khu vực';
  }
  
  filterCameras(): void {
    // Backend now handles filtering, so we just reload data from API
    this.loadCameraList();
  }
  
  clearFilters(): void {
    this.selectedCategoryFilter = '';
    this.selectedStatusFilter = '';
    this.selectedLocationFilter = '';
    this.selectedCameraFilter = '';
    this.cameraSearchText = '';
    this.startDate = null;
    this.endDate = null;
    this.loadCameraList();
  }
  
  hasActiveFilters(): boolean {
    return !!(this.selectedCategoryFilter || 
           this.selectedStatusFilter || 
           this.selectedLocationFilter || 
           this.selectedCameraFilter ||
           this.cameraSearchText ||
           this.startDate ||
           this.endDate);
  }

  onDateRangeSelected(event: { startDate: Date, endDate: Date }): void {
    this.startDate = event.startDate;
    this.endDate = event.endDate;
    console.log('📅 Date range selected:', { startDate: this.startDate, endDate: this.endDate });
  }

  onDateRangeCleared(): void {
    this.startDate = null;
    this.endDate = null;
    console.log('📅 Date range cleared');
  }
  
  // Load camera list
  private loadCameraList(): void {
    console.log('📡 loadCameraList() - Starting to call getHomepageStats API...');
    this.loadingCameras = true;
    
    // Build filter params for backend
    const params: any = {};
    
    if (this.selectedCategoryFilter) {
      params.category = this.selectedCategoryFilter;
    }
    
    if (this.selectedStatusFilter) {
      params.status = this.selectedStatusFilter;
    }
    
    if (this.selectedLocationFilter) {
      params.location = this.selectedLocationFilter;
    }
    
    if (this.cameraSearchText) {
      params.cameraSn = this.cameraSearchText;
    }
    
    if (this.startDate) {
      params.startDate = this.startDate.toISOString();
    }
    
    if (this.endDate) {
      params.endDate = this.endDate.toISOString();
    }
    
    console.log('🌐 Calling API: /api/admin/events/stats/homepage with params:', params);
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
    const newLocations: any[] = [];
    const coordMap = new Map<string, number>(); // Track duplicate coordinates
    
    locations.forEach((location: any) => {
      if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
        location.cameraInfo.forEach((camera: any) => {
          if (camera.latitude && camera.longitude) {
            // Calculate badge count based on camera type:
            // TRAFFIC camera: show totalTrafficDetected (lưu lượng giao thông)
            // PERSON camera: show totalPersonDetected (phát hiện người)
            // FACE camera: show faceRecognition (nhận diện khuôn mặt)
            // Note: Vi phạm (totalTrafficViolation) hiển thị trong InfoWindow, KHÔNG phải badge count
            let count = 0;
            if (camera.cameraType === 'TRAFFIC') {
              count = camera.totalTrafficDetected || 0;
            } else if (camera.cameraType === 'PERSON') {
              count = camera.totalPersonDetected || 0;
            } else if (camera.cameraType === 'FACE') {
              count = camera.faceRecognition || 0;
            }
            
            // FIX DUPLICATE GPS: Apply small offset for duplicate coordinates
            let lat = camera.latitude;
            let lng = camera.longitude;
            const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            
            if (coordMap.has(coordKey)) {
              // Duplicate detected! Apply offset (0.0001° ≈ 11 meters)
              const offsetCount = coordMap.get(coordKey)!;
              lat += offsetCount * 0.0001;  // Move slightly north
              lng += offsetCount * 0.0001;  // Move slightly east
              coordMap.set(coordKey, offsetCount + 1);
              console.warn(`⚠️ Duplicate GPS fixed: ${camera.cameraSn} offset by ${offsetCount * 11}m from ${coordKey}`);
            } else {
              coordMap.set(coordKey, 1);
            }
            
            const cameraLocation = {
              name: camera.address || camera.cameraName || location.location,
              cameraSn: camera.cameraSn,
              cameraCode: camera.cameraSn,
              lat: lat,
              lng: lng,
              count: count,
              type: camera.cameraType,
              address: camera.address || location.location,
              totalPersonDetected: camera.totalPersonDetected || 0,
              totalTrafficDetected: camera.totalTrafficDetected || 0,
              totalTrafficViolation: camera.totalTrafficViolation || 0,
              faceRecognition: camera.faceRecognition || 0,
              totalIn: camera.totalPersonDetected || 0,
              totalOut: camera.totalTrafficDetected || 0,
              locationName: location.location
            };
            
            newLocations.push(cameraLocation);
            
            // Debug log for specific camera
            if (camera.cameraSn === 'ACVN248240000046') {
              console.log('🎯 Found ACVN248240000046:', {
                type: camera.cameraType,
                lat: camera.latitude,
                lng: camera.longitude,
                count: count,
                traffic: camera.totalTrafficDetected,
                violation: camera.totalTrafficViolation,
                person: camera.totalPersonDetected,
                face: camera.faceRecognition,
                location: location.location
              });
            }
          }
        });
      }
    });
    
    // Use spread operator to create new array reference for OnPush change detection
    this.cameraLocations = [...newLocations];
    
    console.log('📍 Updated camera locations:', this.cameraLocations.length);
    console.log('📍 TRAFFIC cameras:', this.cameraLocations.filter(c => c.type === 'TRAFFIC').length);
    console.log('📍 PERSON cameras:', this.cameraLocations.filter(c => c.type === 'PERSON').length);
    console.log('📍 FACE cameras:', this.cameraLocations.filter(c => c.type === 'FACE').length);
    
    // Log detailed camera info including count/badge values
    console.log('📍 Detailed camera info with badge counts:');
    this.cameraLocations.forEach((cam, index) => {
      console.log(`  [${index}] ${cam.cameraSn} (${cam.type}):`, {
        lat: cam.lat.toFixed(6),
        lng: cam.lng.toFixed(6),
        badgeCount: cam.count,
        totalPersonDetected: cam.totalPersonDetected,
        totalTrafficDetected: cam.totalTrafficDetected,
        totalTrafficViolation: cam.totalTrafficViolation,
        faceRecognition: cam.faceRecognition,
        location: cam.locationName,
        address: cam.address
      });
    });
    
    // Log all camera coordinates after duplicate fix
    console.log('📍 All camera coordinates (after duplicate GPS fix):');
    this.cameraLocations.forEach((cam, index) => {
      console.log(`  [${index}] ${cam.cameraSn} (${cam.type}): ${cam.lat.toFixed(6)}, ${cam.lng.toFixed(6)} | count: ${cam.count} | name: ${cam.name}`);
    });
    
    console.log('📍 Total cameras:', this.cameraLocations.length);
    console.log('✅ All cameras ready to display on map with unique GPS positions');
  }

  exportReport(): void {
    console.log('Exporting report...');
    // Implement export functionality
  }
  
  // Camera list methods
  private extractCamerasFromLocations(locations: any[]): void {
    const newCameras: any[] = [];
    const locationSet = new Set<string>();
    
    locations.forEach((location: any) => {
      if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
        location.cameraInfo.forEach((camera: any) => {
          // Calculate event count based on camera type:
          // TRAFFIC camera: show totalTrafficDetected (lưu lượng giao thông)
          // PERSON camera: show totalPersonDetected (phát hiện người)
          // FACE camera: show faceRecognition (nhận diện khuôn mặt)
          // Note: Vi phạm (totalTrafficViolation) hiển thị riêng trong InfoWindow
          let eventCount = 0;
          if (camera.cameraType === 'TRAFFIC') {
            eventCount = camera.totalTrafficDetected || 0;
          } else if (camera.cameraType === 'PERSON') {
            eventCount = camera.totalPersonDetected || 0;
          } else if (camera.cameraType === 'FACE') {
            eventCount = camera.faceRecognition || 0;
          }
          
          const cameraData = {
            id: camera.cameraSn,
            sn: camera.cameraSn,
            name: camera.address || camera.cameraName || location.location,
            category: camera.cameraType,
            connectionStatus: camera.connectionStatus !== undefined ? camera.connectionStatus : 1,
            location: location.location,
            address: camera.address || location.location,
            latitude: camera.latitude,
            longitude: camera.longitude,
            eventCount: eventCount,
            totalPersonDetected: camera.totalPersonDetected || 0,
            totalTrafficDetected: camera.totalTrafficDetected || 0,
            totalTrafficViolation: camera.totalTrafficViolation || 0,
            faceRecognition: camera.faceRecognition || 0
          };
          
          newCameras.push(cameraData);
          
          // Debug log for specific camera
          if (camera.cameraSn === 'ACVN248240000046') {
            console.log('🎯 Extracted ACVN248240000046 to cameras list:', {
              category: cameraData.category,
              eventCount: cameraData.eventCount,
              lat: cameraData.latitude,
              lng: cameraData.longitude
            });
          }
        });
      }
    });
    
    // Use spread operator to create new array reference
    this.cameras = [...newCameras];
    this.totalCameras = this.cameras.length;
    // Backend already filtered, so set filteredCameras directly
    this.filteredCameras = [...newCameras];
    
    console.log('📷 Extracted cameras from locations:', this.totalCameras);
    console.log('📷 TRAFFIC cameras:', this.cameras.filter(c => c.category === 'TRAFFIC').length);
    console.log('📷 PERSON cameras:', this.cameras.filter(c => c.category === 'PERSON').length);
    console.log('📷 FACE cameras:', this.cameras.filter(c => c.category === 'FACE').length);
  }
  
  getCategoryIcon(category: string): string {
    return category === 'PERSON' ? 'person' : 'directions_car';
  }
  
  getCategoryLabel(category: string): string {
    if (category === 'PERSON') return 'Đối tượng người';
    if (category === 'TRAFFIC') return 'Giao thông';
    if (category === 'FACE') return 'Nhận diện khuôn mặt';
    return category;
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
          // Update count: PERSON shows totalPersonDetected, TRAFFIC shows totalTrafficDetected only
          location.count = location.type === 'TRAFFIC' 
            ? location.totalTrafficDetected
            : location.totalPersonDetected;
          console.log(`📍 Updated camera ${cameraSn} traffic to ${location.totalTrafficDetected}`);
        }
        
        // Update camera in cameras list
        const camera = this.cameras.find(cam => cam.sn === cameraSn);
        if (camera) {
          camera.totalTrafficDetected = (camera.totalTrafficDetected || 0) + cameraTrafficCount;
          // Update eventCount: PERSON shows totalPersonDetected, TRAFFIC shows totalTrafficDetected only
          camera.eventCount = camera.category === 'TRAFFIC'
            ? camera.totalTrafficDetected
            : camera.totalPersonDetected;
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
        // Update count: TRAFFIC shows totalTrafficDetected only
        location.count = location.type === 'TRAFFIC' 
          ? data.totalTrafficDetected
          : location.totalPersonDetected;
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
          // Count doesn't include violations - keep existing count
          console.log(`📍 Updated camera ${cameraSn} violations to ${location.totalTrafficViolation}`);
        }
        
        // Update camera in cameras list
        const camera = this.cameras.find(cam => cam.sn === cameraSn);
        if (camera) {
          camera.totalTrafficViolation = (camera.totalTrafficViolation || 0) + cameraViolationCount;
          // eventCount doesn't include violations - keep existing eventCount
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
        // Count doesn't include violations
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
