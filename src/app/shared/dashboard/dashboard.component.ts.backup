// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, ChartOptions } from 'chart.js';
import { SummaryCardComponent } from '../summary-card/summary-card.component';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { DashboardService } from '../dashboard/dashboad.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DateRangePickerComponent } from "../date-picker-ranger/date-range-picker.component";
import { DatePickerComponentWeek } from "../date-picker-week/date-picker.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MENU_ITEM_SETS } from '../constants/filter-menu-items';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    SummaryCardComponent,
    DateRangePickerComponent,
    MatProgressSpinnerModule,
    DatePickerComponentWeek
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponentShare implements OnInit {

  // Filter parameters từ search bar
  currentFilters: {
    year?: number;
    month?: number;
    fromUtc?: string;
    toUtc?: string;
    cameraSn?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {};

  // Dữ liệu cho Summary Cards
  summaryData = [
    { title: 'Tổng vi phạm', value: 0, percentageChange: 0, isPositive: true, class: 'total' },
    { title: 'Đã xử lý', value: 0, percentageChange: 0, isPositive: true, class: 'processed' },
    { title: 'Chờ xử lý', value: 0, percentageChange: 0, isPositive: true, class: 'pending' },
  ];

  // GIỮ NGUYÊN data mock mặc định cho "Thống kê số lượng lấn chiếm"
  public vehicleViolationLabels: string[] = Array.from({length: 31}, (_, i) => (i + 1).toString());
  public vehicleViolationData: ChartData<'bar'> = {
    labels: this.vehicleViolationLabels,
    datasets: [
      {
        data: Array.from({length: 31}, () => Math.floor(Math.random() * 300)), // Data mock ban đầu
        label: 'Số lượng lấn chiếm',
        backgroundColor: '#5c6bc0',
        hoverBackgroundColor: '#3949ab',
        borderRadius: 4,
        barThickness: 16,
      }
    ]
  };
  public vehicleViolationOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: false,
          font: { size: 11 }
        }
      },
      y: { 
        beginAtZero: true, 
        grid: { color: '#e0e0e0' }
      }
    },
    plugins: { 
      legend: { display: false }
    }
  };

  // GIỮ NGUYÊN data mock cho các biểu đồ khác
  public violationTypeLabels: string[] = [
    'Di chuyển vào đường cấm', 'Di chuyển làn đường', 'Chạy chậm hơn tốc độ tối thiểu',
    'Vi phạm tín hiệu đèn giao thông', 'Vượt quá tốc độ quy định', 'Vượt đèn đỏ',
    'Chở quá số người quy định', 'Không đội mũ bảo hiểm', 'Đi ngược chiều',
    'Đi sai làn đường', 'Quay đầu xe không đúng nơi', 'Dừng đỗ sai quy định'
  ];
  public violationTypeDataValues: number[] = [32, 20, 15, 13, 9, 8, 4, 2, 1, 1, 0, 0];
  public violationTypeData: ChartData<'doughnut'> = {
    labels: this.violationTypeLabels.filter((_, i) => this.violationTypeDataValues[i] > 0),
    datasets: [{
      data: this.violationTypeDataValues.filter(val => val > 0),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8BC34A', '#FF5722', '#009688', '#E91E63'],
      hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8BC34A', '#FF5722', '#009688', '#E91E63'],
      borderColor: '#fff',
      hoverBorderColor: '#f0f0f0'
    }]
  };
  public violationTypeOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };
  public customLegendData: { label: string, value: number, color: string }[] = [];

  // GIỮ NGUYÊN Time slot mock data
  public violationsByTimeSlotData = [
    { day: 'T2', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'T3', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'T4', slots: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'T5', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'T6', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'T7', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { day: 'CN', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ];
  public timeSlotLabels = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];

  // GIỮ NGUYÊN Camera mock data
  public cameraViolationLabels: string[] = ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4', 'Camera 5', 'Camera 6'];
  public cameraViolationData: ChartData<'bar'> = {
    labels: this.cameraViolationLabels,
    datasets: [
      {
        data: [250, 380, 180, 320, 280, 150], // Data mock ban đầu
        label: 'Số lượng vi phạm',
        backgroundColor: '#66bb6a',
        hoverBackgroundColor: '#43a047',
        borderRadius: 4,
        barThickness: 30,
      }
    ]
  };
  public cameraViolationOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e0e0e0' } }
    },
    plugins: { legend: { display: false } }
  };

  // Loading states
  isVehicleViolationLoading = false;
  isTimeSlotLoading = false;
  isCameraChartLoading = false;
  isExportingReport = false;

  // Filter search bar
  menuItems = MENU_ITEM_SETS.DASHBOARD;

  queryFormModel: any = [];

  constructor(
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    // Tạo custom legend cho Donut Chart
    this.getSumViolationStats();


    this.customLegendData = this.violationTypeLabels
      .map((label, i) => ({
        label: label,
        value: this.violationTypeDataValues[i],
        color: (this.violationTypeData.datasets[0].backgroundColor as string[])[i] || '#ccc'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Set default date ranges và load initial data
    this.setDefaultDateRanges();
    this.loadInitialData();
  }

  // Thêm method để set default date ranges
  private setDefaultDateRanges(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Set mặc định từ ngày đầu tháng tới ngày hiện tại cho "Thống kê số lượng lấn chiếm" và "Camera"
    this.currentFilters.fromUtc = firstDayOfMonth.toISOString();
    this.currentFilters.toUtc = today.toISOString();
    
    console.log('Default date range set:', {
      from: firstDayOfMonth,
      to: today
    });
  }

  // Thêm method để load initial data
  private loadInitialData(): void {
    // Load data cho "Thống kê số lượng lấn chiếm" với date range từ đầu tháng
    this.loadVehicleViolationData();
    
    // Load data cho "Lượt lấn chiếm theo Camera" với date range từ đầu tháng
    this.loadCameraData();
    
    // "Lấn chiếm theo khung giờ" sẽ tự động load với tuần này khi component được khởi tạo
    // (xử lý trong DatePickerComponentWeek)
  }

  // Cập nhật method getSumViolationStats để debug
  getSumViolationStats(): void {
    console.log('Calling getSumViolationStats API...');
    
    this.dashboardService.getSumViolationStats({}).subscribe({
      next: (response) => {   
        console.log('Sum violation stats response:', response);
        if (response && response.data) {
          console.log('Found data, calling updateSummaryData...');
          this.updateSummaryData(response.data);
        } else {
          console.warn('No data found in response');
        }
      },
      error: (error) => {
        console.error('Error loading sum violation stats:', error);
        this.snackBar.open('Lỗi khi tải dữ liệu thống kê vi phạm', 'Đóng', { duration: 3000 });
      }
    });
  }

  // Add a property to store previous period data for comparison
  private previousSummaryData: any = null;

  // Cập nhật method updateSummaryData để debug tốt hơn
  private updateSummaryData(data: any): void {
    console.log('Updating summary data with:', data);
    console.log('Current summaryData before update:', this.summaryData);
    
    // Tính tổng vi phạm từ eventTotal hoặc tổng processed + unprocessed
    const totalViolations = data.eventTotal || ((data.processed || 0) + (data.unprocessed || 0));
    const processedCount = data.processed || 0;
    const unprocessedCount = data.unprocessed || 0;
    
    console.log('Calculated values:', {
      totalViolations,
      processed: processedCount,
      unprocessed: unprocessedCount
    });

    // Calculate percentage changes compared to previous data
    let totalChange = 0;
    let processedChange = 0;
    let unprocessedChange = 0;

    if (this.previousSummaryData) {
      const prevTotal = this.previousSummaryData.total || 0;
      const prevProcessed = this.previousSummaryData.processed || 0;
      const prevUnprocessed = this.previousSummaryData.unprocessed || 0;

      // Calculate percentage change: ((new - old) / old) * 100
      totalChange = prevTotal > 0 ? Math.round(((totalViolations - prevTotal) / prevTotal) * 100) : 0;
      processedChange = prevProcessed > 0 ? Math.round(((processedCount - prevProcessed) / prevProcessed) * 100) : 0;
      unprocessedChange = prevUnprocessed > 0 ? Math.round(((unprocessedCount - prevUnprocessed) / prevUnprocessed) * 100) : 0;
    }

    // Cập nhật Summary Cards với data thực từ API và trend đúng
    this.summaryData = [
      { 
        title: 'Tổng vi phạm', 
        value: totalViolations, 
        percentageChange: totalChange,
        isPositive: totalChange >= 0, // Tăng thì positive (mũi tên lên), giảm thì negative (mũi tên xuống)
        class: 'total' 
      },
      { 
        title: 'Đã xử lý', 
        value: processedCount, 
        percentageChange: processedChange,
        isPositive: processedChange >= 0, // Tăng số lượng đã xử lý là tích cực
        class: 'processed' 
      },
      { 
        title: 'Chờ xử lý', 
        value: unprocessedCount, 
        percentageChange: unprocessedChange,
        isPositive: unprocessedChange <= 0, // Giảm số lượng chờ xử lý là tích cực
        class: 'pending' 
      },
    ];

    // Store current data as previous for next comparison
    this.previousSummaryData = {
      total: totalViolations,
      processed: processedCount,
      unprocessed: unprocessedCount
    };

    console.log('Updated summaryData with trends:', this.summaryData);
    
    // Force change detection
    setTimeout(() => {
      console.log('Summary data after timeout:', this.summaryData);
    }, 100);
  }

  // Handle filter từ search bar
  handleTagApi(query: any) {
    console.log('Received filter query:', query);
    this.queryFormModel = query;
    
    // Parse query thành filter parameters
    this.parseQueryToFilters(query);
    
    // Load lại data với filters mới CHỈ KHI có filter
    if (query && query.length > 0) {
      this.loadAllChartData();
    }
  }

  // Parse query array thành filter object
  parseQueryToFilters(queryArray: any[]): void {
    const filters: any = {};
    
    queryArray.forEach(item => {
      if (item.key && item.value) {
        switch (item.key) {
          case 'cameraSn':
            filters.cameraSn = item.value;
            break;
          case 'eventType':
            filters.eventType = item.value;
            break;
          case 'year':
            filters.year = parseInt(item.value);
            break;
          case 'month':
            filters.month = parseInt(item.value);
            break;
          case 'startDate':
            filters.fromUtc = new Date(item.value).toISOString();
            break;
          case 'endDate':
            filters.toUtc = new Date(item.value).toISOString();
            break;
        }
      }
    });

    this.currentFilters = filters;
    console.log('Updated filters:', this.currentFilters);
  }

  // Load tất cả data cho các charts CHỈ KHI có filter
  loadAllChartData(): void {
    this.loadVehicleViolationData();
    this.loadTimeSlotData(); 
    this.loadCameraData();
  }

  // Load data cho Vehicle Violation Chart
  loadVehicleViolationData(): void {
    this.isVehicleViolationLoading = true;
    
    this.dashboardService.getDailyViolationStats(this.currentFilters).subscribe({
      next: (response) => {
        console.log('Vehicle violation response:', response);
        if (response && response.data) {
          this.updateVehicleViolationChart(response.data);
        }
        this.isVehicleViolationLoading = false;
      },
      error: (error) => {
        console.error('Error loading vehicle violation data:', error);
        this.snackBar.open('Lỗi khi tải dữ liệu vi phạm theo ngày', 'Đóng', { duration: 3000 });
        this.isVehicleViolationLoading = false;
      }
    });
  }

  // Date range picker handlers - CHỈ update khi có chọn ngày
  onDateRangeSelected(range: { startDate: Date, endDate: Date }) {
    this.currentFilters.fromUtc = range.startDate.toISOString();
    this.currentFilters.toUtc = range.endDate.toISOString();
    
    // CHỈ load data CHO chart Vehicle Violation khi chọn date range
    this.loadVehicleViolationData();
  }

  // Load data cho Time Slot
  loadTimeSlotData(): void {
    this.isTimeSlotLoading = true;
    
    this.dashboardService.getTimeSlotViolations(this.currentFilters).subscribe({
      next: (response) => {
        console.log('Time slot response:', response);
        
        // Xử lý response theo format API trả về
        if (response?.success && response?.data) {
          this.updateTimeSlotData(response.data);
        } else if (response?.data) {
          // Trường hợp chỉ có response.data
          this.updateTimeSlotData(response.data);
        } else if (response && typeof response === 'object' && !response.success) {
          // Trường hợp response trực tiếp là data object
          this.updateTimeSlotData(response);
        } else {
          console.warn('No time slot data found');
          // Reset về data rỗng thay vì giữ mock data
          this.resetTimeSlotData();
        }
        
        this.isTimeSlotLoading = false;
      },
      error: (error) => {
        console.error('Error loading time slot data:', error);
        this.snackBar.open('Lỗi khi tải dữ liệu vi phạm theo khung giờ', 'Đóng', { duration: 3000 });
        this.isTimeSlotLoading = false;
        // Reset về data rỗng khi có lỗi
        this.resetTimeSlotData();
      }
    });
  }

  onTimeSlotWeekSelected(weekSelection: any) {
    this.currentFilters.fromUtc = weekSelection.startDate.toISOString();
    this.currentFilters.toUtc = weekSelection.endDate.toISOString();
    
    // Load data CHO time slot chart với params mới
    this.loadTimeSlotData();
  }

  onCameraDateRangeSelected(range: { startDate: Date, endDate: Date }) {
    this.currentFilters.fromUtc = range.startDate.toISOString();
    this.currentFilters.toUtc = range.endDate.toISOString();
    
    // Load data CHO camera chart với params mới
    this.loadCameraData();
  }

  // Update chart methods
  private updateVehicleViolationChart(data: any[]) {
    // Tạo mảng 31 phần tử với giá trị mặc định là 0
    const newData = Array(31).fill(0);

    // Cập nhật giá trị cho những ngày có dữ liệu
    data.forEach(item => {
      const day = new Date(item.date || item.day).getDate();
      if (day >= 1 && day <= 31) {
        newData[day - 1] = item.count || item.violations || 0;
      }
    });

    // Update với data từ API
    this.vehicleViolationData = {
      labels: this.vehicleViolationLabels,
      datasets: [
        {
          data: newData,
          label: 'Số lượng lấn chiếm',  // Giữ nguyên label
          backgroundColor: '#5c6bc0',
          hoverBackgroundColor: '#3949ab',
          borderRadius: 4,
          barThickness: 16,
        }
      ]
    };
  }

  private updateTimeSlotData(data: any) {
    console.log('Raw time slot data from API:', data);
    
    if (!data) {
      console.warn('No time slot data provided');
      return;
    }

    // API trả về format: { "0": [array], "1": [array], "2": [array], ... }
    // Trong đó key là số thứ tự ngày trong tuần (0=T2, 1=T3, ..., 6=CN)
    const dayMapping = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    this.violationsByTimeSlotData = dayMapping.map((dayName, index) => {
      const dayData = data[index.toString()]; // Lấy data theo index (0, 1, 2, ...)
      
      return {
        day: dayName,
        slots: dayData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 12 slots mặc định là 0
      };
    });

    console.log('Updated time slot data:', this.violationsByTimeSlotData);
  }

  private updateCameraViolationData(data: any[]) {
    const labels = data.map(item => item.cameraName || item.cameraSn);
    const values = data.map(item => item.violationCount || item.count || 0);

    this.cameraViolationData = {
      labels: labels,
      datasets: [{
        data: values,
        label: 'Số lượng vi phạm',
        backgroundColor: '#66bb6a',
        hoverBackgroundColor: '#43a047',
        borderRadius: 4,
        barThickness: 30,
      }]
    };
  }

  loadCameraData(): void {
    this.isCameraChartLoading = true;
    
    this.dashboardService.getCameraViolations(this.currentFilters).subscribe({
      next: (response) => {
        console.log('Camera response:', response);
        if (response && response.data) {
          this.updateCameraViolationData(response.data);
        }
        this.isCameraChartLoading = false;
      },
      error: (error) => {
        console.error('Error loading camera data:', error);
        this.snackBar.open('Lỗi khi tải dữ liệu vi phạm theo camera', 'Đóng', { duration: 3000 });
        this.isCameraChartLoading = false;
      }
    });
  }

  // Export report
  exportReport(): void {
    this.isExportingReport = true;
    
    console.log('Xuất báo cáo với filters:', this.currentFilters);
    
    setTimeout(() => {
      this.snackBar.open('Báo cáo đã được xuất thành công!', 'Đóng', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.isExportingReport = false;
      this.downloadMockReport();
    }, 2000);
  }
  
  private downloadMockReport(): void {
    const fileName = `bao-cao-vi-pham-${new Date().toISOString().split('T')[0]}.xlsx`;
    console.log(`Mock download file: ${fileName}`);
  }

  // Thêm method để reset time slot data về trạng thái rỗng
  private resetTimeSlotData(): void {
    this.violationsByTimeSlotData = [
      { day: 'T2', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'T3', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'T4', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'T5', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'T6', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'T7', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { day: 'CN', slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
    ];
  }
}
