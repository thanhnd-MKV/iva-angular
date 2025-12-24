import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';

interface MarkerData {
  position: google.maps.LatLngLiteral;
  label: string;
  count: number;
  level: 'country' | 'city' | 'district' | 'camera' | 'aggregate';
  id: string;
  area?: string;
  cameraCode?: string;
}

interface CameraLocation {
  lat: number;
  lng: number;
  name: string;
  count: number;
  cameraCode: string;
  totalIn?: number;
  totalOut?: number;
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
        
        <!-- Blue circle zones -->
        <ng-container *ngIf="zoom >= 8">
          <ng-container *ngFor="let marker of visibleMarkers; trackBy: trackByMarkerId">
            <map-circle
              *ngIf="marker.position && isFinite(marker.position.lat) && isFinite(marker.position.lng)"
              [center]="marker.position"
              [radius]="getCircleRadius(marker)"
              [options]="getCircleOptions(marker)">
            </map-circle>
          </ng-container>
        </ng-container>
        
        <!-- Markers -->
        <ng-container *ngFor="let marker of visibleMarkers; let i = index; trackBy: trackByMarkerId">
          <map-marker 
            *ngIf="marker.position && isFinite(marker.position.lat) && isFinite(marker.position.lng)"
            [position]="marker.position"
            [options]="getMarkerOptions(marker)"
            [title]="marker.label"
            (mapClick)="onMarkerClick(marker, i)">
          </map-marker>
        </ng-container>
        
        <!-- Info Window -->
        <map-info-window #infoWindow>
          <div class="info-window-content" *ngIf="selectedMarker">
            <h4 class="info-title">{{ selectedMarker.label }}</h4>
            <div class="info-details">
              <div class="info-row" *ngIf="selectedMarker.level === 'camera'">
                <span class="info-label">Camera</span>
                <span class="info-value">{{ selectedMarker.cameraCode }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tổng lưu lượng</span>
                <span class="info-value">{{ selectedMarker.count }}</span>
              </div>
              <div class="info-row" *ngIf="selectedMarker.area">
                <span class="info-label">Khu vực</span>
                <span class="info-value">{{ selectedMarker.area }}</span>
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
      padding: 8px;
      min-width: 220px;
      max-width: 300px;
    }
    
