import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BaseService {
  protected apiUrl = environment.apiUrl;
  protected apiSso = environment.SSO_SERVER;

  constructor(protected http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      params,
      withCredentials: true
    });
  }

  post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
      headers,
      withCredentials: true
    });
  }

  postSso<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiSso}/${endpoint}`, body, {
      headers,
      withCredentials: true
    });
  }

  getSso<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiSso}/${endpoint}`, {
      params,
      withCredentials: true
    });
  }
  

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, {
      withCredentials: true
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      withCredentials: true
    });
  }

  postFormData<T>(endpoint: string, body: FormData): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
      withCredentials: true
    });
  }

}
