import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

import { ObjectManagementService, TrackingPersonData, ObjectSearchParams } from './object-management.service';
import { CustomPaginatorComponent } from '../../shared/custom-paginator/custom-paginator.component';
import { BaseErrorHandlerComponent } from '../../core/components/base-error-handler.component';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    CustomPaginatorComponent
  ]
})
export class ObjectListComponent extends BaseErrorHandlerComponent implements OnInit {

  // Columns to display
  columnsToDisplay: string[] = [
    'image',
    'eventId',
    'attributes',
    'status',
    'startTime',
    'cameraName',
    'location',
  ];

  // Column definitions
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
  tableData: TrackingPersonData[] = [];
  objectList: TrackingPersonData[] = [];
  selectedObjects: Set<number> = new Set();
  selectedEventId: string = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  
  // Loading state
  isLoading = false;
  
  // Filter state
  searchText = '';
  selectedGroupType = '';
  selectedDataSource = '';
  showGroupTypeDropdown = false;
  showDataSourceDropdown = false;
  
  // Filter options
  groupTypeOptions = [
    { label: 'Tất cả nhóm', value: '' },
    { label: 'VIP', value: 'VIP' },
    { label: 'Khách', value: 'Khach' },
    { label: 'Blacklist', value: 'Blacklist' }
  ];
  
  dataSourceOptions = [
    { label: 'Tất cả nguồn', value: '' },
    { label: 'Đồng bộ', value: 'Đóng bộ' },
    { label: 'Thủ công', value: 'Thủ công' }
  ];

  // Current search params
  currentSearchParams: ObjectSearchParams = {
    page: 1,
    pageSize: 10
  };

