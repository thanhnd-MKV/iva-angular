import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../core/services/http.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '/api/admin/camera';
  private apiEvents = '/api/admin/events';

  constructor(private http: HttpClient, private httpService: HttpService) { }

  getCameraList(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/page`, { params });
  }

  createCamera(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateCamera(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${data.id}`, data);
  }

  deleteCameras(ids: number[]): Observable<any> {
    const idParam = ids.join(',');
    return this.http.delete(`${this.apiUrl}/batchDelete?ids=${idParam}`);
  }

  getDailyViolationStats(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    return this.http.get(`/api/admin/events/by-day`, { params });
  }

  getTimeSlotViolations(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // Remove undefined/null values
    const cleanParams = Object.keys(params).reduce((acc: any, key) => {
      if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
        acc[key] = params[key as keyof typeof params];
      }
      return acc;
    }, {});
    
    return this.http.get<any>(`${this.apiEvents}/by-hour-of-week`, { params: cleanParams });
  }

  getSumViolationStats(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // Remove undefined/null values
    const cleanParams = Object.keys(params).reduce((acc: any, key) => {
      if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
        acc[key] = params[key as keyof typeof params];
      }
      return acc;
    }, {});
    
    return this.http.get<any>(`${this.apiEvents}/stats`, { params: cleanParams });
  }

  getCameraViolations(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // Remove undefined/null values
    const cleanParams = Object.keys(params).reduce((acc: any, key) => {
      if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
        acc[key] = params[key as keyof typeof params];
      }
      return acc;
    }, {});
    
    return this.http.get<any>(`${this.apiEvents}/by-camera`, { params: cleanParams });
  }
}
