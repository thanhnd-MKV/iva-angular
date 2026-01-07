import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
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

  constructor(private zone: NgZone) {}

  /**
   * Connect to SSE endpoint with custom headers support
   * @param name - SSE channel name (objectRecognition, trafficIn, trafficOut, trafficViolation)
   * @returns Observable of SSE events
   */
  connect(name: string): Observable<any> {
    return new Observable(observer => {
      // Close existing connection if any
      this.disconnect(name);

      // Get token from sessionStorage
      const token = sessionStorage.getItem('TOKEN');
      
      const url = `${environment.apiUrl}/sse/admin/notification/connect?name=${name}`;
      console.log(`🔌 Connecting to SSE: ${name}`);

      const abortController = new AbortController();
      const connection: SSEConnection = {
        abortController,
        isConnected: false,
        lastMessageTime: Date.now()
      };
      this.connections.set(name, connection);
      
      // Heartbeat check - reconnect if no message for 60 seconds
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
              console.warn(`⚠️ SSE Stream closed by server [${name}], attempting reconnect in 3s...`);
              connection.isConnected = false;
              
              // Auto reconnect when stream ends unexpectedly
              setTimeout(() => {
                console.log(`🔄 Auto-reconnecting to ${name}...`);
                // Trigger error to let subscriber handle reconnection
                observer.error(new Error('Stream ended, reconnecting...'));
              }, 3000);
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
                  console.error(`❌ Parse Error [${name}]:`, data);
                  this.zone.run(() => {
                    observer.next({
                      event: currentEvent || 'message',
                      data: data
                    });
                  });
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
            
            // Reconnect after 5 seconds on error
            console.log(`🔄 SSE Reconnecting [${name}] in 5s...`);
            setTimeout(() => {
              observer.error(error);
            }, 5000);
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
}
