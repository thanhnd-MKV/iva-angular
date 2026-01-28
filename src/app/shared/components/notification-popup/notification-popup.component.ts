import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { SSEService } from '../../../core/services/sse.service';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.css']
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private sseSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  // Virtual scrolling properties
  displayedNotifications: NotificationItem[] = [];
  private readonly ITEM_HEIGHT = 130; // Approximate height of each notification card
  private readonly BUFFER_SIZE = 10; // Increased buffer for smoother scroll
  private readonly VISIBLE_ITEMS = 10; // Number of items visible at once
  private startIndex = 0;
  private endIndex = this.VISIBLE_ITEMS + this.BUFFER_SIZE * 2;
  scrollOffset = 0;
  totalHeight = 0;
  
  // Throttle scroll updates
  private scrollTimeout: any = null;
  private rafId: number | null = null;
  private lastScrollTop = 0;

  constructor(
    public dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sseService: SSEService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🎬 [POPUP] Component initialized');
    console.log('📊 [POPUP] Initial state:', {
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      displayedCount: this.displayedNotifications.length
    });
    
    // Load notifications from API instead of localStorage
    this.loadNotificationsFromAPI();
    
    // Subscribe to notification changes
    this.subscribeToNotifications();
    
    // Subscribe to SSE for real-time updates
    this.subscribeToSSE();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    // Cleanup animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    // Cleanup scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private loadNotificationsFromAPI(): void {
    console.log('🌐 [POPUP] Loading notifications from API...');
    this.notificationService.loadNotificationsFromAPI().subscribe({
      next: (notifications) => {
        console.log('✅ [POPUP] Loaded notifications from API:', notifications.length);
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
        console.log('🔄 [POPUP] Before updateDisplayedNotifications:', {
          total: this.notifications.length,
          startIndex: this.startIndex,
          endIndex: this.endIndex
        });
        this.updateDisplayedNotifications();
        console.log('✨ [POPUP] After updateDisplayedNotifications:', {
          displayedCount: this.displayedNotifications.length,
          totalHeight: this.totalHeight,
          scrollOffset: this.scrollOffset
        });
      },
      error: (error) => {
        console.error('❌ [POPUP] Error loading notifications:', error);
        this.notifications = [];
        this.unreadCount = 0;
        this.updateDisplayedNotifications();
      }
    });
  }

  private subscribeToNotifications(): void {
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.read).length;
      console.log('🔄 [POPUP] Notifications updated:', this.notifications.length, 'unread:', this.unreadCount);
      this.updateDisplayedNotifications();
    });
  }

  private subscribeToSSE(): void {
    console.log('📡 Subscribing to SSE for notifications...');
    this.sseSubscription = this.sseService.getGlobalStream().subscribe({
      next: (event) => {
        console.log('📬 Received SSE event (raw):', event);
        console.log('📬 Event type:', event?.type);
        console.log('📬 Event data:', event?.data);
        this.handleSSEEvent(event);
      },
      error: (error) => {
        console.error('❌ SSE Error:', error);
      }
    });
  }

  private handleSSEEvent(event: any): void {
    console.log('🔔 [BELL] Processing SSE event:', JSON.stringify(event, null, 2));
    
    if (!event) {
      console.warn('⚠️ [BELL] Empty event received');
      return;
    }

    // Get event type - check both 'event' and 'type' fields
    const eventType = event.event || event.type;
    console.log('🏷️ [BELL] Event type detected:', eventType, '| event.event =', event.event, '| event.type =', event.type);

    // *** FILTER: ONLY PROCESS ALARM EVENTS FOR BELL NOTIFICATION ***
    const isAlarm = eventType === 'alarm' || eventType === 'ALARM:event';
    console.log(`🔍 [BELL] Filter check: eventType="${eventType}", isAlarm=${isAlarm}`);
    
    if (!isAlarm) {
      console.log(`🔇 [BELL] ❌ FILTERED OUT: ${eventType} (bell only shows alarm events)`);
      return;
    }

    console.log(`✅ [BELL] ✓ ALARM EVENT PASSED - Will create notification for: ${eventType}`);

    // Skip connectionStatus events
    if (eventType === 'connectionStatus') {
      console.log('ℹ️ Connection status update, skipping notification');
      return;
    }

    // Use NotificationService to add new notification
    this.notificationService.addNotificationFromSSE(event);
  }

  close(): void {
    this.dialogRef.close();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  handleNotificationClick(notification: NotificationItem): void {
    console.log('🔔 [NOTIFICATION CLICK] Full notification object:', notification);
    console.log('📦 [NOTIFICATION CLICK] notification.data:', notification.data);
    
    this.notificationService.markAsRead(notification.id);
    
    // Extract event ID from notification data
    // Case 1: From API - notification.data is the event object directly, has 'id' field
    // Case 2: From SSE - notification.data has structure { type, changes, full: eventData }
    let eventId: any;
    let eventData: any;
    
    if (notification.data?.full) {
      // From SSE
      eventData = notification.data.full;
      eventId = eventData.id;
      console.log('📦 [SSE] Extracted eventId from data.full.id:', eventId);
    } else if (notification.data?.id) {
      // From API
      eventData = notification.data;
      eventId = eventData.id;
      console.log('📦 [API] Extracted eventId from data.id:', eventId);
    } else {
      // Fallback to notification.id (might be wrong but for debugging)
      eventId = notification.id;
      console.log('⚠️ [FALLBACK] Using notification.id:', eventId);
    }
    
    console.log('🆔 [NOTIFICATION CLICK] Final eventId:', eventId, 'Type:', typeof eventId);
    console.log('📋 [NOTIFICATION CLICK] Event data:', eventData);
    
    if (eventId) {
      // Check if event has suspectId - if yes, use object-management route
      const suspectId = eventData?.suspectId || eventData?.objectId;
      console.log('🎯 [NOTIFICATION CLICK] SuspectId/ObjectId:', suspectId);
      
      // Close popup
      this.dialogRef.close();
      
      if (suspectId) {
        // Has suspect - navigate to object-management event detail
        console.log('🔔 [NOTIFICATION CLICK] Navigating to /object-management/event-detail/' + eventId + ' (from object: ' + suspectId + ')');
        this.router.navigate(['/object-management/event-detail', eventId], {
          state: {
            fromNotification: true,
            returnUrl: `/object-management/events/${suspectId}`
          }
        });
      } else {
        // No suspect - navigate to regular event detail
        console.log('🔔 [NOTIFICATION CLICK] Navigating to /event/detail/' + eventId);
        this.router.navigate(['/event/detail', eventId], {
          state: {
            fromNotification: true
          }
        });
      }
    } else {
      console.error('❌ [NOTIFICATION CLICK] No valid event ID found in notification:', notification);
    }
  }

  deleteNotification(notification: NotificationItem, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id);
  }

  getIconName(type: string): string {
    const icons: { [key: string]: string } = {
      alarm: 'warning',
      event: 'event',
      info: 'info',
      warning: 'error_outline'
    };
    return icons[type] || 'notifications';
  }

  onImageError(event: any): void {
    console.error('Failed to load notification image:', event.target.src);
    event.target.style.display = 'none';
  }

  formatEventTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getEventTypeName(eventType: string): string {
    const typeMap: { [key: string]: string } = {
      'Line_Cross': 'Vượt vạch',
      'Intrusion': 'Xâm nhập',
      'Loitering': 'Lảng vảng',
      'Tailgating': 'Theo đuôi',
      'Parking': 'Đỗ xe trái phép'
    };
    return typeMap[eventType] || eventType;
  }

  /**
   * Handle scroll event for virtual scrolling
   * Throttled and optimized for smooth performance
   */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    
    // Skip if scroll hasn't moved much
    if (Math.abs(scrollTop - this.lastScrollTop) < 10) {
      return;
    }
    this.lastScrollTop = scrollTop;
    
    // Cancel previous animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Use requestAnimationFrame for smooth updates
    this.rafId = requestAnimationFrame(() => {
      this.updateVisibleRange(scrollTop);
      this.rafId = null;
    });
  }
  
  /**
   * Update visible range of items based on scroll position
   */
  private updateVisibleRange(scrollTop: number): void {
    // Calculate which items should be visible
    const newStartIndex = Math.floor(scrollTop / this.ITEM_HEIGHT);
    const newEndIndex = Math.min(
      newStartIndex + this.VISIBLE_ITEMS + (this.BUFFER_SIZE * 2),
      this.notifications.length
    );

    // Only update if the visible range changed significantly
    const threshold = Math.floor(this.BUFFER_SIZE / 2);
    if (Math.abs(newStartIndex - this.startIndex) >= threshold) {
      this.startIndex = Math.max(0, newStartIndex - this.BUFFER_SIZE);
      this.endIndex = newEndIndex;
      this.updateDisplayedNotifications();
    }
  }

  /**
   * Update the list of notifications to display
   * and calculate the scroll offset for proper positioning
   */
  private updateDisplayedNotifications(): void {
    // Calculate total height for scrollbar
    this.totalHeight = this.notifications.length * this.ITEM_HEIGHT;
    
    // Get slice of notifications to render
    this.displayedNotifications = this.notifications.slice(this.startIndex, this.endIndex);
    
    // Calculate offset to position items correctly
    this.scrollOffset = this.startIndex * this.ITEM_HEIGHT;
    
    console.log(`📜 [VIRTUAL SCROLL] Total: ${this.notifications.length} | Rendering: ${this.startIndex}-${this.endIndex} | Displayed: ${this.displayedNotifications.length} items`);
    console.log(`📏 [VIRTUAL SCROLL] Total Height: ${this.totalHeight}px | Offset: ${this.scrollOffset}px`);
  }
  
  /**
   * TrackBy function for ngFor to improve performance
   * Prevents unnecessary re-renders of unchanged items
   */
  trackByNotificationId(index: number, notification: NotificationItem): string | number {
    return notification.id;
  }
}
