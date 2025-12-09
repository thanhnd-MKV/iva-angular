import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HostListener } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgSelectModule } from '@ng-select/ng-select';
import { IconComponent } from '../icon/icon.component';
import { DateRangePickerComponent } from '../date-picker-ranger/date-range-picker.component';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { ImageUploadComponent } from '../components/image-upload/image-upload.component';
import { UploadedImage } from '../services/image-upload.service';
import { EVENT_TYPE_HIERARCHY, EventTypeCategory, EventTypeItem, EventTypeSubItem } from '../constants/filter-menu-items';

@Component({
    selector: 'app-filter-search-bar',
    templateUrl: './filter-search-bar.component.html',
    styleUrls: ['./filter-search-bar.component.scss', './status-colors.scss'],
    standalone: true,
    providers: [DatePipe],
    imports: [
        CommonModule,
        FormsModule,
        MatSelectModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        NgSelectModule,
        IconComponent,
        DateRangePickerComponent,
        ClickOutsideDirective,
        ImageUploadComponent
    ],
})
export class FilterSearchBarComponent implements OnDestroy {
    visible = false;
    open = false;
    isOpen = false;
    isStatusSubmenuOpen = false;
    isStatusSelectOpen = false;
    isEventSelectOpen = false;
    isImageUploadOpen = false;

    inputValue: string = '';
    selectedOption: { label: string; value: string; icon: string } | null = null;
    selectedLabel: string = '';
    selectedStatus: 'processed' | 'pending' | null = null;
    selectedStatusValue: string = '';
    selectedEventType: string = '';
    selectedEventLabel: string = '';
    uploadedImages: UploadedImage[] = [];
    
    // Event type hierarchy data
    eventTypeHierarchy: EventTypeCategory[] = EVENT_TYPE_HIERARCHY;

    @Input() items: { label: string; value: string; key?: string; icon?: string }[] = [];
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
    @ViewChild(DateRangePickerComponent) dateRangePicker!: DateRangePickerComponent;

    selectedTags: { key: string; value: string, icon: string }[] = [];
    queryFormModel: any = [];

    // Speech recognition properties
    private recognition: any;
    isListening: boolean = false;
    speechSupported: boolean = false;
    
    // Voice activation properties
    isVKeyPressed: boolean = false;
    pushToTalkActive: boolean = false;
    private silenceTimeout: any;
    private readonly SILENCE_DURATION = 2500; // 2.5 seconds cho comfortable listening

    // API debouncing
    private apiCallTimeout: any;
    private readonly API_DEBOUNCE_DELAY = 300; // 300ms debounce
    
    // Prevent recursive clearing
    private isClearing: boolean = false;

    @Output() optionSelected = new EventEmitter<string>();
    @Output() apiTriggered = new EventEmitter<{ key: string; value: string }>();

    constructor(
        private datePipe: DatePipe,
        private snackBar: MatSnackBar
    ) {
        this.initSpeechRecognition();
    }

    toggleDropdown() {
        this.open = !this.open;
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
    }

    selectItem(item: any) {
        this.selectedLabel = item.label;
        this.open = false;
    }

    selectMode(option: { label: string; value: string; icon: string }) {
        this.selectedOption = option;
        this.selectedLabel = option.label;
        this.optionSelected.emit(option.value);
        this.isOpen = false;
    }

