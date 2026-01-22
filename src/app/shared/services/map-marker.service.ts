 import { Injectable } from '@angular/core';

/**
 * Marker types available in the system
 */
export enum MarkerType {
  CAMERA = 'camera',
  CAMERA_MAP = 'camera-map',
  EVENT_BASE = 'event-base',
  EVENT_START = 'event-start',
  EVENT_END = 'event-end',
  EVENT_CLUSTER_ZOOM0 = 'event-cluster-zoom0',
  HOME = 'home',
  CUSTOM = 'custom'
}

/**
 * Zoom level configuration for map clustering
 */
export enum ZoomLevel {
  LOW = 'low',        // 0-8: Show regional clusters
  MEDIUM = 'medium',  // 9-13: Show individual cameras
  HIGH = 'high'       // 14+: Show detailed view
}

/**
 * Cluster marker data interface
 */
export interface ClusterMarker {
  position: google.maps.LatLngLiteral;
  totalEvents: number;
  cameraCount?: number;
  cameras?: any[];
  region?: string;
}

/**
 * Map bounds for clustering
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Marker configuration interface
 */
export interface MarkerConfig {
  type: MarkerType;
  iconUrl?: string;
  size?: { width: number; height: number };
  anchor?: { x: number; y: number };
  scaledSize?: { width: number; height: number };
}

/**
 * Service to manage map marker icons
 * - Preloads and caches marker images
 * - Provides centralized marker configuration
 * - Supports custom markers
 */
@Injectable({
  providedIn: 'root'
})
export class MapMarkerService {
  private markerIconCache: Map<string, string> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();

  private readonly MARKER_ICONS: Record<MarkerType, string> = {
    [MarkerType.CAMERA]: 'assets/icon/camera-map-marker.svg',
    [MarkerType.CAMERA_MAP]: 'assets/icon/camera-map.svg',
    [MarkerType.EVENT_BASE]: 'assets/icon/event-base-map.svg',
    [MarkerType.EVENT_START]: 'assets/icon/event-start-map.svg',
    [MarkerType.EVENT_END]: 'assets/icon/event-end-map.svg',
    [MarkerType.EVENT_CLUSTER_ZOOM0]: 'assets/icon/event-total-zoom0.svg',
    [MarkerType.HOME]: 'assets/icon/Home-icon.svg',
    [MarkerType.CUSTOM]: '' // Will be provided by caller
  };

  private readonly DEFAULT_MARKER_SIZES: Record<MarkerType, { width: number; height: number }> = {
    [MarkerType.CAMERA]: { width: 62, height: 62 },
    [MarkerType.CAMERA_MAP]: { width: 54, height: 54 },
    [MarkerType.EVENT_BASE]: { width: 36, height: 36 },
    [MarkerType.EVENT_START]: { width: 42, height: 42 },
    [MarkerType.EVENT_END]: { width: 42, height: 42 },
    [MarkerType.EVENT_CLUSTER_ZOOM0]: { width: 72, height: 72 },
    [MarkerType.HOME]: { width: 48, height: 48 },
    [MarkerType.CUSTOM]: { width: 36, height: 36 }
  };

  // Zoom level thresholds
  private readonly ZOOM_THRESHOLDS = {
    LOW_TO_MEDIUM: 9,
    MEDIUM_TO_HIGH: 14
  };

  constructor() {
    console.log('🗺️ MapMarkerService initialized');
  }

  /**
   * Preload all marker icons
   * Call this during app initialization
   */
  async preloadAllMarkers(): Promise<void> {
    console.log('📍 Preloading all marker icons...');
    const markerTypes = Object.values(MarkerType).filter(type => type !== MarkerType.CUSTOM);
    
    const loadPromises = markerTypes.map(type => this.loadMarkerIcon(type));
    await Promise.all(loadPromises);
    
    console.log('✅ All marker icons preloaded:', this.markerIconCache.size);
  }

  /**
   * Load a specific marker icon
   */
  async loadMarkerIcon(type: MarkerType, customUrl?: string): Promise<string> {
    const iconUrl = customUrl || this.MARKER_ICONS[type];
    
    if (!iconUrl) {
      console.error(`❌ No icon URL for marker type: ${type}`);
      return '';
    }

    // Return cached icon if available
    if (this.markerIconCache.has(iconUrl)) {
      return this.markerIconCache.get(iconUrl)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(iconUrl)) {
      return this.loadingPromises.get(iconUrl)!;
    }

    // Start loading
    const loadPromise = this.fetchAndCacheIcon(iconUrl);
    this.loadingPromises.set(iconUrl, loadPromise);

    try {
      const cachedUrl = await loadPromise;
      this.loadingPromises.delete(iconUrl);
      return cachedUrl;
    } catch (error) {
      this.loadingPromises.delete(iconUrl);
      throw error;
    }
  }

