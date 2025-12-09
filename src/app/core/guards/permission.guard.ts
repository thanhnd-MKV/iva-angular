import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private permission: PermissionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required: string[] = route.data['permissions'];
    
    // Nếu không có yêu cầu permission hoặc có đủ quyền
    if (!required || required.length === 0 || this.permission.hasAny(...required)) {
      return true;
    }

    // Log để debug
    console.warn('PermissionGuard: Không có quyền truy cập', {
      required,
      userPermissions: this.permission.getAll()
    });

    // Redirect về trang 404 nếu thiếu quyền
    this.router.navigate(['/404']);
    return false;
  }
}
