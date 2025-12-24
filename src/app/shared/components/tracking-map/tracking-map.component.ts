import { Component, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMapComponent } from '../google-map/google-map.component';

export interface TrackingLocation {
  lat: number;
  lng: number;
  eventId: string;
  timestamp: string;
  cameraName: string;
  address?: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [CommonModule, MatIconModule, GoogleMapComponent],
  template: `
    <div class="tracking-map-container">
      <div class="map-wrapper" #mapWrapper>
        <!-- Info box overlay -->
        <div class="map-info-overlay" *ngIf="trackingTarget">
          <div class="info-header">ID: {{ trackingTarget }}</div>
          <div class="info-detail">Sự kiện ghi nhận: {{ locations.length }}</div>
        </div>

        <app-google-map
          [latitude]="centerLat"
          [longitude]="centerLng"
          [zoom]="mapZoom"
          [height]="'100%'"
          [width]="'100%'">
        </app-google-map>
      </div>
    </div>
  `,
  styles: [`
    .tracking-map-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      position: relative;
    }

    .map-wrapper {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    
    .map-wrapper app-google-map {
      width: 100%;
      height: 100%;
    }

    .map-info-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      background: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      z-index: 10;
      min-width: 180px;
    }

    .info-header {
      font-size: 14px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 6px;
    }

    .info-detail {
      font-size: 12px;
      color: #718096;
      font-weight: 500;
    }
  `]
})
export class TrackingMapComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(GoogleMapComponent) googleMapComponent!: GoogleMapComponent;
  @ViewChild('mapWrapper') mapWrapper!: ElementRef;

  @Input() locations: TrackingLocation[] = [];
  @Input() trackingTarget: string = '';
  @Input() selectedEventId: string = '';

  centerLat = 21.0285;
  centerLng = 105.8542;
  mapZoom = 13;
  
  private recalculateTimeout: any = null;
  private polyline: google.maps.Polyline | null = null;
  private animationInterval: any = null;
  private eventMarkers: google.maps.Marker[] = [];
  private highlightMarker: google.maps.Marker | null = null;
  private customInfoWindow: HTMLElement | null = null;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['locations'] && this.locations.length > 0) {
      this.calculateOptimalZoom();
      setTimeout(() => {
        this.drawPolylineWithAnimation();
        this.createEventMarkers();
      }, 300);
    }

    // Handle selectedEventId changes
    if (changes['selectedEventId'] && this.selectedEventId) {
      setTimeout(() => {
        this.highlightSelectedEvent();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupMapEventListeners();
      if (this.locations.length > 0) {
        this.drawPolylineWithAnimation();
        this.createEventMarkers();
      }
    }, 500);
  }

  setupMapEventListeners(): void {
    if (!this.googleMapComponent || !this.googleMapComponent.map || !this.googleMapComponent.map.googleMap) {
      return;
    }

    const googleMap = this.googleMapComponent.map.googleMap;

    googleMap.addListener('idle', () => {
      // Map is ready
    });
  }

  calculateOptimalZoom(): void {
    if (this.locations.length < 2) {
      return;
    }

    let minLat = this.locations[0].lat;
    let maxLat = this.locations[0].lat;
    let minLng = this.locations[0].lng;
    let maxLng = this.locations[0].lng;

    this.locations.forEach(loc => {
      minLat = Math.min(minLat, loc.lat);
      maxLat = Math.max(maxLat, loc.lat);
      minLng = Math.min(minLng, loc.lng);
      maxLng = Math.max(maxLng, loc.lng);
    });

    this.centerLat = (minLat + maxLat) / 2;
    this.centerLng = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 0.1) this.mapZoom = 11;
    else if (maxDiff > 0.05) this.mapZoom = 12;
    else if (maxDiff > 0.02) this.mapZoom = 13;
    else if (maxDiff > 0.01) this.mapZoom = 14;
    else this.mapZoom = 15;
  }

  drawPolylineWithAnimation(): void {
    if (!this.googleMapComponent || !this.googleMapComponent.map || this.locations.length < 2) {
      return;
    }

    const googleMap = this.googleMapComponent.map.googleMap;
    if (!googleMap) return;

    // Clear previous polyline and markers
    if (this.polyline) {
      this.polyline.setMap(null);
    }
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    // Create path from locations
    const path = this.locations.map(loc => new google.maps.LatLng(loc.lat, loc.lng));

    // Create animated icon
    const lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 1,
      strokeColor: '#003D7A',
      fillColor: '#FFF',
      scale: 6
    };

    // Create polyline with animation
    this.polyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#7B68EE',
      strokeOpacity: 1,
      strokeWeight: 4,
      icons: [
        {
          icon: lineSymbol,
          offset: '0%'
        }
      ]
    });

    this.polyline.setMap(googleMap);

    // Animate the icon
    this.animatePolylineIcon();

    // Fit bounds to show all points
    const bounds = new google.maps.LatLngBounds();
    this.locations.forEach(loc => {
      bounds.extend(new google.maps.LatLng(loc.lat, loc.lng));
    });
    googleMap.fitBounds(bounds);
  }

  private animatePolylineIcon(): void {
    if (!this.polyline) return;

    let count = 0;
    this.animationInterval = setInterval(() => {
      count = (count + 1) % 200;
      const icons = this.polyline!.get('icons');
      if (icons && icons.length > 0) {
        icons[0].offset = (count / 2) + '%';
        this.polyline!.set('icons', icons);
      }
    }, 100);
  }

  private createEventMarkers(): void {
    console.log('🎯 createEventMarkers called, locations:', this.locations.length);
    
    if (!this.googleMapComponent || !this.googleMapComponent.map || this.locations.length === 0) {
      console.warn('⚠️ Cannot create markers:', {
        hasGoogleMapComponent: !!this.googleMapComponent,
        hasMap: !!this.googleMapComponent?.map,
        locationsCount: this.locations.length
      });
      return;
    }

    const googleMap = this.googleMapComponent.map.googleMap;
    if (!googleMap) {
      console.error('❌ No googleMap instance');
      return;
    }

    console.log('✅ Google Map ready, creating markers...');

    // Clear previous event markers
    this.eventMarkers.forEach(marker => marker.setMap(null));
    this.eventMarkers = [];

    // Create markers for each event location - ALL locations with numbered markers
    this.locations.forEach((location, index) => {
      const isFirst = index === 0;
      const isLast = index === this.locations.length - 1;
      
      // Create numbered label marker
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lng),
        map: googleMap,
        label: {
          text: String(index + 1),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isFirst ? 10 : (isLast ? 10 : 14),
          fillColor: isFirst ? '#4CAF50' : (isLast ? '#FF9800' : '#667eea'),
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        zIndex: isFirst || isLast ? 100 : 50
      });

      // Add click listener to show InfoWindow
      marker.addListener('click', () => {
        console.log('🖱️ Marker clicked:', index + 1, location.cameraName);
        this.showInfoWindow(marker, location, index + 1);
      });

      this.eventMarkers.push(marker);
    });

    console.log(`✅ Created ${this.eventMarkers.length} markers with click listeners`);
  }

  private showInfoWindow(marker: google.maps.Marker, location: TrackingLocation, markerNumber: number): void {
    console.log('📍 showInfoWindow called:', {
      markerNumber,
      cameraName: location.cameraName,
      totalEvents: this.locations.length
    });

    if (!this.googleMapComponent || !this.googleMapComponent.map) {
      console.error('❌ No googleMapComponent');
      return;
    }

    const googleMap = this.googleMapComponent.map.googleMap;
    if (!googleMap) {
      console.error('❌ No googleMap');
      return;
    }

    // Close previous custom info window
    if (this.customInfoWindow) {
      if ((this.customInfoWindow as any)._boundsListener) {
        google.maps.event.removeListener((this.customInfoWindow as any)._boundsListener);
      }
      this.customInfoWindow.remove();
      this.customInfoWindow = null;
    }

    // Create custom HTML overlay
    this.customInfoWindow = document.createElement('div');
    this.customInfoWindow.style.cssText = `
      position: absolute;
      background: white;
      padding: 14px 16px;
      min-width: 260px;
      max-width: 300px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000;
      pointer-events: auto;
    `;

    this.customInfoWindow.innerHTML = `
      <div style="
        font-size: 16px;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 12px;
        letter-spacing: -0.3px;">
        ID: ${location.cameraName}
      </div>
      
      <div style="
        height: 1px;
        background: #E5E7EB;
        margin-bottom: 12px;">
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;">
        <span style="
          font-size: 14px;
          font-weight: 500;
          color: #374151;">
          Sự kiện ghi nhận
        </span>
        <span style="
          font-size: 16px;
          font-weight: 600;
          color: #111827;">
          ${this.locations.length}
        </span>
      </div>
    `;

    // Get marker position
    const markerPos = marker.getPosition();
    if (!markerPos) return;

    const updatePosition = () => {
      const projection = googleMap.getProjection();
      if (!projection || !this.customInfoWindow || !markerPos) return;

      const worldPoint = projection.fromLatLngToPoint(markerPos);
      if (!worldPoint) return;

      const mapBounds = googleMap.getBounds();
      if (!mapBounds) return;

      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      const nePoint = projection.fromLatLngToPoint(ne);
      const swPoint = projection.fromLatLngToPoint(sw);
      if (!nePoint || !swPoint) return;

      const mapDiv = googleMap.getDiv();
      const rect = mapDiv.getBoundingClientRect();

      const pixelX = ((worldPoint.x - swPoint.x) / (nePoint.x - swPoint.x)) * rect.width;
      const pixelY = ((worldPoint.y - nePoint.y) / (swPoint.y - nePoint.y)) * rect.height;

      this.customInfoWindow!.style.left = `${pixelX}px`;
      this.customInfoWindow!.style.top = `${pixelY}px`;
      this.customInfoWindow!.style.transform = 'translate(-50%, calc(-100% - 20px))';
    };

    // Append to map
    const mapDiv = googleMap.getDiv();
    mapDiv.style.position = 'relative';
    mapDiv.appendChild(this.customInfoWindow);

    // Position and track map changes
    updatePosition();
    const listener = googleMap.addListener('bounds_changed', updatePosition);
    (this.customInfoWindow as any)._boundsListener = listener;

    console.log('✅ Custom InfoWindow created');
  }

  private highlightSelectedEvent(): void {
    console.log('🔥 highlightSelectedEvent called, selectedEventId:', this.selectedEventId);
    
    if (!this.googleMapComponent || !this.googleMapComponent.map || !this.selectedEventId) {
      console.warn('⚠️ Cannot highlight:', {
        hasComponent: !!this.googleMapComponent,
        hasMap: !!this.googleMapComponent?.map,
        selectedEventId: this.selectedEventId
      });
      return;
    }

    const googleMap = this.googleMapComponent.map.googleMap;
    if (!googleMap) {
      console.error('❌ No googleMap instance');
      return;
    }

    // Find the location matching the selectedEventId
    const selectedLocation = this.locations.find(loc => loc.eventId === this.selectedEventId);
    
    if (!selectedLocation) {
      console.error('❌ Event not found with ID:', this.selectedEventId);
      return;
    }

    console.log('✅ Found location:', selectedLocation.cameraName);

    // Find the index of selected location
    const selectedIndex = this.locations.findIndex(loc => loc.eventId === this.selectedEventId);

    // Clear previous highlight marker
    if (this.highlightMarker) {
      this.highlightMarker.setMap(null);
    }

    // Create pulsing highlight marker overlay
    this.highlightMarker = new google.maps.Marker({
      position: new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng),
      map: googleMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 20,
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeColor: '#FF0000',
        strokeWeight: 2
      },
      zIndex: 199,
      animation: google.maps.Animation.BOUNCE
    });

    // Pan to selected location and adjust zoom if needed
    googleMap.panTo(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng));
    const currentZoom = googleMap.getZoom() || 13;
    if (currentZoom < 14) {
      googleMap.setZoom(14);
    }

    // Show custom InfoWindow for the selected event
    console.log('📍 Showing custom InfoWindow for selected event...');
    
    // Close previous info window
    if (this.customInfoWindow) {
      this.customInfoWindow.remove();
      this.customInfoWindow = null;
    }

    // Wait for map to finish panning, then show InfoWindow
    setTimeout(() => {
      // Get the corresponding numbered marker to anchor InfoWindow
      const targetMarker = this.eventMarkers[selectedIndex];
      
      if (!targetMarker) {
        console.error('❌ Could not find marker at index:', selectedIndex);
        return;
      }

      console.log('✅ Found target marker at index:', selectedIndex);

      // Create custom HTML InfoWindow overlay
      this.customInfoWindow = document.createElement('div');
      this.customInfoWindow.style.cssText = `
        position: absolute;
        background: white;
        padding: 14px 16px;
        min-width: 260px;
        max-width: 300px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 1000;
        pointer-events: auto;
      `;

      this.customInfoWindow.innerHTML = `
        <div style="
          font-size: 16px;
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 12px;
          letter-spacing: -0.3px;">
          ID: ${selectedLocation.cameraName}
        </div>
        
        <div style="
          height: 1px;
          background: #E5E7EB;
          margin-bottom: 12px;">
        </div>
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;">
          <span style="
            font-size: 14px;
            font-weight: 500;
            color: #374151;">
            Sự kiện ghi nhận
          </span>
          <span style="
            font-size: 16px;
            font-weight: 600;
            color: #111827;">
            ${this.locations.length}
          </span>
        </div>
      `;

      // Calculate position relative to marker using bounds_changed event
      const updatePosition = () => {
        const projection = googleMap.getProjection();
        if (!projection || !this.customInfoWindow) return;

        const markerLatLng = new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
        const worldPoint = projection.fromLatLngToPoint(markerLatLng);
        if (!worldPoint) return;

        const mapDiv = googleMap.getDiv();
        const bounds = mapDiv.getBoundingClientRect();
        const ne = googleMap.getBounds()?.getNorthEast();
        const sw = googleMap.getBounds()?.getSouthWest();
        if (!ne || !sw) return;

        const nePoint = projection.fromLatLngToPoint(ne);
        const swPoint = projection.fromLatLngToPoint(sw);
        if (!nePoint || !swPoint) return;

        // Calculate pixel position within map bounds
        const pixelX = ((worldPoint.x - swPoint.x) / (nePoint.x - swPoint.x)) * bounds.width;
        const pixelY = ((worldPoint.y - nePoint.y) / (swPoint.y - nePoint.y)) * bounds.height;

        this.customInfoWindow.style.left = `${pixelX}px`;
        this.customInfoWindow.style.top = `${pixelY}px`;
        this.customInfoWindow.style.transform = 'translate(-50%, calc(-100% - 20px))';
        
        console.log('📐 Custom InfoWindow positioned at:', { x: pixelX, y: pixelY });
      };

      // Append to map div first
      const mapDiv = googleMap.getDiv();
      mapDiv.style.position = 'relative';
      mapDiv.appendChild(this.customInfoWindow);
      
      // Update position immediately and on map changes
      updatePosition();
      
      const boundsListener = googleMap.addListener('bounds_changed', updatePosition);
      
      // Store listener for cleanup
      (this.customInfoWindow as any)._boundsListener = boundsListener;
      
      console.log('✅ Custom InfoWindow added to map');
      console.log('✅ Custom InfoWindow created and positioned');
    }, 500);
    
    // Keep the highlight marker and InfoWindow visible (don't auto-remove)
  }

  ngOnDestroy(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    if (this.polyline) {
      this.polyline.setMap(null);
    }
    if (this.highlightMarker) {
      this.highlightMarker.setMap(null);
    }
    if (this.customInfoWindow) {
      // Remove bounds listener if exists
      if ((this.customInfoWindow as any)._boundsListener) {
        google.maps.event.removeListener((this.customInfoWindow as any)._boundsListener);
      }
      this.customInfoWindow.remove();
    }
    this.eventMarkers.forEach(marker => marker.setMap(null));
  }
}
