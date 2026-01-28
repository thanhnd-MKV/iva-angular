import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';

export interface CameraOption {
  label: string;
  value: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface CameraWithLocation {
  cameras: any[];
  locations: string[];
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  private apiUrl = '/api/admin/camera';

  // Cache for camera options
  private cameraOptionsCache$: Observable<CameraOption[]> | null = null;
  private cameraOptionsSubject = new BehaviorSubject<CameraOption[]>([
    { label: 'Tất cả Camera', value: '' }
  ]);
  public cameraOptions$ = this.cameraOptionsSubject.asObservable();

  // Cache for cameras with location
  private camerasWithLocationCache$: Observable<CameraWithLocation> | null = null;
  private camerasWithLocationSubject = new BehaviorSubject<CameraWithLocation | null>(null);
  public camerasWithLocation$ = this.camerasWithLocationSubject.asObservable();

  private isLoadingOptions = false;
  private isLoadingWithLocation = false;

  constructor(private http: HttpClient) {}

  getCameraList(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/page`, { params });
  }

  /**
   * Get all cameras without pagination
   * Returns full camera list from /api/admin/camera/list
   */
  getAllCameras(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/list`);
  }

  /**
   * Get camera options for dropdowns with caching
   * Calls /api/admin/camera/list once and caches the result
   */
  getCameraOptions(forceRefresh: boolean = false): Observable<CameraOption[]> {
    // Return cache if exists and not forcing refresh
    if (this.cameraOptionsCache$ && !forceRefresh) {
      return this.cameraOptionsCache$;
    }

    // If already loading, return current observable
    if (this.isLoadingOptions && !forceRefresh) {
      return this.cameraOptions$;
    }

    this.isLoadingOptions = true;

    // Create new API call and cache result
    this.cameraOptionsCache$ = this.http.get<any>(`${this.apiUrl}/list`).pipe(
      map((response: any) => {
        // Handle both direct array and wrapped response
        const cameras = response.data || response || [];
        const options = cameras.map((camera: any) => ({
          label: camera.name || camera.sn || `Camera ${camera.sn}`,
          value: camera.sn,
          location: camera.location,
          latitude: camera.latitude,
          longitude: camera.longitude
        }));

        return [
          { label: 'Tất cả Camera', value: '' },
          ...options
        ];
      }),
      tap(options => {
        this.cameraOptionsSubject.next(options);
        this.isLoadingOptions = false;
        console.log('✅ Camera options loaded and cached:', options.length);
      }),
      catchError(error => {
        console.error('❌ Error loading camera options:', error);
        this.isLoadingOptions = false;
        return of([{ label: 'Tất cả Camera', value: '' }]);
      }),
      shareReplay(1) // Cache and share result
    );

    return this.cameraOptionsCache$;
  }

  /**
   * Get cameras with location data
   * Calls /api/admin/camera/camera-with-location once and caches the result
   * Returns: { cameras: [...], locations: [...] }
   */
  getCamerasWithLocation(forceRefresh: boolean = false): Observable<CameraWithLocation> {
    // Return cache if exists and not forcing refresh
    if (this.camerasWithLocationCache$ && !forceRefresh) {
      return this.camerasWithLocationCache$;
    }

    // If already loading, return current value or wait
    if (this.isLoadingWithLocation && !forceRefresh && this.camerasWithLocationSubject.value) {
      return of(this.camerasWithLocationSubject.value);
    }

    this.isLoadingWithLocation = true;

    // Create new API call and cache result
    this.camerasWithLocationCache$ = this.http.get<any>(`${this.apiUrl}/camera-with-location`).pipe(
      map((response: any) => {
        if (response && response.success && response.data) {
          return {
            cameras: response.data.cameras || [],
            locations: response.data.locations || []
          };
        }
        return { cameras: [], locations: [] };
      }),
      tap(data => {
        this.camerasWithLocationSubject.next(data);
        this.isLoadingWithLocation = false;
        console.log('✅ Cameras with location loaded and cached:', {
          cameras: data.cameras.length,
          locations: data.locations.length
        });
      }),
      catchError(error => {
        console.error('❌ Error loading cameras with location:', error);
        this.isLoadingWithLocation = false;
        return of({ cameras: [], locations: [] });
      }),
      shareReplay(1) // Cache and share result
    );

    return this.camerasWithLocationCache$;
  }

  /**
   * Clear all caches - useful when data needs to be refreshed
   */
  clearCache(): void {
    this.cameraOptionsCache$ = null;
    this.camerasWithLocationCache$ = null;
    console.log('🗑️ Camera service cache cleared');
  }

  createCamera(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateCamera(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${data.id}`, data);
  }

  /**
   * Update camera connection status (toggle ON/OFF)
   */
  updateCameraStatus(id: number, status: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { connectionStatus: status });
  }

  deleteCameras(ids: number[]): Observable<any> {
    const idParam = ids.join(',');
    return this.http.delete(`${this.apiUrl}/batchDelete?ids=${idParam}`);
  }
}
