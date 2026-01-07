# Real-time Chart Update Guide

## ✅ Đã hoàn thành:
1. ✅ **Đối tượng nhận dạng** (doi-tuong-nhan-dien) - FULL implementation
2. ✅ **Lưu lượng ra vào** (luu-luong-ra-vao) - FULL implementation

## 🔄 Cần làm tiếp:
3. ⏳ **Lưu lượng giao thông** (luu-luong-giao-thong) - Partial
4. ⏳ **Vi phạm giao thông** (vi-pham-giao-thong) - Not started

---

## 📋 Checklist cho mỗi component:

### 1. TypeScript Component (.ts)

#### A. Imports
```typescript
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
```

#### B. Component Decorator
```typescript
@Component({
  selector: 'app-xxx',
  // ... other properties
  changeDetection: ChangeDetectionStrategy.OnPush  // ADD THIS
})
export class XXXComponent implements OnInit, OnDestroy {  // Ensure OnDestroy
```

#### C. ViewChild References
```typescript
@ViewChild('lineChart') lineChart?: BaseChartDirective;
@ViewChild('barChart') barChart?: BaseChartDirective;
@ViewChild('donutChart') donutChart?: BaseChartDirective;
// Add for whatever charts you have
```

#### D. Fake Data Properties
```typescript
// Fake data for testing
public useFakeData = true;
private fakeDataInterval: any;
private baseData: any = null;  // Structure depends on your data
```

#### E. Chart Options - Disable Animation
```typescript
lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,  // ADD THIS LINE
  // ... rest of options
};

barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,  // ADD THIS LINE
  // ... rest of options
};
```

#### F. ngOnInit - Start Fake Data
```typescript
ngOnInit(): void {
  // ... existing init code
  
  // ADD AT END:
  if (this.useFakeData) {
    console.log('🎬 [ComponentName]: Starting fake data stream...');
    setTimeout(() => this.startFakeDataStream(), 1000);
  }
}
```

#### G. ngOnDestroy - Cleanup
```typescript
ngOnDestroy(): void {
  // ... existing cleanup
  
  // ADD:
  if (this.fakeDataInterval) {
    clearInterval(this.fakeDataInterval);
    console.log('🛑 [ComponentName]: Stopped fake data stream');
  }
}
```

#### H. Fake Data Methods (add at end of class)
```typescript
// ===== FAKE DATA METHODS =====

private generateFakeData(): YourDataType {
  if (!this.baseData) {
    // Initialize base data structure
    this.baseData = {
      // Generate initial realistic data
    };
  }

  // Create variations (±10%)
  const updatedData = {
    // Apply small random variations to baseData
  };

  // Update baseData for next iteration
  this.baseData = updatedData;
  return updatedData;
}

private getTimeMultiplier(hour: number): number {
  if (hour >= 0 && hour < 6) return 0.3;   // Night
  if (hour >= 6 && hour < 9) return 1.3;   // Morning rush
  if (hour >= 9 && hour < 17) return 1.0;  // Day
  if (hour >= 17 && hour < 20) return 1.4; // Evening rush
  return 0.7;                              // Evening
}

private startFakeDataStream(): void {
  const fakeData = this.generateFakeData();
  this.updateChartsWithFakeData(fakeData);
  console.log('📊 [ComponentName]: Initial fake data loaded');

  this.fakeDataInterval = setInterval(() => {
    const newData = this.generateFakeData();
    this.updateChartsWithFakeData(newData);
    console.log('🔄 [ComponentName]: Updated at', new Date().toLocaleTimeString());
  }, 2000);
}

private updateChartsWithFakeData(data: YourDataType): void {
  // Update each chart directly via instance
  if (this.lineChart?.chart) {
    this.lineChart.chart.data.datasets[0].data = data.someArray;
    this.lineChart.chart.update('none');  // 'none' = no animation
  }

  if (this.barChart?.chart) {
    this.barChart.chart.data.datasets[0].data = data.otherArray;
    this.barChart.chart.update('none');
  }

  // Update summary cards if any
  // this.summaryCards[0].value = ...

  // Trigger change detection for OnPush
  this.cdr.markForCheck();
}

public stopFakeDataStream(): void {
  if (this.fakeDataInterval) {
    clearInterval(this.fakeDataInterval);
    this.fakeDataInterval = null;
    this.useFakeData = false;
    console.log('🛑 [ComponentName]: Fake data stream stopped');
  }
}

public startFakeDataStreamManually(): void {
  if (!this.fakeDataInterval) {
    this.useFakeData = true;
    this.startFakeDataStream();
    console.log('▶️ [ComponentName]: Fake data stream started manually');
  }
}
```

