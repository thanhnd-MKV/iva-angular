// src/app/summary-card/summary-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NumberFormatPipe } from '../pipes/number-format.pipe';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    NumberFormatPipe
  ],
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss']
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() percentageChange: number = 0;
  @Input() isPositive: boolean = true;
  @Input() class: string = '';
}