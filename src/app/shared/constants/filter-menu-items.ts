export interface FilterMenuItem {
  label: string;
  value: string;
  key: string;
  shortcutKey: string;
  icon: string;
}

// Event type hierarchy structure for 2-level selection
export interface EventTypeCategory {
  category: string;
  items: EventTypeItem[];
}

export interface EventTypeItem {
  label: string;
  value: string;
  subItems?: EventTypeSubItem[];
}

export interface EventTypeSubItem {
  label: string;
  value: string;
}

// Event type data structure based on specification
export const EVENT_TYPE_HIERARCHY: EventTypeCategory[] = [
  {
    category: 'Giao thông',
    items: [
      {
        label: 'Số lượng phương tiện qua lại (Biểu đồ cột)',
        value: 'traffic_vehicle_count',
        subItems: [
          { label: 'Xe máy', value: 'motorcycle' },
          { label: 'Ô tô', value: 'car' },
          { label: 'Xe tải', value: 'truck' }
        ]
      },
      {
        label: 'Phân loại phương tiện (Biểu đồ tròn)',
        value: 'traffic_vehicle_classification'
      },
      {
        label: 'Tỷ lệ phương tiện hợp lệ / không hợp lệ',
        value: 'traffic_vehicle_validity'
      }
    ]
  },
  {
    category: 'Nhân diện người',
    items: [
      {
        label: 'Lượt người ra vào (Biểu đồ đường)',
        value: 'people_in_out'
      },
      {
        label: 'Số lượng người không xác định',
        value: 'people_unidentified'
      },
      {
        label: 'Danh sách cảnh báo khuôn mặt lạ',
        value: 'people_unknown_face_alert'
      }
    ]
  },
  {
    category: 'An ninh trật tự',
    items: [
      {
        label: 'Sự kiện bất thường (Biểu đồ thời gian)',
        value: 'security_abnormal_event',
        subItems: [
          { label: 'Người xâm nhập khu vực cấm', value: 'intrusion' },
          { label: 'Đám đông bất thường', value: 'crowd_anomaly' },
          { label: 'Hành vi đáng ngờ (bỏ rơi vật thể)', value: 'abandoned_object' }
        ]
      }
    ]
  }
];

// Lưu ý: Mỗi component sử dụng API keys riêng từ backend
// Không được thay đổi 'value' vì nó là API search key từ BE

  // Predefined menu item combinations cho từng module
export const MENU_ITEM_SETS = {
  // Camera List page
  CAMERA_LIST: [
    { label: 'Tên camera', value: 'name', key: 'N', shortcutKey: 'n', icon: 'camera' },
    { label: 'Serial Number', value: 'sn', key: 'M', shortcutKey: 'm', icon: 'sn' },
    { label: 'ID', value: 'id', key: 'I', shortcutKey: 'i', icon: 'id' },
  ],  // Event Info page - API keys riêng của event info
  EVENT_INFO: [
    { label: 'Tên camera', value: 'cameraName', key: 'N', shortcutKey: 'n', icon: 'camera' },
    { label: 'Serial Number', value: 'cameraSn', key: 'M', shortcutKey: 'm', icon: 'sn' },
    { label: 'ID', value: 'id', key: 'I', shortcutKey: 'i', icon: 'id' },
    { label: 'Vị trí', value: 'location', key: 'L', shortcutKey: 'l', icon: 'location' },
    { label: 'Sự kiện', value: 'eventType', key: 'E', shortcutKey: 'e', icon: 'event' },
    { label: 'Trạng thái', value: 'status', key: 'S', shortcutKey: 's', icon: 'status' },
    { label: 'Hình ảnh', value: 'imageUrl', key: 'H', shortcutKey: 'h', icon: 'image' },
  ],
  
  // Dashboard page
  DASHBOARD: [
    { label: 'Tên camera', value: 'cameraSn', key: 'N', shortcutKey: 'n', icon: 'camera' },
    { label: 'Loại sự kiện', value: 'eventType', key: 'E', shortcutKey: 'e', icon: 'event' },
    { label: 'Năm', value: 'year', key: 'Y', shortcutKey: 'y', icon: 'calendar' },
    { label: 'Tháng', value: 'month', key: 'M', shortcutKey: 'm', icon: 'month' },
  ],
};

// Helper function để tạo custom menu items
export function createMenuItems(items: FilterMenuItem[]): FilterMenuItem[] {
  return items.map(item => ({ ...item }));
}