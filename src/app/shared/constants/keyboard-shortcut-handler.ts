import { FilterMenuItem } from './filter-menu-items';

/**
 * Keyboard shortcut handler utility for filter menu items
 * Sử dụng cho các component có menuItems và cần keyboard shortcuts
 */
export class KeyboardShortcutHandler {
  
  /**
   * Xử lý keyboard event và tìm menu item tương ứng
   * @param event KeyboardEvent từ @HostListener
   * @param menuItems Array of FilterMenuItem
   * @param callback Function để xử lý khi tìm thấy menu item
   * @returns boolean - true nếu xử lý thành công
   */
  static handleKeyboardEvent(
    event: KeyboardEvent, 
    menuItems: FilterMenuItem[], 
    callback: (menuItem: FilterMenuItem) => void
  ): boolean {
    // Chỉ xử lý khi không focus vào input, textarea, hoặc contenteditable
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.hasAttribute('contenteditable')
    )) {
      return false;
    }

    // Tìm menu item có key tương ứng với phím được bấm
    const pressedKey = event.key.toUpperCase();
    const menuItem = menuItems.find(item => item.key.toUpperCase() === pressedKey);
    
    if (menuItem) {
      event.preventDefault();
      callback(menuItem);
      return true;
    }
    
    return false;
  }

  /**
   * Log keyboard shortcut activation
   * @param menuItem FilterMenuItem that was activated
   */
  static logShortcutActivation(menuItem: FilterMenuItem): void {
    console.log(`Keyboard shortcut activated: ${menuItem.key} -> ${menuItem.label}`);
  }
}

/**
 * Interface cho components muốn sử dụng keyboard shortcuts
 */
export interface KeyboardShortcutComponent {
  menuItems: FilterMenuItem[];
  handleKeyboardShortcut(event: KeyboardEvent): void;
  selectOptionAndFocusInput(menuItem: FilterMenuItem): void;
}