  /**
   * Fetch icon and cache it
   */
  private async fetchAndCacheIcon(iconUrl: string): Promise<string> {
    try {
      console.log(`📥 Loading marker icon: ${iconUrl}`);
      
      const response = await fetch(iconUrl);
      if (!response.ok) {
        throw new Error(`Failed to load icon: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      this.markerIconCache.set(iconUrl, objectUrl);
      console.log(`✅ Marker icon cached: ${iconUrl}`);
      
      return objectUrl;
    } catch (error) {
      console.error(`❌ Error loading marker icon ${iconUrl}:`, error);
      // Return original URL as fallback
      return iconUrl;
    }
  }

  /**
   * Get marker icon URL (from cache or load it)
   */
  async getMarkerIcon(type: MarkerType, customUrl?: string): Promise<string> {
    return this.loadMarkerIcon(type, customUrl);
  }

  /**
   * Get marker configuration for Google Maps
   */
  async getMarkerOptions(config: MarkerConfig): Promise<google.maps.MarkerOptions> {
    const iconUrl = await this.getMarkerIcon(config.type, config.iconUrl);
    const size = config.size || this.DEFAULT_MARKER_SIZES[config.type];
    const scaledSize = config.scaledSize || size;
    const anchor = config.anchor || { x: scaledSize.width / 2, y: scaledSize.height };

    return {
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(scaledSize.width, scaledSize.height),
        anchor: new google.maps.Point(anchor.x, anchor.y)
      }
    };
  }

  /**
   * Get default marker size for a type
   */
  getDefaultSize(type: MarkerType): { width: number; height: number } {
    return { ...this.DEFAULT_MARKER_SIZES[type] };
  }

  /**
   * Clear marker cache (useful for memory management)
   */
  clearCache(): void {
    // Revoke object URLs to free memory
    this.markerIconCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    this.markerIconCache.clear();
    console.log('🗑️ Marker cache cleared');
  }

  /**
   * Get cached icon URL (sync, returns undefined if not cached)
   */
  getCachedIcon(type: MarkerType): string | undefined {
    const iconUrl = this.MARKER_ICONS[type];
    return this.markerIconCache.get(iconUrl);
  }

  /**
   * Check if marker type is loaded
   */
  isMarkerLoaded(type: MarkerType): boolean {
    const iconUrl = this.MARKER_ICONS[type];
    return this.markerIconCache.has(iconUrl);
  }

  /**
   * Get all available marker types
   */
  getAvailableMarkerTypes(): MarkerType[] {
    return Object.values(MarkerType);
  }

  /**
   * Determine zoom level based on current zoom value
   */
  getZoomLevel(zoom: number): ZoomLevel {
    if (zoom < this.ZOOM_THRESHOLDS.LOW_TO_MEDIUM) {
      return ZoomLevel.LOW;
    } else if (zoom < this.ZOOM_THRESHOLDS.MEDIUM_TO_HIGH) {
      return ZoomLevel.MEDIUM;
    } else {
      return ZoomLevel.HIGH;
    }
  }

  /**
   * Get marker type based on zoom level
   */
  getMarkerTypeForZoom(zoom: number, isCluster: boolean = false): MarkerType {
    const zoomLevel = this.getZoomLevel(zoom);
    
    switch (zoomLevel) {
      case ZoomLevel.LOW:
        return MarkerType.EVENT_CLUSTER_ZOOM0;
      case ZoomLevel.MEDIUM:
        return MarkerType.CAMERA_MAP;
      case ZoomLevel.HIGH:
        return MarkerType.CAMERA;
      default:
        return MarkerType.CAMERA;
    }
  }

  /**
   * Cluster cameras by region for low zoom level
   * Groups nearby cameras based on geographical proximity
   */
  clusterCamerasByRegion(cameras: any[], gridSize: number = 1): ClusterMarker[] {
    const clusters: Map<string, ClusterMarker> = new Map();

    cameras.forEach((camera, index) => {
      if (!camera.lat || !camera.lng) return;

      // Create grid key based on lat/lng rounded to gridSize
      const gridLat = Math.floor(camera.lat / gridSize) * gridSize;
      const gridLng = Math.floor(camera.lng / gridSize) * gridSize;
      const gridKey = `${gridLat},${gridLng}`;

      if (clusters.has(gridKey)) {
        const cluster = clusters.get(gridKey)!;
        cluster.totalEvents += camera.totalEvents || camera.count || 0;
        cluster.cameraCount = (cluster.cameraCount || 0) + 1;
        cluster.cameras = cluster.cameras || [];
        cluster.cameras.push(camera);
        
        // KHÔNG tính toán lại position - giữ nguyên GPS của camera đầu tiên
        // Marker luôn ở vị trí GPS chính xác, không bao giờ dịch chuyển
      } else {
        // Tạo cluster mới với GPS chính xác của camera đầu tiên
        clusters.set(gridKey, {
          position: { lat: camera.lat, lng: camera.lng },  // GPS chính xác
          totalEvents: camera.totalEvents || camera.count || 0,
          cameraCount: 1,
          cameras: [camera],
          region: camera.region || camera.location || gridKey
        });
      }
    });

    const result = Array.from(clusters.values());
    return result;
  }

  /**
   * Get cluster size based on event count
   * Returns different sizes for visualization
   */
  getClusterSize(eventCount: number): 'small' | 'medium' | 'large' {
    if (eventCount < 10) return 'small';
    if (eventCount < 50) return 'medium';
    return 'large';
  }

  /**
   * Get scaled marker size based on data value
   */
  getScaledMarkerSize(type: MarkerType, value: number, maxValue: number): { width: number; height: number } {
    const baseSize = this.DEFAULT_MARKER_SIZES[type];
    const minScale = 0.7;
    const maxScale = 1.5;
    
    if (maxValue === 0) return baseSize;
    
    const scale = minScale + (maxScale - minScale) * (value / maxValue);
    
    return {
      width: Math.round(baseSize.width * scale),
      height: Math.round(baseSize.height * scale)
    };
  }

  /**
   * Check if cameras should be clustered at current zoom
   */
  shouldCluster(zoom: number): boolean {
    return zoom < this.ZOOM_THRESHOLDS.LOW_TO_MEDIUM;
  }

  /**
   * Get grid size for clustering based on zoom level
   */
  getClusterGridSize(zoom: number): number {
    if (zoom < 6) return 2;      // Very low zoom - large regions
    if (zoom < 8) return 1;      // Low zoom - medium regions
    if (zoom < 10) return 0.5;   // Medium zoom - small regions
    return 0.1;                   // High zoom - no clustering
  }
}
