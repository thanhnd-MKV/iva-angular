import { Component, OnInit, ViewChild, ViewChildren, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DateRangePickerComponent } from '../../shared/date-picker-ranger/date-range-picker.component';
import { TrafficFlowMapComponent } from './traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CameraService } from '../camera/camera.service';
import { LocationService } from '../../shared/services/location.service';
import { SSEService } from '../../core/services/sse.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-luu-luong-ra-vao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    DateRangePickerComponent,
    TrafficFlowMapComponent
  ],
  templateUrl: './luu-luong-ra-vao.component.html',
  styleUrls: ['./luu-luong-ra-vao.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LuuLuongRaVaoComponent implements OnInit, OnDestroy {
  @ViewChild('lineChart') lineChart?: BaseChartDirective;
  @ViewChild('barChart') barChart?: BaseChartDirective;
  @ViewChildren('digitSpan', { read: ElementRef }) digitSpans?: QueryList<ElementRef>;
  
  private sidebarSubscription?: Subscription;
  isSidebarOpened = true;
  
  // SSE for real-time updates
  private sseSubscription: Subscription | null = null;
  private readonly SSE_CHANNEL = 'pedestrianTraffic';
  
  // Animation properties
  summaryDisplayValues: number[] = [0, 0, 0];
  cardDigits: { digit: string; animate: boolean; key: number }[][] = [[], [], []];
  animationTrigger = 0;
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  showAreaDropdown = false;
  selectedTimeRange = 'today'; // Default to today
  selectedCamera = '';
  selectedArea = '';
  
  // Chart filter state
  lineChartFilter: 'all' | 'in' | 'out' = 'all';
  barChartFilter: 'all' | 'in' | 'out' = 'all';
  
  // Store raw data for filtering
  private rawLineChartData: any[] = [];
  private rawBarChartData: any[] = [];
  private isSingleDayView: boolean = false;
  
  // Date range for custom filter
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  
  // Filter options
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
  
  areaOptions: { label: string; value: string }[] = [
    { label: 'Tất cả khu vực', value: '' }
  ];
  
  // Loading states - chỉ hiển thị khi user thực hiện action
  isLineChartLoading = false;
  isBarChartLoading = false;
  private isUserAction = false; // Flag để phân biệt user action vs auto-refresh
  private isLoadingData = false; // Flag để ngăn chặn gọi API đồng thời
  
  // Chart animation - tắt animation khi auto-refresh để mượt hơn
  private shouldAnimate = true;

  // Fake data for testing real-time updates
  public useFakeData = true;
  private fakeDataInterval: any;
  private baseData: { in: number[], out: number[] } | null = null;

  // Map data
  mapCenter = { lat: 15.6, lng: 107.0 }; // Centered between Hanoi and Phu Quoc
  mapZoom = 5.2; // Optimal zoom to see both markers
  cameraLocations: any[] = [];
  
  // Summary cards data
  summaryCards = [
    { title: 'Tổng số lượt đến và đi', value: 0, change: 0, isPositive: true, color: 'blue' },
    { title: 'Tổng số lượt đến', value: 0, change: 0, isPositive: true, color: 'green' },
    { title: 'Tổng số lượt rời đi', value: 0, change: 0, isPositive: false, color: 'purple' }
  ];
  
  // Line Chart Data (Lượt đến/ rời đi theo giờ trong ngày)
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { size: 10 }
        }
      }
    }
  };
  
  // Bar Chart Data (Lưu lượng ra vào theo từng khu vực)
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Lượt đến',
        backgroundColor: '#10b981',
        borderRadius: 4,
        barThickness: 24
      },
      {
        data: [],
        label: 'Lượt rời đi',
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        barThickness: 24
      }
    ]
  };
  
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          afterTitle: (context) => {
            const dataIndex = context[0].dataIndex;
            const countInData = this.barChartData.datasets[0].data[dataIndex] as number;
            const countOutData = this.barChartData.datasets[1].data[dataIndex] as number;
            const total = countInData + countOutData;
            return `Tổng: ${total.toLocaleString()}`;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { size: 10 }
        }
      }
    }
  };
  
  ngOnInit(): void {
    // Initialize animation
    this.initializeCardDigits();
    
    // Load camera options from API
    this.loadCameraOptions();
    
    // Load area options from API
    this.loadAreaOptions();
    
    // Initialize data (no loading spinner on first load)
    this.isUserAction = false; // Không hiển thị loading spinner
    this.shouldAnimate = false; // Không animate lần đầu
    this.loadChartData();
    
    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarService.sidebarOpened$.subscribe((isOpened) => {
      console.log('Sidebar state changed:', isOpened);
      this.isSidebarOpened = isOpened;
      // Trigger chart resize after a small delay to let layout settle
      setTimeout(() => {
        this.resizeCharts();
      }, 300);
    });

    // Connect SSE for real-time updates (replace fake data)
    setTimeout(() => this.connectSSE(), 100);
  }
  
  ngOnDestroy(): void {
    // Disconnect SSE
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
    this.sseService.disconnect(this.SSE_CHANNEL);
    console.log('🔌 SSE Disconnected:', this.SSE_CHANNEL);
    
    // Cleanup subscriptions
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    // Cleanup fake data interval
    if (this.fakeDataInterval) {
      clearInterval(this.fakeDataInterval);
      console.log('🛑 Lưu lượng ra vào: Stopped fake data stream');
    }
  }
  
  private resizeCharts(): void {
    // Trigger chart.js resize for both charts
    if (this.lineChart) {
      this.lineChart.chart?.resize();
    }
    if (this.barChart) {
      this.barChart.chart?.resize();
    }
  }
  
  // ============ Animation Methods ============
  trackByCardIndex(index: number, card: any): number {
    return index;
  }

  getCardDigits(cardIndex: number): { digit: string; animate: boolean; key: number }[] {
    return this.cardDigits[cardIndex] || [];
  }

  trackByDigit(index: number, item: any): any {
    return item.key || index;
  }

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

  private updateSummaryCardValue(cardIndex: number, newValue: number): void {
    const oldValue = this.summaryCards[cardIndex].value;
    
    if (oldValue !== newValue && typeof oldValue === 'number') {
      this.summaryCards[cardIndex].value = newValue;
      this.animateNumberDigits(cardIndex, oldValue, newValue);
      this.cdr.detectChanges();
    }
  }

  private animateNumberDigits(cardIndex: number, oldValue: number, newValue: number): void {
    const oldDigits = oldValue.toString().split('');
    const newDigits = newValue.toString().split('');
    
    const digitArray: { digit: string; animate: boolean }[] = [];
    const maxLength = Math.max(oldDigits.length, newDigits.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldDigit = oldDigits[i] || '';
      const newDigit = newDigits[i] || '';
      const shouldAnimate = oldDigit !== newDigit;
      
      digitArray.push({
        digit: newDigit,
        animate: shouldAnimate
      });
    }
    
    this.summaryDisplayValues[cardIndex] = newValue;
    this.animationTrigger++;
    
    const digitArrayWithKeys = digitArray.map((d, idx) => ({
      ...d,
      key: d.animate ? this.animationTrigger * 1000 + idx : idx
    }));
    
    this.cardDigits[cardIndex] = digitArrayWithKeys;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cardDigits[cardIndex] = digitArrayWithKeys.map(d => ({ 
        ...d, 
        animate: false,
        key: d.key
      }));
      this.cdr.detectChanges();
    }, 450);
  }
  
  // ============ SSE Methods ============
  private connectSSE(): void {
    console.log('🔌 Connecting to SSE:', this.SSE_CHANNEL);
    
    this.sseSubscription = this.sseService.connect(this.SSE_CHANNEL).subscribe({
      next: (message) => {
        console.log('📨 SSE Message received:', message);
        
        if (message.event === 'dataChanges' && message.data) {
          this.handleSSEDataUpdate(message.data);
        }
      },
      error: (error) => {
        console.error('❌ SSE Error:', error);
        // Auto-retry connection
        setTimeout(() => this.connectSSE(), 5000);
      }
    });
  }

  private handleSSEDataUpdate(data: any): void {
    console.log('🔄 Processing SSE update:', data);
    
    // Parse SSE data structure: {"dataChanges":{"outTotal":1,"inTotal":5, "hour": 14, "location": "Khu A"}}
    // SSE data là incremental - phải cộng thêm vào giá trị hiện tại
    if (data.dataChanges) {
      const inDelta = data.dataChanges.inTotal || 0;
      const outDelta = data.dataChanges.outTotal || 0;
      
      // ========== Cập nhật Summary Cards ==========
      const currentTotal = this.summaryCards[0].value as number;
      const currentIn = this.summaryCards[1].value as number;
      const currentOut = this.summaryCards[2].value as number;
      
      const newTotal = currentTotal + inDelta + outDelta;
      const newIn = currentIn + inDelta;
      const newOut = currentOut + outDelta;
      
      console.log('📊 SSE incremental update:', { 
        delta: { in: inDelta, out: outDelta },
        old: { total: currentTotal, in: currentIn, out: currentOut },
        new: { total: newTotal, in: newIn, out: newOut }
      });
      
      this.updateSummaryCardValue(0, newTotal);  // Tổng lưu lượng
      this.updateSummaryCardValue(1, newIn);     // Lượt đến
      this.updateSummaryCardValue(2, newOut);    // Lượt đi
      
      // ========== Cập nhật Line Chart (theo giờ) ==========
      const hour = data.dataChanges.hour;
      if (hour !== undefined && this.lineChart?.chart) {
        const chart = this.lineChart.chart;
        const hourLabel = this.isSingleDayView ? hour.toString() : this.formatDate(new Date());
        
        // Tìm index của giờ trong labels
        const hourIndex = chart.data.labels?.indexOf(hourLabel);
        
        if (hourIndex !== undefined && hourIndex !== -1) {
          // Cập nhật data cho giờ này
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (dataset.label === 'Lượt đến' && inDelta > 0) {
              const currentValue = (dataset.data[hourIndex] as number) || 0;
              dataset.data[hourIndex] = currentValue + inDelta;
            } else if (dataset.label === 'Lượt đi' && outDelta > 0) {
              const currentValue = (dataset.data[hourIndex] as number) || 0;
              dataset.data[hourIndex] = currentValue + outDelta;
            }
          });
          
          console.log('📈 Line chart updated for hour:', hourLabel);
          chart.update('none'); // Update without animation
        }
      }
      
      // ========== Cập nhật Bar Chart (theo location) ==========
      const location = data.dataChanges.location;
      if (location && this.barChart?.chart) {
        const chart = this.barChart.chart;
        
        // Tìm index của location trong labels
        const locationIndex = chart.data.labels?.indexOf(location);
        
        if (locationIndex !== undefined && locationIndex !== -1) {
          // Cập nhật data cho location này
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (dataset.label === 'Lượt đến' && inDelta > 0) {
              const currentValue = (dataset.data[locationIndex] as number) || 0;
              dataset.data[locationIndex] = currentValue + inDelta;
            } else if (dataset.label === 'Lượt đi' && outDelta > 0) {
              const currentValue = (dataset.data[locationIndex] as number) || 0;
              dataset.data[locationIndex] = currentValue + outDelta;
            }
          });
          
          console.log('📊 Bar chart updated for location:', location);
          chart.update('none'); // Update without animation
        } else if (location) {
          // Location chưa có trong chart - thêm mới
          console.log('➕ Adding new location to bar chart:', location);
          chart.data.labels = [...(chart.data.labels || []), location];
          
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (dataset.label === 'Lượt đến') {
              dataset.data = [...dataset.data, inDelta];
            } else if (dataset.label === 'Lượt đi') {
              dataset.data = [...dataset.data, outDelta];
            }
          });
          
          chart.update('none');
        }
      }
    }
    
    this.cdr.detectChanges();
  }
  
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }
  
  constructor(
    private http: HttpClient,
    private sidebarService: SidebarService,
    private cameraService: CameraService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,
    private sseService: SSEService
  ) {}
  
  // Filter methods
  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.showCameraDropdown = false;
    this.showAreaDropdown = false;
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
  
  selectTimeRange(value: string): void {
    this.selectedTimeRange = value;
    this.showTimeDropdown = false;
    
    if (value !== 'custom') {
      this.customDateRange = { start: null, end: null };
      this.isUserAction = true; // User action - hiển thị loading
      this.shouldAnimate = true; // Animate khi user action
      this.applyFilters();
    }
  }
  
  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }
  
  selectArea(value: string): void {
    this.selectedArea = value;
    this.showAreaDropdown = false;
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }
  
  onDateRangeSelected(range: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: range.startDate, end: range.endDate };
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }
  
  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.selectedTimeRange = 'today';
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = 'today';
    this.selectedCamera = '';
    this.selectedArea = '';
    this.customDateRange = { start: null, end: null };
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }

  private loadCameraOptions(): void {
    console.log('Loading camera options from API...');
    this.cameraService.getCameraOptions().subscribe({
      next: (cameras) => {
        console.log('✅ Camera options loaded:', cameras);
        this.cameraOptions = [
          { label: 'Tất cả Camera', value: '' },
          ...cameras
        ];
      },
      error: (error) => {
        console.error('❌ Error loading camera options:', error);
        // Keep default options if API fails
      }
    });
  }
  
  private loadAreaOptions(): void {
    console.log('Loading location options from service...');
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.areaOptions = locations;
        console.log('✅ Location options loaded:', this.areaOptions.length);
      },
      error: (error) => {
        console.error('Error loading location options:', error);
      }
    });
  }
  
  onSearch(): void {
    this.isUserAction = true; // User action - hiển thị loading
    this.shouldAnimate = true; // Animate khi user action
    this.applyFilters();
  }
  
  applyFilters(): void {
    console.log('Applying filters:', {
      searchText: this.searchText,
      timeRange: this.selectedTimeRange,
      camera: this.selectedCamera,
      customDateRange: this.customDateRange
    });
    
    this.loadChartData();
  }
  
  loadChartData(): void {
    console.log('=== loadChartData called ===', { isUserAction: this.isUserAction, isLoadingData: this.isLoadingData });
    console.trace('📍 Call stack:'); // Log stack trace để xem ai đang gọi
    
    // Ngăn chặn gọi API nếu đang có request đang chạy
    if (this.isLoadingData) {
      console.warn('⚠️ loadChartData blocked: Already loading data');
      console.trace('📍 Blocked call stack:');
      return;
    }
    
    this.isLoadingData = true;
    
    // Chỉ hiển thị loading spinner khi là user action
    if (this.isUserAction) {
      this.isLineChartLoading = true;
      this.isBarChartLoading = true;
    }
    
    // Calculate date range based on selected time range
    const { fromUtc, toUtc } = this.getDateRange();
    
    console.log('Date range:', { fromUtc, toUtc });
    
    // Prepare params for both APIs
    const params: any = {
      eventType: 'Line_Cross',
      fromUtc: fromUtc,
      toUtc: toUtc
    };
    
    if (this.selectedCamera) {
      params.cameraSn = this.selectedCamera;
      console.log('Adding camera filter:', this.selectedCamera);
    }
    
    if (this.selectedArea) {
      params.location = this.selectedArea;
      console.log('Adding location filter:', this.selectedArea);
    }
    
    // Call API for stats (summary cards and map data)
    const statsApiUrl = '/api/admin/events/line-cross/stats';
    console.log('Calling Stats API:', statsApiUrl, 'with params:', params);
    
    let statsCompleted = false;
    let lineChartCompleted = false;
    let barChartCompleted = false;
    
    const checkAllCompleted = () => {
      if (statsCompleted && lineChartCompleted && barChartCompleted) {
        this.isLoadingData = false;
        console.log('✅ All API calls completed, isLoadingData reset to false');
      }
    };
    
    this.http.get<any>(statsApiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('✅ Stats API response:', response);
          this.updateStatsData(response);
          statsCompleted = true;
          checkAllCompleted();
        },
        error: (error) => {
          console.error('❌ Error fetching stats data:', error);
          statsCompleted = true;
          checkAllCompleted();
        }
      });
    
    // Determine which API to use based on date range
    const fromDate = new Date(fromUtc);
    const toDate = new Date(toUtc);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const isSingleDay = daysDiff <= 1;
    
    // Call API for line chart data
    const lineChartApiUrl = isSingleDay 
      ? '/api/admin/events/line-cross/by-hour-of-day'
      : '/api/admin/events/line-cross/by-day';
    
    console.log(`Calling Line Chart API (${isSingleDay ? 'single day' : 'multiple days'}):`, lineChartApiUrl, 'with params:', params);
    
    this.http.get<any>(lineChartApiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('✅ Line chart API response:', response);
          this.isSingleDayView = isSingleDay;
          this.updateLineChartData(response, isSingleDay);
          
          // Chỉ tắt loading khi là user action
          if (this.isUserAction) {
            this.isLineChartLoading = false;
          }
          lineChartCompleted = true;
          checkAllCompleted();
        },
        error: (error) => {
          console.error('❌ Error fetching line chart data:', error);
          if (this.isUserAction) {
            this.isLineChartLoading = false;
          }
          lineChartCompleted = true;
          checkAllCompleted();
        }
      });
    
    // Call API for bar chart data (by-location)
    const barChartApiUrl = '/api/admin/events/line-cross/by-location';
    console.log('Calling Bar Chart API:', barChartApiUrl, 'with params:', params);
    
    this.http.get<any>(barChartApiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('✅ Bar chart API response:', response);
          this.updateBarChartData(response);
          
          // Chỉ tắt loading khi là user action
          if (this.isUserAction) {
            this.isBarChartLoading = false;
          }
          barChartCompleted = true;
          checkAllCompleted();
        },
        error: (error) => {
          console.error('❌ Error fetching bar chart data:', error);
          if (this.isUserAction) {
            this.isBarChartLoading = false;
          }
          barChartCompleted = true;
          checkAllCompleted();
        }
      });
  }
  
  private getDateRange(): { fromUtc: string; toUtc: string } {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;
    
    switch (this.selectedTimeRange) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'yesterday':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case '7days':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case '30days':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'custom':
        if (this.customDateRange.start && this.customDateRange.end) {
          fromDate = new Date(this.customDateRange.start);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(this.customDateRange.end);
          toDate.setHours(23, 59, 59, 999);
        } else {
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        break;
      default:
        // Default: today
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    
    // Format date to UTC string with +00:00 timezone
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
    
    return {
      fromUtc: formatToUTC(fromDate),
      toUtc: formatToUTC(toDate)
    };
  }
  
  private updateLineChartData(data: any, isSingleDay: boolean = false): void {
    console.log('Updating line chart with data:', data, 'isSingleDay:', isSingleDay);
    
    // Handle new API format: { data: { total: [], totalIn: [], totalOut: [] } }
    const responseData = data.data || data;
    
    if (!responseData) {
      console.warn('No data received for line chart');
      return;
    }
    
    // Check if it's the new array format
    if (responseData.total && Array.isArray(responseData.total)) {
      console.log('Processing new array format data');
      
      // Convert arrays to hour-based objects for compatibility with existing code
      const convertedData = [];
      for (let hour = 0; hour < 24; hour++) {
        convertedData.push({
          hour: hour,
          countIn: responseData.totalIn[hour] || 0,
          countOut: responseData.totalOut[hour] || 0,
          total: responseData.total[hour] || 0
        });
      }
      
      this.rawLineChartData = convertedData;
      console.log('Converted data:', convertedData);
    } else {
      // Handle legacy array format
      let dataArray = Array.isArray(responseData) ? responseData : (responseData.result || []);
      
      if (!dataArray || dataArray.length === 0) {
        console.warn('No legacy data received for line chart');
        return;
      }
      
      this.rawLineChartData = dataArray;
    }
    
    // Apply current filter
    this.applyLineChartFilter(isSingleDay);
  }
  
  private updateStatsData(data: any): void {
    console.log('🗺️ [LuuLuongRaVao] ===== UPDATE STATS DATA START =====');
    console.log('🗺️ [LuuLuongRaVao] Raw API response:', data);
    
    // Handle both array and object wrapper formats
    const statsData = data.data || data;
    
    console.log('🗺️ [LuuLuongRaVao] Extracted statsData:', statsData);
    console.log('🗺️ [LuuLuongRaVao] statsData type:', typeof statsData);
    console.log('🗺️ [LuuLuongRaVao] statsData.cameraInfo:', statsData?.cameraInfo);
    
    if (!statsData) {
      console.warn('🗺️ [LuuLuongRaVao] No stats data received');
      return;
    }
    
    // Update summary cards if stats data available
    if (statsData.total !== undefined) {
      const total = statsData.total || 0;
      const totalIn = statsData.totalIn || 0;
      const totalOut = statsData.totalOut || 0;
      
      this.summaryCards = [
        { 
          title: 'Tổng số lượt đến và đi', 
          value: total, 
          change: 0, 
          isPositive: true,
          color: 'blue'
        },
        { 
          title: 'Tổng số lượt đến', 
          value: totalIn, 
          change: 0, 
          isPositive: true,
          color: 'green'
        },
        { 
          title: 'Tổng số lượt rời đi', 
          value: totalOut, 
          change: 0, 
          isPositive: true,
          color: 'purple'
        }
      ];
    }
    
    // Get cameraInfo array from locations
    const locations = statsData.locations || [];
    
    console.log('🗺️ [LuuLuongRaVao] locations array:', locations);
    console.log('🗺️ [LuuLuongRaVao] locations length:', locations.length);
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      console.log('🗺️ [LuuLuongRaVao] Processing locations data - FOUND:', locations.length, 'locations');
      
      // Flatten all cameraInfo from all locations
      const allCameras: any[] = [];
      locations.forEach((location: any) => {
        if (location.cameraInfo && Array.isArray(location.cameraInfo)) {
          location.cameraInfo.forEach((camera: any) => {
            allCameras.push({
              ...camera,
              locationName: location.location // Add location name from parent
            });
          });
        }
      });
      
      console.log('🗺️ [LuuLuongRaVao] Total cameras from all locations:', allCameras.length);
      console.log('🗺️ [LuuLuongRaVao] First camera sample:', allCameras[0]);
      
      // Group cameras by location name
      const locationGroups: { [key: string]: any[] } = {};
      
      allCameras.forEach((camera: any) => {
        const lat = typeof camera.latitude === 'number' ? camera.latitude : parseFloat(camera.latitude);
        const lng = typeof camera.longitude === 'number' ? camera.longitude : parseFloat(camera.longitude);
        
        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.warn('🗺️ Skipping camera with invalid coordinates:', camera);
          return;
        }
        
        // Use location name from API response
        const locationName = camera.locationName || `Camera ${camera.cameraSn}`;
        
        if (!locationGroups[locationName]) {
          locationGroups[locationName] = [];
        }
        
        locationGroups[locationName].push({
          cameraSn: camera.cameraSn,
          lat: lat,
          lng: lng,
          total: camera.total || 0,
          totalIn: camera.totalIn || 0,
          totalOut: camera.totalOut || 0
        });
      });
      
      console.log('🗺️ [LuuLuongRaVao] Grouped cameras by location:', locationGroups);
      
      // Convert groups to map locations format
      this.cameraLocations = Object.entries(locationGroups).map(([locationName, cameras]) => {
        // Calculate average position for the group marker
        const avgLat = cameras.reduce((sum, cam) => sum + cam.lat, 0) / cameras.length;
        const avgLng = cameras.reduce((sum, cam) => sum + cam.lng, 0) / cameras.length;
        
        // Sum totals for the group
        const totalCount = cameras.reduce((sum, cam) => sum + cam.total, 0);
        const totalIn = cameras.reduce((sum, cam) => sum + cam.totalIn, 0);
        const totalOut = cameras.reduce((sum, cam) => sum + cam.totalOut, 0);
        
        console.log(`🗺️ [LuuLuongRaVao] Location "${locationName}":`, {
          cameras: cameras.map(c => c.cameraSn),
          avgPosition: { lat: avgLat, lng: avgLng },
          totals: { total: totalCount, in: totalIn, out: totalOut },
          individualCameras: cameras.length
        });
        
        return {
          lat: avgLat,
          lng: avgLng,
          name: locationName,
          count: totalCount,
          cameraCode: locationName,
          totalIn: totalIn,
          totalOut: totalOut,
          cameras: cameras.map(c => c.cameraSn),
          individualCameras: cameras // Store individual camera data for high zoom
        };
      });
      
      console.log('🗺️ [LuuLuongRaVao] Final camera locations for map:', this.cameraLocations);
      console.log('🗺️ [LuuLuongRaVao] Camera count:', this.cameraLocations.length);
      
    } else {
      console.warn('🗺️ [LuuLuongRaVao] No camera data found in API response');
      this.cameraLocations = [];
    }
    
    console.log('✅ Updated summary cards:', this.summaryCards);
    console.log('✅ Updated camera locations:', this.cameraLocations.length, 'locations');
  }
  
  private applyLineChartFilter(isSingleDay: boolean = false): void {
    const dataArray = this.rawLineChartData;
    
    if (!dataArray || dataArray.length === 0) {
      return;
    }
    
    let labels: string[];
    let countsIn: number[];
    let countsOut: number[];
    
    if (isSingleDay) {
      // For single day: data is array of 24 numbers [hour0, hour1, ..., hour23]
      // If dataArray is already the 24-hour array
      if (Array.isArray(dataArray) && dataArray.length === 24 && typeof dataArray[0] === 'number') {
        labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
        countsIn = dataArray as number[];
        countsOut = new Array(24).fill(0); // No separate out data in this format
      } else {
        // Fallback: group by hour (0-23) from object array
        const hourlyData: { [hour: number]: { countIn: number; countOut: number } } = {};
        
        // Initialize all hours with 0
        for (let i = 0; i < 24; i++) {
          hourlyData[i] = { countIn: 0, countOut: 0 };
        }
        
        // Aggregate data by hour
        dataArray.forEach((item: any) => {
          if (item.hour !== undefined) {
            // If API returns hour directly
            const hour = item.hour;
            hourlyData[hour].countIn += item.countIn || 0;
            hourlyData[hour].countOut += item.countOut || 0;
          } else if (item.time) {
            // If API returns timestamp
            const date = new Date(item.time);
            const hour = date.getHours();
            hourlyData[hour].countIn += item.countIn || 0;
            hourlyData[hour].countOut += item.countOut || 0;
          }
        });
        
        // Create labels for hours (0-23)
        labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
        countsIn = Array.from({ length: 24 }, (_, i) => hourlyData[i].countIn);
        countsOut = Array.from({ length: 24 }, (_, i) => hourlyData[i].countOut);
      }
    } else {
      // For multiple days: group by date
      dataArray.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      labels = dataArray.map((item: any) => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
      
      countsIn = dataArray.map((item: any) => item.countIn || 0);
      countsOut = dataArray.map((item: any) => item.countOut || 0);
    }
    
    console.log('Parsed line chart data:', { labels, countsIn, countsOut });
    
    // Build datasets based on filter
    const datasets: any[] = [];
    
    if (this.lineChartFilter === 'all' || this.lineChartFilter === 'in') {
      datasets.push({
        data: countsIn,
        label: 'Lượt đến',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      });
    }
    
    if (this.lineChartFilter === 'all' || this.lineChartFilter === 'out') {
      // Only show "Lượt rời đi" if there's actual data
      const hasOutData = countsOut.some(count => count > 0);
      if (hasOutData) {
        datasets.push({
          data: countsOut,
          label: 'Lượt rời đi',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        });
      }
    }
    
    // Update chart data mà không re-render toàn bộ
    if (this.lineChartData.labels && this.lineChartData.datasets && this.lineChart?.chart) {
      // Chỉ cập nhật dữ liệu, không tạo object mới
      this.lineChartData.labels = labels;
      this.lineChartData.datasets = datasets;
      
      // Sử dụng chart.update() để cập nhật mượt mà
      this.lineChart.chart.update(this.shouldAnimate ? 'default' : 'none');
    } else {
      // Lần đầu tiên khởi tạo chart
      this.lineChartData = {
        labels: labels,
        datasets: datasets
      };
      this.cdr.detectChanges();
    }
  }
  
  setLineChartFilter(filter: 'all' | 'in' | 'out'): void {
    this.lineChartFilter = filter;
    this.shouldAnimate = true; // User action - có animation
    this.applyLineChartFilter(this.isSingleDayView);
  }
  
  private updateBarChartData(data: any): void {
    console.log('Updating bar chart with data:', data);
    
    // Handle both array and object wrapper formats
    let dataArray = Array.isArray(data) ? data : (data.data || data.result || []);
    
    if (!dataArray || dataArray.length === 0) {
      console.warn('No data received for bar chart');
      return;
    }
    
    // Store raw data for filtering
    this.rawBarChartData = dataArray;
    
    // Apply current filter
    this.applyBarChartFilter();
  }
  
  private applyBarChartFilter(): void {
    const dataArray = this.rawBarChartData;
    
    if (!dataArray || dataArray.length === 0) {
      return;
    }
    
    // Extract location names, countIn and countOut
    const locations = dataArray.map((item: any) => item.location || item.cameraName || 'Unknown');
    const countsIn = dataArray.map((item: any) => item.countIn || 0);
    const countsOut = dataArray.map((item: any) => item.countOut || 0);
    
    console.log('Parsed bar chart data:', { locations, countsIn, countsOut });
    
    // Build datasets based on filter
    const datasets: any[] = [];
    
    if (this.barChartFilter === 'all' || this.barChartFilter === 'in') {
      datasets.push({
        data: countsIn,
        label: 'Lượt đến',
        backgroundColor: '#10b981',
        borderRadius: 4,
        barThickness: 24
      });
    }
    
    if (this.barChartFilter === 'all' || this.barChartFilter === 'out') {
      datasets.push({
        data: countsOut,
        label: 'Lượt rời đi',
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        barThickness: 24
      });
    }
    
    // Update chart data mà không re-render toàn bộ
    if (this.barChartData.labels && this.barChartData.datasets && this.barChart?.chart) {
      // Chỉ cập nhật dữ liệu, không tạo object mới
      this.barChartData.labels = locations;
      this.barChartData.datasets = datasets;
      
      // Sử dụng chart.update() để cập nhật mượt mà
      this.barChart.chart.update(this.shouldAnimate ? 'default' : 'none');
    } else {
      // Lần đầu tiên khởi tạo chart
      this.barChartData = {
        labels: locations,
        datasets: datasets
      };
      this.cdr.detectChanges();
    }
  }
  
  setBarChartFilter(filter: 'all' | 'in' | 'out'): void {
    this.barChartFilter = filter;
    this.shouldAnimate = true; // User action - có animation
    this.applyBarChartFilter();
  }
  
  exportReport(): void {
    console.log('Exporting report...');
    // TODO: Implement export functionality
  }
  
  // Computed properties
  get hasActiveFilters(): boolean {
    return this.searchText !== '' || this.selectedCamera !== '' || this.selectedArea !== '' || this.selectedTimeRange !== 'today';
  }
  
  getTimeRangeLabel(): string {
    if (!this.selectedTimeRange || this.selectedTimeRange === 'today') {
      return 'Hôm nay';
    }
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option ? option.label : 'Chọn thời gian';
  }
  
  getCameraLabel(): string {
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option ? option.label : 'Tất cả Camera';
  }
  
  getAreaLabel(): string {
    const option = this.areaOptions.find(opt => opt.value === this.selectedArea);
    return option ? option.label : 'Tất cả khu vực';
  }

  // ===== FAKE DATA METHODS =====
  
  private generateFakeData(): { in: number[], out: number[] } {
    if (!this.baseData) {
      // Initial data generation
      this.baseData = {
        in: Array.from({ length: 24 }, (_, hour) => {
          const multiplier = this.getTimeMultiplier(hour);
          return Math.floor((200 + Math.random() * 300) * multiplier);
        }),
        out: Array.from({ length: 24 }, (_, hour) => {
          const multiplier = this.getTimeMultiplier(hour);
          return Math.floor((180 + Math.random() * 280) * multiplier);
        })
      };
    }

    // Generate variations (±10%)
    const updatedData = {
      in: this.baseData.in.map(val => Math.max(0, val + Math.floor(val * 0.1 * (Math.random() - 0.5) * 2))),
      out: this.baseData.out.map(val => Math.max(0, val + Math.floor(val * 0.1 * (Math.random() - 0.5) * 2)))
    };

    this.baseData = updatedData;
    return updatedData;
  }

  private getTimeMultiplier(hour: number): number {
    if (hour >= 0 && hour < 6) return 0.3;
    if (hour >= 6 && hour < 9) return 1.3;
    if (hour >= 9 && hour < 17) return 1.0;
    if (hour >= 17 && hour < 20) return 1.4;
    return 0.7;
  }

  private startFakeDataStream(): void {
    const fakeData = this.generateFakeData();
    this.updateChartsWithFakeData(fakeData);
    console.log('📊 Lưu lượng ra vào: Initial fake data loaded');

    this.fakeDataInterval = setInterval(() => {
      const newData = this.generateFakeData();
      this.updateChartsWithFakeData(newData);
      console.log('🔄 Lưu lượng ra vào: Charts updated at', new Date().toLocaleTimeString());
    }, 2000);
  }

  private updateChartsWithFakeData(data: { in: number[], out: number[] }): void {
    const labels = Array.from({ length: 24 }, (_, i) => i.toString());

    // Update line chart
    if (this.lineChart?.chart) {
      this.lineChart.chart.data.labels = labels;
      this.lineChart.chart.data.datasets[0].data = data.in;
      this.lineChart.chart.data.datasets[1].data = data.out;
      this.lineChart.chart.update('none');
    } else {
      this.lineChartData = {
        labels,
        datasets: [
          { 
            data: data.in, 
            label: 'Lượt đến', 
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2
          },
          { 
            data: data.out, 
            label: 'Lượt đi', 
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2
          }
        ]
      };
    }

    // Update bar chart (grouped by time range)
    if (this.barChart?.chart) {
      const morningIn = data.in.slice(6, 12).reduce((a, b) => a + b, 0);
      const morningOut = data.out.slice(6, 12).reduce((a, b) => a + b, 0);
      const afternoonIn = data.in.slice(12, 18).reduce((a, b) => a + b, 0);
      const afternoonOut = data.out.slice(12, 18).reduce((a, b) => a + b, 0);
      const eveningIn = data.in.slice(18, 24).reduce((a, b) => a + b, 0);
      const eveningOut = data.out.slice(18, 24).reduce((a, b) => a + b, 0);

      this.barChart.chart.data.labels = ['Sáng (6-12h)', 'Chiều (12-18h)', 'Tối (18-24h)'];
      this.barChart.chart.data.datasets[0].data = [morningIn, afternoonIn, eveningIn];
      this.barChart.chart.data.datasets[1].data = [morningOut, afternoonOut, eveningOut];
      this.barChart.chart.update('none');
    }

    // Update summary cards
    const totalIn = data.in.reduce((a, b) => a + b, 0);
    const totalOut = data.out.reduce((a, b) => a + b, 0);
    this.summaryCards[0].value = totalIn + totalOut;
    this.summaryCards[1].value = totalIn;
    this.summaryCards[2].value = totalOut;

    this.cdr.markForCheck();
  }

  public stopFakeDataStream(): void {
    if (this.fakeDataInterval) {
      clearInterval(this.fakeDataInterval);
      this.fakeDataInterval = null;
      this.useFakeData = false;
      console.log('🛑 Lưu lượng ra vào: Fake data stream stopped');
    }
  }

  public startFakeDataStreamManually(): void {
    if (!this.fakeDataInterval) {
      this.useFakeData = true;
      this.startFakeDataStream();
      console.log('▶️ Lưu lượng ra vào: Fake data stream started manually');
    }
  }
}

