import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '../../environments/environment';

// Service for managing object/person tracking and events
// Tracking person data from API
export interface TrackingPersonData {
  id: number;
  fullName: string;
  trackingType: string; // "Truy nã", "Giám sát"
  imagePath: string;
  image?: string; // Mapped from imagePath for base-table compatibility
  numberOfAppearances: number;
  updatedAt: string;
}

// API Response structure
export interface TrackingPersonApiResponse {
  success: boolean;
  code: string;
  message: string | null;
  data: {
    records: TrackingPersonData[];
    total: number;
    size: number;
    current: number;
    orders: any[];
    optimizeCountSql: boolean;
    searchCount: boolean;
    countId: string | null;
    maxLimit: number | null;
    pages: number;
  };
}

// Legacy Event data interface (kept for backward compatibility)
export interface EventData {
  id: number;
  eventId: string;
  cameraSn: string;
  cameraId: number;
  cameraName: string;
  frameId: number | null;
  attributes: {
    topColor: string | null;
    gender: string | null;
    topCategory: string | null;
    bottomCategory: string | null;
    plateNumber: string | null;
    bottomColor: string | null;
  };
  eventType: string;
  eventCategory: string;
  startTime: string;
  eventTime: string;
  duration: number | null;
  location: string;
  longitude: number;
  latitude: number;
  status: boolean;
  createTime: string;
  updateTime: string | null;
  fullImagePath: string | null;
  croppedImagePath: string | null;
  clipPath: string[];
  expiredTime: string;
  images?: string[];
  name?: string;
  topCategory: string | null;
  bottomCategory: string | null;
  bottomColor: string | null;
  topColor: string | null;
  gender: string | null;
  plateNumber: string | null;
}

// API Response structure
export interface EventApiResponse {
  success: boolean;
  code: string;
  message: string | null;
  data: {
    records: EventData[];
    total: number;
    size: number;
    current: number;
    orders: any[];
    optimizeCountSql: boolean;
    searchCount: boolean;
    countId: string | null;
    maxLimit: number | null;
    pages: number;
  };
}

export interface ObjectData {
  id: number;
  fullName: string;
  objectId: number | string;
  trackingType: string;
  imagePath?: string;
  numberOfAppearances?: number;
  createdAt?: string;
  updatedAt?: string;
  dataSource?: string;
  
  // Personal information fields
  citizenId?: string;
  nationality?: string;
  citizenIdIssuedDate?: string;
  citizenIdIssuedPlace?: string;
  dateOfBirth?: string;
  gender?: string;
  hometown?: string;
  permanentResidence?: string;
  
  // Legacy fields (for backward compatibility)
  name?: string;
  avatarUrl?: string;
  groupName?: string;
  groupType?: 'VIP' | 'Khach' | 'Blacklist';
  appearanceCount?: number;
  lastUpdated?: string;
  cccdNumber?: string;
  cccdIssueDate?: string;
  cccdIssuePlace?: string;
  origin?: string;
  residence?: string;
  images?: string[];
}

export interface ObjectListResponse {
  data: TrackingPersonData[];
  total: number;
  current: number;
  size: number;
}

