# Image Search Feature - Event Info

## Tổng quan
Tính năng tìm kiếm sự kiện bằng hình ảnh cho phép người dùng upload ảnh và tìm kiếm các sự kiện tương tự trong hệ thống.

## Cấu trúc thành phần

### 1. ImageUploadService (`src/app/shared/services/image-upload.service.ts`)
**Chức năng:**
- Upload ảnh lên storage (hiện tại là fake API với setTimeout 2.5s)
- Validate file type (JPG, PNG, WEBP)
- Validate file size (tối đa 5MB)
- Tạo preview cho ảnh
- Generate unique filename với timestamp

**Phương thức chính:**
```typescript
uploadImage(file: File): Observable<ImageUploadResponse>
validateImageFile(file: File): { valid: boolean; error?: string }
getImagePreview(file: File): Observable<string>
```

### 2. ImageUploadComponent (`src/app/shared/components/image-upload/`)
**Chức năng:**
- Drag & drop interface để upload ảnh
- Preview ảnh trước khi upload
- Progress bar hiển thị tiến trình upload (0-100%)
- Validation và error handling
- Auto upload khi file được chọn

**Input/Output:**
```typescript
@Input() autoUpload = true;
@Output() imageUploaded = new EventEmitter<ImageUploadResponse>();
@Output() uploadCancelled = new EventEmitter<void>();
```

**UI Features:**
- Drag & drop zone với animation
- Image preview sau khi chọn file
- Loading spinner với progress bar
- Success state với checkmark animation
- Error message display
- "Chọn ảnh khác" button để reset

### 3. FilterSearchBarComponent Integration
**Thay đổi:**
- Thêm option "Hình ảnh" vào menu filter (shortcut key: H)
- Hiển thị button "Tải ảnh lên" khi chọn filter Hình ảnh
- Modal popup với ImageUploadComponent
- Tự động thêm tag khi upload thành công
- Emit event với imageUrl để trigger API search

**Flow:**
1. User chọn filter "Hình ảnh" (hoặc nhấn phím H)
2. Button "Tải ảnh lên" xuất hiện trong search bar
3. Click button → Modal popup mở
4. User drag/drop hoặc chọn file
5. Validation (type, size)
6. Upload với progress animation (2.5s)
7. Success → Add tag với tên file → Emit imageUrl
8. Modal đóng → API search được trigger

### 4. Event Info Integration
**Không cần thay đổi code!**

Event Info component đã sẵn sàng xử lý image search thông qua:
- `handleTagApi(query)` method nhận params từ filter
- `getCleanedQuery()` chuyển đổi queryFormModel thành object params
- `loadTableData()` gọi API với params (bao gồm imageUrl)
- Backend API sẽ nhận parameter `imageUrl` trong request

## Flow tổng thể

```
User selects "Hình ảnh" filter
         ↓
Click "Tải ảnh lên" button
         ↓
Modal opens → ImageUploadComponent displays
         ↓
User drags/selects image file
         ↓
Validation (type: jpg/png/webp, size: <5MB)
         ↓
Upload starts → Progress bar 0% → 100% (2.5s)
         ↓
ImageUploadService.uploadImage() returns:
{
  success: true,
  imageUrl: "https://storage.example.com/uploads/image_123456_abc123.jpg",
  fileName: "image_123456_abc123.jpg",
  fileSize: 2048576,
  uploadedAt: "2024-01-15T10:30:00.000Z"
}
         ↓
FilterSearchBarComponent.onImageUploaded():
  - Add tag: { key: 'Hình ảnh', value: fileName, icon: 'image' }
  - Emit apiTriggered: { key: 'imageUrl', value: imageUrl }
  - Close modal
  - Show success snackbar
         ↓
EventInfoComponent.handleTagApi():
  - queryFormModel = [{ key: 'imageUrl', value: imageUrl }]
  - Reset pageNumber = 0
  - Call loadTableData()
         ↓
EventInfoComponent.loadTableData():
  - cleanedQuery = { imageUrl: imageUrl }
  - Call eventService.getListEvents(cleanedQuery)
         ↓
Backend API receives:
GET /api/admin/events/list?imageUrl=https://storage.example.com/uploads/...
         ↓
Backend processes image search (TODO: implement reverse image search)
         ↓
Return filtered results → Display in table
```

## Keyboard Shortcuts
- **H**: Chọn filter "Hình ảnh"
- **Esc**: Đóng modal upload

## Styling
- Modal: Centered với backdrop blur
- Upload area: Dashed border với hover effects
- Drag state: Blue highlight với scale animation
- Progress: Linear gradient fill
- Success: Green checkmark với bounce animation
- Button: Blue theme matching existing design

## Fake API Details
**Upload simulation:**
- Delay: 2.5 seconds (configurable in ImageUploadService)
- Storage URL: `https://storage.example.com/uploads/`
- Filename format: `image_{timestamp}_{random}.{extension}`

**Khi backend sẵn sàng:**
1. Update `ImageUploadService.uploadImage()` để gọi real API endpoint
2. Remove `delay(2500)` operator
3. Update `STORAGE_BASE_URL` với real storage URL
4. Backend cần implement endpoint:
   - POST `/api/upload/image` → return { imageUrl, fileName, ... }
5. Backend cần implement image search:
   - GET `/api/admin/events/list?imageUrl=...` → return matching events

## Testing Checklist
- [ ] Click "Hình ảnh" filter → Button appears
- [ ] Click button → Modal opens
- [ ] Drag & drop image → Preview shows
- [ ] Invalid file type → Error message
- [ ] File > 5MB → Error message  
- [ ] Valid upload → Progress bar 0-100%
- [ ] Upload success → Tag added, modal closes
- [ ] Tag shows filename correctly
- [ ] API call includes imageUrl parameter
- [ ] Remove tag → imageUrl removed from query
- [ ] Keyboard shortcut H works
- [ ] Esc closes modal
- [ ] Mobile responsive

## Future Enhancements
- Multiple image upload
- Image cropping before upload
- Direct camera capture
- Similar image suggestions
- Upload history
- Batch image search
