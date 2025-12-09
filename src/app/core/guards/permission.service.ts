import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissions: Set<string> = new Set();

  constructor() {
    const stored = sessionStorage.getItem('permissions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.permissions = new Set(parsed);
        }
      } catch (e) {
        console.error('PermissionService: parse lỗi', e);
      }
    }
  }

  has(permission: string): boolean {
    return this.permissions.has(permission);
  }

  hasAny(...perms: string[]): boolean {
    return perms.some(p => this.permissions.has(p));
  }

  hasAll(...perms: string[]): boolean {
    return perms.every(p => this.permissions.has(p));
  }

  getAll(): string[] {
    return Array.from(this.permissions);
  }
}
