import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { ObjectManagementService, ObjectData, EventApiResponse, EventData } from './object-management.service';
import { EventSearchBarComponent, FilterConfig } from '../../shared/event-search-bar/event-search-bar.component';
import { BaseErrorHandlerComponent } from '../../core/components/base-error-handler.component';
import { TrackingMapComponent, TrackingLocation } from '../../shared/components/tracking-map/tracking-map.component';
import { BaseTableComponent } from '../../shared/components/table/base-table.component';
import { SSEService } from '../../core/services/sse.service';
import { mapSearchParamsToAPI } from '../../shared/utils/api-params.mapper';

interface EventItem {
  id: string;
  objectId: string;
  dateTime: string;
  location: string;
  camera: string;
  eventType: string;
  images: string[];
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  cameraName?: string;
  cameraSn?: string;
  startTime?: string;
  eventTime?: string;
}

@Component({
  selector: 'app-object-events',
  templateUrl: './object-events.component.html',
  styleUrls: ['./object-events.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    EventSearchBarComponent,
    TrackingMapComponent,
    BaseTableComponent
  ]
})
export class ObjectEventsComponent extends BaseErrorHandlerComponent implements OnInit, OnDestroy {
  @ViewChild(EventSearchBarComponent) eventSearchBar!: EventSearchBarComponent;

  objectId: string = '';
  objectData: ObjectData | null = null;
  
  // SSE Subscription
  private sseSubscription?: Subscription;
  
  // Table configuration - giống person-event
  columnsToDisplay: string[] = [
    'image',
    'eventId',
    'attributes',
    'status',
    'startTime',
    'cameraName',
    'location'
  ];

