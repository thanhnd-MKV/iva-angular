import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private apiUrl = '/api/admin/camera';

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

  // Get simple camera list for dropdowns (no pagination)
  getCameraOptions(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/list`).pipe(
      map((response: any) => {
        // Handle both direct array and wrapped response
        const cameras = response.data || response || [];
        return cameras.map((camera: any) => ({
          label: camera.name || camera.sn || `Camera ${camera.sn}`,
          value: camera.sn
        }));
      })
    );
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