    .info-title {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .info-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .info-value {
      font-size: 13px;
      color: #1f2937;
      font-weight: 600;
    }
  `]
})
export class TrafficFlowMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('map') mapElement!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
  @ViewChildren(MapMarker) markerElements!: QueryList<MapMarker>;
  
  @Input() cameraLocations: CameraLocation[] = [];
  @Input() mapCenter?: google.maps.LatLngLiteral; // Optional external center control
  @Input() mapZoom?: number; // Optional external zoom control

  isLoading = true;
  center: google.maps.LatLngLiteral = { lat: 15.6, lng: 107.0 }; // Default center
  zoom = 5.2; // Default zoom
  
  selectedMarker: MarkerData | null = null;
  selectedMarkerIndex: number = -1;
  visibleMarkers: MarkerData[] = [];
  
  private zoomChangeTimeout: any;
  private markerOptionsCache = new Map<string, google.maps.MarkerOptions>();
  
  // Hierarchical data arrays
  private countryLevelData: MarkerData[] = [];
  private cityLevelData: MarkerData[] = [];
  private districtLevelData: MarkerData[] = [];
  private cameraLevelData: MarkerData[] = []; // Area groups from parent
  private individualCameras: MarkerData[] = []; // Individual cameras for high zoom
  
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

  constructor(private cdr: ChangeDetectorRef) {
    // Validate initial center
    if (!isFinite(this.center.lat) || !isFinite(this.center.lng)) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid initial center, resetting to default');
      this.center = { lat: 15.6, lng: 107.0 };
    }
    
    if (!isFinite(this.zoom) || this.zoom < 5 || this.zoom > 18) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Invalid initial zoom, resetting to default');
      this.zoom = 5.2;
    }
    
    console.log('🗺️ [TrafficFlowMapComponent] Constructor - Initial center:', this.center, 'zoom:', this.zoom);
  }

  ngOnInit() {
    console.log('🗺️ [TrafficFlowMapComponent] ngOnInit - Initial cameraLocations:', this.cameraLocations?.length || 0);
    this.convertCameraLocationsToMarkers();
    this.updateMarkersForZoomLevel();
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
      
      // Validate zoom
      if (typeof this.mapZoom === 'number' && isFinite(this.mapZoom) && this.mapZoom >= 5 && this.mapZoom <= 18) {
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
        // Clear marker cache when data changes
        this.markerOptionsCache.clear();
        
        this.convertCameraLocationsToMarkers();
        this.updateMarkersForZoomLevel();
        
        // Only auto-zoom if parent didn't provide explicit center/zoom
        if (!this.mapCenter && !this.mapZoom && this.cameraLocations && this.cameraLocations.length > 0) {
          setTimeout(() => {
            this.autoZoomToCameras();
          }, 100); // Reduced delay
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

  private convertCameraLocationsToMarkers() {
    try {
      console.log('🗺️ [TrafficFlowMapComponent] ========== Converting camera locations ==========');
      console.log('🗺️ [TrafficFlowMapComponent] Input cameraLocations:', this.cameraLocations?.length || 0, 'items');
      
      if (!this.cameraLocations || this.cameraLocations.length === 0) {
        console.log('🗺️ [TrafficFlowMapComponent] ⚠️ No camera locations to convert');
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
          
          if (typeof location.lat === 'number') {
            lat = location.lat;
          } else if (typeof location.lat === 'string') {
            lat = parseFloat(location.lat);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] Invalid lat type at index ${index}:`, typeof location.lat, location);
            return;
          }
          
          if (typeof location.lng === 'number') {
            lng = location.lng;
          } else if (typeof location.lng === 'string') {
            lng = parseFloat(location.lng);
          } else {
            console.error(`🗺️ [TrafficFlowMapComponent] Invalid lng type at index ${index}:`, typeof location.lng, location);
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
            area: location.name || '',
            cameraCode: location.cameraCode || `CAM-${index + 1}`
          };
          
          console.log(`🗺️ [TrafficFlowMapComponent] ✅ Created camera marker[${index}]:`, {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            label: marker.label,
            count: marker.count
          });
          
          validMarkers.push(marker);
      });
      
      this.cameraLevelData = validMarkers;
      
      console.log('🗺️ [TrafficFlowMapComponent] ✅ Camera level markers created:', this.cameraLevelData.length);
      
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
              area: location.name || '',
              cameraCode: cam.cameraSn
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
            area: location.name || '',
            cameraCode: location.cameraCode || ''
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

    console.log('🗺️ [generateHierarchicalData] Valid cameras:', validCameras.length);

    // Country level: Calculate center from actual camera positions
    const totalCount = validCameras.reduce((sum, camera) => sum + camera.count, 0);
    const avgLat = validCameras.reduce((sum, c) => sum + c.position.lat, 0) / validCameras.length;
    const avgLng = validCameras.reduce((sum, c) => sum + c.position.lng, 0) / validCameras.length;
    
    // Validate calculated averages
    if (!isFinite(avgLat) || isNaN(avgLat) || !isFinite(avgLng) || isNaN(avgLng)) {
      console.error('🗺️ [generateHierarchicalData] ❌ Invalid calculated center:', { avgLat, avgLng });
      this.countryLevelData = [];
      this.cityLevelData = [];
      this.districtLevelData = [];
      return;
    }
    
    console.log('🗺️ [generateHierarchicalData] Country center:', { lat: avgLat.toFixed(6), lng: avgLng.toFixed(6), count: totalCount });
    
    this.countryLevelData = [{
      position: { lat: avgLat, lng: avgLng },
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
      const avgLat = cameras.reduce((sum, c) => sum + c.position.lat, 0) / cameras.length;
      const avgLng = cameras.reduce((sum, c) => sum + c.position.lng, 0) / cameras.length;
      const totalCount = cameras.reduce((sum, c) => sum + c.count, 0);
      
      // Validate city center
      if (!isFinite(avgLat) || isNaN(avgLat) || !isFinite(avgLng) || isNaN(avgLng)) {
        console.error('🗺️ [generateHierarchicalData] ❌ Invalid city center for', regionName);
        return;
      }
      
      validCityMarkers.push({
        position: { lat: avgLat, lng: avgLng },
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
      const avgLat = clusterCameras.reduce((sum, c) => sum + c.position.lat, 0) / clusterCameras.length;
      const avgLng = clusterCameras.reduce((sum, c) => sum + c.position.lng, 0) / clusterCameras.length;
      const totalCount = clusterCameras.reduce((sum, c) => sum + c.count, 0);
      
      // Validate district center
      if (!isFinite(avgLat) || isNaN(avgLat) || !isFinite(avgLng) || isNaN(avgLng)) {
        console.error('🗺️ [createDistrictClusters] ❌ Invalid district center for', regionName, 'cluster', i);
        continue; // Skip this district
      }
      
      districts.push({
        position: { lat: avgLat, lng: avgLng },
        label: `${regionName} - Khu vực ${Math.floor(i / clusterSize) + 1}`,
        count: totalCount,
        level: 'district',
        id: `district_${regionName}_${i}`,
        area: `${regionName} - Khu vực ${Math.floor(i / clusterSize) + 1}`
      });
    }
    
    return districts;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.isLoading) {
        console.warn('Map initialization timeout - forcing load complete');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  onMapInitialized() {
    console.log('🗺️ Traffic Flow Map initialized successfully');
    this.isLoading = false;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.updateMarkersForZoomLevel();
    }, 100);
  }

  onZoomChanged() {
    if (this.zoomChangeTimeout) {
      clearTimeout(this.zoomChangeTimeout);
    }
    
    this.zoomChangeTimeout = setTimeout(() => {
      if (this.mapElement && this.mapElement.googleMap) {
        const currentZoom = this.mapElement.googleMap.getZoom() || 6;
        if (this.zoom !== currentZoom) {
          this.zoom = currentZoom;
          // Clear marker cache since size depends on zoom
          this.markerOptionsCache.clear();
          this.updateMarkersForZoomLevel();
        }
      }
    }, 150);
  }

  private updateMarkersForZoomLevel() {
    console.log('🗺️ [TrafficFlowMapComponent] ========== Updating markers for zoom level ==========');
    console.log('🗺️ [TrafficFlowMapComponent] Current zoom:', this.zoom);
    console.log('🗺️ [TrafficFlowMapComponent] Available camera level data:', this.cameraLevelData.length);
    console.log('🗺️ [TrafficFlowMapComponent] Available individual cameras:', this.individualCameras.length);
    
    if (this.cameraLevelData.length === 0) {
      console.log('🗺️ [TrafficFlowMapComponent] ⚠️ No camera data available - clearing markers');
      this.visibleMarkers = [];
      this.cdr.detectChanges();
      return;
    }
    
    // Improved zoom logic:
    // Zoom < 7: Show area groups (for overview)
    // Zoom >= 7: Show individual cameras (for detail view)
    if (this.zoom < 7) {
      // Filter out any invalid markers before displaying
      this.visibleMarkers = this.cameraLevelData.filter(marker => {
        const isValid = marker.position && 
                       isFinite(marker.position.lat) && 
                       !isNaN(marker.position.lat) &&
                       isFinite(marker.position.lng) && 
                       !isNaN(marker.position.lng);
        
        if (!isValid) {
          console.error('🗺️ [updateMarkersForZoomLevel] ❌ Filtering out invalid area marker:', marker);
        }
        
        return isValid;
      });
      
      console.log('🗺️ [TrafficFlowMapComponent] ✅ Showing area groups:', this.visibleMarkers.length);
      console.log('🗺️ [TrafficFlowMapComponent] Area group markers:', this.visibleMarkers.map((m, i) => ({
        index: i,
        lat: m.position.lat.toFixed(6),
        lng: m.position.lng.toFixed(6),
        label: m.label,
        count: m.count
      })));
    } else {
      // Filter out any invalid markers before displaying
      this.visibleMarkers = this.individualCameras.filter(marker => {
        const isValid = marker.position && 
                       isFinite(marker.position.lat) && 
                       !isNaN(marker.position.lat) &&
                       isFinite(marker.position.lng) && 
                       !isNaN(marker.position.lng);
        
        if (!isValid) {
          console.error('🗺️ [updateMarkersForZoomLevel] ❌ Filtering out invalid individual marker:', marker);
        }
        
        return isValid;
      });
      
      console.log('🗺️ [TrafficFlowMapComponent] ✅ Showing individual cameras:', this.visibleMarkers.length);
      if (this.visibleMarkers.length > 0) {
        console.log('🗺️ [TrafficFlowMapComponent] Individual camera markers:', this.visibleMarkers.slice(0, 5).map((m, i) => ({
          index: i,
          lat: m.position.lat.toFixed(6),
          lng: m.position.lng.toFixed(6),
          label: m.label,
          count: m.count
        })), this.visibleMarkers.length > 5 ? `... and ${this.visibleMarkers.length - 5} more` : '');
      }
    }
    
    console.log('🗺️ [TrafficFlowMapComponent] ✅ Final visible markers count:', this.visibleMarkers.length);
    
    // Final safety check before rendering
    const invalidMarkers = this.visibleMarkers.filter(m => 
      !m.position || !isFinite(m.position.lat) || isNaN(m.position.lat) || 
      !isFinite(m.position.lng) || isNaN(m.position.lng)
    );
    
    if (invalidMarkers.length > 0) {
      console.error('🗺️ [TrafficFlowMapComponent] ❌❌❌ CRITICAL: Invalid markers about to be rendered!', invalidMarkers);
      console.error('🗺️ [TrafficFlowMapComponent] ❌ Removing', invalidMarkers.length, 'invalid markers');
      
      // Remove invalid markers
      this.visibleMarkers = this.visibleMarkers.filter(m => 
        m.position && isFinite(m.position.lat) && !isNaN(m.position.lat) && 
        isFinite(m.position.lng) && !isNaN(m.position.lng)
      );
      
      console.log('🗺️ [TrafficFlowMapComponent] ✅ After cleanup:', this.visibleMarkers.length, 'valid markers');
    }
    
    // Log ALL markers that will be rendered
    console.log('🗺️ [TrafficFlowMapComponent] 📍📍📍 RENDERING THESE MARKERS:', 
      this.visibleMarkers.map((m, i) => ({
        index: i,
        id: m.id,
        lat: m.position?.lat,
        lng: m.position?.lng,
        latValid: m.position ? isFinite(m.position.lat) && !isNaN(m.position.lat) : false,
        lngValid: m.position ? isFinite(m.position.lng) && !isNaN(m.position.lng) : false
      }))
    );
    
    this.cdr.detectChanges();
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
    
    // Don't cache since size depends on zoom level
    const cacheKey = `${marker.id}_zoom_${this.zoom}`;
    if (this.markerOptionsCache.has(cacheKey)) {
      return this.markerOptionsCache.get(cacheKey)!;
    }
    
    let icon: google.maps.Icon | google.maps.Symbol;
    let label: google.maps.MarkerLabel | undefined;
    
    // Always use blue circle style with size adjusted by zoom
    let markerSize = 26;
    let fontSize = '12px';
    
    // Adjust size based on zoom for better visibility
    if (this.zoom < 7) {
      markerSize = 30;
      fontSize = '13px';
    } else if (this.zoom < 10) {
      markerSize = 28;
      fontSize = '12px';
    } else {
      markerSize = 26;
      fontSize = '11px';
    }
    
    icon = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#3b82f6',
      fillOpacity: 0.9,
      strokeColor: '#1d4ed8',
      strokeWeight: 3,
      scale: markerSize
    };
    
    const displayCount = marker.count > 999 ? `${(marker.count / 1000).toFixed(1)}k` : marker.count.toString();
    label = {
      text: displayCount,
      color: '#ffffff',
      fontSize: fontSize,
      fontWeight: 'bold'
    };
    
    const options: google.maps.MarkerOptions = {
      icon: icon,
      label: label,
      optimized: true,
      zIndex: 4
    };
    
    this.markerOptionsCache.set(cacheKey, options);
    return options;
  }

  onMarkerClick(marker: MarkerData, index: number) {
    this.selectedMarker = marker;
    this.selectedMarkerIndex = index;
    
    setTimeout(() => {
      const markerElement = this.markerElements.toArray()[index];
      if (markerElement) {
        this.infoWindow.open(markerElement);
      }
    }, 0);
    
    // Auto-zoom and center to camera GPS when clicking marker
    if (this.mapElement && this.mapElement.googleMap) {
      // If clicking on an area group marker (zoom < 7), zoom in to show individual cameras
      if (this.zoom < 7) {
        console.log('🎯 Zooming from area group to individual cameras');
        this.animateToPosition(marker.position, 12); // Zoom to level 12 to see individual cameras
      } else if (this.zoom < 15) {
        // If already showing individual cameras, zoom in closer to street level
        console.log('🎯 Zooming to street level for camera:', marker.cameraCode);
        this.animateToPosition(marker.position, 16); // Zoom to street level
      } else {
        // Already at street level, just center the map
        console.log('🎯 Centering map to camera:', marker.cameraCode);
        this.mapElement.googleMap.panTo(marker.position);
      }
    }
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
  
  isFinite(value: any): boolean {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  }
  
  ngOnDestroy(): void {
    if (this.zoomChangeTimeout) {
      clearTimeout(this.zoomChangeTimeout);
    }
    this.markerOptionsCache.clear();
  }
}