export interface ObjectSearchParams {
  page?: number;
  current?: number;
  size?: number;
  searchText?: string;
  searchField?: string;
  groupType?: string;
  trackingType?: string; // Add trackingType for API filtering
  dataSource?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ObjectManagementService {
  // API endpoints
  private eventsApiUrl = `${environment.apiUrl}/api/admin/events/page`;
  private trackingPersonApiUrl = `${environment.apiUrl}/api/admin/tracking-person/page`;
  private trackingPersonBaseUrl = `${environment.apiUrl}/api/admin/tracking-person`;
  
  // Toggle for using fake data (set to false when backend is ready)
  private useFakeData = false;

  // Fake data matching the UI screenshot
  private fakeEventData: EventData[] = this.generateFakeEventData();

  constructor(private http: HttpClient) {}

  private generateFakeEventData(): EventData[] {
    const data: EventData[] = [];
    const names = [
      'Nguyen Van Hoang Lam',
      'Tran Thi Mai',
      'Le Van Thanh',
      'Pham Minh Duc',
      'Hoang Thi Lan',
      'Vu Van Nam',
      'Do Thi Huong',
      'Nguyen Minh Tuan',
      'Tran Van Khanh',
      'Le Thi Thu'
    ];
    const groupTypes: Array<'VIP' | 'Khach' | 'Blacklist'> = ['VIP', 'Khach', 'Blacklist'];
    const dataSources = ['Đóng bộ', 'Thủ công'];

    for (let i = 1; i <= 100; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomGroup = groupTypes[Math.floor(Math.random() * groupTypes.length)];
      const randomSource = dataSources[Math.floor(Math.random() * dataSources.length)];
      const randomCount = Math.floor(Math.random() * 500) + 50;
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const randomHours = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);
      const randomSeconds = Math.floor(Math.random() * 60);

      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);
      date.setHours(randomHours, randomMinutes, randomSeconds);

      data.push({
        id: i,
        eventId: `FAKE-${date.getTime()}-Face_Recognition-${i}`,
        cameraSn: '0123456789ABCDEF',
        cameraId: Math.floor(Math.random() * 10) + 1,
        cameraName: `Camera ${Math.floor(Math.random() * 10) + 1}`,
        frameId: Math.random() > 0.5 ? Math.floor(Math.random() * 1000000) : null,
        attributes: {
          topColor: null,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          topCategory: null,
          bottomCategory: null,
          plateNumber: null,
          bottomColor: null
        },
        eventType: 'Face_Recognition',
        eventCategory: 'PERSON',
        startTime: date.toISOString(),
        eventTime: date.toISOString(),
        duration: null,
        location: 'The Vista',
        longitude: 105.78293616746109,
        latitude: 21.030194980619505,
        status: false,
        createTime: date.toISOString(),
        updateTime: null,
        fullImagePath: null,
        croppedImagePath: `https://i.pravatar.cc/150?img=${10 + (i % 60)}`,
        clipPath: [],
        expiredTime: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        topCategory: null,
        bottomCategory: null,
        bottomColor: null,
        topColor: null,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        plateNumber: null
      });
    }

