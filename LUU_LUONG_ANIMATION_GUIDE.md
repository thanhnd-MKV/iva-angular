# Guide: Áp dụng Animation cho Lưu Lượng Ra Vào

## 1. Update Imports (line 1)
```typescript
import { Component, OnInit, ViewChild, ViewChildren, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, QueryList } from '@angular/core';
import { SSEService } from '../../core/services/sse.service';
```

## 2. Add to constructor
```typescript
constructor(
  // ... existing params
  private sseService: SSEService
) {}
```

## 3. Add Properties (after @ViewChild declarations ~line 35)
```typescript
@ViewChildren('digitSpan', { read: ElementRef }) digitSpans?: QueryList<ElementRef>;

// SSE
private sseSubscription: Subscription | null = null;
private readonly SSE_CHANNEL = 'pedestrianTraffic';

// Animation properties
summaryDisplayValues: number[] = [0, 0, 0];
cardDigits: { digit: string; animate: boolean; key: number }[][] = [[], [], []];
animationTrigger = 0;
```

## 4. Update summaryCards (line ~97)
```typescript
summaryCards = [
  { title: 'Tổng số lượt đến và đi', value: 0, change: 0, isPositive: true, color: 'blue' },
  { title: 'Tổng số lượt đến', value: 0, change: 0, isPositive: true, color: 'green' },
  { title: 'Tổng số lượt rời đi', value: 0, change: 0, isPositive: false, color: 'purple' }
];
```

## 5. Add Animation Methods (add after existing methods)
```typescript
// TrackBy functions
trackByCardIndex(index: number, card: any): number {
  return index;
}

getCardDigits(cardIndex: number): { digit: string; animate: boolean; key: number }[] {
  return this.cardDigits[cardIndex] || [];
}

trackByDigit(index: number, item: any): any {
  return item.key || index;
}

// Initialize digit arrays
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

// Update card with animation
private updateSummaryCardValue(cardIndex: number, newValue: number): void {
  const oldValue = this.summaryCards[cardIndex].value;
  
  if (oldValue !== newValue && typeof oldValue === 'number') {
    this.summaryCards[cardIndex].value = newValue;
    this.animateNumberDigits(cardIndex, oldValue, newValue);
    this.cdr.detectChanges();
  }
}

// Animate digits
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
```

## 6. Add SSE Connection (in ngOnInit)
```typescript
ngOnInit(): void {
  // Initialize animation
  this.initializeCardDigits();
  
  // ... existing code ...
  
  // Connect SSE for real-time updates
  setTimeout(() => this.connectSSE(), 100);
}

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
  
  // Update summary cards with animation
  if (data.totalIn !== undefined && data.totalOut !== undefined) {
    const total = data.totalIn + data.totalOut;
    this.updateSummaryCardValue(0, total);
    this.updateSummaryCardValue(1, data.totalIn);
    this.updateSummaryCardValue(2, data.totalOut);
  }
  
  // Update charts if needed
  // ... add chart update logic based on your SSE data structure
}
```

## 7. Update ngOnDestroy
```typescript
ngOnDestroy(): void {
  // Disconnect SSE
  if (this.sseSubscription) {
    this.sseSubscription.unsubscribe();
    this.sseSubscription = null;
  }
  this.sseService.disconnect(this.SSE_CHANNEL);
  
  // ... existing cleanup code ...
}
```

## 8. Update HTML Template (luu-luong-ra-vao.component.html)
Find the summary cards section and update to:
```html
<div class="summary-card" [ngClass]="'summary-card-' + card.color" 
     *ngFor="let card of summaryCards; let i = index; trackBy: trackByCardIndex">
  <div class="summary-header">
    <span class="summary-title">{{ card.title }}</span>
  </div>
  <div class="summary-body">
    <span class="summary-value" *ngIf="typeof card.value === 'number'">
      <span 
        #digitSpan
        *ngFor="let digitObj of getCardDigits(i); trackBy: trackByDigit; let digitIndex = index"
        class="digit"
        [class.digit-animate]="digitObj.animate"
        [attr.data-trigger]="animationTrigger"
        [attr.data-animate]="digitObj.animate"
      >{{ digitObj.digit }}</span>
    </span>
    <span class="summary-value" *ngIf="typeof card.value === 'string'">{{ card.value }}</span>
    <span class="summary-change" [class.positive]="card.isPositive" [class.negative]="!card.isPositive">
      <mat-icon class="change-icon">{{ card.isPositive ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
      {{ card.change }}%
    </span>
  </div>
</div>
```

## 9. Update SCSS (luu-luong-ra-vao.component.scss)
Add digit animation styles (same as doi-tuong-nhan-dien):
```scss
.summary-value {
  font-size: 24px;
  display: inline-flex;
  align-items: center;
  gap: 0;
  font-weight: 700;
  color: #333;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  
  ::ng-deep .digit {
    display: inline-block;
    min-width: 15px;
    text-align: center;
    position: relative;
    overflow: hidden;
    height: 1em;
    line-height: 1em;
  }
}
```

## Notes
- Animation đã được định nghĩa global trong `styles.css` nên không cần copy lại
- SSE endpoint: `/sse/admin/notification/connect?name=pedestrianTraffic`
- Khi chuyển màn, ngOnDestroy sẽ tự động disconnect SSE
- Adjust `handleSSEDataUpdate()` logic based on actual SSE data structure from backend
