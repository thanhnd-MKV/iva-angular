import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

interface CameraInfo {
  latitude: number;
  longitude: number;
  total: number;
  totalIn: number;
  totalOut: number;
  cameraSn: string;
}

interface Location {
  cameraInfo: CameraInfo[];
  location: string;
  total: number;
  totalIn: number;
  totalOut: number;
}

interface TrafficFlowData {
  success: boolean;
  code: string;
  message: string | null;
  data: {
    total: number;
    totalIn: number;
    totalOut: number;
    locations: Location[];
  };
}

@Component({
  selector: 'app-luu-luong-ra-vao',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Lưu lượng ra vào</h2>
      
      <!-- Tổng quan -->
      <div class="overview-section">
        <div class="stats-grid">
          <div class="stat-card total">
            <h3>Tổng lưu lượng</h3>
            <p class="stat-number">{{ trafficData?.data?.total | number }}</p>
          </div>
          <div class="stat-card in">
            <h3>Lượt vào</h3>
            <p class="stat-number">{{ trafficData?.data?.totalIn | number }}</p>
          </div>
          <div class="stat-card out">
            <h3>Lượt ra</h3>
            <p class="stat-number">{{ trafficData?.data?.totalOut | number }}</p>
          </div>
        </div>
      </div>

      <!-- Bản đồ và chi tiết -->
      <div class="map-and-details-section">
        <!-- Bản đồ -->
        <div class="map-section">
          <h3>Bản đồ camera</h3>
          <div class="map-container">
       x
          </div>
        </div>

        <!-- Chi tiết theo địa điểm -->
        <div class="details-section">
          <h3>Chi tiết theo địa điểm</h3>
          <div class="locations-grid">
            <div *ngFor="let location of trafficData?.data?.locations" class="location-card">
              <div class="location-header">
                <h4>{{ location.location }}</h4>
                <div class="location-stats">
                  <span class="stat-item">
                    <strong>{{ location.total | number }}</strong> tổng
                  </span>
                  <span class="stat-item in">
                    <strong>{{ location.totalIn | number }}</strong> vào
                  </span>
                  <span class="stat-item out">
                    <strong>{{ location.totalOut | number }}</strong> ra
                  </span>
                </div>
              </div>
              
              <!-- Thông tin camera -->
              <div class="cameras-section">
                <h5>Camera ({{ location.cameraInfo.length }})</h5>
                <div class="cameras-grid">
                  <div *ngFor="let camera of location.cameraInfo" 
                       class="camera-card" 
                       [class.selected]="selectedCamera?.cameraSn === camera.cameraSn"
                       (click)="selectCamera(camera)">
                    <div class="camera-info">
                      <div class="camera-sn">{{ camera.cameraSn }}</div>
                      <div class="camera-coords">
                        {{ camera.latitude | number:'1.6-6' }}, {{ camera.longitude | number:'1.6-6' }}
                      </div>
                    </div>
                    <div class="camera-stats">
                      <div class="camera-stat">
                        <span class="label">Tổng:</span>
                        <span class="value">{{ camera.total | number }}</span>
                      </div>
                      <div class="camera-stat in">
                        <span class="label">Vào:</span>
                        <span class="value">{{ camera.totalIn | number }}</span>
                      </div>
                      <div class="camera-stat out">
                        <span class="label">Ra:</span>
                        <span class="value">{{ camera.totalOut | number }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      background: #f8fafc;
      min-height: 100vh;
    }
    
    h2 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 24px;
    }

    /* Tổng quan */
    .overview-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #6366f1;
    }

    .stat-card.total {
      border-left-color: #6366f1;
    }

    .stat-card.in {
      border-left-color: #10b981;
    }

    .stat-card.out {
      border-left-color: #f59e0b;
    }

    .stat-card h3 {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    /* Bản đồ và chi tiết */
    .map-and-details-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 32px;
    }

    .map-section h3, .details-section h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }

    .map-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    /* Địa điểm */
    .locations-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .location-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .location-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .location-header h4 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .location-stats {
      display: flex;
      gap: 16px;
    }

    .stat-item {
      font-size: 14px;
      color: #6b7280;
    }

    .stat-item.in {
      color: #10b981;
    }

    .stat-item.out {
      color: #f59e0b;
    }

    /* Camera */
    .cameras-section h5 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .cameras-grid {
      display: grid;
      gap: 12px;
    }

    .camera-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .camera-card:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .camera-card.selected {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .camera-info {
      flex: 1;
    }

    .camera-sn {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .camera-coords {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .camera-stats {
      display: flex;
      gap: 16px;
    }

    .camera-stat {
      text-align: center;
      min-width: 50px;
    }

    .camera-stat .label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }

    .camera-stat .value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .camera-stat.in .value {
      color: #10b981;
    }

    .camera-stat.out .value {
      color: #f59e0b;
    }

    @media (max-width: 1024px) {
      .map-and-details-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .locations-grid {
        grid-template-columns: 1fr;
      }
      
      .location-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .camera-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .camera-stats {
        width: 100%;
        justify-content: space-around;
      }
    }
  `]
})
export class LuuLuongRaVaoComponent implements OnInit, AfterViewInit {
  @ViewChild('mapComponent') mapComponent!: GoogleMapComponent;

  trafficData: TrafficFlowData | null = null;
  selectedCamera: CameraInfo | null = null;
  defaultCenter = { lat: 15.0, lng: 105.0 }; // Trung tâm Việt Nam
  mapUpdateTrigger = 0; // Trigger để force update bản đồ

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadTrafficData();
  }

  ngAfterViewInit() {
    console.log('Map component initialized:', this.mapComponent);
  }

  private loadTrafficData() {
    // Dữ liệu mẫu - trong thực tế sẽ gọi từ service
    this.trafficData = {
      "success": true,
      "code": "100",
      "message": null,
      "data": {
        "total": 108233,
        "totalIn": 51956,
        "locations": [
          {
            "cameraInfo": [
              {
                "latitude": 10.162959876433863,
                "longitude": 103.99798100890551,
                "total": 55689,
                "totalIn": 0,
                "totalOut": 55689,
                "cameraSn": "ACVN248240000066"
              },
              {
                "latitude": 10.15863,
                "longitude": 104.002144,
                "total": 51956,
                "totalIn": 51956,
                "totalOut": 0,
                "cameraSn": "ACVN248240000098"
              }
            ],
            "location": "Sân bay",
            "total": 107645,
            "totalIn": 51956,
            "totalOut": 55689
          },
          {
            "cameraInfo": [
              {
                "latitude": 21.030194980619505,
                "longitude": 105.78293616746109,
                "total": 588,
                "totalIn": 0,
                "totalOut": 588,
                "cameraSn": "ACVN248240000028"
              }
            ],
            "location": "Duy Tân",
            "total": 588,
            "totalIn": 0,
            "totalOut": 588
          }
        ],
        "totalOut": 56277
      }
    };
  }

  selectCamera(camera: CameraInfo) {
    console.log('📍 Selecting camera:', camera.cameraSn, 'at', camera.latitude, camera.longitude);
    
    // Cập nhật selectedCamera - Angular binding sẽ tự động cập nhật các input properties
    this.selectedCamera = { ...camera }; // Tạo object mới để trigger change detection
    
    console.log('🗺️ Map will update to zoom:', 18, 'and center:', camera.latitude, camera.longitude);
  }
}