    return data;
  }

  getObjectList(params: ObjectSearchParams): Observable<ObjectListResponse> {
    // Use fake data if backend not ready
    if (this.useFakeData) {
      // Convert EventData to TrackingPersonData for fake data
      const fakeTrackingData: TrackingPersonData[] = this.fakeEventData.map((event, index) => ({
        id: event.id,
        fullName: event.cameraName,
        trackingType: event.eventCategory === 'FACE' ? 'Truy nã' : 'Giám sát',
        imagePath: event.croppedImagePath || event.fullImagePath || '',
        numberOfAppearances: Math.floor(Math.random() * 50) + 1,
        updatedAt: event.updateTime || event.createTime
      }));

      const pageSize = params.size || 10;
      const page = params.page || 1;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      let filteredData = [...fakeTrackingData];
      
      // Apply filters
      if (params.searchText) {
        const searchLower = params.searchText.toLowerCase();
        filteredData = filteredData.filter(obj => {
          return obj.fullName.toLowerCase().includes(searchLower);
        });
      }
      
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      return of({
        data: paginatedData,
        total: filteredData.length,
        current: page,
        size: pageSize
      }).pipe(delay(500)); // Simulate network delay
    }
    
    // Real API call - Use tracking-person API
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.searchText) {
      httpParams = httpParams.set('searchText', params.searchText);
    }
    if (params.searchField) {
      httpParams = httpParams.set('searchField', params.searchField);
    }
    if (params.groupType) {
      httpParams = httpParams.set('groupType', params.groupType);
    }
    if (params.trackingType) {
      httpParams = httpParams.set('trackingType', params.trackingType);
    }
    if (params.dataSource) {
      httpParams = httpParams.set('dataSource', params.dataSource);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    // Call tracking-person API directly
    return this.http.get<TrackingPersonApiResponse>(this.trackingPersonApiUrl, { params: httpParams })
      .pipe(
        map(response => {
          return {
            data: response.data.records,
            total: response.data.total,
            current: response.data.current,
            size: response.data.size
          };
        })
      );
  }

  /**
   * Get object details by ID from tracking-person API
   */
  getObjectById(id: string): Observable<ObjectData> {
    // Define response wrapper interface matching actual API response
    interface TrackingPersonDetailResponse {
      success: boolean;
      code: string;
      message: string | null;
      data: {
        id: number;
        fullName: string;
        trackingType: string;
        parentsName: string | null;
        offense: string | null;
        sentenceDays: number | null;
        issuingUnit: string | null;
        numberOfAppearances: number;
        imagePath: string;
        createdAt: string;
        updatedAt: string;
        citizenId: string | null;
        nationality: string | null;
        citizenIdIssuedDate: string | null;
        citizenIdIssuedPlace: string | null;
        dateOfBirth: string | null;
        gender: string | null;
        hometown: string | null;
        permanentResidence: string | null;
      };
    }
    
    return this.http.get<TrackingPersonDetailResponse>(`${this.trackingPersonBaseUrl}/${id}`)
      .pipe(
        map((response: TrackingPersonDetailResponse) => {
          const person = response.data;
          // Return data matching ObjectData interface with BE structure
          return {
            id: person.id,
            fullName: person.fullName,
            objectId: person.id,
            trackingType: person.trackingType,
            imagePath: person.imagePath || '',
            numberOfAppearances: person.numberOfAppearances,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt,
            citizenId: person.citizenId || undefined,
            nationality: person.nationality || undefined,
            citizenIdIssuedDate: person.citizenIdIssuedDate || undefined,
            citizenIdIssuedPlace: person.citizenIdIssuedPlace || undefined,
            dateOfBirth: person.dateOfBirth || undefined,
            gender: person.gender || undefined,
            hometown: person.hometown || undefined,
            permanentResidence: person.permanentResidence || undefined,
            images: person.imagePath ? [person.imagePath] : [],
            // Legacy fields for backward compatibility
            name: person.fullName,
            avatarUrl: person.imagePath || '',
            groupName: 'Đối tượng',
            groupType: (person.trackingType as 'VIP' | 'Khach' | 'Blacklist') || 'VIP',
            dataSource: 'Camera AI',
            appearanceCount: person.numberOfAppearances,
            lastUpdated: person.updatedAt
          } as ObjectData;
        })
      );
  }

  /**
   * Get related events for a specific object/person using events API with isSuspect filter
   */
  getRelatedEvents(objectId: string, params?: { 
    startDate?: string; 
    endDate?: string; 
    page?: number; 
    current?: number; // API expects 'current' param for pagination
    size?: number;
    recognitionThreshold?: number;
    gender?: string;
    cameraSn?: string;
    fromUtc?: string;
    toUtc?: string;
  }): Observable<EventApiResponse> {
    let httpParams = new HttpParams()
      .set('isSuspect', 'true')
      .set('suspectId', objectId);
    
    if (params) {
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.current !== undefined) httpParams = httpParams.set('current', params.current.toString());
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.recognitionThreshold !== undefined) httpParams = httpParams.set('recognitionThreshold', params.recognitionThreshold.toString());
      if (params.gender) httpParams = httpParams.set('gender', params.gender);
      if (params.cameraSn) httpParams = httpParams.set('cameraSn', params.cameraSn);
      if (params.fromUtc) httpParams = httpParams.set('fromUtc', params.fromUtc);
      if (params.toUtc) httpParams = httpParams.set('toUtc', params.toUtc);
    }

    return this.http.get<EventApiResponse>(this.eventsApiUrl, { params: httpParams });
  }

  /**
   * Get suspect events from events API with isSuspect=true
   */
  getSuspectEvents(params?: { 
    page?: number; 
    size?: number;
    recognitionThreshold?: number;
    gender?: string;
    cameraSn?: string;
    fromUtc?: string;
    toUtc?: string;
  }): Observable<EventApiResponse> {
    let httpParams = new HttpParams().set('isSuspect', 'true');
    
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.recognitionThreshold !== undefined) httpParams = httpParams.set('recognitionThreshold', params.recognitionThreshold.toString());
      if (params.gender) httpParams = httpParams.set('gender', params.gender);
      if (params.cameraSn) httpParams = httpParams.set('cameraSn', params.cameraSn);
      if (params.fromUtc) httpParams = httpParams.set('fromUtc', params.fromUtc);
      if (params.toUtc) httpParams = httpParams.set('toUtc', params.toUtc);
    }

    return this.http.get<EventApiResponse>(this.eventsApiUrl, { params: httpParams });
  }

  /**
   * Create new tracking person with multipart/form-data
   * @param data - Form data containing images (File[]) and person info
   */
  createObject(data: { images: File[], person: any }): Observable<any> {
    const formData = new FormData();
    
    // Add images
    if (data.images && data.images.length > 0) {
      data.images.forEach((file: File) => {
        formData.append('images', file);
      });
    }
    
    // Add person JSON
    const personBlob = new Blob([JSON.stringify(data.person)], { type: 'application/json' });
    formData.append('person', personBlob);
    
    return this.http.post(this.trackingPersonBaseUrl, formData);
  }

  /**
   * Update existing tracking person
   */
  updateObject(id: string, data: any): Observable<any> {
    return this.http.put(`${this.trackingPersonBaseUrl}/${id}`, data);
  }

  /**
   * Delete tracking person
   */
  deleteObject(id: string): Observable<any> {
    return this.http.delete(`${this.trackingPersonBaseUrl}/${id}`);
  }
}
