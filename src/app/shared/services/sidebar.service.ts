import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarOpenedSubject = new BehaviorSubject<boolean>(true);
  public sidebarOpened$: Observable<boolean> = this.sidebarOpenedSubject.asObservable();

  constructor() { }

  setSidebarState(isOpened: boolean): void {
    this.sidebarOpenedSubject.next(isOpened);
  }

  getSidebarState(): boolean {
    return this.sidebarOpenedSubject.value;
  }
}