---

### 2. HTML Template (.html)

#### A. Add Template References to Charts
```html
<!-- Line Chart -->
<canvas #lineChart baseChart 
  [data]="lineChartData" 
  [options]="lineChartOptions" 
  type="line">
</canvas>

<!-- Bar Chart -->
<canvas #barChart baseChart 
  [data]="barChartData" 
  [options]="barChartOptions" 
  type="bar">
</canvas>

<!-- Donut Chart -->
<canvas #donutChart baseChart 
  [data]="donutChartData" 
  [options]="donutChartOptions" 
  type="doughnut">
</canvas>
```

#### B. Add Toggle Button
```html
<div class="filter-right">
  <!-- ADD THIS BUTTON -->
  <button class="fake-data-btn" 
          [class.active]="useFakeData" 
          (click)="useFakeData ? stopFakeDataStream() : startFakeDataStreamManually()"
          title="Toggle fake data stream for testing">
    <mat-icon class="btn-icon">{{ useFakeData ? 'stop_circle' : 'play_circle' }}</mat-icon>
    <span>{{ useFakeData ? 'Stop Demo' : 'Start Demo' }}</span>
  </button>
  
  <!-- Existing export button -->
  <button class="export-btn" (click)="exportReport()">
    <mat-icon class="btn-icon">download</mat-icon>
    <span>Xuất báo cáo</span>
  </button>
</div>
```

---

### 3. SCSS Styles (.scss)

Add these styles (only once per file):

```scss
.fake-data-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  .btn-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  &.active {
    background: #fef3c7;
    border-color: #fbbf24;
    color: #92400e;
    
    .btn-icon {
      color: #d97706;
      animation: pulse 2s ease-in-out infinite;
    }
    
    &:hover {
      background: #fde68a;
      border-color: #f59e0b;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

// Responsive
@media (max-width: 768px) {
  .fake-data-btn {
    padding: 5px 10px;
    font-size: 12px;
    
    span {
      display: none; // Only show icon on mobile
    }
  }
}
```

---

## 🎯 Testing Checklist:

1. ✅ Console shows: "🎬 Starting fake data stream..."
2. ✅ Console shows: "📊 Initial fake data loaded"
3. ✅ Console shows: "🔄 Updated at [time]" every 2 seconds
4. ✅ Charts update smoothly without flicker
5. ✅ Button shows "Stop Demo" when active (yellow background)
6. ✅ Button shows "Start Demo" when inactive (white background)
7. ✅ Click Stop → stream stops
8. ✅ Click Start → stream resumes
9. ✅ Navigate away → stream stops (ngOnDestroy)

---

## 🐛 Common Issues:

### Charts not updating:
- Check ViewChild names match template references
- Ensure `chart.update('none')` is called
- Verify `animation: false` in options

### Data still jumpy/flickering:
- Make sure `animation: false` in ALL chart options
- Check `.update('none')` not `.update()`
- Verify OnPush strategy is set

### Button not working:
- Check methods exist: `stopFakeDataStream()`, `startFakeDataStreamManually()`
- Verify `useFakeData` property exists
- Check SCSS includes `.fake-data-btn` styles

### Memory leaks:
- Ensure `ngOnDestroy()` clears interval
- Check subscriptions are unsubscribed

---

## 📝 Component-Specific Data Structures:

### Lưu lượng giao thông (Traffic Flow)
```typescript
interface TrafficData {
  motorbike: number[];  // 24 hours
  car: number[];        // 24 hours
  truck: number[];      // 24 hours
}
```

### Vi phạm giao thông (Traffic Violations)
```typescript
interface ViolationData {
  wrongLane: number[];      // 24 hours
  noHelmet: number[];       // 24 hours
  redLight: number[];       // 24 hours
  speeding: number[];       // 24 hours
}
```

---

## ✅ Implementation Priority:

1. **Lưu lượng giao thông** - Similar to lưu lượng ra vào (vehicle types instead of in/out)
2. **Vi phạm giao thông** - Multiple violation types, similar chart structure

---

Generated: 2025-12-31
Status: 2/4 components completed
