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

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrls: ['./event-info.component.css'],
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
    EventDetailPopupComponent
  ],
})
export class EventInfoComponent extends BaseErrorHandlerComponent implements OnInit {
  @ViewChild(EventSearchBarComponent) eventSearchBar!: EventSearchBarComponent;
  
  // Event filters configuration
  eventFilters: FilterConfig[] = [
    {
      key: 'vehicleType',
      label: 'Loại phương tiện',
      options: [
        { label: 'Ô tô, xe máy', value: '' },
        { label: 'Ô tô', value: 'car' },
        { label: 'Xe máy', value: 'motorbike' },
        { label: 'Xe đạp', value: 'bicycle' }
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
    },
    {
      key: 'behavior',
      label: 'Hành vi',
      options: [
        { label: 'Hành vi', value: '' },
        { label: 'Vượt đèn đỏ', value: 'red_light' },
        { label: 'Đi sai làn', value: 'wrong_lane' },
        { label: 'Quá tốc độ', value: 'speeding' }
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
  pageSize = 11; // Set consistent pageSize for server pagination
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

  // Hàm select option và focus vào input
  selectOptionAndFocusInput(menuItem: any) {
    // Keyboard shortcuts disabled for new search bar
    console.log('Keyboard shortcut triggered:', menuItem);
  }

  override ngOnInit() {
    super.ngOnInit(); // Call parent ngOnInit
    this.loadCameraOptions();
    // Không cần calculate pageSize nữa vì đã fix cứng là 4
    console.log('🖥️ PageSize fixed at:', this.pageSize);
    
    // Load initial data
    this.loadTableData();
  }

  private loadCameraOptions(): void {
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        // Tìm filter camera trong eventFilters và cập nhật options
        const cameraFilter = this.eventFilters.find(filter => filter.key === 'cameraSn');
        if (cameraFilter) {
          cameraFilter.options = [
            { label: 'Tất cả Camera', value: '' },
            ...cameras
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
    // CHỈ load data thực từ API
    this.getListEvents();
  }

  protected onRetry(): void {
    // Clear error và retry load data
    this.markErrorAsHandled();
    this.getListEvents();
  }

  // Lấy ảnh đầu tiên từ imagePath
  private getFirstImageFromPath(imagePath: string): string {
    if (!imagePath) return '/assets/images/no-image.png';
    
    // imagePath từ backend có thể chứa nhiều URL phân cách bằng dấu phẩy
    const imageUrls = imagePath.split(',');
    return imageUrls[0]?.trim() || '/assets/images/no-image.png';
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

  // Format attributes object để hiển thị theo thứ tự: topColor, gender, topCategory, bottomCategory, bottomColor
  formatAttributes(attributes: any): string {
    if (!attributes || typeof attributes !== 'object') {
      return '';
    }

    const order = ['topColor', 'gender', 'topCategory', 'bottomCategory', 'bottomColor'];
    const values: string[] = [];

    order.forEach(key => {
      if (attributes[key]) {
        values.push(attributes[key]);
      }
    });

    return values.join(' ');
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
            // Map image từ imagePath
            image: this.getFirstImageFromPath(item.imagePath),
            // Format attributes object để hiển thị
            attributes: this.formatAttributes(item.attributes),
            // Map status từ boolean sang text
            status: this.mapEventStatus(item.status),
            // Sử dụng startTime hoặc eventTime
            startTime: item.startTime || item.eventTime,
            // Map cameraName (có thể fallback sang cameraSn nếu cần)
            cameraName: item.cameraName || item.cameraSn || 'N/A',
            // Map location
            location: item.location || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A')
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
            imageUrl: this.getFirstImageFromPath(eventData.imagePath),
            
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
            clipPath: eventData.clipPath || null,
            expiredTime: eventData.expiredTime || 'No data',
            
            // Parse multiple images từ imagePath
            images: eventData.imagePath ? eventData.imagePath.split(',').map((url: string) => url.trim()) : []
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
    // Nếu muốn xem chi tiết đầy đủ, navigate sang trang detail
    this.closeEventDetailPopup();
    this.router.navigate(['/event/detail', event.id]);
  }
  
  transformEventData(row: any): any {
    // Parse images from imagePath
    let images: string[] = [];
    if (row.imagePath) {
      images = row.imagePath.split(',').map((url: string) => url.trim()).filter((url: string) => url);
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
      clipPath: row.clipPath,
      expiredTime: row.expiredTime
    };
  }

  // Image viewer properties
  showImageViewer = false;
  currentImageViewerData: any = null;

  // Thêm method handle image click
  handleImageClick(row: any) {
    console.log('Image clicked for row:', row);
    
    // Lấy danh sách images từ data
    let images: string[] = [];
    
    if (row.imagePath) {
      // Parse imagePath có nhiều URLs phân cách bằng dấu phẩy
      images = row.imagePath.split(',').map((url: string) => url.trim()).filter((url: string) => url);
    }
    
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
            image: this.getFirstImageFromPath(item.imagePath),
            attributes: this.formatAttributes(item.attributes),
            location: item.location || `${item.latitude || 'N/A'}, ${item.longitude || 'N/A'}`,
            camera: item.cameraName || item.cameraSn || 'Unknown Camera',
            status: this.mapEventStatus(item.status)
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
            pageSize: this.pageSize,
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
    console.log('Search params:', searchParams);
    // Map search params to API query format
    this.queryFormModel = [];
    
    if (searchParams.eventType) {
      this.queryFormModel.push({ key: 'eventType', value: searchParams.eventType });
    }
    
    if (searchParams.vehicleType) {
      this.queryFormModel.push({ key: 'vehicleType', value: searchParams.vehicleType });
    }
    
    if (searchParams.cameraSn) {
      this.queryFormModel.push({ key: 'cameraSn', value: searchParams.cameraSn });
    }
    
    if (searchParams.behavior) {
      this.queryFormModel.push({ key: 'behavior', value: searchParams.behavior });
    }
    
    if (searchParams.searchText) {
      this.queryFormModel.push({ key: 'searchText', value: searchParams.searchText });
    }
    
    if (searchParams.startDate && searchParams.endDate) {
      this.queryFormModel.push({ 
        key: 'startDate', 
        value: searchParams.startDate.toISOString().split('T')[0]
      });
      this.queryFormModel.push({ 
        key: 'endDate', 
        value: searchParams.endDate.toISOString().split('T')[0]
      });
    }
    
    this.pageNumber = 0;
    this.loadTableData();
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
    console.log('Current pageSize (fixed):', this.pageSize);
    
    // Recalculate pagination với pageSize hiện tại
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Reset to first page and update data
    this.pageNumber = 0;
    this.pageIndex = 0;
    this.updateTableDataForCurrentPage();
    this.cdr.detectChanges();
    
    console.log('✅ Pagination refreshed! New items per page:', this.pageSize);
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
}