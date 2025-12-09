# Filter Menu Items Constants

Quản lý tập trung các filter menu items được sử dụng trong ứng dụng.

## ⚠️ Lưu ý quan trọng

**KHÔNG được thay đổi thuộc tính `value`** vì đây là API search keys riêng biệt từ backend. Mỗi component có API keys riêng và không dùng chung.

## Cách sử dụng

### 1. Import constants

```typescript
import { MENU_ITEM_SETS, FilterMenuItem } from '../../shared/constants/filter-menu-items';
```

### 2. Sử dụng predefined sets

```typescript
export class YourComponent {
  // Sử dụng set có sẵn cho component tương ứng
  menuItems: FilterMenuItem[] = MENU_ITEM_SETS.CAMERA_LIST;
  
  // Hoặc
  menuItems = MENU_ITEM_SETS.EVENT_INFO;
}
```

### 3. Tạo custom menu items cho component mới

```typescript
// Trong component mới, tạo menu items với API keys riêng từ BE
export class NewComponent {
  menuItems: FilterMenuItem[] = [
    { label: 'Tên', value: 'newApiKeyFromBE', key: 'N', shortcutKey: 'n', icon: 'name' },
    { label: 'Mã', value: 'anotherApiKey', key: 'M', shortcutKey: 'm', icon: 'code' },
  ];
}
```

### 4. Thêm menu items set mới

Để thêm set cho component mới, cập nhật trong file `filter-menu-items.ts`:

```typescript
export const MENU_ITEM_SETS = {
  // ... existing sets
  
  // New component set với API keys riêng từ backend
  NEW_COMPONENT: [
    { label: 'Label', value: 'backendApiKey', key: 'K', shortcutKey: 'k', icon: 'icon-name' },
  ],
};
```

## Available Sets

- `MENU_ITEM_SETS.CAMERA_LIST` - Cho camera list page
- `MENU_ITEM_SETS.EVENT_INFO` - Cho event info page  
- `MENU_ITEM_SETS.DASHBOARD` - Cho dashboard page

## Interface

```typescript
interface FilterMenuItem {
  label: string;      // Hiển thị trong dropdown
  value: string;      // Giá trị gửi API
  key: string;        // Phím tắt (uppercase)
  shortcutKey: string; // Phím tắt (lowercase)
  icon: string;       // Icon name
}
```

## Keyboard Shortcuts

### Cách implement trong component

Để thêm keyboard shortcuts cho component sử dụng FilterSearchBarComponent:

```typescript
import { Component, ViewChild, HostListener } from '@angular/core';
import { FilterSearchBarComponent } from '../../shared/filter-search-bar/filter-search-bar.component';
import { MENU_ITEM_SETS, KeyboardShortcutHandler } from '../../shared/constants';

export class YourComponent {
  @ViewChild(FilterSearchBarComponent) filterSearchBar!: FilterSearchBarComponent;
  menuItems = MENU_ITEM_SETS.YOUR_SET;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    KeyboardShortcutHandler.handleKeyboardEvent(
      event, 
      this.menuItems, 
      (menuItem) => this.selectOptionAndFocusInput(menuItem)
    );
  }

  selectOptionAndFocusInput(menuItem: any) {
    if (!this.filterSearchBar) {
      console.warn('FilterSearchBar component not found');
      return;
    }
    
    this.filterSearchBar.selectByKey(menuItem.key);
    KeyboardShortcutHandler.logShortcutActivation(menuItem);
  }
}
```

### Available shortcuts

Mỗi menu item có keyboard shortcut tương ứng:
- `N` - Tên camera
- `M` - Serial Number  
- `I` - ID
- `L` - Location
- `S` - Status
- `E` - Event Type
- `Y` - Year
- `T` - Time

Khi user nhấn phím tắt, sẽ tự động select option và focus vào input search.

### Components đã implement keyboard shortcuts

- ✅ `camera-list.component.ts` - N, M, I
- ✅ `event-info.component.ts` - N, M, I, L, S