    selectByKey(key: string) {
        const item = this.items.find(item => item.key === key);
        if (item) {
            this.selectMode({
                label: item.label,
                value: item.value,
                icon: item.icon || 'default_icon'
            });
            this.focusInput();
        } else {
            // Thông báo nếu không tìm thấy key
            this.snackBar.open(
                `Không tìm thấy tùy chọn với phím ${key}. Sử dụng Shift+V để nói.`, 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
        }
    }

    focusInput() {
        setTimeout(() => {
            if (this.searchInput?.nativeElement) {
                this.searchInput.nativeElement.focus();
            }
        }, 100);
    }

    // Status selection methods
    onStatusSelected() {
        if (!this.selectedStatusValue) return;
        
        const status = this.selectedStatusValue as 'processed' | 'pending';
        this.selectedStatus = status;
        
        // Add status tag
        const statusText = status === 'processed' ? 'Đã xử lý' : 'Chưa xử lý';
        const statusValue = status === 'processed' ? 'true' : 'false';
        const existingIndex = this.selectedTags.findIndex(tag => tag.key === 'Trạng thái');
        
        if (existingIndex >= 0) {
            this.selectedTags[existingIndex] = {
                key: 'Trạng thái',
                value: statusText,
                icon: 'status'
            };
        } else {
            this.selectedTags.push({
                key: 'Trạng thái',
                value: statusText,
                icon: 'status'
            });
        }
        
        // Emit the search query with API value
        this.apiTriggered.emit({ key: 'processed', value: statusValue });
        
        // Reset select value after adding tag
        this.selectedStatusValue = '';
    }

    // Status Select Methods
    toggleStatusSelect() {
        this.isStatusSelectOpen = !this.isStatusSelectOpen;
    }

    selectStatusOption(status: 'processed' | 'pending') {
        this.selectedStatus = status;
        this.isStatusSelectOpen = false;
        
        // Add status tag
        const statusText = status === 'processed' ? 'Đã xử lý' : 'Chưa xử lý';
        const statusValue = status === 'processed' ? 'true' : 'false';
        const existingIndex = this.selectedTags.findIndex(tag => tag.key === 'Trạng thái');
        
        if (existingIndex >= 0) {
            this.selectedTags[existingIndex] = {
                key: 'Trạng thái',
                value: statusText,
                icon: 'status'
            };
        } else {
            this.selectedTags.push({
                key: 'Trạng thái',
                value: statusText,
                icon: 'status'
            });
        }
        
        // Emit the search query with API value
        this.apiTriggered.emit({ key: 'processed', value: statusValue });
    }

    getStatusSelectText(): string {
        if (this.selectedStatus === 'processed') return 'Đã xử lý';
        if (this.selectedStatus === 'pending') return 'Chưa xử lý';
        return 'Chọn trạng thái';
    }

    getStatusTriggerClass(): string {
        if (this.selectedStatus === 'processed') return 'selected-processed';
        if (this.selectedStatus === 'pending') return 'selected-pending';
        return '';
    }

    getStatusTagClass(tag: any): string {
        if (tag.key === 'Trạng thái') {
            if (tag.value === 'Đã xử lý') return 'status-processed';
            if (tag.value === 'Chưa xử lý') return 'status-pending';
        }
        return '';
    }

    // ============= EVENT TYPE SELECT METHODS (2-LEVEL HIERARCHY) =============
    
    toggleEventSelect() {
        this.isEventSelectOpen = !this.isEventSelectOpen;
    }

    selectEventItem(item: EventTypeItem, category: string) {
        // If item has sub-items, don't select it directly
        if (item.subItems && item.subItems.length > 0) {
            return; // Sub-items will handle selection
        }
        
        this.selectedEventType = item.value;
        this.selectedEventLabel = item.label;
        this.isEventSelectOpen = false;
        
        // Add event type tag
        const existingIndex = this.selectedTags.findIndex(tag => tag.key === 'Sự kiện');
        
        if (existingIndex >= 0) {
            this.selectedTags[existingIndex] = {
                key: 'Sự kiện',
                value: `${category}: ${item.label}`,
                icon: 'event'
            };
        } else {
            this.selectedTags.push({
                key: 'Sự kiện',
                value: `${category}: ${item.label}`,
                icon: 'event'
            });
        }
        
        // Emit the search query with API value
        this.apiTriggered.emit({ key: 'eventType', value: item.value });
    }

    selectEventSubItem(subItem: EventTypeSubItem, parentItem: EventTypeItem, category: string) {
        this.selectedEventType = subItem.value;
        this.selectedEventLabel = `${parentItem.label} - ${subItem.label}`;
        this.isEventSelectOpen = false;
        
        // Add event type tag with hierarchical label
        const existingIndex = this.selectedTags.findIndex(tag => tag.key === 'Sự kiện');
        
        if (existingIndex >= 0) {
            this.selectedTags[existingIndex] = {
                key: 'Sự kiện',
                value: `${category}: ${subItem.label}`,
                icon: 'event'
            };
        } else {
            this.selectedTags.push({
                key: 'Sự kiện',
                value: `${category}: ${subItem.label}`,
                icon: 'event'
            });
        }
        
        // Emit the search query with API value (using sub-item value)
        this.apiTriggered.emit({ key: 'eventType', value: subItem.value });
    }

    getEventSelectText(): string {
        if (this.selectedEventLabel) {
            return this.selectedEventLabel;
        }
        return 'Chọn loại sự kiện';
    }

    // ============= END EVENT TYPE SELECT METHODS =============

    // Image Upload Methods
    toggleImageUpload() {
        this.isImageUploadOpen = !this.isImageUploadOpen;
    }

    onImagesUploaded(images: UploadedImage[]) {
        console.log('Images uploaded:', images);
        
        // Store uploaded images
        this.uploadedImages = images;
        
        // Add/update image tag to selectedTags
        const existingIndex = this.selectedTags.findIndex(tag => tag.key === 'Hình ảnh');
        
        const tagValue = images.length === 1 
            ? images[0].fileName 
            : `${images.length} ảnh`;
        
        if (existingIndex >= 0) {
            this.selectedTags[existingIndex] = {
                key: 'Hình ảnh',
                value: tagValue,
                icon: 'image'
            };
        } else {
            this.selectedTags.push({
                key: 'Hình ảnh',
                value: tagValue,
                icon: 'image'
            });
        }
        
        // Emit the search query with imageList array
        this.apiTriggered.emit({ 
            key: 'imageList', 
            value: JSON.stringify(images) // Send as JSON string to pass through the system
        });
        
        // Close image upload modal
        this.isImageUploadOpen = false;
        
        // Show success message
        this.snackBar.open(
            `Upload ${images.length} ảnh thành công! Đang tìm kiếm...`, 
            'X', 
            { 
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
            }
        );
    }

    onImageUploadCancelled() {
        this.isImageUploadOpen = false;
    }

    // Open image management when clicking on image tag
    onImageTagClick() {
        // Open modal with existing images
        this.isImageUploadOpen = true;
    }

    // Check if tag is image tag
    isImageTag(tag: any): boolean {
        return tag.key === 'Hình ảnh';
    }



    // Popup state
    showShortcutsPopup = false;

    toggleShortcutsPopup() {
        this.showShortcutsPopup = !this.showShortcutsPopup;
    }

    closeShortcutsPopup() {
        this.showShortcutsPopup = false;
    }

    blurSearchInput() {
        if (this.searchInput?.nativeElement) {
            this.searchInput.nativeElement.blur();
        }
        
        // Cũng blur các elements khác nếu đang focused
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && typeof activeElement.blur === 'function') {
            activeElement.blur();
        }
    }
    
