import { Component, Input, ViewChild, AfterViewInit, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-google-map',
    standalone: true,
    imports: [CommonModule, GoogleMapsModule],
    template: `
    <div class="map-container" [ngStyle]="{'height': height, 'min-height': height}">
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
        [height]="height"
        [width]="width"
        [center]="center"
        [zoom]="zoom"
        [options]="mapOptions"
        (mapInitialized)="onMapInitialized()"
        (mapError)="onMapError($event)">
        
        <!-- Marker for event location -->
        <map-marker 
          *ngIf="markerPosition"
          [position]="markerPosition"
          [options]="markerOptions"
          [title]="markerTitle || 'Vị trí sự kiện'">
        </map-marker>
        
        <!-- Info Window if needed -->
        <map-info-window 
          *ngIf="showInfoWindow && markerPosition"
          [position]="markerPosition"
          [options]="infoWindowOptions">
          <div class="info-window-content">
            <h4>{{ locationTitle || 'Vị trí sự kiện' }}</h4>
            <p>{{ locationDescription || 'Tọa độ: ' + latitude + ', ' + longitude }}</p>
          </div>
        </map-info-window>
      </google-map>
    </div>
  `,
    styles: [`
    :host {
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
      display: block;
    }
    
    .map-container {
      width: 100%;
      border-radius: 0 !important;
      overflow: hidden;
      position: relative;
      display: block;
      border: none !important;
      outline: none !important;
    }
    
    :host ::ng-deep google-map {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
    }
    
    :host ::ng-deep google-map > div {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
    }
    
    :host ::ng-deep .gm-style {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
    }
    
    :host ::ng-deep .gm-style > div:first-child {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
    }
    
    :host ::ng-deep .gm-style div,
    :host ::ng-deep .gm-style img,
    :host ::ng-deep .gm-style canvas {
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
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
      0%, 80%, 100% {
        opacity: 0.3;
      }
      40% {
        opacity: 1;
      }
    }
    
    .info-window-content {
      padding: 8px;
      min-width: 200px;
    }
    
    .info-window-content h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .info-window-content p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  `]
})
export class GoogleMapComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() latitude: number = 21.0285; // Default Hanoi
    @Input() longitude: number = 105.8542; // Default Hanoi
    @Input() height: string = '200px';
    @Input() width: string = '100%';
    @Input() zoom: number = 15;
    @Input() locationTitle?: string; // Tiêu đề cho marker
    @Input() locationDescription?: string; // Mô tả cho info window
    @Input() showInfoWindow: boolean = false; // Hiển thị info window
    @Input() markerTitle?: string; // Tooltip cho marker

    @ViewChild('map') map!: GoogleMap;

    center: google.maps.LatLngLiteral = { lat: 21.0285, lng: 105.8542 };
    markerPosition: google.maps.LatLngLiteral | null = null;
    isLoading = true;

    constructor(private cdr: ChangeDetectorRef) { }

    mapOptions: google.maps.MapOptions = {
        mapTypeId: 'roadmap',
        zoomControl: false,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        maxZoom: 20,
        minZoom: 8,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
        panControl: false,
        rotateControl: false,
        scaleControl: false,
        styles: [
            {
                featureType: 'administrative',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        color: '#444444'
                    }
                ]
            },
            {
                featureType: 'administrative.country',
                elementType: 'geometry.fill',
                stylers: [
                    {
                        saturation: '100'
                    },
                    {
                        visibility: 'on'
                    }
                ]
            },
            {
                featureType: 'administrative.country',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        saturation: '-100'
                    },
                    {
                        visibility: 'off'
                    },
                    {
                        lightness: '-100'
                    },
                    {
                        color: '#ff0000'
                    }
                ]
            },
            {
                featureType: 'administrative.country',
                elementType: 'labels.icon',
                stylers: [
                    {
                        color: '#fefefe'
                    },
                    {
                        visibility: 'on'
                    }
                ]
            },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text',
                stylers: [
                    {
                        saturation: '100'
                    },
                    {
                        lightness: '100'
                    },
                    {
                        weight: '0.01'
                    }
                ]
            },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        lightness: '-87'
                    },
                    {
                        saturation: '-100'
                    },
                    {
                        hue: '#ff0079'
                    }
                ]
            },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.stroke',
                stylers: [
                    {
                        saturation: '-100'
                    },
                    {
                        lightness: '-100'
                    },
                    {
                        gamma: '3.06'
                    }
                ]
            },
            {
                featureType: 'landscape',
                elementType: 'all',
                stylers: [
                    {
                        color: '#f2f2f2'
                    }
                ]
            },
            {
                featureType: 'poi',
                elementType: 'all',
                stylers: [
                    {
                        visibility: 'off'
                    }
                ]
            },
            {
                featureType: 'poi.attraction',
                elementType: 'geometry.fill',
                stylers: [
                    {
                        color: '#dddddd'
                    }
                ]
            },
            {
                featureType: 'poi.attraction',
                elementType: 'labels.icon',
                stylers: [
                    {
                        color: '#c90a0a'
                    }
                ]
            },
            {
                featureType: 'poi.government',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#c23232'
                    },
                    {
                        visibility: 'on'
                    }
                ]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [
                    {
                        color: '#b60202'
                    }
                ]
            },
            {
                featureType: 'poi.place_of_worship',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        color: '#b20a0a'
                    }
                ]
            },
            {
                featureType: 'poi.place_of_worship',
                elementType: 'labels.icon',
                stylers: [
                    {
                        visibility: 'on'
                    },
                    {
                        color: '#b20000'
                    }
                ]
            },
            {
                featureType: 'poi.sports_complex',
                elementType: 'labels.icon',
                stylers: [
                    {
                        color: '#160101'
                    }
                ]
            },
            {
                featureType: 'road',
                elementType: 'all',
                stylers: [
                    {
                        saturation: -100
                    },
                    {
                        lightness: 45
                    }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'all',
                stylers: [
                    {
                        visibility: 'simplified'
                    }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [
                    {
                        color: '#acaaaa'
                    }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.stroke',
                stylers: [
                    {
                        visibility: 'on'
                    },
                    {
                        color: '#625d5d'
                    }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.icon',
                stylers: [
                    {
                        weight: '0.01'
                    }
                ]
            },
            {
                featureType: 'road.highway.controlled_access',
                elementType: 'geometry.fill',
                stylers: [
                    {
                        color: '#f6d467'
                    }
                ]
            },
            {
                featureType: 'road.highway.controlled_access',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        color: '#000000'
                    }
                ]
            },
            {
                featureType: 'road.highway.controlled_access',
                elementType: 'labels.icon',
                stylers: [
                    {
                        lightness: '-2'
                    },
                    {
                        saturation: '-11'
                    },
                    {
                        gamma: '1.95'
                    }
                ]
            },
            {
                featureType: 'road.arterial',
                elementType: 'labels.icon',
                stylers: [
                    {
                        visibility: 'off'
                    }
                ]
            },
            {
                featureType: 'transit',
                elementType: 'all',
                stylers: [
                    {
                        visibility: 'off'
                    }
                ]
            },
            {
                featureType: 'transit.station.bus',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        color: '#d35252'
                    }
                ]
            },
            {
                featureType: 'transit.station.bus',
                elementType: 'labels.icon',
                stylers: [
                    {
                        color: '#81efdd'
                    }
                ]
            },
            {
                featureType: 'water',
                elementType: 'all',
                stylers: [
                    {
                        color: '#e7e7e7'
                    },
                    {
                        visibility: 'on'
                    }
                ]
            },
            {
                featureType: 'water',
                elementType: 'geometry.fill',
                stylers: [
                    {
                        color: '#c6e6f0'
                    }
                ]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [
                    {
                        color: '#bcadad'
                    }
                ]
            },
            {
                featureType: 'water',
                elementType: 'labels.icon',
                stylers: [
                    {
                        color: '#e9ecf3'
                    },
                    {
                        visibility: 'on'
                    }
                ]
            }
        ]
    };

    markerOptions: google.maps.MarkerOptions = {
        draggable: false,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32)
        }
    };

    infoWindowOptions: google.maps.InfoWindowOptions = {
        disableAutoPan: false,
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -40)
    };

    ngOnInit() {
        console.log('GoogleMapComponent initialized with coordinates:', { lat: this.latitude, lng: this.longitude });
        this.updateMapCenter();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Cập nhật map khi input thay đổi
        if (changes['latitude'] || changes['longitude']) {
            console.log('Coordinates changed:', {
                lat: this.latitude,
                lng: this.longitude
            });
            this.updateMapCenter();
            
            // Force update map center nếu map đã được khởi tạo
            if (this.map && this.map.googleMap) {
                const newCenter = { lat: this.latitude, lng: this.longitude };
                this.map.googleMap.setCenter(newCenter);
                
                // Force resize và re-center sau khi cập nhật tọa độ
                setTimeout(() => {
                    if (this.map && this.map.googleMap) {
                        google.maps.event.trigger(this.map.googleMap, 'resize');
                        this.map.googleMap.setCenter(newCenter);
                        // Re-apply zoom để đảm bảo zoom level đúng
                        this.map.googleMap.setZoom(this.zoom);
                    }
                }, 100);
            }
        }
        
        // Cập nhật zoom khi zoom input thay đổi
        if (changes['zoom'] && !changes['zoom'].firstChange) {
            console.log('Zoom changed to:', this.zoom);
            if (this.map && this.map.googleMap) {
                this.map.googleMap.setZoom(this.zoom);
            }
        }
    }

    ngAfterViewInit() {
        // Setup additional map features after view init
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
            
            // Trigger map resize to ensure proper rendering
            this.resizeMap();
            
            // Additional resize after a short delay
            setTimeout(() => {
                this.resizeMap();
            }, 500);
        }, 1000);
    }

    private updateMapCenter() {
        // Validate coordinates
        if (this.isValidCoordinate(this.latitude) && this.isValidCoordinate(this.longitude)) {
            this.center = { lat: this.latitude, lng: this.longitude };
            this.markerPosition = { lat: this.latitude, lng: this.longitude };

            // Set default marker title if not provided
            if (!this.markerTitle) {
                this.markerTitle = `Vị trí: ${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`;
            }

            console.log('Map center updated:', this.center);
        } else {
            console.warn('Invalid coordinates provided:', { lat: this.latitude, lng: this.longitude });
            // Fallback to default location (Hanoi)
            this.center = { lat: 21.0285, lng: 105.8542 };
            this.markerPosition = null; // Don't show marker for invalid coordinates
        }
    }

    private isValidCoordinate(coord: number): boolean {
        return !isNaN(coord) && isFinite(coord) && coord !== 0;
    }

    onMapInitialized() {
        console.log('Google Map initialized successfully');
        // isLoading is already handled in ngAfterViewInit timeout
    }

    onMapError(error: any) {
        console.error('Google Map error:', error);
        // Handle error but let timeout manage loading state to avoid change detection issues
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 0);
    }

    // Method to get current map instance (for external use)
    getMapInstance(): GoogleMap | undefined {
        return this.map;
    }

    // Method to fit bounds if needed (for multiple markers in future)
    fitBounds(bounds: google.maps.LatLngBounds) {
        if (this.map && this.map.googleMap) {
            this.map.googleMap.fitBounds(bounds);
        }
    }

    // Method to add custom marker (for future extensions)
    addCustomMarker(position: google.maps.LatLngLiteral, options?: google.maps.MarkerOptions) {
        // Implementation for adding custom markers
        console.log('Adding custom marker at:', position, options);
    }

    // Method to resize map to ensure proper rendering
    private resizeMap() {
        setTimeout(() => {
            if (this.map && this.map.googleMap) {
                const mapInstance = this.map.googleMap;
                
                // Force resize
                google.maps.event.trigger(mapInstance, 'resize');
                
                // Re-center the map after resize
                if (this.center) {
                    mapInstance.setCenter(this.center);
                }
                
                // Additional resize triggers
                setTimeout(() => {
                    if (mapInstance) {
                        google.maps.event.trigger(mapInstance, 'resize');
                    }
                }, 100);
            }
        }, 100);
    }

    // Method to set zoom level programmatically
    setZoom(zoomLevel: number) {
        if (this.map && this.map.googleMap) {
            this.map.googleMap.setZoom(zoomLevel);
        }
    }

    // Method to set center programmatically
    setCenter(lat: number, lng: number) {
        if (this.map && this.map.googleMap) {
            this.map.googleMap.setCenter({ lat, lng });
        }
    }
}