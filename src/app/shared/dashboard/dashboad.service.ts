import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpService } from '../../core/services/http.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '/api/admin/camera';
  private apiEvents = '/api/admin/events';

  constructor(private http: HttpClient, private httpService: HttpService) { }

  getCameraList(params: any): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.get(`${this.apiUrl}/page`, { params });
    
    // Fake data
    return of({
      success: true,
      data: {
        content: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Camera ${i + 1}`,
          sn: `CAM${String(i + 1).padStart(3, '0')}`,
          location: `Vị trí ${i + 1}`,
          status: i % 3 === 0 ? 'offline' : 'online',
          type: i % 2 === 0 ? 'traffic' : 'person'
        })),
        totalElements: 10,
        totalPages: 1,
        size: 10,
        number: 0
      }
    }).pipe(delay(300));
  }

  createCamera(data: any): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.post(`${this.apiUrl}`, data);
    
    // Fake data
    return of({
      success: true,
      data: { id: Date.now(), ...data }
    }).pipe(delay(300));
  }

  updateCamera(data: any): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.put(`${this.apiUrl}/${data.id}`, data);
    
    // Fake data
    return of({
      success: true,
      data: data
    }).pipe(delay(300));
  }

  deleteCameras(ids: number[]): Observable<any> {
    // TODO: Uncomment when API is ready
    // const idParam = ids.join(',');
    // return this.http.delete(`${this.apiUrl}/batchDelete?ids=${idParam}`);
    
    // Fake data
    return of({
      success: true,
      message: `Đã xóa ${ids.length} camera`
    }).pipe(delay(300));
  }

  getDailyViolationStats(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.get(`${this.apiEvents}/by-day`, { params });
    
    // Fake data - Tạo data 30 ngày
    const dailyData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 11, i + 1).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 100) + 20,
      eventType: params.eventType || 'all'
    }));
    return of({
      success: true,
      data: dailyData
    }).pipe(delay(300));
  }

  getTimeSlotViolations(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // TODO: Uncomment when API is ready
    // const cleanParams = Object.keys(params).reduce((acc: any, key) => {
    //   if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
    //     acc[key] = params[key as keyof typeof params];
    //   }
    //   return acc;
    // }, {});
    // return this.http.get<any>(`${this.apiEvents}/by-hour-of-week`, { params: cleanParams });
    
    // Fake data - Tạo data theo giờ trong tuần (7 ngày x 24 giờ)
    const timeSlotData = Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day],
      hours: Array.from({ length: 24 }, (_, hour) => ({
        hour: hour,
        count: Math.floor(Math.random() * 50) + 5
      }))
    }));
    return of({
      success: true,
      data: timeSlotData
    }).pipe(delay(300));
  }

  getSumViolationStats(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // TODO: Uncomment when API is ready
    // const cleanParams = Object.keys(params).reduce((acc: any, key) => {
    //   if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
    //     acc[key] = params[key as keyof typeof params];
    //   }
    //   return acc;
    // }, {});
    // return this.http.get<any>(`${this.apiEvents}/stats`, { params: cleanParams });
    
    // Fake data
    return of({
      success: true,
      data: {
        total: 1234,
        traffic: 756,
        person: 478,
        helmet: 234,
        wrongLane: 156,
        redLight: 122,
        noParking: 244,
        faceRecognition: 312,
        suspicious: 166
      }
    }).pipe(delay(300));
  }

  /**
   * Get homepage statistics including person/traffic detection and camera locations
   */
  getHomepageStats(params?: { fromUtc?: string; toUtc?: string }): Observable<any> {
    console.log('🔥 DashboardService.getHomepageStats() called');
    console.log('🔥 API URL:', `${this.apiEvents}/stats/homepage`);
    console.log('🔥 Params:', params);
    return this.http.get<any>(`${this.apiEvents}/stats/homepage`, { params });
  }

  getCameraViolations(params: {
    year?: number,
    month?: number,
    fromUtc?: string,
    toUtc?: string,
    cameraSn?: string,
    eventType?: string
  }): Observable<any> {
    // TODO: Uncomment when API is ready
    // const cleanParams = Object.keys(params).reduce((acc: any, key) => {
    //   if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
    //     acc[key] = params[key as keyof typeof params];
    //   }
    //   return acc;
    // }, {});
    // return this.http.get<any>(`${this.apiEvents}/by-camera`, { params: cleanParams });
    
    // Fake data - Tạo data theo camera
    const cameraData = Array.from({ length: 8 }, (_, i) => ({
      cameraSn: `CAM${String(i + 1).padStart(3, '0')}`,
      cameraName: `Camera ${i + 1}`,
      location: `Vị trí ${i + 1}`,
      count: Math.floor(Math.random() * 200) + 50,
      eventTypes: {
        traffic: Math.floor(Math.random() * 100) + 20,
        person: Math.floor(Math.random() * 100) + 30
      }
    }));
    return of({
      success: true,
      data: cameraData
    }).pipe(delay(300));
  }

  getMapLocations(params?: any): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.get(`${this.apiUrl}/locations`, { params });
    
    // Fake data - Tạo data vị trí cho bản đồ (tọa độ Hà Nội và xung quanh)
    const mapData = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      cameraSn: `CAM${String(i + 1).padStart(3, '0')}`,
      cameraName: `Camera ${i + 1}`,
      location: `Vị trí ${i + 1}`,
      latitude: 21.0285 + (Math.random() - 0.5) * 0.1,  // Hà Nội latitude ± 0.05
      longitude: 105.8542 + (Math.random() - 0.5) * 0.1, // Hà Nội longitude ± 0.05
      status: i % 4 === 0 ? 'offline' : 'online',
      type: i % 2 === 0 ? 'traffic' : 'person',
      eventCount: Math.floor(Math.random() * 150) + 20,
      lastEventTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      events: {
        total: Math.floor(Math.random() * 150) + 20,
        traffic: Math.floor(Math.random() * 80) + 10,
        person: Math.floor(Math.random() * 70) + 10,
        today: Math.floor(Math.random() * 30) + 5
      }
    }));
    return of({
      success: true,
      data: mapData
    }).pipe(delay(300));
  }

  getEventMapLocations(params: {
    fromUtc?: string,
    toUtc?: string,
    eventType?: string
  }): Observable<any> {
    // TODO: Uncomment when API is ready
    // return this.http.get(`${this.apiEvents}/map-locations`, { params });
    
    // Fake data - Tạo data sự kiện trên bản đồ
    const eventMapData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      eventId: `EVT${String(i + 1).padStart(5, '0')}`,
      eventType: ['traffic', 'person', 'helmet', 'redLight', 'wrongLane'][Math.floor(Math.random() * 5)],
      cameraSn: `CAM${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
      cameraName: `Camera ${Math.floor(Math.random() * 10) + 1}`,
      latitude: 21.0285 + (Math.random() - 0.5) * 0.1,
      longitude: 105.8542 + (Math.random() - 0.5) * 0.1,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      imageUrl: `https://picsum.photos/400/300?random=${i}`,
      description: `Sự kiện ${i + 1}`
    }));
    return of({
      success: true,
      data: eventMapData
    }).pipe(delay(300));
  }
}