    resetSilenceTimeout() {
        // Clear existing timeout
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        // Set timeout cho tất cả fields - sau 2.5s im lặng sẽ dừng và search
        this.silenceTimeout = setTimeout(() => {
            if (this.isListening) {
                console.log('🔇 Phát hiện im lặng sau 2.5 giây, tự động dừng và search...');
                
                // Lưu inputValue trước khi force stop
                const currentInput = this.inputValue;
                
                // Force stop recognition
                this.forceStopRecognition();
                
                // Đảm bảo auto search sau khi dừng
                setTimeout(() => {
                    if (currentInput && currentInput.trim()) {
                        console.log('🔍 Auto search với:', currentInput.trim());
                        this.autoSearch();
                    } else {
                        console.log('⚠️ Không có nội dung để search');
                    }
                }, 200); // Delay để đảm bảo forceStopRecognition hoàn tất
            }
        }, this.SILENCE_DURATION);
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    onEnterKey() {
        // Nếu đã có filter khác (date range, image, etc) và không có selectedOption, cho phép search
        if (this.queryFormModel.length > 0 && !this.selectedOption) {
            this.callApi();
            return;
        }

        // Kiểm tra nếu chưa chọn option
        if (!this.selectedOption) {
            this.snackBar.open(
                'Vui lòng chọn loại tìm kiếm trước khi nhập nội dung', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            return;
        }

        // Kiểm tra nếu chưa nhập nội dung tìm kiếm
        if (!this.inputValue || !this.inputValue.trim()) {
            this.snackBar.open(
                'Vui lòng nhập nội dung tìm kiếm', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            // Focus vào input để user nhập
            this.focusInput();
            return;
        }

        // Kiểm tra nếu nội dung quá ngắn (dưới 1 ký tự)
        const trimmedValue = this.inputValue.trim();
        if (trimmedValue.length < 1) {
            this.snackBar.open(
                'Nội dung tìm kiếm phải có ít nhất 1 ký tự', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            this.focusInput();
            return;
        }

        // Kiểm tra nếu tag đã tồn tại
        const exists = this.selectedTags.some(tag => 
            tag.key === this.selectedOption!.value && 
            tag.value === trimmedValue
        );
        
        if (exists) {
            this.snackBar.open(
                'Bộ lọc này đã tồn tại', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['info-snackbar']
                }
            );
            this.inputValue = '';
            this.focusInput();
            return;
        }

        // Thêm tag nếu pass hết validation
        const tag = {
            key: this.selectedOption.value,
            value: trimmedValue,
            icon: this.selectedOption.icon,
        };

        this.addTag(tag.key, tag.value, tag.icon);
        this.callApi();

        // Hiển thị thông báo thành công
        this.snackBar.open(
            `Đã thêm bộ lọc: ${this.selectedOption.label} - ${trimmedValue}`, 
            'X', 
            { 
                duration: 2000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
            }
        );

        // Reset form
        this.inputValue = '';
        this.selectedOption = null;
        this.selectedLabel = '';
        
        // Dừng speech recognition nếu đang hoạt động
        if (this.isListening) {
            this.recognition.stop();
        }
    }
    

    onDateRangeSelected(range: { startDate: Date, endDate: Date }) {
        this.selectedTags = this.selectedTags.filter(tag => tag.key !== 'dateRange');
        this.queryFormModel = this.queryFormModel.filter(
            (item: { key: string; }) => item.key !== 'startDate' && item.key !== 'endDate'
        );

        // const formattedStart = this.datePipe.transform(range.startDate, 'dd/MM/yy');
        // const formattedEnd = this.datePipe.transform(range.endDate, 'dd/MM/yy');
        // const displayValue = `${formattedStart} - ${formattedEnd}`;

        // this.selectedTags.push({ key: 'dateRange', value: displayValue, icon: 'icon-calendar' });

        this.queryFormModel.push({ key: 'startDate', value: range.startDate.toISOString() });
        this.queryFormModel.push({ key: 'endDate', value: range.endDate.toISOString() });

        console.log('Date Range Selected:', range);
        console.log('Query Form Model:', this.queryFormModel);

        this.callApi();
    }

    onDateRangeCleared() {
        // Chỉ trigger khi user manually clear date picker, không phải từ clearAllData()
        if (!this.isClearing) {
            console.log('📅 Date range cleared manually - removing only date filters');
            
            // Chỉ xóa date-related tags và queryFormModel
            this.selectedTags = this.selectedTags.filter(tag => tag.key !== 'dateRange');
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; }) => item.key !== 'startDate' && item.key !== 'endDate'
            );
            
            console.log('📅 After clearing date filters:', this.queryFormModel);
            
            // Gọi API với filters còn lại
            this.callApi();
        } else {
            console.log('📅 Date range cleared programmatically - skipping');
        }
    }

