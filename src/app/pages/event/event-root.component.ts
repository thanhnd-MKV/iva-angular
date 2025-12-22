import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventListComponent } from './event-list.component';
import { PersonEventComponent } from './person-event.component';
import { TrafficEventComponent } from './traffic-event.component';

@Component({
  selector: 'app-event-root',
  imports: [
    CommonModule,
    EventListComponent,
    PersonEventComponent,
    TrafficEventComponent
  ],
  templateUrl: './event-root.component.html',
  styleUrl: './event-root.component.css'
})
export class EventRootComponent {
  activeTab: 'all' | 'person' | 'traffic' = 'all';

  selectTab(tab: 'all' | 'person' | 'traffic') {
    this.activeTab = tab;
  }
}
