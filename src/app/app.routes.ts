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
        path: 'thong-ke/person-recognition',
        title: 'Person Recognition',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:person-recognition'] },
        loadComponent: () => import('./pages/statistics/person-recognition.component').then(m => m.PersonRecognitionComponent)
      },
      {
        path: 'thong-ke/entry-exit-flow',
        title: 'Entry Exit Flow',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:entry-exit-flow'] },
        loadComponent: () => import('./pages/statistics/entry-exit-flow.component').then(m => m.EntryExitFlowComponent)
      },
      {
        path: 'thong-ke/traffic-flow',
        title: 'Traffic Flow',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:traffic-flow'] },
        loadComponent: () => import('./pages/statistics/traffic-flow.component').then(m => m.TrafficFlowComponent)
      },
      {
        path: 'thong-ke/traffic-violation',
        title: 'Traffic Violation',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['thong-ke:traffic-violation'] },
        loadComponent: () => import('./pages/statistics/traffic-violation.component').then(m => m.TrafficViolationComponent)
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
        path: 'object-management',
        title: 'Quản lý đối tượng',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['object-management'] },
        loadComponent: () => import('./pages/object-management/object-list.component').then(m => m.ObjectListComponent)
      },
      {
        path: 'object-management/detail/:id',
        title: 'Chi tiết đối tượng',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['object-management:detail'] },
        loadComponent: () => import('./pages/object-management/object-detail.component').then(m => m.ObjectDetailComponent)
      },
      {
        path: 'object-management/add',
        title: 'Thêm mới đối tượng',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['object-management:add'] },
        loadComponent: () => import('./pages/object-management/object-form.component').then(m => m.ObjectFormComponent)
      },
      {
        path: 'object-management/edit/:id',
        title: 'Chỉnh sửa đối tượng',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['object-management:edit'] },
        loadComponent: () => import('./pages/object-management/object-form.component').then(m => m.ObjectFormComponent)
      },
      {
        path: 'object-management/events/:id',
        title: 'Truy vết sự kiện',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['object-management:events'] },
        loadComponent: () => import('./pages/object-management/object-events.component').then(m => m.ObjectEventsComponent)
      },
      {
        path: 'notification-test',
        title: 'Test SSE Notification',
        // canActivate: [PermissionGuard],
        // data: { permissions: ['dev'] },
        loadComponent: () => import('./pages/notification-test/notification-test.component').then(m => m.NotificationTestComponent)
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
