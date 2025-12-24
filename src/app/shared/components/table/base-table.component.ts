import { Component, Input, ViewChild, OnInit, OnChanges, Inject, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

export type TableActionType = 'view' | 'edit' | 'delete' | 'info' | 'create';

@Component({
  selector: 'app-base-table',
  standalone: true,
  templateUrl: './base-table.component.html',
  styleUrls: ['./base-table.component.scss', './base-table-theme.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  providers: [DatePipe]
})
export class BaseTableComponent implements OnInit, OnChanges {
  @Input() title: string = 'Table Title';
  @Input() data: any[] = [];
  @Input() columnsToDisplay: string[] = [];
  @Input() hasActiveFilters: boolean = false; // Để hiển thị nút clear filters
  @Input() isLoading: boolean = false; // Loading state for refresh button
  @Input() hasError: boolean = false; // Server error state
  @Input() errorMessage: string = ''; // Custom error message
  @Input() selectedEventId: string = ''; // Selected event ID for highlighting
  @Input() columnDefs: {
    [key: string]: {
      width?: string,
      label?: string,
      type?: 'text' | 'image' | 'video' | 'date' | 'checkbox' | 'link' | 'clickable' | 'status' | 'id-category' | 'attributes',
      fontSize?: string,
      fontWeight?: string,
      bgColor?: string,
      textColor?: string,
      headerFontSize?: string,
      headerBgColor?: string,
      cursor?: string // Thêm cursor property
    }
  } = {};

  @Input() actions: TableActionType[] = [];
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() info = new EventEmitter<any>();
  @Output() create = new EventEmitter<any>();
  @Output() columnClick = new EventEmitter<{column: string, row: any}>(); // Thêm columnClick output
  @Output() imageClick = new EventEmitter<any>();
  @Output() rowClick = new EventEmitter<any>(); // Event when clicking on table row
  @Output() refresh = new EventEmitter<void>(); // Event cho refresh button
  @Output() clearFilters = new EventEmitter<void>(); // Event cho clear filters button
  @Output() clearFilterData = new EventEmitter<void>(); // Event để clear data trong filter search bar

  @ViewChild(MatSort) sort!: MatSort;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  displayedColumns: string[] = [];
  selectedRows: any[] = []; // Thêm selectedRows property
  isRefreshing: boolean = false; // Internal refresh loading state
  
  // Image loading states - track loading state for each image
  imageLoadingStates: { [key: string]: boolean } = {};
  imageErrorStates: { [key: string]: boolean } = {};
  isTableLoading = false;

  constructor(
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) { }

  copySuccess: { [key: string]: boolean } = {};

  // Empty state methods
  onRefresh() {
    if (this.isRefreshing || this.isLoading) return;
    
    console.log('🔄 Table refresh requested');
    this.isRefreshing = true;
    
    // Clear filter data first
    this.clearFilterData.emit();
    
    // Delay để filter search bar có thời gian clear data trước
    setTimeout(() => {
      this.refresh.emit();
    }, 100);
    
    // Auto reset after 5 seconds in case parent doesn't handle it
    setTimeout(() => {
      this.isRefreshing = false;
    }, 5000);
  }

  onClearFilters() {
    console.log('🗑️ Clear filters requested');
    this.clearFilters.emit();
  }

  // Method for parent component to call when refresh is complete
  refreshComplete() {
    this.isRefreshing = false;
  }

  ngOnInit() {
    this.displayedColumns = [...this.columnsToDisplay];

    if (this.actions && this.actions.length > 0) {
      this.displayedColumns.push('action');
    }

    // Start table loading animation
    this.isTableLoading = true;
    
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.sort = this.sort;
    
    // Initialize image loading states
    if (this.data && this.data.length > 0) {
      this.initializeImageLoadingStates();
    }
    
    // End table loading after 500ms
    setTimeout(() => {
      this.isTableLoading = false;
    }, 500);
  }

  actionIcons: { [key in TableActionType]: string } = {
    view: 'visibility',
    edit: 'edit',
    delete: 'delete',
    info: 'info',
    create: 'add'
  };

  actionTooltips: { [key in TableActionType]: string } = {
    view: 'Xem chi tiết',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    info: 'Thông tin',
    create: 'Tạo mới'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      // Start table loading animation
      this.isTableLoading = true;
      
      if (this.dataSource) {
        this.dataSource.data = this.data;
      } else {
        this.dataSource = new MatTableDataSource(this.data);
      }
      
      // Initialize loading states for new images
      this.initializeImageLoadingStates();
      
      // End table loading after 500ms
      setTimeout(() => {
        this.isTableLoading = false;
      }, 500);
    }

    // Thêm đoạn này để cập nhật displayedColumns khi actions thay đổi
    if (changes['actions']) {
      this.displayedColumns = [...this.columnsToDisplay];
      if (this.actions && this.actions.length > 0) {
        this.displayedColumns.push('action');
      }
    }
  }

  formatDateTime(value: any): string {
    if (!value) return '';

    try {
      const date = new Date(value);
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return value.toString();
      }

      // Tách thời gian và ngày tháng
      const timeStr = date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const dateStr = date.toLocaleDateString('vi-VN');

      // Kiểm tra nếu là thời gian 00:00 thì chỉ hiển thị ngày
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      const isZeroTime = hours === 0 && minutes === 0 && seconds === 0;
      
      if (isZeroTime) {
        return `<div class="datetime-container date-only">
          <span class="date-part">${dateStr}</span>
        </div>`;
      }
      
      return `<div class="datetime-container">
        <span class="time-part">${timeStr}</span>
        <span class="date-part">${dateStr}</span>
      </div>`;
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return value.toString();
    }
  }

  openPreviewDialog(type: 'image' | 'video', src: string) {
    this.dialog.open(MediaPreviewDialogComponent, {
      data: { type, src },
      width: type === 'video' ? '900px' : 'auto',
      maxWidth: type === 'video' ? '900px' : 'auto',
      height: type === 'video' ? '550px' : 'auto',
    });
  }

  copyToClipboard(email: string) {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        this.copySuccess[email] = true;
        setTimeout(() => {
          this.copySuccess[email] = false;
        }, 2000);
      }).catch((err) => {
        console.error('Clipboard copy failed:', err);
      });
    } else {
      console.warn('Clipboard API not available');
      // alert('Trình duyệt không hỗ trợ sao chép tự động');
      console.log('Trình duyệt không hỗ trợ sao chép tự động');
    }
  }

  getSignalIcon(signal: number): string {
    return 'signal_cellular_alt_2_bar';
  }

  getStatusIcon(signal: number): string {
    return 'signal_cellular_alt_2_bar';
  }

  getSignalClass(signal: number): string {
    if (signal < -90) return 'text-danger';
    if (signal < -71) return 'text-warning';
    return 'text-success';
  }

  getBatteryIcon(battery: number): string {
    if (battery <= 10) return 'battery_alert';
    if (battery <= 20) return 'battery_1_bar';
    if (battery <= 50) return 'battery_3_bar';
    if (battery <= 80) return 'battery_5_bar';
    return 'battery_full';
  }

  getBatteryClass(battery: number): string {
    if (battery <= 20) return 'battery-danger';
    if (battery <= 50) return 'battery-warning';
    return 'battery-success';
  }

  onView(row: any) {
    // this.info.emit(row);
    this.dialog.open(EventDetailDialogComponent, { data: row });
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    if (confirm('Bạn có chắc muốn xóa bản ghi này?')) {
      this.delete.emit(row);
    }
  }

  onCreateFrom(row: any) {
    this.create.emit(row);
  }

  onActionClick(action: TableActionType, row: any) {
    switch (action) {
      case 'view':
        this.view.emit(row);
        break;
      case 'edit':
        this.edit.emit(row);
        break;
      case 'delete':
        this.delete.emit(row);
        break;
      case 'info':
        this.info.emit(row);
        break;
      case 'create':
        this.create.emit(row);
        break;
    }
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  handleViewClick(row: any) {
    // Xử lý khi người dùng click vào nút xem
    console.log('Viewing row:', row);
    // ... logic xử lý của bạn
  }

  // Checkbox methods
  isSelected(row: any): boolean {
    return this.selectedRows.some(selected => selected.id === row.id);
  }

  // Check if row is highlighted by selectedEventId
  isHighlighted(row: any): boolean {
    if (!this.selectedEventId) return false;
    return row.eventId === this.selectedEventId || row.id === this.selectedEventId;
  }

  toggleSelection(row: any, event: any): void {
    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(selected => selected.id !== row.id);
    }
  }

  isAllSelected(): boolean {
    return this.data.length > 0 && this.selectedRows.length === this.data.length;
  }

  hasSelection(): boolean {
    return this.selectedRows.length > 0;
  }

  toggleSelectAll(event: any): void {
    if (event.checked) {
      this.selectedRows = [...this.data];
    } else {
      this.selectedRows = [];
    }
  }

  // Get display value helper
  getDisplayValue(row: any, column: string): any {
    return row[column] || '';
  }

  // Category helper methods for ID/Category column
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'PERSON': 'Đối tượng người',
      'VEHICLE': 'Giao thông'
    };
    return labels[category] || category || 'N/A';
  }

  getCategoryClass(category: string): string {
    const classes: { [key: string]: string } = {
      'PERSON': 'category-person',
      'VEHICLE': 'category-vehicle'
    };
    return classes[category] || 'category-default';
  }

  // Format attributes object for display
  formatAttributes(row: any): string {
    if (!row || !row.attributes) return '';
    
    const attrs = row.attributes;
    const parts: string[] = [];
    
    // Check event category to determine which attributes to show
    if (row.eventCategory === 'PERSON') {
      // Person event: show gender, topCategory, topColor, bottomCategory, bottomColor
      // Gender mapping
      if (attrs.gender) {
        const genderMap: { [key: string]: string } = {
          'male': 'Nam',
          'Male': 'Nam',
          'female': 'Nữ',
          'Female': 'Nữ'
        };
        parts.push(genderMap[attrs.gender] || attrs.gender);
      }
      
      // Top category (loại áo)
      if (attrs.topCategory) {
        const topCategoryMap: { [key: string]: string } = {
          'LongSleeve': 'Áo dài tay',
          'ShortSleeve': 'Áo ngắn tay',
          'Sleeveless': 'Áo không tay'
        };
        parts.push(topCategoryMap[attrs.topCategory] || attrs.topCategory);
      }
      
      // Top color
      if (attrs.topColor) {
        const colorMap: { [key: string]: string } = {
          'White': 'Trắng',
          'Black': 'Đen',
          'Red': 'Đỏ',
          'Blue': 'Xanh dương',
          'Green': 'Xanh lá',
          'Yellow': 'Vàng',
          'Gray': 'Xám',
          'Brown': 'Nâu',
          'Orange': 'Cam',
          'Pink': 'Hồng'
        };
        parts.push(colorMap[attrs.topColor] || attrs.topColor);
      }
      
      // Bottom category (loại quần)
      if (attrs.bottomCategory) {
        const bottomCategoryMap: { [key: string]: string } = {
          'LongPants': 'Quần dài',
          'ShortPants': 'Quần ngắn',
          'Skirt': 'Váy'
        };
        parts.push(bottomCategoryMap[attrs.bottomCategory] || attrs.bottomCategory);
      }
      
      // Bottom color
      if (attrs.bottomColor) {
        const colorMap: { [key: string]: string } = {
          'White': 'Trắng',
          'Black': 'Đen',
          'Red': 'Đỏ',
          'Blue': 'Xanh dương',
          'Green': 'Xanh lá',
          'Yellow': 'Vàng',
          'Gray': 'Xám',
          'Brown': 'Nâu',
          'Orange': 'Cam',
          'Pink': 'Hồng'
        };
        parts.push(colorMap[attrs.bottomColor] || attrs.bottomColor);
      }
    } else if (row.eventCategory === 'VEHICLE') {
      // Vehicle event: show plateNumber
      if (attrs.plateNumber) {
        parts.push(`Biển số: ${attrs.plateNumber}`);
      }
    }
    
    // Join with bullet separator
    return parts.length > 0 ? parts.join(' • ') : '';
  }

  // Format date helper
  // formatDate(dateValue: any): string {
  //   if (!dateValue) return '';
  //   return this.datePipe.transform(dateValue, 'dd/MM/yyyy') || '';
  // }

  // Handle column click
  onColumnClick(column: string, row: any): void {
    this.columnClick.emit({ column, row });
  }

  // ============= IMAGE LOADING METHODS =============
  
  /**
   * Generate unique key for tracking image loading state
   */
  private getImageKey(row: any, column: string): string {
    const rowId = row.id || row.eventId || JSON.stringify(row).substring(0, 50);
    return `${rowId}_${column}`;
  }

  /**
   * Check if image is currently loading
   */
  isImageLoading(row: any, column: string): boolean {
    const key = this.getImageKey(row, column);
    return this.imageLoadingStates[key] === true;
  }

  /**
   * Check if image has error
   */
  isImageError(row: any, column: string): boolean {
    const key = this.getImageKey(row, column);
    return this.imageErrorStates[key] === true;
  }

  /**
   * Handle image load success
   */
  onImageLoad(row: any, column: string): void {
    const key = this.getImageKey(row, column);
    this.imageLoadingStates[key] = false;
    this.imageErrorStates[key] = false;
  }

  /**
   * Handle image load error with fallback - Updated signature
   */
  onImageError(row: any, column: string, event?: any): void {
    const key = this.getImageKey(row, column);
    this.imageLoadingStates[key] = false;
    this.imageErrorStates[key] = true;
  }

  /**
   * Initialize loading states for all images in the data
   */
  private initializeImageLoadingStates(): void {
    this.imageLoadingStates = {};
    this.imageErrorStates = {};
    
    // Set loading state for all images
    this.data.forEach((row, index) => {
      this.columnsToDisplay.forEach(column => {
        if (this.columnDefs[column]?.type === 'image') {
          const key = this.getImageKey(row, column);
          this.imageLoadingStates[key] = true; // Start with loading state
          this.imageErrorStates[key] = false;
        }
      });
    });
  }





  // Get status class for styling
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'active':
      case 'đã xử lý':
        return 'status-processed';
      case 'pending':
      case 'inactive':
      case 'chưa xử lý':
        return 'status-pending';
      default:
        return 'status-default';
    }
  }

  // Get status label in Vietnamese
  getStatusLabel(status: string): string {
    switch (status) {
      case 'processed':
        return 'Đã xử lý';
      case 'pending':
        return 'Chưa xử lý';
      default:
        return 'Không xác định';
    }
  }

  // Format date for Vietnamese locale - consistent with formatDateTime
  formatDate(value: any): string {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return value.toString();
      }
      
      // Sử dụng cùng logic với formatDateTime
      const timeStr = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const dateStr = date.toLocaleDateString('vi-VN');
      
      // Kiểm tra nếu là thời gian 00:00 thì chỉ hiển thị ngày
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      const isZeroTime = hours === 0 && minutes === 0 && seconds === 0;
      
      if (isZeroTime) {
        return `<div class="datetime-container date-only">
          <span class="date-part">${dateStr}</span>
        </div>`;
      }
      
      return `<div class="datetime-container">
        <span class="time-part">${timeStr}</span>
        <span class="date-part">${dateStr}</span>
      </div>`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return value.toString();
    }
  }

  // Handle image click
  onImageClick(row: any): void {
    this.imageClick.emit(row);
  }

  // Check if event is new (status = false means unprocessed/new)
  isNewEvent(row: any): boolean {
    return row.status === false || row.status === 'pending';
  }

  // Open image viewer
  openImageViewer(row: any): void {
    // Lấy danh sách images từ row data
    let images: string[] = [];
    
    if (row.images && Array.isArray(row.images)) {
      images = row.images;
    } else if (row.imagePath) {
      images = row.imagePath.split(',').map((url: string) => url.trim());
    } else if (row.image) {
      images = [row.image];
    }

    if (images.length > 0) {
      this.dialog.open(ImageViewerComponent, {
        data: { 
          images: images,
          initialIndex: 0
        },
        maxWidth: '90vw',
        maxHeight: '90vh',
        panelClass: 'image-viewer-dialog'
      });
    }
  }
}

@Component({
  selector: 'app-media-preview-dialog',
  standalone: true,
  templateUrl: './dialog-data-example-dialog.html',
  styleUrls: ['./media-preview-dialog.component.scss'],
  imports: [CommonModule, MatDialogModule]
})
export class MediaPreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { type: 'image' | 'video', src: string }) { }
}

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  templateUrl: './dialog-data.html',
  styleUrls: ['./media-preview-dialog.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  providers: [DatePipe]
})
export class EventDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private datePipe: DatePipe) { }

  formatDateTime(value: any): string {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      
      if (isNaN(date.getTime())) {
        return value.toString();
      }

      const timeStr = date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const dateStr = date.toLocaleDateString('vi-VN');
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      const isZeroTime = hours === 0 && minutes === 0 && seconds === 0;
      
      if (isZeroTime) {
        return `<div class="datetime-container date-only">
          <span class="date-part">${dateStr}</span>
        </div>`;
      }
      
      return `<div class="datetime-container">
        <span class="time-part">${timeStr}</span>
        <span class="date-part">${dateStr}</span>
      </div>`;
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return value.toString();
    }
  }
}
