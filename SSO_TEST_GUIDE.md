# 🧪 SSO Auto Logout Testing Guide

## Test Steps

### 1. Manual Test Button
- Vào trang Event Info
- Click nút "🧪 Test SSO Logout" 
- **Expected**: 
  - Warning snackbar màu cam xuất hiện
  - Sau 1.5s tự động logout và redirect

### 2. Real API Test  
- Trigger API call có response:
```json
{
  "code": "9998", 
  "message": "SSO Login failed.",
  "success": false
}
```

### 3. Console Logs để debug:
```
🔍 HTTP Request intercepted: GET /api/admin/events/list
📋 Response body check: {code: "9998", message: "SSO Login failed.", success: false}
🔐 SSO Login failed detected in response! Triggering logout...
🔐 SSO Logout triggered from interceptor: {code: "9998", message: "SSO Login failed.", success: false}
🔐 Performing SSO logout...
🔐 Session cleared, calling authService.logout()...
🔐 AuthService.logout() called
🔐 Current token: mock-token-123
🔐 Clearing session storage...
🔐 Redirecting to: /sso/logout?sso-session-id=mock-token-123
```

## Troubleshooting

### Nếu không thấy logout:
1. Check console logs có xuất hiện không
2. Check interceptor có được trigger không  
3. Check ErrorHandlerService có được inject không
4. Check AuthService có được inject không

### Debug Commands:
```javascript
// In browser console:
console.log('ErrorHandler:', window.ng?.getComponent?.(document.querySelector('app-event-info'))?.errorHandler);
console.log('Session:', sessionStorage.getItem('TOKEN'));
```

## Production Cleanup
- Remove test button from template
- Remove testSSOLogout() method
- Remove debug console.logs