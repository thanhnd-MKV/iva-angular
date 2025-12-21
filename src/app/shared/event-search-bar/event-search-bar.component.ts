import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRangePickerComponent } from '../date-picker-ranger/date-range-picker.component';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { ImageUploadComponent } from '../components/image-upload/image-upload.component';
import { UploadedImage } from '../services/image-upload.service';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
}

export type { FilterOption, FilterConfig };

@Component({
  selector: 'app-event-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent, ClickOutsideDirective, ImageUploadComponent],
  templateUrl: './event-search-bar.component.html',
  styleUrls: ['./event-search-bar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EventSearchBarComponent implements OnInit, OnDestroy {
  @Output() searchTriggered = new EventEmitter<any>();
  @Output() advancedSearchTriggered = new EventEmitter<void>();
  
  @Input() filters: FilterConfig[] = [];
  @Input() showSearchInput: boolean = true;
  @Input() searchInputPlaceholder: string = 'biển số xe';
  @Input() searchFieldName: string = 'plateNumber'; // Field name to emit: 'plateNumber' for traffic, 'searchText' for person/generic
  @Input() showAdvancedSearch: boolean = true;
  @Input() showImageUpload: boolean = false;  // Hiển thị upload ảnh
  @Input() showThresholdSlider: boolean = false;  // Hiển thị ngưỡng nhận diện
  
  @ViewChild('dateRangePicker') dateRangePicker!: DateRangePickerComponent;

  // Tab selection
  selectedTab: 'all' | 'traffic' = 'traffic';
  
  // Current date time display
  currentDateTime: string = '';
  private dateTimeInterval: any;
  
  // Show custom date picker
  showCustomDatePicker: boolean = false;

  // Time ranges - always available
  timeRanges: FilterOption[] = [
    { label: 'Chọn thời gian', value: '' },
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: 'last7days' },
    { label: '30 ngày qua', value: 'last30days' },
    { label: 'Tuỳ chỉnh', value: 'custom' }
  ];
  
  // Dynamic selected values
  selectedTimeRange: string = '';
  selectedFilters: { [key: string]: string } = {};
  searchValue: string = ''; // Internal value, emitted with key from searchFieldName
  
  // Date range
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Uploaded images
  uploadedImages: UploadedImage[] = [];
  showImageUploadDropdown = false;
  
  // Threshold for image search
  threshold: number = 70;
  showThresholdDropdown = false;

  get thresholdPercentage(): string {
    return `${this.threshold}%`;
  }

  // Dynamic dropdown states
  showTimeDropdown = false;
  dropdownStates: { [key: string]: boolean } = {};
  showAdvancedFilters = true;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.updateDateTime();
    this.dateTimeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
    
    // Initialize dropdown states and selected values
    this.filters.forEach(filter => {
      this.dropdownStates[filter.key] = false;
      this.selectedFilters[filter.key] = filter.defaultValue || '';
    });
  }

  ngOnDestroy() {
    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
    }
  }

  updateDateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    this.currentDateTime = `${hours}:${minutes} | ${day}/${month}/${year}`;
  }

  // Select tab
  selectTab(tab: 'all' | 'traffic') {
    this.selectedTab = tab;
  }

  // Toggle dropdowns
  toggleTimeDropdown() {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.closeAllDropdowns('time');
  }

  toggleDropdown(filterKey: string) {
    this.dropdownStates[filterKey] = !this.dropdownStates[filterKey];
    this.closeAllDropdowns(filterKey);
  }

  toggleImageUploadDropdown() {
    this.showImageUploadDropdown = !this.showImageUploadDropdown;
    this.closeAllDropdowns('imageUpload');
  }

  toggleThresholdDropdown() {
    this.showThresholdDropdown = !this.showThresholdDropdown;
    this.closeAllDropdowns('threshold');
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  closeAllDropdowns(except?: string) {
    if (except !== 'time') this.showTimeDropdown = false;
    if (except !== 'imageUpload') this.showImageUploadDropdown = false;
    if (except !== 'threshold') this.showThresholdDropdown = false;
    Object.keys(this.dropdownStates).forEach(key => {
      if (key !== except) {
        this.dropdownStates[key] = false;
      }
    });
  }

  // Select options
  selectTimeRange(option: FilterOption) {
    this.selectedTimeRange = option.value;
    this.showTimeDropdown = false;
    
    // Show date picker if "Tùy chỉnh" is selected
    if (option.value === 'custom') {
      this.showCustomDatePicker = true;
    } else {
      this.showCustomDatePicker = false;
    }
  }

  selectFilter(filterKey: string, option: FilterOption) {
    this.selectedFilters[filterKey] = option.value;
    this.dropdownStates[filterKey] = false;
  }

  // Handle images uploaded
  handleImagesUploaded(images: UploadedImage[]) {
    console.log('📸 Images uploaded:', images);
    this.uploadedImages = images;
  }

  // Get selected label
  getTimeRangeLabel(): string {
    const selected = this.timeRanges.find(t => t.value === this.selectedTimeRange);
    return selected ? selected.label : 'Chọn thời gian';
  }

  getFilterLabel(filterKey: string): string {
    const filter = this.filters.find(f => f.key === filterKey);
    if (!filter) return '';
    
    const selectedValue = this.selectedFilters[filterKey];
    const option = filter.options.find(o => o.value === selectedValue);
    return option?.label || filter.options[0]?.label || filter.label;
  }

  getImageUploadLabel(): string {
    if (this.uploadedImages.length === 0) {
      return 'Tìm kiếm hình ảnh';
    }
    return `Đã chọn ${this.uploadedImages.length} ảnh`;
  }

  // Date range handlers
  onDateRangeSelected(range: { startDate: Date, endDate: Date }) {
    this.startDate = range.startDate;
    this.endDate = range.endDate;
  }

  onDateRangeCleared() {
    this.startDate = null;
    this.endDate = null;
  }

  // Clear all filters
  clearFilters() {
    this.selectedTimeRange = '';
    this.selectedFilters = {};
    this.searchValue = '';
    this.startDate = null;
    this.endDate = null;
    this.showCustomDatePicker = false;
    this.uploadedImages = []; // Clear uploaded images
    this.threshold = 70; // Reset threshold
    
    // Reinitialize default values
    this.filters.forEach(filter => {
      this.selectedFilters[filter.key] = filter.defaultValue || '';
    });
    
    // Clear date range picker
    if (this.dateRangePicker) {
      this.dateRangePicker.clearData();
    }
    
    // Trigger search with empty filters
    this.onSearch();
  }

  // Search handler
  onSearch() {
    const searchParams: any = {
      timeRange: this.selectedTimeRange
    };
    
    // Add search value with dynamic field name
    if (this.searchValue) {
      searchParams[this.searchFieldName] = this.searchValue;
    }
    
    // Add dynamic filter values
    Object.keys(this.selectedFilters).forEach(key => {
      if (this.selectedFilters[key]) {
        searchParams[key] = this.selectedFilters[key];
      }
    });
    
    if (this.startDate && this.endDate) {
      searchParams.startDate = this.startDate;
      searchParams.endDate = this.endDate;
    }
    
    // Add uploaded images if available
    if (this.uploadedImages && this.uploadedImages.length > 0) {
      searchParams.imageList = this.uploadedImages.map(img => img.imageUrl);
      searchParams.threshold = this.threshold; // Add threshold when searching with images
    }
    
    this.searchTriggered.emit(searchParams);
  }

  // Advanced search handler
  onAdvancedSearch() {
    this.advancedSearchTriggered.emit();
  }

  // Handle Enter key in search input
  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}
