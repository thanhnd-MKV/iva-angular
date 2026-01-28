import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventData, EventService } from './event.service';
import { PermissionService } from '../../core/guards/permission.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { BaseTableComponent } from '../../shared/components/table/base-table.component';
import { Component, ViewChild, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CustomPaginatorComponent } from '../../shared/custom-paginator/custom-paginator.component';
import { EventSearchBarComponent, FilterConfig } from '../../shared/event-search-bar/event-search-bar.component';
import { ImageViewerComponent } from '../../shared/image-viewer/image-viewer.component';
import { EventDetailPopupComponent } from '../../shared/event-detail-popup/event-detail-popup.component';
import { MENU_ITEM_SETS, FilterMenuItem } from '../../shared/constants/filter-menu-items';
import { KeyboardShortcutHandler } from '../../shared/constants/keyboard-shortcut-handler';
import { BaseErrorHandlerComponent } from '../../core/components/base-error-handler.component';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { CameraService } from '../camera/camera.service';
import { TrackingMapComponent, TrackingLocation } from '../../shared/components/tracking-map/tracking-map.component';
import { mapSearchParamsToAPI } from '../../shared/utils/api-params.mapper';

@Component({
  selector: 'app-person-event',
  templateUrl: './person-event.component.html',
  styleUrls: ['./person-event.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    BaseTableComponent,
    CustomPaginatorComponent,
    EventSearchBarComponent,
    ImageViewerComponent,
    EventDetailPopupComponent,
    TrackingMapComponent
  ],
})
export class PersonEventComponent extends BaseErrorHandlerComponent implements OnInit {
  @ViewChild(EventSearchBarComponent) eventSearchBar!: EventSearchBarComponent;
  
