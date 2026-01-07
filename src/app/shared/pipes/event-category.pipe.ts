import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventCategory',
  standalone: true
})
export class EventCategoryPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'N/A';
    
    const categoryMap: { [key: string]: string } = {
      'PERSON': 'Đối tượng người',
      'VEHICLE': 'Giao thông',
      'TRAFFIC': 'Giao thông'
    };
    
    return categoryMap[value.toUpperCase()] || value;
  }
}
