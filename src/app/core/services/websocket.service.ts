import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket!: Socket;

  constructor() {
    this.connect();
  }

  // connect WebSocket
  private connect(): void {
    this.socket = io(environment.socketUrl, { transports: ['websocket'] });
  
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
    });
  
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  
    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
  
      setTimeout(() => this.connect(), 5000);
    });
  }
  

  // emit data ->> server
  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  // listen <<- server
  listen<T>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(event, (data: T) => {
        subscriber.next(data);
      });

      return () => this.socket.off(event);
    });
  }

  // disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