  columnDefs: any = {
    image: {
      label: 'Hình ảnh',
      type: 'image',
      width: '80px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    },
    eventId: {
      label: 'ID/ Phân loại',
      type: 'id-category',
      width: '120px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    },
    attributes: {
      label: 'Thuộc tính',
      type: 'attributes',
      width: '180px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    },
    status: {
      label: 'Trạng thái',
      type: 'status',
      width: '90px',
      fontSize: '11px',
      fontWeight: '500',
      headerFontSize: '11px'
    },
    startTime: {
      label: 'Thời gian',
      type: 'date',
      width: '110px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    },
    cameraName: {
      label: 'Camera',
      type: 'text',
      width: '180px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    },
    location: {
      label: 'Vị trí',
      type: 'link',
      width: '120px',
      fontSize: '11px',
      fontWeight: '400',
      headerFontSize: '11px'
    }
  };

  // Data
  tableData: any[] = [];
  eventList: EventItem[] = [];
  isLoading = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;

  // Date range for filtering
  startDate: string = '';
  endDate: string = '';

  // Map related
  selectedMarkerIndex: number | null = null;
  mapCenter = { lat: 21.0285, lng: 105.8542 }; // Hanoi default

  // Tracking mode
  isTrackingMode = false;
  trackingTarget = '';
  trackingLocations: TrackingLocation[] = [];
  trackingLoading = false;
  selectedEventId: string = '';

  // Active filters state
  activeFilters: {
    recognitionThreshold?: number;
    gender?: string;
    cameraSn?: string;
    fromUtc?: string;
    toUtc?: string;
  } = {};

  
  // Filters
  eventFilters: FilterConfig[] = [
    {
      key: 'gender',
      label: 'Giới tính',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Nam', value: 'male' },
        { label: 'Nữ', value: 'female' }
      ],
      defaultValue: ''
    },
    {
      key: 'camera',
      label: 'Camera',
      options: [
        { label: 'Tất cả Camera', value: '' }
      ],
      defaultValue: ''
    },
   
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectManagementService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private sseService: SSEService
  ) {
    super();
  }

  override ngOnInit() {
    console.log('🚀 ObjectEventsComponent ngOnInit called');
    super.ngOnInit();
  }

  /**
   * Handle filter changes from event-search-bar component
   */
  onFilterChange(filters: { [key: string]: string }): void {
    console.log('🔍 Filter changed:', filters);
    
    // Map filter keys to API params
    this.activeFilters = {};
    
    if (filters['gender']) {
      this.activeFilters.gender = filters['gender'];
    }
    
    if (filters['camera']) {
      this.activeFilters.cameraSn = filters['camera'];
    }
    
    if (filters['recognitionThreshold']) {
      this.activeFilters.recognitionThreshold = parseFloat(filters['recognitionThreshold']);
    }
    
    // Reload data with new filters
    if (this.isTrackingMode && this.objectId) {
      this.loadTrackingData(this.objectId);
    }
  }

  /**
   * Handle date range changes
   */
  onDateRangeChange(dateRange: { startDate: string; endDate: string }): void {
    console.log('📅 Date range changed:', dateRange);
    
    // Convert to UTC format for API
    if (dateRange.startDate) {
      const startDateObj = new Date(dateRange.startDate);
      this.activeFilters.fromUtc = startDateObj.toISOString();
    }
    
    if (dateRange.endDate) {
      const endDateObj = new Date(dateRange.endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of day
      this.activeFilters.toUtc = endDateObj.toISOString();
    }
    
    // Reload data with new date range
    if (this.isTrackingMode && this.objectId) {
      this.loadTrackingData(this.objectId);
    }
  }

  override ngOnDestroy() {
    console.log('🔴 Component destroyed - unsubscribing from SSE');
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  protected initializeComponent(): void {
    console.log('🎬 initializeComponent called');
    this.objectId = this.route.snapshot.paramMap.get('id') || '';
    console.log('📌 Object ID:', this.objectId);
    
    // Set default filters (threshold slider defaults to 70% = 0.7)
    this.activeFilters = {
      recognitionThreshold: 0.7 // Default threshold from UI slider
    };
    
    if (this.objectId) {
      this.loadObjectData();
      // Mặc định bật tracking mode ngay
      this.isTrackingMode = true;
      this.trackingTarget = 'Xe ' + this.objectId;
      console.log('🎯 Initializing tracking mode for object:', this.objectId);
      console.log('🔜 About to call loadTrackingData...');
      this.loadTrackingData(this.objectId);
      console.log('✅ loadTrackingData called');
    } else {
      console.error('❌ No object ID found in route');
    }
  }

  protected onRetry(): void {
    this.loadEventList();
  }

  loadObjectData() {
    console.log('📥 Loading object data for ID:', this.objectId);
    console.log('🌐 Will call API: /api/admin/tracking-person/' + this.objectId);
    
    this.objectService.getObjectById(this.objectId).subscribe({
      next: (data) => {
        this.objectData = data;
        this.trackingTarget = data.name || 'ID: ' + this.objectId;
        console.log('✅ Object data loaded successfully:', data);
        console.log('📸 Avatar URL:', data.avatarUrl);
        console.log('👤 Name:', data.name);
        console.log('🔢 Appearances:', data.appearanceCount);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading object data:', error);
        // Don't set fallback data, just clear and use objectId
        this.trackingTarget = 'ID: ' + this.objectId;
        this.cdr.detectChanges();
      }
    });
  }

  loadEventList() {
    this.isLoading = true;
    
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      ...this.activeFilters // Include all active filters
    };

    this.objectService.getRelatedEvents(this.objectId, params).subscribe({
      next: (response: EventApiResponse) => {
        const events = response.data.records || [];
        this.tableData = this.mapEventsToTableData(events);
        this.totalItems = response.data.total || this.tableData.length;
        this.isLoading = false;
        console.log('✅ Loaded', this.tableData.length, 'events');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading events:', error);
        this.isLoading = false;
        this.tableData = [];
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(searchParams: any) {
    console.log('🔍 Search params received from UI:', searchParams);
    console.log('📅 Check dates in searchParams:');
    console.log('  - startDate:', searchParams.startDate, typeof searchParams.startDate);
    console.log('  - endDate:', searchParams.endDate, typeof searchParams.endDate);
    console.log('  - threshold:', searchParams.threshold);
    console.log('  - gender:', searchParams.gender);
    console.log('  - camera:', searchParams.camera);
    
    // Use mapper utility to convert UI params to API format
    this.activeFilters = mapSearchParamsToAPI(searchParams, {
      includeSuspectFilter: false // Don't add isSuspect here, it's added by service methods
    });
    
    console.log('📦 Mapped activeFilters for API:', this.activeFilters);
    console.log('🌍 Check UTC dates in activeFilters:');
    console.log('  - fromUtc:', this.activeFilters.fromUtc);
    console.log('  - toUtc:', this.activeFilters.toUtc);
    console.log('📍 API will be called with params:', {
      personId: this.objectId,
      ...this.activeFilters
    });
    
    // Update local date range for display
    if (searchParams.startDate) {
      this.startDate = searchParams.startDate;
    }
    if (searchParams.endDate) {
      this.endDate = searchParams.endDate;
    }
    
    // Reset to first page and reload data
    this.currentPage = 0;
    
    // Reload appropriate data based on mode
    if (this.isTrackingMode && this.objectId) {
      this.loadTrackingData(this.objectId);
    } else {
      this.loadEventList();
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadEventList();
  }

  selectMarker(index: number) {
    this.selectedMarkerIndex = index;
    const event = this.eventList[index];
    if (event.coordinates) {
      this.mapCenter = event.coordinates;
    }
  }

  viewEventDetail(eventId: string) {
    this.router.navigate(['/event/detail', eventId]);
  }

  goBack() {
    this.router.navigate(['/object-management']);
  }

  exportData() {
    // Implement export functionality
    console.log('Export data');
  }

  viewAdvancedTracking() {
    console.log('🎯 Enable tracking mode for object:', this.objectId);
    this.enableTrackingMode(this.objectId);
  }

  // ============= TRACKING MODE METHODS =============
  enableTrackingMode(objectIdentifier: string): void {
    console.log('🎯 Enabling tracking mode for object:', objectIdentifier);
    this.isTrackingMode = true;
    this.trackingTarget = this.objectData?.name || objectIdentifier;
    this.loadTrackingData(objectIdentifier);
  }

  disableTrackingMode(): void {
    console.log('🔴 Disabling tracking mode');
    this.isTrackingMode = false;
    this.trackingTarget = '';
    this.trackingLocations = [];
    this.trackingLoading = false;
    this.selectedEventId = '';
    
    // Unsubscribe from SSE
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = undefined;
    }
    
    // Reload normal data
    this.loadEventList();
  }

  loadTrackingData(objectIdentifier: string): void {
    console.log('='.repeat(60));
    console.log('🎯 loadTrackingData START');
    console.log('📌 Object ID:', objectIdentifier);
    console.log('📡 SSE Service:', this.sseService ? 'Available' : 'NOT AVAILABLE');
    console.log('🔍 Active filters:', this.activeFilters);
    console.log('='.repeat(60));
    
    this.trackingLoading = true;
    // Reset map data immediately
    this.trackingLocations = [];
    this.tableData = [];
    this.cdr.detectChanges(); // Trigger map clear

    // Load initial suspect events from API with filters and personId
    console.log('📥 Loading initial suspect events from API...');
    const apiParams = {
      page: 0,
      pageSize: 50,
      ...this.activeFilters
    };
    
    this.objectService.getRelatedEvents(objectIdentifier, apiParams).subscribe({
      next: (response: EventApiResponse) => {
        const events = response.data.records || [];
        console.log(`✅ Loaded ${events.length} initial events from API`);
        
        // Map events to table data
        this.tableData = this.mapEventsToTableData(events);
        
        // Build tracking locations (always rebuild, even if empty)
        this.trackingLocations = events
          .filter((event: any) => event.latitude && event.longitude)
          .map((event: any) => ({
            lat: event.latitude,
            lng: event.longitude,
            id: event.id,
            eventId: event.id, // Map từ id để match với selectedEventId
            timestamp: event.startTime || event.eventTime,
            cameraName: event.cameraName || 'Unknown',
            address: event.location || 'N/A',
            thumbnailUrl: event.croppedImagePath || event.fullImagePath || ''
          }))
          .sort((a: TrackingLocation, b: TrackingLocation) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        
        console.log(`🗺️ Built ${this.trackingLocations.length} map locations`);
        
        this.totalItems = this.tableData.length;
        this.trackingLoading = false;
        this.cdr.detectChanges(); // Trigger map update with new data
        
        console.log('✅ Initial data loaded. Now connecting to SSE for real-time updates...');
      },
      error: (error: any) => {
        console.error('❌ Error loading initial events:', error);
        // Clear everything and trigger update
        this.trackingLocations = [];
        this.tableData = [];
        this.trackingLoading = false;
        this.cdr.detectChanges(); // Trigger map clear on error
        console.log('🗺️ Map cleared due to error');
      }
    });

    console.log('📡 Starting SSE connection for real-time updates...');
    
    // Unsubscribe previous connection if exists
    if (this.sseSubscription) {
      console.log('🔄 Closing previous SSE connection');
      this.sseSubscription.unsubscribe();
    }

    console.log('🔌 Subscribing to global SSE stream...');
    
    // Subscribe to global shared SSE stream (already connected in MainLayout)
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: (notification) => {
        console.log('✅ ✅ ✅ SSE Event received:', notification);
        console.log('📦 Event data:', notification.data);
        
        // Map SSE notification to table data
        const mappedEvent = this.mapSSEToTableData(notification);
        console.log('📋 Mapped event:', mappedEvent);
        
        // Validate event: must have valid id
        if (!mappedEvent.id) {
          console.log('⚠️ Skipping invalid SSE event - no ID');
          return;
        }
        
        // Filter by date range if active
        if (this.activeFilters.fromUtc || this.activeFilters.toUtc) {
          const eventTime = new Date(mappedEvent.startTime || mappedEvent.eventTime);
          const eventTimeMs = eventTime.getTime();
          
          if (this.activeFilters.fromUtc) {
            const fromTimeMs = new Date(this.activeFilters.fromUtc).getTime();
            if (eventTimeMs < fromTimeMs) {
              console.log('⏳ Skipping SSE event - before date range:', {
                eventTime: eventTime.toISOString(),
                fromUtc: this.activeFilters.fromUtc
              });
              return;
            }
          }
          
          if (this.activeFilters.toUtc) {
            const toTimeMs = new Date(this.activeFilters.toUtc).getTime();
            if (eventTimeMs > toTimeMs) {
              console.log('⏳ Skipping SSE event - after date range:', {
                eventTime: eventTime.toISOString(),
                toUtc: this.activeFilters.toUtc
              });
              return;
            }
          }
        }
        
        // Add to beginning of table (newest first)
        this.tableData.unshift(mappedEvent);
        
        // Keep only last 50 events
        if (this.tableData.length > 50) {
          this.tableData.pop();
        }
        
        // Add to tracking locations if has coordinates
        if (mappedEvent.latitude && mappedEvent.longitude) {
          const trackingLoc: TrackingLocation = {
            lat: mappedEvent.latitude,
            lng: mappedEvent.longitude,
            id: mappedEvent.id,
            eventId: mappedEvent.id, // Map từ id để match với selectedEventId
            timestamp: mappedEvent.startTime,
            cameraName: mappedEvent.cameraName,
            address: mappedEvent.location || 'N/A',
            thumbnailUrl: mappedEvent.croppedImagePath || mappedEvent.fullImagePath || ''
          };
          
          this.trackingLocations.push(trackingLoc);
          
          // Sort by timestamp
          this.trackingLocations.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
        
        this.totalItems = this.tableData.length;
        this.trackingLoading = false;
        this.cdr.detectChanges();
        
        // Show toast with detailed info
        const eventInfo = mappedEvent.suspectName 
          ? `${mappedEvent.suspectName} - ${mappedEvent.location}` 
          : `${mappedEvent.eventType} - ${mappedEvent.location}`;
        
        this.snackBar.open(
          `🔔 Sự kiện mới: ${eventInfo}`,
          'Xem',
          { duration: 5000 }
        ).onAction().subscribe(() => {
          this.selectedEventId = mappedEvent.id;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('❌ ❌ ❌ SSE connection error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        this.trackingLoading = false;
        this.snackBar.open('Lỗi kết nối SSE: ' + error.message, 'Đóng', { duration: 5000 });
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('🏁 SSE connection completed');
      }
    });
    
    console.log('📌 SSE subscription created:', !!this.sseSubscription);
  }

  handleRowClick(event: any): void {
    if (this.isTrackingMode && event?.id) {
      console.log('🎯 Row clicked in tracking mode:', event.id);
      this.selectedEventId = event.id;
      this.cdr.detectChanges();
    }
  }

  // ============= SSE DATA MAPPING =============
  private mapSSEToTableData(notification: any): any {
    const data = notification.data || notification;
    
    return {
      id: data.id, // FE chỉ dùng id (số), không dùng eventId (string từ BE)
      objectId: data.objectId,
      category: data.eventCategory || data.eventType || 'PERSON',
      
      // Attributes - combine all available attributes
      attributes: {
        name: data.suspectName,
        distance: data.suspectDistance,
        gender: data.gender,
        topColor: data.topColor,
        bottomColor: data.bottomColor,
        plateNumber: data.plateNumber,
        vehicleType: data.vehicleType,
        vehicleColor: data.vehicleColor
      },
      
      suspectName: data.suspectName,
      suspectId: data.suspectId,
      status: data.status || 'Chưa xử lý',
      startTime: data.startTime || data.eventTime || new Date().toISOString(),
      eventTime: data.eventTime || data.startTime,
      cameraName: data.cameraName || 'Unknown',
      cameraSn: data.cameraSn,
      location: data.location || 'N/A',
      latitude: data.latitude,
      longitude: data.longitude,
      
      // Images
      fullImagePath: data.fullImagePath,
      croppedImagePath: data.croppedImagePath,
      clipPath: data.clipPath,
      
      eventType: data.eventType || data.eventCategory,
      eventCategory: data.eventCategory || data.eventType
    };
  }

  private mapEventsToTableData(events: any[]): any[] {
    return events.map(event => this.mapSSEToTableData({ data: event }));
  }
}
