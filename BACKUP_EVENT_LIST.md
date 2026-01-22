# Backup Event List Code - 23/01/2026

## Routes Configuration (app.routes.ts)

```typescript
{
  path: 'event/all',
  title: 'Tất cả sự kiện',
  loadComponent: () => import('./pages/event/event-list.component').then(m => m.EventListComponent)
},
{
  path: 'event/person',
  title: 'Đối tượng người',
  loadComponent: () => import('./pages/event/person-event.component').then(m => m.PersonEventComponent)
},
{
  path: 'event/traffic',
  title: 'Giao thông',
  loadComponent: () => import('./pages/event/traffic-event.component').then(m => m.TrafficEventComponent)
},
{
  path: 'event/detail/:id',
  title: 'Chi tiết Sự kiện',
  loadComponent: () => import('./pages/event/event-detail-page.component').then(m => m.EventDetailPageComponent)
}
```

## Event List Components Available

1. **event-list.component.ts** - Tất cả sự kiện
2. **person-event.component.ts** - Đối tượng người  
3. **traffic-event.component.ts** - Giao thông
4. **event-detail-page.component.ts** - Chi tiết sự kiện

## Issue: Notification Still Shows "Under Development"

**Location:** `src/app/shared/components/user/user.component.html`

**Problem Line:**
```html
<button class="notification-bell" (click)="$event.stopPropagation(); underDevService.showFeature('Thông Báo')">
```

**Status:** Routes hoạt động bình thường, nhưng notification button vẫn gọi underDevService

## Solution

Cần thay đổi notification button để navigate đến trang notification thật thay vì hiển thị under development dialog.