  constructor(
    private objectService: ObjectManagementService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  protected initializeComponent(): void {
    this.loadData();
  }

  protected onRetry(): void {
    this.loadObjectList();
  }
  
  loadData() {
    this.loadObjectList();
  }

  loadObjectList() {
    this.isLoading = true;
    
    this.objectService.getObjectList(this.currentSearchParams).subscribe({
      next: (response) => {
        
        this.objectList = response.data.map((item: any) => {
          console.log('🖼️ Mapping item:', item.id, 'imagePath:', item.imagePath);
          return {
            ...item,
            image: item.imagePath || '/assets/images/no-image.png' // Map imagePath -> image with fallback
          };
        });
        this.tableData = this.objectList;
        console.log('📊 tableData set, first item:', this.tableData[0]);
        this.totalItems = response.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        const appError = this.errorHandler.reportError(
          error.message || 'Không thể tải danh sách đối tượng',
          'server',
          false
        );
        this.handleGlobalError(appError);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  // Search method for simple filter
  onSearch() {
    this.currentPage = 0;
    this.currentSearchParams = {
      page: 1,
      pageSize: this.pageSize,
      searchText: this.searchText,
      groupType: this.selectedGroupType,
      dataSource: this.selectedDataSource
    };
    this.loadObjectList();
  }
  
  // Filter dropdown methods
  toggleGroupTypeDropdown() {
    this.showGroupTypeDropdown = !this.showGroupTypeDropdown;
    if (this.showGroupTypeDropdown) {
      this.showDataSourceDropdown = false;
    }
  }
  
  toggleDataSourceDropdown() {
    this.showDataSourceDropdown = !this.showDataSourceDropdown;
    if (this.showDataSourceDropdown) {
      this.showGroupTypeDropdown = false;
    }
  }
  
  selectGroupType(value: string) {
    this.selectedGroupType = value;
    this.showGroupTypeDropdown = false;
    this.onSearch();
  }
  
  selectDataSource(value: string) {
    this.selectedDataSource = value;
    this.showDataSourceDropdown = false;
    this.onSearch();
  }
  
  getGroupTypeLabel(): string {
    const option = this.groupTypeOptions.find(opt => opt.value === this.selectedGroupType);
    return option ? option.label : 'Tất cả nhóm';
  }
  
  getDataSourceLabel(): string {
    const option = this.dataSourceOptions.find(opt => opt.value === this.selectedDataSource);
    return option ? option.label : 'Tất cả nguồn';
  }
  
  hasActiveFilters(): boolean {
    return this.searchText !== '' || this.selectedGroupType !== '' || this.selectedDataSource !== '';
  }
  
  clearFilters() {
    this.searchText = '';
    this.selectedGroupType = '';
    this.selectedDataSource = '';
    this.showGroupTypeDropdown = false;
    this.showDataSourceDropdown = false;
    this.onSearch();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    
    this.currentSearchParams.page = this.currentPage + 1;
    
    this.loadData();
  }

  // Selection handlers
  isAllSelected(): boolean {
    return this.objectList.length > 0 && this.objectList.every(obj => this.selectedObjects.has(obj.id));
  }

  toggleAllSelection() {
    if (this.isAllSelected()) {
      this.selectedObjects.clear();
    } else {
      this.objectList.forEach(obj => this.selectedObjects.add(obj.id));
    }
  }

  toggleObjectSelection(objectId: number) {
    if (this.selectedObjects.has(objectId)) {
      this.selectedObjects.delete(objectId);
    } else {
      this.selectedObjects.add(objectId);
    }
  }

  isObjectSelected(objectId: number): boolean {
    return this.selectedObjects.has(objectId);
  }

  // Action handlers
  viewObjectDetail(event: TrackingPersonData) {
    if (!event.id) {
      console.warn('Cannot view detail: event.id is undefined');
      return;
    }
    this.router.navigate(['/object-management/detail', event.id]);
  }

  editObject(event: TrackingPersonData) {
    if (!event.id) {
      console.warn('Cannot edit: event.id is undefined');
      return;
    }
    this.router.navigate(['/object-management/edit', event.id]);
  }

  deleteObject(event: TrackingPersonData) {
    if (!event.id) {
      console.warn('Cannot delete: event.id is undefined');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa đối tượng "${event.fullName}"?`)) {
      this.objectService.deleteObject(event.id.toString()).subscribe({
        next: () => {
          this.snackBar.open('Xóa sự kiện thành công', 'Đóng', { duration: 3000 });
          this.loadObjectList();
        },
        error: (error: any) => {
          const appError = this.errorHandler.reportError(
            error.message || 'Không thể xóa sự kiện',
            'server',
            false
          );
          this.handleGlobalError(appError);
        }
      });
    }
  }

  viewRelatedEvents(event: TrackingPersonData) {
    if (!event.id) {
      console.warn('Cannot navigate: event.id is undefined');
      return;
    }
    this.router.navigate(['/object-management/events', event.id]);
  }

  addNewObject() {
    this.router.navigate(['/object-management/add']);
  }

  // Base-table event handlers
  handleViewClick(event: TrackingPersonData) {
    this.viewObjectDetail(event);
  }

  handleImageClick(event: TrackingPersonData) {
    // Handle image click - open image viewer or detail
    this.viewObjectDetail(event);
  }

  handleRowClick(event: TrackingPersonData) {
    if (!event.id) {
      console.warn('Cannot select: event.id is undefined');
      return;
    }
    this.selectedEventId = event.id.toString();
    // Handle row click - maybe show detail sidebar
  }

  onClearFilterData() {
    this.clearFilters();
  }

  // Helper methods for display
  getGroupBadgeClass(trackingType: string): string {
    // Map trackingType to badge classes
    const categoryMap: { [key: string]: string } = {
      'Truy nã': 'badge-blacklist',
      'Giám sát': 'badge-vip',
      'VIP': 'badge-guest'
    };
    return categoryMap[trackingType] || 'badge-guest';
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src.indexOf('no-image.png') === -1) {
      target.src = 'assets/images/no-image.png';
    }
  }

  // Group type badge color
  getGroupTypeBadgeClass(groupType: string): string {
    const classes: { [key: string]: string } = {
      'VIP': 'badge-vip',
      'Khach': 'badge-guest',
      'Blacklist': 'badge-blacklist'
    };
    return classes[groupType] || '';
  }
}
