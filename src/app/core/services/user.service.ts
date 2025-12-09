import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { User } from '../models/user';


@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {
  getUsers(): Observable<User[]> {
    return this.get<User[]>('users');
  }

  getUserById(id: number): Observable<User> {
    return this.get<User>(`users/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.post<User>('users', user);
  }
}
