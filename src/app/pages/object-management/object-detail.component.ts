import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ObjectManagementService, ObjectData } from './object-management.service';
import { BaseErrorHandlerComponent } from '../../core/components/base-error-handler.component';

@Component({
  selector: 'app-object-detail',
  templateUrl: './object-detail.component.html',
  styleUrls: ['./object-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ]
})
export class ObjectDetailComponent extends BaseErrorHandlerComponent implements OnInit {
  objectData: ObjectData | null = null;
  isLoading = false;
  objectId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectManagementService
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  protected initializeComponent(): void {
    this.objectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.objectId) {
      this.loadObjectDetail();
    }
  }

  protected onRetry(): void {
    this.loadObjectDetail();
  }

  loadObjectDetail() {
    this.isLoading = true;
    this.objectService.getObjectById(this.objectId).subscribe({
      next: (data) => {
        this.objectData = data;
        this.isLoading = false;
      },
      error: (error) => {
        const appError = this.errorHandler.reportError(
          error.message || 'Không thể tải thông tin đối tượng',
          'server',
          false
        );
        this.handleGlobalError(appError);
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/object-management']);
  }

  editObject() {
    this.router.navigate(['/object-management/edit', this.objectId]);
  }

  viewRelatedEvents() {
    this.router.navigate(['/object-management/events', this.objectId]);
  }

  getGroupTypeBadgeClass(groupType: string): string {
    const classes: { [key: string]: string } = {
      'VIP': 'badge-vip',
      'Khach': 'badge-guest',
      'Blacklist': 'badge-blacklist'
    };
    return classes[groupType] || '';
  }
}