  // Event filters configuration - for Person events
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
      key: 'topColor',
      label: 'Màu áo',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Trắng', value: 'white' },
        { label: 'Đen', value: 'black' },
        { label: 'Đỏ', value: 'red' },
        { label: 'Xanh dương', value: 'blue' },
        { label: 'Xanh lá', value: 'green' },
        { label: 'Vàng', value: 'yellow' }
      ],
      defaultValue: ''
    },
    {
      key: 'cameraSn',
      label: 'Camera',
      options: [
        { label: 'Tất cả Camera', value: '' }
      ],
      defaultValue: ''
    }
  ];
  
  queryFormModel: any = [];

  // Columns theo design và data structure thực
  columnsToDisplay: string[] = [
    'image',        // Hình ảnh
    'eventId',      // ID/ Phân loại (event ID)
    'attributes',   // Thuộc tính (attributes object)
    'status',       // Trạng thái
    'startTime',    // Thời gian (eventTime/startTime)
    'cameraName',   // Camera (cameraName)
    'location',     // Vị trí
  ];

  // Column definitions theo data structure backend
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

  // Data properties
  tableData: any[] = []; // Data hiển thị trên trang hiện tại
  allData: any[] = []; // Toàn bộ data từ API (client-side pagination)
  selectTableItem: any[] = [];
  selectedEvent: any | null = null;

  // ============= CLIENT-SIDE PAGINATION (TEMPORARY) =============
  // TODO: Remove when BE implements server-side pagination
  // Khi BE update, chỉ cần:
  // 1. Xóa allData property
  // 2. Xóa updateTableDataForCurrentPage() method  
  // 3. Restore original getListEvents() và loadTableData() logic
  // 4. Update onPageChange() to call API with page params
  pageNumber: number = 0;
  pageSize = 13; // Default pageSize, will be calculated based on screen size
  total = 0;
  totalItems = 0;
  totalPages = 0;
  pageIndex = 0;
  
  loading = false;
  detailLoading = false; // Thêm loading state cho detail
  
  // Computed property để quyết định có hiển thị pagination không
  get shouldShowPagination(): boolean {
    // For server-side pagination, show if totalPages > 1 OR totalItems > pageSize
    return this.totalPages > 1 || this.totalItems > this.pageSize;
  }
  isEdit = false;
  dialogFormVisible = false;
  formModel: any = {};
  
  // Event detail popup
  showEventDetailPopup = false;
  selectedEventDetail: any = null;
  
  // Tracking mode
  isTrackingMode = false;
  trackingTarget = ''; // Person ID or identifier
  trackingLocations: TrackingLocation[] = [];
  trackingLoading = false;
  selectedEventId: string = '';

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private eventService: EventService,
    private permission: PermissionService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private cameraService: CameraService
  ) { 
    super(); // Call parent constructor
  }

  // Host listener để lắng nghe phím tắt
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    KeyboardShortcutHandler.handleKeyboardEvent(
      event, 
      this.menuItems, 
      (menuItem) => this.selectOptionAndFocusInput(menuItem)
    );
  }

  // Host listener để lắng nghe window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculatePageSize();
  }

  // Hàm select option và focus vào input
  selectOptionAndFocusInput(menuItem: any) {
    // Keyboard shortcuts disabled for new search bar
    console.log('Keyboard shortcut triggered:', menuItem);
  }

  override ngOnInit() {
    super.ngOnInit(); // Call parent ngOnInit - will call initializeComponent()
    this.calculatePageSize(); // Calculate pageSize based on screen size
    this.loadCameraOptions();
    console.log('🖥️ PageSize calculated based on screen size:', this.pageSize);
    
    // Load initial data using server-side pagination
    this.loadTableData();
  }

  // Calculate pageSize based on screen height for responsive design
  private calculatePageSize(): void {
    const screenHeight = window.innerHeight;
    
    // Tính toán dựa trên đo đạc thực tế từ UI
    const headerHeight = 40;        // Main header + breadcrumb
    const searchBarHeight = 40;    // Search bar + filter buttons
    const tableHeaderHeight = 42;   // Table header row
    const paginationHeight = 40;    // Pagination component
    const margins = 10;             // Top/bottom margins
    
    const reservedHeight = headerHeight + searchBarHeight + tableHeaderHeight + paginationHeight + margins;
    const availableHeight = screenHeight - reservedHeight;
    const rowHeight = 44; // Đo từ UI thực tế (mỗi row khoảng 44px)
    
    // Tính số row có thể hiển thị
    const calculatedRows = Math.floor(availableHeight / rowHeight);
    
    // Áp dụng bounds
    let newPageSize = Math.max(10, Math.min(30, calculatedRows));

    // Only update if pageSize changed
    if (this.pageSize !== newPageSize) {
      console.log(`📏 Screen: ${screenHeight}px | Reserved: ${reservedHeight}px | Available: ${availableHeight}px | Row: ${rowHeight}px | Calculated: ${calculatedRows} | Final: ${newPageSize}`);
      this.pageSize = newPageSize;
      
      // If data already loaded, reload with new pageSize
      if (this.totalItems > 0) {
        this.pageNumber = 0;
        this.pageIndex = 0;
        this.loadTableData();
      }
    }
  }

  private loadCameraOptions(): void {
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        // Tìm filter camera trong eventFilters và cập nhật options
        const cameraFilter = this.eventFilters.find(filter => filter.key === 'cameraSn');
        if (cameraFilter) {
          // Filter out any "Tất cả Camera" from cameras to avoid duplicates
          const filteredCameras = cameras.filter(cam => cam.label !== 'Tất cả Camera' && cam.value !== '');
          cameraFilter.options = [
            { label: 'Tất cả Camera', value: '' },
            ...filteredCameras
          ];
        }
      },
      error: (error) => {
        console.error('Error loading camera options:', error);
      }
    });
  }

  // Implement required abstract methods
  protected initializeComponent(): void {
    // Data will be loaded in ngOnInit via loadTableData()
    // Do nothing here to avoid race condition
  }

  protected onRetry(): void {
    // Clear error và retry load data
    this.markErrorAsHandled();
    this.getListEvents();
  }

  // Lấy ảnh từ croppedImagePath hoặc fullImagePath
  private getImagePath(item: any): string {
    // Ưu tiên croppedImagePath, fallback sang fullImagePath
    if (item.croppedImagePath) return item.croppedImagePath;
    if (item.fullImagePath) return item.fullImagePath;
    // Backward compatibility với imagePath cũ
    if (item.imagePath) {
      const imageUrls = item.imagePath.split(',');
      return imageUrls[0]?.trim() || '/assets/images/no-image.png';
    }
    return '/assets/images/no-image.png';
  }

  // Map status từ backend boolean thành text
  mapEventStatus(status: boolean | null): string {
    if (status === true) {
      return 'processed'; // Đã xử lý
    } else if (status === false) {
      return 'pending'; // Chưa xử lý
    }
    return 'unknown'; // Không xác định
  }

  getListEvents() {
    this.loading = true;
    
    // Clear any previous errors before making new API call
    this.clearError();
    
    // Chỉ load data 1 lần từ API (không gửi page params vì BE chưa support)
    this.eventService.getListEvents({}).subscribe({
      next: (response) => {
        console.log('🔍 Full API Response:', response);
        
        if (response && response.data && response.data.records) {
          // Map toàn bộ data từ backend theo cấu trúc mới
          this.allData = response.data.records.map((item: any) => ({
            ...item,
            // Map image từ croppedImagePath hoặc fullImagePath
            image: this.getImagePath(item),
            // Keep attributes object as is for base-table to format
            // attributes: item.attributes (already in ...item)
            // Map status từ boolean sang text
            status: this.mapEventStatus(item.status),
            // Sử dụng startTime hoặc eventTime
            startTime: item.startTime || item.eventTime,
            // Map cameraName (có thể fallback sang cameraSn nếu cần)
            cameraName: item.cameraName || item.cameraSn || 'N/A',
            // Map location
            location: item.location || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A'),
            // Ensure clipPath is included
            clipPath: item.clipPath || []
          }));
          
          // Client-side pagination setup
          this.totalItems = this.allData.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.total = this.totalItems;
          
          // Reset về trang đầu nếu trang hiện tại vượt quá tổng số trang
          if (this.pageNumber >= this.totalPages && this.totalPages > 0) {
            this.pageNumber = 0;
            this.pageIndex = 0;
          }
          
          // Cắt data cho trang hiện tại
          this.updateTableDataForCurrentPage();
          
          console.log('🔍 Client-side Pagination Debug:');
          console.log('  - Total items:', this.totalItems);
          console.log('  - Page size:', this.pageSize);
          console.log('  - Total pages:', this.totalPages);
          console.log('  - Current page:', this.pageNumber);
          console.log('  - Should show pagination:', this.shouldShowPagination);
          console.log('  - Current page data length:', this.tableData.length);
        } else {
          console.warn('No data in API response');
          this.allData = [];
          this.tableData = [];
          this.total = 0;
          this.totalItems = 0;
        }
        
        // Clear error state on successful API call
        this.clearError();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
        this.allData = [];
        this.tableData = [];
        this.total = 0;
        this.totalItems = 0;
      }
    });
  }

  // ============= TEMPORARY CLIENT-SIDE PAGINATION HELPER =============
  // TODO: Remove this method when BE implements server-side pagination
  private updateTableDataForCurrentPage(): void {
    const startIndex = this.pageNumber * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.tableData = this.allData.slice(startIndex, endIndex);
    
    console.log(`📄 CLIENT-SIDE: Showing items ${startIndex + 1}-${Math.min(endIndex, this.totalItems)} of ${this.totalItems}`);
  }

  // Load chi tiết event cho panel bên phải với loading animation
  getDetailEvent(id: number) {
    this.detailLoading = true;
    this.selectedEvent = null; // Clear previous data
    this.cdr.detectChanges();

    setTimeout(() => {
      this.eventService.getDetailEvent(id).subscribe({
        next: (response: any) => {
          console.log('Event detail response:', response);
          
          let eventData: any;
          
          if (response.success && response.data) {
            eventData = response.data;
          } else if (response.id) {
            eventData = response;
          } else {
            console.warn('Invalid response structure:', response);
            this.selectedEvent = null;
            this.detailLoading = false;
            this.cdr.detectChanges();
            return;
          }

          // Map data chi tiết từ API
          this.selectedEvent = {
            id: eventData.id || 'No data',
            eventId: eventData.eventId || 'No data',
            time: eventData.startTime || eventData.eventTime || 'No data',
            startTime: eventData.startTime || eventData.eventTime || 'No data',
            eventTime: eventData.eventTime || 'No data',
            location: eventData.location || `${eventData.latitude || 'N/A'}, ${eventData.longitude || 'N/A'}`,
            camera: eventData.cameraName || eventData.cameraSn || 'No data',
            status: eventData.status === true ? 'Đã xử lý' : eventData.status === false ? 'Chưa xử lý' : 'Không xác định',
            imageUrl: this.getImagePath(eventData),
            
            // Chi tiết đầy đủ từ API
            cameraSn: eventData.cameraSn || 'No data',
            cameraName: eventData.cameraName || 'No data',
            cameraId: eventData.cameraId || 'No data',
            frameId: eventData.frameId || 'No data',
            eventType: eventData.eventType || 'No data',
            eventCategory: eventData.eventCategory || 'No data',
            duration: eventData.duration ? eventData.duration.toString() : 'No data',
            longitude: eventData.longitude ? eventData.longitude.toString() : 'No data',
            latitude: eventData.latitude ? eventData.latitude.toString() : 'No data',
            createTime: eventData.createTime || 'No data',
            updateTime: eventData.updateTime || 'No data',
            clipPath: Array.isArray(eventData.clipPath) ? eventData.clipPath : (eventData.clipPath ? [eventData.clipPath] : []),
            expiredTime: eventData.expiredTime || 'No data',
            
            // Parse multiple images từ fullImagePath và croppedImagePath
            images: [
              eventData.croppedImagePath,
              eventData.fullImagePath,
              ...(eventData.imagePath ? eventData.imagePath.split(',').map((url: string) => url.trim()) : [])
            ].filter(Boolean)
          };
          
          console.log('Mapped selectedEvent:', this.selectedEvent);
          
          // Thêm delay nhỏ để tạo cảm giác smooth transition
          setTimeout(() => {
            this.detailLoading = false;
            this.cdr.detectChanges();
          }, 300);
        },
        error: (error) => {
          // Error sẽ được interceptor bắt và xử lý tự động
          console.error('Error loading event details:', error);
          this.selectedEvent = null;
          this.detailLoading = false;
          this.cdr.detectChanges();
          // Không cần snackBar.open nữa - interceptor sẽ handle
        }
      });
    }, 200); // Delay nhỏ để user thấy loading animation
  }

  // Server-side Pagination handlers
  onPageChange(pageIndex: number) {
    // Validate pageIndex
    const maxPage = this.totalPages - 1;
    const validPageIndex = Math.max(0, Math.min(pageIndex, maxPage));
    
    console.log('📄 Server-side Page Change:');
    console.log('  - Requested page:', pageIndex);
    console.log('  - Valid page:', validPageIndex);
    console.log('  - Max page:', maxPage);
    console.log('  - Total pages:', this.totalPages);
    
    this.pageNumber = validPageIndex;
    this.pageIndex = validPageIndex;
    
    // Call API with new page parameters for server-side pagination
    this.loadTableData();
  }

  goToPage(index: number) {
    if (index < 0 || index >= this.totalPages) return;
    this.onPageChange(index);
  }

  // Event handlers
  handleViewClick(row: any) {
    console.log('Open event detail popup for:', row.id);
    // Mở popup thay vì navigate
    this.selectedEventDetail = this.transformEventData(row);
    this.showEventDetailPopup = true;
  }
  
  handleRowClick(row: any) {
    console.log('📄 Row clicked:', row);
    console.log('🔍 isTrackingMode:', this.isTrackingMode);
    
    // Only handle row click in tracking mode
    if (this.isTrackingMode) {
      console.log('📄 Row clicked in tracking mode');
      const eventId = row.eventId || row.id;
      console.log('🆔 Event ID from row:', eventId);
      console.log('🆔 Setting selectedEventId to:', eventId);
      this.selectedEventId = eventId;
      console.log('✅ selectedEventId after set:', this.selectedEventId);
    } else {
      console.log('⚠️ Row clicked but not in tracking mode');
    }
  }
  
  popupImageViewerOpen = false;
  
  onPopupImageViewerChange(isOpen: boolean) {
    this.popupImageViewerOpen = isOpen;
  }
  
  closeEventDetailPopup() {
    this.showEventDetailPopup = false;
    this.selectedEventDetail = null;
    this.popupImageViewerOpen = false;
  }
  
  navigateToFullDetail(event: any) {
    // Nếu muốn xem chi tiết đầy đủ, navigate sang trang detail với returnUrl
    this.closeEventDetailPopup();
    this.router.navigate(['/event/detail', event.id], {
      state: { returnUrl: '/event/person' }
    });
  }
  
  transformEventData(row: any): any {
    // Parse images - ưu tiên croppedImagePath trước, sau đó fullImagePath
    let images: string[] = [];
    
    // Thêm cropped image trước (nếu có)
    if (row.croppedImagePath) {
      images.push(row.croppedImagePath);
    }
    
    // Thêm full image sau (nếu có)
    if (row.fullImagePath) {
      images.push(row.fullImagePath);
    }
    
    // Thêm các ảnh từ imagePath cũ (backward compatibility)
    if (row.imagePath) {
      const oldImages = row.imagePath.split(',').map((url: string) => url.trim()).filter(Boolean);
      oldImages.forEach((img: string) => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Transform data từ table row sang format cho popup với các trường mới
    return {
      id: row.id,
      eventId: row.eventId,
      eventType: row.eventType,
      eventCategory: row.eventCategory,
      cameraName: row.cameraName,
      cameraSn: row.cameraSn,
      cameraId: row.cameraId,
      frameId: row.frameId,
      imageUrl: images[0] || '',
      images: images,
      status: row.status,
      startTime: row.startTime,
      eventTime: row.eventTime,
      location: row.location,
      latitude: row.latitude || 0,
      longitude: row.longitude || 0,
      duration: row.duration,
      createTime: row.createTime,
      updateTime: row.updateTime,
      clipPath: Array.isArray(row.clipPath) ? row.clipPath : (row.clipPath ? [row.clipPath] : []),
      expiredTime: row.expiredTime,
      // Add image paths for reference
      croppedImagePath: row.croppedImagePath,
      fullImagePath: row.fullImagePath
    };
  }

  // Image viewer properties
  showImageViewer = false;
  currentImageViewerData: any = null;

  // Thêm method handle image click
  handleImageClick(row: any) {
    console.log('Image clicked for row:', row);
    
    // Lấy danh sách images từ data mới
    let images: string[] = [
      row.croppedImagePath,
      row.fullImagePath,
      ...(row.imagePath ? row.imagePath.split(',').map((url: string) => url.trim()) : [])
    ].filter(Boolean);
    
    if (images.length === 0) {
      this.snackBar.open('Không có hình ảnh để hiển thị', 'Đóng', { duration: 3000 });
      return;
    }

    // Chuẩn bị dữ liệu cho ImageViewer giống như event-detail
    this.currentImageViewerData = {
      ...row,
      images: images,
      imageUrl: images[0], // Ảnh đầu tiên
      currentImageIndex: 0
    };
    
    this.showImageViewer = true;
  }

  // Method để đóng image viewer
  closeImageViewer(): void {
    this.showImageViewer = false;
    this.currentImageViewerData = null;
  }

  // Client-side Filter và search
  loadTableData(): void {
    // KHÔNG reset pageNumber ở đây - chỉ reset khi filter thay đổi
    // pageNumber đã được set trong onPageChange() hoặc trong các filter methods
    
    const cleanedQuery = this.getCleanedQuery(this.queryFormModel);
    
    // Force eventCategory to PERSON for this component
    cleanedQuery['eventCategory'] = 'PERSON';
    
    // Add pagination parameters for server-side pagination
    const apiParams = {
      ...cleanedQuery,
      current: this.pageNumber + 1, // Convert 0-based to 1-based page
      size: this.pageSize
    };

    console.log('🔄 loadTableData() called');
    console.log('📋 queryFormModel:', this.queryFormModel);
    console.log('🧹 cleanedQuery:', cleanedQuery);
    console.log('📄 pagination params:', { current: apiParams.current, size: apiParams.size });
    console.log('🚀 About to call API with params:', apiParams);
    this.loading = true;

    // Gọi API với filter params và pagination
    this.eventService.getListEvents(apiParams).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response && response.data && response.data.records) {
          // Map toàn bộ filtered data từ backend
          this.allData = response.data.records.map((item: any) => ({
            ...item,
            image: this.getImagePath(item),
            // Keep attributes object as is for base-table to format
            // attributes: item.attributes (already in ...item)
            location: item.location || `${item.latitude || 'N/A'}, ${item.longitude || 'N/A'}`,
            camera: item.cameraName || item.cameraSn || 'Unknown Camera',
            status: this.mapEventStatus(item.status),
            clipPath: item.clipPath || []
          }));
          
          // Use server-side pagination info
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.total = response.data.total;
          
          // Sync current page from server (server is 1-based, UI is 0-based)
          const serverCurrentPage = response.data.current || 1;
          this.pageIndex = serverCurrentPage - 1;
          this.pageNumber = serverCurrentPage - 1;
          
          // Use server data directly since it's already paginated
          this.tableData = this.allData;
          
          console.log('📊 Server-side pagination data:', { 
            serverTotal: response.data.total,
            serverPages: response.data.pages,
            serverCurrent: response.data.current,
            serverSize: response.data.size,
            recordsReceived: response.data.records?.length || 0,
            totalItems: this.totalItems,
            totalPages: this.totalPages,
            size: this.pageSize,
            pageIndex: this.pageIndex,
            pageNumber: this.pageNumber,
            shouldShow: this.shouldShowPagination,
            currentPageItems: this.tableData.length
          });
        } else {
          this.allData = [];
          this.tableData = [];
          this.total = 0;
          this.totalItems = 0;
          this.totalPages = 0;
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Error sẽ được interceptor bắt và xử lý tự động
        this.loading = false;
        console.error('Error loading data:', error);
        this.tableData = [];
        // Không cần snackBar.open nữa - interceptor sẽ handle
      }
    });
  }

  getCleanedQuery(queryArray: { key: string, value: string }[]): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    queryArray.forEach(q => {
      if (q.key && q.value) {
        // Special handling for imageList - parse JSON string back to array
        if (q.key === 'imageList') {
          try {
            result[q.key] = JSON.parse(q.value);
          } catch (e) {
            console.error('Failed to parse imageList:', e);
            result[q.key] = q.value;
          }
        } else {
          result[q.key] = q.value;
        }
      }
    });
    return result;
  }

  // Filter menu items theo data structure thực từ API
  menuItems: FilterMenuItem[] = MENU_ITEM_SETS.EVENT_INFO;

  handleTagApi(query: any) {
    console.log('Filter applied:', query);
    this.queryFormModel = query;
    this.pageNumber = 0; // Reset về trang đầu khi filter
    this.loadTableData();
  }

  // New search bar handler
  handleSearch(searchParams: any) {
    console.log('🔍 Search params:', searchParams);
    // Map search params to API query format
    this.queryFormModel = [];
    
    // Check if this is an image search
    if (searchParams.imageList && searchParams.imageList.length > 0) {
      console.log('📸 Image search detected with images:', searchParams.imageList);
      // Use dedicated image search API
      this.searchByImageList(searchParams.imageList, searchParams);
      return;
    }
    
    // Not image search - disable tracking mode
    this.isTrackingMode = false;
    this.trackingLocations = [];
    this.trackingTarget = '';
    
    // Use mapper utility to convert UI params to API format
    const apiParams = mapSearchParamsToAPI(searchParams);
    
    // Add mapped params
    if (apiParams.gender) {
      this.queryFormModel.push({ key: 'gender', value: apiParams.gender });
    }
    
    if (apiParams['topColor']) {
      this.queryFormModel.push({ key: 'topColor', value: apiParams['topColor'] });
    }
    
    if (apiParams.cameraSn) {
      this.queryFormModel.push({ key: 'cameraSn', value: apiParams.cameraSn });
    }
    
    if (apiParams.fromUtc) {
      this.queryFormModel.push({ key: 'fromUtc', value: apiParams.fromUtc });
    }
    
    if (apiParams.toUtc) {
      this.queryFormModel.push({ key: 'toUtc', value: apiParams.toUtc });
    }
    
    // Add other searchParams that aren't in mapper
    if (searchParams.searchText) {
      this.queryFormModel.push({ key: 'searchText', value: searchParams.searchText });
    }
    
    this.pageNumber = 0;
    this.loadTableData();
  }

  /**
   * Search events by uploaded image(s)
   * @param imageFiles Array of File objects from upload
   * @param additionalParams Additional search parameters
   */
  private searchByImageList(imageFiles: File[], additionalParams?: any): void {
    console.log('🖼️ Searching by image with', imageFiles.length, 'files');
    this.loading = true;

    this.eventService.searchByImage(imageFiles).subscribe({
      next: (response) => {
        console.log('🎯 Image search response:', response);
        
        // Parse nested structure: data.data.data[] or data.data[]
        const results = response?.data?.data?.data || response?.data?.data || [];
        
        if (results && results.length > 0) {
          // Map data từ backend
          this.allData = results.map((item: any) => ({
            ...item,
            image: this.getImagePath(item),
            status: this.mapEventStatus(item.status),
            startTime: item.startTime || item.eventTime,
            cameraName: item.cameraName || item.cameraSn || 'N/A',
            location: item.location || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A'),
            clipPath: item.clipPath || []
          }));
          
          // Prepare tracking locations from GPS data
          this.trackingLocations = results
            .filter((item: any) => item.latitude && item.longitude)
            .map((item: any) => ({
              lat: item.latitude,
              lng: item.longitude,
              eventId: item.eventId,
              timestamp: item.eventTime || item.startTime,
              cameraName: item.cameraName || item.cameraSn,
              address: item.location,
              thumbnailUrl: this.getImagePath(item)
            }));
          
          // Client-side pagination setup
          this.totalItems = this.allData.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.total = this.totalItems;
          this.pageNumber = 0;
          this.pageIndex = 0;
          
          // Update table data
          this.updateTableDataForCurrentPage();
          
          // Enable tracking mode if we have GPS data
          if (this.trackingLocations.length > 0) {
            this.isTrackingMode = true;
            this.trackingTarget = `Tìm thấy ${this.totalItems} đối tượng`;
          }
          
          console.log('✅ Image search completed:', {
            totalResults: this.totalItems,
            displayedResults: this.tableData.length,
            trackingLocations: this.trackingLocations.length
          });
        } else {
          console.warn('No results from image search');
          this.allData = [];
          this.tableData = [];
          this.total = 0;
          this.totalItems = 0;
          this.trackingLocations = [];
          this.isTrackingMode = false;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Image search error:', error);
        
        // Report error to ErrorHandlerService
        this.errorHandler.reportError(
          'Lỗi khi tìm kiếm bằng ảnh. Vui lòng thử lại.',
          'server',
          false
        );
        
        this.loading = false;
        this.allData = [];
        this.tableData = [];
        this.total = 0;
        this.totalItems = 0;
        
        this.snackBar.open(
          'Lỗi khi tìm kiếm bằng ảnh. Vui lòng thử lại.',
          'Đóng',
          { duration: 5000 }
        );
        this.cdr.detectChanges();
      }
    });
  }

  // Advanced search handler
  handleAdvancedSearch() {
    console.log('Advanced search clicked');
    // TODO: Open advanced search dialog/modal
    this.snackBar.open('Tính năng tìm kiếm nâng cao đang được phát triển', 'Đóng', { duration: 3000 });
  }

  // Handle refresh from base-table
  onRefreshData() {
    console.log('🔄 Refreshing event data');
    this.loadTableData();
  }

  // Handle clear filter data from base-table
  onClearFilterData() {
    console.log('🗑️ Clearing filter data');
    if (this.eventSearchBar) {
      this.eventSearchBar.clearFilters();
    }
  }

  onSearch(value: string) {
    console.log('Search text:', value);
    // Implement search logic nếu cần
  }

  onRemoveFilter(key: string) {
    console.log('Filter removed:', key);
    // Remove filter và reload data
    this.queryFormModel = this.queryFormModel.filter((item: any) => item.key !== key);
    this.pageNumber = 0; // Reset về trang đầu khi filter thay đổi
    this.loadTableData();
  }

  onDateRangeChange(range: { start?: Date; end?: Date }) {
    console.log('Date range changed:', range);
    // Implement date range filter nếu cần
  }

  // Computed properties
  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.pageIndex;
    const pages = [];

    if (total <= 5) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      if (current <= 2) {
        pages.push(0, 1, 2, -1, total - 1);
      } else if (current >= total - 3) {
        pages.push(0, -1, total - 3, total - 2, total - 1);
      } else {
        pages.push(0, -1, current, -1, total - 1);
      }
    }

    return pages;
  }

  // Permission getters
  get canCreate() {
    return this.permission.has('event:create');
  }
  get canDelete() {
    return this.permission.has('event:delete');
  }
  get canUpdate() {
    return this.permission.has('event:update');
  }
  get canView() {
    return this.permission.has('event:view');
  }

  // Handle event updated from event-detail component
  onEventUpdated(updatedEventData: any): void {
    console.log('Event updated:', updatedEventData);
    
    // Gọi lại API để reload data mới nhất
    this.getListEvents();
    
    // Cập nhật selectedEvent nếu đang được chọn
    if (this.selectedEvent && this.selectedEvent.id === updatedEventData.id) {
      this.selectedEvent = {
        ...this.selectedEvent,
        status: updatedEventData.status
      };
    }
    
    console.log('Table data reloaded from API after event update');
  }

  // TEST METHOD - Remove in production
  testSSOLogout(): void {
    console.log('🧪 Testing SSO logout manually...');
    
    // Set a mock token để test
    if (!sessionStorage.getItem('TOKEN')) {
      sessionStorage.setItem('TOKEN', 'test-token-12345');
      console.log('🧪 Set test token for demo');
    }
    
    // Simulate response có code 9998
    const mockSSOError = {
      code: "9998",
      message: "SSO Login failed.",
      success: false
    };
    
    // Gọi trực tiếp handleSSOLogout
    this.errorHandler.handleSSOLogout(mockSSOError);
  }

  // TEST METHOD - Force refresh pagination
  testPaginationRefresh(): void {
    console.log('🔧 Testing pagination refresh...');
    console.log('Current pageSize (responsive):', this.pageSize);
    
    // Recalculate pagination với pageSize hiện tại
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Reset to first page and update data
    this.pageNumber = 0;
    this.pageIndex = 0;
    this.updateTableDataForCurrentPage();
    this.cdr.detectChanges();
    
    console.log('✅ Pagination refreshed! Current items per page:', this.pageSize);
    console.log('📊 Current page shows:', this.tableData.length, 'items');
  }

  // FORCE METHOD - Tăng pageSize lên 12 cho màn hiện tại
  forceIncreasePageSize(): void {
    console.log('🚀 Force increasing pageSize to 12...');
    console.log('Old pageSize:', this.pageSize);
    
    // Force set pageSize to 12 for current screen
    this.pageSize = 12;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Reset to first page and update data
    this.pageNumber = 0;
    this.pageIndex = 0;
    this.updateTableDataForCurrentPage();
    this.cdr.detectChanges();
    
    console.log('✅ PageSize forced to 12!');
    console.log('📊 Current page shows:', this.tableData.length, 'items');
  }

  // ============= TRACKING MODE METHODS =============
  enableTrackingMode(personIdentifier: string): void {
    console.log('🎯 Enabling tracking mode for person:', personIdentifier);
    this.isTrackingMode = true;
    this.trackingTarget = personIdentifier;
    this.loadTrackingData(personIdentifier);
  }

  disableTrackingMode(): void {
    console.log('🔴 Disabling tracking mode');
    this.isTrackingMode = false;
    this.trackingTarget = '';
    this.trackingLocations = [];
    this.trackingLoading = false;
  }

  loadTrackingData(personIdentifier: string): void {
    this.trackingLoading = true;
    this.trackingLocations = [];

    // Build query for tracking - search for specific person across all events
    const trackingQueryParams = {
      searchText: personIdentifier,
      eventCategory: 'PERSON'
    };

    console.log('📍 Loading tracking data with query:', trackingQueryParams);

    this.eventService.getListEvents(trackingQueryParams).subscribe({
      next: (response: any) => {
        console.log('📍 API Response:', response);
        const events = response?.data?.records || [];
        if (events.length > 0) {
          // Convert events to tracking locations
          this.trackingLocations = events
            .filter((event: any) => event.latitude && event.longitude)
            .map((event: any) => ({
              lat: parseFloat(event.latitude),
              lng: parseFloat(event.longitude),
              eventId: event.eventId || event.id,
              timestamp: event.startTime || event.eventTime,
              cameraName: event.cameraName || event.cameraSn || 'Unknown Camera',
              address: event.location || `${event.latitude}, ${event.longitude}`,
              thumbnailUrl: this.getImagePath(event)
            }))
            .sort((a: TrackingLocation, b: TrackingLocation) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

          console.log('📍 Loaded tracking locations:', this.trackingLocations.length);
          
          // Set table data to show ALL tracking events (no pagination in tracking mode)
          this.tableData = events.map((item: any) => ({
            ...item,
            image: this.getImagePath(item),
            location: item.location || `${item.latitude || 'N/A'}, ${item.longitude || 'N/A'}`,
            camera: item.cameraName || item.cameraSn || 'Unknown Camera',
            status: this.mapEventStatus(item.status),
            clipPath: item.clipPath || []
          }));
          this.allData = this.tableData;
          this.totalItems = this.tableData.length;
          this.totalPages = 1;
          
          console.log('📊 Tracking mode - showing all events:', this.tableData.length);
        } else {
          console.warn('No tracking data found for:', personIdentifier);
          this.trackingLocations = [];
          this.snackBar.open('Không tìm thấy dữ liệu tracking cho đối tượng này', 'Đóng', { duration: 3000 });
        }
        
        this.trackingLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading tracking data:', error);
        this.trackingLoading = false;
        this.trackingLocations = [];
        this.snackBar.open('Lỗi tải dữ liệu tracking', 'Đóng', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }
}