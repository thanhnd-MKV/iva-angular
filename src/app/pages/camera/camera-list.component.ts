import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CameraService } from '../camera/camera.service';
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
import { BaseTableComponent } from '../../shared/components/table/base-table.component';
import { Component, ViewChild, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CustomPaginatorComponent } from '../../shared/custom-paginator/custom-paginator.component';
import { FilterSearchBarComponent } from '../../shared/filter-search-bar/filter-search-bar.component';
import { MENU_ITEM_SETS } from '../../shared/constants/filter-menu-items';
import { KeyboardShortcutHandler } from '../../shared/constants/keyboard-shortcut-handler';

@Component({
  selector: 'app-camera-list',
  standalone: true,
  templateUrl: './camera-list.component.html',
  styleUrls: ['./camera-list.component.css'],
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
    MatSnackBarModule,
    BaseTableComponent,
    CustomPaginatorComponent,
    FilterSearchBarComponent
  ],
})
export class CameraListComponent implements OnInit {
  @ViewChild(FilterSearchBarComponent) filterSearchBar!: FilterSearchBarComponent;
  
  queryFormModel: any = [
    {
      "label": "Camera Name",
      "value": "name"
    },
    {
      "label": "SN",
      "value": "sn"
    },
    {
      "label": "Date",
      "value": "date"
    }
  ];
  formModel: any = {};

  columnsToDisplay: string[] = [
    'select',
    'deviceName',
    'deviceType',
    'serialNumber', 
    'location', 
    'ip' 
  ];

  columnDefs: any = {
    select: {
      label: '',
      type: 'checkbox',
      width: '50px',
    },
    deviceName: {
      label: 'Tên thiết bị',
      type: 'text',
      fontSize: '14px',
      fontWeight: '500',
      width: '150px',
    },
    deviceType: {
      label: 'Loại thiết bị', 
      type: 'text',
      fontSize: '14px',
      width: '120px',
    },
    serialNumber: {
      label: 'Serial number',
      type: 'text',
      fontSize: '14px',
      width: '150px',
    },
    location: {
      label: 'Vị trí',
      type: 'clickable', 
      fontSize: '14px',
      width: '200px',
      textColor: '#007bff', 
      cursor: 'pointer'
    },
    ip: {
      label: 'IP',
      type: 'text', 
      fontSize: '14px',
      textColor: '#494949',
      width: '130px',
    }
  };

  tableData: any[] = []; 
  selectTableItem: any[] = [];

  isEdit = false;
  dialogFormVisible = false;

  pageNumber: number = 0;
  pageSize = window.innerHeight > 900 ? 12 : window.innerHeight > 800 ? 10 : window.innerHeight > 700 ? 8 : 7;
  total = 0;
  loading = false;
  fleet = '';
  lang = '';

