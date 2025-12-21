import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventData {
  id: number;
  eventId: string;
  name: string;
  cameraSn: string;
  cameraId?: number;
  cameraName: string;
  frameId?: string;
  
  // Event info
  eventType: string;
  eventCategory?: string;
  eventTime?: string;
  startTime?: string;
  duration?: number;
  
  // Location
  location: string;
  latitude?: number;
  longitude?: number;
  
  // Status
  status: 'pending' | 'processed' | boolean;
  createTime?: string;
  updateTime?: string;
  expiredTime?: string;
  
  // Media
  imageUrl?: string;
  images?: string[];
  imagePath?: string;
  fullImagePath?: string;
  croppedImagePath?: string;
  clipPath?: string | string[];
  
  // Vehicle attributes
  licensePlate?: string;
  speed?: string;
  vehicleColor?: string;
  vehicleModel?: string;
  vehicleType?: string;
  plateNumber?: string;
  
  // Person attributes
  attributes?: {
    topColor?: string | null;
    gender?: string | null;
    topCategory?: string | null;
    bottomCategory?: string | null;
    bottomColor?: string | null;
  };
  gender?: string | null;
  topColor?: string | null;
  topCategory?: string | null;
  bottomColor?: string | null;
  bottomCategory?: string | null;
  age?: string;
  ageRange?: string;
  personName?: string;
  
  // Legacy fields
  timestamp?: string;
  camera?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private apiUrl = '/api/admin/events';

  constructor(private http: HttpClient) {}

  getCameraList(params: any): Observable<EventData[]> {
    return of([ 
      {
        id: 101,
        eventId: '1222.4321',
        name: 'Duy Tan Intersection Camera',
        cameraSn: 'SN-CAM-112233',
        licensePlate: '29A-123.45',
        eventType: 'Red Light Violation',
        speed: '65 km/h',
        timestamp: '2025-08-25 08:30:15',
        imageUrl: 'https://picsum.photos/400/250?random=1',
        images: Array.from({ length: 12 }, (_, i) => `https://picsum.photos/400/250?random=${i + 1}`),
        location: 'Duy Tan Intersection, Cau Giay, Hanoi',
        cameraName: 'Pole Camera 3',
        status: 'pending'
      },
      {
        id: 102,
        eventId: '1222.4322',
        name: 'Kim Lien Tunnel Camera',
        cameraSn: 'SN-CAM-445566',
        licensePlate: '30F-555.88',
        eventType: 'Speeding',
        speed: '82 km/h',
        timestamp: '2025-08-25 09:15:40',
        imageUrl: 'https://picsum.photos/400/250?random=2',
        images: Array.from({ length: 8 }, (_, i) => `https://picsum.photos/400/250?random=${i + 13}`),
        location: 'Kim Lien Tunnel, Dong Da, Hanoi',
        cameraName: 'Entrance Camera',
        status: 'processed'
      },
      {
        id: 103,
        eventId: '1222.4323',
        name: 'Vinh Tuy Bridge Camera',
        cameraSn: 'SN-CAM-778899',
        licensePlate: '99A-012.34',
        eventType: 'Lane Violation',
        speed: '50 km/h',
        timestamp: '2025-08-25 11:05:00',
        imageUrl: 'https://picsum.photos/400/250?random=3',
        location: 'Vinh Tuy Bridge, Long Bien, Hanoi',
        cameraName: 'Lane 1 Monitoring Camera',
        status: 'processed'
      },
      {
        id: 104,
        eventId: '1222.4324',
        name: 'Nga Tu So Intersection Camera',
        cameraSn: 'SN-CAM-101112',
        licensePlate: '29B-987.65',
        eventType: 'Red Light Violation',
        speed: '55 km/h',
        timestamp: '2025-08-25 14:22:10',
        imageUrl: 'https://picsum.photos/400/250?random=4',
        location: 'Nga Tu So Intersection, Thanh Xuan, Hanoi',
        cameraName: 'Truong Chinh Corner Camera',
        status: 'pending'
      }
    ]);
  }

  getDetailEvent(id: number): Observable<EventData> {
    return this.http.get<EventData>(`${this.apiUrl}/${id}`);
  }

  getEventById(id: string): Observable<{ data: EventData }> {
    console.log('🌐 EventService.getEventById() called with id:', id);
    return this.http.get<{ data: EventData }>(`${this.apiUrl}/${id}`);
  } 
  
  getListEvents(params: any): Observable<{ data: { records: EventData[]; total: number; size: number; current: number; pages: number } }> {
    console.log('🌐 EventService.getListEvents() called with params:', params);
    console.log('📡 Making HTTP GET request to:', this.apiUrl + '/page');
    return this.http.get<{ data: { records: EventData[]; total: number; size: number; current: number; pages: number } }>(this.apiUrl + '/page', { params });
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
}
