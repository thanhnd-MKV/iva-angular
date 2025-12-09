import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NotificationComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  
})
export class AppComponent implements OnInit {
  title = 'IVA';
  isLoggedIn: boolean = false;
  isNavbarOpen = false;  

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
     initFlowbite();
  }


  onToggleNavbar(state: boolean) {
    this.isNavbarOpen = state;
  }
}
