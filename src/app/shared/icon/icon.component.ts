import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SVG_ICONS } from './svg.icon';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="inline-icon" [innerHTML]="safeSvg"></span>`,
})
export class IconComponent implements OnChanges {
  @Input() name: any = '';
  safeSvg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    const rawSvg = SVG_ICONS[this.name] || '';
    this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(rawSvg);
    console.log(this.safeSvg)
  }
}
