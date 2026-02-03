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
  @Input() showThresholdSlider: boolean = false;  // Hiển thị Ngưỡng tương đồng nhận diện
  @Input() disableThreshold: boolean = false;  // Không truyền threshold vào API (nhưng vẫn hiển thị UI)
  @Input() searchFieldOptions: FilterOption[] = []; // Options for search field dropdown
  @Input() displayOnlyImages: string[] = []; // Ảnh chỉ để hiển thị, không cho upload/edit (dùng cho màn object-events)
  @Input() imageLabel: string = 'Đối tượng'; // Label cho ảnh hiển thị
  
  @ViewChild('dateRangePicker') dateRangePicker!: DateRangePickerComponent;

  // Tab selection
  selectedTab: 'all' | 'traffic' = 'traffic';
  
  // Current date time display
  currentDateTime: string = '';
  private dateTimeInterval: any;
  
  // Dynamic selected values
  selectedFilters: { [key: string]: string } = {};
  searchValue: string = ''; // Internal value, emitted with key from searchFieldName
  selectedSearchField: string = ''; // Selected search field
  showSearchFieldDropdown: boolean = false;
  
  // Date range
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Uploaded images
  uploadedImages: UploadedImage[] = []; // Property for storing uploaded images
  showImageUploadDropdown = false; // Toggle dropdown visibility
  
  // Threshold for image search
  threshold: number = 50;
  showThresholdDropdown = false;

  get thresholdPercentage(): string {
    return `${this.threshold}%`;
  }

  // Dynamic dropdown states
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
    
    // Initialize search field with first option or searchFieldName
    if (this.searchFieldOptions.length > 0) {
      this.selectedSearchField = this.searchFieldOptions[0].value || this.searchFieldName;
    } else {
      this.selectedSearchField = this.searchFieldName;
    }
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

  toggleSearchFieldDropdown() {
    this.showSearchFieldDropdown = !this.showSearchFieldDropdown;
    this.closeAllDropdowns('searchField');
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  closeAllDropdowns(except?: string) {
    if (except !== 'imageUpload') this.showImageUploadDropdown = false;
    if (except !== 'threshold') this.showThresholdDropdown = false;
    if (except !== 'searchField') this.showSearchFieldDropdown = false;
    Object.keys(this.dropdownStates).forEach(key => {
      if (key !== except) {
        this.dropdownStates[key] = false;
      }
    });
  }

  // Select options
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
  getFilterLabel(filterKey: string): string {
    const filter = this.filters.find(f => f.key === filterKey);
    if (!filter) return '';
    
    const selectedValue = this.selectedFilters[filterKey];
    const option = filter.options.find(o => o.value === selectedValue);
    return option?.label || filter.options[0]?.label || filter.label;
  }

  getSearchFieldLabel(): string {
    if (this.searchFieldOptions.length === 0) {
      return this.searchInputPlaceholder;
    }
    const selected = this.searchFieldOptions.find(o => o.value === this.selectedSearchField);
    return selected?.label || this.searchFieldOptions[0]?.label || this.searchInputPlaceholder;
  }

  selectSearchField(option: FilterOption) {
    this.selectedSearchField = option.value;
    this.showSearchFieldDropdown = false;
    // Clear search value when changing field
    this.searchValue = '';
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
    // Auto trigger search when date range is confirmed
    this.onSearch();
  }

  onDateRangeCleared() {
    this.startDate = null;
    this.endDate = null;
    // Auto trigger search when date range is cleared
    this.onSearch();
  }

  // Clear all filters
  clearFilters() {
    this.selectedFilters = {};
    this.searchValue = '';
    this.startDate = null;
    this.endDate = null;
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
    const searchParams: any = {};
    
    console.log('🔍 onSearch() called - selectedSearchField:', this.selectedSearchField, 'searchValue:', this.searchValue);
    
    // Add search value with dynamic field name (from selected search field or default)
    if (this.searchValue) {
      const fieldName = this.selectedSearchField || this.searchFieldName;
      searchParams[fieldName] = this.searchValue;
      console.log('🔍 Adding search value:', { fieldName, value: this.searchValue });
    } else {
      console.log('⚠️ No searchValue to add');
    }
    
    // Add dynamic filter values
    Object.keys(this.selectedFilters).forEach(key => {
      if (this.selectedFilters[key]) {
        searchParams[key] = this.selectedFilters[key];
      }
    });
    
    // Add dates if available (from time range selection or custom picker)
    if (this.startDate && this.endDate) {
      searchParams.startDate = this.startDate;
      searchParams.endDate = this.endDate;
      console.log('📅 Emitting dates in searchParams:', {
        startDate: this.startDate,
        endDate: this.endDate
      });
    } else {
      console.log('⚠️ No dates to emit (startDate or endDate is null)');
    }
    
    // Always add threshold when threshold slider is shown AND threshold is not disabled
    if (this.showThresholdSlider && !this.disableThreshold) {
      searchParams.threshold = this.threshold / 100; // Convert 70 to 0.7
    }
    
    // Add uploaded images if available
    if (this.uploadedImages && this.uploadedImages.length > 0) {
      // Send File objects if available, otherwise URLs
      searchParams.imageList = this.uploadedImages
        .map(img => img.file || img.imageUrl)
        .filter(item => item); // Remove nulls
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
