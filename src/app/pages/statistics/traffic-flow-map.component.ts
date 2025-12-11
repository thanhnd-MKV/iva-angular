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
          <map-circle
            *ngFor="let marker of visibleMarkers"
            [center]="marker.position"
            [radius]="getCircleRadius(marker)"
            [options]="getCircleOptions(marker)">
          </map-circle>
        </ng-container>
        
        <!-- Markers -->
        <map-marker 
          *ngFor="let marker of visibleMarkers; let i = index"
          [position]="marker.position"
          [options]="getMarkerOptions(marker)"
          [title]="marker.label"
          (mapClick)="onMarkerClick(marker, i)">
        </map-marker>
        
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
      height: 100%;
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

  isLoading = true;
  center: google.maps.LatLngLiteral = { lat: 15.6, lng: 107.0 }; // Centered between Hanoi and Phu Quoc
  zoom = 5.2; // Optimal zoom to see both markers
  
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.convertCameraLocationsToMarkers();
    this.updateMarkersForZoomLevel();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['cameraLocations']) {
      console.log('🗺️ [TrafficFlowMapComponent] Camera locations changed:', changes['cameraLocations'].currentValue);
      
      // Clear marker cache when data changes
      this.markerOptionsCache.clear();
      
      this.convertCameraLocationsToMarkers();
      this.updateMarkersForZoomLevel();
      
      // Auto-zoom to cameras if data changed and we have valid locations
      if (this.cameraLocations && this.cameraLocations.length > 0) {
        setTimeout(() => {
          this.autoZoomToCameras();
        }, 500);
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
      console.log('🗺️ [TrafficFlowMapComponent] Converting camera locations:', this.cameraLocations);
      
      // Create area group markers (for low zoom)
      this.cameraLevelData = this.cameraLocations.map((location, index) => {
        const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);
        const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);
        
        return {
          position: { lat, lng },
          label: location.name || `Camera ${index + 1}`,
          count: location.count || 0,
          level: 'camera' as const,
          id: `cam_${location.cameraCode || index}`,
          area: location.name || '',
          cameraCode: location.cameraCode || `CAM-${index + 1}`
        };
      });
      
      // Create individual camera markers (for high zoom)
      this.individualCameras = [];
      this.cameraLocations.forEach((location) => {
        // Check if this location has individualCameras data
        if ((location as any).individualCameras && Array.isArray((location as any).individualCameras)) {
          // Expand grouped cameras into individual markers
          (location as any).individualCameras.forEach((cam: any) => {
            this.individualCameras.push({
              position: { lat: cam.lat, lng: cam.lng },
              label: cam.cameraSn,
              count: cam.total || 0,
              level: 'camera' as const,
              id: `individual_${cam.cameraSn}`,
              area: location.name || '',
              cameraCode: cam.cameraSn
            });
          });
        } else {
          // Single camera - same at all zoom levels
          const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);
          const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);
          
          this.individualCameras.push({
            position: { lat, lng },
            label: location.name || 'Camera',
            count: location.count || 0,
            level: 'camera' as const,
            id: `individual_${location.cameraCode}`,
            area: location.name || '',
            cameraCode: location.cameraCode || ''
          });
        }
      });
      
      // Keep Vietnam center fixed - don't recalculate from camera positions
      // This prevents the map from centering on Cambodia when averaging Hanoi and Phu Quoc
      
      // Generate hierarchical data
      this.generateHierarchicalData();
      
      console.log('🗺️ [TrafficFlowMapComponent] Generated hierarchical data:');
      console.log('Country level:', this.countryLevelData.length);
      console.log('City level:', this.cityLevelData.length);
      console.log('District level:', this.districtLevelData.length);
      console.log('Camera level:', this.cameraLevelData.length);
      
    } catch (error) {
      console.error('Error converting camera locations to markers:', error);
      this.cameraLevelData = [];
    }
  }

  private generateHierarchicalData() {
    if (this.cameraLevelData.length === 0) return;

    // Country level: Calculate center from actual camera positions
    const totalCount = this.cameraLevelData.reduce((sum, camera) => sum + camera.count, 0);
    const avgLat = this.cameraLevelData.reduce((sum, c) => sum + c.position.lat, 0) / this.cameraLevelData.length;
    const avgLng = this.cameraLevelData.reduce((sum, c) => sum + c.position.lng, 0) / this.cameraLevelData.length;
    
    this.countryLevelData = [{
      position: { lat: avgLat, lng: avgLng },
      label: 'Việt Nam',
      count: totalCount,
      level: 'country' as const,
      id: 'vietnam',
      area: 'Việt Nam'
    }];

    // City level: Group cameras by regions
    const cityGroups = this.groupCamerasByRegion();
    this.cityLevelData = Object.entries(cityGroups).map(([regionName, cameras]) => {
      const avgLat = cameras.reduce((sum, c) => sum + c.position.lat, 0) / cameras.length;
      const avgLng = cameras.reduce((sum, c) => sum + c.position.lng, 0) / cameras.length;
      const totalCount = cameras.reduce((sum, c) => sum + c.count, 0);
      
      return {
        position: { lat: avgLat, lng: avgLng },
        label: regionName,
        count: totalCount,
        level: 'city' as const,
        id: `city_${regionName.toLowerCase().replace(/\s+/g, '_')}`,
        area: regionName
      };
    });

    // District level: Sub-group cameras within regions
    this.districtLevelData = [];
    Object.entries(cityGroups).forEach(([regionName, cameras]) => {
      const districts = this.createDistrictClusters(cameras, regionName);
      this.districtLevelData.push(...districts);
    });
  }

  private groupCamerasByRegion(): { [key: string]: MarkerData[] } {
    const groups: { [key: string]: MarkerData[] } = {};
    
    this.cameraLevelData.forEach(camera => {
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
      
      districts.push({
        position: { lat: avgLat, lng: avgLng },
        label: `${regionName} - Khu vực ${Math.floor(i / clusterSize) + 1}`,
        count: totalCount,
        level: 'district' as const,
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
    console.log('🗺️ [TrafficFlowMapComponent] Updating markers for zoom level:', this.zoom);
    
    if (this.cameraLevelData.length === 0) {
      this.visibleMarkers = [];
      this.cdr.detectChanges();
      return;
    }
    
    // Improved zoom logic:
    // Zoom < 7: Show area groups (for overview)
    // Zoom >= 7: Show individual cameras (for detail view)
    if (this.zoom < 7) {
      this.visibleMarkers = this.cameraLevelData; // Area groups
      console.log('🗺️ Showing area groups:', this.visibleMarkers.length);
    } else {
      this.visibleMarkers = this.individualCameras; // Individual cameras
      console.log('🗺️ Showing individual cameras:', this.visibleMarkers.length);
    }
    
    this.cdr.detectChanges();
  }

  getCircleRadius(marker: MarkerData): number {
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
  
  ngOnDestroy(): void {
    if (this.zoomChangeTimeout) {
      clearTimeout(this.zoomChangeTimeout);
    }
    this.markerOptionsCache.clear();
  }
}