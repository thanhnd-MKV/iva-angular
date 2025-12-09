import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Thay đổi import từ EventData thành ViolationEvent
import { ViolationEvent } from './violation-data.model'; 
import { ViolationDataService } from './violation-data.service';
import { ImageViewerComponent } from '../../shared/image-viewer/image-viewer.component';

@Component({
  selector: 'app-violation-screen',
  standalone: true,
  imports: [CommonModule, ImageViewerComponent],
  templateUrl: './violation-screen.component.html',
  styleUrls: ['./violation-screen.component.css']
})
export class ViolationScreenComponent implements OnInit {
  // Sử dụng ViolationEvent ở đây
  events: ViolationEvent[] = [];
  selectedEvent: ViolationEvent | null = null;

  constructor(private violationService: ViolationDataService) {}

  ngOnInit(): void {
    this.violationService.getViolationData().subscribe(data => {
      this.events = data;
    });
  }

  // Và ở đây
  viewDetails(event: ViolationEvent): void {
    this.selectedEvent = event;
  }

  closeImageViewer(): void {
    this.selectedEvent = null;
  }
}