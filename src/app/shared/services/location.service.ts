import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';

export interface LocationOption {
  label: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locationsSubject = new BehaviorSubject<LocationOption[]>([
    { label: 'Tất cả khu vực', value: '' }
  ]);
  
  // Observable để components subscribe
  public locations$ = this.locationsSubject.asObservable();
  
  // Cache API call
  private locationsCache$: Observable<LocationOption[]> | null = null;
  private isLoading = false;

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách locations từ cache hoặc gọi API nếu chưa có
   * Sử dụng shareReplay để cache kết quả và share cho nhiều subscribers
   */
  getLocations(forceRefresh: boolean = false): Observable<LocationOption[]> {
    // Nếu đã có cache và không force refresh, trả về cache
    if (this.locationsCache$ && !forceRefresh) {
      return this.locationsCache$;
    }

    // Nếu đang loading, trả về cache hiện tại
    if (this.isLoading && !forceRefresh) {
      return this.locations$;
    }

    this.isLoading = true;

    // Tạo API call mới và cache kết quả
    this.locationsCache$ = this.http.get<any>('/api/admin/camera/list').pipe(
      map(response => {
        const cameras = response.data || response || [];
        const locationSet = new Set<string>();
        
        cameras.forEach((camera: any) => {
          if (camera.location && camera.location.trim()) {
            locationSet.add(camera.location.trim());
          }
        });
        
        const dynamicLocationOptions = Array.from(locationSet)
          .sort()
          .map(location => ({
            label: location,
            value: location
          }));
        
        return [
          { label: 'Tất cả khu vực', value: '' },
          ...dynamicLocationOptions
        ];
      }),
      tap(locations => {
        // Update BehaviorSubject với dữ liệu mới
        this.locationsSubject.next(locations);
        this.isLoading = false;
        console.log('✅ Locations loaded and cached:', locations.length);
      }),
      catchError(error => {
        console.error('❌ Error loading locations:', error);
        this.isLoading = false;
        // Trả về danh sách mặc định khi có lỗi
        return of([{ label: 'Tất cả khu vực', value: '' }]);
      }),
      shareReplay(1) // Cache kết quả và share cho tất cả subscribers
    );

    return this.locationsCache$;
  }

  /**
   * Refresh dữ liệu locations (force reload từ API)
   */
  refreshLocations(): Observable<LocationOption[]> {
    this.locationsCache$ = null;
    return this.getLocations(true);
  }

  /**
   * Lấy giá trị hiện tại của locations (synchronous)
   */
  getCurrentLocations(): LocationOption[] {
    return this.locationsSubject.getValue();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.locationsCache$ = null;
    this.locationsSubject.next([{ label: 'Tất cả khu vực', value: '' }]);
  }
}
