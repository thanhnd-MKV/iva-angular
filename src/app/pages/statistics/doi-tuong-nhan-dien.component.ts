import { Component, OnInit, OnDestroy, HostListener, ViewChild, ViewChildren, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DateRangePickerComponent } from '../../shared/date-picker-ranger/date-range-picker.component';
import { CameraService } from '../camera/camera.service';
import { HttpClient } from '@angular/common/http';
import { SSEService } from '../../core/services/sse.service';
import { Subscription } from 'rxjs';

// Interface for new BE data structure
interface BeDataResponse {
  success: boolean;
  code: string;
  message: string | null;
  data: {
    age_range: { [key: string]: number };
    gender: { [hour: string]: { Female?: number; Male?: number; Unknown?: number } };
    complexion: { [hour: string]: { White?: number; Black?: number; Asian?: number; Latino?: number; Indian?: number; MiddleEastern?: number; Unknown?: number } };
  };
}

@Component({
  selector: 'app-doi-tuong-nhan-dien',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatProgressSpinnerModule, MatIconModule, FormsModule, DateRangePickerComponent],
  templateUrl: './doi-tuong-nhan-dien.component.html',
  styleUrls: ['./doi-tuong-nhan-dien.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoiTuongNhanDienComponent implements OnInit, OnDestroy {
  // Filter properties
  searchText = '';
  selectedTimeRange = 'custom';
  selectedCamera = '';
  selectedArea = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  showAreaDropdown = false;
  showDateRangePicker = false;
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;

  // ViewChild references to chart instances
  @ViewChild('lineChart') lineChart?: BaseChartDirective;
  @ViewChild('barChart') barChart?: BaseChartDirective;
  @ViewChild('donutChart') donutChart?: BaseChartDirective;
  @ViewChildren('summaryValue') summaryValueElements?: any;
  @ViewChildren('digitSpan', { read: ElementRef }) digitSpans?: QueryList<ElementRef>;

  constructor(
    private cameraService: CameraService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sseService: SSEService
  ) {}
  
  // Responsive dimensions
  barChartHeight = '180px';
  lineChartHeight = '100%'; // Line chart luôn chiếm 100%
  private resizeTimeout: any;

  // SSE for real-time updates
  private sseSubscription: Subscription | null = null;
  private readonly SSE_CHANNEL = 'objectRecognition';
  private baseData: BeDataResponse['data'] | null = null;
  
  // Data storage for incremental SSE updates
  private genderData: { [hour: string]: { Female?: number; Male?: number; Unknown?: number } } = {};
  private complexionData: { [hour: string]: { White?: number; Black?: number; Asian?: number; Latino?: number; Indian?: number; MiddleEastern?: number; Unknown?: number } } = {};
  private ageRangeData: { [key: string]: number } = {};

  // Helper function để format số lớn
  private formatLargeNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  timeOptions = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: '7days' },
    { label: '30 ngày qua', value: '30days' },
    { label: 'Tùy chỉnh', value: 'custom' }
  ];
  
  cameraOptions: { label: string; value: string }[] = [
    { label: 'Tất cả Camera', value: '' }
  ];

  // Camera locations data
  cameraLocations: any[] = [];

  areaOptions: { label: string; value: string }[] = [
    { label: 'Tất cả khu vực', value: '' },
    { label: 'Hà Nội', value: 'hanoi' },
    { label: 'TP.HCM', value: 'hcm' },
    { label: 'Đà Nẵng', value: 'danang' },
    { label: 'Cần Thơ', value: 'cantho' },
    { label: 'Hải Phòng', value: 'haiphong' }
  ];

  // Data properties for display
  totalPeopleCount = 0;
  
  // Getter để format total count cho display
  get formattedTotalCount(): string {
    return this.formatLargeNumber(this.totalPeopleCount);
  }
  ageGroupCounts: { [key: string]: number } = {};
  hiddenAgeGroups: Set<string> = new Set(); // Track which age groups are hidden

  // Summary cards data
  summaryCards = [
    { title: 'Tổng số lượt xuất hiện', value: 0, change: 0, isPositive: true, color: 'blue' },
    { title: 'Lượt xuất hiện cao nhất trong ngày', value: 0, change: 0, isPositive: true, color: 'green' },
    { title: 'Nhóm độ tuổi chiếm ưu thế', value: '20t-29t', change: 0, isPositive: true, color: 'purple' }
  ];
  
  // Display values for animation (only for numeric cards)
  summaryDisplayValues: number[] = [0, 0, 0];
  
  // Store digit arrays for each card
  cardDigits: { digit: string; animate: boolean; key: number }[][] = [[], [], []];
  
  // Trigger key to force re-render
  animationTrigger = 0;
  
  get hasActiveFilters(): boolean {
    return this.searchText !== '' || this.selectedCamera !== '' || this.selectedArea !== '';
  }

  // Loading states
  isBarChartLoading = false;
  isDonutChartLoading = false;
  isLineChartLoading = false;

  // Bar Chart - Thống kê nhận chủng học
  public barChartLabels: string[] = Array.from({length: 24}, (_, i) => i.toString());
  public barChartData: ChartData<'bar'> = {
    labels: this.barChartLabels,
    datasets: [
      { data: Array(24).fill(0), label: 'Châu Á', backgroundColor: '#ec4899', hoverBackgroundColor: '#db2777', borderRadius: 4, barThickness: 8 },
      { data: Array(24).fill(0), label: 'Da Trắng', backgroundColor: '#3b82f6', hoverBackgroundColor: '#2563eb', borderRadius: 4, barThickness: 8 },
      { data: Array(24).fill(0), label: 'Ấn Độ', backgroundColor: '#8b5cf6', hoverBackgroundColor: '#7c3aed', borderRadius: 4, barThickness: 8 },
      { data: Array(24).fill(0), label: 'Trung Đông', backgroundColor: '#f59e0b', hoverBackgroundColor: '#d97706', borderRadius: 4, barThickness: 8 },
      { data: Array(24).fill(0), label: 'Da đen', backgroundColor: '#10b981', hoverBackgroundColor: '#059669', borderRadius: 4, barThickness: 8 },
      { data: Array(24).fill(0), label: 'Mỹ - Latin', backgroundColor: '#06b6d4', hoverBackgroundColor: '#0891b2', borderRadius: 4, barThickness: 8 },
    ]
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable animation for smooth real-time updates
    scales: {
      x: { 
        stacked: true,
        grid: { display: false },
        ticks: { 
          font: { size: window.innerWidth < 768 ? 8 : 10 }, 
          maxRotation: 0, 
          autoSkip: window.innerWidth < 480 ? true : false,
          maxTicksLimit: window.innerWidth < 480 ? 12 : 24
        }
      },
      y: { 
        stacked: true,
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: window.innerWidth < 768 ? 8 : 10 } }
      }
    },
    plugins: { 
      legend: { 
        display: false
      }
    }
  };

  // Donut Chart - Thống kê lượt xuất hiện
  public donutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverBackgroundColor: [],
      borderWidth: 0
    }]
  };
  public donutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable all animations for smooth real-time updates
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false, // Tắt tooltip mặc định
        external: function(context: any) {
          // Tạo tooltip custom để không bị giới hạn bởi container
          const tooltip = context.tooltip;
          if (tooltip.opacity === 0) {
            const tooltipEl = document.getElementById('chartjs-tooltip');
            if (tooltipEl) {
              tooltipEl.style.opacity = '0';
            }
            return;
          }

          let tooltipEl = document.getElementById('chartjs-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.style.cssText = `
              position: absolute;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              pointer-events: none;
              z-index: 999999;
              border: 1px solid rgba(255, 255, 255, 0.2);
            `;
            document.body.appendChild(tooltipEl);
          }

          const position = context.chart.canvas.getBoundingClientRect();
          const bodyFont = tooltip.options.bodyFont;

          // Set content
          if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map((b: any) => b.lines);

            let innerHtml = '';
            titleLines.forEach((title: string) => {
              innerHtml += '<div style="font-weight: bold; margin-bottom: 4px;">' + title + '</div>';
            });
            bodyLines.forEach((body: string[], i: number) => {
              innerHtml += '<div>' + body + '</div>';
            });
            tooltipEl.innerHTML = innerHtml;
          }

          // Position
          const chartArea = context.chart.chartArea;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const isLeft = tooltip.caretX < centerX;
          
          tooltipEl.style.opacity = '1';
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.left = position.left + window.pageXOffset + (isLeft ? tooltip.caretX + 10 : tooltip.caretX - tooltipEl.offsetWidth - 10) + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltip.caretY - tooltipEl.offsetHeight / 2 + 'px';
        },
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const percentage = ((context.raw / context.chart._metasets[0].total) * 100).toFixed(0);
            return `${context.raw.toLocaleString()} (${percentage}%)`;
          }
        }
      },

    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const label = this.donutChartData.labels?.[elementIndex] as string;
        if (label) {
          this.toggleAgeGroup(label);
        }
      }
    }
  };

  // Line Chart - Lượt xuất hiện của các đối tượng
  public lineChartLabels: string[] = Array.from({length: 24}, (_, i) => i.toString());
  public lineChartData: ChartData<'line'> = {
    labels: this.lineChartLabels,
    datasets: [
      { 
        data: Array(24).fill(0),
        label: 'Nam', 
        borderColor: '#10b981', 
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      { 
        data: Array(24).fill(0),
        label: 'Nữ', 
        borderColor: '#ef4444', 
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      { 
        data: Array(24).fill(0),
        label: 'Khác', 
        borderColor: '#3b82f6', 
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable animation for smooth real-time updates
    scales: {
      x: { 
        grid: { display: false },
        ticks: { 
          font: { size: window.innerWidth < 768 ? 8 : 10 }, 
          maxRotation: 0, 
          autoSkip: window.innerWidth < 480 ? true : false,
          maxTicksLimit: window.innerWidth < 480 ? 12 : 24
        }
      },
      y: { 
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: window.innerWidth < 768 ? 8 : 10 } }
      }
    },
    plugins: { 
      legend: { 
        display: true,
        position: 'top',
        align: 'end',
        labels: { 
          boxWidth: window.innerWidth < 768 ? 10 : 12,
          boxHeight: window.innerWidth < 768 ? 10 : 12,
          padding: window.innerWidth < 480 ? 6 : 12,
          font: { size: window.innerWidth < 768 ? 9 : 11 },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        position: 'nearest',
        xAlign: (context: any) => {
          // Nếu hover ở bên trái thì tooltip xuất hiện bên phải
          const chartArea = context.chart.chartArea;
          const centerX = (chartArea.left + chartArea.right) / 2;
          return context.tooltip.caretX < centerX ? 'right' : 'left';
        },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  };

  ngOnInit(): void {
    // Initialize digit arrays for each card
    this.initializeCardDigits();
    
    // Load initial data
    this.loadCameraOptions();
    this.loadCameraLocations();
    this.calculateChartDimensions();
    
    // Set default time range to today and load data
    this.selectedTimeRange = 'today';
    this.loadHumanStatistics();

    // Start SSE connection for real-time updates (non-blocking)
    // SSE runs independently and doesn't block initial data rendering
    setTimeout(() => this.connectSSE(), 100);
  }
  
  // Initialize digit arrays from initial card values
  private initializeCardDigits(): void {
    for (let i = 0; i < this.summaryCards.length; i++) {
      const value = this.summaryCards[i].value;
      if (typeof value === 'number') {
        const digits = value.toString().split('');
        this.cardDigits[i] = digits.map((d, idx) => ({ digit: d, animate: false, key: idx }));
        this.summaryDisplayValues[i] = value;
      }
    }
  }

  // Helper method to update individual summary card values with animation
  private updateSummaryCardValue(index: number, newValue: string | number): void {
    console.log(`📊 Updating summary card ${index}:`, { 
      oldValue: this.summaryCards[index]?.value, 
      newValue,
      changed: this.summaryCards[index]?.value !== newValue 
    });
    
    if (this.summaryCards[index] && this.summaryCards[index].value !== newValue) {
      const oldValue = this.summaryCards[index].value;
      
      // Update value
      this.summaryCards[index].value = newValue;
      this.cdr.markForCheck();
      
      // Animate if it's a number
      if (typeof newValue === 'number' && typeof oldValue === 'number') {
        this.animateNumberDigits(index, oldValue, newValue);
      }
      
      console.log('✅ Card updated');
    }
  }

  // Animate number change by individual digits
  private animateNumberDigits(cardIndex: number, oldValue: number, newValue: number): void {
    console.log('🎯 animateNumberDigits:', { cardIndex, oldValue, newValue });
    
    const oldDigits = oldValue.toString().split('');
    const newDigits = newValue.toString().split('');
    
    console.log('📊 Original digits:', { oldDigits, newDigits });
    
    // Build digit array with animation flags (no padding with zeros)
    const digitArray: { digit: string; animate: boolean }[] = [];
    let hasChanges = false;
    
    // Compare from right to left (most significant digits)
    const maxLength = Math.max(oldDigits.length, newDigits.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldDigit = oldDigits[i] || '';
      const newDigit = newDigits[i] || '';
      const shouldAnimate = oldDigit !== newDigit;
      
      if (shouldAnimate) {
        hasChanges = true;
        console.log(`🔄 Digit ${i} changed: "${oldDigit}" → "${newDigit}"`);
      }
      
      digitArray.push({
        digit: newDigit,
        animate: shouldAnimate
      });
    }
    
    console.log('📊 Final digit array:', JSON.stringify(digitArray));
    console.log('🎬 Has changes?', hasChanges);
    
    // Update display with unique keys to force element recreation
    this.summaryDisplayValues[cardIndex] = newValue;
    this.animationTrigger++;
    
    const digitArrayWithKeys = digitArray.map((d, idx) => ({
      ...d,
      key: d.animate ? this.animationTrigger * 1000 + idx : idx
    }));
    
    this.cardDigits[cardIndex] = digitArrayWithKeys;
    this.cdr.detectChanges();
    
    console.log('✅ Animation started with keys:', JSON.stringify(digitArrayWithKeys));
    
    // Check actual DOM elements after change detection
    setTimeout(() => {
      const spans = this.digitSpans?.toArray() || [];
      console.log('🔍 Total digit spans in DOM:', spans.length);
      spans.forEach((span, idx) => {
        const el = span.nativeElement;
        console.log(`  Digit ${idx}: "${el.textContent}" | Classes: "${el.className}" | data-animate: "${el.getAttribute('data-animate')}"`);
      });
    }, 20);
    
    // Remove animation flags after animation completes
    if (hasChanges) {
      setTimeout(() => {
        this.cardDigits[cardIndex] = digitArrayWithKeys.map(d => ({ 
          ...d, 
          animate: false,
          key: d.key
        }));
        this.cdr.detectChanges();
      }, 550);
    }
  }

  // TrackBy function for summary cards to prevent unnecessary re-renders
  trackByCardIndex(index: number, card: any): number {
    return index;
  }
  
  // Get digits array for rendering individual digits
  getCardDigits(cardIndex: number): { digit: string; animate: boolean }[] {
    return this.cardDigits[cardIndex] || [];
  }
  
  // Track by for digit rendering - use key to force recreation when animating
  trackByDigit(index: number, item: any): any {
    return item.key || index;
  }

  private loadCameraOptions(): void {
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        this.cameraOptions = [
          { label: 'Tất cả Camera', value: '' },
          ...cameras
        ];
      },
      error: (error) => {
        console.error('Error loading camera options:', error);
      }
    });
  }

  private loadCameraLocations(): void {
    this.http.get('/api/admin/camera/camera-with-location').subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.cameraLocations = response.data.cameras || [];
          
          // Map locations to areaOptions
          const locations = response.data.locations || [];
          this.areaOptions = [
            { label: 'Tất cả khu vực', value: '' },
            ...locations.map((location: string) => ({
              label: location,
              value: location
            }))
          ];
          
          console.log('Camera locations loaded:', this.cameraLocations);
          console.log('Area options updated:', this.areaOptions);
        }
      },
      error: (error) => {
        console.error('Error loading camera locations:', error);
      }
    });
  }

  private loadHumanStatistics(): void {
    const params: any = {};
    
    // Add camera filter if selected
    if (this.selectedCamera) {
      params.cameraSn = this.selectedCamera;
    }

    // Add area filter if selected
    if (this.selectedArea) {
      params.location = this.selectedArea;
    }
    
    // Add time range filter - use UTC format similar to luu-luong-ra-vao
    let fromDate: Date;
    let toDate: Date;
    
    // Priority: custom date picker first, then selected time range
    if (this.customStartDate && this.customEndDate) {
      fromDate = new Date(this.customStartDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(this.customEndDate);
      toDate.setHours(23, 59, 59, 999);
    } else if (this.selectedTimeRange && this.selectedTimeRange !== 'custom') {
      const dateRange = this.getDateRangeFromSelection();
      if (dateRange.start && dateRange.end) {
        fromDate = dateRange.start;
        toDate = dateRange.end;
      } else {
        const now = new Date();
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    
    // Format to UTC string with timezone
    const formatToUTC = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    };
    
    params.fromUtc = formatToUTC(fromDate);
    params.toUtc = formatToUTC(toDate);

    // Determine API endpoint based on date range
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24));
    const apiEndpoint = daysDiff > 1 ? '/api/admin/events/human/by-day' : '/api/admin/events/human/by-hour-of-day';
    
    console.log('Date range debug:', {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(), 
      daysDiff,
      apiEndpoint,
      selectedTimeRange: this.selectedTimeRange,
      hasCustomDates: !!(this.customStartDate && this.customEndDate)
    });

    this.http.get(apiEndpoint, { params }).subscribe({
      next: (response: any) => {
        this.updateChartsWithApiData(response, daysDiff > 1);
      },
      error: (error) => {
        console.error('Error loading human statistics:', error);
        // Keep charts empty in case of error
        console.log('API error - keeping charts empty');
      }
    });
  }

  private getDateRangeFromSelection(): { start: Date | null; end: Date | null } {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;
    
    switch (this.selectedTimeRange) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: fromDate, end: toDate };
      case 'yesterday':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return { start: fromDate, end: toDate };
      case '7days':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: fromDate, end: toDate };
      case '30days':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: fromDate, end: toDate };
      default:
        // Default to first day of month to today
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: fromDate, end: toDate };
    }
  }

  private updateChartsWithApiData(apiResponse: any, isDayView: boolean = false): void {
    console.log('📊 updateChartsWithApiData called with:', { apiResponse, isDayView });
    
    if (apiResponse && apiResponse.success && apiResponse.data) {
      const data = apiResponse.data;
      console.log('📊 API data structure:', { 
        hasAgeRange: !!data.age_range, 
        hasGender: !!data.gender, 
        hasComplexion: !!data.complexion,
        ageRangeKeys: data.age_range ? Object.keys(data.age_range) : [],
        genderKeys: data.gender ? Object.keys(data.gender) : [],
        complexionKeys: data.complexion ? Object.keys(data.complexion) : []
      });
      
      // Check if data has new structure (age_range, gender, complexion)
      if (data.age_range && data.gender && data.complexion) {
        console.log('✅ Using new BE data structure');
        this.processNewBeData(data, isDayView);
      } else {
        console.log('⚠️ Using old data structure fallback');
        // Fallback to old structure
        this.updateLineChartFromApi(data);
        this.updateOtherChartsFromApi(data);
      }
    } else {
      // No data available - keep charts empty
      console.log('❌ No API data available, keeping charts empty');
    }
  }

  private processNewBeData(data: BeDataResponse['data'], isDayView: boolean = false): void {
    // Store base data from API (deep copy to avoid reference issues)
    this.genderData = JSON.parse(JSON.stringify(data.gender));
    this.complexionData = JSON.parse(JSON.stringify(data.complexion));
    this.ageRangeData = { ...data.age_range };
    
    console.log('📦 Stored base data from API:', {
      genderHours: Object.keys(this.genderData).length,
      complexionHours: Object.keys(this.complexionData).length,
      ageRanges: Object.keys(this.ageRangeData).length
    });
    
    // Process age range data for donut chart
    this.updateDonutChartFromAgeRange(data.age_range);
    
    // Process gender/complexion data based on view type
    if (isDayView) {
      // For multi-day view, gender and complexion data are by day
      this.updateLineChartFromGenderDataByDay(data.gender);
      this.updateBarChartFromComplexionDataByDay(data.complexion);
    } else {
      // For single day view, gender and complexion data are by hour
      this.updateLineChartFromGenderData(data.gender);
      this.updateBarChartFromComplexionData(data.complexion);
    }
    
    // Update summary cards
    this.updateSummaryCardsFromNewData(data, isDayView);
    
    // Trigger change detection to ensure charts render
    this.cdr.detectChanges();
  }

  private updateDonutChartFromAgeRange(ageRange: { [key: string]: number }): void {
    // Define age groups in correct order from youngest to oldest, plus Unknown at the end
    const ageGroupsOrder = ['0-2', '3-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-100', 'Unknown'];
    const allColors = ['#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#9ca3af'];
    const allHoverColors = ['#7c3aed', '#ea580c', '#65a30d', '#db2777', '#2563eb', '#d97706', '#059669', '#0891b2', '#dc2626', '#6b7280'];
    
    // Sort labels and values according to age order
    const sortedLabels: string[] = [];
    const sortedValues: number[] = [];
    const sortedColors: string[] = [];
    const sortedHoverColors: string[] = [];
    
    let totalCount = 0;
    this.ageGroupCounts = {};
    
    // Process in correct order from youngest to oldest, then Unknown
    ageGroupsOrder.forEach((ageKey, index) => {
      if (ageRange.hasOwnProperty(ageKey)) {
        const count = ageRange[ageKey] || 0;
        totalCount += count;
        
        // Display "Khác" for Unknown in the chart and legend
        const displayLabel = ageKey === 'Unknown' ? 'Khác' : ageKey;
        
        // Store count with displayLabel as key for legend
        this.ageGroupCounts[displayLabel] = count;
        
        if (count > 0) {
          sortedLabels.push(displayLabel);
          sortedValues.push(count);
          sortedColors.push(allColors[index]);
          sortedHoverColors.push(allHoverColors[index]);
        }
      }
    });
    
    this.totalPeopleCount = totalCount;
    
    // Update directly via chart instance for smooth updates
    if (this.donutChart?.chart) {
      console.log('✅ Donut chart instance found, updating...');
      this.donutChart.chart.data.labels = sortedLabels;
      this.donutChart.chart.data.datasets[0].data = sortedValues;
      this.donutChart.chart.data.datasets[0].backgroundColor = sortedColors;
      this.donutChart.chart.data.datasets[0].hoverBackgroundColor = sortedHoverColors;
      this.donutChart.chart.update('none'); // 'none' = no animation
      this.cdr.markForCheck(); // Trigger change detection for totalPeopleCount
    } else {
      console.log('⚠️ Donut chart instance not found, using fallback');
      // Fallback: initial data setup
      this.donutChartData = {
        labels: sortedLabels,
        datasets: [{
          data: sortedValues,
          backgroundColor: sortedColors,
          hoverBackgroundColor: sortedHoverColors,
          borderWidth: 0
        }]
      };
    }
  }

  private updateLineChartFromGenderData(genderData: { [hour: string]: { Female?: number; Male?: number; Unknown?: number } }): void {
    console.log('🔍 updateLineChartFromGenderData - genderData:', genderData);
    console.log('🔍 Sample hour data for hour 0:', genderData['0']);
    
    const hours = Array.from({length: 24}, (_, i) => i.toString());
    const maleData = hours.map(hour => genderData[hour]?.Male || 0);
    const femaleData = hours.map(hour => genderData[hour]?.Female || 0);
    const unknownData = hours.map(hour => genderData[hour]?.Unknown || 0);
    
    console.log('🔍 unknownData array:', unknownData);
    console.log('🔍 Total unknown:', unknownData.reduce((a, b) => a + b, 0));
    
    // Update directly via chart instance for smooth updates
    if (this.lineChart?.chart) {
      console.log('✅ Line chart instance found, updating...');
      this.lineChart.chart.data.datasets[0].data = maleData;
      this.lineChart.chart.data.datasets[1].data = femaleData;
      this.lineChart.chart.data.datasets[2].data = unknownData;
      this.lineChart.chart.update('none'); // 'none' = no animation
    } else {
      console.log('⚠️ Line chart instance not found, using fallback');
      // Fallback: initial data setup
      this.lineChartData = {
        labels: hours,
        datasets: [
          { 
            data: maleData,
            label: 'Nam', 
            borderColor: '#10b981', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          { 
            data: femaleData,
            label: 'Nữ', 
            borderColor: '#8b5cf6', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          { 
            data: unknownData,
            label: 'Khác', 
            borderColor: '#f59e0b', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      };
    }
  }

  private updateBarChartFromComplexionData(complexionData: { [hour: string]: { White?: number; Black?: number; Asian?: number; Latino?: number; Indian?: number; MiddleEastern?: number; Unknown?: number } }): void {
    console.log('🔍 updateBarChartFromComplexionData - complexionData:', complexionData);
    console.log('🔍 Sample hour data for hour 0:', complexionData['0']);
    
    const hours = Array.from({length: 24}, (_, i) => i.toString());
    
    const asianData = hours.map(hour => complexionData[hour]?.Asian || 0);
    const whiteData = hours.map(hour => complexionData[hour]?.White || 0);
    const indianData = hours.map(hour => complexionData[hour]?.Indian || 0);
    const middleEasternData = hours.map(hour => complexionData[hour]?.MiddleEastern || 0);
    const blackData = hours.map(hour => complexionData[hour]?.Black || 0);
    const latinoData = hours.map(hour => complexionData[hour]?.Latino || 0);
    const unknownData = hours.map(hour => complexionData[hour]?.Unknown || 0);
    
    console.log('🔍 unknownData for complexion:', unknownData);
    console.log('🔍 Total unknown complexion:', unknownData.reduce((a, b) => a + b, 0));
    
    // Update directly via chart instance for smooth updates
    if (this.barChart?.chart) {
      console.log('✅ Bar chart instance found, updating...');
      this.barChart.chart.data.datasets[0].data = asianData;
      this.barChart.chart.data.datasets[1].data = whiteData;
      this.barChart.chart.data.datasets[2].data = indianData;
      this.barChart.chart.data.datasets[3].data = middleEasternData;
      this.barChart.chart.data.datasets[4].data = blackData;
      this.barChart.chart.data.datasets[5].data = latinoData;
      this.barChart.chart.update('none'); // 'none' = no animation
    } else {
      console.log('⚠️ Bar chart instance not found, using fallback');
      // Fallback: initial data setup
      this.barChartData = {
        labels: hours,
        datasets: [
          { data: asianData, label: 'Châu Á', backgroundColor: '#ec4899', hoverBackgroundColor: '#db2777', borderRadius: 4, barThickness: 8 },
          { data: whiteData, label: 'Da Trắng', backgroundColor: '#3b82f6', hoverBackgroundColor: '#2563eb', borderRadius: 4, barThickness: 8 },
          { data: indianData, label: 'Ấn Độ', backgroundColor: '#8b5cf6', hoverBackgroundColor: '#7c3aed', borderRadius: 4, barThickness: 8 },
          { data: middleEasternData, label: 'Trung Đông', backgroundColor: '#f59e0b', hoverBackgroundColor: '#d97706', borderRadius: 4, barThickness: 8 },
          { data: blackData, label: 'Da đen', backgroundColor: '#10b981', hoverBackgroundColor: '#059669', borderRadius: 4, barThickness: 8 },
          { data: latinoData, label: 'Mỹ - Latin', backgroundColor: '#06b6d4', hoverBackgroundColor: '#0891b2', borderRadius: 4, barThickness: 8 },
        ]
      };
    }
  }

  private updateLineChartFromGenderDataByDay(genderData: { [day: string]: { Female?: number; Male?: number; Unknown?: number } }): void {
    console.log('🔍 updateLineChartFromGenderDataByDay - genderData keys:', Object.keys(genderData));
    
    // For by-day view, use day labels instead of hour labels
    // Keys might be day numbers (1, 2, 3...) or full dates
    const days = Object.keys(genderData).sort((a, b) => parseInt(a) - parseInt(b));
    const dayLabels = days.map(day => {
      // If day is just a number, format it as "Ngày X"
      if (/^\d+$/.test(day)) {
        return `Ngày ${day}`;
      }
      // Otherwise treat as date string
      const date = new Date(day);
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    });
    
    const maleData = days.map(day => genderData[day]?.Male || 0);
    const femaleData = days.map(day => genderData[day]?.Female || 0);
    const unknownData = days.map(day => genderData[day]?.Unknown || 0);
    
    // Update directly via chart instance for smooth updates
    if (this.lineChart?.chart) {
      this.lineChart.chart.data.labels = dayLabels;
      this.lineChart.chart.data.datasets[0].data = maleData;
      this.lineChart.chart.data.datasets[1].data = femaleData;
      this.lineChart.chart.data.datasets[2].data = unknownData;
      this.lineChart.chart.update('none'); // 'none' = no animation
    } else {
      // Fallback: initial data setup
      this.lineChartData = {
        labels: dayLabels,
        datasets: [
          { 
            data: maleData,
            label: 'Nam', 
            borderColor: '#10b981', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          { 
            data: femaleData,
            label: 'Nữ', 
            borderColor: '#8b5cf6', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          { 
            data: unknownData,
            label: 'Khác', 
            borderColor: '#f59e0b', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      };
    }
  }

  private updateBarChartFromComplexionDataByDay(complexionData: { [day: string]: { White?: number; Black?: number; Asian?: number; Latino?: number; Indian?: number; MiddleEastern?: number; Unknown?: number } }): void {
    console.log('🔍 updateBarChartFromComplexionDataByDay - complexionData keys:', Object.keys(complexionData));
    
    // For by-day view, use day labels instead of hour labels
    // Keys might be day numbers (1, 2, 3...) or full dates
    const days = Object.keys(complexionData).sort((a, b) => parseInt(a) - parseInt(b));
    const dayLabels = days.map(day => {
      // If day is just a number, format it as "Ngày X"
      if (/^\d+$/.test(day)) {
        return `Ngày ${day}`;
      }
      // Otherwise treat as date string
      const date = new Date(day);
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    });
    
    const asianData = days.map(day => complexionData[day]?.Asian || 0);
    const whiteData = days.map(day => complexionData[day]?.White || 0);
    const indianData = days.map(day => complexionData[day]?.Indian || 0);
    const middleEasternData = days.map(day => complexionData[day]?.MiddleEastern || 0);
    const blackData = days.map(day => complexionData[day]?.Black || 0);
    const latinoData = days.map(day => complexionData[day]?.Latino || 0);
    const unknownData = days.map(day => complexionData[day]?.Unknown || 0);
    
    // Update directly via chart instance for smooth updates
    if (this.barChart?.chart) {
      this.barChart.chart.data.labels = dayLabels;
      this.barChart.chart.data.datasets[0].data = asianData;
      this.barChart.chart.data.datasets[1].data = whiteData;
      this.barChart.chart.data.datasets[2].data = indianData;
      this.barChart.chart.data.datasets[3].data = middleEasternData;
      this.barChart.chart.data.datasets[4].data = blackData;
      this.barChart.chart.data.datasets[5].data = latinoData;
      this.barChart.chart.update('none'); // 'none' = no animation
    } else {
      // Fallback: initial data setup
      this.barChartData = {
        labels: dayLabels,
        datasets: [
          { data: asianData, label: 'Châu Á', backgroundColor: '#ec4899', hoverBackgroundColor: '#db2777', borderRadius: 4, barThickness: 12 },
          { data: whiteData, label: 'Da Trắng', backgroundColor: '#3b82f6', hoverBackgroundColor: '#2563eb', borderRadius: 4, barThickness: 12 },
          { data: indianData, label: 'Ấn Độ', backgroundColor: '#8b5cf6', hoverBackgroundColor: '#7c3aed', borderRadius: 4, barThickness: 12 },
          { data: middleEasternData, label: 'Trung Đông', backgroundColor: '#f59e0b', hoverBackgroundColor: '#d97706', borderRadius: 4, barThickness: 12 },
          { data: blackData, label: 'Da đen', backgroundColor: '#10b981', hoverBackgroundColor: '#059669', borderRadius: 4, barThickness: 12 },
          { data: latinoData, label: 'Mỹ - Latin', backgroundColor: '#06b6d4', hoverBackgroundColor: '#0891b2', borderRadius: 4, barThickness: 12 },
        ]
      };
    }
  }

  private updateSummaryCardsFromNewData(data: BeDataResponse['data'], isDayView: boolean = false): void {
    console.log('🔍 updateSummaryCardsFromNewData - isDayView:', isDayView);
    console.log('🔍 gender data keys:', Object.keys(data.gender));
    
    // Calculate total people count from age range
    const totalCount = Object.values(data.age_range).reduce((sum, val) => sum + val, 0);
    
    // Find peak from gender data (works for both hour and day data)
    let maxCount = 0;
    let peakPeriod = '0';
    
    // Debug: log all period totals
    const periodTotals: { period: string, total: number }[] = [];
    
    Object.entries(data.gender).forEach(([period, genderCount]) => {
      const periodTotal = (genderCount.Male || 0) + (genderCount.Female || 0) + (genderCount.Unknown || 0);
      periodTotals.push({ period, total: periodTotal });
      
      if (periodTotal > maxCount) {
        maxCount = periodTotal;
        peakPeriod = period;
      }
    });
    
    // Sort and show top 5 periods
    const sortedPeriods = periodTotals.sort((a, b) => b.total - a.total);
    console.log('🔍 Top 5 periods with highest count:');
    sortedPeriods.slice(0, 5).forEach((p, i) => {
      const genderBreakdown = data.gender[p.period];
      console.log(`  ${i + 1}. Period ${p.period}: ${p.total.toLocaleString()} (Male: ${genderBreakdown?.Male || 0}, Female: ${genderBreakdown?.Female || 0}, Unknown: ${genderBreakdown?.Unknown || 0})`);
    });
    console.log('🔍 Peak period:', peakPeriod, 'with count:', maxCount.toLocaleString());
    
    // Verify calculation
    const peakGender = data.gender[peakPeriod];
    const verifyTotal = (peakGender?.Male || 0) + (peakGender?.Female || 0) + (peakGender?.Unknown || 0);
    console.log('🔍 Verify peak calculation:', { 
      period: peakPeriod, 
      male: peakGender?.Male || 0, 
      female: peakGender?.Female || 0, 
      unknown: peakGender?.Unknown || 0,
      calculatedTotal: verifyTotal,
      maxCount: maxCount,
      match: verifyTotal === maxCount ? '✅ CORRECT' : '❌ MISMATCH'
    });
    
    // Find dominant age group (exclude Unknown)
    let dominantAgeGroup = '20-29t';
    let maxAgeCount = 0;
    Object.entries(data.age_range).forEach(([ageRange, count]) => {
      // Skip Unknown age group
      if (ageRange !== 'Unknown' && count > maxAgeCount) {
        maxAgeCount = count;
        dominantAgeGroup = ageRange + 't';
      }
    });
    
    // Update only changed values to avoid unnecessary animations
    this.updateSummaryCardValue(0, totalCount);
    this.updateSummaryCardValue(1, maxCount);
    this.updateSummaryCardValue(2, dominantAgeGroup);
  }

  private updateLineChartFromApi(data: any): void {
    // Extract hourly data directly from API response
    const maleCount = data.maleCount || Array(24).fill(0);
    const femaleCount = data.femaleCount || Array(24).fill(0);
    const unknownCount = data.unknownCount || Array(24).fill(0);

    // Update line chart data with API data
    this.lineChartData = {
      labels: this.lineChartLabels,
      datasets: [
        { 
          data: maleCount,
          label: 'Nam', 
          borderColor: '#10b981', 
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        { 
          data: femaleCount,
          label: 'Nữ', 
          borderColor: '#ef4444', 
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        { 
          data: unknownCount,
          label: 'Khác', 
          borderColor: '#3b82f6', 
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };
  }

  private updateOtherChartsFromApi(data: any): void {
    // Reset hidden state when loading new data
    this.hiddenAgeGroups.clear();
    
    // Update summary cards with API data
    this.updateSummaryCards(data);
    
    // Update bar chart with complexion data by hour
    const complexionCount = data.complexionCount || {};
    const complexionLabels = ['Châu Á', 'Da Trắng', 'Ấn Độ', 'Trung Đông', 'Da đen', 'Mỹ - Latin'];
    const complexionApiKeys = ['Asian', 'White', 'Indian', 'MiddleEastern', 'Black', 'Latino'];
    const complexionColors = ['#ec4899', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4'];
    const complexionHoverColors = ['#db2777', '#2563eb', '#7c3aed', '#d97706', '#059669', '#0891b2'];

    const datasets = complexionLabels.map((label, index) => {
      const apiKey = complexionApiKeys[index];
      const hourlyData = complexionCount[apiKey] || Array(24).fill(0);
      
      return {
        data: hourlyData,
        label: label,
        backgroundColor: complexionColors[index],
        hoverBackgroundColor: complexionHoverColors[index],
        borderRadius: 4,
        barThickness: 8
      };
    });

    this.barChartData = {
      labels: this.barChartLabels, // 24 hours
      datasets: datasets
    };

    // Update donut chart (age distribution) from ageRangeCount
    const ageRangeCount = data.ageRangeCount || {};
    
    // Define age groups in correct order from youngest to oldest
    const ageGroupsOrder = ['0-2', '3-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-100'];
    const ageGroupsDisplay = ['0-2', '3-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-100'];
    const allColors = ['#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];
    const allHoverColors = ['#7c3aed', '#ea580c', '#65a30d', '#db2777', '#2563eb', '#d97706', '#059669', '#0891b2', '#dc2626'];

    // Filter out age groups with 0 count for cleaner display
    const nonZeroLabels: string[] = [];
    const nonZeroData: number[] = [];
    const nonZeroColors: string[] = [];
    const nonZeroHoverColors: string[] = [];
    
    // Calculate total count for center display
    let totalCount = 0;
    
    // Store age group counts for legend display
    this.ageGroupCounts = {};
    
    // Process in correct order from youngest to oldest
    ageGroupsOrder.forEach((ageKey, index) => {
      const count = ageRangeCount[ageKey] || 0;
      const displayLabel = ageGroupsDisplay[index];
      
      totalCount += count;
      this.ageGroupCounts[displayLabel] = count;
      
      if (count > 0) {
        nonZeroLabels.push(displayLabel);
        nonZeroData.push(count);
        nonZeroColors.push(allColors[index]);
        nonZeroHoverColors.push(allHoverColors[index]);
      }
    });
    
    this.totalPeopleCount = totalCount;

    this.donutChartData = {
      labels: nonZeroLabels,
      datasets: [{
        data: nonZeroData,
        backgroundColor: nonZeroColors,
        hoverBackgroundColor: nonZeroHoverColors,
        borderWidth: 0
      }]
    };
  }

  // Helper method to get age group count for display
  getAgeGroupCount(ageGroup: any): number {
    return this.ageGroupCounts[String(ageGroup)] || 0;
  }

  // Update summary cards data
  private updateSummaryCards(data: any): void {
    const maleCount = data.maleCount || Array(24).fill(0);
    const femaleCount = data.femaleCount || Array(24).fill(0);
    const ageRangeCount = data.ageRangeCount || {};

    // Calculate totals
    const totalMale = maleCount.reduce((sum: number, count: number) => sum + count, 0);
    const totalFemale = femaleCount.reduce((sum: number, count: number) => sum + count, 0);
    const totalAll = totalMale + totalFemale;
    
    // Find the dominant age group
    const ageGroups = {
      '0-9': (ageRangeCount['0-2'] || 0) + (ageRangeCount['3-9'] || 0),
      '10-19': ageRangeCount['10-19'] || 0,
      '20-29': ageRangeCount['20-29'] || 0,
      '30-39': ageRangeCount['30-39'] || 0,
      '40-49': ageRangeCount['40-49'] || 0,
      '50-59': ageRangeCount['50-59'] || 0,
      '60-69': ageRangeCount['60-69'] || 0,
      '70+': ageRangeCount['70-100'] || 0
    };
    
    let dominantAgeGroup = '20-29t';
    let maxCount = 0;
    Object.keys(ageGroups).forEach(group => {
      const count = (ageGroups as any)[group];
      if (count > maxCount) {
        maxCount = count;
        dominantAgeGroup = group === '70+' ? '70+' : group.replace('-', '-') + 't';
      }
    });

    // Find the highest count in a single hour for "peak" display
    const allHourlyCounts = [...maleCount, ...femaleCount];
    const maxHourlyCount = Math.max(...allHourlyCounts);

    // Update only changed values to avoid unnecessary animations
    this.updateSummaryCardValue(0, totalAll);
    this.updateSummaryCardValue(1, maxHourlyCount);
    this.updateSummaryCardValue(2, dominantAgeGroup);
  }

  // Toggle age group visibility
  toggleAgeGroup(ageGroup: any): void {
    const ageGroupStr = String(ageGroup);
    if (this.hiddenAgeGroups.has(ageGroupStr)) {
      this.hiddenAgeGroups.delete(ageGroupStr);
    } else {
      this.hiddenAgeGroups.add(ageGroupStr);
    }
    this.updateDonutChartVisibility();
  }

  // Check if age group is hidden
  isAgeGroupHidden(ageGroup: any): boolean {
    return this.hiddenAgeGroups.has(String(ageGroup));
  }

  // Update donut chart visibility based on hidden items
  private updateDonutChartVisibility(): void {
    if (!this.donutChartData.datasets[0]) return;

    const dataset = this.donutChartData.datasets[0];
    const labels = this.donutChartData.labels as string[];
    
    // Use the same color array as in updateDonutChartFromAgeRange
    const ageGroupsOrder = ['0-2', '3-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-100', 'Khác'];
    const allColors = ['#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#9ca3af'];
    
    // Map each label to its original color based on age group order
    const originalColors = labels.map(label => {
      // Find the index in ageGroupsOrder
      const displayLabel = label;
      let colorIndex = ageGroupsOrder.indexOf(displayLabel);
      
      // If not found directly, might need to handle "Unknown" vs "Khác" mapping
      if (colorIndex === -1) {
        colorIndex = 0; // Default color
      }
      
      return allColors[colorIndex];
    });
    
    // Reset all segments to visible first
    const originalData = labels.map(label => this.getAgeGroupCount(label));

    // Apply hidden state
    dataset.data = originalData.map((value, index) => {
      const label = labels[index];
      return this.hiddenAgeGroups.has(label) ? 0 : value;
    });

    dataset.backgroundColor = originalColors.map((color, index) => {
      const label = labels[index];
      return this.hiddenAgeGroups.has(label) ? '#e5e7eb' : color;
    });

    // Force chart update
    this.donutChartData = { ...this.donutChartData };
  }

  // Utility method to format date to UTC string - consistent with other components
  private formatDateToUTC(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
  }

  @HostListener('window:resize')
  onResize() {
    // Debounce để tránh tính toán nhiều lần khi resize
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.calculateChartDimensions();
      // this.updateChartOptions();
      
      // Recalculate thêm một lần sau khi DOM đã settle
      setTimeout(() => {
        this.calculateChartDimensions();
      }, 150);
    }, 100);
  }

  private calculateChartDimensions(): void {
    // Donut chart luôn cố định 200px (đã có trong CSS)
    // Bar chart sẽ tự động match với chiều cao của donut chart
    // Để giữ cân bằng layout giữa 2 charts trong top-section
    
    const donutChartFixedHeight = 200; // Match với CSS .donut-chart
    const cardPadding = 24;
    const titleAndMargin = 45;
    
    // Bar chart có chiều cao bằng donut chart để cân bằng
    const barHeight = donutChartFixedHeight;
    
    this.barChartHeight = `${barHeight}px`;
    // lineChartHeight luôn là 100% để chiếm hết bottom section
  }

  // private updateChartOptions(): void {
  //   const width = window.innerWidth;
  //   const isMobile = width < 768;
  //   const isSmall = width < 1530;
  //   const isLarge = width >= 1919;
  //   const isMedium = width >= 1530 && width < 1919;
  //   // Determine font sizes based on screen width
  //   let tickFontSize = 10;
  //   let legendFontSize = 11;
  //   let legendBoxSize = 12;
  //   let legendPadding = 12;
  //   
  //   if (isLarge) {
  //     tickFontSize =  16;
  //     legendFontSize = 16;
  //     legendBoxSize = 18;
  //     legendPadding = 20;
  //   } else if (isMedium) {
  //     tickFontSize = 11;
  //     legendFontSize = 11;
  //     legendBoxSize = 13;
  //     legendPadding = 14;
  //   } else if (isMobile) {
  //     tickFontSize = 8;
  //     legendFontSize = 9;
  //     legendBoxSize = 10;
  //     legendPadding = 6;
  //   }
  //   
  //   // Update bar chart options
  //   this.barChartOptions = {
  //     ...this.barChartOptions,
  //     scales: {
  //       x: { 
  //         stacked: true,
  //         grid: { display: false },
  //         ticks: { 
  //           font: { size: tickFontSize }, 
  //           maxRotation: 0, 
  //           autoSkip: isSmall,
  //           maxTicksLimit: isSmall ? 12 : 24
  //         }
  //       },
  //       y: { 
  //         stacked: true,
  //         beginAtZero: true,
  //         grid: { color: '#e5e7eb' },
  //         ticks: { font: { size: tickFontSize } }
  //       }
  //     },
  //     plugins: { 
  //       legend: { 
  //         display: false
  //       }
  //     }
  //   };

  //   // Update line chart options
  //   this.lineChartOptions = {
  //     ...this.lineChartOptions,
  //     scales: {
  //       x: { 
  //         grid: { display: false },
  //         ticks: { 
  //           font: { size: tickFontSize }, 
  //           maxRotation: 0, 
  //           autoSkip: isSmall,
  //           maxTicksLimit: isSmall ? 12 : 24
  //         }
  //       },
  //       y: { 
  //         beginAtZero: true,
  //         grid: { color: '#e5e7eb' },
  //         ticks: { font: { size: tickFontSize } }
  //       }
  //     },
  //     plugins: { 
  //       legend: { 
  //         display: true,
  //         position: 'top',
  //         align: 'end',
  //         labels: { 
  //           boxWidth: legendBoxSize,
  //           boxHeight: legendBoxSize,
  //           padding: legendPadding,
  //           font: { size: legendFontSize },
  //           usePointStyle: true,
  //           pointStyle: 'circle'
  //         }
  //       }
  //     }
  //   };
  // }

  getBackgroundColor(index: number): string {
    const colors = this.donutChartData.datasets[0].backgroundColor as string[];
    return colors[index] || '#ccc';
  }

  toggleDataset(index: number): void {
    const dataset = this.barChartData.datasets[index];
    if (dataset) {
      // Toggle hidden property
      dataset.hidden = !dataset.hidden;
      // Force chart update by creating new reference
      this.barChartData = {
        ...this.barChartData,
        datasets: [...this.barChartData.datasets]
      };
    }
  }

  isDatasetHidden(index: number): boolean {
    return this.barChartData.datasets[index]?.hidden || false;
  }

  onSearch(): void {
    console.log('Searching for:', this.searchText);
    this.loadStatisticsData();
  }

  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.showCameraDropdown = false;
  }

  toggleCameraDropdown(): void {
    this.showCameraDropdown = !this.showCameraDropdown;
    this.showTimeDropdown = false;
    this.showAreaDropdown = false;
  }

  toggleAreaDropdown(): void {
    this.showAreaDropdown = !this.showAreaDropdown;
    this.showTimeDropdown = false;
    this.showCameraDropdown = false;
  }

  selectTimeRange(range: string): void {
    this.selectedTimeRange = range;
    this.showTimeDropdown = false;
    
    if (range !== 'custom') {
      // Clear custom dates when selecting predefined time ranges
      this.customStartDate = null;
      this.customEndDate = null;
      console.log('Time range selected:', range);
      this.loadStatisticsData();
    }
  }

  onDateRangeSelected(event: { startDate: Date, endDate: Date }): void {
    this.customStartDate = event.startDate;
    this.customEndDate = event.endDate;
    this.selectedTimeRange = 'custom';
    console.log('Custom date range selected:', event);
    this.loadStatisticsData();
  }

  onDateRangeCleared(): void {
    this.customStartDate = null;
    this.customEndDate = null;
    this.selectedTimeRange = 'today';
    console.log('Date range cleared');
    this.loadStatisticsData();
  }

  selectCamera(camera: string): void {
    this.selectedCamera = camera;
    this.showCameraDropdown = false;
    console.log('Camera selected:', camera);
    // TODO: Load data based on camera
    this.loadStatisticsData();
  }

  getCameraLabel(): string {
    if (!this.selectedCamera) return 'Tất cả Camera';
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option ? option.label : 'Tất cả Camera';
  }

  selectArea(area: string): void {
    this.selectedArea = area;
    this.showAreaDropdown = false;
    console.log('Area selected:', area);
    // TODO: Load data based on area
    this.loadStatisticsData();
  }

  getAreaLabel(): string {
    if (!this.selectedArea) return 'Tất cả khu vực';
    const option = this.areaOptions.find(opt => opt.value === this.selectedArea);
    return option ? option.label : 'Tất cả khu vực';
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCamera = '';
    this.selectedArea = '';
    this.selectedTimeRange = 'today';
    this.showTimeDropdown = false;
    this.showCameraDropdown = false;
    this.showAreaDropdown = false;
    this.customStartDate = null;
    this.customEndDate = null;
    console.log('Filters cleared');
    this.loadStatisticsData();
  }

  exportReport(): void {
    console.log('Exporting report...');
    // TODO: Implement export functionality
  }

  /**
   * Update charts from real-time data (SSE, WebSocket, polling, etc.)
   * This method updates charts directly via chart instances for smooth updates without re-rendering
   * @param newData - New data in the same format as BE API response
   */
  public updateChartsFromRealTimeData(newData: BeDataResponse['data']): void {
    // Determine if this is day view or hour view based on data keys
    const genderKeys = Object.keys(newData.gender);
    const isDayView = genderKeys.length > 24 || genderKeys.some(key => key.includes('-'));
    
    // Update donut chart (age range)
    this.updateDonutChartFromAgeRange(newData.age_range);
    
    // Update line chart (gender)
    if (isDayView) {
      this.updateLineChartFromGenderDataByDay(newData.gender);
    } else {
      this.updateLineChartFromGenderData(newData.gender);
    }
    
    // Update bar chart (complexion)
    if (isDayView) {
      this.updateBarChartFromComplexionDataByDay(newData.complexion);
    } else {
      this.updateBarChartFromComplexionData(newData.complexion);
    }
    
    // Update summary cards
    this.updateSummaryCardsFromNewData(newData, isDayView);
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  /**
   * DEMO: Test real-time updates with random data
   * Call this from browser console: 
   * const comp = ng.getComponent(document.querySelector('app-doi-tuong-nhan-dien'));
   * comp.testRealTimeUpdate();
   */
  public testRealTimeUpdate(): void {
    console.log('🎬 Testing real-time chart update...');
    
    // Generate random data for demo
    const testData: BeDataResponse['data'] = {
      age_range: {
        '0-2': Math.floor(Math.random() * 100),
        '3-9': Math.floor(Math.random() * 200),
        '10-19': Math.floor(Math.random() * 300),
        '20-29': Math.floor(Math.random() * 500),
        '30-39': Math.floor(Math.random() * 400),
        '40-49': Math.floor(Math.random() * 300),
        '50-59': Math.floor(Math.random() * 200),
        '60-69': Math.floor(Math.random() * 150),
        '70-100': Math.floor(Math.random() * 100),
        'Unknown': Math.floor(Math.random() * 50)
      },
      gender: {},
      complexion: {}
    };
    
    // Generate gender data for 24 hours
    for (let i = 0; i < 24; i++) {
      testData.gender[i.toString()] = {
        Male: Math.floor(Math.random() * 200),
        Female: Math.floor(Math.random() * 200),
        Unknown: Math.floor(Math.random() * 50)
      };
      
      testData.complexion[i.toString()] = {
        Asian: Math.floor(Math.random() * 300),
        White: Math.floor(Math.random() * 100),
        Black: Math.floor(Math.random() * 50),
        Indian: Math.floor(Math.random() * 80),
        MiddleEastern: Math.floor(Math.random() * 60),
        Latino: Math.floor(Math.random() * 70),
        Unknown: Math.floor(Math.random() * 40)
      };
    }
    
    // Update charts with test data
    this.updateChartsFromRealTimeData(testData);
    console.log('✅ Charts updated with random data');
  }

  private loadStatisticsData(): void {
    console.log('Loading statistics data with filters:', {
      timeRange: this.selectedTimeRange,
      camera: this.selectedCamera,
      area: this.selectedArea,
      search: this.searchText
    });
    
    // Reload human statistics with current filters
    this.loadHumanStatistics();
    
    // Reconnect SSE with new filters
    this.reconnectSSEWithFilters();
  }

  /**
   * Connect to SSE endpoint for real-time updates
   */
  private connectSSE(): void {
    // Disconnect existing connection first
    this.disconnectSSE();
    
    // Subscribe to SSE channel
    console.log(`🔌 Connecting to SSE channel: ${this.SSE_CHANNEL}`);
    
    this.sseSubscription = this.sseService.connect(this.SSE_CHANNEL).subscribe({
      next: (data) => {
        this.handleSSEData(data);
      },
      error: (error) => {
        console.error('❌ SSE Connection Error:', error);
        // SSEService handles auto-reconnection
      },
      complete: () => {
        console.log('🔌 SSE Connection Closed');
      }
    });
  }

  /**
   * Disconnect SSE connection
   */
  private disconnectSSE(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
      this.sseService.disconnect(this.SSE_CHANNEL);
    }
  }

  /**
   * Handle data received from SSE
   */
  private handleSSEData(message: any): void {
    console.log('📨 SSE Message received:', message);
    
    // Extract event type and data
    const eventType = message.event || 'message';
    const data = message.data || message;
    
    console.log(`📌 Event type: ${eventType}`, data);
    
    // Handle dataChanges event
    if (data.dataChanges) {
      console.log('✅ Processing dataChanges:', data.dataChanges);
      this.processDataChanges(data.dataChanges);
    } 
    // Handle full data format (old format)
    else if (data.age_range || data.gender || data.complexion) {
      console.log('📊 Processing full data:', data);
      this.updateChartsFromRealTimeData(data);
    }
    else {
      console.warn('⚠️ Unknown SSE data format:', data);
    }
  }

  /**
   * Process incremental data changes from SSE
   * Format: {"gender":{"Male":1},"complexion":{"Asian":1},"age":{"10-19":1}}
   */
  private processDataChanges(changes: any): void {
    console.log('🔄 Processing incremental changes:', changes);
    
    let needsUpdate = false;
    
    // Update gender data
    if (changes.gender) {
      needsUpdate = true;
      const currentHour = new Date().getHours().toString();
      
      if (!this.genderData[currentHour]) {
        this.genderData[currentHour] = { Male: 0, Female: 0, Unknown: 0 };
      }
      
      Object.keys(changes.gender).forEach(genderType => {
        const count = changes.gender[genderType];
        const key = genderType as 'Male' | 'Female' | 'Unknown';
        this.genderData[currentHour][key] = 
          (this.genderData[currentHour][key] || 0) + count;
      });
      
      console.log(`✅ Updated gender for hour ${currentHour}:`, this.genderData[currentHour]);
    }
    
    // Update complexion data
    if (changes.complexion) {
      needsUpdate = true;
      const currentHour = new Date().getHours().toString();
      
      if (!this.complexionData[currentHour]) {
        this.complexionData[currentHour] = { 
          Asian: 0, White: 0, Black: 0, Indian: 0, 
          MiddleEastern: 0, Latino: 0, Unknown: 0 
        };
      }
      
      Object.keys(changes.complexion).forEach(complexionType => {
        const count = changes.complexion[complexionType];
        const key = complexionType as 'Asian' | 'White' | 'Black' | 'Indian' | 'MiddleEastern' | 'Latino' | 'Unknown';
        this.complexionData[currentHour][key] = 
          (this.complexionData[currentHour][key] || 0) + count;
      });
      
      console.log(`✅ Updated complexion for hour ${currentHour}:`, this.complexionData[currentHour]);
    }
    
    // Update age range data
    if (changes.age) {
      needsUpdate = true;
      
      Object.keys(changes.age).forEach(ageRange => {
        const count = changes.age[ageRange];
        this.ageRangeData[ageRange] = (this.ageRangeData[ageRange] || 0) + count;
      });
      
      console.log('✅ Updated age range:', this.ageRangeData);
    }
    
    // Update charts if any data changed
    if (needsUpdate) {
      console.log('🎨 Updating charts with new incremental data...');
      
      // Update donut chart (age range)
      this.updateDonutChartFromAgeRange(this.ageRangeData);
      
      // Update line chart (gender)
      this.updateLineChartFromGenderData(this.genderData);
      
      // Update bar chart (complexion)
      this.updateBarChartFromComplexionData(this.complexionData);
      
      // Update summary cards
      this.updateSummaryCardsFromNewData({
        age_range: this.ageRangeData,
        gender: this.genderData,
        complexion: this.complexionData
      }, false);
      
      // Trigger change detection
      this.cdr.markForCheck();
      
      console.log('✅ Charts updated successfully');
    }
  }

  /**
   * Reconnect SSE when filters change
   */
  private reconnectSSEWithFilters(): void {
    // Note: SSE currently uses a single channel for all statistics
    // Filter-specific data will be handled by loadHumanStatistics()
    // Uncomment below if backend supports filter-specific SSE channels:
    // this.connectSSE();
  }

  ngOnDestroy(): void {
    // Cleanup SSE subscription
    this.disconnectSSE();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-btn') && !target.closest('.dropdown-menu') && !target.closest('app-date-range-picker')) {
      this.showTimeDropdown = false;
      this.showCameraDropdown = false;
      this.showAreaDropdown = false;
    }
  }

  getTimeRangeLabel(): string {
    if (this.selectedTimeRange === 'custom') {
      return 'Tùy chỉnh';
    }
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option ? option.label : 'Chọn thời gian';
  }
}
