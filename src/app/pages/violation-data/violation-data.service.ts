import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ViolationEvent } from './violation-data.model';

@Injectable({
  providedIn: 'root'
})
export class ViolationDataService {
  constructor(private http: HttpClient) {}

  getViolationData(): Observable<ViolationEvent[]> {
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
        images: [
          'https://picsum.photos/400/250?random=1',
          'https://picsum.photos/400/250?random=2',
          'https://picsum.photos/400/250?random=3'
        ],
        location: 'Duy Tan Intersection, Cau Giay, Hanoi',
        cameraName: 'Pole Camera 3',
        status: 'pending'
      },
      {
        id: 102,
        eventId: '1222.4322',
        name: 'Tran Duy Hung Intersection Camera',
        cameraSn: 'SN-CAM-112234',
        licensePlate: '29A-124.56',
        eventType: 'Speed Limit Violation',
        speed: '80 km/h',
        timestamp: '2025-08-25 09:15:30',
        imageUrl: 'https://picsum.photos/400/250?random=4',
        images: [
          'https://picsum.photos/400/250?random=4',
          'https://picsum.photos/400/250?random=5',
          'https://picsum.photos/400/250?random=6'
        ],
        location: 'Tran Duy Hung Intersection, Cau Giay, Hanoi',
        cameraName: 'Pole Camera 4',
        status: 'processed'
      },
      {
        id: 103,
        eventId: '1222.4323',
        name: 'Le Van Luong Street Camera',
        cameraSn: 'SN-CAM-112235',
        licensePlate: '29A-125.67',
        eventType: 'Red Light Violation',
        speed: '70 km/h',
        timestamp: '2025-08-25 10:45:10',
        imageUrl: 'https://picsum.photos/400/250?random=7',
        images: [
          'https://picsum.photos/400/250?random=7',
          'https://picsum.photos/400/250?random=8',
          'https://picsum.photos/400/250?random=9'
        ],
        location: 'Le Van Luong Street, Thanh Xuan, Hanoi',
        cameraName: 'Street Camera 1',
        status: 'pending'
      },
      {
        id: 104,
        eventId: '1222.4324',
        name: 'Nguyen Trai Street Camera',
        cameraSn: 'SN-CAM-112236',
        licensePlate: '29A-126.78',
        eventType: 'Speed Limit Violation',
        speed: '90 km/h',
        timestamp: '2025-08-25 11:20:05',
        imageUrl: 'https://picsum.photos/400/250?random=10',
        images: [
          'https://picsum.photos/400/250?random=10',
          'https://picsum.photos/400/250?random=11',
          'https://picsum.photos/400/250?random=12'
        ],
        location: 'Nguyen Trai Street, Thanh Xuan, Hanoi',
        cameraName: 'Street Camera 2',
        status: 'processed'
      },
      {
        id: 105,
        eventId: '1222.4325',
        name: 'Ho Tung Mau Street Camera',
        cameraSn: 'SN-CAM-112237',
        licensePlate: '29A-127.89',
        eventType: 'Red Light Violation',
        speed: '75 km/h',
        timestamp: '2025-08-25 12:10:25',
        imageUrl: 'https://picsum.photos/400/250?random=13',
        images: [
          'https://picsum.photos/400/250?random=13',
          'https://picsum.photos/400/250?random=14',
          'https://picsum.photos/400/250?random=15'
        ],
        location: 'Ho Tung Mau Street, Cau Giay, Hanoi',
        cameraName: 'Street Camera 3',
        status: 'pending'
      }
    ]);
  }
}