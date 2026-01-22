import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { RouterOutlet } from '@angular/router';
import { SSEService } from '../../core/services/sse.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, HeaderComponent, RouterOutlet]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private sseSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private sseService: SSEService
  ) {}

  ngOnInit(): void {
    console.log('🏠 MainLayout initialized - connecting global SSE (ONCE)');
    
    // Connect to global SSE stream once and keep it alive
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: (notification) => {
        console.log('🔔 Global SSE notification received:', notification);
        // All components will receive this through shared stream
      },
      error: (error) => {
        console.error('❌ Global SSE error:', error);
      },
      complete: () => {
        console.log('🏁 Global SSE completed');
      }
    });
  }

  ngOnDestroy(): void {
    console.log('🧹 MainLayout destroyed - cleaning up SSE');
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
}
