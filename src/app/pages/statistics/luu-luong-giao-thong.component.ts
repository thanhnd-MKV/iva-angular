import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-luu-luong-giao-thong',
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
  templateUrl: './luu-luong-giao-thong.component.html',
  styleUrls: ['./luu-luong-giao-thong.component.scss']
})
export class LuuLuongGiaoThongComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private sidebarSubscription?: Subscription;
  isSidebarOpened = true;
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  selectedTimeRange = ''; // Empty = first day of month to today
  selectedCamera = '';
  
  // Chart filter state
  lineChartFilter: 'all' | 'car' | 'motorbike' | 'truck' = 'all';
  barChartFilter: 'all' | 'car' | 'motorbike' | 'truck' = 'all';
  
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
  
  // Loading states
  isLineChartLoading = false;
  isBarChartLoading = false;
  
  // Map data
  mapCenter = { lat: 14.0583, lng: 108.2772 }; // Vietnam center for country view
  mapZoom = 5; // Start with country overview
  cameraLocations: any[] = [];
  
  // Summary cards data - Different metrics for traffic flow (3 columns as per design)
  summaryCards = [
    { title: 'Tổng số phương tiện', value: 8213, change: 12, isPositive: true, color: 'blue' },
    { title: 'Phương tiện chiếm tỉ lệ cao nhất', value: 0, change: 8, isPositive: true, subtitle: 'Xe máy', color: 'green' },
    { title: 'Giờ cao điểm giao thông', value: 0, change: -3, isPositive: false, subtitle: '16-19h', color: 'purple' }
  ];
  
  // Line Chart Data (Traffic flow by hour)
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2.5,
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
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  // Bar Chart Data (Traffic by location/camera)
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2.5,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sidebarService: SidebarService,
    private cameraService: CameraService
  ) {}

  ngOnInit(): void {
    this.loadCameraOptions();
    this.loadTrafficData();
    this.initializeCharts();
    this.initializeMockData();
    
    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarService.sidebarOpened$.subscribe(
      (isOpened: boolean) => {
        this.isSidebarOpened = isOpened;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
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

  private loadTrafficData(): void {
    // Load traffic flow data from API
    // This would be actual API calls in production
    this.generateMockTrafficData();
  }

  private initializeCharts(): void {
    this.generateMockTrafficData();
  }

  private generateMockTrafficData(): void {
    // Generate stacked bar chart data matching the design (24 hours, 0-23)
    const hours = Array.from({length: 24}, (_, i) => i.toString());
    
    // Mock data for stacked bars with colors matching the design
    const oToData = [40, 65, 45, 35, 30, 45, 80, 120, 160, 180, 170, 165, 180, 190, 200, 220, 240, 260, 200, 150, 120, 90, 70, 50];
    const xeMayData = [80, 120, 90, 70, 60, 90, 160, 240, 320, 360, 340, 330, 360, 380, 400, 440, 480, 520, 400, 300, 240, 180, 140, 100];
    const xeTaiData = [20, 35, 25, 15, 10, 25, 40, 60, 80, 90, 85, 82, 90, 95, 100, 110, 120, 130, 100, 75, 60, 45, 35, 25];
    const xeBusData = [15, 25, 18, 12, 8, 18, 30, 45, 60, 68, 64, 62, 68, 72, 75, 82, 90, 98, 75, 56, 45, 34, 26, 19];
    const xeKhacData = [10, 15, 12, 8, 5, 12, 20, 30, 40, 45, 43, 41, 45, 48, 50, 55, 60, 65, 50, 37, 30, 23, 17, 12];

    this.barChartData = {
      labels: hours,
      datasets: [
        {
          label: 'Ô tô',
          data: oToData,
          backgroundColor: '#60A5FA', // Light blue
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe máy', 
          data: xeMayData,
          backgroundColor: '#34D399', // Green
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe tải',
          data: xeTaiData,
          backgroundColor: '#FBBF24', // Yellow
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe buýt',
          data: xeBusData,
          backgroundColor: '#A78BFA', // Purple 
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Xe khác',
          data: xeKhacData,
          backgroundColor: '#FB7185', // Pink
          borderWidth: 0,
          borderRadius: 2
        }
      ]
    };

    this.cdr.detectChanges();
  }

  // Filter methods
  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    if (this.showTimeDropdown) {
      this.showCameraDropdown = false;
    }
  }

  toggleCameraDropdown(): void {
    this.showCameraDropdown = !this.showCameraDropdown;
    if (this.showCameraDropdown) {
      this.showTimeDropdown = false;
    }
  }

  selectTimeRange(value: string): void {
    this.selectedTimeRange = value;
    this.showTimeDropdown = false;
    this.loadTrafficData();
  }

  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.loadTrafficData();
  }

  onSearch(): void {
    this.loadTrafficData();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = '';
    this.selectedCamera = '';
    this.customDateRange = { start: null, end: null };
    this.loadTrafficData();
  }

  onDateRangeSelected(dateRange: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: dateRange.startDate, end: dateRange.endDate };
    this.loadTrafficData();
  }

  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.loadTrafficData();
  }

  // Chart filter methods
  setLineChartFilter(filter: 'all' | 'car' | 'motorbike' | 'truck'): void {
    this.lineChartFilter = filter;
    this.updateLineChartData();
  }

  setBarChartFilter(filter: 'all' | 'car' | 'motorbike' | 'truck'): void {
    this.barChartFilter = filter;
    this.updateBarChartData();
  }

  private updateLineChartData(): void {
    // Update line chart based on filter
    this.generateMockTrafficData();
  }

  private updateBarChartData(): void {
    // Update bar chart based on filter
    this.generateMockTrafficData();
  }

  // Helper methods
  getTimeRangeLabel(): string {
    if (!this.selectedTimeRange) return 'Chọn thời gian';
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option ? option.label : 'Tùy chỉnh';
  }

  getCameraLabel(): string {
    if (!this.selectedCamera) return 'Tất cả Camera';
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option ? option.label : 'Camera';
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchText || this.selectedTimeRange || this.selectedCamera);
  }

  exportReport(): void {
    console.log('Exporting traffic flow report...');
  }

  private initializeMockData(): void {
    // Mock camera locations with traffic data
    this.cameraLocations = [
      {
        lat: 21.0285,
        lng: 105.8542,
        name: 'Cầu Long Biên',
        count: 1245,
        cameraCode: 'CAM-001',
        totalIn: 678,
        totalOut: 567
      },
      {
        lat: 21.0245,
        lng: 105.8412,
        name: 'Ngã Tư Sở',
        count: 892,
        cameraCode: 'CAM-002',
        totalIn: 445,
        totalOut: 447
      },
      {
        lat: 10.7769,
        lng: 106.7009,
        name: 'Bến Thành',
        count: 1567,
        cameraCode: 'CAM-003',
        totalIn: 823,
        totalOut: 744
      },
      {
        lat: 10.7891,
        lng: 106.6668,
        name: 'Quận 1',
        count: 2134,
        cameraCode: 'CAM-004',
        totalIn: 1089,
        totalOut: 1045
      },
      {
        lat: 16.0544,
        lng: 108.2022,
        name: 'Cầu Rồng',
        count: 756,
        cameraCode: 'CAM-005',
        totalIn: 389,
        totalOut: 367
      }
    ];

    // Mock summary cards matching the design (3 cards)
    this.summaryCards = [
      { 
        title: 'Tổng số phương tiện', 
        value: 8213, 
        change: 0, 
        isPositive: true,
        color: 'blue'
      },
      { 
        title: 'Phương tiện chiếm tỉ lệ cao nhất', 
        value: 0, 
        change: 0, 
        isPositive: true, 
        subtitle: 'Xe máy',
        color: 'green'
      },
      { 
        title: 'Giờ cao điểm giao thông', 
        value: 0, 
        change: 0, 
        isPositive: true, 
        subtitle: '16-19h',
        color: 'purple'
      }
    ];

    console.log('🚗 Mock camera locations:', this.cameraLocations);
    console.log('📊 Mock summary cards:', this.summaryCards);
  }
}
