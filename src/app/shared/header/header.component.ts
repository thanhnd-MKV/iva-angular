import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class HeaderComponent implements OnInit {
  pageTitle = 'Trang mặc định';
  parentTitle = '';
  currentTime = '';
  currentDate = '';
  eventId = ''; // Event ID for detail page
  isEventDetailPage = false; // Flag to show event ID
  isObjectManagementPage = false; // Flag for object management pages

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);

    // Gọi lấy title lần đầu khi load (F5)
    this.updateBreadcrumb();

    // Cập nhật title khi route thay đổi (không F5)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumb();
      });
  }

  updateDateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.currentDate = now.toLocaleDateString('vi-VN');
  }

  updateBreadcrumb() {
    const route = this.route;
    this.pageTitle = this.getTitleFromRoute(route);
    this.parentTitle = this.getParentTitle(this.router.url);
    
    // Check if it's event detail page and extract event ID
    this.isEventDetailPage = this.router.url.includes('/event/detail/');
    if (this.isEventDetailPage) {
      const urlParts = this.router.url.split('/');
      this.eventId = urlParts[urlParts.length - 1] || '';
    } else {
      this.eventId = '';
    }
    
    // Check if it's object management page (not the list page itself)
    this.isObjectManagementPage = this.router.url.includes('/object-management/') && !this.router.url.endsWith('/object-management');
    
    this.titleService.setTitle(this.pageTitle);
  }

  getTitleFromRoute(route: ActivatedRoute): string {
    while (route.firstChild) {
      route = route.firstChild;
    }
    const titleFromData = route.snapshot.data['title'] || route.snapshot.title;
    return titleFromData || 'Trang mặc định';
  }

  getParentTitle(url: string): string {
    if (url.includes('/event/')) {
      return 'Quản lý sự kiện';
    } else if (url.includes('/thong-ke/')) {
      return 'Thống kê sự kiện';
    } else if (url.includes('/camera/')) {
      return 'Camera';
    } else if (url.includes('/object-management/')) {
      return 'Danh sách đối tượng';
    } else if (url === '/dashboard') {
      return '';
    }
    return '';
  }

  // Navigate back to previous page using browser history or specific route
  navigateToParent() {
    if (this.isObjectManagementPage) {
      this.router.navigate(['/object-management']);
    } else {
      this.location.back();
    }
  }
}
