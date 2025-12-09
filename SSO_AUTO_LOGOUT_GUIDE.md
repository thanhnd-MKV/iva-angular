# SSO Login Failed Auto Logout - Implementation Guide

## 🔐 Tổng quan
Hệ thống đã được cập nhật để tự động xử lý lỗi "SSO Login failed" (code: "9998") và thực hiện logout + redirect về trang đăng nhập SSO.

## ⚡ Luồng xử lý tự động

### 1. Phát hiện lỗi SSO
- **Error Code**: "9998" hoặc 9998
- **Error Message**: Chứa "SSO Login failed"
- **Trigger**: Bất kỳ API call nào trả về lỗi này

### 2. Xử lý tự động
```typescript
// Khi interceptor bắt được lỗi SSO:
1. Không hiển thị error UI thông thường
2. Hiển thị snackbar warning: "Phiên đăng nhập đã hết hạn..."
3. Clear toàn bộ session data
4. Gọi authService.logout() 
5. Redirect về SSO login page
```

### 3. Fallback handling
- Nếu SSO logout fail → redirect về /login
- Nếu navigation fail → reload page

## 🎯 Code Implementation

### ErrorHandlerService Updates
```typescript
// Phát hiện SSO login failed
private isSSOLoginFailed(error: HttpErrorResponse): boolean {
  if (error.error) {
    const errorBody = error.error;
    return errorBody.code === "9998" || 
           errorBody.code === 9998 ||
           (errorBody.message && errorBody.message.includes("SSO Login failed"));
  }
  return false;
}

// Xử lý auto logout
private handleSSOLoginFailed(appError: AppError): void {
  // 1. Mark error as handled (không hiển thị UI error)
  appError.handled = true;
  appError.showSnackbar = false;
  
  // 2. Hiển thị warning snackbar
  this.snackBar.open(
    'Phiên đăng nhập đã hết hạn. Đang chuyển hướng đến trang đăng nhập...', 
    'Đóng', 
    { 
      duration: 3000,
      panelClass: ['warning-snackbar']
    }
  );
  
  // 3. Auto logout sau 1.5s
  setTimeout(() => {
    sessionStorage.clear();
    this.authService.logout(); // Redirect về SSO
  }, 1500);
}
```

## 🔍 Test Cases

### Case 1: API trả về SSO login failed
```json
// Response từ server:
{
  "code": "9998",
  "message": "SSO Login failed.",
  "success": false
}
```

**Expected behavior:**
- ✅ Không hiển thị error state trong table
- ✅ Hiển thị warning snackbar màu cam
- ✅ Tự động logout sau 1.5s
- ✅ Redirect về SSO login page

### Case 2: API trả về lỗi khác
```json
// Response từ server:
{
  "code": "5000",
  "message": "Internal server error",
  "success": false
}
```

**Expected behavior:**
- ✅ Hiển thị error state bình thường
- ✅ User có thể retry
- ✅ Không logout

## 🎨 UI Changes

### Warning Snackbar Style
```css
.warning-snackbar {
    background-color: #ff9800 !important;
    color: white !important;
}
```

### Error State (vẫn giữ nguyên cho lỗi khác)
- Hiển thị error icon với animation
- Error message cụ thể
- Red "Thử lại" button

## 🔧 Configuration

### Các loại error được xử lý:
- **Code "9998"**: SSO Login failed → Auto logout
- **Code 9998**: SSO Login failed (number) → Auto logout  
- **Message contains "SSO Login failed"**: → Auto logout
- **Status 401**: Unauthorized → Local error handling
- **Status 5xx**: Server error → Normal error handling
- **Status 0**: Network error → Normal error handling

## 📋 Usage trong Components

### Component không cần thay đổi gì
```typescript
// Code hiện tại vẫn hoạt động bình thường
this.service.getData().subscribe({
  next: (data) => {
    // Handle success  
  },
  error: (error) => {
    // Error sẽ được interceptor xử lý tự động
    // SSO login failed → auto logout
    // Lỗi khác → hiển thị error UI
  }
});
```

### Không cần thêm logic trong component
- Interceptor tự động xử lý SSO logout
- Base components tự động hiển thị error UI cho lỗi khác
- User experience mượt mà không bị interrupt

## 🚀 Benefits

1. **Tự động hóa hoàn toàn**: User không cần thao tác gì
2. **User experience tốt**: Warning message rõ ràng 
3. **Security**: Tự động clear session khi SSO expired
4. **Consistent**: Áp dụng cho tất cả API calls
5. **Fallback**: Có backup plan nếu logout fail
6. **Zero configuration**: Components không cần code thêm

## 🧪 Testing

### Manual Test:
1. Login vào app
2. Expire SSO session (hoặc mock API response với code "9998")
3. Thực hiện bất kỳ API call nào
4. Verify: Warning snackbar hiện → Auto logout → Redirect về SSO

### Mock test trong dev:
```typescript
// Trong service, mock response:
return throwError({
  error: {
    code: "9998", 
    message: "SSO Login failed.",
    success: false
  },
  status: 200
});
```

## ⚠️ Important Notes

- **Session handling**: Clear cả sessionStorage và localStorage
- **Timing**: 1.5s delay để user đọc warning message
- **Fallback**: Nếu SSO logout fail sẽ fallback về local login
- **Logging**: Tất cả SSO logout events được log để debug
- **Error tracking**: SSO errors vẫn được track trong error list