    addTag(key: string, value: string, icon: string) {
        const exists = this.selectedTags.some(tag => tag.key === key && tag.value === value);
        if (!exists) {
            this.selectedTags.push({ key, value, icon });
            if (key !== 'dateRange') { 
                this.queryFormModel.push({ key, value });
            }
        }
        this.isOpen = false;
    }

    removeTag(index: number) {
        const tagToRemove = this.selectedTags[index];
        
        this.selectedTags.splice(index, 1);

        if (tagToRemove.key === 'dateRange') {
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; }) => item.key !== 'startDate' && item.key !== 'endDate'
            );
            
            // Reset date picker visual when removing date range tag
            if (this.dateRangePicker) {
                this.dateRangePicker.clearData();
            }
        } else if (tagToRemove.key === 'Hình ảnh') {
            // Special handling for image tag - remove by key only
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; }) => item.key !== 'imageList'
            );
            // Clear uploaded images
            this.uploadedImages = [];
        } else if (tagToRemove.key === 'Sự kiện') {
            // Special handling for event type tag
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; }) => item.key !== 'eventType'
            );
            // Clear selected event type
            this.selectedEventType = '';
            this.selectedEventLabel = '';
        } else if (tagToRemove.key === 'Trạng thái') {
            // Special handling for status tag
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; }) => item.key !== 'processed'
            );
            // Clear selected status
            this.selectedStatus = null;
            this.selectedStatusValue = '';
        } else {
            this.queryFormModel = this.queryFormModel.filter(
                (item: { key: string; value: string; }) => !(item.key === tagToRemove.key && item.value === tagToRemove.value)
            );
        }

        console.log('🗑️ Removing tag:', tagToRemove, 'Query model:', this.queryFormModel);
        this.callApi();
    }

    // Public method để clear tất cả data từ bên ngoài
    clearAllData() {
        // Prevent recursive calls
        if (this.isClearing) {
            console.log('⚠️ Already clearing, skipping...');
            return;
        }
        
        this.isClearing = true;
        console.log('🗑️ Clearing all filter data - BEFORE:', this.queryFormModel);
        
        // Reset tất cả dữ liệu
        this.selectedTags = [];
        this.queryFormModel = [];
        this.inputValue = '';
        this.selectedOption = null;
        this.selectedLabel = '';
        this.uploadedImages = []; // Clear uploaded images
        this.selectedStatus = null; // Clear status
        this.selectedStatusValue = '';
        this.selectedEventType = ''; // Clear event type
        this.selectedEventLabel = '';
        
        // Reset date range picker (không trigger event vì chúng ta đang trong clearing process)
        if (this.dateRangePicker) {
            this.dateRangePicker.startDate = null;
            this.dateRangePicker.endDate = null;
            this.dateRangePicker.hoveredDate = null;
        }
        
        console.log('🗑️ Clearing all filter data - AFTER:', this.queryFormModel);
        
        // Trigger search after clearing all data
        this.callApi();
        
        // Reset clearing flag
        setTimeout(() => {
            this.isClearing = false;
        }, 100);
        
        // Stop speech recognition nếu đang active
        if (this.isListening && this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn('Lỗi dừng recognition:', error);
            }
        }
        
        // Reset speech states
        this.isListening = false;
        this.pushToTalkActive = false;
        this.isVKeyPressed = false;
        
        // Clear timeout
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        // Trigger API để refresh data
        this.callApi();
        
        // Thông báo
        this.snackBar.open(
            '🗑️ Đã xóa tất cả bộ lọc', 
            'X', 
            { 
                duration: 2000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
            }
        );
    }

    callApi() {
        // Clear existing timeout để tránh multiple calls
        if (this.apiCallTimeout) {
            clearTimeout(this.apiCallTimeout);
        }

        console.log('🔥 callApi() triggered with queryFormModel:', this.queryFormModel);
        
        // Debounce API call
        this.apiCallTimeout = setTimeout(() => {
            console.log('🚀 Actually calling API after debounce');
            this.apiTriggered.emit(this.queryFormModel);
        }, this.API_DEBOUNCE_DELAY);
    }

    // Khởi tạo Speech Recognition
    private initSpeechRecognition() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                this.speechSupported = true;
                this.recognition = new SpeechRecognition();
                
                // Cấu hình speech recognition
                this.recognition.continuous = true; // Cho phép lắng nghe liên tục
                this.recognition.interimResults = true; // Nhận interim results để reset timeout
                this.recognition.lang = 'vi-VN'; // Vietnamese language
                this.recognition.maxAlternatives = 3; // Tăng alternatives để nhận diện tốt hơn
                
                // Cấu hình thêm cho từ ngắn
                if ('grammars' in this.recognition) {
                    // Thêm grammar hints cho số
                    const grammar = '#JSGF V1.0; grammar numbers; public <number> = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;';
                    const speechRecognitionList = new (window as any).webkitSpeechGrammarList();
                    speechRecognitionList.addFromString(grammar, 1);
                    this.recognition.grammars = speechRecognitionList;
                }
                
                // Event listeners
                this.recognition.onstart = () => {
                    this.isListening = true;
                    
                    // Đảm bảo input đã blur khi bắt đầu lắng nghe
                    this.blurSearchInput();
                    
                    const message = this.pushToTalkActive 
                        ? '🎤 Đang lắng nghe... (Giữ Shift+V, sẽ tự động tìm kiếm)' 
                        : 'Đang lắng nghe... Hãy nói nội dung tìm kiếm (sẽ tự động tìm kiếm)';
                    
                    this.snackBar.open(
                        message, 
                        this.pushToTalkActive ? '' : 'Dừng', 
                        { 
                            duration: this.pushToTalkActive ? 0 : 0,
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: ['info-snackbar']
                        }
                    );
                };
                
                this.recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    
                    // Xử lý tất cả results
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        const transcript = result[0].transcript;
                        
                        if (result.isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                            // Reset timeout khi có interim results (âm thanh mới)
                            if (!this.pushToTalkActive) {
                                this.resetSilenceTimeout();
                            }
                        }
                    }
                    
                    // Cập nhật input với final transcript
                    if (finalTranscript.trim()) {
                        let processedValue = finalTranscript.trim();
                        
                        // Xử lý riêng cho field ID
                        if (this.isIdField()) {
                            processedValue = this.convertTextToNumber(finalTranscript.trim());
                            
                            if (!processedValue) {
                                // Không convert được thành số
                                this.snackBar.open(
                                    `⚠️ Field ID chỉ nhận số. "${finalTranscript.trim()}" không hợp lệ.`, 
                                    'X', 
                                    { 
                                        duration: 3000,
                                        horizontalPosition: 'center',
                                        verticalPosition: 'top',
                                        panelClass: ['warning-snackbar']
                                    }
                                );
                                return; // Không xử lý tiếp
                            }
                        }
                        
                        this.inputValue = processedValue;
                        
                        const successMessage = this.isIdField() 
                            ? `🎤 ID nhận diện: "${finalTranscript.trim()}" → ${processedValue}`
                            : `🎤 Đã nhận diện: "${processedValue}"`;
                        
                        this.snackBar.open(
                            successMessage, 
                            'X', 
                            { 
                                duration: 2000,
                                horizontalPosition: 'center',
                                verticalPosition: 'top',
                                panelClass: ['success-snackbar']
                            }
                        );
                        
                        // Chỉ auto search ngay cho push-to-talk mode
                        if (this.pushToTalkActive) {
                            // Dừng recognition ngay
                            this.forceStopRecognition();
                            // Auto search
                            setTimeout(() => {
                                this.autoSearch();
                            }, 300);
                        } else {
                            // Reset timeout cho voice activation mode (kể cả ID field)
                            this.resetSilenceTimeout();
                        }
                    } else if (interimTranscript.trim()) {
                        // Hiển thị interim transcript trong console để debug
                        console.log('🎤 Interim:', interimTranscript.trim());
                    }
                };
                
                this.recognition.onerror = (event: any) => {
                    // Clear timeout on error
                    if (this.silenceTimeout) {
                        clearTimeout(this.silenceTimeout);
                        this.silenceTimeout = null;
                    }
                    
                    this.isListening = false;
                    this.pushToTalkActive = false;
                    let errorMessage = 'Lỗi nhận diện giọng nói';
                    
                    switch(event.error) {
                        case 'no-speech':
                            errorMessage = 'Không nghe thấy giọng nói. Vui lòng thử lại.';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Quyền truy cập microphone bị từ chối. Vui lòng cấp quyền trong trình duyệt.';
                            break;
                        case 'network':
                            errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.';
                            break;
                    }
                    
                    this.snackBar.open(
                        errorMessage, 
                        'X', 
                        { 
                            duration: 5000,
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: ['warning-snackbar']
                        }
                    );
                };
                
                this.recognition.onend = () => {
                    // Clear timeout on end
                    if (this.silenceTimeout) {
                        clearTimeout(this.silenceTimeout);
                        this.silenceTimeout = null;
                    }
                    
                    const wasPushToTalk = this.pushToTalkActive;
                    const hasContent = this.inputValue && this.inputValue.trim();
                    
                    this.isListening = false;
                    this.pushToTalkActive = false;
                    this.snackBar.dismiss(); // Đóng snackbar đang lắng nghe
                    
                    // Auto search khi kết thúc recognition (trừ push-to-talk đã search rồi)
                    if (!wasPushToTalk && hasContent) {
                        console.log('🔍 Auto search khi kết thúc recognition:', this.inputValue.trim());
                        setTimeout(() => {
                            this.autoSearch();
                        }, 300);
                    }
                    
                    // Focus lại input sau khi hoàn thành
                    setTimeout(() => {
                        if (!this.selectedOption) {
                            // Nếu không còn option nào được chọn (sau auto search), focus vào dropdown
                            const dropdownButton = document.querySelector('.menu-button') as HTMLElement;
                            if (dropdownButton) {
                                dropdownButton.focus();
                            }
                        } else {
                            // Nếu vẫn còn option, focus vào input
                            this.focusInput();
                        }
                    }, hasContent ? 1500 : 1000); // Delay thêm nếu có auto search
                };
            } else {
                console.warn('Speech Recognition không được hỗ trợ trong trình duyệt này');
            }
        }
    }

    // Bắt đầu/dừng speech recognition
    toggleSpeechRecognition() {
        if (!this.speechSupported) {
            this.snackBar.open(
                'Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari.', 
                'X', 
                { 
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            return;
        }

        if (!this.selectedOption) {
            this.snackBar.open(
                'Vui lòng chọn loại tìm kiếm trước khi sử dụng microphone', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            return;
        }

        if (this.isListening) {
            // Dừng nhận diện
            this.forceStopRecognition();
        } else {
            // Bắt đầu nhận diện (async)
            this.startSpeechRecognition(false);
        }
    }
    
    // Helper method để bắt đầu speech recognition
    private async startSpeechRecognition(isPushToTalk: boolean = false) {
        try {
            // Đảm bảo recognition đã dừng hoàn toàn trước khi bắt đầu mới
            await this.ensureRecognitionStopped();
            
            // Reset states
            this.isListening = false;
            this.pushToTalkActive = false;
            
            // Blur input trước khi bắt đầu recognition
            this.blurSearchInput();
            
            // Setup silence timeout cho tất cả voice activation modes
            if (!isPushToTalk) {
                this.resetSilenceTimeout();
            }
            
            // Bắt đầu recognition
            this.recognition.start();
            
            console.log('🎤 Bắt đầu speech recognition thành công');
            
        } catch (error) {
            console.error('Lỗi khi bắt đầu speech recognition:', error);
            
            // Reset states on error
            this.isListening = false;
            this.pushToTalkActive = false;
            
            this.snackBar.open(
                'Không thể khởi động nhận diện giọng nói. Microphone có thể đang bị sử dụng.', 
                'X', 
                { 
                    duration: 4000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
        }
    }

    // Xử lý keyboard events cho voice activation
    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        // Kiểm tra event.key tồn tại
        if (!event || !event.key) {
            return;
        }
        
        // Kiểm tra phím Esc để đóng popup
        if (event.key === 'Escape') {
            if (this.showShortcutsPopup) {
                event.preventDefault();
                this.closeShortcutsPopup();
                return;
            }
        }

        // Kiểm tra phím 1 hoặc 2 cho status selection
        if (this.selectedOption?.label === 'Trạng thái' && (event.key === '1' || event.key === '2')) {
            event.preventDefault();
            if (event.key === '1') {
                this.selectStatusOption('processed');
            } else if (event.key === '2') {
                this.selectStatusOption('pending');
            }
            return;
        }

        // Kiểm tra Shift+V cho voice activation toggle
        if (event.key.toLowerCase() === 'v' && event.shiftKey && !this.isVKeyPressed) {
            event.preventDefault();
            this.isVKeyPressed = true;
            
            if (this.isListening) {
                console.log('🔇 Dừng voice activation...');
                this.forceStopRecognition();
            } else {
                console.log('🎤 Bắt đầu voice activation...');
                this.toggleSpeechRecognition();
            }
            return;
        }
        
        // Không cho phép input bình thường khi đang listening
        if (this.isListening) {
            // Chặn tất cả keyboard input trừ Shift và V
            if (event.key && event.key.toLowerCase() !== 'v' && event.key !== 'Shift') {
                event.preventDefault();
                event.stopPropagation();
                
                // Hiển thị thông báo nhắc nhở cho alphanumeric keys
                if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                    this.snackBar.open(
                        '🎤 Đang ở chế độ giọng nói. Thả Shift+V để nhập bình thường.', 
                        'X', 
                        { 
                            duration: 2000,
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: ['info-snackbar']
                        }
                    );
                }
            }
        }
    }
    
    @HostListener('document:keyup', ['$event'])
    onKeyUp(event: KeyboardEvent) {
        // Kiểm tra event.key tồn tại
        if (!event || !event.key) {
            return;
        }
        
        // Reset flag khi thả V key
        if (event.key.toLowerCase() === 'v' && this.isVKeyPressed) {
            this.isVKeyPressed = false;
        }
        
        // Cũng dừng khi thả Shift (trong trường hợp user thả Shift trước)
        if (event.key === 'Shift' && this.isVKeyPressed) {
            event.preventDefault();
            this.isVKeyPressed = false;
            this.stopPushToTalk();
        }
    }
    
    // Bắt đầu push-to-talk
    private startPushToTalk() {
        if (!this.speechSupported) {
            this.snackBar.open(
                'Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari.', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            return;
        }
        
        if (!this.selectedOption) {
            this.snackBar.open(
                'Vui lòng chọn loại tìm kiếm trước khi sử dụng giọng nói', 
                'X', 
                { 
                    duration: 2000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            return;
        }
        
        // Blur input để thoát focus khi bắt đầu push-to-talk
        this.blurSearchInput();
        
        // Nếu đang listening từ mic button, dừng lại
        if (this.isListening && !this.pushToTalkActive) {
            this.recognition.stop();
        }
        
        this.pushToTalkActive = true;
        this.startSpeechRecognition(true);
    }
    
    // Dừng voice activation
    private stopPushToTalk() {
        // Clear timeout
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
        
        if (this.pushToTalkActive && this.isListening) {
            this.pushToTalkActive = false;
            this.recognition.stop();
        }
    }
    
    // Force stop recognition (for manual stop)
    private forceStopRecognition() {
        // Clear timeout
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn('Lỗi khi dừng recognition:', error);
            }
        }
        
        this.isListening = false;
        this.pushToTalkActive = false;
        this.snackBar.dismiss();
        
        // Focus back to input
        setTimeout(() => {
            this.focusInput();
        }, 100);
    }
    
    // Kiểm tra và sửa state của recognition
    private ensureRecognitionStopped(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.recognition) {
                resolve();
                return;
            }
            
            if (this.isListening) {
                // Nếu đang listening, dừng trước
                const onEnd = () => {
                    this.recognition.removeEventListener('end', onEnd);
                    setTimeout(resolve, 100); // Cho thời gian cleanup
                };
                
                this.recognition.addEventListener('end', onEnd);
                
                try {
                    this.recognition.stop();
                } catch (error) {
                    console.warn('Lỗi khi dừng recognition trong ensureRecognitionStopped:', error);
                    setTimeout(resolve, 100);
                }
            } else {
                resolve();
            }
        });
    }
    
    // Kiểm tra xem có phải field ID không
    public isIdField(): boolean {
        return (this.selectedOption?.value?.toLowerCase().includes('id') || 
               this.selectedOption?.label?.toLowerCase().includes('id')) ?? false;
    }
    
    // Chuyển đổi text thành số cho field ID
    private convertTextToNumber(text: string): string {
        // Loại bỏ tất cả ký tự không phải số
        const numbersOnly = text.replace(/[^0-9]/g, '');
        
        // Map chữ số tiếng Việt thành số
        const vietnameseNumbers: { [key: string]: string } = {
            'không': '0', 'zero': '0',
            'một': '1', 'mot': '1',
            'hai': '2', 
            'ba': '3', 'bà': '3',
            'bốn': '4', 'bon': '4', 'tư': '4',
            'năm': '5', 'nam': '5',
            'sáu': '6', 'sau': '6',
            'bảy': '7', 'bay': '7',
            'tám': '8', 'tam': '8',
            'chín': '9', 'chin': '9',
            'mười': '10', 'muoi': '10'
        };
        
        // Nếu đã có số thì return
        if (numbersOnly) {
            return numbersOnly;
        }
        
        // Convert chữ thành số
        const lowerText = text.toLowerCase().trim();
        for (const [word, number] of Object.entries(vietnameseNumbers)) {
            if (lowerText.includes(word)) {
                return number;
            }
        }
        
        // Nếu không convert được thì return empty
        return '';
    }
    
    // Tự động thực hiện search sau speech recognition
    private autoSearch() {
        if (this.selectedOption && this.inputValue && this.inputValue.trim()) {
            const trimmedValue = this.inputValue.trim();
            
            // Kiểm tra validation tương tự như onEnterKey
            if (trimmedValue.length < 2) {
                this.snackBar.open(
                    '🎤 Nội dung quá ngắn, vui lòng nói rõ hơn', 
                    'X', 
                    { 
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: ['warning-snackbar']
                    }
                );
                this.focusInput();
                return;
            }
            
            // Kiểm tra nếu tag đã tồn tại
            const exists = this.selectedTags.some(tag => 
                tag.key === this.selectedOption!.value && 
                tag.value === trimmedValue
            );
            
            if (exists) {
                this.snackBar.open(
                    '🎤 Bộ lọc này đã tồn tại', 
                    'X', 
                    { 
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: ['info-snackbar']
                    }
                );
                this.inputValue = '';
                this.focusInput();
                return;
            }
            
            // Thực hiện search tự động
            const tag = {
                key: this.selectedOption.value,
                value: trimmedValue,
                icon: this.selectedOption.icon,
            };
            
            this.addTag(tag.key, tag.value, tag.icon);
            this.callApi();
            
            // Thông báo thành công với emoji đặc biệt
            this.snackBar.open(
                `🎤 Đã tìm kiếm: ${this.selectedOption.label} - ${trimmedValue}`, 
                'X', 
                { 
                    duration: 2000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['success-snackbar']
                }
            );
            
            // Reset form
            this.inputValue = '';
            this.selectedOption = null;
            this.selectedLabel = '';
            
        } else {
            // Nếu thiếu thông tin, hiển thị thông báo và focus input
            this.snackBar.open(
                '🎤 Vui lòng kiểm tra lại nội dung đã nói', 
                'X', 
                { 
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                }
            );
            this.focusInput();
        }
    }
    
    // 🎨 Helper methods for tag styling - Hệ thống phân tầng màu mới
    
    // 🆔 1. Định danh - ID, Serial Number
    isIdTag(tag: any): boolean {
        return tag.key.toLowerCase().includes('id') ||
               tag.key.toLowerCase().includes('serial') ||
               tag.key === 'deviceId' ||
               tag.key === 'serialNumber' ||
               tag.key === 'cameraSn';
    }
    
    // 🗺️ 2. Vị trí / Địa lý - Vị trí, Khu vực
    isLocationTag(tag: any): boolean {
        return tag.key.toLowerCase().includes('location') ||
               tag.key.toLowerCase().includes('vị trí') ||
               tag.key.toLowerCase().includes('area') ||
               tag.key.toLowerCase().includes('khu') ||
               tag.key.toLowerCase().includes('zone') ||
               tag.key === 'area' ||
               tag.key === 'location';
    }
    
    // 🎥 3. Thiết bị / Camera - Tên camera, Model
    isDeviceTag(tag: any): boolean {
        return tag.key.toLowerCase().includes('name') || 
               tag.key.toLowerCase().includes('tên') ||
               tag.key.toLowerCase().includes('camera') ||
               tag.key.toLowerCase().includes('device') ||
               tag.key === 'deviceName' ||
               tag.key === 'cameraName';
    }
    
    // ✅ 4. Trạng thái - Đã xử lý, Chưa xử lý
    isStatusTag(tag: any): boolean {
        return tag.key.toLowerCase().includes('status') ||
               tag.key.toLowerCase().includes('trạng thái') ||
               tag.key.toLowerCase().includes('processed') ||
               tag.key.toLowerCase().includes('pending');
    }
    
    // 🎯 4.5. Sự kiện - Event type filter
    isEventTag(tag: any): boolean {
        return tag.key === 'Sự kiện' ||
               tag.key === 'eventType' ||
               tag.key === 'eventCategory' ||
               tag.key.toLowerCase().includes('event') ||
               tag.key.toLowerCase().includes('sự kiện');
    }
    
    // 📅 5. Ngày tháng - Date range
    isDateTag(tag: any): boolean {
        return tag.key.toLowerCase().includes('date') ||
               tag.key.toLowerCase().includes('time') ||
               tag.key.toLowerCase().includes('ngày') ||
               tag.key === 'startTime' ||
               tag.key === 'createTime' ||
               tag.key === 'dateRange';
    }
    
    // Legacy methods for backward compatibility
    isNameTag(tag: any): boolean {
        return this.isDeviceTag(tag);
    }
    
    getTagLabel(key: string): string {
        const item = this.items.find(item => item.value === key);
        return item ? item.label : key;
    }

    ngOnInit() { }
    
    ngOnDestroy() {
        // Cleanup khi component bị hủy
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        if (this.apiCallTimeout) {
            clearTimeout(this.apiCallTimeout);
        }
        
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn('Lỗi cleanup recognition:', error);
            }
        }
    }
}
