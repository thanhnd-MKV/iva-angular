import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartConfiguration } from 'chart.js';
import { DateRangePickerComponent } from '../../shared/date-picker-ranger/date-range-picker.component';
import { TrafficFlowMapComponent } from './traffic-flow-map.component';
import { HttpClient } from '@angular/common/http';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CameraService } from '../camera/camera.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vi-pham-giao-thong',
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
  templateUrl: './vi-pham-giao-thong.component.html',
  styleUrls: ['./vi-pham-giao-thong.component.scss']
})
export class ViPhamGiaoThongComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private sidebarSubscription?: Subscription;
  isSidebarOpened = true;
  
  // Filter state
  searchText = '';
  showTimeDropdown = false;
  showCameraDropdown = false;
  selectedTimeRange = '';
  selectedCamera = '';
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  
  // Options
  timeOptions = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: 'last7days' },
    { label: '30 ngày qua', value: 'last30days' },
    { label: 'Tùy chỉnh', value: 'custom' }
  ];
  
  cameraOptions: any[] = [
    { label: 'Tất cả Camera', value: '' }
  ];
  
  // Loading states
  isLineChartLoading = false;
  isBarChartLoading = false;
  
  // Map data
  mapCenter = { lat: 14.0583, lng: 108.2772 }; // Vietnam center for country view
  mapZoom = 5; // Start with country overview
  cameraLocations: any[] = [];
  
  // Summary cards data - 4 metrics for violations
  summaryCards = [
    { title: 'Tổng số vi phạm', value: 8213, change: 0, isPositive: false, color: 'blue' },
    { title: 'Vi phạm phổ biến nhất', value: 0, change: 0, isPositive: false, subtitle: 'Vượt đèn đỏ', color: 'green' },
    { title: 'Giờ cao điểm vi phạm', value: 0, change: 0, isPositive: true, subtitle: '16-19h', color: 'purple' },
    { title: 'Camera ghi nhận nhiều vi phạm nhất', value: 3213, change: 0, isPositive: false, subtitle: 'Camera 04', color: 'blue' }
  ];
  
  // Chart filter state
  lineChartFilter: 'all' | 'speed' | 'light' | 'lane' | 'helmet' = 'all';

  // Donut Chart - Loại vi phạm
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
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const percentage = ((context.raw / context.chart._metasets[0].total) * 100).toFixed(0);
            return `${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      onComplete: function(animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        
        chart.data.datasets.forEach((dataset: any, i: number) => {
          const meta = chart.getDatasetMeta(i);
          const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
          
          meta.data.forEach((element: any, index: number) => {
            const value = dataset.data[index];
            const percentage = (value / total) * 100;
            
            // Only show number if percentage >= 10%
            if (percentage >= 10) {
              const centerPoint = element.getCenterPoint();
              ctx.save();
              ctx.font = 'bold 14px Arial';
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(value.toString(), centerPoint.x, centerPoint.y);
              ctx.restore();
            }
          });
        });
      }
    }
  };
  
  // Bar Chart Data (Violations by type)
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
    this.loadViolationData();
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

  private loadViolationData(): void {
    // Load violation data based on filters
    this.generateMockViolationData();
  }

  private initializeCharts(): void {
    this.generateMockViolationData();
  }

  private generateMockViolationData(): void {
    // Generate stacked bar chart data for violations (24 hours, 0-23)
    const hours = Array.from({length: 24}, (_, i) => i.toString());
    
    // Mock data for different violation types with colors
    const vuotDenDoData = [15, 25, 18, 12, 8, 18, 30, 45, 60, 68, 64, 62, 68, 72, 75, 82, 90, 98, 75, 56, 45, 34, 26, 19];
    const quaTocDoData = [20, 35, 25, 15, 10, 25, 40, 60, 80, 90, 85, 82, 90, 95, 100, 110, 120, 130, 100, 75, 60, 45, 35, 25];
    const saiLanData = [10, 18, 14, 9, 6, 14, 22, 33, 44, 50, 47, 45, 50, 53, 56, 61, 67, 73, 56, 42, 33, 25, 19, 14];
    const khongMuBaoHiemData = [8, 15, 12, 8, 5, 12, 20, 30, 40, 45, 43, 41, 45, 48, 50, 55, 60, 65, 50, 37, 30, 23, 17, 12];
    const viPhamKhacData = [5, 10, 8, 5, 3, 8, 13, 20, 27, 30, 28, 27, 30, 32, 34, 37, 40, 43, 34, 25, 20, 15, 11, 8];

    this.barChartData = {
      labels: hours,
      datasets: [
        {
          label: 'Vượt đèn đỏ',
          data: vuotDenDoData,
          backgroundColor: '#EF4444', // Red
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Ði sai làn',
          data: saiLanData,
          backgroundColor: '#8B5CF6', // Purple
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Không đội mũ bảo hiểm',
          data: khongMuBaoHiemData,
          backgroundColor: '#10B981', // Green
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Dùng điện thoại khi lái',
          data: quaTocDoData,
          backgroundColor: '#F59E0B', // Orange
          borderWidth: 0,
          borderRadius: 2
        },
        {
          label: 'Vi phạm khác',
          data: viPhamKhacData,
          backgroundColor: '#06B6D4', // Cyan
          borderWidth: 0,
          borderRadius: 2
        }
      ]
    };

    // Generate donut chart data for violation types
    this.donutChartData = {
      labels: ['Vượt đèn đỏ', 'Đi sai làn', 'Không đội mũ bảo hiểm', 'Dùng điện thoại khi lái', 'Vi phạm khác'],
      datasets: [{
        data: [212, 156, 134, 98, 67], // Mock violation counts by type
        backgroundColor: [
          '#EF4444', // Red for traffic light
          '#8B5CF6', // Purple for wrong lane
          '#10B981', // Green for helmet
          '#F59E0B', // Orange for phone
          '#06B6D4'  // Cyan for others
        ],
        hoverBackgroundColor: [
          '#DC2626',
          '#7C3AED', 
          '#059669',
          '#D97706',
          '#0891B2'
        ],
        borderWidth: 0
      }]
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
    this.loadViolationData();
  }

  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.loadViolationData();
  }

  onSearch(): void {
    this.loadViolationData();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = '';
    this.selectedCamera = '';
    this.customDateRange = { start: null, end: null };
    this.loadViolationData();
  }

  onDateRangeSelected(dateRange: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: dateRange.startDate, end: dateRange.endDate };
    this.loadViolationData();
  }

  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.loadViolationData();
  }

  // Chart filter methods
  setLineChartFilter(filter: 'all' | 'speed' | 'light' | 'lane' | 'helmet'): void {
    this.lineChartFilter = filter;
    this.updateLineChartData();
  }

  private updateLineChartData(): void {
    // Update bar chart based on filter
    this.generateMockViolationData();
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
    console.log('Exporting violation report...');
  }

  getDonutColor(index: number): string {
    const colors = ['#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4'];
    return colors[index] || '#6B7280';
  }

  private initializeMockData(): void {
    // Mock camera locations with violation data
    this.cameraLocations = [
      {
        lat: 21.0285,
        lng: 105.8542,
        name: 'Cầu Long Biên',
        count: 245,
        cameraCode: 'CAM-001',
        totalIn: 145,
        totalOut: 100
      },
      {
        lat: 21.0245,
        lng: 105.8412,
        name: 'Ngã Tư Sở',
        count: 189,
        cameraCode: 'CAM-002',
        totalIn: 98,
        totalOut: 91
      },
      {
        lat: 10.7769,
        lng: 106.7009,
        name: 'Bến Thành',
        count: 378,
        cameraCode: 'CAM-003',
        totalIn: 198,
        totalOut: 180
      },
      {
        lat: 10.7891,
        lng: 106.6668,
        name: 'Quận 1',
        count: 456,
        cameraCode: 'CAM-004',
        totalIn: 234,
        totalOut: 222
      },
      {
        lat: 16.0544,
        lng: 108.2022,
        name: 'Cầu Rồng',
        count: 156,
        cameraCode: 'CAM-005',
        totalIn: 82,
        totalOut: 74
      }
    ];

    // Mock summary cards for violations (4 cards)
    this.summaryCards = [
      { 
        title: 'Tổng số vi phạm', 
        value: 8213, 
        change: 0, 
        isPositive: false,
        color: 'blue'
      },
      { 
        title: 'Vi phạm phổ biến nhất', 
        value: 0, 
        change: 0, 
        isPositive: false, 
        subtitle: 'Vượt đèn đỏ',
        color: 'green'
      },
      { 
        title: 'Giờ cao điểm vi phạm', 
        value: 0, 
        change: 0, 
        isPositive: true, 
        subtitle: '16-19h',
        color: 'purple'
      },
      { 
        title: 'Camera ghi nhận nhiều vi phạm nhất', 
        value: 3213, 
        change: 0, 
        isPositive: false, 
        subtitle: 'Camera 04',
        color: 'blue'
      }
    ];

    console.log('🚨 Mock violation camera locations:', this.cameraLocations);
    console.log('📊 Mock violation summary cards:', this.summaryCards);
  }
}