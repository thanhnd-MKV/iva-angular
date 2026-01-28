import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { MapMarkerService, MarkerType, ZoomLevel, ClusterMarker } from '../../shared/services/map-marker.service';

interface MarkerData {
  position: google.maps.LatLngLiteral;
  label: string;
  count: number;
  level: 'country' | 'city' | 'district' | 'camera' | 'aggregate';
  id: string;
  area?: string;
  cameraCode?: string;
  address?: string; // Địa chỉ camera từ API
}

interface CameraLocation {
  lat: number;
  lng: number;
  name: string;
  count: number;
  cameraCode: string;
  address: string;                         // Địa chỉ camera từ API
  violationCount?: number;                // totalTrafficViolation từ API (deprecated, use totalTrafficViolation)
  totalTrafficViolation?: number;         // Tổng vi phạm giao thông từ API (cho TRAFFIC camera)
  totalTrafficDetected?: number;          // Tổng phương tiện từ API
  totalPersonDetected?: number;           // Tổng người phát hiện từ API (cho PERSON camera)
  faceRecognition?: number;               // Tổng khuôn mặt nhận diện từ API (cho FACE camera)
  cameraType?: 'TRAFFIC' | 'PERSON' | 'FACE'; // Loại camera từ API (deprecated, use type)
  type?: 'TRAFFIC' | 'PERSON' | 'FACE';   // Loại camera từ API
}

