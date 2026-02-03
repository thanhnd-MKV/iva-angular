import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
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
import { CustomPaginatorComponent } from '../../shared/custom-paginator/custom-paginator.component';
import { SSEService } from '../../core/services/sse.service';
import { CameraService } from '../camera/camera.service';
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
    BaseTableComponent,
    CustomPaginatorComponent
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
  pageSize = 17; // Default pageSize, will be calculated based on screen size
  totalItems = 0;
  totalPages = 0;
  pageIndex = 0;
  
  // Computed property to decide if pagination should be shown
  get shouldShowPagination(): boolean {
    const show = this.totalPages > 1 || this.totalItems > this.pageSize;
    return show;
  }

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

  // Camera options for dropdown filter
  cameraOptions: { label: string; value: string }[] = [
    { label: 'Tất cả Camera', value: '' }
  ];

  
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
    private sseService: SSEService,
    private cameraService: CameraService
  ) {
    super();
  }

  // Host listener to listen for window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculatePageSize();
  }

  override ngOnInit() {
    console.log('🚀 ObjectEventsComponent ngOnInit called');
    super.ngOnInit();
    this.calculatePageSize(); // Calculate pageSize based on screen size
    console.log('🖥️ PageSize calculated based on screen size:', this.pageSize);
  }

  // Calculate pageSize based on screen height for responsive design
  private calculatePageSize(): void {
    const screenHeight = window.innerHeight;
    
    // Calculate based on actual UI measurements
    const headerHeight = 40;        // Main header + breadcrumb
    const searchBarHeight = 40;     // Search bar + filter buttons
    const tableHeaderHeight = 42;   // Table header row
    const paginationHeight = 40;    // Pagination component
    const margins = 10;             // Top/bottom margins
    
    const reservedHeight = headerHeight + searchBarHeight + tableHeaderHeight + paginationHeight + margins;
    const availableHeight = screenHeight - reservedHeight;
    const rowHeight = 44; // Measured from actual UI (each row ~44px)
    
    // Calculate number of rows that can be displayed
    const calculatedRows = Math.floor(availableHeight / rowHeight);
    
    // Apply bounds
    let newPageSize = Math.max(10, Math.min(30, calculatedRows));

    // Only update if pageSize changed
    if (this.pageSize !== newPageSize) {
      console.log(`📏 Screen: ${screenHeight}px | Reserved: ${reservedHeight}px | Available: ${availableHeight}px | Row: ${rowHeight}px | Calculated: ${calculatedRows} | Final: ${newPageSize}`);
      this.pageSize = newPageSize;
      
      // If data already loaded, reload with new pageSize
      if (this.totalItems > 0) {
        this.currentPage = 0;
        this.loadEventList();
      }
    }
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
    
    // Load camera options from API
    this.loadCameraOptions();
    
    // Set default filters (threshold slider defaults to 70% = 0.7)
    this.activeFilters = {
      recognitionThreshold: 0.5 // Default threshold from UI slider
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
      current: this.currentPage + 1, // API expects page starting from 1
      size: this.pageSize,
      startDate: this.startDate,
      endDate: this.endDate,
      ...this.activeFilters // Include all active filters
    };

    this.objectService.getRelatedEvents(this.objectId, params).subscribe({
      next: (response: EventApiResponse) => {
        const events = response.data.records || [];
        this.tableData = this.mapEventsToTableData(events);
        this.totalItems = response.data.total || 0;
        this.pageSize = response.data.size || this.pageSize; // Sync pageSize with API
        
        // Calculate pagination
        this.totalPages = response.data.pages || Math.ceil(this.totalItems / this.pageSize);
        this.pageIndex = (response.data.current || 1) - 1;
        
        console.log('📄 Pagination Info:', {
          totalItems: this.totalItems,
          pageSize: this.pageSize,
          totalPages: this.totalPages,
          pageIndex: this.pageIndex,
          shouldShowPagination: this.shouldShowPagination
        });
        
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
    this.pageIndex = page;
    console.log('📄 Page changed to:', page, '| Tracking mode:', this.isTrackingMode);
    
    // Call appropriate load method based on mode
    if (this.isTrackingMode && this.objectId) {
      this.loadTrackingData(this.objectId);
    } else {
      this.loadEventList();
    }
  }

  selectMarker(index: number) {
    this.selectedMarkerIndex = index;
    const event = this.eventList[index];
    if (event.coordinates) {
      this.mapCenter = event.coordinates;
    }
  }

  viewEventDetail(row: any) {
    const eventId = row?.id || row?.eventId;
    if (!eventId) {
      console.error('❌ No event ID found in row:', row);
      return;
    }
    
    console.log('🔍 Navigating to event detail:', eventId);
    // Navigate to object-management event detail route to show correct breadcrumb
    this.router.navigate(['/object-management/event-detail', eventId], {
      state: { 
        returnUrl: `/object-management/events/${this.objectId}`,
        fromObjectManagement: true 
      }
    });
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
      current: this.currentPage + 1, // API expects 1-based page
      size: this.pageSize,
      ...this.activeFilters
    };
    
    this.objectService.getRelatedEvents(objectIdentifier, apiParams).subscribe({
      next: (response: EventApiResponse) => {
        const events = response.data.records || [];
        console.log(`✅ Loaded ${events.length} initial events from API`);
        
        // Map events to table data
        this.tableData = this.mapEventsToTableData(events);
        
        // Set pagination from API response
        this.totalItems = response.data.total || 0;
        this.pageSize = response.data.size || this.pageSize;
        this.totalPages = response.data.pages || Math.ceil(this.totalItems / this.pageSize);
        this.pageIndex = (response.data.current || 1) - 1;
        
        console.log('📄 Pagination Info (Tracking Mode):', {
          totalItems: this.totalItems,
          pageSize: this.pageSize,
          totalPages: this.totalPages,
          pageIndex: this.pageIndex,
          shouldShowPagination: this.shouldShowPagination
        });
        
        // Build tracking locations (always rebuild, even if empty)
        this.trackingLocations = events
          .filter((event: any) => event.latitude && event.longitude)
          .map((event: any) => {
            const thumbnailUrl = event.croppedImagePath || event.fullImagePath || '';
            console.log('🖼️ [MAP] Event image URLs:', {
              eventId: event.id,
              croppedImagePath: event.croppedImagePath,
              fullImagePath: event.fullImagePath,
              finalThumbnailUrl: thumbnailUrl,
              hasUrl: !!thumbnailUrl
            });
            return {
              lat: event.latitude,
              lng: event.longitude,
              id: event.id,
              eventId: event.id,
              timestamp: event.startTime || event.eventTime,
              cameraName: event.cameraName || 'Unknown',
              address: event.location || 'N/A',
              thumbnailUrl: thumbnailUrl
            };
          })
          .sort((a: TrackingLocation, b: TrackingLocation) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        
        console.log(`🗺️ Built ${this.trackingLocations.length} map locations`);
        
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

    // Only subscribe to SSE when on first page (real-time updates only make sense for page 1)
    if (this.currentPage !== 0) {
      console.log('⏸️ Skipping SSE connection - not on first page (current page:', this.currentPage, ')');
      return;
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
        
        // Only add to table if on first page (real-time updates)
        if (this.currentPage === 0) {
          // Add to beginning of table (newest first)
          this.tableData.unshift(mappedEvent);
          
          // Keep only last pageSize events
          if (this.tableData.length > this.pageSize) {
            this.tableData.pop();
          }
          
          // Increment total items
          this.totalItems++;
        } else {
          console.log('⏸️ Skipping SSE event table update - not on first page');
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
            thumbnailUrl: (() => {
              const url = mappedEvent.croppedImagePath || mappedEvent.fullImagePath || '';
              console.log('🖼️ [SSE] New event image:', {
                eventId: mappedEvent.id,
                croppedImagePath: mappedEvent.croppedImagePath,
                fullImagePath: mappedEvent.fullImagePath,
                finalUrl: url
              });
              return url;
            })()
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
        // this.snackBar.open('Lỗi kết nối SSE: ' + error.message, 'Đóng', { duration: 5000 });
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
    
    const imageUrl = data.croppedImagePath || data.fullImagePath || '';
    console.log('🖼️ [MAP-SSE] Mapping event image:', {
      eventId: data.id,
      croppedImagePath: data.croppedImagePath,
      fullImagePath: data.fullImagePath,
      finalImageUrl: imageUrl,
      hasImage: !!imageUrl,
      imageLength: imageUrl?.length || 0
    });
    
    return {
      id: data.id, // FE chỉ dùng id (số), không dùng eventId (string từ BE)
      objectId: data.objectId,
      category: data.eventCategory || data.eventType || 'PERSON',
      
      // Image - add this field for table display
      image: imageUrl,
      
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
      
      // Images - keep these for reference
      fullImagePath: data.fullImagePath,
      croppedImagePath: data.croppedImagePath,
      clipPath: data.clipPath,
      
      eventType: data.eventType || data.eventCategory,
      eventCategory: data.eventCategory || data.eventType
    };
  }

  /**
   * Load camera options from API
   */
  private loadCameraOptions(): void {
    console.log('📷 Loading camera options from API...');
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        console.log('✅ Camera options loaded:', cameras);
        // Filter out any "Tất cả Camera" from cameras to avoid duplicates
        const filteredCameras = cameras.filter(cam => cam.label !== 'Tất cả Camera' && cam.value !== '');
        this.cameraOptions = [
          { label: 'Tất cả Camera', value: '' },
          ...filteredCameras
        ];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading camera options:', error);
        // Keep default options if API fails
      }
    });
  }

  private mapEventsToTableData(events: any[]): any[] {
    return events.map(event => this.mapSSEToTableData({ data: event }));
  }

  /**
   * Get display images for the search bar
   * Returns array of image URLs from objectData
   */
  getDisplayImages(): string[] {
    if (!this.objectData) {
      return [];
    }

    // Priority: images array > avatarUrl > imagePath
    if (this.objectData.images && this.objectData.images.length > 0) {
      console.log('📷 Display images from images array:', this.objectData.images);
      return this.objectData.images;
    }

    if (this.objectData.avatarUrl) {
      console.log('📷 Display images from avatarUrl:', [this.objectData.avatarUrl]);
      return [this.objectData.avatarUrl];
    }

    if (this.objectData.imagePath) {
      console.log('📷 Display images from imagePath:', [this.objectData.imagePath]);
      return [this.objectData.imagePath];
    }

    console.log('📷 No display images available');
    return [];
  }
}
