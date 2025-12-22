import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

import { AuthGuard } from './core/guards/auth.guard';
import { PermissionGuard } from './core/guards/permission.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        canActivate: [PermissionGuard],
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: {
          // permissions: ['dashboard']
        }
      },
      {
        path: 'camera',
        title: 'Camera',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['camera'] },
        loadComponent: () => import('./pages/camera/camera-root.component').then(m => m.CameraRootComponent)
      },
      {
        path: 'camera/list',
        title: 'Camera List',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['camera:cameralist'] },
        loadComponent: () => import('./pages/camera/camera-list.component').then(m => m.CameraListComponent)
      },
      {
        path: 'camera/setting',
        title: 'Camera Setting',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['camera:setting'] },
        loadComponent: () => import('./pages/camera-config/camera-config.component').then(m => m.CameraConfigComponent)
      },
      {
        path: 'event/all',
        title: 'Tất cả sự kiện',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['event:all'] },
        loadComponent: () => import('./pages/event/event-list.component').then(m => m.EventListComponent)
      },
      {
        path: 'event/person',
        title: 'Đối tượng người',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['event:person'] },
        loadComponent: () => import('./pages/event/person-event.component').then(m => m.PersonEventComponent)
      },
      {
        path: 'event/traffic',
        title: 'Giao thông',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['event:traffic'] },
        loadComponent: () => import('./pages/event/traffic-event.component').then(m => m.TrafficEventComponent)
      },
      {
        path: 'thong-ke/doi-tuong-nhan-dien',
        title: 'Đối tượng nhận diện',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:doi-tuong-nhan-dien'] },
        loadComponent: () => import('./pages/statistics/doi-tuong-nhan-dien.component').then(m => m.DoiTuongNhanDienComponent)
      },
      {
        path: 'thong-ke/luu-luong-ra-vao',
        title: 'Lưu lượng ra vào',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:luu-luong-ra-vao'] },
        loadComponent: () => import('./pages/statistics/luu-luong-ra-vao.component').then(m => m.LuuLuongRaVaoComponent)
      },
      {
        path: 'thong-ke/luu-luong-giao-thong',
        title: 'Lưu lượng giao thông',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:luu-luong-giao-thong'] },
        loadComponent: () => import('./pages/statistics/luu-luong-giao-thong.component').then(m => m.LuuLuongGiaoThongComponent)
      },
      {
        path: 'thong-ke/vi-pham-giao-thong',
        title: 'Vi phạm giao thông',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:vi-pham-giao-thong'] },
        loadComponent: () => import('./pages/statistics/vi-pham-giao-thong.component').then(m => m.ViPhamGiaoThongComponent)
      },
      {
        path: 'event/detail/:id',
        title: 'Chi tiết Sự kiện',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['event:info'] },
        loadComponent: () => import('./pages/event/event-detail-page.component').then(m => m.EventDetailPageComponent)
      },      
      {
        path: 'event/photo-gallery',
        title: 'Thư viện ảnh',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['event:info'] },
        loadComponent: () => import('./pages/violation-data/violation-screen.component').then(m => m.ViolationScreenComponent)
      },
      {
        path: '404',
        title: 'Not Found',
        component: NotFoundComponent
      },
      {
        path: '',
        title: 'Dashboard',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: '**',
        redirectTo: '404'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