@Component({
  selector: 'app-traffic-flow-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="map-container">
      <div class="loading-container" *ngIf="isLoading">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
          </div>
          <div class="loading-text">
            <span class="loading-title">Đang tải bản đồ</span>
            <div class="loading-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>
      
      <google-map 
        #map
        [height]="'100%'"
        [width]="'100%'"
        [center]="center"
        [zoom]="zoom"
        [options]="mapOptions"
        (mapInitialized)="onMapInitialized()"
        (zoomChanged)="onZoomChanged()">
        
        <!-- Markers - Only render when fully prepared -->
        <ng-container *ngIf="markersReady">
          <ng-container *ngFor="let marker of visibleMarkers; let i = index; trackBy: trackByMarkerId">
            <!-- Debug: Log every marker render attempt -->
            {{ logMarkerRender(marker, i) }}
            <map-marker 
              *ngIf="marker.position && isFinite(marker.position.lat) && isFinite(marker.position.lng)"
              [position]="marker.position"
              [options]="getMarkerOptions(marker)"
              [title]="marker.label"
              (mapClick)="onMarkerClick(marker, i)">
            </map-marker>
          </ng-container>
        </ng-container>
        
        <!-- Info Window -->
        <map-info-window #infoWindow>
          <div class="info-window-content" *ngIf="selectedMarker">
            <div class="info-header">
              <h4 class="info-title">{{ selectedMarker.area || selectedMarker.label }}</h4>
              <button class="traffic-icon-btn">
                <img src="assets/icon/cameraIcon.svg" alt="Camera" class="icon-img">
                <span>{{ getCameraTypeLabel(selectedMarker) }}</span>
              </button>
            </div>
            <div class="info-details">
              <div class="info-row">
                <img src="assets/icon/carIcon.svg" alt="Car" class="info-icon-img">
                <span class="info-label">{{ getCountLabel(selectedMarker) }}:</span>
                <span class="info-value">{{ getTrafficCount(selectedMarker) | number }}</span>
              </div>
              <div class="info-row" *ngIf="isTrafficCamera(selectedMarker)">
                <img src="assets/icon/warningIcon.svg" alt="Warning" class="info-icon-img">
                <span class="info-label">Tổng số vi phạm:</span>
                <span class="info-value">{{ getViolationCount(selectedMarker) | number }}</span>
              </div>
              <div class="info-row" *ngIf="getAddress(selectedMarker)">
                <img src="assets/icon/locationIcon.svg" alt="Location" class="info-icon-img">
                <a [href]="getGoogleMapsLink(selectedMarker)" target="_blank" class="info-address">
                  {{ getAddress(selectedMarker) }}
                </a>
              </div>
            </div>
          </div>
        </map-info-window>
      </google-map>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: calc(100% );
      position: relative;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .loading-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.9);
      z-index: 10;
    }
    
    .loading-content {
      text-align: center;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 12px;
      height: 32px;
    }
    
    .spinner-ring {
      width: 24px;
      height: 24px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2196F3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      color: #666;
    }
    
    .loading-title {
      font-size: 14px;
      font-weight: 500;
      color: #666;
      margin: 0;
    }
    
    .loading-dots {
      display: inline-block;
      margin-left: 4px;
    }
    
    .dot {
      display: inline-block;
      width: 4px;
      height: 4px;
      background: #666;
      border-radius: 50%;
      margin: 0 1px;
      animation: bounce 1.4s ease-in-out both infinite;
    }
    
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    .dot:nth-child(3) { animation-delay: 0s; }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes bounce {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
    }
    
    .info-window-content {
      padding: 16px;
      min-width: 280px;
      max-width: 350px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .traffic-icon-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .traffic-icon-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }
    
    .traffic-icon-btn .icon-img {
      width: 16px;
      height: 16px;
    }
    
    .info-icon-img {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    
    .info-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      border: none;
    }
    
    .info-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    
    .info-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 400;
      flex: 0 0 auto;
    }
    
    .info-value {
      font-size: 14px;
      color: #111827;
      font-weight: 600;
      margin-left: auto;
    }
    
    .info-address {
      font-size: 13px;
      color: #3b82f6;
      text-decoration: underline;
      cursor: pointer;
      flex: 1;
    }
  `]
})
export class TrafficFlowMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  
  private readonly BADGE_STYLE = {
    fontSize: 9,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    height: 18,             
    horizontalPadding: 6,   
    borderRadius: 9,        // Bo góc badge (bằng height/2 để tròn hoàn toàn)
    backgroundColor: '#EF4444', // Màu đỏ
    textColor: '#FFFFFF',       // Màu trắng
    borderColor: '#FFFFFF',     // Viền trắng
    borderWidth: 1,
    offsetX: 3, // Khoảng cách từ cạnh phải icon
    offsetY: 1  // Khoảng cách từ cạnh trên icon (giảm giá trị = đẩy lên cao hơn)
  };
  
  @ViewChild('map') mapElement!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
  @ViewChildren(MapMarker) markerElements!: QueryList<MapMarker>;
  
  @Input() cameraLocations: CameraLocation[] = [];
  @Input() mapCenter?: google.maps.LatLngLiteral; // Optional external center control
  @Input() mapZoom?: number; // Optional external zoom control

  isLoading = true;
  markersReady = false; // Flag to track if markers are fully prepared and ready to render
  center: google.maps.LatLngLiteral = { lat: 15.6, lng: 107.0 }; // Default center
  zoom = 10; // Default zoom - Start at MEDIUM level to show individual cameras
  
  selectedMarker: MarkerData | null = null;
  selectedMarkerIndex: number = -1;
  visibleMarkers: MarkerData[] = [];
  
  private zoomChangeTimeout: any;
  private markerOptionsCache = new Map<string, google.maps.MarkerOptions>();
  private loadedMarkerIcons = new Map<MarkerType, string>();
  private badgeIconCache = new Map<string, string>(); // Cache for icon+badge composites
  private markersCache = new Map<ZoomLevel, MarkerData[]>(); // Cache markers by zoom level to prevent rebuilding
  
  // Hierarchical data arrays
  private countryLevelData: MarkerData[] = [];
  private cityLevelData: MarkerData[] = [];
  private districtLevelData: MarkerData[] = [];
  private cameraLevelData: MarkerData[] = []; // Area groups from parent
  private individualCameras: MarkerData[] = []; // Individual cameras for high zoom
  private clusterMarkers: ClusterMarker[] = []; // Clustered markers for low zoom
  
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 18,
    minZoom: 5,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private mapMarkerService: MapMarkerService
  ) {
    // Validate initial center
    if (!isFinite(this.center.lat) || !isFinite(this.center.lng)) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid initial center, resetting to default');
      this.center = { lat: 15.6, lng: 107.0 };
    }
    
    if (!isFinite(this.zoom) || this.zoom < 5 || this.zoom > 18) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid initial zoom, resetting to default');
      this.zoom = 10;
    }
    
    console.log('🗺️ [TrafficFlowMapComponent] Constructor - Initial center:', this.center, 'zoom:', this.zoom);
  }

  ngOnInit() {
    console.log('🗺️ [TrafficFlowMapComponent] ngOnInit - Initial cameraLocations:', this.cameraLocations?.length || 0);
    // Don't call initializeMap here, wait for AfterViewInit and data
  }

  ngAfterViewInit() {
    console.log('🗺️ [TrafficFlowMapComponent] ngAfterViewInit - Map ready, cameraLocations:', this.cameraLocations?.length || 0);
    // Initialize map after view is ready
    this.initializeMap();
  }

  /**
   * Initialize map with proper sequence
   */
  private async initializeMap() {
    try {
      console.log('🗺️ [TrafficFlowMapComponent] Initializing map...');
      
      // 1. Preload icons first
      await this.preloadMarkerIcons();
      
      // 2. Convert camera data if available and prepare all markers
      if (this.cameraLocations && this.cameraLocations.length > 0) {
        await this.prepareAllMarkersBeforeRender();
      } else {
        // 3. Hide loading state even if no data
        this.isLoading = false;
        this.cdr.detectChanges();
      }
      
      console.log('✅ Map initialization complete');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Preload all marker icons for the map
   */
  private async preloadMarkerIcons() {
    try {
      console.log('📍 Preloading map marker icons...');
      await this.mapMarkerService.preloadAllMarkers();
      
      // Cache marker icon URLs for quick access - all 3 zoom levels
      const iconTypes = [
        MarkerType.EVENT_CLUSTER_ZOOM0,  // LOW zoom
        MarkerType.CAMERA_MAP,            // MEDIUM zoom
        MarkerType.CAMERA                 // HIGH zoom
      ];
      
      iconTypes.forEach(type => {
        const iconUrl = this.mapMarkerService.getCachedIcon(type);
        if (iconUrl) {
          this.loadedMarkerIcons.set(type, iconUrl);
          console.log(`✅ Cached icon for ${type}:`, iconUrl.substring(0, 50) + '...');
        } else {
          console.warn(`⚠️ Failed to cache icon for ${type}`);
        }
      });
      
      console.log('✅ Map marker icons preloaded. Total cached:', this.loadedMarkerIcons.size);
    } catch (error) {
      console.error('❌ Error preloading marker icons:', error);
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Handle external center/zoom changes from parent
    if (changes['mapCenter'] && this.mapCenter) {
      console.log('🗺️ [TrafficFlowMapComponent] Map center changed:', this.mapCenter);
      
      // Validate center before applying
      if (this.mapCenter && 
          typeof this.mapCenter.lat === 'number' && isFinite(this.mapCenter.lat) && 
          typeof this.mapCenter.lng === 'number' && isFinite(this.mapCenter.lng)) {
        this.center = { ...this.mapCenter };
      } else {
        console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid mapCenter from parent:', this.mapCenter);
      }
    }
    
    if (changes['mapZoom'] && this.mapZoom !== undefined) {
      console.log('🗺️ [TrafficFlowMapComponent] Map zoom changed:', this.mapZoom);
      
      // Validate zoom (allow 1-18)
      if (typeof this.mapZoom === 'number' && isFinite(this.mapZoom) && this.mapZoom >= 1 && this.mapZoom <= 18) {
        this.zoom = this.mapZoom;
      } else {
        console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid mapZoom from parent:', this.mapZoom);
      }
    }
    
    if (changes['cameraLocations']) {
      const currentValue = changes['cameraLocations'].currentValue;
      const previousValue = changes['cameraLocations'].previousValue;
      
      console.log('🗺️ [TrafficFlowMapComponent] ========== Camera locations INPUT changed ==========');
      console.log('🗺️ [TrafficFlowMapComponent] Previous count:', previousValue?.length || 0);
      console.log('🗺️ [TrafficFlowMapComponent] Current count:', currentValue?.length || 0);
      
      if (currentValue && currentValue.length > 0) {
        console.log('🗺️ [TrafficFlowMapComponent] Received camera data:', currentValue.map((loc: any, i: number) => ({
          index: i,
          lat: loc.lat,
          lng: loc.lng,
          latType: typeof loc.lat,
          lngType: typeof loc.lng,
          latIsNaN: isNaN(loc.lat),
          lngIsNaN: isNaN(loc.lng),
          latIsFinite: isFinite(loc.lat),
          lngIsFinite: isFinite(loc.lng),
          name: loc.name,
          count: loc.count
        })));
        
        // ===== NEW: Log full camera data including cameraCode and counts =====
        console.log('📍 [TrafficFlowMap] FULL camera data received from parent:');
        currentValue.forEach((loc: any, i: number) => {
          console.log(`  [${i}] ${loc.cameraCode} (${loc.type}):`, {
            lat: loc.lat,
            lng: loc.lng,
            count: loc.count,
            totalTrafficDetected: loc.totalTrafficDetected,
            totalTrafficViolation: loc.totalTrafficViolation,
            totalPersonDetected: loc.totalPersonDetected,
            faceRecognition: loc.faceRecognition,
            address: loc.address
          });
        });
        
        // Special debug for ACVN248240000046
        const targetCamera = currentValue.find((loc: any) => loc.cameraCode === 'ACVN248240000046');
        if (targetCamera) {
          console.log('🎯🎯🎯 Found ACVN248240000046 in received data:', {
            cameraCode: targetCamera.cameraCode,
            type: targetCamera.type,
            count: targetCamera.count,
            totalTrafficDetected: targetCamera.totalTrafficDetected,
            totalTrafficViolation: targetCamera.totalTrafficViolation,
            lat: targetCamera.lat,
            lng: targetCamera.lng,
            address: targetCamera.address
          });
        } else {
          console.warn('❌ ACVN248240000046 NOT FOUND in received data!');
        }
        // ===== END NEW =====
        
        // Check for invalid data from parent
        const invalidInputs = currentValue.filter((loc: any) => 
          !loc.lat || !loc.lng || 
          !isFinite(loc.lat) || isNaN(loc.lat) || 
          !isFinite(loc.lng) || isNaN(loc.lng)
        );
        
        if (invalidInputs.length > 0) {
          console.error('🗺️ [TrafficFlowMapComponent] ❌❌❌ PARENT SENT INVALID DATA!', invalidInputs);
        }
      } else {
        console.log('🗺️ [TrafficFlowMapComponent] ⚠️ No camera data received or empty array');
      }
      
      // Only process if data actually changed
      if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        console.log('🗺️ [TrafficFlowMapComponent] Processing camera location changes...');
        
        // Clear ALL caches including markers cache to force rebuild with new data
        this.markerOptionsCache.clear();
        this.badgeIconCache.clear();
        this.markersCache.clear(); // ✅ Clear markers cache to force rebuild with new counts
        
        console.log('🗺️ [TrafficFlowMapComponent] ✅ Cleared all caches (marker options, badge icons, markers)');
        
        // Reset markers ready flag
        this.markersReady = false;
        
        // If icons are already loaded, prepare for rendering
        if (this.loadedMarkerIcons.size > 0) {
          // First auto-zoom if needed, THEN prepare markers
          if (!this.mapCenter && !this.mapZoom && this.cameraLocations && this.cameraLocations.length > 0) {
            console.log('🗺️ Auto-zooming to cameras FIRST, then will prepare markers...');
            this.autoZoomToCameras();
            // Wait for zoom to complete before preparing markers
            setTimeout(() => {
              console.log('🗺️ Auto-zoom complete, now preparing markers for final zoom level...');
              this.prepareAllMarkersBeforeRender();
            }, 800); // Wait for zoom animation + bounds adjustment
          } else {
            // No auto-zoom needed, prepare markers immediately
            this.prepareAllMarkersBeforeRender();
          }
        } else {
          // Icons not loaded yet, initialize map now
          console.log('🗺️ [TrafficFlowMapComponent] Icons not loaded, initializing map...');
          this.initializeMap();
          
          // Auto-zoom after map init
          if (!this.mapCenter && !this.mapZoom && this.cameraLocations && this.cameraLocations.length > 0) {
            setTimeout(() => {
              this.autoZoomToCameras();
              // Prepare markers after zoom
              setTimeout(() => {
                this.prepareAllMarkersBeforeRender();
              }, 800);
            }, 100);
          }
        }
      }
    }
  }

  private autoZoomToCameras(): void {
    if (!this.mapElement || !this.mapElement.googleMap || this.cameraLocations.length === 0) {
      return;
    }

    console.log('🎯 Auto-zooming to cameras:', this.cameraLocations.length);

    // If only 1 camera, zoom directly to it
    if (this.cameraLocations.length === 1) {
      const camera = this.cameraLocations[0];
      const position = { lat: camera.lat, lng: camera.lng };
      
      console.log('🎯 Single camera detected, zooming to:', position);
      
      // Smooth pan and zoom to single camera location
      this.mapElement.googleMap.panTo(position);
      setTimeout(() => {
        if (this.mapElement && this.mapElement.googleMap) {
          this.mapElement.googleMap.setZoom(15); // Street level zoom
          setTimeout(() => {
            if (this.mapElement && this.mapElement.googleMap) {
              this.mapElement.googleMap.setCenter(position);
            }
          }, 300);
        }
      }, 500);
      
    } else if (this.cameraLocations.length > 1) {
      // Multiple cameras - fit bounds to show all
      const bounds = new google.maps.LatLngBounds();
      
      this.cameraLocations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      
      console.log('🎯 Multiple cameras detected, fitting bounds');
      
      // Fit bounds with padding
      this.mapElement.googleMap.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
      
      // Limit max zoom to avoid too close view
      setTimeout(() => {
        if (this.mapElement && this.mapElement.googleMap) {
          const currentZoom = this.mapElement.googleMap.getZoom();
          if (currentZoom && currentZoom > 16) {
            this.mapElement.googleMap.setZoom(16);
          }
        }
      }, 500);
    }
  }

  /**
   * Prepare all markers completely before rendering to avoid display issues
   */
  private async prepareAllMarkersBeforeRender() {
    console.log('🗺️ [prepareAllMarkersBeforeRender] ========== Starting to prepare all markers ==========');
    
    try {
      // Step 1: Convert camera locations to marker data
      console.log('📍 Step 1: Converting camera locations to markers...');
      this.convertCameraLocationsToMarkers();
      
      // Step 2: Build markers for current zoom level
      console.log('📍 Step 2: Building markers for current zoom level...');
      this.updateMarkersForZoomLevel();
      
      // Step 3: Mark as ready and hide loading
      this.markersReady = true;
      this.isLoading = false;
      
      console.log('✅ [prepareAllMarkersBeforeRender] All markers prepared and ready!');
      console.log('✅ Visible markers count:', this.visibleMarkers.length);
      
      // Step 4: Force render with markers
      this.cdr.detectChanges();
      
      // Double-check render after a tick
      setTimeout(() => {
        console.log('✅ [prepareAllMarkersBeforeRender] Second render check, visible markers:', this.visibleMarkers.length);
        this.cdr.detectChanges();
      }, 0);
      
    } catch (error) {
      console.error('❌ [prepareAllMarkersBeforeRender] Error preparing markers:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private convertCameraLocationsToMarkers() {
    try {
      if (!this.cameraLocations || this.cameraLocations.length === 0) {
        this.cameraLevelData = [];
        this.individualCameras = [];
        return;
      }
      
      // Create area group markers (for low zoom)
      const validMarkers: MarkerData[] = [];
      
      this.cameraLocations.forEach((location, index) => {
          // Parse coordinates safely
          let lat: number;
          let lng: number;
          const locationAny = location as any;
          
          // Try lat first, then latitude
          if (typeof location.lat === 'number') {
            lat = location.lat;
          } else if (typeof location.lat === 'string') {
            lat = parseFloat(location.lat);
          } else if (typeof locationAny.latitude === 'number') {
            lat = locationAny.latitude;
          } else if (typeof locationAny.latitude === 'string') {
            lat = parseFloat(locationAny.latitude);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] Invalid lat/latitude at index ${index}:`, location);
            return;
          }
          
          // Try lng first, then longitude
          if (typeof location.lng === 'number') {
            lng = location.lng;
          } else if (typeof location.lng === 'string') {
            lng = parseFloat(location.lng);
          } else if (typeof locationAny.longitude === 'number') {
            lng = locationAny.longitude;
          } else if (typeof locationAny.longitude === 'string') {
            lng = parseFloat(locationAny.longitude);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] Invalid lng/longitude at index ${index}:`, location);
            return;
          }
          
          // Validate coordinates are finite numbers
          if (!isFinite(lat) || isNaN(lat)) {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid latitude at index ${index}: ${lat}`, location);
            return;
          }
          
          if (!isFinite(lng) || isNaN(lng)) {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid longitude at index ${index}: ${lng}`, location);
            return;
          }
          
          // Check valid range
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Coordinates out of range at index ${index}: lat=${lat}, lng=${lng}`, location);
            return;
          }
          
          const marker: MarkerData = {
            position: { lat, lng },
            label: location.name || `Camera ${index + 1}`,
            count: location.count || 0,
            level: 'camera',
            id: `cam_${location.cameraCode || index}`,
            area: location.name || location.address || location.cameraCode || '', // Ưu tiên name (location chung) trước
            cameraCode: location.cameraCode || `CAM-${index + 1}`,
            address: location.address || ''
          };
          
          // Debug log for marker creation (especially ACVN248240000046)
          if (location.cameraCode === 'ACVN248240000046') {
            console.log('🎯 Created marker for ACVN248240000046:', {
              markerCameraCode: marker.cameraCode,
              markerCount: marker.count,
              markerPosition: marker.position,
              locationCameraCode: location.cameraCode,
              locationCount: location.count,
              locationTotalTrafficDetected: (location as any).totalTrafficDetected,
              locationType: (location as any).type
            });
          }
          
          validMarkers.push(marker);
      });
      
      this.cameraLevelData = validMarkers;
      console.log('📍 Created', validMarkers.length, 'camera level markers');
      
      // Log the created markers for ACVN248240000046
      const acvnMarker = validMarkers.find(m => m.cameraCode === 'ACVN248240000046');
      if (acvnMarker) {
        console.log('🎯 ACVN248240000046 marker in cameraLevelData:', acvnMarker);
      } else {
        console.warn('❌ ACVN248240000046 marker NOT FOUND in cameraLevelData!');
      }
      
      // Create individual camera markers (for high zoom)
      this.individualCameras = [];
      this.cameraLocations.forEach((location, locIndex) => {
        // Check if this location has individualCameras data
        if ((location as any).individualCameras && Array.isArray((location as any).individualCameras)) {
          // Expand grouped cameras into individual markers
          console.log(`🗺️ [TrafficFlowMapComponent] Location[${locIndex}] has ${(location as any).individualCameras.length} individual cameras`);
          
          (location as any).individualCameras.forEach((cam: any, camIndex: number) => {
            // Validate camera coordinates
            const lat = typeof cam.lat === 'number' ? cam.lat : parseFloat(cam.lat);
            const lng = typeof cam.lng === 'number' ? cam.lng : parseFloat(cam.lng);
            
            if (!isFinite(lat) || isNaN(lat) || !isFinite(lng) || isNaN(lng)) {
              console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid coordinates for individual camera ${cam.cameraSn}:`, { lat, lng });
              return;
            }
            
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              console.error(`🗺️ [TrafficFlowMapComponent] ❌ Coordinates out of range for camera ${cam.cameraSn}:`, { lat, lng });
              return;
            }
            
            const individualMarker = {
              position: { lat, lng },
              label: cam.cameraSn,
              count: cam.total || 0,
              level: 'camera' as const,
              id: `individual_${cam.cameraSn}`,
              area: location.name || cam.address || location.address || cam.cameraSn, // Ưu tiên location.name ("Sân bay")
              cameraCode: cam.cameraSn,
              address: cam.address || location.address || '' // Lưu address từ cam hoặc location
            };
            
            this.individualCameras.push(individualMarker);
            
            console.log(`🗺️ [TrafficFlowMapComponent]   ✅ Individual[${camIndex}]:`, {
              sn: cam.cameraSn,
              lat: lat.toFixed(6),
              lng: lng.toFixed(6),
              total: cam.total
            });
          });
        } else {
          // Single camera - same at all zoom levels
          let lat: number;
          let lng: number;
          
          if (typeof location.lat === 'number') {
            lat = location.lat;
          } else if (typeof location.lat === 'string') {
            lat = parseFloat(location.lat);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid lat type for location[${locIndex}]:`, typeof location.lat, location);
            return;
          }
          
          if (typeof location.lng === 'number') {
            lng = location.lng;
          } else if (typeof location.lng === 'string') {
            lng = parseFloat(location.lng);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid lng type for location[${locIndex}]:`, typeof location.lng, location);
            return;
          }
          
          if (!isFinite(lat) || isNaN(lat) || !isFinite(lng) || isNaN(lng)) {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Invalid coordinates for location[${locIndex}]:`, { lat, lng, location });
            return;
          }
          
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error(`🗺️ [TrafficFlowMapComponent] ❌ Coordinates out of range for location[${locIndex}]:`, { lat, lng });
            return;
          }
          
          const individualMarker = {
            position: { lat, lng },
            label: location.name || 'Camera',
            count: location.count || 0,
            level: 'camera' as const,
            id: `individual_${location.cameraCode}`,
            area: location.name || location.address || location.cameraCode || '', // Ưu tiên location.name
            cameraCode: location.cameraCode || '',
            address: location.address || '' // Lưu address từ API
          };
          
          this.individualCameras.push(individualMarker);
          
          console.log(`🗺️ [TrafficFlowMapComponent] ✅ Single camera at location[${locIndex}]:`, {
            label: individualMarker.label,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
          });
        }
      });
      
      console.log('🗺️ [TrafficFlowMapComponent] ✅ Individual cameras created:', this.individualCameras.length);
      
      // Keep Vietnam center fixed - don't recalculate from camera positions
      // This prevents the map from centering on Cambodia when averaging Hanoi and Phu Quoc
      
      // Generate hierarchical data
      this.generateHierarchicalData();
      
      console.log('🗺️ [TrafficFlowMapComponent] ========== Hierarchical data summary ==========');
      console.log('🗺️ Country level markers:', this.countryLevelData.length);
      console.log('🗺️ City level markers:', this.cityLevelData.length);
      console.log('🗺️ District level markers:', this.districtLevelData.length);
      console.log('🗺️ Camera level markers:', this.cameraLevelData.length);
      console.log('🗺️ Individual cameras:', this.individualCameras.length);
      
    } catch (error) {
      console.error('Error converting camera locations to markers:', error);
      this.cameraLevelData = [];
    }
  }

  private generateHierarchicalData() {
    if (this.cameraLevelData.length === 0) {
      console.log('🗺️ [generateHierarchicalData] ⚠️ No camera level data to process');
      this.countryLevelData = [];
      this.cityLevelData = [];
      this.districtLevelData = [];
      return;
    }

    console.log('🗺️ [generateHierarchicalData] Processing', this.cameraLevelData.length, 'cameras');

    // Validate all camera positions before calculating averages
    const validCameras = this.cameraLevelData.filter(camera => {
      const lat = camera.position.lat;
      const lng = camera.position.lng;
      
      if (!isFinite(lat) || isNaN(lat) || !isFinite(lng) || isNaN(lng)) {
        console.error('🗺️ [generateHierarchicalData] ❌ Invalid camera position:', camera);
        return false;
      }
      
      return true;
    });

    if (validCameras.length === 0) {
      console.error('🗺️ [generateHierarchicalData] ❌ No valid cameras after filtering');
      this.countryLevelData = [];
      this.cityLevelData = [];
      this.districtLevelData = [];
      return;
    }

    // Country level: Use first camera's exact GPS (NO averaging)
    const totalCount = validCameras.reduce((sum, camera) => sum + camera.count, 0);
    const firstCamera = validCameras[0];
    
    this.countryLevelData = [{
      position: { lat: firstCamera.position.lat, lng: firstCamera.position.lng },
      label: 'Việt Nam',
      count: totalCount,
      level: 'country',
      id: 'vietnam',
      area: 'Việt Nam'
    }];

    // City level: Group cameras by regions
    const cityGroups = this.groupCamerasByRegion();
    const validCityMarkers: MarkerData[] = [];
    
    Object.entries(cityGroups).forEach(([regionName, cameras]) => {
      // Use first camera's exact GPS (NO averaging)
      const firstCameraInCity = cameras[0];
      const totalCount = cameras.reduce((sum, c) => sum + c.count, 0);
      
      validCityMarkers.push({
        position: { lat: firstCameraInCity.position.lat, lng: firstCameraInCity.position.lng },
        label: regionName,
        count: totalCount,
        level: 'city',
        id: `city_${regionName.toLowerCase().replace(/\s+/g, '_')}`,
        area: regionName
      });
    });
    
    this.cityLevelData = validCityMarkers;

    // District level: Sub-group cameras within regions
    this.districtLevelData = [];
    Object.entries(cityGroups).forEach(([regionName, cameras]) => {
      const districts = this.createDistrictClusters(cameras, regionName);
      this.districtLevelData.push(...districts);
    });
    
    console.log('🗺️ [generateHierarchicalData] ✅ Created:', {
      country: this.countryLevelData.length,
      city: this.cityLevelData.length,
      district: this.districtLevelData.length
    });
  }

  private groupCamerasByRegion(): { [key: string]: MarkerData[] } {
    const groups: { [key: string]: MarkerData[] } = {};
    
    this.cameraLevelData.forEach(camera => {
      // Validate camera position before grouping
      if (!camera.position || !isFinite(camera.position.lat) || isNaN(camera.position.lat)) {
        console.error('🗺️ [groupCamerasByRegion] ❌ Skipping camera with invalid position:', camera);
        return;
      }
      
      let regionName = 'Miền Nam'; // Default to South
      
      // More accurate region classification
      if (camera.position.lat > 16.5) {
        regionName = 'Miền Bắc';
      } else if (camera.position.lat > 14) {
        regionName = 'Miền Trung';
      } else if (camera.position.lat > 11) {
        regionName = 'Miền Nam';
      } else {
        // Special handling for southern islands like Phu Quoc
        regionName = 'Miền Nam - Đảo';
      }
      
      if (!groups[regionName]) {
        groups[regionName] = [];
      }
      groups[regionName].push(camera);
    });
    
    return groups;
  }

  private createDistrictClusters(cameras: MarkerData[], regionName: string): MarkerData[] {
    const clusterSize = Math.max(1, Math.ceil(cameras.length / 3));
    const districts: MarkerData[] = [];
    
    for (let i = 0; i < cameras.length; i += clusterSize) {
      const clusterCameras = cameras.slice(i, i + clusterSize);
      // Use first camera's exact GPS (NO averaging)
      const firstCamera = clusterCameras[0];
      const totalCount = clusterCameras.reduce((sum, c) => sum + c.count, 0);
      
      districts.push({
        position: { lat: firstCamera.position.lat, lng: firstCamera.position.lng },
        label: `${regionName} - Khu vực ${Math.floor(i / clusterSize) + 1}`,
        count: totalCount,
        level: 'district',
        id: `district_${regionName}_${i}`,
        area: `${regionName} - Khu vực ${Math.floor(i / clusterSize) + 1}`
      });
    }
    
    return districts;
  }

  onMapInitialized() {
    console.log('🗺️ Traffic Flow Map initialized successfully');
    // Map is ready but don't hide loading yet - wait for markers
    
    setTimeout(() => {
      if (this.visibleMarkers.length > 0) {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 500);
  }

  onZoomChanged() {
    if (this.zoomChangeTimeout) {
      clearTimeout(this.zoomChangeTimeout);
    }
    
    this.zoomChangeTimeout = setTimeout(() => {
      if (this.mapElement && this.mapElement.googleMap) {
        const currentZoom = this.mapElement.googleMap.getZoom();
        if (!currentZoom) {
          return;
        }
        
        if (this.zoom !== currentZoom) {
          const oldZoomLevel = this.mapMarkerService.getZoomLevel(this.zoom);
          const newZoomLevel = this.mapMarkerService.getZoomLevel(currentZoom);
          
          this.zoom = currentZoom;
          
          console.log('🔍 [onZoomChanged] Zoom changed:', this.zoom, '| Level:', newZoomLevel, '| Markers ready:', this.markersReady);
          
          // Rebuild markers khi zoom LEVEL thay đổi (LOW ↔ MEDIUM ↔ HIGH)
          if (oldZoomLevel !== newZoomLevel) {
            this.markerOptionsCache.clear();  // Clear icon cache
            this.markersCache.clear();         // Clear markers cache to force rebuild
            this.updateMarkersForZoomLevel();
          } else {
            // Cùng level, vẫn cần update để đảm bảo markers hiển thị đúng
            this.markerOptionsCache.clear();  // Update icon sizes
            this.updateMarkersForZoomLevel(); // Force update markers
          }
        }
      }
    }, 150);
  }

  private updateMarkersForZoomLevel() {
    console.log('🗺️ [TrafficFlowMapComponent] ========== Updating markers for zoom level ==========');
    console.log('🗺️ [TrafficFlowMapComponent] Current zoom:', this.zoom);
    console.log('🗺️ [TrafficFlowMapComponent] Individual cameras count:', this.individualCameras?.length || 0);
    console.log('🗺️ [TrafficFlowMapComponent] Camera level data count:', this.cameraLevelData?.length || 0);
    console.log('🗺️ [TrafficFlowMapComponent] Current visible markers:', this.visibleMarkers?.length || 0);
    
    const zoomLevel = this.mapMarkerService.getZoomLevel(this.zoom);
    console.log(`🗺️ [TrafficFlowMapComponent] Zoom Level: ${zoomLevel} (${this.zoom})`);
    
    // Check if we have data to display - use cameraLevelData as fallback
    const dataSource = this.individualCameras?.length > 0 ? this.individualCameras : this.cameraLevelData;
    
    if (!dataSource || dataSource.length === 0) {
      console.warn('🗺️ [TrafficFlowMapComponent] ⚠️ No data source available!');
      // Don't clear if we already have markers showing
      if (this.visibleMarkers.length > 0) {
        console.log('🗺️ [TrafficFlowMapComponent] No data but keeping existing markers');
        return;
      }
      this.visibleMarkers = [];
      this.cdr.detectChanges();
      return;
    }
    
    console.log('🗺️ [TrafficFlowMapComponent] ✅ Using data source with', dataSource.length, 'items');
    
    // Use the best data source available
    const camerasToUse = this.individualCameras?.length > 0 ? this.individualCameras : this.cameraLevelData;
    
    // Store previous markers count for comparison
    const previousCount = this.visibleMarkers.length;
    
    // Build new markers based on zoom level (always rebuild, no cache check)
    let newMarkers: MarkerData[] = [];
    
    // Level 1: LOW zoom (< 9) - Show regional clusters with event-total-zoom0.svg
    if (zoomLevel === ZoomLevel.LOW) {
      const gridSize = this.mapMarkerService.getClusterGridSize(this.zoom);
      const cameras = camerasToUse.map(marker => ({
        lat: marker.position.lat,
        lng: marker.position.lng,
        totalEvents: marker.count,
        count: marker.count,
        cameraCode: marker.cameraCode,
        name: marker.label,
        location: marker.area
      }));
      
      this.clusterMarkers = this.mapMarkerService.clusterCamerasByRegion(cameras, gridSize);
      
      newMarkers = this.clusterMarkers.map((cluster, index) => ({
        position: cluster.position,
        label: `${cluster.region || 'Khu vực'}`,
        count: cluster.totalEvents,
        level: 'aggregate' as const,
        id: `cluster_${index}`,
        area: cluster.region
      })).filter(marker => 
        marker.position && 
        isFinite(marker.position.lat) && 
        !isNaN(marker.position.lat) &&
        isFinite(marker.position.lng) && 
        !isNaN(marker.position.lng)
      );
    }
    // Level 2: MEDIUM zoom (9-13) - Show individual cameras with camera-map.svg  
    else if (zoomLevel === ZoomLevel.MEDIUM) {
      newMarkers = camerasToUse.filter(marker => 
        marker.position && 
        isFinite(marker.position.lat) && 
        !isNaN(marker.position.lat) &&
        isFinite(marker.position.lng) && 
        !isNaN(marker.position.lng)
      );
    }
    // Level 3: HIGH zoom (≥ 14) - Show detailed view with camera-map-marker.svg
    else {
      newMarkers = camerasToUse.filter(marker => {
        const isValid = marker.position && 
                       isFinite(marker.position.lat) && 
                       !isNaN(marker.position.lat) &&
                       isFinite(marker.position.lng) && 
                       !isNaN(marker.position.lng);
        
        if (!isValid) {
          console.error('🗺️ [updateMarkersForZoomLevel] ❌ Filtering out invalid camera marker:', marker);
        }
        
        return isValid;
      });
      
      console.log(`🗺️ [TrafficFlowMapComponent] ✅ Level 3 (HIGH): Built ${newMarkers.length} cameras with detail`);
    }
    
    // Final safety check before rendering
    const invalidMarkers = newMarkers.filter(m => 
      !m.position || !isFinite(m.position.lat) || isNaN(m.position.lat) || 
      !isFinite(m.position.lng) || isNaN(m.position.lng)
    );
    
    if (invalidMarkers.length > 0) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Removing', invalidMarkers.length, 'invalid markers before rendering');
      
      // Remove invalid markers
      newMarkers = newMarkers.filter(m => 
        m.position && isFinite(m.position.lat) && !isNaN(m.position.lat) && 
        isFinite(m.position.lng) && !isNaN(m.position.lng)
      );
    }
    
    console.log(`🗺️ [TrafficFlowMapComponent] 📍 About to set ${newMarkers.length} markers to visibleMarkers`);
    console.log(`🗺️ [TrafficFlowMapComponent] 📍 First 3 markers:`, newMarkers.slice(0, 3).map(m => ({
      id: m.id,
      lat: m.position.lat,
      lng: m.position.lng,
      count: m.count
    })));
    
    // Update visible markers (atomic swap - prevents flickering)
    this.visibleMarkers = [...newMarkers]; // Use spread to create new array reference
    
    console.log(`🗺️ [TrafficFlowMapComponent] ✅ Marker count: ${previousCount} → ${this.visibleMarkers.length}`);
    console.log(`🗺️ [TrafficFlowMapComponent] ✅ visibleMarkers array reference:`, this.visibleMarkers.length, 'items');
    
    // Log ALL markers that will be rendered (only first 5 to avoid spam)
    console.log('🗺️ [TrafficFlowMapComponent] 📍 Sample markers (first 5):', 
      this.visibleMarkers.slice(0, 5).map((m, i) => ({
        index: i,
        id: m.id,
        lat: m.position?.lat?.toFixed(6),
        lng: m.position?.lng?.toFixed(6),
        count: m.count
      }))
    );
    
    // Force change detection multiple times to ensure Angular renders the markers
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('🗺️ [TrafficFlowMapComponent] ✅ Forced second change detection');
    }, 0);
  }

  getCircleRadius(marker: MarkerData): number {
    // Validate marker position
    if (!marker.position || !isFinite(marker.position.lat) || isNaN(marker.position.lat)) {
      console.error('🗺️ [getCircleRadius] ❌ Invalid marker position:', marker);
      return 0; // Return 0 radius so circle won't be visible
    }
    
    const baseRadius: Record<MarkerData['level'], number> = {
      country: 20000,
      city: 3500,
      district: 1200,
      camera: 300,
      aggregate: 800
    };
    
    const base = baseRadius[marker.level] || 500;
    const countFactor = Math.sqrt(marker.count / 5000);
    const scaledFactor = Math.max(0.6, Math.min(2.5, countFactor));
    
    return base * scaledFactor;
  }
  
  getCircleOptions(marker: MarkerData): google.maps.CircleOptions {
    return {
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      strokeColor: '#2563eb',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      clickable: false,
      zIndex: 2
    };
  }
  
  getMarkerOptions(marker: MarkerData): google.maps.MarkerOptions {
    // Validate marker position before processing
    if (!marker.position || !isFinite(marker.position.lat) || isNaN(marker.position.lat) || 
        !isFinite(marker.position.lng) || isNaN(marker.position.lng)) {
      console.error('🗺️ [getMarkerOptions] ❌ CRITICAL: Invalid marker passed to getMarkerOptions:', {
        id: marker.id,
        label: marker.label,
        position: marker.position
      });
      
      // Return a safe default that won't be rendered (outside valid bounds)
      return {
        position: { lat: 0, lng: 0 },
        visible: false
      };
    }
    
    // Check cache
    const cacheKey = `${marker.id}_zoom_${this.zoom}`;
    if (this.markerOptionsCache.has(cacheKey)) {
      return this.markerOptionsCache.get(cacheKey)!;
    }
    
    const zoomLevel = this.mapMarkerService.getZoomLevel(this.zoom);
    const markerType = this.mapMarkerService.getMarkerTypeForZoom(this.zoom, marker.level === 'aggregate');
    
    let icon: google.maps.Icon | undefined;
    let label: google.maps.MarkerLabel | undefined;
    
    // Get marker icon based on zoom level
    const iconUrl = this.loadedMarkerIcons.get(markerType);
    
    if (iconUrl) {
      // Always use custom icon from service
      const size = zoomLevel === ZoomLevel.LOW ? 
        this.mapMarkerService.getScaledMarkerSize(markerType, marker.count, this.getMaxEventCount()) :
        this.mapMarkerService.getDefaultSize(markerType);
      
      // For MEDIUM and HIGH zoom, create composite icon with badge (only if count > 0)
      if ((zoomLevel === ZoomLevel.MEDIUM || zoomLevel === ZoomLevel.HIGH) && marker.count > 0) {
        const displayCount = marker.count.toString();
        const compositeIconUrl = this.createIconWithBadge(iconUrl, displayCount, size);
        
        icon = {
          url: compositeIconUrl,
          scaledSize: new google.maps.Size(size.width, size.height + 20), // Add extra height for badge above icon
          anchor: new google.maps.Point(size.width / 2, size.height + 10) // Anchor at bottom center of pin
        };
      } else {
        // LOW zoom or count = 0 - no badge, just icon
        icon = {
          url: iconUrl,
          scaledSize: new google.maps.Size(size.width, size.height),
          anchor: new google.maps.Point(size.width / 2, size.height / 2) // CENTER for circular icon
        };
      }
      
      // No text label for any zoom level (badge replaces it)
      label = undefined;
    } else {
      console.warn('⚠️ Marker icon not loaded for type:', markerType, '- Using fallback');
      // Fallback to simple marker
      icon = {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzNiODJmNiIgc3Ryb2tlPSIjMWQ0ZWQ4IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      };
      
      label = undefined;
    }
    
    const options: google.maps.MarkerOptions = {
      icon: icon,
      label: label,
      optimized: true,
      zIndex: zoomLevel === ZoomLevel.LOW ? 3 : 4
    };
    
    this.markerOptionsCache.set(cacheKey, options);
    return options;
  }
  
  /**
   * Get max event count for scaling
   */
  private getMaxEventCount(): number {
    if (this.visibleMarkers.length === 0) return 100;
    return Math.max(...this.visibleMarkers.map(m => m.count));
  }

  /**
   * Create a composite icon with badge overlay
   * Badge appears in top-right corner like the design
   */
  private createIconWithBadge(iconUrl: string, count: string, size: { width: number; height: number }): string {
    // Check cache first
    const cacheKey = `${iconUrl}_${count}_${size.width}x${size.height}`;
    if (this.badgeIconCache.has(cacheKey)) {
      return this.badgeIconCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size with extra space for badge
    canvas.width = size.width;
    canvas.height = size.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create image from icon URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Check if image is already loaded (from blob URL)
    if (img.complete || iconUrl.startsWith('blob:')) {
      img.src = iconUrl;
      
      // Wait a tick for blob to be accessible
      setTimeout(() => {
        try {
          // Draw the icon - preserve aspect ratio
          ctx.drawImage(img, 0, 0, size.width, size.height);
          
          // Use fixed height, auto width based on text
          const config = this.BADGE_STYLE;
          ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
          const textMetrics = ctx.measureText(count);
          const textWidth = textMetrics.width;
          
          const badgeHeight = config.height;
          const badgeWidth = textWidth + config.horizontalPadding * 2;
          
          const badgeX = size.width - badgeWidth / 2 - config.offsetX;
          const badgeY = badgeHeight / 2 + config.offsetY;
          
          // Badge background (rounded rectangle)
          const badgeLeft = badgeX - badgeWidth / 2;
          const badgeTop = badgeY - badgeHeight / 2;
          
          ctx.beginPath();
          ctx.roundRect(badgeLeft, badgeTop, badgeWidth, badgeHeight, config.borderRadius);
          ctx.fillStyle = config.backgroundColor;
          ctx.fill();
          ctx.strokeStyle = config.borderColor;
          ctx.lineWidth = config.borderWidth;
          ctx.stroke();
          
          // Badge text
          ctx.fillStyle = config.textColor;
          ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(count, badgeX, badgeY);
          
          // Cache the result
          const dataUrl = canvas.toDataURL('image/png');
          this.badgeIconCache.set(cacheKey, dataUrl);
          
        } catch (error) {
          console.error('Error drawing icon with badge:', error);
        }
      }, 10);
    } else {
      img.src = iconUrl;
    }
    
    // Return canvas as data URL (even if not fully drawn yet, will be cached next time)
    try {
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error creating badge icon:', error);
      return iconUrl;
    }
  }

  onMarkerClick(marker: MarkerData, index: number) {
    console.log('🖱️ Marker clicked:', {
      cameraCode: marker.cameraCode,
      label: marker.label,
      count: marker.count,
      level: marker.level,
      position: marker.position
    });
    
    // Debug: Check if this camera exists in cameraLocations
    if (marker.cameraCode) {
      const cameraData = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      console.log('🖱️ Camera data in cameraLocations:', cameraData);
      
      if (marker.cameraCode === 'ACVN248240000046') {
        console.log('🎯🎯🎯 ACVN248240000046 clicked!');
        console.log('🎯 Marker:', marker);
        console.log('🎯 Camera in cameraLocations:', cameraData);
        console.log('🎯 All cameraLocations:', this.cameraLocations);
      }
    }
    
    this.selectedMarker = marker;
    this.selectedMarkerIndex = index;
    
    setTimeout(() => {
      const markerElement = this.markerElements.toArray()[index];
      if (markerElement) {
        this.infoWindow.open(markerElement);
      }
    }, 0);
    
    // Just center the map to marker position, NO auto-zoom to prevent marker disappearing
    if (this.mapElement && this.mapElement.googleMap) {
      this.mapElement.googleMap.panTo(marker.position);
    }
  }

  /**
   * Get traffic count for marker - lookup from cameraLocations
   */
  getTrafficCount(marker: MarkerData): number {
    console.log('🔍 getTrafficCount called with marker:', {
      cameraCode: marker.cameraCode,
      label: marker.label,
      position: marker.position
    });
    
    // Find corresponding camera location data by cameraCode (exact match)
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      console.log('🔍 Found camera:', camera);
      
      if (camera) {
        // For TRAFFIC cameras, return totalTrafficDetected (lưu lượng giao thông)
        if (camera.type === 'TRAFFIC') {
          const count = camera.totalTrafficDetected || 0;
          console.log('✅ TRAFFIC camera, returning totalTrafficDetected:', count);
          return count;
        }
        // For PERSON cameras, return totalPersonDetected
        if (camera.type === 'PERSON') {
          const count = camera.totalPersonDetected || 0;
          console.log('✅ PERSON camera, returning totalPersonDetected:', count);
          return count;
        }
        // For FACE cameras, return faceRecognition (nhận diện khuôn mặt)
        if (camera.type === 'FACE') {
          const count = camera.faceRecognition || 0;
          console.log('✅ FACE camera, returning faceRecognition:', count);
          return count;
        }
        console.warn('⚠️ Unknown camera type:', camera.type);
        return 0;
      } else {
        console.warn('⚠️ Camera not found for cameraCode:', marker.cameraCode);
      }
    }
    
    // For aggregate markers (cluster/district/city), sum all cameras at this position
    const camerasAtPosition = this.cameraLocations.filter(c => 
      Math.abs(c.lat - marker.position.lat) < 0.0001 && 
      Math.abs(c.lng - marker.position.lng) < 0.0001
    );
    
    if (camerasAtPosition.length > 0) {
      return camerasAtPosition.reduce((sum, cam) => {
        if (cam.type === 'TRAFFIC') {
          return sum + (cam.totalTrafficDetected || 0);
        }
        if (cam.type === 'PERSON') {
          return sum + (cam.totalPersonDetected || 0);
        }
        if (cam.type === 'FACE') {
          return sum + (cam.faceRecognition || 0);
        }
        return sum;
      }, 0);
    }
    
    return marker.count || 0;
  }

  /**
   * Get violation count for marker - lookup from cameraLocations
   */
  getViolationCount(marker: MarkerData): number {
    // Find corresponding camera location data by cameraCode (exact match)
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      return camera?.totalTrafficViolation || 0;
    }
    
    // For aggregate markers, sum all cameras at this position
    const camerasAtPosition = this.cameraLocations.filter(c => 
      Math.abs(c.lat - marker.position.lat) < 0.0001 && 
      Math.abs(c.lng - marker.position.lng) < 0.0001
    );
    
    if (camerasAtPosition.length > 0) {
      return camerasAtPosition.reduce((sum, cam) => sum + (cam.totalTrafficViolation || 0), 0);
    }
    
    return 0;
  }

  /**
   * Get address for marker - từ marker.address hoặc lookup từ cameraLocations
   */
  getAddress(marker: MarkerData): string {
    // Ưu tiên lấy address từ marker (đã được lưu khi convert)
    if (marker.address) return marker.address;
    
    // Fallback: lookup từ cameraLocations nếu có cameraCode
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      if (camera?.address) return camera.address;
    }
    
    // Cuối cùng dùng area
    return marker.area || '';
  }

  /**
   * Check if marker is a traffic camera
   */
  isTrafficCamera(marker: MarkerData): boolean {
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      return camera?.type === 'TRAFFIC';
    }
    
    // For aggregate markers, check if any camera at this position is TRAFFIC
    const camerasAtPosition = this.cameraLocations.filter(c => 
      Math.abs(c.lat - marker.position.lat) < 0.0001 && 
      Math.abs(c.lng - marker.position.lng) < 0.0001
    );
    
    return camerasAtPosition.some(cam => cam.type === 'TRAFFIC');
  }

  /**
   * Get camera type label for display
   */
  getCameraTypeLabel(marker: MarkerData): string {
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      if (camera) {
        if (camera.type === 'TRAFFIC') return 'Giao thông';
        if (camera.type === 'PERSON') return 'Đối tượng người';
        if (camera.type === 'FACE') return 'Nhận diện khuôn mặt';
      }
    }
    
    // For aggregate markers with mixed types
    const camerasAtPosition = this.cameraLocations.filter(c => 
      Math.abs(c.lat - marker.position.lat) < 0.0001 && 
      Math.abs(c.lng - marker.position.lng) < 0.0001
    );
    
    const hasTraffic = camerasAtPosition.some(cam => cam.type === 'TRAFFIC');
    const hasPerson = camerasAtPosition.some(cam => cam.type === 'PERSON');
    const hasFace = camerasAtPosition.some(cam => cam.type === 'FACE');
    
    const typeCount = [hasTraffic, hasPerson, hasFace].filter(Boolean).length;
    if (typeCount > 1) {
      return 'Hỗn hợp';
    } else if (hasTraffic) {
      return 'Giao thông';
    } else if (hasPerson) {
      return 'Đối tượng người';
    } else if (hasFace) {
      return 'Nhận diện khuôn mặt';
    }
    
    return 'Camera';
  }

  /**
   * Get count label based on camera type
   */
  getCountLabel(marker: MarkerData): string {
    if (marker.cameraCode) {
      const camera = this.cameraLocations.find(c => c.cameraCode === marker.cameraCode);
      if (camera) {
        if (camera.type === 'TRAFFIC') return 'Tổng lưu lượng giao thông';
        if (camera.type === 'PERSON') return 'Tổng người phát hiện';
        if (camera.type === 'FACE') return 'Tổng khuôn mặt nhận diện';
      }
    }
    
    // For aggregate markers
    const camerasAtPosition = this.cameraLocations.filter(c => 
      Math.abs(c.lat - marker.position.lat) < 0.0001 && 
      Math.abs(c.lng - marker.position.lng) < 0.0001
    );
    
    const hasTraffic = camerasAtPosition.some(cam => cam.type === 'TRAFFIC');
    const hasPerson = camerasAtPosition.some(cam => cam.type === 'PERSON');
    const hasFace = camerasAtPosition.some(cam => cam.type === 'FACE');
    
    const typeCount = [hasTraffic, hasPerson, hasFace].filter(Boolean).length;
    if (typeCount > 1) {
      return 'Tổng phát hiện';
    } else if (hasTraffic) {
      return 'Tổng lưu lượng giao thông';
    } else if (hasPerson) {
      return 'Tổng người phát hiện';
    } else if (hasFace) {
      return 'Tổng khuôn mặt nhận diện';
    }
    
    return 'Tổng';
  }

  /**
   * Get Google Maps link for address
   */
  getGoogleMapsLink(marker: MarkerData): string {
    const address = this.getAddress(marker);
    if (!address) return '#';
    
    // Use camera position for accurate navigation
    if (marker.position) {
      return `https://www.google.com/maps/search/?api=1&query=${marker.position.lat},${marker.position.lng}`;
    }
    
    // Fallback to address search
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  private animateToPosition(position: google.maps.LatLngLiteral, zoom: number) {
    if (this.mapElement && this.mapElement.googleMap) {
      console.log('🗺️ Animating to position:', position, 'zoom:', zoom);
      
      // Smooth pan to position first
      this.mapElement.googleMap.panTo(position);
      
      // After panning completes, smoothly zoom
      setTimeout(() => {
        if (this.mapElement && this.mapElement.googleMap) {
          this.mapElement.googleMap.setZoom(zoom);
          
          // Re-center after zoom to ensure accuracy
          setTimeout(() => {
            if (this.mapElement && this.mapElement.googleMap) {
              this.mapElement.googleMap.setCenter(position);
            }
          }, 300);
        }
      }, 400);
    }
  }
  
  trackByMarkerId(index: number, marker: MarkerData): string {
    return marker.id;
  }
  
  logMarkerRender(marker: MarkerData, index: number): string {
    console.log(`🎨 [Template Render] Marker ${index}:`, {
      id: marker.id,
      label: marker.label,
      position: marker.position,
      lat: marker.position?.lat,
      lng: marker.position?.lng,
      latFinite: isFinite(marker.position?.lat),
      lngFinite: isFinite(marker.position?.lng),
      count: marker.count,
      markersReady: this.markersReady
    });
    return ''; // Return empty string for template
  }
  
  isFinite(value: any): boolean {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  }
  
  ngOnDestroy(): void {
    if (this.zoomChangeTimeout) {
      clearTimeout(this.zoomChangeTimeout);
    }
    this.markerOptionsCache.clear();
    this.badgeIconCache.clear();
  }
}