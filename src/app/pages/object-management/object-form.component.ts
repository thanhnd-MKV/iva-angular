import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ObjectManagementService, ObjectData } from './object-management.service';
import { BaseErrorHandlerComponent } from '../../core/components/base-error-handler.component';
import { DatePickerComponent } from '../../shared/date-picker/date-picker.component';

@Component({
  selector: 'app-object-form',
  templateUrl: './object-form.component.html',
  styleUrls: ['./object-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DatePickerComponent
  ]
})
export class ObjectFormComponent extends BaseErrorHandlerComponent implements OnInit {
  objectForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  objectId: string = '';
  uploadedImages: string[] = [];

  groupTypes = [
    { value: 'VIP', label: 'VIP' },
    { value: 'Khach', label: 'Khách' },
    { value: 'Blacklist', label: 'Blacklist' }
  ];

  dataSources = [
    { value: 'sync', label: 'Đồng bộ' },
    { value: 'manual', label: 'Thủ công' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectManagementService,
    private snackBar: MatSnackBar
  ) {
    super();
    
    this.objectForm = this.fb.group({
      name: ['', Validators.required],
      objectId: ['', Validators.required],
      groupType: ['', Validators.required],
      dataSource: ['', Validators.required],
      cccdNumber: [''],
      nationality: [''],
      cccdIssueDate: [''],
      cccdIssuePlace: [''],
      dateOfBirth: [''],
      gender: [''],
      origin: [''],
      residence: ['']
    });
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  protected initializeComponent(): void {
    this.objectId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.objectId;
    
    if (this.isEditMode) {
      this.loadObjectData();
    }
  }

  protected onRetry(): void {
    if (this.isEditMode) {
      this.loadObjectData();
    }
  }

  loadObjectData() {
    this.isLoading = true;
    this.objectService.getObjectById(this.objectId).subscribe({
      next: (data) => {
        this.objectForm.patchValue(data);
        this.uploadedImages = data.images || [];
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

  onImageUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle image upload logic here
      // For now, just simulate adding image URLs
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.uploadedImages.push(e.target.result);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
  }

  triggerImageUpload() {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput?.click();
  }

  onSubmit() {
    if (this.objectForm.invalid) {
      this.snackBar.open('Vui lòng điền đầy đủ thông tin bắt buộc', 'Đóng', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formData = {
      ...this.objectForm.value,
      images: this.uploadedImages
    };

    const request = this.isEditMode
      ? this.objectService.updateObject(this.objectId, formData)
      : this.objectService.createObject(formData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Cập nhật đối tượng thành công' : 'Thêm mới đối tượng thành công',
          'Đóng',
          { duration: 3000 }
        );
        this.router.navigate(['/object-management']);
      },
      error: (error: any) => {
        const appError = this.errorHandler.reportError(
          error.message || (this.isEditMode ? 'Không thể cập nhật đối tượng' : 'Không thể thêm mới đối tượng'),
          'server',
          false
        );
        this.handleGlobalError(appError);
        this.isSaving = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/object-management']);
  }

  goBack() {
    this.router.navigate(['/object-management']);
  }
}
