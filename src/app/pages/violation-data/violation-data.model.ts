export interface ViolationEvent {
  id: number;
  eventId: string;
  name: string;
  cameraSn: string;
  licensePlate: string;
  eventType: string;
  speed: string;
  timestamp: string;
  imageUrl: string;
  images: string[]; // Mảng chứa các URL hình ảnh cho gallery
  location: string;
  cameraName: string;
  status: 'pending' | 'processed';
}