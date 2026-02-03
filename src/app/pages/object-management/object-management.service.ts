import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

// Service for managing object/person tracking and events
// Tracking person data from API
export interface TrackingPersonData {
  id: number;
  objectId?: number; // User-defined ID for the object
  fullName: string;
  trackingType: string; // "Truy nã", "Giám sát"
  imagePath: string;
  image?: string; // Mapped from imagePath for base-table compatibility
  numberOfAppearances: number;
  updatedAt: string;
  dataSource?: string; // 'manual' or 'sync'
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

  constructor(private http: HttpClient) {}

  getObjectList(params: ObjectSearchParams): Observable<ObjectListResponse> {
    // Use fake data if backend not ready
    
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
        objectId?: number; // ID đối tượng - user-defined identifier
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
        dataSource: string | null; // 'manual' or 'sync'
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
            objectId: person.objectId || person.id, // Use objectId from BE, fallback to id if not present
            trackingType: person.trackingType,
            imagePath: person.imagePath || '',
            numberOfAppearances: person.numberOfAppearances,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt,
            dataSource: person.dataSource , // Map BE values to display text
            citizenId: person.citizenId || undefined,
            nationality: person.nationality || undefined,
            citizenIdIssuedDate: person.citizenIdIssuedDate || undefined,
            citizenIdIssuedPlace: person.citizenIdIssuedPlace || undefined,
            dateOfBirth: person.dateOfBirth || undefined,
            gender: person.gender || undefined,
            hometown: person.hometown || undefined,
            permanentResidence: person.permanentResidence || undefined,
            images: person.imagePath 
              ? person.imagePath.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
              : [],
            // Legacy fields for backward compatibility
            name: person.fullName,
            avatarUrl: person.imagePath || '',
            groupName: 'Đối tượng',
            groupType: (person.trackingType as 'VIP' | 'Khach' | 'Blacklist') || 'VIP',
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
   * Update existing tracking person - using formData format
   */
  updateObject(id: string, data: { person: any, images: File[] }): Observable<any> {
    const formData = new FormData();
    
    // Add new images if any
    if (data.images && data.images.length > 0) {
      data.images.forEach((file: File) => {
        formData.append('images', file);
      });
    }
    
    // Add person JSON as blob
    const personBlob = new Blob([JSON.stringify(data.person)], { type: 'application/json' });
    formData.append('person', personBlob);
    
    return this.http.put(`${this.trackingPersonBaseUrl}/${id}`, formData);
  }

  /**
   * Delete tracking person
   */
  deleteObject(id: string): Observable<any> {
    return this.http.delete(`${this.trackingPersonBaseUrl}/${id}`);
  }

  /**
   * Check if CCCD number already exists (for duplicate validation)
   * @param cccdNumber - CCCD number to check
   * @param currentObjectId - Current object ID (for edit mode, exclude self)
   * @returns Observable<boolean> - true if duplicate exists, false otherwise
   */
  checkCccdDuplicate(cccdNumber: string, currentObjectId?: string): Observable<boolean> {
    // API endpoint to check CCCD duplicate
    // Adjust the endpoint based on your actual BE API
    let params = new HttpParams().set('citizenId', cccdNumber);
    
    // Exclude current object when editing
    if (currentObjectId) {
      params = params.set('excludeId', currentObjectId);
      console.log('🔍 [Service] Checking CCCD duplicate with excludeId:', currentObjectId, 'CCCD:', cccdNumber);
    } else {
      console.log('🔍 [Service] Checking CCCD duplicate (no excludeId) for CCCD:', cccdNumber);
    }
    
    return this.http.get<TrackingPersonApiResponse>(this.trackingPersonApiUrl, { params })
      .pipe(
        map(response => {
          console.log('🔍 [Service] CCCD check response:', response.data.records.length, 'records found');
          if (response.data.records.length > 0) {
            console.log('🔍 [Service] Found records:', response.data.records.map(r => ({ id: r.id, fullName: r.fullName })));
          }
          // If any record found with this CCCD, it's a duplicate
          return response.data.records.length > 0;
        }),
        catchError((err) => {
          console.error('🔍 [Service] Error checking CCCD:', err);
          return of(false);
        })
      );
  }
}
