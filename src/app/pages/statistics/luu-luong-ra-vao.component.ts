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
  styleUrls: ['./luu-luong-ra-vao.component.scss']
})
export class LuuLuongRaVaoComponent implements OnInit, OnDestroy {
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
  
  // Loading states
  isLineChartLoading = false;
  isBarChartLoading = false;
  
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
    // Load camera options from API
    this.loadCameraOptions();
    
    // Initialize data (will load real camera locations from API)
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
  }
  

  
  ngOnDestroy(): void {
    // Cleanup subscription
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
  
  private resizeCharts(): void {
    // Trigger chart.js resize
    if (this.chart) {
      this.chart.chart?.resize();
    }
  }
  
  constructor(
    private http: HttpClient,
    private sidebarService: SidebarService,
    private cameraService: CameraService,
    private cdr: ChangeDetectorRef
  ) {}
  
  // Filter methods
  toggleTimeDropdown(): void {
    this.showTimeDropdown = !this.showTimeDropdown;
    this.showCameraDropdown = false;
  }
  
  toggleCameraDropdown(): void {
    this.showCameraDropdown = !this.showCameraDropdown;
    this.showTimeDropdown = false;
  }
  
  selectTimeRange(value: string): void {
    this.selectedTimeRange = value;
    this.showTimeDropdown = false;
    
    if (value !== 'custom') {
      this.customDateRange = { start: null, end: null };
      this.applyFilters();
    }
  }
  
  selectCamera(value: string): void {
    this.selectedCamera = value;
    this.showCameraDropdown = false;
    this.applyFilters();
  }
  
  onDateRangeSelected(range: { startDate: Date; endDate: Date }): void {
    this.customDateRange = { start: range.startDate, end: range.endDate };
    this.applyFilters();
  }
  
  onDateRangeCleared(): void {
    this.customDateRange = { start: null, end: null };
    this.selectedTimeRange = 'today';
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchText = '';
    this.selectedTimeRange = '';
    this.selectedCamera = '';
    this.customDateRange = { start: null, end: null };
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
  
  onSearch(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    console.log('Applying filters:', {
      searchText: this.searchText,
      timeRange: this.selectedTimeRange,
      camera: this.selectedCamera,
      customDateRange: this.customDateRange
    });
    
    // TODO: Call API with filters
    this.loadChartData();
  }
  
  loadChartData(): void {
    console.log('=== loadChartData called ===');
    this.isLineChartLoading = true;
    this.isBarChartLoading = true;
    
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
    
    // Call API for stats (summary cards and map data)
    const statsApiUrl = '/api/admin/events/line-cross/stats';
    console.log('Calling Stats API:', statsApiUrl, 'with params:', params);
    
    this.http.get<any>(statsApiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('✅ Stats API response:', response);
          this.updateStatsData(response);
        },
        error: (error) => {
          console.error('❌ Error fetching stats data:', error);
        }
      });
    
    // Determine which API to use based on date range
    const fromDate = new Date(fromUtc);
    const toDate = new Date(toUtc);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const isSingleDay = daysDiff <= 1;
    
    // Call API for line chart data
    // Use by-hour-of-day for single day, by-day for multiple days
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
          this.isLineChartLoading = false;
        },
        error: (error) => {
          console.error('❌ Error fetching line chart data:', error);
          this.isLineChartLoading = false;
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
          this.isBarChartLoading = false;
        },
        error: (error) => {
          console.error('❌ Error fetching bar chart data:', error);
          this.isBarChartLoading = false;
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
        // No filter selected: first day of current month to today
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
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
    console.log('Updating stats data:', data);
    
    // Handle both array and object wrapper formats
    const statsData = data.data || data;
    
    if (!statsData) {
      console.warn('No stats data received');
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
    
    // Update map locations from cameraInfo array
    if (statsData.cameraInfo && Array.isArray(statsData.cameraInfo)) {
      console.log('🗺️ Processing cameraInfo data:', statsData.cameraInfo);
      
      // Define area coordinates first
      const AREA_COORDINATES: { [key: string]: { lat: number, lng: number } } = {
        'Duy Tân': { lat: 21.030194980619505, lng: 105.78293616746109 },  // Hà Nội
        'Phú Quốc': { lat: 10.162959876433863, lng: 103.99798100890551 }  // Phú Quốc
      };
      
      // Group cameras by area
      const areaGroups: { [key: string]: { cameras: any[], lat: number, lng: number } } = {};
      
      statsData.cameraInfo.forEach((item: any) => {
        const lat = typeof item.latitude === 'number' ? item.latitude : parseFloat(item.latitude);
        const lng = typeof item.longitude === 'number' ? item.longitude : parseFloat(item.longitude);
        
        // ACVN248240000028 - Duy Tân (Hà Nội)
        if (item.cameraSn === 'ACVN248240000028') {
          if (!areaGroups['Duy Tân']) {
            areaGroups['Duy Tân'] = { 
              cameras: [], 
              lat: AREA_COORDINATES['Duy Tân'].lat, 
              lng: AREA_COORDINATES['Duy Tân'].lng 
            };
          }
          areaGroups['Duy Tân'].cameras.push(item);
        }
        // ACVN248240000066 and ACVN248240000098 - Phú Quốc area group
        else if (item.cameraSn === 'ACVN248240000066' || item.cameraSn === 'ACVN248240000098') {
          if (!areaGroups['Phú Quốc']) {
            areaGroups['Phú Quốc'] = { 
              cameras: [], 
              lat: AREA_COORDINATES['Phú Quốc'].lat, 
              lng: AREA_COORDINATES['Phú Quốc'].lng 
            };
          }
          areaGroups['Phú Quốc'].cameras.push(item);
        }
        // Future cameras will be added here
        else {
          // Default: each camera as separate location
          areaGroups[item.cameraSn] = { cameras: [item], lat: lat, lng: lng };
        }
      });
      
      console.log('🗺️ Grouped cameras by area:', areaGroups);
      
      // Convert groups to map locations
      this.cameraLocations = Object.entries(areaGroups).map(([areaName, groupData]) => {
        const cameras = groupData.cameras;
        
        // Sum totals for the group
        const totalCount = cameras.reduce((sum, cam) => sum + (cam.total || 0), 0);
        const totalIn = cameras.reduce((sum, cam) => sum + (cam.totalIn || 0), 0);
        const totalOut = cameras.reduce((sum, cam) => sum + (cam.totalOut || 0), 0);
        
        console.log(`🗺️ Area "${areaName}":`, {
          cameras: cameras.map(c => c.cameraSn),
          coordinates: { lat: groupData.lat, lng: groupData.lng },
          total: totalCount,
          totalIn: totalIn,
          totalOut: totalOut
        });
        
        return {
          lat: groupData.lat,
          lng: groupData.lng,
          name: areaName,
          count: totalCount,
          cameraCode: areaName,
          totalIn: totalIn,
          totalOut: totalOut,
          cameras: cameras.map(c => c.cameraSn), // Keep track of cameras in this group
          individualCameras: cameras.map(c => ({ // Store individual camera data for high zoom
            cameraSn: c.cameraSn,
            lat: typeof c.latitude === 'number' ? c.latitude : parseFloat(c.latitude),
            lng: typeof c.longitude === 'number' ? c.longitude : parseFloat(c.longitude),
            total: c.total || 0,
            totalIn: c.totalIn || 0,
            totalOut: c.totalOut || 0
          }))
        };
      }).filter((location: any) => {
        // Filter out invalid coordinates
        const isValid = !isNaN(location.lat) && !isNaN(location.lng) && 
                       location.lat !== 0 && location.lng !== 0;
        if (!isValid) {
          console.warn('🗺️ Filtered out invalid location:', location);
        }
        return isValid;
      });
      
      console.log('🗺️ Final camera locations:', this.cameraLocations);
      
      // Force Angular change detection for map update
      this.cameraLocations = [...this.cameraLocations];
      this.cdr.detectChanges();
      
      // Keep country view initially, don't auto-zoom to camera locations
      console.log('🗺️ Keeping country view center:', this.mapCenter);
    } else {
      console.log('🗺️ No cameraInfo data from API, setting empty array');
      this.cameraLocations = [];
    }
    
    console.log('Updated summary cards:', this.summaryCards);
    console.log('Updated camera locations:', this.cameraLocations);
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
    
    // Update line chart
    this.lineChartData = {
      labels: labels,
      datasets: datasets
    };
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  setLineChartFilter(filter: 'all' | 'in' | 'out'): void {
    this.lineChartFilter = filter;
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
    
    // Update bar chart
    this.barChartData = {
      labels: locations,
      datasets: datasets
    };
    
    // Trigger chart update
    if (this.chart) {
      this.chart.update();
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  setBarChartFilter(filter: 'all' | 'in' | 'out'): void {
    this.barChartFilter = filter;
    this.applyBarChartFilter();
  }
  
  exportReport(): void {
    console.log('Exporting report...');
    // TODO: Implement export functionality
  }
  
  // Computed properties
  get hasActiveFilters(): boolean {
    return this.searchText !== '' || this.selectedCamera !== '' || this.selectedTimeRange !== '';
  }
  
  getTimeRangeLabel(): string {
    if (!this.selectedTimeRange) {
      return 'Tháng này';
    }
    const option = this.timeOptions.find(opt => opt.value === this.selectedTimeRange);
    return option ? option.label : 'Chọn thời gian';
  }
  
  getCameraLabel(): string {
    const option = this.cameraOptions.find(opt => opt.value === this.selectedCamera);
    return option ? option.label : 'Tất cả Camera';
  }
}