  // Error handling properties
  hasError = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cameraService: CameraService,
    private permission: PermissionService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTableData();
    const fleetData = sessionStorage.getItem('fleet');
    this.fleet = fleetData ? JSON.parse(fleetData) : '';
    this.lang = localStorage.getItem('LANG') || 'en-US';
  }

  onPageChange(pageIndex: number) {
    this.pageNumber = pageIndex;

    const maxPage = Math.ceil(this.totalItems / this.pageSize) - 1;
    if (this.pageNumber > maxPage) {
      this.pageNumber = maxPage;
    }
    this.loadTableData();
  }

  // Cập nhật loadTableData để map data từ API theo format mới
  loadTableData(): void {
    const cleanedQuery = this.getCleanedQuery(this.queryFormModel);

    const params = {
      current: this.pageNumber + 1,
      size: this.pageSize,
      ...cleanedQuery
    };

    this.loading = true;
    this.hasError = false; // Reset error state

    this.cameraService.getCameraList(params).subscribe(
      (resp) => {
        this.loading = false;
        if (resp.success) {
          // Map API data to table format theo cấu trúc mới
          this.tableData = resp.data.records.map((item: any) => ({
            id: item.id,
            deviceName: item.name || item.deviceName || 'Camera MKV1',
            deviceType: item.type || item.deviceType || 'IP camera',
            serialNumber: item.sn || item.serialNumber || '',
            location: item.location || item.address || '', // location từ API
            ip: item.address || item.ip || item.ipAddress || '' // address là IP
          }));
          this.totalItems = resp.data.total;
          this.hasError = false; // Clear error state on success
          this.cdr.detectChanges();
        } else {
          // Handle API failure response
          this.hasError = true;
          this.errorMessage = resp.message || 'Không thể tải dữ liệu từ server';
          this.tableData = [];
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error loading data:', error);
        // Set error state based on error type
        this.hasError = true;
        this.tableData = [];
        
        if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Server đang gặp sự cố, kiểm tra lại kết nối mạng. Vui lòng thử lại sau vài phút.';
        } else if (error.status === 404) {
          this.errorMessage = 'Không tìm thấy dữ liệu yêu cầu.';
        } else if (error.status === 403) {
          this.errorMessage = 'Bạn không có quyền truy cập dữ liệu này.';
        } else if (error.status === 401) {
          this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else {
          this.errorMessage = error.error?.message || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.';
        }
        
        this.cdr.detectChanges(); // Force change detection
      }
    );
  }

  getCleanedQuery(queryArray: { key: string, value: string }[]): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    queryArray.forEach(q => {
      if (q.key && q.value) {
        result[q.key] = q.value;
      }
    });
    return result;
  }

  handleConfirmClick(): void {
    const save$ = this.isEdit
      ? this.cameraService.updateCamera(this.formModel)
      : this.cameraService.createCamera(this.formModel);

    save$.subscribe(resp => {
      if (resp.success) {
        this.dialogFormVisible = false;
        this.snackBar.open(`${this.isEdit ? 'Updated' : 'Created'} successfully`, 'Close', { duration: 3000 });
        this.loadTableData();
      } else {
        this.snackBar.open('Save failed', 'Close', { duration: 3000 });
      }
    });
  }

  handleDeleteClick(row?: any): void {
    const ids = row === 'delete' ? this.selectTableItem : [row.id];
    if (!ids.length) {
      this.snackBar.open('Please select data to delete', 'Close', { duration: 3000 });
      return;
    }
    if (!confirm('Are you sure to delete?')) return;
    this.cameraService.deleteCameras(ids).subscribe(resp => {
      if (resp.success) {
        this.loadTableData();
        this.snackBar.open('Delete success', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Delete failed', 'Close', { duration: 3000 });
      }
    });
  }

  handleViewClick(row: any) {
    // alert('View clicked:' + row);
  }

  handleCreateClick(row: any) {
    // alert('Create clicked:' + row);
  }

  handleChangeClick(row: any): void {
    this.isEdit = true;
    this.formModel = { ...row };
  }

  mapStatus(status: number): string {
    return status === 0 ? 'Unregistered' : status === 1 ? 'Inactive' : 'Active';
  }

  get canCreate() {
    return this.permission.has('operamanage:cameralist:create');
  }
  get canDelete() {
    return this.permission.has('operamanage:cameralist:deletes');
  }
  get canUpdate() {
    return this.permission.has('operamanage:cameralist:update');
  }
  get canRegister() {
    return this.permission.has('operamanage:cameralist:register');
  }

  pageIndex = 0;
  totalItems = 100;
  totalPages = Math.ceil(this.totalItems / this.pageSize);

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

  goToPage(index: number) {
    if (index < 0 || index >= this.totalPages) return;
    this.pageIndex = index;
  }

  // Filter

  menuItems = MENU_ITEM_SETS.CAMERA_LIST;

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
    if (!this.filterSearchBar) {
      console.warn('FilterSearchBar component not found');
      return;
    }

    // Sử dụng method selectByKey để select và focus
    this.filterSearchBar.selectByKey(menuItem.key);

    // Log shortcut activation
    KeyboardShortcutHandler.logShortcutActivation(menuItem);
  }

  handleTagApi(query: any) {
    console.log('Call real API with', query);
    this.queryFormModel = query;
    this.loadTableData();
  }

  // Handle refresh from base-table
  onRefreshData() {
    console.log('🔄 Refreshing camera data');
    this.loadTableData();
  }

  // Handle clear filter data from base-table
  onClearFilterData() {
    console.log('🗑️ Clearing filter data');
    if (this.filterSearchBar) {
      this.filterSearchBar.clearAllData();
    }
  }

  onSearch(value: string) {
    console.log('Search text:', value);
  }

  onRemoveFilter(key: string) {
    console.log('Filter removed:', key);
  }

  onDateRangeChange(range: { start?: Date; end?: Date }) {
    console.log('Date range:', range);
  }

  // Handle column click event từ base-table
  onColumnClick(event: {column: string, row: any}): void {
    if (event.column === 'location') {
      this.onLocationClick(event.row);
    }
  }

  // Thêm method để handle location click với gạch chân
  onLocationClick(row: any) {
    console.log('Location clicked:', row.location);
    this.openGoogleSearchUI(row.location);
  }


  // Function đơn giản để mở Google Search với location
  openGoogleSearchUI(location: string) {
    if (!location) {
      console.warn('No location provided for search');
      return;
    }

    // Encode location để đảm bảo URL safe
    const encodedLocation = encodeURIComponent(location.trim());
    
    // Tạo Google search URL với location và mở trong tab mới
    const googleSearchUrl = `https://www.google.com/search?q=${encodedLocation}`;
    
    console.log('Opening Google search for:', location);
    window.open(googleSearchUrl, '_blank');
  }

}