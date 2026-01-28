import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input() appCountUp: number = 0;
  @Input() duration: number = 800; // Animation duration in ms
  @Input() prefix: string = '';
  @Input() suffix: string = '';

  private animationFrameId?: number;
  private currentDisplayValue: number = 0;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appCountUp']) {
      const currentValue = changes['appCountUp'].currentValue || 0;
      
      console.log('🔢 CountUp change detected:', { 
        previousValue: changes['appCountUp'].previousValue, 
        currentValue, 
        isFirstChange: changes['appCountUp'].firstChange 
      });
      
      // On first change, just set the value without animation
      if (changes['appCountUp'].firstChange) {
        this.currentDisplayValue = currentValue;
        this.el.nativeElement.textContent = `${this.prefix}${currentValue}${this.suffix}`;
        return;
      }
      
      // For subsequent changes, animate from current display value to new value
      const previousValue = this.currentDisplayValue;
      if (previousValue !== currentValue) {
        console.log('✅ Starting animation:', previousValue, '→', currentValue);
        this.animateCount(previousValue, currentValue);
      }
    }
  }

  private animateCount(start: number, end: number): void {
    // Cancel any ongoing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    console.log('🎬 Animation started - adding count-animating class');
    
    // Add animating class for CSS effects
    this.el.nativeElement.classList.add('count-animating');
    
    // Log to verify class was added
    console.log('📋 Element classes:', this.el.nativeElement.className);

    const startTime = performance.now();
    const difference = end - start;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      
      // Easing function (ease-out cubic for smooth deceleration)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.floor(start + (difference * easeProgress));
      this.currentDisplayValue = current;
      this.el.nativeElement.textContent = `${this.prefix}${current}${this.suffix}`;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        this.currentDisplayValue = end;
        this.el.nativeElement.textContent = `${this.prefix}${end}${this.suffix}`;
        this.el.nativeElement.classList.remove('count-animating');
        
        console.log('✨ Animation complete - adding count-complete class');
        
        // Add flash effect on completion
        this.el.nativeElement.classList.add('count-complete');
        console.log('📋 Element classes after complete:', this.el.nativeElement.className);
        
        setTimeout(() => {
          this.el.nativeElement.classList.remove('count-complete');
          console.log('🧹 Cleaned up count-complete class');
        }, 800);
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
