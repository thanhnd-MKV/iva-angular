import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, map, catchError, debounceTime, switchMap, first } from 'rxjs';
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
  uploadedImages: string[] = []; // For preview (base64 or URLs)
  uploadedFiles: File[] = []; // New files for upload
  existingImageUrls: string[] = []; // Existing image URLs from server
  imageTypes: ('new' | 'existing')[] = []; // Track type of each image in uploadedImages array
  nationalitySearchControl!: FormControl;
  filteredNationalities: { value: string; label: string }[] = [];
  nationalityDropdownOpen = false;

  groupTypes = [
    { value: 'VIP', label: 'VIP' },
    { value: 'Khách', label: 'Khách' },
    { value: 'Blacklist', label: 'Blacklist' },
    { value: 'Truy nã', label: 'Truy nã' }
  ];

  dataSources = [
    { value: 'Đồng bộ', label: 'Đồng bộ' },
    { value: 'Thêm mới', label: 'Thêm mới' }
  ];

  nationalities = [
    // Châu Á
    { value: 'Afghan', label: 'Afghanistan (Afghan)' },
    { value: 'Saudi', label: 'Ả Rập Xê Út (Saudi)' },
    { value: 'Armenia', label: 'Armenia (Armenia)' },
    { value: 'Azerbaijan', label: 'Azerbaijan (Azerbaijan)' },
    { value: 'Bahrain', label: 'Bahrain (Bahrain)' },
    { value: 'Bangladesh', label: 'Bangladesh (Bangladesh)' },
    { value: 'Bhutan', label: 'Bhutan (Bhutan)' },
    { value: 'Brunei', label: 'Brunei (Brunei)' },
    { value: 'Campuchia', label: 'Campuchia (Campuchia)' },
    { value: 'UAE', label: 'Các Tiểu vương quốc Ả Rập Thống nhất (UAE)' },
    { value: 'Georgia', label: 'Georgia (Georgia)' },
    { value: 'Indonesia', label: 'Indonesia (Indonesia)' },
    { value: 'Iran', label: 'Iran (Iran)' },
    { value: 'Iraq', label: 'Iraq (Iraq)' },
    { value: 'Israel', label: 'Israel (Israel)' },
    { value: 'Ấn Độ', label: 'Ấn Độ (Ấn Độ)' },
    { value: 'Jordan', label: 'Jordan (Jordan)' },
    { value: 'Kazakhstan', label: 'Kazakhstan (Kazakhstan)' },
    { value: 'Kuwait', label: 'Kuwait (Kuwait)' },
    { value: 'Kyrgyzstan', label: 'Kyrgyzstan (Kyrgyzstan)' },
    { value: 'Lào', label: 'Lào (Lào)' },
    { value: 'Lebanon', label: 'Lebanon (Lebanon)' },
    { value: 'Malaysia', label: 'Malaysia (Malaysia)' },
    { value: 'Maldives', label: 'Maldives (Maldives)' },
    { value: 'Mông Cổ', label: 'Mông Cổ (Mông Cổ)' },
    { value: 'Myanmar', label: 'Myanmar (Myanmar)' },
    { value: 'Nepal', label: 'Nepal (Nepal)' },
    { value: 'Nhật Bản', label: 'Nhật Bản (Nhật Bản)' },
    { value: 'Oman', label: 'Oman (Oman)' },
    { value: 'Pakistan', label: 'Pakistan (Pakistan)' },
    { value: 'Philippines', label: 'Philippines (Philippines)' },
    { value: 'Qatar', label: 'Qatar (Qatar)' },
    { value: 'Singapore', label: 'Singapore (Singapore)' },
    { value: 'Sri Lanka', label: 'Sri Lanka (Sri Lanka)' },
    { value: 'Syria', label: 'Syria (Syria)' },
    { value: 'Tajikistan', label: 'Tajikistan (Tajikistan)' },
    { value: 'Thái Lan', label: 'Thái Lan (Thái Lan)' },
    { value: 'Thổ Nhĩ Kỳ', label: 'Thổ Nhĩ Kỳ (Thổ Nhĩ Kỳ)' },
    { value: 'Đông Timor', label: 'Timor-Leste (Đông Timor)' },
    { value: 'Trung Quốc', label: 'Trung Quốc (Trung Quốc)' },
    { value: 'Triều Tiên', label: 'Triều Tiên (Triều Tiên)' },
    { value: 'Hàn Quốc', label: 'Hàn Quốc (Hàn Quốc)' },
    { value: 'Turkmenistan', label: 'Turkmenistan (Turkmenistan)' },
    { value: 'Uzbekistan', label: 'Uzbekistan (Uzbekistan)' },
    { value: 'Việt Nam', label: 'Việt Nam (Việt Nam)' },
    { value: 'Yemen', label: 'Yemen (Yemen)' },
    // Châu Âu
    { value: 'Albania', label: 'Albania (Albania)' },
    { value: 'Áo', label: 'Áo (Áo)' },
    { value: 'Andorra', label: 'Andorra (Andorra)' },
    { value: 'Anh', label: 'Anh / Vương quốc Anh (Anh)' },
    { value: 'Belarus', label: 'Belarus (Belarus)' },
    { value: 'Bỉ', label: 'Bỉ (Bỉ)' },
    { value: 'Bosnia', label: 'Bosnia & Herzegovina (Bosnia)' },
    { value: 'Bulgaria', label: 'Bulgaria (Bulgaria)' },
    { value: 'Croatia', label: 'Croatia (Croatia)' },
    { value: 'Séc', label: 'Cộng hòa Séc (Séc)' },
    { value: 'Đan Mạch', label: 'Đan Mạch (Đan Mạch)' },
    { value: 'Đức', label: 'Đức (Đức)' },
    { value: 'Estonia', label: 'Estonia (Estonia)' },
    { value: 'Phần Lan', label: 'Phần Lan (Phần Lan)' },
    { value: 'Pháp', label: 'Pháp (Pháp)' },
    { value: 'Hy Lạp', label: 'Hy Lạp (Hy Lạp)' },
    { value: 'Hungary', label: 'Hungary (Hungary)' },
    { value: 'Iceland', label: 'Iceland (Iceland)' },
    { value: 'Ireland', label: 'Ireland (Ireland)' },
    { value: 'Ý', label: 'Ý (Ý)' },
    { value: 'Latvia', label: 'Latvia (Latvia)' },
    { value: 'Liechtenstein', label: 'Liechtenstein (Liechtenstein)' },
    { value: 'Litva', label: 'Litva (Litva)' },
    { value: 'Luxembourg', label: 'Luxembourg (Luxembourg)' },
    { value: 'Malta', label: 'Malta (Malta)' },
    { value: 'Moldova', label: 'Moldova (Moldova)' },
    { value: 'Monaco', label: 'Monaco (Monaco)' },
    { value: 'Montenegro', label: 'Montenegro (Montenegro)' },
    { value: 'Na Uy', label: 'Na Uy (Na Uy)' },
    { value: 'Hà Lan', label: 'Hà Lan (Hà Lan)' },
    { value: 'Ba Lan', label: 'Ba Lan (Ba Lan)' },
    { value: 'Bồ Đào Nha', label: 'Bồ Đào Nha (Bồ Đào Nha)' },
    { value: 'Bắc Macedonia', label: 'Bắc Macedonia (Bắc Macedonia)' },
    { value: 'Romania', label: 'Romania (Romania)' },
    { value: 'Nga', label: 'Nga (Nga)' },
    { value: 'San Marino', label: 'San Marino (San Marino)' },
    { value: 'Serbia', label: 'Serbia (Serbia)' },
    { value: 'Slovakia', label: 'Slovakia (Slovakia)' },
    { value: 'Slovenia', label: 'Slovenia (Slovenia)' },
    { value: 'Tây Ban Nha', label: 'Tây Ban Nha (Tây Ban Nha)' },
    { value: 'Thụy Điển', label: 'Thụy Điển (Thụy Điển)' },
    { value: 'Thụy Sĩ', label: 'Thụy Sĩ (Thụy Sĩ)' },
    { value: 'Ukraina', label: 'Ukraina (Ukraina)' },
    { value: 'Vatican', label: 'Vatican (Vatican)' },
    // Châu Phi
    { value: 'Ai Cập', label: 'Ai Cập (Ai Cập)' },
    { value: 'Algeria', label: 'Algeria (Algeria)' },
    { value: 'Angola', label: 'Angola (Angola)' },
    { value: 'Benin', label: 'Benin (Benin)' },
    { value: 'Botswana', label: 'Botswana (Botswana)' },
    { value: 'Burkina Faso', label: 'Burkina Faso (Burkina Faso)' },
    { value: 'Burundi', label: 'Burundi (Burundi)' },
    { value: 'Cameroon', label: 'Cameroon (Cameroon)' },
    { value: 'Trung Phi', label: 'Cộng hòa Trung Phi (Trung Phi)' },
    { value: 'Chad', label: 'Chad (Chad)' },
    { value: 'Comoros', label: 'Comoros (Comoros)' },
    { value: 'Congo', label: 'Congo (Congo)' },
    { value: 'CHDC Congo', label: 'CHDC Congo (Congo)' },
    { value: 'Bờ Biển Ngà', label: 'Bờ Biển Ngà (Bờ Biển Ngà)' },
    { value: 'Djibouti', label: 'Djibouti (Djibouti)' },
    { value: 'Eritrea', label: 'Eritrea (Eritrea)' },
    { value: 'Ethiopia', label: 'Ethiopia (Ethiopia)' },
    { value: 'Gabon', label: 'Gabon (Gabon)' },
    { value: 'Gambia', label: 'Gambia (Gambia)' },
    { value: 'Ghana', label: 'Ghana (Ghana)' },
    { value: 'Guinea', label: 'Guinea (Guinea)' },
    { value: 'Guinea-Bissau', label: 'Guinea-Bissau (Guinea-Bissau)' },
    { value: 'Kenya', label: 'Kenya (Kenya)' },
    { value: 'Lesotho', label: 'Lesotho (Lesotho)' },
    { value: 'Liberia', label: 'Liberia (Liberia)' },
    { value: 'Libya', label: 'Libya (Libya)' },
    { value: 'Madagascar', label: 'Madagascar (Madagascar)' },
    { value: 'Malawi', label: 'Malawi (Malawi)' },
    { value: 'Mali', label: 'Mali (Mali)' },
    { value: 'Mauritania', label: 'Mauritania (Mauritania)' },
    { value: 'Mauritius', label: 'Mauritius (Mauritius)' },
    { value: 'Morocco', label: 'Morocco (Morocco)' },
    { value: 'Mozambique', label: 'Mozambique (Mozambique)' },
    { value: 'Namibia', label: 'Namibia (Namibia)' },
    { value: 'Niger', label: 'Niger (Niger)' },
    { value: 'Nigeria', label: 'Nigeria (Nigeria)' },
    { value: 'Rwanda', label: 'Rwanda (Rwanda)' },
    { value: 'Sao Tome', label: 'Sao Tome & Principe (Sao Tome)' },
    { value: 'Senegal', label: 'Senegal (Senegal)' },
    { value: 'Seychelles', label: 'Seychelles (Seychelles)' },
    { value: 'Sierra Leone', label: 'Sierra Leone (Sierra Leone)' },
    { value: 'Somalia', label: 'Somalia (Somalia)' },
    { value: 'Nam Phi', label: 'Nam Phi (Nam Phi)' },
    { value: 'Nam Sudan', label: 'Nam Sudan (Nam Sudan)' },
    { value: 'Sudan', label: 'Sudan (Sudan)' },
    { value: 'Tanzania', label: 'Tanzania (Tanzania)' },
    { value: 'Togo', label: 'Togo (Togo)' },
    { value: 'Tunisia', label: 'Tunisia (Tunisia)' },
    { value: 'Uganda', label: 'Uganda (Uganda)' },
    { value: 'Zambia', label: 'Zambia (Zambia)' },
    { value: 'Zimbabwe', label: 'Zimbabwe (Zimbabwe)' },
    // Châu Mỹ
    { value: 'Antigua', label: 'Antigua & Barbuda (Antigua)' },
    { value: 'Argentina', label: 'Argentina (Argentina)' },
    { value: 'Bahamas', label: 'Bahamas (Bahamas)' },
    { value: 'Barbados', label: 'Barbados (Barbados)' },
    { value: 'Belize', label: 'Belize (Belize)' },
    { value: 'Bolivia', label: 'Bolivia (Bolivia)' },
    { value: 'Brazil', label: 'Brazil (Brazil)' },
    { value: 'Canada', label: 'Canada (Canada)' },
    { value: 'Chile', label: 'Chile (Chile)' },
    { value: 'Colombia', label: 'Colombia (Colombia)' },
    { value: 'Costa Rica', label: 'Costa Rica (Costa Rica)' },
    { value: 'Cuba', label: 'Cuba (Cuba)' },
    { value: 'Dominica', label: 'Dominica (Dominica)' },
    { value: 'Cộng hòa Dominica', label: 'Cộng hòa Dominica (Dominica)' },
    { value: 'Ecuador', label: 'Ecuador (Ecuador)' },
    { value: 'El Salvador', label: 'El Salvador (El Salvador)' },
    { value: 'Grenada', label: 'Grenada (Grenada)' },
    { value: 'Guatemala', label: 'Guatemala (Guatemala)' },
    { value: 'Guyana', label: 'Guyana (Guyana)' },
    { value: 'Haiti', label: 'Haiti (Haiti)' },
    { value: 'Honduras', label: 'Honduras (Honduras)' },
    { value: 'Jamaica', label: 'Jamaica (Jamaica)' },
    { value: 'Mexico', label: 'Mexico (Mexico)' },
    { value: 'Nicaragua', label: 'Nicaragua (Nicaragua)' },
    { value: 'Panama', label: 'Panama (Panama)' },
    { value: 'Paraguay', label: 'Paraguay (Paraguay)' },
    { value: 'Peru', label: 'Peru (Peru)' },
    { value: 'Saint Kitts', label: 'Saint Kitts & Nevis (Saint Kitts)' },
    { value: 'Saint Lucia', label: 'Saint Lucia (Saint Lucia)' },
    { value: 'Saint Vincent', label: 'Saint Vincent & Grenadines (Saint Vincent)' },
    { value: 'Suriname', label: 'Suriname (Suriname)' },
    { value: 'Trinidad', label: 'Trinidad & Tobago (Trinidad)' },
    { value: 'Mỹ', label: 'Hoa Kỳ (Mỹ)' },
    { value: 'Uruguay', label: 'Uruguay (Uruguay)' },
    { value: 'Venezuela', label: 'Venezuela (Venezuela)' },
    // Châu Đại Dương
    { value: 'Úc', label: 'Australia (Úc)' },
    { value: 'Fiji', label: 'Fiji (Fiji)' },
    { value: 'Kiribati', label: 'Kiribati (Kiribati)' },
    { value: 'Marshall', label: 'Marshall (Marshall)' },
    { value: 'Micronesia', label: 'Micronesia (Micronesia)' },
    { value: 'Nauru', label: 'Nauru (Nauru)' },
    { value: 'New Zealand', label: 'New Zealand (New Zealand)' },
    { value: 'Palau', label: 'Palau (Palau)' },
    { value: 'Papua New Guinea', label: 'Papua New Guinea (Papua New Guinea)' },
    { value: 'Samoa', label: 'Samoa (Samoa)' },
    { value: 'Solomon', label: 'Quần đảo Solomon (Solomon)' },
    { value: 'Tonga', label: 'Tonga (Tonga)' },
    { value: 'Tuvalu', label: 'Tuvalu (Tuvalu)' },
    { value: 'Vanuatu', label: 'Vanuatu (Vanuatu)' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectManagementService,
    private snackBar: MatSnackBar
  ) {
    super();
    
    // Initialize nationality search control
    this.nationalitySearchControl = this.fb.control('');
    
    this.objectForm = this.fb.group({
      name: ['', Validators.required],
      objectId: [''], // Not required for create
      groupType: ['', Validators.required],
      dataSource: ['Thêm mới'], // Default to 'Thêm mới' for manual entry
      cccdNumber: ['', [ObjectFormComponent.cccdFormatValidator]],  // 12 digits format validation only
      nationality: ['Việt Nam'], // Default to Việt Nam
      cccdIssueDate: [''],
      cccdIssuePlace: [''],
      dateOfBirth: [''],
      gender: [''], // Nam, Nữ, hoặc Khác
      origin: [''],
      residence: ['']
    });
    
    // Initialize filtered nationalities
    this.filteredNationalities = [...this.nationalities];
    
    // Setup search filter
    this.nationalitySearchControl.valueChanges.subscribe(searchTerm => {
      this.filterNationalities(searchTerm || '');
    });
  }

  /**
   * Custom validator for CCCD format
   * - Must be exactly 12 digits
   * - No letters or special characters allowed
   */
  static cccdFormatValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Don't validate empty values
    }
    
    const cccdPattern = /^\d{12}$/;
    const isValid = cccdPattern.test(control.value);
    
    return isValid ? null : { invalidCccdFormat: true };
  }

  /**
   * Async validator to check for duplicate CCCD
   */
  cccdDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null); // Don't validate empty values
      }
      
      // Skip validation if not 12 digits (let pattern validator handle it)
      if (!/^\d{12}$/.test(control.value)) {
        return of(null);
      }

      console.log('🔍 [CCCD Validator] Checking duplicate for:', control.value, 'excludeId:', this.objectId, 'isEditMode:', this.isEditMode);

      return of(control.value).pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        switchMap(cccdNumber => 
          this.objectService.checkCccdDuplicate(cccdNumber, this.isEditMode ? this.objectId : undefined)
        ),
        map(isDuplicate => {
          console.log('🔍 [CCCD Validator] Result - isDuplicate:', isDuplicate);
          return isDuplicate ? { duplicate: true } : null;
        }),
        catchError((err) => {
          console.error('🔍 [CCCD Validator] Error:', err);
          return of(null);
        })
      );
    };
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
        console.log('📋 [ObjectForm] API Response:', data);
        console.log('📋 [ObjectForm] data.id:', data.id, 'Type:', typeof data.id);
        console.log('📋 [ObjectForm] data.objectId:', data.objectId, 'Type:', typeof data.objectId);
        console.log('📋 [ObjectForm] All keys:', Object.keys(data));
        
        // Map API response to form fields
        this.objectForm.patchValue({
          name: data.fullName,
          objectId: data.objectId, // Sử dụng objectId từ API (113), KHÔNG phải id (11)
          groupType: data.trackingType,
          dataSource: data.dataSource,
          cccdNumber: data.citizenId,
          nationality: data.nationality,
          cccdIssueDate: data.citizenIdIssuedDate,
          cccdIssuePlace: data.citizenIdIssuedPlace,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender === 'Nam' ? 'Nam' : (data.gender === 'Nữ' ? 'Nữ' : data.gender),
          origin: data.hometown,
          residence: data.permanentResidence
        });
        
        console.log('📋 [ObjectForm] After patchValue - Form objectId value:', this.objectForm.value.objectId);
        console.log('📋 [ObjectForm] After patchValue - Form control objectId value:', this.objectForm.get('objectId')?.value);
        
        // Store existing image URLs - Parse imagePath string to array
        if (data.imagePath) {
          // imagePath is a comma-separated string of URLs
          this.existingImageUrls = data.imagePath.split(',').map((url: string) => url.trim()).filter((url: string) => url);
        } else {
          this.existingImageUrls = [];
        }
        
        console.log('📋 [ObjectForm] Existing image URLs:', this.existingImageUrls);
        this.uploadedImages = [...this.existingImageUrls];
        // Mark all as existing images
        this.imageTypes = this.existingImageUrls.map(() => 'existing');
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
      const invalidFiles: string[] = [];
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!validImageTypes.includes(file.type)) {
          invalidFiles.push(file.name);
          continue; // Skip this file
        }
        
        // Store File object for API upload
        this.uploadedFiles.push(file);
        
        // Create base64 preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.uploadedImages.push(e.target.result);
          this.imageTypes.push('new');
        };
        reader.readAsDataURL(file);
      }
      
      // Show error message if there are invalid files
      if (invalidFiles.length > 0) {
        this.snackBar.open(
          `File không hợp lệ: ${invalidFiles.join(', ')}. Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)`,
          'Đóng',
          { duration: 5000 }
        );
      }
    }
    
    // Reset input value to allow re-selecting the same file
    event.target.value = '';
  }

  removeImage(index: number) {
    const imageType = this.imageTypes[index];
    
    if (imageType === 'new') {
      // Remove from uploadedFiles (find the corresponding file index)
      const newImageIndex = this.imageTypes.slice(0, index).filter(t => t === 'new').length;
      this.uploadedFiles.splice(newImageIndex, 1);
    } else if (imageType === 'existing') {
      // Remove from existingImageUrls (find the corresponding URL index)
      const existingImageIndex = this.imageTypes.slice(0, index).filter(t => t === 'existing').length;
      this.existingImageUrls.splice(existingImageIndex, 1);
    }
    
    // Remove from display arrays
    this.uploadedImages.splice(index, 1);
    this.imageTypes.splice(index, 1);
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
      
      // Check for CCCD format error
      const cccdControl = this.objectForm.get('cccdNumber');
      if (cccdControl?.hasError('invalidCccdFormat')) {
        missingFields.push('Số CCCD phải là 12 chữ số');
      }
      
      this.snackBar.open(
        missingFields.length > 0 ? `Vui lòng kiểm tra: ${missingFields.join(', ')}` : 'Vui lòng kiểm tra lại thông tin',
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
      const formValue = this.objectForm.value;
      const personData: any = {
        fullName: formValue.name,
        trackingType: formValue.groupType,
        dataSource: formValue.dataSource || 'Thêm mới' // Use form value or default to 'Thêm mới'
      };
      
      // Add gender if selected
      if (formValue.gender) {
        personData.gender = formValue.gender;
      }
      
      // Add objectId if provided (ID đối tượng - user-defined identifier)
      if (formValue.objectId) {
        personData.objectId = formValue.objectId;
      }
      
      // Add optional fields only if they have values
      if (formValue.cccdNumber) {
        personData.citizenId = formValue.cccdNumber;
      }
      if (formValue.nationality) {
        personData.nationality = formValue.nationality;
      }
      if (formValue.cccdIssueDate) {
        personData.citizenIdIssuedDate = formValue.cccdIssueDate;
      }
      if (formValue.cccdIssuePlace) {
        personData.citizenIdIssuedPlace = formValue.cccdIssuePlace;
      }
      if (formValue.dateOfBirth) {
        personData.dateOfBirth = formValue.dateOfBirth;
      }
      if (formValue.origin) {
        personData.hometown = formValue.origin;
      }
      if (formValue.residence) {
        personData.permanentResidence = formValue.residence;
      }
      
      console.log('📝 [ObjectForm] CREATE - Person data:', personData);
      
      const apiData = {
        images: this.uploadedFiles,
        person: personData
      };
      
      var request = this.objectService.createObject(apiData);
    } else {
      // Edit mode - use formData format with existing URLs and new files
      const formValue = this.objectForm.value;
      const personData: any = {
        id: parseInt(this.objectId),
        fullName: formValue.name,
        trackingType: formValue.groupType,
        // Keep existing image URLs that weren't deleted - join back to comma-separated string
        imagePath: this.existingImageUrls.join(','),
        numberOfAppearances: 0
      };
      
      // Add gender if selected
      if (formValue.gender) {
        personData.gender = formValue.gender;
      }
      
      // Add objectId if provided (ID đối tượng - user-defined identifier)
      if (formValue.objectId !== null && formValue.objectId !== undefined && formValue.objectId !== '') {
        personData.objectId = formValue.objectId;
      }
      
      // Add optional fields only if they have values
      if (formValue.cccdNumber) {
        personData.citizenId = formValue.cccdNumber;
      }
      if (formValue.nationality) {
        personData.nationality = formValue.nationality;
      }
      if (formValue.cccdIssueDate) {
        personData.citizenIdIssuedDate = formValue.cccdIssueDate;
      }
      if (formValue.cccdIssuePlace) {
        personData.citizenIdIssuedPlace = formValue.cccdIssuePlace;
      }
      if (formValue.dateOfBirth) {
        personData.dateOfBirth = formValue.dateOfBirth;
      }
      if (formValue.origin) {
        personData.hometown = formValue.origin;
      }
      if (formValue.residence) {
        personData.permanentResidence = formValue.residence;
      }
      
      console.log('📝 [ObjectForm] UPDATE - Person data:', personData);
      console.log('📝 [ObjectForm] UPDATE - Has objectId?', 'objectId' in personData, 'Value:', personData.objectId);
      
      const editData = {
        person: personData,
        images: this.uploadedFiles // New images to upload
      };
      
      var request = this.objectService.updateObject(this.objectId, editData);
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

  filterNationalities(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredNationalities = [...this.nationalities];
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    this.filteredNationalities = this.nationalities.filter(nation => 
      nation.label.toLowerCase().includes(searchLower) || 
      nation.value.toLowerCase().includes(searchLower)
    );
  }

  selectNationality(value: string): void {
    this.objectForm.patchValue({ nationality: value });
    this.nationalityDropdownOpen = false;
    this.nationalitySearchControl.setValue('', { emitEvent: false });
    this.filteredNationalities = [...this.nationalities];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchable-select-wrapper')) {
      this.nationalityDropdownOpen = false;
      this.nationalitySearchControl.setValue('', { emitEvent: false });
      this.filteredNationalities = [...this.nationalities];
    }
  }
}
