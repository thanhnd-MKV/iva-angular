import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-photo-gallery',
  templateUrl: './photo-gallery.component.html',
  styleUrls: ['./photo-gallery.component.css']
})
export class PhotoGalleryComponent {
  @Input() images: any[] | null = [];
  @Output() imageSelected = new EventEmitter<string>();

  @ViewChild('thumbnailsContainer') thumbnailsContainer!: ElementRef;

  selectImage(image: any): void {
    this.imageSelected.emit(image.url);
  }

  scrollLeft(): void {
    if (this.thumbnailsContainer) {
      this.thumbnailsContainer.nativeElement.scrollBy({
        left: -150, // Cuộn sang trái 150px
        behavior: 'smooth'
      });
    }
  }

  scrollRight(): void {
    if (this.thumbnailsContainer) {
      this.thumbnailsContainer.nativeElement.scrollBy({
        left: 150, // Cuộn sang phải 150px
        behavior: 'smooth'
      });
    }
  }
}