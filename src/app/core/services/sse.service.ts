import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, share } from 'rxjs';
import { environment } from '../../environments/environment';

interface SSEConnection {
  abortController: AbortController;
  isConnected: boolean;
  lastMessageTime: number;
  heartbeatInterval?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SSEService {
  private connections: Map<string, SSEConnection> = new Map();
  
  // Global shared SSE stream for entire app - single connection
  private globalStreamSubject: Subject<any> | null = null;
  private globalStream$: Observable<any> | null = null;
  private isGlobalConnected = false;

  // Shared stream for statistics screens
  private sharedStream$: Observable<any> | null = null;
  private streamSubject: Subject<any> | null = null;

  constructor(private zone: NgZone) {}

  /**
   * Get global shared SSE stream - creates connection once and shares with all subscribers
   * This is the ONLY method that should be used for SSE connections
   * @returns Observable of all SSE notifications
   */
  getGlobalStream(): Observable<any> {
    if (this.globalStream$) {
      console.log('📡 Returning existing global SSE stream');
      return this.globalStream$;
    }

    console.log('🚀 Creating NEW global SSE connection (ONLY ONCE)');
    
    this.globalStreamSubject = new Subject<any>();
    this.globalStream$ = this.globalStreamSubject.asObservable().pipe(share());
    
    this.connectGlobalSSE();
    
    return this.globalStream$;
  }

  /**
   * Internal method to establish global SSE connection
   * NEVER called directly - only through getGlobalStream()
   */
  private connectGlobalSSE(): void {
    if (this.isGlobalConnected) {
      console.log('⚠️ Global SSE already connected');
      return;
    }

    const token = sessionStorage.getItem('TOKEN');
    const url = `${environment.apiUrl}/sse/admin/notification/connect-multi`;
    
    console.log('🔌 Connecting global SSE to ALARM channel only (param will be added by BE later)');

    const abortController = new AbortController();
    this.isGlobalConnected = true;

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'sso-session-id': token || '',
      },
      cache: 'no-store',
      signal: abortController.signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('📡 SSE Response content-type:', contentType);
      
      // Chấp nhận cả text/event-stream và application/json
      if (!contentType || (!contentType.includes('text/event-stream') && !contentType.includes('application/json'))) {
        console.warn(`⚠️ Unexpected content-type: ${contentType}, but will try to connect anyway`);
      }

      console.log('✅ Global SSE Connected');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      const readStream = () => {
        reader?.read().then(({ done, value }) => {
          if (done) {
            console.log('🔌 Global SSE Stream ended');
            this.isGlobalConnected = false;
            this.globalStreamSubject?.complete();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:') || line.startsWith('event: ')) {
              currentEvent = line.substring(line.indexOf(':') + 1).trim();
            }
            else if (line.startsWith('data:') || line.startsWith('data: ')) {
              const data = line.substring(line.indexOf(':') + 1).trim();
              
              try {
                const parsed = JSON.parse(data);
                console.log(`📨 Global SSE Event at ${new Date().toLocaleTimeString()}:`, parsed);
                
                this.zone.run(() => {
                  this.globalStreamSubject?.next({
                    event: currentEvent || 'message',
                    data: parsed
                  });
                });
                
                currentEvent = '';
              } catch (error) {
                console.log('🔇 Skipping non-JSON message:', data);
                currentEvent = '';
              }
            }
            else if (line.startsWith(':')) {
              console.log('💓 Global SSE Keepalive');
            }
          }

          readStream();
        }).catch(error => {
          if (error.name !== 'AbortError') {
            this.zone.run(() => {
              console.error('❌ Global SSE Read Error:', error);
              this.globalStreamSubject?.error(error);
            });
          }
        });
      };

