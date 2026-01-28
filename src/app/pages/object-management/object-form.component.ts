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
  isViewMode = false; // View mode for detail page
  isLoading = false;
  isSaving = false;
  objectId: string = '';
  uploadedImages: string[] = []; // For preview (base64)
  uploadedFiles: File[] = []; // For API upload

  groupTypes = [
    { value: 'VIP', label: 'VIP' },
    { value: 'Khách', label: 'Khách' },
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
      objectId: [''], // Not required for create
      groupType: ['', Validators.required],
      dataSource: [''], // Not required for create
      cccdNumber: [''],
      nationality: ['Việt Nam'],
      cccdIssueDate: [''],
      cccdIssuePlace: [''],
      dateOfBirth: [''],
      gender: ['male'], // Default to male
      origin: [''],
      residence: ['']
    });
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  protected initializeComponent(): void {
    this.objectId = this.route.snapshot.paramMap.get('id') || '';
    const currentUrl = this.router.url;
    
    // Determine mode based on route
    this.isViewMode = currentUrl.includes('/detail/');
    this.isEditMode = currentUrl.includes('/edit/') || (!!this.objectId && !this.isViewMode);
    
    if (this.objectId) {
      this.loadObjectData();
    }
    
    // Disable form in view mode
    if (this.isViewMode) {
      this.objectForm.disable();
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
        // Map API response to form fields
        this.objectForm.patchValue({
          name: data.fullName,
          objectId: data.objectId,
          groupType: data.trackingType,
          dataSource: data.dataSource,
          cccdNumber: data.citizenId,
          nationality: data.nationality,
          cccdIssueDate: data.citizenIdIssuedDate,
          cccdIssuePlace: data.citizenIdIssuedPlace,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender === 'Nam' ? 'male' : (data.gender === 'Nữ' ? 'female' : data.gender),
          origin: data.hometown,
          residence: data.permanentResidence
        });
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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Store File object for API upload
        this.uploadedFiles.push(file);
        
        // Create base64 preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.uploadedImages.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
    this.uploadedFiles.splice(index, 1);
  }

  triggerImageUpload() {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput?.click();
  }

  onSubmit() {
    if (this.objectForm.invalid) {
      // Find which required fields are missing
      const missingFields = [];
      if (this.objectForm.get('name')?.invalid) missingFields.push('Họ và tên');
      if (this.objectForm.get('groupType')?.invalid) missingFields.push('Nhóm đối tượng');
      
      this.snackBar.open(
        `Vui lòng điền: ${missingFields.join(', ')}`,
        'Đóng',
        { duration: 3000 }
      );
      return;
    }
    
    // Validate images for create mode
    if (!this.isEditMode && this.uploadedFiles.length === 0) {
      this.snackBar.open('Vui lòng tải lên ít nhất 1 hình ảnh', 'Đóng', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    
    if (!this.isEditMode) {
      // Create mode - use multipart/form-data format
      const personData = {
        fullName: this.objectForm.value.name,
        objectId: this.objectForm.value.objectId, // ID đối tượng (không phải id tự sinh từ BE)
        trackingType: this.objectForm.value.groupType,
        gender: this.objectForm.value.gender || 'male',
        // Optional fields
        citizenId: this.objectForm.value.cccdNumber,
        nationality: this.objectForm.value.nationality,
        citizenIdIssuedDate: this.objectForm.value.cccdIssueDate,
        citizenIdIssuedPlace: this.objectForm.value.cccdIssuePlace,
        dateOfBirth: this.objectForm.value.dateOfBirth,
        hometown: this.objectForm.value.origin,
        permanentResidence: this.objectForm.value.residence
      };
      
      const apiData = {
        images: this.uploadedFiles,
        person: personData
      };
      
      var request = this.objectService.createObject(apiData);
    } else {
      // Edit mode - map form to API format
      const formData = {
        fullName: this.objectForm.value.name,
        objectId: this.objectForm.value.objectId,
        trackingType: this.objectForm.value.groupType,
        citizenId: this.objectForm.value.cccdNumber,
        nationality: this.objectForm.value.nationality,
        citizenIdIssuedDate: this.objectForm.value.cccdIssueDate,
        citizenIdIssuedPlace: this.objectForm.value.cccdIssuePlace,
        dateOfBirth: this.objectForm.value.dateOfBirth,
        gender: this.objectForm.value.gender,
        hometown: this.objectForm.value.origin,
        permanentResidence: this.objectForm.value.residence,
        images: this.uploadedImages
      };
      var request = this.objectService.updateObject(this.objectId, formData);
    }

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

  editObject() {
    this.router.navigate(['/object-management/edit', this.objectId]);
  }

  viewRelatedEvents() {
    this.router.navigate(['/object-management/events', this.objectId]);
  }
}
