import { Component, Output, EventEmitter, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserComponent } from '../user/user.component';
import { UserMiniComponent } from '../user-mini/usermini.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, MatToolbarModule,
    MatButtonModule, MatSidenavModule,
    MatIconModule, MatListModule,
    MatTooltipModule, RouterModule,
    UserComponent, UserMiniComponent,
    MatMenuModule, MatDividerModule,
    MatCardModule, MatTabsModule,
    MatExpansionModule ,
    MatSelectModule, MatFormFieldModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @Output() toggleNavbar = new EventEmitter<boolean>();
  isSidebarOpened = true;
  selectedOption: { label: string; value: string } | null = null;
  
  // Logo paths
  get logoPath(): string {
    return this.isSidebarOpened 
      ? 'logoMKsize.svg' 
      : 'logoMK.svg';
  }
  
  // Submenu state with tracking
  private _cameraSubMenuOpen = false;
  private _eventSubMenuOpen = false;
  private _statsSubMenuOpen = false;
  
  get cameraSubMenuOpen(): boolean {
    return this._cameraSubMenuOpen;
  }
  set cameraSubMenuOpen(value: boolean) {
    if (this._cameraSubMenuOpen !== value) {
      console.log(`📷 Camera menu: ${this._cameraSubMenuOpen} → ${value}`);
      this._cameraSubMenuOpen = value;
    }
  }
  
  get eventSubMenuOpen(): boolean {
    return this._eventSubMenuOpen;
  }
  set eventSubMenuOpen(value: boolean) {
    if (this._eventSubMenuOpen !== value) {
      console.log(`📋 Event menu: ${this._eventSubMenuOpen} → ${value}`);
      this._eventSubMenuOpen = value;
    }
  }
  
  get statsSubMenuOpen(): boolean {
    return this._statsSubMenuOpen;
  }
  set statsSubMenuOpen(value: boolean) {
    if (this._statsSubMenuOpen !== value) {
      console.log(`📊 Stats menu: ${this._statsSubMenuOpen} → ${value}`);
      this._statsSubMenuOpen = value;
    }
  }
  
  // Hover timers for closed sidebar
  private hoverTimer: any;
  
  // Track current route for active state
  currentRoute: string = '';
  
  options: { label: string; value: string }[] = [];
  fleetForm = {
    fleet: ''
  };
  userData:any = {
    userType: '',
    provinceId: '',
    level: '',
    groupId: '',
  };
  
  constructor(
    private http: HttpClient, 
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private sidebarService: SidebarService
  ) {
    // Force close all menus on init
    console.log('🏗️ Constructor: Initializing navbar');
    this.cameraSubMenuOpen = false;
    this.eventSubMenuOpen = false;
    this.statsSubMenuOpen = false;
    console.log('🔒 Constructor: All menus closed');
    
    // this.userData.userType = sessionStorage.getItem('userType') || '';
    // this.userData.provinceId = sessionStorage.getItem('provinceId') || '';
    // this.fleetForm.fleet = sessionStorage.getItem('fleet') || '';
    // let organizationString = sessionStorage.getItem('organization') || '';
    // let organization = {};
    // try {
    //   organization = (organizationString);
    // } catch (e) {
    //   console.error("Failed to parse organization string", e);
    // }

    // this.userData.level =  (organization as any).level || '';
    // this.userData.groupId = sessionStorage.getItem('organizationId') || '';
  }

  toggleSidebar() {
    this.isSidebarOpened = !this.isSidebarOpened;
    this.toggleNavbar.emit(this.isSidebarOpened);
    this.sidebarService.setSidebarState(this.isSidebarOpened);
    
    // Chỉ đóng submenus khi đang mở sidebar (collapse sidebar)
    if (!this.isSidebarOpened) {
      this.closeAllSubMenus();
    }

    const targetNavbar = document.getElementById('navbar');
    if (targetNavbar) {
      targetNavbar.classList.toggle('collapsed', !this.isSidebarOpened);
    }
  }

  toggleSubMenu(event: Event) {
    // Chỉ toggle khi sidebar đang mở
    if (this.isSidebarOpened) {
      const button = event.currentTarget as HTMLElement;
      const img = button.querySelector('img');
      const iconAlt = img?.getAttribute('alt');
      
      console.log('🔄 toggleSubMenu clicked:', iconAlt);
      
      // Kiểm tra xem menu này có đang mở không
      let isCurrentlyOpen = false;
      if (iconAlt === 'Camera') {
        isCurrentlyOpen = this.cameraSubMenuOpen;
      } else if (iconAlt === 'Event') {
        isCurrentlyOpen = this.eventSubMenuOpen;
      } else if (iconAlt === 'Statistics') {
        isCurrentlyOpen = this.statsSubMenuOpen;
      }
      
      console.log('📌 Current state before toggle:', isCurrentlyOpen);
      
      // Đóng tất cả menu trước
      this.closeAllSubMenus();
      
      // Nếu menu này đang đóng, thì mở nó
      if (!isCurrentlyOpen) {
        if (iconAlt === 'Camera') {
          this.cameraSubMenuOpen = true;
          console.log('✅ Opened Camera menu');
        } else if (iconAlt === 'Event') {
          this.eventSubMenuOpen = true;
          console.log('✅ Opened Event menu');
        } else if (iconAlt === 'Statistics') {
          this.statsSubMenuOpen = true;
          console.log('✅ Opened Statistics menu');
        }
      }
      
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

  onMenuHover(event: Event, isEnter: boolean) {
    // Chỉ xử lý hover khi sidebar đóng
    if (!this.isSidebarOpened) {
      const button = event.currentTarget as HTMLElement;
      const img = button.querySelector('img');
      const iconAlt = img?.getAttribute('alt');

      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
      }

      if (isEnter) {
        // Đóng tất cả menu khác trước
        this.closeAllSubMenus();
        
        // Mở menu hiện tại
        if (iconAlt === 'Camera') {
          this.cameraSubMenuOpen = true;
        } else if (iconAlt === 'Event') {
          this.eventSubMenuOpen = true;
        } else if (iconAlt === 'Statistics') {
          this.statsSubMenuOpen = true;
        }
      } else {
        // Đợi 300ms trước khi ẩn
        this.hoverTimer = setTimeout(() => {
          if (iconAlt === 'Camera') {
            this.cameraSubMenuOpen = false;
          } else if (iconAlt === 'Event') {
            this.eventSubMenuOpen = false;
          } else if (iconAlt === 'Statistics') {
            this.statsSubMenuOpen = false;
          }
        }, 300);
      }
    }
  }

  onSubmenuHover(event: Event, isEnter: boolean) {
    // Giữ menu mở khi hover vào submenu (sidebar đóng)
    if (!this.isSidebarOpened) {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
      }

      if (!isEnter) {
        // Đợi 300ms trước khi ẩn khi rời khỏi submenu
        this.hoverTimer = setTimeout(() => {
          this.cameraSubMenuOpen = false;
          this.eventSubMenuOpen = false;
          this.statsSubMenuOpen = false;
        }, 300);
      }
    }
  }

  closeMenuOnClick() {
    this.closeAllSubMenus();
    this.cdr.detectChanges();
  }

  closeCameraMenu() {
    this.cameraSubMenuOpen = false;
  }

  closeEventMenu() {
    this.eventSubMenuOpen = false;
  }

  closeStatsMenu() {
    this.statsSubMenuOpen = false;
  }

  closeAllSubMenus() {
    console.log('🔒 Closing all submenus');
    this.cameraSubMenuOpen = false;
    this.eventSubMenuOpen = false;
    this.statsSubMenuOpen = false;
    console.log('📊 Menu states:', {
      camera: this.cameraSubMenuOpen,
      event: this.eventSubMenuOpen,
      stats: this.statsSubMenuOpen
    });
  }

  toggleMenu() {
    this.isSidebarOpened = !this.isSidebarOpened;
    this.toggleNavbar.emit(this.isSidebarOpened);
  }

  onOptionSelected(event: any) { 
    console.log('Selected option:', event);
  }

  isDashboardActive(): boolean {
    return this.currentRoute === '/dashboard';
  }

  isStatisticsActive(): boolean {
    return this.currentRoute.includes('/thong-ke-su-kien');
  }

  ngAfterViewInit() {
    // Subscribe to route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
      console.log('🛣️ Route changed to:', this.currentRoute);
      
      // Tự động mở submenu nếu route hiện tại thuộc submenu đó (chỉ khi sidebar mở)
      if (this.isSidebarOpened) {
        console.log('📂 Sidebar is open, checking which menu to open...');
        // Đóng tất cả trước
        this.closeAllSubMenus();
        
        // Mở menu tương ứng với route
        if (this.isCameraRouteActive()) {
          console.log('📷 Opening Camera menu (route matches /camera)');
          this.cameraSubMenuOpen = true;
        } else if (this.isEventRouteActive()) {
          console.log('📝 Opening Event menu (route matches /event)');
          this.eventSubMenuOpen = true;
        } else if (this.isStatsRouteActive()) {
          console.log('📊 Opening Stats menu (route matches /thong-ke)');
          this.statsSubMenuOpen = true;
        } else {
          console.log('❌ No menu matches current route');
        }
      } else {
        console.log('📁 Sidebar is closed, closing all menus');
        // Đóng tất cả khi sidebar đóng
        this.closeAllSubMenus();
      }
      this.cdr.detectChanges();
    });

    // Initial route check và mở submenu tương ứng - wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.currentRoute = this.router.url;
      console.log('🎯 Initial route:', this.currentRoute);
      console.log('🚪 Sidebar opened?', this.isSidebarOpened);
      if (this.isSidebarOpened) {
        console.log('📂 Sidebar is open on init, checking which menu to open...');
        // Đóng tất cả trước
        this.closeAllSubMenus();
        
        // Mở menu tương ứng với route
        if (this.isCameraRouteActive()) {
          console.log('📷 Opening Camera menu (initial route matches /camera)');
          this.cameraSubMenuOpen = true;
        } else if (this.isEventRouteActive()) {
          console.log('📝 Opening Event menu (initial route matches /event)');
          this.eventSubMenuOpen = true;
        } else if (this.isStatsRouteActive()) {
          console.log('📊 Opening Stats menu (initial route matches /thong-ke)');
          this.statsSubMenuOpen = true;
        } else {
          console.log('❌ No menu matches initial route');
        }
      }
      this.cdr.detectChanges();
    }, 0);
  }

  initUserData() {
    let userData =  window.sessionStorage.getItem('user');
    if (userData) {
      try {
        this.userData = JSON.parse(userData);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    } else {
      console.error("User data not found in sessionStorage");
    }
  }

  async handleFleetChange(val: string): Promise<void> {
    this.fleetForm.fleet = val;

    console.log('this.userData',this.userData.organization.level);

    if (this.userData.organization.level === 4) {
      sessionStorage.setItem('fleet', this.fleetForm.fleet);

      try {
        const resp: any = await this.http.post(`/api/sessions/selectOrganization`, 
          {
          groupId: this.userData.organizationId,
          provinceId: this.userData.organization.parentId
        }
      ).toPromise();

        if (resp.success) {
          // window.location.reload(); 
        } else {
        }
      } catch (error) {
        console.error('API error:', error);
      }
    }
    else if (this.userData.organization.level === 3) {
      sessionStorage.setItem('fleet', this.fleetForm.fleet);
      try {
         const resp: any = await this.http.post(`/api/sessions/selectOrganization`, 
          {
          provinceId: this.userData.organizationId,
        }).toPromise();

        if (resp.success) {
          // window.location.reload(); 
        } else {
        }
      } catch (error) {
        console.error('API error:', error);
      }
    }
  }

  async getPermissionsTag () {
      try {
        const resp: any = await this.http.get('/api/sessions/permission/tag').toPromise();
        if (resp.success) {
        } else {
        }
      } catch (error) {
        console.error('API error:', error);
      }
  }

  async getTree() { 
    let organizationId = this.userData.organizationId;
      try {
        const resp: any = await this.http.get(`/api/admin/organization/tree/${organizationId}`).toPromise();
        if (resp.success) {
        } else {
        }
      } catch (error) {
        console.error('API error:', error);
      }
  }

  // Check if camera route is active
  isCameraRouteActive(): boolean {
    return this.currentRoute.startsWith('/camera');
  }
  
  // Check if event route is active
  isEventRouteActive(): boolean {
    return this.currentRoute.startsWith('/event');
  }

  // Check if stats route is active
  isStatsRouteActive(): boolean {
    return this.currentRoute.startsWith('/thong-ke');
  }

  ngOnInit():void {
    this.options = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' }
    ];
    this.initUserData();

    console.log('this.user:', this.userData.organizationId);
    this.selectedOption = this.options[0]; 
    // this.getTree()
    this.handleFleetChange(this.fleetForm.fleet);
    this.getPermissionsTag();
    this.getTree();
    
    // Track current route for active state
    this.currentRoute = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

}