      readStream();
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        this.isGlobalConnected = false;
        this.zone.run(() => {
          console.error('❌ Global SSE Connection Error:', error);
          console.log('⛔ NOT reconnecting - connection failed permanently');
          this.globalStreamSubject?.error(error);
        });
      }
    });
  }

  /**
   * @deprecated Use getGlobalStream() instead
   * Connect to SSE endpoint with custom headers support
   * @param name - SSE channel name (objectRecognition, trafficIn, trafficOut, trafficViolation)
   * @param params - Optional query parameters for filtering (cameraSn, location, etc.)
   * @returns Observable of SSE events
   */
  connect(name: string, params?: any): Observable<any> {
    return new Observable(observer => {
      // Close existing connection if any
      this.disconnect(name);

      // Get token from sessionStorage
      const token = sessionStorage.getItem('TOKEN');
      
      // Build URL with optional params
      let url = `${environment.apiUrl}/sse/admin/notification/connect?name=${name}`;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            queryParams.append(key, params[key]);
          }
        });
        const paramString = queryParams.toString();
        if (paramString) {
          url += `&${paramString}`;
        }
      }
      console.log(`🔌 Connecting to SSE: ${name}`, params ? `with params: ${JSON.stringify(params)}` : '');

      const abortController = new AbortController();
      const connection: SSEConnection = {
        abortController,
        isConnected: false,
        lastMessageTime: Date.now()
      };
      this.connections.set(name, connection);
      
      // Heartbeat check disabled - Backend sends keepalive comments
      // Components filter event types, so lastMessageTime may not update
      // Rely on browser/fetch to detect dead connections instead
      /*
      const heartbeatInterval = setInterval(() => {
        const timeSinceLastMessage = Date.now() - connection.lastMessageTime;
        if (connection.isConnected && timeSinceLastMessage > 60000) {
          console.warn(`💔 No SSE message for 60s [${name}], reconnecting...`);
          clearInterval(heartbeatInterval);
          this.disconnect(name);
          observer.error(new Error('Heartbeat timeout'));
        }
      }, 30000); // Check every 30s
      
      connection.heartbeatInterval = heartbeatInterval;
      */

      // Use fetch API with ReadableStream to support custom headers
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'sso-session-id': token || '',
        },
        cache: 'no-store',
        signal: abortController.signal
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Validate content-type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
          throw new Error(`Invalid SSE endpoint - received ${contentType} instead of text/event-stream`);
        }

        connection.isConnected = true;
        console.log(`✅ SSE Connected: ${name}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';

        const readStream = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              console.log(`🔌 SSE Stream ended: ${name}`);
              connection.isConnected = false;
              
              // Stream ended gracefully - DO NOT auto-reconnect
              // Let the component decide whether to reconnect
              console.log(`⚠️ SSE Stream closed by server [${name}] - connection complete`);
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              // Parse event type (with or without space after colon)
              if (line.startsWith('event:') || line.startsWith('event: ')) {
                currentEvent = line.substring(line.indexOf(':') + 1).trim();
              }
              // Parse data (with or without space after colon)
              else if (line.startsWith('data:') || line.startsWith('data: ')) {
                const data = line.substring(line.indexOf(':') + 1).trim();
                
                // Update last message time
                connection.lastMessageTime = Date.now();
                
                try {
                  const parsed = JSON.parse(data);
                  console.log(`📨 SSE [${name}] at ${new Date().toLocaleTimeString()}:`, parsed);
                  
                  // Send data with event type - zone.run ensures Angular detects changes
                  this.zone.run(() => {
                    observer.next({
                      event: currentEvent || 'message',
                      data: parsed
                    });
                  });
                  
                  // Reset event type after sending
                  currentEvent = '';
                } catch (error) {
                  // Ignore non-JSON messages (e.g., "Connected to topics: ...")
                  console.log(`🔇 SSE [${name}] Skipping non-JSON message:`, data);
                  currentEvent = '';
                }
              }
              // Handle comment lines (keepalive)
              else if (line.startsWith(':')) {
                connection.lastMessageTime = Date.now();
                console.log(`💓 SSE Keepalive [${name}]`);
              }
            }

            readStream();
          }).catch(error => {
            if (error.name !== 'AbortError') {
              this.zone.run(() => {
                console.error(`❌ SSE Read Error [${name}]:`, error);
                observer.error(error);
              });
            }
          });
        };

        readStream();
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          connection.isConnected = false;
          this.zone.run(() => {
            console.error(`❌ SSE Connection Error [${name}]:`, error);
            console.log(`⛔ NOT reconnecting - connection failed permanently [${name}]`);
            observer.error(error);
          });
        }
      });

      // Cleanup function
      return () => {
        console.log(`🔌 Disconnecting SSE: ${name}`);
        if (connection.heartbeatInterval) {
          clearInterval(connection.heartbeatInterval);
        }
        this.disconnect(name);
      };
    });
  }

  /**
   * Connect to SSE endpoint with multiple notification names
   * @param names - Array of notification names (alarm, traffic-event)
   * @param enableFakeData - Enable fake data for testing (default: false)
   * @returns Observable of SSE events
   */
  connectMulti(names: string[], enableFakeData: boolean = false): Observable<any> {
    return new Observable(observer => {
      const channelKey = `multi_${names.join('_')}`;
      
      // If fake data enabled, return fake data stream
      if (enableFakeData) {
        console.log(`🧪 Using FAKE DATA for: ${names.join(', ')}`);
        return this.generateFakeData(names, observer);
      }

      // Close existing connection if any
      this.disconnect(channelKey);

      // Get token from sessionStorage
      const token = sessionStorage.getItem('TOKEN');
      
      // Build URL - params will be added by BE later
      // const params = names.map(name => `names=${name}`).join('&');
      const url = `${environment.apiUrl}/sse/admin/notification/connect-multi`;
      console.log(`🔌 Connecting to SSE Multi: ${names.join(', ')} (param will be added by BE later)`);

      const abortController = new AbortController();
      const connection: SSEConnection = {
        abortController,
        isConnected: false,
        lastMessageTime: Date.now()
      };
      this.connections.set(channelKey, connection);
      
      /*
      const heartbeatInterval = setInterval(() => {
        const timeSinceLastMessage = Date.now() - connection.lastMessageTime;
        if (connection.isConnected && timeSinceLastMessage > 60000) {
          console.warn(`💔 No SSE message for 60s [${channelKey}], reconnecting...`);
          clearInterval(heartbeatInterval);
          this.disconnect(channelKey);
          observer.error(new Error('Heartbeat timeout'));
        }
      }, 30000); // Check every 30s
      
      connection.heartbeatInterval = heartbeatInterval;
      */

      // Use fetch API with ReadableStream to support custom headers
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'sso-session-id': token || '',
        },
        cache: 'no-store',
        signal: abortController.signal
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Validate content-type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
          throw new Error(`Invalid SSE endpoint - received ${contentType} instead of text/event-stream`);
        }

        connection.isConnected = true;
        console.log(`✅ SSE Multi Connected: ${names.join(', ')}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';

        const readStream = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              console.log(`🔌 SSE Multi Stream ended: ${channelKey}`);
              connection.isConnected = false;
              
              // Stream ended gracefully - DO NOT auto-reconnect
              // Let the component decide whether to reconnect
              console.log(`⚠️ SSE Multi Stream closed by server [${channelKey}] - connection complete`);
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              // Parse event type
              if (line.startsWith('event:') || line.startsWith('event: ')) {
                currentEvent = line.substring(line.indexOf(':') + 1).trim();
              }
              // Parse data
              else if (line.startsWith('data:') || line.startsWith('data: ')) {
                const data = line.substring(line.indexOf(':') + 1).trim();
                
                // Update last message time
                connection.lastMessageTime = Date.now();
                
                try {
                  const parsed = JSON.parse(data);
                  
                  // Filter: Allow multiple event types for statistics screens
                  const eventType = currentEvent || 'message';
                  const allowedEvents = [
                    'alarm', 
                    'ALARM:event',
                    'objectRecognition',
                    'pedestrianTraffic',
                    'trafficVolume',
                    'trafficViolation'
                  ];
                  const shouldEmit = allowedEvents.includes(eventType);
                  
                  if (shouldEmit) {
                    console.log(`📨 SSE Multi [${names.join(', ')}] PASSED filter - type: ${eventType}`, parsed);
                    
                    // Send data with event type
                    this.zone.run(() => {
                      observer.next({
                        event: eventType,
                        data: parsed
                      });
                    });
                  } else {
                    // Log filtered out events
                    console.log(`🔇 SSE Multi [${names.join(', ')}] FILTERED OUT - type: ${eventType}`, parsed);
                  }
                  
                  currentEvent = '';
                } catch (error) {
                  // Ignore non-JSON messages (e.g., "Connected to topics: ...")
                  console.log(`🔇 SSE Multi [${channelKey}] Skipping non-JSON message:`, data);
                  currentEvent = '';
                }
              }
              // Handle comment lines (keepalive)
              else if (line.startsWith(':')) {
                connection.lastMessageTime = Date.now();
                console.log(`💓 SSE Multi Keepalive [${channelKey}]`);
              }
            }

            readStream();
          }).catch(error => {
            if (error.name !== 'AbortError') {
              this.zone.run(() => {
                console.error(`❌ SSE Multi Read Error [${channelKey}]:`, error);
                observer.error(error);
              });
            }
          });
        };

        readStream();
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          connection.isConnected = false;
          this.zone.run(() => {
            console.error(`❌ SSE Multi Connection Error [${channelKey}]:`, error);
            console.log(`⛔ NOT reconnecting - connection failed permanently [${channelKey}]`);
            observer.error(error);
          });
        }
      });

      // Cleanup function
      return () => {
        console.log(`🔌 Disconnecting SSE Multi: ${channelKey}`);
        if (connection.heartbeatInterval) {
          clearInterval(connection.heartbeatInterval);
        }
        this.disconnect(channelKey);
      };
    });
  }

  /**
   * Generate fake data for testing
   * @param names - Notification names
   * @param observer - Observable observer
   */
  private generateFakeData(names: string[], observer: any): () => void {
    const intervals: any[] = [];
    
    names.forEach(name => {
      let counter = 1;
      const interval = setInterval(() => {
        const fakeData = this.createFakeNotification(name, counter++);
        this.zone.run(() => {
          observer.next({
            event: name,
            data: fakeData
          });
        });
        console.log(`🧪 FAKE SSE [${name}]:`, fakeData);
      }, name === 'alarm' ? 8000 : 12000); // Different intervals for different types
      
      intervals.push(interval);
    });

    // Return cleanup function
    return () => {
      intervals.forEach(interval => clearInterval(interval));
      console.log('🧪 Stopped generating fake data');
    };
  }

  /**
   * Create fake notification based on type
   * @param type - Notification type
   * @param counter - Message counter
   */
  private createFakeNotification(type: string, counter: number): any {
    const timestamp = new Date().toISOString();
    
    if (type === 'alarm') {
      const alarmTypes = ['fire', 'intrusion', 'system-error', 'camera-offline', 'high-temperature'];
      const severities = ['critical', 'high', 'medium', 'low'];
      const locations = ['Tầng 1 - Khu A', 'Tầng 2 - Khu B', 'Tầng 3 - Khu C', 'Hành lang', 'Bãi đỗ xe'];
      
      return {
        id: `alarm_${Date.now()}_${counter}`,
        type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: `Cảnh báo #${counter}`,
        message: `Phát hiện sự cố cần xử lý`,
        location: locations[Math.floor(Math.random() * locations.length)],
        timestamp: timestamp,
        camera: `CAM_${Math.floor(Math.random() * 20) + 1}`,
        status: 'new'
      };
    } else if (type === 'traffic-event') {
      const eventTypes = ['accident', 'congestion', 'illegal-parking', 'wrong-way', 'speeding'];
      const roads = ['Đường Lê Lợi', 'Đường Trần Hưng Đạo', 'Đường Nguyễn Huệ', 'Xa lộ Hà Nội', 'Đại lộ Thăng Long'];
      
      return {
        id: `traffic_${Date.now()}_${counter}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        title: `Sự kiện giao thông #${counter}`,
        message: `Phát hiện vi phạm hoặc sự cố giao thông`,
        location: roads[Math.floor(Math.random() * roads.length)],
        timestamp: timestamp,
        lane: `Lane ${Math.floor(Math.random() * 4) + 1}`,
        vehicleType: ['car', 'motorbike', 'truck', 'bus'][Math.floor(Math.random() * 4)],
        licensePlate: `29A-${Math.floor(Math.random() * 90000) + 10000}`,
        status: 'detected'
      };
    }
    
    return {
      id: `unknown_${Date.now()}_${counter}`,
      type: 'unknown',
      message: `Unknown notification type: ${type}`,
      timestamp: timestamp
    };
  }

  /**
   * Disconnect from SSE endpoint
   * @param name - SSE channel name
   */
  disconnect(name: string): void {
    const connection = this.connections.get(name);
    if (connection) {
      if (connection.heartbeatInterval) {
        clearInterval(connection.heartbeatInterval);
      }
      connection.abortController.abort();
      this.connections.delete(name);
      console.log(`✅ SSE Disconnected: ${name}`);
    }
  }

  /**
   * Disconnect all SSE connections
   */
  disconnectAll(): void {
    this.connections.forEach((connection, name) => {
      connection.abortController.abort();
      console.log(`✅ SSE Disconnected: ${name}`);
    });
    this.connections.clear();
  }

  /**
   * Check if connected to a specific channel
   * @param name - SSE channel name
   * @returns boolean
   */
  isConnected(name: string): boolean {
    const connection = this.connections.get(name);
    return connection !== undefined && connection.isConnected;
  }

  /**
   * Get shared SSE stream for all statistics screens
   * All statistics screens subscribe to this shared stream and filter by their key
   * @returns Observable of SSE events shared across all subscribers
   */
  getSharedStream(): Observable<any> {
    if (!this.sharedStream$) {
      console.log('🌐 Creating shared SSE stream for all statistics screens...');
      
      // Create subject for multicasting
      this.streamSubject = new Subject<any>();
      
      // Start connection and pipe to subject
      this.connectMulti(['alarm']).subscribe({
        next: (data) => {
          this.streamSubject?.next(data);
        },
        error: (error) => {
          console.error('❌ Shared SSE stream error:', error);
          this.streamSubject?.error(error);
          // Reset stream on error so it can be recreated
          this.sharedStream$ = null;
          this.streamSubject = null;
        },
        complete: () => {
          console.log('🔌 Shared SSE stream completed');
          this.streamSubject?.complete();
          // Reset stream on complete so it can be recreated
          this.sharedStream$ = null;
          this.streamSubject = null;
        }
      });
      
      // Create shared observable
      this.sharedStream$ = this.streamSubject.asObservable().pipe(share());
    }
    
    return this.sharedStream$;
  }

  /**
   * Disconnect shared stream
   */
  disconnectSharedStream(): void {
    if (this.sharedStream$) {
      console.log('🔌 Disconnecting shared SSE stream...');
      this.disconnect('multi_alarm_traffic-event');
      this.streamSubject?.complete();
      this.sharedStream$ = null;
      this.streamSubject = null;
    }
  }
}
